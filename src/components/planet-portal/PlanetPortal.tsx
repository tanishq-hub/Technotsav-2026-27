"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ASSETS, PLANETS, PLANET_STATES, R2_MEDIA_ORIGIN, SUN_ABOUT_PANELS, type PlanetKey } from "@/lib/planets";
import { EVENT_TIME_ZONE, TECHNOTSAV_EVENT_START } from "@/lib/event-time";
import "./planet-portal.css";

type XY = { x: number; y: number };
type AboutTransition = { from: number; to: number; direction: "forward" | "backward" };
type CountdownParts = { days: number; hours: number; minutes: number; seconds: number };
type VideoPreloadQueue = {
  items: string[];
  completed: Set<string>;
  index: number;
  activeController: AbortController | null;
  paused: boolean;
  running: boolean;
};
const ease = (t: number) => t < .5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2;
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function panelCountFor(planet: PlanetKey) {
  return planet === "sun" ? SUN_ABOUT_PANELS.length + 1 : 1;
}

function countdownUntilEvent(now: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor((TECHNOTSAV_EVENT_START - now) / 1000));
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

function aboutMotionClass(panelIndex: number, activePanel: number, transition: AboutTransition | null) {
  if (transition?.from === panelIndex) return transition.direction === "forward" ? "is-leaving-up" : "is-leaving-down";
  if (transition?.to === panelIndex) return transition.direction === "forward" ? "is-entering-from-bottom" : "is-entering-from-top";
  return panelIndex === activePanel ? "is-settled" : "is-hidden";
}

function ready(media: HTMLMediaElement, timeout = 4500, requiredState: number = HTMLMediaElement.HAVE_CURRENT_DATA, signal?: AbortSignal) {
  return new Promise<boolean>((resolve) => {
    if (signal?.aborted) return resolve(false);
    if (media.error) return resolve(false);
    if (media.readyState >= requiredState) return resolve(true);

    let done = false;
    const cleanup = () => {
      window.clearTimeout(timer);
      media.removeEventListener("loadeddata", check);
      media.removeEventListener("canplay", check);
      media.removeEventListener("error", failed);
      signal?.removeEventListener("abort", aborted);
    };
    const finish = (isReady: boolean) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(isReady);
    };
    const check = () => {
      if (media.readyState >= requiredState) finish(true);
    };
    const failed = () => finish(false);
    const aborted = () => finish(false);
    const timer = window.setTimeout(() => finish(false), timeout);

    media.addEventListener("loadeddata", check);
    media.addEventListener("canplay", check);
    media.addEventListener("error", failed);
    signal?.addEventListener("abort", aborted, { once: true });
    check();
  });
}

function playbackEnded(media: HTMLMediaElement, timeout: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timer);
      media.removeEventListener("ended", finish);
      media.removeEventListener("error", finish);
      signal?.removeEventListener("abort", finish);
      resolve();
    };
    const timer = window.setTimeout(() => {
      media.pause();
      finish();
    }, timeout);
    media.addEventListener("ended", finish, { once: true });
    media.addEventListener("error", finish, { once: true });
    signal?.addEventListener("abort", finish, { once: true });
  });
}

async function downloadVideoIntoBrowserCache(
  url: string,
  signal: AbortSignal,
  onProgress?: (progress: number) => void,
) {
  const response = await fetch(url, { cache: "default", credentials: "omit", mode: "cors", signal });
  if (!response.ok || !response.body) throw new Error(`Video preload failed (${response.status})`);

  const total = Number(response.headers.get("content-length"));
  const reader = response.body.getReader();
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (total > 0) onProgress?.(Math.min(1, received / total));
  }
  onProgress?.(1);
}

function mediaBufferedToEnd(video: HTMLVideoElement) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return false;
  for (let index = 0; index < video.buffered.length; index += 1) {
    if (video.buffered.start(index) < 0.1 && video.buffered.end(index) >= video.duration - 0.1) return true;
  }
  return false;
}

function waitForFullMediaBuffer(video: HTMLVideoElement, timeout: number, signal: AbortSignal, onProgress?: (progress: number) => void) {
  return new Promise<boolean>((resolve) => {
    if (mediaBufferedToEnd(video)) { onProgress?.(1); return resolve(true); }
    let done = false;
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener("progress", check);
      video.removeEventListener("loadedmetadata", check);
      video.removeEventListener("canplaythrough", check);
      video.removeEventListener("error", failed);
      signal.removeEventListener("abort", aborted);
    };
    const finish = (result: boolean) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(result);
    };
    const check = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        let bufferedEnd = 0;
        for (let index = 0; index < video.buffered.length; index += 1) bufferedEnd = Math.max(bufferedEnd, video.buffered.end(index));
        onProgress?.(Math.min(1, bufferedEnd / video.duration));
      }
      if (mediaBufferedToEnd(video)) finish(true);
    };
    const failed = () => finish(false);
    const aborted = () => finish(false);
    const timer = window.setTimeout(() => finish(false), timeout);
    video.addEventListener("progress", check);
    video.addEventListener("loadedmetadata", check);
    video.addEventListener("canplaythrough", check);
    video.addEventListener("error", failed);
    signal.addEventListener("abort", aborted, { once: true });
    check();
  });
}

function preloadCrossOriginVideo(url: string, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve();
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    let done = false;
    const cleanup = () => {
      video.removeEventListener("progress", check);
      video.removeEventListener("loadedmetadata", check);
      video.removeEventListener("canplaythrough", check);
      video.removeEventListener("error", finish);
      signal.removeEventListener("abort", finish);
      video.removeAttribute("src");
      video.load();
    };
    const finish = () => {
      if (done) return;
      done = true;
      cleanup();
      resolve();
    };
    const check = () => { if (mediaBufferedToEnd(video)) finish(); };
    video.addEventListener("progress", check);
    video.addEventListener("loadedmetadata", check);
    video.addEventListener("canplaythrough", check);
    video.addEventListener("error", finish);
    signal.addEventListener("abort", finish, { once: true });
    video.src = url;
    video.load();
    check();
  });
}

async function runVideoPreloadQueue(queue: VideoPreloadQueue) {
  if (queue.running || queue.paused) return;
  queue.running = true;
  try {
    while (queue.index < queue.items.length && !queue.paused) {
      const url = queue.items[queue.index];
      if (queue.completed.has(url)) {
        queue.index += 1;
        continue;
      }

      const controller = new AbortController();
      queue.activeController = controller;
      try {
        await downloadVideoIntoBrowserCache(url, controller.signal);
      } catch {
        if (!controller.signal.aborted) {
          // Some public cross-origin media does not allow fetch CORS. Let the
          // browser's video loader warm its normal media cache instead.
          await preloadCrossOriginVideo(url, controller.signal);
        }
      }

      if (controller.signal.aborted || queue.paused) break;
      queue.completed.add(url);
      queue.index += 1;
      queue.activeController = null;
    }
  } finally {
    queue.activeController = null;
    queue.running = false;
    if (!queue.paused && queue.index < queue.items.length) {
      queueMicrotask(() => { void runVideoPreloadQueue(queue); });
    }
  }
}

export function PlanetPortal() {
  const root = useRef<HTMLElement>(null);
  const transitionOrigin = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const requestCanvasFrame = useRef<() => void>(() => {});
  const frozenCanvas = useRef<HTMLCanvasElement>(null);
  const backgroundVideo = useRef<HTMLVideoElement>(null);
  const transitionVideo = useRef<HTMLVideoElement>(null);
  const preloaderVideo = useRef<HTMLVideoElement>(null);
  const [planet, setPlanet] = useState<PlanetKey>("sun");
  const [backgroundPlanet, setBackgroundPlanet] = useState<PlanetKey>("sun");
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetKey>("sun");
  const [counter, setCounter] = useState(0);
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutPanel, setAboutPanel] = useState(0);
  const [aboutTransition, setAboutTransition] = useState<AboutTransition | null>(null);
  const state = useRef<PlanetKey>("sun");
  const tilt = useRef<XY>({ x: 0, y: 0 });
  const targetTilt = useRef<XY>({ x: 0, y: 0 });
  const expansion = useRef(0);
  const aboutPanelIndex = useRef(0);
  const aboutPanelLocked = useRef(false);
  const aboutPanelTimer = useRef<number | null>(null);
  const activeTransition = useRef(false);
  const panelSequenceReady = useRef(false);
  const travelRef = useRef<(destination: PlanetKey, panelIndex?: number) => void>(() => {});
  const transitionController = useRef<AbortController | null>(null);
  const backgroundPreloadQueue = useRef<VideoPreloadQueue | null>(null);
  const resumeBackgroundPreload = useRef<() => void>(() => {});
  const frozen = useRef(false);
  const busy = useRef(false);

  const animateValue = useCallback((setter: (n: number) => void, duration: number) => {
    if (reduceMotion()) { setter(1); return Promise.resolve(); }
    return new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        setter(ease(progress));
        if (progress < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }, []);

  const revealContent = () => {
    const el = root.current;
    el?.classList.remove("content-revealing");
    if (el) void el.offsetWidth;
    el?.classList.add("content-revealing");
  };

  const movePanel = useCallback((direction: "forward" | "backward") => {
    const currentPlanet = state.current;
    if ((busy.current && !panelSequenceReady.current) || aboutPanelLocked.current) return;
    const from = aboutPanelIndex.current;
    const lastPanel = panelCountFor(currentPlanet) - 1;
    const to = from + (direction === "forward" ? 1 : -1);
    if (to >= 0 && to <= lastPanel) {
      aboutPanelLocked.current = true;
      aboutPanelIndex.current = to;
      setAboutPanel(to);
      if (currentPlanet === "sun") setAboutTransition({ from, to, direction });
      aboutPanelTimer.current = window.setTimeout(() => {
        setAboutTransition(null);
        aboutPanelLocked.current = false;
        aboutPanelTimer.current = null;
      }, reduceMotion() ? 80 : 980);
      return;
    }

    const planetPosition = PLANETS.findIndex(({ key }) => key === currentPlanet);
    const adjacent = PLANETS[planetPosition + (direction === "forward" ? 1 : -1)];
    if (!adjacent) return;
    const destinationPanel = direction === "forward" ? 0 : panelCountFor(adjacent.key) - 1;
    travelRef.current(adjacent.key, destinationPanel);
  }, []);

  const commitState = useCallback((next: PlanetKey, initialPanel = 0) => {
    if (state.current !== next) {
      if (aboutPanelTimer.current !== null) window.clearTimeout(aboutPanelTimer.current);
      aboutPanelLocked.current = false;
      aboutPanelIndex.current = initialPanel;
      setAboutPanel(initialPanel);
      setAboutTransition(null);
      setSwitching(false);
      requestAnimationFrame(() => {
        setSwitching(true);
        window.setTimeout(() => setSwitching(false), 850);
      });
    } else if (aboutPanelIndex.current !== initialPanel) {
      aboutPanelIndex.current = initialPanel;
      setAboutPanel(initialPanel);
      setAboutTransition(null);
    }
    state.current = next;
    setPlanet(next);
  }, []);

  useEffect(() => {
    const update = () => setCountdown(countdownUntilEvent(Date.now()));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const shell = root.current;
    if (!shell) return;
    let touchY: number | null = null;
    let wheelDelta = 0;
    let wheelConsumed = false;
    let wheelIdleTimer = 0;
    const ignoredTarget = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(".planet-list, .header, button, a"));
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX) || ignoredTarget(event.target)) return;
      event.preventDefault();
      window.clearTimeout(wheelIdleTimer);
      wheelIdleTimer = window.setTimeout(() => { wheelDelta = 0; wheelConsumed = false; }, 280);
      if (aboutPanelLocked.current || wheelConsumed || Math.abs(event.deltaY) < 1) return;
      wheelDelta += event.deltaY;
      if (Math.abs(wheelDelta) >= 48) {
        const direction = wheelDelta > 0 ? "forward" : "backward";
        wheelDelta = 0;
        wheelConsumed = true;
        movePanel(direction);
      }
    };
    const touchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || ignoredTarget(event.target)) { touchY = null; return; }
      touchY = event.touches[0].clientY;
    };
    const touchMove = (event: TouchEvent) => {
      if (touchY === null || event.touches.length !== 1) return;
      event.preventDefault();
    };
    const touchEnd = (event: TouchEvent) => {
      if (touchY !== null && event.changedTouches.length) {
        const distance = touchY - event.changedTouches[0].clientY;
        if (Math.abs(distance) > 42) movePanel(distance > 0 ? "forward" : "backward");
      }
      touchY = null;
    };
    shell.addEventListener("wheel", wheel, { passive: false });
    shell.addEventListener("touchstart", touchStart, { passive: true });
    shell.addEventListener("touchmove", touchMove, { passive: false });
    shell.addEventListener("touchend", touchEnd);
    shell.addEventListener("touchcancel", touchEnd);
    return () => {
      window.clearTimeout(wheelIdleTimer);
      shell.removeEventListener("wheel", wheel);
      shell.removeEventListener("touchstart", touchStart);
      shell.removeEventListener("touchmove", touchMove);
      shell.removeEventListener("touchend", touchEnd);
      shell.removeEventListener("touchcancel", touchEnd);
    };
  }, [movePanel]);

  useEffect(() => () => {
    if (aboutPanelTimer.current !== null) window.clearTimeout(aboutPanelTimer.current);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const travel = useCallback(async (destination: PlanetKey, initialPanel = 0) => {
    if (!busy.current && state.current === destination) return;
    const preloadQueue = backgroundPreloadQueue.current;
    if (preloadQueue) {
      preloadQueue.paused = true;
      preloadQueue.activeController?.abort();
    }

    if (busy.current) {
      // A direct planet choice takes priority over an in-flight transition.
      transitionController.current?.abort();
      transitionVideo.current?.pause();
      transitionVideo.current?.removeAttribute("src");
      transitionVideo.current?.load();
      activeTransition.current = false;
      expansion.current = 0;
      frozen.current = false;
      busy.current = false;
      const shell = root.current;
      shell?.classList.remove("is-transitioning", "is-committing", "is-loading", "is-content-visible", "content-revealing");
      requestCanvasFrame.current();
    }

    busy.current = true;
    panelSequenceReady.current = false;
    setSelectedPlanet(destination);
    const video = transitionVideo.current;
    const shell = root.current;
    if (!video || !shell) { setSelectedPlanet(state.current); busy.current = false; return; }
    const controller = new AbortController();
    const { signal } = controller;
    transitionController.current = controller;

    let destinationRevealed = false;
    const revealDestination = () => {
      if (destinationRevealed) return;
      destinationRevealed = true;
      commitState(destination, initialPanel);
      shell.classList.add("is-content-visible");
      revealContent();
      panelSequenceReady.current = true;
    };
    const finishTravel = () => {
      if (signal.aborted) return;
      activeTransition.current = false;
      expansion.current = 0;
      frozen.current = false;
      panelSequenceReady.current = false;
      video.removeAttribute("src");
      video.load();
      requestCanvasFrame.current();
      busy.current = false;
      if (transitionController.current === controller) transitionController.current = null;
      resumeBackgroundPreload.current();
    };
    const showDestinationWithoutTransition = async () => {
      if (signal.aborted) return;
      shell.classList.remove("is-transitioning", "is-committing", "is-content-visible", "content-revealing");
      shell.classList.add("is-loading");
      revealDestination();
      setBackgroundPlanet(destination);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const background = backgroundVideo.current;
      if (background) {
        const backgroundReady = ready(background, 4500, HTMLMediaElement.HAVE_CURRENT_DATA, signal);
        void background.play().catch(() => undefined);
        await backgroundReady;
      }
      if (signal.aborted) return;
      shell.classList.remove("is-loading");
      finishTravel();
    };

    try {
      const destinationVideo = PLANET_STATES[destination].background;
      // R2 must opt into CORS for its video frames to be drawn into the transition canvas.
      if (destinationVideo.startsWith(`${R2_MEDIA_ORIGIN}/`)) video.crossOrigin = "anonymous";
      else video.removeAttribute("crossorigin");
      video.src = destinationVideo;
      shell.classList.remove("is-content-visible");
      shell.classList.add("is-loading");
      const transitionReady = ready(video, 5000, HTMLMediaElement.HAVE_CURRENT_DATA, signal);
      video.load();
      if (!(await transitionReady)) {
        if (signal.aborted) return;
        // Keep navigation usable if the transition asset is slow or unavailable.
        await showDestinationWithoutTransition();
        return;
      }

      shell.classList.remove("is-loading", "content-revealing");
      shell.classList.add("is-transitioning");
      video.currentTime = 0;
      video.playbackRate = 1;
      try {
        await video.play();
      } catch {
        if (signal.aborted) return;
        await showDestinationWithoutTransition();
        return;
      }
      if (signal.aborted) return;

      activeTransition.current = true;
      requestCanvasFrame.current();
      const ended = playbackEnded(video, Math.min(15000, (video.duration || 8) * 1000 + 1200), signal);
      const revealTimer = window.setTimeout(revealDestination, 2000);
      await Promise.all([
        animateValue((v) => { if (!signal.aborted) expansion.current = v; }, 1100),
        ended,
      ]);
      if (signal.aborted) return;
      window.clearTimeout(revealTimer);
      revealDestination();

      const snapshot = frozenCanvas.current?.getContext("2d");
      if (snapshot && canvas.current && frozenCanvas.current) {
        snapshot.clearRect(0, 0, frozenCanvas.current.width, frozenCanvas.current.height);
        snapshot.drawImage(canvas.current, 0, 0, innerWidth, innerHeight);
        frozen.current = true;
        requestCanvasFrame.current();
      }
      shell.classList.add("is-committing");
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      activeTransition.current = false;
      expansion.current = 0;
      requestCanvasFrame.current();
      shell.classList.remove("is-committing");
      setBackgroundPlanet(destination);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const background = backgroundVideo.current;
      if (background) {
        const backgroundReady = ready(background, 4500, HTMLMediaElement.HAVE_CURRENT_DATA, signal);
        void background.play().catch(() => undefined);
        await backgroundReady;
      }
      if (signal.aborted) return;
      shell.classList.remove("is-transitioning", "is-content-visible");
      finishTravel();
    } catch {
      if (signal.aborted) return;
      shell.classList.remove("is-loading", "is-transitioning", "is-committing", "is-content-visible");
      revealDestination();
      setBackgroundPlanet(destination);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const background = backgroundVideo.current;
      if (background) {
        const backgroundReady = ready(background, 4500, HTMLMediaElement.HAVE_CURRENT_DATA, signal);
        void background.play().catch(() => undefined);
        await backgroundReady;
      }
      if (signal.aborted) return;
      finishTravel();
    }
  }, [animateValue, commitState]);
  useEffect(() => { travelRef.current = travel; }, [travel]);
  useEffect(() => () => {
    transitionController.current?.abort();
    transitionVideo.current?.pause();
  }, []);

  useEffect(() => {
    const el = canvas.current;
    const behind = frozenCanvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !behind || !ctx) return;
    let w = innerWidth, h = innerHeight, raf = 0, previous = performance.now();

    const schedule = () => {
      if (!raf && document.visibilityState === "visible") raf = requestAnimationFrame(draw);
    };

    const resize = () => {
      w = innerWidth; h = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      [el, behind].forEach((c) => {
        c.width = w * dpr; c.height = h * dpr;
        c.style.width = `${w}px`; c.style.height = `${h}px`;
        c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
      if (activeTransition.current || frozen.current) schedule();
    };
    const drawCover = (context: CanvasRenderingContext2D, media: HTMLVideoElement | HTMLImageElement | null) => {
      if (!media) return;
      const isVideo = media instanceof HTMLVideoElement;
      const mw = isVideo ? media.videoWidth : media.naturalWidth;
      const mh = isVideo ? media.videoHeight : media.naturalHeight;
      if (!mw || !mh || (isVideo && media.readyState < HTMLMediaElement.HAVE_CURRENT_DATA)) return;
      const scale = Math.max(w / mw, h / mh), dw = mw * scale, dh = mh * scale;
      context.drawImage(media, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    const shade = (context: CanvasRenderingContext2D) => {
      const g = context.createLinearGradient(0, h * .52, 0, h);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.88)");
      context.fillStyle = g; context.fillRect(0, h * .52, w, h * .48);
    };
    const roundedPoints = (rw: number, rh: number, r: number) => {
      const points: XY[] = [];
      const arcs: [number, number, number, number][] = [
        [rw / 2 - r, -rh / 2 + r, -Math.PI / 2, 0], [rw / 2 - r, rh / 2 - r, 0, Math.PI / 2],
        [-rw / 2 + r, rh / 2 - r, Math.PI / 2, Math.PI], [-rw / 2 + r, -rh / 2 + r, Math.PI, Math.PI * 1.5],
      ];
      arcs.forEach(([cx, cy, a, b]) => { for (let i = 0; i <= 10; i++) { const t = a + (b - a) * i / 10; points.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r }); } });
      return points;
    };
    const draw = (now: number) => {
      raf = 0;
      const dt = Math.min(40, now - previous); previous = now;
      if (activeTransition.current) {
        const lerp = Math.min(1, dt * .009);
        tilt.current.x += (targetTilt.current.x - tilt.current.x) * lerp;
        tilt.current.y += (targetTilt.current.y - tilt.current.y) * lerp;
      }
      ctx.clearRect(0, 0, w, h);
      if (frozen.current) { ctx.drawImage(behind, 0, 0, w, h); shade(ctx); }
      const rect = transitionOrigin.current?.getBoundingClientRect(), e = expansion.current;
      if (activeTransition.current && rect && rect.width > 1 && rect.height > 1) {
        const cx0 = rect.left + rect.width / 2, cy0 = rect.top + rect.height / 2;
        const cx = cx0 + (w / 2 - cx0) * e, cy = cy0 + (h / 2 - cy0) * e;
        const scale = 1;
        const rw = (rect.width + (w - rect.width) * e) * scale;
        const rh = (rect.height + (h - rect.height) * e) * scale;
        const radius = Math.min(90 * (1 - e) * scale, rw / 2, rh / 2);
        const rx = reduceMotion() ? 0 : tilt.current.x * (1 - e);
        const ry = reduceMotion() ? 0 : tilt.current.y * (1 - e);
        if (rw > 1 && rh > 1) {
          const ax = rx * Math.PI / 180, ay = ry * Math.PI / 180;
          const points = roundedPoints(rw, rh, radius).map(({ x, y }) => {
            const xx = x * Math.cos(ay), yy = y * Math.cos(ax);
            const p = 850 / (850 + x * Math.sin(ay) - y * Math.sin(ax));
            return { x: cx + xx * p, y: cy + yy * p };
          });
          ctx.save(); ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
          points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.clip();
          ctx.fillStyle = "#030303"; ctx.fillRect(0, 0, w, h);
          drawCover(ctx, transitionVideo.current);
          shade(ctx);
          ctx.restore();
        }
      }
      if (activeTransition.current) schedule();
    };
    const move = (e: PointerEvent) => {
      if (reduceMotion() || e.pointerType === "touch") return;
      targetTilt.current = { y: (e.clientX / innerWidth - .5) * 37.4, x: (e.clientY / innerHeight - .5) * -33 };
      if (activeTransition.current) schedule();
    };
    const leave = () => {
      targetTilt.current = { x: 0, y: 0 };
      if (activeTransition.current) schedule();
    };
    const visibility = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (document.visibilityState === "visible") { previous = performance.now(); schedule(); }
    };
    requestCanvasFrame.current = schedule;
    resize();
    addEventListener("resize", resize); addEventListener("pointermove", move); addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(raf); removeEventListener("resize", resize); removeEventListener("pointermove", move);
      removeEventListener("pointerleave", leave); document.removeEventListener("visibilitychange", visibility);
      if (requestCanvasFrame.current === schedule) requestCanvasFrame.current = () => {};
    };
  }, []);

  useEffect(() => {
    document.body.classList.remove("preload-complete", "intro-ready", "content-revealing");
    const video = preloaderVideo.current;
    let finished = false, logoRevealTimer = 0, finishTimer = 0, progressTimer = 0;
    let counterNode: HTMLElement | null = null;
    if (!video) return;
    const introStartedAt = performance.now();
    const controller = new AbortController();
    let sunProgress = 0, spaceProgress = 0, lastProgress = 0;
    const updateProgress = () => {
      const elapsedProgress = video.duration > 0
        ? Math.min(1, video.currentTime / video.duration)
        : Math.min(1, (performance.now() - introStartedAt) / 5000);
      const progress = Math.min(99, Math.floor((sunProgress * 45 + spaceProgress * 45 + elapsedProgress * 9)));
      if (progress > lastProgress) {
        lastProgress = progress;
        setCounter(progress);
      }
    };
    progressTimer = window.setInterval(updateProgress, 100);
    const start = () => {
      document.body.classList.add("intro-ready");
      window.setTimeout(revealContent, reduceMotion() ? 0 : 850);
    };
    const finish = () => {
      if (finished) return;
      const remainingIntroTime = 5000 - (performance.now() - introStartedAt);
      if (remainingIntroTime > 0) {
        if (!finishTimer) finishTimer = window.setTimeout(() => { finishTimer = 0; finish(); }, remainingIntroTime);
        return;
      }
      finished = true; clearInterval(progressTimer); controller.abort(); setCounter(100);
      counterNode = document.getElementById("preloader-count");
      counterNode?.classList.add("is-leaving");
      document.getElementById("floating-lockup")?.classList.add("is-docked");
      document.getElementById("preloader")?.classList.add("is-background");
      document.body.classList.add("preload-complete");
      setIntroComplete(true);
      start();
      window.setTimeout(() => counterNode?.remove(), 750);
      logoRevealTimer = window.setTimeout(() => {
        document.getElementById("floating-lockup")?.classList.add("is-settled");
        document.getElementById("floating-theme")?.classList.add("is-revealing");
      }, reduceMotion() ? 0 : 2000);
    };
    const begin = () => {
      if (reduceMotion()) return;
      video.playbackRate = 1;
      void video.play().catch(() => undefined);
    };
    video.addEventListener("loadedmetadata", begin, { once: true });
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) begin();

    const sunDownload = downloadVideoIntoBrowserCache(ASSETS.sunVideo, controller.signal, (progress) => {
      sunProgress = progress;
      updateProgress();
    }).catch(() => false);
    const spaceDownload = (async () => {
      if (await waitForFullMediaBuffer(video, 12_000, controller.signal, (progress) => {
        spaceProgress = progress;
        updateProgress();
      })) return true;
      try {
        await downloadVideoIntoBrowserCache(ASSETS.spaceVideo, controller.signal, (progress) => {
          spaceProgress = progress;
          updateProgress();
        });
        return true;
      } catch {
        return false;
      }
    })();
    void Promise.all([sunDownload, spaceDownload]).then(finish);

    // A broken or blocked media request must not leave the whole experience inaccessible.
    const failSafe = window.setTimeout(finish, 45_000);
    return () => {
      clearTimeout(failSafe); clearTimeout(logoRevealTimer); clearTimeout(finishTimer); clearInterval(progressTimer); controller.abort();
      video.removeEventListener("loadedmetadata", begin); video.removeEventListener("ended", finish);
      video.removeEventListener("error", finish);
      document.body.classList.remove("preload-complete", "intro-ready", "content-revealing");
    };
  }, []);

  useEffect(() => {
    if (!introComplete) return;
    const seen = new Set<string>([ASSETS.spaceVideo, ASSETS.sunVideo]);
    const queue = PLANETS.flatMap(({ key }) => {
      const url = PLANET_STATES[key].background;
      if (seen.has(url)) return [];
      seen.add(url);
      return [url];
    });

    const manager: VideoPreloadQueue = {
      items: queue,
      completed: new Set([ASSETS.spaceVideo, ASSETS.sunVideo]),
      index: 0,
      activeController: null,
      paused: false,
      running: false,
    };
    backgroundPreloadQueue.current = manager;
    resumeBackgroundPreload.current = () => {
      manager.paused = false;
      void runVideoPreloadQueue(manager);
    };
    void runVideoPreloadQueue(manager);
    return () => {
      manager.paused = true;
      manager.activeController?.abort();
      if (backgroundPreloadQueue.current === manager) backgroundPreloadQueue.current = null;
      resumeBackgroundPreload.current = () => {};
    };
  }, [introComplete]);

  useEffect(() => {
    const background = backgroundVideo.current;
    if (!background || !introComplete) return;
    background.loop = true;
    background.pause();
    background.load();
    const replayOnEnd = () => {
      background.currentTime = 0;
      void background.play().catch(() => undefined);
    };
    background.addEventListener("ended", replayOnEnd);
    void background.play().catch(() => undefined);
    return () => background.removeEventListener("ended", replayOnEnd);
  }, [backgroundPlanet, introComplete]);

  useEffect(() => {
    const cursor = document.querySelector<HTMLElement>(".custom-cursor");
    if (!cursor || reduceMotion() || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * .2; y += (ty - y) * .2;
      cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (Math.abs(tx - x) + Math.abs(ty - y) > .25) raf = requestAnimationFrame(loop);
      else { x = tx; y = ty; raf = 0; }
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY; cursor.classList.add("is-visible");
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const leave = () => { cursor.classList.remove("is-visible"); cancelAnimationFrame(raf); raf = 0; };
    addEventListener("pointermove", move); document.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(raf); removeEventListener("pointermove", move); document.removeEventListener("pointerleave", leave); };
  }, []);

  const cfg = PLANET_STATES[planet];
  return (
    <main className="experience" data-planet={planet} data-selected-planet={selectedPlanet} ref={root} aria-label="Planet Jumping experience">
      <div className="backgrounds" aria-hidden="true">
        <video
          ref={backgroundVideo}
          className="background is-visible"
          src={PLANET_STATES[backgroundPlanet].background}
          crossOrigin={PLANET_STATES[backgroundPlanet].background.startsWith(`${R2_MEDIA_ORIGIN}/`) ? "anonymous" : undefined}
          muted
          playsInline
          preload={introComplete ? "metadata" : "none"}
          loop
        />
      </div>
      <div className="preloader" id="preloader" aria-label="Loading into space">
        <video ref={preloaderVideo} id="preloader-video" src={ASSETS.spaceVideo} crossOrigin="anonymous" muted playsInline preload="auto" />
        <div className="preloader-shade" />
      </div>
      <div className="floating-lockup" id="floating-lockup" role="group" aria-label="Technotsav 11th edition logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="floating-edition" src="/technotsav-11th-edition.png" alt="11th edition" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="floating-logo" src="/technotsav-wordmark-horizontal.png" alt="Technotsav" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="floating-theme" id="floating-theme" src="/technotsav-space-ai.png" alt="Space × AI" />
      <div className="preloader-count" id="preloader-count" aria-live="polite"><span>{counter}</span><span className="percent">%</span></div>
      <canvas ref={frozenCanvas} className="scene-canvas" aria-hidden="true" />
      <div className="shade" aria-hidden="true" />

      <div
        className="event-countdown"
        role="timer"
        aria-live="off"
        aria-label={countdown ? `Technotsav countdown: ${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds to midnight IST on November 27, 2026` : "Technotsav countdown to midnight IST on November 27, 2026"}
        data-complete={countdown && countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0}
      >
        <span className="countdown-label">T−</span>
        <span className="countdown-unit"><strong>{countdown ? String(countdown.days).padStart(2, "0") : "--"}</strong><small>Days</small></span>
        <span className="countdown-separator">:</span>
        <span className="countdown-unit"><strong>{countdown ? String(countdown.hours).padStart(2, "0") : "--"}</strong><small>Hours</small></span>
        <span className="countdown-separator">:</span>
        <span className="countdown-unit"><strong>{countdown ? String(countdown.minutes).padStart(2, "0") : "--"}</strong><small>Minutes</small></span>
        <span className="countdown-separator">:</span>
        <span className="countdown-unit"><strong>{countdown ? String(countdown.seconds).padStart(2, "0") : "--"}</strong><small>Seconds</small></span>
        <span className="countdown-zone">{EVENT_TIME_ZONE === "Asia/Kolkata" ? "IST" : EVENT_TIME_ZONE}</span>
      </div>

      <header className="header chrome">
        <button className="menu" type="button" aria-controls="mobile-destinations" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "Close" : "Destinations"}</button>
        <nav className="mobile-destinations" id="mobile-destinations" aria-label="Planet destinations" hidden={!menuOpen}>
          <p className="destination-heading">Choose a destination</p>
          <div className="destination-options">
            {PLANETS.map(({ key, name }, index) => (
              <button className={key === selectedPlanet ? "destination-option active" : "destination-option"} key={key} type="button" aria-current={key === selectedPlanet ? "step" : undefined} onClick={() => { setMenuOpen(false); void travel(key); }}>
                <span className="destination-index">{String(index + 1).padStart(2, "0")}</span>
                <span>{name}</span>
                {key === selectedPlanet && <span className="destination-current">Selected</span>}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <aside className={switching ? "planet-list chrome is-switching" : "planet-list chrome"} id="planet-list" aria-label="Choose a destination">
        {PLANETS.map(({ key, name }) => <button className={key === selectedPlanet ? "planet-item active" : "planet-item"} key={key} type="button" aria-current={key === selectedPlanet ? "step" : undefined} onClick={() => { setMenuOpen(false); void travel(key); }}>{name}</button>)}
      </aside>

      <canvas ref={canvas} className="transition-canvas" aria-hidden="true" />
      {/* Invisible geometry preserves the existing zoom origin without a static planet preview. */}
      <div ref={transitionOrigin} className="transition-origin" aria-hidden="true" />

      {planet === "sun" ? (
        <section
          className="about-stage chrome"
          id="planet-content"
          role="region"
          aria-label="Sun details, About NMFC, and About Technotsav panels. Use scrolling, swiping, or arrow keys to move through panels and planets."
          aria-live="polite"
          tabIndex={0}
          onKeyDown={(event) => {
            const direction = ["ArrowDown", "PageDown", " "].includes(event.key) ? "forward"
              : ["ArrowUp", "PageUp"].includes(event.key) ? "backward" : null;
            if (direction) { event.preventDefault(); movePanel(direction); }
          }}
        >
          <article className={`about-panel planet-content ${aboutMotionClass(0, aboutPanel, aboutTransition)}`} aria-hidden={aboutPanel !== 0}>
            <h1>{cfg.name.toUpperCase()}</h1>
            <dl>{cfg.facts.map(([term, value]) => <div className="fact" key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
            <div className="about-panel-count" aria-hidden="true">01 <span>/</span> {String(SUN_ABOUT_PANELS.length + 1).padStart(2, "0")}</div>
          </article>
          {SUN_ABOUT_PANELS.map((panel, index) => {
            const panelIndex = index + 1;
            return (
              <article className={`about-panel ${aboutMotionClass(panelIndex, aboutPanel, aboutTransition)}`} key={`${panel.section}-${index}`} aria-hidden={panelIndex !== aboutPanel}>
                <div className="about-panel-title">
                  <p className="about-panel-section">{panel.section}</p>
                  <h1>{panel.title}</h1>
                </div>
                <div className="about-panel-body">
                  {panel.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {panel.highlights && <ul className="about-highlights">{panel.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>}
                </div>
                <div className="about-panel-count" aria-hidden="true">{String(panelIndex + 1).padStart(2, "0")} <span>/</span> {String(SUN_ABOUT_PANELS.length + 1).padStart(2, "0")}</div>
              </article>
            );
          })}
        </section>
      ) : (
        <section
          className="planet-content chrome"
          id="planet-content"
          aria-live="polite"
          aria-atomic="true"
          tabIndex={0}
          aria-label={`${cfg.name} facts. Use scrolling, swiping, or arrow keys to continue to the next planet.`}
          onKeyDown={(event) => {
            const direction = ["ArrowDown", "PageDown", " "].includes(event.key) ? "forward"
              : ["ArrowUp", "PageUp"].includes(event.key) ? "backward" : null;
            if (direction) { event.preventDefault(); movePanel(direction); }
          }}
        >
          <h1>{cfg.name.toUpperCase()}</h1>
          <dl>{cfg.facts.map(([term, value]) => <div className="fact" key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
        </section>
      )}
      <div className="scroll-cue" aria-hidden="true">
        <span>{String(aboutPanel + 1).padStart(2, "0")} / {String(panelCountFor(planet)).padStart(2, "0")} &nbsp;·&nbsp; {aboutPanel < panelCountFor(planet) - 1 ? "SCROLL TO NEXT PANEL" : PLANETS[PLANETS.findIndex(({ key }) => key === planet) + 1] ? `SCROLL TO ${PLANETS[PLANETS.findIndex(({ key }) => key === planet) + 1].name.toUpperCase()}` : "END OF JOURNEY · SCROLL UP TO REVISIT"}</span><i />
      </div>
      <div className="transition-layer" aria-hidden="true"><video ref={transitionVideo} muted playsInline preload="auto" /></div>
      <div className="loading" aria-live="polite">Preparing orbit…</div>
      <div className="custom-cursor" aria-hidden="true"><span className="cursor-orbit" /><span className="cursor-dot" /><span className="cursor-label">Enter</span></div>
    </main>
  );
}

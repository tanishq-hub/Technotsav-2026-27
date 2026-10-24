"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ASSETS, PLANETS, PLANET_STATES, SUN_ABOUT_PANELS, type PlanetKey } from "@/lib/planets";
import "./planet-portal.css";

type XY = { x: number; y: number };
type AboutTransition = { from: number; to: number; direction: "forward" | "backward" };
const ease = (t: number) => t < .5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2;
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function aboutMotionClass(panelIndex: number, activePanel: number, transition: AboutTransition | null) {
  if (transition?.from === panelIndex) return transition.direction === "forward" ? "is-leaving-up" : "is-leaving-down";
  if (transition?.to === panelIndex) return transition.direction === "forward" ? "is-entering-from-bottom" : "is-entering-from-top";
  return panelIndex === activePanel ? "is-settled" : "is-hidden";
}

function ready(media: HTMLMediaElement, timeout = 4500) {
  return new Promise<void>((resolve) => {
    if (media.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return resolve();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      media.removeEventListener("canplaythrough", finish);
      media.removeEventListener("loadeddata", finish);
      media.removeEventListener("error", finish);
      resolve();
    };
    const timer = window.setTimeout(finish, timeout);
    media.addEventListener("canplaythrough", finish, { once: true });
    media.addEventListener("loadeddata", finish, { once: true });
    media.addEventListener("error", finish, { once: true });
    media.load();
  });
}

export function PlanetPortal() {
  const root = useRef<HTMLElement>(null);
  const transitionOrigin = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frozenCanvas = useRef<HTMLCanvasElement>(null);
  const backgroundVideo = useRef<HTMLVideoElement>(null);
  const transitionVideo = useRef<HTMLVideoElement>(null);
  const preloaderVideo = useRef<HTMLVideoElement>(null);
  const [planet, setPlanet] = useState<PlanetKey>("sun");
  const [counter, setCounter] = useState(0);
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

  const moveAboutPanel = useCallback((direction: "forward" | "backward") => {
    if (state.current !== "sun" || busy.current || aboutPanelLocked.current) return;
    const from = aboutPanelIndex.current;
    const to = Math.max(0, Math.min(SUN_ABOUT_PANELS.length, from + (direction === "forward" ? 1 : -1)));
    if (to === from) return;
    aboutPanelLocked.current = true;
    aboutPanelIndex.current = to;
    setAboutPanel(to);
    setAboutTransition({ from, to, direction });
    aboutPanelTimer.current = window.setTimeout(() => {
      setAboutTransition(null);
      aboutPanelLocked.current = false;
      aboutPanelTimer.current = null;
    }, reduceMotion() ? 80 : 980);
  }, []);

  const commitState = useCallback((next: PlanetKey) => {
    if (state.current !== next) {
      if (aboutPanelTimer.current !== null) window.clearTimeout(aboutPanelTimer.current);
      aboutPanelLocked.current = false;
      aboutPanelIndex.current = 0;
      setAboutPanel(0);
      setAboutTransition(null);
      setSwitching(false);
      requestAnimationFrame(() => {
        setSwitching(true);
        window.setTimeout(() => setSwitching(false), 850);
      });
    }
    state.current = next;
    setPlanet(next);
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
      if (state.current !== "sun" || event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX) || ignoredTarget(event.target)) return;
      event.preventDefault();
      window.clearTimeout(wheelIdleTimer);
      wheelIdleTimer = window.setTimeout(() => { wheelDelta = 0; wheelConsumed = false; }, 280);
      if (aboutPanelLocked.current || wheelConsumed || Math.abs(event.deltaY) < 1) return;
      wheelDelta += event.deltaY;
      if (Math.abs(wheelDelta) >= 48) {
        const direction = wheelDelta > 0 ? "forward" : "backward";
        wheelDelta = 0;
        wheelConsumed = true;
        moveAboutPanel(direction);
      }
    };
    const touchStart = (event: TouchEvent) => {
      if (state.current !== "sun" || event.touches.length !== 1 || ignoredTarget(event.target)) { touchY = null; return; }
      touchY = event.touches[0].clientY;
    };
    const touchMove = (event: TouchEvent) => {
      if (touchY === null || event.touches.length !== 1) return;
      event.preventDefault();
    };
    const touchEnd = (event: TouchEvent) => {
      if (touchY !== null && event.changedTouches.length) {
        const distance = touchY - event.changedTouches[0].clientY;
        if (Math.abs(distance) > 42) moveAboutPanel(distance > 0 ? "forward" : "backward");
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
  }, [moveAboutPanel]);

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

  const travel = useCallback(async (destination: PlanetKey) => {
    const from = state.current;
    if (busy.current || from === destination) return;
    busy.current = true;
    targetTilt.current = { x: 0, y: 0 };
    const video = transitionVideo.current;
    const shell = root.current;
    if (!video || !shell) { busy.current = false; return; }

    try {
      video.src = PLANET_STATES[destination].background;
      video.load();
      shell.classList.add("is-loading");
      await ready(video, 1600);
      shell.classList.remove("is-loading", "content-revealing");
      shell.classList.add("is-transitioning");
      video.currentTime = 0;
      video.playbackRate = 1.3;
      activeTransition.current = true;
      const ended = new Promise<void>((resolve) => {
        video.addEventListener("ended", () => resolve(), { once: true });
        window.setTimeout(resolve, Math.min(15000, (video.duration || 8) * 1000 / 1.3 + 1200));
      });
      await Promise.all([
        animateValue((v) => { expansion.current = v; }, 1100),
        video.play().catch(() => undefined),
        ended,
      ]);
      const snapshot = frozenCanvas.current?.getContext("2d");
      if (snapshot && canvas.current && frozenCanvas.current) {
        snapshot.clearRect(0, 0, frozenCanvas.current.width, frozenCanvas.current.height);
        snapshot.drawImage(canvas.current, 0, 0, innerWidth, innerHeight);
        frozen.current = true;
      }
      commitState(destination);
      shell.classList.add("is-committing");
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      activeTransition.current = false;
      expansion.current = 0;
      shell.classList.remove("is-transitioning", "is-committing");
      window.setTimeout(revealContent, reduceMotion() ? 0 : 100);
      const background = backgroundVideo.current;
      if (background) {
        await ready(background, 1600);
        try { await background.play(); } catch { /* Keep the committed frame if playback is unavailable. */ }
      }
      frozen.current = false;
      window.setTimeout(() => { video.removeAttribute("src"); video.load(); busy.current = false; }, 450);
    } catch {
      activeTransition.current = false;
      expansion.current = 0;
      frozen.current = false;
      shell.classList.remove("is-loading", "is-transitioning", "is-committing");
      busy.current = false;
    }
  }, [animateValue, commitState]);

  useEffect(() => {
    const el = canvas.current;
    const behind = frozenCanvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !behind || !ctx) return;
    let w = innerWidth, h = innerHeight, raf = 0, previous = performance.now();

    const resize = () => {
      w = innerWidth; h = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      [el, behind].forEach((c) => {
        c.width = w * dpr; c.height = h * dpr;
        c.style.width = `${w}px`; c.style.height = `${h}px`;
        c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
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
      const dt = Math.min(40, now - previous); previous = now;
      const lerp = Math.min(1, dt * .009);
      tilt.current.x += (targetTilt.current.x - tilt.current.x) * lerp;
      tilt.current.y += (targetTilt.current.y - tilt.current.y) * lerp;
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
      if (document.visibilityState === "visible") raf = requestAnimationFrame(draw);
    };
    const move = (e: PointerEvent) => {
      if (busy.current || reduceMotion() || e.pointerType === "touch") return;
      targetTilt.current = { y: (e.clientX / innerWidth - .5) * 37.4, x: (e.clientY / innerHeight - .5) * -33 };
    };
    const leave = () => { targetTilt.current = { x: 0, y: 0 }; };
    const visibility = () => {
      cancelAnimationFrame(raf);
      if (document.visibilityState === "visible") { previous = performance.now(); raf = requestAnimationFrame(draw); }
    };
    resize(); raf = requestAnimationFrame(draw);
    addEventListener("resize", resize); addEventListener("pointermove", move); addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(raf); removeEventListener("resize", resize); removeEventListener("pointermove", move);
      removeEventListener("pointerleave", leave); document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    document.body.classList.remove("preload-complete", "intro-ready", "content-revealing");
    const video = preloaderVideo.current;
    let finished = false, raf = 0, logoRevealTimer = 0;
    let counterNode: HTMLElement | null = null;
    if (!video) return;
    const start = () => {
      document.body.classList.add("intro-ready");
      window.setTimeout(revealContent, reduceMotion() ? 0 : 850);
    };
    const finish = () => {
      if (finished) return;
      finished = true; cancelAnimationFrame(raf); setCounter(100);
      counterNode = document.getElementById("preloader-count");
      counterNode?.classList.add("is-leaving");
      document.getElementById("floating-lockup")?.classList.add("is-docked");
      document.getElementById("preloader")?.classList.add("is-background");
      document.body.classList.add("preload-complete");
      start();
      window.setTimeout(() => counterNode?.remove(), 750);
      logoRevealTimer = window.setTimeout(() => {
        document.getElementById("floating-lockup")?.classList.add("is-settled");
        document.getElementById("floating-theme")?.classList.add("is-revealing");
      }, reduceMotion() ? 0 : 2000);
    };
    const update = () => {
      if (!finished && Number.isFinite(video.duration) && video.duration > 0) {
        setCounter(Math.min(99, Math.round(video.currentTime / video.duration * 100)));
        raf = requestAnimationFrame(update);
      }
    };
    const begin = () => {
      if (reduceMotion()) { finish(); return; }
      video.playbackRate = Math.max(.25, (video.duration || 3) / 3);
      raf = requestAnimationFrame(update);
      void video.play().catch(finish);
    };
    video.addEventListener("loadedmetadata", begin, { once: true });
    video.addEventListener("ended", finish, { once: true });
    video.addEventListener("error", finish, { once: true });
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) begin();
    const failSafe = window.setTimeout(finish, 8000);
    return () => {
      clearTimeout(failSafe); clearTimeout(logoRevealTimer); cancelAnimationFrame(raf);
      video.removeEventListener("loadedmetadata", begin); video.removeEventListener("ended", finish);
      video.removeEventListener("error", finish);
      document.body.classList.remove("preload-complete", "intro-ready", "content-revealing");
    };
  }, []);

  useEffect(() => {
    const background = backgroundVideo.current;
    if (background) {
      background.pause();
      background.load();
      void background.play().catch(() => undefined);
    }
  }, [planet]);

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
    <main className="experience" data-planet={planet} ref={root} aria-label="Planet Jumping experience">
      <div className="backgrounds" aria-hidden="true">
        <video ref={backgroundVideo} className="background is-visible" src={PLANET_STATES[planet].background} muted playsInline preload="metadata" loop />
      </div>
      <div className="preloader" id="preloader" aria-label="Loading the Sun">
        <video ref={preloaderVideo} id="preloader-video" src={ASSETS.sunVideo} muted playsInline preload="auto" />
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

      <header className="header chrome">
        <button className="menu" type="button" aria-controls="mobile-destinations" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "Close" : "Destinations"}</button>
        <nav className="mobile-destinations" id="mobile-destinations" aria-label="Planet destinations" hidden={!menuOpen}>
          <p className="destination-heading">Choose a destination</p>
          <div className="destination-options">
            {PLANETS.map(({ key, name }, index) => (
              <button className={key === planet ? "destination-option active" : "destination-option"} key={key} type="button" aria-current={key === planet ? "step" : undefined} onClick={() => { setMenuOpen(false); void travel(key); }}>
                <span className="destination-index">{String(index + 1).padStart(2, "0")}</span>
                <span>{name}</span>
                {key === planet && <span className="destination-current">Current</span>}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <aside className={switching ? "planet-list chrome is-switching" : "planet-list chrome"} id="planet-list" aria-label="Choose a destination">
        {PLANETS.map(({ key, name }) => <button className={key === planet ? "planet-item active" : "planet-item"} key={key} type="button" aria-current={key === planet ? "step" : undefined} onClick={() => { setMenuOpen(false); void travel(key); }}>{name}</button>)}
      </aside>

      <canvas ref={canvas} className="transition-canvas" aria-hidden="true" />
      {/* Invisible geometry preserves the existing zoom origin without a static planet preview. */}
      <div ref={transitionOrigin} className="transition-origin" aria-hidden="true" />

      {planet === "sun" ? (
        <section
          className="about-stage chrome"
          id="planet-content"
          role="region"
          aria-label="Sun details, About NMFC, and About Technotsav panels. Use the arrow keys or page keys to move between panels."
          aria-live="polite"
          tabIndex={0}
          onKeyDown={(event) => {
            const direction = ["ArrowDown", "PageDown", " "].includes(event.key) ? "forward"
              : ["ArrowUp", "PageUp"].includes(event.key) ? "backward" : null;
            if (direction) { event.preventDefault(); moveAboutPanel(direction); }
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
        <section className="planet-content chrome" id="planet-content" aria-live="polite" aria-atomic="true">
          <h1>{cfg.name.toUpperCase()}</h1>
          <dl>{cfg.facts.map(([term, value]) => <div className="fact" key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
        </section>
      )}
      {planet === "sun" && <div className="scroll-cue" aria-hidden="true"><span>{String(aboutPanel + 1).padStart(2, "0")} / {String(SUN_ABOUT_PANELS.length + 1).padStart(2, "0")} &nbsp;·&nbsp; {aboutPanel === SUN_ABOUT_PANELS.length ? "SCROLL UP TO REVISIT" : "SCROLL TO CONTINUE"}</span><i /> </div>}
      <div className="transition-layer" aria-hidden="true"><video ref={transitionVideo} muted playsInline preload="auto" /></div>
      <div className="loading" aria-live="polite">Preparing orbit…</div>
      <div className="custom-cursor" aria-hidden="true"><span className="cursor-orbit" /><span className="cursor-dot" /><span className="cursor-label">Enter</span></div>
    </main>
  );
}

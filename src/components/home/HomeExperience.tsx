"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ASSETS, R2_MEDIA_ORIGIN, SUN_ABOUT_PANELS } from "@/lib/planets";
import { CORE_COMMITTEE, FESTIVAL_DETAILS, FESTIVAL_EVENTS } from "@/lib/festival";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import "./home-experience.css";

const TechnotsavGuide = dynamic(
  () => import("@/components/home/TechnotsavGuide").then((module) => module.TechnotsavGuide),
  { loading: () => <div className="guide-loading" role="status">Opening the preset guide…</div> },
);
const HOME_VIDEO_POSITION_KEY = "technotsav-home-solar-position";

function isSufficientlyBuffered(video: HTMLVideoElement) {
  if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) return true;
  for (let index = 0; index < video.buffered.length; index += 1) {
    if (video.buffered.start(index) < 0.2 && (video.buffered.end(index) >= Math.min(video.duration, 3.5) || (video.duration > 0 && video.buffered.end(index) / video.duration >= 0.35))) {
      return true;
    }
  }
  return false;
}

function waitForBuffer(video: HTMLVideoElement, timeout: number, signal: AbortSignal, onProgress: (value: number) => void) {
  return new Promise<boolean>((resolve) => {
    if (isSufficientlyBuffered(video)) { onProgress(1); resolve(true); return; }
    let done = false;
    const timer = window.setTimeout(() => finish(false), timeout);
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener("progress", check);
      video.removeEventListener("loadedmetadata", check);
      video.removeEventListener("canplaythrough", check);
      signal.removeEventListener("abort", aborted);
    };
    const finish = (result: boolean) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(result);
    };
    const check = () => {
      if (video.duration > 0 && Number.isFinite(video.duration)) {
        let end = 0;
        for (let index = 0; index < video.buffered.length; index += 1) end = Math.max(end, video.buffered.end(index));
        const target = Math.min(video.duration, 5);
        onProgress(Math.min(1, end / (target || 1)));
      }
      if (isSufficientlyBuffered(video)) finish(true);
    };
    const aborted = () => finish(false);
    video.addEventListener("progress", check);
    video.addEventListener("loadedmetadata", check);
    video.addEventListener("canplaythrough", check);
    signal.addEventListener("abort", aborted, { once: true });
    check();
  });
}

const retainedPreloads = new Map<string, HTMLVideoElement>();

function preloadVideo(url: string, signal: AbortSignal) {
  const retained = retainedPreloads.get(url);
  if (retained && isSufficientlyBuffered(retained)) return Promise.resolve(true);

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  if (url.startsWith(`${R2_MEDIA_ORIGIN}/`)) video.crossOrigin = "anonymous";
  video.src = url;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const timeout = window.setTimeout(() => finish(false), 20_000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("progress", check);
      video.removeEventListener("loadedmetadata", check);
      video.removeEventListener("canplaythrough", check);
      video.removeEventListener("error", failed);
      signal.removeEventListener("abort", aborted);
    };
    const finish = (complete: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (complete && !signal.aborted) retainedPreloads.set(url, video);
      else {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      resolve(complete);
    };
    const check = () => { if (isSufficientlyBuffered(video)) finish(true); };
    const failed = () => finish(false);
    const aborted = () => finish(false);
    video.addEventListener("progress", check);
    video.addEventListener("loadedmetadata", check);
    video.addEventListener("canplaythrough", check);
    video.addEventListener("error", failed, { once: true });
    signal.addEventListener("abort", aborted, { once: true });
    check();
    video.load();
  });
}

export function HomeExperience() {
  const spaceVideo = useRef<HTMLVideoElement>(null);
  const solarSystemVideo = useRef<HTMLVideoElement>(null);
  const [introVisible, setIntroVisible] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [homeReady, setHomeReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const guideButton = useRef<HTMLButtonElement>(null);

  const closeGuide = () => {
    setGuideOpen(false);
    window.requestAnimationFrame(() => guideButton.current?.focus());
  };

  useEffect(() => {
    if (!homeReady) return;
    const controller = new AbortController();
    // Warm the two route entry videos in parallel through native media requests.
    // This lets playback use the browser's normal media cache instead of a full
    // fetch followed by a second, separate video download.
    void Promise.all([
      preloadVideo(ASSETS.sunVideo, controller.signal),
      preloadVideo(ASSETS.mercuryVideo, controller.signal),
    ]);
    return () => controller.abort();
  }, [homeReady]);

  useEffect(() => {
    if (introVisible) return;
    const video = solarSystemVideo.current;
    if (!video) { setHomeReady(true); return; }

    let revealTimer = 0;
    let revealScheduled = false;
    let restoredPosition = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const savePosition = () => {
      if (!Number.isFinite(video.currentTime) || video.currentTime <= 0) return;
      try { window.sessionStorage.setItem(HOME_VIDEO_POSITION_KEY, String(video.currentTime)); } catch { /* Storage can be unavailable in private contexts. */ }
    };
    const revealAfterTwoSeconds = () => {
      if (revealScheduled) return;
      revealScheduled = true;
      revealTimer = window.setTimeout(() => setHomeReady(true), 2000);
    };
    const revealOnFailure = () => setHomeReady(true);
    const onLoadedData = () => { if (reducedMotion) revealAfterTwoSeconds(); };
    const startPlayback = () => {
      if (!restoredPosition) {
        restoredPosition = true;
        try {
          const saved = Number(window.sessionStorage.getItem(HOME_VIDEO_POSITION_KEY));
          if (Number.isFinite(saved) && saved > 0 && saved < video.duration - 0.5) video.currentTime = saved;
        } catch { /* Storage can be unavailable in private contexts. */ }
      }
      if (reducedMotion) {
        video.pause();
        revealAfterTwoSeconds();
      } else if (document.visibilityState === "visible") {
        void video.play().catch(revealOnFailure);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        savePosition();
        video.pause();
      } else if (!reducedMotion) {
        void video.play().catch(revealOnFailure);
      }
    };
    // Do not leave the page hidden if a video host or autoplay policy fails.
    const failSafe = window.setTimeout(revealOnFailure, 15_000);

    video.addEventListener("playing", revealAfterTwoSeconds, { once: true });
    video.addEventListener("loadeddata", onLoadedData, { once: true });
    video.addEventListener("loadedmetadata", startPlayback, { once: true });
    video.addEventListener("error", revealOnFailure, { once: true });
    video.addEventListener("timeupdate", savePosition);
    document.addEventListener("visibilitychange", onVisibilityChange);
    video.loop = true;
    video.preload = "auto";
    if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) video.load();

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) startPlayback();

    return () => {
      savePosition();
      video.pause();
      window.clearTimeout(revealTimer);
      window.clearTimeout(failSafe);
      video.removeEventListener("playing", revealAfterTwoSeconds);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("loadedmetadata", startPlayback);
      video.removeEventListener("error", revealOnFailure);
      video.removeEventListener("timeupdate", savePosition);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [introVisible]);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".home-site [data-reveal]"));
    if (!targets.length) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-revealed"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const startedAt = performance.now();
    const controller = new AbortController();
    let failSafe = 0;
    let exitTimer = 0;
    let spaceProgress = 0;
    let solarProgress = 0;
    const update = window.setInterval(() => {
      const elapsed = Math.min(1, (performance.now() - startedAt) / 3600);
      const combinedProgress = (spaceProgress + solarProgress) / 2;
      setProgress(Math.min(99, Math.floor(combinedProgress * 85 + elapsed * 15)));
    }, 60);
    const spaceElement = spaceVideo.current;
    const spacePreload = async () => {
      if (spaceElement) {
        await waitForBuffer(spaceElement, 8_000, controller.signal, (value) => { spaceProgress = value; });
      }
      spaceProgress = 1;
    };
    const solarController = new AbortController();
    const abortSolarPreload = () => solarController.abort();
    controller.signal.addEventListener("abort", abortSolarPreload, { once: true });
    const solarFailSafe = window.setTimeout(abortSolarPreload, 10_000);
    const solarPreload = (async () => {
      const solarVideo = solarSystemVideo.current;
      if (solarVideo) {
        solarVideo.preload = "auto";
        if (solarVideo.networkState === HTMLMediaElement.NETWORK_EMPTY) solarVideo.load();
        await waitForBuffer(solarVideo, 10_000, solarController.signal, (value) => { solarProgress = value; });
      }
      solarProgress = 1;
    })()
      .catch(() => { solarProgress = 1; })
      .finally(() => window.clearTimeout(solarFailSafe));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (spaceElement && !prefersReducedMotion) void spaceElement.play().catch(() => undefined);
    void Promise.all([spacePreload(), solarPreload]).then(() => {
      const remainingMs = Math.max(0, 3200 - (performance.now() - startedAt));
      exitTimer = window.setTimeout(() => {
        if (cancelled) return;
        setProgress(100);
        setIntroLeaving(true);
        window.setTimeout(() => setIntroVisible(false), 750);
      }, remainingMs);
    });
    failSafe = window.setTimeout(() => {
      controller.abort();
      window.clearTimeout(solarFailSafe);
      controller.signal.removeEventListener("abort", abortSolarPreload);
      if (cancelled) return;
      setProgress(100);
      setIntroLeaving(true);
      exitTimer = window.setTimeout(() => setIntroVisible(false), 850);
    }, 45_000);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(update);
      window.clearTimeout(failSafe);
      window.clearTimeout(exitTimer);
      window.clearTimeout(solarFailSafe);
      controller.signal.removeEventListener("abort", abortSolarPreload);
    };
  }, []);

  return (
    <>
      <SiteHeader activeTab="home" homeDocked={!introVisible} />
      <video
        ref={solarSystemVideo}
        className="home-background-video"
        src={ASSETS.solarSystemVideo}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="home-background-shade" aria-hidden="true" />
      <main className={homeReady ? "home-site is-ready" : "home-site"}>

      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-shade" />
        <div className="home-hero-copy">
          <p className="home-eyebrow">11th edition <span>·</span> 2026–27</p>
          <p className="home-kicker">Nirmala Memorial Foundation College of Commerce and Science</p>
          <h1 id="home-title">Decoding Infinity.<br /><em>Defining Tomorrow.</em></h1>
          <p className="home-theme">A journey through <strong>Space × AI</strong></p>
          <Link className="home-cta" href="/events">Explore the planets <span aria-hidden="true">↗</span></Link>
        </div>
        <a className="home-scroll" href="#about">Scroll to explore <span aria-hidden="true">↓</span></a>
      </section>

      <section className="home-about" id="about" aria-labelledby="about-title">
        <div className="section-heading" data-reveal><p className="home-eyebrow">The story behind the journey</p><h2 id="about-title">A place to explore<br /><em>what comes next.</em></h2></div>
        <div className="about-cards">
          <article className="about-card about-college" data-reveal><p className="home-eyebrow">About NMFC</p><h3>Nirmala Memorial Foundation College</h3>
            {SUN_ABOUT_PANELS.slice(0, 2).flatMap((panel) => panel.paragraphs).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
          <article className="about-card about-festival" data-reveal><p className="home-eyebrow">About Technotsav</p><h3>A technical festival since 2013</h3>
            {SUN_ABOUT_PANELS.slice(2).flatMap((panel) => panel.paragraphs).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        </div>
        <section className="home-event-lineup" aria-labelledby="event-lineup-title" data-reveal>
          <div className="home-event-heading">
            <div><p className="home-eyebrow">2026–27 event lineup</p><h3 id="event-lineup-title">Nine ways to join the orbit.</h3><p className="home-event-departments">Presented by {FESTIVAL_DETAILS.departments}</p></div>
            <p className="home-event-date">{FESTIVAL_DETAILS.date}</p>
          </div>
          <div className="home-event-grid">
            {FESTIVAL_EVENTS.map((event, index) => (
              <article className="home-event-card" key={event.name}>
                <span className="home-event-index">{String(index + 1).padStart(2, "0")}</span>
                <h4>{event.name}</h4>
                <p>{event.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="home-committee" aria-labelledby="committee-title" data-reveal>
          <div className="home-committee-heading">
            <p className="home-eyebrow">The people behind the mission</p>
            <h3 id="committee-title">Core Committee</h3>
            <p>Meet the student team coordinating this year’s festival.</p>
          </div>
          <div className="home-committee-grid">
            {CORE_COMMITTEE.map((member, index) => (
              <article className="home-committee-card" key={member.phone}>
                <span className="home-committee-index">{String(index + 1).padStart(2, "0")}</span>
                <h4>{member.name}</h4>
                <p>{member.role}</p>
                <a href={`tel:+91${member.phone}`} aria-label={`Call ${member.name} at +91 ${member.phone}`}>+91 {member.phone}</a>
              </article>
            ))}
          </div>
        </section>
        <div className="home-about-action" data-reveal><p>Explore the planets and their event panels.</p><Link className="home-cta" href="/events">Enter the event experience <span aria-hidden="true">↗</span></Link></div>
      </section>

      <SiteFooter />

      {introVisible && <div className={introLeaving ? "home-intro is-leaving" : "home-intro"} role="status" aria-live="polite" aria-label={`Loading Technotsav ${progress}%`}>
        <video ref={spaceVideo} className="home-intro-video" src={ASSETS.spaceVideo} muted playsInline preload="auto" crossOrigin={ASSETS.spaceVideo.startsWith(`${R2_MEDIA_ORIGIN}/`) ? "anonymous" : undefined} />
        <div className="home-intro-vignette" />
        <p className="home-intro-progress">{progress}<b>%</b></p>
      </div>}
      </main>
      {!introVisible && <>
        <button
          className="guide-launcher"
          type="button"
          ref={guideButton}
          aria-expanded={guideOpen}
          aria-controls="technotsav-guide-panel"
          onClick={() => setGuideOpen((open) => !open)}
        >
          <span className="guide-launcher-icon" aria-hidden="true">✦</span>
          <span>Ask the Guide</span>
        </button>
        {guideOpen && <TechnotsavGuide onClose={closeGuide} />}
      </>}
    </>
  );
}

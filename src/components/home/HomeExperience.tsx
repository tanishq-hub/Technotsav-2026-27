"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ASSETS, R2_MEDIA_ORIGIN, SUN_ABOUT_PANELS } from "@/lib/planets";
import { FESTIVAL_DETAILS, FESTIVAL_EVENTS } from "@/lib/festival";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { CustomCursor } from "@/components/shared/CustomCursor";
import "./home-experience.css";

const TechnotsavGuide = dynamic(
  () => import("@/components/home/TechnotsavGuide").then((module) => module.TechnotsavGuide),
  { loading: () => <div className="guide-loading" role="status">Opening the preset guide…</div> },
);

function isFullyBuffered(video: HTMLVideoElement) {
  for (let index = 0; index < video.buffered.length; index += 1) {
    if (video.buffered.start(index) < 0.1 && video.buffered.end(index) >= video.duration - 0.1) return true;
  }
  return false;
}

function waitForFullBuffer(video: HTMLVideoElement, timeout: number, signal: AbortSignal, onProgress: (value: number) => void) {
  return new Promise<boolean>((resolve) => {
    if (isFullyBuffered(video)) { onProgress(1); resolve(true); return; }
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
        onProgress(Math.min(1, end / video.duration));
      }
      if (isFullyBuffered(video)) finish(true);
    };
    const aborted = () => finish(false);
    video.addEventListener("progress", check);
    video.addEventListener("loadedmetadata", check);
    video.addEventListener("canplaythrough", check);
    signal.addEventListener("abort", aborted, { once: true });
    check();
  });
}

async function preloadVideo(url: string, signal: AbortSignal, onProgress: (fraction: number) => void = () => undefined) {
  const response = await fetch(url, { cache: "default", credentials: "omit", mode: "cors", signal });
  if (!response.ok || !response.body) throw new Error(`Video preload failed (${response.status})`);
  const total = Number(response.headers.get("content-length"));
  const reader = response.body.getReader();
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (total > 0) onProgress(Math.min(1, received / total));
  }
  onProgress(1);
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
    // Warm both route entry videos in parallel while the visitor is on Home.
    void Promise.all([
      preloadVideo(ASSETS.sunVideo, controller.signal).catch(() => undefined),
      preloadVideo(ASSETS.mercuryVideo, controller.signal).catch(() => undefined),
    ]);
    return () => controller.abort();
  }, [homeReady]);

  useEffect(() => {
    if (introVisible) return;
    const video = solarSystemVideo.current;
    if (!video) { setHomeReady(true); return; }

    let revealTimer = 0;
    let revealScheduled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealAfterTwoSeconds = () => {
      if (revealScheduled) return;
      revealScheduled = true;
      revealTimer = window.setTimeout(() => setHomeReady(true), 2000);
    };
    const revealOnFailure = () => setHomeReady(true);
    const onLoadedData = () => { if (reducedMotion) revealAfterTwoSeconds(); };
    // Do not leave the page hidden if a video host or autoplay policy fails.
    const failSafe = window.setTimeout(revealOnFailure, 15_000);

    video.addEventListener("playing", revealAfterTwoSeconds, { once: true });
    video.addEventListener("loadeddata", onLoadedData, { once: true });
    video.addEventListener("error", revealOnFailure, { once: true });
    video.preload = "auto";
    video.load();

    if (reducedMotion) {
      video.pause();
    } else {
      void video.play().catch(revealOnFailure);
    }

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(failSafe);
      video.removeEventListener("playing", revealAfterTwoSeconds);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("error", revealOnFailure);
    };
  }, [introVisible]);

  useEffect(() => {
    let cancelled = false;
    const startedAt = performance.now();
    const controller = new AbortController();
    let failSafe = 0;
    let exitTimer = 0;
    let spaceProgress = 0;
    let solarProgress = 0;
    const update = window.setInterval(() => {
      const elapsed = Math.min(1, (performance.now() - startedAt) / 5000);
      const combinedProgress = (spaceProgress + solarProgress) / 2;
      setProgress(Math.min(99, Math.floor(combinedProgress * 89 + elapsed * 10)));
    }, 80);
    const spaceElement = spaceVideo.current;
    const spacePreload = async () => {
      if (spaceElement && await waitForFullBuffer(spaceElement, 12_000, controller.signal, (value) => { spaceProgress = value; })) return;
      try {
        await preloadVideo(ASSETS.spaceVideo, controller.signal, (value) => { spaceProgress = value; });
      } catch { /* the Home page remains usable if the loading-screen video host is unavailable */ }
    };
    const solarController = new AbortController();
    const abortSolarPreload = () => solarController.abort();
    controller.signal.addEventListener("abort", abortSolarPreload, { once: true });
    const solarFailSafe = window.setTimeout(abortSolarPreload, 15_000);
    const solarPreload = preloadVideo(ASSETS.solarSystemVideo, solarController.signal, (value) => { solarProgress = value; })
      .catch(() => { solarProgress = 1; })
      .finally(() => window.clearTimeout(solarFailSafe));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (spaceElement && !prefersReducedMotion) void spaceElement.play().catch(() => undefined);
    void Promise.all([spacePreload(), solarPreload]).then(() => {
      const remainingMs = Math.max(0, 5000 - (performance.now() - startedAt));
      exitTimer = window.setTimeout(() => {
        if (cancelled) return;
        setProgress(100);
        setIntroLeaving(true);
        window.setTimeout(() => setIntroVisible(false), 850);
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
      <CustomCursor />
      <main className={homeReady ? "home-site is-ready" : "home-site"}>

      <section className="home-hero" aria-labelledby="home-title">
        <video
          ref={solarSystemVideo}
          className="home-hero-video"
          src={ASSETS.solarSystemVideo}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
        />
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
        <div className="section-heading"><p className="home-eyebrow">The story behind the journey</p><h2 id="about-title">A place to explore<br /><em>what comes next.</em></h2></div>
        <div className="about-cards">
          <article className="about-card about-college"><p className="home-eyebrow">About NMFC</p><h3>Nirmala Memorial Foundation College</h3>
            {SUN_ABOUT_PANELS.slice(0, 2).flatMap((panel) => panel.paragraphs).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
          <article className="about-card about-festival"><p className="home-eyebrow">About Technotsav</p><h3>A technical festival since 2013</h3>
            {SUN_ABOUT_PANELS.slice(2).flatMap((panel) => panel.paragraphs).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        </div>
        <section className="home-event-lineup" aria-labelledby="event-lineup-title">
          <div className="home-event-heading">
            <div><p className="home-eyebrow">2026–27 event lineup</p><h3 id="event-lineup-title">Eight ways to join the orbit.</h3><p className="home-event-departments">Presented by {FESTIVAL_DETAILS.departments}</p></div>
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
        <div className="home-about-action"><p>Explore the planets and their event panels.</p><Link className="home-cta" href="/events">Enter the event experience <span aria-hidden="true">↗</span></Link></div>
      </section>

      <SiteFooter />

      {introVisible && <div className={introLeaving ? "home-intro is-leaving" : "home-intro"} role="status" aria-live="polite" aria-label={`Loading Technotsav ${progress}%`}>
        <video ref={spaceVideo} className="home-intro-video" src={ASSETS.spaceVideo} muted playsInline preload="auto" crossOrigin={ASSETS.spaceVideo.startsWith(`${R2_MEDIA_ORIGIN}/`) ? "anonymous" : undefined} />
        <div className="home-intro-vignette" />
        <div className="home-intro-brand">
          <img className="home-intro-edition" src="/technotsav-11th-edition.png" alt="" />
          <img className="home-intro-wordmark" src="/technotsav-wordmark-horizontal.png" alt="Technotsav" />
          <img className="home-intro-theme" src="/technotsav-space-ai.png" alt="Space × AI" />
        </div>
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

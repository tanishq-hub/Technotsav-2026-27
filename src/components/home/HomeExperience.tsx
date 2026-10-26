"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ASSETS, R2_MEDIA_ORIGIN, SUN_ABOUT_PANELS } from "@/lib/planets";
import { EVENT_TIME_ZONE, TECHNOTSAV_EVENT_START } from "@/lib/event-time";
import { SolarSystemArtwork } from "@/components/home/SolarSystemArtwork";
import "./home-experience.css";

function remaining(now: number) {
  const seconds = Math.max(0, Math.floor((TECHNOTSAV_EVENT_START - now) / 1000));
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}
type Countdown = ReturnType<typeof remaining>;

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
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [introVisible, setIntroVisible] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => setCountdown(remaining(Date.now()));
    const firstFrame = requestAnimationFrame(update);
    const timer = window.setInterval(update, 1000);
    return () => { cancelAnimationFrame(firstFrame); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (introVisible) return;
    const controller = new AbortController();
    // Home's CSS solar system is now visible. Warm the Sun video quietly so
    // Events can begin on it without loading it during the Space intro.
    void preloadVideo(ASSETS.sunVideo, controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [introVisible]);

  useEffect(() => {
    let cancelled = false;
    const startedAt = performance.now();
    const controller = new AbortController();
    let failSafe = 0;
    let exitTimer = 0;
    let spaceProgress = 0;
    const update = window.setInterval(() => {
      const elapsed = Math.min(1, (performance.now() - startedAt) / 5000);
      setProgress(Math.min(99, Math.floor(spaceProgress * 89 + elapsed * 10)));
    }, 80);
    const spaceElement = spaceVideo.current;
    const spacePreload = async () => {
      if (spaceElement && await waitForFullBuffer(spaceElement, 12_000, controller.signal, (value) => { spaceProgress = value; })) return;
      try {
        await preloadVideo(ASSETS.spaceVideo, controller.signal, (value) => { spaceProgress = value; });
      } catch { /* the Home page remains usable if the loading-screen video host is unavailable */ }
    };
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (spaceElement && !prefersReducedMotion) void spaceElement.play().catch(() => undefined);
    void spacePreload().then(() => {
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
    };
  }, []);

  return (
    <main className="home-site">
      <header className="home-header">
        <Link className="home-brand" href="/" aria-label="Technotsav home">
          <img src="/technotsav-wordmark-horizontal.png" alt="Technotsav" />
          <span>SPACE <i>×</i> AI</span>
        </Link>
        <nav className="home-nav" aria-label="Main navigation">
          <Link href="/" aria-current="page">Home</Link><Link href="/events">Events</Link><Link href="/registration">Registration</Link>
        </nav>
      </header>

      <section className="home-hero" aria-labelledby="home-title">
        <SolarSystemArtwork className="home-solar-art" />
        <div className="home-hero-shade" />
        <div className="home-hero-copy">
          <p className="home-eyebrow">11th edition <span>·</span> 2026–27</p>
          <p className="home-kicker">Nirmala Memorial Foundation College of Commerce and Science</p>
          <h1 id="home-title">Decoding Infinity.<br /><em>Defining Tomorrow.</em></h1>
          <p className="home-theme">A journey through <strong>Space × AI</strong></p>
          <Link className="home-cta" href="/events">Explore the planets <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="home-countdown" role="timer" aria-label={countdown ? `Technotsav begins in ${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, and ${countdown.seconds} seconds, India time` : "Countdown to Technotsav in India time"}>
          <span className="home-countdown-label">T−</span>
          <span>{countdown ? String(countdown.days).padStart(2, "0") : "--"}<small>days</small></span><i>:</i>
          <span>{countdown ? String(countdown.hours).padStart(2, "0") : "--"}<small>hours</small></span><i>:</i>
          <span>{countdown ? String(countdown.minutes).padStart(2, "0") : "--"}<small>min</small></span><i>:</i>
          <span>{countdown ? String(countdown.seconds).padStart(2, "0") : "--"}<small>sec</small></span><b>{EVENT_TIME_ZONE === "Asia/Kolkata" ? "IST" : EVENT_TIME_ZONE}</b>
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
            <ul>{SUN_ABOUT_PANELS[3].highlights?.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
        <div className="home-about-action"><p>Explore the planets and their event panels.</p><Link className="home-cta" href="/events">Enter the event experience <span aria-hidden="true">↗</span></Link></div>
      </section>

      <footer className="home-footer"><span>Technotsav 2026–27 · Space × AI</span><span>Decoding Infinity. Defining Tomorrow.</span></footer>

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
  );
}

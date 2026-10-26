"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ASSETS, R2_MEDIA_ORIGIN } from "@/lib/planets";
import { FESTIVAL_DETAILS } from "@/lib/festival";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { CustomCursor } from "@/components/shared/CustomCursor";
import "./registration.css";

export default function RegistrationPage() {
  const sunVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = sunVideo.current;
    if (!video) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const play = () => {
      if (!reducedMotion) void video.play().catch(() => undefined);
      else video.pause();
    };
    video.addEventListener("canplay", play, { once: true });
    video.load();
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) play();
    return () => { video.removeEventListener("canplay", play); video.pause(); };
  }, []);

  return (
    <>
      <SiteHeader activeTab="registration" />
      <CustomCursor />
      <main className="registration-page">
      <video
        ref={sunVideo}
        className="registration-sun-video"
        src={ASSETS.sunVideo}
        muted
        loop
        playsInline
        preload="metadata"
        crossOrigin={ASSETS.sunVideo.startsWith(`${R2_MEDIA_ORIGIN}/`) ? "anonymous" : undefined}
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="registration-video-shade" aria-hidden="true" />
      <section className="registration-content">
        <p>11th edition · 2026–27</p>
        <h1>Registration</h1>
        <div className="registration-rule" />
        <p className="registration-note">Registration details will be added when the confirmed form fields and process are ready.</p>
        <p className="registration-event-date">{FESTIVAL_DETAILS.date}</p>
        <Link className="registration-back" href="/">Return to Home <span aria-hidden="true">↗</span></Link>
      </section>
      <SiteFooter />
      </main>
    </>
  );
}

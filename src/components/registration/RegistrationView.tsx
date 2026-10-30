"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ASSETS, R2_MEDIA_ORIGIN } from "@/lib/planets";
import { FESTIVAL_DETAILS } from "@/lib/festival";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { RegistrationForm } from "@/components/registration/RegistrationForm";
import "@/app/registration/registration.css";

export function RegistrationView() {
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
    if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) video.load();
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) play();
    return () => {
      video.removeEventListener("canplay", play);
      video.pause();
    };
  }, []);

  return (
    <>
      <SiteHeader activeTab="registration" />
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
          <div className="registration-intro">
            <p>11th edition · 2026–27</p>
            <h1>Registration</h1>
            <div className="registration-rule" />
            <p className="registration-note">
              Choose a registration type, then provide the details for your event. Use the names exactly as they should appear on certificates.
            </p>
            <p className="registration-event-date">{FESTIVAL_DETAILS.date}</p>
          </div>
          <RegistrationForm />
          <Link className="registration-back" href="/">
            Return to Home <span aria-hidden="true">↗</span>
          </Link>
        </section>
        <SiteFooter />
      </main>
    </>
  );
}


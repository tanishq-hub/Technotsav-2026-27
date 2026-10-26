"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { EVENT_TIME_ZONE, TECHNOTSAV_EVENT_START } from "@/lib/event-time";

type CountdownParts = { days: number; hours: number; minutes: number; seconds: number };
type SiteTab = "home" | "events" | "registration";

const tabs: { id: SiteTab; label: string; href: string }[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "events", label: "Events", href: "/events" },
  { id: "registration", label: "Registration", href: "/registration" },
];

function remaining(now: number): CountdownParts {
  const seconds = Math.max(0, Math.floor((TECHNOTSAV_EVENT_START - now) / 1000));
  return {
    days: Math.floor(seconds / 86_400),
    hours: Math.floor((seconds % 86_400) / 3_600),
    minutes: Math.floor((seconds % 3_600) / 60),
    seconds: seconds % 60,
  };
}

export function SiteHeader({ activeTab, homeDocked = true, mobileScrolledAway = false, trailing }: {
  activeTab: SiteTab;
  homeDocked?: boolean;
  mobileScrolledAway?: boolean;
  trailing?: ReactNode;
}) {
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const update = () => setCountdown(remaining(Date.now()));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const total = countdown
    ? `${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds`
    : "to midnight IST on November 27, 2026";

  return (
    <header
      className="site-header"
      data-active-tab={activeTab}
      data-home-docked={homeDocked}
      data-mobile-away={mobileScrolledAway}
      aria-hidden={mobileScrolledAway || undefined}
      inert={mobileScrolledAway}
    >
      <div className="site-header-inner">
        <Link className="site-brand" href="/" aria-label="Technotsav, 11th edition, Space × AI — Home">
          <img className="site-brand-edition" src="/technotsav-11th-edition.png" alt="11th edition" />
          <img className="site-brand-wordmark" src="/technotsav-wordmark-horizontal.png" alt="Technotsav" />
          <img className="site-brand-theme" src="/technotsav-space-ai.png" alt="Space × AI" />
        </Link>

        <div className="site-countdown" role="timer" aria-live="off" aria-label={`Technotsav countdown: ${total}`} data-complete={countdown?.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0}>
          <span className="site-countdown-label">T−</span>
          <span className="site-countdown-unit"><strong>{countdown ? String(countdown.days).padStart(2, "0") : "--"}</strong><small>Days</small></span>
          <span className="site-countdown-separator">:</span>
          <span className="site-countdown-unit"><strong>{countdown ? String(countdown.hours).padStart(2, "0") : "--"}</strong><small>Hours</small></span>
          <span className="site-countdown-separator">:</span>
          <span className="site-countdown-unit"><strong>{countdown ? String(countdown.minutes).padStart(2, "0") : "--"}</strong><small>Minutes</small></span>
          <span className="site-countdown-separator">:</span>
          <span className="site-countdown-unit"><strong>{countdown ? String(countdown.seconds).padStart(2, "0") : "--"}</strong><small>Seconds</small></span>
          <span className="site-countdown-zone">{EVENT_TIME_ZONE === "Asia/Kolkata" ? "IST" : EVENT_TIME_ZONE}</span>
        </div>

        <div className="site-header-controls">
          <nav className="site-nav" aria-label="Main navigation">
            {tabs.map((tab) => (
              <Link key={tab.id} href={tab.href} aria-current={activeTab === tab.id ? "page" : undefined}>
                {tab.label}
              </Link>
            ))}
          </nav>
          {trailing}
        </div>
      </div>
    </header>
  );
}

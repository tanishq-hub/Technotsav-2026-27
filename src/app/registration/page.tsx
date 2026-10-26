import Link from "next/link";
import { SolarSystemArtwork } from "@/components/home/SolarSystemArtwork";
import "./registration.css";

/* eslint-disable @next/next/no-img-element */

export default function RegistrationPage() {
  return (
    <main className="registration-page">
      <SolarSystemArtwork className="registration-solar-art" />
      <header className="registration-header">
        <Link href="/" className="registration-brand"><img src="/technotsav-wordmark-horizontal.png" alt="Technotsav" /><span>SPACE × AI</span></Link>
        <nav aria-label="Main navigation"><Link href="/">Home</Link><Link href="/events">Events</Link><Link href="/registration" aria-current="page">Registration</Link></nav>
      </header>
      <section className="registration-content">
        <p>11th edition · 2026–27</p>
        <h1>Registration</h1>
        <div className="registration-rule" />
        <p className="registration-note">Registration details will be added when the confirmed form fields and process are ready.</p>
        <Link className="registration-back" href="/">Return to Home <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}

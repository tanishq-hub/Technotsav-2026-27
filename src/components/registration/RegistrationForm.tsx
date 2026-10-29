"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { GROUP_REGISTRATION_EVENTS, INDIVIDUAL_REGISTRATION_EVENTS, ORBITAL_EXPO_GOOGLE_FORM_URL } from "@/lib/registration";

type RegistrationType = "group" | "individual";
type SubmitState = "idle" | "submitting" | "success" | "error";

export function RegistrationForm() {
  const [type, setType] = useState<RegistrationType>("individual");
  const [groupEventId, setGroupEventId] = useState<(typeof GROUP_REGISTRATION_EVENTS)[number]["id"]>(GROUP_REGISTRATION_EVENTS[0].id);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const successDialog = useRef<HTMLDialogElement>(null);
  const selectedGroupEvent = GROUP_REGISTRATION_EVENTS.find((event) => event.id === groupEventId) ?? GROUP_REGISTRATION_EVENTS[0];
  const isExternalGroupEvent = type === "group" && selectedGroupEvent.id === "orbital-expo";
  const externalFormUrl = ("externalUrl" in selectedGroupEvent && selectedGroupEvent.externalUrl) || ORBITAL_EXPO_GOOGLE_FORM_URL;

  useEffect(() => {
    const dialog = successDialog.current;
    if (!dialog) return;
    if (successDialogOpen && !dialog.open) dialog.showModal();
    if (!successDialogOpen && dialog.open) dialog.close();
  }, [successDialogOpen]);

  function switchType(nextType: RegistrationType) {
    setType(nextType);
    setStatus("idle");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isExternalGroupEvent) {
      window.open(externalFormUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setStatus("submitting");
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const common = {
      collegeName: String(formData.get("collegeName") ?? "").trim(),
      classRepName: String(formData.get("classRepName") ?? "").trim(),
      classRepPhone: String(formData.get("classRepPhone") ?? "").trim(),
      companyWebsite: String(formData.get("companyWebsite") ?? "").trim(),
    };
    const payload = type === "group"
      ? {
          ...common,
          registrationType: type,
          eventId: groupEventId,
          groupName: String(formData.get("groupName") ?? "").trim(),
          participants: Array.from({ length: selectedGroupEvent.max }, (_, index) => String(formData.get(`participant${index + 1}`) ?? "").trim()).filter(Boolean),
          leaderPhone: String(formData.get("leaderPhone") ?? "").trim(),
          alternatePhone: String(formData.get("alternatePhone") ?? "").trim(),
          leaderEmail: String(formData.get("leaderEmail") ?? "").trim(),
        }
      : {
          ...common,
          registrationType: type,
          eventId: String(formData.get("individualEvent") ?? ""),
          participantName: String(formData.get("participantName") ?? "").trim(),
          participantPhone: String(formData.get("participantPhone") ?? "").trim(),
        };

    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "We could not submit your registration. Please try again.");
      setStatus("success");
      setMessage("");
      setSuccessDialogOpen(true);
      form.reset();
      setType("individual");
      setGroupEventId(GROUP_REGISTRATION_EVENTS[0].id);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We could not submit your registration. Please try again.");
    }
  }

  return (
    <form className="registration-form" onSubmit={submit} aria-describedby="registration-submit-status">
      <div className="registration-form-heading">
        <span className="registration-step">REGISTRATION · 01</span>
        <h2>Tell us who’s joining.</h2>
        <p>One submission is for one event. All participant names are collected for certificates.</p>
      </div>

      <div className="registration-fields">
        <label className="registration-field registration-field-wide" htmlFor="college-name">
          <span>College Name <b aria-hidden="true">*</b></span>
          <input id="college-name" name="collegeName" type="text" autoComplete="organization" maxLength={120} placeholder="Enter your college name" required />
        </label>
        <label className="registration-field" htmlFor="class-rep-name">
          <span>Full Name of CL <small>(if applicable)</small></span>
          <input id="class-rep-name" name="classRepName" type="text" autoComplete="name" maxLength={100} placeholder="Enter the class representative’s name" />
        </label>
        <label className="registration-field" htmlFor="class-rep-phone">
          <span>CL WhatsApp <small>(if applicable)</small></span>
          <input id="class-rep-phone" name="classRepPhone" type="tel" inputMode="tel" autoComplete="tel" pattern="(?:\+?91[\s-]?)?[6-9][0-9\s-]{9,13}" title="Enter a valid Indian mobile number, with or without +91." placeholder="10-digit mobile number" />
        </label>
      </div>

      <fieldset className="registration-type-picker">
        <legend>Registration type <b aria-hidden="true">*</b></legend>
        <div className="registration-type-options">
          <label className={type === "individual" ? "registration-type-option is-selected" : "registration-type-option"}>
            <input type="radio" name="registrationType" value="individual" checked={type === "individual"} onChange={() => switchType("individual")} />
            <span className="registration-radio-mark" aria-hidden="true" />
            <span><strong>Individual</strong><small>One participant</small></span>
          </label>
          <label className={type === "group" ? "registration-type-option is-selected" : "registration-type-option"}>
            <input type="radio" name="registrationType" value="group" checked={type === "group"} onChange={() => switchType("group")} />
            <span className="registration-radio-mark" aria-hidden="true" />
            <span><strong>Group</strong><small>Team event</small></span>
          </label>
        </div>
      </fieldset>

      <div className="registration-conditional" key={type}>
        {type === "group" ? (
          <section className="registration-mode-section" aria-labelledby="group-details-title">
            <div className="registration-section-heading"><span>02A</span><h3 id="group-details-title">Group details</h3></div>
            <div className="registration-fields">
              <label className="registration-field registration-field-wide" htmlFor="group-event">
                <span>Group Event <b aria-hidden="true">*</b></span>
                <select id="group-event" value={groupEventId} onChange={(event) => setGroupEventId(event.target.value as typeof groupEventId)}>
                  {GROUP_REGISTRATION_EVENTS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
                </select>
              </label>
              {isExternalGroupEvent ? (
                <div className="registration-external-card registration-field-wide">
                  <div className="registration-external-badge">
                    <span aria-hidden="true">✦</span>
                    <span>Google Form Registration</span>
                  </div>
                  <h3>Orbital Expo · Team Registration</h3>
                  <p className="registration-external-intro">
                    Registrations and project submissions for <strong>Orbital Expo</strong> are conducted exclusively through Google Forms. Please use the link below to submit your project title, team members, and abstract.
                  </p>
                  <div className="registration-external-metrics">
                    <div className="registration-external-metric">
                      <span className="metric-label">Team Size</span>
                      <span className="metric-value">2 to 4 Participants</span>
                    </div>
                    <div className="registration-external-metric">
                      <span className="metric-label">Event Date</span>
                      <span className="metric-value">Friday, 27 November 2026</span>
                    </div>
                    <div className="registration-external-metric">
                      <span className="metric-label">Format</span>
                      <span className="metric-value">Intercollegiate Exhibition</span>
                    </div>
                  </div>
                  <div className="registration-external-cta-box">
                    <a
                      className="registration-google-form-btn"
                      href={externalFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Open Orbital Expo Google Form</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                    <p className="registration-external-help">
                      Opens in a new tab. Ensure all team members&apos; details and project summaries are filled accurately.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <label className="registration-field registration-field-wide" htmlFor="group-name">
                    <span>Group Name <b aria-hidden="true">*</b></span>
                    <input id="group-name" name="groupName" type="text" maxLength={80} placeholder="Enter your group name" required />
                  </label>
                  <div className="registration-participant-fields registration-field-wide">
                    <div className="registration-participant-heading">
                      <span>Full names of participants <b aria-hidden="true">*</b></span>
                      <small>{selectedGroupEvent.min === selectedGroupEvent.max ? `Exactly ${selectedGroupEvent.max} participants` : `${selectedGroupEvent.min}–${selectedGroupEvent.max} participants`}</small>
                    </div>
                    {Array.from({ length: selectedGroupEvent.max }, (_, index) => {
                      const required = index < selectedGroupEvent.min;
                      return (
                        <label className="registration-field" htmlFor={`group-participant-${index + 1}`} key={`${groupEventId}-${index}`}>
                          <span>Participant {index + 1}{required ? <b aria-hidden="true"> *</b> : <small> (optional)</small>}</span>
                          <input id={`group-participant-${index + 1}`} name={`participant${index + 1}`} type="text" autoComplete="name" maxLength={100} placeholder={`Name as it should appear on the certificate`} required={required} />
                        </label>
                      );
                    })}
                  </div>
                  <label className="registration-field" htmlFor="leader-phone">
                    <span>Group Leader WhatsApp <b aria-hidden="true">*</b></span>
                    <input id="leader-phone" name="leaderPhone" type="tel" inputMode="tel" autoComplete="tel" pattern="(?:\+?91[\s-]?)?[6-9][0-9\s-]{9,13}" title="Enter a valid Indian mobile number, with or without +91." placeholder="10-digit mobile number" required />
                  </label>
                  <label className="registration-field" htmlFor="alternate-phone">
                    <span>Alternate WhatsApp <b aria-hidden="true">*</b></span>
                    <input id="alternate-phone" name="alternatePhone" type="tel" inputMode="tel" autoComplete="tel" pattern="(?:\+?91[\s-]?)?[6-9][0-9\s-]{9,13}" title="Enter a valid Indian mobile number, with or without +91." placeholder="10-digit mobile number" required />
                  </label>
                  <label className="registration-field registration-field-wide" htmlFor="leader-email">
                    <span>Group Leader Email <b aria-hidden="true">*</b></span>
                    <input id="leader-email" name="leaderEmail" type="email" autoComplete="email" maxLength={254} placeholder="name@example.com" required />
                  </label>
                </>
              )}
            </div>
          </section>
        ) : (
          <section className="registration-mode-section" aria-labelledby="individual-details-title">
            <div className="registration-section-heading"><span>02B</span><h3 id="individual-details-title">Individual details</h3></div>
            <div className="registration-fields">
              <label className="registration-field registration-field-wide" htmlFor="individual-event">
                <span>Individual Event <b aria-hidden="true">*</b></span>
                <select id="individual-event" name="individualEvent" required>
                  <option value="" disabled>Select an event</option>
                  {INDIVIDUAL_REGISTRATION_EVENTS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label className="registration-field registration-field-wide" htmlFor="individual-name">
                <span>Full Name <small>(as it should appear on the certificate)</small> <b aria-hidden="true">*</b></span>
                <input id="individual-name" name="participantName" type="text" autoComplete="name" maxLength={100} placeholder="Enter your full name" required />
              </label>
              <label className="registration-field registration-field-wide" htmlFor="individual-phone">
                <span>WhatsApp Number <b aria-hidden="true">*</b></span>
                <input id="individual-phone" name="participantPhone" type="tel" inputMode="tel" autoComplete="tel" pattern="(?:\+?91[\s-]?)?[6-9][0-9\s-]{9,13}" title="Enter a valid Indian mobile number, with or without +91." placeholder="10-digit mobile number" required />
              </label>
            </div>
          </section>
        )}
      </div>

      <label className="registration-honeypot" aria-hidden="true" tabIndex={-1}>
        Leave this field empty
        <input name="companyWebsite" type="text" autoComplete="off" tabIndex={-1} />
      </label>

      <div className="registration-submit-row">
        {isExternalGroupEvent ? (
          <>
            <p className="registration-required-note">
              Registration for Orbital Expo is collected on Google Forms.
            </p>
            <a
              className="registration-submit"
              href={externalFormUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Google Form <span aria-hidden="true">↗</span>
            </a>
          </>
        ) : (
          <>
            <p className="registration-required-note"><b aria-hidden="true">*</b> Required fields</p>
            <button className="registration-submit" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Sending registration…" : "Submit registration"}<span aria-hidden="true">↗</span>
            </button>
          </>
        )}
      </div>
      <p
        id="registration-submit-status"
        className={`registration-submit-status is-${status}`}
        role={status === "success" || status === "error" ? "alert" : "status"}
        aria-live={status === "error" ? "assertive" : "polite"}
      >
        {message}
      </p>
      <dialog
        ref={successDialog}
        className="registration-success-dialog"
        aria-labelledby="registration-success-title"
        aria-describedby="registration-success-message"
        onClose={() => setSuccessDialogOpen(false)}
      >
        <span className="registration-success-icon" aria-hidden="true">✓</span>
        <p className="registration-success-eyebrow">TRANSMISSION CONFIRMED</p>
        <h3 id="registration-success-title">Registration complete</h3>
        <p id="registration-success-message">Thank you! Your registration was successful.</p>
        <button type="button" onClick={() => setSuccessDialogOpen(false)} autoFocus>Continue</button>
      </dialog>
    </form>
  );
}

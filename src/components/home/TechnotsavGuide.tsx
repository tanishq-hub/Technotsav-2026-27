"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { getGuideResponse, GUIDE_SUGGESTIONS } from "@/data/guide-responses";

type Message = { id: number; role: "visitor" | "guide"; text: string };

const welcome = "Hi, I’m the Technotsav Guide. I use preset answers from confirmed information, not live AI. What would you like to know?";

export function TechnotsavGuide({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: "guide", text: welcome }]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const nextMessageId = useRef(1);

  useEffect(() => {
    input.current?.focus();
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    const node = transcript.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, thinking]);

  const ask = (raw: string) => {
    const question = raw.trim();
    if (!question || thinking) return;
    const visitorId = nextMessageId.current++;
    const answerId = nextMessageId.current++;
    const response = getGuideResponse(question);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDraft("");
    setAnnouncement("");
    setThinking(true);
    setMessages((current) => [...current, { id: visitorId, role: "visitor", text: question }]);
    timer.current = window.setTimeout(() => {
      setThinking(false);
      if (reducedMotion) {
        setMessages((current) => [...current, { id: answerId, role: "guide", text: response }]);
        setAnnouncement(response);
        return;
      }

      let visibleLength = 0;
      const typeNextChunk = () => {
        visibleLength = Math.min(response.length, visibleLength + 2);
        const text = response.slice(0, visibleLength);
        setMessages((current) => {
          const existing = current.findIndex((message) => message.id === answerId);
          if (existing < 0) return [...current, { id: answerId, role: "guide", text }];
          return current.map((message) => message.id === answerId ? { ...message, text } : message);
        });
        if (visibleLength < response.length) timer.current = window.setTimeout(typeNextChunk, 22);
        else setAnnouncement(response);
      };
      typeNextChunk();
    }, reducedMotion ? 0 : 420);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(draft);
  };

  return (
    <section id="technotsav-guide-panel" className="guide-panel" aria-label="Technotsav preset answer guide">
      <header className="guide-header">
        <div className="guide-heading-mark" aria-hidden="true"><span>✦</span></div>
        <div className="guide-heading-copy">
          <h2>Technotsav Guide</h2>
          <p>PRESET ANSWERS · NOT LIVE AI</p>
        </div>
        <button className="guide-close" type="button" onClick={onClose} aria-label="Close Technotsav Guide">×</button>
      </header>

      <div className="guide-transcript" ref={transcript} role="log" aria-live="off" aria-relevant="additions text">
        {messages.map((message) => (
          <article className={`guide-message guide-message-${message.role}`} key={message.id}>
            {message.role === "guide" && <span className="guide-avatar" aria-hidden="true">T</span>}
            <p>{message.text}</p>
          </article>
        ))}
        {thinking && <div className="guide-message guide-message-guide" role="status" aria-label="Guide is preparing a preset answer">
          <span className="guide-avatar" aria-hidden="true">T</span>
          <div className="guide-thinking" aria-hidden="true"><i /><i /><i /></div>
        </div>}
        {!thinking && messages.length === 1 && <div className="guide-suggestions" aria-label="Suggested questions">
          {GUIDE_SUGGESTIONS.map((suggestion) => <button type="button" key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>)}
        </div>}
      </div>
      <p className="guide-sr-only" role="status" aria-live="polite">{announcement}</p>

      <form className="guide-composer" onSubmit={submit}>
        <label className="guide-input-label" htmlFor="technotsav-guide-input">Ask about the festival</label>
        <div className="guide-input-row">
          <input
            ref={input}
            id="technotsav-guide-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a question…"
            autoComplete="off"
            maxLength={240}
            disabled={thinking}
          />
          <button type="submit" disabled={thinking || !draft.trim()} aria-label="Send question">↑</button>
        </div>
        <p className="guide-disclaimer">Replies come from confirmed preset information.</p>
      </form>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { getGuideFollowUps, getGuideResponse, GUIDE_SUGGESTIONS } from "@/data/guide-responses";

type Message = { id: number; role: "visitor" | "guide"; text: string; suggestions?: string[] };

const welcome = "Hi, I’m the Technotsav Guide. I use preset answers from confirmed information, not live AI. What would you like to know?";

export function TechnotsavGuide({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: "guide", text: welcome, suggestions: GUIDE_SUGGESTIONS }]);
  const [thinking, setThinking] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const transcript = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const nextMessageId = useRef(1);

  useEffect(() => {
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
    if (thinking) return;
    const visitorId = nextMessageId.current++;
    const answerId = nextMessageId.current++;
    const response = getGuideResponse(question);
    const suggestions = getGuideFollowUps(question);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setAnnouncement("");
    setThinking(true);
    setMessages((current) => [...current, { id: visitorId, role: "visitor", text: question }]);
    timer.current = window.setTimeout(() => {
      setThinking(false);
      if (reducedMotion) {
        setMessages((current) => [...current, { id: answerId, role: "guide", text: response, suggestions }]);
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
          return current.map((message) => message.id === answerId
            ? { ...message, text, ...(visibleLength === response.length ? { suggestions } : {}) }
            : message);
        });
        if (visibleLength < response.length) timer.current = window.setTimeout(typeNextChunk, 22);
        else setAnnouncement(response);
      };
      typeNextChunk();
    }, reducedMotion ? 0 : 420);
  };

  const latestGuideId = [...messages].reverse().find((message) => message.role === "guide")?.id;

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
          <div className={`guide-turn guide-turn-${message.role}`} key={message.id}>
            <article className={`guide-message guide-message-${message.role}`}>
              {message.role === "guide" && <span className="guide-avatar" aria-hidden="true">T</span>}
              <p>{message.text}</p>
            </article>
            {message.role === "guide" && message.id === latestGuideId && message.suggestions && !thinking && <div className="guide-suggestions" aria-label="Choose a follow-up question">
              {message.suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>)}
            </div>}
          </div>
        ))}
        {thinking && <div className="guide-message guide-message-guide" role="status" aria-label="Guide is preparing a preset answer">
          <span className="guide-avatar" aria-hidden="true">T</span>
          <div className="guide-thinking" aria-hidden="true"><i /><i /><i /></div>
        </div>}
      </div>
      <p className="guide-sr-only" role="status" aria-live="polite">{announcement}</p>

      <p className="guide-disclaimer">Select a question to continue. Replies use confirmed preset information.</p>
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = cursor.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || !finePointer.matches) return;

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let frame = 0;
    let lastTime = 0;

    const animate = (time: number) => {
      if (!lastTime) lastTime = time;
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      // Delta-time based smooth glide (adapts seamlessly across 60Hz, 120Hz, and 144Hz displays)
      const factor = 1 - Math.exp(-dt * 0.016);
      x += (targetX - x) * factor;
      y += (targetY - y) * factor;
      node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.1) {
        frame = requestAnimationFrame(animate);
      } else {
        x = targetX;
        y = targetY;
        node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        frame = 0;
        lastTime = 0;
      }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        leave();
        return;
      }

      // Only suppress the operating-system pointer after this cursor is ready to draw.
      // This prevents a blank pointer during hydration or when this component is unavailable.
      document.documentElement.dataset.customCursor = "active";
      targetX = event.clientX;
      targetY = event.clientY;
      node.classList.add("is-visible");
      node.classList.toggle("is-enter", Boolean(
        (event.target as Element | null)?.closest?.("a, button, [role='button'], input, select, textarea, [tabindex]:not([tabindex='-1'])"),
      ));
      node.classList.toggle("is-pressing", event.buttons > 0);
      if (reducedMotion.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        x = targetX;
        y = targetY;
        node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        return;
      }
      if (!frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(animate);
      }
    };
    const leave = () => {
      node.classList.remove("is-visible", "is-enter", "is-pressing");
      delete document.documentElement.dataset.customCursor;
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    };
    const pointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) leave();
    };
    const pointerUp = () => node.classList.remove("is-pressing");

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    window.addEventListener("pointerup", pointerUp, { passive: true });
    window.addEventListener("pointerout", pointerOut);
    window.addEventListener("blur", leave);
    return () => {
      cancelAnimationFrame(frame);
      delete document.documentElement.dataset.customCursor;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointerout", pointerOut);
      window.removeEventListener("blur", leave);
    };
  }, []);

  return <div className="custom-cursor" aria-hidden="true"><span className="cursor-orbit" /><span className="cursor-dot" /><span className="cursor-label">Enter</span></div>;
}

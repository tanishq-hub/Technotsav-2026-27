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

    const animate = () => {
      x += (targetX - x) * 0.2;
      y += (targetY - y) * 0.2;
      node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.25) frame = requestAnimationFrame(animate);
      else { x = targetX; y = targetY; frame = 0; }
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
        x = targetX;
        y = targetY;
        node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        return;
      }
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const leave = () => {
      node.classList.remove("is-visible", "is-enter", "is-pressing");
      delete document.documentElement.dataset.customCursor;
      cancelAnimationFrame(frame);
      frame = 0;
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

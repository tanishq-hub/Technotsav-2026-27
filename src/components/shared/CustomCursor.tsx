"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = cursor.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || !finePointer.matches || reducedMotion.matches) return;

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
      targetX = event.clientX;
      targetY = event.clientY;
      node.classList.add("is-visible");
      node.classList.toggle("is-enter", Boolean((event.target as Element | null)?.closest?.("a, button")));
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const leave = () => {
      node.classList.remove("is-visible", "is-enter");
      cancelAnimationFrame(frame);
      frame = 0;
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <div className="custom-cursor" aria-hidden="true"><span className="cursor-orbit" /><span className="cursor-dot" /><span className="cursor-label">Enter</span></div>;
}

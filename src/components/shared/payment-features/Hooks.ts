"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once when the observed element enters the viewport, then
 * disconnects — this is a one-shot "reveal" trigger, not a live tracker.
 *
 * Return type note: useRef<T>(null) is typed as RefObject<T | null> under
 * current @types/react (the old RefObject/MutableRefObject split was
 * consolidated). The original version of this hook annotated its return
 * as RefObject<T>, which no longer matches and fails to compile
 * ("Type 'RefObject<T | null>' is not assignable to type 'RefObject<T>'").
 * Annotating with `T | null` here matches what useRef actually produces.
 */
export function useInView<T extends HTMLElement>(
  options: IntersectionObserverInit = { threshold: 0.2 }
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}

export function useCountUp(target: number, start: boolean, duration = 1400): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setValue(target * eased);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [start, target, duration]);

  return value;
}

export function formatStat(raw: string, value: number): string {
  if (raw.startsWith("$")) return `$${value.toFixed(1)}B+`;
  if (raw.includes("K")) return `${Math.round(value)}K+`;
  if (raw.includes("M")) return `${value.toFixed(1)}M+`;
  return `${Math.round(value)}+`;
}

export function parseStatTarget(raw: string): number {
  const match = raw.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}
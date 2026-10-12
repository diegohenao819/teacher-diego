// Diego's red pen, drawn as SVG strokes (animated with .pen-draw).
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

const delay = (ms = 0) => ({ '--delay': `${ms}ms` }) as CSSProperties;

// Loose hand-drawn loop on a 100 x 64 template, scaled to the real box in pixels.
// (A stretched viewBox with a non-scaling stroke breaks the draw-on dash: the circle stops halfway.)
const CIRCLE = [68, 7, 42, 1, 7, 9, 6, 33, 5, 54, 40, 61, 63, 57, 88, 53, 97, 39, 94, 24, 91, 10, 70, 4, 46, 6];
const circlePath = (w: number, h: number) => {
  const p = CIRCLE.map((v, i) => (i % 2 === 0 ? (v / 100) * w : (v / 64) * h).toFixed(1));
  return `M${p[0]} ${p[1]} C${p.slice(2, 8).join(' ')} C${p.slice(8, 14).join(' ')} C${p.slice(14, 20).join(' ')} C${p.slice(20, 26).join(' ')}`;
};

export function PenCircle({
  children,
  delayMs = 0,
  className = '',
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.offsetWidth * 1.44);
      const h = Math.round(el.offsetHeight * 1.6);
      setBox((b) => (b && b.w === w && b.h === h ? b : { w, h }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={`relative inline-grid place-items-center ${className}`}>
      {box && (
        <svg
          aria-hidden
          viewBox={`0 0 ${box.w} ${box.h}`}
          className="pointer-events-none absolute -inset-x-[22%] -inset-y-[30%] h-[160%] w-[144%] overflow-visible text-[var(--pen)]"
        >
          <path
            d={circlePath(box.w, box.h)}
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="pen-draw"
            style={delay(delayMs)}
          />
        </svg>
      )}
      <span className="ink-in relative" style={delay(delayMs + 350)}>
        {children}
      </span>
    </span>
  );
}

export function Tick({ delayMs = 0, className = '' }: { delayMs?: number; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 22" className={`h-4 w-4 text-[var(--pen)] ${className}`}>
      <path
        d="M2 12 C 4 14, 6 16, 8.5 19 C 12 11, 16 6, 22 2"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pen-draw"
        style={delay(delayMs)}
      />
    </svg>
  );
}

// Partial credit: a tick with a small nick across its long arm, the way a teacher half-marks.
// The nick stays short so the mark still reads as a tick, never as a cross.
export function HalfTick({ delayMs = 0, className = '' }: { delayMs?: number; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 22" className={`h-4 w-4 text-[var(--pen)] ${className}`}>
      <path
        d="M2 12 C 4 14, 6 16, 8.5 19 C 12 11, 16 6, 22 2 M15.4 5.4 L 18.6 7.9"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pen-draw"
        style={delay(delayMs)}
      />
    </svg>
  );
}

export function Cross({ delayMs = 0, className = '' }: { delayMs?: number; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`h-4 w-4 text-[var(--pen)] ${className}`}>
      <path
        d="M4 4 C 9 9, 14 14, 20 20 M20 4 C 14 10, 9 14, 4 20"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="pen-draw"
        style={delay(delayMs)}
      />
    </svg>
  );
}

// Looping scribble while the paragraph is being marked.
export function Scribble({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 60 12" className={`h-3 w-12 ${className}`}>
      <path
        d="M2 8 C 6 2, 9 2, 12 7 S 18 11, 22 5 S 30 1, 33 7 S 41 11, 45 5 S 54 2, 58 7"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="scribble"
      />
    </svg>
  );
}

// Hand-drawn underline for the active section link. Only stretched sideways, so the
// near-horizontal stroke keeps its weight without a non-scaling stroke (which breaks the dash).
export function PenUnderline({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 100 8" preserveAspectRatio="none" className={`text-[var(--pen)] ${className}`}>
      <path
        d="M2 5 C 25 2, 55 7, 98 3"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="pen-draw"
      />
    </svg>
  );
}

// Squared writing area that grows with its text in 28px rows and never scrolls inside.
import { useCallback, useEffect, useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';

export default function WritingArea({
  minRows = 3,
  className = '',
  value,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number; value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el || el.clientWidth === 0) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight + 2, minRows * 28 + 2)}px`;
  }, [minRows]);

  useLayoutEffect(fit, [value, fit]);

  // Height depends on width: refit when the column width changes.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        fit();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      spellCheck
      className={`writing on-grid block w-full resize-none overflow-hidden rounded-sm border border-[var(--rule)] px-3 text-[17px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--part-ink,var(--ink))] focus:shadow-[0_0_0_3px_var(--hl,var(--rule))] focus:outline-none ${className}`}
      {...props}
    />
  );
}

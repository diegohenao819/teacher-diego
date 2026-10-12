// The paragraph read back, each part swiped with its role's highlighter.
import type { CSSProperties } from 'react';
import type { PartRole } from '../../sections';

export interface Segment {
  role: PartRole;
  text: string;
}

export default function Highlighted({
  segments,
  animate = true,
  baseDelay = 0,
  className = '',
}: {
  segments: Segment[];
  animate?: boolean;
  baseDelay?: number;
  className?: string;
}) {
  const visible = segments.filter((s) => s.text.trim());
  return (
    <p className={`on-grid text-[17px] text-[var(--ink)] ${className}`}>
      {visible.map((seg, i) => (
        <span key={i}>
          <span
            data-role={seg.role}
            className={`hl ${animate ? 'hl-swipe' : ''}`}
            style={{ '--delay': `${baseDelay + i * 260}ms` } as CSSProperties}
          >
            {seg.text.trim()}
          </span>{' '}
        </span>
      ))}
    </p>
  );
}

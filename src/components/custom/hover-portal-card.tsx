import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function SentimentAnalysisCard({
  scores,
  bare = false,
}: {
  scores: Array<{ key: string; label: string; colorClass: string; score: number }>;
  bare?: boolean;
}) {
  return (
    <div
      className={
        bare
          ? 'text-left'
          : 'rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-[0_12px_28px_rgba(0,0,0,.1)]'
      }
    >
      {bare ? null : (
        <>
          <div className="mb-3 text-[13px] font-bold text-slate-800">Sentiment Analysis</div>
          <div className="mb-3 h-px w-full bg-neutral-100" />
        </>
      )}
      <div className="mb-3 flex flex-nowrap items-center gap-x-3">
        {scores.map((item) => (
          <span
            key={item.key}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-neutral-600"
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.colorClass}`} />
            {item.label}
          </span>
        ))}
      </div>
      <div className="mb-1.5 flex h-2 w-full overflow-hidden rounded-full">
        {scores.map((item) => (
          <div
            key={item.key}
            className={item.colorClass}
            style={{ flexGrow: item.score || 0.0001, flexBasis: 0 }}
          />
        ))}
      </div>
      <div className="flex w-full text-[11px] text-neutral-500">
        {scores.map((item, index) => (
          <span
            key={item.key}
            className={
              index === 0 ? 'text-left' : index === scores.length - 1 ? 'text-right' : 'text-center'
            }
            style={{ flexGrow: item.score || 0.0001, flexBasis: 0 }}
          >
            {item.score}%
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders `trigger` inline, and on hover portals `children` to document.body
 * as a `position: fixed` card. Portaling escapes every scrollable/overflow
 * ancestor, so the popover can never trigger a scrollbar or "flick" a
 * table/page layout, and its position is computed fresh on each hover so it
 * always flips to stay inside the viewport.
 */
export function HoverPortalCard({
  trigger,
  children,
  cardWidth = 240,
  estimatedCardHeight = 170,
}: {
  trigger: ReactNode;
  children: ReactNode;
  cardWidth?: number;
  estimatedCardHeight?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedCardHeight + gap;
    const top = openUpward ? rect.top - estimatedCardHeight - gap : rect.bottom + gap;

    let left = rect.right - cardWidth;
    if (left < gap) left = gap;
    if (left + cardWidth > window.innerWidth - gap) left = window.innerWidth - cardWidth - gap;

    setPos({ top: Math.max(gap, top), left });
  };

  return (
    <div
      ref={anchorRef}
      className="inline-flex"
      onMouseEnter={() => {
        updatePosition();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
    >
      {trigger}
      {open && pos
        ? createPortal(
            <div
              style={{ position: 'fixed', top: pos.top, left: pos.left, width: cardWidth, zIndex: 9999 }}
              className="pointer-events-none"
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

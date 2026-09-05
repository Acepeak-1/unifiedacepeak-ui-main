/* A custom 12-hour time picker.
 *
 * Native `<input type="time">` cannot be restyled or repositioned — the popup
 * it opens is rendered by the browser/OS outside the page, so no CSS reaches
 * it (that's why the Business Hours dialog's picker kept showing Chrome's own
 * blue highlight no matter what colours were set on the input). This
 * component reproduces the same "HH:mm" 24-hour value contract but renders
 * its own dropdown, so every pixel — including the selected-item highlight —
 * is ours to theme and size.
 */

import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  /** 24-hour "HH:mm", e.g. "14:30". Matches the native time input's value format. */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'] as const;

const to12Hour = (value?: string) => {
  if (!value) return { hour: 10, minute: 0, period: 'AM' as (typeof PERIODS)[number] };
  const [rawHour, rawMinute] = value.split(':').map(Number);
  const period = rawHour >= 12 ? 'PM' : 'AM';
  const hour = rawHour % 12 === 0 ? 12 : rawHour % 12;
  return { hour, minute: rawMinute || 0, period };
};

const to24Hour = (hour: number, minute: number, period: (typeof PERIODS)[number]) => {
  const base = hour % 12;
  const fullHour = period === 'PM' ? base + 12 : base;
  return `${String(fullHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const formatDisplay = (value?: string) => {
  if (!value) return '';
  const { hour, minute, period } = to12Hour(value);
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
};

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  className,
  disabled,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { hour, minute, period } = to12Hour(value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const commit = (nextHour: number, nextMinute: number, nextPeriod: (typeof PERIODS)[number]) => {
    onChange(to24Hour(nextHour, nextMinute, nextPeriod));
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-[118px] shrink-0 items-center justify-between gap-1 rounded-full border border-neutral-200 bg-white px-3 text-xs text-neutral-900 outline-none transition-colors focus-visible:border-black focus-visible:ring-4 focus-visible:ring-black/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={cn(!value && 'text-neutral-400')}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
      </button>

      {open && (
        <div className="absolute left-full top-0 z-50 ml-2 w-[220px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
          <div className="grid grid-cols-3 gap-px border-b border-neutral-100 bg-neutral-100 px-0.5 pt-2 pb-1.5">
            <span className="text-center text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
              Hour
            </span>
            <span className="text-center text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
              Min
            </span>
            <span className="text-center text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
              &nbsp;
            </span>
          </div>
          {/* One shared scroll area for all three columns, rather than each
              column scrolling on its own — the previous version made the
              panel feel like three separate widgets glued together. */}
          <div className="grid max-h-[224px] grid-cols-3 gap-1 divide-x divide-neutral-100 overflow-y-auto p-2">
            <div className="flex flex-col gap-0.5">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => commit(h, minute, period)}
                  className={cn(
                    'rounded-lg py-1.5 text-center text-sm font-semibold transition-colors',
                    h === hour ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100',
                  )}
                >
                  {String(h).padStart(2, '0')}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-0.5 pl-1">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => commit(hour, m, period)}
                  className={cn(
                    'rounded-lg py-1.5 text-center text-sm font-semibold transition-colors',
                    m === minute ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100',
                  )}
                >
                  {String(m).padStart(2, '0')}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-0.5 pl-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => commit(hour, minute, p)}
                  className={cn(
                    'rounded-lg py-1.5 text-center text-sm font-semibold transition-colors',
                    p === period ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

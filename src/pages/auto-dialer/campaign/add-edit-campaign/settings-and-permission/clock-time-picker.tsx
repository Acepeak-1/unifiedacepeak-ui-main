import { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * A compact analog-clock time picker, replacing the browser's native
 * `<input type="time">` dropdown (which can't be restyled — it's rendered
 * by the OS/browser chrome, not the page). Reads and writes the exact same
 * 24-hour "HH:MM" string every existing caller already uses, so nothing
 * about how time values are stored or validated changes.
 */

const HOUR_MARKS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_MARKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const pad2 = (n: number) => String(n).padStart(2, '0');

const parseValue = (value: string) => {
  const [hStr, mStr] = (value || '09:00').split(':');
  const h24 = Number(hStr) || 0;
  const minute = Number(mStr) || 0;
  const meridiem: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour12, minute, meridiem };
};

const toValue = (hour12: number, minute: number, meridiem: 'AM' | 'PM') => {
  let h24 = hour12 % 12;
  if (meridiem === 'PM') h24 += 12;
  return `${pad2(h24)}:${pad2(minute)}`;
};

const RADIUS = 62;
const FACE = RADIUS * 2 + 36;

interface ClockTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const ClockTimePicker = ({ value, onChange, disabled, className }: ClockTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const shown = useMemo(() => parseValue(value), [value]);
  const [draftHour, setDraftHour] = useState(shown.hour12);
  const [draftMinute, setDraftMinute] = useState(shown.minute);
  const [draftMeridiem, setDraftMeridiem] = useState<'AM' | 'PM'>(shown.meridiem);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const parsed = parseValue(value);
      setDraftHour(parsed.hour12);
      setDraftMinute(parsed.minute);
      setDraftMeridiem(parsed.meridiem);
      setMode('hour');
    }
    setOpen(next);
  };

  const commit = () => {
    onChange(toValue(draftHour, draftMinute, draftMeridiem));
    setOpen(false);
  };

  const marks = mode === 'hour' ? HOUR_MARKS : MINUTE_MARKS;
  const selected = mode === 'hour' ? draftHour : draftMinute;
  const selectedIndex = marks.indexOf(selected);

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`acp-clock-trigger ${className || ''}`}
        >
          <span>
            {pad2(shown.hour12)}:{pad2(shown.minute)} {shown.meridiem}
          </span>
          <Clock className="w-3.5 h-3.5 text-gray-400 flex-none" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="acp-clock-pop w-auto p-3 bg-white border-gray-200 rounded-xl shadow-lg"
      >
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <button
            type="button"
            className={`acp-clock-seg${mode === 'hour' ? ' is-active' : ''}`}
            onClick={() => setMode('hour')}
          >
            {pad2(draftHour)}
          </button>
          <span className="text-gray-300 font-semibold">:</span>
          <button
            type="button"
            className={`acp-clock-seg${mode === 'minute' ? ' is-active' : ''}`}
            onClick={() => setMode('minute')}
          >
            {pad2(draftMinute)}
          </button>
          <div className="flex flex-col gap-0.5 ml-1">
            <button
              type="button"
              className={`acp-clock-meridiem${draftMeridiem === 'AM' ? ' is-active' : ''}`}
              onClick={() => setDraftMeridiem('AM')}
            >
              AM
            </button>
            <button
              type="button"
              className={`acp-clock-meridiem${draftMeridiem === 'PM' ? ' is-active' : ''}`}
              onClick={() => setDraftMeridiem('PM')}
            >
              PM
            </button>
          </div>
        </div>

        <div className="acp-clock-face" style={{ width: FACE, height: FACE }}>
          <span className="acp-clock-center" />
          {/* The hand rests pointing right (CSS rotate(0) = east) but the
              marks are placed starting from the top (their angle formula
              below has a -90° built in, so index 0/"12" lands at north).
              Without the same -90° here the hand pointed a quarter-turn
              past whatever it was meant to point at — e.g. "01" showed
              the hand aimed at "04". */}
          {selectedIndex !== -1 && (
            <span
              className="acp-clock-hand"
              style={{ width: RADIUS, transform: `rotate(${selectedIndex * 30 - 90}deg)` }}
            />
          )}
          {marks.map((mark, index) => {
            const angle = (index / 12) * 2 * Math.PI - Math.PI / 2;
            const x = FACE / 2 + RADIUS * Math.cos(angle);
            const y = FACE / 2 + RADIUS * Math.sin(angle);
            const isSelected = mark === selected;
            return (
              <button
                key={mark}
                type="button"
                className={`acp-clock-mark${isSelected ? ' is-selected' : ''}`}
                style={{ left: x, top: y }}
                onClick={() => {
                  if (mode === 'hour') {
                    setDraftHour(mark);
                    setMode('minute');
                  } else {
                    setDraftMinute(mark);
                  }
                }}
              >
                {pad2(mark)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 mt-3">
          <button type="button" className="acp-clock-cancel" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button" className="acp-clock-ok" onClick={commit}>
            OK
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ClockTimePicker;

import DatePicker from 'react-datepicker';
import { useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

import { handleAlert } from '@/lib/utils';

type DialpadScheduleCallbackProps = {
  onSave: (selectedDateTime: Date) => void;
  onCancel?: () => void;
  isLoading?: boolean;
};

const DialpadScheduleCallback = ({
  onSave,
  onCancel,
  isLoading,
}: DialpadScheduleCallbackProps) => {
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(() => {
    const now = new Date();
    // Default to the next 15-minute block to avoid being in the past immediately
    const ms = 1000 * 60 * 15;
    return new Date(Math.ceil(now.getTime() / ms) * ms);
  });

  const filterPassedTime = (time: Date) => {
    const currentDate = new Date();
    const selectedDate = selectedDateTime || new Date();

    if (selectedDate.toDateString() === currentDate.toDateString()) {
      return time.getTime() > currentDate.getTime();
    }
    return true;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        <CalendarClock className="h-3.5 w-3.5" />
        Schedule callback
      </p>

      <div className="relative w-full">
        <DatePicker
          selected={selectedDateTime}
          onChange={(date) => {
            setSelectedDateTime(date);
          }}
          showTimeSelect
          minDate={new Date()}
          filterTime={filterPassedTime}
          dateFormat="yyyy-MM-dd HH:mm"
          /* The floating call window is a fixed 380x536 with overflow hidden,
             so an inline calendar popup gets clipped by the frame. A portal
             lifts it out and it can open at full size. */
          withPortal
          portalId="dialpad-callback-datepicker"
          className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
      </div>

      {/* Cancel sits beside Save so the form can be dismissed from inside it,
          and Save no longer spans the full width — that made it read as
          important as the Close button below the whole panel. */}
      <div className="mt-3 flex items-center justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-[13px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (!selectedDateTime) return;
            if (selectedDateTime < new Date()) {
              handleAlert({ text: 'Past time cannot be scheduled', type: 'error' });
              return;
            }
            onSave(selectedDateTime);
          }}
          disabled={!selectedDateTime || isLoading}
          className="inline-flex h-9 min-w-[88px] items-center justify-center rounded-lg bg-[#dc2626] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </div>
  );
};

export default DialpadScheduleCallback;

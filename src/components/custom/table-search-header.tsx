import { RefreshCcw, Search } from 'lucide-react';
import type { ReactNode } from 'react';

/* The search-bar-above-the-table-header row from the AI Receptionist list
   (new-ai-receptionist.tsx's `customHeader`): a rounded-full pill with a
   red circular icon badge, plus a refresh button, sitting inside the
   table's own card above its column headers — same structure, border
   color and icon as that reference. Shared here so every Numbers-section
   table (All numbers, Call coverage, Identities, Addresses, Verifications)
   renders the exact same control. */
const TableSearchHeader = ({
  value,
  onChange,
  onRefresh,
  refreshing = false,
  placeholder = 'Search',
  rightSlot,
}: {
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  placeholder?: string;
  rightSlot?: ReactNode;
}) => (
  <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center">
    <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border! border-neutral-200! bg-white! pl-2 pr-3 shadow-none! transition-colors focus-within:border-[rgba(220,38,38,0.4)]! sm:max-w-[320px]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
        <Search className="h-3.5 w-3.5" />
      </span>
      <input
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (next.startsWith(' ')) return;
          onChange(next);
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-none bg-transparent text-sm text-neutral-900 outline-none! placeholder:text-neutral-400"
      />
    </div>
    {onRefresh && (
      <button
        type="button"
        title="Refresh"
        onClick={onRefresh}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-none! bg-transparent! text-neutral-500! shadow-none! transition-colors hover:text-neutral-900!"
      >
        <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    )}
    {rightSlot}
  </div>
);

export default TableSearchHeader;

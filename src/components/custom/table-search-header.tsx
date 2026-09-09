import { RefreshCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { SearchIcon } from '@/components/custom/header/GlobalSearch';

/* The search bar this renders is the CRM Integration page's own
   `.mcm-intpage-search` control (same Input, same SearchIcon, same CSS) —
   not a bespoke one-off — so every Numbers-section table (All numbers,
   Call coverage, Identities, Addresses, Verifications) carries the exact
   same icon, size and text as that reference. It sits inside the table's
   own card, above its column headers, rather than up in the page head. */
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
    <div className="mcm-intpage-search w-full sm:max-w-[320px]">
      <Input
        placeholder={placeholder}
        className="pl-9"
        IconPosition="left-0 pl-3 inset-y-0"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (next.startsWith(' ')) return;
          onChange(next);
        }}
        Icon={<SearchIcon />}
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

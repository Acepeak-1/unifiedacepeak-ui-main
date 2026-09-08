import type { ReactNode } from 'react';
import { Ic, McmIconSprite } from '@/components/mcm/icons';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * The shape every Directory page takes.
 *
 * People, Groups and External are three views of the same idea — a filtered
 * list of records you act on — so they are laid out by one component rather
 * than three hand-built pages. That is what stops them drifting apart: a change
 * to the header, the filter bar or the empty state lands on all of them at once
 * and none of them can quietly end up looking like a different product.
 *
 * Create and edit flows use `DirectoryDrawer` below for the same reason.
 */

export const DirectoryPage = ({
  title,
  titleClassName,
  description,
  note,
  actions,
  filters,
  stats,
  children,
}: {
  /* ReactNode rather than plain string so a page can put an icon beside its
     title (e.g. People) without every other Directory page having to. */
  title: ReactNode;
  /* Optional class on the <h1> itself, e.g. the shared serif heading look —
     People sets its own via .ppl-red-theme instead. */
  titleClassName?: string;
  /* ReactNode, not just string, for the same reason as `title` above — a page
     can pair a short summary with an info tooltip instead of one long line.
     Optional so a page can fold its summary into the title row instead and
     skip this line entirely. */
  description?: ReactNode;
  /* An honest caveat about how far this screen really reaches, shown under the
     description. Optional, so every page that does not need one is unchanged. */
  note?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  /* A row of at-a-glance counts above the filter bar. Optional — only pages
     that pass it get the band. */
  stats?: ReactNode;
  children: ReactNode;
}) => (
  <div className="page">
    <McmIconSprite />
    <div className="page-head">
      <div>
        <h1 className={titleClassName}>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions}
    </div>
    {stats ? <div className="kpis kpi-grid">{stats}</div> : null}
    {note ? <div className="page-caveat">{note}</div> : null}
    <div className="panel-card">
      {filters ? <div className="tbar tbar-in-card">{filters}</div> : null}
      <div className="tbl-wrap">{children}</div>
    </div>
  </div>
);

/** One at-a-glance count for the `stats` band, e.g. "Total people: 12". */
export const Kpi = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => (
  <div className="kpi-card">
    <div className="kpi-card__label">{label}</div>
    <div className="kpi-card__value-row">
      <span className="kpi-card__value">{value}</span>
    </div>
  </div>
);

/** A filter chip whose dropdown is fully styleable (no native <select> popup,
 * so a page can theme its hover colour instead of inheriting the OS's blue). */
export const FilterChip = ({
  label,
  value,
  options,
  onChange,
  tone = 'default',
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  /* 'red' swaps the dropdown's hover colour for pages themed in black/red
     (e.g. People) instead of the platform's default accent. */
  tone?: 'default' | 'red';
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" className="fchip fchip-select">
        {label}: <b>{value}</b>
        <ChevronDown size={12} />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      className={cn('min-w-[150px]', tone === 'red' && 'border-transparent')}
    >
      {options.map((option) => (
        <DropdownMenuItem
          key={option}
          className="cursor-pointer"
          data-selected={option === value}
          onSelect={() => onChange(option)}
        >
          {option}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export const SearchChip = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <label className="fchip search-fchip" style={{ flex: '1 1 220px', maxWidth: 320 }}>
    <span className="search-fchip__icon">
      <Ic n="search" size={13} />
    </span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      style={{ border: 0, background: 'transparent', width: '100%', outline: 'none', boxShadow: 'none' }}
    />
  </label>
);

/** The row every Directory list falls back to, so empty never looks broken. */
export const EmptyRow = ({ span, message }: { span: number; message: string }) => (
  <tr>
    <td colSpan={span}>
      <div className="empty">
        <Ic n="users" size={30} />
        <p>{message}</p>
      </div>
    </td>
  </tr>
);

/**
 * Create / edit surface.
 *
 * The platform opens these in its own SideDrawer with app styling; inside a
 * console page they use the console's drawer shape instead, so saving a record
 * looks like the page you saved it from.
 */
export const DirectoryDrawer = ({
  title,
  onClose,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) => (
  <>
    <div className="scrim" onClick={onClose} aria-hidden />
    <aside className="drw" role="dialog" aria-label={title}>
      <div className="drw-h">
        <h2>{title}</h2>
        <button type="button" className="mini" onClick={onClose} aria-label="Close">
          <Ic n="x" size={12} />
        </button>
      </div>
      <div className="drw-b">{children}</div>
      {footer ? <div className="drw-f">{footer}</div> : null}
    </aside>
  </>
);

export default DirectoryPage;

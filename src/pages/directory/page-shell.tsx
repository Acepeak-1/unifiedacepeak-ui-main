import type { ReactNode } from 'react';
import { Ic, McmIconSprite } from '@/components/mcm/icons';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CustomSelect from '@/components/custom/custom-select';

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
  footer,
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
  /* The per-page/record-count/pager row, pinned under the table instead of
     scrolling with it. Optional — a page that passes none renders exactly as
     before. Build it with `TableFooter` below. */
  footer?: ReactNode;
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
      {footer}
    </div>
  </div>
);

/**
 * Per-page / record-count / pager row shown under a Directory table, matching
 * the pattern the rest of the console already uses (see TableManager). Plain
 * client-side paging over an already-fetched array — every Directory page
 * pages through its own filtered `visible` list rather than re-querying the
 * API per page.
 */
export const TableFooter = ({
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 25, 50, 100],
}: {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
}) => {
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const pagerBtn =
    'flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500';

  return (
    <div className="tbl-foot">
      <div className="tbl-foot__left">
        <span className="tbl-foot__perpage">
          <span className="tbl-foot__perpage-select">
            <CustomSelect
              options={perPageOptions.map((n) => ({ label: String(n), value: n }))}
              value={{ label: String(perPage), value: perPage }}
              handleChange={(option: any) => {
                onPerPageChange(option.value);
                onPageChange(1);
              }}
              isClearable={false}
              isSearchable={false}
              menuPlacement="top"
              menuPortalTarget={false}
            />
          </span>
          per page
        </span>
        <span className="tbl-foot__count">{total} record(s)</span>
      </div>
      <div className="tbl-foot__pager">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label="First page"
          className={pagerBtn}
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={pagerBtn}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="tbl-foot__current" aria-current="page">
          {page}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
          className={pagerBtn}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(pageCount)}
          disabled={page >= pageCount}
          aria-label="Last page"
          className={pagerBtn}
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

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

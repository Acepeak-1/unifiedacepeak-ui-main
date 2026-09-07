import type { ReactNode } from 'react';
import { McmIconSprite } from '@/components/mcm/icons';
import '@/components/mcm/mcm-page.css';

/**
 * The shape every Admin list page takes.
 *
 * Admin screens open with a breadcrumb strip — "Numbers › Number In Use" — with
 * both halves rendered at the same weight, and a search box crammed in beside
 * it. This gives them the console's page head instead: a real title, a line
 * saying what the screen is for, and a separate bar for search and actions.
 *
 * It deliberately does *not* replace `TableManager`. That component carries
 * server-side paging, sorting and the search plumbing these pages depend on;
 * swapping it out to gain a nicer table would trade real behaviour for looks.
 * The table styling comes from `.mcm-admin table` in the design system.
 */

export const AdminPage = ({
  section,
  sectionIcon,
  title,
  titleSuffix,
  description,
  headerTabs,
  actions,
  filters,
  children,
  icon,
  className,
  beforeTable,
}: {
  /** The area this screen belongs to, e.g. "Numbers". */
  section?: ReactNode;
  /** Optional small icon shown before the section label, in place of the
      default plain-text eyebrow. */
  sectionIcon?: ReactNode;
  title: ReactNode;
  /** Optional content shown inline right after the title text — e.g. an info
      icon carrying the description as a tooltip instead of a line below. */
  titleSuffix?: ReactNode;
  description?: ReactNode;
  /** Optional control (e.g. a segmented tab strip) shown centred in the
      sticky head bar — matching the Integration pages' header, where the
      view filter sits centred between the title and the search box rather
      than further down the page. */
  headerTabs?: ReactNode;
  /** Optional control (e.g. a search box) shown at the far right of the
      head bar, on the same row as the title/headerTabs. */
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  /** Optional decorative graphic shown at the far right of the page head. */
  icon?: ReactNode;
  /** Extra class on the root section, for a page that needs to override the
      shared `.mcm-adminpage-*` look without changing it for every consumer. */
  className?: string;
  /** Optional content (e.g. a KPI/stat row) shown above the table card,
      inside the body's own padding but outside panel-card. */
  beforeTable?: ReactNode;
}) => (
  <section className={`mcm-adminpage${className ? ` ${className}` : ''}`}>
    <McmIconSprite />
    <div className="mcm-adminpage-head">
      <div className="mcm-adminpage-title">
        {section ? (
          <div className="mcm-adminpage-eyebrow">
            {sectionIcon}
            {section}
          </div>
        ) : null}
        <h1 className="mcm-adminpage-title-heading">
          {title}
          {titleSuffix}
        </h1>
        {description ? <p>{description}</p> : null}
      </div>
      {/* A true third column (see the `:has()` grid rule in mcm-page.css),
          not grouped with the title — so the filter centres in the head
          bar regardless of how wide the title is, matching CRM's header. */}
      {headerTabs ? <div className="mcm-adminpage-headtabs">{headerTabs}</div> : null}
      {actions ? <div className="mcm-adminpage-actions">{actions}</div> : null}
      {icon ? <div className="mcm-adminpage-icon">{icon}</div> : null}
    </div>
    {filters ? <div className="mcm-adminpage-bar">{filters}</div> : null}
    <div className="mcm-adminpage-body">
      {beforeTable}
      {/* Same card the Directory tables sit in, so the two areas read as one
          product rather than a styled header bolted onto a bare table. */}
      <div className="panel-card">
        <div className="tbl-wrap">{children}</div>
      </div>
    </div>
  </section>
);

export default AdminPage;

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
  title,
  description,
  actions,
  filters,
  children,
  className,
}: {
  /** The area this screen belongs to, e.g. "Numbers". */
  section?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  /** Extra class on the root section, for a page that needs to override the
      shared `.mcm-adminpage-*` look without changing it for every consumer. */
  className?: string;
}) => (
  <section className={`mcm-adminpage${className ? ` ${className}` : ''}`}>
    <McmIconSprite />
    <div className="mcm-adminpage-head">
      <div className="mcm-adminpage-title">
        {section ? <div className="mcm-adminpage-eyebrow">{section}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="mcm-adminpage-actions">{actions}</div> : null}
    </div>
    {filters ? <div className="mcm-adminpage-bar">{filters}</div> : null}
    <div className="mcm-adminpage-body">
      {/* Same card the Directory tables sit in, so the two areas read as one
          product rather than a styled header bolted onto a bare table. */}
      <div className="panel-card">
        <div className="tbl-wrap">{children}</div>
      </div>
    </div>
  </section>
);

export default AdminPage;

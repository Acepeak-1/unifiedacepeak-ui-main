import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ic } from '@/components/mcm/icons';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import AlertConfirm from '@/components/custom/alert-confirm';
import NewSiteSteps from '@/pages/admin-settings/company/new-site-steps';
import { siteDelete, siteList } from '@/services/api';
import { useCompanyFeatures } from '@/hooks/rbac';
import { handleAlert } from '@/lib/utils';
import { DirectoryDrawer, DirectoryPage, EmptyRow, FilterChip, SearchChip } from './page-shell';
import { usePeopleRows } from './people-rows';
import { InfoIcon, MoreVertical } from 'lucide-react';
import CustomTooltip from '@/components/custom/custom-tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import './locations-theme.css';

/**
 * Directory ▸ Locations — the organisation's sites.
 *
 * The platform calls these "sites" and already exposes full CRUD
 * (`/api/site/list`, `/api/site/upsert`, `/api/site/delete`) behind the
 * `account_setting.access.SITE` permissions. This is the same data the
 * Company Info screen manages and the same form, surfaced in Directory
 * where you look for people and places — nothing new server-side.
 */

type Site = {
  uuid?: string;
  site_id?: string;
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  timezone?: string;
  is_default?: string;
};

const Locations = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('All');
  const [open, setOpen] = useState<Site | null>(null);
  const [editing, setEditing] = useState<Site | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Site | null>(null);

  const { features } = useCompanyFeatures();
  const siteAccess = features?.plan_features?.account_setting?.access?.SITE?.action;
  const canView = Boolean(siteAccess?.view);
  const canAdd = Boolean(siteAccess?.add);
  const canEdit = Boolean(siteAccess?.edit);
  const canDelete = Boolean(siteAccess?.delete);

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['siteList'],
    queryFn: () => siteList({ page: 1, limit: 1000 }),
    enabled: canView,
    select: (data: any) => data?.data?.data?.result?.rows || [],
  });

  /* People already carry their site name, so the roster answers "who works
     here" without another request. */
  const { rows: people } = usePeopleRows();
  const headcount = useMemo(() => {
    const counts: Record<string, number> = {};
    people.forEach((person) => {
      if (person.location && person.location !== '—') {
        counts[person.location] = (counts[person.location] || 0) + 1;
      }
    });
    return counts;
  }, [people]);

  const { mutate: removeSite, isPending: isDeleting } = useMutation({
    mutationKey: ['siteDelete'],
    mutationFn: siteDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteList'] });
      queryClient.invalidateQueries({ queryKey: ['useGetSite'] });
      handleAlert({ text: 'Location deleted successfully', type: 'success' });
      setDeleting(null);
    },
  });

  const countries = useMemo(() => {
    const found = new Set<string>();
    sites.forEach((site: Site) => site?.country && found.add(site.country));
    return ['All', ...Array.from(found).sort()];
  }, [sites]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return sites.filter((site: Site) => {
      if (country !== 'All' && site?.country !== country) return false;
      if (!needle) return true;
      return [site?.name, site?.city, site?.state, site?.country, site?.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [sites, search, country]);

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['siteList'] });
    queryClient.invalidateQueries({ queryKey: ['useGetSite'] });
  };

  if (!canView) {
    return (
      <DirectoryPage title="Locations" description="The sites your organisation operates from.">
        <table>
          <tbody>
            <EmptyRow span={1} message="You do not have permission to view locations." />
          </tbody>
        </table>
      </DirectoryPage>
    );
  }

  return (
    <div className="loc-theme">
      <DirectoryPage
        titleClassName="dir-serif-heading"
        title={
          <span className="flex items-center gap-2">
            Locations
            <CustomTooltip
              text={
                <>
                  The sites your organisation operates from —
                  <br />
                  address, timezone and who works there.
                </>
              }
              side="top"
              className="!bg-gray-300 !text-black whitespace-normal text-left"
            >
              <InfoIcon className="w-4 h-4 text-gray-500 cursor-pointer" />
            </CustomTooltip>
          </span>
        }
        actions={
          canAdd ? (
            <button type="button" className="btn primary soft-accent" onClick={() => setCreating(true)}>
              <Ic n="plus" />
              New location
            </button>
          ) : null
        }
        filters={
          <>
            <FilterChip
              label="Country"
              value={country}
              options={countries}
              onChange={setCountry}
              tone="red"
            />
            <SearchChip value={search} onChange={setSearch} placeholder="Search locations" />
            <span className="fchip live" style={{ marginLeft: 'auto' }}>
              {visible.length} of {sites.length}
            </span>
          </>
        }
      >
        <table className="tbl">
          <thead>
            <tr className="tbl__head-row">
              <th className="tbl__th tbl__th--left">Location</th>
              <th className="tbl__th tbl__th--left">Address</th>
              <th className="tbl__th tbl__th--left">City / State</th>
              <th className="tbl__th tbl__th--left">Country</th>
              <th className="tbl__th tbl__th--left">Timezone</th>
              <th className="tbl__th tbl__th--left">People</th>
              <th className="tbl__th tbl__th--left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <EmptyRow span={7} message="Loading locations…" />
            ) : visible.length ? (
              visible.map((site: Site) => (
                <tr
                  key={site?.uuid || site?.site_id}
                  className="tbl__row"
                  onClick={() => setOpen(site)}
                >
                  <td className="tbl__td tbl__td--left">
                    <div className="tbl__name">
                      {site?.name || '—'}
                      {site?.is_default === '1' ? (
                        <span className="tag acc" style={{ marginLeft: 8 }}>
                          Default
                        </span>
                      ) : null}
                    </div>
                    <div className="tbl__subtitle">{site?.postal_code || '—'}</div>
                  </td>
                  <td className="tbl__td tbl__td--left tbl__value--muted">
                    {site?.address || '—'}
                  </td>
                  <td className="tbl__td tbl__td--left tbl__value--muted">
                    {[site?.city, site?.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="tbl__td tbl__td--left tbl__value--muted">
                    {site?.country || '—'}
                  </td>
                  <td className="tbl__td tbl__td--left">
                    <span className="mono">{site?.timezone || '—'}</span>
                  </td>
                  <td className="tbl__td tbl__td--left tbl__value">
                    {headcount[site?.name || ''] || 0}
                  </td>
                  <td className="tbl__td tbl__td--left" onClick={(event) => event.stopPropagation()}>
                    {canEdit || (canDelete && site?.is_default !== '1') ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="mini"
                            title={`Actions for ${site?.name || 'location'}`}
                            aria-label={`Actions for ${site?.name || 'location'}`}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-transparent">
                          {canEdit ? (
                            <DropdownMenuItem
                              className="ppl-row-menu-item"
                              onSelect={() => setEditing(site)}
                            >
                              <Ic n="sliders" size={14} />
                              Edit
                            </DropdownMenuItem>
                          ) : null}
                          {/* The default site anchors numbers and users, so
                              the platform does not allow removing it. */}
                          {canDelete && site?.is_default !== '1' ? (
                            <DropdownMenuItem
                              variant="destructive"
                              className="ppl-row-menu-item"
                              onSelect={() => setDeleting(site)}
                            >
                              <Ic n="trash" size={14} />
                              Delete
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow
                span={7}
                message={sites.length ? 'No locations match those filters.' : 'No locations yet.'}
              />
            )}
          </tbody>
        </table>

        {open ? (
          <DirectoryDrawer
            title={open?.name || 'Location'}
            onClose={() => setOpen(null)}
            footer={
              <>
                <button type="button" className="btn ghost" onClick={() => setOpen(null)}>
                  Close
                </button>
                {canEdit ? (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      setEditing(open);
                      setOpen(null);
                    }}
                  >
                    <Ic n="sliders" />
                    Edit
                  </button>
                ) : null}
              </>
            }
          >
            <div className="kv">
              <span className="k">Address</span>
              <span className="v">{open?.address || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">City</span>
              <span className="v">{open?.city || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">State</span>
              <span className="v">{open?.state || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">Country</span>
              <span className="v">{open?.country || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">Postal code</span>
              <span className="v">{open?.postal_code || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">Timezone</span>
              <span className="v">{open?.timezone || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">People</span>
              <span className="v">{headcount[open?.name || ''] || 0}</span>
            </div>
          </DirectoryDrawer>
        ) : null}
      </DirectoryPage>

      {/* The platform's own site form — `data` empty means create. */}
      {(creating || editing) && (
        <Dialog open={creating || Boolean(editing)} onOpenChange={(val) => !val && closeForm()}>
          <DialogContent className="loc-create-dialog flex w-[92vw] max-w-[720px] max-h-[85vh] flex-col gap-0 overflow-hidden p-0">
            <DialogTitle className="dir-serif-heading flex items-center gap-2 px-5 pt-4 pb-2 text-gray-900">
              {editing ? `Update location (${editing?.name || ''})` : 'New location'}
            </DialogTitle>
            <div className="loc-create-theme min-h-0 flex-1 overflow-hidden px-5 pb-5">
              <NewSiteSteps data={editing || {}} handleClose={closeForm} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertConfirm
        {...{
          apiLoading: isDeleting,
          open: Boolean(deleting),
          setOpen: (value: boolean) => !value && setDeleting(null),
          /* Rows may be keyed by site_id when uuid is absent; guarding on uuid
             alone made Delete do nothing at all, with no error shown. */
          onConfirm: () => {
            const id = deleting?.uuid || deleting?.site_id || deleting?.id;
            if (!id) {
              handleAlert({ text: 'This location has no id to delete.', type: 'error' });
              setDeleting(null);
              return;
            }
            removeSite(id);
          },
          onCancel: () => setDeleting(null),
          onClose: () => setDeleting(null),
          confirmBtnText: 'Delete',
          closeBtnText: 'Cancel',
          descriptionTextComp: (
            <div className="text-md">
              Delete <strong>{deleting?.name}</strong>? People and numbers assigned to this location
              will need to be moved.
            </div>
          ),
        }}
      />
    </div>
  );
};

export default Locations;

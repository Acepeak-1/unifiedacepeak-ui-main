import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { getContactList } from '@/services/api';
import CustomAvatar from '@/components/custom/custom-avatar';
import SideDrawer from '@/components/custom/side-drawer';
import SendWhatsappMessage from '@/pages/messenger/drawers/send-whatsapp-message';
import { useConsoleDialer } from '@/pages/phone/console/dial-number';
import { Ic } from '@/components/mcm/icons';
import { DirectoryDrawer, DirectoryPage, EmptyRow, FilterChip, SearchChip } from './page-shell';
import { useDirectoryFavourites } from './use-directory-favourites';
import { useContactLabels } from './use-contact-labels';
import { InfoIcon, MoreVertical } from 'lucide-react';
import CustomTooltip from '@/components/custom/custom-tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import './external-theme.css';

/**
 * Directory ▸ External — people outside the organisation.
 *
 * The console's External view; the platform calls these Contacts. It reads the
 * existing `getContactList`, and carries the same actions the Contacts page
 * offered — call, SMS, WhatsApp, activity and edit — because a directory you
 * cannot act from is only half a directory.
 *
 * Record shape is nested and easy to get wrong: `name.first` / `name.last`,
 * `contact.phone` / `contact.email`, `profile.contactPic`, and the record id is
 * `_id`, not `uuid`.
 *
 * Labels are the one thing on this screen the platform does not store. A
 * contact carries a single tag from a fixed list of four, and the endpoint that
 * saves a contact refuses any field it does not already know, so your own words
 * for a contact are kept in this browser — see `use-contact-labels`. The drawer
 * says so where somebody adds one, rather than letting them assume otherwise.
 */

type Contact = {
  _id?: string;
  name?: { first?: string; last?: string };
  contact?: { phone?: string; email?: string; webpage?: string };
  profile?: { contactPic?: string; company?: string };
  company?: string;
  title?: string;
  /** Extensible on the server: the form writes whatever keys it is given. */
  social?: Record<string, string>;
  groupMeta?: any[];
  is_vip?: boolean;
  is_dnc?: boolean;
  is_blocked?: boolean;
  updatedAt?: string;
  createdAt?: string;
};

const fullName = (row: Contact) =>
  `${row?.name?.first || ''} ${row?.name?.last || ''}`.trim() || 'Unknown';

/** VIP / DNC / Blocked are exclusive states in the UI, most restrictive first. */
const tagOf = (row: Contact) => {
  if (row?.is_blocked) return { label: 'Blocked', cls: 'tag neg' };
  if (row?.is_dnc) return { label: 'DNC', cls: 'tag warn' };
  if (row?.is_vip) return { label: 'VIP', cls: 'tag acc' };
  return { label: 'Standard', cls: 'tag neu' };
};

/* Sample contacts so the page has enough rows to look populated. Ids are
   prefixed 'dummy-' and never sent to the API — remove this block once real
   contacts fill the list out. */
const DUMMY_CONTACT_ROWS: Contact[] = [
  {
    _id: 'dummy-contact-1',
    name: { first: 'Alex', last: 'Thompson' },
    contact: { phone: '+14155550132', email: 'alex.thompson@northwind.example' },
    profile: { company: 'Northwind Traders' },
    title: 'Procurement Lead',
    social: { whatsapp: '+14155550132' },
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'dummy-contact-2',
    name: { first: 'Maria', last: 'Gonzalez' },
    contact: { phone: '+442079460958', email: 'maria.gonzalez@bluepeak.example' },
    profile: { company: 'Bluepeak Logistics' },
    title: 'Account Manager',
    is_vip: true,
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'dummy-contact-3',
    name: { first: 'David', last: 'Okafor' },
    contact: { phone: '+15145550110', email: 'david.okafor@harborline.example' },
    profile: { company: 'Harborline Freight' },
    title: 'Operations Director',
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'dummy-contact-4',
    name: { first: 'Sofia', last: 'Rossi' },
    contact: { phone: '+390212345678', email: 'sofia.rossi@lumenpartners.example' },
    profile: { company: 'Lumen Partners' },
    title: 'Vendor Relations',
    is_dnc: true,
    updatedAt: new Date().toISOString(),
  },
];

const External = () => {
  const navigate = useNavigate();
  const { dial } = useConsoleDialer();
  const { isFavourite, toggleFavourite } = useDirectoryFavourites();
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('All');
  const [label, setLabel] = useState('All');
  const [open, setOpen] = useState<Contact | null>(null);
  const [whatsappTo, setWhatsappTo] = useState<string>('');
  const [newLabel, setNewLabel] = useState('');
  const labels = useContactLabels();

  const { data: apiRows = [], isPending, refetch } = useQuery({
    /* create-new-contact invalidates ['getContactList']; sharing that prefix is
       what makes a new or edited contact show up here. */
    queryKey: ['getContactList', 'directoryExternal'],
    queryFn: () => getContactList({ page: 1, limit: 200 }),
    select: (res: any) => res?.data?.data?.result?.rows || [],
  });
  const rows = useMemo(() => [...apiRows, ...DUMMY_CONTACT_ROWS], [apiRows]);

  /* Labels live in this browser, so a contact deleted on another device would
     otherwise leave its labels in the filter list for ever. Cleared against
     whatever the page has just loaded. */
  useEffect(() => {
    if (!rows.length) return;
    labels.pruneTo(rows.map((row: Contact) => String(row?._id || '')).filter(Boolean));
  }, [rows, labels]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row: Contact) => {
      if (tag !== 'All' && tagOf(row).label !== tag) return false;
      if (label !== 'All' && !labels.matches(row?._id, label)) return false;
      if (!needle) return true;
      /* Search covers labels as well as the record, because a label is only
         worth applying if it is a way of finding the contact again. */
      if (labels.matches(row?._id, needle) && labels.labelsOf(row?._id).length) return true;
      return [
        fullName(row),
        row?.contact?.phone,
        row?.contact?.email,
        row?.profile?.company || row?.company,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [rows, search, tag, label, labels]);

  /**
   * WhatsApp routes off the number, so it can be initiated outbound from here.
   * Instagram and Telegram cannot: the messenger lists only inbound threads and
   * matches them by `chatId`, never by handle, so a link into the channel would
   * land on whichever conversation happens to be first — someone else's. Their
   * handles therefore open the profile instead, which always resolves.
   */
  const whatsappNumberOf = (row: Contact) => row?.social?.whatsapp || row?.contact?.phone || '';

  /** Public profile URL for a stored handle, or '' when the key isn't one we map. */
  const profileUrl = (key: string, value: string) => {
    const handle = String(value || '')
      .trim()
      .replace(/^@/, '');
    if (!handle) return '';
    if (/^https?:\/\//i.test(handle)) return handle;
    const host: Record<string, string> = {
      instagram: 'https://instagram.com/',
      telegram: 'https://t.me/',
      twitter: 'https://x.com/',
      facebook: 'https://facebook.com/',
      linkedin: 'https://linkedin.com/in/',
    };
    return host[key] ? `${host[key]}${handle}` : '';
  };

  /** SMS goes to the inbox composer, the same route the Contacts page used. */
  const sendSms = (phone?: string) =>
    navigate(`/inbox?formState=contact&number=${encodeURIComponent(phone || '')}`);

  return (
    <div className="ext-theme">
      <DirectoryPage
        titleClassName="dir-serif-heading"
        title={
          <span className="flex items-center gap-2">
            External Contacts
            <CustomTooltip
              text={
                <>
                  People outside the organisation — who they work for,
                  <br />
                  how to reach them, and every channel you can use.
                </>
              }
              side="right"
              className="whitespace-normal text-left"
            >
              <InfoIcon className="w-4 h-4 text-gray-500 cursor-pointer" />
            </CustomTooltip>
          </span>
        }
        actions={
          <button type="button" className="btn primary ext-black-btn" onClick={() => navigate('/contact')}>
            <Ic n="plus" />
            Contact
          </button>
        }
        filters={
          <>
            <FilterChip
              label="Tag"
              value={tag}
              options={['All', 'VIP', 'DNC', 'Blocked', 'Standard']}
              onChange={setTag}
              tone="red"
            />
            <FilterChip
              label="Label"
              value={label}
              options={['All', ...labels.index.map((entry) => entry.label)]}
              onChange={setLabel}
              tone="red"
            />
            <SearchChip
              value={search}
              onChange={setSearch}
              placeholder="Search contacts and labels"
            />
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
              title="Refresh"
              aria-label="Refresh contacts"
              onClick={() => refetch()}
            >
              <Ic n="refresh" size={15} />
            </button>
            <span className="fchip live" style={{ marginLeft: 'auto' }}>
              <span className="num">{rows.length}</span> contacts
            </span>
          </>
        }
      >
        <table className="tbl">
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '6%' }} />
          </colgroup>
          <thead>
            <tr className="tbl__head-row">
              <th className="tbl__th tbl__th--left">Contact</th>
              <th className="tbl__th tbl__th--left">Organisation</th>
              <th className="tbl__th tbl__th--left">Role</th>
              <th className="tbl__th tbl__th--left">Phone</th>
              <th className="tbl__th tbl__th--left">Email</th>
              <th className="tbl__th tbl__th--left">Groups</th>
              <th className="tbl__th tbl__th--left">Labels</th>
              <th className="tbl__th tbl__th--left">Tag</th>
              <th className="tbl__th tbl__th--left">Updated</th>
              <th className="tbl__th tbl__th--center" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <EmptyRow span={10} message="Loading contacts…" />
            ) : visible.length ? (
              visible.map((row: Contact) => {
                const name = fullName(row);
                const phone = row?.contact?.phone || '';
                /* The platform stores the label as `groupName`, sometimes nested
                   under `id`. Reading `name` returned nothing, so every contact
                   showed no groups. De-duplicated by `_id` the same way the
                   Contacts table does. */
                const groups = Array.isArray(row?.groupMeta)
                  ? Array.from(
                      new Map(row.groupMeta.map((group: any) => [group?._id, group])).values(),
                    )
                      .map((group: any) => group?.groupName || group?.id?.groupName)
                      .filter(Boolean)
                  : [];
                const updated = row?.updatedAt || row?.createdAt;
                const badge = tagOf(row);

                return (
                  <tr
                    key={row?._id || phone}
                    className="tbl__row"
                    onClick={() => setOpen(row)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="tbl__td tbl__td--left">
                      <span className="tbl__agent">
                        <CustomAvatar
                          name={name}
                          image={row?.profile?.contactPic}
                          type="contact"
                          size="30"
                        />
                        <span className="tbl__agent-meta">
                          <span className="tbl__name">{name}</span>
                          {row?.contact?.webpage ? (
                            <span className="tbl__subtitle">{row.contact.webpage}</span>
                          ) : null}
                        </span>
                      </span>
                    </td>
                    {/* The contact form writes company into `profile`; the
                        top-level key is only a fallback on some responses. */}
                    <td className="tbl__td tbl__td--left tbl__value--muted">
                      {row?.profile?.company || row?.company || (
                        <span style={{ color: 'var(--ink-4)' }}>—</span>
                      )}
                    </td>
                    <td className="tbl__td tbl__td--left tbl__value--muted">
                      {row?.title || <span style={{ color: 'var(--ink-4)' }}>—</span>}
                    </td>
                    <td className="tbl__td tbl__td--left num tbl__value">{phone || '—'}</td>
                    <td className="tbl__td tbl__td--left tbl__value--muted">
                      {row?.contact?.email || <span style={{ color: 'var(--ink-4)' }}>—</span>}
                    </td>
                    <td className="tbl__td tbl__td--left tbl__value--muted">
                      {groups.length ? (
                        groups.join(', ')
                      ) : (
                        <span style={{ color: 'var(--ink-4)' }}>—</span>
                      )}
                    </td>
                    {/* The label matching the search leads, so a contact found
                        by one of six labels shows the reason it was found. */}
                    <td className="tbl__td tbl__td--left">
                      {labels.labelsOf(row?._id).length ? (
                        <span className="flex flex-wrap items-center gap-1">
                          {labels
                            .ranked(row?._id, label !== 'All' ? label : search)
                            .slice(0, 3)
                            .map((entry) => (
                              <span className="tag neu" key={entry}>
                                {entry}
                              </span>
                            ))}
                          {labels.labelsOf(row?._id).length > 3 ? (
                            <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                              +{labels.labelsOf(row?._id).length - 3}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--ink-4)' }}>—</span>
                      )}
                    </td>
                    <td className="tbl__td tbl__td--left">
                      <span className={badge.cls}>{badge.label}</span>
                    </td>
                    <td className="tbl__td tbl__td--left num tbl__value--muted">
                      {updated && moment(updated).isValid() ? (
                        moment(updated).format('DD MMM YYYY')
                      ) : (
                        <span style={{ color: 'var(--ink-4)' }}>—</span>
                      )}
                    </td>
                    {/* Bubble phase, not capture: stopping the click during
                        capture prevented it ever reaching these buttons, so
                        none of the actions fired. Here the button handles the
                        click first, then the row is stopped from opening. */}
                    <td className="tbl__td tbl__td--center" onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="mini"
                            title={`Actions for ${name}`}
                            aria-label={`Actions for ${name}`}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-transparent">
                          <DropdownMenuItem
                            className="ppl-row-menu-item"
                            disabled={!phone}
                            onSelect={() => phone && dial(phone)}
                          >
                            <Ic n="phone" size={14} />
                            Call
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="ppl-row-menu-item"
                            disabled={!phone}
                            onSelect={() => sendSms(phone)}
                          >
                            <Ic n="chat" size={14} />
                            Message
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="ppl-row-menu-item"
                            disabled={!whatsappNumberOf(row)}
                            onSelect={() => setWhatsappTo(whatsappNumberOf(row))}
                          >
                            <Ic n="send" size={14} />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="ppl-row-menu-item"
                            onSelect={() =>
                              navigate(`/contact-activity?contactId=${row?._id}`, {
                                state: { key: 'phone', value: phone },
                              })
                            }
                          >
                            <Ic n="clock" size={14} />
                            Activity
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="ppl-row-menu-item"
                            onSelect={() => toggleFavourite('contact', row?._id)}
                          >
                            <Ic n="star" size={14} fill={isFavourite('contact', row?._id)} />
                            {isFavourite('contact', row?._id)
                              ? 'Remove from favourites'
                              : 'Add to favourites'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            ) : (
              <EmptyRow
                span={10}
                message={rows.length ? 'No contacts match those filters.' : 'No contacts yet.'}
              />
            )}
          </tbody>
        </table>

        {rows.length ? (
          <div className="mcm-tblfoot">
            Showing {visible.length} of {rows.length} contact{rows.length === 1 ? '' : 's'}
          </div>
        ) : null}

        {open ? (
          <DirectoryDrawer
            title={fullName(open)}
            onClose={() => setOpen(null)}
            footer={
              <>
                <button type="button" className="btn ghost" onClick={() => setOpen(null)}>
                  Close
                </button>
                <button type="button" className="btn primary" onClick={() => navigate('/contact')}>
                  <Ic n="user" />
                  Edit contact
                </button>
              </>
            }
          >
            <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
              <CustomAvatar
                name={fullName(open)}
                image={open?.profile?.contactPic}
                type="contact"
                size="44"
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{fullName(open)}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {open?.title || open?.profile?.company || open?.company || 'Contact'}
                </div>
              </div>
              <span className={tagOf(open).cls} style={{ marginLeft: 'auto' }}>
                {tagOf(open).label}
              </span>
            </div>

            <div className="kv">
              <span className="k">Phone</span>
              <span className="v num">{open?.contact?.phone || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">Email</span>
              <span className="v">{open?.contact?.email || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">Company</span>
              <span className="v">{open?.profile?.company || open?.company || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">Website</span>
              <span className="v">{open?.contact?.webpage || '—'}</span>
            </div>

            {/* `social` is an open map on the server — the contact form already
                writes back whatever keys it receives — so every handle stored
                against this contact is listed, not just the three the form
                happens to render inputs for. */}
            {Object.entries(open?.social || {})
              .filter(([, value]) => Boolean(value))
              .map(([key, value]) => {
                const url = profileUrl(key, String(value));
                return (
                  <div className="kv" key={key}>
                    <span className="k" style={{ textTransform: 'capitalize' }}>
                      {key}
                    </span>
                    <span className="v">
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {String(value)}
                        </a>
                      ) : (
                        String(value)
                      )}
                    </span>
                  </div>
                );
              })}
            {Object.values(open?.social || {}).every((value) => !value) ? (
              <div className="kv">
                <span className="k">Social</span>
                <span className="v">—</span>
              </div>
            ) : null}

            {/* Labels sit above the actions because they are the part of this
                panel somebody edits, and the actions are the part they press
                once and leave. */}
            <div style={{ marginTop: 14 }}>
              <div
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 6 }}
              >
                Labels
              </div>
              <div className="flex flex-wrap items-center gap-1" style={{ marginBottom: 8 }}>
                {labels.labelsOf(open?._id).length ? (
                  labels.labelsOf(open?._id).map((entry) => (
                    <span className="tag neu" key={entry}>
                      {entry}
                      <button
                        type="button"
                        onClick={() => labels.remove(String(open?._id), entry)}
                        title={`Remove the label “${entry}”`}
                        aria-label={`Remove the label ${entry}`}
                        style={{ marginLeft: 4, lineHeight: 1 }}
                      >
                        <Ic n="x" size={10} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>None yet.</span>
                )}
              </div>

              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  labels.add(String(open?._id), newLabel);
                  setNewLabel('');
                }}
              >
                <input
                  className="mcm-field"
                  value={newLabel}
                  onChange={(event) => setNewLabel(event.target.value)}
                  placeholder="Add a label"
                  aria-label="Add a label"
                  list="mcm-label-suggestions"
                />
                {/* Suggests labels already in use, so the same idea does not end
                    up spelled three ways and split across three filters. */}
                <datalist id="mcm-label-suggestions">
                  {labels.index.map((entry) => (
                    <option key={entry.label} value={entry.label} />
                  ))}
                </datalist>
                <button type="submit" className="mini solid" disabled={!newLabel.trim()}>
                  <Ic n="plus" size={12} />
                  Add
                </button>
              </form>

              {labels
                .check(String(open?._id), newLabel)
                .filter(() => newLabel.trim().length > 0)
                .map((problem) => (
                  <p
                    key={problem.message}
                    style={{
                      fontSize: 11,
                      margin: '6px 0 0',
                      color: problem.blocking ? 'var(--crit)' : 'var(--ink-4)',
                    }}
                  >
                    {problem.message}
                  </p>
                ))}

              <p style={{ fontSize: 11, color: 'var(--ink-4)', margin: '8px 0 0' }}>
                Labels are yours and are kept in this browser. They do not reach the contact
                record, so they will not follow you to another device or appear for anyone
                else on your team.
              </p>
            </div>

            <div className="ac-acts" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="mini solid"
                disabled={!open?.contact?.phone}
                onClick={() => open?.contact?.phone && dial(open.contact.phone)}
              >
                <Ic n="phone" size={12} />
                Call
              </button>
              <button
                type="button"
                className="mini"
                disabled={!open?.contact?.phone}
                onClick={() => sendSms(open?.contact?.phone)}
              >
                <Ic n="chat" size={12} />
                SMS
              </button>
              <button
                type="button"
                className="mini"
                disabled={!open?.contact?.phone}
                onClick={() => setWhatsappTo(open?.contact?.phone || '')}
              >
                <Ic n="send" size={12} />
                WhatsApp
              </button>
              <button
                type="button"
                className="mini"
                onClick={() =>
                  navigate(`/contact-activity?contactId=${open?._id}`, {
                    state: { key: 'phone', value: open?.contact?.phone || '' },
                  })
                }
              >
                <Ic n="clock" size={12} />
                Activity
              </button>
            </div>
          </DirectoryDrawer>
        ) : null}
      </DirectoryPage>

      {whatsappTo ? (
        <SideDrawer
          isOpen={Boolean(whatsappTo)}
          handleClose={() => setWhatsappTo('')}
          isHeader
          width="500px"
          enableResponsive
          responsiveWidth="96vw"
          responsiveBreakpoint={1024}
          content={
            <SendWhatsappMessage handleClose={() => setWhatsappTo('')} initialNumber={whatsappTo} />
          }
        />
      ) : null}
    </div>
  );
};

export default External;

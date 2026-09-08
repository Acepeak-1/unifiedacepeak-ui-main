import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getContactList } from '@/services/api';
import CustomAvatar from '@/components/custom/custom-avatar';
import SideDrawer from '@/components/custom/side-drawer';
import SendWhatsappMessage from '@/pages/messenger/drawers/send-whatsapp-message';
import { useConsoleDialer } from '@/pages/phone/console/dial-number';
import { Ic } from '@/components/mcm/icons';
import { DirectoryPage, EmptyRow, FilterChip, SearchChip } from './page-shell';
import { usePeopleRows, type PersonRow } from './people-rows';
import { useDirectoryFavourites } from './use-directory-favourites';
import { InfoIcon, MoreVertical } from 'lucide-react';
import CustomTooltip from '@/components/custom/custom-tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import './favourites-theme.css';

/**
 * Directory ▸ Favourites — the people you keep coming back to.
 *
 * One list across both halves of the directory: colleagues you reach on an
 * extension, and outside contacts you reach on a number. They are different
 * records from different endpoints, so the row is normalised to the few things
 * a favourite is actually for — who they are, how to reach them, and the
 * actions — rather than showing two tables stacked.
 *
 * A starred record that no longer comes back from the server is simply not
 * shown. It is deliberately not un-starred: both lists are fetched with a limit,
 * so "absent from this page" does not mean "deleted", and pruning on that
 * assumption would quietly lose favourites.
 */

type FavouriteRow = {
  key: string;
  kind: 'person' | 'contact';
  id: string;
  name: string;
  image?: string;
  /** Department for a colleague, company for an outside contact. */
  org: string;
  role: string;
  /** Extension for a colleague, phone number for a contact. */
  reach: string;
  reachLabel: string;
  /** What a call should dial — an extension internally, a number externally. */
  dialTarget: string;
  phone: string;
  email: string;
  whatsapp: string;
  presence?: string;
  tone?: string;
};

const TONE_CLASS: Record<string, string> = {
  good: 'tag pos',
  busy: 'tag neg',
  warn: 'tag warn',
  idle: 'tag neu',
};

const contactName = (row: any) =>
  `${row?.name?.first || ''} ${row?.name?.last || ''}`.trim() || 'Unknown';

/* Sample favourites so the page has enough rows to look populated. Ids are
   prefixed 'dummy-' and never sent to the API — remove this block once real
   starred people/contacts fill the list out. */
const DUMMY_FAVOURITE_ROWS: FavouriteRow[] = [
  {
    key: 'dummy:person:1',
    kind: 'person',
    id: 'dummy-fav-1',
    name: 'Sara Mitchell',
    org: 'Sales',
    role: 'Agent',
    reach: '2001',
    reachLabel: 'Extension',
    dialTarget: '2001',
    phone: '',
    email: 'sara.mitchell@mcmbpo.com',
    whatsapp: '',
    presence: 'Available',
    tone: 'good',
  },
  {
    key: 'dummy:person:2',
    kind: 'person',
    id: 'dummy-fav-2',
    name: 'Priya Nair',
    org: 'Sales',
    role: 'Manager',
    reach: '2003',
    reachLabel: 'Extension',
    dialTarget: '2003',
    phone: '',
    email: 'priya.nair@mcmbpo.com',
    whatsapp: '',
    presence: 'On Call',
    tone: 'busy',
  },
  {
    key: 'dummy:contact:1',
    kind: 'contact',
    id: 'dummy-fav-3',
    name: 'Alex Thompson',
    org: 'Northwind Traders',
    role: 'Procurement Lead',
    reach: '+1 415 555 0132',
    reachLabel: 'Phone',
    dialTarget: '+14155550132',
    phone: '+1 415 555 0132',
    email: 'alex.thompson@northwind.example',
    whatsapp: '+14155550132',
  },
  {
    key: 'dummy:contact:2',
    kind: 'contact',
    id: 'dummy-fav-4',
    name: 'Maria Gonzalez',
    org: 'Bluepeak Logistics',
    role: 'Account Manager',
    reach: '+44 20 7946 0958',
    reachLabel: 'Phone',
    dialTarget: '+442079460958',
    phone: '+44 20 7946 0958',
    email: 'maria.gonzalez@bluepeak.example',
    whatsapp: '',
  },
];

const Favourites = () => {
  const navigate = useNavigate();
  const { dial } = useConsoleDialer();
  const { isFavourite, toggleFavourite, count } = useDirectoryFavourites();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('All');
  const [whatsappTo, setWhatsappTo] = useState('');

  const { rows: people, isLoading: peopleLoading, refetch: refetchPeople } = usePeopleRows();

  const {
    data: contacts = [],
    isPending: contactsLoading,
    refetch: refetchContacts,
  } = useQuery({
    /* Shares the ['getContactList'] prefix, so editing a contact refreshes
       this list too. */
    queryKey: ['getContactList', 'directoryFavourites'],
    queryFn: () => getContactList({ page: 1, limit: 200 }),
    select: (res: any) => res?.data?.data?.result?.rows || [],
  });

  const rows: FavouriteRow[] = useMemo(() => {
    const fromPeople = (people as PersonRow[])
      .filter((person) => isFavourite('person', person.uuid))
      .map((person) => ({
        key: `person:${person.uuid}`,
        kind: 'person' as const,
        id: person.uuid,
        name: person.name,
        image: person.image,
        org: person.department || person.location,
        role: person.jobTitle || person.role,
        reach: person.extension,
        reachLabel: 'Extension',
        dialTarget: person.extension,
        phone: person.phone,
        email: person.email,
        whatsapp: '',
        presence: person.presence,
        tone: person.tone,
      }));

    const fromContacts = (contacts as any[])
      .filter((contact) => isFavourite('contact', contact?._id))
      .map((contact) => ({
        key: `contact:${contact?._id}`,
        kind: 'contact' as const,
        id: String(contact?._id || ''),
        name: contactName(contact),
        image: contact?.profile?.contactPic,
        org: contact?.profile?.company || contact?.company || '',
        role: contact?.title || '',
        reach: contact?.contact?.phone || '',
        reachLabel: 'Phone',
        dialTarget: contact?.contact?.phone || '',
        phone: contact?.contact?.phone || '',
        email: contact?.contact?.email || '',
        whatsapp: contact?.social?.whatsapp || contact?.contact?.phone || '',
        presence: undefined,
        tone: undefined,
      }));

    return [...fromPeople, ...fromContacts, ...DUMMY_FAVOURITE_ROWS];
  }, [people, contacts, isFavourite]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (kind === 'Colleagues' && row.kind !== 'person') return false;
      if (kind === 'External' && row.kind !== 'contact') return false;
      if (!needle) return true;
      return [row.name, row.org, row.role, row.reach, row.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [rows, search, kind]);

  const isLoading = peopleLoading || contactsLoading;

  /** SMS goes to the inbox composer, the same route the other lists use. */
  const sendSms = (phone?: string) =>
    navigate(`/inbox?formState=contact&number=${encodeURIComponent(phone || '')}`);

  return (
    <div className="fav-theme">
      <DirectoryPage
        titleClassName="dir-serif-heading"
        title={
          <span className="flex items-center gap-2">
            Favourites
            <CustomTooltip
              text={
                <>
                  The people you reach most, colleagues and
                  <br />
                  outside contacts together, one click from here.
                </>
              }
              side="right"
              className="whitespace-normal text-left"
            >
              <InfoIcon className="w-4 h-4 text-gray-500 cursor-pointer" />
            </CustomTooltip>
          </span>
        }
        filters={
          <>
            <FilterChip
              label="Show"
              value={kind}
              options={['All', 'Colleagues', 'External']}
              onChange={setKind}
              tone="red"
            />
            <SearchChip value={search} onChange={setSearch} placeholder="Search favourites" />
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
              title="Refresh"
              aria-label="Refresh favourites"
              onClick={() => {
                refetchPeople();
                refetchContacts();
              }}
            >
              <Ic n="refresh" size={15} />
            </button>
            <span className="fchip live" style={{ marginLeft: 'auto' }}>
              <span className="num">{rows.length}</span> favourite{rows.length === 1 ? '' : 's'}
            </span>
          </>
        }
      >
        <table className="tbl">
          <colgroup>
            <col style={{ width: '17%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '21%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
          </colgroup>
          <thead>
            <tr className="tbl__head-row">
              <th className="tbl__th tbl__th--left">Name</th>
              <th className="tbl__th tbl__th--left">Type</th>
              <th className="tbl__th tbl__th--left">Team / Company</th>
              <th className="tbl__th tbl__th--left">Role</th>
              <th className="tbl__th tbl__th--left">Reach on</th>
              <th className="tbl__th tbl__th--left">Email</th>
              <th className="tbl__th tbl__th--left">Status</th>
              <th className="tbl__th tbl__th--center">Contact via</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <EmptyRow span={8} message="Loading favourites…" />
            ) : visible.length ? (
              visible.map((row) => (
                <tr key={row.key} className="tbl__row">
                  <td className="tbl__td tbl__td--left">
                    <span className="tbl__agent">
                      <CustomAvatar
                        name={row.name}
                        image={row.image}
                        type={row.kind === 'contact' ? 'contact' : undefined}
                        size="30"
                      />
                      <span className="tbl__name">{row.name}</span>
                    </span>
                  </td>
                  <td className="tbl__td tbl__td--left">
                    <span className={row.kind === 'person' ? 'tag acc' : 'tag neu'}>
                      {row.kind === 'person' ? 'Colleague' : 'External'}
                    </span>
                  </td>
                  <td className="tbl__td tbl__td--left tbl__value--muted">
                    {row.org || <span style={{ color: 'var(--ink-4)' }}>—</span>}
                  </td>
                  <td className="tbl__td tbl__td--left tbl__value--muted">
                    {row.role || <span style={{ color: 'var(--ink-4)' }}>—</span>}
                  </td>
                  <td className="tbl__td tbl__td--left num">
                    <span className="tbl__value">{row.reach || '—'}</span>
                    <span className="tbl__subtitle">{row.reachLabel}</span>
                  </td>
                  <td className="tbl__td tbl__td--left tbl__value--muted">
                    {row.email || <span style={{ color: 'var(--ink-4)' }}>—</span>}
                  </td>
                  <td className="tbl__td tbl__td--left">
                    {row.presence ? (
                      <span className={TONE_CLASS[row.tone || 'idle'] || 'tag neu'}>
                        {row.presence}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ink-4)' }}>—</span>
                    )}
                  </td>
                  <td className="tbl__td tbl__td--center" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="mini"
                          title={`Actions for ${row.name}`}
                          aria-label={`Actions for ${row.name}`}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-transparent">
                        <DropdownMenuItem
                          className="ppl-row-menu-item"
                          disabled={!row.dialTarget}
                          onSelect={() =>
                            row.dialTarget &&
                            dial(row.dialTarget, { forceRefreshContactInfo: true })
                          }
                        >
                          <Ic n="phone" size={14} />
                          Call
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="ppl-row-menu-item"
                          disabled={!row.phone}
                          onSelect={() => sendSms(row.phone)}
                        >
                          <Ic n="chat" size={14} />
                          Message
                        </DropdownMenuItem>
                        {/* WhatsApp routes off a real number, which colleagues
                            are not reachable on from here — so it is offered
                            only for external contacts. */}
                        {row.kind === 'contact' ? (
                          <DropdownMenuItem
                            className="ppl-row-menu-item"
                            disabled={!row.whatsapp}
                            onSelect={() => setWhatsappTo(row.whatsapp)}
                          >
                            <Ic n="send" size={14} />
                            WhatsApp
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          className="ppl-row-menu-item"
                          onSelect={() =>
                            row.kind === 'contact'
                              ? navigate(`/contact-activity?contactId=${row.id}`, {
                                  state: { key: 'phone', value: row.phone },
                                })
                              : navigate(`/department/extension/${row.id}`)
                          }
                        >
                          <Ic n="clock" size={14} />
                          Activity
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          className="ppl-row-menu-item"
                          onSelect={() => toggleFavourite(row.kind, row.id)}
                        >
                          <Ic n="star" size={14} fill />
                          Remove from favourites
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow
                span={8}
                message={
                  count
                    ? 'No favourites match those filters.'
                    : 'No favourites yet — open People or External Contacts and use the ☆ on a row to pin someone here.'
                }
              />
            )}
          </tbody>
        </table>

        {rows.length ? (
          <div className="mcm-tblfoot">
            Showing {visible.length} of {rows.length} favourite{rows.length === 1 ? '' : 's'}
          </div>
        ) : null}
      </DirectoryPage>

      {whatsappTo ? (
        <SideDrawer
          isOpen={Boolean(whatsappTo)}
          handleClose={() => setWhatsappTo('')}
          title="Send WhatsApp message"
          content={
            <SendWhatsappMessage handleClose={() => setWhatsappTo('')} initialNumber={whatsappTo} />
          }
        />
      ) : null}
    </div>
  );
};

export default Favourites;

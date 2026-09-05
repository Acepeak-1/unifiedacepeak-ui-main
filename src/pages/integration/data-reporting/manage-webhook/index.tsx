import { SearchIcon } from '@/components/custom/header/GlobalSearch';
import TableManager from '@/components/custom/table-manager';
import CustomTooltip from '@/components/custom/custom-tooltip';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import AddPathModal from '../modal/AddPathModal';
import { Dialog, DialogContent } from '@/components/ui/dialog';
// import Breadcrumb from '@/components/custom/breadcrumb';
import { editForm } from '../../constant';
import { Icon } from '@/assets/icons/icon';
import moment from 'moment';
import { handleAlert } from '@/lib/utils';

// const breadcrumbData = [{ label: 'Data & Reporting' }, { label: 'Manage Webhook' }];

const ManageWebhook = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalState, setModalState] = useState(false);
  const [editForm, setEditForm] = useState<editForm>({ isEdit: false, formData: {} });
  const handleEdit = (formData: any) => {
    setEditForm({ isEdit: true, formData });
    setModalState(true);
  };

  const copyPath = (value: string) => {
    if (!value) return;
    navigator?.clipboard?.writeText(value);
    handleAlert({ text: 'Path copied', type: 'success' });
  };

  /* Cell rendering only — the list still needs a data source (see the
     commented fetcher below), but with these in place the table is correct
     the moment one is wired: a real date, the type as a badge, the path in
     mono with a copy button, and a row action that reaches the edit mode
     AddPathModal already supports. */
  const columns = [
    {
      header: 'Created Date',
      accessorKey: 'created_at',
      cell: ({ getValue }: any) => {
        const raw = getValue();
        const date = raw ? moment(raw) : null;
        return (
          <span className="whitespace-nowrap">
            {date?.isValid() ? date.format('DD MMM YYYY, h:mm A') : '--'}
          </span>
        );
      },
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ getValue }: any) => {
        const value = String(getValue() || '').trim();
        if (!value) return <span className="text-gray-400">--</span>;
        /* Plain text, not a coloured chip: a red type badge sat next to the
           green/grey status pill and the row carried two competing colours
           that meant different things. Status keeps the colour. */
        const label = value
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
          /* Capitalising word-by-word turned SMS/MMS into "Sms"/"Mms". */
          .replace(/\b(Sms|Mms|Api|Id|Url)\b/g, (w) => w.toUpperCase());
        return <span className="mcm-wh-type">{label}</span>;
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }: any) => {
        const value = String(getValue() || 'active');
        return (
          <span className={`mcm-intstatus ${value === 'active' ? 'connected' : ''}`}>
            <i />
            {value === 'active' ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      header: 'Path',
      accessorKey: 'path',
      cell: ({ getValue }: any) => {
        const value = String(getValue() || '');
        if (!value) return <span className="text-gray-400">--</span>;
        /* Truncating the tail hid the only part that tells two hooks apart
           ("…/call-completed" vs "…/sms-inbound"), so drop the middle. */
        const shown =
          value.length > 52 ? `${value.slice(0, 26)}…${value.slice(-22)}` : value;
        return (
          <div className="mcm-wh-path">
            <Icon name="LinkIcon" className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span title={value}>{shown}</span>
            <CustomTooltip text="Copy path" side="top">
              <button type="button" onClick={() => copyPath(value)} aria-label="Copy path">
                <Icon name="Copy" className="h-3.5 w-3.5" />
              </button>
            </CustomTooltip>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: ({ row }: any) => (
        <div className="mcm-wh-actions">
          <CustomTooltip text="Edit" side="top">
            <button
              type="button"
              onClick={() => handleEdit(row?.original)}
              aria-label="Edit webhook"
            >
              <Icon name="EditStrokIcon" className="h-4 w-4" />
            </button>
          </CustomTooltip>
        </div>
      ),
    },
  ];
  /* Demo rows so the table can be shown before the list endpoint exists.
     Delete this block and pass `fetcherKey` / `fetcherFn` instead once the
     API is available — nothing else on the page has to change. */
  const demoWebhooks = [
    {
      id: 'demo-1',
      status: 'active',
      created_at: '2026-08-28T09:24:00Z',
      type: 'call_completed',
      path: 'https://hooks.zapier.com/hooks/catch/1842093/call-completed',
    },
    {
      id: 'demo-2',
      status: 'active',
      created_at: '2026-08-30T14:05:00Z',
      type: 'sms_received',
      path: 'https://hooks.zapier.com/hooks/catch/1842093/sms-inbound',
    },
    {
      id: 'demo-3',
      status: 'inactive',
      created_at: '2026-09-01T11:47:00Z',
      type: 'contact_created',
      path: 'https://api.acme-crm.example.com/webhooks/contacts',
    },
    {
      id: 'demo-4',
      status: 'active',
      created_at: '2026-09-02T08:12:00Z',
      type: 'voicemail_left',
      path: 'https://hooks.zapier.com/hooks/catch/1842093/voicemail',
    },
  ];

  const countBy = (key: string) => demoWebhooks.filter((w) => w.status === key).length;
  const statTiles = [
    { key: 'all' as const, label: 'Total webhooks', count: demoWebhooks.length, tone: '' },
    { key: 'active' as const, label: 'Active', count: countBy('active'), tone: 'ok' },
    { key: 'inactive' as const, label: 'Inactive', count: countBy('inactive'), tone: 'off' },
  ];
  const visibleWebhooks =
    statusFilter === 'all' ? demoWebhooks : demoWebhooks.filter((w) => w.status === statusFilter);

  const handleClose = () => setModalState(false);
  const handleOpen = () => {
    setEditForm({ isEdit: false, formData: {} });
    setModalState(true);
  };
  return (
    <div className="mcm-intpage w-full min-w-0 bg-gray-200/15 flex flex-col overflow-hidden">
      {/* <Breadcrumb breadcrumbs={breadcrumbData} /> */}
      <div className="mcm-intpage-head">
        <div className="mcm-intpage-eyebrow">Integration</div>
        {/* Title and actions share a row — see the CRM page; keeps the search
            anchored to the heading instead of floating mid-head. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {/* Description behind the "i", as on the CRM page. */}
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <h1>Manage Webhook</h1>
            <CustomTooltip
              side="bottom"
              sideOffset={10}
              className="mcm-tooltip-info"
              text="Endpoints the console posts to when calls, messages or contacts change."
            >
              <span className="mcm-intpage-info">i</span>
            </CustomTooltip>
            <div className="mcm-segmented" role="group" aria-label="Filter webhooks by status">
              {statTiles.map((tile) => (
                <button
                  key={tile.key}
                  type="button"
                  aria-pressed={statusFilter === tile.key}
                  className={statusFilter === tile.key ? 'is-active' : ''}
                  onClick={() => setStatusFilter(tile.key)}
                >
                  {tile.key === 'all' ? 'All' : tile.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mcm-intpage-search flex items-center gap-2">
            <Input
              placeholder="Search webhooks"
              className="pl-9"
              IconPosition="left-0 pl-3 inset-y-0"
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                if (value.startsWith(' ')) return;
                setSearch(value);
              }}
              Icon={<SearchIcon />}
            />
            <button type="button" className="btn primary" onClick={handleOpen}>
              <Icon name="PlusIcon" className="w-3 h-3" />
              New webhook
            </button>
          </div>
        </div>
      </div>

      <>
        <div className="mcm-intbody w-full p-3 flex flex-col gap-2 overflow-y-auto">
          <TableManager
            {...{
              // fetcherKey: 'callListingLog',
              // fetcherFn: callList,
              columns,
              search,
              staticData: visibleWebhooks,
              /* No fixed table height: the table had its own inner scrollbar
                 while the page had another. The content area scrolls instead. */
              isHeightSet: false,
              clientSideSearch: true,
              emptyTablePlaceholder: 'No webhooks yet',
              descriptionEmptyTable: 'Send call and message events to any URL you choose.',
              /* First-run state, not a failed search — so a branded webhook
                 mark instead of the magnifying-glass "no results" artwork. */
              emptyImage: (
                <span className="mcm-wh-emptymark">
                  <Icon name="WebhookIcon" />
                </span>
              ),
              /* The empty state said what to do but gave nothing to do it
                 with; the action that fixes it belongs here. */
              emptyAction: (
                <button type="button" className="btn primary" onClick={handleOpen}>
                  <Icon name="PlusIcon" className="w-3 h-3" />
                  Create webhook
                </button>
              ),
            }}
          />
        </div>
        <Dialog open={modalState} onOpenChange={setModalState}>
          <DialogContent className="w-[calc(100vw_-_2rem)] max-w-lg p-3" showCloseButton={false}>
            <AddPathModal handleClose={handleClose} editForm={editForm} />
          </DialogContent>
        </Dialog>
      </>
    </div>
  );
};

export default ManageWebhook;

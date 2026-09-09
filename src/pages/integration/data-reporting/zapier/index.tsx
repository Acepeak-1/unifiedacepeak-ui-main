import { Info } from 'lucide-react';
import { useState } from 'react';
import ZapierViewModal from '../modal/ZapierViewModal';
import { ChevronIcon } from '@/assets/icons';
// import Breadcrumb from '@/components/custom/breadcrumb';
import { reportingData } from '../../constant';
import CustomTooltip from '@/components/custom/custom-tooltip';
import { Input } from '@/components/ui/input';
import { SearchIcon } from '@/components/custom/header/GlobalSearch';

// const breadcrumbData = [{ label: 'Data & Reporting' }, { label: 'Zapier' }];

const Zapier = () => {
  const zapierItems = reportingData['zapier']?.items;
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'connected' | 'setup' | 'disconnected'>('all');
  const handleClose = () => setModalOpen(null);
  const handleConnect = (name: string) => setModalOpen(name);

  /* Status/sync are demo values on the items (see constant.ts) until the API
     returns real ones. */
  const statusOf = (item: any) => item?.status || 'disconnected';

  const visibleItems = (zapierItems || []).filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item?.title?.toLowerCase()?.includes(q) ||
      item?.description?.toLowerCase()?.includes(q);
    const matchesFilter = filter === 'all' || statusOf(item) === filter;
    return matchesSearch && matchesFilter;
  });

  const countBy = (key: string) => (zapierItems || []).filter((i) => statusOf(i) === key).length;
  const filterTabs = [
    { key: 'all' as const, label: 'Total apps', count: zapierItems?.length ?? 0, tone: '' },
    { key: 'connected' as const, label: 'Connected', count: countBy('connected'), tone: 'ok' },
    { key: 'setup' as const, label: 'Setup', count: countBy('setup'), tone: 'warn' },
    {
      key: 'disconnected' as const,
      label: 'Not connected',
      count: countBy('disconnected'),
      tone: 'off',
    },
  ];

  const STATUS_LABEL: Record<string, string> = {
    connected: 'Connected',
    setup: 'Setup required',
    disconnected: 'Not connected',
  };
  return (
    <div className="mcm-intpage w-full min-w-0 bg-gray-200/15 flex flex-col overflow-hidden">
      {/* <Breadcrumb breadcrumbs={breadcrumbData} /> */}
      <div className="mcm-intpage-head">
        <div className="mcm-intpage-eyebrow">Integration</div>
        {/* Title and filter share one packed group instead of each owning a
            full card-width column — see CRM for why. */}
        <div className="mcm-intpage-headrow">
          <div className="mcm-intpage-headleft">
            <div className="flex min-w-0 items-center gap-2">
              <h1>Zapier</h1>
              <CustomTooltip
                side="bottom"
                sideOffset={10}
                className="mcm-tooltip-info"
                text="Send console events into Zapier so they can trigger workflows in your other tools."
              >
                <Info className="mcm-intpage-info" />
              </CustomTooltip>
            </div>

            <div className="mcm-segmented" role="group" aria-label="Filter apps by status">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={filter === tab.key}
                  className={filter === tab.key ? 'is-active' : ''}
                  onClick={() => setFilter(tab.key)}
                >
                  {tab.key === 'all' ? 'All' : tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mcm-intpage-search">
            <Input
              placeholder="Search apps"
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
          </div>
        </div>
      </div>
      {/* Same grid and card system as the CRM page rather than a parallel
          hand-rolled one, so both screens stay in step. */}
      <div className="mcm-intgrid">
        {visibleItems.map((item, index) => (
          <div key={index} className="mcm-intcard">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-3 w-full">
                <div className="flex shrink-0 items-center justify-center bg-gray-100 rounded-lg p-3 h-16 w-16">
                  <img src={item.icon} alt={item.title} className="w-10 h-10 object-contain" />
                </div>
                <h4 className="text-start font-semibold text-primary flex-1 min-w-0 truncate">
                  {item.title}
                </h4>
              </div>
              <p className="text-gray-700 text-sm whitespace-normal">{item.description}</p>
            </div>
            <div className="mcm-intcard-meta">
              <span className={`mcm-intstatus ${statusOf(item)}`}>
                <i />
                {STATUS_LABEL[statusOf(item)]}
              </span>
              {item?.lastSync ? (
                <span className="mcm-intcard-sync">Synced {item.lastSync}</span>
              ) : null}
            </div>
            <div
              className="mcm-intcard-cta flex items-center text-primary cursor-pointer mt-auto"
              onClick={() => handleConnect(item?.id)}
            >
              <span>{statusOf(item) === 'connected' ? 'Manage' : 'Connect'}</span>
              <ChevronIcon className="-rotate-90" />
            </div>
          </div>
        ))}
        {visibleItems.length === 0 && (
          <p className="text-sm text-gray-500 py-6">No apps match “{search.trim()}”.</p>
        )}
      </div>
      {modalOpen && (
        <ZapierViewModal
          handleClose={handleClose}
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
        />
      )}
    </div>
  );
};

export default Zapier;

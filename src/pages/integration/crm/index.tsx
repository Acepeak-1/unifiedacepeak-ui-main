import { useEffect, useState } from 'react';
import { Icon } from '@/assets/icons/icon';
import { SearchIcon } from '@/components/custom/header/GlobalSearch';
import CustomTooltip from '@/components/custom/custom-tooltip';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronIcon } from '@/assets/icons';
import { CRMDisconnect, crmGetToken, CRMIsConnected, hubspotCRM } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AlertConfirm from '@/components/custom/alert-confirm';
import { crmList, crmListProps } from '../constant';
import SideDrawer from '@/components/custom/side-drawer';
import CRMConfigration from './configration';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const CRMIntegration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [drawerState, setDrawerState] = useState<boolean>(false);
  const [drawerData, setDrawerData] = useState<crmListProps>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'connected' | 'available' | 'soon'>('all');
  const [deleteAlertModal, setDeleteAlertModal] = useState<Record<string, boolean>>({});
  const [mondaySetupModal, setMondaySetupModal] = useState<boolean>(false);
  const queryClient: any = useQueryClient();
  const activeDeleteKey = Object?.keys(deleteAlertModal)?.find((key) => deleteAlertModal[key]);
  console.log(activeDeleteKey, 'activeDeleteKey', deleteAlertModal);

  const { data: crmIsConnectedData = [] } = useQuery({
    queryKey: ['CRMIsConnected'],
    queryFn: () => CRMIsConnected(),
    select: (data) => data?.data?.data?.result || [],
  });

  const { mutateAsync: hubspotCRMMutation } = useMutation({
    mutationKey: ['crmIntegration'],
    mutationFn: hubspotCRM,
  });

  const handleConnect = async (crm: crmListProps, bypassModal = false) => {
    const type = crm?.label?.split('-')?.[0]?.toUpperCase();

    if (crm.id === 'Monday' && !bypassModal) {
      setMondaySetupModal(true);
      return;
    }

    try {
      const response = await hubspotCRMMutation(type);
      const url = response?.data?.data?.result;

      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Failed to connect CRM:', error);
    }
  };

  const { mutate: mutateGetToken } = useMutation({
    mutationFn: crmGetToken,
    onSettled: () => navigate(window.location.pathname, { replace: true }),
    onSuccess: () => queryClient.invalidateQueries(['CRMIsConnected'], { exact: true }),
  });

  const { mutate: mutateDisconnect, isPending } = useMutation({
    mutationKey: ['CRMDisconnect'],
    mutationFn: CRMDisconnect,
    onSuccess: () => {
      if (activeDeleteKey) {
        setDeleteAlertModal((prev) => ({ ...prev, [activeDeleteKey]: false }));
      }
      queryClient.invalidateQueries(['CRMIsConnected']);
    },
  });
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      navigate(window.location.pathname, { replace: true });
      return;
    }
    if (code && state) {
      mutateGetToken({ code, type: state });
    }
  }, [searchParams]);

  const getConnectionStatus = (crmName: string) => {
    const connectedItem = crmIsConnectedData?.find((item: { type: string }) =>
      crmName?.toLowerCase()?.includes(item?.type?.toLowerCase()),
    );
    return connectedItem?.is_connected || false;
  };

  const getConnectedItem = (crmName: string) => {
    return crmIsConnectedData?.find((item: { type: string }) =>
      crmName?.toLowerCase()?.includes(item?.type?.toLowerCase()),
    );
  };

  const matchesSearch = (crm: crmListProps) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      crm?.name?.toLowerCase()?.includes(q) ||
      crm?.alt?.toLowerCase()?.includes(q) ||
      crm?.description?.toLowerCase()?.includes(q)
    );
  };

  const matchesFilter = (crm: crmListProps) => {
    if (filter === 'connected') return getConnectionStatus(crm.id);
    if (filter === 'soon') return Boolean(crm?.comingSoon);
    if (filter === 'available') return !crm?.comingSoon && !getConnectionStatus(crm.id);
    return true;
  };

  const visibleCrmList = crmList?.filter((crm) => matchesSearch(crm) && matchesFilter(crm));

  /* Counts drive the tab labels, so a tab that would show nothing says so
     before it is clicked. */
  const counts = {
    all: crmList?.length ?? 0,
    connected: crmList?.filter((c) => getConnectionStatus(c.id)).length ?? 0,
    available: crmList?.filter((c) => !c?.comingSoon && !getConnectionStatus(c.id)).length ?? 0,
    soon: crmList?.filter((c) => Boolean(c?.comingSoon)).length ?? 0,
  };
  const filterTabs = [
    { key: 'all' as const, label: 'All', count: counts.all },
    { key: 'connected' as const, label: 'Connected', count: counts.connected },
    { key: 'available' as const, label: 'Available', count: counts.available },
    { key: 'soon' as const, label: 'Coming soon', count: counts.soon },
  ];

  return (
    <section className="mcm-intpage">
      <div className="mcm-intpage-head">
        <div className="mcm-intpage-eyebrow">Integration</div>
        {/* One row, three cells on the same columns as the cards below: the
            title over the first, the filter over the second, the search over
            the third. It was a flex row with the filter nudged along by a
            110px margin, so nothing in the head lined up with anything in
            the grid. */}
        <div className="mcm-intpage-headrow">
          {/* Title and filter share one packed group instead of each owning a
              full card-width column — a lone short title otherwise left a
              long dead stretch before the tabs started. */}
          <div className="mcm-intpage-headleft">
            <div className="flex min-w-0 items-center gap-2">
            <h1>CRM</h1>
            <CustomTooltip
              side="bottom"
              sideOffset={10}
              className="mcm-tooltip-info"
              text="Connect the system your team already works in, so calls, contacts and activity flow both ways."
            >
              <span className="mcm-intpage-info">i</span>
            </CustomTooltip>
            </div>

            <div className="mcm-segmented" role="group" aria-label="Filter integrations">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={filter === tab.key}
                className={filter === tab.key ? 'is-active' : ''}
                onClick={() => setFilter(tab.key)}
              >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mcm-intpage-search">
            <Input
              placeholder="Search integrations"
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
      <div className="mcm-intgrid">
        {/* Available integrations lead; coming-soon entries sit at the end
            rather than interleaved between things you can actually use. */}
        {[...(visibleCrmList || [])]
          .sort((a, b) => Number(Boolean(a.comingSoon)) - Number(Boolean(b.comingSoon)))
          .map((crm) => {
          const isConnected = getConnectionStatus(crm.id);
          console.log(isConnected, 'isConnectedisConnectedd');

          return (
            <div key={crm?.name} className="mcm-intcard">
              <div className="flex flex-col gap-2 w-full">
                {/* Logo, name and menu share one row — the old stacked layout
                    left the logo alone beside a card-wide empty gap. */}
                <div className="flex items-center gap-3 w-full">
                  <div className="flex shrink-0 items-center justify-center bg-gray-100 rounded-lg p-3 h-16 w-16">
                    <img src={crm?.image} alt={crm?.alt} className="w-10 h-10 object-contain" />
                  </div>
                  <h4 className="text-start font-semibold text-primary flex-1 min-w-0 truncate">
                    {crm.name}
                  </h4>

                  {isConnected && (
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Icon name="MenuDots" className="h-5 rotate-90 cursor-pointer" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setDrawerState(true);
                            setDrawerData(crm);
                          }}
                        >
                          <Icon name="EditStrokIcon" className="!w-4.5 !h-4.5" />
                          Manage
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteAlertModal({ [crm?.id]: true })}
                        >
                          <Icon name="TrashBin" className="!w-4.5 !h-4.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <p className="text-gray-700 text-sm whitespace-normal">{crm.description}</p>
              </div>
              {!isConnected ? (
                <div
                  className={`mcm-intcard-cta flex items-center text-primary cursor-pointer mt-auto ${crm?.comingSoon ? 'is-soon' : ''}`}
                  onClick={() => !crm?.comingSoon && handleConnect(crm)}
                >
                  <span>{crm?.comingSoon ? 'Coming soon' : 'Connect'}</span>
                  {!crm?.comingSoon && <ChevronIcon className="-rotate-90" />}
                </div>
              ) : (
                <div className="flex w-full items-center justify-between mt-auto">
                  <Switch className="cursor-pointer" checked={isConnected} />
                  <div className="flex items-center gap-1.5 text-[11.5px] text-gray-600 bg-primary/5 px-3 py-1.5 rounded-md border border-primary/10">
                    <Icon name="InfoIcon" className="w-3.5 h-3.5 text-primary" />
                    <span>
                      <span className="font-semibold text-primary">Tip:</span> Manage settings from
                      the menu
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {visibleCrmList?.length === 0 && (
          <p className="text-sm text-gray-500 py-6">No integrations match “{search.trim()}”.</p>
        )}
        <AlertConfirm
          {...{
            onConfirm: () => {
              const convertToUppercase = activeDeleteKey?.toUpperCase();
              mutateDisconnect({ type: convertToUppercase });
            },
            apiLoading: isPending,
            open: !!activeDeleteKey,
            setOpen: (val) => {
              if (!val && activeDeleteKey) {
                setDeleteAlertModal((prev) => ({ ...prev, [activeDeleteKey]: false }));
              }
            },
          }}
        />
        {drawerState && (
          <SideDrawer
            isOpen={drawerState}
            title="Configurations"
            isTab={false}
            enableResponsive
            responsiveWidth="96vw"
            responsiveBreakpoint={1024}
            handleClose={() => setDrawerState(false)}
            content={<CRMConfigration drawerData={drawerData} setDrawerState={setDrawerState} />}
          />
        )}
        {mondaySetupModal && (
          <Dialog open={mondaySetupModal} onOpenChange={setMondaySetupModal}>
            <DialogContent className="max-w-md p-6 rounded-2xl border border-gray-100 bg-white shadow-2xl">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <img
                    src={crmList.find((item) => item.id === 'Monday')?.image}
                    alt="Monday"
                    className="w-10 h-10 object-contain"
                  />
                  <div className="h-6 w-px bg-slate-200" />
                  {/* <img src={McmLogo} alt="UCAAS" className="w-10 h-10 object-contain" /> */}
                </div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Monday Integration Setup
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 max-w-xs">
                  To connect monday.com, please follow these steps:
                </DialogDescription>
              </div>

              <div className="flex flex-col gap-3.5 my-6">
                <div className="flex gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                    1
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-gray-800">Install Monday App</span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      Click the install button to install the app.
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                    2
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-gray-800">
                      Authorize Connection
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      After installing, click connect to sync contacts and call logs.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    const appUrl = getConnectedItem('Monday')?.app_url;
                    if (appUrl) {
                      window.open(appUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="flex-1 flex items-center justify-center h-10 text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/10 transition-all active:scale-[0.98]"
                >
                  Step 1: Install App
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMondaySetupModal(false);
                    const crm = crmList.find((item) => item.id === 'Monday');
                    if (crm) handleConnect(crm, true);
                  }}
                  className="flex-1 flex items-center justify-center h-10 text-sm font-bold text-white bg-primary hover:bg-primary/95 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  Step 2: Connect
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </section>
  );
};

export default CRMIntegration;

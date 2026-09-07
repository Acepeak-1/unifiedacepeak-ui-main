import { FC, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { deleteGreeting, deleteMedia, getGreetings } from '@/services/api';
import { Icon, IconName } from '@/assets/icons/icon';
import TableManager from '@/components/custom/table-manager';
import CustomSelect from '@/components/custom/custom-select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Info, MoreVertical, Play, RefreshCcw, Search } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import {
  capitalizeFirstLetter,
  DEFAULT_RECORDING_UUIDS,
  formatDate,
  formatDuration,
  formatSize,
  getEnv,
  handleAlert,
  MEDIA_URL,
} from '@/lib/utils';
import AudioModal from '@/pages/phone/audio-dialog';
import AlertConfirm from '@/components/custom/alert-confirm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AddGreeting from '../add-greeting';
import EditGreeting from '../edit-greeting';
import CustomTooltip from '@/components/custom/custom-tooltip';
import { useCompanyFeatures } from '@/hooks/rbac';

/* UI-testing only: flip to false (or delete this block and its two use
   sites below) to go back to the real API-backed table/empty state
   exactly as it was. While true, TableManager's own `staticData` prop
   bypasses its live query entirely — nothing about getGreetings, the
   real fetch, or the real empty-state path is changed; it's just not
   what's driving the table's data while this flag is on. */
const USE_MOCK_MEDIA_DATA = true;
const MOCK_MEDIA_FILES = [
  {
    uuid: 'mock-uuid-1',
    name: 'Welcome Greeting - Main Line',
    filename: 'welcome-main-line.mp3',
    type: 'greeting',
    size: 1258291,
    duration: 18,
    created_at: '2025-08-12',
    is_default: true,
  },
  {
    uuid: 'mock-uuid-2',
    name: 'After Hours Greeting',
    filename: 'after-hours-greeting.mp3',
    type: 'greeting',
    size: 987000,
    duration: 32,
    created_at: '2025-08-20',
    is_default: false,
  },
  {
    uuid: 'mock-uuid-3',
    name: 'Holiday Season Greeting',
    filename: 'holiday-greeting.mp3',
    type: 'greeting',
    size: 2202009,
    duration: 65,
    created_at: '2025-09-01',
    is_default: false,
  },
  {
    uuid: 'mock-uuid-4',
    name: 'IVR Main Menu Prompt',
    filename: 'ivr-main-menu.mp3',
    type: 'prompt',
    size: 512000,
    duration: 24,
    created_at: '2025-07-15',
    is_default: false,
  },
  {
    uuid: 'mock-uuid-5',
    name: 'Sales Department Prompt',
    filename: 'sales-dept-prompt.mp3',
    type: 'prompt',
    size: 665600,
    duration: 21,
    created_at: '2025-08-05',
    is_default: false,
  },
  {
    uuid: 'mock-uuid-6',
    name: 'Support Queue Hold Prompt',
    filename: 'support-hold-prompt.mp3',
    type: 'prompt',
    size: 1887436,
    duration: 48,
    created_at: '2025-08-28',
    is_default: false,
  },
  {
    uuid: 'mock-uuid-7',
    name: 'Standard Voicemail Greeting',
    filename: 'standard-voicemail.mp3',
    type: 'voicemail',
    size: 819200,
    duration: 15,
    created_at: '2025-06-30',
    is_default: false,
  },
  {
    uuid: 'mock-uuid-8',
    name: 'Sales Team Voicemail',
    filename: 'sales-voicemail.mp3',
    type: 'voicemail',
    size: 1153434,
    duration: 29,
    created_at: '2025-09-03',
    is_default: false,
  },
];

const GreetingContent: FC = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [recordingUrl, serRecordingUrl] = useState<any>('');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  /* Briefly self-reveals on load, same as the other My Account pages' own
     info tooltip, so the icon reads as interactive before anyone hovers
     it. */
  const [showHeaderHint, setShowHeaderHint] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowHeaderHint(false), 700);
    return () => clearTimeout(timer);
  }, []);
  const { features } = useCompanyFeatures();
  const greetingAccess = features?.plan_features?.settings?.action?.greeting || {};
  const [modalState, setModalState] = useState<any>({
    playMedia: false,
    isEdit: false,
    isDelete: false,
  });
  const [drawerState, setDrawerState] = useState<any>(false);
  const [greetingData, setGreetingData] = useState<any>(null);
  /* Slug in the URL -> the type this page renders. The plural slugs are the
     current ones; the `type-` forms are the old paths, still routed as
     redirects, and still matched here so a direct hit on one resolves to the
     right library instead of silently falling back to "all". */
  const TYPE_SLUGS: Record<string, string> = {
    voicemail: 'voicemail',
    prompts: 'prompt',
    greetings: 'greeting',
    'type-voicemail': 'voicemail',
    'type-prompt': 'prompt',
    'type-greeting': 'greeting',
  };
  /* One of the type slugs is `greetings`, and this page is also mounted at
     `/greetings`. So the last segment alone cannot say whether it is a type or
     the mount itself: at `/greetings` the answer is "all", at
     `/greetings/greetings` it is the greetings library. Strip the segment and
     look at what is left — an empty base means we were standing on the mount. */
  const trimmed = pathname.replace(/\/+$/, '');
  const lastSegment = trimmed.split('/').pop() || '';
  const candidateBase = trimmed.slice(0, trimmed.length - lastSegment.length - 1);
  const isTypeSegment = Boolean(TYPE_SLUGS[lastSegment]) && candidateBase !== '';

  const type = isTypeSegment ? TYPE_SLUGS[lastSegment] : 'all';

  /* The type routes exist under every place this page is mounted, but only the
     standalone greetings area has a sidebar linking to them — under
     My Account > Media Files they were reachable by typing a URL and no other
     way. The base is whatever precedes the type segment, so the tabs follow the
     mount wherever it is. */
  const typeBase = isTypeSegment ? candidateBase : trimmed;
  const TYPE_TABS = [
    { key: 'all', label: 'All', to: typeBase },
    { key: 'greeting', label: 'Greetings', to: `${typeBase}/greetings` },
    { key: 'prompt', label: 'Prompts', to: `${typeBase}/prompts` },
    { key: 'voicemail', label: 'Voicemail', to: `${typeBase}/voicemail` },
  ];

  /* One page serves four different libraries, so the description follows the
     type rather than saying something vague enough to cover all of them. */
  const typeBlurb: Record<string, string> = {
    greeting: 'Recordings callers hear when they reach you — welcome messages and hold music.',
    prompt: 'Recordings played inside IVR menus to tell callers what their options are.',
    voicemail:
      'Recordings played when a call goes to voicemail, before the caller leaves a message.',
    all: 'Audio this account can use for greetings, IVR prompts and voicemail.',
  };

  function handleOpenAudio(src: string) {
    serRecordingUrl(src);
    setModalState({ playMedia: true });
  }

  const { mutateAsync: mutateDeleteMedia, isPending: PendingMedia } = useMutation({
    mutationFn: deleteMedia,
  });
  const { mutateAsync: mutateDeleteGreeting, isPending: PendingGreeting } = useMutation({
    mutationFn: deleteGreeting,
  });

  const handleDeleteGreeting = async () => {
    try {
      const result = await mutateDeleteGreeting(greetingData?.uuid);
      await mutateDeleteMedia({
        uuid: user?.company_info?.uuid,
        type: greetingData?.type,
        file_name: greetingData?.filename,
      });
      await queryClient.invalidateQueries({ queryKey: ['greetingList'] });
      setModalState({ isDelete: false });
      setGreetingData(null);
      handleAlert({
        text: result?.data?.data?.message || 'Record deleted successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('FAILED TO ADD GREETING: ', error);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      meta: { textAlign: 'left' },
    },
    {
      header: 'Size',
      accessorKey: 'size',
      cell: ({ getValue }: any) => <div className="text-gray-600">{formatSize(getValue())}</div>,
      meta: { textAlign: 'center' },
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ getValue }: any) => (
        <div className="text-gray-600">{capitalizeFirstLetter(getValue())}</div>
      ),
      meta: { textAlign: 'center' },
    },
    {
      header: 'Duration',
      accessorKey: 'duration',
      cell: ({ getValue }: any) => (
        <div className="text-gray-600">{formatDuration(getValue())}</div>
      ),
      meta: { textAlign: 'center' },
    },
    {
      header: 'Created At',
      accessorKey: 'created_at',
      cell: ({ getValue }: any) => <div className="text-gray-600">{formatDate(getValue())}</div>,
      meta: { textAlign: 'center' },
    },
    {
      header: 'Action',
      accessorKey: 'action',
      /* Same pattern as the AI Receptionist table this page is matching:
         the primary action (Play) stays a one-click circular button, and
         only the secondary ones (Edit/Delete) sit behind the 3-dot menu
         — same handlers/gating as before, just regrouped. */
      cell: (props: any) => {
        const data = props?.row?.original;
        const srcUrl = DEFAULT_RECORDING_UUIDS?.includes(data?.uuid)
          ? `${getEnv().VITE_API_BASE_URL}/api/media/default/recording/${data?.filename}`
          : `${MEDIA_URL}/${user?.company_info?.uuid}/greeting/${data?.filename}`;
        const canEdit = greetingAccess?.edit && !data?.is_default;
        const canDelete = greetingAccess?.delete && !data?.is_default;
        return (
          <div className="flex w-full items-center justify-center gap-2">
            <CustomTooltip text="Play" side="top">
              <button
                type="button"
                onClick={() => handleOpenAudio(srcUrl)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-50! text-blue-600! transition-colors hover:bg-blue-600! hover:text-white!"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            </CustomTooltip>
            {(greetingAccess?.edit || greetingAccess?.delete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="More actions"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-neutral-100! text-neutral-500! transition-colors hover:bg-neutral-200! hover:text-neutral-900!"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {greetingAccess?.edit && (
                    <DropdownMenuItem
                      disabled={!canEdit}
                      onClick={() => {
                        setGreetingData(data);
                        setModalState({ isEdit: true });
                      }}
                    >
                      <Icon name={'EditStrokIcon' as IconName} className="w-4 h-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {greetingAccess?.delete && (
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={!canDelete}
                      onClick={() => {
                        setGreetingData(data);
                        setModalState({ isDelete: true });
                      }}
                    >
                      <Icon name={'TrashBin' as IconName} className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
      meta: { textAlign: 'center' },
    },
  ];

  const activeTab = TYPE_TABS.find((tab) => tab.key === type) || TYPE_TABS[0];
  const [isTableRefreshing, setIsTableRefreshing] = useState(false);
  const mediaTableRef = useRef<any>(null);

  return (
    // <section className="w-full overflow-auto max-h-[calc(100vh-64px)] ">
    <section className="acepeak-media-files w-full overflow-auto  ">
      {/* Same heading treatment as the other My Account pages' own style
         blocks (Greetings, Preferences, My Phone, Notifications) —
         duplicated per-page rather than shared, since each page owns its
         scope there too. */}
      <style>{`
        .acepeak-media-files .acepeak-page-title {
          font-family: 'Instrument Serif', serif;
          font-style: italic;
          font-weight: 400;
          font-size: 27px;
          line-height: 41px;
          color: #171717;
        }
        .acepeak-tooltip-content {
          background: #fdf7f5 !important;
          color: #000 !important;
          border: none !important;
          width: max-content !important;
          max-width: 340px !important;
          white-space: normal !important;
          line-height: 1.5 !important;
          box-shadow: 0 6px 20px rgba(17, 17, 17, 0.18) !important;
        }
        .acepeak-tooltip-content svg {
          fill: #fdf7f5 !important;
        }
        .acepeak-media-files .acepeak-info-trigger:hover {
          color: #DC2626;
        }
      `}</style>
      <div className="flex items-center justify-between p-3 border-b border-gray-200 min-h-[65px] bg-white">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="acepeak-page-title text-gray-900 font-semibold">
              Media Files
            </p>
            <Tooltip open={showHeaderHint || undefined}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="acepeak-info-trigger inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-400"
                  aria-label="About this page"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="acepeak-tooltip-content" side="right" align="center">
                {typeBlurb[type] || typeBlurb.all}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        {greetingAccess?.add && !drawerState && (
          <Button
            className="min-h-9 bg-black! text-white! border-black! hover:bg-neutral-800!"
            type="button"
            variant={'outline'}
            onClick={() => setDrawerState(true)}
          >
            <Icon name="Plus" className="w-3 h-3" /> Add
          </Button>
        )}
      </div>
      {drawerState ? (
        <div className="w-full flex justify-center py-6 px-4 bg-gray-50/50 ">
          <div className=" w-full max-w-[800px] bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Media File</h2>
                <p className="text-sm text-gray-500 mt-1">Create or upload a new audio file</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDrawerState(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-8 px-3"
              >
                <Icon name="CloseIcon" className="w-3 h-3" />
              </Button>
            </div>

            <AddGreeting
              drawerState={drawerState}
              setDrawerState={setDrawerState}
              greetingType={type}
            />
          </div>
        </div>
      ) : (
        <div className="w-full p-3 flex flex-col gap-2">
          {/* TableManager itself renders customHeader, the table, and the
             pagination footer as three separate pieces — customHeader
             with only a bottom border, the table in its own bordered box,
             and the (centerPager) footer with only a top border. AI
             Receptionist unifies these into one visible card by wrapping
             the whole TableManager call in this outer bordered/rounded
             div and stripping the table's own inner border/shadow via
             "!rounded-none !border-0 !shadow-none" in customClass below —
             so only this outer border is ever visible. Same technique
             here, not a new one. */}
          <div className="overflow-hidden rounded-[14px] border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          <TableManager
            {...{
              fetcherKey: 'greetingList',
              fetcherFn: getGreetings,
              columns,
              search,
              type,
              tableRef: mediaTableRef,
              hideFooterRefresh: true,
              recordsPosition: 'right',
              centerPager: true,
              /* Same red accent as the AI Receptionist table's current-page
                 pager circle, via the same TableManager prop — no changes
                 to the shared component itself. */
              pagerAccentClassName: 'border-red-600! text-white! bg-red-600!',
              /* Search pill + refresh + type filter, grouped the same way
                 as the AI Receptionist table's own customHeader (search +
                 refresh + its All/Live segmented filter) instead of split
                 across the page's own header bar. */
              customHeader: (
                <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center">
                  <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border! border-neutral-200! bg-white! pl-2 pr-3 shadow-[0_1px_2px_rgba(0,0,0,.03)] transition-all focus-within:border-red-300! focus-within:shadow-[0_0_0_4px_rgba(220,38,38,.1)]! sm:max-w-[320px]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    <input
                      value={search}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.startsWith(' ')) return;
                        setSearch(value);
                      }}
                      placeholder="Search media files..."
                      className="min-w-0 flex-1 border-none bg-transparent text-sm text-neutral-900 outline-none! placeholder:text-neutral-400"
                    />
                  </div>
                  <button
                    type="button"
                    title="Refresh"
                    onClick={async () => {
                      setIsTableRefreshing(true);
                      try {
                        await mediaTableRef.current?.refetchTable();
                      } finally {
                        setIsTableRefreshing(false);
                      }
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-none! bg-transparent! text-neutral-500! shadow-none! transition-colors hover:text-neutral-900!"
                  >
                    <RefreshCcw className={`h-4 w-4 ${isTableRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="w-40 shrink-0 sm:ml-auto">
                    <CustomSelect
                      isSearchable={false}
                      options={TYPE_TABS.map((tab) => ({ label: tab.label, value: tab.key }))}
                      value={{ label: activeTab.label, value: activeTab.key }}
                      handleChange={(option: any) => {
                        const tab = TYPE_TABS.find((item) => item.key === option?.value);
                        if (tab) navigate(tab.to);
                      }}
                    />
                  </div>
                </div>
              ),
              /* Same technique the AI Receptionist table uses to restyle
                 the shared Table primitives per-page — Tailwind's [&_x]
                 arbitrary variants on TableManager's own customClass prop,
                 not edits to table-manager.tsx or ui/table.tsx (both
                 shared across many other tables). Column 1 (Name) stays
                 left-aligned/flexible; columns 2-5 are centered 140px each;
                 the Action column is centered 150px — same proportions as
                 the reference's 6-column table. Header text 12px/bold/
                 uppercase/oklch(0.556 0 0) and cell text 13px, matching
                 the explicit sizes requested for this page (the reference
                 itself varies size per column; this page uses one
                 consistent size throughout instead, per that separate
                 request). Font-family is untouched here — only size/
                 weight/color/spacing utilities, so this page keeps its
                 own Inter rather than picking up whatever font the
                 reference page happens to use elsewhere. */
              customClass:
                "!rounded-none !border-0 !shadow-none [&_thead]:bg-neutral-50! [&_th]:bg-transparent! [&_th]:px-[18px]! [&_th]:py-[13px]! [&_th]:text-[12px]! [&_th]:font-bold! [&_th]:uppercase! [&_th]:tracking-[0.04em]! [&_th]:text-[oklch(0.556_0_0)]! [&_td]:bg-transparent! [&_td]:px-[18px]! [&_td]:py-2! [&_td]:align-middle [&_td]:text-[13px]! [&_th:nth-child(2)]:w-[140px] [&_td:nth-child(2)]:w-[140px] [&_th:nth-child(3)]:w-[140px] [&_td:nth-child(3)]:w-[140px] [&_th:nth-child(4)]:w-[140px] [&_td:nth-child(4)]:w-[140px] [&_th:nth-child(5)]:w-[140px] [&_td:nth-child(5)]:w-[140px] [&_th:last-child]:w-[150px] [&_td:last-child]:w-[150px] [&_th:nth-child(n+2)]:text-center! [&_td:nth-child(n+2)]:text-center!",
              getRowClassName: () => 'bg-white! transition-colors hover:bg-neutral-50!',
              emptyTablePlaceholder:
                type == 'all' ? 'No media files uploaded yet' : `No ${type} file uploaded yet`,
              descriptionEmptyTable: `Uploaded ${type} files will appear here.`,
              /* Mock-data path — see USE_MOCK_MEDIA_DATA above. Filtered
                 by the active tab the same way the real API's own `type`
                 param would be, and clientSideSearch is only turned on
                 here because staticData bypasses the real query (and
                 with it, the server-side search that normally handles
                 the `search` value) entirely — neither applies once this
                 flag is off. */
              ...(USE_MOCK_MEDIA_DATA
                ? {
                    staticData:
                      type === 'all'
                        ? MOCK_MEDIA_FILES
                        : MOCK_MEDIA_FILES.filter((item) => item.type === type),
                    clientSideSearch: true,
                  }
                : {}),
            }}
          />
          </div>
          {modalState?.playMedia && (
            <AudioModal
              modalState={modalState}
              setModalState={setModalState}
              srcUrl={recordingUrl}
              serRecordingUrl={serRecordingUrl}
            />
          )}
          {modalState?.isEdit && (
            <EditGreeting
              modalState={modalState}
              setModalState={setModalState}
              initialData={greetingData}
            />
          )}
          {modalState?.isDelete && (
            <AlertConfirm
              {...{
                apiLoading: PendingMedia || PendingGreeting,
                onConfirm: () => {
                  handleDeleteGreeting();
                },
                open: modalState,
                setOpen: setModalState,
              }}
            />
          )}
          {/* {drawerState && (
          <SideDrawer
            isOpen={drawerState}
            title="Upload File"
            handleClose={() => setDrawerState(false)}
            width="500px"
            isHeader
            content={
              <AddGreeting
                drawerState={drawerState}
                setDrawerState={setDrawerState}
                greetingType={type}
              />
            }
          />
        )} */}
        </div>
      )}
    </section>
  );
};

export default GreetingContent;

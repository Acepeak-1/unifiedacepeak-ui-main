import { Plus } from '@/assets/icons';
// import Breadcrumb from '@/components/custom/breadcrumb';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import TableManager from '@/components/custom/table-manager';
import { Button } from '@/components/ui/button';
import { capitalizeFirstLetter, formatDate, handleAlert } from '@/lib/utils';
import { deleteCallHandlingTemplate, getCallHandlingList } from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useRef, useState } from 'react';
import UpsertCallForwarding from '../../numbers/set-number-forwarding';
import AlertConfirm from '@/components/custom/alert-confirm';
import CustomTooltip from '@/components/custom/custom-tooltip';
import { Icon, IconName } from '@/assets/icons/icon';
import useDebounce from '@/hooks/use-debounce';
import { Ic, McmIconSprite } from '@/components/mcm/icons';
import '@/components/mcm/mcm-page.css';
// ai-tools-table.css is loaded globally via index.css (same reason
// mcm-page.css is) — a component-level `import '...css'` here was a
// separate Vite module that didn't reliably land after Tailwind's own
// utilities in the cascade, which is why `.tbl__th` kept losing to the
// shared `<TableHead>`'s `px-2`/`h-10` no matter what value was set.

// const breadcrumbData = [{ label: 'Templates' }, { label: 'Call Handling' }];

interface IUserSettingsState {
  isAddEdit: boolean;
  tempDetails: any;
  isDeleteAlert: boolean;
}

/* Placeholder rows so the table has something to show before any real
   templates exist — stand-ins for real data, not real data. Drop this
   (and the fallback fetcher below) once the page has something to show
   by default without it. */
const DUMMY_CALL_HANDLING_TEMPLATES = [
  { id: 'dummy-1', name: 'Sales team round robin', created_at: '2026-08-12T09:00:00Z', updated_at: '2026-08-28T14:30:00Z' },
  { id: 'dummy-2', name: 'After-hours voicemail', created_at: '2026-07-30T11:15:00Z', updated_at: '2026-08-20T16:45:00Z' },
  { id: 'dummy-3', name: 'Support queue overflow', created_at: '2026-08-01T08:20:00Z', updated_at: '2026-08-25T10:05:00Z' },
];

const dummyCallHandlingResponse = (base?: any) => ({
  ...base,
  data: {
    ...base?.data,
    data: {
      ...base?.data?.data,
      result: {
        ...base?.data?.data?.result,
        rows: DUMMY_CALL_HANDLING_TEMPLATES,
        total: DUMMY_CALL_HANDLING_TEMPLATES.length,
        totalItems: DUMMY_CALL_HANDLING_TEMPLATES.length,
        totalPages: 1,
      },
    },
  },
});

const getCallHandlingListWithFallback = async (params: any) => {
  // The API call itself can fail outright (no backend reachable, in this
  // sandbox) rather than just resolving with an empty list — falling back
  // only on the empty-success case left this showing the genuine
  // empty-state instead of the placeholder rows whenever that happened.
  try {
    const response = await getCallHandlingList(params);
    const rows = response?.data?.data?.result?.rows;
    if (rows && rows.length > 0) return response;
    return dummyCallHandlingResponse(response);
  } catch {
    return dummyCallHandlingResponse();
  }
};

const CallHandling = () => {
  const [drawerState, setDrawerState] = useState<IUserSettingsState>({
    isAddEdit: false,
    tempDetails: null,
    isDeleteAlert: false,
  });
  const queryClient: any = useQueryClient();
  const [searchedText, setSearchedText] = useState('');
  const debouncedSearch = useDebounce(searchedText || '', 1000);
  const tableRef = useRef<any>(null);

  const { mutate: mutateDeleteTemplate, isPending } = useMutation({
    mutationFn: deleteCallHandlingTemplate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['getCallHandlingTemplate'] });
      handleAlert({
        text: data?.data?.message || 'Template deleted successfully',
        type: 'success',
      });
      setDrawerState((prev) => ({
        ...prev,
        isDeleteAlert: false,
        tempDetails: null,
      }));
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => {
        const name = capitalizeFirstLetter(row?.original?.name) || '';
        const initials = name.slice(0, 2).toUpperCase() || '--';
        return (
          <div
            className="tbl__agent cursor-pointer"
            onClick={() =>
              setDrawerState((prev) => ({
                ...prev,
                isAddEdit: true,
                tempDetails: row.original,
              }))
            }
          >
            <div className={`tbl__avatar tbl__avatar--${row.index % 6}`}>{initials}</div>
            <div className="tbl__agent-meta">
              <span className="tbl__name">{name}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: ({ row }) => (
        <span className="tbl__value tbl__value--muted">
          {formatDate(row?.original?.created_at)}
        </span>
      ),
    },

    {
      header: 'Last Modified',
      accessorKey: 'updated_at',
      cell: ({ row }) => (
        <span className="tbl__value tbl__value--muted">
          {formatDate(row?.original?.updated_at)}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'action',
      cell: ({ row }) => {
        const data = row?.original;
        const actions = [
          {
            icon: 'EditStrokIcon',
            onClick: () =>
              setDrawerState((prev) => ({
                ...prev,
                isAddEdit: true,
                tempDetails: data,
              })),
            className: 'tbl__action-btn',
            tooltipText: 'Edit',
          },
          {
            icon: 'TrashBin',
            onClick: () =>
              setDrawerState((prev) => ({
                ...prev,
                isDeleteAlert: true,
                tempDetails: data,
              })),
            className: 'tbl__action-btn',
            tooltipText: 'Delete',
          },
        ];

        return (
          <div className="tbl__actions">
            {actions?.map((action, index) => (
              <CustomTooltip text={action.tooltipText} side="top">
                <div
                  key={index}
                  className={`cursor-pointer ${action.className}`}
                  onClick={() => {
                    action.onClick();
                  }}
                >
                  <Icon name={action.icon as IconName} className="w-4 h-4" />
                </div>
              </CustomTooltip>
            ))}
          </div>
        );
      },
    },
  ];
  return (
    <>
      <McmIconSprite />
      <section className="w-full flex flex-col bg-gray-200/15">
        {/* <Breadcrumb breadcrumbs={breadcrumbData} /> */}
        <div className="mcm-adminhome-head flex-col sm:flex-row">
          <div>
            <div className="mcm-adminhome-eyebrow">Templates</div>
            <div className="mcm-adminhome-titlerow">
              <h1>Call Handling</h1>
              <CustomTooltip
                text="Reusable call-routing rules you can apply to numbers, queues and people."
                side="right"
                className="w-max max-w-[260px] border-0 bg-[#fdf7f5] text-black shadow-none [&_svg]:fill-[#fdf7f5]"
              >
                <span className="mcm-adminhome-infobtn" aria-label="About this page">
                  <Icon name="InfoIcon" className="w-4 h-4" />
                </span>
              </CustomTooltip>
            </div>
          </div>
          <div className="flex gap-2 filters  flex-col sm:flex-row">
            <Button
              type="button"
              variant={'primary'}
              onClick={() =>
                setDrawerState((prev) => ({ ...prev, isAddEdit: true, tempDetails: null }))
              }
              className="min-h-9 rounded-full !text-white hover:!bg-[#b91c1c] hover:!border-[#b91c1c]"
            >
              <Plus className="w-3 h-3" />
              Add Call Handling Template
            </Button>
          </div>
        </div>
        <div>
          <div className="w-full p-3 flex flex-col gap-2">
            <TableManager
              {...{
                columns,
                fetcherKey: 'getCallHandlingTemplate',
                fetcherFn: getCallHandlingListWithFallback,
                extraParams: { filter: [{ key: 'name', value: debouncedSearch }] },
                emptyTablePlaceholder: 'No call handling templates found',
                tableRef,
                customHeader: (
                  <div className="flex items-center gap-2">
                    <div className="mcm-adminhome-search mcm-adminhome-search--lg max-w-[320px]">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fef2f2] text-primary">
                        <Ic n="search" size={13} />
                      </span>
                      <input
                        type="search"
                        placeholder="Search Call Queue"
                        aria-label="Search call handling templates"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.startsWith(' ')) return;
                          setSearchedText(e.target.value);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="Refresh"
                      onClick={() => tableRef.current?.refetchTable()}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary"
                    >
                      <Ic n="refresh" size={15} />
                    </button>
                  </div>
                ),
                tableWrapClassName: 'tbl-wrap',
                tableClassName: 'tbl',
                theadClassName: '',
                headerRowClassName: 'tbl__head-row',
                getHeaderCellClassName: (textAlign: string) =>
                  `tbl__th tbl__th--${textAlign}${textAlign === 'center' ? ' tbl__th--tight' : ''}`,
                getRowClassName: () => 'tbl__row',
                getCellClassName: (cell: any) => {
                  const textAlign = cell?.column?.id === 'action' ? 'center' : 'left';
                  return `tbl__td tbl__td--${textAlign}${textAlign === 'center' ? ' tbl__td--tight' : ''}`;
                },
                hideFooterRefresh: true,
                pagerAccentClassName: 'border-primary !text-white bg-primary',
              }}
            />
          </div>
        </div>
      </section>
      <Dialog
        open={Boolean(drawerState?.isAddEdit)}
        onOpenChange={(open) => {
          if (!open) setDrawerState((prev) => ({ ...prev, isAddEdit: false, tempDetails: null }));
        }}
      >
        <DialogContent className="flex max-h-[88vh] w-full max-w-[640px] flex-col gap-0 overflow-hidden p-0">
          <div className="flex items-center gap-2.5 px-6 pt-6 pb-4">
            <Icon name="CallForward" className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg font-bold text-gray-900">
              {drawerState?.tempDetails ? 'Update' : 'Add'} Call Handling Template
            </DialogTitle>
          </div>
          <div className="border-t border-gray-100" />
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <UpsertCallForwarding
              drawerState={drawerState?.isAddEdit}
              setDrawerState={() =>
                setDrawerState((prev) => ({ ...prev, isAddEdit: false, tempDetails: null }))
              }
              initialData={drawerState?.tempDetails}
              initialType={'UPSERT_TEMPLATE'}
              isUser={false}
            />
          </div>
        </DialogContent>
      </Dialog>

      {drawerState?.isDeleteAlert && (
        <AlertConfirm
          {...{
            apiLoading: isPending,
            onConfirm: () => {
              mutateDeleteTemplate(drawerState?.tempDetails?.uuid);
            },
            open: drawerState?.isDeleteAlert,
            setOpen: () => {
              setDrawerState((prev) => ({
                ...prev,
                isDeleteAlert: false,
                tempDetails: null,
              }));
            },
            headerText: 'Delete Confirmation',
            descriptionTextComp: 'Are you sure, you want to delete this template?',
          }}
        />
      )}
    </>
  );
};

export default CallHandling;

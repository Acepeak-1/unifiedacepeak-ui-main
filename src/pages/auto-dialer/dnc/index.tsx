import TableManager from '@/components/custom/table-manager';
import { Button } from '@/components/ui/button';

import { convertDateFormateApis, handleAlert } from '@/lib/utils';
import { deleteDncCampaign, getDncCampaign } from '@/services/api';
import { useState } from 'react';
import AddDncModal from './addDnc';
import { Icon } from '@/assets/icons/icon';
import AlertConfirm from '@/components/custom/alert-confirm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CustomTooltip from '@/components/custom/custom-tooltip';
import UploadDnc from './uploadDnc';
import { Plus, RefreshCcw, Search, Upload } from 'lucide-react';
import useDebounce from '@/hooks/use-debounce';
import './dnc-head.css';
import './dnc-table.css';

export const DNC_TABS = {
  DEFAULT: 'Default DNC',
  PERSONAL: 'Personal DNC',
};

// const columns: any = [
//   {
//     header: 'Created Date',
//     accessorKey: 'attributes.created-date',
//     cell: ({ row }: any) => {
//       const date = row?.original?.attributes?.['created-date'];
//       return <div>{date ? convertDateFormateApis(date, 'MM/DD/YYYY hh:mm A') : '---'}</div>;
//     },
//   },
//   {
//     header: 'Company Phone Number',
//     accessorKey: 'attributes.company-phone-number',
//     cell: ({ row }: any) => row?.original?.attributes?.['company-phone-number'] || '---',
//   },
//   {
//     header: 'Area Code',
//     accessorKey: 'attributes.consumer-area-code',
//     cell: ({ row }: any) => row?.original?.attributes?.['consumer-area-code'] || '---',
//   },
//   {
//     header: 'State',
//     accessorKey: 'attributes.consumer-state',
//     cell: ({ row }: any) => row?.original?.attributes?.['consumer-state'] || '---',
//   },
//   {
//     header: 'City',
//     accessorKey: 'attributes.consumer-city',
//     cell: ({ row }: any) => row?.original?.attributes?.['consumer-city'] || '---',
//   },
//   // {
//   //   header: 'Violation Date',
//   //   accessorKey: 'attributes.violation-date',
//   //   cell: ({ row }: any) => {
//   //     const date = row?.original?.attributes?.['violation-date'];
//   //     return <div>{date ? convertDateFormateApis(date, 'MM/DD/YYYY') : '---'}</div>;
//   //   },
//   // },
// ];

const DNC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [openUpload, setOpenUpload] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const queryClient: any = useQueryClient();
  const [confirmModelState, setConfirmState] = useState<{
    isModal: boolean;
    selectedId: string;
  }>({
    isModal: false,
    selectedId: '',
  });

  const columnsPersonal: any = [
    {
      header: 'Created Date',
      accessorKey: 'createdAt',
      cell: ({ row }: any) => {
        const date = row?.original?.createdAt;
        return <div>{date ? convertDateFormateApis(date, 'MM/DD/YYYY hh:mm A') : '---'}</div>;
      },
    },
    {
      header: 'User Name',
      accessorKey: 'name',
      cell: ({ row }: any) => row?.original?.name || '---',
    },
    {
      header: 'Phone Number',
      accessorKey: 'phone',
      cell: ({ row }: any) => row?.original?.phone || '---',
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: ({ row }: any) => row?.original?.email || '---',
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }: any) => {
        return (
          <span className="flex gap-2 items-center">
            <CustomTooltip
              text={row?.original?.type == 'SYSTEM' ? 'System generated DNC' : 'Delete DNC'}
            >
              <span
                onClick={() => {
                  if (row?.original?.type !== 'SYSTEM') {
                    setConfirmState({
                      isModal: true,
                      selectedId: row.original?._id,
                    });
                  }
                }}
                className={`cursor-pointer flex items-center justify-center rounded-full w-8 h-8 ${row?.original?.type == 'SYSTEM' ? 'bg-red-100 text-red-500' : 'bg-red-100 text-red-500'}  hover:bg-red-500 hover:text-white`}
              >
                <Icon name="TrashBin" className="w-5 h-5" />
              </span>
            </CustomTooltip>
          </span>
        );
      },
    },
  ];
  const { mutate: mutateDeleteGroup, isPending: isPendingDeleteGroup } = useMutation({
    mutationFn: deleteDncCampaign,
    onSuccess: (data) => {
      if (data?.data?.success) {
        handleAlert({ text: data?.data?.message || 'DNC deleted successfully!', type: 'success' });
        setConfirmState({
          isModal: false,
          selectedId: '',
        });
        queryClient.invalidateQueries({ queryKey: ['getPersonalDncList'] });
      }
    },
  });
  return (
    <>
      <section className="w-full bg-[#e3e3e3] flex flex-col overflow-x-auto overflow-y-hidden">
        <div className="flex items-center justify-between px-[26px] pt-5 pb-1 border-b border-gray-200 bg-white">
          <div>
            <div className="dnc-eyebrow">Activity</div>
            <p className="dnc-title">Do not Contact List</p>
          </div>

          <div className="flex gap-2 filters">
            <Button
              onClick={() => setOpenUpload(true)}
              className="cursor-pointer min-h-9 rounded-full gap-1.5 hover:bg-transparent"
              style={{ borderWidth: 1, borderStyle: 'solid', borderColor: '#fecaca', color: '#171717' }}
              variant={'outline'}
              type="button"
            >
              <Upload className="w-4 h-4" style={{ color: '#f87171' }} />
              Upload DNC
            </Button>
            <Button
              onClick={() => setOpen(true)}
              variant="dark"
              className="cursor-pointer min-h-9 rounded-full gap-1.5"
              style={{ backgroundColor: '#171717', borderColor: '#171717', color: '#ffffff' }}
              type="button"
            >
              <Plus className="w-4 h-4" style={{ color: '#ffffff' }} />
              Add DNC
            </Button>
          </div>
        </div>
        <section className="w-full bg-[#e3e3e3] flex flex-col overflow-x-auto overflow-y-hidden  h-full">
            <div className="w-full">
              <div className="dnc-card">
                <div className="dnc-toolbar">
                  <div className="dnc-search">
                    <span className="dnc-search-ico" aria-hidden="true">
                      <Search />
                    </span>
                    <input
                      placeholder="Search DNC"
                      aria-label="Search DNC"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="dnc-refresh"
                    aria-label="Refresh DNC list"
                    onClick={() =>
                      queryClient.invalidateQueries({ queryKey: ['getPersonalDncList'] })
                    }
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                </div>
                <TableManager
                  {...{
                    columns: columnsPersonal,
                    fetcherKey: 'getPersonalDncList',
                    fetcherFn: getDncCampaign,
                    search: debouncedSearch,
                    clientSideSearch: true,
                    emptyTablePlaceholder: 'No DNC records found',
                    descriptionEmptyTable: 'Numbers added to Do Not Call will appear here.',
                    hideFooterRefresh: true,
                    pagerAccentClassName: 'bg-red-600 text-white border-red-600',
                  }}
                />
              </div>
            </div>
            <AlertConfirm
              {...{
                headerText: 'Confirm Delete',
                apiLoading: isPendingDeleteGroup,
                onConfirm: () => {
                  mutateDeleteGroup({ dncId: confirmModelState?.selectedId });
                },
                open: confirmModelState?.isModal,
                setOpen: () => {
                  setConfirmState({
                    isModal: false,
                    selectedId: '',
                  });
                },
                descriptionTextComp: 'Are you sure, you want to delete this DNC ?',
              }}
            />
          </section>
      </section>
      <AddDncModal modalState={open} setModalState={setOpen} />
      <UploadDnc drawerState={openUpload} setDrawerState={setOpenUpload} />
    </>
  );
};

export default DNC;

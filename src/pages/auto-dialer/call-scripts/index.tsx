import { Button } from '@/components/ui/button';
import { convertDateFormateApis, getObjectLength, handleAlert } from '@/lib/utils';
import { useRef, useState } from 'react';
import { Icon } from '@/assets/icons/icon';
import TableManager from '@/components/custom/table-manager';
import { deleteCallScript, getCallScript } from '@/services/api';
import SideDrawer from '@/components/custom/side-drawer';
import ScriptForm from './add-edit-script';
import { EyeIcon, Plus, RefreshCcw, Search } from 'lucide-react';
import { dailMethodsArr } from './constants';

import OverviewScript from './overview-script';
import { useCompanyFeatures } from '@/hooks/rbac';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AlertConfirm from '@/components/custom/alert-confirm';
import './call-scripts.css';

const CallScripts = () => {
  const { features } = useCompanyFeatures();
  const scriptAccess = features?.plan_features?.campaign?.action || {};
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<any>(null);
  const [search, setSearch] = useState('');
  const callScriptTableRef = useRef<any>(null);
  const queryClient: any = useQueryClient();
  const [drawerState, setDrawerState] = useState<{ isModalOpen: boolean; selectedCampaign: any }>({
    isModalOpen: false,
    selectedCampaign: null,
  });
  const [modalState, setModalState] = useState<{ isModalOpen: boolean; selectedCampaign: any }>({
    isModalOpen: false,
    selectedCampaign: null,
  });

  const { mutate: mutateDeleteScript, isPending: isPendingDeleteScript } = useMutation({
    mutationFn: deleteCallScript,
    onSuccess: (data) => {
      if (data?.data?.success) {
        handleAlert({
          text: data?.data?.message || 'Call script deleted successfully!',
          type: 'success',
        });
        setShowDeleteConfirmation(null);
        queryClient.invalidateQueries(['getCallScript']);
      }
    },
  });

  const columns: any = [
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: ({ row }: any) => {
        const data = row?.original;
        return <div>{convertDateFormateApis(data?.createdAt, 'MMM D, YYYY')}</div>;
      },
    },
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Type',
      accessorKey: 'dialMethod',
      cell: ({ getValue }: any) => {
        return <div>{dailMethodsArr?.find((i) => i.value === getValue())?.label}</div>;
      },
    },

    {
      header: 'Content',
      accessorKey: 'description',
      cell: ({ row }: any) => {
        return (
          <div
            className="flex items-center gap-1 text-primary cursor-pointer"
            onClick={() => {
              setModalState({ selectedCampaign: row?.original, isModalOpen: true });
            }}
          >
            <EyeIcon className="h-4 w-4" /> Overview
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'action',
      cell: ({ row }: any) => {
        const data = row?.original;
        return (
          <span className="flex gap-2 items-center">
            {scriptAccess?.edit && (
              <span
                className={`cursor-pointer flex items-center justify-center rounded-full w-8 h-8 bg-gray-100 text-gray-900/80 hover:bg-primary hover:text-white`}
                onClick={() => {
                  setDrawerState({ selectedCampaign: row?.original, isModalOpen: true });
                }}
              >
                <Icon name="EditStrokIcon" className={`w-5 h-5 `} />
              </span>
            )}
            <span
              className={`cursor-pointer flex items-center justify-center rounded-full w-8 h-8 bg-red-100 text-red-500 hover:bg-red-500 hover:text-white`}
              onClick={() => {
                setShowDeleteConfirmation(data?._id);
              }}
            >
              <Icon name="TrashBin" className={`w-5 h-5 `} />
            </span>
          </span>
        );
      },
    },
  ];

  return (
    <>
      <section className="w-full bg-[#e3e3e3] flex flex-col overflow-x-auto overflow-y-hidden  h-full">
        <div className="flex items-center justify-between px-[26px] pt-5 pb-1 border-b border-gray-200 bg-white">
          <div>
            <div className="cs-eyebrow">Activity</div>
            <p className="cs-title">Call Script</p>
          </div>
          <div className="flex gap-2 filters">
            {scriptAccess?.add && (
              <Button
                variant="dark"
                onClick={() => setDrawerState((prev) => ({ ...prev, isModalOpen: true }))}
                className="min-h-9 rounded-full gap-1.5"
                style={{ backgroundColor: '#171717', borderColor: '#171717', color: '#ffffff' }}
              >
                <Plus className="w-4 h-4" style={{ color: '#ffffff' }} />
                Call Script
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col cs-card">
          <div className="cs-toolbar">
            <div className="cs-search">
              <span className="cs-search-ico" aria-hidden="true">
                <Search />
              </span>
              <input
                placeholder="Search call scripts"
                aria-label="Search call scripts"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="cs-refresh"
              aria-label="Refresh call scripts"
              onClick={() => callScriptTableRef.current?.refetchTable()}
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
          <TableManager
            {...{
              tableRef: callScriptTableRef,
              columns,
              fetcherKey: 'getCallScript',
              fetcherFn: getCallScript,
              search,
              clientSideSearch: true,
              emptyTablePlaceholder: 'No call scripts found',
              descriptionEmptyTable: 'Create a call script to guide agents during campaigns',
              hideFooterRefresh: true,
              pagerAccentClassName: 'bg-red-600 text-white border-red-600',
            }}
          />
        </div>
      </section>

      {drawerState?.isModalOpen && (
        <SideDrawer
          width="min(500px, 96vw)"
          isOpen={drawerState.isModalOpen}
          title={
            getObjectLength(drawerState.selectedCampaign)
              ? `Update Call Script (${drawerState.selectedCampaign?.name || ''})`
              : 'Create Call Script'
          }
          handleClose={() =>
            setDrawerState({
              isModalOpen: false,
              selectedCampaign: null,
            })
          }
          isTab={false}
          content={
            <div className="mx-auto h-full w-full max-w-full ">
              <ScriptForm
                isEdit={getObjectLength(drawerState.selectedCampaign)}
                data={drawerState.selectedCampaign}
                handleClose={() =>
                  setDrawerState({
                    isModalOpen: false,
                    selectedCampaign: null,
                  })
                }
              />
            </div>
          }
        />
      )}

      {modalState?.isModalOpen && (
        <OverviewScript modalState={modalState} setModalState={setModalState} />
      )}
      {!!showDeleteConfirmation && (
        <AlertConfirm
          {...{
            apiLoading: isPendingDeleteScript,
            onConfirm: () => {
              mutateDeleteScript({ uuid: showDeleteConfirmation });
            },
            open: !!showDeleteConfirmation,
            setOpen: () => {
              setShowDeleteConfirmation(null);
            },
          }}
        />
      )}
    </>
  );
};

export default CallScripts;

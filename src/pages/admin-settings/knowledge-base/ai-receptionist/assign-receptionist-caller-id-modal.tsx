import { Plus, SearchLine } from '@/assets/icons';
import { Icon } from '@/assets/icons/icon';
import Loader from '@/components/custom/loader';
import NumberWithFlag from '@/components/custom/number-with-flag';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { handleAlert } from '@/lib/utils';
import { addReceptionistDid, allNumbersList, removeForwarding } from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FC, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AssignReceptionistCallerIdModalProps {
  open: boolean;
  onClose: () => void;
  receptionistData: any;
}

const defaultReceptionistForwardActions = {
  condition: {
    operational_hours: {
      type: '24_hours',
      regional: {},
      value: {},
      holidays: [],
    },
    recording: {
      on_demand: { enabled: true },
      automatic: { enabled: true, label: 'All', value: 'all' },
    },
    display_number: {
      incoming: { label: 'Yes', value: true },
      masking: { type: 'N', value: '', label: 'None' },
      show_number_if_blocked: 'NO',
    },
    caller_id: [],
  },
  call_handling: {
    business_hours: {
      type: 'VOICEMAIL',
      value: '',
      label: 'Voicemail',
    },
  },
  media: {
    welcome: { enabled: false, value: '' },
    hold: { enabled: false, value: '' },
    voicemail: { enabled: false, value: '' },
  },
  transcription: true,
  temperature: 'low',
  detailsToCollect: ['name', 'phone'],
};

const invalidateReceptionistAndNumberQueries = (queryClient: any) => {
  queryClient.invalidateQueries({
    predicate: (query: any) => {
      const key = String(query.queryKey?.[0] || '');
      return (
        key.includes('getAIReceptionistList') ||
        key.includes('numbers-list-modal') ||
        key.includes('allNumbersList') ||
        key.includes('getAllNumbers')
      );
    },
  });
};

const AssignReceptionistCallerIdModal: FC<AssignReceptionistCallerIdModalProps> = ({
  open,
  onClose,
  receptionistData,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [removingForwardingUuid, setRemovingForwardingUuid] = useState('');
  const [assigningUuid, setAssigningUuid] = useState('');
  const [justAssignedUuid, setJustAssignedUuid] = useState('');
  const [reassignData, setReassignData] = useState<{
    open: boolean;
    didUuid: string;
    didNumber: string;
    assignedTo: string;
  }>({
    open: false,
    didUuid: '',
    didNumber: '',
    assignedTo: '',
  });

  const agentName = receptionistData?.agentName || 'AI Receptionist';
  const assignedDidList = useMemo(
    () =>
      (Array.isArray(receptionistData?.did_uuid) ? receptionistData.did_uuid : []).filter(
        (item: any) => item && typeof item === 'object' && (item?.uuid || item?.did_number),
      ),
    [receptionistData?.did_uuid],
  );
  const assignedDidKeys = useMemo(
    () =>
      new Set(
        assignedDidList
          .flatMap((item: any) => [item?.uuid, item?.did_number])
          .map((value: any) => String(value || '').trim())
          .filter(Boolean),
      ),
    [assignedDidList],
  );

  const { data: allNumbers = [], isLoading: isLoadingNumbers } = useQuery({
    queryKey: ['numbers-list-modal', 'ai-receptionist', 1, 9999999],
    queryFn: () =>
      allNumbersList({
        page: 1,
        limit: 9999999,
      }),
    select: (data: any) => data?.data?.data?.result?.rows || [],
    enabled: open,
  });

  const { mutate: assignNumber, isPending: isAssigning } = useMutation({
    mutationFn: addReceptionistDid,
    onSuccess: (_data: any, variables: any) => {
      handleAlert({ text: 'Number assigned successfully!', type: 'success' });
      invalidateReceptionistAndNumberQueries(queryClient);
      setJustAssignedUuid(variables?.did_uuid || '');
    },
    onError: (err: any) => {
      handleAlert({
        text: err?.response?.data?.data?.message || 'Failed to assign number',
        type: 'error',
      });
    },
    onSettled: () => setAssigningUuid(''),
  });

  const { mutate: mutateRemoveForwarding, isPending: isRemovingForwarding } = useMutation({
    mutationFn: removeForwarding,
    onSuccess: (data: any) => {
      invalidateReceptionistAndNumberQueries(queryClient);
      handleAlert({
        text: data?.data?.data?.message || 'Forwarding removed successfully.',
        type: 'success',
      });
    },
    onSettled: () => setRemovingForwardingUuid(''),
  });

  const filteredNumbers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return allNumbers;

    return allNumbers.filter((item: any) => {
      const assignedName = `${item?.User?.first_name || ''} ${item?.User?.last_name || ''}`
        .trim()
        .toLowerCase();

      return (
        String(item?.did_number || '')
          .toLowerCase()
          .includes(keyword) ||
        String(item?.did_name || '')
          .toLowerCase()
          .includes(keyword) ||
        assignedName.includes(keyword)
      );
    });
  }, [allNumbers, search]);

  function resetModalState() {
    setSearch('');
    setAssigningUuid('');
    setJustAssignedUuid('');
    setReassignData({
      open: false,
      didUuid: '',
      didNumber: '',
      assignedTo: '',
    });
  }

  const closeModal = () => {
    resetModalState();
    onClose();
  };

  const handleAssignNumber = (didUuid: string, type?: 're-assign') => {
    if (!didUuid) return;

    setAssigningUuid(didUuid);
    assignNumber({
      agentId: receptionistData?.agent_uuid || receptionistData?.id,
      did_uuid: didUuid,
      ...(type ? { type } : {}),
      forward_call_actions:
        receptionistData?.forward_call_actions || defaultReceptionistForwardActions,
    });
  };

  const handleRemoveForwarding = (uuid?: string) => {
    if (!uuid) return;
    setRemovingForwardingUuid(uuid);
    mutateRemoveForwarding({ uuid });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) closeModal();
      }}
    >
      <DialogContent className="w-[680px] p-0 gap-0 overflow-hidden rounded-2xl!" showCloseButton={false}>
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-xl font-semibold text-neutral-900">
                Assign Caller ID
              </DialogTitle>
              <p className="text-sm text-neutral-500">
                Selecting number for{' '}
                <span className="text-[13px] font-normal text-slate-950">{agentName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Icon name="XIcon" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 bg-white p-4">
          <Input
            placeholder="Search numbers..."
            className="rounded-full! border-neutral-200! pl-10 focus-visible:border-neutral-900! focus-visible:ring-neutral-100!"
            IconPosition="left-0 pl-3 inset-y-0"
            value={search}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(event) => setSearch(event.target.value.replace(/\D/g, ''))}
            Icon={<SearchLine className="text-red-600" />}
          />

          <div className="flex flex-col gap-3 max-h-[calc(100vh_-_23rem)] overflow-y-auto pr-1 min-h-[240px]">
            {isLoadingNumbers ? (
              <div className="w-full h-full min-h-[200px] flex items-center justify-center">
                <Loader variant="blue" />
              </div>
            ) : filteredNumbers.length > 0 ? (
              filteredNumbers.map((item: any) => {
                const assignedName =
                  `${item?.User?.first_name || ''}${item?.User?.last_name ? ` ${item.User.last_name}` : ''}`.trim();
                const isJustAssigned = Boolean(justAssignedUuid) && justAssignedUuid === item?.uuid;
                const isAssignedToCurrentAgent =
                  isJustAssigned ||
                  assignedDidKeys.has(String(item?.uuid || '')) ||
                  assignedDidKeys.has(String(item?.did_number || ''));
                const isAssignedToUser = !isJustAssigned && Boolean(item?.user_uuid || assignedName);
                const isForwarded = !isJustAssigned && Boolean(item?.forward_call_actions);
                const isRemovingThisForwarding =
                  isRemovingForwarding && removingForwardingUuid === item?.uuid;
                const isReassignDisabled = isAssigning || isRemovingForwarding || isForwarded;
                const isThisAssigning = isAssigning && assigningUuid === item?.uuid;

                return (
                  <div
                    key={item?.uuid || item?.did_number}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-4 py-3 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    <div className="flex flex-col gap-1">
                      <NumberWithFlag number={item?.did_number} />
                      {isAssignedToCurrentAgent ? (
                        <p className="text-xs font-medium flex items-center gap-1 text-neutral-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block" />
                          Assigned to this Receptionist
                          <span className="text-neutral-700">- {agentName}</span>
                        </p>
                      ) : isAssignedToUser ? (
                        <p className="text-xs font-medium flex items-center gap-1 text-neutral-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block" />
                          Assigned to User
                          {assignedName ? (
                            <span className="text-neutral-700">- {assignedName}</span>
                          ) : null}
                        </p>
                      ) : isForwarded ? (
                        <p className="flex items-center gap-1 text-xs font-medium text-amber-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                          Forwarded
                        </p>
                      ) : (
                        <p className="text-green-600 text-xs font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          {item?.type === 'F' ? 'Free' : 'Paid'}
                        </p>
                      )}
                    </div>

                    {isAssignedToCurrentAgent ? (
                      <span className="inline-flex h-8 min-w-[110px] shrink-0 select-none items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600">
                        <Icon name="DoneIcon" className="w-4 h-4" />
                        Assigned
                      </span>
                    ) : isAssignedToUser ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-w-[110px] rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-none hover:bg-neutral-50 hover:text-neutral-700"
                        disabled={isReassignDisabled}
                        title={
                          isForwarded
                            ? 'Remove forwarding before re-assigning this caller ID'
                            : undefined
                        }
                        onClick={() => {
                          if (isReassignDisabled) return;
                          setReassignData({
                            open: true,
                            didUuid: item?.uuid || '',
                            didNumber: item?.did_number || '',
                            assignedTo: assignedName || 'another user',
                          });
                        }}
                      >
                        <Icon name="Refresh" className="w-4 h-4" />
                        Re-assign
                      </Button>
                    ) : isForwarded ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-w-[150px] shrink-0 rounded-full border border-amber-200 bg-white text-amber-600 shadow-none hover:bg-amber-50 hover:text-amber-600"
                        disabled={isAssigning || isRemovingForwarding}
                        onClick={() => handleRemoveForwarding(item?.uuid)}
                      >
                        {isRemovingThisForwarding ? (
                          <Loader variant="blue" />
                        ) : (
                          <>
                            <Icon name="CallCancelLine" className="w-4 h-4" />
                            Remove Forwarding
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-w-[110px] rounded-full border border-neutral-200 bg-neutral-100 text-neutral-600 shadow-none hover:bg-neutral-200 hover:text-neutral-600"
                        disabled={isAssigning || isRemovingForwarding}
                        onClick={() => handleAssignNumber(item?.uuid)}
                      >
                        {isThisAssigning ? (
                          <Loader variant="blue" />
                        ) : (
                          <>
                            <Icon name="AssignNumberLine" className="w-4 h-4" />
                            Assign
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full min-h-[200px] flex items-center justify-center text-sm text-gray-500">
                No numbers found.
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-none hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={() => {
              closeModal();
              navigate('/admin-settings/numbers/all?openAddNumber=1', {
                state: location.state,
              });
            }}
          >
            <Plus className="w-3 h-3" />
            Add Additional Number
          </Button>
          <Button
            type="button"
            variant="transparent"
            className="text-neutral-500 hover:text-red-600"
            onClick={closeModal}
          >
            Done
          </Button>
        </div>
      </DialogContent>

      <Dialog
        open={reassignData.open}
        onOpenChange={(value) =>
          setReassignData((previous) => ({
            ...previous,
            open: value,
          }))
        }
      >
        <DialogContent
          className="w-[460px] max-w-[calc(100%-2rem)] rounded-2xl! p-6"
          showCloseButton={false}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <Icon name="AlertIcon" className="w-8 h-8" />
            </div>

            <DialogTitle className="text-[28px] font-semibold leading-none text-neutral-900">
              Re-assign Caller ID?
            </DialogTitle>

            <p className="text-neutral-500 text-sm leading-6">
              The number{' '}
              <span className="text-neutral-800 font-semibold">{reassignData.didNumber}</span> is
              currently assigned to User{' '}
              <span className="text-red-600 font-semibold">- {reassignData.assignedTo}</span>.{' '}
              Re-assigning it will assign it to{' '}
              <span className="text-green-600 font-semibold">{agentName}</span>. Proceed?
            </p>

            <div className="w-full flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 min-w-0 rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-none hover:bg-neutral-50 hover:text-neutral-700"
                onClick={() =>
                  setReassignData({
                    open: false,
                    didUuid: '',
                    didNumber: '',
                    assignedTo: '',
                  })
                }
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 min-w-0 rounded-full bg-red-600 text-white shadow-[0_2px_10px_rgba(220,38,38,.3)] hover:bg-red-700 hover:text-white"
                disabled={isAssigning || !reassignData.didUuid}
                onClick={() => {
                  if (!reassignData.didUuid) return;
                  handleAssignNumber(reassignData.didUuid, 're-assign');
                  setReassignData({
                    open: false,
                    didUuid: '',
                    didNumber: '',
                    assignedTo: '',
                  });
                }}
              >
                {isAssigning ? <Loader variant="blue" /> : 'Yes, Re-assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default AssignReceptionistCallerIdModal;

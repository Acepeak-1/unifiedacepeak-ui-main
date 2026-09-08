import { Icon } from '@/assets/icons/icon';
import CustomAvatar from '@/components/custom/custom-avatar';
import CustomSelect from '@/components/custom/custom-select';
import TableManager from '@/components/custom/table-manager';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ISELECTVALUE } from '@/interfaces/api-interfaces';
import { forwardActionType } from '@/services/api';
import { ColumnDef } from '@tanstack/react-table';
import { FC, useState, useMemo, useCallback, memo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Search } from 'lucide-react';
import useDebounce from '@/hooks/use-debounce';
import { DIALER_TYPE } from '../consts';
import { useUser } from '@/hooks/use-user';

interface IMEMBER {
  first_name: string;
  last_name: string;
  label: string;
  extension: string;
  value: string;
  email: string;
  role: string;
  domain?: string;
  uuid: string;
  user_uuid: string;
  custom_role_data: { name: string };
  role_data: { name: string };
  profile?: string;
}

/** Same add/remove-from-`members` logic the old checkbox column used —
    just triggered by clicking the row's own cells now that there's no
    dedicated checkbox column to click instead. */
const useToggleMember = (memberData: IMEMBER) => {
  const { user } = useUser();
  const defaultDomain = user?.sip_credentials?.domain || '';
  const { control, setValue, clearErrors, watch } = useFormContext();
  const members = useWatch({ control, name: 'members', defaultValue: [] });
  const isSelected =
    Array.isArray(members) && members.some((item: any) => item?.value === memberData?.extension);

  const toggle = useCallback(() => {
    if (!isSelected) {
      const extensionValue = memberData?.extension ? memberData?.extension : memberData?.value;
      const newValue = {
        label: memberData?.last_name
          ? `${memberData?.first_name} ${memberData?.last_name}`
          : memberData?.label,
        value: extensionValue,
        first_name: memberData?.first_name || '',
        last_name: memberData?.last_name || '',
        extension: extensionValue || '',
        email: memberData?.email,
        role: memberData?.custom_role_data?.name || memberData?.role_data?.name || memberData?.role,
        domain: memberData?.domain || defaultDomain || '',
        user_uuid: memberData?.user_uuid || memberData?.uuid || '',
      };
      setValue('members', [...(members || []), newValue], { shouldValidate: true });
      clearErrors('members');
    } else {
      const filteredMembers = (members || []).filter(
        (el: IMEMBER) => el.value !== memberData.extension,
      );
      setValue('members', filteredMembers, { shouldValidate: true });
      const currentManager = watch('manager');
      if (memberData.extension === currentManager?.value) {
        setValue('manager', { value: '' });
        clearErrors('manager');
      }
    }
  }, [memberData, members, isSelected, setValue, clearErrors, watch, defaultDomain]);

  return { isSelected, toggle };
};

const MemberCheckboxCell = memo(({ data }: { data: IMEMBER }) => {
  const { isSelected, toggle } = useToggleMember(data);
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Checkbox checked={isSelected} onCheckedChange={() => toggle()} aria-label="Select member" />
    </div>
  );
});
MemberCheckboxCell.displayName = 'MemberCheckboxCell';

// Name + email, compact — the whole cell is the click target for
// selecting/deselecting this member, same behaviour the checkbox used to
// drive.
const MemberNameCell = memo(({ data }: { data: IMEMBER }) => {
  const fullName = `${data?.first_name}${data?.last_name ? ` ${data?.last_name}` : ''}`;
  const { toggle } = useToggleMember(data);
  return (
    <div
      className="flex items-center gap-2 w-full cursor-pointer"
      onClick={toggle}
      role="button"
      tabIndex={0}
    >
      <CustomAvatar name={fullName} showPresence extension={data?.extension} image={data?.profile} />
      <div className="min-w-0">
        <p className="capitalize truncate leading-tight">{fullName}</p>
        <p className="text-gray-500 text-[11px] truncate leading-tight">{data?.email}</p>
      </div>
    </div>
  );
});
MemberNameCell.displayName = 'MemberNameCell';

const MemberRoleCell = memo(({ data }: { data: IMEMBER }) => {
  const role = data?.custom_role_data?.name || data?.role_data?.name || data?.role || '—';
  const { toggle } = useToggleMember(data);
  return (
    <div className="cursor-pointer" onClick={toggle} role="button" tabIndex={0}>
      <span className="acp-role-pill">{role}</span>
    </div>
  );
});
MemberRoleCell.displayName = 'MemberRoleCell';

const MemberDidCell = memo(({ data }: { data: IMEMBER }) => {
  const { toggle } = useToggleMember(data);
  return (
    <div
      className="flex items-center justify-end gap-1 text-gray-500 cursor-pointer"
      onClick={toggle}
      role="button"
      tabIndex={0}
    >
      <Icon name="Grid" className="w-3.5 h-3.5" />
      <span>{data?.extension}</span>
    </div>
  );
});
MemberDidCell.displayName = 'MemberDidCell';

const AgentsList: FC<any> = ({ scriptList = [], dialMethod = DIALER_TYPE.PREVIEW }) => {
  const {
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();
  const selectedScript = watch('script');
  const selectedSite = watch('siteId')?.value;
  const [searchKey, setSearchKey] = useState('');
  const debouncedSearchKey = useDebounce(searchKey, 500);
  const members = watch('members') || [];

  const columns: ColumnDef<IMEMBER>[] = useMemo(
    () => [
      {
        header: 'Member',
        id: 'select',
        enableSorting: false,
        cell: ({ row }: any) => <MemberCheckboxCell data={row?.original} />,
        meta: { textAlign: 'left' },
      },
      {
        header: 'Name',
        accessorKey: 'first_name',
        cell: ({ row }: any) => <MemberNameCell data={row?.original} />,
      },
      {
        header: 'Role',
        id: 'role',
        cell: ({ row }: any) => <MemberRoleCell data={row?.original} />,
        meta: { textAlign: 'left' },
      },
      {
        header: 'DID',
        id: 'did',
        cell: ({ row }: any) => <MemberDidCell data={row?.original} />,
        meta: { textAlign: 'right' },
      },
    ],
    [],
  );

  /* Selected rows get the same light-red wash the rest of the form uses
     for an active state — the row itself is now the selection affordance,
     so it needs to look clickable/selected without a checkbox to carry
     that information. */
  const getRowClassName = useCallback(
    (row: any) => {
      const isSelected = members.some((m: any) => m?.value === row?.original?.extension);
      return isSelected ? 'acp-agent-row-selected' : '';
    },
    [members],
  );

  return (
    <div className="flex flex-col">
      <div className="w-full">
        <div className="w-full flex flex-row items-end gap-6 flex-wrap ">
          {dialMethod === DIALER_TYPE.PREVIEW && (
            <div className="flex items-center gap-3 pb-1">
              <h3 className="text-gray-900 font-semibold text-sm whitespace-nowrap">
                Allow Skipping
              </h3>
              <Switch
                onCheckedChange={(checked) => {
                  setValue('allowSkipping', checked);
                }}
                checked={watch('allowSkipping')}
              />
            </div>
          )}

          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex items-center gap-3 pb-1">
              <h3 className="text-gray-900 font-semibold text-sm whitespace-nowrap">
                Agent Scripting
              </h3>
              <Switch
                onCheckedChange={(checked) => {
                  setValue('agentScripting', checked);
                }}
                checked={watch('agentScripting')}
              />
            </div>
            {watch('agentScripting') && (
              <div className="w-[200px] sm:w-[240px]">
                <CustomSelect
                  className="w-full"
                  placeholder="Select Option"
                  label=""
                  options={scriptList
                    ?.filter((item: any) => item?.dialMethod === dialMethod)
                    .map((script: { name: string; _id: string }) => ({
                      label: script?.name,
                      value: script?._id,
                    }))}
                  handleChange={(e: ISELECTVALUE | null) => {
                    setValue(`script`, e || { label: '', value: '' }, { shouldValidate: true });
                  }}
                  error={(errors as any)?.script?.value?.message ?? errors?.script?.message}
                  value={selectedScript?.value ? selectedScript : null}
                  menuPlacement="auto"
                />
              </div>
            )}
          </div>

          {/* Search Input on the right side */}
          <div className="relative w-full max-w-sm ml-auto pb-0.5">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or extension..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              className="pl-9 h-9 text-sm rounded-lg"
            />
          </div>
        </div>
      </div>
      {(errors?.members as any)?.message && (
        <div className="flex gap-2 mt-2 mb-1">
          {errors?.members && (
            <p className="text-red-500 text-sm font-medium">{(errors?.members as any)?.message} </p>
          )}
        </div>
      )}

      <div className="mt-3 flex-grow acp-agents-table">
        <TableManager
          {...{
            columns,
            fetcherKey: 'forwardActionType',
            fetcherFn: forwardActionType,
            extraParams: {
              site_uuid: selectedSite,
              type: 'EXTENSION',
              page: 1,
              limit: 999,
              search: debouncedSearchKey,
            },
            showPagination: false,
            getRowClassName,
          }}
        />
      </div>
    </div>
  );
};

export default AgentsList;

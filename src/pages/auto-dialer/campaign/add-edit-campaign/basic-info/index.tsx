import CustomSelect from '@/components/custom/custom-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FC, useMemo } from 'react';
import { ISELECTVALUE } from '@/interfaces/api-interfaces';
import { useFormContext } from 'react-hook-form';
import { getBelongsToIcons } from '@/pages/integration/constant';
import { useOrganization } from '@/hooks/use-organisation';
const LeadGroupOptionView = ({ option, context }: any) => {
  const isMenu = context === 'menu';
  if (!isMenu) {
    return <span className="truncate">{option?.label}</span>;
  }
  return (
    <div className="flex w-full items-center justify-between pr-1 text-[13px]">
      <span className="truncate">{option?.label}</span>
      <span className="text-xs text-gray-500 font-normal whitespace-nowrap pl-4">
        {option?.leadCount ?? 0} leads
      </span>
    </div>
  );
};

const BasicInformation: FC<any> = ({
  dataSiteList,
  groupList,
  inventoryNumberList,
  campaignStatus,
}) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();
  const selectedGroupIds = watch('groupId');
  const { mainSiteInfo } = useOrganization();
  const belongsToIcons = getBelongsToIcons(mainSiteInfo);
  const leadGroupOptions = useMemo(() => {
    if (!groupList?.length) return [];

    return groupList
      ?.filter((item: any) => String(item?.generatedBy || '').toUpperCase() !== 'SYSTEM')
      ?.map((item: any) => {
        const groupName = item?.groupName || item?.name || '';
        // const iconUrl = belongsToIcons[groupName.toUpperCase()] || belongsToIcons['DEFAULT'] || '';
        return {
          label: groupName,
          value: item?._id,
          leadCount: item?.leadCount ?? 0,
          // iconUrl,
          // // icon: iconUrl ? (
          // //   <img
          // //     src={iconUrl}
          // //     alt={groupName || 'Group'}
          // //     className="w-4 h-4 rounded-full object-contain"
          // //   />
          // // ) : null,
        };
      });
  }, [groupList, belongsToIcons]);

  const selectedLeadGroups = useMemo(() => {
    if (!Array.isArray(selectedGroupIds)) return selectedGroupIds;

    return selectedGroupIds?.map((selectedGroup: any) => {
      const matchedOption = leadGroupOptions?.find(
        (option: any) => String(option?.value || '') === String(selectedGroup?.value || ''),
      );
      if (matchedOption) return matchedOption;

      const groupName = selectedGroup?.label || '';
      const iconUrl = belongsToIcons[groupName.toUpperCase()] || belongsToIcons['DEFAULT'] || '';
      return {
        ...selectedGroup,
        iconUrl,
        icon: iconUrl ? (
          <img
            src={iconUrl}
            alt={groupName || 'Group'}
            className="w-4 h-4 rounded-full object-contain"
          />
        ) : null,
      };
    });
  }, [selectedGroupIds, leadGroupOptions, belongsToIcons]);

  const nameError = (errors as any)?.name?.message;

  return (
    <div className="acp-fields">
      {/* Paired onto two columns on desktop — name/site, then caller IDs/leads
          — and back to one column below `acp-row`'s breakpoint. Field order
          stays exactly what it was; only the layout groups them side by side. */}
      <div className="acp-col">
        <div className="acp-row">
          <div className={nameError ? 'acp-invalid' : undefined}>
            <Input
              label={
                <>
                  Campaign Name <span className="text-[#dc2626]">*</span>
                </>
              }
              placeholder="Enter campaign name"
              {...register('name')}
              maxLength={50}
            />
            {nameError ? (
              <p className="acp-field-err">{nameError}</p>
            ) : (
              <p className="acp-field-hint">
                Campaign name can contain letters, numbers and spaces only.
              </p>
            )}
          </div>

          <div
            className={(errors as any)?.siteId?.value?.message ? 'acp-invalid' : undefined}
          >
            <CustomSelect
              label={'Site'}
              placeholder="Select Option"
              isDisabled={campaignStatus !== '' && campaignStatus !== 'NEW'}
              options={dataSiteList?.map((site: { name: string; uuid: string }) => ({
                label: site?.name,
                value: site?.uuid,
              }))}
              handleChange={(e: ISELECTVALUE | null) => {
                setValue(`siteId`, e || { label: '', value: '' }, { shouldValidate: true });
              }}
              value={watch('siteId')}
              inputClass="acp-select"
              menuPlacement="auto"
            />
            {(errors as any)?.siteId?.value?.message ? (
              <p className="acp-field-err">{(errors as any).siteId.value.message}</p>
            ) : null}
          </div>
        </div>

        <div className="acp-row">
          <div className={(errors as any)?.callerId?.message ? 'acp-invalid' : undefined}>
            <CustomSelect
              placeholder="Select Option"
              label={'Select Caller IDs'}
              isDisabled={campaignStatus !== '' && campaignStatus !== 'NEW'}
              options={
                inventoryNumberList?.length > 0
                  ? inventoryNumberList
                      .filter((item: { User: any }) => !item?.User)
                      .map((item: { did_number: string; uuid: string }) => ({
                        label: item?.did_number?.startsWith('+')
                          ? item?.did_number
                          : `+${item?.did_number}`,
                        value: item?.did_number,
                      }))
                  : []
              }
              handleChange={(e: ISELECTVALUE | null) => {
                setValue('callerId', e, { shouldValidate: true });
              }}
              inputClass="team_chat acp-select"
              value={watch('callerId')}
              isMulti={true}
              menuPlacement="auto"
            />
            {(errors as any)?.callerId?.message ? (
              <p className="acp-field-err">{(errors as any).callerId.message}</p>
            ) : null}
          </div>

          <div className={(errors as any)?.groupId?.message ? 'acp-invalid' : undefined}>
            <CustomSelect
              placeholder="Select Option"
              label={'Leads'}
              isDisabled={campaignStatus !== '' && campaignStatus !== 'NEW'}
              options={leadGroupOptions}
              handleChange={(e: ISELECTVALUE | null) => {
                setValue('groupId', e, { shouldValidate: true });
              }}
              value={selectedLeadGroups}
              isMulti={true}
              inputClass="team_chat acp-select"
              menuPlacement="auto"
              FormatOptionLabel={LeadGroupOptionView}
            />
            {(errors as any)?.groupId?.message ? (
              <p className="acp-field-err">{(errors as any).groupId.message}</p>
            ) : null}
          </div>
        </div>

        <div
          className={`acp-w-70${(errors as any)?.description?.message ? ' acp-invalid' : ''}`}
        >
          <Label htmlFor="campaign-description">
            Description <span className="acp-optional">(Optional)</span>
          </Label>
          <textarea
            id="campaign-description"
            className="acp-textarea mt-1.5 rounded-xl"
            placeholder="What is this campaign for?"
            rows={4}
            maxLength={500}
            {...register('description')}
          />
          {(errors as any)?.description?.message ? (
            <p className="acp-field-err">{(errors as any).description.message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BasicInformation;

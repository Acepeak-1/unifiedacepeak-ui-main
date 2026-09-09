import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertSiteSchema } from './schema';
import { Ic } from '@/components/mcm/icons';
import CustomTooltip from '@/components/custom/custom-tooltip';
import { InfoIcon } from 'lucide-react';
import { upsertSite } from '@/services/api';
import { getObjectLength, handleAlert } from '@/lib/utils';
import Loader from '@/components/custom/loader';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import SiteInfo from './site-info';
import Summary from './summary';

const createSiteFormInitialState = {
  name: '',
  address: '',
  state: '',
  city: '',
  country: null,
  postal_code: '',
  timezone: null,
  /* MAIN, not the column default of CUSTOM: showing the company main number is
     the sensible starting point, and CUSTOM without a name is what left every
     existing location misconfigured. */
  caller_id_type: 'MAIN',
  caller_id_name: '',
};

const NewSiteSteps = ({ data = {}, handleClose }: any) => {
  const [currentStep, setCurrentStep] = useState(1);
  const queryClient = useQueryClient();
  const isEdit = Boolean(data?.uuid);

  const formInstance = useForm<any>({
    defaultValues: createSiteFormInitialState,
    resolver: yupResolver(upsertSiteSchema),
    context: { currentStep },
    mode: 'all',
  });

  const { handleSubmit, reset } = formInstance;

  const stepLookUp: any = {
    1: <SiteInfo formInstance={formInstance} />,
    // 2: <CallerID formInstance={formInstance} />,
    2: <Summary formInstance={formInstance} />,
  };

  const { isPending, mutate } = useMutation({
    mutationFn: upsertSite,
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['siteList'] });
      handleAlert({ text: data?.data?.message, type: 'success' });
      handleClose();
    },
  });

  const onSubmit = (res: any) => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      const { country, timezone, ...rest } = res;

      const payload = {
        country: country?.value,
        timezone: timezone?.value || '',
        ...rest,
        ...(data?.uuid && { siteUUID: data?.uuid }),
      };
      /* Previously both were deleted here, so every save fell back to the column
         default (CUSTOM) with no name. They are sent now.

         "Custom name" with no name is not a real setting — it is the state every
         location was left in while the caller ID step was commented out. Rather
         than refuse the save, it is normalised to the company main number, so an
         old record quietly corrects itself the first time anyone edits it. */
      if (payload.caller_id_type === 'CUSTOM' && !`${payload.caller_id_name || ''}`.trim()) {
        payload.caller_id_type = 'MAIN';
      }
      if (payload.caller_id_type !== 'CUSTOM') {
        /* Removed, not blanked. The backend validator is
           `caller_id_name: Joi.string().optional()`, and a Joi string rejects ''
           unless .allow('') is set — so sending an empty string produced
           "caller_id_name is not allowed to be empty" and blocked every save
           where caller ID was not a custom name. Omitting the key leaves the
           stored value untouched, which is the right behaviour anyway: the name
           is meaningless for MAIN and BLANK and is not shown for them. */
        delete payload.caller_id_name;
      }
      mutate(payload);
    }
  };

  useEffect(() => {
    if (!getObjectLength(data)) return;
    const {
      name,
      address,
      state,
      city,
      country,
      postal_code,
      caller_id_name,
      caller_id_type,
      timezone,
    } = data || {};

    reset({
      name,
      address,
      state,
      city,
      country: { value: country, label: country },
      postal_code,
      timezone: timezone ? { value: timezone, label: timezone } : null,
      caller_id_name: caller_id_name || '',
      caller_id_type: caller_id_type || 'MAIN',
    });
  }, [data]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex h-full min-h-0 flex-col justify-between gap-4 pt-1"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
        <div className="mb-1.5 flex items-center gap-2">
          <h3 className="font-mono text-[12px] font-extrabold uppercase leading-[18px] text-red-600">
            {isEdit ? 'Edit Site' : 'Create New Site'}
          </h3>
          <CustomTooltip
            text={
              <>
                Add different office locations or branch sites
                <br />
                for your company — group users by location
                <br />
                (e.g., London, Dubai) under one billing account.
              </>
            }
            side="right"
            className="whitespace-normal text-left"
          >
            <InfoIcon className="w-3.5 h-3.5 text-gray-500 cursor-pointer" />
          </CustomTooltip>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-1 border-b border-gray-200 pb-3">
          {StepContent.map((step, index) => (
            <span key={step.number} className="flex shrink-0 items-center gap-1">
              {index > 0 && <Ic n="chev" size={14} className="text-gray-300" />}
              <button
                type="button"
                onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                className={
                  currentStep === step.number
                    ? 'text-sm font-medium text-gray-900 whitespace-nowrap'
                    : 'text-sm font-normal text-gray-400 whitespace-nowrap'
                }
              >
                {step.title}
              </button>
            </span>
          ))}
        </nav>
        {/* <div className=" w-full max-w-[940px] rounded-xl mx-auto  p-5 border border-gray-200 bg-white"> */}
        <div className="mx-auto mt-3 w-full max-w-[940px]">{stepLookUp[currentStep]}</div>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-2 sm:flex-row sm:justify-end sm:pt-2">
        <Button
          onClick={() => {
            if (currentStep === 1) {
              handleClose();
            } else {
              setCurrentStep((prev) => prev - 1);
            }
          }}
          variant={'transparent'}
          type="button"
          className="w-full sm:w-auto"
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>

        <Button
          variant={'primary'}
          disabled={isPending}
          type="submit"
          className="w-full bg-black border-black hover:bg-black/90 sm:w-auto"
        >
          {isPending ? (
            <Loader variant="blue" size="sm" />
          ) : currentStep === 2 ? (
            isEdit ? (
              'Update Site'
            ) : (
              'Submit Site'
            )
          ) : (
            'Save & Continue'
          )}
        </Button>
      </div>
    </form>
  );
};

export default NewSiteSteps;

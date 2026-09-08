import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CloseIcon } from '@/assets/icons';
import { DialogDescription } from '@/components/ui/dialog';
import { initialState, validationSchema, webhookEventTypes } from '../../constant';
import { useEffect } from 'react';
import CustomSelect from '@/components/custom/custom-select';

const AddPathModal = ({
  handleClose,
  editForm,
}: {
  handleClose: () => void;
  editForm: { isEdit: boolean; formData: any };
}) => {
  const { isEdit = false, formData = {} } = editForm || {};

  const formInstance = useForm<any>({
    defaultValues: initialState,
    resolver: yupResolver(validationSchema),
    mode: 'onSubmit',
  });
  const {
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = formInstance;

  // const { mutateAsync: hubspotCRMMutation, isPending } = useMutation({
  //   mutationKey: ['crmIntegration'],
  //   mutationFn: hubspotCRM,
  // });
  useEffect(() => {
    if (isEdit) {
      const { type, path } = formData || {};
      /* `reset` takes one object of values; this was called as
         `reset(type, path)` with two strings, so edit mode never populated
         the form. Unreachable until the row action existed, so it never
         surfaced. */
      reset({ type, path });
    } else {
      reset(initialState);
    }
  }, [isEdit, formData, reset]);

  const onSubmit = async (values: { path: string; type: string }) => {
    return values;
  };

  return (
    <form
      className="h-full w-full flex flex-col gap-4 justify-between"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-1.5  text-900/80 ">
        <div className="font-semibold truncate text-md flex items-center justify-between">
          {/* The dialog is reused for editing and still said "Add". */}
          {isEdit ? 'Edit webhook' : 'New webhook'}
          <div
            onClick={handleClose}
            className="cursor-pointer text-gray-500 ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <CloseIcon className="w-3 h-3" />
          </div>
        </div>
      </div>
      {/* asChild: DialogDescription renders a <p>, and the fields inside it
          are <div>s — invalid nesting that React reported as a hydration
          error. This keeps the aria wiring while emitting a <div>. */}
      <DialogDescription asChild>
        <div className="flex flex-col gap-4 bg-white">
          {/* The select's own border and outline are pinned by !important
              rules (ours in a layer, react-select's emotion class outside
              one), so the accent focus ring is drawn on this wrapper. */}
          {/* The dialog opened with two bare labels and no statement of what
              it does. One line, so it is clear before you fill anything in. */}
          <p className="mcm-modal-lede">
            We&apos;ll send a POST request to your URL each time the event you pick
            happens.
          </p>

          <div className="w-full mcm-selectring">
            <CustomSelect
              inputClass="mcm-select"
              label={'Event'}
              options={webhookEventTypes}
              handleChange={(e) => setValue(`type`, e)}
              value={watch('type')}
              placeholder="Choose an event"
              error={(errors.type?.message as string) || undefined}
            />
          </div>
          <div className="w-full">
            <Input
              label="Endpoint URL"
              {...register('path')}
              placeholder="https://hooks.example.com/webhooks/calls"
              error={errors?.path?.message}
              /* The shared Input focuses to `--primary` (the tenant colour);
                 this dialog follows the console accent like the select above. */
              className="hover:border-[#dc2626] focus:border-[#dc2626]"
            />
            {/* Only shown while the field is valid — an error message and a
                hint stacked together is two things shouting at once. */}
            {!errors?.path?.message ? (
              <p className="mcm-modal-hint">
                Must be a public HTTPS address we can reach. Include the full path.
              </p>
            ) : null}
          </div>
        </div>
      </DialogDescription>
      <div className="flex justify-end gap-2 w-full">
        <Button variant={'transparent'} onClick={handleClose} type="button">
          Cancel
        </Button>
        <Button
          variant={'primary'}
          type="submit"
          /* acepeak's black CTA (#171717) — the primary variant is the tenant
             colour, and this dialog portals outside the page scope that
             carries the black override. */
          className="border-[#171717] bg-[#171717] hover:border-[#2e2e2e] hover:bg-[#2e2e2e]"
        >
          {/* {isPending ? 'Loading...' : 'Submit'} */}
          {isEdit ? 'Save changes' : 'Create webhook'}
        </Button>
      </div>
    </form>
  );
};

export default AddPathModal;

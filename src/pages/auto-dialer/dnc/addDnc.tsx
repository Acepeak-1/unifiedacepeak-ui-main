import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { FC, Fragment } from 'react';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import * as yup from 'yup';
import { requiredString } from '@/lib/schema';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { handleAlert } from '@/lib/utils';
import { addDncCampaign } from '@/services/api';
import { Label } from '@/components/ui/label';
import PhoneInput from 'react-phone-input-2';
import { X } from 'lucide-react';
import './dnc-modal.css';

/**
 * `name` stays required and `email` stays optional — those are the rules this
 * form already enforced and the payload already relies on. The only rule added
 * is a format check on the address itself, so a typed-but-malformed email is
 * caught here rather than posted. The empty string is transformed away first,
 * or an untouched optional field would fail its own format test.
 *
 * The pattern is used in place of yup's own `.email()`, which accepts a bare
 * host with no TLD — `test@gmail` passes it. This requires a dotted domain
 * ending in a 2+ letter TLD, while still allowing multi-part ones such as
 * `user@company.co.in`. Server-side validation is unchanged and still runs.
 */
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

const DispositionSchema = yup.object().shape({
  name: requiredString('User name', 2, 50),
  phone: yup.string().required('Phone number is required'),
  email: yup
    .string()
    .transform((value) => (value === '' ? undefined : value))
    .matches(EMAIL_PATTERN, {
      message: 'Please enter a valid email address.',
      excludeEmptyString: true,
    })
    .optional(),
});

/** Presentational only — this form posts in one request. See dnc-modal.css. */
const STEPS = [
  { n: '01', label: 'Information' },
  { n: '02', label: 'Confirmation' },
];

interface DispositionProps {
  modalState: boolean;
  setModalState: (state: boolean) => void;
  editdata?: any;
}
const AddDncModal: FC<DispositionProps> = ({ modalState, setModalState, editdata }) => {
  const queryClient: any = useQueryClient();
  const {
    handleSubmit,
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      // countryPrefix: '+1',
    },
    resolver: yupResolver(DispositionSchema),
    // Was 'onChange', which called a half-typed address malformed on the first
    // keystroke. onTouched waits for blur, then corrects live.
    mode: 'onTouched',
  });

  const { mutate: mutateUpsertDisposition, isPending } = useMutation({
    mutationFn: addDncCampaign,
    onSuccess: () => {
      handleAlert({ text: 'DNC added successfully!', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['getPersonalDncList'] });
      setValue('phone', '');
      setValue('name', '');
      setValue('email', '');

      setModalState(false);
    },
  });

  const onSubmit = (data: any) => {
    const payload = {
      phone: data?.phone,
      name: data?.name,
      ...(data?.email ? { email: data?.email } : {}),
    };

    mutateUpsertDisposition(payload);
  };

  const closeAndReset = () => {
    setModalState(false);
    setValue('phone', '');
    setValue('name', '');
    setValue('email', '');
  };

  const phoneError = (errors?.phone as any)?.message;
  const emailError = (errors?.email as any)?.message;
  const nameError = (errors?.name as any)?.message;

  return (
    <Dialog open={modalState} onOpenChange={(val) => setModalState(val)}>
      <DialogContent className="dnc-modal" showCloseButton={false}>
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <div className="dnc-head">
            <div className="min-w-0">
              <DialogTitle className="dnc-title">
                {editdata ? 'Update DNC' : 'Add DNC'}
              </DialogTitle>
              <DialogDescription className="dnc-sub">
                Add a contact to your personal Do Not Contact list.
              </DialogDescription>
            </div>
            <button type="button" className="dnc-close" aria-label="Close" onClick={closeAndReset}>
              <X size={15} />
            </button>
          </div>

          <div className="dnc-steps" aria-hidden="true">
            {STEPS.map((step, index) => (
              <Fragment key={step.n}>
                {index > 0 ? (
                  <span className="dnc-rail">
                    <i />
                  </span>
                ) : null}
                <span className={`dnc-step${index === 0 ? ' is-on' : ''}`}>
                  <span className="dnc-step-n">{step.n}</span>
                  <span className="dnc-step-l">{step.label}</span>
                </span>
              </Fragment>
            ))}
          </div>

          <div className="dnc-body">
            <div className={phoneError ? 'dnc-invalid' : undefined}>
              <Label htmlFor="dnc-phone">
                Phone Number <span className="dnc-req">*</span>
              </Label>
              <div className="mt-1.5">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      {...field}
                      inputProps={{ id: 'dnc-phone' }}
                      country={'us'}
                      containerClass={phoneError ? 'phone-error' : ''}
                    />
                  )}
                />
              </div>
              {phoneError ? <p className="dnc-err">{phoneError}</p> : null}
            </div>

            <div className={emailError ? 'dnc-invalid' : undefined}>
              <Label htmlFor="dnc-email">Email</Label>
              <div className="mt-1.5">
                <Input
                  id="dnc-email"
                  type="text"
                  placeholder="name@example.com"
                  {...register('email')}
                />
              </div>
              {emailError ? <p className="dnc-err">{emailError}</p> : null}
            </div>

            <div className={nameError ? 'dnc-invalid' : undefined}>
              <Label htmlFor="dnc-name">
                User Name <span className="dnc-req">*</span>
              </Label>
              <div className="mt-1.5">
                <Input
                  id="dnc-name"
                  type="text"
                  placeholder="Enter user name"
                  maxLength={50}
                  {...register('name')}
                />
              </div>
              {nameError ? <p className="dnc-err">{nameError}</p> : null}
            </div>
          </div>

          <div className="dnc-foot">
            <Button
              variant={'transparent'}
              className="dnc-cancel"
              type="button"
              onClick={closeAndReset}
            >
              Cancel
            </Button>
            <Button variant={'primary'} className="dnc-submit" type="submit" disabled={isPending}>
              {isPending ? 'Submitting...' : editdata ? 'Update DNC' : 'Add DNC'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDncModal;

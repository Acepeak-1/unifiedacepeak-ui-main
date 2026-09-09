import { userInitialState } from '../../../constants';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { useFormContext } from 'react-hook-form';
import OrderSummary from '../order-summary';
import PaymentScreen from '@/components/payment';
import { cn } from '@/lib/utils';
import { KeyRound, Mail, Users as UsersIcon } from 'lucide-react';

const SIGN_IN_OPTIONS = [
  {
    value: 'email',
    icon: Mail,
    title: 'Send them an invite link',
    recommended: true,
    description:
      'They get an e-mail with a link to choose their own password. The link works for 3 days. You can send it again from the People list.',
  },
  {
    value: 'common',
    icon: UsersIcon,
    title: 'Set one password for everyone now',
    recommended: false,
    description:
      'You tell them the password yourself. They also get the invite link, in case they want to choose their own.',
  },
  {
    value: 'individual',
    icon: KeyRound,
    title: 'Set a password for each person now',
    recommended: false,
    description: 'You tell each person their password yourself. They also get the invite link.',
  },
] as const;

const SetupOption = ({
  orderSummary,
  status = '',
  paymentProps,
  setTypeOfPassword,
  dataGetMyPlanDetails,
  setPaymentCalculation,
}: any) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  }: any = useFormContext();

  // Watch current value of password_type
  const passwordType = watch('password_type');
  const watchUsers = watch('users');

  return (
    <div className="flex min-h-0 flex-col gap-2 overflow-y-auto pt-2 pr-1">
      {status === 'show_payment' ? (
        <div className="flex flex-col xl:flex-row gap-5">
          <section className="w-full xl:w-1/2 border border-grey-200 p-3 rounded-xl flex items-center justify-center">
            <PaymentScreen
              ref={paymentProps?.paymentRef}
              onSuccessPayment={paymentProps?.onSuccessPayment}
              isSavedPaymentCard={false}
              onSuccess3dsPayment={paymentProps?.handle3DSSuccess}
              onFailure3dsPayment={paymentProps?.handle3DSFailure}
              isApiLoad={paymentProps?.isApiLoad}
            />
          </section>
          <OrderSummary
            orderSummary={orderSummary}
            dataGetMyPlanDetails={dataGetMyPlanDetails}
            customClass="w-full"
            mainCustomClass="w-full xl:w-1/2"
            onCalculationChange={setPaymentCalculation}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">How should they sign in?</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              This applies to everybody you are adding. Nothing here e-mails a password out — the
              invite link always lets somebody set their own.
            </p>
          </div>

          <RadioGroup
            className="gap-2.5"
            value={passwordType}
            onValueChange={(value) => {
              setTypeOfPassword(value);
              setValue('password_type', value, { shouldValidate: true });
            }}
          >
            {SIGN_IN_OPTIONS.map(({ value, icon: OptionIcon, title, description, recommended }) => {
              const selected = passwordType === value;
              return (
                <label
                  key={value}
                  htmlFor={`password-${value}`}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  <RadioGroupItem value={value} id={`password-${value}`} className="mt-0.5" />
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      selected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500',
                    )}
                  >
                    <OptionIcon className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-gray-900">{title}</span>
                      {recommended ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                          Recommended
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs leading-snug text-gray-500">{description}</span>
                  </span>
                </label>
              );
            })}
          </RadioGroup>

          {passwordType === 'common' && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 p-3 md:grid-cols-2">
              <div className="flex flex-col gap-1.5 w-full">
                <Input
                  type="password"
                  label="Password"
                  placeholder="Password"
                  className="pr-9 text-[13px]"
                  {...register(`password`)}
                  autoComplete="new-password"
                  error={errors?.password?.message}
                  showEye={true}
                  IconPosition="right-0 inset-y-0 pr-3"
                />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm Password"
                  className="pr-9 text-[13px]"
                  {...register(`confirm_password`)}
                  autoComplete="new-password"
                  error={errors?.confirm_password?.message}
                  showEye={true}
                  IconPosition="right-0 inset-y-0 pr-3"
                />
              </div>
            </div>
          )}

          {passwordType === 'individual' && (
            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-3">
              {watchUsers?.map((field: typeof userInitialState, index: number) => {
                return (
                  <div className="grid grid-cols-3 gap-4" key={index}>
                    <Input
                      label={index === 0 && 'User'}
                      value={field?.first_name}
                      disabled
                      className="text-[13px]"
                    />

                    <Input
                      showEye={true}
                      label={index === 0 && 'Password'}
                      placeholder="Password"
                      type="password"
                      className="pr-9 text-[13px]"
                      IconPosition="right-0 inset-y-0 pr-3"
                      {...register(`users.${index}.password`)}
                      autoComplete="new-password"
                      error={errors?.users?.[index]?.password?.message}
                    />
                    <Input
                      showEye={true}
                      label={index === 0 && 'Confirm Password'}
                      placeholder="Confirm Password"
                      type="password"
                      className="pr-9 text-[13px]"
                      IconPosition="right-0 inset-y-0 pr-3"
                      {...register(`users.${index}.confirm_password`)}
                      autoComplete="new-password"
                      error={errors?.users?.[index]?.confirm_password?.message}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SetupOption;

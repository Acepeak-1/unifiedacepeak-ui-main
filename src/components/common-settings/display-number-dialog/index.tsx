import { CloseIcon } from '@/assets/icons';
import CustomSelect from '@/components/custom/custom-select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ISELECTVALUE } from '@/interfaces/api-interfaces';
import { ModalProps } from '@/interfaces/common-interface';
import { FC } from 'react';
import { useFormContext } from 'react-hook-form';

type MaskingType = 'S' | 'R' | 'P' | 'E' | 'N';

const incomingNumberOptions: ISELECTVALUE[] = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
];

const showMaskingInputDesc: Record<Exclude<MaskingType, 'N'>, string> = {
  S: 'Enter the number of digits to split (range: 2-5).',
  R: 'Enter a complete number or text (range: 3-15 characters).',
  P: 'Add an alphanumeric value at the beginning (range: 2-5 characters).',
  E: 'Add an alphanumeric value at the end (range: 2-5 characters).',
};

const maxInputLength: Record<MaskingType, number> = {
  S: 1,
  R: 15,
  P: 5,
  E: 5,
  N: 0,
};

const maskingOptions: ISELECTVALUE[] = [
  { label: 'Strip', value: 'S' },
  { label: 'Replace', value: 'R' },
  { label: 'Prefix', value: 'P' },
  { label: 'End', value: 'E' },
  { label: 'None', value: 'N' },
];

const DisplayNumberModal: FC<ModalProps & { anchorRight?: boolean }> = ({
  modalState,
  setModalState,
  data,
  /* Off by default — the original centered dialog, unchanged for every
     caller except the Preferences page (see the comment where this is
     passed in from common-settings/index.tsx). Only adds `lg:`-prefixed
     position overrides below, so a narrow screen still gets the normal
     centered modal either way. */
  anchorRight = false,
}) => {
  const { settings = {} } = data || {};
  const {
    watch,
    setValue,
    register,
    trigger,
    setError,
    formState: { errors },
  } = useFormContext();

  const displayNumber = watch('settings.display_number');
  const maskingValue = (displayNumber?.masking?.type?.value ?? 'N') as MaskingType;
  const incomingValue = displayNumber?.incoming?.value;

  const handleSubmit = async () => {
    const value = watch('settings.display_number.masking.value');
    if (maskingValue && maskingValue !== 'N' && (!value || value.toString().trim() === '')) {
      setError('settings.display_number.masking.value', {
        type: 'manual',
        message: 'Value is required',
      });
      return;
    }
    const isValid = await trigger(['settings.display_number.masking.value']);
    if (!isValid) return;
    setModalState(false);
  };
  const handleCancel = () => {
    setValue(
      'settings.display_number.incoming',
      settings?.display_number?.incoming || { label: 'Yes', value: true },
    );
    setValue(
      'settings.display_number.masking',
      settings?.display_number?.masking || { type: { value: 'N', label: 'None' }, value: '' },
    );
    setValue(
      'settings.display_number.show_number_if_blocked',
      settings?.display_number?.show_number_if_blocked || 'NO',
    );
    setValue('settings.display_number.masking.type', {
      label: settings?.display_number?.masking?.label || 'None',
      value: settings?.display_number?.masking?.type || 'N',
    });
    setModalState(false);
  };
  /* The fields, header and footer are identical in both modes — only the
     wrapper around them differs. Kept as one JSX value rather than two
     copies so there is exactly one place that ever needs to change. */
  const content = (
    <>
      <div className="flex flex-col gap-1.5  text-900/80">
          {/* 15px only for the Preferences page's own anchored panel, to
             match its "Regional"/"Calling" section headers — every other
             caller keeps the original 18px dialog title. */}
          <div
            className={`font-semibold truncate flex items-center justify-between ${anchorRight ? 'text-[15px]' : 'text-[18px]'}`}
          >
            Display Number
            {/* The anchored Preferences panel has nothing to close — it's
               always visible, not opened/dismissed — so this icon (which
               only ever reverted values and, for every other caller,
               closed the dialog) is dropped for that mode only. Every
               other caller keeps it exactly as before. */}
            {!anchorRight && (
              <div
                onClick={handleCancel}
                className="cursor-pointer ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
              >
                <CloseIcon className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {/* Incoming number */}
          <li className="py-4 first:pt-0 last:pb-0">
            <div className="flex gap-2 flex-col">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-[14px] text-gray-900">Incoming number</p>
                <small className="text-gray-700 text-[12px]">
                  Show the number the caller is using to call you
                </small>
              </div>
              <div className="w-full">
                <CustomSelect
                  options={incomingNumberOptions}
                  isSearchable={false}
                  value={{
                    label: displayNumber?.incoming?.label || '',
                    value: displayNumber?.incoming?.value?.toString() || '',
                  }}
                  handleChange={(e) => {
                    setValue('settings.display_number.incoming', e);
                    setValue('settings.display_number.special_number.number', '');
                    setValue('settings.display_number.masking.value', '', {
                      shouldValidate: true,
                    });
                    if (e?.value && !maskingValue) {
                      setValue('settings.display_number.masking.type', {
                        label: 'None',
                        value: 'N',
                      });
                    }
                  }}
                />
              </div>
            </div>
          </li>

          {/* Masking */}
          {incomingValue && (
            <li className="py-4 flex flex-col gap-4">
              <div className="flex gap-2 flex-col">
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-[14px] text-gray-900">Masking</p>
                  {/* text-xs text-gray-500 (12px, #6B7891) for this page's
                     anchored panel only, matching its other helper text
                     (e.g. the Regional card's CompanyLockNote); every
                     other caller keeps text-gray-800 text-[12px]. */}
                  <p className={anchorRight ? 'text-xs text-gray-500' : 'text-gray-800 text-[12px]'}>
                    {showMaskingInputDesc[maskingValue as Exclude<MaskingType, 'N'>] ??
                      'Invalid masking type'}
                  </p>
                </div>
                <div className="w-full">
                  <CustomSelect
                    options={maskingOptions}
                    isSearchable={false}
                    value={displayNumber?.masking?.type}
                    handleChange={(e) => {
                      setValue('settings.display_number.masking.type', e);
                      setValue('settings.display_number.masking.value', '');
                    }}
                  />
                </div>
              </div>
              {maskingValue &&
                maskingValue !== 'N' &&
                (() => {
                  const { onChange, ...rest } = register('settings.display_number.masking.value', {
                    required: 'Value is required',
                    validate: (value) => {
                      const str = (value ?? '').toString();
                      if (maskingValue === 'S') {
                        const num = Number(value);
                        if (!num || num < 2 || num > 5) {
                          return 'Enter a number between 2 and 5';
                        }
                      } else if (maskingValue === 'R') {
                        if (str.length < 3 || str.length > 15) {
                          return 'Enter 3 to 15 characters';
                        }
                      } else if (maskingValue === 'P' || maskingValue === 'E') {
                        if (str.length < 2 || str.length > 5) {
                          return 'Enter 2 to 5 characters';
                        }
                      }
                      return true;
                    },
                  });
                  return (
                    <Input
                      type="text"
                      inputMode={maskingValue === 'S' ? 'numeric' : 'text'}
                      placeholder="Enter value"
                      {...rest}
                      /* Belt and braces for Strip: block the keystroke itself, rather than
                         relying only on the onChange regex below to clean up after it. A
                         stray keystroke (or a stale bundle) landing before the correction
                         runs is how "8" or a letter was getting through. */
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        const isControlKey =
                          e.key.length > 1 || e.ctrlKey || e.metaKey || e.altKey;
                        if (isControlKey) return;
                        if (maskingValue === 'S') {
                          if (!['2', '3', '4', '5'].includes(e.key)) {
                            e.preventDefault();
                          }
                          return;
                        }
                        const target = e.target as HTMLInputElement;
                        const alreadyAtMax = target.value.length >= maxInputLength[maskingValue];
                        const hasSelection = target.selectionStart !== target.selectionEnd;
                        if (alreadyAtMax && !hasSelection) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (maskingValue === 'S') {
                          // Covers paste and autofill, which onKeyDown above cannot see.
                          e.target.value = e.target.value.replace(/[^2-5]/g, '').slice(0, 1);
                        } else {
                          e.target.value = e.target.value.slice(0, maxInputLength[maskingValue]);
                        }
                        onChange(e);
                      }}
                      error={(errors?.settings as any)?.display_number?.masking?.value?.message}
                    />
                  );
                })()}

              {/* {maskingValue && maskingValue !== 'N' && (
                <Input
                  type={maskingValue === 'S' ? 'number' : 'text'}
                  placeholder="Enter value"
                  {...register('settings.display_number.masking.value')}
                  onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                    e.target.value = e.target.value.slice(0, maxInputLength[maskingValue]);
                  }}
                  error={(errors?.settings as any)?.display_number?.masking?.value?.message}
                  min={0}
                />
              )} */}
            </li>
          )}

          {/* Display on */}
          {/* <li className="py-4">
            <div className="flex gap-5 justify-between items-center">
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Display on</p>
                <small>Pick devices you want your incoming calls to ring</small>
              </div>
              <CustomSelect
                options={DISPLAY_NUMBER_OPTIONS}
                value={displayNumber?.display_on}
                handleChange={(e) => {
                  setValue('settings.display_number.display_on', e);
                }}
              />
            </div>
          </li> */}

          {/* Final note */}
          <li className="pt-4">
            <div className="flex gap-2 justify-between items-center">
              <Label className="text-[12px]">
                If number is blocked or unknown, show my number instead
              </Label>

              <Switch
                onCheckedChange={(checked) => {
                  setValue(
                    'settings.display_number.show_number_if_blocked',
                    checked ? 'Yes' : 'No',
                  );
                }}
                checked={watch('settings.display_number.show_number_if_blocked') === 'Yes'}
              />
            </div>
          </li>
        </ul>

      <DialogFooter>
        <div className="justify-end flex gap-2">
          {/* Same reasoning as the close icon above — nothing to cancel out
             of on the always-visible Preferences panel. Every other
             caller keeps Cancel exactly as before. */}
          {!anchorRight && (
            <Button type="button" variant={'transparent'} onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button type="button" variant={'dark'} onClick={() => handleSubmit()}>
            Submit
          </Button>
        </div>
      </DialogFooter>
    </>
  );

  /* anchorRight (Preferences page only): a real always-visible panel, not
     a forced-open Dialog. Radix's Dialog applies focus-trap, body-scroll-
     lock and an inert background whenever it is open — permanently true
     here would have permanently blocked interaction with the Regional /
     Calling cards beside it. Plain positioning avoids that entirely, at
     the cost of not being a real Dialog: no focus trap, no ESC-to-close,
     no overlay — which is exactly what an always-open side panel needs
     instead of a modal. Every other caller is untouched below. */
  if (anchorRight) {
    /* Positioning itself (fixed, width, offsets) lives in the Preferences
       page's own CSS (scoped to .acepeak-preferences .acepeak-dn-panel),
       not as Tailwind lg: utilities here — this project redefines the
       "lg" breakpoint to 1280px (see index.css's @theme block), which
       didn't match the page's own hand-written 1024px breakpoint for its
       two-column grid, leaving this panel keying off the wrong width.
       Plain CSS on the one page that uses this class avoids relying on
       Tailwind's breakpoint tokens matching some other, unrelated CSS. */
    return (
      <div className="acepeak-dn-panel bg-white text-card-foreground w-full rounded-xl border p-3 shadow-lg flex flex-col gap-4">
        {content}
      </div>
    );
  }

  return (
    <Dialog open={modalState} onOpenChange={setModalState}>
      <DialogContent
        className="sm:w-1/2 lg:w-1/4 p-3 max-h-[99%] overflow-y-auto"
        showCloseButton={false}
      >
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default DisplayNumberModal;

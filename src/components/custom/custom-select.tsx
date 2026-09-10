import { ISELECTVALUE } from '@/interfaces/api-interfaces';
import { cn } from '@/lib/utils';
import { isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Select, { components } from 'react-select';
import { Label } from '../ui/label';
import ErrorTooltip from './error-tooltip';
import { Checkbox } from '../ui/checkbox';

interface CustomSelectType {
  options?: any;
  value?: ISELECTVALUE | null | any;
  handleChange?: (option: ISELECTVALUE | null | any) => void;
  isError?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  isMulti?: boolean;
  isDisabled?: boolean;
  error?: any;
  FormatOptionLabel?: any;
  className?: string;
  inputClass?: string;
  menuPlacement?: 'auto' | 'top' | 'bottom';
  isClearable?: boolean;
  menuPortalTarget?: HTMLElement | null | boolean;
  onMenuScrollToBottom?: () => void;
  onInputChange?: (value: string) => void;
  /* react-select is searchable by default. Fine for long lists, wrong for a
     handful of fixed options — typing there just filters down to "No
     options" instead of picking one, so callers with a short, closed list
     (e.g. Yes/No, a masking type) should pass `false`. */
  isSearchable?: boolean;
}

const SELECT_PAGE_SIZE = 25;

/* Popup dialogs (.ident-form-popup) are centered with a CSS `transform`
   (Radix Dialog's own `translate-x-[-50%] translate-y-[-50%]`), and a
   `transform` on an ancestor becomes the containing block for any
   descendant using `position: fixed` — which is exactly how react-select
   places a portaled menu. Portaling straight into the dialog itself (or
   any of its themed descendants) made the menu's fixed-position math
   resolve against the dialog's transformed box instead of the viewport,
   so it opened offset from its trigger instead of directly under it (e.g.
   Create Identity's "Type" menu opening well right of the field it belongs
   to). Two stable divs — each carrying the class structure the theme's CSS
   actually keys off, appended straight to body so nothing above them ever
   gets a transform — sidestep that while still giving the portaled menu
   the styling it needs. `.ident-coral-theme`'s red CSS variables are only
   defined under a `.mcm-admin` ancestor (see mcm-page.css), so that root
   nests the same way; `.ident-form-popup`'s own rules are all literal
   colors with no such requirement. */
let coralThemePortalRoot: HTMLDivElement | null = null;
let formPopupPortalRoot: HTMLDivElement | null = null;
const getThemedPortalRoot = (kind: 'ident-coral-theme' | 'ident-form-popup'): HTMLDivElement | null => {
  if (typeof document === 'undefined') return null;
  if (kind === 'ident-form-popup') {
    if (formPopupPortalRoot && document.body.contains(formPopupPortalRoot)) return formPopupPortalRoot;
    const root = document.createElement('div');
    root.className = 'ident-form-popup';
    document.body.appendChild(root);
    formPopupPortalRoot = root;
    return root;
  }
  if (coralThemePortalRoot && document.body.contains(coralThemePortalRoot)) return coralThemePortalRoot;
  const admin = document.createElement('div');
  admin.className = 'mcm-admin';
  const root = document.createElement('div');
  root.className = 'ident-coral-theme';
  admin.appendChild(root);
  document.body.appendChild(admin);
  coralThemePortalRoot = root;
  return root;
};

const toOptionsArray = (input: any): any[] => {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.rows)) return input.rows;
  if (Array.isArray(input?.result?.rows)) return input.result.rows;
  if (Array.isArray(input?.data?.rows)) return input.data.rows;
  return [];
};

const normalizeOption = (option: any, index: number) => {
  if (option === null || option === undefined) return null;

  if (typeof option === 'string' || typeof option === 'number' || typeof option === 'boolean') {
    const value = String(option);
    return { label: value, value, _index: index };
  }

  if (typeof option === 'object') {
    const label = option?.label ?? option?.name ?? option?.title ?? option?.text ?? option?.value;
    const value =
      option?.value ?? option?.id ?? option?.uuid ?? option?.key ?? option?.label ?? option?.name;

    if (typeof option?.label !== 'undefined' && typeof option?.value !== 'undefined') {
      return option;
    }

    return {
      ...option,
      label: typeof label === 'undefined' ? '---' : label,
      value: typeof value === 'undefined' ? `option-${index}` : value,
    };
  }

  return null;
};

const CustomSelect = ({
  className,
  options = [],
  value,
  handleChange,
  isMulti = false,
  isLoading = false,
  isDisabled = false,
  placeholder = 'Select',
  label = null,
  FormatOptionLabel = null,
  error = '',
  inputClass = '',
  menuPlacement = 'auto',
  isClearable = false,
  menuPortalTarget,
  onMenuScrollToBottom,
  onInputChange,
  isSearchable = true,
}: CustomSelectType & { label?: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  /* react-select's menu portals into document.body by default, which
     escapes the .ident-form-popup/.ident-coral-theme wrapper that scopes
     this app's Numbers-section red theme (hover=grey, selected=light red,
     text=black) — every caller that forgot to pass its own menuPortalTarget
     fell back to react-select's raw defaults instead. Rather than relying
     on every page to thread a ref down to its own CustomSelect calls,
     detect once at mount whether this select sits inside either themed
     scope and, if so, portal into the shared themed root above instead of
     document.body — callers that already pass an explicit menuPortalTarget
     (including `false`, to disable portalling) are left alone. */
  const [autoPortalTarget, setAutoPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (menuPortalTarget !== undefined) return;
    /* Checked in this order because a select inside an .ident-form-popup
       dialog that itself renders within an .ident-coral-theme page (Add
       Number's own portalled dialog, say) should still get the popup's
       literal-color rules, not the page's CSS-variable ones the portal
       can't see anyway. */
    const scope = containerRef.current?.closest('.ident-form-popup')
      ? 'ident-form-popup'
      : containerRef.current?.closest('.ident-coral-theme')
        ? 'ident-coral-theme'
        : null;
    setAutoPortalTarget(scope ? getThemedPortalRoot(scope) : null);
  }, [menuPortalTarget]);
  const normalizedOptions = useMemo(
    () =>
      toOptionsArray(options)
        .map((option: any, index: number) => normalizeOption(option, index))
        .filter(Boolean),
    [options],
  );
  const [inputValue, setInputValue] = useState('');
  const [visibleOptionCount, setVisibleOptionCount] = useState(SELECT_PAGE_SIZE);
  const usesRemoteSearch = typeof onInputChange === 'function';

  const locallyFilteredOptions = useMemo(() => {
    const normalizedInput = inputValue.trim().toLowerCase();
    if (usesRemoteSearch || !normalizedInput) return normalizedOptions;

    return normalizedOptions.filter((option: any) =>
      Object.values(option || {}).some((fieldValue) => {
        if (!['string', 'number', 'boolean'].includes(typeof fieldValue)) return false;
        return String(fieldValue).toLowerCase().includes(normalizedInput);
      }),
    );
  }, [inputValue, normalizedOptions, usesRemoteSearch]);

  const visibleOptions = useMemo(
    () =>
      usesRemoteSearch ? normalizedOptions : locallyFilteredOptions.slice(0, visibleOptionCount),
    [locallyFilteredOptions, normalizedOptions, usesRemoteSearch, visibleOptionCount],
  );

  useEffect(() => {
    setVisibleOptionCount(SELECT_PAGE_SIZE);
  }, [inputValue]);

  const resolveSingleValue = useCallback(
    (rawValue: any) => {
      if (rawValue === null || typeof rawValue === 'undefined' || rawValue === '') return null;

      if (typeof rawValue === 'object') {
        if (typeof rawValue?.value !== 'undefined') {
          const optionValue = rawValue?.value;
          const optionLabel = rawValue?.label;
          const isEmptyValue =
            optionValue === null ||
            typeof optionValue === 'undefined' ||
            (typeof optionValue === 'string' && optionValue.trim() === '');
          const isPlaceholderLabel =
            typeof optionLabel === 'string' && optionLabel.trim().toLowerCase() === 'select';
          const hasMeaningfulLabel =
            typeof optionLabel === 'string' && optionLabel.trim().length > 0 && !isPlaceholderLabel;

          if (isEmptyValue && !hasMeaningfulLabel) return null;
          if (
            isEmptyValue &&
            !normalizedOptions.some(
              (option: any) =>
                option?.value === optionValue ||
                option?.id === optionValue ||
                option?.uuid === optionValue,
            )
          ) {
            return null;
          }

          return rawValue;
        }
        const lookup = rawValue?.id ?? rawValue?.uuid ?? rawValue?.label ?? rawValue?.name;
        if (typeof lookup === 'undefined') return null;
        return (
          normalizedOptions.find(
            (option: any) =>
              option?.value === lookup || option?.id === lookup || option?.uuid === lookup,
          ) || null
        );
      }

      return (
        normalizedOptions.find(
          (option: any) =>
            option?.value === rawValue || option?.id === rawValue || option?.uuid === rawValue,
        ) || null
      );
    },
    [normalizedOptions],
  );

  const normalizedValue = useMemo(() => {
    if (isMulti) {
      if (!Array.isArray(value)) return [];
      return value.map((item: any) => resolveSingleValue(item)).filter(Boolean);
    }
    return resolveSingleValue(value);
  }, [isMulti, resolveSingleValue, value]);

  const onSelectChange = useCallback(
    (selected: any) => {
      if (typeof handleChange === 'function') {
        handleChange(selected);
      }
    },
    [handleChange],
  );

  const handleInputChange = useCallback(
    (nextValue: string) => {
      setInputValue(nextValue);
      onInputChange?.(nextValue);
      return nextValue;
    },
    [onInputChange],
  );

  const handleMenuScrollToBottom = useCallback(() => {
    if (!usesRemoteSearch && visibleOptionCount < locallyFilteredOptions.length) {
      setVisibleOptionCount((currentCount) =>
        Math.min(currentCount + SELECT_PAGE_SIZE, locallyFilteredOptions.length),
      );
    }
    onMenuScrollToBottom?.();
  }, [locallyFilteredOptions.length, onMenuScrollToBottom, usesRemoteSearch, visibleOptionCount]);

  const formatOptionLabel = useCallback(
    (option: any, { context }: { context: 'menu' | 'value' }) => {
      const isMenu = context === 'menu';
      const isSelected =
        isMulti && Array.isArray(value) && value.some((val: any) => val?.value === option?.value);

      if (typeof FormatOptionLabel === 'function') {
        return (
          <div className="flex items-center gap-2 w-full">
            {isMulti && isMenu && <Checkbox checked={isSelected} className="pointer-events-none" />}
            <FormatOptionLabel option={option} context={context} />
          </div>
        );
      }
      if (isValidElement(FormatOptionLabel)) return FormatOptionLabel;

      return (
        <div className="flex items-center gap-2 w-full">
          {isMulti && isMenu && <Checkbox checked={isSelected} className="pointer-events-none" />}
          {option?.icon && <span>{option?.icon}</span>}
          <span>{option?.label ?? '---'}</span>
        </div>
      );
    },
    [FormatOptionLabel, isMulti, value],
  );

  const selectComponents = useMemo(
    () => ({
      Menu: (props: any) => (
        <components.Menu
          {...props}
          innerProps={{
            ...props.innerProps,
            onWheel: (e: any) => {
              props.innerProps?.onWheel?.(e);
              e.stopPropagation();
            },
          }}
        />
      ),
      MenuList: (props: any) => {
        if (!isMulti) return <components.MenuList {...props} />;

        const { getValue } = props;
        const currentValues = getValue() || [];
        const selectableOptions = usesRemoteSearch ? normalizedOptions : locallyFilteredOptions;
        const selectedValues = new Set(currentValues.map((option: any) => option?.value));
        const allSelected =
          selectableOptions.length > 0 &&
          selectableOptions.every((option: any) => selectedValues.has(option?.value));

        const onClickSelectAll = (e: any) => {
          e.preventDefault();
          e.stopPropagation();
          if (allSelected) {
            props.setValue([], 'deselect-option');
          } else {
            props.setValue(selectableOptions, 'select-option');
          }
        };

        return (
          <components.MenuList {...props}>
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-gray-200 hover:bg-gray-50 text-xs font-semibold text-primary"
              onMouseDown={onClickSelectAll}
            >
              <Checkbox checked={allSelected} className="pointer-events-none" />
              <span>Select All</span>
            </div>
            {props.children}
          </components.MenuList>
        );
      },
    }),
    [isMulti, locallyFilteredOptions, normalizedOptions, usesRemoteSearch],
  );

  const resolvedMenuPortalTarget = useMemo(() => {
    if (menuPortalTarget === false) return undefined;
    if (
      menuPortalTarget &&
      typeof HTMLElement !== 'undefined' &&
      menuPortalTarget instanceof HTMLElement
    ) {
      return menuPortalTarget;
    }
    if (menuPortalTarget === undefined && autoPortalTarget) return autoPortalTarget;
    if (typeof document !== 'undefined') return document.body;
    return undefined;
  }, [menuPortalTarget, autoPortalTarget]);

  const classNamePrefix = useMemo(
    () => `${inputClass || ''} custom-react-select`.trim(),
    [inputClass],
  );

  return (
    <div ref={containerRef} className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label || error ? (
        <div className="flex items-center justify-between">
          {label && <Label>{label}</Label>}
          <div className="flex items-start">{error && <ErrorTooltip text={error} />}</div>
        </div>
      ) : null}
      <div className="flex w-full selectBox">
        <Select
          isDisabled={isDisabled}
          isLoading={isLoading}
          isSearchable={isSearchable}
          isMulti={isMulti}
          closeMenuOnSelect={!isMulti}
          classNamePrefix={classNamePrefix}
          value={normalizedValue}
          onChange={onSelectChange}
          onInputChange={handleInputChange}
          onMenuScrollToBottom={handleMenuScrollToBottom}
          filterOption={null}
          options={visibleOptions}
          placeholder={placeholder}
          className={cn('w-full', error && 'react-select-error')}
          menuPlacement={menuPlacement}
          formatOptionLabel={formatOptionLabel}
          isClearable={isClearable}
          menuPortalTarget={resolvedMenuPortalTarget}
          menuShouldBlockScroll={true}
          menuShouldScrollIntoView={false}
          styles={{
            menuPortal: (base) => ({
              ...base,
              zIndex: 9999,
              pointerEvents: 'auto',
            }),
            menu: (base) => ({
              ...base,
              zIndex: 9999,
            }),
          }}
          components={selectComponents}
        />
      </div>
    </div>
  );
};

export default CustomSelect;

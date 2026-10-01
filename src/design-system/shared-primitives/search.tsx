import { forwardRef, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { WMIcon } from '../icons/index.tsx';
import { wmPrimitiveClasses } from './shared.ts';

export interface WMSearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly label: string;
  readonly leading?: ReactNode;
  readonly clearLabel?: string;
  readonly onClear?: () => void;
}

export const WMSearchInput = forwardRef<HTMLInputElement, WMSearchInputProps>(function WMSearchInput({
  label,
  leading,
  clearLabel = 'Clear search',
  onClear,
  className,
  value,
  defaultValue,
  ...props
}, forwardedRef) {
  const localRef = useRef<HTMLInputElement | null>(null);
  const setRef = (node: HTMLInputElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };
  const hasControlledValue = value !== undefined;
  const hasValue = hasControlledValue ? String(value ?? '').length > 0 : String(defaultValue ?? '').length > 0;
  return (
    <div className={wmPrimitiveClasses('wm-search', className)} data-wm-component="search-input">
      {leading ?? <WMIcon name="search" />}
      <input
        {...props}
        ref={setRef}
        type="search"
        aria-label={label}
        className="wm-field-control"
        value={value}
        defaultValue={defaultValue}
      />
      {onClear || hasValue ? (
        <button
          type="button"
          className="wm-icon-button wm-icon-button--ghost wm-control--sm"
          aria-label={clearLabel}
          onClick={() => {
            if (!hasControlledValue && localRef.current) {
              localRef.current.value = '';
              localRef.current.dispatchEvent(new Event('input', { bubbles: true }));
            }
            onClear?.();
            localRef.current?.focus();
          }}
        >
          <WMIcon name="close" />
        </button>
      ) : null}
    </div>
  );
});

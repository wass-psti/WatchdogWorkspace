import { useId, useRef, type KeyboardEvent } from 'react';
import { wmPrimitiveClasses } from './shared.ts';

export interface WMSegmentedControlOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface WMSegmentedControlProps {
  readonly label: string;
  readonly value: string;
  readonly options: readonly WMSegmentedControlOption[];
  readonly disabled?: boolean;
  readonly className?: string;
  readonly onValueChange: (value: string) => void;
}

export function WMSegmentedControl({ label, value, options, disabled = false, className, onValueChange }: WMSegmentedControlProps) {
  const groupId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabledIndexes = options.flatMap((option, index) => option.disabled || disabled ? [] : [index]);

  const focusEnabledPosition = (position: number) => {
    const targetIndex = enabledIndexes[position];
    if (targetIndex === undefined) return;
    refs.current[targetIndex]?.focus();
  };

  const move = (currentIndex: number, direction: 1 | -1) => {
    if (enabledIndexes.length === 0) return;
    const currentEnabled = enabledIndexes.indexOf(currentIndex);
    const base = currentEnabled >= 0 ? currentEnabled : 0;
    const targetPosition = (base + direction + enabledIndexes.length) % enabledIndexes.length;
    focusEnabledPosition(targetPosition);
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      move(index, 1);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(index, -1);
      return;
    }
    if (event.key === 'Home') {
      if (enabledIndexes.length === 0) return;
      event.preventDefault();
      focusEnabledPosition(0);
      return;
    }
    if (event.key === 'End') {
      if (enabledIndexes.length === 0) return;
      event.preventDefault();
      focusEnabledPosition(enabledIndexes.length - 1);
    }
  };

  return (
    <div className={wmPrimitiveClasses('wm-segmented', className)} role="group" aria-label={label} id={groupId} data-wm-component="segmented-control">
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(node) => { refs.current[index] = node; }}
          type="button"
          aria-pressed={option.value === value}
          disabled={disabled || option.disabled}
          onKeyDown={(event) => onKeyDown(index, event)}
          onClick={() => onValueChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

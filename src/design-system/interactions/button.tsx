import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { WMInteractionSize, WMInteractionTone } from './shared.ts';
import { wmClasses } from './shared.ts';

export interface WMButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children?: ReactNode;
  readonly size?: WMInteractionSize;
  readonly tone?: WMInteractionTone;
  readonly variant?: 'solid' | 'outline' | 'ghost';
  readonly loading?: boolean;
}

export function WMButton({
  children,
  className,
  size = 'md',
  tone = 'neutral',
  variant = 'outline',
  loading = false,
  disabled,
  type = 'button',
  ...props
}: WMButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={wmClasses('wm-react-button', className)}
      data-size={size}
      data-tone={tone}
      data-variant={variant}
      data-loading={loading ? '' : undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
    >
      {children}
    </button>
  );
}

export interface WMIconButtonProps extends Omit<WMButtonProps, 'children'> {
  readonly label: string;
  readonly children: ReactNode;
}

export function WMIconButton({ label, children, className, ...props }: WMIconButtonProps) {
  return (
    <WMButton {...props} aria-label={label} className={wmClasses('wm-react-icon-button', className)}>
      {children}
    </WMButton>
  );
}

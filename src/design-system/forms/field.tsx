import {
  cloneElement,
  isValidElement,
  useId,
  type AriaAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

export type WMFieldMessageTone = 'neutral' | 'error' | 'success';

type FieldControlProps = {
  id?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  'aria-invalid'?: AriaAttributes['aria-invalid'];
  'aria-describedby'?: string;
  'aria-errormessage'?: string;
};

export interface WMFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly label: ReactNode;
  readonly children: ReactElement<FieldControlProps>;
  readonly controlId?: string;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly messageTone?: WMFieldMessageTone;
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly wide?: boolean;
}

function classes(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function joinIds(...values: Array<string | undefined>): string | undefined {
  const result = values.filter(Boolean).join(' ');
  return result || undefined;
}

export function WMField({
  label,
  children,
  controlId,
  description,
  message,
  messageTone = 'neutral',
  invalid = messageTone === 'error',
  required = false,
  disabled = false,
  wide = false,
  className,
  ...props
}: WMFieldProps) {
  const generatedId = useId().replace(/:/g, '');
  const resolvedControlId = controlId ?? `wm-field-${generatedId}`;
  const descriptionId = description == null ? undefined : `${resolvedControlId}-description`;
  const messageId = message == null ? undefined : `${resolvedControlId}-message`;

  if (!isValidElement(children)) {
    throw new Error('WMField requires exactly one valid form control element.');
  }

  const existing = children.props;
  const controlProps: Partial<FieldControlProps> = {
    id: existing.id ?? resolvedControlId,
    required: existing.required ?? required,
    disabled: existing.disabled ?? disabled,
  };

  const ariaInvalid = existing['aria-invalid'] ?? (invalid ? true : undefined);
  if (ariaInvalid !== undefined) {
    controlProps['aria-invalid'] = ariaInvalid;
  }

  const ariaDescribedBy = joinIds(existing['aria-describedby'], descriptionId, messageId);
  if (ariaDescribedBy !== undefined) {
    controlProps['aria-describedby'] = ariaDescribedBy;
  }

  const ariaErrorMessage = existing['aria-errormessage'] ?? (invalid && messageId ? messageId : undefined);
  if (ariaErrorMessage !== undefined) {
    controlProps['aria-errormessage'] = ariaErrorMessage;
  }

  const control = cloneElement(children, controlProps);

  return (
    <div {...props} className={classes('wm-field', wide && 'is-wide', className)} data-wm-component="field">
      <label className="wm-field-label" htmlFor={existing.id ?? resolvedControlId}>
        {label}
        {required ? <span className="is-required" aria-hidden="true">*</span> : null}
      </label>
      {description == null ? null : (
        <div id={descriptionId} className="wm-field-description">
          {description}
        </div>
      )}
      {control}
      {message == null ? null : (
        <div
          id={messageId}
          className={classes('wm-field-message', messageTone === 'error' && 'is-error', messageTone === 'success' && 'is-success')}
          data-tone={messageTone === 'neutral' ? undefined : messageTone}
        >
          {message}
        </div>
      )}
    </div>
  );
}

export interface WMInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly compact?: boolean;
}

export function WMInput({ compact = false, className, ...props }: WMInputProps) {
  return <input {...props} className={classes('wm-field-control', compact && 'is-compact', className)} data-wm-component="input" />;
}

export interface WMTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly compact?: boolean;
}

export function WMTextarea({ compact = false, className, ...props }: WMTextareaProps) {
  return <textarea {...props} className={classes('wm-field-control', compact && 'is-compact', className)} data-wm-component="textarea" />;
}

export interface WMNativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly compact?: boolean;
}

export function WMNativeSelect({ compact = false, className, children, ...props }: WMNativeSelectProps) {
  return (
    <select {...props} className={classes('wm-field-control', compact && 'is-compact', className)} data-wm-component="native-select">
      {children}
    </select>
  );
}

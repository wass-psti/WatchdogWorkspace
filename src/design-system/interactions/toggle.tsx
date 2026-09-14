import { Checkbox } from '@ark-ui/react/checkbox';
import { Switch } from '@ark-ui/react/switch';
import { useState } from 'react';
import type { ReactNode } from 'react';

export interface WMCheckboxProps {
  readonly label: ReactNode;
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly disabled?: boolean;
  readonly name?: string;
  readonly value?: string;
  readonly onCheckedChange?: (checked: boolean) => void;
}

export function WMCheckbox({ label, checked, defaultChecked, disabled, name, value, onCheckedChange }: WMCheckboxProps) {
  return (
    <Checkbox.Root
      className="wm-react-checkbox"
      {...(checked === undefined ? {} : { checked })}
      {...(defaultChecked === undefined ? {} : { defaultChecked })}
      {...(disabled === undefined ? {} : { disabled })}
      {...(name === undefined ? {} : { name })}
      {...(value === undefined ? {} : { value })}
      onCheckedChange={(details) => onCheckedChange?.(details.checked === true)}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control className="wm-react-checkbox__control">
        <Checkbox.Indicator>✓</Checkbox.Indicator>
      </Checkbox.Control>
      <Checkbox.Label className="wm-react-checkbox__label">{label}</Checkbox.Label>
    </Checkbox.Root>
  );
}

export interface WMSwitchProps {
  readonly label: ReactNode;
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly disabled?: boolean;
  readonly name?: string;
  readonly value?: string;
  readonly onCheckedChange?: (checked: boolean) => void;
}

export function WMSwitch({ label, checked, defaultChecked = false, disabled, name, value, onCheckedChange }: WMSwitchProps) {
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const resolvedChecked = isControlled ? checked : uncontrolledChecked;
  return (
    <Switch.Root
      className="wm-react-switch"
      checked={resolvedChecked}
      {...(disabled === undefined ? {} : { disabled })}
      {...(name === undefined ? {} : { name })}
      {...(value === undefined ? {} : { value })}
      onCheckedChange={(details) => {
        if (!isControlled) setUncontrolledChecked(details.checked);
        onCheckedChange?.(details.checked);
      }}
    >
      <Switch.HiddenInput />
      <Switch.Control className="wm-react-switch__control">
        <Switch.Thumb className="wm-react-switch__thumb" />
      </Switch.Control>
      <Switch.Label className="wm-react-switch__label">{label}</Switch.Label>
    </Switch.Root>
  );
}

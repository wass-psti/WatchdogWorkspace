import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  Info,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type { ComponentProps } from 'react';

const icons = Object.freeze({
  alert: AlertTriangle,
  calendar: Calendar,
  check: Check,
  chevronDown: ChevronDown,
  info: Info,
  more: MoreHorizontal,
  edit: Pencil,
  plus: Plus,
  search: Search,
  settings: Settings,
  trash: Trash2,
  user: User,
  close: X,
});

export type WMIconName = keyof typeof icons;
export interface WMIconProps extends Omit<ComponentProps<'svg'>, 'children'> {
  readonly name: WMIconName;
  readonly size?: number;
  readonly strokeWidth?: number;
}

/** Work Management icon boundary. Feature modules consume names, never Lucide imports. */
export function WMIcon({ name, size = 18, strokeWidth = 1.8, 'aria-hidden': ariaHidden = true, ...props }: WMIconProps) {
  const Icon = icons[name];
  return <Icon {...props} aria-hidden={ariaHidden} size={size} strokeWidth={strokeWidth} />;
}

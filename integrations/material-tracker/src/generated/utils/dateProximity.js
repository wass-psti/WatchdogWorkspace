/**
 * Computes a date proximity label and color for urgency indication.
 * Returns { label, cls } or null if no date.
 */
export function getDateProximity(dateRequired) {
  if (!dateRequired) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateRequired);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Overdue', cls: 'bg-destructive/10 text-destructive border-destructive/20' };
  if (diffDays === 0) return { label: 'Today', cls: 'bg-[hsl(var(--chart-4)/.10)] text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4)/.20)]' };
  if (diffDays <= 7) return { label: `${diffDays}d`, cls: 'bg-[hsl(var(--chart-4)/.08)] text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4)/.15)]' };
  return { label: 'On Track', cls: 'bg-[hsl(var(--chart-2)/.08)] text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2)/.15)]' };
}

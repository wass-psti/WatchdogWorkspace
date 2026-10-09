import React from 'react';
import { Label } from '@material/components/ui/label';

export function SectionLabel({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <Icon className="size-3.5 text-primary/60" />
      <span className="text-[11px] font-extrabold text-primary uppercase tracking-[0.12em] font-[family-name:var(--font-heading)]">{label}</span>
    </div>
  );
}

export function Field({ label, required, children }) {
  return (
    <div>
      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@material/components/ui/tooltip';

export function PresenceIndicator({ users }) {
  if (!users?.length) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center -space-x-1.5 cursor-default">
            {users.slice(0, 4).map(u => (
              <div key={u.id} className="size-7 rounded-full border-2 border-card overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                {u.photo ? <img src={u.photo} alt={u.name} className="size-full object-cover" />
                  : <span className="text-[10px] font-bold text-primary">{u.name?.charAt(0)?.toUpperCase()}</span>}
              </div>
            ))}
            {users.length > 4 && (
              <div className="size-7 rounded-full border-2 border-card bg-muted flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-muted-foreground">+{users.length - 4}</span>
              </div>
            )}
            <span className="size-2 rounded-full bg-[hsl(var(--chart-2))] ring-2 ring-card ml-1 animate-pulse" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs font-semibold mb-0.5">Also viewing:</p>
          {users.map(u => <p key={u.id} className="text-xs text-muted-foreground">{u.name}</p>)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default PresenceIndicator;

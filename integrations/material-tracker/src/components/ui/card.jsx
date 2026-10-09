import React from 'react'; import { cn } from '@material/lib/utils';
export const Card=React.forwardRef(({className,...p},r)=><div ref={r} className={cn('rounded-xl border bg-card text-card-foreground shadow',className)} {...p}/>); Card.displayName='Card';
export const CardContent=React.forwardRef(({className,...p},r)=><div ref={r} className={cn('p-6 pt-0',className)} {...p}/>); CardContent.displayName='CardContent';

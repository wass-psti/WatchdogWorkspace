import React from 'react'; import { cn } from '@material/lib/utils'; export function Skeleton({className,...p}){return <div className={cn('animate-pulse rounded-md bg-muted',className)} {...p}/>}

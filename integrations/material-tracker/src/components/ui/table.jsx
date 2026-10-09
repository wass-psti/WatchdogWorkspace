import React from 'react'; import { cn } from '@material/lib/utils';
export const Table=React.forwardRef(({className,...p},r)=><div className='relative w-full overflow-auto'><table ref={r} className={cn('w-full caption-bottom text-sm',className)} {...p}/></div>); Table.displayName='Table';
export const TableHeader=React.forwardRef(({className,...p},r)=><thead ref={r} className={cn('[&_tr]:border-b',className)} {...p}/>); TableHeader.displayName='TableHeader';
export const TableBody=React.forwardRef(({className,...p},r)=><tbody ref={r} className={cn('[&_tr:last-child]:border-0',className)} {...p}/>); TableBody.displayName='TableBody';
export const TableRow=React.forwardRef(({className,...p},r)=><tr ref={r} className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',className)} {...p}/>); TableRow.displayName='TableRow';
export const TableHead=React.forwardRef(({className,...p},r)=><th ref={r} className={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',className)} {...p}/>); TableHead.displayName='TableHead';
export const TableCell=React.forwardRef(({className,...p},r)=><td ref={r} className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0',className)} {...p}/>); TableCell.displayName='TableCell';

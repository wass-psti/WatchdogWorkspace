import type { HTMLAttributes,ReactNode } from 'react';
export interface WMValidationStateProps extends HTMLAttributes<HTMLDivElement>{readonly message:ReactNode;readonly valid?:boolean;}
export function WMValidationState({message,valid=false,className,...props}:WMValidationStateProps){return <div {...props} className={['wm-validation-state',className??''].filter(Boolean).join(' ')} data-wm-component="validation-state" data-valid={valid?'true':'false'} role={valid?'status':'alert'} aria-live={valid?'polite':'assertive'}>{message}</div>}

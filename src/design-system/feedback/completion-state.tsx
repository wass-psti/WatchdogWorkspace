import type { HTMLAttributes,ReactNode } from 'react';
import { WMFeedbackState } from './feedback-state.tsx';
export interface WMCompletionStateProps extends Omit<HTMLAttributes<HTMLDivElement>,'title'>{readonly title:ReactNode;readonly description?:ReactNode;readonly actions?:ReactNode;}
export function WMCompletionState({title,description,actions,...props}:WMCompletionStateProps){return <WMFeedbackState {...props} kind="success" tone="success" title={title} description={description} actions={actions} announcement="polite" data-wm-component="completion-state" data-wm-state="complete"/>}

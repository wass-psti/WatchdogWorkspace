import type { RouteAccessContext, RouteAccessDecision, RoutePolicyService } from '../../../../src/platform/contracts/routing.ts';
const ANON=new Set(['login','register','verify'] as const);const ENTRY=new Set(['login','register'] as const);
const WAIT=Object.freeze({kind:'wait'} as const);const DISABLED=Object.freeze({kind:'render-disabled'} as const);const RECOVERY=Object.freeze({kind:'render-auth-recovery'} as const);const LOGIN=Object.freeze({kind:'redirect',target:'login',rememberReturnRoute:true} as const);const ROOT=Object.freeze({kind:'redirect',target:'',rememberReturnRoute:false} as const);const ALLOW=Object.freeze({kind:'allow'} as const);
export function createRoutePolicyService():RoutePolicyService{return Object.freeze({decide(context:RouteAccessContext):RouteAccessDecision{
  if(!context.initialized||context.status==='initializing'||context.status==='restoring')return WAIT;
  if(context.status==='disabled')return DISABLED;
  if(context.status==='access-error')return RECOVERY;
  if(!context.authenticated&&!ANON.has(context.route.name as 'login'|'register'|'verify'))return LOGIN;
  if(context.authenticated&&ENTRY.has(context.route.name as 'login'|'register'))return ROOT;
  if(context.authenticated&&context.route.name==='users'&&!context.canManageUsers)return Object.freeze({kind:'render-forbidden',reason:'users'} as const);
  if(context.authenticated&&context.route.name==='app'&&context.route.moduleId&&!context.canAccessModule(context.route.moduleId))return Object.freeze({kind:'render-forbidden',reason:'module'} as const);
  return ALLOW;
}} satisfies RoutePolicyService);}

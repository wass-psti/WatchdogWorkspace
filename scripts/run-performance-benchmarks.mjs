import { performance } from 'node:perf_hooks';
import { calculateBoardVirtualColumnWindow } from '../src/features/boards/virtualization/board-table-virtualization.ts';
import { createRoutePolicyService } from '../assets/js/runtime/services/route-policy.ts';
import budgets from '../config/performance-budgets.json' with { type: 'json' };
const warm=250,samples=1500; const p95=(a)=>a.sort((x,y)=>x-y)[Math.floor(a.length*0.95)];
const widths=Array.from({length:240},(_,i)=>120+(i%7)*18);
for(let i=0;i<warm;i++) calculateBoardVirtualColumnWindow({widths,scrollOffset:i*31,viewportWidth:1280});
const col=[]; for(let i=0;i<samples;i++){const t=performance.now(); calculateBoardVirtualColumnWindow({widths,scrollOffset:(i*43)%22000,viewportWidth:1280}); col.push(performance.now()-t);} 
const svc=createRoutePolicyService(); const ctx={route:{name:'boards'},initialized:true,status:'ready',authenticated:true};
for(let i=0;i<warm;i++) svc.decide(ctx);
const route=[]; for(let i=0;i<samples;i++){const t=performance.now(); svc.decide(ctx); route.push((performance.now()-t)*1000);} 
const cp=p95(col), rp=p95(route); console.log(`Board column virtualization p95: ${cp.toFixed(4)} ms`); console.log(`Route policy p95: ${rp.toFixed(2)} µs`);
if(cp>budgets.boardColumnWindowP95Ms) throw new Error(`Board virtualization p95 ${cp} exceeds ${budgets.boardColumnWindowP95Ms} ms`);
if(rp>budgets.routePolicyP95Microseconds) throw new Error(`Route policy p95 ${rp} exceeds ${budgets.routePolicyP95Microseconds} µs`);
console.log('M31 performance microbenchmarks: PASS');

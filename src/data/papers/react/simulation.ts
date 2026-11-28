import type { TrajectoryEvent } from './types.ts'
export function trajectoryContext(events: TrajectoryEvent[], active: number) {
 const prefix=events.slice(0,active+1),last=prefix.at(-1)
 return {thoughts:prefix.filter(e=>e.kind==='thought').map(e=>e.text),observations:prefix.filter(e=>e.kind==='observation').map(e=>e.text),pendingAction:last?.kind==='action'?last.text:null,context:prefix.map(e=>`${e.label}: ${e.text}`)}
}
export function chooseFallback(method:'cot'|'react',samples:number,majority:number,steps:number,task:'hotpotqa'|'fever') {
 if(method==='cot')return samples>0&&majority<samples/2?'react':'continue'
 return steps>=(task==='hotpotqa'?7:5)?'cot-sc':'continue'
}

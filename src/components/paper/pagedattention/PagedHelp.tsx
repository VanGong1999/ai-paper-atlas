import type { ReactNode } from 'react'
import { Explainable } from '../Explainable'
import { findTooltip, type LayeredTooltip } from '../../../data/papers/pagedattention/tooltips'

export function PagedHelp({ term, children, example, onActivate, className = '', page }: { term: string; children?: ReactNode; example?: string; onActivate?: () => void; className?: string; page?: number }) {
  const tip = findTooltip(term)
  if (!tip) return <span>{children ?? term}</span>
  const sourcePage = page ?? ({'kv-cache':4,'internal-fragmentation':4,'external-fragmentation':4,'reservation':4,'kv-block':5,'block-table':6,'logical-block':6,'physical-block':6,'paged-attention':5,'on-demand':6,'cow':7,'shared-prefix':8,'beam-sharing':7,'continuous-batching':3,'preemption-swap':8,'throughput-latency':10,'block-size':12,'prefill-decode':3,'refcount':7,'fcfs':8,'recompute':13,'kernel-fusion':9,'workload':10,'api-server':9,'gpu-worker':9,'control-plane':9,'data-plane':9,'hardware':9,'memory-bound':4,'compute-bound':13,'source-evidence':1} as Record<string,number>)[tip.id] ?? 6
  return <Explainable as="button" explanation="background" identity={`paged-${tip.id}`} kind="pagedattention" className={`pa-help ${className}`} label={`${term}：${tip.main}`} example={example} onActivate={onActivate} content={{
    title: tip.term, plain: tip.main, role: tip.expanded,
    detail: [tip.io && `输入与输出 · ${tip.io}`, tip.calculation && `计算与形状 · ${tip.calculation}`, tip.engineering && `工程实现 · ${tip.engineering}`].filter((line): line is string => Boolean(line)),
    paperFact: `${tip.main}（${tip.anchor}）`, teachingExplanation: example ?? '当前小规模数字与块地址用于观察机制；不是 GPU 性能测量。', misconception: tip.limits && `适用边界 · ${tip.limits}`, originalId: `pagedattention-${tip.id}`, source: { section: tip.anchor, page: sourcePage, locator: tip.term },
  }}>{children ?? term}<span className="pa-help-dot" aria-hidden="true">⌁</span></Explainable>
}

export function TooltipSections({ tooltip }: { tooltip: LayeredTooltip }) {
  return <>{[['为什么需要',tooltip.expanded],['输入与输出',tooltip.io],['计算与形状',tooltip.calculation],['工程实现',tooltip.engineering],['边界与易错点',tooltip.limits]].map(([heading,text]) => text && <section key={heading}><h3>{heading}</h3><p>{text}</p></section>)}</>
}

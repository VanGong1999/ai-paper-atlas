import type { PagedStep } from '../../../data/papers/pagedattention/lessons'
import { PagedSandbox } from './PagedSandbox'

type Props = {
  step: PagedStep
  blockSize: number
  requestCount: number
  sharing: boolean
  playing?: boolean
  playbackKey?: number
  activeHotspot?: string | null
  onHoverHotspot?: (id: string | null) => void
}

export function PagedAttentionStage({ step, blockSize, requestCount, sharing, playing = true, playbackKey = 0, activeHotspot, onHoverHotspot }: Props) {
  const logical = Math.max(4, Math.round(18 / blockSize))
  const blocks = Array.from({ length: Math.min(18, logical + requestCount * 2) }, (_, index) => index)
  const active = Math.min(blocks.length, requestCount * Math.max(2, logical))
  return (
    <div className="pa-stage" data-scene={step.id} aria-label="PagedAttention 逻辑块与物理块可视化" role="img" key={`${step.id}-${playbackKey}`}>
      <div className="pa-stage-head"><div><span className="pa-kicker">{step.eyebrow}</span><h2>{step.title}</h2></div><span className="pa-status">LIVE MAP · {active} blocks</span></div>
      <div className="pa-pipeline" aria-hidden="true">
        <span>Prompt</span><i>→</i><span>Prefill</span><i>→</i><span className="active">KV pages</span><i>→</i><span>Decode</span><i>→</i><span>Release</span>
      </div>
      <PagedSandbox scene={step.id} blockSize={blockSize} requestCount={requestCount} sharing={sharing} onHover={onHoverHotspot} />
      <div className={`pa-memory-grid ${playing ? 'is-playing' : ''}`}>
        <div className="pa-lane-label"><span>LOGICAL</span><strong>request token blocks</strong><small>连续视图</small></div>
        <div className="pa-blocks logical">{Array.from({ length: Math.min(12, logical + 5) }, (_, index) => <span key={index} className={`pa-block ${index < logical ? 'filled' : 'empty'}`}><i className="pa-token" />{index < logical ? `L${index}` : '·'}</span>)}</div>
        <div className="pa-lane-label"><span>PHYSICAL</span><strong>GPU memory pool</strong><small>{sharing ? '共享 + COW' : '按需分配'}</small></div>
        <div className="pa-blocks physical">{blocks.map((index) => <span key={index} className={`pa-block ${index < active ? 'filled' : 'empty'} ${sharing && index % 5 === 0 ? 'shared' : ''}`}><i className="pa-token" />{index < active ? `P${index + 1}` : 'free'}</span>)}</div>
      </div>
      <div className="pa-map-lines" aria-hidden="true"><span>block table</span><b>logical i → physical block_table[i]</b><span>no contiguous placement required</span></div>
      <div className="pa-stage-note"><strong>为什么有效：</strong> 逻辑序列仍然连续，但物理 block 可以散落在显存池里；空洞不再阻止新 token 进入。</div>
      <div className="pa-hotspot-stage" aria-label="图中可悬浮注解">
        {step.hotspots.map((hotspot, index) => <div key={hotspot.id} className={`pa-hotspot-wrap pa-hotspot-${(index % 5) + 1}`}>
          <button type="button" className={`pa-hotspot ${activeHotspot === hotspot.id ? 'active' : ''}`} onMouseEnter={() => onHoverHotspot?.(hotspot.id)} onMouseLeave={() => onHoverHotspot?.(null)} onFocus={() => onHoverHotspot?.(hotspot.id)} onBlur={() => onHoverHotspot?.(null)} aria-label={`${hotspot.label}：${hotspot.plain}`}><span />{hotspot.label}</button>
          {activeHotspot === hotspot.id && <div className="pa-hover-popover" role="tooltip"><strong>{hotspot.label}</strong><p>{hotspot.plain}</p><small>{hotspot.detail}</small></div>}
        </div>)}
      </div>
    </div>
  )
}

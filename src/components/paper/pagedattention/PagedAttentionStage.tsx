import type { PagedStep } from '../../../data/papers/pagedattention/lessons'
import { findTooltip } from '../../../data/papers/pagedattention/tooltips'
import { PagedSandbox } from './PagedSandbox'
import { PagedHelp } from './PagedHelp'

type Props = { step: PagedStep; blockSize:number;requestCount:number;sharing:boolean;playing?:boolean;playbackKey?:number;activeHotspot?:string|null;onHoverHotspot?:(id:string|null)=>void }
export function PagedAttentionStage({ step,blockSize,requestCount,sharing,playing=true,playbackKey=0,activeHotspot,onHoverHotspot }:Props) {
 return <div className={`pa-stage ${playing?'is-playing':''}`} data-scene={step.id} aria-label={`${step.title}：可操作教学图`} key={`${step.id}-${playbackKey}`}>
   <div className="pa-pipeline" aria-label="服务执行阶段"><PagedHelp term="prompt">Prompt</PagedHelp><i>→</i><PagedHelp term="prefill">Prefill</PagedHelp><i>→</i><PagedHelp term="Block Table">KV pages</PagedHelp><i>→</i><PagedHelp term="decode">Decode</PagedHelp><i>→</i><PagedHelp term="release">Release</PagedHelp></div>
   <PagedSandbox scene={step.id} blockSize={blockSize} requestCount={requestCount} sharing={sharing} playing={playing}/>
   <div className="pa-hotspot-stage" aria-label="本步注解与详细说明">{step.hotspots.map(hotspot=><div key={hotspot.id} className="pa-hotspot-wrap">{findTooltip(hotspot.label)?<PagedHelp term={hotspot.label} className={activeHotspot===hotspot.id?'is-active':''} example={`${hotspot.plain} ${hotspot.detail}`} onActivate={()=>onHoverHotspot?.(activeHotspot===hotspot.id?null:hotspot.id)}/>:<button type="button" className={`pa-help ${activeHotspot===hotspot.id?'is-active':''}`} onClick={()=>onHoverHotspot?.(activeHotspot===hotspot.id?null:hotspot.id)} onFocus={()=>onHoverHotspot?.(hotspot.id)}>{hotspot.label} ⌁</button>}</div>)}</div>
   <p className="pa-stage-note">悬浮或键盘聚焦带 ⌁ 的标签，查看定义、输入输出、计算和边界；点击可保留本步右侧详解。沙盘中的块与数字为教学示例，论文数值另有来源标签。</p>
 </div>
}

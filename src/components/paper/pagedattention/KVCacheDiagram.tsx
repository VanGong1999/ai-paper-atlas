import { allocateSequence, createPool, forkSequence } from '../../../data/papers/pagedattention/mechanics'
import { PagedHelp } from './PagedHelp'

type Props = { blockSize:number;requestCount:number;sharing:boolean }
export function KVCacheDiagram({blockSize,requestCount,sharing}:Props) {
 const tokens=['Four','score','and','seven','years','ago','our']
 let pool=allocateSequence(createPool(blockSize,32),'R1',tokens)
 for(let i=1;i<requestCount;i++)pool=sharing?forkSequence(pool,'R1',`R${i+1}`):allocateSequence(pool,`R${i+1}`,tokens)
 const physical=pool.blocks.filter(b=>b.refs>0)
 return <div className="pa-sandbox"><div className="pa-sandbox-title"><strong>共享的对象是物理块，而非逻辑序列</strong><span>教学计算 · 相同7-token prompt</span></div><div className="pa-share-summary">{Object.entries(pool.sequences).map(([id,seq])=><div key={id}><strong>{id}</strong>{seq.blocks.map((p,l)=><PagedHelp key={l} term="Block Table" example={`${id} 的 L${l}→P${p}，物理块ref=${pool.blocks[p].refs}。`}>L{l}→P{p}</PagedHelp>)}</div>)}</div><p className="pa-live-event">{requestCount} 条逻辑序列 × {Math.ceil(tokens.length/blockSize)} 个逻辑块 = {requestCount*Math.ceil(tokens.length/blockSize)} 次引用；实际只有 {physical.length} 个唯一物理块。</p><p className="pa-limit">此时尚未追加分歧token；未满共享尾块之后需要COW。去“共享：前缀复用”点击追加，可观察写时复制与引用计数变化。</p></div>
}

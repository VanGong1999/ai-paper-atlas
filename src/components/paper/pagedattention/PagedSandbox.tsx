type Props = { scene: string; blockSize: number; requestCount: number; sharing: boolean; onHover?: (id: string | null) => void }

export function PagedSandbox({ scene, blockSize, requestCount, sharing, onHover }: Props) {
  if (scene === 'thesis' || scene === 'three-wastes') return <MemoryComparison requestCount={requestCount} blockSize={blockSize} />
  if (scene === 'autoregressive') return <GrowingRequest blockSize={blockSize} />
  if (scene === 'blocks' || scene === 'translation' || scene === 'pool') return <BlockTableSandbox blockSize={blockSize} onHover={onHover} />
  if (scene === 'cow' || scene === 'prompt-sharing' || scene === 'sampling' || scene === 'beam') return <SharingSandbox sharing={sharing} />
  if (scene === 'attention-read' || scene === 'kernel') return <AttentionGather />
  if (scene === 'continuous' || scene === 'overview') return <SchedulerFlow requestCount={requestCount} />
  if (scene === 'throughput' || scene === 'ablation') return <ThroughputCurve />
  return null
}

function MemoryComparison({ requestCount, blockSize }: { requestCount: number; blockSize: number }) {
  const traditionalWaste = Math.min(88, 30 + requestCount * 7 + blockSize * 2)
  const pagedWaste = Math.min(22, 4 + blockSize)
  return <div className="pa-sandbox pa-memory-compare" aria-label="传统连续分配与 PagedAttention 显存布局对比"><div className="pa-sandbox-title"><strong>GPU memory layout comparator</strong><span>{requestCount} requests · block {blockSize} tokens</span></div><div className="pa-compare-columns"><div><span className="pa-sandbox-label">TRADITIONAL / CONTIGUOUS</span><div className="pa-memory-bar traditional">{Array.from({ length: 10 }, (_, index) => <i key={index} className={index < 10 - Math.round(traditionalWaste / 10) ? 'used' : 'waste'} />)}</div><small>used {100 - traditionalWaste}% · waste {traditionalWaste}%</small></div><div><span className="pa-sandbox-label">PAGEDATTENTION / POOL</span><div className="pa-memory-bar paged">{Array.from({ length: 10 }, (_, index) => <i key={index} className={index < 10 - Math.round(pagedWaste / 10) ? 'used' : 'free'} />)}</div><small>used {100 - pagedWaste}% · tail waste ≤ 1 block</small></div></div><div className="pa-sandbox-equation">reservation + fragmentation <b>→</b> free block pool <b>→</b> larger batch</div></div>
}

function GrowingRequest({ blockSize }: { blockSize: number }) {
  const tokens = Array.from({ length: 14 }, (_, index) => index)
  return <div className="pa-sandbox" aria-label="单请求 KV Cache 生长动画"><div className="pa-sandbox-title"><strong>one request grows token by token</strong><span>block size {blockSize}</span></div><div className="pa-token-growth">{tokens.map(token => <span key={token} className={token % blockSize === 0 ? 'new-block' : ''}><b>{token % blockSize === 0 ? '▣' : '·'}</b>T{token}</span>)}</div><div className="pa-growth-caption"><strong>最后一块：</strong>输出长度未知时按需追加；最后一个 block 未填满的部分就是唯一可控碎片。</div></div>
}

function BlockTableSandbox({ blockSize, onHover }: { blockSize: number; onHover?: (id: string | null) => void }) {
  const logical = Array.from({ length: 6 }, (_, index) => index)
  const physical = [4, 1, 7, 3, 9, 2]
  return <div className="pa-sandbox" aria-label="Block Table 映射沙盘"><div className="pa-sandbox-title"><strong>block table mapping sandbox</strong><span>L{i18n(blockSize)} → P*</span></div><div className="pa-map-sandbox"><div>{logical.map(index => <button type="button" key={index} onMouseEnter={() => onHover?.(`logical-${index}`)} onMouseLeave={() => onHover?.(null)}><span>L{index}</span><small>logical</small></button>)}</div><div className="pa-map-arrows">{logical.map(index => <i key={index}>↘</i>)}</div><div>{physical.map(index => <button type="button" key={index} onMouseEnter={() => onHover?.(`physical-${index}`)} onMouseLeave={() => onHover?.(null)}><span>P{index}</span><small>physical</small></button>)}</div></div><div className="pa-sandbox-equation">logical block i <b>→</b> block_table[i] <b>→</b> physical GPU block</div></div>
}

function i18n(value: number) { return `${value} tokens` }

function SharingSandbox({ sharing }: { sharing: boolean }) {
  return <div className="pa-sandbox" aria-label="多请求共享与 Copy-on-Write 演示"><div className="pa-sandbox-title"><strong>shared prefix / copy-on-write</strong><span>{sharing ? 'sharing enabled' : 'independent copies'}</span></div><div className="pa-share-tree"><div className="pa-share-root">system prompt · shared KV</div><div className="pa-share-branches"><span>R1 <b>{sharing ? '↗ shared' : 'copy'}</b></span><span>R2 <b>{sharing ? '↗ shared' : 'copy'}</b></span><span>R3 <b>{sharing ? '↗ shared' : 'copy'}</b></span></div></div><div className="pa-sandbox-equation">read shared prefix <b>→</b> branch writes <b>→</b> copy-on-write suffix only</div></div>
}

function AttentionGather() {
  return <div className="pa-sandbox" aria-label="Attention kernel 按 Block Table gather K V"><div className="pa-sandbox-title"><strong>attention kernel gathers K / V</strong><span>semantics unchanged</span></div><div className="pa-gather"><span className="pa-query">Q<sub>t</sub></span><i>→</i><span>K/V block 0</span><i>→</i><span>K/V block 7</span><i>→</i><span>K/V block 2</span><i>→</i><strong>attention output</strong></div><div className="pa-sandbox-equation">查表只是寻址；attention 仍按逻辑 token 顺序计算。</div></div>
}

function SchedulerFlow({ requestCount }: { requestCount: number }) {
  return <div className="pa-sandbox" aria-label="Continuous batching 调度流"><div className="pa-sandbox-title"><strong>continuous batching</strong><span>{requestCount} active requests</span></div><div className="pa-scheduler-flow"><span>prefill</span><i>→</i><span>decode</span><i>→</i><span className="release">release block</span><i>→</i><span className="join">new request joins</span></div><div className="pa-sandbox-equation">scheduler 先看 free blocks，再决定本轮能运行谁。</div></div>
}

function ThroughputCurve() {
  return <div className="pa-sandbox" aria-label="吞吐与延迟简化对比图"><div className="pa-sandbox-title"><strong>same latency / throughput trend</strong><span>longer sequence → wider gap</span></div><div className="pa-curve"><span className="curve-baseline" /><span className="curve-vllm" /><em>baseline</em><b>vLLM</b></div><div className="pa-sandbox-equation">减少浪费后 batch 变大，优势在长序列、大模型、复杂 decoding 下更明显。</div></div>
}

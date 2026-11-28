/** Small deterministic teaching model, not a GPU benchmark or a full vLLM scheduler. */
export type KVBlock = { id: number; tokens: string[]; refs: number }
export type KVSequence = { blocks: number[]; length: number }
export type KVPool = { blockSize: number; blocks: KVBlock[]; sequences: Record<string, KVSequence>; event: string }
export function createPool(blockSize = 4, capacity = 9): KVPool {
  return { blockSize, blocks: Array.from({ length: capacity }, (_, id) => ({ id, tokens: [], refs: 0 })), sequences: {}, event: '空闲池已建立；尚未为未来 token 预留物理块。' }
}
const copy = (pool: KVPool): KVPool => structuredClone(pool)
function takeBlock(pool: KVPool): KVBlock {
  // The first three addresses reproduce Fig. 6. Remaining addresses are toy allocation order.
  const order = [...new Set([7, 1, 3, ...pool.blocks.map(b => b.id)])]
  const block = order.map(id => pool.blocks[id]).find(b => b && b.refs === 0)
  if (!block) throw new Error('空闲 block 不足：调度器需要等待、抢占或恢复后重试。')
  block.refs = 1; block.tokens = []; return block
}
export function allocateSequence(pool: KVPool, id: string, tokens: string[]): KVPool {
  if (pool.sequences[id]) throw new Error('序列已存在')
  let next = copy(pool); next.sequences[id] = { blocks: [], length: 0 }
  for (const token of tokens) next = appendToken(next, id, token)
  next.event = `allocate ${id}：${tokens.length} 个 token → ${next.sequences[id].blocks.length} 个物理块；未预留最大输出长度。`
  return next
}
export function appendToken(pool: KVPool, id: string, token: string): KVPool {
  const next = copy(pool), sequence = next.sequences[id]
  if (!sequence) throw new Error('序列不存在')
  let block = next.blocks[sequence.blocks.at(-1) ?? -1]
  if (!block || sequence.length % next.blockSize === 0) {
    block = takeBlock(next); sequence.blocks.push(block.id)
    next.event = `append ${id}：尾块已满，allocate P${block.id}；仅追加 block table，不搬移已有 KV。`
  } else if (block.refs > 1) {
    const previous = block, replacement = takeBlock(next)
    replacement.tokens = [...previous.tokens]; previous.refs -= 1
    sequence.blocks[sequence.blocks.length - 1] = replacement.id; block = replacement
    next.event = `COW ${id}：复制 P${previous.id} → P${block.id}（${previous.tokens.length} 个有效槽）；原块 refcount → ${previous.refs}；只改本分支页表。`
  } else next.event = `append ${id}：直接写 P${block.id} 的槽 ${sequence.length % next.blockSize}；没有申请新块。`
  block.tokens.push(token); sequence.length += 1; return next
}
export function forkSequence(pool: KVPool, source: string, target: string): KVPool {
  if (!pool.sequences[source] || pool.sequences[target]) throw new Error('fork 的源或目标不合法')
  const next = copy(pool), original = next.sequences[source]
  next.sequences[target] = { blocks: [...original.blocks], length: original.length }
  original.blocks.forEach(id => { next.blocks[id].refs += 1 })
  next.event = `fork ${source} → ${target}：复制逻辑映射，物理 KV 未复制；${original.blocks.map(id => `P${id} ref=${next.blocks[id].refs}`).join('，')}。`
  return next
}
export function freeSequence(pool: KVPool, id: string): KVPool {
  const next = copy(pool), sequence = next.sequences[id]
  if (!sequence) return next
  const released: number[] = []
  for (const physical of sequence.blocks) { const b = next.blocks[physical]; b.refs -= 1; if (b.refs === 0) { b.tokens = []; released.push(physical) } }
  delete next.sequences[id]
  next.event = `free ${id}：所有引用减一；${released.length ? released.map(id => `P${id}`).join('、') : '没有块'}回到 free pool；其他分支仍在使用的块保留。`
  return next
}
export function readSequence(pool: KVPool, id: string): string[] {
  return pool.sequences[id].blocks.flatMap(physical => pool.blocks[physical].tokens).slice(0, pool.sequences[id].length)
}
export function blockAttention(length: number, blockSize: number, query: number) {
  // d=2; numerical K/V are deliberately tiny teaching inputs, not learned model activations.
  const q = [query / 4, 1], keys = Array.from({ length }, (_, i) => [Math.sin(i + 1), Math.cos(i + 1)])
  const values = keys.map((_, i) => [i + 1, (i + 1) / 2])
  const logits = keys.map(k => (q[0] * k[0] + q[1] * k[1]) / Math.sqrt(2))
  const max = Math.max(...logits), exponentials = logits.map(s => Math.exp(s - max)), denominator = exponentials.reduce((a, b) => a + b, 0)
  const weights = exponentials.map(s => s / denominator)
  const contiguous = [0, 1].map(d => weights.reduce((s, w, i) => s + w * values[i][d], 0))
  const partials = Array.from({ length: Math.ceil(length / blockSize) }, (_, block) => [0, 1].map(d => weights.slice(block * blockSize, (block + 1) * blockSize).reduce((s, w, offset) => s + w * values[block * blockSize + offset][d], 0)))
  const output = [0, 1].map(d => partials.reduce((s, v) => s + v[d], 0))
  return { q, denominator, output, contiguous, partials, error: Math.max(...output.map((v, d) => Math.abs(v - contiguous[d]))), rows: logits.map((score, token) => ({ token, block: Math.floor(token / blockSize), offset: token % blockSize, score, weight: weights[token], key: keys[token], value: values[token] })) }
}
export function scheduleExample(recovery: 'swap' | 'recompute') {
  const evicted = recovery === 'swap' ? 'CPU' : '待重算'
  return [
    { used: 6, title: '① GPU 已满：A 先到，B 后到', detail: '预算 6 blocks：A 占 3，B 是两条共享前缀的序列，合计占 3 个唯一物理块。C 等待。A 下一步还需 1 块。', groups: [{ id: 'A', blocks: 3, status: 'GPU' }, { id: 'B', blocks: 3, status: 'GPU' }, { id: 'C', blocks: 2, status: '等待' }] },
    { used: 4, title: '② 抢占 B 整组，让 A 继续', detail: `后到的 B 全组暂停，${recovery === 'swap' ? '3 块换到 CPU RAM' : '丢弃 3 块 KV，保留完整 token IDs'}。A 得到 1 新块，GPU 用量变成 4/6。C 仍不接纳。`, groups: [{ id: 'A', blocks: 4, status: 'GPU' }, { id: 'B', blocks: 3, status: evicted }, { id: 'C', blocks: 2, status: '等待' }] },
    { used: 3, title: '③ A 完成：先恢复 B', detail: `A 释放 4 块；B ${recovery === 'swap' ? '从 CPU 换入' : '将 prompt + 已生成 token 一起 prefill 重算'}后全组恢复。被抢占请求完成前，不接纳 C。`, groups: [{ id: 'A', blocks: 0, status: '完成' }, { id: 'B', blocks: 3, status: 'GPU' }, { id: 'C', blocks: 2, status: '等待' }] },
    { used: 5, title: '④ 等 B 完成后，再接纳新请求', detail: 'B 完成并释放 3 块。教学例中 C 占 2 块，随后 D 占 3 块；新 batch 使用 5/6 块。调度按 iteration 边界更新，而不是任意时刻插入 GPU kernel。', groups: [{ id: 'B', blocks: 0, status: '完成' }, { id: 'C', blocks: 2, status: 'GPU' }, { id: 'D', blocks: 3, status: 'GPU' }] },
  ]
}

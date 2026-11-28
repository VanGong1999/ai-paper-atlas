import type { PaperSlug } from './coverage'

export type CrossPaperLink = {
  id: string
  title: string
  attentionConcept: string
  pagedConcept: string
  explanation: string
  attentionSource: string
  pagedAttentionSource: string
  targetPaper: PaperSlug
}

export const crossPaperLinks: CrossPaperLink[] = [
  {
    id: 'math-to-cache',
    title: '从 attention 数学到 KV Cache',
    attentionConcept: 'Attention(Q,K,V) = softmax(QKᵀ/√d_k)V',
    pagedConcept: 'decode 反复读取历史 K/V',
    explanation: 'Attention 论文定义了每个 query 如何读取所有历史 key/value；PagedAttention 处理的正是这些历史 K/V 在 serving 时如何被缓存、追加和寻址。',
    attentionSource: 'Attention §3.2.1 p.4',
    pagedAttentionSource: 'PagedAttention §2.2 p.2–3',
    targetPaper: 'pagedattention',
  },
  {
    id: 'semantic-storage',
    title: '数学语义与物理布局分离',
    attentionConcept: '逻辑顺序决定 attention 结果',
    pagedConcept: 'logical block → physical block table[i]',
    explanation: 'PagedAttention does not change attention mathematics；它只改变 storage layout、地址翻译和 batch 管理，因此逻辑 token 顺序仍然与 Attention 公式一致。',
    attentionSource: 'Attention §3.2 p.4',
    pagedAttentionSource: 'PagedAttention §4.1 / Figures 5–6',
    targetPaper: 'pagedattention',
  },
  {
    id: 'decode-to-scheduler',
    title: '逐 token decode 变成调度问题',
    attentionConcept: 'decoder masked self-attention',
    pagedConcept: 'continuous batching + scheduler',
    explanation: '因果 mask 让 decoder 只能读取过去；在在线服务里，这意味着每轮都要读取增长中的历史 KV，并由 scheduler 决定哪些请求继续占用 block。',
    attentionSource: 'Attention §3.2.2 p.5',
    pagedAttentionSource: 'PagedAttention §4.3–4.5',
    targetPaper: 'pagedattention',
  },
  {
    id: 'shared-prefix',
    title: 'attention 的读多写少与前缀共享',
    attentionConcept: '同一上下文被多个 query 读取',
    pagedConcept: 'prefix sharing + copy-on-write',
    explanation: '当 parallel sampling 或 beam search 共享 prompt 时，多个分支读取同一历史 K/V；引用计数与 COW 将共享前缀和独立 suffix 组合起来。',
    attentionSource: 'Attention §3.2 p.4',
    pagedAttentionSource: 'PagedAttention §4.4 / Figures 7–10',
    targetPaper: 'pagedattention',
  },
]

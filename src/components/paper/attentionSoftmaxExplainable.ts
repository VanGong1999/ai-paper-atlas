import { explainables } from '../../data/papers/attention/explainables.ts'
import type { Explainable } from '../../data/papers/attention/explainables.ts'

// §3.2.1 reuses the existing source anchor while keeping attention
// normalization distinct from the output vocabulary Softmax in §3.4.
export const attentionSoftmaxExplainable: Explainable = {
  ...explainables.scale,
  title: '注意力 Softmax',
  plain: '把每个查询对各键的缩放分数归一化成注意力权重。',
  role: '在固定查询的一行中形成对键位置的分配。',
  detail: [
    '式 (1) 在 QKᵀ/√dₖ 上应用 softmax，再用这些权重乘 V。',
    '输入是 n_q×n_k 分数，输出 A 形状不变；每个查询的一行权重和为 1。',
    'Aᵢⱼ=exp(sᵢⱼ)/Σₗexp(sᵢₗ)；对同一行统一减去最大分数再指数化，可得到相同结果并避免溢出。',
    '被屏蔽的 −∞ 输入在指数化后为 0；再以 A(n_q×n_k) 乘 V(n_k×dᵥ)，输出 n_q×dᵥ。',
  ],
  paperFact: '论文式 (1) 为 Attention(Q,K,V)=softmax(QKᵀ/√dₖ)V，softmax 位于缩放点积分数与 V 的加权求和之间。',
  teachingExplanation: '教学解释：沿一行看，Softmax 把各键的分数转换为行内权重，随后这些权重用于汇总值向量。',
}

/** Row-wise softmax; lastVisible encodes the §3.2.3 causal mask. */
export function normalizeAttentionScores(scores: readonly number[], lastVisible = scores.length - 1): number[] {
  const peak = Math.max(...scores.slice(0, lastVisible + 1))
  const exponentials = scores.map((score, index) => index <= lastVisible ? Math.exp(score - peak) : 0)
  const total = exponentials.reduce((sum, value) => sum + value, 0)
  return exponentials.map(value => value / total)
}

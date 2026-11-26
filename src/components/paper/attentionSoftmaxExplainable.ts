import { explainables } from '../../data/papers/attention/explainables'
import type { Explainable } from '../../data/papers/attention/explainables'

// §3.2.1 reuses the existing source anchor while keeping attention
// normalization distinct from the output vocabulary Softmax in §3.4.
export const attentionSoftmaxExplainable: Explainable = {
  ...explainables.scale,
  title: '注意力 Softmax',
  plain: '把每个查询对各键的缩放分数归一化成注意力权重。',
  role: '在固定查询的一行中形成对键位置的分配。',
  detail: [
    '式 (1) 在 QKᵀ/√dₖ 上应用 softmax，再用这些权重乘 V。',
    '对固定查询，参与归一化的是可读取的键位置。',
  ],
  paperFact: '论文式 (1) 为 Attention(Q,K,V)=softmax(QKᵀ/√dₖ)V，softmax 位于缩放点积分数与 V 的加权求和之间。',
  teachingExplanation: '教学解释：沿一行看，Softmax 把各键的分数转换为行内权重，随后这些权重用于汇总值向量。',
}

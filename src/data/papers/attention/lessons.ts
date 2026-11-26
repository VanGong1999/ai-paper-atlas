import { explainables, type ExplainableId } from './explainables.ts'
import type { PaperSource } from './originals-en.ts'

type Stage = 'overview' | 'complexity' | 'architecture' | 'attention' | 'multi-head'
  | 'position' | 'feed-forward' | 'training' | 'experiments' | 'conclusion'

export type StageNode = {
  id: ExplainableId
  explainableId: ExplainableId
  label: string
  x: number
  y: number
  w: number
  h: number
  tip: string
  group?: 'encoder' | 'decoder' | 'attn' | 'io' | 'train'
}

export type LessonStep = {
  id: string
  title: string
  body: string
  paperFact: string
  teachingExplanation: string
  diffs?: string[]
  formula?: string
  highlight: ExplainableId[]
  originalId: string
  source: PaperSource
  stage: Stage
  figureIds: string[]
  explainableIds: ExplainableId[]
}

export type Lesson = {
  id: string
  index: number
  title: string
  subtitle: string
  minutes: number
  learn: string[]
  steps: LessonStep[]
  nodes: StageNode[]
  edges: [ExplainableId, ExplainableId][]
  originalId: string
  source: PaperSource
  stage: Stage
  figureIds: string[]
  explainableIds: ExplainableId[]
}

function node(id: ExplainableId, label: string, x: number, y: number, group: StageNode['group']): StageNode {
  return { id, explainableId: id, label, x, y, w: 126, h: 42, group, tip: explainables[id].plain }
}

function step(id: string, primary: ExplainableId, figureIds: string[], related: ExplainableId[] = [], formula?: string) {
  const { title, plain, paperFact, teachingExplanation, originalId, source } = explainables[primary]
  const explainableIds = [primary, ...related]
  return {
    id, title, paperFact, teachingExplanation,
    body: `${plain} ${paperFact} 教学解释：${teachingExplanation}`,
    diffs: explainables[primary].detail, formula, figureIds,
    highlight: explainableIds, originalId, source, explainableIds,
  }
}

type LessonDefinition = Pick<Lesson, 'id' | 'title' | 'subtitle' | 'minutes' | 'stage' | 'nodes' | 'edges'> & {
  steps: ReturnType<typeof step>[]
}

const definitions: LessonDefinition[] = [
  {
    id: 'abstract', title: '摘要与贡献', subtitle: '两个翻译方向与一次跨任务检验', minutes: 3, stage: 'overview',
    steps: [
      step('scope', 'contribution', []),
      step('translation', 'bleu', ['table-2']),
      step('transfer', 'parsing', ['table-4']),
    ],
    nodes: [
      node('contribution', 'Transformer', 85, 145, 'io'),
      node('bleu', '翻译 · BLEU', 335, 80, 'train'),
      node('parsing', '句法 · F1', 335, 210, 'train'),
    ],
    edges: [['contribution', 'bleu'], ['contribution', 'parsing']],
  },
  {
    id: 'why', title: '引言与背景', subtitle: '串行约束、长程依赖与表 1', minutes: 4, stage: 'complexity',
    steps: [
      step('rnn', 'recurrence', []),
      step('distance', 'background', []),
      step('idea', 'complexity', ['table-1']),
    ],
    nodes: [
      node('recurrence', '循环的时间步', 65, 80, 'io'),
      node('background', '卷积的连接路径', 65, 210, 'io'),
      node('complexity', '表 1 · 比较维度', 365, 145, 'attn'),
    ],
    edges: [['recurrence', 'complexity'], ['background', 'complexity']],
  },
  {
    id: 'arch', title: '编码器与解码器', subtitle: '从嵌入到下一词元的预测概率', minutes: 5, stage: 'architecture',
    steps: [
      step('enc', 'encoder', ['figure-1'], ['embedding', 'self', 'residual']),
      step('dec', 'decoder', ['figure-1'], ['mask', 'cross']),
      step('out', 'softmax', ['figure-1'], ['linear']),
    ],
    nodes: [
      node('embedding', '输入嵌入', 15, 40, 'io'), node('self', '编码器自注意力', 175, 40, 'attn'),
      node('residual', 'Add & Norm', 175, 125, 'encoder'), node('encoder', '编码器输出', 175, 215, 'encoder'),
      node('mask', '掩码自注意力', 340, 40, 'decoder'), node('cross', '跨序列注意力', 340, 125, 'attn'),
      node('decoder', '解码器输出', 340, 215, 'decoder'), node('linear', '词表线性投影', 515, 215, 'io'),
      node('softmax', 'Softmax', 515, 125, 'io'),
    ],
    edges: [['embedding', 'self'], ['self', 'residual'], ['residual', 'encoder'], ['encoder', 'cross'],
      ['mask', 'cross'], ['cross', 'decoder'], ['decoder', 'linear'], ['linear', 'softmax']],
  },
  {
    id: 'sdp', title: '缩放点积注意力', subtitle: '读懂每个查询分配的权重', minutes: 6, stage: 'attention',
    steps: [
      step('qkv', 'query', ['figure-2'], ['key', 'value']),
      step('scale', 'scale', ['figure-2'], [], 'Attention(Q,K,V) = softmax(QKᵀ/√dₖ)V'),
      step('heat', 'weights', ['figure-2'], ['value']),
    ],
    nodes: [
      node('query', 'Q · 查询', 30, 30, 'attn'), node('key', 'K · 键', 30, 90, 'attn'),
      node('value', 'V · 值', 30, 150, 'attn'), node('scale', 'QKᵀ / √dₖ', 240, 50, 'attn'),
      node('weights', '权重与加权和', 460, 110, 'attn'),
    ],
    edges: [['query', 'scale'], ['key', 'scale'], ['scale', 'weights'], ['value', 'weights']],
  },
  {
    id: 'mha', title: '多头注意力', subtitle: '并行投影与三种注意力的输入来源', minutes: 5, stage: 'multi-head',
    steps: [
      step('heads', 'heads', ['figure-2'], ['concat']),
      step('types', 'cross', ['figure-1'], ['self', 'mask']),
    ],
    nodes: [
      node('heads', '各头并行投影', 135, 55, 'attn'), node('concat', 'Concat + Wᴼ', 385, 55, 'attn'),
      node('self', '编码器自注意力', 40, 210, 'encoder'), node('mask', '掩码自注意力', 255, 210, 'decoder'),
      node('cross', '跨序列注意力', 470, 210, 'attn'),
    ],
    edges: [['heads', 'concat']],
  },
  {
    id: 'posenc', title: '位置编码', subtitle: '词元的位置如何进入表示', minutes: 4, stage: 'position',
    steps: [
      step('sin', 'position', ['figure-1'], ['embedding'], 'θ = pos / 10000^(2i/d_model)，PE(pos,2i) = sin θ，PE(pos,2i+1) = cos θ'),
    ],
    nodes: [node('embedding', '词元嵌入', 140, 140, 'io'), node('position', '加入位置编码', 400, 140, 'io')],
    edges: [['embedding', 'position']],
  },
  {
    id: 'ffn', title: '前馈、残差与归一化', subtitle: '同一位置内的变换', minutes: 4, stage: 'feed-forward',
    steps: [
      step('ffn', 'ffn', ['figure-1'], [], 'FFN(x) = max(0, xW₁ + b₁)W₂ + b₂'),
      step('res', 'residual', ['figure-1'], [], 'LayerNorm(x + Sublayer(x))'),
    ],
    nodes: [node('ffn', '逐位置 FFN', 140, 140, 'encoder'), node('residual', 'Add & Norm', 400, 140, 'encoder')],
    edges: [['ffn', 'residual']],
  },
  {
    id: 'train', title: '训练与正则化', subtitle: '从组批到优化器更新', minutes: 5, stage: 'training',
    steps: [
      step('batch', 'batch', []), step('size', 'hardware', []), step('opt', 'optimizer', []),
      step('reg', 'dropout', [], ['smoothing']), step('labels', 'smoothing', []),
    ],
    nodes: [
      node('batch', '语料与组批', 45, 90, 'train'), node('hardware', '单机 8 × P100', 255, 90, 'train'),
      node('optimizer', 'Adam 与预热', 465, 90, 'train'), node('dropout', 'Dropout', 150, 205, 'train'),
      node('smoothing', '标签平滑', 360, 205, 'train'),
    ],
    edges: [],
  },
  {
    id: 'results', title: '实验结果', subtitle: '测试集、开发集与句法分析', minutes: 5, stage: 'experiments',
    steps: [
      step('mt', 'bleu', ['table-2'], ['flops']), step('cost', 'flops', ['table-2']),
      step('ablation', 'variants', ['table-3'], ['ppl', 'params']), step('parsing', 'parsing', ['table-4']),
    ],
    nodes: [
      node('bleu', '测试集 BLEU', 40, 80, 'train'), node('flops', '训练 FLOPs', 40, 170, 'train'),
      node('variants', '开发集 BLEU', 255, 80, 'train'), node('ppl', '子词困惑度', 255, 170, 'train'),
      node('params', '参数量', 255, 255, 'train'), node('parsing', 'WSJ 23 F1', 470, 80, 'train'),
    ],
    edges: [],
  },
  {
    id: 'legacy', title: '结论与研究方向', subtitle: '作者提出的下一步', minutes: 3, stage: 'conclusion',
    steps: [step('impact', 'conclusion', []), step('limit', 'complexity', ['table-1'])],
    nodes: [node('conclusion', '后续研究', 135, 145, 'io'), node('complexity', '局部注意力', 390, 145, 'attn')],
    edges: [['conclusion', 'complexity']],
  },
]

export const lessons: Lesson[] = definitions.map((lesson, index) => {
  const steps = lesson.steps.map(s => ({ ...s, stage: lesson.stage }))
  const { originalId, source } = steps[0]
  return {
    ...lesson, steps, index: index + 1, originalId, source,
    learn: steps.map(s => s.title),
    figureIds: [...new Set(steps.flatMap(s => s.figureIds))],
    explainableIds: [...new Set(steps.flatMap(s => s.explainableIds))],
  }
})

// Optional off-paper reading topics. The default lesson sequence consumes only the registry above.
export const furtherReading = {
  title: '延伸阅读', visibleByDefault: false,
  topics: ['BERT 与 GPT 的架构演进', 'FlashAttention', 'MoE 与 MLA', '聊天模型的对齐与工具调用'],
}

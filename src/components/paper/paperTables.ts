import type { Explainable as ExplainableContent, ExplainableId } from '../../data/papers/attention/explainables'
import { originalSource, type PaperSource } from '../../data/papers/attention/originals-en.ts'

type Column = { label: string; explanation: ExplainableId; content?: ExplainableContent }
type Cell = string | null | { text: string; span: number }
type Row = { label: string; cells: Cell[]; baseline?: boolean; content?: ExplainableContent }
export type TableRedraw = 'complexity' | 'translation' | 'variants' | 'parsing'

type Table = {
  firstColumn: string
  columns: Column[]
  rows: Row[]
  best?: (row: Row, index: number) => boolean
  note?: string
}

const column = (label: string, explanation: ExplainableId, content?: ExplainableContent): Column => ({ label, explanation, content })
const row = (label: string, cells: Cell[], baseline?: boolean): Row => ({ label, cells, baseline })
const span = (text: string, columns: number): Cell => ({ text, span: columns })

const table3Source: PaperSource = { section: originalSource('sec6-2').section, page: 9, locator: 'Table 3:' }

function table3Explainable(title: string, plain: string, paperFact: string, teachingExplanation: string, detail: string[] = []): ExplainableContent {
  return {
    title, plain, role: '解释 Table 3 这一列在模型变体中的含义。', detail, paperFact, teachingExplanation,
    originalId: 'sec6-2', source: table3Source,
  }
}

function trainingExplainable(title: string, plain: string, paperFact: string, teachingExplanation: string): ExplainableContent {
  const originalId = title === '学习率安排' ? 'sec5-3' : 'sec5-1'
  const source = originalSource(originalId)
  return {
    title, plain, role: '补充 Table 3 附近的训练设置来源。', detail: [], paperFact, teachingExplanation,
    originalId, source: { ...source, page: 7 },
  }
}

const table3Columns = {
  layers: table3Explainable('层数 N', 'N 表示 Transformer 堆叠的层数。', 'Table 3 的 base 行使用 N=6，C 组改变层数。', '把 N 与同一行的其余配置一起读取，观察层数变化对应的开发集结果。'),
  modelDimension: table3Explainable('模型维度 d_model', 'd_model 是子层和嵌入输出的表示维度。', '§3.1 说明 base 模型的 d_model=512，Table 3 的 C 组比较了不同模型规模。', '先确认行中改变的是 d_model 还是 d_ff，再比较 PPL、BLEU 与参数量。'),
  feedForwardDimension: table3Explainable('前馈维度 d_ff', 'd_ff 是逐位置前馈网络的内部维度。', '§3.3 说明 d_ff=2048，Table 3 的 C 组列出 1024 和 4096 的变体。', '将它与 d_model 分开阅读，因为两列代表不同层内维度。'),
  heads: table3Explainable('注意力头数 h', 'h 表示并行注意力头的数量。', '§3.2.2 说明本文使用 h=8，Table 3 的 A 组改变头数并同时调整 d_k、d_v。', '读取 A 组时，连同 d_k、d_v 一起判断配置，而不是只看 h。', ['单头比最佳设置低 0.9 BLEU，头数过多时质量也会下降。']),
  keyDimension: table3Explainable('键维度 d_k', 'd_k 是每个注意力头的键和查询维度。', '§3.2.2 说明 base 使用 d_k=64，Table 3 的 B 组改变 d_k。', 'B 组用于观察匹配维度变化，表中其余空白设置沿用 base。'),
  valueDimension: table3Explainable('值维度 d_v', 'd_v 是每个注意力头输出的值向量维度。', '§3.2.2 说明 base 使用 d_v=64，Table 3 的 A 组与头数一起列出 d_v。', '把 d_v 与 d_k 分开，因为它们分别描述值输出和键查询。'),
  dropout: table3Explainable('残差 Dropout P_drop', 'P_drop 是训练时施加的 dropout 比例。', '§5.4 说明 base 使用 P_drop=0.1，Table 3 的 D 组改变 dropout。', 'D 组的空白配置沿用 base 的 dropout 与 label smoothing 设置。', ['§6.2 说明 dropout 有助于避免过拟合。']),
  labelSmoothing: table3Explainable('标签平滑 ε_ls', 'ε_ls 控制训练目标保留的不确定性。', '§5.4 说明训练使用 ε_ls=0.1，标签平滑会损害困惑度但提升准确率和 BLEU；Table 3 的 D 组改变它。', '在 D 组中把 ε_ls 与 P_drop 分开读取，它们是两列不同的正则化设置。'),
  trainSteps: table3Explainable('训练步数', 'train steps 记录该变体的训练步数。', 'Table 3 的 base 行为 100K，big 行为 300K；§5.2 说明 big 模型训练 300,000 步。', '不要把训练步数和 PPL、BLEU 的评估集混为一谈。'),
  ppl: table3Explainable('开发集 PPL', 'PPL 是表中按子词计算的开发集困惑度。', 'Table 3 说明 PPL 按 byte-pair encoding 的 wordpiece 计算，不能与按词困惑度直接比较。', '比较 PPL 时保持分词单位一致。'),
  bleu: table3Explainable('开发集 BLEU', 'BLEU 是英译德 newstest2013 开发集分数。', 'Table 3 的所有指标都来自 English-to-German newstest2013 开发集。', '先确认这是开发集 BLEU，再与 Table 2 的 newstest2014 结果区分。'),
  params: table3Explainable('参数量', 'params ×10⁶ 表示百万参数。', 'Table 3 的 base 行为 65，big 行为 213，单位是百万参数。', '把参数量与该行的完整配置一起看，避免将差异归因于单个列。'),
  positionEmbeddings: table3Explainable('学习的位置嵌入', 'row E 用学习的位置嵌入替换正弦位置编码。', 'Table 3 row (E) replaces sinusoidal positional encoding with learned positional embeddings and reports PPL 4.92 and BLEU 25.7.', '把 row E 作为一个整体读取，因为它是表中的合并说明行。'),
}

export const table3Context = {
  learningRate: trainingExplainable('学习率安排', '学习率按训练步数变化，并包含 warmup 阶段。', '§5.3 使用 Adam，并令 warmup_steps=4000。', 'Table 3 的 train steps 是训练长度，§5.3 的 warmup_steps 是学习率安排中的步数。'),
  batchTokens: trainingExplainable('批次 token 数', '每个训练批次按近似序列长度组批。', '§5.1 说明每批约含 25000 个 source tokens 和 25000 个 target tokens。', '这是训练批次规模，和 Table 3 的 train steps 列是不同概念。'),
}

// Transcribed from the tables on PDF pages 6, 8, 9 and 10. Null preserves a printed blank.
export const paperTables: Record<TableRedraw, Table> = {
  complexity: {
    firstColumn: 'Layer Type',
    columns: ['Complexity per Layer', 'Sequential Operations', 'Maximum Path Length'].map(label => column(label, 'complexity')),
    rows: [
      row('Self-Attention', ['O(n² · d)', 'O(1)', 'O(1)']),
      row('Recurrent', ['O(n · d²)', 'O(n)', 'O(n)']),
      row('Convolutional', ['O(k · n · d²)', 'O(1)', 'O(logₖ(n))']),
      row('Self-Attention (restricted)', ['O(r · n · d)', 'O(1)', 'O(n/r)']),
    ],
  },
  translation: {
    firstColumn: 'Model',
    columns: [
      column('BLEU · EN-DE', 'bleu'), column('BLEU · EN-FR', 'bleu'),
      column('FLOPs · EN-DE', 'flops'), column('FLOPs · EN-FR', 'flops'),
    ],
    rows: [
      row('ByteNet [18]', ['23.75', null, null, null]),
      row('Deep-Att + PosUnk [39]', [null, '39.2', null, '1.0 · 10²⁰']),
      row('GNMT + RL [38]', ['24.6', '39.92', '2.3 · 10¹⁹', '1.4 · 10²⁰']),
      row('ConvS2S [9]', ['25.16', '40.46', '9.6 · 10¹⁸', '1.5 · 10²⁰']),
      row('MoE [32]', ['26.03', '40.56', '2.0 · 10¹⁹', '1.2 · 10²⁰']),
      row('Deep-Att + PosUnk Ensemble [39]', [null, '40.4', null, '8.0 · 10²⁰']),
      row('GNMT + RL Ensemble [38]', ['26.30', '41.16', '1.8 · 10²⁰', '1.1 · 10²¹']),
      row('ConvS2S Ensemble [9]', ['26.36', '41.29', '7.7 · 10¹⁹', '1.2 · 10²¹']),
      row('Transformer (base model)', ['27.3', '38.1', span('3.3 · 10¹⁸', 2)], true),
      row('Transformer (big)', ['28.4', '41.8', span('2.3 · 10¹⁹', 2)]),
    ],
    best: ({ label }, index) => label === 'Transformer (big)' && index < 2,
    note: '浅底标记 Transformer 基础模型，加粗标记各语言方向最高 BLEU。原表为每个 Transformer 模型各列出一个训练成本，横跨两列。',
  },
  variants: {
    firstColumn: 'Model',
    columns: [
      column('N', 'variants', table3Columns.layers), column('d_model', 'variants', table3Columns.modelDimension),
      column('d_ff', 'variants', table3Columns.feedForwardDimension), column('h', 'heads', table3Columns.heads),
      column('dₖ', 'variants', table3Columns.keyDimension), column('dᵥ', 'variants', table3Columns.valueDimension),
      column('P_drop', 'dropout', table3Columns.dropout), column('ϵ_ls', 'smoothing', table3Columns.labelSmoothing),
      column('train steps', 'variants', table3Columns.trainSteps), column('PPL (dev)', 'ppl', table3Columns.ppl),
      column('BLEU (dev)', 'variants', table3Columns.bleu), column('params ×10⁶', 'params', table3Columns.params),
    ],
    rows: [
      row('base', ['6', '512', '2048', '8', '64', '64', '0.1', '0.1', '100K', '4.92', '25.8', '65'], true),
      row('(A)', [null, null, null, '1', '512', '512', null, null, null, '5.29', '24.9', null]),
      row('(A)', [null, null, null, '4', '128', '128', null, null, null, '5.00', '25.5', null]),
      row('(A)', [null, null, null, '16', '32', '32', null, null, null, '4.91', '25.8', null]),
      row('(A)', [null, null, null, '32', '16', '16', null, null, null, '5.01', '25.4', null]),
      row('(B)', [null, null, null, null, '16', null, null, null, null, '5.16', '25.1', '58']),
      row('(B)', [null, null, null, null, '32', null, null, null, null, '5.01', '25.4', '60']),
      row('(C)', ['2', null, null, null, null, null, null, null, null, '6.11', '23.7', '36']),
      row('(C)', ['4', null, null, null, null, null, null, null, null, '5.19', '25.3', '50']),
      row('(C)', ['8', null, null, null, null, null, null, null, null, '4.88', '25.5', '80']),
      row('(C)', [null, '256', null, null, '32', '32', null, null, null, '5.75', '24.5', '28']),
      row('(C)', [null, '1024', null, null, '128', '128', null, null, null, '4.66', '26.0', '168']),
      row('(C)', [null, null, '1024', null, null, null, null, null, null, '5.12', '25.4', '53']),
      row('(C)', [null, null, '4096', null, null, null, null, null, null, '4.75', '26.2', '90']),
      row('(D)', [null, null, null, null, null, null, '0.0', null, null, '5.77', '24.6', null]),
      row('(D)', [null, null, null, null, null, null, '0.2', null, null, '4.95', '25.5', null]),
      row('(D)', [null, null, null, null, null, null, null, '0.0', null, '4.67', '25.3', null]),
      row('(D)', [null, null, null, null, null, null, null, '0.2', null, '5.47', '25.7', null]),
      { ...row('(E)', [span('positional embedding instead of sinusoids', 9), '4.92', '25.7', null]), content: table3Columns.positionEmbeddings },
      row('big', ['6', '1024', '4096', '16', null, null, '0.3', null, '300K', '4.33', '26.4', '213']),
    ],
    best: ({ label }, index) => label === 'big' && (index === 9 || index === 10),
    note: '浅底标记 base，加粗标记最低 PPL 与最高 BLEU。未列出的设置沿用 base；PPL 按子词计算。',
  },
  parsing: {
    firstColumn: 'Parser',
    columns: [column('Training', 'parsing'), column('WSJ 23 F1', 'parsing')],
    rows: [
      row('Vinyals & Kaiser el al. (2014) [37]', ['WSJ only, discriminative', '88.3']),
      row('Petrov et al. (2006) [29]', ['WSJ only, discriminative', '90.4']),
      row('Zhu et al. (2013) [40]', ['WSJ only, discriminative', '90.4']),
      row('Dyer et al. (2016) [8]', ['WSJ only, discriminative', '91.7']),
      row('Transformer (4 layers)', ['WSJ only, discriminative', '91.3']),
      row('Zhu et al. (2013) [40]', ['semi-supervised', '91.3']),
      row('Huang & Harper (2009) [14]', ['semi-supervised', '91.3']),
      row('McClosky et al. (2006) [26]', ['semi-supervised', '92.1']),
      row('Vinyals & Kaiser el al. (2014) [37]', ['semi-supervised', '92.1']),
      row('Transformer (4 layers)', ['semi-supervised', '92.7']),
      row('Luong et al. (2015) [23]', ['multi-task', '93.0']),
      row('Dyer et al. (2016) [8]', ['generative', '93.3']),
    ],
    best: ({ cells }, index) => index === 1 && (cells[1] === '91.7' || cells[1] === '92.7'),
    note: '加粗标记仅用 WSJ 与半监督两组各自的最高 F1。多任务和生成式结果使用各自的训练条件。',
  },
}

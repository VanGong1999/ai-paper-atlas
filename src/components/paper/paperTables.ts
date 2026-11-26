import type { ExplainableId } from '../../data/papers/attention/explainables'

type Column = { label: string; explanation: ExplainableId }
type Cell = string | null | { text: string; span: number }
type Row = { label: string; cells: Cell[]; baseline?: boolean }
export type TableRedraw = 'complexity' | 'translation' | 'variants' | 'parsing'

type Table = {
  firstColumn: string
  columns: Column[]
  rows: Row[]
  best?: (row: Row, index: number) => boolean
  note?: string
}

const column = (label: string, explanation: ExplainableId): Column => ({ label, explanation })
const row = (label: string, cells: Cell[], baseline?: boolean): Row => ({ label, cells, baseline })
const span = (text: string, columns: number): Cell => ({ text, span: columns })

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
      ...['N', 'd_model', 'd_ff', 'h', 'dₖ', 'dᵥ', 'P_drop', 'ϵ_ls', 'train steps'].map(label => column(label, 'variants')),
      column('PPL (dev)', 'ppl'), column('BLEU (dev)', 'variants'), column('params ×10⁶', 'params'),
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
      row('(E)', [span('positional embedding instead of sinusoids', 9), '4.92', '25.7', null]),
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

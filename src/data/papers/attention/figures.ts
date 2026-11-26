import { originalSource, pdfAsset, type PaperSource } from './originals-en.ts'

export type PaperFigure = {
  id: string
  kind: 'Figure' | 'Table'
  number: number
  title: string
  caption: string
  originalId: string
  source: PaperSource
  /** Page of the supplied original, usable without a separate raster asset. */
  originalAsset: string
  redrawType: 'architecture' | 'attention' | 'complexity' | 'translation' | 'variants' | 'parsing' | 'attention-pattern'
}

function entry(kind: PaperFigure['kind'], number: number, page: number, originalId: string,
  redrawType: PaperFigure['redrawType'], title: string, caption: string): PaperFigure {
  return {
    id: `${kind.toLowerCase()}-${number}`, kind, number, originalId, redrawType, title, caption,
    source: { section: originalSource(originalId).section, page, locator: `${kind} ${number}:` },
    originalAsset: `${pdfAsset}#page=${page}`,
  }
}

// Captions transcribed from Vaswani et al., Attention Is All You Need, supplied PDF.
export const figures: PaperFigure[] = [
  entry('Figure', 1, 3, 'sec3', 'architecture', 'Transformer 架构',
    'The Transformer - model architecture.'),
  entry('Figure', 2, 4, 'sec3-2', 'attention', '缩放点积与多头注意力',
    '(left) Scaled Dot-Product Attention. (right) Multi-Head Attention consists of several attention layers running in parallel.'),
  entry('Table', 1, 6, 'sec4', 'complexity', '层复杂度、顺序操作数与最大路径长度',
    'Maximum path lengths, per-layer complexity and minimum number of sequential operations for different layer types. n is the sequence length, d is the representation dimension, k is the kernel size of convolutions and r the size of the neighborhood in restricted self-attention.'),
  entry('Table', 2, 8, 'sec6-1', 'translation', '翻译质量与训练成本',
    'The Transformer achieves better BLEU scores than previous state-of-the-art models on the English-to-German and English-to-French newstest2014 tests at a fraction of the training cost.'),
  entry('Table', 3, 9, 'sec6-2', 'variants', 'Transformer 架构变体',
    'Variations on the Transformer architecture. Unlisted values are identical to those of the base model. All metrics are on the English-to-German translation development set, newstest2013. Listed perplexities are per-wordpiece, according to our byte-pair encoding, and should not be compared to per-word perplexities.'),
  entry('Table', 4, 10, 'sec6-3', 'parsing', '英语成分句法分析',
    'The Transformer generalizes well to English constituency parsing (Results are on Section 23 of WSJ)'),
  entry('Figure', 3, 13, 'appendix', 'attention-pattern', '动词的远距离依赖',
    'An example of the attention mechanism following long-distance dependencies in the encoder self-attention in layer 5 of 6. Many of the attention heads attend to a distant dependency of the verb ‘making’, completing the phrase ‘making...more difficult’. Attentions here shown only for the word ‘making’. Different colors represent different heads. Best viewed in color.'),
  entry('Figure', 4, 14, 'appendix', 'attention-pattern', '与指代消解有关的两个头',
    'Two attention heads, also in layer 5 of 6, apparently involved in anaphora resolution. Top: Full attentions for head 5. Bottom: Isolated attentions from just the word ‘its’ for attention heads 5 and 6. Note that the attentions are very sharp for this word.'),
  entry('Figure', 5, 15, 'appendix', 'attention-pattern', '与句子结构有关的注意力头',
    'Many of the attention heads exhibit behaviour that seems related to the structure of the sentence. We give two such examples above, from two different heads from the encoder self-attention at layer 5 of 6. The heads clearly learned to perform different tasks.'),
]

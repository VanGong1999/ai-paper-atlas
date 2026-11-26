export type PaperSource = {
  section: string
  page: number
  endPage?: number
  /** Searchable English text on the first cited PDF page. */
  locator: string
}

export type OriginalPassage = {
  id: string
  section: string
  source: PaperSource
  pdfNote: string
  en: string
}

export const pdfAsset = `${import.meta.env?.BASE_URL ?? '/'}article/1706.03762v7.pdf`

function passage(id: string, section: string, page: number, endPage: number, excerpt?: string): OriginalPassage {
  const pdfNote = page === endPage ? `PDF p. ${page}` : `PDF pp. ${page}–${endPage}`
  return {
    id, section, pdfNote,
    source: { section, page, endPage, locator: section },
    en: excerpt ?? `${section} · ${pdfNote}`,
  }
}

// In print order. Entries without an excerpt point to the English original in the PDF.
const passages = [
  passage('abstract', 'Abstract', 1, 1,
    "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data."),
  passage('sec1', '1 Introduction', 2, 2,
    "In this work we propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight P100 GPUs."),
  passage('sec2', '2 Background', 2, 2,
    "The goal of reducing sequential computation also forms the foundation of the Extended Neural GPU [16], ByteNet [18] and ConvS2S [9], all of which use convolutional neural networks as basic building block, computing hidden representations in parallel for all input and output positions. In these models, the number of operations required to relate signals from two arbitrary input or output positions grows in the distance between positions, linearly for ConvS2S and logarithmically for ByteNet. This makes it more difficult to learn dependencies between distant positions [12]. In the Transformer this is reduced to a constant number of operations, albeit at the cost of reduced effective resolution due to averaging attention-weighted positions, an effect we counteract with Multi-Head Attention as described in section 3.2."),
  passage('sec3', '3 Model Architecture', 2, 3,
    "The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder, shown in the left and right halves of Figure 1, respectively."),
  passage('sec3-1', '3.1 Encoder and Decoder Stacks', 3, 3,
    "The decoder is also composed of a stack of N = 6 identical layers."),
  passage('sec3-2', '3.2 Attention', 3, 4,
    "An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors."),
  passage('sec3-2-1', '3.2.1 Scaled Dot-Product Attention', 4, 4,
    "In practice, we compute the attention function on a set of queries simultaneously, packed together into a matrix Q."),
  passage('sec3-2-2', '3.2.2 Multi-Head Attention', 4, 5,
    "Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. With a single attention head, averaging inhibits this."),
  passage('sec3-2-3', '3.2.3 Applications of Attention in our Model', 5, 5,
    "In \"encoder-decoder attention\" layers, the queries come from the previous decoder layer, and the memory keys and values come from the output of the encoder. This allows every position in the decoder to attend over all positions in the input sequence. This mimics the typical encoder-decoder attention mechanisms in sequence-to-sequence models such as [38, 2, 9]."),
  passage('sec3-3', '3.3 Position-wise Feed-Forward Networks', 5, 5,
    "In addition to attention sub-layers, each of the layers in our encoder and decoder contains a fully connected feed-forward network, which is applied to each position separately and identically. This consists of two linear transformations with a ReLU activation in between."),
  passage('sec3-4', '3.4 Embeddings and Softmax', 5, 5),
  passage('sec3-5', '3.5 Positional Encoding', 6, 6,
    "We also experimented with using learned positional embeddings [9] instead, and found that the two versions produced nearly identical results (see Table 3 row (E)). We chose the sinusoidal version because it may allow the model to extrapolate to sequence lengths longer than the ones encountered during training."),
  passage('sec4', '4 Why Self-Attention', 6, 7,
    "One is the total computational complexity per layer. Another is the amount of computation that can be parallelized, as measured by the minimum number of sequential operations required."),
  passage('sec5', '5 Training', 7, 7,
    "This section describes the training regime for our models."),
  passage('sec5-1', '5.1 Training Data and Batching', 7, 7,
    "We trained on the standard WMT 2014 English-German dataset consisting of about 4.5 million sentence pairs. Sentences were encoded using byte-pair encoding [3], which has a shared source-target vocabulary of about 37000 tokens. For English-French, we used the significantly larger WMT 2014 English-French dataset consisting of 36M sentences and split tokens into a 32000 word-piece vocabulary [38]. Sentence pairs were batched together by approximate sequence length. Each training batch contained a set of sentence pairs containing approximately 25000 source tokens and 25000 target tokens."),
  passage('sec5-2', '5.2 Hardware and Schedule', 7, 7,
    "We trained our models on one machine with 8 NVIDIA P100 GPUs."),
  passage('sec5-3', '5.3 Optimizer', 7, 7,
    "We used warmup_steps = 4000."),
  passage('sec5-4', '5.4 Regularization', 7, 8,
    "We employ three types of regularization during training:"),
  passage('sec6', '6 Results', 8, 8,
    "6 Results"),
  passage('sec6-1', '6.1 Machine Translation', 8, 8,
    "On the WMT 2014 English-to-French translation task, our big model achieves a BLEU score of 41.0, outperforming all of the previously published single models, at less than 1/4 the training cost of the previous state-of-the-art model."),
  passage('sec6-2', '6.2 Model Variations', 8, 9,
    "While single-head attention is 0.9 BLEU worse than the best setting, quality also drops off with too many heads."),
  passage('sec6-3', '6.3 English Constituency Parsing', 9, 10,
    "To evaluate if the Transformer can generalize to other tasks we performed experiments on English constituency parsing. This task presents specific challenges: the output is subject to strong structural constraints and is significantly longer than the input. Furthermore, RNN sequence-to-sequence models have not been able to attain state-of-the-art results in small-data regimes [37]."),
  passage('sec7', '7 Conclusion', 10, 10,
    "In this work, we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention."),
  passage('ack', 'Acknowledgements', 10, 10,
    "We are grateful to Nal Kalchbrenner and Stephan Gouws for their fruitful comments, corrections and inspiration."),
  passage('references', 'References', 10, 12),
  passage('appendix', 'Attention Visualizations', 13, 15,
    "Figure 3: An example of the attention mechanism following long-distance dependencies in the encoder self-attention in layer 5 of 6. Many of the attention heads attend to a distant dependency of the verb ‘making’, completing the phrase ‘making...more difficult’. Attentions here shown only for the word ‘making’. Different colors represent different heads. Best viewed in color."),
]
export const originals: Record<string, OriginalPassage> = Object.fromEntries(
  passages.map(p => [p.id, p]),
)

export function originalSource(originalId: string): PaperSource {
  const passage = originals[originalId]
  if (!passage?.source) throw new Error(`Missing PDF source for originalId "${originalId}"`)
  return passage.source
}

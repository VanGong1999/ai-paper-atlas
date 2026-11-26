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

function passage(id: string, section: string, page: number, endPage: number, excerpt?: string, locator = section): OriginalPassage {
  const pdfNote = page === endPage ? `PDF p. ${page}` : `PDF pp. ${page}–${endPage}`
  return {
    id, section, pdfNote,
    source: { section, page, endPage, locator },
    en: excerpt ?? `${section} · ${pdfNote}`,
  }
}

// Numbering, names and publication details follow the supplied PDF, pp. 10–12.
export const bibliography = [
  {
    citation: "[1] Jimmy Lei Ba, Jamie Ryan Kiros, and Geoffrey E Hinton. Layer normalization. arXiv preprint arXiv:1607.06450, 2016.",
    titleZh: '层归一化',
  },
  {
    citation: "[2] Dzmitry Bahdanau, Kyunghyun Cho, and Yoshua Bengio. Neural machine translation by jointly learning to align and translate. CoRR, abs/1409.0473, 2014.",
    titleZh: '通过联合学习对齐与翻译实现神经机器翻译',
  },
  {
    citation: "[3] Denny Britz, Anna Goldie, Minh-Thang Luong, and Quoc V. Le. Massive exploration of neural machine translation architectures. CoRR, abs/1703.03906, 2017.",
    titleZh: '大规模探索神经机器翻译架构',
  },
  {
    citation: "[4] Jianpeng Cheng, Li Dong, and Mirella Lapata. Long short-term memory-networks for machine reading. arXiv preprint arXiv:1601.06733, 2016.",
    titleZh: '用于机器阅读的长短期记忆网络',
  },
  {
    citation: "[5] Kyunghyun Cho, Bart van Merrienboer, Caglar Gulcehre, Fethi Bougares, Holger Schwenk, and Yoshua Bengio. Learning phrase representations using rnn encoder-decoder for statistical machine translation. CoRR, abs/1406.1078, 2014.",
    titleZh: '使用循环神经网络编码器和解码器学习统计机器翻译的短语表示',
  },
  {
    citation: "[6] Francois Chollet. Xception: Deep learning with depthwise separable convolutions. arXiv preprint arXiv:1610.02357, 2016.",
    titleZh: 'Xception：采用深度可分离卷积的深度学习',
  },
  {
    citation: "[7] Junyoung Chung, Çaglar Gülçehre, Kyunghyun Cho, and Yoshua Bengio. Empirical evaluation of gated recurrent neural networks on sequence modeling. CoRR, abs/1412.3555, 2014.",
    titleZh: '门控循环神经网络在序列建模中的实证评估',
  },
  {
    citation: "[8] Chris Dyer, Adhiguna Kuncoro, Miguel Ballesteros, and Noah A. Smith. Recurrent neural network grammars. In Proc. of NAACL, 2016.",
    titleZh: '循环神经网络文法',
  },
  {
    citation: "[9] Jonas Gehring, Michael Auli, David Grangier, Denis Yarats, and Yann N. Dauphin. Convolutional sequence to sequence learning. arXiv preprint arXiv:1705.03122v2, 2017.",
    titleZh: '基于卷积的序列到序列学习',
  },
  {
    citation: "[10] Alex Graves. Generating sequences with recurrent neural networks. arXiv preprint arXiv:1308.0850, 2013.",
    titleZh: '用循环神经网络生成序列',
  },
  {
    citation: "[11] Kaiming He, Xiangyu Zhang, Shaoqing Ren, and Jian Sun. Deep residual learning for image recognition. In Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition, pages 770–778, 2016.",
    titleZh: '用于图像识别的深度残差学习',
  },
  {
    citation: "[12] Sepp Hochreiter, Yoshua Bengio, Paolo Frasconi, and Jürgen Schmidhuber. Gradient flow in recurrent nets: the difficulty of learning long-term dependencies, 2001.",
    titleZh: '循环网络中的梯度流：学习长期依赖的困难',
  },
  {
    citation: "[13] Sepp Hochreiter and Jürgen Schmidhuber. Long short-term memory. Neural computation, 9(8):1735–1780, 1997.",
    titleZh: '长短期记忆',
  },
  {
    citation: "[14] Zhongqiang Huang and Mary Harper. Self-training PCFG grammars with latent annotations across languages. In Proceedings of the 2009 Conference on Empirical Methods in Natural Language Processing, pages 832–841. ACL, August 2009.",
    titleZh: '跨语言自训练带隐标注的概率上下文无关文法',
  },
  {
    citation: "[15] Rafal Jozefowicz, Oriol Vinyals, Mike Schuster, Noam Shazeer, and Yonghui Wu. Exploring the limits of language modeling. arXiv preprint arXiv:1602.02410, 2016.",
    titleZh: '探索语言建模的极限',
  },
  {
    citation: "[16] Łukasz Kaiser and Samy Bengio. Can active memory replace attention? In Advances in Neural Information Processing Systems, (NIPS), 2016.",
    titleZh: '主动记忆能取代注意力吗？',
  },
  {
    citation: "[17] Łukasz Kaiser and Ilya Sutskever. Neural GPUs learn algorithms. In International Conference on Learning Representations (ICLR), 2016.",
    titleZh: '神经 GPU 学习算法',
  },
  {
    citation: "[18] Nal Kalchbrenner, Lasse Espeholt, Karen Simonyan, Aaron van den Oord, Alex Graves, and Koray Kavukcuoglu. Neural machine translation in linear time. arXiv preprint arXiv:1610.10099v2, 2017.",
    titleZh: '线性时间神经机器翻译',
  },
  {
    citation: "[19] Yoon Kim, Carl Denton, Luong Hoang, and Alexander M. Rush. Structured attention networks. In International Conference on Learning Representations, 2017.",
    titleZh: '结构化注意力网络',
  },
  {
    citation: "[20] Diederik Kingma and Jimmy Ba. Adam: A method for stochastic optimization. In ICLR, 2015.",
    titleZh: 'Adam：一种随机优化方法',
  },
  {
    citation: "[21] Oleksii Kuchaiev and Boris Ginsburg. Factorization tricks for LSTM networks. arXiv preprint arXiv:1703.10722, 2017.",
    titleZh: 'LSTM 网络的分解技巧',
  },
  {
    citation: "[22] Zhouhan Lin, Minwei Feng, Cicero Nogueira dos Santos, Mo Yu, Bing Xiang, Bowen Zhou, and Yoshua Bengio. A structured self-attentive sentence embedding. arXiv preprint arXiv:1703.03130, 2017.",
    titleZh: '结构化的自注意力句子嵌入',
  },
  {
    citation: "[23] Minh-Thang Luong, Quoc V. Le, Ilya Sutskever, Oriol Vinyals, and Lukasz Kaiser. Multi-task sequence to sequence learning. arXiv preprint arXiv:1511.06114, 2015.",
    titleZh: '多任务序列到序列学习',
  },
  {
    citation: "[24] Minh-Thang Luong, Hieu Pham, and Christopher D Manning. Effective approaches to attention-based neural machine translation. arXiv preprint arXiv:1508.04025, 2015.",
    titleZh: '基于注意力的神经机器翻译的有效方法',
  },
  {
    citation: "[25] Mitchell P Marcus, Mary Ann Marcinkiewicz, and Beatrice Santorini. Building a large annotated corpus of english: The penn treebank. Computational linguistics, 19(2):313–330, 1993.",
    titleZh: '构建大型标注英语语料库：宾夕法尼亚树库',
  },
  {
    citation: "[26] David McClosky, Eugene Charniak, and Mark Johnson. Effective self-training for parsing. In Proceedings of the Human Language Technology Conference of the NAACL, Main Conference, pages 152–159. ACL, June 2006.",
    titleZh: '用于句法分析的有效自训练',
  },
  {
    citation: "[27] Ankur Parikh, Oscar Täckström, Dipanjan Das, and Jakob Uszkoreit. A decomposable attention model. In Empirical Methods in Natural Language Processing, 2016.",
    titleZh: '一种可分解的注意力模型',
  },
  {
    citation: "[28] Romain Paulus, Caiming Xiong, and Richard Socher. A deep reinforced model for abstractive summarization. arXiv preprint arXiv:1705.04304, 2017.",
    titleZh: '用于生成式摘要的深度强化学习模型',
  },
  {
    citation: "[29] Slav Petrov, Leon Barrett, Romain Thibaux, and Dan Klein. Learning accurate, compact, and interpretable tree annotation. In Proceedings of the 21st International Conference on Computational Linguistics and 44th Annual Meeting of the ACL, pages 433–440. ACL, July 2006.",
    titleZh: '学习准确、紧凑且可解释的树标注',
  },
  {
    citation: "[30] Ofir Press and Lior Wolf. Using the output embedding to improve language models. arXiv preprint arXiv:1608.05859, 2016.",
    titleZh: '使用输出嵌入改进语言模型',
  },
  {
    citation: "[31] Rico Sennrich, Barry Haddow, and Alexandra Birch. Neural machine translation of rare words with subword units. arXiv preprint arXiv:1508.07909, 2015.",
    titleZh: '利用子词单元开展罕见词的神经机器翻译',
  },
  {
    citation: "[32] Noam Shazeer, Azalia Mirhoseini, Krzysztof Maziarz, Andy Davis, Quoc Le, Geoffrey Hinton, and Jeff Dean. Outrageously large neural networks: The sparsely-gated mixture-of-experts layer. arXiv preprint arXiv:1701.06538, 2017.",
    titleZh: '超大规模神经网络：稀疏门控专家混合层',
  },
  {
    citation: "[33] Nitish Srivastava, Geoffrey E Hinton, Alex Krizhevsky, Ilya Sutskever, and Ruslan Salakhutdinov. Dropout: a simple way to prevent neural networks from overfitting. Journal of Machine Learning Research, 15(1):1929–1958, 2014.",
    titleZh: 'Dropout：防止神经网络过拟合的简单方法',
  },
  {
    citation: "[34] Sainbayar Sukhbaatar, Arthur Szlam, Jason Weston, and Rob Fergus. End-to-end memory networks. In C. Cortes, N. D. Lawrence, D. D. Lee, M. Sugiyama, and R. Garnett, editors, Advances in Neural Information Processing Systems 28, pages 2440–2448. Curran Associates, Inc., 2015.",
    titleZh: '端到端记忆网络',
  },
  {
    citation: "[35] Ilya Sutskever, Oriol Vinyals, and Quoc VV Le. Sequence to sequence learning with neural networks. In Advances in Neural Information Processing Systems, pages 3104–3112, 2014.",
    titleZh: '用神经网络进行序列到序列学习',
  },
  {
    citation: "[36] Christian Szegedy, Vincent Vanhoucke, Sergey Ioffe, Jonathon Shlens, and Zbigniew Wojna. Rethinking the inception architecture for computer vision. CoRR, abs/1512.00567, 2015.",
    titleZh: '重新审视用于计算机视觉的 Inception 架构',
  },
  {
    citation: "[37] Vinyals & Kaiser, Koo, Petrov, Sutskever, and Hinton. Grammar as a foreign language. In Advances in Neural Information Processing Systems, 2015.",
    titleZh: '将文法视为一门外语',
  },
  {
    citation: "[38] Yonghui Wu, Mike Schuster, Zhifeng Chen, Quoc V Le, Mohammad Norouzi, Wolfgang Macherey, Maxim Krikun, Yuan Cao, Qin Gao, Klaus Macherey, et al. Google’s neural machine translation system: Bridging the gap between human and machine translation. arXiv preprint arXiv:1609.08144, 2016.",
    titleZh: '谷歌神经机器翻译系统：缩小人类翻译与机器翻译之间的差距',
  },
  {
    citation: "[39] Jie Zhou, Ying Cao, Xuguang Wang, Peng Li, and Wei Xu. Deep recurrent models with fast-forward connections for neural machine translation. CoRR, abs/1606.04199, 2016.",
    titleZh: '用于神经机器翻译的带前向捷径连接的深层循环模型',
  },
  {
    citation: "[40] Muhua Zhu, Yue Zhang, Wenliang Chen, Min Zhang, and Jingbo Zhu. Fast and accurate shift-reduce constituent parsing. In Proceedings of the 51st Annual Meeting of the ACL (Volume 1: Long Papers), pages 434–443. ACL, August 2013.",
    titleZh: '快速且准确的移进归约成分句法分析',
  },
]

// In print order. Entries without an excerpt point to the English original in the PDF.
const passages = [
  passage('abstract', 'Abstract', 1, 1,
    "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data."),
  passage('author-notes', 'Author contributions', 1, 1,
    "∗Equal contribution. Listing order is random. Jakob proposed replacing RNNs with self-attention and started the effort to evaluate this idea. Ashish, with Illia, designed and implemented the first Transformer models and has been crucially involved in every aspect of this work. Noam proposed scaled dot-product attention, multi-head attention and the parameter-free position representation and became the other person involved in nearly every detail. Niki designed, implemented, tuned and evaluated countless model variants in our original codebase and tensor2tensor. Llion also experimented with novel model variants, was responsible for our initial codebase, and efficient inference and visualizations. Lukasz and Aidan spent countless long days designing various parts of and implementing tensor2tensor, replacing our earlier codebase, greatly improving results and massively accelerating our research. †Work performed while at Google Brain. ‡Work performed while at Google Research.",
    '∗Equal contribution.'),
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
  passage('references', 'References', 10, 12, bibliography.map(ref => ref.citation).join('\n')),
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

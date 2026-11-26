export type OriginalPassage = {
  id: string
  section: string
  en: string
  pdfNote?: string
}

/** Key English excerpts aligned to Chinese fulltext blocks (not the entire PDF verbatim dump). */
export const originals: Record<string, OriginalPassage> = {
  abstract: {
    id: 'abstract',
    section: 'Abstract',
    pdfNote: 'p.1 Abstract',
    en: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. … Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
  },
  sec1: {
    id: 'sec1',
    section: '1 Introduction',
    pdfNote: '§1',
    en: 'Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation. … Attention mechanisms have become an integral part of compelling sequence modeling and transduction models in various tasks, allowing modeling of dependencies without regard to their distance in the input or output sequences. … Self-attention, sometimes called intra-attention is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence.',
  },
  sec2: {
    id: 'sec2',
    section: '2 Background',
    pdfNote: '§2',
    en: 'The goal of reducing sequential computation also forms the foundation of the Extended Neural GPU, ByteNet and ConvS2S, all of which use convolutional neural networks as basic building block, computing hidden representations in parallel for all input and output positions. In these models, the number of operations required to relate signals from two arbitrary input or output positions grows in the distance between positions. In the Transformer this is reduced to a constant number of operations, albeit at the cost of reduced effective resolution due to averaging attention-weighted positions, an effect we counteract with Multi-Head Attention.',
  },
  'sec3-1': {
    id: 'sec3-1',
    section: '3.1 Encoder and Decoder Stacks',
    pdfNote: '§3.1',
    en: 'Encoder: The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network. We employ a residual connection around each of the two sub-layers, followed by layer normalization. … Decoder: The decoder is also composed of a stack of N = 6 identical layers. In addition to the two sub-layers in each encoder layer, the decoder inserts a third sub-layer, which performs multi-head attention over the output of the encoder stack. … We also modify the self-attention sub-layer in the decoder stack to prevent positions from attending to subsequent positions.',
  },
  'sec3-2-1': {
    id: 'sec3-2-1',
    section: '3.2.1 Scaled Dot-Product Attention',
    pdfNote: '§3.2.1',
    en: 'We call our particular attention "Scaled Dot-Product Attention". The input consists of queries and keys of dimension d_k, and values of dimension d_v. We compute the dot products of the query with all keys, divide each by √d_k, and apply a softmax function to obtain the weights on the values. … While for small values of d_k the two mechanisms perform similarly, additive attention outperforms dot product attention without scaling for larger values of d_k. We suspect that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients. To counteract this effect, we scale the dot products by 1/√d_k.',
  },
  'sec3-2-2': {
    id: 'sec3-2-2',
    section: '3.2.2 Multi-Head Attention',
    pdfNote: '§3.2.2',
    en: 'Instead of performing a single attention function with d_model-dimensional keys, values and queries, we found it beneficial to linearly project the queries, keys and values h times with different, learned linear projections to d_k, d_k and d_v dimensions, respectively. … Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. With a single attention head, averaging inhibits this.',
  },
  'sec3-2-3': {
    id: 'sec3-2-3',
    section: '3.2.3 Applications of Attention',
    pdfNote: '§3.2.3',
    en: 'The Transformer uses multi-head attention in three different ways: (1) In "encoder-decoder attention" layers … (2) The encoder contains self-attention layers … (3) Similarly, self-attention layers in the decoder allow each position in the decoder to attend to all positions in the decoder up to and including that position. We need to prevent leftward information flow in the decoder to preserve the auto-regressive property.',
  },
  'sec3-3': {
    id: 'sec3-3',
    section: '3.3 Position-wise FFN',
    pdfNote: '§3.3',
    en: 'In addition to attention sub-layers, each of the layers in our encoder and decoder contains a fully connected feed-forward network, which is applied to each position separately and identically. This consists of two linear transformations with a ReLU activation in between. … While the linear transformations are the same across different positions, they use different parameters from layer to layer.',
  },
  'sec3-4': {
    id: 'sec3-4',
    section: '3.4 Embeddings and Softmax',
    pdfNote: '§3.4',
    en: 'Similarly to other sequence transduction models, we use learned embeddings to convert the input tokens and output tokens to vectors of dimension d_model. We also use the usual learned linear transformation and softmax function to convert the decoder output to predicted next-token probabilities. In our model, we share the same weight matrix between the two embedding layers and the pre-softmax linear transformation.',
  },
  'sec3-5': {
    id: 'sec3-5',
    section: '3.5 Positional Encoding',
    pdfNote: '§3.5',
    en: 'Since our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we must inject some information about the relative or absolute position of the tokens in the sequence. To this end, we add "positional encodings" to the input embeddings at the bottoms of the encoder and decoder stacks. … In this work, we use sine and cosine functions of different frequencies. … We also experimented with using learned positional embeddings instead, and found that the two versions produced nearly identical results.',
  },
  sec4: {
    id: 'sec4',
    section: '4 Why Self-Attention',
    pdfNote: '§4',
    en: 'In this section we compare various aspects of self-attention layers to the recurrent and convolutional layers commonly used for mapping one variable-length sequence of symbol representations (x_1,…,x_n) to another sequence of equal length (z_1,…,z_n). … One is the total computational complexity per layer. Another is the amount of computation that can be parallelized. … The third is the path length between long-range dependencies in the network. … As side benefit, self-attention could yield more interpretable models.',
  },
  'sec5-1': {
    id: 'sec5-1',
    section: '5.1 Training Data and Batching',
    pdfNote: '§5.1',
    en: 'We trained on the standard WMT 2014 English-German dataset consisting of about 4.5 million sentence pairs. Sentences were encoded using byte-pair encoding. … For English-French, we used the significantly larger WMT 2014 English-French dataset consisting of 36M sentences.',
  },
  'sec5-2': {
    id: 'sec5-2',
    section: '5.2 Hardware and Schedule',
    pdfNote: '§5.2',
    en: 'We trained our models on one machine with 8 NVIDIA P100 GPUs. For our base models, each training step took about 0.4 seconds. We trained the base models for a total of 100,000 steps or 12 hours. For our big models, step time was 1.0 seconds. The big models were trained for 300,000 steps (3.5 days).',
  },
  'sec5-3': {
    id: 'sec5-3',
    section: '5.3 Optimizer',
    pdfNote: '§5.3',
    en: 'We used the Adam optimizer with β1 = 0.9, β2 = 0.98 and ε = 10^{-9}. We varied the learning rate over the course of training, according to the formula: lrate = d_model^{-0.5} · min(step_num^{-0.5}, step_num · warmup_steps^{-1.5}). This corresponds to increasing the learning rate linearly for the first warmup_steps training steps, and decreasing it thereafter proportionally to the inverse square root of the step number. We used warmup_steps = 4000.',
  },
  'sec5-4': {
    id: 'sec5-4',
    section: '5.4 Regularization',
    pdfNote: '§5.4',
    en: 'We employ three types of regularization during training: Residual Dropout … we apply dropout to the output of each sub-layer, before it is added to the sub-layer input and normalized. … We also apply dropout to the sums of the embeddings and the positional encodings. … Label Smoothing: during training, we employed label smoothing of value ε_ls = 0.1. This hurts perplexity, as the model learns to be more unsure, but improves accuracy and BLEU score.',
  },
  'sec6-1': {
    id: 'sec6-1',
    section: '6.1 Machine Translation',
    pdfNote: '§6.1',
    en: 'On the WMT 2014 English-to-German translation task, the big transformer model (Transformer (big)) outperforms the best previously reported models (including ensembles) by more than 2.0 BLEU, establishing a new state-of-the-art BLEU score of 28.4. The configuration of this model is listed in the bottom line of Table 3. Training took 3.5 days on 8 P100 GPUs. Even our base model surpasses all previously published models and ensembles, at a fraction of the training cost of any of the competitive models. On the WMT 2014 English-to-French translation task, our big model achieves a BLEU score of 41.0 / 41.8.',
  },
  'sec6-2': {
    id: 'sec6-2',
    section: '6.2 Model Variations',
    pdfNote: '§6.2',
    en: 'To evaluate the importance of different components of the Transformer, we varied our base model in different ways, measuring the change in performance on English-to-German development set. … In Table 3 rows (A), we vary the number of attention heads and the attention key and value dimensions. … In Table 3 rows (C), we vary the number of layers and model size.',
  },
  'sec6-3': {
    id: 'sec6-3',
    section: '6.3 English Constituency Parsing',
    pdfNote: '§6.3',
    en: 'To evaluate if the Transformer can generalize to other tasks we performed experiments on English constituency parsing. This task presents specific challenges: the output is subject to strong structural constraints and is significantly longer than the input. … Our results show that despite the lack of task-specific tuning our model performs surprisingly well.',
  },
  sec7: {
    id: 'sec7',
    section: '7 Conclusion',
    pdfNote: '§7',
    en: 'In this work, we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention. For translation tasks, the Transformer can be trained significantly faster than architectures based on recurrent or convolutional layers. … We are excited about the future of attention-based models and plan to apply them to other tasks.',
  },
}

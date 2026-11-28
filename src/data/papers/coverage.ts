export type PaperSlug = 'attention' | 'pagedattention'
export type CoverageKind = 'concept' | 'formula' | 'flow' | 'implementation' | 'experiment' | 'limitation' | 'figure' | 'bridge'
export type CoverageStatus = 'covered' | 'expanded'

export type CoverageItem = {
  id: string
  paper: PaperSlug
  section: string
  title: string
  kind: CoverageKind
  status: CoverageStatus
  source: string
  summary: string
  relatedLessonId?: string
  relatedStepId?: string
  figureIds?: string[]
  tags?: string[]
}

export type PaperCoverage = {
  paper: PaperSlug
  title: string
  subtitle: string
  items: CoverageItem[]
}

const attentionItems: CoverageItem[] = [
  { id: 'attention-contribution', paper: 'attention', section: 'Abstract', title: 'Transformer 的核心贡献', kind: 'concept', status: 'covered', source: 'Abstract p.1', summary: '用 attention 取代 recurrence 与 convolution，允许序列位置并行计算并缩短依赖路径。', relatedLessonId: 'abstract', relatedStepId: 'scope' },
  { id: 'attention-complexity', paper: 'attention', section: '§1', title: '复杂度与依赖路径', kind: 'experiment', status: 'covered', source: '§1 / Table 1 p.6', summary: '比较 self-attention、recurrent、convolutional layer 的复杂度、并行度和最短路径。', relatedLessonId: 'why', relatedStepId: 'idea', figureIds: ['table-1'] },
  { id: 'attention-encoder-decoder', paper: 'attention', section: '§3', title: '编码器—解码器堆叠', kind: 'flow', status: 'covered', source: '§3 / Figure 1 p.3', summary: '6 层 encoder 与 6 层 decoder 的 seq2seq 结构，输出端逐词预测目标序列。', relatedLessonId: 'arch', relatedStepId: 'enc', figureIds: ['figure-1'] },
  { id: 'attention-embeddings', paper: 'attention', section: '§3.4', title: 'Embedding 与输出权重共享', kind: 'implementation', status: 'expanded', source: '§3.4 p.5', summary: '输入/输出 embedding 乘以 √d_model，并在 base 配置中共享 embedding 与 pre-softmax 线性层权重。', relatedLessonId: 'arch', relatedStepId: 'enc' },
  { id: 'attention-sdp-formula', paper: 'attention', section: '§3.2.1', title: 'scaled dot-product attention', kind: 'formula', status: 'covered', source: '§3.2.1 p.4 / Figure 2', summary: 'Attention(Q,K,V)=softmax(QKᵀ/√d_k)V；先匹配，再归一化，再汇总 V。', relatedLessonId: 'sdp', relatedStepId: 'scale', figureIds: ['figure-2'] },
  { id: 'attention-qkv-shapes', paper: 'attention', section: '§3.2', title: 'Q、K、V 的角色与维度', kind: 'concept', status: 'expanded', source: '§3.2 p.4', summary: 'Q 决定当前查询，K 决定匹配，V 携带被汇总的内容；三种 attention 只改变它们来自哪里。', relatedLessonId: 'sdp', relatedStepId: 'qkv' },
  { id: 'attention-scale-variance', paper: 'attention', section: '§3.2.1', title: '为什么除以 √d_k', kind: 'formula', status: 'covered', source: '§3.2.1 p.4', summary: '在独立零均值单位方差假设下，点积方差随 d_k 增长；缩放让 softmax 不至于饱和。', relatedLessonId: 'math-lab', relatedStepId: 'variance', figureIds: ['figure-2'] },
  { id: 'attention-softmax-weight', paper: 'attention', section: '§3.2.1', title: 'Softmax 权重与加权和', kind: 'flow', status: 'covered', source: '§3.2.1 p.4', summary: 'softmax 将每个 query 对所有 key 的分数变成和为 1 的权重，再对 value 做加权求和。', relatedLessonId: 'sdp', relatedStepId: 'heat' },
  { id: 'attention-three-attentions', paper: 'attention', section: '§3.2.2', title: '三种 attention 的输入来源', kind: 'concept', status: 'covered', source: '§3.2.2 p.4–5 / Figure 1', summary: 'encoder self-attention、decoder masked self-attention、encoder–decoder attention。', relatedLessonId: 'mha', relatedStepId: 'types', figureIds: ['figure-1'] },
  { id: 'attention-causal-mask', paper: 'attention', section: '§3.2.2', title: 'causal mask', kind: 'implementation', status: 'covered', source: '§3.2.2 p.5', summary: 'decoder self-attention 将未来位置分数设为 −∞，保证自回归生成不能偷看答案。', relatedLessonId: 'math-lab', relatedStepId: 'causal' },
  { id: 'attention-multi-head', paper: 'attention', section: '§3.2.2', title: 'multi-head attention', kind: 'concept', status: 'covered', source: '§3.2.2 p.5 / Figure 2', summary: 'h 个头使用不同线性投影，在低维子空间并行学习不同关系后 concat 并用 Wᵒ 投影。', relatedLessonId: 'mha', relatedStepId: 'heads', figureIds: ['figure-2'] },
  { id: 'attention-base-heads', paper: 'attention', section: '§5.1', title: 'base 配置的头数与维度', kind: 'experiment', status: 'covered', source: '§5.1 p.8', summary: 'Transformer base 使用 h=8、d_model=512、d_k=d_v=64；big 使用 16 头与 1024 维。', relatedLessonId: 'mha', relatedStepId: 'heads' },
  { id: 'attention-position-encoding', paper: 'attention', section: '§3.5', title: 'sinusoidal positional encoding', kind: 'formula', status: 'covered', source: '§3.5 p.6 / Figure 1', summary: 'PE(pos,2i)=sin(pos/10000^(2i/d_model))，PE(pos,2i+1)=cos(·)，与 embedding 相加。', relatedLessonId: 'posenc', relatedStepId: 'sin', figureIds: ['figure-1'] },
  { id: 'attention-position-learned', paper: 'attention', section: '§3.5', title: '正弦位置编码与 learned encoding', kind: 'experiment', status: 'covered', source: '§3.5 p.6 / Table 3', summary: '论文比较固定正弦编码与 learned positional embedding，验证两者在 base 任务上表现接近。', relatedLessonId: 'posenc', relatedStepId: 'sin', figureIds: ['table-3'] },
  { id: 'attention-ffn', paper: 'attention', section: '§3.3', title: 'position-wise feed-forward network', kind: 'formula', status: 'covered', source: '§3.3 p.5 / Figure 1', summary: '每个位置独立应用 FFN(x)=max(0,xW₁+b₁)W₂+b₂，层间共享结构但不共享参数。', relatedLessonId: 'ffn', relatedStepId: 'ffn' },
  { id: 'attention-residual-layernorm', paper: 'attention', section: '§3.1', title: 'residual connection 与 LayerNorm', kind: 'implementation', status: 'covered', source: '§3.1 p.5 / Figure 1', summary: '每个 sub-layer 外围先做 residual add，再做 LayerNorm；dropout 施加在 sub-layer 输出上。', relatedLessonId: 'ffn', relatedStepId: 'res' },
  { id: 'attention-training-data', paper: 'attention', section: '§5.2', title: 'WMT 数据与 batching', kind: 'implementation', status: 'covered', source: '§5.2 p.8', summary: 'WMT 2014 English–German 使用约 4.5M 句对，English–French 使用 36M 句对，batch 按约 25,000 source/target tokens 组建。', relatedLessonId: 'train', relatedStepId: 'batch' },
  { id: 'attention-adam-warmup', paper: 'attention', section: '§5.3', title: 'Adam 与 warmup 学习率', kind: 'implementation', status: 'covered', source: '§5.3 p.8', summary: '使用 Adam(β₁=0.9, β₂=0.98, ε=10⁻⁹)，学习率先 warm up 再按 step_num⁻¹/² 衰减。', relatedLessonId: 'training-recipe', relatedStepId: 'optimizer-detail' },
  { id: 'attention-dropout', paper: 'attention', section: '§5.4', title: 'dropout 的位置', kind: 'implementation', status: 'covered', source: '§5.4 p.8', summary: 'dropout 施加于每个 sub-layer 输出、embedding 与 positional encoding 相加后的表示。', relatedLessonId: 'train', relatedStepId: 'reg' },
  { id: 'attention-label-smoothing', paper: 'attention', section: '§5.4', title: 'label smoothing', kind: 'implementation', status: 'covered', source: '§5.4 p.8', summary: 'ε_ls=0.1 的 label smoothing 降低困惑度并提高 BLEU，但使训练交叉熵不再等于真实分布的 NLL。', relatedLessonId: 'training-recipe', relatedStepId: 'label-detail' },
  { id: 'attention-beam-search', paper: 'attention', section: '§5.1', title: 'beam search 与 length penalty', kind: 'implementation', status: 'covered', source: '§5.1 p.8', summary: '翻译解码使用 beam size=4、length penalty α=0.6，并对末尾 checkpoint 做平均。', relatedLessonId: 'training-recipe', relatedStepId: 'beam-detail' },
  { id: 'attention-checkpoint-average', paper: 'attention', section: '§5.1', title: 'checkpoint averaging', kind: 'implementation', status: 'expanded', source: '§5.1 p.8', summary: '将最后若干 checkpoint 的参数平均，以改善最终翻译结果的稳定性。', relatedLessonId: 'training-recipe', relatedStepId: 'checkpoint' },
  { id: 'attention-bleu-results', paper: 'attention', section: '§6.1', title: 'WMT14 BLEU 结果', kind: 'experiment', status: 'covered', source: '§6.1 p.9 / Table 2', summary: '报告英德与英法翻译的 BLEU、训练成本和与既有系统的比较；页面保留摘要 41.8 与正文 41.0 的来源区分。', relatedLessonId: 'results', relatedStepId: 'mt', figureIds: ['table-2'] },
  { id: 'attention-ablation', paper: 'attention', section: '§6.2', title: '头数、维度与模型消融', kind: 'experiment', status: 'covered', source: '§6.2 p.10 / Table 3', summary: '比较不同 d_model、d_k、d_v、头数和参数规模，展示结构选择对开发集 BLEU 与困惑度的影响。', relatedLessonId: 'results', relatedStepId: 'ablation', figureIds: ['table-3'] },
  { id: 'attention-parsing', paper: 'attention', section: '§6.3', title: '英语 constituency parsing', kind: 'experiment', status: 'covered', source: '§6.3 p.11 / Table 4', summary: '在少量任务特定调整下迁移到句法分析，报告 WSJ 23 F1，并分析 attention head 对句法关系的响应。', relatedLessonId: 'results', relatedStepId: 'parsing', figureIds: ['table-4'] },
  { id: 'attention-limitations', paper: 'attention', section: '§7', title: '局限与后续方向', kind: 'limitation', status: 'covered', source: '§7 p.11', summary: 'self-attention 的层复杂度和内存随序列长度平方增长，作者提出受限 attention、稀疏 attention 与可解释性等方向。', relatedLessonId: 'legacy', relatedStepId: 'limit', figureIds: ['table-1'] },
]

const pagedAttentionItems: CoverageItem[] = [
  { id: 'paged-thesis', paper: 'pagedattention', section: 'Abstract', title: '服务瓶颈是动态 KV Cache', kind: 'concept', status: 'covered', source: 'Abstract p.1', summary: '高吞吐 serving 依赖 batching，但每个请求的 KV Cache 随 decode 增长，显存管理直接限制 batch size。', relatedLessonId: 'summary', relatedStepId: 'thesis', figureIds: ['fig-1'] },
  { id: 'paged-llm-background', paper: 'pagedattention', section: '§2.1', title: 'Transformer-based LLM serving', kind: 'concept', status: 'covered', source: '§2.1 p.2', summary: '大模型权重通常固定，在线服务的动态内存主要来自每个序列的 KV Cache。', relatedLessonId: 'summary', relatedStepId: 'thesis' },
  { id: 'paged-autoregressive', paper: 'pagedattention', section: '§2.2', title: '自回归生成与 KV Cache', kind: 'flow', status: 'covered', source: '§2.2 p.2–3', summary: 'prefill 一次处理 prompt，decode 每次生成一个 token 并复用历史 K/V。', relatedLessonId: 'background', relatedStepId: 'autoregressive', figureIds: ['fig-1'] },
  { id: 'paged-batching', paper: 'pagedattention', section: '§2.3', title: 'batching techniques', kind: 'concept', status: 'covered', source: '§2.3 p.3', summary: 'static batching、dynamic batching 与 continuous batching 的取舍最终都受 KV 内存占用约束。', relatedLessonId: 'system', relatedStepId: 'batching' },
  { id: 'paged-reservation', paper: 'pagedattention', section: '§3.1', title: 'reservation waste', kind: 'concept', status: 'covered', source: '§3.1 / Figures 1–3', summary: '为了未知输出长度提前预留最大空间，短请求会锁住未使用容量。', relatedLessonId: 'background', relatedStepId: 'three-wastes', figureIds: ['fig-1', 'fig-2', 'fig-3'] },
  { id: 'paged-internal-fragmentation', paper: 'pagedattention', section: '§3.1', title: 'internal fragmentation', kind: 'concept', status: 'covered', source: '§3.1 / Figure 3', summary: '分配单位内部没有被 token 填满的空间；分页把这类浪费限制在最后一个 block。', relatedLessonId: 'background', relatedStepId: 'three-wastes', figureIds: ['fig-3'] },
  { id: 'paged-external-fragmentation', paper: 'pagedattention', section: '§3.1', title: 'external fragmentation', kind: 'concept', status: 'covered', source: '§3.1 / Figure 3', summary: '空闲空间总量足够但散落在多个地址，连续 tensor 无法使用；物理 block 非连续即可绕开。', relatedLessonId: 'background', relatedStepId: 'three-wastes', figureIds: ['fig-3'] },
  { id: 'paged-block', paper: 'pagedattention', section: '§4.1', title: 'fixed-size KV block', kind: 'implementation', status: 'covered', source: '§4.1 p.5–6 / Figure 5', summary: 'KV Cache 按固定 token 数切块，按需从全局 block pool 分配、追加和释放。', relatedLessonId: 'method', relatedStepId: 'blocks', figureIds: ['fig-5'] },
  { id: 'paged-block-table', paper: 'pagedattention', section: '§4.1', title: 'block table', kind: 'implementation', status: 'covered', source: '§4.1 / Figure 6', summary: 'logical block i → physical block table[i]；每条序列拥有独立映射，kernel 按映射读取 K/V。', relatedLessonId: 'method', relatedStepId: 'attention-read', figureIds: ['fig-6'] },
  { id: 'paged-kv-manager', paper: 'pagedattention', section: '§4.2', title: 'KV Cache Manager', kind: 'implementation', status: 'covered', source: '§4.2 p.6–7 / Figure 7', summary: '维护空闲 block、序列 block table、引用计数和 allocate/free 生命周期。', relatedLessonId: 'system', relatedStepId: 'manager', figureIds: ['fig-7'] },
  { id: 'paged-semantics', paper: 'pagedattention', section: '§4.1', title: 'paging 不改变 attention 数学', kind: 'bridge', status: 'covered', source: '§4.1–4.2 / Figures 5–6', summary: 'PagedAttention does not change attention mathematics；它只改变 KV 的 storage layout、地址翻译和 batch 管理。', relatedLessonId: 'method', relatedStepId: 'attention-read', figureIds: ['fig-5', 'fig-6'] },
  { id: 'paged-sharing', paper: 'pagedattention', section: '§4.4', title: 'prefix sharing 与 copy-on-write', kind: 'implementation', status: 'covered', source: '§4.4 / Figures 7–10', summary: '共享前缀以只读 block 存在，引用计数大于 1 时写入触发 copy-on-write。', relatedLessonId: 'sharing', relatedStepId: 'cow', figureIds: ['fig-7', 'fig-8', 'fig-9'] },
  { id: 'paged-parallel-sampling', paper: 'pagedattention', section: '§4.4', title: 'parallel sampling', kind: 'experiment', status: 'covered', source: '§4.4 / Figure 8', summary: '多个采样分支共享 prompt KV，只为分叉后的 suffix 分配新 block。', relatedLessonId: 'sharing', relatedStepId: 'parallel', figureIds: ['fig-8'] },
  { id: 'paged-beam-search', paper: 'pagedattention', section: '§4.4', title: 'beam search', kind: 'experiment', status: 'covered', source: '§4.4 / Figure 9', summary: 'beam 候选共享共同祖先，分叉写入时使用 COW，避免复制整条历史。', relatedLessonId: 'sharing', relatedStepId: 'beam', figureIds: ['fig-9'] },
  { id: 'paged-continuous-batching', paper: 'pagedattention', section: '§4.3', title: 'continuous batching', kind: 'flow', status: 'covered', source: '§4.3 / Figure 4', summary: '请求可随时加入/完成/释放 block，scheduler 在每轮按 token 与 block 预算组织 active batch。', relatedLessonId: 'system', relatedStepId: 'batching', figureIds: ['fig-4'] },
  { id: 'paged-prefill', paper: 'pagedattention', section: '§4.3', title: 'prefill path', kind: 'flow', status: 'expanded', source: '§4.3 p.7', summary: '把已知 prompt 并行编码成 KV，并产生第一个 decode 状态；适合矩阵-矩阵并行。', relatedLessonId: 'implementation-details', relatedStepId: 'prefill-decode', figureIds: ['fig-6'] },
  { id: 'paged-decode', paper: 'pagedattention', section: '§4.3', title: 'decode path', kind: 'flow', status: 'expanded', source: '§4.3 p.7', summary: '每轮追加一个 token，读取不断增长的历史 KV，通常更偏 memory-bandwidth bound。', relatedLessonId: 'implementation-details', relatedStepId: 'prefill-decode' },
  { id: 'paged-kernel-fusion', paper: 'pagedattention', section: '§5.1', title: 'kernel-level optimization', kind: 'implementation', status: 'covered', source: '§5.1 / Figure 19', summary: '融合 reshape+write、block read+attention 和 batched copy，隐藏地址翻译与 launch 成本。', relatedLessonId: 'implementation-details', relatedStepId: 'kernel-fusions', figureIds: ['fig-19'] },
  { id: 'paged-fcfs', paper: 'pagedattention', section: '§4.5', title: 'FCFS 与 sequence group', kind: 'implementation', status: 'covered', source: '§4.5 p.9–10 / Figure 4', summary: 'FCFS 保证公平；parallel sampling/beam 的多序列作为 sequence group 一起抢占或恢复。', relatedLessonId: 'scheduling-details', relatedStepId: 'fcfs', figureIds: ['fig-4'] },
  { id: 'paged-preemption', paper: 'pagedattention', section: '§4.5', title: '抢占与恢复', kind: 'implementation', status: 'covered', source: '§4.5 / Figure 19', summary: 'GPU block 不足时，整组请求被 swap 或 recompute，避免破坏共享 block 的一致性。', relatedLessonId: 'scheduling-details', relatedStepId: 'swap-recompute', figureIds: ['fig-19'] },
  { id: 'paged-swap', paper: 'pagedattention', section: '§4.5', title: 'swap', kind: 'implementation', status: 'covered', source: '§4.5 / Figure 19', summary: '将 KV blocks 在 GPU 与 CPU 间搬运，保留计算结果但承担 PCIe/内存带宽成本。', relatedLessonId: 'scheduling-details', relatedStepId: 'swap-recompute', figureIds: ['fig-19'] },
  { id: 'paged-recompute', paper: 'pagedattention', section: '§4.5', title: 'recompute', kind: 'implementation', status: 'covered', source: '§4.5 / Figure 19', summary: '丢弃缓存，把 prompt 与已生成 token 合并成一次 prefill 重新计算；不依赖 block size。', relatedLessonId: 'scheduling-details', relatedStepId: 'swap-recompute', figureIds: ['fig-19'] },
  { id: 'paged-distributed', paper: 'pagedattention', section: '§4.6', title: 'distributed execution', kind: 'implementation', status: 'covered', source: '§4.6 p.10', summary: '控制面传播请求状态与 block table，GPU worker 执行数据面 attention；多 GPU 配置需结合模型并行。', relatedLessonId: 'kernel', relatedStepId: 'distributed', figureIds: ['fig-4', 'fig-6'] },
  { id: 'paged-workloads', paper: 'pagedattention', section: '§6.1', title: 'ShareGPT、Alpaca 与 Poisson arrivals', kind: 'experiment', status: 'covered', source: '§6.1 / Figure 11', summary: '用真实长度分布合成请求并按 Poisson 过程到达；ShareGPT 平均输入/输出长于 Alpaca。', relatedLessonId: 'evaluation-details', relatedStepId: 'workloads', figureIds: ['fig-11'] },
  { id: 'paged-baselines', paper: 'pagedattention', section: '§6.1', title: 'FasterTransformer 与 Orca baselines', kind: 'experiment', status: 'covered', source: '§6.1 / Figures 12–13', summary: '对比 FasterTransformer 和按最大长度、2 的幂、oracle 真实长度预留的 Orca 策略。', relatedLessonId: 'eval', relatedStepId: 'throughput', figureIds: ['fig-12', 'fig-13'] },
  { id: 'paged-throughput', paper: 'pagedattention', section: '§6.2–6.5', title: 'throughput 与 normalized latency', kind: 'experiment', status: 'covered', source: '§6.2–6.5 / Figures 12–17', summary: '在相同延迟目标下报告约 2–4× throughput 提升，并覆盖单序列、翻译、聊天和复杂解码。', relatedLessonId: 'eval', relatedStepId: 'throughput', figureIds: ['fig-12', 'fig-13', 'fig-14', 'fig-16', 'fig-17'] },
  { id: 'paged-block-size', paper: 'pagedattention', section: '§7.2', title: 'block size trade-off', kind: 'experiment', status: 'covered', source: '§7.2 / Figure 18', summary: 'block 太小增加查表/传输开销，太大增加尾部碎片与 sharing 粒度；默认 block size 为 16。', relatedLessonId: 'evaluation-details', relatedStepId: 'block-tradeoff', figureIds: ['fig-18'] },
  { id: 'paged-kernel-overhead', paper: 'pagedattention', section: '§7.1', title: 'kernel overhead', kind: 'experiment', status: 'covered', source: '§7.1 / Figure 19', summary: '测量 block table 读取、融合 kernel、recompute 和 swap 的额外开销，验证容量收益占主导。', relatedLessonId: 'eval', relatedStepId: 'ablation', figureIds: ['fig-19'] },
  { id: 'paged-limits', paper: 'pagedattention', section: '§7.2–7.3', title: '什么时候不要分页', kind: 'limitation', status: 'covered', source: '§7.2–7.3 / Figures 18–19', summary: '静态训练或 compute-bound DNN 可能无法从动态分页获益，非连续访问与寻址开销可能反而占主导。', relatedLessonId: 'evaluation-details', relatedStepId: 'boundaries', figureIds: ['fig-18', 'fig-19'] },
]

export const paperCoverage: PaperCoverage[] = [
  { paper: 'attention', title: 'Attention Is All You Need', subtitle: '从公式、架构到训练与实验的完整覆盖', items: attentionItems },
  { paper: 'pagedattention', title: 'Efficient Memory Management for Large Language Model Serving with PagedAttention', subtitle: '从动态 KV Cache 到分页、调度与 serving 实验', items: pagedAttentionItems },
]

export function getCoverageForPaper(paper: PaperSlug): PaperCoverage {
  return paperCoverage.find(entry => entry.paper === paper) ?? paperCoverage[0]
}


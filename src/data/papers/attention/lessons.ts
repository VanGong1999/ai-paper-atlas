export type StageNode = {
  id: string
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
  diffs?: string[]
  formula?: string
  highlight?: string[]
  originalId?: string
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
  edges: [string, string][]
}

export const lessons: Lesson[] = [
  {
    id: 'why',
    index: 1,
    title: '为什么需要 Transformer？',
    subtitle: '循环模型的串行瓶颈与长距离依赖',
    minutes: 4,
    learn: [
      '理解 RNN/CNN 序列模型在并行与路径长度上的限制',
      '明白自注意力如何让任意两位置直接交互',
      '区分论文贡献与后来的 GPT 路线',
    ],
    steps: [
      {
        id: 'rnn',
        title: '循环：一步依赖上一步',
        body: '在 Transformer 之前，主流 seq2seq 依赖循环网络。位置 t 的计算必须等 t-1 完成，训练难以充分并行；信息跨越长距离要经过许多中间步，梯度也更难传。',
        diffs: ['串行时间步', '长距离路径长'],
        highlight: ['problem'],
        originalId: 'sec1',
      },
      {
        id: 'idea',
        title: '注意力：一步连全局',
        body: '自注意力让每个位置用查询 Q 去匹配所有位置的键 K，再按权重聚合值 V。任意两位置之间的路径长度变为 O(1)，且序列内计算可高度并行。',
        diffs: ['+ 全局直接连接', '+ 训练可并行'],
        highlight: ['solution'],
        originalId: 'sec1',
      },
      {
        id: 'scope',
        title: '这篇论文研究什么',
        body: '原论文做的是有监督机器翻译的编码器—解码器，不是今天的 decoder-only 聊天模型。它提供的是「积木」：多头注意力、位置编码、残差与层归一化堆叠。',
        diffs: ['范围：机器翻译', '形态：Encoder–Decoder'],
        highlight: ['scope'],
        originalId: 'abstract',
      },
    ],
    nodes: [
      { id: 'problem', label: 'RNN 串行瓶颈', x: 40, y: 120, w: 140, h: 56, tip: '每步依赖上一步，难并行，长程信号要绕远路。', group: 'io' },
      { id: 'solution', label: '自注意力并行', x: 260, y: 120, w: 140, h: 56, tip: '所有位置同时互相看见，路径长度常数级。', group: 'attn' },
      { id: 'scope', label: '机器翻译 Enc–Dec', x: 480, y: 120, w: 160, h: 56, tip: '论文验证场景是 WMT 翻译，不是 ChatGPT。', group: 'io' },
    ],
    edges: [
      ['problem', 'solution'],
      ['solution', 'scope'],
    ],
  },
  {
    id: 'arch',
    index: 2,
    title: '总体架构：编码器与解码器',
    subtitle: '6×6 堆叠、残差与层归一化',
    minutes: 5,
    learn: [
      '分清编码器自注意力与解码器掩码/交叉注意力',
      '看懂子层：Attention → Add&Norm → FFN → Add&Norm',
      '理解右移输出与自回归生成约束',
    ],
    steps: [
      {
        id: 'enc',
        title: '编码器读源句',
        body: '输入词嵌入加上位置编码后，进入 N=6 层编码器。每层含多头自注意力与位置前馈网络，子层旁路是残差连接，再接 LayerNorm。',
        diffs: ['+ Input Embedding', '+ Positional Encoding', '+ ×6 Encoder'],
        highlight: ['emb', 'enc', 'pos'],
        originalId: 'sec3-1',
      },
      {
        id: 'dec',
        title: '解码器写目标句',
        body: '解码器同样 6 层。先做掩码自注意力（不能看未来词），再做交叉注意力读取编码器输出，最后 FFN。训练时目标序列右移一位。',
        diffs: ['+ Masked Self-Attn', '+ Cross-Attn', '+ ×6 Decoder'],
        highlight: ['dec', 'cross', 'mask'],
        originalId: 'sec3-1',
      },
      {
        id: 'out',
        title: '线性层 + Softmax',
        body: '解码器顶层表示经线性投影到词表大小，Softmax 得到下一个词概率。推理时逐步采样/贪心/束搜索生成。',
        diffs: ['+ Linear', '+ Softmax'],
        highlight: ['softmax'],
        originalId: 'sec3-1',
      },
    ],
    nodes: [
      { id: 'emb', label: '输入嵌入', x: 30, y: 200, w: 100, h: 44, tip: '把 token 映射到 d_model=512 维向量。', group: 'io' },
      { id: 'pos', label: '位置编码', x: 30, y: 130, w: 100, h: 44, tip: '正弦/余弦位置信号，注入顺序信息。', group: 'io' },
      { id: 'enc', label: 'Encoder ×6', x: 180, y: 110, w: 130, h: 140, tip: '自注意力 + FFN，双向看见整句源文。', group: 'encoder' },
      { id: 'dec', label: 'Decoder ×6', x: 360, y: 110, w: 130, h: 140, tip: '掩码自注意力 + 交叉注意力 + FFN。', group: 'decoder' },
      { id: 'mask', label: '因果掩码', x: 360, y: 40, w: 100, h: 40, tip: '挡住未来位置，保证自回归。', group: 'decoder' },
      { id: 'cross', label: '交叉注意力', x: 300, y: 270, w: 110, h: 40, tip: 'Q 来自解码器，K/V 来自编码器输出。', group: 'attn' },
      { id: 'softmax', label: 'Softmax 输出', x: 540, y: 150, w: 110, h: 48, tip: '投影到词表，得到下一词分布。', group: 'io' },
    ],
    edges: [
      ['emb', 'enc'],
      ['pos', 'enc'],
      ['enc', 'cross'],
      ['mask', 'dec'],
      ['dec', 'cross'],
      ['cross', 'dec'],
      ['dec', 'softmax'],
    ],
  },
  {
    id: 'sdp',
    index: 3,
    title: '缩放点积注意力',
    subtitle: 'Q·Kᵀ / √dₖ → Softmax → V',
    minutes: 6,
    learn: [
      '会读 Attention(Q,K,V) 公式每一项含义',
      '理解 √dₖ 缩放为何重要',
      '用示意热力图感受「词关注词」',
    ],
    steps: [
      {
        id: 'qkv',
        title: '查询、键、值',
        body: '每个位置把同一输入投到三组向量：Query（我在找什么）、Key（我提供什么匹配线索）、Value（匹配成功后贡献什么内容）。',
        diffs: ['+ Q', '+ K', '+ V'],
        formula: 'Q, K, V = X W_Q, X W_K, X W_V',
        highlight: ['q', 'k', 'v'],
        originalId: 'sec3-2-1',
      },
      {
        id: 'scale',
        title: '点积并缩放',
        body: '用 QKᵀ 衡量相似度。维度 dₖ 较大时点积方差变大，Softmax 会变「尖」、梯度变小，所以除以 √dₖ。',
        diffs: ['+ QKᵀ', '+ /√dₖ'],
        formula: 'Attention(Q,K,V)=softmax(QKᵀ/√dₖ)V',
        highlight: ['score'],
        originalId: 'sec3-2-1',
      },
      {
        id: 'heat',
        title: '权重加权求和',
        body: 'Softmax 后每行是一组和为 1 的注意力权重，再去加权求和 V。下方热力图是教学示意，不是论文真实权重。',
        diffs: ['+ Softmax 权重', '+ 聚合 V'],
        highlight: ['out'],
        originalId: 'sec3-2-1',
      },
    ],
    nodes: [
      { id: 'q', label: 'Q 查询', x: 60, y: 80, w: 100, h: 48, tip: '当前位置发出的「问题」。', group: 'attn' },
      { id: 'k', label: 'K 键', x: 60, y: 160, w: 100, h: 48, tip: '每个位置可被匹配的标签。', group: 'attn' },
      { id: 'v', label: 'V 值', x: 60, y: 240, w: 100, h: 48, tip: '真正被聚合的内容向量。', group: 'attn' },
      { id: 'score', label: 'QKᵀ/√dₖ', x: 240, y: 140, w: 120, h: 56, tip: '缩放点积相似度矩阵。', group: 'attn' },
      { id: 'out', label: '加权 V', x: 430, y: 140, w: 120, h: 56, tip: '按注意力权重混合各位置信息。', group: 'attn' },
    ],
    edges: [
      ['q', 'score'],
      ['k', 'score'],
      ['score', 'out'],
      ['v', 'out'],
    ],
  },
  {
    id: 'mha',
    index: 4,
    title: '多头注意力',
    subtitle: '8 个头并行投影再拼接',
    minutes: 5,
    learn: [
      '理解多头如何在不同子空间建模关系',
      '记住基线配置：h=8，d_model=512，d_k=64',
      '区分自注意力、掩码自注意力、交叉注意力',
    ],
    steps: [
      {
        id: 'heads',
        title: '切成多个子空间',
        body: '与其只做一次大注意力，不如把 Q/K/V 投影到 h 组低维空间并行计算，再拼接并通过输出投影 W_O 融合。',
        diffs: ['+ h=8 heads', '+ d_k=d_v=64'],
        formula: 'MultiHead=Concat(head_1..head_h)W_O',
        highlight: ['h1', 'h2', 'h3', 'h4'],
        originalId: 'sec3-2-2',
      },
      {
        id: 'types',
        title: '三种用法',
        body: '编码器：双向自注意力。解码器：因果掩码自注意力。编解码之间：交叉注意力（Q 来自解码侧，K/V 来自编码侧）。',
        diffs: ['自注意力', '掩码自注意力', '交叉注意力'],
        highlight: ['types'],
        originalId: 'sec3-2-3',
      },
    ],
    nodes: [
      { id: 'in', label: 'd_model=512', x: 40, y: 150, w: 110, h: 48, tip: '模型主宽度。', group: 'io' },
      { id: 'h1', label: 'Head 1', x: 200, y: 40, w: 90, h: 40, tip: '一个子空间里的注意力。', group: 'attn' },
      { id: 'h2', label: 'Head 2', x: 200, y: 100, w: 90, h: 40, tip: '可能学到不同句法/语义模式。', group: 'attn' },
      { id: 'h3', label: 'Head …', x: 200, y: 160, w: 90, h: 40, tip: '共 8 个头并行。', group: 'attn' },
      { id: 'h4', label: 'Head 8', x: 200, y: 220, w: 90, h: 40, tip: '拼接前各头维度 64。', group: 'attn' },
      { id: 'types', label: 'Concat + W_O', x: 360, y: 140, w: 130, h: 56, tip: '拼回 512 维并线性混合。', group: 'attn' },
      { id: 'out', label: '输出表示', x: 540, y: 146, w: 100, h: 44, tip: '进入残差与 LayerNorm。', group: 'io' },
    ],
    edges: [
      ['in', 'h1'],
      ['in', 'h2'],
      ['in', 'h3'],
      ['in', 'h4'],
      ['h1', 'types'],
      ['h2', 'types'],
      ['h3', 'types'],
      ['h4', 'types'],
      ['types', 'out'],
    ],
  },
  {
    id: 'posenc',
    index: 5,
    title: '位置编码',
    subtitle: '正弦余弦注入顺序',
    minutes: 4,
    learn: [
      '知道为何注意力本身不具备顺序感',
      '理解 sin/cos 不同频率的设计直觉',
      '了解论文也对比过可学习位置嵌入',
    ],
    steps: [
      {
        id: 'need',
        title: '没有卷积/循环，何来顺序？',
        body: '纯注意力对位置置换是对称的（若无额外信号）。必须把位置信息加进嵌入，模型才能区分「谁在前谁在后」。',
        diffs: ['置换等变性 → 需位置'],
        highlight: ['need'],
        originalId: 'sec3-5',
      },
      {
        id: 'sin',
        title: '正弦位置编码',
        body: 'PE(pos,2i)=sin(pos/10000^{2i/d})，奇数维用 cos。不同维度不同波长，便于模型学习相对位置关系；外推到比训练更长的序列也更自然。',
        formula: 'PE_{(pos,2i)}=sin(pos/10000^{2i/d_model})',
        diffs: ['+ 正弦', '+ 余弦', '+ 与词嵌入相加'],
        highlight: ['pe'],
        originalId: 'sec3-5',
      },
    ],
    nodes: [
      { id: 'need', label: '无序注意力', x: 80, y: 140, w: 120, h: 52, tip: '只靠内容匹配时，交换两词位置输出可变等价。', group: 'io' },
      { id: 'pe', label: 'Sin/Cos PE', x: 280, y: 140, w: 120, h: 52, tip: '按位置与维度生成固定几何模式。', group: 'io' },
      { id: 'sum', label: 'Embed + PE', x: 480, y: 140, w: 120, h: 52, tip: '与词嵌入相加后送入第一层。', group: 'io' },
    ],
    edges: [
      ['need', 'pe'],
      ['pe', 'sum'],
    ],
  },
  {
    id: 'ffn',
    index: 6,
    title: '前馈、残差与归一化',
    subtitle: '每个子层的稳定训练配方',
    minutes: 4,
    learn: [
      '记住 FFN 是逐位置的两层线性 + ReLU',
      '理解残差捷径如何帮助深层堆叠',
      '知道 LayerNorm 作用在子层输出附近',
    ],
    steps: [
      {
        id: 'ffn',
        title: 'Position-wise FFN',
        body: '对每个位置独立做相同的前馈：先扩到 d_ff=2048，ReLU，再投回 d_model=512。可看作对注意力混合后的特征做非线性加工。',
        formula: 'FFN(x)=max(0,xW_1+b_1)W_2+b_2',
        diffs: ['+ d_ff=2048', '+ ReLU'],
        highlight: ['ffn'],
        originalId: 'sec3-3',
      },
      {
        id: 'res',
        title: '残差 + LayerNorm',
        body: '每个子层输出为 LayerNorm(x + Sublayer(x))。残差保留原信息高速公路，归一化稳定分布，使 6 层堆叠可训。',
        diffs: ['+ Residual', '+ LayerNorm'],
        highlight: ['res'],
        originalId: 'sec3-1',
      },
    ],
    nodes: [
      { id: 'x', label: '子层输入 x', x: 60, y: 140, w: 110, h: 48, tip: '来自上一子层或嵌入。', group: 'io' },
      { id: 'ffn', label: 'FFN / Attn', x: 240, y: 80, w: 120, h: 48, tip: '子层主体计算。', group: 'encoder' },
      { id: 'res', label: 'x + Sublayer', x: 240, y: 200, w: 120, h: 48, tip: '残差相加。', group: 'encoder' },
      { id: 'ln', label: 'LayerNorm', x: 440, y: 140, w: 110, h: 48, tip: '特征归一化后再送下一层。', group: 'encoder' },
    ],
    edges: [
      ['x', 'ffn'],
      ['x', 'res'],
      ['ffn', 'res'],
      ['res', 'ln'],
    ],
  },
  {
    id: 'train',
    index: 7,
    title: '训练配置',
    subtitle: 'Adam、warmup、正则与标签平滑',
    minutes: 5,
    learn: [
      '了解论文优化器与学习率公式',
      '知道 dropout 与 label smoothing 的作用',
      '区分 base 与 big 模型规模',
    ],
    steps: [
      {
        id: 'opt',
        title: 'Adam + warmup',
        body: '使用 Adam（β1=0.9, β2=0.98, ε=1e-9）。学习率先线性 warmup，再按步数逆平方根衰减：lrate = d_model^{-0.5} · min(step^{-0.5}, step·warmup^{-1.5})。',
        formula: 'lrate=d^{-0.5}·min(step^{-0.5}, step·warmup^{-1.5})',
        diffs: ['+ Adam', '+ warmup=4000'],
        highlight: ['opt'],
        originalId: 'sec5-3',
      },
      {
        id: 'reg',
        title: '正则化',
        body: '残差路径上对子层输出做 dropout（base 0.1）。标签平滑 ε_ls=0.1，提高困惑度但常提升准确率与 BLEU。',
        diffs: ['+ Dropout', '+ Label smoothing'],
        highlight: ['reg'],
        originalId: 'sec5-4',
      },
      {
        id: 'size',
        title: 'Base vs Big',
        body: 'Base：d_model=512, n_head=8, d_ff=2048, N=6。Big：d_model=1024, n_head=16, d_ff=4096，dropout 0.3。Big 在翻译上更强也更贵。',
        diffs: ['Base 配置', 'Big 配置'],
        highlight: ['size'],
        originalId: 'sec5-2',
      },
    ],
    nodes: [
      { id: 'opt', label: 'Adam + Warmup', x: 80, y: 130, w: 140, h: 52, tip: '先升温再衰减的学习率日程。', group: 'train' },
      { id: 'reg', label: 'Dropout / LS', x: 290, y: 130, w: 140, h: 52, tip: '防止过拟合，平滑目标分布。', group: 'train' },
      { id: 'size', label: 'Base / Big', x: 500, y: 130, w: 120, h: 52, tip: '两套宽度与头数配置。', group: 'train' },
    ],
    edges: [
      ['opt', 'reg'],
      ['reg', 'size'],
    ],
  },
  {
    id: 'results',
    index: 8,
    title: '实验结果与消融',
    subtitle: '翻译 BLEU、句法、注意力变体',
    minutes: 5,
    learn: [
      '记住英德/英法主要 BLEU 数字的含义与语境',
      '知道论文做了头数、维度、位置编码等消融',
      '理解「更快更好」是相对当时系统而言',
    ],
    steps: [
      {
        id: 'mt',
        title: '机器翻译',
        body: 'WMT 2014 英→德：Big 模型 28.4 BLEU。英→法：41.8 BLEU。论文强调在较少训练成本下达到或超过当时最优。',
        diffs: ['EN→DE 28.4', 'EN→FR 41.8'],
        highlight: ['mt'],
        originalId: 'sec6-1',
      },
      {
        id: 'ablation',
        title: '变体与消融',
        body: '比较了不同注意力类型（点积 vs 加性）、头数、d_k、是否共享位置编码等。结果表明多头与缩放点积在质量与速度间平衡良好。',
        diffs: ['头数消融', '注意力变体'],
        highlight: ['ablation'],
        originalId: 'sec6-2',
      },
      {
        id: 'parsing',
        title: '英语成分句法分析',
        body: '把架构迁移到句法分析，验证并非「只对翻译有效」。说明通用序列转换能力。',
        diffs: ['+ 句法任务迁移'],
        highlight: ['parsing'],
        originalId: 'sec6-3',
      },
    ],
    nodes: [
      { id: 'mt', label: 'WMT 翻译', x: 70, y: 130, w: 120, h: 52, tip: '主实验：质量与训练时间。', group: 'train' },
      { id: 'ablation', label: '消融实验', x: 260, y: 130, w: 120, h: 52, tip: '头数、维度、位置等设计选择。', group: 'train' },
      { id: 'parsing', label: '句法分析', x: 450, y: 130, w: 120, h: 52, tip: '跨任务泛化证据。', group: 'train' },
    ],
    edges: [
      ['mt', 'ablation'],
      ['ablation', 'parsing'],
    ],
  },
  {
    id: 'legacy',
    index: 9,
    title: '影响、局限与读法',
    subtitle: '它改变了什么，又不是什么',
    minutes: 4,
    learn: [
      '把 Transformer 积木与后来 GPT/BERT 路线区分开',
      '认识标准注意力的二次复杂度代价',
      '带着问题去读原文图表与附录',
    ],
    steps: [
      {
        id: 'impact',
        title: '后续世界',
        body: '编码器侧演化出 BERT 等；解码器侧演化出 GPT 等；编码器—解码器仍用于翻译与语音等。FlashAttention、MoE、MLA 都在「同一骨架」上挖 Infra 红利。',
        diffs: ['→ BERT', '→ GPT', '→ Infra 优化'],
        highlight: ['impact'],
        originalId: 'sec7',
      },
      {
        id: 'limit',
        title: '边界',
        body: '标准自注意力显存与算力随序列长度近似平方增长；固定正弦位置对超长外推有限；原论文不包含 RLHF、工具调用或 Agent 循环。',
        diffs: ['O(n²) 成本', '非聊天对齐'],
        highlight: ['limit'],
        originalId: 'sec4',
      },
      {
        id: 'read',
        title: '如何读原文',
        body: '建议对照：架构图、公式 (1)–(4)、表 1–4、训练日程与消融。本页是导读与中译入口，实验细节以 PDF 为准。',
        diffs: ['打开全文中译', '打开 PDF'],
        highlight: ['read'],
        originalId: 'abstract',
      },
    ],
    nodes: [
      { id: 'impact', label: '生态影响', x: 70, y: 130, w: 120, h: 52, tip: '成为大模型默认积木。', group: 'io' },
      { id: 'limit', label: '复杂度边界', x: 260, y: 130, w: 120, h: 52, tip: '长序列需要后续 Infra。', group: 'io' },
      { id: 'read', label: '对照原文', x: 450, y: 130, w: 120, h: 52, tip: '中译 + PDF 精读。', group: 'io' },
    ],
    edges: [
      ['impact', 'limit'],
      ['limit', 'read'],
    ],
  },
]

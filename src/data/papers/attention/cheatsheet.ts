export const cheatSheet = [
  { number: '01', tag: 'THE BIG IDEA', title: '一句话读懂 Transformer', summary: '用注意力连接序列中的所有位置。', emphasis: '不依赖循环或卷积', detail: '模型让每个词直接参考其他相关的词，再把这些信息组合起来。训练时，序列中的位置可以并行处理；生成译文时仍然需要逐词生成。', lessonId: 'abstract', stepId: 'scope' },
  { number: '02', tag: 'ARCHITECTURE', title: '编码器 × 解码器', summary: '先理解输入，再逐步生成输出。', emphasis: '编码器读原文，解码器写译文', detail: '编码器为输入的每个词构建包含上下文的表示；解码器一边查看已经生成的词，一边读取编码器的结果，预测下一个词。原论文的两侧均堆叠 6 层。', lessonId: 'arch', stepId: 'enc' },
  { number: '03', tag: 'ATTENTION', title: 'Q、K、V 是什么？', summary: '像一次带着问题的信息检索。', emphasis: 'Q 提问，K 匹配，V 提供内容', detail: '每个位置用查询 Q 与所有键 K 计算相关程度；Softmax 把分数转成权重，再用这些权重对值 V 求加权和。权重越大，对结果的影响越大。', lessonId: 'sdp', stepId: 'qkv' },
  { number: '04', tag: 'THE FORMULA', title: '缩放点积注意力', summary: 'Attention(Q,K,V) = softmax(QKᵀ / √dₖ)V', emphasis: '先算相关性，再汇总信息', detail: 'QKᵀ 得到匹配分数；除以 √dₖ 防止维度较大时分数过大；Softmax 得到权重；最后与 V 相乘，得到融合上下文的表示。', lessonId: 'sdp', stepId: 'scale' },
  { number: '05', tag: 'MULTI-HEAD', title: '为什么需要多个头？', summary: '让模型并行学习不同的关系。', emphasis: '不同投影，多个视角', detail: '每个头使用各自的投影来计算注意力，之后把结果拼接并再次投影。原论文的基础模型使用 8 个头；不同头可以学习不同关系，但并不保证各自有固定含义。', lessonId: 'mha', stepId: 'heads' },
  { number: '06', tag: 'POSITION', title: '顺序从哪里来？', summary: '把位置信息加入词向量。', emphasis: '注意力本身不表示先后顺序', detail: '论文使用不同频率的正弦和余弦位置编码，并将其加到输入嵌入中，让模型能够利用词在序列中的位置和相对距离。', lessonId: 'posenc', stepId: 'sin' },
  { number: '07', tag: 'MASKING', title: '解码时不能偷看未来', summary: '遮住当前位置之后的答案。', emphasis: '掩码保证自回归生成', detail: '解码器的掩码自注意力只允许当前位置关注自己和更早的位置。跨注意力则以解码器表示作为 Q，以编码器输出作为 K 和 V。', lessonId: 'arch', stepId: 'dec' },
  { number: '08', tag: 'RESULTS', title: '论文证明了什么？', summary: '在机器翻译任务上取得有竞争力的结果。', emphasis: '效果与训练效率兼顾', detail: '作者在 WMT 英德和英法翻译任务上报告了结果，并用消融实验分析头数、维度等设计。结果依赖具体数据集、模型配置和评估方式。', lessonId: 'results', stepId: 'mt' },
] as const

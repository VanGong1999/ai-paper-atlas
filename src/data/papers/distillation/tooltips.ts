export type DistillationTooltip = {
  id: string
  term: string
  main: string
  why: string
  mechanism: string
  counterfactual: string
  anchor: string
  formula?: string
}

export const tooltips: DistillationTooltip[] = [
  { id: 'knowledge-distillation', term: 'Knowledge Distillation', main: '让小模型学习大模型的输出分布，把一个昂贵的函数压缩成便宜的函数。', why: '训练时可以用大模型或集成模型换准确率，部署时却必须受延迟、内存和功耗约束。', mechanism: 'Teacher 给出 soft targets，Student 同时看真实标签与 Teacher 的概率关系；迁移的是输入到输出的行为，而不是复制参数。', counterfactual: '只有硬标签时，Student 只能知道“答案是谁”，不知道其他类别有多像，监督信号会变粗。', anchor: 'Introduction；§2' },
  { id: 'teacher', term: 'Teacher', main: '已经学得更好、负责提供额外监督信号的大模型或模型集成。', why: '真实标签通常只告诉我们一个正确类别，Teacher 还能表达类别之间的相似度。', mechanism: '对 transfer set 前向推理，输出 logits 或温度软化后的概率；蒸馏训练时通常冻结参数并放在 no_grad 中。', counterfactual: '没有 Teacher，Student 只能从 one-hot 标签学习，无法接收暗知识。', anchor: 'Introduction；§2' },
  { id: 'student', term: 'Student', main: '最终要部署的小模型，它不必长得像 Teacher，只需复现关键输入→输出映射。', why: '部署预算有限：参数、显存、响应时间和能耗都不能无限增加。', mechanism: '用 soft loss 拟合 Teacher，用 hard loss 保持对真实标签的校准，训练完成后只保留 Student。', counterfactual: '没有 Student，Teacher 的准确率可能很好，但每次请求仍要支付大模型或多模型集成的成本。', anchor: 'Introduction；§2' },
  { id: 'ensemble', term: 'Ensemble', main: '多个模型投票或平均预测，通常比单模型更准但更难部署。', why: '不同模型的错误不完全相同，平均可以降低方差；代价是推理成本随模型数叠加。', mechanism: 'Teacher ensemble 的预测分布作为一个更平滑的目标，Student 只用一次前向就近似这组模型的行为。', counterfactual: '没有压缩，线上要同时运行多个模型，延迟、显存和服务复杂度都会上升。', anchor: 'Introduction；§1' },
  { id: 'soft-targets', term: 'Soft targets', main: '不是 one-hot 的概率分布，而是 Teacher 对所有类别的相对信心。', why: '“猫”与“虎”可能比“猫”与“卡车”更相似；这些非零概率也携带学习信号。', mechanism: '将 Teacher logits 除以 T 后 softmax，Student 在同一温度下用 KL/交叉熵贴近它。', counterfactual: '只用 hard target 会把所有错误类别都压成 0，类别间的结构被抹掉。', anchor: '§2；§2.1', formula: 'q_i = exp(z_i/T) / Σ_j exp(z_j/T)' },
  { id: 'hard-targets', term: 'Hard targets', main: '数据集提供的离散真实标签，例如“这张图是 7”。', why: 'Soft target 可能带有 Teacher 的偏差，真实标签提供最终的校准锚点。', mechanism: '在 T=1 下对 Student logits 计算普通交叉熵，并与 soft loss 按权重混合。', counterfactual: '只用 soft target 可能复制 Teacher 的错误，Student 对真实任务的校准会变弱。', anchor: '§2' },
  { id: 'dark-knowledge', term: 'Dark knowledge', main: '藏在错误类别相对概率里的“类别关系”，标签本身没有直接写出来。', why: 'BMW 对垃圾车、垃圾车对胡萝卜的相对概率，暗示视觉相似性与模型的泛化经验。', mechanism: '提高 T 让小概率类别浮起来，Student 学习完整排序，而不是只追最高分。', counterfactual: 'T=1 时分布太尖，非正确类几乎没有梯度，暗知识被遮住。', anchor: '§2；BMW / garbage truck / carrot 例子' },
  { id: 'logits', term: 'Logits', main: 'Softmax 之前的未归一化分数，是模型对各类别的原始偏好。', why: '概率会受温度和归一化影响，logit 差值更直接地表示类别相对偏好。', mechanism: 'Teacher 和 Student 可以匹配 logits；在高温极限，蒸馏梯度近似匹配去均值 logits。', counterfactual: '只盯概率，在低温时信息会饱和；不同温度下的比较也更难解释。', anchor: '§2.1', formula: 'z_i − mean(z) 体现相对证据' },
  { id: 'softmax', term: 'Softmax', main: '把一组 logits 变成总和为 1 的类别概率。', why: '需要把模型的相对偏好变成可比较、可作为监督目标的分布。', mechanism: '指数放大分数差异，再归一化；除以 T 后才做 softmax 就能控制尖锐程度。', counterfactual: '没有归一化分布，Teacher 输出无法直接作为 Student 的概率监督。', anchor: '§2.1' },
  { id: 'temperature', term: 'Temperature T', main: 'softmax 前的温度旋钮：T 越高，分布越平，越能看到错误类之间的差异。', why: 'T=1 时最高类别压倒一切；提高 T 会把小概率但有意义的关系拉回可见范围。', mechanism: '计算 softmax(z/T)，Teacher 与 Student 使用同一个 T；训练完部署时不需要保留高温。', counterfactual: '没有 T，暗知识容易被最大概率遮蔽；T 太高又会让目标过于平，监督变弱。', anchor: '§2；§2.1', formula: 'q_i = exp(z_i/T) / Σ_j exp(z_j/T)' },
  { id: 'soft-loss', term: 'Soft loss', main: '让 Student 在温度 T 下复现 Teacher 分布的损失。', why: '它提供比 one-hot 更密集的类别关系梯度。', mechanism: '常用 KLDiv(log_softmax(student/T), softmax(teacher/T))，再乘 T² 补偿梯度缩放。', counterfactual: '没有 soft loss，Student 学不到 Teacher 的类间相似性。', anchor: '§2；§2.1', formula: 'L_soft = T² · KL(p_T || q_T)' },
  { id: 'hard-loss', term: 'Hard loss', main: 'Student 对真实标签的普通交叉熵，温度固定为 1。', why: '它把蒸馏目标拉回数据真值，避免 Teacher 的错误被无条件复制。', mechanism: 'L_hard = CE(student logits, y)，再与 soft loss 按 α 组合。', counterfactual: '没有 hard loss，Student 可能只拟合 Teacher 的偏好而忽略数据标签。', anchor: '§2', formula: 'L = αL_soft + (1−α)L_hard' },
  { id: 't2-scaling', term: 'T² scaling', main: 'soft loss 乘 T²，用来抵消升温让梯度变小的尺度变化。', why: 'logit 除以 T 后，softmax 对 logits 的梯度大约缩小到 1/T² 量级。', mechanism: '先用高温暴露暗知识，再用 T² 把 soft 项的梯度带回可与 hard 项比较的尺度。', counterfactual: '省略 T² 时，T 越大 soft 分支越像“有名无实”，α 的含义也会漂移。', anchor: '§2；§2.1' },
  { id: 'matching-logits', term: 'Matching logits', main: '直接让 Student 的去均值 logits 接近 Teacher，是高温蒸馏的极限特例。', why: '当 T 很高，softmax 的非线性被近似展开，概率匹配退化成相对 logit 匹配。', mechanism: '对 logits 去均值以消除整体平移不影响概率的问题，再用平方误差等距离训练。', counterfactual: '如果把整体偏移也当差异，模型会惩罚一个对 softmax 没有影响的自由度。', anchor: '§2.1' },
  { id: 'transfer-set', term: 'Transfer set', main: '用来承接 Teacher 知识的数据集合，可以是原训练集或未标注样本。', why: '蒸馏需要输入来询问 Teacher；不一定要复制 Teacher 的原始训练流程。', mechanism: '对每个 x 先得到 Teacher 输出，再让 Student 在同一个 x 上学习；标签可有可无。', counterfactual: '没有输入集合，就没有“Teacher 在哪些问题上如何回答”的行为样本。', anchor: '§2' },
  { id: 'dropout-ensemble', term: 'Dropout as ensemble', main: '训练时随机丢单元，相当于用许多共享参数的子网络组成近似集成。', why: '独立集成昂贵，Dropout 用随机掩码取得部分集成效果。', mechanism: 'Teacher 训练时用 dropout 正则，Student 从它的 soft outputs 中继承更稳健的函数形状。', counterfactual: '没有正则或集成，Teacher 的泛化可能弱，Student 可蒸馏的额外结构也更少。', anchor: '§3 MNIST 实验' },
  { id: 'specialist', term: 'Specialist models', main: '只负责区分一小组容易混淆类别的专门模型。', why: '全模型要同时覆盖所有类别；把难点拆成局部问题可提高细粒度判别。', mechanism: '从 confusable classes 构造 specialist，训练后把多个 specialist 的知识蒸馏回一个部署模型。', counterfactual: '没有 specialist，稀有的细粒度边界可能被全局任务的平均目标淹没。', anchor: '§4 Specialist models' },
  { id: 'confusable', term: 'Confusable classes', main: 'Teacher 经常混淆、但视觉或声学上确实相近的一组类别。', why: '这些类别的错误不是随机噪声，而是最值得额外建模的局部边界。', mechanism: '用混淆矩阵找组，specialist 只在组内分辨；全模型仍负责整体类别空间。', counterfactual: '不显式识别混淆组，资源会平均撒在容易类别上，难类别收益有限。', anchor: '§4；Table / specialist experiments' },
]

export function findTooltip(id: string) {
  return tooltips.find(item => item.id === id || item.term === id)
}

export type KDHotspot = { id: string; label: string; plain: string }
export type KDSent = { id: string; title: string; eyebrow: string; fact: string; explanation: string; formula?: string; hotspots: KDHotspot[] }
export type KDLesson = { id: string; index: number; title: string; subtitle: string; steps: KDSent[] }

const h = (id: string, label: string, plain: string): KDHotspot => ({ id, label, plain })

export const lessons: KDLesson[] = [
  { id: 'why', index: 1, title: '训练 ≠ 部署', subtitle: '先用大脑学得好，再用小身体跑得快', steps: [
    { id: 'larva-adult', title: '幼虫与成虫', eyebrow: '01 · PROBLEM', fact: '训练阶段可以昂贵，部署阶段必须便宜。', explanation: '论文用幼虫/成虫作比喻：幼虫阶段优先积累能力，成虫阶段优先适应环境。集成模型适合训练和验证，但线上每个请求都让十个模型投票，延迟、内存与功耗会同时放大。', hotspots: [h('training', '训练形态', '为了准确率可以使用更大、更慢的模型。'), h('deployment', '部署形态', '为了服务成本必须更小、更快。'), h('ensemble', '集成模型', '多个模型共同预测，准确但昂贵。')] },
    { id: 'function', title: '知识是函数', eyebrow: '02 · VIEW', fact: '要迁移的不是参数，而是输入到输出的映射。', explanation: 'Teacher 的层数、宽度和参数排列不是知识的唯一载体；真正可迁移的是它面对一个输入时如何分配证据、如何区分相似类别。Student 可以用完全不同的结构近似同一个函数。', formula: 'knowledge ≈ f_teacher(x) → y', hotspots: [h('mapping', '输入→输出', '蒸馏要复制的是行为。'), h('transfer', 'Transfer set', '用一批输入去询问 Teacher。')] },
  ] },
  { id: 'transfer', index: 2, title: '准备 Transfer set', subtitle: '蒸馏需要一批输入去询问 Teacher', steps: [
    { id: 'transfer-set', title: '输入就是提问', eyebrow: '03 · TRANSFER SET', fact: '蒸馏不一定需要复制 Teacher 的参数或原始训练流程。', explanation: 'Student 需要的是一批输入 x，以及 Teacher 在这些输入上的回答。这个集合可以来自原训练集，也可以是未标注样本；关键是让 Student 观察到足够多的行为边界。', formula: 'x ∈ transfer set → Teacher(x) → Student learns', hotspots: [h('transfer', 'Transfer set', '用来询问 Teacher 的输入集合。'), h('mapping', '行为样本', '每个输入都对应 Teacher 的一份 soft answer。')] },
  ] },
  { id: 'soft', index: 3, title: '暗知识可见化', subtitle: '标签只说谁对，Teacher 还说谁像', steps: [
    { id: 'bmw', title: 'BMW / 垃圾车 / 胡萝卜', eyebrow: '03 · DARK KNOWLEDGE', fact: '错误类别的相对概率也包含结构。', explanation: '如果输入是 BMW，Teacher 可能给 BMW 最高分，但垃圾车比胡萝卜更高；这说明模型知道“车辆之间更像”。one-hot 标签把所有错误类别都设为 0，关系被抹平。', hotspots: [h('soft', 'soft targets', '所有类别都有相对概率的目标。'), h('dark', 'dark knowledge', '错误类之间的排序和间距。'), h('hard', 'hard targets', '数据集提供的 one-hot 真值。')] },
    { id: 'temperature', title: '用温度揭开关系', eyebrow: '04 · TEMPERATURE', fact: '提高 T 会把小概率类别从阴影里拉出来。', explanation: 'softmax 的指数会放大最大 logit。把 logits 除以 T，相当于让分数差异变温和；T=1 只突出冠军，T=20 则能观察亚军、季军之间的相对关系。', formula: 'q_i = exp(z_i/T) / Σ_j exp(z_j/T)', hotspots: [h('temperature', 'Temperature T', '控制分布尖锐程度的旋钮。'), h('softmax', 'Softmax', '把 logits 变成概率分布。'), h('logits', 'Logits', 'softmax 前的原始分数。')] },
  ] },
  { id: 'objective', index: 4, title: '蒸馏目标', subtitle: 'soft loss 传关系，hard loss 守住真值', steps: [
    { id: 'loss', title: '两条监督合流', eyebrow: '05 · OBJECTIVE', fact: 'Student 同时学习 Teacher 分布与真实标签。', explanation: 'soft loss 让 Student 复现类间结构，hard loss 防止它盲目复制 Teacher 的错误。α 决定两种监督的相对权重；T 只用于 soft 分支，hard 分支保持 T=1。', formula: 'L = α·T²·KL(p_T || q_T) + (1−α)·CE(y, q)', hotspots: [h('soft-loss', 'soft loss', '匹配高温分布的损失。'), h('hard-loss', 'hard loss', '匹配真实标签的损失。'), h('alpha', 'α', 'soft 与 hard 监督的混合比例。')] },
    { id: 't2', title: '为什么乘 T²', eyebrow: '06 · GRADIENT SCALE', fact: '升温会缩小梯度，T² 把 soft 信号的尺度补回来。', explanation: 'Student logits 先除以 T，softmax 对输入的响应又会被温度缩放；整体梯度大约变为原来的 1/T²。若不补偿，T 越大 soft loss 越难真正影响训练。', formula: '∂L_soft/∂z ≈ O(1/T²) → use T²·L_soft', hotspots: [h('t2-scale', 'T² scaling', '补偿高温带来的梯度变小。'), h('gradient', '梯度尺度', '决定一个损失分支真正推动参数的力度。')] },
  ] },
  { id: 'logits', index: 5, title: '高温极限', subtitle: '概率匹配最终接近去均值 logits 匹配', steps: [
    { id: 'match', title: '概率还是 logits？', eyebrow: '07 · LIMIT', fact: '高温展开后，蒸馏的核心变成匹配相对 logits。', explanation: 'softmax 对整体平移不敏感，所以真正重要的是各类别相对平均值的差。论文指出，在高温极限下，匹配 soft targets 的梯度等价于匹配 zero-meaned logits 的梯度。', formula: 'z̄_i = z_i − (1/n)Σ_j z_j', hotspots: [h('matching', 'matching logits', '匹配去均值后的相对证据。'), h('zero-mean', 'zero-mean', '去除所有类别共同平移。'), h('probability', '概率匹配', '在有限温度下匹配 softmax 分布。')] },
  ] },
  { id: 'mnist', index: 6, title: 'MNIST 证据', subtitle: '小模型也能继承大模型的泛化', steps: [
    { id: 'numbers', title: '67 / 146 / 74', eyebrow: '08 · MNIST', fact: '论文报告：大网约 67 个错，小网 146 个错，蒸馏小网约 74 个错。', explanation: '这组结果的重点不是小网变成了大网，而是它几乎恢复了大网的泛化能力。Teacher 训练时使用 dropout 与 jitter，Student 蒸馏时不必重复同样的数据增强，也能从 soft outputs 间接继承这些归纳偏置。', hotspots: [h('teacher-errors', '大网 ≈67', '强正则 Teacher 的测试错误数。'), h('student-errors', '小网 ≈146', '直接用硬标签训练的小模型。'), h('distilled-errors', '蒸馏 ≈74', '学习 soft targets 后的小模型。')] },
  ] },
  { id: 'speech', index: 7, title: '语音声学模型', subtitle: '从十个模型的投票变成一个模型', steps: [
    { id: 'speech-results', title: 'Baseline / 10× / Distilled', eyebrow: '09 · SPEECH', fact: '语音实验把单模型、十模型集成与蒸馏模型放在同一条比较链上。', explanation: '集成提供更好的声学判断，但部署十个网络成本很高。蒸馏模型在 transfer set 上学习集成输出，目标是在接近集成质量的同时只保留一个网络的推理成本；具体数字以论文表格为准。', hotspots: [h('baseline', 'Baseline', '单个普通声学模型。'), h('tenx', '10× Ensemble', '十个模型共同预测。'), h('distilled-speech', 'Distilled', '用集成输出训练的单模型。')] },
  ] },
  { id: 'specialist', index: 8, title: 'Specialist 专家', subtitle: '把混淆矩阵里的难点单独放大', steps: [
    { id: 'confusable', title: '先找容易混淆的类', eyebrow: '10 · SPECIALIST', fact: 'Specialist 只负责一组 confusable classes，再把局部知识蒸馏回全模型。', explanation: '全模型需要覆盖整个类别空间；specialist 则聚焦“最容易错的邻居”。这不是必须学习门控的 Mixture of Experts：specialist 可以离线并行训练，最后把知识合回一个部署模型。', hotspots: [h('specialist', 'specialist', '只处理局部难题的专门模型。'), h('confusable', 'confusable classes', '全模型最常混淆的一组类别。'), h('moe', '区别于 MoE', 'specialist 蒸馏不要求线上门控路由。')] },
  ] },
  { id: 'practice', index: 9, title: '实践：跑起来', subtitle: '用 PyTorch 重现 Teacher → Student 的闭环', steps: [
    { id: 'pytorch', title: '完整训练流程', eyebrow: '11 · PYTORCH', fact: 'Teacher 冻结、Student 训练、soft KL × T²、hard CE 混合。', explanation: '页面内嵌的脚本定义了 MNIST Teacher CNN 与 Student MLP，先预训练或加载 Teacher，再在 no_grad 下计算 Teacher logits，最后用 alpha、temperature 控制蒸馏。命令行可切换 hard、soft、mix 三种对照。', hotspots: [h('no-grad', 'no_grad', 'Teacher 不参与反向传播。'), h('kl', 'KLDiv', '比较两个概率分布的方向性距离。'), h('eval', '评估', '比较 Teacher、普通 Student 与蒸馏 Student。')] },
  ] },
  { id: 'summary', index: 10, title: '把整篇论文记住', subtitle: '一条从成本约束到知识迁移的链', steps: [
    { id: 'chain', title: '一句话总结', eyebrow: '12 · TAKEAWAY', fact: '训练时用集成换质量，部署时用蒸馏换成本。', explanation: '知识蒸馏的核心不是把大网络“剪小”，而是让小网络观察大网络对输入的软回答。Temperature 暴露类间关系，soft+hard 兼顾结构与真值，T² 保证高温分支仍有足够梯度，specialist 则把局部难点也纳入迁移。', hotspots: [h('quality', '质量', 'Teacher 提供更丰富的行为监督。'), h('cost', '成本', 'Student 只需一次小网络前向。'), h('closed-loop', '闭环', '从数据、Teacher、目标到部署的完整链路。')] },
  ] },
]

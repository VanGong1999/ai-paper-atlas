export const sourceInventory = [
  { source: 'Abstract / §1 · pp.1–2', subject: '动机、函数观点与 transfer set', detail: '幼虫/成虫；2006 model compression 前史；BMW/垃圾车/胡萝卜；10⁻⁶ 对 10⁻⁹；原训练集或未标注集；集成算术/几何平均；高熵目标和梯度方差。', lesson: '训练 ≠ 部署 / 准备 Transfer set / 暗知识 / Soft targets 为什么省数据' },
  { source: '§2 · pp.2–3 · Eq.(1)', subject: '温度与双目标', detail: 'Teacher 和 Student soft 分支使用同温度；同一 Student logits 在 hard 分支使用 T=1；soft CE 乘 T²；部署恢复 T=1；hard 权重通常更小。', lesson: '用温度揭开关系 / 两条监督合流 / 把一批数字算到底' },
  { source: '§2.1 · p.3 · Eq.(2)–(4)', subject: '精确梯度与高温极限', detail: '(q−p)/T → 指数一阶展开 → 每个样本分别去均值后 (z−v)/(NT²)；低温弱化极负 logits，噪声与信息的取舍须实验判断。', lesson: '为什么乘 T² / 高温极限 / 论文式 (2)–(4)' },
  { source: '§3 · pp.3–4', subject: 'MNIST 设置与全部边界实验', detail: '60,000 训练样本；2×1200 ReLU Teacher，dropout/weight constraints/±2px jitter；2×800 Student；67/146/74 errors，蒸馏 T=20；≥300 单元时 T>8 相近，30 单元时 2.5–4 更好；缺 3、仅 7/8 与测试集 bias 校准。', lesson: 'MNIST 证据 / 网络与温度扫描 / MNIST 边界实验' },
  { source: '§4–4.1 · pp.4–5 · Table 1', subject: '语音训练、解码和集成对照', detail: '26×40 输入、10ms 帧移、预测第21帧；8×2560 ReLU、14,000 HMM 状态、85M 参数；2000h/700M 样本；10 个随机初始化模型；T∈{1,2,5,10}，表1选 T=2，hard 相对权重0.5；frame/WER 双指标；相关工作 [8] T=1、gap 回收28%。', lesson: '语音声学模型 / ASR 目标；本页实验表' },
  { source: '§5.1 · pp.5–6', subject: 'JFT 规模和训练成本', detail: '100M 图像、15,000 标签；generalist 训练约6个月；数据并行副本+分片参数服务器、模型并行；集成是第三层并行；specialist 从预训练权重微调仅需数天。', lesson: 'JFT Specialist 机制；本页实验注释' },
  { source: '§5.2–5.3 · p.6 · Table 2', subject: 'specialist 分组、训练、dustbin', detail: 'specialist=300个类+dustbin；generalist 初始化；50%特殊子集/50%剩余；dustbin logit 加 log 过采样比；预测协方差列的在线 K-means，不需要真实标签；3组真实类别示例。', lesson: '先找容易混淆的类 / JFT 机制 / 式 (5)；本页 Table 2' },
  { source: '§5.4 · pp.6–7 · Eq.(5)', subject: '按需推理与联合分布', detail: 'generalist top-n（实验n=1）→选择相交specialist；联合最小化 KL(p_g,q)+Σ KL(p_m,q)，dustbin 对应 q 的非特殊类概率之和；每图梯度下降，不是一次学生前向；一般无闭式解，完整输出分布情况下 KL 方向决定算术/几何均值。', lesson: 'Specialist 图解 / JFT 式 (5)' },
  { source: '§5.5 · p.7 · Tables 3–4', subject: 'JFT 完整结果和覆盖数分组', detail: 'conditional 43.1→45.9%；overall 25.0→26.1%（相对+4.4%）；61个specialists，类别集合可重叠；Table4的11行完整保留，覆盖更多通常更好但不是严格单调。', lesson: 'JFT 结果；本页 Tables 3–4' },
  { source: '§6 · pp.7–8 · Table 5', subject: 'soft target 作为正则器', detail: '85M 语音模型仅3%数据≈20M样本；train/test:63.4/58.9、67.3/44.5、65.4/57.0；hard 用 early stopping，soft 自然收敛至57%；teacher 看过全量数据。', lesson: 'Soft targets 正则化；本页 Table 5' },
  { source: '§6.1–7 · p.8', subject: '未完成方向与 MoE 比较', detail: 'full-softmax specialists 保留非特殊类 generalist soft targets 是探索方向；MoE gating/experts 相互耦合，固定 specialist 分组后可独立并行训练；本实验仍有 generalist 驱动的推理选择。', lesson: 'JFT 结果与正则化 / Specialist 图解' },
  { source: '§8 / References · pp.8–9', subject: '讨论、限制与引用', detail: '已证实 MNIST、语音集成→单模型、JFT specialist ensemble；未证明 specialist ensemble→single large net；9条参考文献完整原页可查，后续蒸馏范式标为扩展。', lesson: '结论边界 / Figures 原页 / 扩展阅读' },
]
export const speechResults = [
  { system: 'Baseline · 1模型', frame: 58.9, wer: 10.9 },
  { system: '10× Ensemble · 10模型', frame: 61.1, wer: 10.7 },
  { system: 'Distilled · 1模型', frame: 60.8, wer: 10.7 },
]
export const jftResults = [
  { system: 'Baseline', conditional: 43.1, overall: 25.0 },
  { system: '+61 specialists', conditional: 45.9, overall: 26.1 },
]
export const specialistCoverage = [
  ['0', 350037, 0, 0.0], ['1', 141993, 1421, 3.4], ['2', 67161, 1572, 7.4], ['3', 38801, 1124, 8.8],
  ['4', 26298, 835, 10.5], ['5', 16474, 561, 11.1], ['6', 10682, 362, 11.3], ['7', 7376, 232, 12.8],
  ['8', 4703, 182, 13.6], ['9', 4706, 208, 16.6], ['≥10', 9082, 324, 14.1],
] as const
export const regularizationResults = [
  { system: 'Hard · 100%数据', train: 63.4, test: 58.9 },
  { system: 'Hard · 3%数据', train: 67.3, test: 44.5 },
  { system: 'Soft · 3%数据', train: 65.4, test: 57.0 },
]

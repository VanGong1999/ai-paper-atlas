import type { TeachingConcept } from "../../../components/paper/ConceptHelp";
export const moePdf = "article/deepseek/2401.06066.pdf";
export const moeSource = "https://arxiv.org/html/2401.06066v1";
export type MoEScene =
  | "architecture"
  | "routing"
  | "segmentation"
  | "shared"
  | "balance"
  | "evidence"
  | "source"
  | "formulas";
export type MoELesson = {
  id: string;
  title: string;
  section: string;
  page: number;
  scene: MoEScene;
  question: string;
  intro: string;
  details: { title: string; body: string }[];
  caution: string;
};
const d = (title: string, body: string) => ({ title, body });
export const moeLessons: MoELesson[] = [
  {
    id: "overview",
    title: "总览：容量与计算分离",
    section: "Abstract · §1 · Figure 1–2",
    page: 1,
    scene: "architecture",
    question: "怎样保存更多知识，却只为当前 Token 计算一部分？",
    intro:
      "MoE 的专家是参数不同的 FFN，不是独立聊天模型。DeepSeekMoE 通过细粒度切分与共享专家隔离，尝试让不同分支的知识更互补。总参数决定需要保存的模型容量，激活参数决定一次前向实际经过的分支。",
    details: [
      d(
        "两个要解决的问题",
        "知识混杂：少数宽专家要处理多种知识，难以同时调用。知识冗余：不同专家可能重复学习共同知识。细粒度切分改善组合灵活性，共享专家为通用信息提供常驻路径。",
      ),
      d(
        "三种实验规模不能混用",
        "验证模型约 2B，在 100B Token 上训练；16B 模型实际 16.4B 总参数、2.8B 激活，训练 2T Token；145B 是 245B Token 的初步研究，不能按完整训练的 16B 结果解读。",
      ),
      d(
        "计算收益的比较条件",
        "16B 与同语料 DeepSeek 7B 的 FLOPs 比值为 74.4/183.5≈40.5%；与 LLaMA2 7B 为 74.4/187.9≈39.6%。这些是每 4K Token 的理论计算量，不直接等于端到端加速比。",
      ),
    ],
    caution:
      "本论文是 2024 年 1 月的 DeepSeekMoE，未使用 V2 的 MLA，也没有 V3 的无辅助损失路由。",
  },
  {
    id: "basics",
    title: "前置：Transformer 与 FFN",
    section: "§2 · Eq. 1–5",
    page: 4,
    scene: "architecture",
    question: "稀疏专家替换 Transformer 的哪一步？",
    intro:
      "Attention 在 Token 之间交换信息；FFN 对每个 Token 的向量单独做非线性变换。MoE 用可选择的多组 FFN 替代标准 FFN，输入输出仍保持同一隐藏维度，残差连接保留原输入。",
    details: [
      d(
        "形状逐层保持一致",
        "u₁:ₜ∈ℝᵀ×ᵈ 是注意力后的所有 Token；第 t 个 Token 的 uₜ∈ℝᵈ 进入路由层。专家内部可以先扩展到 d_ff 再返回 d，聚合后的结果仍为 d 维，才能与 uₜ 相加。",
      ),
      d(
        "线性层和非线性",
        "线性层是矩阵与向量相乘。门控 FFN 的中间激活先通过非线性，再与另一路投影逐元素相乘，最后映射回隐藏维度。本页小维 FFN 实际计算这些操作，权重是确定性教学权重。",
      ),
      d(
        "参数与计算不同",
        "未选择的专家本步不执行，却仍需存储其参数。共享专家始终执行，注意力和嵌入等常驻模块也计入激活参数，不能简单用 K/N 乘总参数得到精确激活规模。",
      ),
    ],
    caution:
      "论文式 1–5 为简洁省略归一化；图中省略一个模块不表示生产模型没有该模块。",
  },
  {
    id: "routing",
    title: "传统 MoE：亲和度与 Top-K",
    section: "§2 · Eq. 3–5",
    page: 4,
    scene: "routing",
    question: "一个输入向量如何变成可验证的稀疏路径？",
    intro:
      "Router 用当前隐藏状态与每个专家的学习向量做点积，经全体 Softmax 得到亲和度，再保留 Top-K 分支。选中专家输出乘对应门值，求和后加回输入。",
    details: [
      d(
        "概率产生",
        "每个专家分数 zᵢ=uᵀeᵢ，所有分数减去最大值后取指数并归一化。教学面板实时展示 z、s、Top-K 与输出向量，改变输入会重新计算。",
      ),
      d(
        "稀疏门不是重新归一化",
        "论文式 4 保留 sᵢ 的原值，未选分支设为 0。选中门值之和通常小于 1，不应把它无依据地归一化为 1。",
      ),
      d(
        "什么时候才执行专家",
        "只为选中专家运行 FFN；未选专家显示“未执行”。共享分支如开启，则无条件执行。最后逐维相加共享输出、路由输出与残差。",
      ),
    ],
    caution:
      "图中的专家名称与权重为教学模拟，不是论文实测专家语义或预训练激活。",
  },
  {
    id: "segmentation",
    title: "细粒度切分与组合空间",
    section: "§3.1 · Eq. 6–8 · Figure 2b",
    page: 5,
    scene: "segmentation",
    question: "把宽专家切窄，怎样同时保持参数和计算预算？",
    intro:
      "将 N 个专家的中间维度各缩小到原来的 1/m，同时把总专家数扩大到 mN、激活数扩大到 mK。总专家参数和激活专家计算大致保持不变，但路由组合更灵活。",
    details: [
      d(
        "预算守恒",
        "总专家中间维度：mN×d_ff/m=N×d_ff。每 Token 激活中间维度：mK×d_ff/m=K×d_ff。这里只讨论专家 FFN 预算，Router 和实际 Kernel 开销可能改变。",
      ),
      d(
        "可验证的组合数",
        "N=16、K=2 时 C(16,2)=120；m=2 时 C(32,4)=35960；m=4 时 C(64,8)=4426165368。本页使用二项式系数计算，修正了旧页面 m=2 的错误硬编码。",
      ),
      d(
        "论文如何验证",
        "Figure 3 在相同总参数和激活参数预算下比较共享隔离与两种细分粒度，多数指标改善。Figure 3 是归一化实验图，不能由组合数直接推断能力增长。",
      ),
    ],
    caution:
      "组合数量是结构可选集合的大小，不等于训练后所有组合均有效，更不等于模型性能提升倍数。",
  },
  {
    id: "shared",
    title: "共享专家隔离",
    section: "§3.2 · Eq. 9–11 · Figure 2c",
    page: 6,
    scene: "shared",
    question: "通用知识怎样拥有固定路径，给路由专家留出差异？",
    intro:
      "从总共 mN 个细粒度专家中隔离 Kₛ 个作为共享专家，每个 Token 始终执行它们。路由专家数降为 mN−Kₛ，路由激活数降为 mK−Kₛ，保持原定计算预算。",
    details: [
      d(
        "完整输出",
        "hₜ=uₜ+Σshared FFNᵢ(uₜ)+Σrouted gᵢ,ₜFFNᵢ(uₜ)。共享输出没有 Top-K 门值；只有路由分支乘亲和度。",
      ),
      d(
        "验证模型与 16B 配置",
        "2B 验证模型是 1 个共享 + 63 个路由、激活 7 个路由；16B 是 2 个共享 + 64 个路由、激活 6 个路由。后者为实际工程配置，不应机械套用总数 mN=64。",
      ),
      d(
        "隔离策略的先例与贡献",
        "论文将共享隔离从算法与知识分工角度分析，并注明 Rajbhandari 等已有工程先例。共享专家不保证能直接命名为某个语义类别，需通过消融与替换实验判断。",
      ),
    ],
    caution: "本论文的共享专家数量与后续 V2 的 2+160 配置不同。",
  },
  {
    id: "balance",
    title: "专家与设备负载均衡",
    section: "§3.3 · Eq. 12–17",
    page: 7,
    scene: "balance",
    question: "为什么路由既要专门化，也不能集中在少数分支？",
    intro:
      "专家塌缩会让少数专家过载、其余专家学不到充分数据。分布式训练还要求各设备计算量相近。论文使用小权重的专家均衡损失和较大的设备均衡损失，避免过强的逐专家约束损伤能力。",
    details: [
      d(
        "实际频率与平均概率",
        "fᵢ=N′/(K′T)×专家被选次数，Pᵢ 为该专家在序列上的平均亲和度。损失为 α₁ΣfᵢPᵢ；频率 f 中已含 N′，不能再多乘一个 N′。",
      ),
      d(
        "设备级汇总",
        "同设备专家的 f 求平均得到 f′，P 求和得到 P′，再计算 α₂Σf′P′。本页根据真实教学路由批次计算计数与损失，不使用写死的 GPU 利用率。",
      ),
      d(
        "实际训练条件",
        "2B 验证和 16B 在单 GPU 放置一层的全部专家，不使用设备级均衡，也不丢 Token。145B 将专家分配到 4 个设备，α₁=.003、α₂=.05。",
      ),
    ],
    caution: "DeepSeekMoE 原论文没有 V2 的设备限制路由或通信均衡损失。",
  },
  {
    id: "validation",
    title: "2B 验证实验与复现设置",
    section: "§4.1–4.3 · Tables 1–2",
    page: 10,
    scene: "evidence",
    question: "在相同数据和预算下，架构是否真的更有效？",
    intro:
      "2B 验证模型使用 9 层、隐藏维度 1280、10 个头，每头 128 维，100B 训练 Token、8K BPE 词表。对比 Dense、Hash Layer、Switch、GShard 和 DeepSeekMoE。",
    details: [
      d(
        "优化设置",
        "AdamW β₁=.9、β₂=.95、weight decay=.1；前 2K 步预热，最大 LR 1.08e−3，在训练步数 80% 和 90% 各乘 .316；Batch 2048、序列 2048、约 25K 步。",
      ),
      d(
        "公平比较的轴",
        "Table 1 中 GShard 与 DeepSeekMoE 的总参数、激活参数、4.3T FLOPs/2K Token 与数据相同。Table 2 另比较 GShard×1.5 与 Dense×16，这些预算并不相同。",
      ),
      d(
        "读懂指标",
        "Pile 用 Loss（越低越好）；HellaSwag 等用准确率；代码用 Pass@1；TriviaQA 和 NaturalQuestions 用 EM。不可把不同指标直接归一化成无来源的统一分数。",
      ),
    ],
    caution:
      "Dense×16 是作者在特定模型容量与实验设置下的参照，不是对所有 MoE 泛化性能的数学上界证明。",
  },
  {
    id: "ablation",
    title: "消融与共享比例",
    section: "§4.4 · Figure 3",
    page: 12,
    scene: "source",
    question: "细分、共享和共享比例各自贡献了什么？",
    intro:
      "作者在相同总参数与激活预算下依次引入共享隔离、更细专家，并比较不同共享/路由比例。实验支持两项策略有效；共享比例试验的差异不显著，不能把它改写成过多共享必然伤害性能。",
    details: [
      d(
        "共享隔离消融",
        "在 GShard 基础上固定一个共享专家，多数指标改善；这是与完全路由分支的受控比较。",
      ),
      d(
        "粒度消融",
        "继续将专家分成 2 或 4 个更窄单元，保持激活预算，观察组合灵活性是否转化为指标收益。",
      ),
      d(
        "原图阅读",
        "Figure 3 指标按最佳表现归一化，适合比较同一指标内的模型差异，不能当作原始准确率。另保持 64 总专家、8 激活预算，1/2/4 个共享专家的 Pile loss 分别为 1.808、1.806、1.811，原文称差异不显著；扩展模型采用共享:激活路由=1:3。",
      ),
    ],
    caution: "不从原图猜测未公开的小数，也不把理论组合数作为实验分数。",
  },
  {
    id: "specialization",
    title: "专家专业化的证据",
    section: "§4.5 · Figures 4–6",
    page: 13,
    scene: "source",
    question: "怎样检验专家是否冗余、共享分支是否可替代？",
    intro:
      "作者屏蔽高概率专家后重新选择 Top-K，用额外路由专家替换共享专家，扫描激活数，并从零训练半激活模型，检验专业化与知识冗余。这比随意贴“数学/语法”标签更可验证。",
    details: [
      d(
        "路由专家冗余",
        "Figure 4 对每个 Token 屏蔽一定比例的最高路由概率专家，再从剩余专家重新选择 Top-K，保持执行数。与初始 Pile loss 相同的 GShard×1.5 比，DeepSeekMoE 对屏蔽更敏感，支持更低冗余。",
      ),
      d(
        "共享专家不可随意替换",
        "禁用共享专家，并多激活 1 个路由专家以保持计算量，Pile loss 从 1.808 上升到 2.414，支持共享与路由分支在此模型中的功能差异。",
      ),
      d(
        "准确获取知识",
        "Figure 5 将激活路由数从 3 扫描到 7，K=4 时即达到与 GShard 相近的 Pile loss。Figure 6 另行从零训练 1 个共享 + 63 路由（仅激活 3 个路由）的模型，在相同总专家参数、半数激活专家参数下仍超过 GShard。",
      ),
    ],
    caution: "此类干预支持专业化的相对证据，不能证明所有专家知识严格不重叠。",
  },
  {
    id: "scale16",
    title: "扩展到 16B：预训练与评测",
    section: "§5 · Tables 3–4 · Appendix C",
    page: 17,
    scene: "evidence",
    question: "更大规模下，省下的 FLOPs 是否保留主要能力？",
    intro:
      "16B 采用 28 层、hidden 2048、16 个 MHA 头，除第一层外替换为 MoE。2 个共享 + 64 路由，每 Token 激活 6 个路由，训练 2T Token，词表扩至约 100K。",
    details: [
      d(
        "预算与效果",
        "相对 DeepSeek 7B，74.4T 对 183.5T FLOPs/4K Token（40.5%）。知识类任务表现突出，但 MMLU、C-Eval、CMMLU 等多选题仍较弱，作者讨论较少注意力参数的影响。",
      ),
      d(
        "与 LLaMA2 比较的条件",
        "同为 2T Token，但具体语料分布不同。数学、代码和中文数据差异会影响评测，不能将所有差距仅归因于 MoE 架构。",
      ),
      d(
        "训练过程",
        "Appendix C 的 Figure 7 展示各任务随训练 Token 的变化。完整图在 p.33 可放大阅读，不用人为生成的单调曲线代替。",
      ),
    ],
    caution:
      "论文称适当算子优化后可接近 2.5× 推理速度，但此处不据 FLOPs 比例伪造任何实测吞吐。",
  },
  {
    id: "alignment",
    title: "16B 对齐与 Chat 结果",
    section: "§6 · Table 5",
    page: 20,
    scene: "evidence",
    question: "稀疏专家是否也能从监督指令微调中受益？",
    intro:
      "作者用同一套 1.4M 中英文指令数据微调 LLaMA2 7B、DeepSeek 7B 和 DeepSeekMoE 16B。Batch 1024、8 epochs、4K packing，常数学习率 1e−5，不使用 dropout。",
    details: [
      d(
        "控制实验条件",
        "LLaMA2 SFT 7B 是作者自行用同一数据微调的基线，不是官方 LLaMA2 Chat。这样可减少指令数据差异。",
      ),
      d(
        "指标变化",
        "Table 5 的代码和数学指标显示 SFT 收益；MMLU 等多选题相对 DeepSeek Chat 7B 仍有差距。需要同时看优势和未改善的任务。",
      ),
      d(
        "评估调整",
        "Chat 不再用 Pile 纯语言建模，CHID 因结果不稳定被移除，增加 BBH；评估集合变化不能直接与 Base 平均分相减。",
      ),
    ],
    caution:
      "这篇论文研究的是 SFT，不要把 V2/R1 的 GRPO 训练流程添加为其原始方案。",
  },
  {
    id: "scale145",
    title: "145B 初步扩展",
    section: "§7 · Table 6",
    page: 23,
    scene: "evidence",
    question: "大规模结果中的“28.5% / 18.2%”分别指谁？",
    intro:
      "145B 模型实际约 144.6B 总参数、22.2B 激活，4 个共享 + 128 路由、激活 12 个路由；142.3B 半激活变体使用 2 个共享 + 6 个激活路由。两者都只训练到 245B Token。",
    details: [
      d(
        "不同模型的 FLOPs 比例",
        "145B 的 585.6T/2057.5T≈28.5%；半激活 142B 的 374.6T/2057.5T≈18.2%。不能把两个百分比都描述为同一模型的确定速度收益。",
      ),
      d(
        "模型与工程设置",
        "62 层、hidden 4096、32 个头，专家相对宽度 .125；专家分在 4 个设备，使用流水线与专家并行，设备均衡系数 .05、专家均衡 .003。",
      ),
      d(
        "仍然是初步研究",
        "Table 6 中所有对比模型使用相同 245B Token 语料设置。论文没有声称 145B 已完成与 16B 相同的 2T Token 全量训练。",
      ),
    ],
    caution:
      "保留原文 ongoing / preliminary 的结论强度；它不是 V2 的 236B 配置。",
  },
  {
    id: "formulas",
    title: "17 个公式与变量索引",
    section: "§2–3 · Eq. 1–17",
    page: 4,
    scene: "formulas",
    question: "每个符号对应哪一个张量或计数？",
    intro:
      "从普通 Transformer 残差式，到传统 MoE、细分与共享，再到两级均衡损失，原文 17 个编号公式均收录。输入隐藏状态、亲和度、稀疏门与专家输出不能混为一谈。",
    details: [
      d(
        "原始公式顺序",
        "1–2 Transformer；3–5 传统 MoE；6–8 细分；9–11 共享专家；12–14 专家均衡；15–17 设备均衡。",
      ),
      d(
        "阅读约定",
        "公式来自原始 HTML，保留原编号并链接来源。交互模拟使用小向量和确定性教学权重，不冒充原模型的真实中间状态。",
      ),
    ],
    caution: "fᵢ 已按专家数归一化，均衡损失中不要重复乘 N′。",
  },
  {
    id: "source",
    title: "全文、原图与附录档案",
    section: "§1–9 · Appendix A–C",
    page: 1,
    scene: "source",
    question: "有没有把“只列标题”误认为“已经讲透”？",
    intro:
      "这里提供整篇 33 页原图与可搜索的文字。Appendix A 的超参数表、B 的更大基线、C 的训练曲线，以及正文所有实验均可直接核对，不把虚构分数或装饰动画作为证据。",
    details: [
      d(
        "结构与证据对应",
        "正文九节与附录 A–C 按页索引。原始表 1–10 可在评测模块切换，原始图 1–7 保留所在 PDF 页面。",
      ),
      d(
        "相关工作和结论",
        "§8 比较 Hash、Switch、GShard、共享专家先例等路线；§9 总结参数效率与规模扩展。参考文献 p.24–30 保留原始来源，便于区分本论文创新与借用组件。",
      ),
    ],
    caution:
      "原图档案提供完整证据；这不意味着每条参考文献本身都被重新实现成独立模拟器。",
  },
];
const c = (
  title: string,
  what: string,
  why: string,
  how: string,
  shape: string,
  source: string,
  example?: string,
  caution?: string,
): TeachingConcept => ({
  title,
  what,
  why,
  how,
  shape,
  source,
  href: moeSource,
  example,
  caution,
});
export const moeConcepts = {
  input: c(
    "输入隐藏状态 uₜ",
    "它是当前 Token 在注意力后的特征向量，不是文字本身。",
    "路由与专家必须基于当前上下文选择处理方式。",
    "向量先与各专家的学习向量点积；选中专家再独立执行 FFN，最后结果与输入相加。",
    "真实模型 [d]；教学模拟 [3]",
    "§2 · Eq. 1–5 · PDF p.4",
    "教学输入 [0.2,0.8,−0.3]，每个坐标都参与 Router 与 FFN。",
  ),
  router: c(
    "Router：亲和度到稀疏门",
    "轻量线性评分器，用于选择当前 Token 的计算分支。",
    "执行全部专家会让计算与总参数一起增长，失去条件计算收益。",
    "zᵢ=uᵀeᵢ → 全体 Softmax → Top-K → 其余门值归零。只执行选中的 FFN。",
    "[d] × [N,d]ᵀ → [N] → K 个非零门值",
    "§2 · Eq. 3–5 · PDF p.4",
    "如果 Softmax 为 [.5,.3,.2]、K=2，门值为 [.5,.3,0]，而不是 [.625,.375,0]。",
    "原论文公式不对选中概率重新归一化。",
  ),
  expert: c(
    "专家 FFN：真正执行的分支",
    "每个专家结构相似，但具有自己的权重。",
    "分支可以在训练中学习互补的变换；未选专家保留参数但本步不计算。",
    "输入投影到中间维，非线性门控，再投影回 d；输出乘路由门值后参与聚合。",
    "[d] → [d_ff] → [d]",
    "§2–3 · Eq. 3–11 · PDF p.4–6",
    "本页只计算选中分支，框内“未执行”不是算完后丢掉结果。",
    "专家是否对应可命名语义需要实验，不能看颜色就判断数学/语法专家。",
  ),
  shared: c(
    "共享专家：固定执行路径",
    "不参加 Top-K 竞争，任何 Token 都会执行的 FFN 分支。",
    "为跨输入的公共知识提供固定容量，减轻路由专家重复学习。",
    "单独运行 Kₛ 个共享 FFN，不乘路由 gate；与路由加权和、残差相加。",
    "shared [Kₛ,d] → Σ [d]",
    "§3.2 · Eq. 9–11 · PDF p.6",
    "2B 验证是 1 个共享 + 7 个激活路由，16B 是 2 个共享 + 6 个激活路由。",
    "“公共知识”是设计动机，不表示每个共享专家已被验证为某个固定概念。",
  ),
  output: c(
    "聚合与残差输出",
    "把各条实际计算路径合并回原隐藏维度。",
    "后续 Transformer 层需要同维度输入，残差保留本层输入信息。",
    "逐维计算 hⱼ=uⱼ+sharedⱼ+ΣᵢgᵢFFNᵢ(u)ⱼ；本页数值按此式实时重算。",
    "[d] + [d] + [d] → [d]",
    "§2–3 · Eq. 3 / 9 · PDF p.4 / 6",
    "若输入某维 .2，共享贡献 .1，路由贡献−.03，则输出该维 .27。",
  ),
  balance: c(
    "负载均衡：频率与概率共同约束",
    "抑制所有输入都流向少数专家的辅助训练目标。",
    "路由塌缩会让部分专家缺少训练；设备负载不均还会产生等待。",
    "统计 T 个 Token 的选中次数得到 fᵢ，再统计平均亲和度 Pᵢ，计算 αΣfᵢPᵢ。设备级将同设备专家汇总。",
    "fᵢ=N′/(K′T)×countᵢ；Pᵢ=meanₜ(sᵢₜ)",
    "§3.3 · Eq. 12–17 · PDF p.7",
    "两个专家、两个 Token 各选一次，则 f=[1,1]；概率各 .5，α=.01 时损失 .01。",
    "f 已包含 N′，不能在损失外再次乘 N′；均衡是软约束，不强制严格均分。",
  ),
  combination: c(
    "二项式组合空间",
    "从 N 个候选中无序选 K 个的理论集合大小。",
    "细粒度分支让相同激活宽度预算具有更多组合选择。",
    "C(N,K)=N!/[K!(N−K)!]；本页用整数乘除逐项计算，避免错误硬编码。",
    "N=16m，K=2m，专家宽度=原宽/m",
    "§3.1 · Figure 2 · PDF p.5–6",
    "m=2 时 C(32,4)=35960；m=4 时 C(64,8)=4426165368。",
    "组合数量不是训练后的有效能力或加速倍数。",
  ),
};
export const moeSourceEntries = moeLessons
  .filter((l) => !["formulas", "source"].includes(l.id))
  .map((l) => ({
    id: l.id,
    title: l.title,
    page: l.page,
    description: l.section,
  }))
  .concat([
    {
      id: "hyper",
      title: "附录 A · Table 7",
      page: 31,
      description: "三个规模完整超参数",
    },
    {
      id: "larger",
      title: "附录 B · Tables 8–10",
      page: 32,
      description: "更大 GShard / Dense 基线",
    },
    {
      id: "curves",
      title: "附录 C · Figure 7",
      page: 33,
      description: "16B 全部训练基准曲线",
    },
  ]);

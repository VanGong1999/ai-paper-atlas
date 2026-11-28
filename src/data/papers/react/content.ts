import type { AlfworldRow, Chapter, CourseStep, Evidence, ModelRow, TableRow, TrajectoryEvent } from './types'

const source = (page: number, locator: string, note: string): Evidence => ({ page, locator, note })

const step = (chapter: string, index: number, title: string, kicker: string, summary: string, firstPrinciples: string, importance: string, stage: CourseStep['stage'], page: number, locator: string, tags: string[]): CourseStep => ({
  id: `${chapter}-${index}`,
  title,
  kicker,
  summary,
  firstPrinciples,
  importance,
  stage,
  evidence: source(page, locator, `${locator} · PDF p.${page}`),
  tags,
})

export const reactChapters: Chapter[] = [
  {
    id: 'overview', number: '01', title: '论文速览与第一性原理', subtitle: '先把“想”和“做”放进同一条轨迹',
    steps: [
      step('overview', 1, 'ReAct 是什么？', 'ABSTRACT · 核心定义', '让语言模型交错生成 reasoning traces 与 task-specific actions，让推理和行动互相提供信息。', '如果模型只在脑内推理，它看不到外部新事实；如果它只行动，它很难维护子目标。ReAct 把二者放在同一个可观察的序列里。', '这是整篇论文的最小心智模型。', 'overview', 1, 'Abstract', ['ReAct', 'Reasoning', 'Acting']),
      step('overview', 2, '人类“想 + 做”的闭环', 'FIRST PRINCIPLES · 厨房例子', '人类会在动作之间检查进度、处理例外、查外部信息，再调整下一步。', 'Thought 是工作记忆的语言化版本；Action 是对世界的探测或改变；Observation 是世界返回的约束。', 'ReAct 不是凭空增加思维链，而是把思维链接回环境。', 'loop', 1, 'Introduction · cooking example', ['working memory', 'planning']),
      step('overview', 3, 'CoT 为什么会幻觉？', 'MOTIVATION · Reason only', 'Chain-of-thought 能展开结构，却是静态黑盒，事实可能从第一步错到最后。', '没有外部 observation 时，后续 token 只能把先前猜测当成事实；错误会被语言流畅性掩盖。', '论文把 hallucination 与 error propagation 作为 ReAct 的首要靶点。', 'compare', 2, 'Figure 1 (1b)', ['CoT', 'hallucination']),
      step('overview', 4, 'Act-only 为什么会迷路？', 'MOTIVATION · Action only', '有动作不等于有计划；模型可能重复尝试一个已经证伪的动作。', 'Action-only 把“下一步该做什么”压缩成隐式映射，缺少显式的子目标和状态总结。', '这解释了为什么 ALFWorld 中重复取不存在的物品。', 'compare', 2, 'Figure 1 (2a)', ['Act', 'state']),
      step('overview', 5, 'Reason to Act / Act to Reason', 'CORE INSIGHT · 双向协同', 'Reasoning 生成计划，acting 获取证据；证据再让 reasoning 更新计划。', '推理不是行动的替代品，而是行动的选择器；行动也不是推理的终点，而是知识采样器。', '这两个方向就是 ReAct 的“协同”来源。', 'loop', 3, 'Introduction · ReAct paradigm', ['synergy', 'grounding']),
      step('overview', 6, '四个任务，一种范式', 'RESULTS · 任务谱系', 'HotpotQA、FEVER、ALFWorld、WebShop 覆盖知识问答、事实核验、文本游戏和网页导航。', '同一个思想只需替换 action space 与 observation，不需要为每个任务设计全新推理模块。', '泛化性是论文相对于任务专用 agent 的核心卖点。', 'overview', 3, 'Introduction · four benchmarks', ['HotpotQA', 'FEVER', 'ALFWorld', 'WebShop']),
      step('overview', 7, '读完你应该带走什么？', 'COURSE MAP · 7 章路线', '从提示格式到微调 scaling，从 Wikipedia 到真实购物环境，逐层验证“想 + 做”。', '课程先建立循环，再看数字，最后回到局限：这样每个结果都有机制解释。', '它把论文 33 页压缩成可操作的证据链。', 'overview', 3, 'Contributions', ['map', 'evidence']),
    ],
  },
  {
    id: 'motivation', number: '02', title: '问题定义与动机', subtitle: '为什么单纯推理或行动都不够',
    steps: [
      step('motivation', 1, 'Agent context 与 policy', 'SECTION 2 · 问题定义', 'agent 在时刻 t 看到 observation，并依据上下文选择 action。', '当 `c_t → a_t` 的映射需要复杂计算时，模型容易把历史压扁成错误的隐式状态。', '这是论文把 ReAct 形式化为序列决策问题的起点。', 'loop', 3, 'Section 2 · general setup', ['context', 'policy']),
      step('motivation', 2, '四种 Prompting 方法分叉', 'FIGURE 1 · 对照实验', 'Standard、CoT、Act-only 和 ReAct 只保留不同的轨迹元素。', '控制变量越少，越能看到 Thought 和 Observation 各自贡献什么。', '后面的 Table 1 正是这张分叉图的量化版。', 'compare', 2, 'Figure 1 (1)', ['Standard', 'CoT', 'Act', 'ReAct']),
      step('motivation', 3, 'HotpotQA：Apple Remote', 'FIGURE 1 · 多跳问答', 'ReAct 先搜索 Apple Remote，再根据结果搜索 Front Row，最后得到 keyboard function keys。', '每次 Observation 都把下一次搜索从猜测变成有条件的选择。', '它展示了“推理指导检索，检索纠正推理”。', 'wikipedia', 2, 'Figure 1 (1d)', ['HotpotQA', 'multi-hop']),
      step('motivation', 4, 'ALFWorld：Pepper shaker', 'FIGURE 1 · 交互决策', 'Act-only 在 sinkbasin 1 找不到 pepper shaker 后仍重复同一动作；ReAct 会改写搜索计划。', '失败 observation 只有在被语言化、写进上下文时，才会成为下一步的约束。', '这是“丢失状态”的最直观案例。', 'alfworld', 2, 'Figure 1 (2)', ['ALFWorld', 'failure']),
      step('motivation', 5, '三类失败模式', 'INTRODUCTION · 失败诊断', '幻觉、错误传播、状态丢失分别对应知识不落地、错误不断复用、环境反馈未被记住。', '把失败拆开，才能把改进归因到 grounding、working memory 或 planning。', '后面的 Table 2 会验证这些不是抽象担忧。', 'compare', 2, 'Introduction · failure modes', ['hallucination', 'error propagation', 'state loss']),
      step('motivation', 6, '为什么两边都要？', 'FIRST PRINCIPLES · 互补性', 'Reasoning 擅长抽象计划，Acting 擅长获得新信息；单独使用会暴露另一半的缺口。', '把两个有限能力串起来，比单独扩大任一能力更稳定。', '这是 ReAct 的设计必要性，而不是装饰性格式。', 'loop', 3, 'Introduction · synergy', ['complementary']),
      step('motivation', 7, '论文研究问题', 'INTRODUCTION · CONTRIBUTIONS', '论文问：能否用 few-shot prompt 在不同任务上同时生成可解释的推理与行动？', '如果同一机制在 QA 和交互环境都有效，说明它不是某个数据集的特例。', '贡献清单定义了后续实验的评价维度：性能、可解释性、诊断性、可控性。', 'overview', 3, 'Introduction · contributions', ['research question']),
    ],
  },
  {
    id: 'paradigm', number: '03', title: 'ReAct 核心范式', subtitle: '把语言也当成动作空间的一部分',
    steps: [
      step('paradigm', 1, '动作空间扩展 Â = A ∪ L', 'SECTION 2 · 形式化', '在环境动作 A 之外加入语言空间 L，Thought 不改变外部环境。', '语言动作的价值不是改变世界，而是改变 agent 的 context，保存可复用的中间状态。', '这个公式解释了 ReAct 为什么能兼容 QA 与游戏。', 'loop', 3, 'Section 2 · augmented action space', ['A ∪ L', 'language']),
      step('paradigm', 2, 'Thought → Action → Observation', 'TRAJECTORY · 闭环', 'Thought 计划，Action 探索或操作，Observation 返回世界状态。', '这是一个带反馈的控制回路；任何一步都可能改变后续决策。', '播放器会把这条链逐帧展开。', 'loop', 3, 'Figure 1 / Section 2', ['Thought', 'Action', 'Observation']),
      step('paradigm', 3, 'Thought 如何更新 context？', 'SECTION 2 · 上下文', '语言 thought 被追加到 `c_{t+1} = (c_t, â_t)`，但不会触发环境反馈。', 'Thought 像在白板上写下假设；Observation 则像世界在白板上写下事实。', '区分两者能理解 ReAct 的可解释性。', 'loop', 3, 'Section 2 · context update', ['context update']),
      step('paradigm', 4, 'Dense Thought vs Sparse Thought', 'SECTION 2 · 任务适配', '知识推理任务交替生成密集 Thought；长时域决策任务让模型在关键位置稀疏思考。', '推理密度应匹配决策需求：每一步都要算的 QA 需要密集轨迹，动作很多的游戏需要节省轨迹预算。', '这是 ReAct 不是固定模板的证据。', 'compare', 4, 'Section 2 · sparse thoughts', ['dense', 'sparse']),
      step('paradigm', 5, 'Thought 的五种用途', 'SECTION 2 · 设计空间', '分解目标、抽取观察、注入常识、处理例外、合成答案/计划。', '语言空间无限，但这些用途把它锚定在可检查的中间任务上。', '它解释了为什么 Thought 不只是“把 CoT 放进去”。', 'overview', 4, 'Section 2 · useful thoughts', ['decompose', 'extract', 'commonsense']),
      step('paradigm', 6, '四个设计原则', 'SECTION 2 · INTUITIVE / GENERAL / PERFORMANT / HUMAN-ALIGNED', 'Prompt 直观易写、任务通用、性能稳健、可被人检查与纠正。', '一个好的 agent 接口要同时服务模型和人：结构足够约束，但仍保留语言的灵活性。', '这些原则贯穿所有实验与局限分析。', 'overview', 4, 'Section 2 · unique features', ['intuitive', 'general', 'performant', 'human-aligned']),
      step('paradigm', 7, 'Few-shot：把人类轨迹当示范', 'SECTION 2 · PROMPT DESIGN', 'PaLM-540B 用 1–6 个 in-context 人类轨迹示范 Thought、Action、Observation 的格式。', '示范不是把答案写死，而是告诉模型“什么时候思考、什么时候行动、如何读观察”。', '这解释了 prompt-only ReAct 的低数据成本。', 'overview', 4, 'Section 2 / Appendix C', ['PaLM-540B', 'few-shot']),
    ],
  },
  {
    id: 'knowledge', number: '04', title: '知识密集型推理', subtitle: 'HotpotQA + FEVER：用外部证据对抗幻觉',
    steps: [
      step('knowledge', 1, 'HotpotQA 与 FEVER', 'SECTION 3 · TASKS', 'HotpotQA 要跨两个以上 Wikipedia 段落多跳推理；FEVER 要判断 SUPPORTS / REFUTES / NOT ENOUGH INFO。', '两者都只给问题/claim，不给支持段落，模型必须检索或依赖内部知识。', '这让 grounding 的价值可以被单独观察。', 'overview', 4, 'Section 3.1 · Domains', ['HotpotQA', 'FEVER']),
      step('knowledge', 2, 'Wikipedia API 三个动作', 'SECTION 3.1 · ACTION SPACE', 'search 返回实体页前 5 句或相似实体；lookup 找包含字符串的下一句；finish 提交答案。', '动作空间刻意弱：模型不能一次拿到整页，必须用语言推理决定搜什么。', '弱工具反而让“推理指导检索”可见。', 'wikipedia', 4, 'Section 3.1 · Action Space', ['search', 'lookup', 'finish']),
      step('knowledge', 3, 'Apple Remote 多跳轨迹', 'FIGURE 1 · TRAJECTORY', '从 Apple Remote → Front Row → keyboard function keys，Thought 和 Observation 交替锁定实体。', '每个 action 都是一次信息获取实验；每个 observation 都缩小答案空间。', '这是 ReAct 轨迹最典型的可视化。', 'wikipedia', 2, 'Figure 1 (1d)', ['trajectory', 'multi-hop']),
      step('knowledge', 4, 'Table 1：Prompting 结果', 'TABLE 1 · FULL DATA', 'HotpotQA 用 EM，FEVER 用 Accuracy；ReAct+CoT-SC 组合达到最好 prompting 结果。', '同一张表同时展示纯内部知识、纯外部行动和两者组合的边界。', '点击数字可以查看指标定义与 PDF 位置。', 'table1', 5, 'Table 1', ['table', 'EM', 'Accuracy']),
      step('knowledge', 5, 'Table 2：成功与失败模式', 'TABLE 2 · HUMAN ANALYSIS', 'ReAct 的 hallucinated false positive 为 6%，CoT 为 14%；CoT 的 hallucination 占失败 56%。', 'grounding 降低“说得像真的”错误，但引入 search error 和 reasoning error 的新风险。', 'ReAct 的优势不是无错，而是错误类型更可诊断。', 'table2', 6, 'Table 2', ['hallucination', 'search error']),
      step('knowledge', 6, 'CoT-SC ↔ ReAct 切换', 'SECTION 3.2 · COMBINATION', 'ReAct 超过步数未答出时退回 CoT-SC；CoT-SC 多数票不足 n/2 时转向 ReAct。', '内部知识不自信时需要外部证据；外部搜索卡住时需要内部推理补全。', 'Figure 2 显示组合策略用 3–5 个样本接近 CoT-SC 的 21 个样本表现。', 'compare', 5, 'Section 3.2 / Figure 2', ['CoT-SC', 'switching']),
      step('knowledge', 7, 'Scaling：微调让 ReAct 反超', 'FIGURE 3 · FINETUNING', 'Prompting 时小模型学 ReAct 更难；用 3,000 条正确轨迹微调后，ReAct 在 PaLM-8/62B 上成为最佳。', '微调学到的是“如何检索并推理”的通用技能，不只是记忆可能过时的事实。', '这是论文对 prompt-only 局限的关键回应。', 'scale', 7, 'Figure 3 / Appendix B.1', ['scaling', 'finetune']),
    ],
  },
  {
    id: 'decision', number: '05', title: '交互决策任务', subtitle: 'ALFWorld + WebShop：稀疏思考驱动长时域行动',
    steps: [
      step('decision', 1, 'ALFWorld 的六类任务', 'SECTION 4 · TEXT GAME', 'Pick、Clean、Heat、Cool、Look、Pick 2 要求 agent 在超过 50 个位置中寻找并操作物体。', '长时域任务的难点不是单次动作，而是持续维护子目标、位置假设和已完成状态。', '它为 sparse Thought 提供了天然测试场。', 'alfworld', 7, 'Section 4 · ALFWorld', ['Pick', 'Clean', 'Heat', 'Cool', 'Look', 'Pick 2']),
      step('decision', 2, 'Sparse Thought 如何拆解子目标', 'ALFWORLD · REACT PROMPT', 'ReAct 的 Thought 只在分解目标、追踪完成、选择下一子目标、调用常识时出现。', '把所有 observation 都复述一遍会浪费上下文；只在决策分叉处写下压缩状态。', '这就是“稀疏不是少想，而是想在关键处”。', 'alfworld', 7, 'Section 4 / Appendix C.4', ['sparse thought', 'subgoal']),
      step('decision', 3, 'Table 3：六类成功率', 'TABLE 3 · ALFWORLD', 'ReAct best-of-6 总体 71%，Act 45%，BUTLER 37%，ReAct-IM 53%。', '同一任务、同一动作轨迹，只拿掉 Thought，就能测出“想”的增量。', '它是论文最强的交互任务证据。', 'table2', 8, 'Table 3', ['success rate', 'BUTLER']),
      step('decision', 4, 'WebShop：从指令到商品', 'SECTION 4 · WEB NAVIGATION', '在 1.18M 商品、12k 指令的噪声网页环境中，agent 需要搜索、选商品、选项并购买。', '网页观测既有结构化选项又有自然语言噪声，Thought 用来把用户约束映射到候选商品。', '它把 ReAct 从合成游戏推进到真实世界文本交互。', 'webshop', 7, 'Section 4 · WebShop', ['WebShop', 'grounding']),
      step('decision', 5, 'Table 4：Score 与 Success Rate', 'TABLE 4 · WEBSHOP', 'ReAct 达到 Score 66.6 / SR 40.0，相比 IL+RL 的 SR 28.7 绝对提升 10 个百分点以上。', 'Score 衡量属性覆盖，SR 衡量是否全部满足；两者分别反映“部分对”和“完全对”。', '点击数字查看指标定义和原文表格。', 'table1', 8, 'Table 4', ['Score', 'SR']),
      step('decision', 6, 'ReAct vs ReAct-IM', 'ABLATION · INTERNAL REASONING', 'ReAct-IM 只允许基于外部反馈的密集“内心独白”，总体 53%，低于 ReAct 的 71%。', '反馈复述告诉你发生了什么，不能自动告诉你下一个高层子目标是什么。', '内部常识与灵活思考是交互成功的关键。', 'ablation', 8, 'Section 4 · ReAct-IM', ['ReAct-IM', 'ablation']),
      step('decision', 7, '为什么稀疏内部推理更强？', 'FIRST PRINCIPLES · DIAGNOSIS', 'ReAct-IM 常错在子目标是否完成、下一步是什么、物体可能在哪里。', '高层计划是压缩搜索空间的先验；密集反馈如果没有计划，只会把噪声更快地写进上下文。', '这把 Table 3 的数字还原成机制解释。', 'compare', 8, 'Section 4 · observations', ['planning', 'commonsense']),
    ],
  },
  {
    id: 'analysis', number: '06', title: '深入分析与人类协作', subtitle: '看清收益、代价和可控性',
    steps: [
      step('analysis', 1, 'Grounding vs Hallucination', 'TABLE 2 · ERROR TRADE-OFF', 'ReAct 更 grounded、更可信，但 reasoning error 比 CoT 更高。', '连接外部世界减少虚构事实，却让 agent 暴露在搜索质量和动作格式的约束下。', '好的系统不是只追求一个分数，而是让错误可定位。', 'compare', 6, 'Table 2 / Section 3.3', ['grounding', 'hallucination']),
      step('analysis', 2, '搜索失败如何击穿推理？', 'TABLE 2 · SEARCH ERROR', 'ReAct 的 23% 错误来自空搜索或无用结果，模型很难恢复并改写思路。', '外部工具是传感器；传感器失灵时，计划需要一个 fallback，否则错误 observation 会变成错误信念。', '这正是组合 CoT-SC→ReAct / ReAct→CoT-SC 的动机。', 'wikipedia', 6, 'Table 2 / Section 3.3', ['search failure', 'reformulation']),
      step('analysis', 3, 'Figure 4：追上过时标签', 'APPENDIX A.2 · UP-TO-DATE', 'HotpotQA 标签可能过时；ReAct 通过真实网页证据得到 3,104，而旧标签是 2,664。', '外部交互的价值不仅是准确，还包括时间新鲜度；但数据集标签也会成为评价瓶颈。', '它提醒我们“正确答案”依赖数据构建时间。', 'compare', 14, 'Figure 4', ['up-to-date', 'dataset label']),
      step('analysis', 4, 'Figure 5：人类编辑 Thought', 'APPENDIX A.3 · HUMAN-IN-THE-LOOP', '删掉一次幻觉 Thought，并在下一次 Thought 中加入位置提示，轨迹就从失败切到成功。', '编辑 belief/state 比逐个手写几十个动作更高杠杆；语言是人类修改 agent 策略的接口。', '这是可解释性之外的“可控制性”证据。', 'ablation', 15, 'Figure 5', ['human-in-the-loop', 'thought edit']),
      step('analysis', 5, 'Prompting vs Fine-tuning', 'APPENDIX B.1 · TRAINING', 'PaLM-8B/62B 用 3,000 条轨迹微调；ReAct/Act 对更多训练步受益，Standard/CoT 很快退化。', '行为数据教模型学策略，事实记忆则更容易过时；因此微调 ReAct 的收益来自可迁移的检索-推理技能。', '它把方法从手工 prompt 推向可扩展训练。', 'scale', 15, 'Appendix B.1', ['training', '3,000 trajectories']),
      step('analysis', 6, '当前局限', 'SECTION 6 · LIMITATIONS', 'Prompting 只能支持示范覆盖到的 reasoning/acting 行为，贪心解码还会造成重复循环。', '语言空间虽灵活，但 few-shot 学习的行为分布仍有限；更强解码、更多数据、微调和 RL 是自然延伸。', '论文的强点与边界要一起读。', 'overview', 10, 'Section 6', ['limitations', 'greedy decoding']),
      step('analysis', 7, '伦理与安全声明', 'SECTION 6 · ETHICS', '实验使用 Wikipedia/WebShop 等公开环境，动作空间不包含真实购买或危险行为。', '可控的 action space 是 agent 研究的安全护栏；真实部署需额外权限、监控和人类干预。', '论文明确把安全边界放进实验设计。', 'overview', 10, 'Section 6 · ethics', ['safety', 'control']),
    ],
  },
  {
    id: 'appendix', number: '07', title: '相关工作、附录与结论', subtitle: '把 ReAct 放回研究谱系',
    steps: [
      step('appendix', 1, 'Related work 定位图', 'SECTION 5 · NEIGHBORS', 'CoT/STaR/Scratchpad 侧重推理，WebGPT 侧重网页行动，SayCan/Inner Monologue 侧重 embodied acting。', 'ReAct 的独特位置是让语言推理与环境行动在同一 closed loop 中互相条件化。', '定位图帮助你区分“相关”与“相同”。', 'related', 9, 'Section 5', ['CoT', 'WebGPT', 'SayCan', 'STaR']),
      step('appendix', 2, 'ReAct 与其他方法的边界', 'SECTION 5 · COMPARISON', '它不是专用 controller、不是纯 CoT、也不是只读 observation 的 Inner Monologue。', '关键判据是 Thought 是否能自由表达计划、常识和例外，并真正影响下一个 Action。', '这是复现或改造 ReAct 时最重要的接口定义。', 'related', 9, 'Section 5', ['Inner Monologue', 'controller']),
      step('appendix', 3, 'GPT-3 Table 5', 'APPENDIX A.1 · GENERALITY', 'GPT-3 在 HotpotQA 达到 30.8 EM、ALFWorld 78.4%，高于 PaLM-540B 的 29.4/70.9。', 'ReAct 的格式不是 PaLM 专属能力，模型的 instruction following 也会影响结果。', '它是跨模型泛化的额外证据。', 'table1', 14, 'Table 5', ['GPT-3', 'generality']),
      step('appendix', 4, '训练与 ReAct-IM 细节', 'APPENDIX B · REPRODUCTION', 'batch size 64；PaLM-8B/62B 的 ReAct/Act 训练步数为 4,000，Standard/CoT 更少。', '消融必须控制数据来源与轨迹结构，否则无法把差异归因到 Thought。', '这些细节是复现实验时的隐藏地基。', 'appendix', 15, 'Appendix B.1-B.2', ['batch size', 'reproduction']),
      step('appendix', 5, '完整 Prompt 示例', 'APPENDIX C · PROMPTS', 'HotpotQA、FEVER、WebShop、ALFWorld 的 prompt 与示范轨迹可折叠展开。', 'Prompt 不是黑盒配置，而是论文方法的一部分；看示范才能理解 Thought 的具体语法。', '课程保留原文入口，避免只记结论不记条件。', 'appendix', 16, 'Appendix C', ['prompts', 'few-shot']),
      step('appendix', 6, '额外轨迹与案例', 'APPENDIX D-E · TRAJECTORIES', '附录给出 FEVER、ALFWorld、WebShop 以及错误模式的完整轨迹。', '案例把“成功率”翻译成可检查的行为：哪里分解目标、哪里搜索、哪里重复或恢复。', '这让读者能从数字回到过程。', 'appendix', 25, 'Appendix D-E', ['trajectories', 'cases']),
      step('appendix', 7, 'Conclusion：协同范式', 'CONCLUSION · TAKEAWAY', 'ReAct 用少量示范把 reasoning traces 与 actions 结合，提升性能、可解释性、可信度和诊断性。', '推理让行动有方向，行动让推理接触事实；两者互相校正，才适合开放世界任务。', '这是整篇论文最短、也最值得复用的结论。', 'overview', 10, 'Conclusion', ['conclusion', 'takeaway']),
    ],
  },
]

export const reactTable1: TableRow[] = [
  { method: 'Standard', values: [28.7, 57.1] },
  { method: 'CoT', values: [29.4, 56.3] },
  { method: 'CoT-SC', values: [33.4, 60.4] },
  { method: 'Act', values: [25.7, 58.9] },
  { method: 'ReAct', values: [27.4, 60.9] },
  { method: 'CoT-SC→ReAct', values: [34.2, 64.6] },
  { method: 'ReAct→CoT-SC', values: [35.1, 62.0] },
  { method: 'Supervised SoTA', values: [67.5, 89.5] },
]

export const reactTable2 = [
  { type: 'Success · True positive', definition: 'Correct reasoning trace and facts', react: 94, cot: 86 },
  { type: 'Success · False positive', definition: 'Hallucinated reasoning trace or facts', react: 6, cot: 14 },
  { type: 'Failure · Reasoning error', definition: 'Wrong reasoning trace, including repetitive steps', react: 47, cot: 16 },
  { type: 'Failure · Search result error', definition: 'Search returns empty or no useful information', react: 23, cot: null },
  { type: 'Failure · Hallucination', definition: 'Hallucinated reasoning trace or facts', react: 0, cot: 56 },
  { type: 'Failure · Label ambiguity', definition: 'Right prediction but did not match label precisely', react: 29, cot: 28 },
]

export const reactTable3: AlfworldRow[] = [
  { method: 'Act (best of 6)', values: [88, 42, 74, 67, 72, 41, 45] },
  { method: 'ReAct (avg)', values: [65, 39, 83, 76, 55, 24, 57] },
  { method: 'ReAct (best of 6)', values: [92, 58, 96, 86, 78, 41, 71] },
  { method: 'ReAct-IM (avg)', values: [55, 59, 60, 55, 23, 24, 48] },
  { method: 'ReAct-IM (best of 6)', values: [62, 68, 87, 57, 39, 33, 53] },
  { method: 'BUTLERᵍ (best of 8)', values: [33, 26, 70, 76, 17, 12, 22] },
  { method: 'BUTLER (best of 8)', values: [46, 39, 74, 100, 22, 24, 37] },
]

export const reactTable4: TableRow[] = [
  { method: 'Act', values: [62.3, 30.1] },
  { method: 'ReAct', values: [66.6, 40.0] },
  { method: 'IL', values: [59.9, 29.1] },
  { method: 'IL+RL', values: [62.4, 28.7] },
  { method: 'Human Expert', values: [82.1, 59.6] },
]

export const reactTable5: ModelRow[] = [
  { model: 'PaLM-540B', values: [29.4, 70.9] },
  { model: 'GPT-3', values: [30.8, 78.4] },
]

export const reactTrajectories: Record<string, TrajectoryEvent[]> = {
  appleRemote: [
    { kind: 'thought', label: 'Thought 1', text: 'I need to search Apple Remote and find the program it was originally designed to interact with.' },
    { kind: 'action', label: 'Action 1', text: 'Search[Apple Remote]' },
    { kind: 'observation', label: 'Observation 1', text: 'The Apple Remote is a remote control introduced in October 2005 by Apple … originally designed to control the Front Row media center program.' },
    { kind: 'thought', label: 'Thought 2', text: 'Apple Remote was originally designed to control Front Row. I need to search Front Row next.' },
    { kind: 'action', label: 'Action 2', text: 'Search[Front Row]' },
    { kind: 'observation', label: 'Observation 2', text: 'Could not find [Front Row]. Similar: Front Row (software) …' },
    { kind: 'thought', label: 'Thought 3', text: 'Front Row is not found. I need to search Front Row (software).' },
    { kind: 'action', label: 'Action 3', text: 'Search[Front Row (software)]' },
    { kind: 'observation', label: 'Observation 3', text: 'Front Row is a discontinued media center software … controlled by an Apple Remote or the keyboard function keys.' },
    { kind: 'thought', label: 'Thought 4', text: 'So the answer is keyboard function keys.' },
    { kind: 'answer', label: 'Action 4', text: 'Finish[keyboard function keys]' },
  ],
  pepperShaker: [
    { kind: 'thought', label: 'Thought 1', text: 'I need to find a pepper shaker. It is more likely to appear in cabinets, countertops, or shelves.' },
    { kind: 'action', label: 'Action 1', text: 'Go to cabinet 1' },
    { kind: 'observation', label: 'Observation 2', text: 'On cabinet 1, you see a vase 2.' },
    { kind: 'action', label: 'Action 6', text: 'Go to countertop 3' },
    { kind: 'observation', label: 'Observation 6', text: 'On countertop 3, you see an apple, bread, pepper shaker, and vase.' },
    { kind: 'action', label: 'Action 7', text: 'Take pepper shaker 1 from countertop 3' },
    { kind: 'observation', label: 'Observation 7', text: 'You pick up the pepper shaker 1 from countertop 3.' },
    { kind: 'thought', label: 'Thought 8', text: 'Now I find a pepper shaker 1. Next, I need to put it in drawer 1.' },
    { kind: 'action', label: 'Action 11', text: 'Put pepper shaker 1 in/on drawer 1' },
    { kind: 'answer', label: 'Observation 11', text: 'You put pepper shaker 1 in/on drawer 1.' },
  ],
}

export const reactEvidence = reactChapters.flatMap(chapter => chapter.steps.map(s => ({ id: s.id, ...s.evidence })))

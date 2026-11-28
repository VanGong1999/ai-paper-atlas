import { useMemo, useState } from 'react'

type SceneProps = { playing: boolean; onHover: (id: string) => void }
const logits = [6.2, 2.8, 2.1, 1.2, 0.2, -0.8]
const labels = ['BMW', '垃圾车', '轿车', '胡萝卜', '狗', '飞机']
const softmax = (xs: number[], temperature: number) => {
  const exps = xs.map(value => Math.exp(value / temperature))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(value => value / sum)
}

export function KDScene({ scene, playing, onHover }: SceneProps & { scene: string }) {
  if (scene === 'temperature') return <TemperatureScene onHover={onHover} />
  if (scene === 'loss' || scene === 't2') return <LossScene onHover={onHover} />
  if (scene === 'calculation') return <CalculationScene onHover={onHover} />
  if (scene === 'match') return <MatchScene onHover={onHover} />
  if (scene === 'numbers') return <MNISTScene onHover={onHover} />
  if (scene === 'confusable') return <SpecialistScene onHover={onHover} />
  if (scene === 'speech-results') return <SpeechScene onHover={onHover} />
  if (scene === 'pytorch') return <FlowScene playing={playing} onHover={onHover} />
  if (scene === 'bmw') return <FlowScene playing={playing} onHover={onHover} />
  if (scene === 'convergence') return <ConvergenceScene playing={playing} onHover={onHover} />
  if (scene === 'taxonomy') return <TaxonomyScene onHover={onHover} />
  if (scene === 'variants') return <VariantsScene onHover={onHover} />
  if (scene === 'history') return <HistoryScene onHover={onHover} />
  if (scene === 'compression-map') return <CompressionMapScene onHover={onHover} />
  if (scene === 'metrics') return <MetricsScene onHover={onHover} />
  if (['transfer-details', 'mnist-edge', 'speech-detail', 'jft-details', 'jft-results'].includes(scene)) return <DetailedEvidenceScene scene={scene} onHover={onHover} />
  return <OverviewScene playing={playing} onHover={onHover} />
}

function TemperatureScene({ onHover }: { onHover: (id: string) => void }) {
  const [temperature, setTemperature] = useState(4)
  const probs = useMemo(() => softmax(logits, temperature), [temperature])
  return <div className="kd-sandbox kd-temperature" onMouseLeave={() => onHover('')}>
    <div className="kd-sandbox-title"><strong>SOFTMAX / DARK KNOWLEDGE</strong><span>固定 logits · 实时计算</span></div>
    <label className="kd-slider">Temperature T <b>{temperature.toFixed(1)}</b><input type="range" min="1" max="20" step="0.5" value={temperature} onChange={event => setTemperature(Number(event.target.value))} /></label>
    <div className="kd-bars">{probs.map((value, index) => <button type="button" key={labels[index]} className={index === 0 ? 'top' : ''} onMouseEnter={() => onHover(index === 0 ? 'soft' : 'dark')}><span>{labels[index]}</span><i style={{ height: `${Math.max(3, value * 190)}px` }} /><small>{(value * 100).toFixed(1)}%</small></button>)}</div>
    <div className="kd-caption"><b>T 越高：</b>冠军仍是 BMW，但垃圾车、轿车之间的相对差异更容易观察；这就是 dark knowledge。</div>
  </div>
}

function FlowScene({ playing, onHover }: SceneProps) {
  const [mode, setMode] = useState<'hard' | 'soft' | 'mix'>('mix')
  return <div className="kd-sandbox kd-flow" onMouseLeave={() => onHover('')}>
    <div className="kd-sandbox-title"><strong>FIG. 1 · TEACHER / STUDENT DISTILLATION FLOW</strong><span>{playing ? '● knowledge flowing' : 'Ⅱ paused'}</span></div>
    <div className="kd-ref-diagram">
      <button type="button" className="kd-ref-input" onMouseEnter={() => onHover('input')}>input<br /><b>x</b></button>
      <div className="kd-ref-branch kd-ref-teacher"><div className="kd-ref-model" onMouseEnter={() => onHover('teacher')}><strong>Teacher model</strong><span>Layer 1 → Layer 2 → … → Layer m</span></div><button type="button" className="kd-ref-node" onMouseEnter={() => onHover('temperature')}>Softmax <b>(T = t)</b></button><button type="button" className="kd-ref-label" onMouseEnter={() => onHover('soft-targets')}>soft labels</button><span className="kd-ref-loss-tag">distillation loss</span></div>
      <div className="kd-ref-branch kd-ref-student"><div className="kd-ref-model" onMouseEnter={() => onHover('student')}><strong>Student (distilled) model</strong><span>Layer 1 → Layer 2 → … → Layer n</span></div><button type="button" className="kd-ref-node" onMouseEnter={() => onHover('temperature')}>Softmax <b>(T = t)</b></button><button type="button" className="kd-ref-label" onMouseEnter={() => onHover('soft-predictions')}>soft predictions</button><button type="button" className="kd-ref-node hard-node" onMouseEnter={() => onHover('softmax')}>Softmax <b>(T = 1)</b></button><button type="button" className="kd-ref-label" onMouseEnter={() => onHover('hard-loss')}>hard prediction</button></div>
      <button type="button" className="kd-ref-loss kd-ref-distill-loss" onMouseEnter={() => onHover('distillation-loss')}>Loss Fn<br /><small>distillation</small></button><button type="button" className="kd-ref-loss kd-ref-student-loss" onMouseEnter={() => onHover('student-loss')}>Loss Fn<br /><small>student</small></button><button type="button" className="kd-ref-ground" onMouseEnter={() => onHover('hard-targets')}>hard label y<br /><small>ground truth</small></button>
    </div>
    <div className="kd-mode-switch">{(['hard', 'soft', 'mix'] as const).map(item => <button type="button" key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>{item === 'hard' ? '仅 hard' : item === 'soft' ? '仅 soft' : 'soft + hard'}</button>)}</div>
    <div className="kd-flow-loss"><span>当前训练模式</span><strong>{mode === 'hard' ? '只优化 student loss' : mode === 'soft' ? '只优化 distillation loss' : '两条 loss 加权合流'}</strong></div>
  </div>
}

function LossScene({ onHover }: { onHover: (id: string) => void }) {
  const [temperature, setTemperature] = useState(4)
  const [alpha, setAlpha] = useState(.7)
  const soft = Math.max(.08, 1.8 / temperature)
  const hard = .62
  const scaled = soft * temperature * temperature / 16
  return <div className="kd-sandbox kd-loss" onMouseLeave={() => onHover('')}>
    <div className="kd-sandbox-title"><strong>LOSS COMPOSITION</strong><span>L = α·T²·soft + (1−α)·hard</span></div>
    <div className="kd-controls"><label>T <b>{temperature.toFixed(1)}</b><input type="range" min="1" max="12" step=".5" value={temperature} onChange={event => setTemperature(Number(event.target.value))} /></label><label>α <b>{alpha.toFixed(2)}</b><input type="range" min="0" max="1" step=".05" value={alpha} onChange={event => setAlpha(Number(event.target.value))} /></label></div>
    <div className="kd-loss-bars"><div><span>soft · 未补偿</span><i style={{ width: `${Math.min(100, soft / 1.8 * 100)}%` }} /><small>梯度 ~ 1/T²</small></div><div onMouseEnter={() => onHover('t2-scale')}><span>soft · ×T²</span><i className="scaled" style={{ width: `${Math.min(100, scaled / 1.8 * 100)}%` }} /><small>α = {alpha.toFixed(2)}</small></div><div><span>hard · CE</span><i className="hard" style={{ width: `${hard / 1.8 * 100}%` }} /><small>1−α = {(1 - alpha).toFixed(2)}</small></div></div>
    <p className="kd-caption"><b>读图：</b>温度升高会让 soft 梯度变小；T² 不是把损失“变大”，而是把比较尺度拉回可用范围。</p>
  </div>
}

function CalculationScene({ onHover }: { onHover: (id: string) => void }) {
  const [temperature, setTemperature] = useState(3)
  const [alpha, setAlpha] = useState(.7)
  const student = [-5, 2, 7, 9]
  const teacher = [-10, 0, 3, 12]
  const classes = ['猫', '狗', '驴', '马']
  const studentT1 = softmax(student, 1)
  const studentT = softmax(student, temperature)
  const teacherT = softmax(teacher, temperature)
  const hard = -Math.log(studentT1[3])
  const soft = -teacherT.reduce((sum, value, index) => sum + value * Math.log(Math.max(studentT[index], 1e-9)), 0) * temperature * temperature
  return <div className="kd-sandbox kd-calculation" onMouseLeave={() => onHover('')}>
    <div className="kd-sandbox-title"><strong>WORKED EXAMPLE / 逐项计算</strong><span>Student logits vs Teacher logits</span></div>
    <div className="kd-calc-controls"><label>T <b>{temperature}</b><input type="range" min="1" max="10" step="1" value={temperature} onChange={event => setTemperature(Number(event.target.value))} /></label><label>α <b>{alpha.toFixed(2)}</b><input type="range" min="0" max="1" step=".05" value={alpha} onChange={event => setAlpha(Number(event.target.value))} /></label></div>
    <div className="kd-calc-columns"><div><header><b>Student logits</b><span onMouseEnter={() => onHover('student-logit')}>[-5, 2, 7, 9]</span></header><div className="kd-calc-row kd-calc-head"><span>class</span><span>T=1</span><span>T={temperature}</span></div>{classes.map((name, index) => <div className="kd-calc-row" key={name}><span>{name}</span><button type="button" onMouseEnter={() => onHover('student-logit')}>{studentT1[index].toFixed(4)}</button><button type="button" onMouseEnter={() => onHover('soft-predictions')}>{studentT[index].toFixed(4)}</button></div>)}</div><div><header><b>Teacher logits</b><span onMouseEnter={() => onHover('teacher-logit')}>[-10, 0, 3, 12]</span></header><div className="kd-calc-row kd-calc-head"><span>class</span><span>T={temperature}</span><span>soft target</span></div>{classes.map((name, index) => <div className="kd-calc-row" key={name}><span>{name}</span><button type="button" onMouseEnter={() => onHover('teacher-logit')}>{teacherT[index].toFixed(4)}</button><button type="button" onMouseEnter={() => onHover('soft-targets')}>{(teacherT[index] * 100).toFixed(1)}%</button></div>)}</div></div>
    <div className="kd-calc-losses"><button type="button" onMouseEnter={() => onHover('hard-ce')}><span>hard CE = −log(Student<sub>T=1</sub>[马])</span><b>{hard.toFixed(3)}</b></button><button type="button" onMouseEnter={() => onHover('soft-kl')}><span>soft KL ≈ −Σ Teacher<sub>T</sub>·log Student<sub>T</sub> × T²</span><b>{soft.toFixed(3)}</b></button><strong>L = α·soft + (1−α)·hard = {(alpha * soft + (1 - alpha) * hard).toFixed(3)}</strong></div>
    <p className="kd-caption"><b>第一性原理：</b>T=1 只问“马的概率够不够”；T={temperature} 还问“驴是否比狗更像马”。蒸馏就是把后一个问题也交给 Student。</p><a className="kd-calc-source" href="/article/distillation/figures/cross-entropy-handwritten.png" target="_blank" rel="noreferrer"><img src="/article/distillation/figures/cross-entropy-handwritten.png" alt="交叉熵与 soft target 手算教学图" /><span>展开查看：交叉熵从逐样本展开到分布形式 ↗</span></a>
  </div>
}

function MatchScene({ onHover }: { onHover: (id: string) => void }) {
  const [temperature, setTemperature] = useState(1)
  const teacher = [4.5, 2.5, 1.5, .2]
  const student = [4.1, 2.8, 1.3, .4]
  const p = softmax(teacher, temperature)
  const q = softmax(student, temperature)
  return <div className="kd-sandbox kd-match" onMouseLeave={() => onHover('')}>
    <div className="kd-sandbox-title"><strong>PROBABILITY ↔ LOGIT</strong><span>高温极限：相对证据</span></div>
    <label className="kd-slider">T <b>{temperature}</b><input type="range" min="1" max="20" step="1" value={temperature} onChange={event => setTemperature(Number(event.target.value))} /></label>
    <div className="kd-match-grid"><div><span>Teacher probability</span>{p.map((v, i) => <i key={i} style={{ width: `${v * 100}%` }}>{v.toFixed(2)}</i>)}</div><div onMouseEnter={() => onHover('matching')}><span>Student probability</span>{q.map((v, i) => <i className={i === 0 ? 'student' : ''} key={i} style={{ width: `${v * 100}%` }}>{v.toFixed(2)}</i>)}</div></div>
    <div className="kd-logit-strip"><span>去均值 Teacher</span>{teacher.map((v, i) => <b key={i}>{(v - teacher.reduce((a, b) => a + b, 0) / teacher.length).toFixed(1)}</b>)}<em>≈</em><span>去均值 Student</span>{student.map((v, i) => <b key={i}>{(v - student.reduce((a, b) => a + b, 0) / student.length).toFixed(1)}</b>)}</div>
  </div>
}

function MNISTScene({ onHover }: { onHover: (id: string) => void }) {
  const cards = [['Teacher + dropout', '≈ 67', 'teacher-errors'], ['小网 + hard', '≈ 146', 'student-errors'], ['小网 + distill', '≈ 74', 'distilled-errors']]
  return <div className="kd-sandbox kd-results" onMouseLeave={() => onHover('')}><div className="kd-sandbox-title"><strong>MNIST / TEST ERRORS</strong><span>论文报告值 · 越低越好</span></div><div className="kd-result-cards">{cards.map(([title, value, id]) => <button type="button" key={id} onMouseEnter={() => onHover(id)}><span>{title}</span><b>{value}</b><small>test errors</small></button>)}</div><p className="kd-caption"><b>反直觉点：</b>Student 没有复制 Teacher 的 jitter 训练，却能从 Teacher 的 soft outputs 间接继承泛化。</p></div>
}

function SpeechScene({ onHover }: { onHover: (id: string) => void }) {
  return <div className="kd-sandbox kd-speech" onMouseLeave={() => onHover('')}><div className="kd-sandbox-title"><strong>SPEECH ACOUSTIC MODEL</strong><span>单模型 → 十模型 → 蒸馏单模型</span></div><div className="kd-speech-flow"><button type="button" onMouseEnter={() => onHover('baseline')}>Baseline<b>1×</b></button><i>→</i><button type="button" onMouseEnter={() => onHover('tenx')}>Ensemble<b>10×</b></button><i>→</i><button type="button" onMouseEnter={() => onHover('distilled-speech')}>Distilled<b>1×</b></button></div><div className="kd-caption">线上重点：把十次前向的质量信号，压缩进一次小网络前向。</div></div>
}

function SpecialistScene({ onHover }: { onHover: (id: string) => void }) {
  return <div className="kd-sandbox kd-specialist" onMouseLeave={() => onHover('')}><div className="kd-sandbox-title"><strong>FULL MODEL + SPECIALISTS</strong><span>局部难点 → 全局部署</span></div><div className="kd-specialist-grid"><button type="button" className="kd-full-model" onMouseEnter={() => onHover('student')}>全模型<span>全部类别</span></button><div className="kd-special-lines"><i>↙</i><i>↓</i><i>↘</i></div><div className="kd-specials"><button type="button" onMouseEnter={() => onHover('confusable')}>S₁<span>猫 / 虎 / 狮</span></button><button type="button" onMouseEnter={() => onHover('specialist')}>S₂<span>音素 / 声学邻居</span></button><button type="button">S₃<span>易混淆局部组</span></button></div></div><p className="kd-caption"><b>不是 MoE：</b>specialist 可以离线并行训练，最后把知识蒸馏回一个线上模型，不需要学习实时门控。</p></div>
}

function OverviewScene({ playing, onHover }: SceneProps) {
  return <div className="kd-sandbox kd-overview" onMouseLeave={() => onHover('')}><div className="kd-sandbox-title"><strong>KNOWLEDGE DISTILLATION</strong><span>{playing ? '● animated overview' : 'Ⅱ paused'}</span></div><div className="kd-overview-flow"><div onMouseEnter={() => onHover('ensemble')}><b>ENSEMBLE</b><span>质量高 / 成本高</span></div><i className={playing ? 'flowing' : ''}>soft targets</i><div onMouseEnter={() => onHover('student')}><b>STUDENT</b><span>质量近似 / 成本低</span></div></div><div className="kd-principles"><span>1. 暴露类间关系</span><span>2. soft + hard</span><span>3. T² 保持梯度</span></div></div>
}

function ConvergenceScene({ playing, onHover }: SceneProps) {
  return <div className="kd-sandbox kd-convergence" onMouseLeave={() => onHover('')}><div className="kd-sandbox-title"><strong>CONVERGENCE SPACE / 函数收敛区域</strong><span>{playing ? '● guided by Teacher' : 'Ⅱ paused'}</span></div><div className="kd-convergence-map"><div className="kd-region teacher-region" onMouseEnter={() => onHover('teacher')}><b>Teacher convergence</b><span>大模型已经找到的高质量函数区域</span></div><div className={`kd-region guided-region ${playing ? 'pulse' : ''}`} onMouseEnter={() => onHover('knowledge-distillation')}><b>Teacher-guided Student</b><span>soft targets 把 Student 拉向更好的区域</span></div><div className="kd-region student-region" onMouseEnter={() => onHover('student')}><b>Student convergence</b><span>只用 hard labels 可能停留的区域</span></div></div><div className="kd-caption"><b>不是复制权重：</b>Teacher 提供方向，Student 仍用自己的参数空间完成收敛。</div></div>
}

function TaxonomyScene({ onHover }: { onHover: (id: string) => void }) {
  const cards = [['OFFLINE', 'Teacher 先训练好', 'Teacher → cache soft targets → Student', 'offline-distillation'], ['ONLINE', 'Teacher 与 Student 同步', 'x → Teacher + Student → loss → update', 'online-distillation'], ['SELF', '模型自己教自己', '旧模型 / 深层 → 当前模型', 'self-distillation']]
  return <div className="kd-sandbox kd-taxonomy" onMouseLeave={() => onHover('')}><div className="kd-sandbox-title"><strong>DISTILLATION TAXONOMY / 谁在教谁</strong><span>时序决定系统结构</span></div><div className="kd-taxonomy-grid">{cards.map(([title, subtitle, flow, id]) => <button type="button" key={id} onMouseEnter={() => onHover(id)}><b>{title}</b><strong>{subtitle}</strong><span>{flow}</span></button>)}</div><p className="kd-caption"><b>共同底层：</b>都在用比 one-hot 更丰富的行为信号指导 Student；区别在 Teacher 是否预训练、是否实时更新。</p></div>
}

function VariantsScene({ onHover }: { onHover: (id: string) => void }) {
  const items = [['Output', '最终 soft targets', 'knowledge-distillation'], ['Feature / Hint', '中间层表示', 'feature-distillation'], ['Relation', '样本之间的距离与图结构', 'relational-distillation'], ['Born-Again', '历史模型的 soft outputs', 'born-again']]
  return <div className="kd-sandbox kd-variants" onMouseLeave={() => onHover('')}><div className="kd-sandbox-title"><strong>WHAT COUNTS AS KNOWLEDGE?</strong><span>从输出扩展到结构</span></div><div className="kd-variant-map"><div className="kd-variant-core"><b>Knowledge</b><span>可迁移的结构</span></div>{items.map(([title, desc, id], index) => <button type="button" className={`kd-variant v${index + 1}`} key={id} onMouseEnter={() => onHover(id)}><b>{title}</b><span>{desc}</span></button>)}</div><p className="kd-caption">选择接口的原则：Student 学得动、信号比硬标签丰富、并且和目标任务真正相关。</p></div>
}

function HistoryScene({ onHover }: { onHover: (id: string) => void }) {
  const points = [['1989–2006', '剪枝 / 压缩 / 伪数据', 'history-1989'], ['2014–2015', 'dark knowledge / soft targets', 'history-2014'], ['2018', 'Born-Again / feature hints', 'born-again'], ['2019+', '关系 / 零样本 / teacher-free', 'history-2019']]
  return <div className="kd-sandbox kd-history" onMouseLeave={() => onHover('')}><div className="kd-sandbox-title"><strong>RESEARCH TIMELINE / 扩展阅读</strong><span>核心论文与后续路线分开</span></div><div className="kd-history-line">{points.map(([year, label, id], index) => <button type="button" key={id} onMouseEnter={() => onHover(id)}><b>{year}</b><i className={index === 1 ? 'core' : ''} /><span>{label}</span></button>)}</div><p className="kd-caption"><b>边界：</b>2014/2015 是本页面论文的核心节点；其余是帮助理解“知识接口如何扩展”的后续研究线索。</p></div>
}

function CompressionMapScene({ onHover }: { onHover: (id: string) => void }) {
  const lanes: Array<[string, Array<[string, string, string]>]> = [['结构', [['Pruning', '剪枝', 'pruning'], ['EfficientNet / MobileNet', '轻量架构', 'efficient-architecture'], ['Low-rank', '低秩分解', 'low-rank']]], ['数值与知识', [['Quantization', 'INT8 / 低 bit', 'quantization'], ['Knowledge Distillation', 'soft targets / dark knowledge', 'lightweight-map'], ['Attention Transfer', '迁移关注区域', 'attention-transfer']]], ['执行', [['NAS', '搜索精度-成本 Pareto', 'nas'], ['TensorRT / OpenVINO', '算子与 kernel', 'hardware-deploy'], ['Embedded / FPGA', '目标设备落地', 'hardware-deploy']]]]
  return <div className="kd-sandbox kd-compression" onMouseLeave={() => onHover('')}><div className="kd-sandbox-title"><strong>LIGHTWEIGHT MODEL MAP / 轻量化神经网络</strong><span>结构 → 知识 → 硬件</span></div><div className="kd-compression-lanes">{lanes.map(([title, items]) => <section key={title}><h3>{title}</h3><div>{items.map(([label, desc, id]) => <button type="button" key={label} onMouseEnter={() => onHover(id)}><b>{label}</b><span>{desc}</span></button>)}</div></section>)}</div><div className="kd-compression-arrow">大模型 <b>→</b> 压缩 / 迁移 / 编译 <b>→</b> 可部署模型</div><p className="kd-caption"><b>与知识蒸馏的关系：</b>蒸馏主要迁移“知识”，剪枝和量化主要改变“载体”；工程上经常组合，而不是互相替代。</p></div>
}

function MetricsScene({ onHover }: { onHover: (id: string) => void }) {
  const metrics = [['Params', '参数量', 'efficiency-metrics'], ['FLOPs / MACs', '计算量', 'efficiency-metrics'], ['Memory access', '访存量', 'efficiency-metrics'], ['Latency', '真实延迟', 'hardware-deploy'], ['Energy', '能耗 / 碳排', 'efficiency-metrics'], ['Accuracy', '任务精度', 'knowledge-distillation']]
  return <div className="kd-sandbox kd-metrics" onMouseLeave={() => onHover('')}><div className="kd-sandbox-title"><strong>DEPLOYMENT SCORECARD / 轻量化不能只看参数</strong><span>目标设备上的 Pareto 权衡</span></div><div className="kd-metric-grid">{metrics.map(([label, desc, id], index) => <button type="button" key={label} onMouseEnter={() => onHover(id)}><span>{label}</span><i style={{ width: `${[45, 58, 72, 34, 28, 91][index]}%` }} /><small>{desc}</small></button>)}</div><p className="kd-caption"><b>第一性原理：</b>优化目标不是“最小模型”，而是在固定设备和延迟约束下，找到准确率、内存、吞吐、能耗的可接受平衡。</p></div>
}

function DetailedEvidenceScene({ scene, onHover }: { scene: string; onHover: (id: string) => void }) {
  const content: Record<string, { title: string; subtitle: string; items: Array<[string, string, string]> }> = {
    'transfer-details': { title: 'SOFT TARGETS / 信息密度', subtitle: '同一个输入，Teacher 输出一整份分布', items: [['算术/几何平均', '多个 Teacher 的互补判断合成一个目标。', 'arithmetic-mean'], ['高熵目标', '更多非正确类保留非零概率，梯度方差更低。', 'high-entropy-target'], ['未标注 transfer set', '只要能询问 Teacher，不一定必须有人工标签。', 'transfer-set']] },
    'mnist-edge': { title: 'MNIST / MISSING CLASS', subtitle: '没有见过 3，也可能学会 3', items: [['原始结果', '206 errors，其中 133 个发生在 1010 个数字 3 上。', 'mythical-class'], ['调高 3 的 bias', 'bias +3.5 后总错误降到 109，3 的识别率达到 98.6%。', 'mythical-class'], ['只用 7/8', '47.3% test errors → 调低 bias 7.6 后为 13.2%。', 'mythical-class']] },
    'speech-detail': { title: 'SPEECH / ACOUSTIC MODEL', subtitle: '局部帧分类如何连接到最终 WER', items: [['输入', '26 帧 × 40 维 Mel filter-bank，预测第 21 帧。', 'speech-acoustic-model'], ['模型', '8 层 × 2560 ReLU，14,000 HMM labels，约 85M 参数。', 'speech-acoustic-model'], ['结果', 'Baseline 58.9% / 10.9% WER；Distilled 60.8% / 10.7% WER。', 'wer-mismatch']] },
    'jft-details': { title: 'JFT / SPECIALIST PIPELINE', subtitle: 'generalist 选路，specialist 解决局部难点', items: [['数据', '约 1 亿标注图像、15,000 labels。', 'jft-dataset'], ['训练', '61 个 specialist，每个约 300 类 + dustbin；从 generalist 初始化。', 'specialist-initialization'], ['推理', 'generalist top-1 → active specialists → 联合 KL 优化全类分布。', 'specialist-inference']] },
    'jft-results': { title: 'RESULTS / REGULARIZATION / MoE', subtitle: '论文结论与边界放在同一张卡片上', items: [['JFT', 'overall top-1 43.1% → 45.9%；conditional 25.0% → 26.1%。', 'specialist-results'], ['3% 数据', 'hard 44.5% test frame accuracy；soft 57.0%，无需 early stopping。', 'soft-regularizer'], ['边界', '论文尚未证明 specialist 知识已经回蒸到单个大模型。', 'discussion-limit']] },
  }
  const data = content[scene]
  return <div className="kd-sandbox kd-evidence" onMouseLeave={() => onHover('')}><div className="kd-sandbox-title"><strong>{data.title}</strong><span>{data.subtitle}</span></div><div className="kd-evidence-grid">{data.items.map(([label, text, id]) => <button type="button" key={label} onMouseEnter={() => onHover(id)}><b>{label}</b><span>{text}</span></button>)}</div><p className="kd-caption"><b>读法：</b>先看事实，再悬停节点理解它为什么成立、系统如何实现，以及不做这一步会牺牲什么。</p></div>
}

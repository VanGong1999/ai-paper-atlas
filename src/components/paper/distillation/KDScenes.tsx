import { useMemo, useState } from 'react'
import { distillationExample, l2, softmax } from '../../../data/papers/distillation/math'
import { speechResults, regularizationResults, jftResults } from '../../../data/papers/distillation/evidence'

type SceneProps = { playing: boolean; onHover: (id: string) => void }
const logits = [6.2, 2.8, 2.1, 1.2, 0.2, -0.8]
const labels = ['BMW', '垃圾车', '轿车', '胡萝卜', '狗', '飞机']


export function KDScene({ scene, playing, onHover }: SceneProps & { scene: string }) {
  if (scene === 'temperature') return <TemperatureScene onHover={onHover} />
  if (scene === 'loss') return <FlowScene playing={playing} onHover={onHover} />
  if (scene === 't2') return <LossScene onHover={onHover} />
  if (scene === 'flow-detail') return <FlowDetailScene onHover={onHover} />
  if (scene === 'calculation') return <CalculationScene onHover={onHover} />
  if (scene === 'match') return <MatchScene onHover={onHover} />
  if (scene === 'gradient-derivation') return <GradientDerivationScene onHover={onHover} />
  if (scene === 'numbers') return <MNISTScene onHover={onHover} />
  if (scene === 'confusable') return <SpecialistScene onHover={onHover} />
  if (scene === 'speech-results') return <SpeechScene onHover={onHover} />
  if (scene === 'pytorch') return <FlowScene playing={playing} onHover={onHover} />
  if (scene === 'bmw') return <SoftTargetsScene onHover={onHover} />
  if (scene === 'soft-regularization') return <RegularizationScene onHover={onHover} />
  if (scene === 'jft-results') return <JFTResultsScene onHover={onHover} />
  if (scene === 'convergence') return <ConvergenceScene playing={playing} onHover={onHover} />
  if (scene === 'taxonomy') return <TaxonomyScene onHover={onHover} />
  if (scene === 'variants') return <VariantsScene onHover={onHover} />
  if (scene === 'history') return <HistoryScene onHover={onHover} />
  if (scene === 'compression-map') return <CompressionMapScene onHover={onHover} />
  if (scene === 'metrics') return <MetricsScene onHover={onHover} />
  if (['transfer-details', 'mnist-edge', 'mnist-setup', 'speech-detail', 'asr-objective', 'jft-details', 'jft-objective', 'jft-results'].includes(scene)) return <DetailedEvidenceScene scene={scene} onHover={onHover} />
  return <OverviewScene playing={playing} onHover={onHover} />
}

function TemperatureScene({ onHover }: { onHover: (id: string) => void }) {
  const [temperature, setTemperature] = useState(4)
  const probs = useMemo(() => softmax(logits, temperature), [temperature])
  return <div className="kd-sandbox kd-temperature">
    <div className="kd-sandbox-title"><strong>SOFTMAX / DARK KNOWLEDGE</strong><span>固定 logits · 实时计算</span></div>
    <label className="kd-slider">Temperature T <b>{temperature.toFixed(1)}</b><input type="range" min="1" max="20" step="0.5" value={temperature} onChange={event => setTemperature(Number(event.target.value))} /></label>
    <div className="kd-bars">{probs.map((value, index) => <button type="button" key={labels[index]} className={index === 0 ? 'top' : ''} onMouseEnter={() => onHover(index === 0 ? 'soft-targets' : 'dark-knowledge')} onClick={() => onHover(index === 0 ? 'soft-targets' : 'dark-knowledge')} onFocus={() => onHover(index === 0 ? 'soft-targets' : 'dark-knowledge')}><span>{labels[index]}</span><i style={{ height: `${Math.max(3, value * 190)}px` }} /><small>{(value * 100).toFixed(1)}%</small></button>)}</div>
    <div className="kd-caption"><b>T 越高：</b>冠军仍是 BMW，但垃圾车、轿车之间的相对差异更容易观察；这就是 dark knowledge。</div>
  </div>
}

function FlowScene({ playing, onHover }: SceneProps) {
  const [mode, setMode] = useState<'hard' | 'soft' | 'mix'>('mix')
  return <div className="kd-sandbox kd-flow-v2">
    <div className="kd-sandbox-title"><strong>教学重绘 · TRAIN → DEPLOY</strong><span>{playing ? '监督流向' : '静态流程'}</span></div>
    <div className="kd-mode-switch">{(['hard', 'soft', 'mix'] as const).map(x => <button type="button" key={x} aria-pressed={mode === x} className={mode === x ? 'active' : ''} onClick={() => setMode(x)}>{x === 'hard' ? '仅真值' : x === 'soft' ? '仅教师' : '教师 + 真值'}</button>)}</div>
    <button type="button" className="kd-flow-input" onMouseEnter={() => onHover('input')} onClick={() => onHover('input')} onFocus={() => onHover('input')} tabIndex={0}>同一批输入 x [B, D] → 两个网络</button>
    <div className="kd-flow-v2-branches"><div className={mode === 'hard' ? 'kd-inactive' : ''}><button type="button" className="teacher" onMouseEnter={() => onHover('teacher')} onClick={() => onHover('teacher')} onFocus={() => onHover('teacher')} tabIndex={0}>① Teacher · 冻结参数<small>v [B,C] → pᵀ=softmax(v/T)</small></button><span>↓ 固定目标 · 不回传 Teacher</span><button type="button" onMouseEnter={() => onHover('soft-loss')} onClick={() => onHover('soft-loss')} onFocus={() => onHover('soft-loss')} tabIndex={0}>③ Soft loss<small>T² · KL(pᵀ ∥ qᵀ)</small></button></div><div><button type="button" className="student" onMouseEnter={() => onHover('student')} onClick={() => onHover('student')} onFocus={() => onHover('student')} tabIndex={0}>② Student · 可训练<small>同一组 z [B,C] 分出两个 softmax</small></button><span>↙ qᵀ=softmax(z/T) · q¹=softmax(z) ↘</span><button type="button" className={mode === 'soft' ? 'kd-inactive' : ''} onMouseEnter={() => onHover('hard-loss')} onClick={() => onHover('hard-loss')} onFocus={() => onHover('hard-loss')} tabIndex={0}>④ Hard loss<small>真实 y [B] → −log q¹[y]</small></button></div></div>
    <button type="button" className="kd-flow-total" onMouseEnter={() => onHover('total-loss')} onClick={() => onHover('total-loss')} onFocus={() => onHover('total-loss')} tabIndex={0}>⑤ {mode === 'hard' ? 'L = hard CE' : mode === 'soft' ? 'L = T² · soft KL' : 'L = α T² · soft KL + (1−α) · hard CE'}<small>反向传播 → 仅更新 Student 参数</small></button>
    <button type="button" className="kd-flow-deploy" onMouseEnter={() => onHover('deployment')} onClick={() => onHover('deployment')} onFocus={() => onHover('deployment')} tabIndex={0}>部署：x → Student → softmax(z) · T=1<small>Teacher 和训练损失不再参与</small></button>
    <p className="kd-caption">依据 §2 pp.2–3 教学重绘；不是原文 Figure。C 表示类别数、B 表示批量。没有人工标签也能使用纯 soft；hard 分支是有标签时的附加约束。</p>
  </div>
}

function FlowDetailScene({ onHover }: { onHover: (id: string) => void }) {
  return <FlowScene playing={false} onHover={onHover} />
}

function LossScene({ onHover }: { onHover: (id: string) => void }) {
  const [temperature, setTemperature] = useState(4)
  const [alpha, setAlpha] = useState(.7)
  const [compensate, setCompensate] = useState(true)
  const example = distillationExample([1.2, .4, -.5, -1.1], [1.5, .1, -.4, -1.2], temperature, 0)
  const raw = l2(example.rawGradient), scaled = l2(example.scaledGradient), hard = l2(example.hardGradient)
  const mixed = example.hardGradient.map((g, i) => (1-alpha)*g + alpha*(compensate ? example.scaledGradient[i] : example.rawGradient[i]))
  const values: Array<[string, number, string]> = [['未补偿 soft 梯度范数', raw, 'gradient-eq2'], ['补偿 T² 后的范数', scaled, 't2-scale'], ['hard CE 梯度范数', hard, 'hard-loss']]
  return <div className="kd-sandbox kd-loss">
    <div className="kd-sandbox-title"><strong>T² · 真正比较梯度</strong><span>自设4类 logits · 按式(2)实时计算</span></div>
    <div className="kd-controls"><label>T <b>{temperature.toFixed(1)}</b><input aria-label="梯度温度 T" type="range" min="1" max="20" step=".5" value={temperature} onChange={e => setTemperature(Number(e.target.value))} /></label><label>α <b>{alpha.toFixed(2)}</b><input aria-label="soft 分支权重 α" type="range" min="0" max="1" step=".05" value={alpha} onChange={e => setAlpha(Number(e.target.value))} /></label></div>
    <label className="kd-check"><input type="checkbox" checked={compensate} onChange={e => setCompensate(e.target.checked)} />在总梯度中启用 T² 补偿</label>
    <div className="kd-loss-bars">{values.map(([label, value, id]) => <button type="button" key={id} onMouseEnter={() => onHover(id)} onClick={() => onHover(id)} onFocus={() => onHover(id)}><span>{label}</span><i style={{width: `${value / Math.max(hard, scaled, .001) * 100}%`}} /><b>{value.toFixed(6)}</b></button>)}</div>
    <div className="kd-gradient-vector"><span>最终 ∂L/∂z · [1,4]</span><code>[{mixed.map(x => x.toFixed(5)).join(', ')}]</code><small>||∂L/∂z||₂ = {l2(mixed).toFixed(6)}</small></div>
    <p className="kd-caption">固定 Student z=[1.2,0.4,−0.5,−1.1]，Teacher v=[1.5,0.1,−0.4,−1.2]，真值为第1类。逐类梯度是 (qᵀ−pᵀ)/T，乘 T² 后为 T(qᵀ−pᵀ)。高温时差值本身约按 1/T 缩小，因此总梯度约按 1/T² 缩小；有限温度下补偿后并非严格恒定。条形图共享比例，数字为精确计算，不是训练实验曲线。</p>
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
  const { kl, softCE, entropy } = distillationExample(student, teacher, temperature, 3)
  const soft = kl * temperature * temperature
  return <div className="kd-sandbox kd-calculation">
    <div className="kd-sandbox-title"><strong>教学自设数据 / CE ≠ KL</strong><span>Student logits vs Teacher logits</span></div>
    <div className="kd-calc-controls"><label>T <b>{temperature}</b><input type="range" min="1" max="10" step="1" value={temperature} onChange={event => setTemperature(Number(event.target.value))} /></label><label>α <b>{alpha.toFixed(2)}</b><input type="range" min="0" max="1" step=".05" value={alpha} onChange={event => setAlpha(Number(event.target.value))} /></label></div>
    <div className="kd-calc-columns"><div><header><b>Student logits</b><span onMouseEnter={() => onHover('student-logit')} onClick={() => onHover('student-logit')} onFocus={() => onHover('student-logit')} tabIndex={0}>[-5, 2, 7, 9]</span></header><div className="kd-calc-row kd-calc-head"><span>class</span><span>T=1</span><span>T={temperature}</span></div>{classes.map((name, index) => <div className="kd-calc-row" key={name}><span>{name}</span><button type="button" onMouseEnter={() => onHover('student-logit')} onClick={() => onHover('student-logit')} onFocus={() => onHover('student-logit')} tabIndex={0}>{studentT1[index].toFixed(4)}</button><button type="button" onMouseEnter={() => onHover('soft-predictions')} onClick={() => onHover('soft-predictions')} onFocus={() => onHover('soft-predictions')} tabIndex={0}>{studentT[index].toFixed(4)}</button></div>)}</div><div><header><b>Teacher logits</b><span onMouseEnter={() => onHover('teacher-logit')} onClick={() => onHover('teacher-logit')} onFocus={() => onHover('teacher-logit')} tabIndex={0}>[-10, 0, 3, 12]</span></header><div className="kd-calc-row kd-calc-head"><span>class</span><span>T={temperature}</span><span>soft target</span></div>{classes.map((name, index) => <div className="kd-calc-row" key={name}><span>{name}</span><button type="button" onMouseEnter={() => onHover('teacher-logit')} onClick={() => onHover('teacher-logit')} onFocus={() => onHover('teacher-logit')} tabIndex={0}>{teacherT[index].toFixed(4)}</button><button type="button" onMouseEnter={() => onHover('soft-targets')} onClick={() => onHover('soft-targets')} onFocus={() => onHover('soft-targets')} tabIndex={0}>{(teacherT[index] * 100).toFixed(1)}%</button></div>)}</div></div>
    <div className="kd-calc-losses"><button type="button" onMouseEnter={() => onHover('hard-ce')} onClick={() => onHover('hard-ce')} onFocus={() => onHover('hard-ce')} tabIndex={0}><span>hard CE = −log(Student<sub>T=1</sub>[马])</span><b>{hard.toFixed(3)}</b></button><button type="button" onMouseEnter={() => onHover('soft-kl')} onClick={() => onHover('soft-kl')} onFocus={() => onHover('soft-kl')} tabIndex={0}><span>T²·KL(pᵀ∥qᵀ) = T²·Σ pᵀ log(pᵀ/qᵀ)</span><b>{soft.toFixed(3)}</b></button><strong>L = α·soft + (1−α)·hard = {(alpha * soft + (1 - alpha) * hard).toFixed(3)}</strong></div>
    <p className="kd-caption">原文 soft CE={softCE.toFixed(4)}；Teacher 熵 H(pᵀ)={entropy.toFixed(4)}；KL={kl.toFixed(4)}。CE=H(pᵀ)+KL，所以它们对固定 Teacher 的 Student 梯度相同，但数值不相同。</p><p className="kd-caption"><b>第一性原理：</b>T=1 只问“马的概率够不够”；T={temperature} 还问“驴是否比狗更像马”。蒸馏就是把后一个问题也交给 Student。</p><a className="kd-calc-source" href="/article/distillation/figures/cross-entropy-handwritten.png" target="_blank" rel="noreferrer"><img src="/article/distillation/figures/cross-entropy-handwritten.png" alt="交叉熵与 soft target 手算教学图" /><span>展开查看：交叉熵从逐样本展开到分布形式 ↗</span></a>
  </div>
}

function MatchScene({ onHover }: { onHover: (id: string) => void }) {
  const [temperature, setTemperature] = useState(1)
  const teacher = [4.5, 2.5, 1.5, .2]
  const student = [4.1, 2.8, 1.3, .4]
  const p = softmax(teacher, temperature)
  const q = softmax(student, temperature)
  return <div className="kd-sandbox kd-match">
    <div className="kd-sandbox-title"><strong>PROBABILITY ↔ LOGIT</strong><span>高温极限：相对证据</span></div>
    <label className="kd-slider">T <b>{temperature}</b><input type="range" min="1" max="20" step="1" value={temperature} onChange={event => setTemperature(Number(event.target.value))} /></label>
    <div className="kd-match-grid"><div><span>Teacher probability</span>{p.map((v, i) => <i key={i} style={{ width: `${v * 100}%` }}>{v.toFixed(2)}</i>)}</div><div onMouseEnter={() => onHover('matching')} onClick={() => onHover('matching')} onFocus={() => onHover('matching')} tabIndex={0}><span>Student probability</span>{q.map((v, i) => <i className={i === 0 ? 'student' : ''} key={i} style={{ width: `${v * 100}%` }}>{v.toFixed(2)}</i>)}</div></div>
    <div className="kd-logit-strip"><span>去均值 Teacher</span>{teacher.map((v, i) => <b key={i}>{(v - teacher.reduce((a, b) => a + b, 0) / teacher.length).toFixed(1)}</b>)}<em>≈</em><span>去均值 Student</span>{student.map((v, i) => <b key={i}>{(v - student.reduce((a, b) => a + b, 0) / student.length).toFixed(1)}</b>)}</div>
  </div>
}

function GradientDerivationScene({ onHover }: { onHover: (id: string) => void }) {
  const [temperature, setTemperature] = useState(5)
  const student = [1.2, 0.4, -0.5, -1.1]
  const teacher = [1.5, 0.1, -0.4, -1.2]
  const q = softmax(student, temperature)
  const p = softmax(teacher, temperature)
  const i = 0
  const exact = (q[i] - p[i]) / temperature
  const approx = (student[i] - teacher[i]) / (student.length * temperature * temperature)
  return <div className="kd-sandbox kd-gradient-derivation">
    <div className="kd-sandbox-title"><strong>§2.1 / EQUATIONS (2) → (3) → (4)</strong><span>高温近似可视化</span></div>
    <label className="kd-slider">Temperature T <b>{temperature}</b><input type="range" min="1" max="20" step="1" value={temperature} onChange={event => setTemperature(Number(event.target.value))} /></label>
    <div className="kd-derivation-chain">
      <button type="button" onMouseEnter={() => onHover('gradient-eq2')} onClick={() => onHover('gradient-eq2')} onFocus={() => onHover('gradient-eq2')} tabIndex={0}><span>式 (2) · 精确梯度</span><b>∂C/∂zᵢ = (qᵢ − pᵢ) / T</b><small>当前 i=0：{exact.toFixed(5)}</small></button>
      <i>高温 T ≫ |z|, |v|</i>
      <button type="button" onMouseEnter={() => onHover('high-temp-expansion')} onClick={() => onHover('high-temp-expansion')} onFocus={() => onHover('high-temp-expansion')} tabIndex={0}><span>式 (3) · eˣ ≈ 1+x</span><b>qᵢ ≈ (1+zᵢ/T)/(N+Σzⱼ/T)</b><small>把 softmax 的指数展开到一阶</small></button>
      <i>若 Σzⱼ = Σvⱼ = 0</i>
      <button type="button" onMouseEnter={() => onHover('gradient-eq4')} onClick={() => onHover('gradient-eq4')} onFocus={() => onHover('gradient-eq4')} tabIndex={0}><span>式 (4) · 去均值 logits</span><b>∂C/∂zᵢ ≈ (zᵢ − vᵢ)/(N T²)</b><small>当前近似：{approx.toFixed(5)}</small></button>
    </div>
    <div className="kd-derivation-legend"><button type="button" onMouseEnter={() => onHover('student-logit')} onClick={() => onHover('student-logit')} onFocus={() => onHover('student-logit')} tabIndex={0}>zᵢ = Student logit</button><button type="button" onMouseEnter={() => onHover('teacher-logit')} onClick={() => onHover('teacher-logit')} onFocus={() => onHover('teacher-logit')} tabIndex={0}>vᵢ = Teacher logit</button><button type="button" onMouseEnter={() => onHover('zero-mean-condition')} onClick={() => onHover('zero-mean-condition')} onFocus={() => onHover('zero-mean-condition')} tabIndex={0}>Σ logits = 0</button><span>N = {student.length} 类</span></div>
    <p className="kd-caption"><b>读法：</b>式 (2) 是训练时真正使用的精确梯度；式 (3) 用高温展开 softmax；式 (4) 只有在 Teacher 与 Student logits 分别去均值时成立。它说明高温蒸馏等价于匹配相对 logits，但中等温度往往更实用，因为极负 logits 可能包含噪声。</p>
  </div>
}

function MNISTScene({ onHover }: { onHover: (id: string) => void }) {
  const cards = [['Teacher + dropout', '67', 'teacher-errors'], ['小网 + hard', '146', 'student-errors'], ['小网 + distill', '74', 'distilled-errors']]
  return <div className="kd-sandbox kd-results"><div className="kd-sandbox-title"><strong>MNIST / TEST ERRORS</strong><span>论文报告值 · 越低越好</span></div><div className="kd-result-cards">{cards.map(([title, value, id]) => <button type="button" key={id} onMouseEnter={() => onHover(id)} onClick={() => onHover(id)} onFocus={() => onHover(id)}><span>{title}</span><b>{value}</b><small>test errors</small></button>)}</div><p className="kd-caption"><b>反直觉点：</b>Student 没有复制 Teacher 的 jitter 训练，却能从 Teacher 的 soft outputs 间接继承泛化。</p></div>
}

function SpeechScene({ onHover }: { onHover: (id: string) => void }) {
  return <div className="kd-sandbox kd-speech"><div className="kd-sandbox-title"><strong>TABLE 1 · SPEECH</strong><span>原文 pp.4–5 · T=2</span></div><div className="kd-result-cards">{speechResults.map((x,i) => <button type="button" key={x.system} onMouseEnter={() => onHover(['baseline','tenx','distilled-speech'][i])} onClick={() => onHover(['baseline','tenx','distilled-speech'][i])} onFocus={() => onHover(['baseline','tenx','distilled-speech'][i])}><span>{x.system}</span><b>{x.frame.toFixed(1)}%</b><small>test frame accuracy ↑</small><strong>{x.wer.toFixed(1)}% WER ↓</strong></button>)}</div><p className="kd-caption">Teacher ensemble 是10个独立初始化的相同85M参数网络，Student 也是一个85M网络；不是把网络结构缩成更小。蒸馏继承约86.4%的帧准确率增益，并保留表中WER增益。hard 相对权重0.5；T扫描1/2/5/10，最佳为2。</p><div className="kd-acoustic-chain"><span>26×40 特征</span>→<span>8×2560 ReLU</span>→<span>14,000 HMM状态</span>→<span>HMM + 语言模型解码</span></div></div>
}

function SpecialistScene({ onHover }: { onHover: (id: string) => void }) {
  const [candidate, setCandidate] = useState('bridge')
  const groups = [['party', 'S₁ · 聚会', 'Tea party / Easter / Bridal shower'], ['bridge','S₂ · 桥梁','Bridge / Viaduct / Chimney'], ['car','S₃ · 车型','Toyota Corolla / Opel Astra']]
  return <div className="kd-sandbox kd-specialist"><div className="kd-sandbox-title"><strong>§5 · GENERALIST + SPECIALISTS</strong><span>缩小类别空间的教学示意</span></div><p className="kd-caption">选择 generalist 的 top-1 类别，观察哪个 specialist 被激活；例子取自 Table 2，实际共有61个、集合允许重叠。</p><label className="kd-select">Generalist top-1 <select value={candidate} onChange={e=>setCandidate(e.target.value)}><option value="party">Tea party</option><option value="bridge">Bridge</option><option value="car">Toyota Corolla</option><option value="other">无 specialist 覆盖的类</option></select></label><div className="kd-specials">{groups.map(([id,title,classes])=><button type="button" key={id} aria-pressed={candidate===id} className={candidate===id?'active':'kd-inactive'} onMouseEnter={()=>onHover('specialist-inference')} onClick={()=>onHover('specialist-inference')} onFocus={()=>onHover('specialist-inference')}><b>{title}</b><span>{classes}</span><small>{candidate===id?'运行 · 加入 active set':'跳过本次前向'}</small></button>)}</div><button type="button" className="kd-flow-total" onMouseEnter={()=>onHover('specialist-objective')} onClick={()=>onHover('specialist-objective')} onFocus={()=>onHover('specialist-objective')}>Generalist 全类分布 + {candidate==='other'?'空 active set（保留 generalist）':'active specialist 的局部分布 + dustbin'}<small>每张图求 q：min KL(pᵍ∥q)+Σ KL(pᵐ∥q 的对应聚合分布)</small></button><p className="kd-caption">与MoE的差异在训练：分组固定后各specialist独立微调；推理仍由generalist选路。dustbin 的 q 概率需把全部非specialist类相加。§8明确：论文尚未完成将这些specialist回蒸到一个模型；此处输出仍是按需运行的ensemble。</p></div>
}

function OverviewScene({ playing, onHover }: SceneProps) {
  return <div className="kd-sandbox kd-overview"><div className="kd-sandbox-title"><strong>KNOWLEDGE DISTILLATION</strong><span>{playing ? '● animated overview' : 'Ⅱ paused'}</span></div><div className="kd-overview-flow"><div onMouseEnter={() => onHover('ensemble')} onClick={() => onHover('ensemble')} onFocus={() => onHover('ensemble')} tabIndex={0}><b>ENSEMBLE</b><span>质量高 / 成本高</span></div><i className={playing ? 'flowing' : ''}>soft targets</i><div onMouseEnter={() => onHover('student')} onClick={() => onHover('student')} onFocus={() => onHover('student')} tabIndex={0}><b>STUDENT</b><span>质量近似 / 成本低</span></div></div><div className="kd-principles"><span>1. 暴露类间关系</span><span>2. soft + hard</span><span>3. T² 保持梯度</span></div></div>
}

function ConvergenceScene({ playing, onHover }: SceneProps) {
  return <div className="kd-sandbox kd-convergence"><div className="kd-sandbox-title"><strong>概念示意 / 非实测收敛轨迹</strong><span>{playing ? '● guided by Teacher' : 'Ⅱ paused'}</span></div><div className="kd-convergence-map"><div className="kd-region teacher-region" onMouseEnter={() => onHover('teacher')} onClick={() => onHover('teacher')} onFocus={() => onHover('teacher')} tabIndex={0}><b>Teacher convergence</b><span>大模型已经找到的高质量函数区域</span></div><div className={`kd-region guided-region ${playing ? 'pulse' : ''}`} onMouseEnter={() => onHover('knowledge-distillation')} onClick={() => onHover('knowledge-distillation')} onFocus={() => onHover('knowledge-distillation')} tabIndex={0}><b>Teacher-guided Student</b><span>soft targets 把 Student 拉向更好的区域</span></div><div className="kd-region student-region" onMouseEnter={() => onHover('student')} onClick={() => onHover('student')} onFocus={() => onHover('student')} tabIndex={0}><b>Student convergence</b><span>只用 hard labels 可能停留的区域</span></div></div><div className="kd-caption"><b>不是复制权重：</b>Teacher 提供方向，Student 仍用自己的参数空间完成收敛。</div></div>
}

function TaxonomyScene({ onHover }: { onHover: (id: string) => void }) {
  const cards = [['OFFLINE', 'Teacher 先训练好', 'Teacher → cache soft targets → Student', 'offline-distillation'], ['ONLINE', 'Teacher 与 Student 同步', 'x → Teacher + Student → loss → update', 'online-distillation'], ['SELF', '模型自己教自己', '旧模型 / 深层 → 当前模型', 'self-distillation']]
  return <div className="kd-sandbox kd-taxonomy"><div className="kd-sandbox-title"><strong>DISTILLATION TAXONOMY / 谁在教谁</strong><span>时序决定系统结构</span></div><div className="kd-taxonomy-grid">{cards.map(([title, subtitle, flow, id]) => <button type="button" key={id} onMouseEnter={() => onHover(id)} onClick={() => onHover(id)} onFocus={() => onHover(id)}><b>{title}</b><strong>{subtitle}</strong><span>{flow}</span></button>)}</div><p className="kd-caption"><b>共同底层：</b>都在用比 one-hot 更丰富的行为信号指导 Student；区别在 Teacher 是否预训练、是否实时更新。</p></div>
}

function VariantsScene({ onHover }: { onHover: (id: string) => void }) {
  const items = [['Output', '最终 soft targets', 'knowledge-distillation'], ['Feature / Hint', '中间层表示', 'feature-distillation'], ['Relation', '样本之间的距离与图结构', 'relational-distillation'], ['Born-Again', '历史模型的 soft outputs', 'born-again']]
  return <div className="kd-sandbox kd-variants"><div className="kd-sandbox-title"><strong>WHAT COUNTS AS KNOWLEDGE?</strong><span>从输出扩展到结构</span></div><div className="kd-variant-map"><div className="kd-variant-core"><b>Knowledge</b><span>可迁移的结构</span></div>{items.map(([title, desc, id], index) => <button type="button" className={`kd-variant v${index + 1}`} key={id} onMouseEnter={() => onHover(id)} onClick={() => onHover(id)} onFocus={() => onHover(id)}><b>{title}</b><span>{desc}</span></button>)}</div><p className="kd-caption">选择接口的原则：Student 学得动、信号比硬标签丰富、并且和目标任务真正相关。</p></div>
}

function HistoryScene({ onHover }: { onHover: (id: string) => void }) {
  const points = [['1989–2006', '剪枝 / 压缩 / 伪数据', 'history-1989'], ['2014–2015', 'dark knowledge / soft targets', 'history-2014'], ['2018', 'Born-Again 同结构代际蒸馏', 'born-again'], ['2019+', '关系 / 零样本 / teacher-free', 'history-2019']]
  return <div className="kd-sandbox kd-history"><div className="kd-sandbox-title"><strong>RESEARCH TIMELINE / 扩展阅读</strong><span>核心论文与后续路线分开</span></div><div className="kd-history-line">{points.map(([year, label, id], index) => <button type="button" key={id} onMouseEnter={() => onHover(id)} onClick={() => onHover(id)} onFocus={() => onHover(id)}><b>{year}</b><i className={index === 1 ? 'core' : ''} /><span>{label}</span></button>)}</div><p className="kd-caption"><b>边界：</b>2014/2015 是本页面论文的核心节点；其余是帮助理解“知识接口如何扩展”的后续研究线索。</p></div>
}

function CompressionMapScene({ onHover }: { onHover: (id: string) => void }) {
  const lanes: Array<[string, Array<[string, string, string]>]> = [['结构', [['Pruning', '剪枝', 'pruning'], ['EfficientNet / MobileNet', '轻量架构', 'efficient-architecture'], ['Low-rank', '低秩分解', 'low-rank']]], ['数值与知识', [['Quantization', 'INT8 / 低 bit', 'quantization'], ['Knowledge Distillation', 'soft targets / dark knowledge', 'lightweight-map'], ['Attention Transfer', '迁移关注区域', 'attention-transfer']]], ['执行', [['NAS', '搜索精度-成本 Pareto', 'nas'], ['TensorRT / OpenVINO', '算子与 kernel', 'hardware-deploy'], ['Embedded / FPGA', '目标设备落地', 'hardware-deploy']]]]
  return <div className="kd-sandbox kd-compression"><div className="kd-sandbox-title"><strong>LIGHTWEIGHT MODEL MAP / 轻量化神经网络</strong><span>结构 → 知识 → 硬件</span></div><div className="kd-compression-lanes">{lanes.map(([title, items]) => <section key={title}><h3>{title}</h3><div>{items.map(([label, desc, id]) => <button type="button" key={label} onMouseEnter={() => onHover(id)} onClick={() => onHover(id)} onFocus={() => onHover(id)}><b>{label}</b><span>{desc}</span></button>)}</div></section>)}</div><div className="kd-compression-arrow">大模型 <b>→</b> 压缩 / 迁移 / 编译 <b>→</b> 可部署模型</div><p className="kd-caption"><b>与知识蒸馏的关系：</b>蒸馏主要迁移“知识”，剪枝和量化主要改变“载体”；工程上经常组合，而不是互相替代。</p></div>
}

function MetricsScene({ onHover }: { onHover: (id: string) => void }) {
  const metrics = [['Params', '参数量', 'efficiency-metrics'], ['FLOPs / MACs', '计算量', 'efficiency-metrics'], ['Memory access', '访存量', 'efficiency-metrics'], ['Latency', '真实延迟', 'hardware-deploy'], ['Energy', '能耗 / 碳排', 'efficiency-metrics'], ['Accuracy', '任务精度', 'knowledge-distillation']]
  return <div className="kd-sandbox kd-metrics"><div className="kd-sandbox-title"><strong>DEPLOYMENT SCORECARD / 轻量化不能只看参数</strong><span>指标清单 · 无实测数值</span></div><div className="kd-metric-grid">{metrics.map(([label, desc, id]) => <button type="button" key={label} onMouseEnter={() => onHover(id)} onClick={() => onHover(id)} onFocus={() => onHover(id)}><span>{label}</span><small>{desc}</small></button>)}</div><p className="kd-caption"><b>第一性原理：</b>优化目标不是“最小模型”，而是在固定设备和延迟约束下，找到准确率、内存、吞吐、能耗的可接受平衡。</p></div>
}

function DetailedEvidenceScene({ scene, onHover }: { scene: string; onHover: (id: string) => void }) {
  const content: Record<string, { title: string; subtitle: string; items: Array<[string, string, string]> }> = {
    'transfer-details': { title: 'SOFT TARGETS / 信息密度', subtitle: '同一个输入，Teacher 输出一整份分布', items: [['算术/几何平均', '多个 Teacher 的互补判断合成一个目标。', 'arithmetic-mean'], ['高熵目标', '更多非正确类保留非零概率，梯度方差更低。', 'high-entropy-target'], ['未标注 transfer set', '只要能询问 Teacher，不一定必须有人工标签。', 'transfer-set']] },
    'mnist-edge': { title: 'MNIST / MISSING CLASS', subtitle: '没有见过 3，也可能学会 3', items: [['原始结果', '206 errors，其中 133 个发生在 1010 个数字 3 上。', 'mythical-class'], ['调高 3 的 bias', '测试集调 bias +3.5 后109 errors，其中14个在3上（98.6%识别率）；是诊断结果。', 'mythical-class'], ['只用 7/8', '47.3% test errors → 在测试集调低7/8的bias各7.6后13.2%；不是独立测试。', 'mythical-class']] },
    'mnist-setup': { title: 'MNIST / EXPERIMENT SETUP', subtitle: '先看模型规模、正则化与温度扫描', items: [['Teacher', '2 个隐藏层 × 1200 ReLU；dropout、weight constraints、±2 像素 jitter。', 'dropout-ensemble'], ['Student', '2 个隐藏层 × 800 ReLU；直接 hard label 训练时 146 errors。', 'student'], ['温度结果', '≥300 单元/层时 T>8 近似；30 单元/层时 T=2.5–4 更好。', 'temperature-sweep']] },
    'speech-detail': { title: 'SPEECH / ACOUSTIC MODEL', subtitle: '局部帧分类如何连接到最终 WER', items: [['输入', '26 帧 × 40 维 Mel filter-bank，预测第 21 帧。', 'speech-acoustic-model'], ['模型', '8 层 × 2560 ReLU，14,000 HMM labels，约 85M 参数。', 'speech-acoustic-model'], ['结果', 'Baseline 58.9% / 10.9% WER；Distilled 60.8% / 10.7% WER。', 'wer-mismatch']] },
    'asr-objective': { title: 'ASR / FORCED ALIGNMENT', subtitle: '训练目标与最终解码目标并不完全相同', items: [['声学模型', 'P(hₜ | sₜ; θ) 把短时波形特征映射到 HMM 状态概率。', 'asr-hmm'], ['训练标签', '用真实词序列的 forced alignment 得到每帧 HMM 状态 hₜ。', 'forced-alignment'], ['系统解码', 'decoder 同时考虑声学概率、HMM 路径和 language model，最终看 WER。', 'wer-mismatch']] },
    'jft-details': { title: 'JFT / SPECIALIST PIPELINE', subtitle: 'generalist 选路，specialist 解决局部难点', items: [['数据', '约 1 亿标注图像、15,000 labels。', 'jft-dataset'], ['训练', '61 个 specialist，每个约 300 类 + dustbin；从 generalist 初始化。', 'specialist-initialization'], ['推理', 'generalist top-1 → active specialists → 联合 KL 优化全类分布。', 'specialist-inference']] },
    'jft-objective': { title: 'JFT / EQUATION (5)', subtitle: 'specialist 与 generalist 如何合成全类别分布', items: [['联合目标', 'min_q KL(p_g, q) + Σₘ∈Aₖ KL(pₘ, q)。', 'specialist-objective'], ['dustbin 修正', 'specialist 类别被过采样时，把 dustbin logit 加上 oversampling 比例的 log。', 'dustbin-correction'], ['计算方式', '令 q=softmax(z)，T=1；每张图用梯度下降优化 logits z。', 'specialist-inference']] },
    'jft-results': { title: 'RESULTS / REGULARIZATION / MoE', subtitle: '论文结论与边界放在同一张卡片上', items: [['JFT', 'overall top-1 25.0% → 26.1%；conditional 43.1% → 45.9%。', 'specialist-results'], ['3% 数据', 'hard 44.5% test frame accuracy；soft 57.0%，无需 early stopping。', 'soft-regularizer'], ['边界', '论文尚未证明 specialist 知识已经回蒸到单个大模型。', 'discussion-limit']] },
  }
  const data = content[scene]
  return <div className="kd-sandbox kd-evidence"><div className="kd-sandbox-title"><strong>{data.title}</strong><span>{data.subtitle}</span></div><div className="kd-evidence-grid">{data.items.map(([label, text, id]) => <button type="button" key={label} onMouseEnter={() => onHover(id)} onClick={() => onHover(id)} onFocus={() => onHover(id)}><b>{label}</b><span>{text}</span></button>)}</div><p className="kd-caption"><b>读法：</b>先看事实，再悬停节点理解它为什么成立、系统如何实现，以及不做这一步会牺牲什么。</p></div>
}

function SoftTargetsScene({ onHover }: { onHover: (id: string) => void }) {
  const [temperature, setTemperature] = useState(4)
  const p1 = softmax(logits), pT = softmax(logits, temperature)
  return <div className="kd-sandbox kd-soft-targets"><div className="kd-sandbox-title"><strong>ONE-HOT vs TEACHER</strong><span>自设6类 logits · 非实验测量</span></div><label className="kd-slider">Temperature T <b>{temperature}</b><input aria-label="soft targets 温度" type="range" min="1" max="20" step="1" value={temperature} onChange={e=>setTemperature(Number(e.target.value))} /></label><div className="kd-target-header"><span>类别 / logit</span><span>真实 one-hot</span><span>Teacher · T=1</span><span>Teacher · T={temperature}</span></div>{labels.map((label,i)=><div className="kd-target-row" key={label}><span>{label}<small>vᵢ={logits[i]}</small></span>{[Number(i===0),p1[i],pT[i]].map((p,j)=><button type="button" key={j} onMouseEnter={()=>onHover(j===0?'hard-targets':'dark-knowledge')} onClick={()=>onHover(j===0?'hard-targets':'dark-knowledge')} onFocus={()=>onHover(j===0?'hard-targets':'dark-knowledge')}><i style={{width:`${p*100}%`}} /><b>{(p*100).toFixed(2)}%</b></button>)}</div>)}<p className="kd-caption">one-hot只给BMW一票，其余全0；Teacher对错误类的不同概率表达泛化关系。提高T并不改变logit排序，但会把比值 exp((vᵢ−vⱼ)/T) 拉近1，让小概率在训练中有更可见的权重。T→∞趋近均匀，不会凭空产生新知识。§1 pp.1–2 / Eq.(1)。</p></div>
}

function RegularizationScene({ onHover }: { onHover: (id: string) => void }) {
  return <div className="kd-sandbox kd-regularization"><div className="kd-sandbox-title"><strong>TABLE 5 · SOFT TARGETS AS REGULARIZERS</strong><span>原文 pp.7–8 · 同一85M网络</span></div><div className="kd-reg-legend"><i />训练准确率 <i />测试准确率 · 共同0–100%轴</div>{regularizationResults.map(x=><button type="button" className="kd-reg-row" key={x.system} onMouseEnter={()=>onHover('soft-regularizer')} onClick={()=>onHover('soft-regularizer')} onFocus={()=>onHover('soft-regularizer')}><b>{x.system}</b><span><i style={{width:`${x.train}%`}} />{x.train.toFixed(1)}%</span><span><i style={{width:`${x.test}%`}} />{x.test.toFixed(1)}%</span><small>训练−测试差距 {(x.train-x.test).toFixed(1)} 个百分点</small></button>)}<p className="kd-caption">3% hard训练准确率更高，测试却降至44.5%：这是过拟合。soft目标将测试准确率恢复至57.0%，同时无需early stopping。teacher先见过100%数据，所以是通过soft分布传递全量数据的规律，不能解读为无条件节省97%的总数据成本。</p></div>
}

function JFTResultsScene({ onHover }: { onHover: (id: string) => void }) {
  const [metric,setMetric]=useState<'overall'|'conditional'>('overall')
  return <div className="kd-sandbox"><div className="kd-sandbox-title"><strong>TABLE 3 · JFT TOP-1</strong><span>论文p.7 · specialist ensemble</span></div><div className="kd-mode-switch"><button type="button" aria-pressed={metric==='overall'} className={metric==='overall'?'active':''} onClick={()=>setMetric('overall')}>整体 test accuracy</button><button type="button" aria-pressed={metric==='conditional'} className={metric==='conditional'?'active':''} onClick={()=>setMetric('conditional')}>条件 conditional accuracy</button></div>{jftResults.map(x=><button type="button" className="kd-source-bar" key={x.system} onMouseEnter={()=>onHover('specialist-results')} onClick={()=>onHover('specialist-results')} onFocus={()=>onHover('specialist-results')}><span>{x.system}</span><i style={{width:`${x[metric]}%`}} /><b>{x[metric].toFixed(1)}%</b></button>)}<p className="kd-caption">共同0–100%刻度。{metric==='overall'?'整体25.0→26.1%，+1.1个百分点，即相对+4.4%。':'条件43.1→45.9%，只看specialist类别的样本，并限制预测候选类别；不是整体精度。'}这两个指标不能对调。61个specialist的集合可以重叠；更完整的Table4覆盖数量和Table5正则化对照见顶部“原文对照”。</p><button type="button" className="kd-flow-total" onMouseEnter={()=>onHover('discussion-limit')} onClick={()=>onHover('discussion-limit')} onFocus={()=>onHover('discussion-limit')}>§8：specialist → 单模型的回蒸尚未验证</button></div>
}

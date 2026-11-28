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
  if (scene === 'match') return <MatchScene onHover={onHover} />
  if (scene === 'numbers') return <MNISTScene onHover={onHover} />
  if (scene === 'confusable') return <SpecialistScene onHover={onHover} />
  if (scene === 'speech-results') return <SpeechScene onHover={onHover} />
  if (scene === 'pytorch') return <FlowScene playing={playing} onHover={onHover} />
  if (scene === 'bmw') return <FlowScene playing={playing} onHover={onHover} />
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

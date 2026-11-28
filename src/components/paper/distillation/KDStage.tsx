import { KDScene } from './KDScenes'
import type { KDSent } from '../../../data/papers/distillation/lessons'

export function KDStage({ step, playing, onHover }: { step: KDSent; playing: boolean; onHover: (id: string) => void }) {
  const specialist = ['confusable', 'jft-details', 'jft-objective', 'jft-results'].includes(step.id)
  const extension = ['taxonomy', 'variants', 'history', 'compression-map', 'metrics'].includes(step.id)
  return <div className="kd-stage" data-scene={step.id}>
    <div className="kd-stage-top"><span>{extension ? 'EXTENSION / 非原论文实验' : 'INTERACTIVE EXPLORER / KNOWLEDGE DISTILLATION'}</span><span>{playing ? '交互可用' : '装饰动画暂停'}</span></div>
    <div className="kd-equation-strip">{specialist ? <>Generalist <b>→</b> active specialists <b>→</b> 每张图联合求 q</> : extension ? <>后续范式与相邻技术 <b>·</b> 与原文结果分开阅读</> : <>Teacher function <b>→</b> soft targets <b>→</b> Student function <b>→</b> deploy</>}</div>
    <KDScene scene={step.id} playing={playing} onHover={onHover} />
  </div>
}

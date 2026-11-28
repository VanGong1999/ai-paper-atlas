import { KDScene } from './KDScenes'
import type { KDSent } from '../../../data/papers/distillation/lessons'

export function KDStage({ step, playing, onHover }: { step: KDSent; playing: boolean; onHover: (id: string) => void }) {
  return <div className="kd-stage" data-scene={step.id}><div className="kd-stage-top"><span>INTERACTIVE EXPLORER / KNOWLEDGE DISTILLATION</span><span>{playing ? 'ANIMATION ON' : 'PAUSED'}</span></div><div className="kd-equation-strip">Teacher function <b>→</b> soft targets <b>→</b> Student function <b>→</b> deploy</div><KDScene scene={step.id} playing={playing} onHover={onHover} /></div>
}

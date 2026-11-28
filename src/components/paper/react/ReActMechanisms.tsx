import { useEffect, useState } from 'react'
import { ConceptHelp } from '../ConceptHelp'
import { SourceArchive } from '../SourceArchive'
import { chooseFallback, trajectoryContext } from '../../../data/papers/react/simulation'
import { reactTrajectories } from '../../../data/papers/react/content'
import source from '../../../data/papers/react/source-pages.json'
import type { TrajectoryEvent } from '../../../data/papers/react/types'
import { reactConcepts as concepts } from './reactConcepts'

export function ContextTrajectory({events,speed,onSpeedChange}:{events:TrajectoryEvent[];speed:number;onSpeedChange:(speed:number)=>void}) {
 const [active,setActive]=useState(0),[playing,setPlaying]=useState(false)
 useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setActive(current=>{if(current>=events.length-1){setPlaying(false);return current}return current+1}),1400/speed);return()=>window.clearInterval(timer)},[events.length,playing,speed])
 const event=events[active],state=trajectoryContext(events,active)
 const kind=event.kind==='answer'?'action':event.kind
 return <section className="react-context-player" aria-label="逐步轨迹与上下文">
  <header><div><span className="react-kicker">FIGURE 1 · PDF P.2 · 原文节选重播</span><h3>一次决策，留下什么？</h3></div><span>{active+1}/{events.length}</span></header>
  <p className="react-trajectory-task"><b>任务</b> {events===reactTrajectories.appleRemote?'除Apple Remote外，还可用什么设备控制它最初设计服务的程序？':'把pepper shaker放进drawer；位置与子目标需要持续跟踪。'}</p><div className="react-phase-flow">{(['thought','action','observation'] as const).map((phase,index)=><div key={phase} className={kind===phase?'current':''}><ConceptHelp concept={concepts[phase]}><b>{index+1}</b><span>{phase==='thought'?'Thought':phase==='action'?'Action':'Observation'}</span></ConceptHelp><small>{phase==='thought'?'追加语言状态':phase==='action'?'向环境发送命令':'环境返回反馈'}</small>{index<2&&<i>→</i>}</div>)}</div>
  <div className={`react-current-event react-${event.kind}`} aria-live="polite"><span>{event.label} · {event.kind==='thought'?'模型语言':event.kind==='observation'?'环境证据':'模型动作'}</span><p>{event.text}</p><small>{event.kind==='thought'?'Thought 已加入 context；没有产生新的环境观测。':event.kind==='action'?'动作已选定；反馈要到下一 Observation 才可用。':event.kind==='answer'?'Finish 提交答案；这不等于另一次检索。':'此环境反馈已加入 context，可用于后续计划。'}</small></div>
  <div className="react-play-controls"><button onClick={()=>{setActive(0);setPlaying(false)}}>重置轨迹</button><button disabled={!active} onClick={()=>{setActive(i=>i-1);setPlaying(false)}}>← 前一事件</button><button onClick={()=>{if(active===events.length-1)setActive(0);setPlaying(p=>!p)}}>{playing?'暂停轨迹':'播放轨迹'}</button><button disabled={active===events.length-1} onClick={()=>{setActive(i=>i+1);setPlaying(false)}}>下一事件 →</button><label>轨迹速度<select aria-label="轨迹播放速度" value={speed} onChange={e=>onSpeedChange(Number(e.target.value))}>{[.7,1,1.5].map(v=><option key={v} value={v}>{v}×</option>)}</select></label></div>
  <input className="react-progress" aria-label="轨迹进度" type="range" min={0} max={events.length-1} value={active} onChange={e=>{setActive(Number(e.target.value));setPlaying(false)}} />
  <div className="react-context-ledger"><header><ConceptHelp concept={concepts.context}>当前 context</ConceptHelp><span>{state.thoughts.length} 个Thought · {state.observations.length} 个环境观测</span></header><ol>{events.slice(0,active+1).map((item,i)=><li key={i} className={`react-${item.kind}`}><b>{item.label}</b><span>{item.text}</span></li>)}</ol></div>
  <p className="react-mechanism-note">教学重播保留原文动作编号跳跃；部分步骤与长观测作节选。不会访问实时Wikipedia或运行真实游戏。</p>
 </section>
}

export function GroundingComparison(){
 const [method,setMethod]=useState<'Standard'|'CoT'|'Act'|'ReAct'>('ReAct')
 const thought=method==='CoT'||method==='ReAct',external=method==='Act'||method==='ReAct'
 return <section className="react-comparison-lab"><h3>保持同一问题，切换可用的信息通路</h3><p>Apple Remote 最初控制的程序，还可用什么输入设备控制？</p><div className="react-method-tabs" role="group" aria-label="对照提示方法">{(['Standard','CoT','Act','ReAct'] as const).map(value=><button key={value} aria-pressed={method===value} onClick={()=>setMethod(value)}>{value}</button>)}</div><div className="react-information-path"><article className={thought?'enabled':'disabled'}><ConceptHelp concept={concepts.thought}>语言推理</ConceptHelp><p>{thought?'允许写下计划、提取信息和综合答案。':'移除显式Thought轨迹。'}</p></article><span>＋</span><article className={external?'enabled':'disabled'}><ConceptHelp concept={concepts.action}>环境接口</ConceptHelp><p>{external?'允许Search/Lookup，并接收Observation。':'没有外部检索反馈。'}</p></article></div><div className="react-example-preview" aria-live="polite"><b>{method} · 格式教学对照</b>{method==='Standard'?<p>Question → Answer：直接输出答案。</p>:<ol>{reactTrajectories.appleRemote.slice(0,3).filter(e=>e.kind==='thought'?thought:external).map(e=><li key={e.label}><b>{e.label}</b> {e.text}</li>)}</ol>}</div><p className="react-mechanism-note">这里控制轨迹包含哪些元素，不用滑块伪造“grounding百分比”。片段按同一个ReAct案例拆解；各方法真正生成的不同答案见Figure 1。</p><a href="/article/2210.03629v3.pdf#page=2" target="_blank" rel="noreferrer">对照原始 Figure 1 ↗</a></section>
}

export function FallbackExperiment(){
 const [method,setMethod]=useState<'cot'|'react'>('cot'),[task,setTask]=useState<'hotpotqa'|'fever'>('hotpotqa'),[samples,setSamples]=useState(8),[majority,setMajority]=useState(3),[steps,setSteps]=useState(4)
 const result=chooseFallback(method,samples,majority,steps,task),budget=task==='hotpotqa'?7:5
 return <section className="react-fallback-lab"><header><ConceptHelp concept={concepts.fallback}><h3>什么时候切换策略？</h3></ConceptHelp><span>§3.2 · 教学判定器</span></header><div className="react-lab-fields"><label>起始方法<select aria-label="起始方法" value={method} onChange={e=>setMethod(e.target.value as 'cot'|'react')}><option value="cot">CoT-SC → ReAct</option><option value="react">ReAct → CoT-SC</option></select></label><label>任务<select aria-label="切换任务" value={task} onChange={e=>setTask(e.target.value as 'hotpotqa'|'fever')}><option value="hotpotqa">HotpotQA</option><option value="fever">FEVER</option></select></label></div>{method==='cot'?<><label className="react-lab-range">CoT-SC 样本数 n = {samples}<input aria-label="CoT样本数" type="range" min={1} max={21} value={samples} onChange={e=>{const n=Number(e.target.value);setSamples(n);setMajority(m=>Math.min(m,n))}} /></label><label className="react-lab-range">最高票答案次数 m = {majority}<input aria-label="最高票答案次数" type="range" min={1} max={samples} value={majority} onChange={e=>setMajority(Number(e.target.value))} /></label><div className="react-vote-strip" aria-label={`${majority}个最高票答案，样本总数${samples}`}>{Array.from({length:samples},(_,i)=><span key={i} className={i<majority?'majority':''}>{i<majority?'A':String.fromCharCode(66+(i-majority)%25)}</span>)}</div><p>判定：{majority} {majority<samples/2?'＜':'≥'} {samples}/2 = {samples/2}</p></>:<><label className="react-lab-range">仍未给出答案的步骤 = {steps}<input aria-label="ReAct未回答步骤数" type="range" min={0} max={10} value={steps} onChange={e=>setSteps(Number(e.target.value))} /></label><div className="react-budget-strip">{Array.from({length:budget},(_,i)=><span key={i} className={i<steps?'used':''}>{i+1}</span>)}</div><p>{task==='hotpotqa'?'HotpotQA':'FEVER'}预算为{budget}步；此处假设尚未返回答案。</p></>}<output className={`react-fallback-result ${result!=='continue'?'switch':''}`} aria-live="polite">{result==='react'?'共识不足 → 切换 ReAct 检索':result==='cot-sc'?'步数预算已用尽 → 回退 CoT-SC':'继续当前方法；切换条件尚未触发'}</output><p className="react-mechanism-note">严格小于：恰好半数不触发该规则。票数与步骤由你设定，不是模型新实验；不展示推测准确率。</p></section>
}

const entries=[
 {id:'f1',title:'Figure 1 · 四种方法与两条轨迹',page:2,description:'QA 与 ALFWorld'},
 {id:'f2',title:'Table 1 / Figure 2 · 组合与采样',page:5,description:'两任务结果及CoT-SC样本数'},
 {id:'t2',title:'Table 2 · 成功/失败诊断',page:6,description:'分组条件百分比'},
 {id:'f3',title:'Figure 3 · Scaling',page:7,description:'原始prompting/finetuning面板'},
 {id:'t34',title:'Tables 3–4 · 交互任务',page:8,description:'ALFWorld / WebShop'},
 {id:'a',title:'A.1–A.2 · Table 5 / Figure 4',page:14,description:'GPT-3 / 过时标签'},
 {id:'ethics',title:'复现与伦理声明',page:10,description:'PaLM可访问性与实验动作边界'},
 {id:'b',title:'Figure 5 / B · 人类编辑与训练',page:15,description:'思考编辑与微调细节'},
 {id:'c1',title:'C.1 · HotpotQA prompts',page:16,description:'16–19页，完整4种格式'},
 {id:'c2',title:'C.2 · FEVER prompts',page:20,description:'20–21页，三类判定'},
 {id:'c3',title:'C.3 · WebShop / Table 6',page:22,description:'属性选择与购买'},
 {id:'c4',title:'C.4 · ALFWorld / Tables 7–9',page:23,description:'23–25页，Act/ReAct/IM'},
 {id:'d1',title:'D.1 · FEVER轨迹',page:26,description:'26–27页，模型预测案例'},
 {id:'d2',title:'D.2 · ALFWorld三方法',page:28,description:'28–30页，clean knife任务'},
 {id:'d3',title:'D.3 · WebShop / Table 10',page:31,description:'属性约束与0.125/1.0单例得分'},
 {id:'e',title:'E.1 · 成功与失败案例',page:32,description:'32–33页，诊断Table 2'},
]
export function ReActSourceStage({page,title}:{page:number;title:string}){return <SourceArchive title={title} pdf={source.pdf} imageRoot="article/react/pages" pages={source.pages} entries={entries} initialPage={page} />}

export function ScalingStage(){return <div className="react-source-stage"><ConceptHelp concept={concepts.scaling}><h3>原图 Figure 3：Prompting 与 Finetuning</h3></ConceptHelp><p>小模型prompting时ReAct最难学；用3,000条最终答案正确的轨迹微调后，在8B/62B比较中表现最好。直接查看原图，不为柱子补造精确EM读数。</p><figure className="react-original-figure"><div><svg viewBox="165 125 625 230" role="img" aria-label="原文Figure3：PaLM规模与四种方法在prompting和finetuning两面板的HotpotQA EM柱状图"><image href={`${import.meta.env.BASE_URL}article/react/pages/page-7.png`} width="949" height="1235" /></svg></div><figcaption>Figure 3 原图局部 · 下方原文档案保留完整第7页与上下文；没有新增数值标注。</figcaption></figure><ReActSourceStage page={7} title="ReAct · Figure 3" /></div>}
export function TrainingDetails(){return <section className="react-training-details"><h3>同样的3,000条训练样本，区别在轨迹结构</h3><p>Batch size = 64；训练目标是给定问题生成轨迹（包括thought、action、observation），与推理时由环境返回观测的流程分开看。</p><table className="react-data-table"><thead><tr><th>PaLM</th><th>ReAct / Act</th><th>Standard / CoT</th></tr></thead><tbody><tr><td>8B</td><td>4,000步</td><td>2,000步</td></tr><tr><td>62B</td><td>4,000步</td><td>1,000步</td></tr></tbody></table><p>ReAct-IM保留目标分解和当前子目标的外部反馈表达；缺少完成判定、选择下一子目标、用内部常识推断物体位置等自由思考。完整原始提示可与Tables 7–9对照。</p><ReActSourceStage page={15} title="ReAct · Appendix B" /></section>}

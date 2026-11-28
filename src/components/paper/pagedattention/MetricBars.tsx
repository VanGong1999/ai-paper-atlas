type Metric = { label: string; baseline: number; vllm: number; unit: string }

export function MetricBars({ metrics }: { metrics: Metric[] }) {
  return <div className="metric-bars" aria-label="论文结果对比条形图">
    {metrics.map(metric => <div className="metric-row" key={metric.label}>
      <div className="metric-label"><strong>{metric.label}</strong><span>{metric.unit}</span></div>
      <div className="metric-track"><span className="metric-base" style={{ width: `${metric.baseline}%` }} /><span className="metric-vllm" style={{ width: `${metric.vllm}%` }} /></div>
      <div className="metric-values"><span>baseline {metric.baseline}</span><strong>vLLM {metric.vllm}</strong></div>
    </div>)}
    <div className="metric-key"><span className="metric-base-key" /> baseline <span className="metric-vllm-key" /> vLLM <em>derived teaching scale</em></div>
  </div>
}

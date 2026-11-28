type Props = { blockSize: number; requestCount: number; sharing: boolean }

export function KVCacheDiagram({ blockSize, requestCount, sharing }: Props) {
  const rows = Array.from({ length: requestCount }, (_, request) => request)
  return <div className="kv-diagram" aria-label="KV Cache 请求共享关系图">
    <div className="kv-diagram-title"><span>REQUESTS</span><strong>KV Cache ownership</strong></div>
    {rows.map(request => <div className="kv-request" key={request}>
      <span className="kv-request-id">R{request + 1}</span>
      <div className="kv-segments">{Array.from({ length: Math.max(3, blockSize - 1) }, (_, block) => <span key={block} className={sharing && block < 2 ? 'shared' : ''}>{sharing && block < 2 ? 'shared' : `b${block + 1}`}</span>)}</div>
      <small>{sharing && request > 0 ? 'prefix 引用' : 'owned blocks'}</small>
    </div>)}
    <div className="kv-legend"><span className="shared-dot" /> shared prefix <span className="owned-dot" /> private suffix</div>
  </div>
}

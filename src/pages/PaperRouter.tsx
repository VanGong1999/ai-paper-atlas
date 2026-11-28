import { Link, useParams } from 'react-router-dom'
import { Suspense } from 'react'
import { getPaperPage } from '../data/papers/registry'

export function PaperRouter() {
  const { slug = '' } = useParams()
  const Page = getPaperPage(slug)

  if (!Page) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>尚未接入这篇可视化</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
          slug「{slug}」还没有对应页面。在 <code>src/data/papers/registry.ts</code> 注册即可扩展。
        </p>
        <Link to="/" className="chip active">
          ← 返回时间线
        </Link>
      </div>
    )
  }

  return <Suspense fallback={<div role="status" style={{ padding: 24, color: 'var(--muted)' }}>正在载入论文交互工作台…</div>}><Page /></Suspense>
}

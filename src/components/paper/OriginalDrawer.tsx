import { originals } from '../../data/papers/attention/originals-en'

type Props = {
  originalId?: string
}

export function OriginalDrawer({ originalId }: Props) {
  const passage = originalId ? originals[originalId] : undefined

  if (!passage) {
    return (
      <aside className="original-drawer">
        <h3>英文原文对照</h3>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>选择章节或步骤后，这里显示对应英文摘录。</p>
      </aside>
    )
  }

  return (
    <aside className="original-drawer">
      <div className="eyebrow">{passage.pdfNote || passage.section}</div>
      <h3>{passage.section}</h3>
      <pre>{passage.en}</pre>
      <p style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
        摘录用于对照阅读；完整内容请打开 PDF。
      </p>
    </aside>
  )
}

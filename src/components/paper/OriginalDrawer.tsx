import { originals } from '../../data/papers/attention/originals-en'
import originalText from './attention-original-text.json'
import { SourceBadge } from './SourceBadge'

const reading: Record<string, string[]> = originalText

export function OriginalDrawer({ originalId }: { originalId: string }) {
  const passage = originals[originalId]

  return (
    <aside className="original-drawer" id="paper-original" aria-labelledby="paper-original-heading" tabIndex={0}>
      <header className="fulltext-heading">
        <div className="paper-label">英文原文</div>
        <h3 id="paper-original-heading" lang="en">{passage.section}</h3>
        <div className="source-row">
          <SourceBadge source={passage.source} />
          <a className="fulltext-jump" href="#paper-translation">中文 ↑</a>
        </div>
        {passage.source.locator !== passage.section && (
          <div className="original-locator">PDF 定位 · <span lang="en">{passage.source.locator}</span></div>
        )}
      </header>
      <div className="original-prose" lang="en" data-original-id={originalId}>
        {reading[originalId].filter(paragraph => paragraph !== passage.section).map((paragraph, index) => (
          <p key={index} className={/^(?:Attention\(|MultiHead\(|where headᵢ =|FFN\(|PE\(|lrate =)/.test(paragraph)
            ? 'reader-equation' : undefined}>{paragraph}</p>
        ))}
      </div>
    </aside>
  )
}

import { pdfAsset, type PaperSource } from '../../data/papers/attention/originals-en'

type Props = {
  source: PaperSource
  reference?: string
  href?: string
}

export function SourceBadge({ source, reference, href = `${pdfAsset}#page=${source.page}` }: Props) {
  const pages = source.endPage && source.endPage !== source.page
    ? `pp. ${source.page}–${source.endPage}`
    : `p. ${source.page}`

  return (
    <a className="source-badge" href={href} target="_blank" rel="noreferrer">
      {reference && <strong>{reference}</strong>}
      <span>{source.section}</span>
      <span className="source-pages">PDF {pages} ↗</span>
    </a>
  )
}

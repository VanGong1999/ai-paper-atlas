import type { PaperFigure } from '../../data/papers/attention/figures.ts'
import { fulltextZh } from '../../data/papers/attention/fulltext-zh.ts'

// Task 1 stores translated captions as paragraphs. Resolve identity before
// looking at the page so a second caption on a different page is ambiguous.
export function appendixCaptionsById() {
  const captions = new Map<string, { text: string; page?: number }[]>()
  for (const block of fulltextZh.filter(block => block.id === 'appendix')) {
    for (const text of block.paragraphs) {
      const heading = /^\s*图\s*(\d+)(?:（第\s*(\d+)\s*页）)?/u.exec(text)
      if (!heading) continue
      const id = `figure-${heading[1]}`
      const entries = captions.get(id) ?? []
      entries.push({ text, page: heading[2] ? Number(heading[2]) : undefined })
      captions.set(id, entries)
    }
  }
  return captions
}

export function appendixCaptionFor(figure: PaperFigure, captions: ReturnType<typeof appendixCaptionsById>) {
  const entries = captions.get(figure.id)
  if (entries?.length === 1 && entries[0].page === figure.source.page) return entries[0].text
}

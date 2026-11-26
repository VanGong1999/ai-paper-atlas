import { paperRegistry } from './registry'
import { timeline, type TimelineEvent } from '../timeline'

/** 已收录：优先论文 / 开源权重，以及已有可视化页的条目 */
export function getCatalog(): TimelineEvent[] {
  return timeline
    .filter(
      (e) =>
        e.kind === '论文' ||
        e.kind === '开源权重' ||
        Boolean(e.visual) ||
        Boolean(e.url),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getCatalogEntry(id: string) {
  return timeline.find((e) => e.id === id)
}

export function hasInteractivePage(event: TimelineEvent) {
  if (!event.visual) return false
  const slug = event.visual.replace(/^\/papers\//, '')
  return Boolean(paperRegistry[slug])
}

import { paperRegistry } from './registry'
import { timeline, type TimelineEvent } from '../timeline'

/** 已收录：只展示已经注册交互式可视化页面的论文 */
export function getCatalog(): TimelineEvent[] {
  return timeline
    .filter((e) => hasInteractivePage(e))
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

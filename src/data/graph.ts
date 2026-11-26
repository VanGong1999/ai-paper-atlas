import type { TimelineEvent } from './timeline'

export type GraphNodeKind = 'event' | 'org' | 'topic'

export type OrbitNode = {
  id: string
  name: string
  kind: GraphNodeKind
  group: string
  val: number
  color: string
  event?: TimelineEvent
}

export type OrbitLink = {
  source: string
  target: string
  kind: 'org' | 'topic' | 'related'
}

export type OrbitGraph = {
  nodes: OrbitNode[]
  links: OrbitLink[]
}

const TOPIC_COLOR: Record<string, string> = {
  'AI Infra': '#7eb8d4',
  'AI Agent': '#b8a4e3',
  推理: '#f3a776',
  模型架构: '#d3fa72',
  蒸馏: '#9ad0a0',
  量化: '#c4b5a0',
  训练系统: '#86c5a8',
  长上下文: '#8ec8d4',
}

export function eventColor(event: TimelineEvent) {
  if (event.topics.includes('AI Infra')) return TOPIC_COLOR['AI Infra']
  if (event.topics.includes('AI Agent')) return TOPIC_COLOR['AI Agent']
  if (event.topics.includes('推理')) return TOPIC_COLOR['推理']
  return TOPIC_COLOR['模型架构']
}

export function buildOrbitGraph(events: TimelineEvent[]): OrbitGraph {
  const nodes: OrbitNode[] = []
  const links: OrbitLink[] = []
  const seen = new Set<string>()

  const addNode = (node: OrbitNode) => {
    if (seen.has(node.id)) return
    seen.add(node.id)
    nodes.push(node)
  }

  for (const event of events) {
    addNode({
      id: event.id,
      name: event.title,
      kind: 'event',
      group: event.topics[0] || '模型架构',
      val: event.visual ? 8 : 5,
      color: eventColor(event),
      event,
    })

    const orgId = `org:${event.org}`
    addNode({
      id: orgId,
      name: event.org,
      kind: 'org',
      group: 'org',
      val: 10,
      color: '#9aaa8e',
    })
    links.push({ source: event.id, target: orgId, kind: 'org' })

    for (const topic of event.topics) {
      const topicId = `topic:${topic}`
      addNode({
        id: topicId,
        name: topic,
        kind: 'topic',
        group: topic,
        val: topic === 'AI Infra' || topic === 'AI Agent' ? 12 : 8,
        color: TOPIC_COLOR[topic] || '#d3fa72',
      })
      links.push({ source: event.id, target: topicId, kind: 'topic' })
    }

    for (const rid of event.related || []) {
      if (events.some((e) => e.id === rid)) {
        links.push({ source: event.id, target: rid, kind: 'related' })
      }
    }
  }

  return { nodes, links }
}

export function topicStats(events: TimelineEvent[]) {
  const map = new Map<string, number>()
  for (const e of events) {
    for (const t of e.topics) map.set(t, (map.get(t) || 0) + 1)
  }
  return [...map.entries()]
    .map(([topic, count]) => ({ topic, count, color: TOPIC_COLOR[topic] || '#d3fa72' }))
    .sort((a, b) => b.count - a.count)
}

export function orgStats(events: TimelineEvent[]) {
  const map = new Map<string, number>()
  for (const e of events) map.set(e.org, (map.get(e.org) || 0) + 1)
  return [...map.entries()]
    .map(([org, count]) => ({ org, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

export type StageKind =
  | 'overview'
  | 'compare'
  | 'loop'
  | 'wikipedia'
  | 'table1'
  | 'table2'
  | 'scale'
  | 'alfworld'
  | 'webshop'
  | 'ablation'
  | 'related'
  | 'appendix'

export type Evidence = {
  page: number
  locator: string
  note: string
}

export type CourseStep = {
  id: string
  title: string
  kicker: string
  summary: string
  firstPrinciples: string
  importance: string
  stage: StageKind
  evidence: Evidence
  tags: string[]
}

export type Chapter = {
  id: string
  number: string
  title: string
  subtitle: string
  steps: CourseStep[]
}

export type TrajectoryEvent = {
  kind: 'thought' | 'action' | 'observation' | 'answer'
  label: string
  text: string
  source?: Evidence
}

export type TableRow = {
  method: string
  values: number[]
  note?: string
}

export type AlfworldRow = {
  method: string
  values: number[]
}

export type ModelRow = {
  model: string
  values: number[]
}

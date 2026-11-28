import { reactChapters, reactEvidence, reactTable1, reactTable2, reactTable3, reactTable4, reactTable5 } from '../src/data/papers/react/content.ts'

const fail = message => { console.error(`ReAct audit failed: ${message}`); process.exitCode = 1 }
const stepCount = reactChapters.reduce((total, chapter) => total + chapter.steps.length, 0)
if (reactChapters.length !== 7 || stepCount !== 49) fail(`expected 7 chapters / 49 steps, got ${reactChapters.length} / ${stepCount}`)
if (reactEvidence.length !== 49) fail(`expected one evidence locator per step, got ${reactEvidence.length}`)
if (reactTable1.length !== 8 || reactTable2.length !== 6 || reactTable3.length !== 7 || reactTable4.length !== 5 || reactTable5.length !== 2) fail('published table row counts changed')
for (const step of reactChapters.flatMap(chapter => chapter.steps)) if (!step.evidence.page || !step.evidence.locator) fail(`missing source locator for ${step.id}`)
if (!process.exitCode) console.log('ReAct coverage audit passed: 7 chapters, 49 steps, 49 evidence locators, Tables 1-5 present.')

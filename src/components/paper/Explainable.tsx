import { AnimatePresence } from 'framer-motion'
import {
  createContext, useContext, useEffect, useId, useMemo, useRef, useState,
  type ComponentPropsWithoutRef, type FocusEvent, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { explainables, type Explainable as ExplainableContent, type ExplainableId } from '../../data/papers/attention/explainables'
import { TooltipPop } from './TooltipPop'

type Target = {
  owner: string
  explanation: ExplainableId
  content?: ExplainableContent
  identity?: string
  example?: string
  element: Element
  pointer?: { x: number; y: number }
}

type Controller = {
  activeOwner?: string
  open: (target: Target) => void
  leave: (owner: string, pointer: boolean) => void
  retain: (owner: string) => void
  release: (owner: string) => void
  dismiss: (owner?: string) => void
  select?: (id: ExplainableId, example?: string, content?: ExplainableContent) => void
}

const Overlay = createContext<Controller | null>(null)

export function ExplainableScope({ children, onSelectExplainable }: {
  children: ReactNode
  onSelectExplainable?: Controller['select']
}) {
  const [active, setActive] = useState<Target | null>(null)
  const controller = useMemo(() => {
    const intents: { hover?: Target; focus?: Target } = {}
    let shown: string | undefined
    let pending: { owner?: string; timer: number } | undefined
    let retainedOwner: string | undefined

    function cancelPending() {
      if (pending) window.clearTimeout(pending.timer)
      pending = undefined
    }

    function display(target?: Target) {
      cancelPending()
      shown = target?.owner
      setActive(target ?? null)
    }

    function update() {
      const target = intents.hover ?? intents.focus
      if (retainedOwner) {
        if (!target || target.owner === retainedOwner) {
          cancelPending()
          return
        }
        retainedOwner = undefined
      }
      if (shown === target?.owner) {
        if (target) display(target)
        else cancelPending()
      } else if (!pending || pending.owner !== target?.owner) {
        cancelPending()
        pending = {
          owner: target?.owner,
          timer: window.setTimeout(() => display(intents.hover ?? intents.focus), target ? 100 : 260),
        }
      }
    }

    return {
      open(target: Target) {
        if (target.pointer) {
          intents.hover = target
          update()
        } else {
          delete intents.hover
          intents.focus = target
          retainedOwner = undefined
          display(target)
        }
      },
      leave(owner: string, pointer: boolean) {
        const key = pointer ? 'hover' : 'focus'
        if (intents[key]?.owner !== owner) return
        delete intents[key]
        update()
      },
      retain(owner: string) {
        if (owner !== shown) return
        retainedOwner = owner
        cancelPending()
      },
      release(owner: string) {
        if (retainedOwner !== owner) return
        retainedOwner = undefined
        update()
      },
      dismiss(owner?: string) {
        if (!owner || retainedOwner === owner) retainedOwner = undefined
        if (!owner || intents.hover?.owner === owner) delete intents.hover
        if (!owner || intents.focus?.owner === owner) delete intents.focus
        if (!owner || shown === owner) display()
        update()
      },
      dispose: cancelPending,
    }
  }, [])

  useEffect(() => {
    function escape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') controller.dismiss()
    }
    window.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('keydown', escape)
      controller.dispose()
    }
  }, [controller])

  const activeOwner = active?.owner
  const value = useMemo(() => ({ ...controller, activeOwner, select: onSelectExplainable }),
    [controller, activeOwner, onSelectExplainable])

  return (
    <Overlay.Provider value={value}>
      {children}
      {createPortal(
        <AnimatePresence>
          {active && <TooltipPop id={active.owner + '-tip'} {...active}
            onCardEnter={() => controller.retain(active.owner)}
            onCardLeave={() => controller.release(active.owner)}
            content={active.content ?? explainables[active.explanation]} />}
        </AnimatePresence>,
        document.body,
      )}
    </Overlay.Provider>
  )
}

type CommonProps = {
  explanation: ExplainableId
  kind: string
  label?: string
  example?: string
  content?: ExplainableContent
  identity?: string
  onActivate?: () => void
}

type Props = CommonProps & (
  | ({ as: 'g' } & Omit<ComponentPropsWithoutRef<'g'>, keyof CommonProps>)
  | ({ as: 'button' } & Omit<ComponentPropsWithoutRef<'button'>, keyof CommonProps>)
)

export function Explainable(props: Props) {
  const scope = useContext(Overlay)
  if (!scope) throw new Error('Explainable requires an ExplainableScope')

  const owner = useId()
  const pressedWithPointer = useRef(false)
  const { explanation, kind, label, example, content, identity, onActivate } = props
  const { open, leave, dismiss, select } = scope
  const descriptionId = owner + '-description'
  const explainable = content ?? explainables[explanation]
  const description = [example, explainable.plain, '论文事实 · ' + explainable.paperFact,
    '教学解释 · ' + explainable.teachingExplanation, `${explainable.source.section} · PDF p. ${explainable.source.page}`].filter(Boolean).join(' ')

  useEffect(() => () => dismiss(owner), [dismiss, owner])

  function hover(event: PointerEvent<Element>) {
    if (event.pointerType === 'touch') return
    open({ owner, explanation, content, identity, example, element: event.currentTarget, pointer: { x: event.clientX, y: event.clientY } })
  }

  function focus(event: FocusEvent<Element>) {
    if (!pressedWithPointer.current) open({ owner, explanation, content, identity, example, element: event.currentTarget })
    pressedWithPointer.current = false
  }

  function activate(element: Element) {
    if (select) select(explanation, example, content)
    else open({ owner, explanation, content, identity, example, element })
    onActivate?.()
  }

  function onKeyDown(event: KeyboardEvent<Element>) {
    if (event.key === 'Escape') dismiss()
    const tip = document.getElementById(owner + '-tip')
    if (scope?.activeOwner && !event.altKey && !event.ctrlKey && !event.metaKey) {
      // The trigger owns keyboard focus. Tab stays in the diagram's reading order.
      const page = Math.max(16, (tip?.clientHeight ?? 0) - 20)
      const height = tip?.scrollHeight ?? 0
      const distance: Record<string, number> = {
        ArrowDown: 16, ArrowUp: -16, PageDown: page, PageUp: -page, Home: -height, End: height,
      }
      if (Object.hasOwn(distance, event.key)) {
        event.preventDefault()
        if (tip && scope.activeOwner === owner) {
          tip.scrollTop += distance[event.key]
        } else {
          open({ owner, explanation, content, identity, example, element: event.currentTarget })
        }
        return
      }
    }
    if (props.as !== 'g' || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    if (!event.repeat) activate(event.currentTarget)
  }

  const bindings = {
    'data-explainable': identity ?? explanation,
    'data-explainable-kind': kind,
    'aria-label': label ?? explainable.title,
    'aria-describedby': scope.activeOwner === owner ? owner + '-tip' : descriptionId,
    onPointerEnter: hover,
    onPointerMove: hover,
    onPointerLeave: () => { pressedWithPointer.current = false; leave(owner, true) },
    onPointerDown: (event: PointerEvent<Element>) => {
      pressedWithPointer.current = event.currentTarget !== document.activeElement
    },
    onPointerUp: () => { pressedWithPointer.current = false },
    onPointerCancel: () => { pressedWithPointer.current = false },
    onFocus: focus,
    onBlur: () => leave(owner, false),
    onKeyDown,
    onClick: (event: MouseEvent<Element>) => activate(event.currentTarget),
  }

  if (props.as === 'g') {
    const { as, explanation, kind, label, example, content, identity, onActivate, children, ...attributes } = props
    return (
      <g {...attributes} {...bindings} role="button" tabIndex={0}>
        <desc id={descriptionId}>{description}</desc>
        {children}
      </g>
    )
  }
  const { as, explanation: id, kind: targetKind, label: name, example: text, content: targetContent, identity: targetIdentity, onActivate: action, children, ...attributes } = props
  return (
    <>
      <button {...attributes} {...bindings} type="button">{children}</button>
      <span hidden id={descriptionId}>{description}</span>
    </>
  )
}

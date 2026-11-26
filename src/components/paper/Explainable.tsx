import { AnimatePresence } from 'framer-motion'
import {
  createContext, useContext, useEffect, useId, useMemo, useRef, useState,
  type ComponentPropsWithoutRef, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { explainables, type ExplainableId } from '../../data/papers/attention/explainables'
import { TooltipPop } from './TooltipPop'

type Target = {
  owner: string
  explanation: ExplainableId
  example?: string
  element: Element
  pointer?: { x: number; y: number }
}

type Controller = {
  activeOwner?: string
  open: (target: Target) => void
  leave: (owner: string, pointer: boolean) => void
  dismiss: (owner?: string) => void
  select: (id: ExplainableId, example?: string) => void
}

const Overlay = createContext<Controller | null>(null)

export function ExplainableScope({ children, onSelectExplainable }: {
  children: ReactNode
  onSelectExplainable: Controller['select']
}) {
  const [active, setActive] = useState<Target | null>(null)
  const controller = useMemo(() => {
    const intents: { hover?: Target; focus?: Target } = {}
    let shown: string | undefined
    let pending: string | undefined
    let timer: number | undefined

    function display(target?: Target) {
      shown = target?.owner
      pending = undefined
      setActive(target ?? null)
    }

    function update() {
      const target = intents.hover ?? intents.focus
      if (target && shown === target.owner) {
        window.clearTimeout(timer)
        display(target)
      } else if (pending !== target?.owner || (!target && shown)) {
        window.clearTimeout(timer)
        pending = target?.owner
        timer = window.setTimeout(() => display(intents.hover ?? intents.focus), 100)
      }
    }

    return {
      open(target: Target) {
        if (!target.pointer && intents.hover?.owner !== target.owner) delete intents.hover
        intents[target.pointer ? 'hover' : 'focus'] = target
        update()
      },
      leave(owner: string, pointer: boolean) {
        const key = pointer ? 'hover' : 'focus'
        if (intents[key]?.owner !== owner) return
        delete intents[key]
        update()
      },
      dismiss(owner?: string) {
        if (!owner || intents.hover?.owner === owner) delete intents.hover
        if (!owner || intents.focus?.owner === owner) delete intents.focus
        if (!owner || shown === owner) display()
        update()
      },
      dispose() {
        window.clearTimeout(timer)
      },
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
          {active && <TooltipPop id={active.owner + '-tip'} content={explainables[active.explanation]} {...active} />}
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
  onActivate?: () => void
}

type Props = CommonProps & (
  | ({ as: 'g' } & ComponentPropsWithoutRef<'g'>)
  | ({ as: 'button' } & ComponentPropsWithoutRef<'button'>)
)

export function Explainable(props: Props) {
  const scope = useContext(Overlay)
  if (!scope) throw new Error('Explainable requires an ExplainableScope')

  const owner = useId()
  const pressedWithPointer = useRef(false)
  const { explanation, kind, label, example, onActivate } = props
  const { open, leave, dismiss, select } = scope
  const descriptionId = owner + '-description'
  const description = [example, explainables[explanation].plain].filter(Boolean).join(' ')

  useEffect(() => () => dismiss(owner), [dismiss, owner])

  function hover(event: PointerEvent<Element>) {
    if (event.pointerType === 'touch') return
    open({ owner, explanation, example, element: event.currentTarget, pointer: { x: event.clientX, y: event.clientY } })
  }

  function focus(event: FocusEvent<Element>) {
    if (!pressedWithPointer.current) open({ owner, explanation, example, element: event.currentTarget })
    pressedWithPointer.current = false
  }

  function activate() {
    select(explanation, example)
    onActivate?.()
  }

  function onKeyDown(event: KeyboardEvent<Element>) {
    if (event.key === 'Escape') dismiss()
    if (props.as !== 'g' || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    if (!event.repeat) activate()
  }

  const bindings = {
    'data-explainable': explanation,
    'data-explainable-kind': kind,
    'aria-label': label ?? explainables[explanation].title,
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
    onClick: activate,
  }

  if (props.as === 'g') {
    const { as, explanation, kind, label, example, onActivate, children, ...attributes } = props
    return (
      <g {...attributes} {...bindings} role="button" tabIndex={0}>
        <desc id={descriptionId}>{description}</desc>
        {children}
      </g>
    )
  }
  const { as, explanation: id, kind: targetKind, label: name, example: text, onActivate: action, children, ...attributes } = props
  return (
    <button {...attributes} {...bindings} type="button">
      {children}
      <span hidden id={descriptionId}>{description}</span>
    </button>
  )
}

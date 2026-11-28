import { useRef, type KeyboardEvent } from 'react'

const modes = [
  { id: 'learn', label: '交互导读' },
  { id: 'cheatsheet', label: '速查表' },
  { id: 'figures', label: 'Figures' },
  { id: 'fulltext', label: '全文中译' },
  { id: 'pdf', label: 'PDF' },
] as const

export type PaperMode = typeof modes[number]['id']

type Props = {
  mode: PaperMode
  onModeChange: (mode: PaperMode) => void
}

export function PaperModeTabs({ mode, onModeChange }: Props) {
  const tabList = useRef<HTMLDivElement>(null)

  function switchWithKey(event: KeyboardEvent, index: number) {
    let next: number
    switch (event.key) {
      case 'ArrowLeft': next = (index + modes.length - 1) % modes.length; break
      case 'ArrowRight': next = (index + 1) % modes.length; break
      case 'Home': next = 0; break
      case 'End': next = modes.length - 1; break
      default: return
    }
    event.preventDefault()
    tabList.current?.querySelectorAll('button')[next]?.focus()
    onModeChange(modes[next].id)
  }

  return (
    <div ref={tabList} className="cockpit-tabs" role="tablist" aria-label="论文阅读模式">
      {modes.map(({ id, label }, index) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`paper-mode-${id}`}
          aria-selected={id === mode}
          aria-controls="paper-mode-panel"
          tabIndex={id === mode ? 0 : -1}
          onClick={() => onModeChange(id)}
          onKeyDown={event => switchWithKey(event, index)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

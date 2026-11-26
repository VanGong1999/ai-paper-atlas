type Props = {
  text: string
  x: number
  y: number
}

export function TooltipPop({ text, x, y }: Props) {
  return (
    <div className="tip-pop" style={{ left: x, top: y }} role="tooltip">
      {text}
    </div>
  )
}

import type { PaperFigure } from '../../data/papers/attention/figures'
import { Explainable } from './Explainable'
import { paperTables, table3Context, type TableRedraw } from './paperTables'

export function PaperTable({ figure, redraw }: { figure: PaperFigure; redraw: TableRedraw }) {
  const table = paperTables[redraw]
  const base = redraw === 'variants' ? table.rows.find(row => row.baseline) : undefined
  const reference = `${figure.kind} ${figure.number}`
  return (
    <>
      {table.note && <p className="figure-table-note">{table.note}</p>}
      <div className="paper-table-scroll" role="region" aria-label={`${reference} · ${figure.title}`} tabIndex={0}>
        <table className="paper-table" lang="en" aria-label={reference}>
          <thead>
            <tr>
              <th scope="col">{table.firstColumn}</th>
              {table.columns.map(({ label }) => <th scope="col" key={label}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => {
              let columnIndex = 0
              return (
                <tr key={rowIndex} className={row.baseline ? 'paper-table-base' : undefined}>
                  <th scope="row">{row.label}</th>
                  {row.cells.map(cell => {
                    const index = columnIndex
                    const span = typeof cell === 'object' && cell !== null ? cell.span : 1
                    const text = typeof cell === 'string' ? cell : cell?.text
                    const cellObject = typeof cell === 'object' && cell !== null ? cell : null
                    columnIndex += span
                    const column = table.columns[index]
                    const label = redraw === 'translation' && span === 2 ? 'Training Cost (FLOPs)'
                      : redraw === 'variants' && span === 9 ? 'Configuration' : column.label
                    const context = `${row.label} · ${label} · ${text}`
                    const cellContent = cellObject?.content ?? (span > 1 ? row.content : column.content)
                    const baseline = base?.cells[index]
                    let example = `${reference} · ${context}`
                    // The last three Table 3 columns are dev PPL, dev BLEU and millions of parameters.
                    if (!row.baseline && index >= 9 && text && typeof baseline === 'string') {
                      const delta = Number(text) - Number(baseline)
                      const precision = baseline.split('.')[1]?.length ?? 0
                      example += ` · 相对 base（教学计算）：${text} − ${baseline} = ${delta > 0 ? '+' : ''}${delta.toFixed(precision)}`
                    }
                    const best = table.best?.(row, index)
                    return (
                      <td key={index} colSpan={span} className={best ? 'paper-table-best' : undefined}>
                        {text && (
                          <Explainable as="button" explanation={column.explanation} kind="paper-table-cell"
                            content={cellContent} label={context} example={example}>
                            {text}
                          </Explainable>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {redraw === 'variants' && (
        <div className="figure-table-context" aria-label="Table 3 nearby training context">
          <span>表旁训练设置</span>
          <Explainable as="button" explanation="optimizer" kind="paper-table-context" content={table3Context.learningRate}>学习率与 warmup</Explainable>
          <Explainable as="button" explanation="batch" kind="paper-table-context" content={table3Context.batchTokens}>批次 token 数</Explainable>
        </div>
      )}
    </>
  )
}

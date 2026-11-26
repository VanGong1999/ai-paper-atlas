import type { PaperFigure } from '../../data/papers/attention/figures'
import { Explainable } from './Explainable'
import { paperTables, type TableRedraw } from './paperTables'

export function PaperTable({ figure, redraw }: { figure: PaperFigure; redraw: TableRedraw }) {
  const table = paperTables[redraw]
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
                    columnIndex += span
                    const column = table.columns[index]
                    const label = redraw === 'translation' && span === 2 ? 'Training Cost (FLOPs)'
                      : redraw === 'variants' && span === 9 ? 'Configuration' : column.label
                    const context = `${row.label} · ${label} · ${text}`
                    const best = table.best?.(row, index)
                    return (
                      <td key={index} colSpan={span} className={best ? 'paper-table-best' : undefined}>
                        {text && (
                          <Explainable as="button" explanation={column.explanation} kind="paper-table-cell"
                            label={context} example={`${reference} · ${context}`}>
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
    </>
  )
}

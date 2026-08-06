import type { ReactNode } from 'react'
import { cx } from '@/lib/format'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right'
  /** Hide on narrow screens when the column is secondary. */
  hideBelow?: 'sm' | 'md' | 'lg'
}

const HIDE = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' }

export function Table<T>({
  columns,
  rows,
  rowKey,
  empty,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  empty?: ReactNode
}) {
  if (rows.length === 0 && empty) return <>{empty}</>

  return (
    <div className="surface-raised rounded-card overflow-x-auto border">
      <table className="w-full text-sm">
        <thead className="surface-sunken">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cx(
                  'text-dim px-4 py-3 text-xs font-bold tracking-wide whitespace-nowrap uppercase',
                  col.align === 'right' ? 'text-right' : 'text-left',
                  col.hideBelow && HIDE[col.hideBelow],
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:surface-sunken transition-colors">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cx(
                    'px-4 py-3.5',
                    col.align === 'right' ? 'text-right tabular-nums' : 'text-left',
                    col.hideBelow && HIDE[col.hideBelow],
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

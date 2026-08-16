/**
 * CSV export, built in the browser.
 *
 * The ledger is already in memory on these pages, so there is nothing for the
 * server to do — building the file client-side avoids an endpoint, a download
 * token, and a round trip.
 */

/**
 * Escapes one cell.
 *
 * A field containing a comma, quote or newline must be wrapped in quotes with
 * its own quotes doubled, or the row silently splits into the wrong columns.
 * Booking references and customer names are user-supplied, so this is not
 * theoretical.
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return ''

  const text = String(value)

  /*
   * A leading =, +, - or @ makes Excel and Sheets treat the cell as a formula.
   * Prefixing a tab neutralises it without changing what a person reads — this
   * is the standard defence against CSV injection.
   */
  const safe = /^[=+\-@\t\r]/.test(text) ? `\t${text}` : text

  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  // CRLF and a UTF-8 BOM, so Excel opens Naira signs and accented names
  // correctly instead of mojibake.
  return '﻿' + [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')
}

/**
 * Hands the file to the browser's download manager.
 *
 * The object URL is revoked on the next tick rather than immediately — Safari
 * cancels the download if the blob disappears before it has read it.
 */
export function downloadCsv(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** `autogo-payments-2026-08-16.csv` — sorts chronologically in a downloads folder. */
export function stampedFilename(prefix: string) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`
}

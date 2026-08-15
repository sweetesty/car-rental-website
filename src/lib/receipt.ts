import type { Booking } from './types'
import { formatDate, money } from './format'

/**
 * The emblem, inlined as a data URI.
 *
 * A plain <img src="/logo.png"> is unreliable here: the print dialog can fire
 * before the network request finishes, producing a receipt with a blank gap.
 * Fetching it once and embedding the bytes means it is present the instant the
 * document is written. Resolves to null when the file isn't there yet, and the
 * receipt falls back to the text wordmark.
 */
let logoPromise: Promise<string | null> | null = null

function loadLogo(): Promise<string | null> {
  logoPromise ??= fetch('/logo.png')
    .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('missing'))))
    .then(
      (blob) =>
        new Promise<string | null>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
          reader.onerror = () => resolve(null)
          reader.readAsDataURL(blob)
        }),
    )
    .catch(() => null)
  return logoPromise
}

/**
 * Generates a booking receipt and hands it to the browser's print dialog,
 * where "Save as PDF" is the default destination on every modern browser.
 * Runs entirely client-side — no PDF library, no server round trip.
 *
 * Rendered into a hidden iframe rather than window.open so popup blockers
 * never eat it.
 */
export async function downloadReceipt(booking: Booking) {
  const logo = await loadLogo()

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }

  doc.open()
  doc.write(receiptHtml(booking, logo))
  doc.close()

  // Give the iframe one frame to lay out before printing.
  iframe.contentWindow?.focus()
  setTimeout(() => {
    iframe.contentWindow?.print()
    // Chrome blocks removal while its print preview is open, so linger.
    setTimeout(() => document.body.removeChild(iframe), 60_000)
  }, 150)
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function receiptHtml(b: Booking, logo: string | null) {
  const rows: [string, string][] = [
    ['Booking reference', b.reference],
    ['Car', b.car ? `${b.car.name}` : '—'],
    ['Rental period', `${formatDate(b.startDate)} → ${formatDate(b.endDate)} (${b.days} days)`],
    ['Pickup location', b.pickupLocation],
    ['Driver', b.renter.fullName],
    ["Driver's licence", b.renter.licenseNumber || '—'],
    ['Booking status', b.status],
    ['Payment status', b.paymentStatus],
    ['Payment reference', b.paymentReference ?? '—'],
    ['Issued', formatDate(b.createdAt)],
  ]

  const lines: [string, string][] = [
    ['Rental subtotal', money(b.subtotal)],
    ['Service fee', money(b.serviceFee)],
    ['Insurance', money(b.insuranceFee)],
  ]

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>AUTOGO receipt ${esc(b.reference)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font: 14px/1.5 -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #16181d; padding: 48px; max-width: 640px; margin: 0 auto;
  }
  .head { display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 3px solid #d92c20; padding-bottom: 20px; gap: 16px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .emblem { width: 60px; height: 60px; object-fit: contain; flex-shrink: 0; }
  .wordmark { font-size: 24px; font-weight: 900; letter-spacing: -0.04em; }
  .wordmark span { color: #d92c20; }
  .tag { color: #6b7280; font-size: 12px; margin-top: 2px; }
  .paid { text-align: right; }
  .paid .status { display: inline-block; border: 1.5px solid #d92c20; color: #d92c20;
    font-weight: 700; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 4px 10px; border-radius: 999px; }
  h2 { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #6b7280; margin: 28px 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 7px 0; vertical-align: top; border-bottom: 1px solid #eceef1; }
  td:first-child { color: #6b7280; width: 42%; }
  td:last-child { font-weight: 600; text-align: right; }
  .money td { border-bottom: 1px solid #eceef1; }
  .total td { border-bottom: none; border-top: 2px solid #16181d;
    font-size: 17px; font-weight: 900; padding-top: 12px; }
  .foot { margin-top: 36px; color: #6b7280; font-size: 11px; line-height: 1.6;
    border-top: 1px solid #eceef1; padding-top: 16px; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <div class="head">
    <div class="brand">
      ${logo ? `<img class="emblem" src="${logo}" alt="" />` : ''}
      <div>
        <div class="wordmark">AUTO<span>GO</span></div>
        <div class="tag">Peer-to-peer car hire · autogo.ng · support@autogo.ng</div>
      </div>
    </div>
    <div class="paid">
      <span class="status">${esc(b.paymentStatus)}</span>
      <div class="tag">Receipt · ${esc(b.reference)}</div>
    </div>
  </div>

  <h2>Booking</h2>
  <table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>

  <h2>Payment</h2>
  <table class="money">
    ${lines.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}
    <tr class="total"><td>Total ${b.paymentStatus === 'paid' ? 'paid' : 'due'}</td><td>${esc(money(b.total))}</td></tr>
  </table>

  <div class="foot">
    This receipt was generated by AUTOGO Technologies Ltd. The refundable security deposit is
    authorised separately at handover and is not included in the total above. Questions about
    this booking? Contact customer care with reference ${esc(b.reference)}.
  </div>
</body>
</html>`
}

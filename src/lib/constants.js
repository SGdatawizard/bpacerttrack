// The two people using the system. Add a name here and it appears in every
// "Handled by" / "Received by" dropdown.
export const TEAM = ['Robert Smith', 'Cordelia Cheriton']

// Outcome recorded when an item comes back from the expertiser.
export const RESULTS = [
  'Genuine',
  'Genuine with faults',
  'Forgery',
  'Faked or altered',
  'Repaired',
  'Regummed',
  'Reperforated',
  'No opinion given'
]

// Always offered in the expertiser dropdown, even before anything is saved.
export const BASE_EXPERTISERS = ['B.P.A.', 'R.P.S.']

export const STATUS_LABEL = {
  awaiting_send: 'Awaiting sending',
  sent: 'With expertiser',
  returned: 'Returned'
}

export function refFor(item) {
  const listNumber = item?.sending_lists?.list_number ?? item?.list_number
  if (!listNumber || !item?.item_no) return null
  return `${listNumber}/${item.item_no}`
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function today() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function money(value) {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value))
}

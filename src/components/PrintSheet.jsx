import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/constants'

export default function PrintSheet({ listId, onClose }) {
  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [listResult, itemsResult] = await Promise.all([
        supabase.from('sending_lists').select('*').eq('id', listId).single(),
        supabase.from('items').select('*').eq('list_id', listId).order('item_no', { ascending: true })
      ])

      if (cancelled) return
      if (listResult.error) setError(listResult.error.message)
      if (itemsResult.error) setError(itemsResult.error.message)
      setList(listResult.data || null)
      setItems(itemsResult.data || [])
    }

    load()
    return () => {
      cancelled = true
    }
  }, [listId])

  if (error) {
    return (
      <div className="sheet-screen">
        <div className="sheet-bar no-print">
          <button className="btn btn-quiet" onClick={onClose}>
            Back
          </button>
        </div>
        <div className="notice notice-bad" style={{ maxWidth: '210mm', margin: '0 auto' }}>
          {error}
        </div>
      </div>
    )
  }

  if (!list) return <p className="hint" style={{ padding: 24 }}>Loading sheet…</p>

  return (
    <div className="sheet-screen">
      <div className="sheet-bar no-print">
        <button className="btn btn-quiet" onClick={onClose}>
          Back
        </button>
        <button className="btn" onClick={() => window.print()}>
          Print this sheet
        </button>
        <span className="hint">
          Item references on this list run {list.list_number}/1 to {list.list_number}/{items.length}.
        </span>
      </div>

      <div className="sheet">
        <div className="perf" aria-hidden="true" />

        <div className="sheet-head">
          <div>
            <div className="sheet-issuer">Stanley Gibbons — stamp department</div>
            <h1>{list.expertiser}</h1>
            <div className="sheet-issuer" style={{ marginTop: 4 }}>
              Items submitted for expertising
            </div>
          </div>
          <div className="sheet-ref">
            <div className="num">#{list.list_number}</div>
            <div className="sheet-issuer">{formatDate(list.date_sent)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: '13%' }}>Ref</th>
              <th>Description</th>
              <th style={{ width: '14%' }}>Cat no.</th>
              <th style={{ width: '14%' }}>Stock no.</th>
              <th style={{ width: '9%' }}>Ext.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {list.list_number}/{item.item_no}
                </td>
                <td>
                  {item.item_description}
                  {item.client_name && (
                    <div style={{ fontSize: 12, marginTop: 2 }}>Client: {item.client_name}</div>
                  )}
                </td>
                <td>{item.cat_number || '—'}</td>
                <td>{item.stock_number || '—'}</td>
                <td>{item.on_extension ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="sheet-foot">
          <div>
            <div>
              {items.length} item{items.length === 1 ? '' : 's'} enclosed
            </div>
            <div>Sent by {list.created_by || '—'}</div>
          </div>
          <div>
            <div>Received by</div>
            <div className="sig-line" />
          </div>
        </div>
      </div>
    </div>
  )
}

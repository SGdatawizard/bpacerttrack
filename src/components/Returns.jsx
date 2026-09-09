import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TEAM, RESULTS, STATUS_LABEL, formatDate, refFor, today, money } from '../lib/constants'

const JOIN = 'sending_lists ( list_number, expertiser, date_sent )'

export default function Returns({ onChanged }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('sent')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [openId, setOpenId] = useState(null)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    search()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function search() {
    setLoading(true)
    setError('')

    const term = query.trim().replace(/^#/, '')
    const refMatch = term.match(/^(\d+)\s*\/\s*(\d+)$/)
    const listMatch = term.match(/^(\d+)$/)

    let request

    if (refMatch) {
      request = supabase
        .from('items')
        .select(`*, sending_lists!inner ( list_number, expertiser, date_sent )`)
        .eq('sending_lists.list_number', Number(refMatch[1]))
        .eq('item_no', Number(refMatch[2]))
    } else if (listMatch) {
      request = supabase
        .from('items')
        .select(`*, sending_lists!inner ( list_number, expertiser, date_sent )`)
        .eq('sending_lists.list_number', Number(listMatch[1]))
        .order('item_no', { ascending: true })
    } else {
      request = supabase.from('items').select(`*, ${JOIN}`).order('created_at', { ascending: false })

      if (term) {
        const like = `%${term}%`
        request = request.or(
          `item_description.ilike.${like},stock_number.ilike.${like},cat_number.ilike.${like},client_name.ilike.${like},certificate_number.ilike.${like},expertiser.ilike.${like}`
        )
      }
    }

    if (statusFilter !== 'all') request = request.eq('status', statusFilter)

    const { data, error: searchError } = await request.limit(200)
    if (searchError) setError(searchError.message)
    setRows(data || [])
    setLoading(false)
  }

  function openReturn(item) {
    setMessage('')
    setOpenId(item.id)
    setDraft({
      date_received: item.date_received || today(),
      result: item.result || RESULTS[0],
      certificate_number: item.certificate_number || '',
      received_by: item.received_by || TEAM[0]
    })
  }

  async function saveReturn(item) {
    setSaving(true)
    const { error: saveError } = await supabase
      .from('items')
      .update({ ...draft, status: 'returned' })
      .eq('id', item.id)

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setOpenId(null)
    setMessage(`${refFor(item) || 'Item'} marked as received.`)
    onChanged?.()
    search()
  }

  return (
    <>
      <div className="page-head">
        <h1>Returns &amp; search</h1>
        <p>
          Search by reference number (1000/1), by list number (1000), or by description, stock
          number, catalogue number or client.
        </p>
      </div>

      {error && <div className="notice notice-bad">{error}</div>}
      {message && <div className="notice notice-good">{message}</div>}

      <div className="toolbar">
        <div className="field search-box">
          <label htmlFor="q">Search</label>
          <input
            id="q"
            type="search"
            value={query}
            placeholder="e.g. 1000/1"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
        </div>
        <div className="field" style={{ maxWidth: 200 }}>
          <label htmlFor="status">Showing</label>
          <select id="status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="sent">With expertiser</option>
            <option value="returned">Returned</option>
            <option value="awaiting_send">Awaiting sending</option>
            <option value="all">Everything</option>
          </select>
        </div>
        <button className="btn" onClick={search}>
          Search
        </button>
      </div>

      {loading && <p className="hint">Searching…</p>}

      {!loading && rows.length === 0 && (
        <div className="empty">No items match that search. Try the list number on its own.</div>
      )}

      {!loading &&
        rows.map((item) => {
          const ref = refFor(item)
          const isOpen = openId === item.id
          return (
            <div className="panel" key={item.id}>
              <div className="panel-title">
                <div>
                  <h3>
                    {ref ? <span className="ref">{ref}</span> : <span className="tag">Not yet sent</span>}{' '}
                    <span style={{ marginLeft: 8 }}>{item.sending_lists?.expertiser || item.expertiser}</span>
                  </h3>
                  <span className="meta">{STATUS_LABEL[item.status]}</span>
                </div>
                {item.status === 'sent' && !isOpen && (
                  <button className="btn btn-gold btn-sm" onClick={() => openReturn(item)}>
                    Mark as received
                  </button>
                )}
                {item.status === 'returned' && !isOpen && (
                  <button className="btn btn-quiet btn-sm" onClick={() => openReturn(item)}>
                    Edit return details
                  </button>
                )}
              </div>

              <div className="grid">
                <div className="span-2">{item.item_description}</div>
                <div className="meta">
                  Cat no. {item.cat_number || '—'} · Stock no. {item.stock_number || '—'} · Lot{' '}
                  {item.lot_number || '—'}
                </div>
                <div className="meta">
                  {item.client_name ? `Client: ${item.client_name}` : 'SG property'} · Sent{' '}
                  {formatDate(item.sending_lists?.date_sent)}
                </div>
                <div className="meta">
                  Paying: {item.paid_by || '—'} · {money(item.amount)}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {item.on_extension && <span className="tag">On extension</span>}
                  {item.pink_zone && <span className="tag tag-pink">Pink zone</span>}
                  {item.status === 'returned' && <span className="tag tag-returned">{item.result}</span>}
                </div>
              </div>

              {item.status === 'returned' && !isOpen && (
                <div className="meta" style={{ marginTop: 14 }}>
                  Received {formatDate(item.date_received)} by {item.received_by || '—'} · Certificate{' '}
                  {item.certificate_number || 'not recorded'}
                </div>
              )}

              {isOpen && (
                <>
                  <fieldset>
                    <legend>Return details</legend>
                    <div className="grid">
                      <div className="field">
                        <label htmlFor={`d-${item.id}`}>Date received</label>
                        <input
                          id={`d-${item.id}`}
                          type="date"
                          value={draft.date_received}
                          onChange={(e) => setDraft({ ...draft, date_received: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`r-${item.id}`}>Result</label>
                        <select
                          id={`r-${item.id}`}
                          value={draft.result}
                          onChange={(e) => setDraft({ ...draft, result: e.target.value })}
                        >
                          {RESULTS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor={`c-${item.id}`}>Certificate number</label>
                        <input
                          id={`c-${item.id}`}
                          type="text"
                          value={draft.certificate_number}
                          onChange={(e) => setDraft({ ...draft, certificate_number: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`b-${item.id}`}>Received by</label>
                        <select
                          id={`b-${item.id}`}
                          value={draft.received_by}
                          onChange={(e) => setDraft({ ...draft, received_by: e.target.value })}
                        >
                          {TEAM.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </fieldset>
                  <div className="actions">
                    <button className="btn" onClick={() => saveReturn(item)} disabled={saving}>
                      {saving ? 'Saving…' : 'Save return'}
                    </button>
                    <button className="btn btn-quiet" onClick={() => setOpenId(null)} disabled={saving}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
    </>
  )
}

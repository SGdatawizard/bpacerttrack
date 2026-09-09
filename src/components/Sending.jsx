import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TEAM, formatDate } from '../lib/constants'

export default function Sending({ onEdit, onPrint, onChanged }) {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState({})
  const [createdBy, setCreatedBy] = useState(TEAM[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyGroup, setBusyGroup] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'awaiting_send')
      .order('created_at', { ascending: true })

    if (loadError) setError(loadError.message)
    const rows = data || []
    setItems(rows)
    setSelected(Object.fromEntries(rows.map((r) => [r.id, true])))
    setLoading(false)
  }

  const groups = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      if (!map.has(item.expertiser)) map.set(item.expertiser, [])
      map.get(item.expertiser).push(item)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  function toggle(id) {
    setSelected((s) => ({ ...s, [id]: !s[id] }))
  }

  function toggleGroup(groupItems, value) {
    setSelected((s) => {
      const next = { ...s }
      for (const item of groupItems) next[item.id] = value
      return next
    })
  }

  async function createList(expertiser, groupItems) {
    const ids = groupItems.filter((i) => selected[i.id]).map((i) => i.id)
    if (ids.length === 0) return

    setBusyGroup(expertiser)
    setError('')

    const { data, error: rpcError } = await supabase.rpc('create_sending_list', {
      p_expertiser: expertiser,
      p_item_ids: ids,
      p_created_by: createdBy
    })

    setBusyGroup(null)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    const created = Array.isArray(data) ? data[0] : data
    await load()
    onChanged?.()
    if (created?.list_id) onPrint(created.list_id)
  }

  if (loading) return <p className="hint">Loading items…</p>

  return (
    <>
      <div className="page-head">
        <h1>Awaiting sending</h1>
        <p>
          Items are grouped by expertiser. Tick the ones going out now, then create the list — each
          item is given its reference number at that point.
        </p>
      </div>

      {error && <div className="notice notice-bad">{error}</div>}

      <div className="toolbar">
        <div className="field" style={{ maxWidth: 240 }}>
          <label htmlFor="createdBy">Creating lists as</label>
          <select id="createdBy" value={createdBy} onChange={(e) => setCreatedBy(e.target.value)}>
            {TEAM.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="empty">
          Nothing is waiting to go out. Add an item on the Items for Expertising form and it will
          appear here.
        </div>
      )}

      {groups.map(([expertiser, groupItems]) => {
        const chosen = groupItems.filter((i) => selected[i.id])
        return (
          <div className="panel" key={expertiser}>
            <div className="panel-title">
              <div>
                <h2>{expertiser}</h2>
                <span className="meta">
                  {groupItems.length} item{groupItems.length === 1 ? '' : 's'} waiting · {chosen.length}{' '}
                  selected
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-quiet btn-sm" onClick={() => toggleGroup(groupItems, true)}>
                  Select all
                </button>
                <button className="btn btn-quiet btn-sm" onClick={() => toggleGroup(groupItems, false)}>
                  Clear
                </button>
                <button
                  className="btn btn-gold btn-sm"
                  onClick={() => createList(expertiser, groupItems)}
                  disabled={chosen.length === 0 || busyGroup === expertiser}
                >
                  {busyGroup === expertiser ? 'Creating…' : `Create sending list (${chosen.length})`}
                </button>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th className="col-tight"></th>
                  <th>Description</th>
                  <th>Cat no.</th>
                  <th>Stock no.</th>
                  <th>Client</th>
                  <th>Added</th>
                  <th className="col-tight"></th>
                </tr>
              </thead>
              <tbody>
                {groupItems.map((item) => (
                  <tr key={item.id}>
                    <td className="col-tight">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[item.id])}
                        onChange={() => toggle(item.id)}
                        aria-label={`Include ${item.item_description}`}
                      />
                    </td>
                    <td className="desc">
                      {item.item_description}
                      <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {item.on_extension && <span className="tag">On extension</span>}
                        {item.pink_zone && <span className="tag tag-pink">Pink zone</span>}
                      </div>
                    </td>
                    <td>{item.cat_number || '—'}</td>
                    <td>{item.stock_number || '—'}</td>
                    <td>{item.client_name || 'SG property'}</td>
                    <td className="meta">{formatDate(item.form_date)}</td>
                    <td className="col-tight">
                      <button className="btn btn-quiet btn-sm" onClick={() => onEdit(item)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </>
  )
}

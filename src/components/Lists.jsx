import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/constants'

export default function Lists({ onPrint }) {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('sending_lists')
      .select('*, items ( id, status )')
      .order('list_number', { ascending: false })

    if (loadError) setError(loadError.message)
    setLists(data || [])
    setLoading(false)
  }

  if (loading) return <p className="hint">Loading lists…</p>

  return (
    <>
      <div className="page-head">
        <h1>Sending lists</h1>
        <p>Every list that has been generated. Open one to print the sheet that goes with the parcel.</p>
      </div>

      {error && <div className="notice notice-bad">{error}</div>}

      {lists.length === 0 && (
        <div className="empty">
          No lists yet. Create your first one from the Awaiting sending page.
        </div>
      )}

      {lists.length > 0 && (
        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>List</th>
                <th>Expertiser</th>
                <th>Sent</th>
                <th>Items</th>
                <th>Back</th>
                <th>Created by</th>
                <th className="col-tight"></th>
              </tr>
            </thead>
            <tbody>
              {lists.map((list) => {
                const total = list.items?.length || 0
                const back = list.items?.filter((i) => i.status === 'returned').length || 0
                return (
                  <tr key={list.id}>
                    <td>
                      <span className="ref">#{list.list_number}</span>
                    </td>
                    <td>{list.expertiser}</td>
                    <td className="meta">{formatDate(list.date_sent)}</td>
                    <td>{total}</td>
                    <td>
                      {back === total && total > 0 ? (
                        <span className="tag tag-returned">All returned</span>
                      ) : (
                        <span className="meta">
                          {back} of {total}
                        </span>
                      )}
                    </td>
                    <td className="meta">{list.created_by || '—'}</td>
                    <td className="col-tight">
                      <button className="btn btn-quiet btn-sm" onClick={() => onPrint(list.id)}>
                        Open &amp; print
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

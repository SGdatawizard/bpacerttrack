import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import IFEForm from './components/IFEForm'
import Sending from './components/Sending'
import Lists from './components/Lists'
import PrintSheet from './components/PrintSheet'
import Returns from './components/Returns'

const PAGES = [
  { id: 'form', label: 'Items for Expertising' },
  { id: 'sending', label: 'Awaiting sending' },
  { id: 'lists', label: 'Sending lists' },
  { id: 'returns', label: 'Returns & search' }
]

export default function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const [page, setPage] = useState('form')
  const [editItem, setEditItem] = useState(null)
  const [printListId, setPrintListId] = useState(null)
  const [flash, setFlash] = useState('')
  const [version, setVersion] = useState(0)

  const [expertisers, setExpertisers] = useState([])
  const [counts, setCounts] = useState({ awaiting: 0, out: 0 })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCheckingSession(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  const refreshMeta = useCallback(async () => {
    if (!session) return

    const [expertiserResult, awaitingResult, outResult] = await Promise.all([
      supabase.from('expertisers').select('name').order('name'),
      supabase.from('items').select('id', { count: 'exact', head: true }).eq('status', 'awaiting_send'),
      supabase.from('items').select('id', { count: 'exact', head: true }).eq('status', 'sent')
    ])

    setExpertisers((expertiserResult.data || []).map((r) => r.name))
    setCounts({ awaiting: awaitingResult.count || 0, out: outResult.count || 0 })
  }, [session])

  useEffect(() => {
    refreshMeta()
  }, [refreshMeta, version])

  function bump() {
    setVersion((v) => v + 1)
  }

  function go(nextPage) {
    setPage(nextPage)
    setEditItem(null)
    setFlash('')
  }

  function handleSaved(text) {
    setFlash(text)
    setEditItem(null)
    bump()
    setPage('sending')
  }

  function handleEdit(item) {
    setEditItem(item)
    setFlash('')
    setPage('form')
  }

  if (checkingSession) return null
  if (!session) return <Login />

  if (printListId) {
    return (
      <PrintSheet
        listId={printListId}
        onClose={() => {
          setPrintListId(null)
          bump()
        }}
      />
    )
  }

  return (
    <div className="layout">
      <nav className="nav">
        <div className="brand">
          <div className="brand-name">Expertising Register</div>
          <div className="brand-sub">Stanley Gibbons</div>
        </div>

        {PAGES.map((item) => (
          <button
            key={item.id}
            className={`nav-item${page === item.id ? ' active' : ''}`}
            onClick={() => go(item.id)}
          >
            {item.label}
            {item.id === 'sending' && counts.awaiting > 0 && (
              <span className="nav-count">{counts.awaiting}</span>
            )}
            {item.id === 'returns' && counts.out > 0 && <span className="nav-count">{counts.out}</span>}
          </button>
        ))}

        <div className="nav-foot">
          <div>{counts.out} out with expertisers</div>
          <button
            className="btn btn-quiet btn-sm"
            style={{ marginTop: 10, color: '#c8d0da', borderColor: 'rgba(255,255,255,.25)' }}
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="main">
        {flash && <div className="notice notice-good">{flash}</div>}

        {page === 'form' && (
          <IFEForm
            key={editItem?.id || 'new'}
            editItem={editItem}
            expertisers={expertisers}
            onSaved={handleSaved}
            onCancel={editItem ? () => go('sending') : null}
          />
        )}

        {page === 'sending' && (
          <Sending
            key={`sending-${version}`}
            onEdit={handleEdit}
            onPrint={setPrintListId}
            onChanged={bump}
          />
        )}

        {page === 'lists' && <Lists key={`lists-${version}`} onPrint={setPrintListId} />}

        {page === 'returns' && <Returns key={`returns-${version}`} onChanged={bump} />}
      </main>
    </div>
  )
}

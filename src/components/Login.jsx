import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function signIn() {
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Those details were not recognised. Check the shared login and try again.')
    setBusy(false)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') signIn()
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Expertising Register</h1>
        <p className="hint" style={{ marginTop: 6, marginBottom: 24 }}>
          Stanley Gibbons — stamp department
        </p>

        {error && <div className="notice notice-bad">{error}</div>}

        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="email">Team login</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>

        <div className="field" style={{ marginBottom: 22 }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>

        <button className="btn" style={{ width: '100%' }} onClick={signIn} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}

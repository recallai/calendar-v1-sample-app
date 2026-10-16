import { useState } from 'react'

export default function SignInButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/calendar/google/oauth', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      window.location.assign(data.authorizationUrl)
    } catch {
      setError('Could not sign in. Please try again.')
      setLoading(false)
    }
  }

  return <>
    <button type="button" disabled={loading} onClick={signIn}>
      {loading ? 'Signing in…' : 'Sign in with Google'}
    </button>
    {error && <p role="alert">{error}</p>}
  </>
}

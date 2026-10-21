import { useState } from 'react'

export default function SignInButton({ platform = 'google' }: { platform?: 'google' | 'microsoft' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/calendar/${platform}/oauth`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      window.location.assign(data.authorizationUrl)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not sign in. Please try again.')
      setLoading(false)
    }
  }

  return <>
    <button type="button" disabled={loading} onClick={signIn}>
      {loading ? 'Signing in…' : `Sign in with ${platform === 'google' ? 'Google' : 'Microsoft'}`}
    </button>
    {error && <p role="alert">{error}</p>}
  </>
}

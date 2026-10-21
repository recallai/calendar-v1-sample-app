import { useEffect, useState } from 'react'
import SignInButton from './SignInButton'
import { preferenceFields, presets, selectedPreset, type Preferences } from './preferences'

const endpoint = '/api/calendar/recording_preference'

export default function Configuration() {
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [connectedPlatforms, setConnectedPlatforms] = useState<('google' | 'microsoft')[]>([])
  const connected = connectedPlatforms.length > 0
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState<'google' | 'microsoft' | null>(null)
  const [message, setMessage] = useState('Loading…')

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch(endpoint)
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        const { id: _id, ...preferences } = data.preferences
        setPreferences(preferences)
        setConnectedPlatforms(data.connectedPlatforms)
        setMessage('')
      } catch {
        setMessage('Could not load settings. Please try again.')
      }
    }
    void loadPreferences()
  }, [])

  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      })
      if (!response.ok) throw new Error('Save failed')
      setMessage('Saved.')
    } catch {
      setMessage('Could not save settings. Please try again.')
    }
    setSaving(false)
  }

  async function disconnect(platform: 'google' | 'microsoft') {
    setDisconnecting(platform)
    setMessage('')
    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
      if (!response.ok) throw new Error('Disconnect failed')
      const remainingPlatforms = connectedPlatforms.filter(connected => connected !== platform)
      if (remainingPlatforms.length === 0) {
        window.location.assign('/')
        return
      }
      setConnectedPlatforms(remainingPlatforms)
      setMessage(`${platform === 'google' ? 'Google' : 'Microsoft'} calendar disconnected.`)
      setDisconnecting(null)
    } catch {
      setMessage('Could not disconnect calendar. Please try again.')
      setDisconnecting(null)
    }
  }

  const activePreset = preferences ? selectedPreset(preferences) : undefined

  return <main>
    <div className="page-nav"><h1>Configuration</h1><a href="/calendar">Calendar</a></div>
    {!preferences && <button type="button" onClick={() => window.location.reload()}>Reload settings</button>}
    {preferences && <div className="sign-in-options">
      {!connectedPlatforms.includes('google') && <SignInButton platform="google" />}
      {!connectedPlatforms.includes('microsoft') && <SignInButton platform="microsoft" />}
    </div>}
    {preferences && <form onSubmit={save}>
      <fieldset className="settings-layout" disabled={saving || !!disconnecting || !connected}>
        <div className="settings-toolbar">
          <label className="field bot-name">
            Bot name
            <input type="text" value={preferences.bot_name} onChange={event => {
              setPreferences({ ...preferences, bot_name: event.target.value })
              setMessage('')
            }} />
          </label>
          <button className="primary" type="submit">{saving ? 'Saving…' : 'Save preferences'}</button>
        </div>
        <section className="panel preset-panel" aria-labelledby="presets-title">
          <h2 id="presets-title">Presets</h2>
          <div className="preset-list">
            {presets.map(preset => <button
              key={preset.id}
              type="button"
              className="preset"
              aria-pressed={activePreset === preset.id}
              onClick={() => {
                setPreferences({ ...preferences, ...preset.rules })
                setMessage('')
              }}
            >
              <span>{preset.label}</span>
              <span className="preset-indicator" aria-hidden="true" />
            </button>)}
          </div>
        </section>
        <section className="panel" aria-labelledby="preferences-title">
          <div className="panel-heading">
            <h2 id="preferences-title">Recording preferences</h2>
            {!activePreset && <span className="badge">Custom</span>}
          </div>
          <div>
            {preferenceFields.map(field => <label className="switch-row" key={field.key}>
              {field.label}
              <input type="checkbox" role="switch" checked={preferences[field.key]} onChange={event => {
                setPreferences({ ...preferences, [field.key]: event.target.checked })
                setMessage('')
              }} />
            </label>)}
          </div>
        </section>
      </fieldset>
    </form>}
    <div className="disconnect-calendar sign-in-options">
      {connectedPlatforms.map(platform => <button key={platform} type="button" disabled={saving || !!disconnecting} onClick={() => disconnect(platform)}>
        {disconnecting === platform ? 'Disconnecting…' : `Disconnect ${platform === 'google' ? 'Google' : 'Microsoft'} calendar`}
      </button>)}
    </div>
    <p className="status" role="status">{message}</p>
  </main>
}

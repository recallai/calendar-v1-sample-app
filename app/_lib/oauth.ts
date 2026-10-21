export function readRecallConfig() {
  const env = process.env
  const recallOrigin = `https://${env.RECALL_REGION || 'us-east-1'}.recall.ai`
  return {
    apiKey: env.RECALL_API_KEY || '',
    userId: env.RECALL_USER_ID || 'local-demo-user',
    recallOrigin,
    clientOrigin: env.CLIENT_ORIGIN || 'http://localhost:5173',
    clientId: env.GOOGLE_OAUTH_CLIENT_ID || '',
    microsoftClientId: env.MICROSOFT_OAUTH_CLIENT_ID || '',
    microsoftRedirectUri: env.MICROSOFT_OAUTH_REDIRECT_URI || `${recallOrigin}/api/v1/calendar/ms_oauth_callback/`,
    redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI || `${recallOrigin}/api/v1/calendar/google_oauth_callback/`,
  }
}

export async function getCalendarAuthToken() {
  const config = readRecallConfig()
  const response = await fetch(`${config.recallOrigin}/api/v1/calendar/authenticate/`, {
    method: 'POST',
    headers: { Authorization: config.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: config.userId }),
  })
  if (!response.ok) throw new Error('Could not get a Recall calendar token.')
  const { token } = await response.json()
  return token
}

export async function googleOAuthUrl() {
  const config = readRecallConfig()
  const token = await getCalendarAuthToken()
  const parameters = new URLSearchParams({
    scope: 'https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state: JSON.stringify({
      recall_calendar_auth_token: token,
      google_oauth_redirect_url: config.redirectUri,
      success_url: `${config.clientOrigin}/calendar`,
      error_url: `${config.clientOrigin}/?connection=error`,
    }),
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${parameters}`
}

export async function microsoftOAuthUrl() {
  const config = readRecallConfig()
  if (!config.microsoftClientId) throw new Error('Set MICROSOFT_OAUTH_CLIENT_ID in .env to enable Microsoft sign-in.')
  const token = await getCalendarAuthToken()
  const parameters = new URLSearchParams({
    scope: 'offline_access openid email https://graph.microsoft.com/Calendars.Read',
    response_mode: 'query',
    response_type: 'code',
    client_id: config.microsoftClientId,
    redirect_uri: config.microsoftRedirectUri,
    state: JSON.stringify({
      recall_calendar_auth_token: token,
      ms_oauth_redirect_url: config.microsoftRedirectUri,
      success_url: `${config.clientOrigin}/calendar`,
      error_url: `${config.clientOrigin}/?connection=error`,
    }),
  })
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${parameters}`
}

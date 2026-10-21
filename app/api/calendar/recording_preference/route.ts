import { getCalendarAuthToken, readRecallConfig } from '@/app/_lib/oauth'

export async function PUT(request: Request) {
  try {
    const { preferences } = await request.json()
    const { recallOrigin } = readRecallConfig()
    const token = await getCalendarAuthToken()
    const response = await fetch(`${recallOrigin}/api/v1/calendar/user/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-recallcalendarauthtoken': token },
      body: JSON.stringify({ preferences }),
    })
    if (!response.ok) throw new Error('Could not save recording preferences.')
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Could not save recording preferences.' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { recallOrigin } = readRecallConfig()
    const token = await getCalendarAuthToken()
    const response = await fetch(`${recallOrigin}/api/v1/calendar/user/`, {
      headers: { 'x-recallcalendarauthtoken': token },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('Could not load recording preferences.')
    const user = await response.json()
    const connectedPlatforms = user.connections
      .filter((connection: { platform: string; connected: boolean }) =>
        connection.connected && ['google', 'microsoft'].includes(connection.platform))
      .map((connection: { platform: string }) => connection.platform)
    return Response.json({ preferences: user.preferences, connected: connectedPlatforms.length > 0, connectedPlatforms })
  } catch {
    return Response.json({ error: 'Could not load recording preferences.' }, { status: 500 })
  }
}

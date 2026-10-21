import { getCalendarAuthToken, readRecallConfig } from '@/app/_lib/oauth'

export async function POST(request: Request) {
  try {
    const { platform } = await request.json()
    const { recallOrigin } = readRecallConfig()
    const token = await getCalendarAuthToken()
    const response = await fetch(`${recallOrigin}/api/v1/calendar/user/disconnect/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-recallcalendarauthtoken': token },
      body: JSON.stringify({ platform }),
    })
    if (!response.ok) throw new Error('Could not disconnect calendar.')
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Could not disconnect calendar.' }, { status: 500 })
  }
}

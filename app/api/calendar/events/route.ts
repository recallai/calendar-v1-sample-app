import { getCalendarAuthToken, readRecallConfig } from '@/app/_lib/oauth'

export async function GET() {
  try {
    const { recallOrigin } = readRecallConfig() //Grab region
    const token = await getCalendarAuthToken()
    const url = new URL('/api/v1/calendar/meetings/', recallOrigin) //form URL for recall region

    //Filter to pull meeting from a year in the past
    const startTimeAfter = new Date()
    startTimeAfter.setUTCFullYear(startTimeAfter.getUTCFullYear() - 1)
    url.searchParams.set('start_time_after', startTimeAfter.toISOString())

    const response = await fetch(url, {
      headers: { 'x-recallcalendarauthtoken': token },
      cache: 'no-store',
    })
    //Handle request failure
    if (!response.ok) throw new Error('Could not load calendar events.')
    return Response.json(await response.json())
  } catch {
    return Response.json({ error: 'Could not load calendar events.' }, { status: 500 })
  }
}

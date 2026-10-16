import { readRecallConfig } from '@/app/_lib/oauth'

//response shape
interface BotRecording {
  media_shortcuts?: { video_mixed?: { data?: { download_url?: string } } }
}

export async function GET(request: Request) {
  //Grab bot id from request params
  const botId = new URL(request.url).searchParams.get('bot_id')
  if (!botId) return Response.json({ url: null })

  try {
    //Grab recording
    const { recallOrigin, apiKey } = readRecallConfig()
    const response = await fetch(`${recallOrigin}/api/v1/bot/${botId}/`, {
      headers: { Authorization: apiKey },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('Could not check recording.')
    const bot = await response.json()
    const urls = (bot.recordings || []).map((recording: BotRecording) =>
      recording.media_shortcuts?.video_mixed?.data?.download_url,
    )
    return Response.json({ url: urls.find((url: string | undefined) => url) || null })
  } catch {
    return Response.json({ error: 'Could not check recording.' }, { status: 502 })
  }
}

import { googleOAuthUrl } from '@/app/_lib/oauth'

export async function POST() {
  try {
    const authorizationUrl = await googleOAuthUrl()
    return Response.json({ authorizationUrl })
  } catch {
    return Response.json({ error: 'Could not start Google sign-in.' }, { status: 500 })
  }
}

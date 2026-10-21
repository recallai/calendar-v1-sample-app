import { microsoftOAuthUrl } from '@/app/_lib/oauth'

export async function POST() {
  try {
    return Response.json({ authorizationUrl: await microsoftOAuthUrl() })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not start Microsoft sign-in.' }, { status: 500 })
  }
}

# Google Calendar recording example

This app shows how to connect a Google Calendar to Recall.ai, let Recall schedule meeting bots, and view the resulting recordings. It uses **Calendar V1**, where Recall manages calendar synchronization and bot scheduling according to each user's recording preferences.


## What you can do

- Connect a Google account through Google's consent screen.
- Browse synced meetings and see whether Recall plans to record them.
- Set recording preferences using individual switches or presets: all meetings, internal only, external only, meetings you host, or accepted invitations only.
- Change the bot's display name.
- Inspect a meeting's complete Recall metadata.
- Preview available past recordings and open playback in a separate window.

The calendar displays Recall's meeting data; it does not call Google Calendar directly or implement calendar editing.

## Run the example

You need Node.js 22.12 or newer, [pnpm](https://pnpm.io/installation), and a Recall account with an API key in your chosen [region](https://docs.recall.ai/docs/regions).

### 1. Configure Recall and Google

Follow Recall's [Google Calendar setup guide](https://docs.recall.ai/docs/calendar-v1-google-calendar): enable the Google Calendar API, create an OAuth client, configure the consent screen, and save the client ID and client secret in your region's Recall dashboard. If your Google app is in testing, add the account you will connect as a test user.

Register this authorized redirect URI in the Google OAuth client, replacing the region as needed:

```text
https://us-east-1.recall.ai/api/v1/calendar/google_oauth_callback/
```

The Google client secret lives in Recall's dashboard. This example only needs the client ID locally.

### 2. Set environment variables

```bash
cp .env.sample .env
```

Fill in `.env`:

| Variable | Purpose | Default |
| --- | --- | --- |
| `RECALL_API_KEY` | API key from your Recall workspace. See [API authentication](https://docs.recall.ai/reference/authentication). | Required |
| `GOOGLE_OAUTH_CLIENT_ID` | The Google OAuth client ID configured in Recall. | Required |
| `RECALL_REGION` | Region containing your Recall workspace and API key. | `us-east-1` |
| `RECALL_USER_ID` | Stable identifier for the example's calendar user. | `local-demo-user` |
| `GOOGLE_OAUTH_REDIRECT_URI` | Must match the redirect URI registered with Google. | Recall's Google callback in the selected region |
| `CLIENT_ORIGIN` | Where Recall sends the browser after connection. | `http://localhost:5173` |

The supplied `.env.sample` explicitly sets the redirect URI to US East. If you change regions, update that URI too, or omit it to use the region-based default.

### 3. Start both servers

```bash
pnpm install
./run.sh
```

Open [localhost:5173](http://localhost:5173). The backend runs on port 3001. The script checks required variables, prints setup links for missing values, and keeps both servers' logs in the terminal. Press Ctrl+C to stop both.

## What happens when someone connects

1. **The user clicks Sign in with Google.** The browser calls this app's `POST /api/calendar/google/oauth` route.
2. **Our backend gets a Recall calendar token.** It sends the workspace API key in the `Authorization` header and `{ "user_id": RECALL_USER_ID }` to Recall's calendar authentication endpoint. The returned token identifies that calendar user; it is separate from Google's OAuth credentials.
3. **Our backend builds a Google authorization URL.** It includes the client ID, Recall callback URI, read-only calendar events and email scopes, plus `access_type=offline` and `prompt=consent`. The `state` parameter carries the Recall calendar token, callback URI, and success/error return URLs.
4. **Google asks the user for permission.** After consent, Google redirects the browser with an authorization code and the original `state` directly to Recall's callback. This app has no local Google callback handler.
5. **Recall completes the calendar connection.** Recall exchanges the code and manages the Google credentials needed for calendar access. It sends the browser back to `/calendar` on success, or `/?connection=error` on failure. See the [Calendar V1 integration guide](https://docs.recall.ai/v1.10/docs/calendar-v1-integration-guide).
6. **The app loads meetings.** It requests Recall's synced events and checks past events with bot IDs for available recordings. Connecting does not automatically apply a recording preset; open Preferences and save the behavior you want.

The backend requests a fresh Recall calendar token for sign-in, meeting reads, and preference reads/writes. It does not cache tokens. These tokens expire after one day; generating another for the same stable user ID does not require another Google consent flow. See [Get Calendar Auth Token](https://docs.recall.ai/reference/calendar_authenticate_create).

## Recall endpoints powering the app

All Recall requests use `https://{RECALL_REGION}.recall.ai`. Calendar user/meeting endpoints receive the user token in `x-recallcalendarauthtoken`; authentication and bot retrieval use the workspace API key in `Authorization`.

| Recall endpoint | Used for | App entry point |
| --- | --- | --- |
| [POST `/api/v1/calendar/authenticate/`](https://docs.recall.ai/reference/calendar_authenticate_create) | Exchange the API key and `user_id` for a calendar auth token. | `getCalendarAuthToken()` in `app/_lib/oauth.ts` |
| [GET `/api/v1/calendar/user/`](https://docs.recall.ai/reference/calendar_user_retrieve) | Read saved preferences and Google connection status. | GET `/api/calendar/recording_preference` |
| [PUT `/api/v1/calendar/user/`](https://docs.recall.ai/reference/calendar_user_update) | Save `{ "preferences": { ... } }`, including the bot name. | PUT `/api/calendar/recording_preference` |
| [GET `/api/v1/calendar/meetings/`](https://docs.recall.ai/reference/calendar_meetings_list) | Read synced meetings, recording decisions, and bot IDs. | GET `/api/calendar/events` |
| [GET `/api/v1/bot/{id}/`](https://docs.recall.ai/reference/bot_retrieve) | Find a past meeting's available mixed-video recording. | GET `/api/calendar/recording?bot_id=...` |

Google also redirects to Recall's `/api/v1/calendar/google_oauth_callback/` during connection. The app does not call Create Bot: Calendar V1 handles scheduling.

## Recording and synchronization behavior

**Recording preferences:** Calendar V1 does not record meetings by default. Saving a preset or switches updates the connected user's settings in Recall. The app supports `record_non_host`, `record_recurring`, `record_external`, `record_internal`, `record_confirmed`, `record_only_host`, and `bot_name`. A false filter is generally ignored rather than treated as its opposite; use the supplied presets as starting combinations. Eligible meetings need a valid meeting link, start/end times, and must not already have ended or been cancelled. See [Recording Preferences & Bot Deduplication](https://docs.recall.ai/docs/calendar-v1-recording-preferences).

**Calendar changes:** Recall handles event changes and adjusts relevant scheduled bots when meetings or preferences change. This app does not need to reschedule bots itself. Its Refresh button reloads the latest data into the page; there is no live-update subscription. See the [Calendar V1 FAQ](https://docs.recall.ai/v1.10/docs/calendar-v1-faq).

**Recording indicators:** Upcoming tiles use Recall's `will_record` value. Inspect `will_record_reason` in metadata for Recall's explanation. A scheduled bot or a “Will record” label is not proof that a completed video exists. For past events, the app checks the bot for a playback URL; failed lookups appear as unknown rather than “No recording.”

**Playback:** The backend selects the first available `recordings[].media_shortcuts.video_mixed.data.download_url` from Retrieve Bot. The event panel uses a video frame as a thumbnail, and Play opens the URL in a new window. See [How to get Mixed Video + Audio MP4](https://docs.recall.ai/docs/how-to-get-mixed-video-mp4). Signed playback URLs expire; Refresh fetches fresh ones while the media remains available. See [Storage and Data Retention](https://docs.recall.ai/docs/storage-and-playback).

**History:** Meeting requests set `start_time_after` to one year before the request. This only filters the history Recall still retains; it does not recover expired events or create recordings of earlier meetings. Calendar history and recording-media retention are separate.

## Use this example in your own app

Start with `app/_lib/oauth.ts` for the connection flow and `app/api/calendar/` for meeting, preference, and recording requests. Keep the server-side Recall calls and replace the example screens with your own product experience.

The key change for multiple users is identity: **this demo uses one `RECALL_USER_ID` for everyone**. In your app, supply the signed-in user's stable ID when generating their calendar token, and use that same ID for their later requests. The Google connection button here connects a calendar; it does not implement application accounts or sessions. Reusing one ID for different people can replace the calendar associated with that user. See the [Calendar V1 FAQ](https://docs.recall.ai/v1.10/docs/calendar-v1-faq).

Adapt the presets in `client/src/preferences.ts` to the recording choices your product offers. Recall stores the connection and preferences, so this example has no database. The API key stays in the backend, and this app never receives Google's access or refresh token directly.

If you want your application to decide which individual events get bots and control deduplication, use the [Calendar V2 integration guide](https://docs.recall.ai/docs/calendar-v2-integration-guide) as the next step. This example specifically demonstrates Recall-managed scheduling through Calendar V1.

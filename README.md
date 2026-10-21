# Google and Microsoft Calendar recording example

This app shows how to connect a Google or Microsoft Outlook calendar to Recall.ai, let Recall schedule meeting bots, and view the resulting recordings. It uses **Calendar V1**, where Recall manages calendar synchronization and bot scheduling according to each user's recording preferences.


## What you can do

- Connect a Google or Microsoft account through its OAuth sign-in screen.
- Browse synced meetings and see whether Recall plans to record them.
- Set recording preferences using individual switches or presets for all meetings, internal or external meetings, host-only meetings, and accepted invitations.
- Change the bot's display name.
- Disconnect either calendar from Preferences; stay in the app if another calendar remains connected.
- Inspect a meeting's complete Recall metadata.
- Preview available past recordings and open playback in a separate window.

## Run the example

You need Node.js 22.12 or newer, [pnpm](https://pnpm.io/installation), and a Recall account with an API key in your chosen [region](https://docs.recall.ai/v1.11/docs/regions).

### 1. Configure Recall and your calendar provider

#### Google Calendar

Follow Recall's [Google Calendar setup guide](https://docs.recall.ai/v1.11/docs/calendar-v1-google-calendar): enable the Google Calendar API, create an OAuth client, configure the consent screen, and save the client ID and client secret in your region's Recall dashboard. If your Google app is in testing, add the account you will connect as a test user.

Register this authorized redirect URI in the Google OAuth client, replacing the region as needed:

```text
https://us-east-1.recall.ai/api/v1/calendar/google_oauth_callback/
```

The Google client secret lives in Recall's dashboard. This example only needs the client ID locally.

#### Microsoft Outlook

Follow the [Microsoft Outlook setup guide](https://docs.recall.ai/v1.11/docs/calendar-v1-microsoft-outlook) to configure Microsoft Entra and Recall:

1. Register an app supporting **accounts in any organizational directory and personal Microsoft accounts**.
2. Add a **Web** redirect URI using your Recall region, as shown below. Enable **ID tokens** in the app's Authentication settings as directed by the guide.
3. Add Microsoft Graph's **delegated** `Calendars.Read` permission.
4. Configure either a certificate or a client secret, then save the Application (client) ID and those credentials in your region's Recall dashboard.
5. Set `MICROSOFT_OAUTH_CLIENT_ID` in this app's `.env` to the same Application (client) ID. No Microsoft secret or private key is needed in `.env`.

For US East, register this callback exactly, including the trailing slash:

```text
https://us-east-1.recall.ai/api/v1/calendar/ms_oauth_callback/
```


#### Default bot configuration

[Default bot config (US East)](https://us-east-1.recall.ai/dashboard/calendar-integration/configuration) → **Bot config** sets the default behavior for all Calendar V1 bots in your workspace. Use your Recall region’s dashboard.

### 2. Set environment variables

```bash
cp .env.sample .env
```

Fill in `.env`:

| Variable | Purpose | Required? | Default when unset or empty |
| --- | --- | --- | --- |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID matching the credentials saved in your Recall dashboard. | For Google sign-in | None |
| `GOOGLE_OAUTH_REDIRECT_URI` | Google authorization callback URL; must exactly match an authorized redirect URI in your Google OAuth client. | No | `https://{RECALL_REGION}.recall.ai/api/v1/calendar/google_oauth_callback/` |
| `MICROSOFT_OAUTH_CLIENT_ID` | Microsoft Application (client) ID matching the app configured in Recall. | For Microsoft sign-in | None |
| `MICROSOFT_OAUTH_REDIRECT_URI` | Microsoft Web callback URL; must exactly match the URI registered in Entra. | No | `https://{RECALL_REGION}.recall.ai/api/v1/calendar/ms_oauth_callback/` |
| `RECALL_API_KEY` | API key for your Recall workspace in `RECALL_REGION`. See [API authentication](https://docs.recall.ai/v1.11/reference/authentication). | Yes | None |
| `RECALL_REGION` | Recall region used for API requests, such as `us-east-1` or `us-west-2`. | No | `us-east-1` |
| `RECALL_USER_ID` | Your app's stable user identifier, sent to Recall as `user_id` when requesting a calendar auth token. | No | `local-demo-user` |

The callback overrides in `.env.sample` are blank so both URLs default to your `RECALL_REGION`. If you override either callback, it must exactly match the URI registered with that provider.

Google and Microsoft client secrets or certificate credentials belong in Recall's dashboard, not this app's environment. Configure at least one provider client ID to start the app; configure both to support both sign-in options.

### 3. Start both servers

```bash
pnpm install
./run.sh
```

Open [localhost:5173](http://localhost:5173). The backend runs on port 3001. The script checks required variables, prints setup links for missing values, and keeps both servers' logs in the terminal. Press Ctrl+C to stop both.

## Test the integration

1. Open the sample app and click **Sign in with Google** or **Sign in with Microsoft**. Connect the calendar you will use for the test.
2. Open **Preferences**, choose a preset that includes your test meeting, and click **Save preferences**. **Record all meetings** is a straightforward choice for this test.
3. On that connected calendar, create a meeting with a Google Meet or Microsoft Teams link, a start time **more than 10 minutes in the future**, and an end time.
4. Return to the sample app's calendar and click **Refresh**. Once the event syncs, confirm its tile says **Will record**. If it does not, hover over the event, select **View metadata**, and check `will_record_reason` against your saved preferences.
5. Join the call around its scheduled start time. When the Recall bot requests to join, **admit it**. Stay in the call and speak briefly so there is content to record.
6. End the test call and let the event's scheduled end time pass. Allow time for Recall to finish processing the recording.
7. Return to the sample app's calendar and click **Refresh** again. The past event should show **Recording available**. Hover over it to see the thumbnail, then click **Play** to open the recording in a separate window. If it is not available yet, wait a little longer and refresh again.

To test both providers, open **Preferences**, connect the other provider, and repeat with a meeting on that calendar.

See [Recording Preferences & Bot Deduplication](https://docs.recall.ai/v1.11/docs/calendar-v1-recording-preferences) for meeting eligibility and [How to get Mixed Video + Audio MP4](https://docs.recall.ai/v1.11/docs/how-to-get-mixed-video-mp4) for recording retrieval.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Google reports `redirect_uri_mismatch` or Microsoft reports `AADSTS50011`. | The callback registered in Google Cloud or Entra (**Web**), the corresponding `GOOGLE_OAUTH_REDIRECT_URI` or `MICROSOFT_OAUTH_REDIRECT_URI`, and the OAuth request's `redirect_uri` and callback value in `state` must match **exactly**, including protocol, region, path, and trailing slash. The state key is `google_oauth_redirect_url` for Google or `ms_oauth_redirect_url` for Microsoft. Replace any `REGION` placeholder in `.env`. See [Google Calendar setup](https://docs.recall.ai/v1.11/docs/calendar-v1-google-calendar) and [Microsoft Outlook setup](https://docs.recall.ai/v1.11/docs/calendar-v1-microsoft-outlook). |
| Recall rejects requests, or the expected calendar connection is missing. | Confirm `RECALL_REGION`, the API key, the dashboard where you configured Google or Microsoft credentials, and the callback hostname all refer to the same region. Recall regions have separate credentials and resources. See [Regions and Base URLs](https://docs.recall.ai/v1.11/docs/regions). |
| Calendar access fails because permission was not granted. | **Google:** Enable the Google Calendar API and grant `https://www.googleapis.com/auth/calendar.events.readonly` and `https://www.googleapis.com/auth/userinfo.email`. **Microsoft:** Add Microsoft Graph **delegated** `Calendars.Read` in Entra API permissions. For either provider, confirm the client ID matches the credentials saved in Recall, then reconnect and approve access. See [Google Calendar permissions](https://docs.recall.ai/v1.11/docs/calendar-v1-google-calendar) and [Microsoft Outlook setup](https://docs.recall.ai/v1.11/docs/calendar-v1-microsoft-outlook). |

## What happens when someone connects

1. **The user chooses Google or Microsoft sign-in.** The browser calls `POST /api/calendar/google/oauth` or `POST /api/calendar/microsoft/oauth`.
2. **Our backend gets a Recall calendar token.** It sends the workspace API key in the `Authorization` header and `{ "user_id": RECALL_USER_ID }` to Recall's calendar authentication endpoint. The returned token identifies that calendar user; it is separate from either provider's OAuth credentials.
3. **Our backend builds the provider's authorization URL.** Google requests read-only calendar events and email access. Microsoft requests `offline_access openid email https://graph.microsoft.com/Calendars.Read`, using `response_mode=query` and the `/common/oauth2/v2.0/authorize` endpoint. Both carry the Recall calendar token and return URLs in `state`; the callback key is `google_oauth_redirect_url` for Google or `ms_oauth_redirect_url` for Microsoft.
4. **The provider asks the user for permission.** After consent, it redirects the authorization code and original `state` directly to Recall's provider callback. This app does not handle the authorization code locally.
5. **Recall completes the calendar connection.** Recall exchanges the code and manages the provider credentials needed for calendar access. It sends the browser back to `/calendar` on success, or `/?connection=error` on failure. See the [Calendar V1 integration guide](https://docs.recall.ai/v1.11/docs/calendar-v1-integration-guide).
6. **The app loads meetings.** It requests Recall's synced events and checks past events with bot IDs for available recordings. Connecting does not automatically apply a recording preset; open Preferences and save the behavior you want.

The backend requests a fresh Recall calendar token for sign-in, meeting reads, and preference reads/writes. It does not cache tokens. These tokens expire after one day; generating another for the same stable user ID does not require another provider consent flow. See [Get Calendar Auth Token](https://docs.recall.ai/v1.11/reference/calendar_authenticate_create).

## Recall endpoints powering the app

All Recall requests use `https://{RECALL_REGION}.recall.ai`. Calendar user/meeting endpoints receive the user token in `x-recallcalendarauthtoken`; authentication and bot retrieval use the workspace API key in `Authorization`.

| Recall endpoint | Used for | App entry point |
| --- | --- | --- |
| [POST `/api/v1/calendar/authenticate/`](https://docs.recall.ai/v1.11/reference/calendar_authenticate_create) | Exchange the API key and `user_id` for a calendar auth token. | `getCalendarAuthToken()` in `app/_lib/oauth.ts` |
| [GET `/api/v1/calendar/user/`](https://docs.recall.ai/v1.11/reference/calendar_user_retrieve) | Read saved preferences and connected Google/Microsoft platforms. | GET `/api/calendar/recording_preference` |
| [PUT `/api/v1/calendar/user/`](https://docs.recall.ai/v1.11/reference/calendar_user_update) | Save `{ "preferences": { ... } }`, including the bot name. | PUT `/api/calendar/recording_preference` |
| [GET `/api/v1/calendar/meetings/`](https://docs.recall.ai/v1.11/reference/calendar_meetings_list) | Read synced meetings, recording decisions, and bot IDs. | GET `/api/calendar/events` |
| [Disconnect Calendar Platform](https://docs.recall.ai/v1.11/reference/calendar_user_disconnect_create) — POST `/api/v1/calendar/user/disconnect/` | Disconnect the selected provider using the calendar user's auth token and `{ "platform": "google" }` or `{ "platform": "microsoft" }`. | POST `/api/calendar/disconnect` |
| [GET `/api/v1/bot/{id}/`](https://docs.recall.ai/v1.11/reference/bot_retrieve) | Find a past meeting's available mixed-video recording. | GET `/api/calendar/recording?bot_id=...` |

Google redirects to Recall's `/api/v1/calendar/google_oauth_callback/`; Microsoft uses `/api/v1/calendar/ms_oauth_callback/`. The app does not call Create Bot: Calendar V1 handles scheduling.

## Recording and synchronization behavior

**Recording preferences:** Calendar V1 does not record meetings by default. Saving a preset or switches updates the connected user's settings in Recall. The app supports `record_non_host`, `record_recurring`, `record_external`, `record_internal`, `record_confirmed`, `record_only_host`, and `bot_name`. A false filter is generally ignored rather than treated as its opposite; use the supplied presets as starting combinations. Eligible meetings need a valid meeting link, start/end times, and must not already have ended or been cancelled. See [Recording Preferences & Bot Deduplication](https://docs.recall.ai/v1.11/docs/calendar-v1-recording-preferences).

**Calendar changes:** Recall handles event changes and adjusts relevant scheduled bots when meetings or preferences change. This app does not need to reschedule bots itself. Its Refresh button reloads the latest data into the page; there is no live-update subscription. See the [Calendar V1 FAQ](https://docs.recall.ai/v1.11/docs/calendar-v1-faq).

**Recording indicators:** Upcoming tiles use Recall's `will_record` value. Inspect `will_record_reason` in metadata for Recall's explanation. A scheduled bot or a “Will record” label is not proof that a completed video exists. For past events, the app checks the bot for a playback URL; failed lookups appear as unknown rather than “No recording.”

**Playback:** The backend selects the first available `recordings[].media_shortcuts.video_mixed.data.download_url` from Retrieve Bot. The event panel uses a video frame as a thumbnail, and Play opens the URL in a new window. See [How to get Mixed Video + Audio MP4](https://docs.recall.ai/v1.11/docs/how-to-get-mixed-video-mp4). Signed playback URLs expire; Refresh fetches fresh ones while the media remains available. See [Storage and Data Retention](https://docs.recall.ai/v1.11/docs/storage-and-playback).

**History:** Meeting requests set `start_time_after` to one year before the request. This only filters the history Recall still retains; it does not recover expired events or create recordings of earlier meetings. Calendar history and recording-media retention are separate.

## Connecting Google and Microsoft together

You can start with either provider. After connecting Microsoft, open **Preferences** to find **Sign in with Google**; after connecting Google, the same page offers **Sign in with Microsoft**.

Both connections belong to the same Recall calendar user because the backend uses the same `RECALL_USER_ID` for each flow. The existing `GET /api/calendar/events` request reads both providers' synced meetings through Recall's List Calendar Meetings endpoint, with the same calendar auth token and no provider-specific query. Recording preferences and the bot name apply to that shared calendar user.

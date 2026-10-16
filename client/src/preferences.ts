export const preferenceFields = [
  { key: 'record_external', label: 'External meetings' },
  { key: 'record_internal', label: 'Internal meetings' },
  { key: 'record_non_host', label: 'Only when I’m not the host' },
  { key: 'record_recurring', label: 'Recurring meetings only' },
  { key: 'record_only_host', label: 'Only when I’m the host' },
  { key: 'record_confirmed', label: 'Accepted invitations only' },
] as const

export type PreferenceKey = typeof preferenceFields[number]['key']
export type Preferences = Record<PreferenceKey, boolean> & { bot_name: string }
export type RecordingRules = Record<PreferenceKey, boolean>

const allMeetings: RecordingRules = {
  record_non_host: false, record_recurring: false, record_external: true,
  record_internal: true, record_confirmed: false, record_only_host: false,
}

export const presets = [
  { id: 'all', label: 'Record all meetings', rules: allMeetings },
  { id: 'internal', label: 'Internal meetings only', rules: { ...allMeetings, record_external: false } },
  { id: 'external', label: 'External meetings only', rules: { ...allMeetings, record_internal: false } },
  { id: 'host', label: 'Meetings I host', rules: { ...allMeetings, record_only_host: true } },
  { id: 'accepted', label: 'Accepted invitations only', rules: { ...allMeetings, record_confirmed: true } },
]

export function selectedPreset(preferences: Preferences): string | undefined {
  return presets.find(preset => preferenceFields.every(({ key }) => preset.rules[key] === preferences[key]))?.id
}

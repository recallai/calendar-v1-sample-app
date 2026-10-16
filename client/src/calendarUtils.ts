export interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  bot_id?: string | null
  will_record?: boolean
  [key: string]: unknown
}

export interface Recording {
  url: string | null
  error?: string
}

export function recordingStatus(event: CalendarEvent, now: Date, recording?: Recording) {
  if (new Date(event.end_time) >= now) {
    return { label: event.will_record ? 'Will record' : 'Will not record', available: !!event.will_record }
  }
  if (!event.bot_id) return { label: 'No recording', available: false }
  if (!recording) return { label: 'Checking recording…', available: null }
  if (recording.error) return { label: 'Could not check recording', available: null }
  return { label: recording.url ? 'Recording available' : 'No recording', available: !!recording.url }
}

export function addDays(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count)
}

export function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

export function weekDays(date: Date) {
  const sunday = addDays(date, -date.getDay())
  return Array.from({ length: 7 }, (_, index) => addDays(sunday, index))
}

export function monthDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const sunday = addDays(first, -first.getDay())
  return Array.from({ length: 42 }, (_, index) => addDays(sunday, index))
}

export function eventsOnDay(events: CalendarEvent[], day: Date) {
  return events.filter(event => new Date(event.start_time) < addDays(day, 1) && new Date(event.end_time) > day)
    .sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time))
}

// Split overlapping events into columns, so no meeting hides another meeting.
export function dayLayout(events: CalendarEvent[], day: Date) {
  const segments = eventsOnDay(events, day).map(event => {
    const start = new Date(event.start_time)
    const end = new Date(event.end_time)
    return {
      event,
      start: start < day ? 0 : start.getHours() * 60 + start.getMinutes(),
      end: end >= addDays(day, 1) ? 1440 : end.getHours() * 60 + end.getMinutes(),
      column: 0,
      columns: 1,
    }
  })
  let group: typeof segments = []
  let columnEnds: number[] = []
  let groupEnd = 0
  function finishGroup() {
    group.forEach(segment => { segment.columns = columnEnds.length })
    group = []
    columnEnds = []
  }
  for (const segment of segments) {
    if (segment.start >= groupEnd) finishGroup()
    let column = columnEnds.findIndex(end => end <= segment.start)
    if (column === -1) column = columnEnds.length
    columnEnds[column] = segment.end
    segment.column = column
    group.push(segment)
    groupEnd = Math.max(...columnEnds)
  }
  finishGroup()
  return segments
}

import { useEffect, useRef, useState } from 'react'
import { addDays, sameDay, weekDays, monthDays, eventsOnDay, dayLayout, type CalendarEvent, type Recording, recordingStatus } from './calendarUtils'
import './calendar.css'
import EventCard from './EventCard'

const hourHeight = 112
const time = (value: string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const weekday = (day: Date) => day.toLocaleDateString([], { weekday: 'short' })

export default function Calendar() {
  const [date, setDate] = useState(() => new Date())
  const [view, setView] = useState<'week' | 'month'>('week')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [recordings, setRecordings] = useState<Record<string, Recording>>({})
  const [selected, setSelected] = useState<{ event: CalendarEvent; anchor: HTMLButtonElement } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const timeline = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(() => new Date())
  const days = view === 'week' ? weekDays(date) : monthDays(date)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  function closeEvent() {
    setSelected(null)
  }

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/calendar/events')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setEvents(data)
      closeEvent()
      setRecordings({})
      const botIds = [...new Set((data as CalendarEvent[])
        .filter(event => new Date(event.end_time) < new Date() && event.bot_id)
        .map(event => event.bot_id!))]
      await Promise.all(botIds.map(async botId => {
        let recording: Recording
        try {
          const result = await fetch(`/api/calendar/recording?bot_id=${encodeURIComponent(botId)}`)
          const body = await result.json()
          if (!result.ok) throw new Error(body.error)
          recording = body
        } catch {
          recording = { url: null, error: 'Could not check recording.' }
        }
        setRecordings(current => ({ ...current, [botId]: recording }))
      }))
    } catch {
      setError('Could not load calendar events. Try refreshing.')
    }
    setLoading(false)
  }

  useEffect(() => {
    async function load() { await refresh() }
    void load()
  }, [])

  useEffect(() => {
    if (view === 'week' && timeline.current) timeline.current.scrollTop = 7 * hourHeight
  }, [view])

  function navigate(direction: number) {
    closeEvent()
    setDate(view === 'week' ? addDays(date, direction * 7) : new Date(date.getFullYear(), date.getMonth() + direction, 1))
  }

  function openEvent(event: CalendarEvent, anchor: HTMLButtonElement) {
    setSelected({ event, anchor })
  }

  function eventButton(event: CalendarEvent, className: string, style?: React.CSSProperties) {
    const status = recordingStatus(event, now, event.bot_id ? recordings[event.bot_id] : undefined)
    return <button
      type="button"
      key={event.id}
      className={className}
      style={style}
      aria-label={`${event.title || '(No title)'}, ${time(event.start_time)} to ${time(event.end_time)}`}
      onMouseEnter={mouse => openEvent(event, mouse.currentTarget)}
      onFocus={focus => openEvent(event, focus.currentTarget)}
      onClick={click => openEvent(event, click.currentTarget)}
    >
      <strong>{event.title || '(No title)'}</strong>
      <span className="event-recording-status" title={status.label}>
        <i className={`recording-dot ${status.available === null ? 'is-unknown' : status.available ? 'is-available' : 'is-unavailable'}`} aria-hidden="true" />
        {status.label}
      </span>
    </button>
  }

  return <main className="calendar-page">
    <header className="calendar-toolbar">
      <h1>Calendar</h1>
      <button type="button" onClick={() => setDate(new Date())}>Today</button>
      <div className="calendar-navigation">
        <button type="button" aria-label="Previous" onClick={() => navigate(-1)}>‹</button>
        <button type="button" aria-label="Next" onClick={() => navigate(1)}>›</button>
      </div>
      <h2>{date.toLocaleDateString([], { month: 'long', year: 'numeric' })}</h2>
      <div className="calendar-actions">
        <button type="button" onClick={refresh} disabled={loading}>Refresh</button>
        <select aria-label="Calendar view" value={view} onChange={event => { setView(event.target.value as 'week' | 'month'); closeEvent() }}>
          <option value="week">Week</option><option value="month">Month</option>
        </select>
        <button type="button" onClick={() => window.location.assign('/configuration')}>Preferences</button>
      </div>
    </header>
    <div className="calendar-status" role="status">{loading ? 'Loading events…' : error || `${events.length} events · ${timezone}`}</div>
    <p className="calendar-hint">Hover on a meeting to view recordings and metadata</p>
    {view === 'week' ? <div className="week-calendar">
      <div className="week-heading">
        <div className="time-gutter" />
        {days.map(day => <div className={`day-heading ${sameDay(day, now) ? 'is-today' : ''}`} key={day.toISOString()}>
          <span>{weekday(day)}</span><button type="button" onClick={() => setDate(day)}>{day.getDate()}</button>
        </div>)}
      </div>
      <div className="week-scroll" ref={timeline}>
        <div className="week-body" style={{ height: 24 * hourHeight }}>
          <div className="hours">{Array.from({ length: 24 }, (_, hour) => <span key={hour} style={{ top: hour * hourHeight }}>{hour === 0 ? '' : new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: 'numeric' })}</span>)}</div>
          {days.map(day => <div className="day-column" key={day.toISOString()}>
            {sameDay(day, now) && <div className="current-time-line" role="img" aria-label={`Current time: ${time(now.toISOString())}`}
              style={{ top: (now.getHours() + now.getMinutes() / 60) * hourHeight }} />}
            {Array.from({ length: 24 }, (_, hour) => <div className="hour-line" key={hour} style={{ top: hour * hourHeight }} />)}
            {dayLayout(events, day).map(segment => eventButton(segment.event, 'week-event', {
              top: segment.start / 60 * hourHeight,
              height: Math.max((segment.end - segment.start) / 60 * hourHeight, 40),
              left: `${segment.column / segment.columns * 100}%`,
              width: `calc(${100 / segment.columns}% - 3px)`,
            }))}
          </div>)}
        </div>
      </div>
    </div> : <div className="month-calendar">
      <div className="month-weekdays">{days.slice(0, 7).map(day => <div key={day.toISOString()}>{weekday(day)}</div>)}</div>
      <div className="month-grid">{days.map(day => <div className={`month-cell ${day.getMonth() !== date.getMonth() ? 'other-month' : ''}`} key={day.toISOString()}>
        <button className={`month-date ${sameDay(day, now) ? 'is-today' : ''}`} type="button" aria-label={day.toDateString()} onClick={() => { setDate(day); setView('week') }}>{day.getDate()}</button>
        {eventsOnDay(events, day).map(event => eventButton(event, 'month-event'))}
      </div>)}</div>
    </div>}
    {!loading && !error && !days.some(day => eventsOnDay(events, day).length) && <p className="calendar-empty">No events returned by Recall for this {view}.</p>}
    {selected && <EventCard
      key={selected.event.id}
      event={selected.event}
      now={now}
      anchor={selected.anchor}
      recording={selected.event.bot_id ? recordings[selected.event.bot_id] : undefined}
      onClose={closeEvent}
    />}
  </main>
}

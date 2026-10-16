import { useEffect, useRef, useState } from 'react'
import { recordingStatus, type CalendarEvent, type Recording } from './calendarUtils'

interface Props {
  event: CalendarEvent
  now: Date
  anchor: HTMLButtonElement
  recording?: Recording
  onClose: () => void
}

export default function EventCard({ event, now, anchor, recording, onClose }: Props) {
  const [playbackError, setPlaybackError] = useState(false)
  const card = useRef<HTMLElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [position] = useState(() => {
    const tile = anchor.getBoundingClientRect()
    const width = Math.min(340, window.innerWidth - 24)
    const left = tile.left - width - 8
    return { width, left: Math.max(12, left), top: Math.max(12, Math.min(tile.top, window.innerHeight - 230)) }
  })

  function keepOpen() {
    clearTimeout(closeTimer.current)
  }

  useEffect(() => {
    function leaveTile() {
      clearTimeout(closeTimer.current)
      closeTimer.current = setTimeout(() => {
        const hovering = card.current?.matches(':hover') || anchor.matches(':hover')
        if (!hovering && !dialog.current?.open) onClose()
      }, 250)
    }
    function enterTile() { clearTimeout(closeTimer.current) }
    function clickOutside(mouse: PointerEvent) {
      const target = mouse.target as Node
      if (!card.current?.contains(target) && !anchor.contains(target) && !dialog.current?.contains(target)) onClose()
    }
    function escape(key: KeyboardEvent) {
      if (key.key === 'Escape' && !dialog.current?.open) onClose()
    }
    const panel = card.current
    panel?.addEventListener('mouseenter', enterTile)
    panel?.addEventListener('mouseleave', leaveTile)
    anchor.addEventListener('mouseleave', leaveTile)
    anchor.addEventListener('mouseenter', enterTile)
    document.addEventListener('pointerdown', clickOutside)
    document.addEventListener('keydown', escape)
    return () => {
      clearTimeout(closeTimer.current)
      panel?.removeEventListener('mouseenter', enterTile)
      panel?.removeEventListener('mouseleave', leaveTile)
      anchor.removeEventListener('mouseleave', leaveTile)
      anchor.removeEventListener('mouseenter', enterTile)
      document.removeEventListener('pointerdown', clickOutside)
      document.removeEventListener('keydown', escape)
    }
  }, [anchor, onClose])

  const past = new Date(event.end_time) < now
  const status = recordingStatus(event, now, recording)

  return <>
    <aside ref={card} className="event-card" style={position} aria-label="Event details" onFocus={keepOpen}>
      <div className="event-card-toolbar">
        <h2>{event.title || '(No title)'}</h2>
        <button type="button" onClick={() => { keepOpen(); dialog.current?.showModal() }}>View metadata</button>
      </div>
      {past && recording?.url ? <div className="recording-preview">
        <video src={`${recording.url}#t=0.1`} preload="metadata" playsInline disablePictureInPicture
          onError={() => setPlaybackError(true)} />
        <button type="button" className="recording-play" aria-label="Play recording" onClick={click => {
          if (click.detail > 1) return
          keepOpen()
          window.open(recording.url!, '_blank', 'popup,width=1000,height=700,noopener,noreferrer')
        }}>▶</button>
        {playbackError && <p className="recording-playback-error">Preview unavailable. Click play to open recording.</p>}
      </div> : <div className="event-card-empty">{past ? status.label : 'No recording yet'}</div>}
    </aside>
    <dialog ref={dialog} className="metadata-dialog" aria-labelledby="metadata-title" onClose={onClose} onClick={click => {
      if (click.target === click.currentTarget) dialog.current?.close()
    }}>
      <div className="metadata-heading"><h2 id="metadata-title">Event metadata</h2><button type="button" onClick={() => dialog.current?.close()}>Close</button></div>
      <pre>{JSON.stringify(event, null, 2)}</pre>
    </dialog>
  </>
}

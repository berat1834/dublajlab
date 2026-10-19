import type { TimelineLine } from '../types'

const DEFAULT_LINE_DURATION_SECONDS = 3

export function createInitialTimelineLines(duration: number): TimelineLine[] {
  return [
    {
      id: 'line-1',
      start: 0,
      end: Number(Math.min(duration, DEFAULT_LINE_DURATION_SECONDS).toFixed(2)),
      text: '',
    },
  ]
}

export function createNextTimelineLine(
  duration: number,
  lastEnd: number,
  id: string,
): TimelineLine {
  const start = Math.min(lastEnd, Math.max(0, duration - 0.5))
  const end = Math.min(duration, Math.max(start + 0.5, start + DEFAULT_LINE_DURATION_SECONDS))

  return {
    id,
    start: Number(start.toFixed(2)),
    end: Number(end.toFixed(2)),
    text: '',
  }
}

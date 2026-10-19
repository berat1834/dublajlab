import { describe, expect, it } from 'vitest'
import { createInitialTimelineLines, createNextTimelineLine } from './timelineDefaults'

describe('timeline defaults', () => {
  it('starts with one short blank line instead of covering the whole video', () => {
    expect(createInitialTimelineLines(12)).toEqual([
      { id: 'line-1', start: 0, end: 3, text: '' },
    ])
  })

  it('keeps the first line within a short video', () => {
    expect(createInitialTimelineLines(1.75)[0]).toMatchObject({
      start: 0,
      end: 1.75,
      text: '',
    })
  })

  it('adds another blank line after the previous interval', () => {
    expect(createNextTimelineLine(10, 3, 'line-new')).toEqual({
      id: 'line-new',
      start: 3,
      end: 6,
      text: '',
    })
  })
})

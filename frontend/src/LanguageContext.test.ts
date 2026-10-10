import { describe, expect, it } from 'vitest'
import { translate } from './LanguageContext'

describe('English product navigation and core screens', () => {
  it('translates Play, Dubs, and My Library labels', () => {
    expect(translate('nav.play', 'EN')).toBe('Play')
    expect(translate('nav.dubs', 'EN')).toBe('Dubs')
    expect(translate('drop.library', 'EN')).toBe('My Library')
    expect(translate('library.title', 'EN')).toBe('My Library')
  })

  it('translates job progress and empty feed states', () => {
    expect(translate('studio.job.timeline', 'EN')).toBe('Placing recordings on the timeline…')
    expect(translate('studio.job.saving', 'EN')).toBe('Saving the MP4 output…')
    expect(translate('dubs.empty_title', 'EN')).toBe('Share the first dub')
    expect(translate('dubs.load_error_title', 'EN')).toBe('Dubs could not be loaded')
  })

  it('does not silently return raw keys for the audited English labels', () => {
    const keys = [
      'action.retry_export',
      'common.seconds_short',
      'library.deleted',
      'library.delete',
      'error.server_message',
    ]
    for (const key of keys) expect(translate(key, 'EN')).not.toBe(key)
  })
})

import { describe, expect, it } from 'vitest'
import { scanContent } from '../src/scanContent'

describe('scanContent', () => {
  it('extracts unique CJK characters from globbed files', async () => {
    const chars = await scanContent([
      { cwd: 'tests/fixtures', patterns: ['*.{md,vue}'] },
    ])
    expect(chars.has('落')).toBe(true)
    expect(chars.has('梅')).toBe(true)
    expect(chars.has('受')).toBe(true)
    expect(chars.has('命')).toBe(true)
  })

  it('extracts ASCII printable characters', async () => {
    const chars = await scanContent([
      { cwd: 'tests/fixtures', patterns: ['*.md'] },
    ])
    expect(chars.has('A')).toBe(true)
    expect(chars.has('S')).toBe(true)
    expect(chars.has('C')).toBe(true)
    expect(chars.has('I')).toBe(true)
  })

  it('returns empty Set when no files match', async () => {
    const chars = await scanContent([
      { cwd: 'tests/fixtures', patterns: ['**/*.notexist'] },
    ])
    expect(chars.size).toBe(0)
  })

  it('deduplicates characters within and across files', async () => {
    const chars = await scanContent([
      { cwd: 'tests/fixtures', patterns: ['*.{md,vue}'] },
    ])
    const occurrences = [...chars].filter(c => c === '受').length
    expect(occurrences).toBe(1)
  })

  it('merges characters across multiple scan sources with independent cwds', async () => {
    const chars = await scanContent([
      { cwd: 'tests/fixtures/multi-a', patterns: ['**/*.md'] },
      { cwd: 'tests/fixtures/multi-b', patterns: ['**/*.vue'] },
    ])
    // from multi-a/page.md
    expect(chars.has('落')).toBe(true)
    expect(chars.has('梅')).toBe(true)
    // from multi-b/stamp.vue
    expect(chars.has('听')).toBe(true)
    expect(chars.has('雪')).toBe(true)
  })
})

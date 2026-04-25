import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { subsetFont } from '../src/subsetFont'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE = path.join(__dirname, 'fixtures/sample.ttf')

describe('subsetFont', () => {
  it('produces a smaller woff2 buffer for a tiny char set', async () => {
    const original = await readFile(FIXTURE)
    const subset = await subsetFont({
      fontBuffer: original,
      chars: new Set(['受', '命', '于', '天']),
      format: 'woff2',
    })

    expect(subset.length).toBeGreaterThan(0)
    expect(subset.length).toBeLessThan(original.length)
  })

  it('emits a buffer starting with the woff2 magic bytes', async () => {
    const original = await readFile(FIXTURE)
    const subset = await subsetFont({
      fontBuffer: original,
      chars: new Set(['受']),
      format: 'woff2',
    })
    // woff2 magic: 'wOF2' (0x77 0x4F 0x46 0x32)
    expect(subset[0]).toBe(0x77)
    expect(subset[1]).toBe(0x4F)
    expect(subset[2]).toBe(0x46)
    expect(subset[3]).toBe(0x32)
  })

  it('handles empty char set without throwing', async () => {
    const original = await readFile(FIXTURE)
    const subset = await subsetFont({
      fontBuffer: original,
      chars: new Set(),
      format: 'woff2',
    })
    expect(subset.length).toBeGreaterThan(0)
  })
})

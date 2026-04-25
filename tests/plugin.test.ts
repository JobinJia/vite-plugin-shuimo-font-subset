import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import shuimoFontSubset from '../src/index'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE_DIR = path.join(__dirname, 'fixtures')
const FIXTURE_TTF = path.join(FIXTURE_DIR, 'sample.ttf')

describe('shuimoFontSubset plugin', () => {
  it('exports a vite plugin with the expected name and apply mode', () => {
    const plugin = shuimoFontSubset({
      targetFonts: ['sample.ttf'],
      scanFiles: ['**/*.md'],
    })
    expect(plugin.name).toBe('shuimo-font-subset')
    expect(plugin.apply).toBe('build')
  })

  it('replaces a matching font asset source with subset woff2 (in place)', async () => {
    const plugin = shuimoFontSubset({
      targetFonts: [FIXTURE_TTF],
      scanFiles: ['**/*.{md,vue}'],
      scanCwd: FIXTURE_DIR,
      format: 'woff2',
    })

    const ctx = {} as any
    await callHook(plugin.configResolved, ctx, { root: FIXTURE_DIR })
    await callHook(plugin.buildStart, ctx, {})

    const original = await readFile(FIXTURE_TTF)
    const bundle: Record<string, any> = {
      'assets/sample-abc123.ttf': {
        type: 'asset',
        fileName: 'assets/sample-abc123.ttf',
        name: 'sample.ttf',
        source: original,
      },
    }

    await callHook(plugin.generateBundle, ctx, {}, bundle, false)

    // Asset key/fileName are unchanged (rolldown forbids bundle re-keying).
    expect(Object.keys(bundle)).toEqual(['assets/sample-abc123.ttf'])
    const replaced = bundle['assets/sample-abc123.ttf']
    expect(replaced.fileName).toBe('assets/sample-abc123.ttf')
    expect(replaced.source.length).toBeLessThan(original.length)
    // woff2 magic
    expect(replaced.source[0]).toBe(0x77)
    expect(replaced.source[1]).toBe(0x4F)
  })

  it('leaves non-matching font assets untouched', async () => {
    const plugin = shuimoFontSubset({
      targetFonts: [FIXTURE_TTF],
      scanFiles: ['**/*.md'],
      scanCwd: FIXTURE_DIR,
    })

    const ctx = {} as any
    await callHook(plugin.configResolved, ctx, { root: FIXTURE_DIR })
    await callHook(plugin.buildStart, ctx, {})

    const decoyContent = Buffer.from('not a font')
    const bundle: Record<string, any> = {
      'assets/other-xyz.ttf': {
        type: 'asset',
        fileName: 'assets/other-xyz.ttf',
        name: 'other.ttf',
        source: decoyContent,
      },
    }

    await callHook(plugin.generateBundle, ctx, {}, bundle, false)

    expect(bundle['assets/other-xyz.ttf']).toBeDefined()
    expect(bundle['assets/other-xyz.ttf'].source).toBe(decoyContent)
  })
})

// Helper: vite plugin hooks may be a function or an `{ handler }` object.
async function callHook(hook: any, ctx: any, ...args: any[]): Promise<void> {
  if (!hook)
    return
  const fn = typeof hook === 'function' ? hook : hook.handler
  await fn.call(ctx, ...args)
}

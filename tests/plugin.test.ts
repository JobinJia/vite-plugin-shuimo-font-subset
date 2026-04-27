import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import shuimoFontSubset from '../src/index'
import { scanContent } from '../src/scanContent'
import { subsetFont } from '../src/subsetFont'

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

  it('merges scanned characters from multiple scan roots into the subset', async () => {
    const rootA = path.join(FIXTURE_DIR, 'multi-a')
    const rootB = path.join(FIXTURE_DIR, 'multi-b')

    const plugin = shuimoFontSubset({
      targetFonts: [FIXTURE_TTF],
      scanFiles: [
        { cwd: rootA, patterns: ['**/*.md'] },
        { cwd: rootB, patterns: ['**/*.vue'] },
      ],
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
    const replaced: Buffer = bundle['assets/sample-abc123.ttf'].source

    // Reference subsets computed from each scan root in isolation, and from
    // both merged. The plugin output must equal the merged reference, and
    // differ from each single-root reference (proving both groups contributed).
    const charsA = await scanContent([{ cwd: rootA, patterns: ['**/*.md'] }])
    const charsB = await scanContent([{ cwd: rootB, patterns: ['**/*.vue'] }])
    const charsBoth = await scanContent([
      { cwd: rootA, patterns: ['**/*.md'] },
      { cwd: rootB, patterns: ['**/*.vue'] },
    ])

    const expectedA = await subsetFont({ fontBuffer: original, chars: charsA, format: 'woff2' })
    const expectedB = await subsetFont({ fontBuffer: original, chars: charsB, format: 'woff2' })
    const expectedBoth = await subsetFont({ fontBuffer: original, chars: charsBoth, format: 'woff2' })

    expect(Buffer.from(replaced).equals(expectedBoth)).toBe(true)
    expect(Buffer.from(replaced).equals(expectedA)).toBe(false)
    expect(Buffer.from(replaced).equals(expectedB)).toBe(false)
  })

  it('falls back per-source cwd to top-level scanCwd when source.cwd is omitted', async () => {
    const plugin = shuimoFontSubset({
      targetFonts: [FIXTURE_TTF],
      scanFiles: [{ patterns: ['multi-a/**/*.md', 'multi-b/**/*.vue'] }],
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
    const replaced: Buffer = bundle['assets/sample-abc123.ttf'].source

    // Should produce the same bytes as the explicit two-cwd form above.
    const charsBoth = await scanContent([
      { cwd: path.join(FIXTURE_DIR, 'multi-a'), patterns: ['**/*.md'] },
      { cwd: path.join(FIXTURE_DIR, 'multi-b'), patterns: ['**/*.vue'] },
    ])
    const expectedBoth = await subsetFont({ fontBuffer: original, chars: charsBoth, format: 'woff2' })
    expect(Buffer.from(replaced).equals(expectedBoth)).toBe(true)
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

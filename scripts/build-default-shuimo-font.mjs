#!/usr/bin/env node
/**
 * One-shot script: convert valaxy-theme-shuimo's yishanbeizhuanti.ttf to
 * WOFF2 preserving all glyphs the source font has (the source is a 篆体
 * font with ~3800 glyphs, so the output stays ~1.2 MB).
 *
 * Why ship all glyphs by default: stamp/title text uses decorative
 * characters (隔/窗/梅/雪/阁/寿/墨/韵/斋…) that fall outside frequency-
 * ranked top-N lists. Pre-subsetting would silently drop them, leaving the
 * @jobinjia/vite-plugin-shuimo-font-subset plugin unable to recover them
 * at the user's build time. So the published default is the full font;
 * users who care about the last KB enable the plugin and get a content-
 * aware ~10–30KB subset.
 *
 * Usage:
 *   node scripts/build-default-shuimo-font.mjs <input-ttf> <output-woff2>
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import subset from 'subset-font'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_INPUT = path.resolve(__dirname, '../../github/valaxy/valaxy-theme-shuimo/theme/assets/fonts/yishanbeizhuanti-original.ttf')
const FALLBACK_INPUT = path.resolve(__dirname, '../../github/valaxy/valaxy-theme-shuimo/theme/assets/fonts/yishanbeizhuanti.ttf')
const DEFAULT_OUTPUT = path.resolve(__dirname, '../../github/valaxy/valaxy-theme-shuimo/theme/assets/fonts/yishanbeizhuanti.woff2')

// All Unicode CJK Unified Ideographs + Extension A + ASCII printable.
// subset-font only retains codepoints that the source font actually has,
// so the output ends up with whichever glyphs the .ttf supplies.
function fullCoverageCharset() {
  const chars = []
  for (let cp = 0x21; cp <= 0x7E; cp++) chars.push(String.fromCodePoint(cp))
  for (let cp = 0x4E00; cp <= 0x9FFF; cp++) chars.push(String.fromCodePoint(cp))
  for (let cp = 0x3400; cp <= 0x4DBF; cp++) chars.push(String.fromCodePoint(cp))
  return chars.join('')
}

async function resolveInput(arg) {
  if (arg)
    return arg
  try {
    await readFile(DEFAULT_INPUT)
    return DEFAULT_INPUT
  }
  catch {
    return FALLBACK_INPUT
  }
}

async function main() {
  const inputPath = await resolveInput(process.argv[2])
  const outputPath = process.argv[3] ?? DEFAULT_OUTPUT

  console.warn(`Reading source font: ${inputPath}`)
  const original = await readFile(inputPath)

  const text = fullCoverageCharset()
  console.warn(`Charset: ${[...text].length} unique codepoints (only those present in the source font are retained)`)

  const woff2 = await subset(original, text, { targetFormat: 'woff2' })
  await writeFile(outputPath, woff2)
  console.warn(`✓ ${outputPath}: ${original.length} → ${woff2.length} bytes (${(woff2.length / original.length * 100).toFixed(1)}%)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

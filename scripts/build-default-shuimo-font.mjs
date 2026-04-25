#!/usr/bin/env node
/**
 * One-shot script: subset valaxy-theme-shuimo's yishanbeizhuanti.ttf
 * to top-1000 most-common Chinese characters (by Jun Da's frequency list)
 * + ASCII printable, output WOFF2.
 *
 * Top-1000 covers ~90% of typical modern Chinese text. Users wanting full
 * coverage should enable the @jobinjia/vite-plugin-shuimo-font-subset plugin
 * to generate a content-aware subset at their own build time.
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
const CHARSET_FILE = path.join(__dirname, 'top-1000-chars.txt')

function asciiPrintable() {
  const chars = []
  for (let cp = 0x21; cp <= 0x7E; cp++)
    chars.push(String.fromCodePoint(cp))
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

  const top1000 = (await readFile(CHARSET_FILE, 'utf8')).trim()
  const ascii = asciiPrintable()
  const text = top1000 + ascii
  console.warn(`Charset: ${[...top1000].length} top hanzi + ${ascii.length} ASCII = ${[...text].length} unique`)

  const woff2 = await subset(original, text, { targetFormat: 'woff2' })
  await writeFile(outputPath, woff2)
  console.warn(`✓ ${outputPath}: ${original.length} → ${woff2.length} bytes (${(woff2.length / original.length * 100).toFixed(1)}%)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

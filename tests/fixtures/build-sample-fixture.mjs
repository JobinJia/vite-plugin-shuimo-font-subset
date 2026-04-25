// Bootstrap script: produce a small TTF fixture for subsetFont tests.
// Run once; commit the resulting sample.ttf.
//   node tests/fixtures/build-sample-fixture.mjs
//
// Source: ../../valaxy-theme-shuimo/theme/assets/fonts/yishanbeizhuanti.ttf

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import subset from 'subset-font'

const FIXTURE_CHARS = '受命于天既寿永昌墨韵书斋落梅听雪阁abcABC123'

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const sourcePath = process.argv[2]
    ?? '/Users/jiabinbin/myself/github/valaxy/valaxy-theme-shuimo/theme/assets/fonts/yishanbeizhuanti.ttf'
  const outputPath = path.join(__dirname, 'sample.ttf')

  const original = await readFile(sourcePath)
  const small = await subset(original, FIXTURE_CHARS, { targetFormat: 'truetype' })
  await writeFile(outputPath, small)
  console.warn(`✓ sample.ttf: ${original.length} → ${small.length} bytes`)
}

main()

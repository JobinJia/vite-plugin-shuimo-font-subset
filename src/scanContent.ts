import { readFile } from 'node:fs/promises'
import { globby } from 'globby'

export interface ScanContentOptions {
  cwd: string
  patterns: string[]
}

export async function scanContent(options: ScanContentOptions): Promise<Set<string>> {
  const files = await globby(options.patterns, {
    cwd: options.cwd,
    absolute: true,
  })

  const chars = new Set<string>()
  await Promise.all(files.map(async (file) => {
    const content = await readFile(file, 'utf8')
    for (const char of content) {
      const cp = char.codePointAt(0)
      if (cp === undefined)
        continue
      if (
        (cp >= 0x4E00 && cp <= 0x9FFF) // CJK Unified Ideographs
        || (cp >= 0x3400 && cp <= 0x4DBF) // CJK Extension A
        || (cp >= 0x0021 && cp <= 0x007E) // ASCII printable
      ) {
        chars.add(char)
      }
    }
  }))

  return chars
}

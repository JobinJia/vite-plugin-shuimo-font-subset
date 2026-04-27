import { readFile } from 'node:fs/promises'
import { globby } from 'globby'

export interface ScanSource {
  cwd: string
  patterns: string[]
}

export async function scanContent(sources: ScanSource[]): Promise<Set<string>> {
  const fileLists = await Promise.all(
    sources.map(src => globby(src.patterns, { cwd: src.cwd, absolute: true })),
  )
  const files = Array.from(new Set(fileLists.flat()))

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

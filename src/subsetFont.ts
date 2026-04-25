import subset from 'subset-font'

export interface SubsetFontOptions {
  fontBuffer: Buffer
  chars: Set<string>
  format: 'woff2' | 'woff' | 'truetype'
}

export async function subsetFont(options: SubsetFontOptions): Promise<Buffer> {
  const text = [...options.chars].join('')
  return await subset(options.fontBuffer, text, {
    targetFormat: options.format,
  })
}

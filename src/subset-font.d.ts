declare module 'subset-font' {
  import type { Buffer } from 'node:buffer'

  interface SubsetOptions {
    targetFormat?: 'woff2' | 'woff' | 'truetype' | 'sfnt'
    preserveNameIds?: number[]
    variationAxes?: Record<string, number | { min?: number, max?: number, default?: number }>
    noLayoutClosure?: boolean
  }

  function subset(font: Buffer, text: string, options?: SubsetOptions): Promise<Buffer>

  export default subset
}

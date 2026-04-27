import type { Plugin } from 'vite'
import type { PluginOptions, ScanSource } from './types'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import process from 'node:process'
import { scanContent } from './scanContent'
import { subsetFont } from './subsetFont'

export type { PluginOptions, ScanSource }

export default function shuimoFontSubset(options: PluginOptions): Plugin {
  let targetChars = new Set<string>()
  let resolvedRoot = process.cwd()

  return {
    name: 'shuimo-font-subset',
    apply: 'build',

    configResolved(config) {
      resolvedRoot = config.root
    },

    async buildStart() {
      const fallbackCwd = options.scanCwd ?? resolvedRoot
      const sources: { cwd: string, patterns: string[] }[]
        = isStringArray(options.scanFiles)
          ? [{ cwd: fallbackCwd, patterns: options.scanFiles }]
          : options.scanFiles.map(src => ({
              cwd: src.cwd ?? fallbackCwd,
              patterns: src.patterns,
            }))

      targetChars = await scanContent(sources)
      if (options.extraChars) {
        for (const c of options.extraChars)
          targetChars.add(c)
      }
    },

    async generateBundle(_outputOptions, bundle) {
      const targets = options.targetFonts.map(f =>
        path.isAbsolute(f) ? f : path.resolve(resolvedRoot, f),
      )
      const targetBasenames = new Set(targets.map(t => path.basename(t)))
      const format = options.format ?? 'woff2'

      // Mutate matching assets in place. Both Rollup and Rolldown accept
      // property assignment on the asset object (`asset.source = ...`); they
      // only forbid re-keying the bundle map (`bundle[newKey] = ...`).
      // Callers are responsible for ensuring the source font's filename in
      // their import already matches the desired output format — this plugin
      // only swaps bytes, not extensions.
      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset')
          continue
        const candidateName = asset.name ?? path.basename(asset.fileName)
        if (!targetBasenames.has(candidateName))
          continue

        const original = Buffer.isBuffer(asset.source)
          ? asset.source
          : Buffer.from(asset.source as Uint8Array)

        const subset = await subsetFont({
          fontBuffer: original,
          chars: targetChars,
          format,
        })

        asset.source = subset
      }
    },
  }
}

function isStringArray(value: string[] | ScanSource[]): value is string[] {
  return value.length === 0 || typeof value[0] === 'string'
}

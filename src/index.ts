import type { Plugin } from 'vite'
import type { PluginOptions } from './types'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import process from 'node:process'
import { scanContent } from './scanContent'
import { subsetFont } from './subsetFont'

export type { PluginOptions }

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
      const cwd = options.scanCwd ?? resolvedRoot
      targetChars = await scanContent({
        cwd,
        patterns: options.scanFiles,
      })
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
      const ext = format === 'truetype' ? '.ttf' : `.${format}`

      for (const [key, asset] of Object.entries(bundle)) {
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

        const newFileName = asset.fileName.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/, ext)
        delete bundle[key]
        bundle[newFileName] = {
          ...asset,
          fileName: newFileName,
          source: subset,
        }
      }
    },
  }
}

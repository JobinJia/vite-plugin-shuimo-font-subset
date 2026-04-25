# @jobinjia/vite-plugin-shuimo-font-subset

> Content-aware font subset Vite plugin — scans source files for unique characters and replaces font assets with subsetted WOFF2 at build time.

Built primarily for [valaxy-theme-shuimo](https://github.com/valaxyjs/valaxy-theme-shuimo): the theme ships the full 篆体 font (~1.2 MB) as a safe default, and this plugin lets the consuming site shrink it down to only the glyphs their content actually uses — typically 10–30 KB.

## Installation

```bash
pnpm add -D @jobinjia/vite-plugin-shuimo-font-subset
# or
npm i -D @jobinjia/vite-plugin-shuimo-font-subset
```

Peer dependency: `vite ^5 || ^6 || ^7`.

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import shuimoFontSubset from '@jobinjia/vite-plugin-shuimo-font-subset'

export default defineConfig({
  plugins: [
    shuimoFontSubset({
      targetFonts: ['src/assets/fonts/yishanbeizhuanti.woff2'],
      scanFiles: ['pages/**/*.md', 'src/**/*.{vue,ts}'],
      extraChars: '隔窗梅雪',
    }),
  ],
})
```

The plugin only runs at build (`apply: 'build'`) — `vite dev` is untouched.

## Options

| Option        | Type                                  | Default       | Description                                                                                                          |
| ------------- | ------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `targetFonts` | `string[]`                            | **required**  | Source font basenames (or absolute / root-relative paths) to replace. Matched against the asset's original filename. |
| `scanFiles`   | `string[]`                            | **required**  | Globs of files to scan for unique characters.                                                                        |
| `scanCwd`     | `string`                              | Vite `root`   | Working directory for `scanFiles` glob resolution.                                                                   |
| `format`      | `'woff2' \| 'woff' \| 'truetype'`     | `'woff2'`     | Output font format for the replaced asset.                                                                           |
| `extraChars`  | `string`                              | —             | Extra characters to always include (useful for runtime-injected strings outside scanned files).                      |

## How it works

1. **`buildStart`** — globs `scanFiles` and collects every unique codepoint in the CJK Unified Ideographs range (U+4E00–U+9FFF), CJK Extension A (U+3400–U+4DBF), and ASCII printable (U+0021–U+007E). Other ranges are intentionally excluded.
2. **`generateBundle`** — for every emitted asset whose original basename matches one of `targetFonts`, replaces its byte content with a subset built via [`subset-font`](https://github.com/papandreou/subset-font).

The plugin only swaps font bytes; it does **not** rewrite asset extensions. If you set `format: 'woff2'`, make sure your `import` already references a `.woff2` filename.

## Caveats

- The match key is the asset's **original basename** (e.g. `yishanbeizhuanti.woff2`), not the hashed output filename Vite emits.
- Characters outside the supported ranges (Hangul, kana, full-width punctuation, CJK Extensions B–G, …) are silently skipped by the scanner. Use `extraChars` to force-include anything you need.
- The source font must already contain glyphs for every character you want to keep — `subset-font` cannot synthesize missing glyphs.

## License

MIT © [jobinjia](https://github.com/JobinJia)

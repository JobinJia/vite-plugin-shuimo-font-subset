/**
 * A single scan source: a working directory plus glob patterns to evaluate
 * relative to it. `cwd` is optional — when omitted, the plugin falls back to
 * the top-level `scanCwd`, or to Vite's `config.root` if that's also unset.
 */
export interface ScanSource {
  cwd?: string
  patterns: string[]
}

export interface PluginOptions {
  /**
   * Absolute or root-relative paths of font files to subset. Bundle assets
   * whose `name` (the original file basename) matches one of these will be
   * replaced with the subsetted output.
   */
  targetFonts: string[]

  /**
   * Files to scan for unique characters. Two shapes are supported:
   *
   * - `string[]` — a single source. Patterns are resolved against `scanCwd`
   *   (or Vite's `config.root` when `scanCwd` is omitted).
   * - `ScanSource[]` — multiple independent sources, each with its own `cwd`
   *   and `patterns`. Useful when scanning files outside the user project
   *   root (e.g. a theme's own `components/**\/*.vue` plus the user site's
   *   `pages/**\/*.md`). Per-source `cwd` is optional and falls back to the
   *   top-level `scanCwd` / Vite root.
   *
   * Typical patterns: `pages/**\/*.md`, `**\/*.{vue,ts}`.
   */
  scanFiles: string[] | ScanSource[]

  /**
   * Working directory used when `scanFiles` is a `string[]`, and as the
   * fallback `cwd` for `ScanSource` entries that omit it. Defaults to Vite
   * `config.root`.
   */
  scanCwd?: string

  /**
   * Output font format for the replaced asset. Defaults to `'woff2'`.
   */
  format?: 'woff2' | 'woff' | 'truetype'

  /**
   * Extra characters to always include in the subset, regardless of whether
   * scanned files contain them. Useful for content that lives outside the
   * scanned globs (e.g. dynamic strings injected at runtime).
   */
  extraChars?: string
}

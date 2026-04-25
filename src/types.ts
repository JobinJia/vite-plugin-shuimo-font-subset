export interface PluginOptions {
  /**
   * Absolute or root-relative paths of font files to subset. Bundle assets
   * whose `name` (the original file basename) matches one of these will be
   * replaced with the subsetted output.
   */
  targetFonts: string[]

  /**
   * Glob patterns (relative to `scanCwd`) of source files to scan for unique
   * characters. Typical patterns include `pages/**\/*.md` and `**\/*.{vue,ts}`.
   */
  scanFiles: string[]

  /**
   * Working directory for `scanFiles` glob resolution. Defaults to the Vite
   * config root (typically the project root).
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

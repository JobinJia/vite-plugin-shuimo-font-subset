import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  // dts is emitted by `tsc -p tsconfig.build.json` instead — tsup's bundled
  // rollup-plugin-dts cannot load the TypeScript 7 (native) compiler API.
  dts: false,
  clean: true,
  splitting: false,
})

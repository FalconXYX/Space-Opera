/**
 * Runs a .mjs tool that imports TypeScript from src/.
 *
 * Node can strip types but will not resolve extensionless imports, so the tool is bundled
 * through esbuild (already present via Vite) first. astronomy-engine stays external so it
 * resolves from node_modules at runtime.
 */
import { build } from 'esbuild'
import { rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const entry = process.argv[2]
if (!entry) { console.error('usage: node tools/run.mjs <tool.mjs>'); process.exit(1) }

// fileURLToPath, not URL.pathname: this project's directory contains a space, and
// pathname hands back a percent-encoded string that esbuild would treat literally.
const out = fileURLToPath(new URL('../.tool-bundle.mjs', import.meta.url))
await build({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'esm',
  external: ['astronomy-engine'], outfile: out, logLevel: 'error',
})
try {
  await import(pathToFileURL(out).href)
} finally {
  await rm(out, { force: true })
}

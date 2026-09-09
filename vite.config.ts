import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * On Pages the site lives at /Space-Opera/, not at the domain root, so every asset URL has to
 * carry that prefix — but only there. Locally the dev server stays at / so the path in the
 * browser matches the one in the source.
 */
const base = process.env.PAGES_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
})

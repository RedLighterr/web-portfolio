import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev'de /api/ backend'e proxy'lenir → tarayıcı için prod'daki gibi tek origin (nginx /api/ proxy'si), backend'de
// CORS gerekmez. Yerelde `npm run dev`: localhost:5247; dev container'da compose `VITE_API_PROXY_TARGET` verir.
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:5247'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Küçük dosyalar (logo SVG'leri vb.) `data:` URI olarak gömülmesin: CSP `img-src 'self'` data:'yı engeller (nginx.conf).
    assetsInlineLimit: 0,
  },
  server: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})

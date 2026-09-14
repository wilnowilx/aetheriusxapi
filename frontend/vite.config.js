import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // PAGES_BASE overrides deploy subpath: main site vs staging mirror.
  //   production: npm run build                      -> /aetheriusxapi/
  //   staging:    PAGES_BASE=/aetheriusxapi-staging/ npm run build -> mirror
  base: process.env.PAGES_BASE || '/aetheriusxapi/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          gsap: ['gsap']
        }
      }
    }
  },
  server: {
    proxy: {
      '/aetherapi': {
        target: 'https://34-156-149-38.sslip.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/aetherapi/, '/aetherapi')
      }
    }
  }
})

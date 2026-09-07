import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/aetheriusxapi/',
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

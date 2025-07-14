import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        overlay: 'overlay.html'
      }
    },
    outDir: 'dist',
    assetsDir: 'assets',
    // 모델 파일들이 빌드 시 올바르게 복사되도록 설정
    copyPublicDir: true,
    // 큰 파일들도 올바르게 처리
    chunkSizeWarningLimit: 1000
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gemini/, '')
      }
    }
  }
})

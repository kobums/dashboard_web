import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 로컬 개발: dashboard_go(8010) 로 API 프록시
      '/api': 'http://localhost:8010',
    },
  },
})

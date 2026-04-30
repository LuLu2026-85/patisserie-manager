import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // WSL 挂载 Windows 盘 (/mnt/c/) 时 inotify 不工作,改用轮询监视文件变化
    watch: { usePolling: true, interval: 500 },
  },
})

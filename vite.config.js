import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // PWA: 让 app 可"安装到主屏",首次加载后 Service Worker 把全部文件缓存到设备,
    // 之后离线/国内免梯子也能打开(本 app 纯客户端,数据全在本地,无需联网)。
    VitePWA({
      strategies: 'injectManifest',  // 用手写的极简原生 SW(src/sw.js),不加载 workbox 运行时
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',   // 联网时自动更新,离线时用缓存,不弹窗打扰
      includeAssets: ['favicon.svg'],
      pwaAssets: {
        image: 'public/logo.svg',   // 从这张源图生成 192/512/maskable/apple-touch 等图标
      },
      manifest: {
        name: 'RURU 配方管理',
        short_name: '配方',
        description: 'RURU Patisserie 配方 / 材料 / 库存管理(纯本地,离线可用)',
        lang: 'zh-CN',
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        scope: '/',
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],  // 注入到 src/sw.js 的预缓存清单
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,  // 主包约 666KB,留余量
      },
    }),
  ],
  server: {
    // WSL 挂载 Windows 盘 (/mnt/c/) 时 inotify 不工作,改用轮询监视文件变化
    watch: { usePolling: true, interval: 500 },
  },
})

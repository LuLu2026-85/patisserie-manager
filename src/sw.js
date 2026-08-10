// 极简原生 Service Worker(不依赖 workbox 运行时)
// 目标:首次加载后把整个 app 壳缓存到设备,之后离线 / 国内免梯子也能打开。
// 本 app 纯客户端,数据全在 localStorage + IndexedDB,SW 只负责把静态文件离线化。

// vite-plugin-pwa(injectManifest)会在构建时把预缓存清单注入到这里:
const MANIFEST = self.__WB_MANIFEST || [];
const CACHE = 'patisserie-shell-v1';

// 预缓存清单 → 绝对路径列表(再补上根路径 '/' 兜底导航)
const ASSETS = Array.from(new Set([
  '/',
  ...MANIFEST.map((e) => (typeof e === 'string' ? e : e && e.url)).filter(Boolean),
]));

// 安装:把 app 壳全部抓进缓存
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // 逐个缓存而非 addAll(全有或全无):个别文件失败不拖垮整体离线能力
      // cache:'reload' 确保抓到的是网络最新版,不走 HTTP 缓存
      await Promise.all(
        ASSETS.map(async (u) => {
          try {
            await cache.add(new Request(u, { cache: 'reload' }));
          } catch (e) {
            // 单个资源抓取失败(如临时 404)忽略,不影响其余预缓存
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

// 激活:删掉旧版本缓存,立即接管所有页面
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// 自检:页面可发 'cache-status' 消息,SW 从自己的上下文回报缓存条数(用于验证离线就绪)
self.addEventListener('message', (event) => {
  if (event.data === 'cache-status') {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE);
        const keys = await cache.keys();
        const reply = { type: 'cache-status', cache: CACHE, count: keys.length, paths: keys.map((r) => new URL(r.url).pathname) };
        if (event.source) event.source.postMessage(reply);
        for (const client of await self.clients.matchAll()) client.postMessage(reply);
      })()
    );
  }
});

// 取用:cache-first(命中缓存就用,没有再联网);导航请求离线时回退到 app 壳
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        // 同源里真实存在的独立页面(如 /layout.html 厨房布局台)要按自己的路径取,
        // 不能套用 SPA 的 index.html 兜底 —— 否则会被配方 app 的壳「吃掉」。
        const url = new URL(req.url);
        if (url.origin === self.location.origin && url.pathname.endsWith('.html')) {
          const page = await caches.match(url.pathname);
          if (page) return page;
          try {
            return await fetch(req);
          } catch {
            // 离线且没缓存过这一页 → 落到下面的 app 壳兜底
          }
        }
        const shell = (await caches.match('/index.html')) || (await caches.match('/'));
        if (shell) return shell;
        try {
          return await fetch(req);
        } catch {
          return new Response('离线:应用壳未缓存', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        return await fetch(req);
      } catch {
        return Response.error();
      }
    })()
  );
});

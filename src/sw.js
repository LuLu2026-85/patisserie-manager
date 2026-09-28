// 极简原生 Service Worker(不依赖 workbox 运行时)
// 目标:首次加载后把整个 app 壳缓存到设备,之后离线 / 国内免梯子也能打开。
// 本 app 纯客户端,数据全在 localStorage + IndexedDB,SW 只负责把静态文件离线化。
//
// 2026-09-29 体检修(两处):
// 1. 以前所有版本共用一个缓存名,新版文件直接写进正在用的缓存,单个文件下载失败被吞掉照样启用。
//    更新时梯子抖一下 → 新首页进了缓存、新主程序没进 → 之后国内不开梯子打开就白屏。
//    现在每个版本一个缓存(名字带版本号);首页和主程序必须全部下载成功才启用新版,失败就继续用旧版。
// 2. 以前每次更新都重新下载全部约 8.7 MB(主要是字体)。现在记下每个文件的版本号(构建时算的内容哈希),
//    没变的文件从旧缓存直接拷过来。

// vite-plugin-pwa(injectManifest)会在构建时把预缓存清单注入到这里:[{ url, revision }]
const MANIFEST = self.__WB_MANIFEST || [];
const PREFIX = 'patisserie-shell-';
const norm = (u) => '/' + String(u).replace(/^\.?\//, '');
const ENTRIES = MANIFEST
  .map((e) => (typeof e === 'string' ? { url: norm(e), revision: '' } : (e && e.url ? { url: norm(e.url), revision: e.revision || '' } : null)))
  .filter(Boolean);
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const CACHE = PREFIX + hash(ENTRIES.map((e) => e.url + '@' + e.revision).join('|'));
const REV_KEY = '/__sw-revisions.json';
// 关键文件:少一个就打不开 app
const isCritical = (u) => u === '/index.html' || /^\/assets\/index-[^/]+\.(js|css)$/.test(u);

// 安装:把 app 壳抓进这一版自己的缓存
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // 旧版本记下的「文件 → 版本号」:版本号没变的文件直接从旧缓存拷,不重下
      const oldRevs = new Map();
      for (const name of await caches.keys()) {
        if (!name.startsWith(PREFIX) || name === CACHE) continue;
        try {
          const r = await (await caches.open(name)).match(REV_KEY);
          if (!r) continue;
          const map = await r.json();
          for (const [u, rev] of Object.entries(map)) if (!oldRevs.has(u)) oldRevs.set(u, { rev, name });
        } catch (e) { /* 旧记录读不出就当没有 */ }
      }
      const tryReuse = async (e) => {
        const o = oldRevs.get(e.url);
        if (!o || !e.revision || o.rev !== e.revision) return false;
        const res = await (await caches.open(o.name)).match(e.url);
        if (!res) return false;
        await cache.put(e.url, res);
        return true;
      };
      // cache:'reload' 确保抓到的是网络最新版,不走 HTTP 缓存;非 2xx 当失败
      const fetchInto = async (u) => {
        const res = await fetch(new Request(u, { cache: 'reload' }));
        if (!res.ok) throw new Error(u + ' ' + res.status);
        await cache.put(u, res);
      };

      // 关键文件全有或全无:任何一个失败就抛出 → 这一版不启用,旧版和旧缓存原封不动
      const fresh = new Set();   // 这一版真正拿到新版本的文件
      const critical = ['/', ...ENTRIES.filter((e) => isCritical(e.url)).map((e) => e.url)];
      for (const u of critical) {
        const e = ENTRIES.find((x) => x.url === u);
        if (!(e && (await tryReuse(e)))) await fetchInto(u);
        fresh.add(u);
      }
      // 其余文件尽力而为:下载失败就先把旧版本的副本放进来顶着(旧缓存这时还没删),
      // 不然激活时旧缓存被整个删掉,字体表 / 厨房布局台离线就没了(审查发现)
      await Promise.all(
        ENTRIES.filter((e) => !isCritical(e.url)).map(async (e) => {
          try {
            if (!(await tryReuse(e))) await fetchInto(e.url);
            fresh.add(e.url);
          } catch (err) {
            try { const stale = await caches.match(e.url); if (stale) await cache.put(e.url, stale); } catch (err2) { /* 忽略 */ }
          }
        })
      );
      // 只记真正拿到新版本的文件;拿旧副本顶着的不记,下次更新会重下
      const have = {};
      for (const e of ENTRIES) if (fresh.has(e.url)) have[e.url] = e.revision;
      await cache.put(REV_KEY, new Response(JSON.stringify(have), { headers: { 'Content-Type': 'application/json' } }));
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

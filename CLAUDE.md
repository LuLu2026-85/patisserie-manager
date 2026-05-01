# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 沟通语言

默认用**中文**回复用户，除非用户另行说明。代码注释和 commit message 保留原文（项目内中日文混用是常态）。

## 沟通约定(User: LuLu)

LuLu 是产品负责人,不是程序员,英文技术术语不熟。所有对话遵守以下规则。

### 回复语气
- 全部用中文。代码、报错、包名可以保留英文,但解释用中文。
- 不使用用户没见过的英文缩写。遇到必要术语(如 MCP、Git、HMR),第一次出现时用括号一句话解释。
- 给用户看代码改动(diff)前,先用中文一句话概括"改了什么、为什么"。

### 回答风格
- 用户问问题,有答案就直接答,不要反问一堆。
- 真的需要用户决策时,最多给 3 个选项,每个用一句中文说清含义和推荐度。

### 要不要问用户(风险分级)
- **低风险,不用问**:读文件、改项目内代码、跑 settings.json 白名单里的命令(`npm run dev/build/lint`、git 只读等)。
- **中风险,必须问**:装新包、改配置文件、改环境变量、启新的后台进程。
- **高风险,必须问 + 说明如何恢复**:推送到远程仓库、删文件、清数据、动生产数据、访问外网新地址。

### 问用户的标准模板
不要直接弹英文原生的 `Allow Bash(...)` 那种。中文讲清楚:

- 要做的事:xxx(大白话)
- 会影响:改哪个文件 / 装什么 / 是否联网
- 风险等级:低 / 中 / 高
- 推荐:允许 / 拒绝 / 你来定

多步连续操作一次讲完:
> 接下来要做 3 件事:①xxx ②yyy ③zzz。整体风险:中。一起允许吗?

### 遇到疑似危险指令
如果用户的指令听起来可能造成不可逆损失(删旧代码、清数据、删分支等),先暂停反问:
> "你确定要这么做吗?我理解你的意思是 xxx,这会导致 yyy,确认吗?"

### 图片引用约定
LuLu 发的图片统一放在 `/mnt/c/Users/11508/Desktop/claude图片/` 目录下。
- 当 LuLu 说"看下图 X"或"看图 X.png"时,自动理解为该目录下的文件,直接 `Read /mnt/c/Users/11508/Desktop/claude图片/X.png` (或 .jpg / .jpeg / .webp 等),不要反问"图在哪"。
- 用户复制粘贴图片时,Claude Code CLI 会把文件保存到桌面并把路径插入对话框 — 直接用那个路径 Read 即可,不必移动到上述目录。

## Bug 修复授权模板(2026-04-29 立)

LuLu 报 bug 时,默认进入"自主诊断 + 小改修复"模式,不走关口 A/B/C 流程。

### 你有权(无需额外审批)
- 用 Chrome MCP 自主跑诊断:evaluate_script、查 DOM、跑 React fiber 内省、看 IndexedDB 状态
- 在受影响文件改 ≤ 5 行代码修这个 bug
- 改完用 Chrome MCP 自己跑一次自验证(确认 bug 真修了)

### 你无权(必须停下报告)
- 改超过 5 行 → 停
- 动其他文件(超出当前 bug 涉及范围) → 停
- 动主数据(my_data_export.json) → 停
- 引入新依赖 / 重构现有代码 → 停
- 怀疑根因在"严禁触碰"清单的成熟代码里(useImageSrc / putImageBlob / Btn 组件等) → 停
- 自验证后仍不工作 → 停

→ 触发任何"停"条件,回退到正常关口流程让 LuLu 介入。

### 一次性报告格式
全部诊断 + 修复 + 自验证完成后,**一次性**报告:
1. 诊断步骤 + 关键证据(DOM 状态 / Console 输出 / fiber 内省结果)
2. 根因
3. 改了什么(行号 + diff,1-3 行)
4. Chrome MCP 自验证结果
5. 主数据 md5(应仍是当前锚点)
6. LuLu 需要做什么(通常就一步:刷新 + 真机点一次确认)

### 4 铁律仍生效
本授权**不覆盖**4 铁律。任何"超范围 / 主数据写入 / 架构决策 / 意外失败"仍要立刻停下报告。
本授权只是把"小 bug 诊断+修复"这条路径从"5 回合人肉桥接"压成"1 回合自主完成 + 1 次人肉真机验"。

### 不适用场景(仍走关口流程)
- 新功能开发
- 架构重构
- 影响多文件的连锁改动
- 牵扯产品决策的 bug(比如"这个行为算 bug 还是设计")
- 改完仍不修(自验证失败)

## Commands

- `npm run dev` — Vite dev server (hot reload, default port 5173)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally

There is no linter, type-checker, or test suite configured. Verification happens by running `npm run dev` and exercising the feature in the browser.

## Project shape

Single-page React 18 + Vite 5 app, pure client-side. All persistence is `localStorage` under the key `patisserie_v4`. No backend, no routing library, no CSS framework — styles are inline.

**The entire application lives in `src/App.jsx` (~14366 lines).** `src/main.jsx` only mounts it. Prefer editing this one file; do not split it into modules unless the user explicitly asks for a refactor.

## Data model — 13 top-level entities

All saved together as a single JSON blob. See `.claude/manual.md §2` for the full bilingual schema and reference graph; this is just the orientation list.

**Core 5 (legacy)**:
- `recipes` — standalone recipes (e.g. seeded `FINANCIER`). Ingredients carry a `group` field (`bowl1`..`bowl5`, `none`) that drives the grouped-ingredient layout.
- `components` — reusable parts (biscuit, mousse, jelly, glaze, etc.) used inside `creations`. Seeded with `AGREABLE_MOUSSE`.
- `creations` — "组合蛋糕" layered cakes that reference `components` as layers.
- `knowledge` — knowledge base entries with `tags` and a `relatedRecipes` free-text name array (substring match, not id).
- `cats` — **deprecated** old price table; UI hidden but kept for compat.

**Materials encyclopedia (IP asset)**:
- `brands` — manufacturer dim (origin / founded year / story / image).
- `materials` — branded SKU products with `priceRange.mid` reference price.

**Shop ops (private — stripped from IP package)**:
- `shopMaterials` — actual purchase records with `pricePerG` real cost; **stripped on `exportPublicIP`**.
- `suppliers` — vendor + delivery days + closure windows.
- `products` — sellable units; `items[].linkedType: "recipe" | "creation" | "component"` (multi-link gift box).
- `salesLog` / `productionLog` — daily upsert by `productId`.
- `productFamilies` — recipe groupings sharing mold / temp / time.

Plus 2 configs: `printSettings` (logo / brand name) and `customCompCats` (user-defined component categories).

`FINANCIER`, `AGREABLE_MOUSSE`, `DEFAULT_KNOWLEDGE`, and `DEFAULT_CATS` are bundled as seed data. On load, `mergeWithDefaults(userItems, defaultItems)` folds in any default whose `id` is missing from the user's data — user edits are never overwritten. Keep this contract when adding new seed items: give them stable string/number ids so they stay dedupable.

Storage key is frozen at `patisserie_v4` for backward compatibility, but the payload's internal `version` field is currently `15`. Bump the payload `version` when adding fields; do not rename the storage key.

Auto-save: a single `useEffect` in `App()` writes the full blob on every state change and flashes "✓ 已保存" for 2s.

## Bilingual / trilingual content

Almost every user-facing string has paired fields: `nameZh`/`nameJa`/`nameFr`, `titleZh`/`titleJa`, `contentZh`/`contentJa`, `stepsZh`/`stepsJa`, `notesZh`/`notesJa`. The top-level `lang` state (`"zh" | "ja"`) toggles which one is shown via `LangToggle`. When you add new content fields, follow the same suffix pattern so the toggle works.

## Tabs and view state

The top-level `tab` state switches between `list` (recipes), `view`, `edit`, `materials`, `components`, `creations`, `knowledge`, `data`. Each major section has its own `*ViewId` (read) and `*EditTarget` (edit, `null` = new) pair. Navigation between sections (e.g. a knowledge entry linking to the recipe it relates to) is driven by the `onNavigate` callback that sets both the target id and the tab.

## Shared primitives and conventions

- `Btn`, `Badge`, `GroupPill`, `LangToggle` — use these instead of re-rolling styled buttons.
- `ConfirmDialog` + the `confirmDialog(message, onConfirm, opts?)` helper in `App()` replaces `window.confirm`. **Never use `window.confirm` or `window.alert`** — they don't render reliably in embedded / webview environments this app targets. Use `confirmDialog` for destructive prompts and `showToast` for transient success/failure messages.
- Color scheme is forced light (`colorScheme: "light"` on the root) because the app is deployed into surfaces where OS dark mode would otherwise break the inline colors. Keep this in mind when picking colors.
- Group colors (`GROUPS`) use a transparent background with a colored left border + pill border so they render identically in light and dark embeds.

## RURU_*.json files at repo root

These are user-authored import packages (recipes, components, knowledge, materials encyclopedias) consumed via the "数据" → 导入 flow. They are data, not code — don't reformat or edit them unless the user asks. The full export shape includes `recipes`, `cats`, `components`, `creations`, `knowledge`, `exportedAt`, `version`; partial packages with just one or two of those keys are also valid imports.

## README

The user-facing README is Chinese-only and describes the product, not the code:
- bilingual recipe management, component warehouse, layered cakes, knowledge base, materials, import/export
- data saved in the browser locally (no server)

## Chrome DevTools MCP 调试环境

- 调试 Chrome 启动命令（在 Windows CMD 里）：
  `"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --user-data-dir="C:\temp\chrome-debug"`
- WSL 里 chrome-devtools MCP 通过 `http://172.24.64.1:9223` 连接（netsh portproxy 9223→127.0.0.1:9222）
- WSL 网关 IP 偶尔会变。如果连不上先在 WSL 跑 `ip route show | grep default | awk '{print $3}'` 确认
- Chrome 必须先开着再启动 Claude Code，否则 MCP 握手可能失败
- 调试 Chrome 里的 localStorage 专属这个用户目录（`C:\temp\chrome-debug`），和主力 Chrome 完全隔离

## Claude Code 端 + React 端 双脚本架构（P1 / P3 同源）

项目里有两种"Claude Code 端 + React 端协作"的工作流（与"普通的 React 应用内闭环"不同）：

| 工作流 | Claude Code 端 | React 端 | 数据交换 |
|---|---|---|---|
| **P1 一键补图（v14, 28 号晚完工）** | `.claude/scripts/orderie_image_fetcher.cjs`（**真 Node 脚本**）抓 orderie.jp 图到 `/tmp/orderie_cache/` + 写 manifest.json | 数据 Tab "📷 orderie 一键补图工具" → `<input webkitdirectory>` 让 LuLu 选 cache 文件夹 → handler 读 manifest + 文件 → blob → `putImageBlob` 入 IndexedDB | 文件夹 manifest.json + .jpg |
| **P3 自动找图（v15, 29 号完工）** | `.claude/scripts/p3_crawl_v2.js`（**Chrome MCP 协议参考代码，不是 Node 脚本**）— Claude Code 通过 `mcp__chrome-devtools__navigate_page + evaluate_script` 调度浏览器跑乐天/亚马逊 SERP 抓 | 数据 Tab "📤 导出 P3 待爬清单" / "📥 导入 P3 候选" / "📂 恢复未完成 P3 批次"（详见 manual.md §11） | 双向：React 出 eligible JSON → CC 出 batch manifest.json |

**关键差异**：P3 因为 dev server 内 `fetch` 跨域被 CORS 拦死（详见 progress.md "P3 完工" 段教训 1），不能像 P1 那样用 Node 脚本直接 fetch；改走 Chrome MCP navigate + evaluate_script，让浏览器自身跑。

**未来在项目里加新爬图 / 抓数据功能时**：先想清楚是 P1 模式（Node 进程能直接 fetch）还是 P3 模式（CORS 拦 → 必须走 Chrome MCP）。**关口 A 设计阶段必须实测可行性**（不只测"今天能抓"，还要测"未来 1-3 个月持续能抓"+ 选择器稳定性 + 进程边界）。

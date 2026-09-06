# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🏢 我是 LuLu 甜品店事业的「子项目 A · 店铺管理软件」

**新 Claude 接手前必读**: `C:\Users\11508\Desktop\05_工作店铺\_LULU_甜品店事业_HUB.md` — 业务总览 + 子项目分工 + 跨项目桥
**业务术语遇到陌生词** → `C:\Users\11508\Desktop\05_工作店铺\_LULU_甜品店事业_GLOSSARY.md`

**姊妹项目**: **子项目 B · 找店面**(物件爬虫 + 周报 + 走街决策)在 `C:\Users\11508\Desktop\05_工作店铺\店铺创业_2026-05\`(2026-06-04 已从桌面顶层并入 05_工作店铺),入口 `_HANDOFF_新窗口必读.md`。

**判断现在该开哪个**:
- 配方 / 试作 / 材料百科 / 销售記録 / 录入 / 主数据(my_data_export.json) → **当前项目(A)**
- 物件 / 走街 / 内見 / 周报 / 街区 / 鮮度 / 居抜き → **切去店铺创业(B)**
- 业务整体 / 跨项目讨论 → 先读 Hub

**💰 记账铁律(2026-08-26 立,所有窗口生效)**:对话中只要出现"钱动了"(LuLu 说付了/交了定金/签了合同应付),**不管当时在聊什么,立即追加一行到 `C:\Users\11508\Desktop\05_工作店铺\798_总账_2026.md`**,分类九选一(设备/装修/房租押金/材料/运营/咖啡/小道具/证照中介/其他)。报价和估价不记。LuLu 说"记账:xxx"=直接记;"拉总账"=按分类汇总对预算。规则详情在总账文件头部。

**⚠️ `.claude/notes/` 存的是业务级文档,不是软件文档**。LuLu 常在这个 cwd 里聊开店筹备这类跟代码无关的事,产出就近落在这里 —— 已有 20 多份,覆盖开业总计划、798 装修报批攻略、设备采购总档、厨房设计条件表、招聘计划与面试指南、**商标注册**、**MJ 产品图路线与合规**、回国带料清单、经营模型基准数据、选址决策(历史存档)等。
- **别把这些当项目文档去维护或重构**,它们的权威索引在 Hub 的「🧭 当前主线」。
- 但**该更新时要更新** —— 比如设备又成交了一台,要写回 `.claude/notes/设备采购总档_*.md`,不能只在对话里说完就算。
- 软件本身的文档是 `manual.md` / `progress.md` / `schema_full.md` / `handoff_*.md`,和 notes/ 不是一回事。

---

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

Single-page React 18 + Vite 5 app, pure client-side. All persistence is `localStorage` under the key `patisserie_v4`. No backend, no routing library, no CSS framework.

**The entire application lives in `src/App.jsx` (~15000 lines).** `src/main.jsx` only mounts it. Prefer editing this one file; do not split it into modules unless the user explicitly asks for a refactor.

## 设计系统 · kororā「1a 美術館」(2026-07-25 改版)

UI 按 Claude Design 的交付稿整体重做过。**改版式之前先回设计稿对,别在代码里凭感觉改** ——
权威源是 Claude Design 项目 `c9a4346a-2bf2-4508-9643-22a6a6cc1c6e` 的 `kororā 配方页改版.dc.html`
(用 `DesignSync` 的 `get_file` 读)。里面 §2a 是 token 全表,§2b 手机端,§2c A4 打印稿。

三条落地约定:

1. **`T` 是唯一色板/字体/间距来源**(`src/App.jsx` 顶部,~1600 处点号引用,从不解构)。
 旧 key 名全部保留、只换过值,所以改 `T` 一处 = 10 个 tab 一起变。新增了 `T.fs`(11 级字号阶梯)、
 `T.sp`(4px 网格 12 档)、`T.sh`(只给浮层的两个阴影)、`T.z`(zIndex 常量表)、`T.num`(tabular-nums)。
2. **样式仍以 inline 为主,但伪类/媒体查询/@page 一律放 `GLOBAL_CSS`**(`src/App.jsx` 里的一个模块常量,
 在 App 根和 PasswordGate 各注入一次)。hover / focus-visible / disabled / ::placeholder / 三个断点 /
 打印规范都在那里,用 `.k-*` `.rc-*` 语义 class 挂到元素上。**不要再往 inline style 里塞 transition 以外的交互态。**
3. **字体自托管在 `public/fonts/`**(Jost + Zen Kaku Gothic New + Noto Sans SC,共 346 个 woff2,约 7MB)。
 走 `public/fonts/fonts.css`,由 `index.html` 引入,不碰 Google CDN(国内打不开)。
 中日文字体按语言切换:App 往 `<html>` 写 `data-lang`,`GLOBAL_CSS` 里的 `--k-cjk` 变量据此切栈。
 **PWA 预缓存因此涨到约 8.3MB / 362 项。**

### 状态与反馈(设计稿 §09)

已有共享原语,新写页面直接复用,别再手搓:
- `EmptyState` — 两型。`variant="first"` 首次为空(给下一步动作);`variant="filter"` 筛选无结果
 (把生效条件做成可摘的 chip + 清除全部,**不给「新建」按钮**)。两者必须长得不一样。
- `InlineError` — 局部错误就地长在出错的那块旁边,不弹全局提示;必须说清「哪几项」和「怎么修」。
- `showToast(msg, { undo })` — 左下角队列,最多 3 条,5 秒消失,hover 暂停计时。
 **破坏性操作默认「先做 + 给撤销」,不拦确认框。**
- `confirmDialog(msg, onConfirm, { title, kicker, refs })` — 只在「不可撤销 + 影响到别的数据」时才用,
 且**必须把受影响的引用方列进 `refs`**。Esc 关闭,默认焦点在取消。
- `SaveStatus` — 自动保存三态。数据只在浏览器本地,所以「已保存」必须显式带时间。

骨架屏刻意没做:数据来自 localStorage,同步就到,设计稿自己写了 200ms 内出内容就不显示骨架。

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
  `categoryId` 是**可选的主分类**(空 = 全品类 / 综合渠道,如淘宝、进口商;v17.2, 2026-09-06)。**分类→厂家浏览、首页「N 家厂商」计数、
  厂家下拉,全部按「厂家名下材料所在的分类」推导,不按这个字段** —— 主数据 469 家里 73 家的材料本来就跨分类。显示用 `getBrandCat(b)`,
  空分类给「🏪 全品类」外观,别掉进 `getMaterialCat` 的「其他」兜底。
- `materials` — branded SKU products with `priceRange.mid` reference price.
  ⚠️ 价格存了两处(`pricePerG` + `priceRange.mid`),改价必须一起写,见下面「💱 币种与单价口径」。

**Shop ops (private — stripped from IP package)**:
- `shopMaterials` — actual purchase records with `pricePerG` real cost; **stripped on `exportPublicIP`**.
- `suppliers` — vendor + delivery days + closure windows.
- `products` — sellable units; `items[].linkedType: "recipe" | "creation" | "component"` (multi-link gift box).
- `salesLog` / `productionLog` — daily upsert by `productId`.
- `productFamilies` — recipe groupings sharing mold / temp / time.

Plus 3 configs: `printSettings` (logo / brand name)、`customCompCats` (user-defined component categories)、
`appSettings`(v17 新增,装日元汇率 `fxJpyToCny` 和价格显示口径 `displayCurrency`)。

## 💱 币种与单价口径 (v17, 2026-08-31)

店从东京改到北京 798 之后,材料库出现两种钱。**动任何跟价格有关的代码前先读这一节。**

1. **没有 `currency` 字段 = 日元。** 老数据实测 100% 是日元报价(1802 条材料 / 24 条本店原料 /
   52 条手写单价,最低 0.15 ¥/g,没有一条低到人民币量级)。所以**故意不写迁移函数** ——
   缺省即 JPY,老数据一个字节都没动。新建的材料 / 本店原料 / 配料行显式写 `currency: "CNY"`。
   判定统一走 `curOf(o)`,别自己写 `o.currency === ...`。
   **构造 shopMaterials / 给配料行绑材料的地方有 10 处(grep `materialId:`),给对象加任何按条走的字段都要全带** ——
   2026-09-04 加 currency 只改了 picker 那 1 处,漏了 9 处,LuLu 三天后撞上「百科改人民币,添加到本店变日元」。
2. **存储永远是「每克价」(`pricePerG`),只有显示和输入是「每 100g」。** 人民币下 ¥/g 全是
   0.008 这种读不动的小数。换算只在 UI 边界发生:显示走 `fmtUnitPrice`,输入走
   `PackPriceFields` 里 `editPrice("g", 100)` 的除法。**别把 /100g 写进任何存储字段。**
3. **成本链只有一个折算出口:`getMaterialEffectivePrice` 返回的已经是人民币/g。**
   18 个下游调用点(配方 / 组件 / 商品毛利)因此不需要知道币种。要拿原币种原值显示,
   用 `getMaterialRawPrice(m)` → `{ price, currency, source }`。
   手写单价和 `ing.cost` 快照同样按 `curOf(ing)` 折(`getIngUnitPrice` / `getIngLiveCost`)。
   **编辑态的 `totalCost` 也折**(3 处),否则混币种会把日元和人民币直接相加。
4. **人民币写 `¥`、日元写 `円`** —— 两个符号刻意不同,LuLu 扫一眼列表就知道哪条还是日本
   老数据、该换国内货源。折算出来的数标 `≈`,且是否标 `≈` 要看**实际取用的那条**的币种
   (本店价人民币 + 百科价日元时取的是本店价,那就不是约数)。
5. 汇率在 `appSettings.fxJpyToCny`(1 日元 = 多少人民币,默认 0.048),数据 tab 的
   `FxSettingCard` 按「100 日元 = ? 元」录入。改了要通过 `setFxForLookup` 注入全局。
6. **售价也有币种:`priceCurrency`(`recipes.price` / `creations.price` / `products.sellPrice`)。**
   同样缺省日元 —— 老配方那个 `450` 是东京时期的 450 円。**算利润率前必须先折**
   (`toCNY(r.price, priceCurOf(r))`),否则成本折了、售价没折,费南雪会从 80.6% 虚高到 99.1%。
   显示走 `fmtSellPrice`。新建的配方 / 组合蛋糕 / 商品默认 `priceCurrency: "CNY"`。

### 显示口径开关 (v17.1, 2026-09-01)

`appSettings.displayCurrency` 决定**看到的**是哪种钱,**只影响显示,不影响存储**:

- `"CNY"`(默认)—— 日元价按汇率折算显示并标 `≈`(`450円` → `≈¥19.35`)。LuLu 平时看人民币。
- `"raw"` —— 各按原币种显示。核对日本报价单时切过去。

实现集中在 `fmtUnitPrice` / `fmtSellPrice` / `fmtTotalPrice` 三个 helper 读模块级 `_displayCur`,
所以**所有调用点自动跟随,不用逐个改**。`opts.raw` 给编辑器里的对照值兜底(输入框旁边的
参考价要和输入框同口径)。**录入框永远是原币种** —— 折算值和输入框混在一起会把用户填的数改掉。
**成本 / 利润率不受这个开关影响**:配方里可能混币种,必须统一人民币才加得起来。

### ⚠️ 价格有两个字段,必须一起写

`materials` 里价格存了两处,是 v11 迁移(`pricePerG` → `priceRange.mid`)留下的:

- 编辑器 (`MaterialEditForm`) 改的是 **`pricePerG`**
- 但**成本链 `getMaterialEffectivePrice` 和「添加为本店原料」读的是 `priceRange.mid`**

**只写一个 = 改了价不生效**(2026-09-01 实际踩到:LuLu 在百科改价,添加到本店原料时被改回旧价,
而且配方成本一直用的也是旧价)。`MaterialEditForm.handleSave` 现在保存时一并写 `priceRange.mid`,
**价变了才更新 `asOf`**。任何批量改材料价的脚本也必须同时写这两个字段。

主数据实测 1802 条两字段全一致,所以没做历史迁移 —— 但**在 app 里手改过价、又没重新保存的条目会不一致**。

### 渲染期注入,不要用 useEffect

`setFxForLookup` / `setDisplayCurForLookup` / `setShopMaterialsForLookup` 这三个注入模块级变量的
setter,**在 App 函数体里直接调用,不放 `useEffect`**。effect 在渲染之后跑,改完汇率 / 口径 / 本店价
的这一帧,列表和成本还会用旧值算,要等下次状态变化才更新。三个 setter 都幂等、不动 React 状态,
渲染期调用是安全的。

**LuLu 的方向是一点点把百科换成国内货源**,日元数据是待替换的存量,不是要长期维护的东西。

`FINANCIER`, `AGREABLE_MOUSSE`, `DEFAULT_KNOWLEDGE`, and `DEFAULT_CATS` are bundled as seed data. On load, `mergeWithDefaults(userItems, defaultItems)` folds in any default whose `id` is missing from the user's data — user edits are never overwritten. Keep this contract when adding new seed items: give them stable string/number ids so they stay dedupable.

Storage key is frozen at `patisserie_v4` for backward compatibility, but the payload's internal `version` field is currently `17`. Bump the payload `version` when adding fields; do not rename the storage key.

Auto-save: a single `useEffect` in `App()` writes the full blob on every state change and flashes "✓ 已保存" for 2s.

## Bilingual / trilingual content

Almost every user-facing string has paired fields: `nameZh`/`nameJa`/`nameFr`, `titleZh`/`titleJa`, `contentZh`/`contentJa`, `stepsZh`/`stepsJa`, `notesZh`/`notesJa`. The top-level `lang` state (`"zh" | "ja"`) toggles which one is shown via `LangToggle`. When you add new content fields, follow the same suffix pattern so the toggle works.

## Tabs and view state

The top-level `tab` state switches between `list` (recipes), `view`, `edit`, `materials`, `components`, `creations`, `knowledge`, `data`. Each major section has its own `*ViewId` (read) and `*EditTarget` (edit, `null` = new) pair. Navigation between sections (e.g. a knowledge entry linking to the recipe it relates to) is driven by the `onNavigate` callback that sets both the target id and the tab.

## Shared primitives and conventions

- `Btn`, `GroupPill`, `LangToggle`, `Wordmark` — use these instead of re-rolling styled buttons.
 `Btn` 有 5 个 variant(default/primary/ghost/danger/success)和 3 档尺寸(sm 28 / md 32 / lg 44,lg 给手机和主 CTA)。
 `Badge` 已删除(0 调用的死代码)。`Wordmark` 是 kororā 字标,自绘字标定稿后只改这一个组件。
- 状态与反馈用 `EmptyState` / `InlineError` / `showToast` / `confirmDialog` / `SaveStatus`,见上面「设计系统」一节。
- `ConfirmDialog` + the `confirmDialog(message, onConfirm, opts?)` helper in `App()` replaces `window.confirm`. **Never use `window.confirm` or `window.alert`** — they don't render reliably in embedded / webview environments this app targets.
- Color scheme is forced light (`colorScheme: "light"` on the root) because the app is deployed into surfaces where OS dark mode would otherwise break the inline colors. Keep this in mind when picking colors.
- Group colors (`GROUPS`) use a transparent background with a colored left border + pill border so they render identically in light and dark embeds.
 五个盆的色相刻意分散、明度统一压在 32~42%,**转灰度打印仍能分出 3 档以上**,红绿色觉障碍也能靠明度区分 —— 改这五个色值前先想清楚这条。
- 配料表列宽只在模块常量 `ING_COLS` 定义一次,表头 / 数据行 / 汇总条三处共用。
- `PackPriceFields` —— 规格与价格那一整块(币种 + 单包/一箱 + 袋价/箱价/单价三格互算)。
  材料百科和本店原料共用一个。**供货商报价单给的是袋价或箱价,不是 ¥/g**,所以三格填任意
  一格,另外两格自动算;`anchor` 记住用户按哪个口径报的价,改包装克数时保住那个口径重算单价。
  下面一行双币对照(`fmtOther`)给另一种钱的值 —— 报价单是一种钱、记账是另一种,两个数要同时看见。
- `BrandPicker` —— 厂家选择器(输入即筛)。**469 个厂家用原生 `<select>` 翻不动**,而且顺序
  跟当前大分类无关。中 / 日 / 法名都能搜;**「本类」= 主分类是本类,或在本类下已有材料**(`inCatBrandIds`,由
  `MaterialEditForm` 从 `materials` 算好传进来),全品类厂家排第二档并标「全品类」;**选中全品类厂家不联动大分类**,
  只有主分类非空的厂家才联动。键盘 ↑↓ / Enter /
  Esc 可用,超过 50 条截断并提示还剩多少。**选项必须用 `onMouseDown` 而不是 `onClick`** ——
  input 的 blur 先触发会把面板关掉,onClick 永远进不来。选中后仍联动大分类 / 子分类。
  (材料筛选处那两个带「全部」选项的厂家下拉还是原生 select,没改。)
- `recipes[].onSale` —— 「在售中」布尔标记(季节食材决定当季卖哪几款)。配方一览行首圆点
  点一下切换,标了的排到最前,顶部还有独立的「在售中」tab。跟 `products`(可售单元 / 库存)
  是两回事,**不联动**。

## RURU_*.json files at repo root

These are user-authored import packages (recipes, components, knowledge, materials encyclopedias) consumed via the "数据" → 导入 flow. They are data, not code — don't reformat or edit them unless the user asks. The full export shape includes `recipes`, `cats`, `components`, `creations`, `knowledge`, `exportedAt`, `version`; partial packages with just one or two of those keys are also valid imports.

## `public/layout.html` — 798 厨房布局台(独立工具,不属于主 app)

单文件、无构建、纯离线的厨房设备摆放工具(约 1900 行,内联 SVG,毫米坐标)。
放在 `public/` 是因为 Vite 会把这个目录原样拷进 `dist/`,于是上线后有一个独立地址
`/layout.html`,LuLu 可以在 iPad 上「添加到主屏幕」当 App 用;同一个文件拷到桌面
双击(`file://`)也照样能跑、能存(实测 `localStorage` 在 `file://` 下可用)。

三件事改之前必须知道:

1. **它和主 app 共用一套设计 token,但没有共用代码。** 顶部 `:root` 的 15 个颜色值是从
   `src/App.jsx` 的 `N`/`T` 逐值抄来的,改主 app 的色板时要顺手同步这里。
2. **`src/sw.js` 的 navigate 分支有一条为它而设的例外。** 那个 Service Worker 原本对所有导航
   都返回缓存的 `/index.html`,会把这一页整个吃掉。删那段例外 = 上线后 `/layout.html` 打开的是配方 app。
3. **必须保持完全自包含**:不许有 `<script src>` / `<link href>` 到外部、不许 `fetch`。
   唯一允许出现的 http 字符串是 SVG 命名空间(那是标识符,不发请求)。字体只用系统栈。

存档 key 是 `ruru798_layout_v2`(多方案);`ruru798_layout_v1` 是升级前的原件,**只读不写、永不删除**。
设备尺寸的权威来源是 `RURU_798_已采购设备明细_v2.md`,净空规则在文件里的 `TUNE` 常量集中定义。

2026-08 大版本后的几个事实(改几何前先看):

- **房间几何以「原始图纸-0727」CAD 为准**,全部写在顶部常量:`K_W=8825`(厨房宽)、`K_D=4660`、
  `WALL=200`、前厅 `F_X/F_W/F_TOP/F2_X`、玻璃分隔 `MULLIONS`。改尺寸只改常量,别在绘制代码里硬编码。
- **`COLUMNS` 数组是 4 根建筑固有柱**(2×Ø300 + 2×150 方),从 0727 图纸标定,已"标死":
  不可选中不可移动,同时以碰撞方块进了 `WALLS`。别当成普通道具改。
- 打印取景框由 `planExtent(scope)` 按内容动态算(厨房页 + 全景页各一张),**不要再写死 viewBox**。
- 道具有 `lock` 字段(iPad 防误碰):锁定后 pointerdown 直接转平移;`btnLock`/`btnLockAll` 两个入口;复制时 `lock:false`。
- 自定义隔断用 DEFS 里的 `uwall`(隔墙段,`wallish:1` 豁免墙体重叠判定)。
- 叠放高度 `stackHeight` 有互为载体的去重逻辑(visited set),UNOX 10盘+5盘曾因此误报 4016mm,改叠放逻辑前看 commit 989dac2。
- 横屏(iPad landscape)有专门布局分支,竖屏/横屏断点都在 `GLOBAL_CSS` 同级的媒体查询里。
- **`PIPES` 常量是场馆 2×Ø235 横穿管道**(管底 2000,y=2445/2795,与 COLUMNS 同级"标死"):画成红色限高带,
  总高 >2000 的设备压进带内会在检查清单报红。现场实测后只改 `PIPES.ys` 两个数,其余自动跟。

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

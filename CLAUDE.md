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

**⚠️ `.claude/notes/` 存的是业务级文档,不是软件文档**。LuLu 常在这个 cwd 里聊开店筹备这类跟代码无关的事,产出就近落在这里 —— 已有 20 多份,覆盖开业总计划、798 装修报批攻略、设备采购总档、厨房设计条件表、**暖通电力(空调排烟玻璃方案,第六节是 60 kW 电力落地包)**、排烟方案给设计、**厨房水处理(含 §11 软水机选型复核、§12 罐体几何判定式、§13 采购状态板)**、冷库采购要点、招聘计划与面试指南(含咖啡师版、招人策略总分析、候选人一览与工资速查表 PDF,PDF 源在 `notes/_pdf_src/`)、**商标注册**、**MJ 产品图路线与合规**、**原料国产化选型**(`辅料_*.md` / `黄油线_*` / `蛋线_*` / `面包线_*`,2026-09 起逐项定,Hub 里有索引)、回国带料清单、经营模型基准数据、选址决策(历史存档)等。
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
LuLu 发的图片统一放在 `C:\Users\11508\Desktop\claude图片\` 目录下。
- 当 LuLu 说"看下图 X"或"看图 X.png"时,自动理解为该目录下的文件,直接 `Read C:\Users\11508\Desktop\claude图片\X.png` (或 .jpg / .jpeg / .webp 等),不要反问"图在哪"。
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
- `creations` — 「组合产品」(2026-09-27 前叫「组合蛋糕」,实体 id 和 tab id 没改)that reference `components` as layers.
  `structure` 字段决定长相:`"stack"` 叠层(缺省,自上而下,蛋糕类)/ `"assembly"` 拼装(壳 / 馅 / 顶,不分上下,泡芙 / 塔 / 丹麦类),见下面「组合产品的结构」。
  v17.8 起层默认跟组件库走、详情页出按个数算的整体配方,见下面「组合产品:整体配方 + 部分跟组件库走」。
- `knowledge` — knowledge base entries with `tags` and a `relatedRecipes` free-text name array (matched by name, not id — four-tier rule, see 「知识 ↔ 配方 / 组件 / 蛋糕的名字关联」 below).
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
   **把它的结果写回配料行(`unitPrice: String(pp)`)必须同时写 `currency: "CNY"`** —— 三个编辑页打开 / 保存时刷新价格的 6 处
   到 2026-09-27 才补上:老配料没币种字段,刷新出的人民币被当日元再乘一次汇率,编辑页成本小 23 倍,
   「保存到本店原料」还会把人民币数当日元存进本店原料。
   **组件卡片 / 选组件弹窗 / 组合蛋糕(列表、详情、编辑)的成本一律实时算**(`getIngsLiveCost` / `calcLayerLiveCost`)。
   `components[].totalCost` 和 `creations.layers[].totalCost` 这两个快照**没有币种,只写不读**:东京时期存的是日元,
   v17 后保存过的是人民币或混的。2026-09-27 前直接加 ¥ 显示,Framboisier 列表 ¥22,885、实际约 ¥312。
   **配料行手写单价的「¥ / 円」切换走 `ingCurBtn`**(配方 / 组件 / 层三个编辑页共用,2026-09-27;组件和层原来没有这个按钮,
   没有 currency 字段的老行填什么都算日元)。语义同售价和本店原料的币种按钮:切过去保住同一笔钱,单价、`cost` 快照、
   `_originalPrice` 一起用 `convCur` 折。关联了百科的行不显示(价跟百科走)。**成本 = 用量 × 单价,不换算单位**:
   按「本 / 個」写的行(香草荚、干杏)不能关联按克标价的材料,会只算出几分之一,单价直接填每根 / 每个的价。
   旧 cats 价格表的「→ ≈¥…/100g」同步提示只在日元行出现:那张表是东京时期的日元每克价,拿人民币行跟它比、点了会把日元数原样写成人民币。
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
- **配方详情页**的配料表列宽只在模块常量 `ING_COLS` 定义一次,表头 / 数据行 / 汇总条三处共用。(编辑页的配料表是另一份:`IngredientTable`,见下面「体检第 2 批 2b」。)
- **配料行 / 组合蛋糕层的成本显示走 `fmtCost(v)`**(不到 1 元两位小数、1 到 10 元一位、10 元以上整数,尾零去掉,
  小于 1 分显示「<¥0.01」;没价返回空串)。**别再手写 `toFixed(0)`** —— 盐 1g 的 0.03 元会显示成「¥0」,和没价的空白分不清
  (2026-09-14 LuLu 提的)。批次总成本 / 单个成本数大,仍是整数或一位小数,不走这里。
- `PackPriceFields` —— 规格与价格那一整块(币种 + 单包/一箱 + 袋价/箱价/单价三格互算)。
  材料百科和本店原料共用一个。**供货商报价单给的是袋价或箱价,不是 ¥/g**,所以三格填任意
  一格,另外两格自动算;`anchor` 记住用户按哪个口径报的价,改包装克数时保住那个口径重算单价。
  下面一行双币对照(`fmtOther`)给另一种钱的值 —— 报价单是一种钱、记账是另一种,两个数要同时看见。
- `BrandPicker` —— 厂家选择器(输入即筛)。**469 个厂家用原生 `<select>` 翻不动**,而且顺序
  跟当前大分类无关。中 / 日 / 法名都能搜;**「本类」= 主分类是本类,或在本类下已有材料**(`inCatBrandIds`,由
  `MaterialEditForm` 从 `materials` 算好传进来),全品类厂家排第二档并标「全品类」;**选中全品类厂家不联动大分类**,
  只有主分类非空的厂家才联动。键盘 ↑↓ / Enter /
  Esc 可用,超过 50 条截断并提示还剩多少。**选项必须用 `onMouseDown` 而不是 `onClick`** ——
  input 的 blur 先触发会把面板关掉,onClick 永远进不来。
  (材料筛选处那两个带「全部」选项的厂家下拉还是原生 select,没改。)
- `BrandManageView` + `BrandReassignDialog` —— 厂家管理页(材料百科首页右上「管理厂家」进;v17.3, 2026-09-14)。
  一张可勾选的表(名称 / 主分类 / 材料数),筛「0 材料」「全品类」「疑似重名」(中日法任一名归一化后撞车),勾选后批量删或合并,
  点分类标签就地改主分类。**删厂家永远不删材料**:名下有材料的必须先在对话框里选一家接手,材料改挂过去再删;没材料的直接删 + 撤销 toast。
  删 / 合并只有一个写出口 `applyBrandRemoval`(在 `MaterialsView` 外壳里),厂家编辑页的「删除」也走它 —— **别再写第二个级联删材料的路径**。
  `MaterialsView` 现在是外壳(持 `brandManageOpen` + 对话框状态),原来的主视图改名 `MaterialsViewBody`。
- **关联候选「本店原料已有」优先**(v17.4, 2026-09-19,LuLu:「一键关联的逻辑改一下 最优先本店原料已有」)。三个入口共用一套规则:
  编辑页「🤖 批量关联」(`BulkMatchModal`)、行首 🔗 选材料(`MaterialPickerModal`)、`fuzzyMatchMaterial`(数据 tab 向导
  `BulkMaterialLinkWizard`,**目前没有按钮能打开,是死代码**)。`smartMatchMaterial` 每个候选带 `inShop`(读渲染期注入的
  `_shopMaterials`,判定用 `isShopMaterialId`)和 `zhJa`(中 / 日文名重叠率,法文不算);显示走 `sortShopFirst`(≥ 70 分的本店候选
  浮顶并标「本店」),自动勾选走 `pickAutoMatch` → `shopMatchWins`:**本店 + 中 / 日文名对得齐(`zhJa ≥ 0.8`)+ ≥ 85 分 + 不比最高分
  低 10 分以上**才优先勾本店的,否则按最高分 ≥ 70。两道门槛都是主数据回归逼出来的,别删:打分只看「你写的词有没有全出现在对方名字里」,
  「细砂糖」的法文 Sucre 会和 ハローデックス 的 Sucre inverti 全重叠打到 87(没有「对得齐」→ 11 行砂糖勾成转化糖浆);
  「Union 业务用杏仁粉」精确命中 Union 100 分、本店 Marcona 靠泛称日文名拿 85(没有「差 10 分」→ 点名了品牌的行被本店抢走)。
  **改这套规则前先跑 `.claude/scripts/match_probe.cjs`**(把打分函数从 App.jsx 抽出来对主数据全量跑,列出自动勾选会变的行)。
- **知识 ↔ 配方 / 组件 / 蛋糕的名字关联**(v17.5, 2026-09-25)。`knowledge.relatedRecipes` 仍是名字数组(没改数据格式),
  知识页「关联配方」按钮和三个详情页底下的「相关知识」共用 `makeKnowledgeLinkResolver` + `knowledgeLinksTo`(在 `KnowledgeDetail` 上方),
  **按钮跳到哪,哪一页底下就列这条知识**。从严到松四档,某档只命中一个才算:全名相同(NFKC,不管大小写 / 法文重音 / 空格 / 「・」)→
  去版本号(v1.0 / v3C / v0)相同 → 再去括号备注相同 → 是某一项名字的一部分(≥ 2 字,纯英文 ≥ 4 字母)。命中多个 = 同名,
  按钮灰 + 标「N 个同名」,反查时每个候选页都列。**别再拆碎词**:旧规则拆词后「v1.0」「ショコラ」「de」都能把按钮带走,
  主数据 165 个按钮跳错 55 个(Grand Gâteau 跳进巧克力布列塔尼、Framboisier 跳进装饰组件)。`splitLinkNames` 把 4 条被粘成
  「A「, 」B」的旧数据读时拆开。三个详情页因此要多收 `recipes` / `components` / `creations` 三个 prop。
  **改这套规则前先跑 `.claude/scripts/entry/compare_knowledge_links.cjs`**(逐个按钮对比改前改后,规则原样抄在同目录
  `knowledge_link_v2.cjs`)。录入包预演用 `sim_knowledge_links.cjs`,**用前看一眼文件头写的是新规则还是旧规则,要和线上 App 一致**
  (新规则版带 `--legacy` 开关)。清单和改法见 `.claude/知识按钮跳转_清单与改法_2026-09-25.pdf`。
- `recipes[].onSale` —— 「在售中」布尔标记(季节食材决定当季卖哪几款)。配方一览行首圆点
  点一下切换,标了的排到最前,顶部还有独立的「在售中」tab。跟 `products`(可售单元 / 库存)
  是两回事,**不联动**。
- `components[].inUse` —— 组件仓库的「在用」标记(v17.6, 2026-09-26),照 `onSale` 做:卡片行首圆点点一下切换,
  标了的排到所在分段最前,筛选条多一个「● 在用中 N」。缺省 = 不在用,老数据不迁移。**是手动标记,不从组合蛋糕推导**,
  也不写进 `creations.layers`(层里是组件快照)。**整体替换组件对象的地方要把它带过去** —— 组件编辑页是 `...form` 带原对象,天然保留;
  「↻ 同步回组件库」(App 里的 `onUpdateComponent`)2026-09-27 起按字段合并 `{ ...c, ...updated }`,层只带层编辑页能改的字段
  (中日文名 / 分类 / 产出量 / 单位 / 原料 / `stepsZh` / `stepsJa`),在用和风味 / 模具 / 图片 / 备注都天然保留,**别改回整体替换**。
  同一页还加了:搜索框(中 / 日 / 法名 + 风味名)、「全部」和「在用中」时按分类分段(认不出的分类并进「其他」段)、
  卡片信息行「用在「X」等 N 个组合产品」(按 `layers[].sourceComponentId` 反查,只显示不写数据;手搭的空白层没有这个 id,不计入)。
- **组合产品的结构 `creations[].structure`**(2026-09-27,LuLu 用组件搭泡芙时「上下层」显得怪):`"stack"` 叠层(缺省,老数据没这个字段 = 叠层,
  不迁移)/ `"assembly"` 拼装。**只换文字和示意图,layers 的顺序 / 用量 / 成本算法一概不动**:拼装不画左侧竖条、「N 层」→「N 个部分」、
  「本层用量」→「用量」、「制作台数 / 每台切几份」→「制作个数 / 每个分几份」、「单台成本」→「单个成本」。叫法全部从 `creationWords(structure, lang)`
  取(`CREATION_STRUCTURES` 表定义在 `CreationsView` 上方),列表 / 详情 / 编辑 / 层编辑四处共用,**别在页面里散写「层」「台」**。
  慕斯的夹心就是叠层里中间的一层(剖面图画法),刻意不另设类型。编辑页「结构」两个胶囊按钮切换,`LayerEditForm` 多收一个 `structure` prop。

## 组合产品:整体配方 + 部分跟组件库走(v17.8, 2026-09-28)

LuLu 原话:「我组合这个单元是为了创作的时候方便,最终组合成一个成品后还是需要一张整体的配方的不是么」。
**改这一块之前先跑 `.claude/scripts/creation_follow_probe.cjs --data <最新导出> [--pkg <合并导入包>]`**
(把 App.jsx 里的成本链 + `BEGIN/END creation-follow helpers` 那段原样抽出来,对全量数据查:老数据归一化、成本一分不变、
同步幂等、「打开部分编辑页不改就保存」不会误判、改组件后跟着变、圣多诺黑做 12 个的数)。

1. **用量口径**:`layers[].usedAmount` 是按「制作个数」`serves` 这一批写的(成本一直这么算:总成本 ÷ serves)。
   做 N 个 → 需要量 = 用量 × N ÷ serves;配料缩放 = 需要量 ÷ 组件产出量;没产出量的手搭部分按「整批 × 倍数」。
   **唯一算法是 `creationBatch`**,详情页「📘 配方」(`CreationRecipeSheet`)、打印(`CreationPrintTemplate`)、
   采购页(`PurchaseView` 的组合产品分支)三处共用 —— 以前采购页按「每部分整批 × 个数」算,圣多诺黑做 12 个会算出 12 批千层。
   用量是文字框(`type="text"`,老数据有「約 60–80g(φ15 1 片)」这种),**计算只认开头的数字**;「500g + 170g」这类
   (`usedAmountAmbiguous`)页面会提醒「按 500 g 算」,读不出数字 = 没填。
2. **跟组件库走 = 写进副本(propagate-on-write)**。`layers[]` 仍存组件内容的副本,所以成本 / 采购 / 材料用在哪 / 打印这些老读者
   一行没改。App 里一个 effect 调 `syncFollowingLayers`:`follow: true` 的层内容 ≠ 组件时,整段换成组件的最新内容
   (`layerContentFromComponent`,`customName` / `usedAmount` 不动);`localVariant: true`(本产品专用)、组件已删、手搭的层不动。
   **幂等,没东西要改时原样返回同一个数组**,effect 不空转。`CreationEditForm` 里对表单也跑一遍(编辑中途同步回组件库,同组件的其他层要跟上)。
   - 比较走 `layerContentKey`:名字 / 分类 / 产出量(空和 0 算一样)/ 单位 / 配料 / 中日步骤 / 备注。**关联了百科的配料不比单价 / 成本快照**
     (打开编辑页会刷新,比了就一开一存变「本产品专用」);没关联的手填单价 / 币种 / 成本算内容。指向已删材料的 `materialId` 当没关联。
   - **老数据**(两个标记都没有):内容一样 → 标 `follow`(只加标记);不一样 → 原样不动,详情页提示「和组件库不一样(差在:备注)」+
     「用组件库的 / 保留(本产品专用)/ 全部用组件库的」,都是先做 + 撤销 toast。09-26 数据:Grand Gâteau 6 层差在备注(层里没带备注)、
     热带水果慕斯 2 层差在分类、两个丹麦草稿差在内容。
   - 编辑部分保存时(`CreationEditForm.updateLayer`)按内容定标记:和组件一样 → `follow`;不一样 → `localVariant` + toast。
     「↻ 同步回组件库」确认后 `onUpdateComponent(updated, onDone)` 回调 `doSave(ings, { synced: true })`,这一层直接算 `follow`
     (那一刻组件库还没刷新到表单里,不能拿来比);确认框按 2a §09 列出会跟着变的产品(`refs`)。
   - **以后任何往 `creations.layers` 写内容的新代码**,要么走 `updateLayer` 定标记,要么想清楚:跟组件库走的层会被下一次同步盖掉。
     批量关联向导(`BulkMaterialLinkWizard`,死代码)已跳过跟组件库的层 —— 关联组件那一行就会带过来。
3. **备货 `components[].prepMode = "stock"`**(组件编辑页勾选,详情页有标签):整体配方里只写「从库存取 X g」,整批配方点开看。
   **读组件本身,不抄进层**。备货的部分采购页照样算原料。
4. **配方一览混排组合产品**(「组合」标签、单个成本 = 总成本 ÷ serves ÷ portions、售价、毛利率),圆点 `creations[].onSale`
   (`toggleCreationOnSale`),「在售中」一起算;家族模式按 `familyId` 放(家族不存在 → 未归属),家族详情也列。
   点进去记 `creationReturnTo = "list"`,详情页返回键变「← 返回配方一览」;离开组合产品 tab 就作废(effect 监听 `tab`)。
5. **打印**:`printTarget.type = "creation"`,`data = { creation, batch }`(详情页当下算好的那一份)。`PrintModal` 对组合产品只给语言 +
   「做法 / 备注」。三个老模板取步骤改成 `pickSteps`(以前 `stepsJa: []` 是真值,日文版步骤整段空白)。
6. 顺带修:组合产品列表的状态表把「季節限定」写成「季节限定」、漏了「検討中」,这两个状态都被显示成試作。
7. 新字段(`follow` / `localVariant` / `prepMode` / `creations.onSale`)缺省就是老行为,**payload `version` 仍是 17,不写迁移**
   (老数据的归一化由 effect 做,只加标记)。

## 2026-09-29 体检第 1 批修复(改这些地方前先看)

全面体检报告在 Artifact「kororā App 体检」,原始结果 `.claude/audit_2026-09-28/audit_result.json`(每条带 fixHint)。第 1 批修了 11 个严重 bug,留下这些规则:

1. **编辑页离开保护**:编辑页用 `useDirtyGuard(() => 要比较的状态)`,把返回的 bind 挂在根元素上(`<div {...dirtyBind}>`);
   快照在她第一次按键 / 点击时才拍,所以编辑页打开后 effect 自动调整表单不会被误判成「改过」。**顶部导航、手机底栏、「更多」抽屉切页一律走
   `goTab(t)`,别再直接 `setTab`** —— `goTab` 有未保存改动时先弹 confirmDialog。离开组件 / 组合产品 tab 时 effect 会清掉
   `compEditTarget` / `creationEditTarget`(以前切回来还是旧编辑页)。新写的编辑页也要接 `useDirtyGuard`。
2. **多窗口**:`storage` 事件只在别的窗口写入时触发。**按内容判断**:`saveData` 的内容(不含 `savedAt`)和本窗口上次写入 / 载入的
   `lastBodyRef` 一样就不写;别的窗口写进来的内容和 `lastBodyRef` 一样就不算改过。真不一样才 `staleRef = true`:本窗口停止自动保存、
   顶上红条提示刷新。(审查发现:只看「有没有写」时,新开或刷新一个窗口就把另一个窗口踢成过期、两边来回互踢。)
   离开页面(`pagehide` / 切到后台)时只在 `pendingRef` 有没存的改动才立刻写一次。备份恢复写完存档到刷新之间 `_suspendSaves = true`,任何保存都跳过。
3. **合并导入**:brands / materials / shopMaterials 已存在的条目走 `mergeByNewer`:`updatedAt` 更晚的一边为准,另一边只补缺字段;
   单价 / 参考价 / 币种(`pricePerG` / `priceRange` / `currency`)**永远整组取同一边**。**两边都没写修改时间(老数据)时以文件为准**,
   只有一边写了时写了的算新。录入包要更新已有材料,生成时给那条写上当前 `updatedAt`。本店原料的所有写入口(编辑页保存、「保存到本店原料」、
   「+ 添加为本店原料」、配方页批量加入、删供货商剥离)都写 `updatedAt`,材料和厂家编辑页本来就写。
   (以前字段级合并,旧文件没 currency → 本机「人民币」标签 + 文件的日元数,成本错 20 到 50 倍。)
4. **规格解析 `parsePackSizeToGrams`**:认 kg / g / L / ml 和中文 千克 / 公斤 / 克 / 升 / 毫升(液体按 1 g/ml),千位逗号先去掉,
   多规格取第一段、第一段没单位借后面的;個 / 本 / 枚 / 号缶 这类计件返回 0(页面显示「规格未知」,PackPriceFields 提示直接填单价)。
   `PackPriceFields` 用 `anchorVal` 记住她最后填的袋价 / 箱价原数,改规格时拿它重算单价。
5. **采购清单**的小计和合计按 `toCNY(sm.pricePerG, curOf(sm))` 折人民币,日元来的标 `≈`。旧价格表 cats 品牌下拉写价时标 `currency: "JPY"`。
6. **打印**:预览外层 div 必须带 `className="print-overlay"`;PrintView 的 `@media print` 用 `#root > div > *:not(.print-overlay) { display:none }`
   把 app 其余部分移出排版,外层和 `.print-area` 改成 static(行内 position/min-height 用 !important 盖掉)。**以前多页的单子只印第一页。**
   验证方法:同结构的测试页用 Edge 无界面模式打成 PDF 数行数(`msedge --headless=new --print-to-pdf=...`)。默认打印 logo 是定稿字标 SVG。
7. **离线缓存 `src/sw.js`**:每个版本一个缓存(名字 = 预缓存清单哈希);首页 + 主程序(`/`、`/index.html`、`/assets/index-*.js|css`)
   全部下载成功才启用新版,否则继续用旧版;记下每个文件的 revision,没变的从旧缓存拷(字体不再每次重下);非关键文件下载失败时
   先放旧版副本顶着、不记 revision(激活会删旧缓存,不顶着字体表 / 布局台离线就没了)。**改 sw.js 后跑
   `npm run build && node .claude/scripts/sw/sw_install_probe.cjs`**(模拟全新安装 / 主程序下载失败 / 复用 / 激活删旧缓存)。
8. 组件和组合产品部分的保存**不再弹「有 N 个材料未在价格表中」**(旧价格表 v11 已停用);矩阵空格新建组件按新建处理(`!component.id`)。

## 2026-09-29 体检第 2 批 2a(中等 / 轻微 bug,改这些地方前先看)

5 个区域并行修、合并后统一测。每处改动旁有「体检第 2 批」注释写着以前的问题。

1. **自动备份换了库**:新库 `patisserie_backup_v2`,`meta`(时间 / 大小 / 条数摘要 / 是否固定)和 `payloads`(整份数据)分开存,
   恢复列表只读 meta,点「恢复」才读整份。保留规则(`pickBackupsToDelete`):最近 15 份 + 最近 12 小时每小时一份 + 最近 14 天每天一份
   (当天最早那份)+ 固定备份(覆盖导入 / 清除全部的最多 10 份,恢复前的另算 10 份,免得连着恢复几次把导入前那份挤掉);
   内容和上一份一样不存,要固定的内容库里已有就把那份标成固定。**覆盖导入、清除全部、恢复备份之前一律先存固定备份**
   (`pinBackupNow(reason)` / 恢复时 `addBackupSnapshot(..., { pinned: true, reason: "restore" })`),存不上会再问一次。旧库 `patisserie_backup` 只读,照样能列能恢复,超过 14 天的自动清。
2. **删掉的预置条目不再复活**:App 里一个 effect 把「数据里找不到的预置 id」记进 `appSettings.dismissedSeedIds`,
   `mergeWithDefaults(items, seeds, dismissed, kind)` 跳过它们;撤销删除 / 合并导入加回来会自动从名单去掉。**是按「缺了」推断的** ——
   覆盖导入一份没有预置条目的文件、清除全部之后,刷新也不会补回来。新增预置条目照旧给稳定 id。
3. **有新版本提示**:页面载入时已经有旧版离线缓存在管,之后收到 `controllerchange` 才算更新(第一次安装不提示),顶上出一条中性色「刷新」;
   编辑页有没存的改动时先 confirmDialog。页面看得见时每 30 分钟 `registration.update()` 一次,切回标签页 / 从后台切回 app(`visibilitychange` / `focus`)也问,两次至少隔 1 分钟(09-29 她推完一直开着页面没看到新版)。测法:`npm run preview` 装好一版 →
   往 `public/` 临时放一个 svg 再 build → 页面里 `reg.update()` → 出提示 → 点刷新;**测完删掉那个 svg 再 build**。
4. **删除的统一做法**(材料 / 本店原料 / 组件 / 组合产品):有人在用 → confirmDialog 把引用方列进 `refs`(配方 / 组件 / 组合产品 / 商品 /
   本店原料);没人用 → 直接删 + 撤销 toast,撤销放回原位置。组件页和组合产品页因此多收 `products`,本店原料页多收 `recipes / components / creations`。
5. **用量读法只有一个出口 `parseUsedAmount(raw, unit)`**(在 creation-follow helpers 里):去掉开头的 约 / 約 / ~ / ～ 和千位逗号,认 kg。
   `usedAmountAmbiguous` 先忽略括号里的字,开头数字之后还有数字、+ × * /、或者「每」都算读不准,页面(列表卡片 / 详情 / 整体配方 / 打印)提醒
   「是这一批一共的量」。显示单位一律 `l.unit || "g"`(蒙布朗的「颗」)。
6. **缺成本的利润率**:成本 0 显示「—」,有原料没价显示「成本不全·利润率虚高」「N 项没价·利润率虚高」(09-29 她选的叫法,原来「偏高」看不懂)(配方一览 / 配方详情 / 组合产品卡片,组合产品走 `creationMarginView`),
   **不再显示红色 0.0% 或绿色 100%**。
7. **缩放后打印按倍数**:配方详情 / 组件详情缩放过,`onPrint(scaledCopy)` 传一份带 `_printScale` 的副本(只给打印,不写回数据);
   App 那边只认带 `_printScale` 的对象,别把点击事件当副本。抬头印「做 100 個(原 25 個 ×4)」。
8. **打印模板**:按盆 `GROUP_ORDER` 稳定排序(`printSortByBowl`);双语时每步下面印日文;印过敏原和制作时间(`printTimeText`);
   「图片」「关联知识点」两个没用的勾选删了;`printSettings.brandSubtitle` 可以存空串(空 = 不印副标题)。
9. **销售记录多了 `stockOut`**(实际扣掉的件数,卖超库存时小于 soldQty);删记录按它加回库存,老记录没这个字段按 soldQty。
   以后任何重写 salesLog 的代码要把它带上。合并导入的 salesLog / productionLog 同 id 取 `updatedAt || createdAt` 更晚的。
10. **材料「你的使用情况」**(`getUsageScenes`):配料名为空的跳过,只认「关联了这个材料,或配料名包含材料名」;跟组件库走的组合产品部分已在组件那行算过,不重复算。
    认不出的材料分类一律 `getMaterialCat(id).id` 归「其他」(首页计数 / 分类页 / 选材料弹窗 / 本店原料选材料都是)。
11. **「今天」一律 `localDateStr()`**,别再写 `toISOString().slice(0, 10)`(那是 UTC 日期,北京早上 8 点前会落到前一天)。
12. 家族编辑页也接了 `useDirtyGuard`(`goTab` 切页会关掉家族编辑层,点当前这个 tab 也会关,所以家族编辑层开着时同 tab 也要问)。
    更新提示点「不保存,刷新」时设 `_skipUnloadPrompt`,不再弹浏览器自己的离开提示。
13. 编辑页提示统一「中文名必填,日文可以不填」(和保存校验一致);配方编辑页 `familyId` 指向已删家族时下拉多一项「⚠ 已丢失的家族」,保存不悄悄清掉。
14. `creation_follow_probe.cjs` 抽代码时截到 `toCNY` 的结尾(中间插了 `localDateStr`,旧写法截到第一个 `};` 会漏掉 toCNY)。
    **App.jsx 工作副本是 CRLF 换行**(git 存 LF、autocrlf 转换),脚本里拼字符串匹配要用 `\r\n` 或按 `/\r?\n/` 切行。

## 2026-09-29 体检第 2 批 2b:三个编辑页的配料表合成一个(改配料表前先看)

施工说明 `.claude/batch2b/plan.md`,改前现状地图 `.claude/batch2b/understand_raw.json`。

1. **配料表只有一份代码 `IngredientTable`**(模块顶层),配方(`EditForm`)/ 组件(`ComponentEditForm`)/ 组合产品的部分(`LayerEditForm`)
   三页都用它;三页还剩的差异只在 `ING_TABLE_VARIANTS`(datalist id、批量关联「本配方 / 本组件 / 这一部分」的说法),文字全在 `ING_TABLE_TXT`(跟中日文走)。
   `ings` / `setIngs` 仍放在编辑页里(离开保护靠它),选材料 / 批量关联两个弹窗走 `IngredientLinkModals`,**要渲染在编辑页根元素里面**。
   子组件一律定义在模块顶层,**别在渲染函数里定义组件**(每敲一个字输入框重新挂载、光标丢)。`_id` 可能是 0,判断写 `!== null`。
2. 三页的列统一:🔗 / 中文名 / 日文名 / 法文名 / 用量 / 单位 / 品牌 / 单价 / 成本 / 分组 / 备注。组件 106 行、部分 61 行的**备注以前看不见**,现在三页都能看能改。
   认不出的分组值(导入的 bowl6 之类)显示成「未分组」、不改数据(以前配方页白屏)。关联了百科的行品牌格三页都锁住。
3. **单价框按「每 100 g」填**(`IngPriceInput`):单位是 g / ml / 空 / 克 / 毫升 → 显示 `unitPrice × 100`,填的数 ÷ 100 存;其他单位按每单位填。
   **存储仍是每单位价 `unitPrice`**,别把 /100g 写进任何字段。判断「是不是克」走 `isGramUnit`(先 NFKC,全角「ｇ」「ｍｌ」也算)。
   关联了**有价**材料、单位却是本 / 個的行,框里是打开时刷新来的材料每克价,口径写「¥/g」(不写「¥/本」,香草荚 1.29 读着像一根 1.29 元)。输入框有本地草稿(敲「1.」不被吃掉),失焦 / 外部改值时按存的值重算,显示去浮点尾巴。
4. **关联了百科的行改单价**(体检 #21):三页都追踪 `_priceModified`(只标「关联了、材料还在」的行,标 false 时删键),出提示条
   `PriceChangeBanner`,「保存到本店原料」**默认勾上**,保存时 `saveIngPricesToShop` upsert 本店原料(带 currency / updatedAt),toast 带**撤销**。
   **单位不是克的关联行(本 / 個 / kg)不写本店原料**(本店原料按克计价;以前每本 15 元会被当成每克 15 元,贵 10 倍),
   而且这种行改的价**不参与成本**(成本仍按材料百科每克价算,见 C10 黄框),要按每本算得先取消关联。
   手改过价的关联行单位在克 / 非克之间换了,丢掉手改的价回到百科价 —— **在离开单位框(blur)时拿点进去之前的单位比**,不在每次按键时判断
   (g 改 ml 敲到「m」、拼音打「毫升」敲到「h」都会误判);整个窗口失焦(切去微信)触发的 blur 不算。部分编辑页保存就写本店原料(立即生效,组合产品不保存也留着,toast 写明)。
   🔗 重新选材料 / 批量关联写价时同时重置 `_originalPrice`、去掉 `_priceModified`。
5. **名字联想**(`IngNameInput` + `suggestMaterialsForIng`):中文 / 日文名框打字出下拉(最多 8 条,本店原料排前带价),点一条 = 🔗 选材料同一个写法
   (`applyMaterialPick`),外加把正在打字的那个框换成材料的名字。旧价格表 cats 的名字 datalist 去掉,**打字不再自动绑旧价格表**,
   但「改名解绑 catId」和打开时的 `autoLinkIng` 保留(去掉会改变组件 / 部分的内容比较)。下拉 `position: fixed`、选项用 `onMouseDown`、输入法组词时不响应 Enter;往上还是往下开按 `visualViewport`(iPad 键盘弹起只缩它)。
6. **跟组件库走的比较 `_ingContentKey` 现在包括配料的备注和法文名**(以前组件里改的备注到不了组合产品,部分里改的会被悄悄盖掉)。
   **打开 / 保存时不整理没关联百科的行**(补 currency、改精度、清 "NaN" 都不行):组件的行原样深拷进跟组件库的部分,内容一变「打开不改就保存」就变本产品专用。
7. 清空用量 / 单价时成本写 ""(以前写字符串 "NaN");老数据里已有的 "NaN" 不在打开时清。名字只有空格的行保存时丢掉(`ingHasName`)。
   数字框滚轮一来就失焦(`blurOnWheel`)。关联材料被删掉的行也显示 ¥/円 切换。单位不符(关联了按克计价的材料但单位是本 / 個 / kg)单位格黄框。
8. **步骤中日按行对齐**(体检 #31):保存时中间一种语言空着的留 "",两边都空的行不存;显示走 `stepRows` / `pickSteps` 按行回退到另一种语言。
9. **离开保护**:所有编辑页(配方 / 组件 / 组合产品 / 部分 / 家族 / 知识 / 材料 / 厂家 / 商品 / 供货商 / 本店原料)都接 `useDirtyGuard`,
   页内「← 返回」「取消」有改动先问(`confirmLeave` 用本页的 `bind.isDirty()`;`confirmLeaveEditor` 用 `anyEditorDirty()`,文字同 goTab)。
   比较时 "" / null / [] / false 当成没有这个字段、数字按字符串比(`_dirtyNorm`;老数据的年份 / 库存是数字,敲了又删会变成字符串),敲了又删不白问。
   单价框敲回一开始显示的数,原样还回原值(刷新来的 0.12727999999999998 显示成 12.728,敲 1 再删掉不算改过)。离开知识库 / 商品 / 供货商 / 材料百科页时关掉编辑页(商品编辑页开着切去卖货,回来保存会用旧库存盖掉新的)。
10. **测试尺子**:`.claude/scripts/editor_probe/editor_probe_v2.cjs`(86 例 / 3137 步快照,`--diff` 对比)+ `b2b/` 下 extra_tests(82)/ extra_tests_r3(107)/
    round1_tests(81)/ c9_tests(120)/ c11_tests(59),全用 `--root <项目根> --data <导出>` 跑;`summ.cjs a b` 按模式汇总快照差异。**改配料表前后各跑一次。**

## 2026-09-29 体检第 2 批 2c:「🩺 数据体检」页

施工说明 `.claude/batch2c/plan.md`。数据 tab 最上面一张卡片 → 全屏面板 `DataHealthPanel`;检查逻辑全在模块级纯函数 `computeDataHealth(data)`(不改传入对象,1838 条材料约 14 ms)。

1. 检查项 id 对应体检报告 data-N:H1 本店原料没写币种(带「看数量级像人民币」提示)/ H2 材料和厂家分类认不出 / H3 配方、组合产品挂着已删的家族 /
   H5 单位对不上的关联配料 / H6 组合产品用量读不出或读不准 / H7 组合产品里内容是空的部分 / H9 知识按钮找不到或同名 / H10 疑似重复材料 /
   H12 步骤没翻完 / H13 规格读不出或读得不确定 / H14 旧价格表还在 / H15 过敏原没填或写的是日文 / H16 打印设置(只是说明)。
   **不做**:照片编号撞车(data-4)、没价的配料(data-8)、没挂配方的商品(data-11)。
2. 一键改都在 App 的 `dataHealthFix` 里:改完就生效 + 撤销 toast,只写要改的字段 + `updatedAt`;改过的行留在原位打 ✓(连点第二下不会落到下一行);
   H2 改分类时小分类照厂家管理页 `changeCat` 的规则跟着换;H14 清旧价格表前先 `pinBackupNow("clear-cats")`,双击只清一次。
3. 「去改」「去看」走 App 的 `jumpToItem({ kind, id })`:先关面板,**把材料百科留下的查看状态(材料 / 厂家详情、从配方点进来的返回键)清掉**,再设编辑对象 + 切 tab。
4. 面板顶上有「别的窗口改过」红条或「新版本」提示条时,面板从提示条下沿开始(`[data-app-banner]`);标题行 sticky,列表底下也有「关闭」(iPad 没有 Esc)。
5. 顺带修:删家族时组合产品的 `familyId` 也清掉(以前只清配方)。
6. 测试:`.claude/scripts/data_health/data_health_tests.cjs`(236)、`r2_tests.cjs`、`r3_tests.cjs`,用 `--quiet 1 --root <项目根> --data <导出>` 跑。

## 2026-09-29 第 3 批:开店四项(今日生产单 / 日结 / 过敏原和标签 / 员工模式)

施工说明 `.claude/batch3/plan.md`,代码方案 `.claude/batch3/code_design.md`,法规调查 `.claude/batch3/regulations.json`(已核实的条文 + 出处)。
**测试一键全跑:`bash .claude/scripts/batch3/regress.sh`**(编辑页 / 数据体检 / 第 3 批各套 + 审查 5 轮的回归 + 组合产品回归 + 语法 + 日结随机测试);日结另有随机测试
`node .claude/scripts/batch3/fuzz/daily_close_fuzz.cjs`(2 万轮约 106 万项)。改这四块之前先跑一遍。

1. **不加顶层新键**:旧版 app 打开 0.8 秒就会把不认识的顶层键删掉。这批的新数据都放在已有对象里:
   `appSettings.prodPlan`(今天的生产单)、`appSettings.staffPin`、`salesLog` 条目的 `waste / wasteOut / closedAt`、
   `materials` 的 `allergenCodes / mayContainCodes / allergenChecked / labelNameZh / labelIngredientsZh`、`printSettings.labelShopName / labelAddress / labelPhone`。
   **每台设备自己的**:员工模式开关 localStorage `korora_staff_mode_v1`,厨房视图打勾 sessionStorage(key 带日期)。
2. **共用纯函数(模块顶层,改了要跑测试)**:`computeMaterialNeeds`(采购页和生产单的汇总,生产模式按名字合并没关联的配料)、
   `salesSpanOf` / `avgDailySales`(起算日只看卖出 > 0 的记录)、`restockSuggest` / `isLowStock`、`makeLogQty`(商品页和生产单「记入生产」同一写法)、
   `productUnitCost`(口径同采购页;组合产品按「整个」算,商品页写明)、`applyDailyClose` / `undoDailyClose`、`allergenSummaryOf`、`draftIngredientList`。
3. **日结 `applyDailyClose`**:填的是当天**总数**。当天卖出 + 报损合起来算「当时没扣到的短缺」:**改小先抵短缺再还库存,改大只从现在的库存扣多出来的**,
   以前卖超没扣到的件数不从后来生产的库存里扣;先卖出后报损;同样的数再存一次不变;撤销按这次的增减反过来,保存后又被改过的商品不撤。
   商品页删记录回滚 `stockOut + wasteOut`。**旧版 app 删带报损的记录只加回 stockOut**(库存偏少,不会凭空多)。
4. **过敏原**:`ALLERGENS` 八大类名字**照 GB 7718-2025 4.12.1 原文**,另加自愿标示的芝麻、椰子。汇总时没关联 / 材料没核对 / 材料已删 / 单位不是克
   都算「未确认」,**只要有未确认就绝不显示「无」**;配方上手写的 `allergens` 并排显示、不一致标出、不自动覆盖。配料表草稿按投料重量从多到少,组合产品每部分作复合配料。
5. **标签**:模板和页面都带草稿提示(店内现做现卖国标不强制;自己装袋 / 礼盒算散装还是现制现售要问朝阳区市场监管;过敏原强制标示 2027-03-16 起)。
   **不写「已合规」「符合国标」**。经营者信息存 `printSettings`,不进 IP 分发包。配料行打印前可以手改(只对这一次打印有效)。
6. **员工模式**:App **不提前 return**(hook 顺序、自动保存、跟组件库同步要继续跑),`{!staffMode && …}` 包住顶栏 / 底栏 / 抽屉 / 内容区,另渲染 `StaffShell`。
   员工三页(生产单 / 厨房视图 / 日结只能今天和昨天)**单独写,别复用老板的详情组件**(会露价格)。退出输 4 位 PIN,忘了用 app 进入密码。
   别的窗口进员工模式时,这个窗口有没存的改动先问、同时用不透明遮盖挡住老板界面(遮盖层在所有弹窗之上、PIN 框和确认框之下);
   进员工模式时清掉 toast 队列(老板那边带价格的提示条不能留在员工界面)。厨房视图 `useWakeLock` 申请屏幕常亮,不支持时提示去 iPad 设置关自动锁定。
7. **今日 tab**:`NAV` 第一个;手机在「更多」抽屉里。生产单存 `appSettings.prodPlan`(换日期显示为空,可「照那天的再来一份」),
   「今天总共要称多少 → 从库存取」同一个备货组件合成一行(名字不同的几个部分合在一起时叫组件名;没填用量的部分单独数,已知的照常加总并标「另有 N 个部分没填用量」);
   「记入生产」只记没记过的部分、带撤销;「已记入 N」以当天真实的生产记录为上限(商品页删了记录,生产单跟着回来);「清除全部数据」连 prodPlan 一起清;打印模板不出现任何价格,配料备注里带价格的那段去掉。

## RURU_*.json files at repo root

These are user-authored import packages (recipes, components, knowledge, materials encyclopedias) consumed via the "数据" → 导入 flow. They are data, not code — don't reformat or edit them unless the user asks. The full export shape includes `recipes`, `cats`, `components`, `creations`, `knowledge`, `exportedAt`, `version`; partial packages with just one or two of those keys are also valid imports.

**⚠️ 数据 tab 两个导入按钮行为完全不同**:「选择 JSON(覆盖)」`importData` 把每个实体整体换成文件里的(**文件里没有的实体直接清成 `[]`**);「合并导入(只新增不覆盖)」`mergeImportData` 只追加 —— recipes / components / creations 按 id 或 nameZh / nameJa 去重,knowledge 按 id / title,brands / materials / shopMaterials 已存在的按修改时间取新的一边(`mergeByNewer`,见上面「体检第 1 批」第 3 条)。**局部包(比如只含一条新配方)必须走合并导入**,走覆盖会把其他数据全清掉。`my_data_export.json` 只是某次导出的快照(2026-09-25 时停在 09-04),LuLu 之后在 app 里的改动不在里面,所以新录入默认出只含新条目的 `RURU_<名>_合并导入.json` 让她合并导入,别让她整份导入主数据文件。做法见 `.claude/recipe_entry_sop.md` §1.13。

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

- 调试 Chrome 启动命令（在 Windows CMD 里）,两台电脑 Chrome 装的位置不一样:
  - 新电脑 KORORA:`"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --user-data-dir="C:\temp\chrome-debug"`
  - 旧笔记本 LAPTOP-4KPUUQJ1:路径换成 `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,其余一样
- chrome-devtools MCP 直连 `http://127.0.0.1:9222`。两台都是 Windows 上直接跑 Claude Code,旧机那套 WSL + `netsh portproxy 9223→9222` 的桥接已作废,别再照抄。
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


import { useState, useEffect, useRef, useMemo } from "react";
import { SEED_RECIPES, SEED_COMPONENTS, SEED_CREATIONS, SEED_KNOWLEDGE, SEED_FAMILIES } from "./seedData.js";

const STORAGE_KEY = "patisserie_v4";

// ═══════════════════════════════════════════════════════════════
// 🎨 kororā 设计系统 · 1a「美術館 / Gallery」
// 纸感白 + 1px 发丝线 + 零阴影 + 排版即层级。
// 出自 Claude Design 交付稿 `kororā 配方页改版.dc.html` 的 2a token 全表。
//
// ⚠️ 旧 key 名全部保留（全站 1600+ 处 `T.xxx` 点号引用，不解构），
//    改版只换值不改名，所以 10 个 tab 同时换装、零调用点改动。
// ═══════════════════════════════════════════════════════════════

// 13 级中性阶（paper → ink）
const N = {
  paper: "#FAFAF8",      // 页面底
  surface: "#FFFFFF",    // 卡片 / 输入框
  sunken: "#F2F2EC",     // hover / 表头
  lineFaint: "#F0F0EA",  // 行分隔
  line: "#EAEAE2",       // 区块分隔
  border: "#DEDED6",     // 控件描边
  disabled: "#C9C9C0",   // 禁用
  muted: "#A8A89E",      // 三语法文 / 序号
  subtle: "#8A8A82",     // 微标签
  secondary: "#77776E",  // 次要文字
  body: "#55554E",       // 正文
  strong: "#3A3A32",     // hover 深色
  ink: "#16160F",        // 标题 / 主按钮
};

const T = {
  // ── 旧 key（值已换新，调用点不动）──
  bgApp: N.paper,
  bgCard: N.surface,
  bgSoft: N.sunken,
  bgMuted: N.sunken,

  brand: N.ink,
  brandSoft: N.strong,
  accent: "#B0442F",       // 朱 · 主强调（也是 danger）
  accentSoft: "#C9C9C0",

  textPrimary: N.ink,
  textSecondary: N.body,
  textTertiary: N.secondary,
  textMuted: N.muted,

  border: N.border,
  borderSoft: N.lineFaint,
  borderHover: N.ink,      // hover 一律描边转黑

  success: "#2F5D50",      // positive · 利润率 / 已完成
  successBg: "#FFFFFF",    // 语义标签一律白底 + 语义色描边
  warning: "#9A7B2E",      // 待补价 / 低库存
  warningBg: "#FFFFFF",
  danger: "#B0442F",       // 缺货 / 删除 / 关键备注
  dangerBg: "#FFFFFF",

  // 圆角 —— 这套几乎是方的
  radius: "2px",           // 输入框 / 标签
  radiusLg: "0",           // 面 / 卡片 / 表格
  radiusPill: "2px",       // ⚠️ 原 100px 胶囊 → 方角
  radiusSm: "2px",

  // 字体（自托管，见 public/fonts/fonts.css）
  // --k-cjk 是一个 CSS 变量，按当前语言切换中文/日文字体（见 GLOBAL_CSS 的 :root[data-lang]）：
  //   中文 → Noto Sans SC 打头（日文字体缺 2/3 的简体专用字，会逐字掉回系统字）
  //   日文 → Zen Kaku Gothic New 打头（汉字用日本字形，直/骨/穀 这类中日不同形的字才对）
  // fontSerif 是「拉丁 + 数字」face：配方法文名、价格、序号、全大写微标签
  fontSerif: '"Jost", var(--k-cjk)',
  // fontSans 是中日文正文 face
  fontSans: 'var(--k-cjk)',

  // ── 新增 key ──
  ...N,                    // paper / surface / sunken / lineFaint / line / disabled / muted / subtle / body / strong / ink
  info: "#3B4E8C",         // 提示 / 链接 / focus ring

  // 字号阶梯：相邻可用档位至少差 2px；层级只靠 字号跳档 + 字重 + 字距，不靠颜色
  fs: {
    micro:   { fontSize: 10, lineHeight: 1.4,  letterSpacing: "0.20em", textTransform: "uppercase" },
    label:   { fontSize: 11, lineHeight: 1.45, letterSpacing: "0.12em" },
    caption: { fontSize: 12, lineHeight: 1.5,  letterSpacing: "0.02em" },
    small:   { fontSize: 13, lineHeight: 1.55 },
    body:    { fontSize: 15, lineHeight: 1.6 },
    strong:  { fontSize: 17, lineHeight: 1.5,  letterSpacing: "0.01em", fontWeight: 500 },
    titleS:  { fontSize: 20, lineHeight: 1.4 },
    title:   { fontSize: 24, lineHeight: 1.3,  letterSpacing: "-0.01em" },
    titleL:  { fontSize: 28, lineHeight: 1.2,  letterSpacing: "0.02em", fontWeight: 300 },
    displayS:{ fontSize: 34, lineHeight: 1.15, letterSpacing: "-0.01em", fontWeight: 300 },
    display: { fontSize: 44, lineHeight: 1.05, letterSpacing: "-0.01em", fontWeight: 300 },
  },

  // 4px 网格 · 全站只用这 12 个值，单位一律 px
  sp: { xxs: 2, xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, pad: 32, block: 40, gap: 56, head: 72, page: 96 },

  // 阴影只有这两个，且只给浮层；页面里的静态卡一律无阴影
  sh: {
    popover: "0 4px 16px rgba(22,22,15,0.10)",
    overlay: "0 12px 40px rgba(22,22,15,0.16), 0 2px 6px rgba(22,22,15,0.08)",
  },

  // zIndex 常量表（原先 100/500/999/1000/1001/2000/9998 散落各处）
  z: { sticky: 100, bar: 500, drawer: 600, toast: 900, modal: 1000, popover: 1100, confirm: 2000, print: 9998 },

  // 数字列上下对齐
  num: { fontVariantNumeric: "tabular-nums" },
};

// ═══════════════════════════════════════════════════════════════
// 🌐 双语字典（UI 文字）
// ═══════════════════════════════════════════════════════════════
const I18N = {
  // 通用按钮
  edit:          { zh: "编辑",     ja: "編集" },
  delete:        { zh: "删除",     ja: "削除" },
  save:          { zh: "保存",     ja: "保存" },
  cancel:        { zh: "取消",     ja: "キャンセル" },
  back:          { zh: "← 返回",   ja: "← 戻る" },
  confirm:       { zh: "确定",     ja: "確認" },
  add:           { zh: "+ 追加",   ja: "+ 追加" },
  all:           { zh: "全部",     ja: "すべて" },
  print:         { zh: "🖨 打印",  ja: "🖨 印刷" },
  search:        { zh: "搜索",     ja: "検索" },
  // 新建按钮
  newRecipe:     { zh: "+ 新建配方",     ja: "+ レシピ新規" },
  newComponent:  { zh: "+ 新增组件",     ja: "+ コンポーネント追加" },
  newCreation:   { zh: "+ 新建蛋糕",     ja: "+ ケーキ新規" },
  newKnowledge:  { zh: "+ 新增知识点",   ja: "+ ナレッジ追加" },
  newFamily:     { zh: "+ 新建家族",     ja: "+ ファミリー新規" },
  newBrand:      { zh: "+ 新增厂家",     ja: "+ メーカー追加" },
  newMaterial:   { zh: "+ 新增产品",     ja: "+ 製品追加" },
  newLayer:      { zh: "+ 新建空白层",   ja: "+ 空白層追加" },
  newCat:        { zh: "+ 新建分类...",  ja: "+ 新規カテゴリー..." },
  // 视图 / 过滤
  viewList:      { zh: "📋 列表",        ja: "📋 リスト" },
  viewMatrix:    { zh: "📊 矩阵",        ja: "📊 マトリックス" },
  viewFlat:      { zh: "📋 全部配方",    ja: "📋 全レシピ" },
  viewFamily:    { zh: "🏷 家族模式",    ja: "🏷 ファミリー表示" },
  viewDetail:    { zh: "📖 详细",        ja: "📖 詳細" },
  viewRecipe:    { zh: "📘 配方",        ja: "📘 レシピ" },
  viewMenu:      { zh: "📗 菜单",        ja: "📗 メニュー" },
  // 页面标题 / 状态
  saved:         { zh: "✓ 已保存",       ja: "✓ 保存済み" },
  empty:         { zh: "暂无内容",       ja: "まだありません" },
  // 区块标题
  ingredients:   { zh: "原材料",         ja: "原材料" },
  steps:         { zh: "制作流程",       ja: "作り方" },
  notes:         { zh: "备注",           ja: "メモ" },
  images:        { zh: "图片",           ja: "画像" },
  tags:          { zh: "标签",           ja: "タグ" },
  flavorTag:     { zh: "🏷 风味标签（可选）", ja: "🏷 風味タグ（任意）" },
  scale:         { zh: "缩放计算",       ja: "スケール計算" },
};

// 简短访问
const tr = (key, lang) => (I18N[key] ? (lang === "zh" ? I18N[key].zh : I18N[key].ja) : key);

// ─── 共用样式生成器 ─────────────
const styles = {
  // 卡片
  card: {
    background: T.bgCard,
    border: `0.5px solid ${T.border}`,
    borderRadius: T.radiusLg,
    padding: "1.25rem 1.5rem",
    marginBottom: "1rem",
  },
  cardHover: {
    background: T.bgCard,
    border: `0.5px solid ${T.border}`,
    borderRadius: T.radiusLg,
    padding: "1rem 1.25rem",
    marginBottom: "0.625rem",
    cursor: "pointer",
    transition: "transform 0.12s, border-color 0.12s, box-shadow 0.15s",
  },

  // 输入框
  input: {
    width: "100%",
    padding: "8px 12px",
    fontSize: 13,
    border: `0.5px solid ${T.border}`,
    borderRadius: T.radiusSm,
    background: T.bgCard,
    color: T.textPrimary,
    fontFamily: T.fontSans,
    boxSizing: "border-box",
    transition: "border-color 0.12s",
  },

  // 按钮
  btnPrimary: {
    background: T.brand,
    color: T.bgApp,
    padding: "8px 18px",
    borderRadius: T.radiusSm,
    border: "none",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: T.fontSans,
    transition: "opacity 0.12s, transform 0.1s",
    letterSpacing: "0.2px",
  },
  btnSecondary: {
    background: T.bgCard,
    color: T.brand,
    padding: "7px 16px",
    borderRadius: T.radiusSm,
    border: `0.5px solid ${T.border}`,
    fontSize: 13,
    fontWeight: 400,
    cursor: "pointer",
    fontFamily: T.fontSans,
    transition: "border-color 0.12s, background 0.12s",
  },

  // 标签 pill
  pill: (bg, color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: bg,
    color: color,
    padding: "3px 11px",
    borderRadius: T.radiusPill,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.2px",
    whiteSpace: "nowrap",
  }),

  // 标题
  h1Serif: {
    fontFamily: T.fontSerif,
    fontSize: 28,
    fontWeight: 500,
    color: T.brand,
    letterSpacing: "-0.3px",
    lineHeight: 1.2,
  },
  h2Serif: {
    fontFamily: T.fontSerif,
    fontSize: 22,
    fontWeight: 500,
    color: T.brand,
    letterSpacing: "-0.2px",
  },
  h3Sans: {
    fontFamily: T.fontSans,
    fontSize: 16,
    fontWeight: 500,
    color: T.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: T.textTertiary,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginTop: 4,
  },

  // 首字母徽章
  avatar: (letter, bgColor = T.bgSoft, textColor = T.accent) => ({
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: bgColor,
    color: textColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: T.fontSerif,
    fontSize: 17,
    fontStyle: "italic",
    flexShrink: 0,
  }),
};

// 五个盆 · 五色取自不同色相区（朱 / 青緑 / 黄土 / 群青 / 紫），明度都压在 32–42% 之间：
// 打印转灰度后仍有 3 档以上差别，红绿色觉障碍下也能靠明度区分。
// 盆色只用在 3px 竖条、6px 圆点和组标签文字，不做填充。
const GROUPS = {
  bowl1: { zh: "①盆", ja: "①ボウル", fr: "①Bol",           bg: "transparent", border: "#B0442F", label: "①", labelBorder: "#B0442F", labelColor: "#B0442F" },
  bowl2: { zh: "②盆", ja: "②ボウル", fr: "②Bol",           bg: "transparent", border: "#2F5D50", label: "②", labelBorder: "#2F5D50", labelColor: "#2F5D50" },
  bowl3: { zh: "③盆/锅", ja: "③ボウル/鍋", fr: "③Bol/Casserole", bg: "transparent", border: "#9A7B2E", label: "③", labelBorder: "#9A7B2E", labelColor: "#9A7B2E" },
  bowl4: { zh: "④盆", ja: "④ボウル", fr: "④Bol",           bg: "transparent", border: "#3B4E8C", label: "④", labelBorder: "#3B4E8C", labelColor: "#3B4E8C" },
  bowl5: { zh: "⑤盆", ja: "⑤ボウル", fr: "⑤Bol",          bg: "transparent", border: "#6E3E6B", label: "⑤", labelBorder: "#6E3E6B", labelColor: "#6E3E6B" },
  none:  { zh: "未分组", ja: "未分類", fr: "—",              bg: "transparent", border: "transparent", label: "", labelBorder: "transparent", labelColor: "#77776E" },
};

const GROUP_ORDER = ["bowl1", "bowl2", "bowl3", "bowl4", "bowl5", "none"];

// 手机底栏固定这 4 个高频 tab（+ 第 5 格是「更多」）；
// 其余 5 个（采购 / 组合蛋糕 / 知识库 / 供货商 / 数据）收进「更多」全屏抽屉。
const MOBILE_NAV = ["list", "components", "products", "materialsPedia"];

// 配料表列宽：名称(吃剩余) / 用量 / 品牌 / 成本。
// 只在这里定义一次，表头 · 数据行 · 汇总条三处共用（原先在两个地方各写了一遍，改一处漏一处）
const ING_COLS = "1fr 96px 132px 88px";

// ───────────── 组件类别（用于仓库分类 & 组合蛋糕的层结构）─────────────
// 分类标签型：灰底(sunken) + 色点。bg 一律 sunken，颜色只出现在圆点上。
const COMPONENT_CATEGORIES = [
  { id: "base",     zh: "基础组件",        ja: "ベース",          color: "#77776E", bg: "#F2F2EC" },
  { id: "biscuit",   zh: "生地・底",        ja: "生地・土台",     color: "#9A7B2E", bg: "#F2F2EC" },
  { id: "mousse",    zh: "慕斯・奶油",      ja: "ムース・クリーム", color: "#7A4E9C", bg: "#F2F2EC" },
  { id: "jelly",     zh: "果冻・果酱",      ja: "ジュレ・コンフィ", color: "#C1583D", bg: "#F2F2EC" },
  { id: "accent",    zh: "脆片・口感重点",   ja: "アクセント",      color: "#35785C", bg: "#F2F2EC" },
  { id: "glaze",     zh: "淋面・酱汁",      ja: "グラサージュ",    color: "#A6363F", bg: "#F2F2EC" },
  { id: "decor",     zh: "装饰",            ja: "デコレーション",   color: "#4E7591", bg: "#F2F2EC" },
  { id: "other",     zh: "其他",            ja: "その他",         color: "#7B4A1E", bg: "#F2F2EC" },
];

// 共享 8 色池：自定义组件分类 与 产品家族 共用（原先两张表有 7 组完全重复）
const PALETTE_8 = [
  { color: "#B0442F", bg: "#FFFFFF" },
  { color: "#2F5D50", bg: "#FFFFFF" },
  { color: "#9A7B2E", bg: "#FFFFFF" },
  { color: "#3B4E8C", bg: "#FFFFFF" },
  { color: "#6E3E6B", bg: "#FFFFFF" },
  { color: "#4E7591", bg: "#FFFFFF" },
  { color: "#7B4A1E", bg: "#FFFFFF" },
  { color: "#2F7F7A", bg: "#FFFFFF" },
];
const CUSTOM_CAT_COLORS = PALETTE_8;

// 全局变量，由 App 组件注入
let _customCompCats = [];
const setCustomCompCatsForLookup = (cats) => { _customCompCats = cats || []; };

// ═══════════════════════════════════════════════════════════════
// 💱 币种与汇率 (v17)
// 老数据(1802 条材料 / 24 条本店原料 / 52 条手写单价)实测 100% 是日元,
// 所以「没有 currency 字段」就等于 JPY —— 不写迁移函数,不改老数据一个字节。
// 新建的默认 CNY(店在北京 798,采购是人民币)。
// 成本链统一在出口折成人民币:getMaterialEffectivePrice 返回的就是 CNY/g,
// 下游 18 个调用点(配方成本 / 组件 / 商品毛利)一行都不用改。
// 显示单价则保留原币种 + 折算参考值,见 fmtUnitPrice。
// ═══════════════════════════════════════════════════════════════
const DEFAULT_FX_JPY_CNY = 0.048;   // 1 日元 ≈ 多少人民币(可在数据 tab 改)
let _fxJpyToCny = DEFAULT_FX_JPY_CNY;
const setFxForLookup = (r) => { const n = parseFloat(r); _fxJpyToCny = (!isNaN(n) && n > 0) ? n : DEFAULT_FX_JPY_CNY; };
const getFx = () => _fxJpyToCny;
// 一条记录(材料 / 本店原料 / 配料)的币种;无字段 = 老数据 = 日元
const curOf = (o) => (o && o.currency === "CNY") ? "CNY" : "JPY";
// 把任意币种的金额折成人民币
const toCNY = (v, currency) => {
  const n = parseFloat(v);
  if (isNaN(n) || n <= 0) return 0;
  return currency === "CNY" ? n : n * _fxJpyToCny;
};

// v17: 单价显示口径 —— 存的是每克价,给人看的是每 100g。
// 人民币下 ¥/g 全是 0.008 这种读不动的小数,×100 之后面粉 0.8 / 黄油 13 / 杏仁粉 22。
// 人民币写「¥」、日元写「円」—— 两个符号刻意长得不一样,扫一眼列表就知道
// 哪条还是日本老数据(待换国内货源),不用点进去看。
const per100 = (pricePerG) => {
  const n = parseFloat(pricePerG);
  if (isNaN(n) || n <= 0) return "";
  return String(Math.round(n * 100 * 100) / 100);
};
// 售价的币种。跟材料价同一条规矩:没字段 = 老数据 = 日元。
// (老配方里写的 450 是东京时期定的 450 円,不是 450 元 —— 不折算的话利润率会虚高到 99%)
const priceCurOf = (o) => (o && o.priceCurrency === "CNY") ? "CNY" : "JPY";
// 售价显示:保留原币种原值,不折算(定价是定价,不是估算)
const fmtSellPrice = (v, o) => {
  const n = parseFloat(v);
  if (isNaN(n) || n <= 0) return "";
  return priceCurOf(o) === "CNY" ? `¥${n.toLocaleString()}` : `${n.toLocaleString()}円`;
};
// 售价旁边的币种切换,一个字宽
const priceCurBtn = (obj, onToggle, lang) => (
  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(priceCurOf(obj) === "CNY" ? "JPY" : "CNY"); }}
    title={lang === "zh" ? "售价的币种,点一下切换" : "販売価の通貨を切替"}
    style={{ marginLeft: 6, padding: "0 5px", fontSize: 11, lineHeight: 1.4, cursor: "pointer", verticalAlign: "middle",
      background: priceCurOf(obj) === "CNY" ? "transparent" : "#FEF3C7",
      border: `0.5px solid ${priceCurOf(obj) === "CNY" ? T.border : "#F59E0B"}`, borderRadius: 3,
      color: priceCurOf(obj) === "CNY" ? T.textSecondary : "#92400E" }}>
    {priceCurOf(obj) === "CNY" ? "¥" : "円"}
  </button>
);

// opts.approx: 日元时附上按当前汇率折出的人民币参考值
const fmtUnitPrice = (pricePerG, currency, opts = {}) => {
  const v = per100(pricePerG);
  if (!v) return "";
  if (curOf({ currency }) === "CNY") return `¥${v}/100g`;
  const head = `${v}円/100g`;
  if (!opts.approx) return head;
  const cny = Math.round(parseFloat(v) * _fxJpyToCny * 100) / 100;
  return cny > 0 ? `${head} ≈¥${cny}` : head;
};

// v11: 全局 shopMaterials lookup（复用 _customCompCats 的注入模式）
// 这样所有 price helper 不用在 props 里多带一层 shopMaterials 参数
let _shopMaterials = [];
const setShopMaterialsForLookup = (sm) => {
  _shopMaterials = Array.isArray(sm) ? sm : [];
};

// v11: 返回 material 的"有效价"
// 优先级: ① 本店原料 shopMaterials.pricePerG → ② materials.priceRange.mid → ③ materials.pricePerG(兼容老字段)
// v17: 出口统一折成 **人民币/g** —— 每条按自己的 currency 折,日元材料和人民币材料
// 可以混在同一个配方里算成本。要拿原币种原值请直接读字段,别用这个函数。
const getMaterialEffectivePrice = (m) => {
  if (!m) return 0;
  if (m.id) {
    const sm = _shopMaterials.find(s => s && s.materialId === m.id);
    if (sm && sm.pricePerG) {
      const p = toCNY(sm.pricePerG, curOf(sm));
      if (p > 0) return p;
    }
  }
  if (m.priceRange && m.priceRange.mid) {
    const p = toCNY(m.priceRange.mid, curOf(m));
    if (p > 0) return p;
  }
  return toCNY(m.pricePerG, curOf(m));
};

// v17: 材料的"原币种 + 原值"(¥/g),给 UI 显示单价用(不折算)
// 返回 { price, currency, source } — source 同 getMaterialPriceSource
const getMaterialRawPrice = (m) => {
  if (!m) return { price: 0, currency: "JPY", source: "none" };
  if (m.id) {
    const sm = _shopMaterials.find(s => s && s.materialId === m.id);
    const p = parseFloat(sm && sm.pricePerG);
    if (!isNaN(p) && p > 0) return { price: p, currency: curOf(sm), source: "shop" };
  }
  const mid = parseFloat(m.priceRange && m.priceRange.mid);
  if (!isNaN(mid) && mid > 0) return { price: mid, currency: curOf(m), source: "ref" };
  const legacy = parseFloat(m.pricePerG);
  if (!isNaN(legacy) && legacy > 0) return { price: legacy, currency: curOf(m), source: "ref" };
  return { price: 0, currency: curOf(m), source: "none" };
};

// v11: 从 ingredient 维度返回价格来源,给配方视图渲染标签用
// "shop" 本店价 / "ref" 百科参考价 / "manual" 手写 / "none" 无价
const getIngPriceSource = (ing, materials) => {
  if (!ing) return "none";
  if (ing.materialId && Array.isArray(materials)) {
    const m = materials.find(x => x.id === ing.materialId);
    if (m) {
      const src = getMaterialPriceSource(m);
      if (src !== "none") return src;
    }
  }
  const up = parseFloat(ing && ing.unitPrice);
  if (!isNaN(up) && up > 0) return "manual";
  return "none";
};

// v11: 返回价格来源标识,给 UI 渲染 🏷️/📖/⚠️ 用
// "shop" = 本店原料, "ref" = 百科参考价, "none" = 无价
const getMaterialPriceSource = (m) => {
  if (!m) return "none";
  if (m.id) {
    const sm = _shopMaterials.find(s => s && s.materialId === m.id);
    if (sm && sm.pricePerG) {
      const p = parseFloat(sm.pricePerG);
      if (!isNaN(p) && p > 0) return "shop";
    }
  }
  if (m.priceRange && m.priceRange.mid) {
    const p = parseFloat(m.priceRange.mid);
    if (!isNaN(p) && p > 0) return "ref";
  }
  if (m.pricePerG) {
    const p = parseFloat(m.pricePerG);
    if (!isNaN(p) && p > 0) return "ref";
  }
  return "none";
};

const getAllCompCats = () => [...COMPONENT_CATEGORIES, ..._customCompCats];
const getCompCat = (id) => getAllCompCats().find(c => c.id === id) || COMPONENT_CATEGORIES[COMPONENT_CATEGORIES.length - 1];

// ═══════════════════════════════════════════════════════════════
// 🏷 风味标签分类系统（用于组件研发管理）
// ═══════════════════════════════════════════════════════════════
const FLAVOR_FAMILIES = [
  // 15 族按色相环顺时针排布，相邻两族至少差 22° 色相；饱和度统一压在 45–70%，
  // 所以 15 个摆在一起不吵。用在圆点和 1px 描边上，标签底色永远是 surface(白)。
  { id: "fruit_red",    emoji: "🍓", zh: "红果类",   ja: "赤果実",   color: "#A6363F", bg: "#FFFFFF", flavors: ["草莓", "覆盆子", "樱桃", "红醋栗"] },
  { id: "fruit_black",  emoji: "🫐", zh: "黑浆果",   ja: "黒ベリー", color: "#8F3F72", bg: "#FFFFFF", flavors: ["黑莓", "蓝莓", "黑醋栗"] },
  { id: "fruit_citrus", emoji: "🍊", zh: "柑橘类",   ja: "柑橘",     color: "#C97A17", bg: "#FFFFFF", flavors: ["柠檬", "橙子", "柚子", "葡萄柚", "佛手柑"] },
  { id: "fruit_stone",  emoji: "🍑", zh: "核果类",   ja: "核果",     color: "#C1583D", bg: "#FFFFFF", flavors: ["白桃", "杏", "李子", "樱桃"] },
  { id: "fruit_tropical",emoji:"🥭", zh: "热带水果", ja: "トロピカル", color:"#C9A020", bg:"#FFFFFF", flavors: ["芒果", "百香果", "菠萝", "椰子", "荔枝", "香蕉"] },
  { id: "fruit_other",  emoji: "🍎", zh: "其他水果", ja: "その他果物", color:"#5F7F35",bg:"#FFFFFF", flavors: ["苹果", "梨", "葡萄", "无花果"] },
  { id: "nut",          emoji: "🌰", zh: "坚果类",   ja: "ナッツ",   color: "#857A45", bg: "#FFFFFF", flavors: ["开心果", "杏仁", "榛子", "核桃", "松子", "碧根果"] },
  { id: "chocolate",    emoji: "🍫", zh: "巧克力",   ja: "チョコ",   color: "#5C3A2C", bg: "#FFFFFF", flavors: ["黑巧", "牛奶巧", "白巧", "金巧 Dulcey", "Ruby"] },
  { id: "floral",       emoji: "🌸", zh: "花香类",   ja: "花",       color: "#7A4E9C", bg: "#FFFFFF", flavors: ["玫瑰", "紫罗兰", "橙花", "茉莉", "薰衣草"] },
  { id: "tea",          emoji: "🍵", zh: "茶类",     ja: "茶",       color: "#35785C", bg: "#FFFFFF", flavors: ["抹茶", "焙茶", "煎茶", "伯爵", "乌龙", "红茶", "白茶"] },
  { id: "dairy",        emoji: "🧈", zh: "乳脂糖类", ja: "乳脂・糖", color: "#9C7128", bg: "#FFFFFF", flavors: ["香草", "焦糖", "蜂蜜", "奶酪", "酸奶油", "枫糖"] },
  { id: "coffee",       emoji: "☕", zh: "咖啡可可", ja: "コーヒー", color: "#7B4A1E", bg: "#FFFFFF", flavors: ["咖啡", "摩卡", "瑰夏", "耶加雪菲", "可可果"] },
  { id: "spice",        emoji: "🌿", zh: "香料药草", ja: "スパイス", color: "#2F7F7A", bg: "#FFFFFF", flavors: ["肉桂", "豆蔻", "茴香", "薄荷", "罗勒", "黑胡椒", "柠檬草"] },
  { id: "vegetable",    emoji: "🥕", zh: "蔬菜类",   ja: "野菜",     color: "#4A5A9B", bg: "#FFFFFF", flavors: ["甜菜根", "胡萝卜", "南瓜", "红薯", "玉米"] },
  { id: "other",        emoji: "🔸", zh: "其他",     ja: "その他",   color: "#77776E", bg: "#FFFFFF", flavors: [] },
];

const getFlavorFamily = (id) => FLAVOR_FAMILIES.find(f => f.id === id) || FLAVOR_FAMILIES[FLAVOR_FAMILIES.length - 1];

// ─── 矩阵视图的 Cell 子组件 ────────────────────────────
// 处理：单组件点击、多组件弹出展开、空白创建
function MatrixCell({ cellComps, fam, ct, lang, onViewComponent, onCreateNew }) {
  const [expanded, setExpanded] = useState(false);
  const wrapRef = useRef(null);
  const count = cellComps.length;

  // 点击外部关闭
  useEffect(() => {
    if (!expanded) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  // 空白格
  if (count === 0) {
    return (
      <button
        onClick={onCreateNew}
        title={lang === "zh" ? "点击创建此风味 × 食感的组件" : "このコンポーネントを新規作成"}
        style={{
          background: "transparent",
          color: "#B8A38B",
          padding: "10px 8px",
          border: "1px dashed #B8A38B",
          borderRadius: 6,
          fontSize: 11,
          cursor: "pointer",
          width: "100%",
          minHeight: 36,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#AC6B3A";
          e.currentTarget.style.color = "#AC6B3A";
          e.currentTarget.style.background = "#FBF0E0";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#B8A38B";
          e.currentTarget.style.color = "#B8A38B";
          e.currentTarget.style.background = "transparent";
        }}
      >
        +
      </button>
    );
  }

  // 热度：3+ 为深色
  const isHot = count >= 3;
  const cellBg = isHot ? "#D4A574" : "#F0E8D4";
  const cellBorder = isHot ? "#AC6B3A" : "#D4A574";
  const cellColor = isHot ? "#2D1B0E" : fam.color;

  // 单组件 — 直接跳转
  if (count === 1) {
    const c = cellComps[0];
    const shortName = (c.nameZh || c.nameJa || "?").slice(0, 5);
    return (
      <button
        onClick={() => onViewComponent(c.id)}
        title={c.nameZh || c.nameJa}
        style={{
          background: cellBg,
          color: cellColor,
          padding: "8px 6px",
          borderRadius: 6,
          fontSize: 10,
          border: `0.5px solid ${cellBorder}`,
          cursor: "pointer",
          fontWeight: 500,
          width: "100%",
          minHeight: 36,
          lineHeight: 1.3,
          fontFamily: "Georgia, serif",
          transition: "transform 0.12s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {shortName}
      </button>
    );
  }

  // 多组件 — 展开列表
  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block", width: "100%" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: cellBg,
          color: cellColor,
          padding: "8px 6px",
          borderRadius: 6,
          fontSize: 11,
          border: `0.5px solid ${cellBorder}`,
          cursor: "pointer",
          fontWeight: 500,
          width: "100%",
          minHeight: 36,
          fontFamily: "Georgia, serif",
          transition: "transform 0.12s",
        }}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.transform = "scale(1.05)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {count} ↓
      </button>
      {expanded && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#FFFFFF",
          border: "0.5px solid #EDE4D0",
          borderRadius: 8,
          boxShadow: "0 4px 20px rgba(45,27,14,0.15)",
          padding: 6,
          zIndex: 50,
          minWidth: 180,
          maxWidth: 240,
          textAlign: "left",
        }}>
          <div style={{ fontSize: 10, color: "#9B7E5F", padding: "4px 8px", letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: "0.5px solid #EDE4D0", marginBottom: 4 }}>
            {fam.emoji} {lang === "zh" ? fam.zh : fam.ja} × {lang === "zh" ? ct.zh : ct.ja}
          </div>
          {cellComps.map(c => (
            <button
              key={c.id}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
                onViewComponent(c.id);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "6px 10px",
                background: "transparent",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                color: "#2D1B0E",
                cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F5ECD8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
                {lang === "zh" ? (c.nameZh || c.nameJa) : (c.nameJa || c.nameZh)}
              </span>
              {c.flavorName && (
                <span style={{ color: "#9B7E5F", marginLeft: 6, fontSize: 11 }}>· {c.flavorName}</span>
              )}
            </button>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
              onCreateNew();
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "6px 10px",
              background: "transparent",
              border: "none",
              borderTop: "0.5px dashed #EDE4D0",
              marginTop: 4,
              fontSize: 11,
              color: "#9B7E5F",
              cursor: "pointer",
              fontFamily: "system-ui, sans-serif",
              fontStyle: "italic",
            }}
          >
            + {lang === "zh" ? "再加一个" : "もう一つ追加"}
          </button>
        </div>
      )}
    </div>
  );
}


const FINANCIER = {
  id: 1001,
  nameZh: "费南雪", nameJa: "フィナンシェ", nameFr: "Financier",
  category: "焼き菓子",
  mold: "三能 SN1648（25連）",
  yield: 25, unit: "個",
  time: 60, temp: "190°C", baketime: "10分 → 反転 → 4分",
  price: 0, difficulty: "★★ 普通",
  storage: "常温3日・冷凍1ヶ月",
  allergens: "小麦・卵・乳・ナッツ",
  notesZh: `【试作计划・改良备忘】

━━━━━━━━━━━━━━━━━━━━
◆ 目标
━━━━━━━━━━━━━━━━━━━━
甘香扑鼻・外壳焦脆・内部湿软
→ 定位：住宅区日常需求・伴手礼

━━━━━━━━━━━━━━━━━━━━
◆ 试作项目（按优先级排列）
━━━━━━━━━━━━━━━━━━━━

【优先级★★★】烘烤温度曲线改良
现状：190°C 10分→反转→4分
试作A：200°C 8分→反转→180°C 4分（高温短时间形成外壳）
试作B：200°C 10分→170°C 5分→200°C 1〜2分（最后高温干燥收尾）
UNOX使用时：最后1〜2分用干燥模式（排出蒸气）让外壳更脆

【优先级★★★】冷却・包装流程确立
- 出炉后立即脱模
- 放在网架上摊开用风扇吹（强制排出蒸气）
- 完全冷却60分钟后再个包装
- 必须配硅胶干燥剂（单靠脱氧剂无法防止外壳回潮）

【优先级★★】黄油配比对比
A：全量モンテギューAOP（香气最强・成本高）
B：よつ葉50%＋モンテギュー50%（现状）
C：よつ葉70%＋モンテギュー30%（偏向成本）
→ 确认香气・成本・利润率的平衡

【优先级★★】保湿原料重新审视
现状：トレハ30g・ハローデックス20g・パサツカネーゼ1g・きび糖40g
→ 保湿4种原料重叠，可能与外壳酥脆矛盾
试作：
- トレハ30g→减为20g
- 去掉パサツカネーゼ（对比3〜7天后的湿润度）
- グラニュー糖200g→增至210g（提升焦糖化）
- 卵白260g→减为250g（减少总水分）

【优先级★】泡打粉有无对比
有BP（现状）vs 无BP
→ 无BP时底面酥脆感更容易出

【优先级★】蛋白温度
湯煎40°C（现状）vs 35°C
→ 35°C乳化稳定性可能更高（4枚台等大量制作时尤其明显）

【优先级★】エクリチュール vs 薄力粉
现状：エクリチュール（中力粉）→ 口感扎实・耐放
试作：ドルチェ等薄力粉 → 轻盈松脆・口溶快
→ 选择更接近目标费南雪的那个

【优先级★】鲜蛋白 vs 冷冻蛋白
开店后为保证品质稳定，考虑使用冷冻蛋白

━━━━━━━━━━━━━━━━━━━━
◆ 价格战略（住宅区日常需求定位）
━━━━━━━━━━━━━━━━━━━━
单品：¥280〜300（引导每周回购）
6个装：¥1,980〜2,200（伴手礼・小礼品）
12个装：¥3,800〜4,200（节日・送礼）
→ 最优先考虑「每周都买得起」的价格
→ 通过品质稳定・季节限定口味・礼盒销售提升客单价

━━━━━━━━━━━━━━━━━━━━
◆ 重要注意事项
━━━━━━━━━━━━━━━━━━━━
・外壳酥脆的保持单靠配方不可能实现，需要配方・烘烤・冷却・包装的综合设计
・趁热个包装是绝对禁忌（外壳瞬间死掉）
・配方改动必须一项一项来，确认效果后再改下一项
・试作结果随时补充到下方记录栏

━━━━━━━━━━━━━━━━━━━━
◆ 试作记录栏（日期・变更点・结果）
━━━━━━━━━━━━━━━━━━━━
（每次试作后在此追加）
`,
  notesJa: `【試作計画・改良メモ】

━━━━━━━━━━━━━━━━━━━━
◆ 目標
━━━━━━━━━━━━━━━━━━━━
甘い香り・外は焦がれるように香ばしく脆く・中はしっとり柔らか
→ ポジション：住宅街の日常需要・手土産

━━━━━━━━━━━━━━━━━━━━
◆ 試作項目（優先順位順）
━━━━━━━━━━━━━━━━━━━━

【優先度★★★】焼成プロファイル改良
現状：190°C 10分→反転→4分
試作A：200°C 8分→反転→180°C 4分（高温短時間で外壳形成）
試作B：200°C 10分→170°C 5分→200°C 1〜2分（最後の高温で乾燥仕上げ）
UNOX使用時：最後1〜2分を乾燥モード（蒸気排出）で外壳パリッと

【優先度★★★】冷却・包装プロトコル確立
- 焼き上がり即時型から外す
- 網上で広げ扇風機送風（蒸気を強制排出）
- 完全冷却60分後に個包装
- シリカゲル併用必須（脱酸素剤だけでは外壳湿気防げない）

【優先度★★】バター配合比較
A：全量モンテギューAOP（香り最強・コスト高）
B：よつ葉50%＋モンテギュー50%（現状）
C：よつ葉70%＋モンテギュー30%（コスト寄り）
→ 香り・コスト・利润率のバランス確認

【優先度★★】保湿原料の見直し
現状：トレハ30g・ハローデックス20g・パサツカネーゼ1g・きび糖40g
→ 保湿4原料が重複、外壳脆さと矛盾する可能性
試作：
- トレハ30g→20gに減量
- パサツカネーゼ外す（3〜7日後のしっとり比較）
- グラニュー糖200g→210g（焦糖化UP）
- 卵白260g→250g（水分総量減）

【優先度★】BP有無比較
BPあり（現状）vs なし
→ なしの場合、底面のサクッと食感が出やすい

【優先度★】卵白温度
湯煎40°C（現状）vs 35°C
→ 35°Cのほうが乳化安定性高い可能性（4枚台など大量時特に）

【優先度★】エクリチュール vs 薄力粉
現状：エクリチュール（中力粉）→ しっかり食感・日持ち◎
試作：ドルチェ等薄力粉 → 軽くさっくり・口溶け早い
→ 目指すフィナンシェに近いほうを選択

【優先度★】生卵白 vs 冷凍卵白
開店後の品質安定化のため冷凍卵白の検討

━━━━━━━━━━━━━━━━━━━━
◆ 価格戦略（住宅街日常需要）
━━━━━━━━━━━━━━━━━━━━
単品：¥280〜300（週1リピート誘導）
6個箱：¥1,980〜2,200（手土産・プチギフト）
12個箱：¥3,800〜4,200（節日・贈答）
→ 「毎週買える価格」を最優先
→ 品質安定・季節限定味・箱売り展開で客単価UP

━━━━━━━━━━━━━━━━━━━━
◆ 重要注意点
━━━━━━━━━━━━━━━━━━━━
・外壳脆さ保持は配方だけでは不可能、焼成・冷却・包装の総合設計が必要
・熱いうちの個包装は厳禁（外壳即死）
・配方変更は1項目ずつ、効果を確認してから次へ
・試作結果はこの配方のメモに随時追記

━━━━━━━━━━━━━━━━━━━━
◆ 試作記録欄（日付・変更点・結果）
━━━━━━━━━━━━━━━━━━━━
（試作のたびに追記）
`,
  ingredients: [
    // ①盆：全粉糖類 — 一起过筛、直接混合
    { nameZh: "杏仁粉（马可纳）", nameJa: "アーモンドパウダー（マルコナ）", nameFr: "Poudre d'amandes (Marcona)", qty: 110, unit: "g", brand: "マルコナ", unitPrice: 2.20, cost: 242, group: "bowl1" },
    { nameZh: "中力粉", nameJa: "エクリチュール（中力粉）", nameFr: "Farine mi-forte (Écriture)", qty: 110, unit: "g", brand: "エクリチュール", unitPrice: 0.35, cost: 39, group: "bowl1" },
    { nameZh: "细砂糖", nameJa: "グラニュー糖", nameFr: "Sucre semoule", qty: 200, unit: "g", brand: "", unitPrice: 0.37, cost: 74, group: "bowl1" },
    { nameZh: "海藻糖", nameJa: "トレハロース", nameFr: "Tréhalose", qty: 30, unit: "g", brand: "", unitPrice: 1.20, cost: 36, group: "bowl1" },
    { nameZh: "黄砂糖", nameJa: "きび糖", nameFr: "Sucre de canne non raffiné", qty: 40, unit: "g", brand: "", unitPrice: 0.60, cost: 24, group: "bowl1" },
    { nameZh: "盐（格朗德）", nameJa: "ゲランドの塩", nameFr: "Sel de Guérande", qty: 1, unit: "g", brand: "ゲランド", unitPrice: 0.80, cost: 1, group: "bowl1" },
    { nameZh: "泡打粉", nameJa: "ベーキングパウダー", nameFr: "Levure chimique", qty: 1, unit: "g", brand: "", unitPrice: 1.00, cost: 1, group: "bowl1" },
    { nameZh: "防老化酵素剂", nameJa: "パサツカネーゼ", nameFr: "Enzyme anti-rassissement", qty: 1, unit: "g", brand: "パサツカネーゼ", unitPrice: 15.00, cost: 15, group: "bowl1",
      note: "高温高糖度でも作用する酵素製剤。老化防止・しっとり感持続。小麦粉100に対し1%使用。" },
    // ②盆：液体類 — 一起湯煎至40°C
    { nameZh: "蛋白", nameJa: "卵白", nameFr: "Blancs d'œufs", qty: 260, unit: "g", brand: "", unitPrice: 0.40, cost: 104, group: "bowl2" },
    { nameZh: "転化糖浆", nameJa: "ハローデックス（転化糖）", nameFr: "Sucre inverti (Halodex)", qty: 20, unit: "g", brand: "ナガセ", unitPrice: 3.50, cost: 70, group: "bowl2" },
    { nameZh: "香草精", nameJa: "バニラエクストラクト", nameFr: "Extrait de vanille", qty: 2, unit: "g", brand: "", unitPrice: 8.00, cost: 16, group: "bowl2" },
    // ③锅：油脂類 — 合并焦化
    { nameZh: "发酵黄油（四叶）", nameJa: "発酵バター（よつ葉）", nameFr: "Beurre fermenté (Yotsuba)", qty: 160, unit: "g", brand: "よつ葉", unitPrice: 2.20, cost: 352, group: "bowl3" },
    { nameZh: "发酵黄油（蒙特古AOP）", nameJa: "モンテギューAOP発酵バター", nameFr: "Beurre AOP Montaigu", qty: 160, unit: "g", brand: "モンテギュー", unitPrice: 3.50, cost: 560, group: "bowl3" },
  ],
  stepsZh: [
    "【①】将所有①盆材料混合过筛，搅拌机低速搅拌均匀",
    "【②】将所有②盆材料混合，隔水加热至40°C。加入到①中用橡皮刮刀拌匀",
    "【③】两种黄油合并加热制成焦化黄油。冷却至80°C后，分3次加入到①②的面糊中充分乳化",
    "直接入型至三能SN1648模具，190°C烘烤10分钟。反转后继续烘烤约4分钟，让焦色均匀",
  ],
  stepsJa: [
    "【①】全材料を合わせて過篩し、ミキサー低速で均一に混合する",
    "【②】全材料を合わせ湯煎で40°Cに温める。①に加えてゴムベラで均一に混合する",
    "【③】両バターを合わせて加熱し焦がしバターにする。80°Cまで冷却したら①②の生地に3回に分けて加え、充分に乳化させる",
    "三能 SN1648に直接入型し、190°C・10分焼成。反転して約4分追加焼成し均一な焼き色をつける",
  ],
  totalCost: 1533, unitCost: 61.3, margin: 0,
  updatedAt: new Date().toISOString(),
};

const DEFAULT_CATS = [
  { id: "c1", nameZh: "杏仁粉", nameJa: "アーモンドパウダー", unit: "g", brands: [{ nameZh: "马可纳", nameJa: "マルコナ", price: "2.80" }, { nameZh: "马略卡", nameJa: "マジョルカ", price: "2.20" }, { nameZh: "共立食品", nameJa: "共立食品", price: "1.60" }] },
  { id: "c2", nameZh: "发酵黄油", nameJa: "発酵バター", unit: "g", brands: [{ nameZh: "四叶", nameJa: "よつ葉", price: "2.20" }, { nameZh: "蒙特古 AOP", nameJa: "モンテギュー AOP", price: "3.50" }, { nameZh: "可尔必思", nameJa: "カルピス", price: "2.50" }] },
  { id: "c3", nameZh: "低筋粉", nameJa: "薄力粉", unit: "g", brands: [{ nameZh: "多尔切（日清）", nameJa: "ドルチェ（日清）", price: "0.40" }, { nameZh: "紫罗兰（日清）", nameJa: "バイオレット（日清）", price: "0.32" }] },
  { id: "c4", nameZh: "鲜奶油35%", nameJa: "生クリーム35%", unit: "g", brands: [{ nameZh: "四叶35%", nameJa: "よつ葉35%", price: "1.40" }, { nameZh: "高梨35%", nameJa: "タカナシ35%", price: "1.20" }] },
  { id: "c5", nameZh: "细砂糖", nameJa: "グラニュー糖", unit: "g", brands: [{ nameZh: "日新制糖", nameJa: "日新製糖", price: "0.38" }, { nameZh: "三井制糖", nameJa: "三井製糖", price: "0.35" }] },
];

// 老数据迁移：把 { name } → { nameZh: "", nameJa: name } 格式
const migrateCats = (cats) => {
  if (!Array.isArray(cats)) return [];
  return cats.map(c => {
    if (c.nameZh !== undefined || c.nameJa !== undefined) {
      // 已是新格式
      return {
        ...c,
        nameZh: c.nameZh || "",
        nameJa: c.nameJa || "",
        brands: (c.brands || []).map(b => (b.nameZh !== undefined || b.nameJa !== undefined)
          ? { nameZh: b.nameZh || "", nameJa: b.nameJa || "", price: b.price || "" }
          : { nameZh: "", nameJa: b.name || "", price: b.price || "" }
        ),
      };
    }
    // 老格式：name 字段当作日文名
    return {
      id: c.id,
      nameZh: "",
      nameJa: c.name || "",
      unit: c.unit || "g",
      brands: (c.brands || []).map(b => ({ nameZh: "", nameJa: b.name || "", price: b.price || "" })),
    };
  });
};

// 按当前语言获取大类显示名（fallback到另一语言）
const getCatName = (cat, lang) => {
  if (!cat) return "";
  const primary = lang === "zh" ? cat.nameZh : cat.nameJa;
  const fallback = lang === "zh" ? cat.nameJa : cat.nameZh;
  return primary || fallback || "";
};
const getBrandName = (brand, lang) => {
  if (!brand) return "";
  const primary = lang === "zh" ? brand.nameZh : brand.nameJa;
  const fallback = lang === "zh" ? brand.nameJa : brand.nameZh;
  return primary || fallback || "";
};

// ═══ v17 中文优先: 统一语言取值器 ═══
// 痛点根因: 全 app 散落数百处「lang==="zh" ? x.nameZh : x.nameJa」三元，
// 部分有回退、部分没有，切日文时未翻字段白屏。统一收拢到这三个 helper。
// 读取/渲染端用 pickLang/pickSteps；表单 value={} 绑定、导出 JSON 一律不用(见计划"读 vs 写")。

// 普通字段(name/title/notes/content/story): 当前语言空 → 回退另一语言 → 都空返回 ""
const pickLang = (obj, base, lang) => {
  if (!obj) return "";
  const primary = lang === "zh" ? obj[base + "Zh"] : obj[base + "Ja"];
  const fallback = lang === "zh" ? obj[base + "Ja"] : obj[base + "Zh"];
  return primary || fallback || "";
};

// steps 数组: 当前语言为空数组 → 回退另一语言 → 都空返回 []。兼容老数据 obj.steps
const pickSteps = (obj, lang) => {
  if (!obj) return [];
  const zh = (obj.stepsZh && obj.stepsZh.length) ? obj.stepsZh : (obj.steps || []);
  const ja = (obj.stepsJa && obj.stepsJa.length) ? obj.stepsJa : (obj.steps || []);
  const primary = lang === "zh" ? zh : ja;
  const fallback = lang === "zh" ? ja : zh;
  return (primary && primary.length) ? primary : ((fallback && fallback.length) ? fallback : []);
};

// 取「另一语言」原始值、不回退 — 专供双语并排的副行(否则回退会显示成「中文·中文」)
const rawLang = (obj, base, lang) => (obj && obj[base + (lang === "zh" ? "Ja" : "Zh")]) || "";

// 根据ing的catId/brandIdx，从cats里解析出当前绑定的大类和品牌
const resolveIngBinding = (ing, cats) => {
  if (!ing?.catId || !Array.isArray(cats)) return { cat: null, brand: null };
  const cat = cats.find(c => c.id === ing.catId);
  if (!cat) return { cat: null, brand: null };
  const bi = typeof ing.brandIdx === "number" ? ing.brandIdx : -1;
  const brand = bi >= 0 && cat.brands[bi] ? cat.brands[bi] : null;
  return { cat, brand };
};

// ═══ 新联动系统: 根据 ing.materialId 解析材料百科条目 ═══
const resolveIngMaterial = (ing, materials, brands) => {
  if (!ing?.materialId || !Array.isArray(materials)) return { material: null, brand: null };
  const material = materials.find(m => m.id === ing.materialId);
  if (!material) return { material: null, brand: null };
  const brand = Array.isArray(brands) ? brands.find(b => b.id === material.brandId) : null;
  return { material, brand };
};

// ═══ 智能匹配: 根据 ing 的名字/品牌在百科 materials 里找最佳匹配 ═══
// ─── 智能匹配 v13.1: 同义词归一化 + 百分比加成 + 品牌别名 ────────
// 同义词组: 仅合并明确等价的, 不合并有区分价值的(如强力粉/中力粉/薄力粉, 全卵/卵白/卵黄)
const SYNONYM_GROUPS = {
  cream: [
    "クリーム", "生クリーム", "純生クリーム", "純生", "ホイップ", "ホイップクリーム",
    "鲜奶油", "鮮奶油", "生奶油", "奶油", "动物性奶油", "動物性奶油",
    "cream", "creme", "crème"
  ],
  butter: [
    "バター", "黄油", "黃油", "発酵バター",
    "butter", "beurre"
  ],
  chocolate: [
    "チョコレート", "チョコ", "巧克力", "朱古力",
    "chocolate", "couverture", "クーベルチュール"
  ],
  sugar: [
    "グラニュー糖", "グラニュー", "上白糖", "细砂糖", "砂糖",
    "sucre", "sugar"
  ],
  egg: [
    "鸡蛋", "雞蛋", "全卵", "egg"
    // "卵" 太泛, 不进入归一化(卵白/卵黄需要保留区分)
  ],
};
const SYNONYM_MAP = (() => {
  const map = new Map();
  Object.entries(SYNONYM_GROUPS).forEach(([key, words]) => {
    words.forEach(w => map.set(w.toLowerCase(), key));
  });
  return map;
})();

// 抽取百分比 (e.g. "35%" / "35％" → 35)
const extractPercent = (s) => {
  if (!s) return null;
  const m = String(s).match(/(\d+(?:\.\d+)?)\s*[%％]/);
  return m ? parseFloat(m[1]) : null;
};

// 抽取材料的所有百分比信息: 名字里的 X% + parameters 里相关字段
const collectMaterialPercents = (m) => {
  const pcts = new Set();
  [m.nameZh, m.nameJa, m.nameFr].forEach(n => {
    const p = extractPercent(n);
    if (p != null) pcts.add(p);
  });
  if (m.parameters && typeof m.parameters === "object") {
    ["乳脂肪", "可可含量", "脂肪含量", "脂肪", "纯度", "粗蛋白", "灰分", "糖度", "酒精度"].forEach(k => {
      const p = extractPercent(m.parameters[k]);
      if (p != null) pcts.add(p);
    });
  }
  return pcts;
};

// 品牌名归一化: 去掉公司后缀方便别名匹配 ("中沢乳業" / "Nakazawa Dairy" / "中沢" 同视)
const normalizeBrandName = (s) => {
  if (!s) return "";
  return String(s).toLowerCase()
    .replace(/(乳業|製粉|製菓|株式会社|有限会社|株|co\.?|inc\.?|ltd\.?|gmbh|s\.a\.?|社|dairy)/g, "")
    .replace(/\s+/g, "")
    .trim();
};

// 返回 [{ score, material }], score 越高越准(0-100)
// 策略: 基于关键词重叠 + 同义词归一 + 百分比对照 + 品牌别名 (v13.1)
const smartMatchMaterial = (ing, materials, brands) => {
  if (!ing || !Array.isArray(materials) || materials.length === 0) return [];

  const clean = (s) => {
    if (!s) return "";
    return s.toLowerCase()
      .replace(/[\(（][^)）]*[\)）]/g, " ")
      .replace(/\d+(\.\d+)?\s*[%％]/g, " ")
      .replace(/\d+(\.\d+)?\s*(g|ml|kg|l|㍉)/g, " ")
      .replace(/[・·•/、,，\-—]/g, " ")
      .trim();
  };

  // 提取关键词 + 同义词归一化 (扩展原 token 集, 不替换原 token)
  const tokenize = (s) => {
    if (!s) return [];
    const cleaned = clean(s);
    const tokens = cleaned.match(/[一-龥]+|[゠-ヿ]+|[぀-ゟ]+|[a-z]+/gi) || [];
    const stopwords = new Set(["用", "the", "a", "an", "of", "for", "and", "or"]);
    const filtered = tokens
      .map(t => t.toLowerCase())
      .filter(t => !stopwords.has(t))
      .filter(t => {
        if (/^[一-龥぀-ゟ゠-ヿ]+$/.test(t)) return t.length >= 1;
        return t.length >= 2;
      });
    const expanded = [];
    filtered.forEach(t => {
      expanded.push(t);
      if (SYNONYM_MAP.has(t)) expanded.push(SYNONYM_MAP.get(t));
    });
    return expanded;
  };

  const tokenOverlap = (ingTokens, matTokens) => {
    if (ingTokens.length === 0 || matTokens.length === 0) return 0;
    const matSet = new Set(matTokens);
    const matCombined = matTokens.join("");
    let overlap = 0;
    // 用去重后的 ing tokens 计算分母, 避免同义词扩展导致虚假提分
    const ingDedup = Array.from(new Set(ingTokens));
    for (const t of ingDedup) {
      if (matSet.has(t)) { overlap += 1; continue; }
      let matched = false;
      for (const mt of matTokens) {
        if (mt.length >= 2 && t.length >= 2 && (mt.includes(t) || t.includes(mt))) {
          overlap += 0.85;
          matched = true;
          break;
        }
      }
      if (matched) continue;
      if (t.length >= 2 && matCombined.includes(t)) {
        overlap += 0.7;
      }
    }
    return overlap / ingDedup.length;
  };

  const ingTokensZh = tokenize(ing.nameZh);
  const ingTokensJa = tokenize(ing.nameJa);
  const ingTokensFr = tokenize(ing.nameFr);
  const ingBrandNorm = normalizeBrandName(ing.brand);
  const ingPctSet = new Set();
  [ing.nameZh, ing.nameJa, ing.nameFr].forEach(n => {
    const p = extractPercent(n);
    if (p != null) ingPctSet.add(p);
  });

  if (ingTokensZh.length === 0 && ingTokensJa.length === 0 && ingTokensFr.length === 0) return [];

  const results = [];
  for (const m of materials) {
    const mTokensZh = tokenize(m.nameZh);
    const mTokensJa = tokenize(m.nameJa);
    const mTokensFr = tokenize(m.nameFr);

    const ingZhClean = clean(ing.nameZh || "");
    const ingJaClean = clean(ing.nameJa || "");
    const mZhClean = clean(m.nameZh || "");
    const mJaClean = clean(m.nameJa || "");
    let score = 0;

    if ((ingZhClean && mZhClean === ingZhClean) || (ingJaClean && mJaClean === ingJaClean)) {
      score = 100;
    } else {
      const overlapZh = tokenOverlap(ingTokensZh, mTokensZh);
      const overlapJa = tokenOverlap(ingTokensJa, mTokensJa);
      const overlapFr = tokenOverlap(ingTokensFr, mTokensFr);
      const maxOverlap = Math.max(overlapZh, overlapJa, overlapFr);

      // 重叠率映射 (v13.1 放宽: 0.8→75 旧 70 / 0.65→65 新增档 / 0.5→55 / 0.4→45)
      if (maxOverlap >= 1.0) score = 85;
      else if (maxOverlap >= 0.8) score = 75;
      else if (maxOverlap >= 0.65) score = 65;
      else if (maxOverlap >= 0.5) score = 55;
      else if (maxOverlap >= 0.4) score = 45;

      // 品牌加成 (v13.1: 用 normalizeBrandName 去公司后缀, 加 nameEn 匹配)
      if (score > 0 && ingBrandNorm) {
        const b = brands.find(x => x.id === m.brandId);
        if (b) {
          const bZhNorm = normalizeBrandName(b.nameZh);
          const bJaNorm = normalizeBrandName(b.nameJa);
          const bEnNorm = normalizeBrandName(b.nameEn);
          const matched = [bZhNorm, bJaNorm, bEnNorm].some(bn =>
            bn && bn.length >= 2 && (bn.includes(ingBrandNorm) || ingBrandNorm.includes(bn))
          );
          if (matched) score += 15;
        }
      }

      // 百分比匹配加成 (v13.1 新增): 35% 配 35% +10, 双方都明确有但完全不同 -8
      if (score > 0 && ingPctSet.size > 0) {
        const mPctSet = collectMaterialPercents(m);
        if (mPctSet.size > 0) {
          let same = false;
          for (const p of ingPctSet) if (mPctSet.has(p)) { same = true; break; }
          score += same ? 10 : -8;
        }
      }
    }

    if (score >= 40) {
      if (m.isBest) score += 2;
      results.push({ score: Math.min(100, score), material: m });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5);
};

// 计算 ingredient 当前的权威单价 (¥/g)
// v11 优先级:
//   ① ing.materialId 关联材料 → 走 getMaterialEffectivePrice (本店→参考)
//   ② ing.unitPrice 手写文字
// (老 cats 价格表已在 UI 隐藏,不再参与 fallback;参数保留做向后兼容)
const getIngUnitPrice = (ing, materials, brands, cats) => {
  if (!ing) return 0;
  // ① 材料百科 + 本店原料
  if (ing.materialId) {
    const m = Array.isArray(materials) ? materials.find(x => x.id === ing.materialId) : null;
    if (m) {
      const p = getMaterialEffectivePrice(m);
      if (p > 0) return p;
    }
  }
  // ② 手写 unitPrice(v17: 按 ing.currency 折成人民币,无字段 = 老数据 = 日元)
  return toCNY(ing.unitPrice, curOf(ing));
};

// v11: 只读视图用的实时成本 — qty × live unit price。
// 算不出(无关联/无价)时退回 ing.cost 存储快照,保证老数据不空白。
const getIngLiveCost = (ing, materials, brands, cats) => {
  if (!ing) return 0;
  const q = parseFloat(ing.qty) || 0;
  const up = getIngUnitPrice(ing, materials, brands, cats);
  if (q > 0 && up > 0) return q * up;
  // 存储快照也是原币种(老数据日元),同样折成人民币,免得一张表里两种钱
  return toCNY(ing.cost, curOf(ing));
};


// 根据输入的名字在cats里找匹配的大类（返回第一个匹配）
const findCatByName = (name, cats) => {
  if (!name || !Array.isArray(cats)) return null;
  const n = name.trim().toLowerCase();
  if (!n) return null;
  return cats.find(c =>
    (c.nameZh && c.nameZh.toLowerCase() === n) ||
    (c.nameJa && c.nameJa.toLowerCase() === n)
  ) || null;
};

// 根据输入的品牌名在某个cat内找匹配的brand索引
const findBrandIdxByName = (name, cat) => {
  if (!name || !cat || !Array.isArray(cat.brands)) return -1;
  const n = name.trim().toLowerCase();
  if (!n) return -1;
  return cat.brands.findIndex(b =>
    (b.nameZh && b.nameZh.toLowerCase() === n) ||
    (b.nameJa && b.nameJa.toLowerCase() === n)
  );
};

// 给一个 ingredient 自动推断 catId / brandIdx（基于已有的 nameZh/nameJa/brand 字符串）
const autoLinkIng = (ing, cats) => {
  if (!ing) return ing;
  // 已有 catId 就不动
  if (ing.catId) return ing;
  const cat = findCatByName(ing.nameZh, cats) || findCatByName(ing.nameJa, cats);
  if (!cat) return ing;
  const bi = ing.brand ? findBrandIdxByName(ing.brand, cat) : -1;
  return { ...ing, catId: cat.id, brandIdx: bi >= 0 ? bi : null };
};

// ───────────── 材料百科：大分类 ─────────────
const MATERIAL_CATEGORIES = [
  { id: "butter",      zh: "黄油",         ja: "バター",         icon: "🧈", color: "#EAB308", bg: "#FEF9C3" },
  { id: "cream",       zh: "奶油",         ja: "生クリーム",     icon: "🥛", color: "#3B82F6", bg: "#DBEAFE" },
  { id: "dairy_other", zh: "牛奶芝士类",   ja: "牛乳・チーズ等",  icon: "🧀", color: "#06B6D4", bg: "#CFFAFE" },
  { id: "flour",     zh: "粉类",         ja: "粉類",           icon: "🌾", color: "#B45309", bg: "#FEF3C7" },
  { id: "sugar",     zh: "糖类",         ja: "砂糖・甘味料",    icon: "🍬", color: "#EC4899", bg: "#FCE7F3" },
  { id: "chocolate", zh: "巧克力",       ja: "チョコレート",    icon: "🍫", color: "#78350F", bg: "#FED7AA" },
  { id: "egg",       zh: "蛋类",         ja: "卵",             icon: "🥚", color: "#F59E0B", bg: "#FEF3C7" },
  { id: "fruit",     zh: "果泥果肉",     ja: "果物・ピューレ",  icon: "🍓", color: "#DC2626", bg: "#FEE2E2" },
  { id: "nut",       zh: "坚果",         ja: "ナッツ",         icon: "🌰", color: "#92400E", bg: "#FEF3C7" },
  { id: "liquor",    zh: "酒类",         ja: "酒類・リキュール", icon: "🍾", color: "#7C3AED", bg: "#EDE9FE" },
  { id: "gelatin",   zh: "凝固剂",       ja: "ゼラチン・ペクチン", icon: "🧊", color: "#0EA5E9", bg: "#E0F2FE" },
  { id: "spice",     zh: "香料",         ja: "香料・バニラ",    icon: "✨", color: "#A855F7", bg: "#F3E8FF" },
  { id: "color",     zh: "色素装饰",     ja: "色素・装飾",      icon: "🎨", color: "#EF4444", bg: "#FEE2E2" },
  { id: "leavening", zh: "膨松剂",       ja: "膨張剤",         icon: "💨", color: "#14B8A6", bg: "#CCFBF1" },
  { id: "other",     zh: "其他",         ja: "その他",         icon: "📦", color: "#6B7280", bg: "#F3F4F6" },
];

// ───────────── 材料百科：子分类(v5.3 新增) ─────────────
const MATERIAL_SUBCATEGORIES = {
  butter: [
    { id: "butter_fermented_unsalted", zh: "发酵 · 无盐", ja: "発酵無塩",   icon: "🟡" },
    { id: "butter_fermented_salted",   zh: "发酵 · 有盐", ja: "発酵有塩",   icon: "🟠" },
    { id: "butter_fresh_unsalted",     zh: "无发酵 · 无盐", ja: "無発酵無塩", icon: "⚪" },
    { id: "butter_fresh_salted",       zh: "无发酵 · 有盐", ja: "無発酵有塩", icon: "🔵" },
    { id: "butter_sheet",              zh: "板状 · 业务用", ja: "シート",    icon: "📜" },
    { id: "other",                     zh: "其他",        ja: "その他",     icon: "📦" },
  ],
  cream: [
    { id: "cream_fresh",    zh: "动物性生奶油", ja: "生クリーム(動物性)", icon: "🥛" },
    { id: "cream_compound", zh: "植脂奶油",     ja: "コンパウンドクリーム", icon: "⚪" },
    { id: "other",          zh: "其他",        ja: "その他",            icon: "📦" },
  ],
  dairy_other: [
    { id: "milk",             zh: "牛奶",         ja: "牛乳",           icon: "🍼" },
    { id: "cheese_hard",      zh: "硬质芝士",     ja: "ハードチーズ",   icon: "🧀" },
    { id: "cheese_soft",      zh: "软质芝士",     ja: "ソフトチーズ",   icon: "🧀" },
    { id: "cheese_cream",     zh: "奶油芝士",     ja: "クリームチーズ", icon: "🧀" },
    { id: "cheese_mascarpone", zh: "马斯卡彭",    ja: "マスカルポーネ", icon: "🧀" },
    { id: "cheese_mozzarella", zh: "莫扎瑞拉",   ja: "モッツァレラ",   icon: "🧀" },
    { id: "yogurt",           zh: "酸奶",         ja: "ヨーグルト",     icon: "🥣" },
    { id: "sour_cream",       zh: "酸奶油",       ja: "サワークリーム", icon: "🥄" },
    { id: "other",            zh: "其他",         ja: "その他",        icon: "📦" },
  ],
  flour: [
    { id: "weak",        zh: "薄力粉",       ja: "薄力粉",       icon: "🎂" },
    { id: "semi_strong", zh: "准强力粉",     ja: "準強力粉",     icon: "🥖" },
    { id: "strong",      zh: "强力粉",       ja: "強力粉",       icon: "🍞" },
    { id: "medium",      zh: "中力粉",       ja: "中力粉",       icon: "🍜" },
    { id: "whole",       zh: "全粒粉/ライ麦", ja: "全粒粉・ライ麦粉", icon: "🌾" },
    { id: "rice",        zh: "米粉",         ja: "米粉",         icon: "🍚" },
    { id: "other",       zh: "其他",         ja: "その他",       icon: "📦" },
  ],
  sugar: [
    { id: "granulated", zh: "细砂糖",       ja: "グラニュー糖", icon: "⚪" },
    { id: "superfine",  zh: "上白糖",       ja: "上白糖",       icon: "⚪" },
    { id: "powdered",   zh: "粉糖",         ja: "粉糖",         icon: "❄️" },
    { id: "brown",      zh: "三温糖/黑糖",  ja: "三温糖・黒糖", icon: "🟤" },
    { id: "special",    zh: "和三盆/特殊糖", ja: "和三盆・特殊糖", icon: "✨" },
    { id: "syrup",      zh: "转化糖/糖浆",  ja: "転化糖・シロップ", icon: "🍯" },
    { id: "other",      zh: "其他",         ja: "その他",       icon: "📦" },
  ],
  chocolate: [
    // 黑巧细分
    { id: "dark_single_origin", zh: "黑巧·单产地", ja: "ダーク・シングル",   icon: "⬛" },
    { id: "dark_blend",         zh: "黑巧·拼配",   ja: "ダーク・ブレンド",   icon: "⬛" },
    { id: "dark_bulk",          zh: "黑巧·业务用", ja: "ダーク・バルク",     icon: "⬛" },
    { id: "milk",         zh: "牛奶巧克力",   ja: "ミルク",         icon: "🟫" },
    { id: "white",        zh: "白巧克力",     ja: "ホワイト",       icon: "⬜" },
    { id: "blonde",       zh: "金巧克力",     ja: "ブロンド",       icon: "🟨" },
    { id: "cacao_powder", zh: "可可粉",       ja: "ココア・カカオパウダー", icon: "🟤" },
    { id: "cacao_butter", zh: "可可脂",       ja: "カカオバター",   icon: "🧈" },
    { id: "decoration",   zh: "装饰用",       ja: "装飾用",         icon: "🎨" },
    { id: "other",        zh: "其他",         ja: "その他",         icon: "📦" },
  ],
  egg: [
    { id: "whole", zh: "全蛋",   ja: "全卵",   icon: "🥚" },
    { id: "yolk",  zh: "蛋黄",   ja: "卵黄",   icon: "🟡" },
    { id: "white", zh: "蛋白",   ja: "卵白",   icon: "⚪" },
    { id: "other", zh: "其他",   ja: "その他", icon: "📦" },
  ],
  fruit: [
    // 果泥细分(按果物类型)
    { id: "puree_berry",         zh: "果泥·莓果",     ja: "ピューレ・ベリー系",    icon: "🍓" },
    { id: "puree_stone_citrus",  zh: "果泥·核果柑橘", ja: "ピューレ・核果柑橘",    icon: "🍑" },
    { id: "puree_tropical",      zh: "果泥·热带",     ja: "ピューレ・トロピカル",  icon: "🥭" },
    { id: "puree_blend",         zh: "果泥·拼配",     ja: "ピューレ・ブレンド",    icon: "🍹" },
    { id: "puree_flower_herb",   zh: "果泥·花香",     ja: "ピューレ・花ハーブ",    icon: "🌸" },
    { id: "puree_japan",         zh: "果泥·国产",     ja: "ピューレ・国産",        icon: "🗾" },
    { id: "puree",               zh: "果泥·其他",     ja: "ピューレ・その他",      icon: "📦" },
    // 其他形态(不拆)
    { id: "confit", zh: "蜜渍/コンフィ", ja: "コンフィ",     icon: "🍒" },
    { id: "dice",   zh: "小粒",         ja: "ダイス",       icon: "🔶" },
    { id: "whole",  zh: "冷冻整果",     ja: "冷凍ホール",   icon: "🫐" },
    { id: "other",  zh: "其他",         ja: "その他",       icon: "📦" },
  ],
  nut: [
    // 杏仁细分
    { id: "almond_powder", zh: "杏仁粉",      ja: "アーモンドパウダー",  icon: "🌰" },
    { id: "almond_slice",  zh: "杏仁片/丁",    ja: "アーモンドスライス",  icon: "🌰" },
    { id: "almond_whole",  zh: "杏仁全粒",    ja: "アーモンドホール",   icon: "🌰" },
    { id: "almond_paste",  zh: "杏仁膏/马斯潘", ja: "アーモンドペースト",  icon: "🌰" },
    // 开心果细分
    { id: "pistachio_paste",  zh: "开心果酱",  ja: "ピスタチオペースト", icon: "🟢" },
    { id: "pistachio_powder", zh: "开心果粉",  ja: "ピスタチオパウダー", icon: "🟢" },
    { id: "pistachio_whole",  zh: "开心果全粒", ja: "ピスタチオホール",   icon: "🟢" },
    // 榛子细分
    { id: "hazelnut_powder", zh: "榛子粉",    ja: "ヘーゼルナッツ粉",   icon: "🌰" },
    { id: "hazelnut_whole",  zh: "榛子全粒",  ja: "ヘーゼルナッツホール", icon: "🌰" },
    { id: "hazelnut_paste",  zh: "榛子酱",    ja: "ヘーゼルナッツペースト", icon: "🌰" },
    // 其他坚果(不拆)
    { id: "walnut",    zh: "核桃",     ja: "クルミ",         icon: "🌰" },
    { id: "pecan",     zh: "碧根果",   ja: "ピーカン",       icon: "🌰" },
    { id: "paste",     zh: "其他坚果酱", ja: "その他ナッツペースト", icon: "🥜" },
    { id: "other",     zh: "其他",     ja: "その他",         icon: "📦" },
  ],
  liquor: [
    { id: "kirsch",  zh: "樱桃酒",   ja: "キルシュ",       icon: "🍒" },
    { id: "rum",     zh: "朗姆酒",   ja: "ラム",           icon: "🍾" },
    { id: "brandy",  zh: "白兰地",   ja: "ブランデー",     icon: "🥃" },
    { id: "liqueur", zh: "利口酒",   ja: "リキュール",     icon: "🍸" },
    { id: "wine",    zh: "葡萄酒",   ja: "ワイン",         icon: "🍷" },
    { id: "other",   zh: "其他",     ja: "その他",         icon: "📦" },
  ],
  gelatin: [
    { id: "leaf",   zh: "板吉利丁",     ja: "板ゼラチン",     icon: "🧊" },
    { id: "powder", zh: "粉状吉利丁",   ja: "パウダーゼラチン", icon: "❄️" },
    { id: "pectin", zh: "果胶",         ja: "ペクチン",       icon: "🍯" },
    { id: "agar",   zh: "琼脂/アガー", ja: "寒天・アガー",   icon: "🌊" },
    { id: "other",  zh: "其他",         ja: "その他",         icon: "📦" },
  ],
  spice: [
    { id: "vanilla", zh: "香草类",   ja: "バニラ",         icon: "🌸" },
    { id: "seeds",   zh: "香料种子", ja: "シナモン等",     icon: "🌿" },
    { id: "flower",  zh: "花香类",   ja: "花系",           icon: "🌹" },
    { id: "other",   zh: "其他",     ja: "その他",         icon: "📦" },
  ],
  color:     [{ id: "other", zh: "其他", ja: "その他", icon: "📦" }],
  leavening: [{ id: "other", zh: "其他", ja: "その他", icon: "📦" }],
  other:     [{ id: "other", zh: "其他", ja: "その他", icon: "📦" }],
};

// 取子分类(若大类不存在或子分类不存在,返回 other)
const getMaterialSubcat = (categoryId, subcategoryId) => {
  const subs = MATERIAL_SUBCATEGORIES[categoryId] || MATERIAL_SUBCATEGORIES.other;
  return subs.find(s => s.id === subcategoryId) || subs.find(s => s.id === "other") || subs[subs.length - 1];
};

// 取某个大类下的所有子分类
const getSubcategoriesFor = (categoryId) => MATERIAL_SUBCATEGORIES[categoryId] || MATERIAL_SUBCATEGORIES.other;


// ───────────── 材料百科：每个分类的参数模板 ─────────────
const MATERIAL_PARAM_TEMPLATES = {
  flour: [
    { key: "强度分类", placeholder: "薄力粉 / 中力粉 / 強力粉 / 全粒粉" },
    { key: "粗蛋白", placeholder: "例：9.5%" },
    { key: "灰分", placeholder: "例：0.37%" },
    { key: "产地", placeholder: "例：北海道 / フランス" },
    { key: "小麦品种", placeholder: "例：春よ恋" },
  ],
  sugar: [
    { key: "糖类型", placeholder: "グラニュー / 粉糖 / 三温糖 / 转化糖" },
    { key: "纯度", placeholder: "例：99.9%" },
    { key: "颗粒度", placeholder: "细 / 中 / 粗" },
    { key: "产地", placeholder: "例：日本" },
  ],
  chocolate: [
    { key: "可可含量", placeholder: "例：70%" },
    { key: "种类", placeholder: "ダーク / ミルク / ホワイト / ブロンド" },
    { key: "可可豆产地", placeholder: "例：エクアドル" },
    { key: "脂肪", placeholder: "例：38%" },
  ],
  egg: [
    { key: "种类", placeholder: "全卵 / 卵白 / 卵黄 / 乾燥卵" },
    { key: "サイズ", placeholder: "M / L / LL" },
    { key: "产地", placeholder: "例：国産" },
  ],
  fruit: [
    { key: "种类", placeholder: "ピューレ / コンフィ / ダイス / 冷凍" },
    { key: "糖度", placeholder: "例：70% / 不加糖" },
    { key: "酸度", placeholder: "例：pH 3.5" },
    { key: "产地", placeholder: "例：フランス" },
  ],
  nut: [
    { key: "状态", placeholder: "ホール / スライス / ダイス / パウダー" },
    { key: "烘焙", placeholder: "生 / ロースト" },
    { key: "产地", placeholder: "例：カリフォルニア" },
  ],
  liquor: [
    { key: "酒精度", placeholder: "例：24%" },
    { key: "种类", placeholder: "リキュール / 蒸留酒 / ブランデー" },
    { key: "产地", placeholder: "例：スイス" },
  ],
  gelatin: [
    { key: "原料", placeholder: "豚 / 牛 / 魚" },
    { key: "形态", placeholder: "板 / 顆粒 / パウダー" },
    { key: "ゼリー强度", placeholder: "例：180-210g" },
    { key: "溶解温度", placeholder: "例：60°C" },
  ],
  spice: [
    { key: "种类", placeholder: "バニラ / シナモン / カルダモン" },
    { key: "形态", placeholder: "ビーンズ / パウダー / エキストラクト" },
    { key: "产地", placeholder: "例：マダガスカル" },
  ],
  color: [
    { key: "种类", placeholder: "天然 / 合成" },
    { key: "颜色", placeholder: "例：赤 / 黄色" },
    { key: "形态", placeholder: "液体 / パウダー / ペースト" },
  ],
  leavening: [
    { key: "种类", placeholder: "BP / 重曹 / イースト" },
    { key: "主要成分", placeholder: "例：リン酸" },
  ],
  other: [
    { key: "特性", placeholder: "" },
    { key: "用途", placeholder: "" },
  ],
};

// 取分类
const getMaterialCat = (id) => MATERIAL_CATEGORIES.find(c => c.id === id) || MATERIAL_CATEGORIES[MATERIAL_CATEGORIES.length - 1];

// ───────────── 知识库标签（用于知识点分类和筛选）─────────────
const KNOWLEDGE_TAGS = [
  // 语义标签型：语义色描边 + 白底。色相按 2a §03 的知识标签盘就近取。
  { id: "temperature",   zh: "温度",          ja: "温度",         color: "#B0442F", bg: "#FFFFFF" },
  { id: "material",      zh: "材料",          ja: "材料",         color: "#C97A17", bg: "#FFFFFF" },
  { id: "technique",     zh: "技术要点",       ja: "技術ポイント",  color: "#35785C", bg: "#FFFFFF" },
  { id: "process",       zh: "工程・时间管理",  ja: "工程・時間管理", color: "#4A5A9B", bg: "#FFFFFF" },
  { id: "philosophy",    zh: "主厨哲学",       ja: "シェフ哲学",    color: "#6E3E6B", bg: "#FFFFFF" },
  { id: "science",       zh: "科学原理",       ja: "科学原理",     color: "#77776E", bg: "#FFFFFF" },
  { id: "emulsification", zh: "乳化",         ja: "乳化",         color: "#4E7591", bg: "#FFFFFF" },
  { id: "chocolate",     zh: "巧克力",         ja: "ショコラ",     color: "#5C3A2C", bg: "#FFFFFF" },
  { id: "gelatin",       zh: "吉利丁",         ja: "ゼラチン",     color: "#2F7F7A", bg: "#FFFFFF" },
];

const getKnowledgeTag = (id) => KNOWLEDGE_TAGS.find(t => t.id === id) || { id, zh: id, ja: id, color: "#77776E", bg: "#FFFFFF" };

// ───────────── 预置知识点 ─────────────
const DEFAULT_KNOWLEDGE = [
  {
    id: "k1",
    titleZh: "板ゼラチン 温度带完整资料",
    titleJa: "板ゼラチンの温度帯完全資料",
    tags: ["temperature", "material", "gelatin"],
    relatedRecipes: ["アグレアブル（ムース）", "全ゼラチン入りムース"],
    contentZh: `【基本信息】
・ゼリー強度（ブルーム值）：200〜250（ゴールド级别）
・1枚重量：2〜3g（厂家不同）
・原料：主要豚皮
・使用量：液体总量的 1〜2%
・戻し时间：冰水 5〜10分钟

【温度带】
・0〜5°C：冷蔵／冷冻保存带、完全凝固
・5〜20°C：凝胶化（ムース保形）
・20°C左右：凝固开始（操作下限）
・25〜30°C：液体、可操作（混合奶油最佳温度）
・40〜50°C：完全溶解
・60°C以上：分解开始
・85°C以上：失活加速

【主要品牌对比】
・新田ゼラチン ゴールド（🇯🇵 日本）：約2.5g/枚、约200ブルーム、6,000〜8,000円/kg
・Ewald ゴールドエキストラ（🇩🇪 德国）：約2g/枚、230〜250ブルーム、8,000〜10,000円/kg
・グランベル ゴールド（🇩🇪 德国Ewald）：約2g/枚、230〜250ブルーム、约7,500円/kg
・ジェリフ（🇪🇺 欧洲）：約3.3g/枚、200ブルーム、5,000〜7,000円/kg

猿館シェフ使用：新田ゼラチン ゴールド`,
    contentJa: `【基本情報】
・ゼリー強度（ブルーム値）：200〜250（ゴールド級）
・1枚重量：2〜3g（メーカー差あり）
・原料：主に豚皮
・使用量目安：液体総量の 1〜2%
・戻し時間：氷水で 5〜10分

【温度帯】
・0〜5°C：冷蔵／冷凍保存帯、完全凝固
・5〜20°C：ゲル化（ムースが形を保つ）
・20°C前後：凝固開始（操作下限）
・25〜30°C：液体、操作可能（生クリームとの混合最適温度）
・40〜50°C：完全溶解
・60°C以上：分解開始
・85°C以上：失活加速

【主要ブランド比較】
・新田ゼラチン ゴールド（🇯🇵 日本）：約2.5g/枚、約200ブルーム、6,000〜8,000円/kg
・Ewald ゴールドエキストラ（🇩🇪 ドイツ）：約2g/枚、230〜250ブルーム、8,000〜10,000円/kg
・グランベル ゴールド（🇩🇪 ドイツEwald）：約2g/枚、230〜250ブルーム、約7,500円/kg
・ジェリフ（🇪🇺 欧州）：約3.3g/枚、200ブルーム、5,000〜7,000円/kg

猿館シェフ使用：新田ゼラチン ゴールド`,
    createdAt: new Date().toISOString(),
  },
  {
    id: "k2",
    titleZh: "ゼラチン失活的「温度×时间」法则",
    titleJa: "ゼラチン失活の「温度×時間」法則",
    tags: ["temperature", "technique", "gelatin"],
    relatedRecipes: ["アグレアブル（ムース）"],
    contentZh: `【核心内容】
ゼラチン失活不只看温度，温度和时间都重要。

【失活程度表】
・60°C × 30分以上：轻微失活（5%前后）
・70°C × 10分以上：明显失活（10〜15%）
・84°C × 瞬间通过（<1分钟）：几乎无失活（<5%）
・84°C × 持续5分钟：明显失活（15〜20%）
・100°C × 持续数分钟：严重失活（30%+）

【实践意义】
猿館シェフ的「84°C一起炊」是可行的高级操作。
前提：
・温度计精准
・一到就离火
・持续搅拌降温

保守做法：アングレーズ冷却到50°C后再加ゼラチン

【注意】
如果温度过头到88°C或在80°C以上滞留过久，就会有明显失活。不是所有人都能安全做到这个操作，新手建议保守做法。`,
    contentJa: `【コア内容】
ゼラチンの失活は温度だけでなく、時間との関係も重要。

【失活程度表】
・60°C × 30分以上：軽微失活（5%前後）
・70°C × 10分以上：明確失活（10〜15%）
・84°C × 瞬間通過（<1分）：ほぼ失活なし（<5%）
・84°C × 持続5分：明確失活（15〜20%）
・100°C × 持続数分：深刻失活（30%+）

【実践的意義】
猿館シェフの「84°C共炊き」は可能な上級操作。
前提：
・温度計精密
・到達即離火
・持続攪拌で冷却

保守的方法：アングレーズ冷却後（50°C以下）にゼラチン投入

【注意】
温度が88°Cを超えたり、80°C以上に長時間滞留すると明確な失活が起こる。全員が安全にできる操作ではなく、初心者には保守的方法を推奨。`,
    createdAt: new Date().toISOString(),
  },
  {
    id: "k3",
    titleZh: "ガナッシュ制作的水分比与操作方式",
    titleJa: "ガナッシュ制作の水分比と操作方法",
    tags: ["technique", "emulsification", "chocolate"],
    relatedRecipes: ["アグレアブル（ムース）", "全ガナッシュ・ショコラムース"],
    contentZh: `【核心原理】
巧克力中的糖和可可固形物需要一定量的水分才能彻底溶解/分散。水分不足时即使加热巧克力也会残留硬块或造成分离。

【水分:巧克力 比例与操作方式】
・1:2（50g水:100g巧克力）水分极少 → 必须先融化巧克力至40〜45°C，再缓慢加入温热液体（40°C左右），分3〜4次乳化
・2:3 水分较少 → 建议先融化巧克力，温热液体分2〜3次加入
・1:1 平衡点 → 可选任一做法。猿館シェフ流「先倒后收」最适合此比例
・3:2 水分偏多 → 「先倒后收」或传统分次加入均可
・2:1 水分丰富 → 液体热量足以融化巧克力，可将温热液体一次倒入固体巧克力
・3:1以上 水分过多 → 易脂肪分离，需要分次加入或使用ロボクープ

【规则总结】
水分占总量<33%（1:2以下）：必须先融化巧克力
水分占总量33〜50%（1:2到1:1）：两种做法都可以
水分占总量>50%（1:1以上）：シェフ流「先倒后收」最佳

【MOF级「先倒后收」乳化流程】
1. 巧克力不融化（固体状态）
2. 全部液体倒入巧克力 → 静置30秒〜1分钟
3. 把一半液体倒回小锅
4. 剩下一半逐渐搅拌 → 可可脂开始包裹水滴
5. 慢慢把倒出来的液体加回去 → 完成乳化

【为什么这样更好】
静置那段时间液体热量温和传给巧克力，从外层慢慢融化，水油在接触面自然形成稳定的乳化核。就像做蛋黄酱要一滴一滴加油。

量大时用ロボクープ（食品料理机）可以打成分子级乳化，比手工均匀。

【常见ガナッシュ配方参考】
・トリュフ・ボンボン中心：1:2 → 巧克力先融化
・タルトフィリング：2:3 → 巧克力先融化
・サンドクリーム：1:1 → シェフ流 or 分次
・ムース用ガナッシュ：1:1〜3:2 → シェフ流最佳
・グラサージュ（淋面）：2:1以上 → 液体一次注入`,
    contentJa: `【コア原理】
ショコラ中の砂糖と可可固形分は一定量の水分がないと完全に溶解・分散しない。水分不足の場合、ショコラを加熱しても硬い塊が残ったり分離する。

【水分:ショコラ 比率と操作方法】
・1:2（50g水:100gショコラ）水分極少 → ショコラを先に40〜45°Cまで融かし、温めた液体（40°C前後）を3〜4回に分けて乳化必須
・2:3 水分少 → ショコラ先融かし推奨、温めた液体を2〜3回に分けて
・1:1 平衡点 → どちらの方法も可。猿館シェフ流「先入れ後戻し」が最適
・3:2 水分やや多 → 「先入れ後戻し」か伝統的分次投入
・2:1 水分豊富 → 液体の熱量でショコラが融けるため、温めた液体を一気に固体ショコラへ
・3:1以上 水分過多 → 脂肪分離しやすい、分次投入またはロボクープ使用

【ルールまとめ】
水分総量<33%（1:2以下）：ショコラ先融かし必須
水分総量33〜50%（1:2〜1:1）：どちらも可
水分総量>50%（1:1以上）：シェフ流「先入れ後戻し」最適

【MOF級「先入れ後戻し」乳化の流れ】
1. ショコラは融かさない（固体状態）
2. 液体を全量ショコラに注入 → 30秒〜1分静置
3. 液体の半分を鍋に戻す
4. 残り半分で徐々に混合 → 可可脂が水滴を包み始める
5. 戻した液体を少しずつ加える → 乳化完成

【なぜこの方法が優れるか】
静置の30秒〜1分間に液体の熱がショコラに穏やかに伝わり、外側からゆっくり融け、接触面で安定した乳化核が自然形成。マヨネーズの作り方と同じ原理。

大量製造時はロボクープ（フードプロセッサー）で分子レベルの乳化、手作業より均一。

【一般的ガナッシュ配方の参考】
・トリュフ・ボンボン中心：1:2 → ショコラ先融かし
・タルトフィリング：2:3 → ショコラ先融かし
・サンドクリーム：1:1 → シェフ流 or 分次
・ムース用ガナッシュ：1:1〜3:2 → シェフ流最適
・グラサージュ：2:1以上 → 液体一気に注入`,
    createdAt: new Date().toISOString(),
  },
  {
    id: "k4",
    titleZh: "ココアバターの6种结晶形态",
    titleJa: "ココアバターの6つの結晶形態",
    tags: ["material", "science", "chocolate"],
    relatedRecipes: ["アグレアブル（ムース・グラサージュ）", "全ショコラ製品"],
    contentZh: `【核心内容】
ココアバター（可可脂）不是单一结构，有6种结晶型，各自熔点和稳定性不同。

【6种结晶型】
・Ⅰ型：熔点17°C、极不稳定、软・糊口
・Ⅱ型：熔点21°C、不稳定、软
・Ⅲ型：熔点26°C、不稳定、脆弱
・Ⅳ型：熔点28°C、不稳定、脆弱
・Ⅴ型：熔点32〜34°C、理想状态、脆・光泽・口溶良
・Ⅵ型：熔点36°C、过于稳定、白霜・老化

【Ⅴ型是目标】
市售块状巧克力内的可可脂已是调温后的Ⅴ型，具有：
・漂亮的光泽
・脆的スナップ声
・温和的口溶け
・不易起白霜

【融化=打散结晶】
加热到45°C以上所有Ⅴ型结晶被打散，变成完全液态。冷却后随机形成Ⅰ〜Ⅳ型（不稳定型）→ 无光泽、口感粗糙、起白霜。

【シェフの做法】
热液体倒入固体巧克力 → 只部分融化 → 保留Ⅴ型结晶种 → 引导整体朝稳定结构发展。

【慕斯 vs 纯巧克力制品的不同】
・纯巧克力制品（トリュフ・板チョコ）：严格tempering必须
・慕斯：脂肪分离防止是主目的、保留结晶种辅助稳定`,
    contentJa: `【コア内容】
ココアバターは単一構造ではなく、6種の結晶型があり、融点と安定性がそれぞれ異なる。

【6つの結晶型】
・Ⅰ型：融点17°C、極不安定、軟・ベタつき
・Ⅱ型：融点21°C、不安定、軟
・Ⅲ型：融点26°C、不安定、脆弱
・Ⅳ型：融点28°C、不安定、脆弱
・Ⅴ型：融点32〜34°C、理想状態、パリッと・艶・口溶け良
・Ⅵ型：融点36°C、過安定、ブルーム・老化

【Ⅴ型がゴール】
市販の板チョコはテンパリング済みのⅤ型結晶。
・美しい艶
・パリッとしたスナップ音
・温和な口溶け
・ブルームが出にくい

【融かす=結晶が分散】
45°C以上に加熱すると全Ⅴ型結晶が分散、完全液体化。冷却後Ⅰ〜Ⅳ型（不安定型）でランダム結晶→艶無し・粗い食感・ブルーム発生。

【シェフの手法】
温かい液体を固体ショコラに注入 → 部分的にしか融けない → Ⅴ型結晶種を保持 → 全体を安定構造に誘導。

【ムース vs 純ショコラ製品の違い】
・純ショコラ製品（ボンボン・板チョコ）：厳密なテンパリング必須
・ムース：脂肪分離防止が主目的、結晶種を残すのは安定性のため`,
    createdAt: new Date().toISOString(),
  },
  {
    id: "k5",
    titleZh: "ホワイト vs ダーク 的结晶时间",
    titleJa: "ホワイト vs ダーク の結晶化時間",
    tags: ["process", "chocolate"],
    relatedRecipes: ["アグレアブル（前日仕込み必须）"],
    contentZh: `【核心规律】
可可脂（ココアバター）含量越高，结晶化时间越短。

【巧克力类型 × 结晶时间】
・ホワイトチョコ（Dulcey 35%）：ココアバター约30〜35%、结晶时间约24小时
・ミルクチョコ（40%）：ココアバター约30〜35%、结晶时间约12〜18小时
・スイートチョコ（55〜60%）：ココアバター约35〜40%、结晶时间约8〜12小时
・ダークチョコ（70%）：ココアバター约40〜45%、结晶时间约6〜8小时
・70%以上の高カカオ：ココアバター45%以上、结晶时间约4〜6小时

【原理】
巧克力中只有ココアバター主动结晶，糖・乳固形・ココアパウダー都不结晶。ココアバター含量高 → 可结晶物质多 → 结晶网络形成快 → 整体定型迅速。

【实践意义】
・ホワイトチョコムース：前日仕込み必须（隔夜冷蔵）
・ダークチョコムース：午前作、晩上可售
・高カカオ：基本当日可用

【工作流设计】
专业パティスリー需要根据巧克力含量安排制作时间。以白巧克力为基底的慕斯蛋糕（如アグレアブル），前日工程是必须的。`,
    contentJa: `【基本法則】
ココアバター含量が高いほど、結晶化時間は短い。

【ショコラ種類 × 結晶化時間】
・ホワイトチョコ（Dulcey 35%）：ココアバター約30〜35%、結晶化時間約24時間
・ミルクチョコ（40%）：ココアバター約30〜35%、結晶化時間約12〜18時間
・スイート（55〜60%）：ココアバター約35〜40%、結晶化時間約8〜12時間
・ダーク（70%）：ココアバター約40〜45%、結晶化時間約6〜8時間
・70%以上の高カカオ：ココアバター45%以上、結晶化時間約4〜6時間

【原理】
ショコラ中でココアバターだけが能動的に結晶化する。砂糖・乳固形・ココアパウダーは結晶化しない。ココアバター含量高 → 結晶可能物質多 → 結晶ネットワーク形成速 → 全体定型迅速。

【実務的意義】
・ホワイトチョコムース：前日仕込み必須（冷蔵一晩）
・ダークチョコムース：午前仕込み、夕方販売可能
・高カカオ：当日使用可能

【ワークフロー設計】
プロのパティスリーではショコラ含量によって製造時間を設計する必要がある。ホワイトチョコベースのムースケーキ（アグレアブルなど）は前日工程が必須。`,
    createdAt: new Date().toISOString(),
  },
  {
    id: "k6",
    titleZh: "猿館英名シェフ的ムース设计哲学",
    titleJa: "猿館英名シェフのムース設計哲学",
    tags: ["philosophy"],
    relatedRecipes: ["アグレアブル（ムース）"],
    contentZh: `【核心思想】
「各工程で水分と温度を極限までコントロールする」

【7项独特做法】
1. 焦糖化：只加热牛奶停止焦糖化、再次小火融化残糖、过筛到冷奶油中
2. ゼラチン共炊き：最初から投入、水分がゼラチンに一体化、蒸发多余水分
3. 84°C持续搅拌1-2分钟：避免蛋花状态、温度均匀化
4. 「先倒后收」乳化法：保留ココアバター结晶种、形成稳定乳化核
5. 选择焦糖白巧（非法芙娜）：其他厂商的个性温和、与焦糖アングレーズ协调
6. 温度计算：660g冷奶油（10°C）＋ 1139g アングレーズ（45°C）→ 混合25〜28°C
7. 过筛注意：シェフ可能偶尔省略、标准做法应过筛

【店家】
マプリエール（名古屋・東京）`,
    contentJa: `【核心思想】
「各工程で水分と温度を極限までコントロールする」

【7つの独特な手法】
1. カラメリゼ：牛乳のみでカラメル化を止める、再度弱火で残糖を融かし、過篩して冷たい生クリームへ
2. ゼラチン共炊き：最初から投入、水分がゼラチンに一体化、余分な水分を蒸発
3. 84°Cで1-2分持続攪拌：スクランブル状態を防ぐ・温度を均一化
4. 「先入れ・後戻し」乳化法：ココアバター結晶種を保持・安定した乳化核を形成
5. カラメル化ホワイトチョコ選択（Valrhona以外）：他メーカーは個性が穏やか・カラメルアングレーズと調和
6. 温度計算：660g冷生クリーム（10°C）＋ 1139gアングレーズ（45°C）→ 混合25〜28°C
7. 過篩注意：シェフは時々省略するが、標準的には過篩すべき

【店舗】
マプリエール（名古屋・東京）`,
    createdAt: new Date().toISOString(),
  },
  {
    id: "k7",
    titleZh: "温度流失的实战因素与计算",
    titleJa: "温度損失の実戦要因と計算",
    tags: ["temperature", "technique"],
    relatedRecipes: ["アグレアブル（ムース）", "全てのムース"],
    contentZh: `【理想公式：热力学保存法则】
(m1 × c1 × T1) + (m2 × c2 × T2) = (m1 + m2) × c × T混合

简化版（假设比热相同）：
混合后温度 = (m1×T1 + m2×T2) ÷ (m1+m2)

【举例：アグレアブルのムース】
660g × 10°C + 1139g × 45°C = 混合后温度 × 1799g
6,600 + 51,255 = 57,855
57,855 ÷ 1799 ≈ 32°C

理论值 32°C → 实际 25〜28°C（因温度流失）

【温度流失的5个现实因素】
・搅拌气泡带走热量：降1〜2°C
・容器温度吸热：降1〜3°C
・室温差（夏/冬）：差3〜5°C
・搅拌时间（每分钟）：降0.5°C
・材料比热差：误差1〜2°C

【专业做法】
公式用于理解原理，实操靠温度计＋经验。

【关键目标温度】
・アングレーズ炊き上がり：82〜84°C
・搅拌1-2分钟后：78〜80°C
・加入冷奶油前：45°C（用温度计确认）
・混合后目标：25°C左右

【大量生产调整】
・氷水ボウルで底冷え（太热时）
・湯煎で持ち上げ（冷过时）`,
    contentJa: `【理想公式：熱力学保存法則】
(m1 × c1 × T1) + (m2 × c2 × T2) = (m1 + m2) × c × T混合

簡略版（比熱を同じと仮定）：
混合後温度 = (m1×T1 + m2×T2) ÷ (m1+m2)

【例：アグレアブルのムース】
660g × 10°C + 1139g × 45°C = 混合後温度 × 1799g
6,600 + 51,255 = 57,855
57,855 ÷ 1799 ≈ 32°C

理論値 32°C → 実際 25〜28°C（温度損失のため）

【温度損失の5つの現実要因】
・攪拌時の気泡による熱逃げ：1〜2°C降下
・容器温度の吸熱：1〜3°C降下
・室温差（夏/冬）：3〜5°C差
・攪拌時間（1分毎）：0.5°C降下
・材料比熱差：1〜2°C誤差

【プロの実践】
公式は原理理解のため、実操作は温度計＋経験で判断。

【重要な目標温度】
・アングレーズ炊き上がり：82〜84°C
・攪拌1-2分後：78〜80°C
・冷生クリーム投入前：45°C（温度計確認）
・混合後目標：25°C前後

【大量製造時の調整】
・氷水ボウルで底冷え（熱過ぎる場合）
・湯煎で持ち上げ（冷え過ぎた場合）`,
    createdAt: new Date().toISOString(),
  },
];

// ───────────── 预置配方：咖啡巴斯克 V2.0 ─────────────
const COFFEE_BASQUE_V2 = {
  id: 1002,
  nameZh: "咖啡巴斯克 v2.0 経典优化版",
  nameJa: "コーヒーバスクチーズケーキ v2.0",
  nameFr: "Basque Café",
  category: "生菓子",
  mold: "15cm セルクル",
  yield: 1, unit: "台",
  time: 60, temp: "230°C", baketime: "28分",
  price: 3800, difficulty: "★★ 普通",
  storage: "冷蔵3〜4日・冷凍2週間",
  allergens: "卵・乳",
  totalCost: 0, unitCost: 0, margin: 0,
  familyId: "family_basque",
  variantLabel: "v2.0 経典优化版",
  variantNotes: "v1.0基础 + 酸奶油40g + 柠檬皮屑1/4个 + 盐↑",
  notesZh: `【咖啡巴斯克 V2.0 改良备忘】

━━━━━━━━━━━━━━━━━━━━
◆ 改良方向
━━━━━━━━━━━━━━━━━━━━
V1.0 反馈：浓郁但"吃多了腻"
改良核心：Irish Coffee 风格，加入圆润酸度切腻

━━━━━━━━━━━━━━━━━━━━
◆ 相比 V1.0 的变化
━━━━━━━━━━━━━━━━━━━━
• 奶油奶酪 300g → 260g（-40g）
• 新增 酸奶油 40g（中沢 サワークリーム）
• 新增 柠檬皮屑 1/4 个（国产有机柠檬）
• 盐 1g → 1.5g

━━━━━━━━━━━━━━━━━━━━
◆ 制作要点
━━━━━━━━━━━━━━━━━━━━
1. 所有乳制品室温回温（约 20°C）
2. 奶油奶酪打软后加糖+盐+柠檬皮屑
3. 分次加入蛋液，每次充分混合
4. 加入酸奶油、马斯卡彭、鲜奶油
5. 最后加入咖啡液、咖啡粉、朗姆酒
6. 过筛去除颗粒
7. 倒入铺烘焙纸的模具
8. 230°C / 28分钟
9. 顶部应呈中等焦化，无塌腰
10. 室温冷却 1 小时 → 冷藏 12 小时再食用

━━━━━━━━━━━━━━━━━━━━
◆ 咖啡豆选择
━━━━━━━━━━━━━━━━━━━━
推荐：浅烘非洲豆（耶加雪菲、西达摩）
避免：深烘豆（会产生苦味压过奶酪）

━━━━━━━━━━━━━━━━━━━━
◆ 定位
━━━━━━━━━━━━━━━━━━━━
RURU 基础版咖啡巴斯克
目标客群：喜欢奶酪甜品+咖啡的成人客人
售价建议：¥3,800/整模 or ¥600/份`,
  notesJa: `【コーヒーバスクチーズケーキ v2.0 改良メモ】

━━━━━━━━━━━━━━━━━━━━
◆ 改良方向
━━━━━━━━━━━━━━━━━━━━
v1.0 フィードバック：濃厚だが「食べ進めると重い」
改良方向：Irish Coffee 風、円やかな酸味で軽やかに

━━━━━━━━━━━━━━━━━━━━
◆ v1.0 からの変更
━━━━━━━━━━━━━━━━━━━━
• クリームチーズ 300g → 260g（-40g）
• サワークリーム 40g 新規追加（中沢）
• レモン皮 1/4個分 新規追加
• 塩 1g → 1.5g`,
  ingredients: [
    { nameZh: "奶油奶酪", nameJa: "クリームチーズ", nameFr: "Cream cheese", qty: 260, unit: "g", brand: "kiri", unitPrice: 0, cost: 0, group: "bowl1", note: "室温" },
    { nameZh: "马斯卡彭", nameJa: "マスカルポーネ", nameFr: "Mascarpone", qty: 100, unit: "g", brand: "Galbani", unitPrice: 0, cost: 0, group: "bowl1", note: "室温" },
    { nameZh: "酸奶油", nameJa: "サワークリーム", nameFr: "Sour cream", qty: 40, unit: "g", brand: "中沢乳業", unitPrice: 0, cost: 0, group: "bowl1", note: "室温·切腻关键" },
    { nameZh: "砂糖", nameJa: "グラニュー糖", nameFr: "Sucre", qty: 100, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "" },
    { nameZh: "盐", nameJa: "塩", nameFr: "Sel", qty: 1.5, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "" },
    { nameZh: "柠檬皮屑", nameJa: "レモンの皮", nameFr: "Zeste de citron", qty: 0.25, unit: "個", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "有机·只要黄色部分" },
    { nameZh: "全蛋", nameJa: "全卵", nameFr: "Œuf entier", qty: 120, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl3", note: "约2.5个M" },
    { nameZh: "蛋黄", nameJa: "卵黄", nameFr: "Jaune d'œuf", qty: 20, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl3", note: "约1个" },
    { nameZh: "35%鲜奶油", nameJa: "35%生クリーム", nameFr: "Crème 35%", qty: 100, unit: "g", brand: "中沢", unitPrice: 0, cost: 0, group: "bowl4", note: "" },
    { nameZh: "手冲咖啡液", nameJa: "ドリップコーヒー", nameFr: "Café filtré", qty: 60, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl4", note: "浅烘非洲豆" },
    { nameZh: "咖啡粉末", nameJa: "コーヒーパウダー", nameFr: "Café moulu fin", qty: 6, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl4", note: "细磨·要咬到颗粒感" },
    { nameZh: "玉米淀粉", nameJa: "コーンスターチ", nameFr: "Maïzena", qty: 10, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl5", note: "" },
    { nameZh: "黑朗姆酒", nameJa: "ダークラム", nameFr: "Rhum brun", qty: 5, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl5", note: "" },
  ],
  stepsZh: [
    "① 奶油奶酪、马斯卡彭、酸奶油 提前 1小时 室温回温至 20°C",
    "② 奶油奶酪打至柔软无颗粒（低速 2 分钟）",
    "③ 加入砂糖+盐+柠檬皮屑，低速混合均匀",
    "④ 分 2-3 次加入全蛋+蛋黄混合液，每次充分混合（避免产生气泡）",
    "⑤ 依次加入马斯卡彭、酸奶油，搅拌均匀",
    "⑥ 加入 35% 鲜奶油，继续混合",
    "⑦ 加入手冲咖啡液、咖啡粉末、朗姆酒，混合均匀",
    "⑧ 最后筛入玉米淀粉，橡皮刮刀轻柔拌匀（不要过度）",
    "⑨ 面糊过筛 1-2 次去除颗粒",
    "⑩ 倒入事先铺好烘焙纸的 15cm セルクル 中",
    "⑪ 烤箱 230°C 预热充分，烤 28 分钟",
    "⑫ 中心应有轻微晃动感（像布丁），表面中等焦化",
    "⑬ 室温自然冷却 1 小时，移至冷藏 12 小时以上再食用",
  ],
  stepsJa: [
    "① クリームチーズ、マスカルポーネ、サワークリームを1時間室温に戻す（20℃）",
    "② クリームチーズを滑らかになるまで低速で2分",
    "③ 砂糖+塩+レモンの皮を加え低速で混合",
    "④ 全卵+卵黄を2-3回に分けて加え、その都度しっかり混ぜる",
    "⑤ マスカルポーネ、サワークリームを順に加え混ぜる",
    "⑥ 35%生クリームを加え続けて混合",
    "⑦ ドリップコーヒー、コーヒーパウダー、ラムを加え混ぜる",
    "⑧ 最後にコーンスターチをふるい入れ、ゴムベラで優しく混ぜる",
    "⑨ 生地を1-2回こして粒をなくす",
    "⑩ オーブンシートを敷いた15cmセルクルに流し込む",
    "⑪ 230℃に予熱したオーブンで28分",
    "⑫ 中心がわずかに揺れる状態（プリン状）、表面中焦げ",
    "⑬ 室温で1時間冷ます→冷蔵で12時間以上寝かせてから食べる",
  ],
  imageUrls: [],
};

// ───────────── V3A 日系瑰夏版（柚子+乌龙茶） ─────────────
const COFFEE_BASQUE_V3A = {
  id: 1003,
  nameZh: "柚子乌龙咖啡巴斯克 v3A",
  nameJa: "ゆず烏龍コーヒーバスク v3A",
  nameFr: "Basque Yuzu Oolong",
  category: "生菓子",
  mold: "15cm セルクル",
  yield: 1, unit: "台",
  time: 60, temp: "230°C", baketime: "28分",
  price: 4200, difficulty: "★★★ 困难",
  storage: "冷蔵3〜4日・冷凍2週間",
  allergens: "卵・乳",
  totalCost: 0, unitCost: 0, margin: 0,
  familyId: "family_basque",
  variantLabel: "v3A 柚子乌龙版",
  variantNotes: "V2.0 + 柚子皮屑1/2个 + 乌龙茶粉2g + 柚子蜂蜜糖浆涂面",
  notesZh: `【柚子乌龙咖啡巴斯克 V3A 构想备忘】

━━━━━━━━━━━━━━━━━━━━
◆ 设计思路
━━━━━━━━━━━━━━━━━━━━
以 V2.0 为骨架，加入日式花果茶感，还原瑰夏咖啡的"花香+柑橘+茶尾韵"
柚子皮屑模拟佛手柑/橙花
乌龙茶粉模拟瑰夏的茶尾韵

━━━━━━━━━━━━━━━━━━━━
◆ 核心变化
━━━━━━━━━━━━━━━━━━━━
• 柠檬皮屑 1/4个 → 柚子皮屑 1/2个
• 新增 乌龙茶粉 2g（台湾高山乌龙研磨）
• 出炉后刷柚子蜂蜜糖浆

━━━━━━━━━━━━━━━━━━━━
◆ 柚子蜂蜜糖浆（装饰用）
━━━━━━━━━━━━━━━━━━━━
蜂蜜 3g + 柚子汁 3g 混合
出炉后趁热用毛刷均匀涂抹表面

━━━━━━━━━━━━━━━━━━━━
◆ 乌龙茶粉获取
━━━━━━━━━━━━━━━━━━━━
选台湾高山乌龙（Lupicia、茶茶之間都有）
用研磨机打到细粉状（过40目筛）
避免使用碎末多的廉价茶

━━━━━━━━━━━━━━━━━━━━
◆ 定位
━━━━━━━━━━━━━━━━━━━━
RURU 独特日式咖啡巴斯克
季节限定（冬季柚子当季）
售价建议：¥4,200/整模`,
  notesJa: `【ゆず烏龍コーヒーバスク v3A メモ】

v2.0 をベースに、柚子皮と烏龍茶粉で
「花・柑橘・茶の余韻」を表現
ゲイシャコーヒーのイメージを日本風に翻訳`,
  ingredients: [
    { nameZh: "奶油奶酪", nameJa: "クリームチーズ", nameFr: "Cream cheese", qty: 260, unit: "g", brand: "kiri", unitPrice: 0, cost: 0, group: "bowl1", note: "室温" },
    { nameZh: "马斯卡彭", nameJa: "マスカルポーネ", nameFr: "Mascarpone", qty: 100, unit: "g", brand: "Galbani", unitPrice: 0, cost: 0, group: "bowl1", note: "室温" },
    { nameZh: "酸奶油", nameJa: "サワークリーム", nameFr: "Sour cream", qty: 40, unit: "g", brand: "中沢乳業", unitPrice: 0, cost: 0, group: "bowl1", note: "室温" },
    { nameZh: "砂糖", nameJa: "グラニュー糖", nameFr: "Sucre", qty: 100, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "" },
    { nameZh: "盐", nameJa: "塩", nameFr: "Sel", qty: 1.5, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "" },
    { nameZh: "柚子皮屑", nameJa: "ゆずの皮", nameFr: "Zeste de yuzu", qty: 0.5, unit: "個", brand: "高知県産", unitPrice: 0, cost: 0, group: "bowl2", note: "只要黄色部分" },
    { nameZh: "乌龙茶粉", nameJa: "烏龍茶パウダー", nameFr: "Poudre d'Oolong", qty: 2, unit: "g", brand: "台湾高山", unitPrice: 0, cost: 0, group: "bowl2", note: "细粉·过40目筛" },
    { nameZh: "全蛋", nameJa: "全卵", nameFr: "Œuf entier", qty: 120, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl3", note: "约2.5个M" },
    { nameZh: "蛋黄", nameJa: "卵黄", nameFr: "Jaune d'œuf", qty: 20, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl3", note: "" },
    { nameZh: "35%鲜奶油", nameJa: "35%生クリーム", nameFr: "Crème 35%", qty: 100, unit: "g", brand: "中沢", unitPrice: 0, cost: 0, group: "bowl4", note: "" },
    { nameZh: "手冲咖啡液", nameJa: "ドリップコーヒー", nameFr: "Café filtré", qty: 60, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl4", note: "浅烘耶加雪菲" },
    { nameZh: "咖啡粉末", nameJa: "コーヒーパウダー", nameFr: "Café moulu fin", qty: 6, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl4", note: "细磨" },
    { nameZh: "玉米淀粉", nameJa: "コーンスターチ", nameFr: "Maïzena", qty: 10, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl5", note: "" },
    { nameZh: "黑朗姆酒", nameJa: "ダークラム", nameFr: "Rhum brun", qty: 5, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl5", note: "" },
    { nameZh: "蜂蜜（装饰）", nameJa: "蜂蜜（仕上げ）", nameFr: "Miel", qty: 3, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "none", note: "出炉后涂面" },
    { nameZh: "柚子汁（装饰）", nameJa: "ゆず果汁（仕上げ）", nameFr: "Jus de yuzu", qty: 3, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "none", note: "和蜂蜜混合后涂面" },
  ],
  stepsZh: [
    "① 所有乳制品室温回温（约 20°C）",
    "② 奶油奶酪打至柔软无颗粒",
    "③ 加入砂糖+盐+柚子皮屑+乌龙茶粉，低速混合",
    "④ 分 2-3 次加入全蛋+蛋黄，充分混合",
    "⑤ 依次加入马斯卡彭、酸奶油",
    "⑥ 加入 35% 鲜奶油",
    "⑦ 加入手冲咖啡液、咖啡粉末、朗姆酒",
    "⑧ 筛入玉米淀粉，轻柔拌匀",
    "⑨ 面糊过筛去除颗粒",
    "⑩ 倒入铺烘焙纸的 15cm セルクル",
    "⑪ 230°C 烤 28 分钟",
    "⑫ 出炉后趁热用毛刷涂柚子蜂蜜糖浆（蜂蜜3g+柚子汁3g）",
    "⑬ 室温冷却 1 小时 → 冷藏 12 小时",
  ],
  stepsJa: [
    "① 乳製品を室温に戻す（20℃）",
    "② クリームチーズを滑らかに",
    "③ 砂糖+塩+ゆず皮+烏龍茶粉を加え混合",
    "④ 全卵+卵黄を分けて加える",
    "⑤ マスカルポーネ、サワークリームを加える",
    "⑥ 35%生クリームを加える",
    "⑦ コーヒー液、コーヒー粉、ラムを加える",
    "⑧ コーンスターチを加え優しく混ぜる",
    "⑨ こして粒をなくす",
    "⑩ セルクルに流し込む",
    "⑪ 230℃で28分",
    "⑫ 焼き上がり直後にゆず蜂蜜（蜂蜜3g+ゆず汁3g）を刷毛で塗る",
    "⑬ 室温で1時間→冷蔵12時間以上",
  ],
  imageUrls: [],
};

// ───────────── V3B 欧系花果版（橙花+白桃） ─────────────
const COFFEE_BASQUE_V3B = {
  id: 1004,
  nameZh: "橙花白桃咖啡巴斯克 v3B",
  nameJa: "フルール・カフェ バスク v3B",
  nameFr: "Fleur Café Basque",
  category: "生菓子",
  mold: "15cm セルクル",
  yield: 1, unit: "台",
  time: 60, temp: "230°C", baketime: "28分",
  price: 4500, difficulty: "★★★ 困难",
  storage: "冷蔵3〜4日・冷凍2週間",
  allergens: "卵・乳",
  totalCost: 0, unitCost: 0, margin: 0,
  familyId: "family_basque",
  variantLabel: "v3B 橙花白桃版",
  variantNotes: "V2.0 + 橙皮屑1/2个 + 橙花水2g + 白桃利口酒5g（替代朗姆）",
  notesZh: `【Fleur Café 橙花白桃巴斯克 V3B 构想备忘】

━━━━━━━━━━━━━━━━━━━━
◆ 设计思路
━━━━━━━━━━━━━━━━━━━━
Sadaharu Aoki / Cedric Grolet 风格的高级欧系
橙花水 = 瑰夏花香的翻译
白桃利口酒 = 瑰夏白桃尾韵的翻译
佛手柑皮屑 = 加强柑橘层次（可选）

━━━━━━━━━━━━━━━━━━━━
◆ 核心变化（vs V2.0）
━━━━━━━━━━━━━━━━━━━━
• 柠檬皮屑 → 橙皮屑 1/2个
• 新增 橙花水 2g（Eau de fleur d'oranger）
• 朗姆酒 → 白桃利口酒（Crème de Pêche）
• 糖 100g → 95g
• 可选：佛手柑皮屑少许

━━━━━━━━━━━━━━━━━━━━
◆ 材料获取
━━━━━━━━━━━━━━━━━━━━
橙花水：冨澤商店、Amazon（¥1,500/100ml）
白桃利口酒：酒专门店、ナリタヤ
佛手柑：冨澤商店食用精油

━━━━━━━━━━━━━━━━━━━━
◆ 装饰
━━━━━━━━━━━━━━━━━━━━
烤前顶部撒少许乌龙茶粉末（烤后会沉入焦壳）

━━━━━━━━━━━━━━━━━━━━
◆ 定位
━━━━━━━━━━━━━━━━━━━━
RURU 高端系列
定价：¥4,500/整模`,
  notesJa: `【Fleur Café Basque v3B メモ】

Sadaharu Aoki / Cedric Grolet 風の欧州高級系
ネロリウォーター + 白桃リキュールで花果香を表現`,
  ingredients: [
    { nameZh: "奶油奶酪", nameJa: "クリームチーズ", nameFr: "Cream cheese", qty: 260, unit: "g", brand: "kiri", unitPrice: 0, cost: 0, group: "bowl1", note: "室温" },
    { nameZh: "马斯卡彭", nameJa: "マスカルポーネ", nameFr: "Mascarpone", qty: 100, unit: "g", brand: "Galbani", unitPrice: 0, cost: 0, group: "bowl1", note: "室温" },
    { nameZh: "酸奶油", nameJa: "サワークリーム", nameFr: "Sour cream", qty: 40, unit: "g", brand: "中沢乳業", unitPrice: 0, cost: 0, group: "bowl1", note: "室温" },
    { nameZh: "砂糖", nameJa: "グラニュー糖", nameFr: "Sucre", qty: 95, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "比V2.0少5g" },
    { nameZh: "盐", nameJa: "塩", nameFr: "Sel", qty: 1.5, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "" },
    { nameZh: "橙皮屑", nameJa: "オレンジの皮", nameFr: "Zeste d'orange", qty: 0.5, unit: "個", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "只要橙色部分" },
    { nameZh: "佛手柑皮屑（可选）", nameJa: "ベルガモットの皮（任意）", nameFr: "Zeste bergamote", qty: 0.1, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "少许·可省略" },
    { nameZh: "全蛋", nameJa: "全卵", nameFr: "Œuf entier", qty: 120, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl3", note: "约2.5个M" },
    { nameZh: "蛋黄", nameJa: "卵黄", nameFr: "Jaune d'œuf", qty: 20, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl3", note: "" },
    { nameZh: "35%鲜奶油", nameJa: "35%生クリーム", nameFr: "Crème 35%", qty: 100, unit: "g", brand: "中沢", unitPrice: 0, cost: 0, group: "bowl4", note: "" },
    { nameZh: "手冲咖啡液", nameJa: "ドリップコーヒー", nameFr: "Café filtré", qty: 60, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl4", note: "浅烘" },
    { nameZh: "咖啡粉末", nameJa: "コーヒーパウダー", nameFr: "Café moulu fin", qty: 6, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl4", note: "" },
    { nameZh: "橙花水", nameJa: "ネロリウォーター", nameFr: "Eau de fleur d'oranger", qty: 2, unit: "g", brand: "冨澤商店", unitPrice: 0, cost: 0, group: "bowl4", note: "关键香气" },
    { nameZh: "白桃利口酒", nameJa: "白桃リキュール", nameFr: "Crème de pêche", qty: 5, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl5", note: "替代朗姆" },
    { nameZh: "玉米淀粉", nameJa: "コーンスターチ", nameFr: "Maïzena", qty: 10, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl5", note: "" },
    { nameZh: "乌龙茶粉（装饰）", nameJa: "烏龍茶粉（仕上げ）", nameFr: "Poudre d'Oolong", qty: 0.5, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "none", note: "烤前撒顶部" },
  ],
  stepsZh: [
    "① 所有乳制品室温回温",
    "② 奶油奶酪打至柔软",
    "③ 加入砂糖+盐+橙皮屑（+可选佛手柑皮屑）低速混合",
    "④ 分次加入全蛋+蛋黄",
    "⑤ 依次加入马斯卡彭、酸奶油",
    "⑥ 加入 35% 鲜奶油",
    "⑦ 加入咖啡液、咖啡粉末、橙花水",
    "⑧ 加入白桃利口酒",
    "⑨ 筛入玉米淀粉轻柔拌匀",
    "⑩ 面糊过筛",
    "⑪ 倒入 15cm セルクル",
    "⑫ 顶部均匀撒少许乌龙茶粉末（0.5g）",
    "⑬ 230°C 烤 28 分钟",
    "⑭ 室温冷却 1 小时 → 冷藏 12 小时",
  ],
  stepsJa: [
    "① 乳製品を室温に戻す",
    "② クリームチーズを滑らかに",
    "③ 砂糖+塩+オレンジ皮（+ベルガモット皮）を低速で混合",
    "④ 全卵+卵黄を分けて加える",
    "⑤ マスカルポーネ、サワークリームを加える",
    "⑥ 35%生クリームを加える",
    "⑦ コーヒー液、コーヒー粉、ネロリウォーターを加える",
    "⑧ 白桃リキュールを加える",
    "⑨ コーンスターチを加え優しく混ぜる",
    "⑩ こす",
    "⑪ 15cmセルクルに流し込む",
    "⑫ 表面に烏龍茶粉を少量（0.5g）散らす",
    "⑬ 230℃で28分",
    "⑭ 室温1時間→冷蔵12時間",
  ],
  imageUrls: [],
};

// ───────────── V3C 真·瑰夏双咖啡版 ─────────────
const COFFEE_BASQUE_V3C = {
  id: 1005,
  nameZh: "瑰夏双咖啡巴斯克 v3C",
  nameJa: "ゲイシャ・デュオ v3C",
  nameFr: "Geisha Duo Basque",
  category: "生菓子",
  mold: "15cm セルクル",
  yield: 1, unit: "台",
  time: 120, temp: "230°C", baketime: "28分 + 冷萃12h",
  price: 5800, difficulty: "★★★★ 高难度",
  storage: "冷蔵3日（浸透后）・冷凍不推奨",
  allergens: "卵・乳",
  totalCost: 0, unitCost: 0, margin: 0,
  familyId: "family_basque",
  variantLabel: "v3C 瑰夏双咖啡版",
  variantNotes: "V2.0 + 烤制用中烘耶加雪菲 + 出炉后刷瑰夏冷萃浓缩液",
  notesZh: `【ゲイシャ・デュオ 瑰夏双咖啡巴斯克 V3C 构想备忘】

━━━━━━━━━━━━━━━━━━━━
◆ 革命性设计
━━━━━━━━━━━━━━━━━━━━
同一个蛋糕上的"双咖啡体验"：
• 烤制用：中烘耶加雪菲（保留咖啡身体+焦糖感）
• 装饰用：瑰夏冷萃（保留花香+白桃+佛手柑）
• 冷藏12h让瑰夏香气渗入顶层

━━━━━━━━━━━━━━━━━━━━
◆ 瑰夏冷萃制作（前一天准备）
━━━━━━━━━━━━━━━━━━━━
瑰夏豆 10g（选巴拿马翡翠庄园 or 哥伦比亚花魁）
研磨度：中粗（像粗盐）
水温：冰水（0-4°C）
水量：150g
浸泡时间：12小时（冷藏）
过滤后收集液体，浓缩到约80g（小火收到原来一半）

━━━━━━━━━━━━━━━━━━━━
◆ 装饰涂刷
━━━━━━━━━━━━━━━━━━━━
蛋糕出炉后，趁热用毛刷涂瑰夏冷萃 15-20g
注意：分2-3次涂，让咖啡充分渗入
冷藏 12 小时后瑰夏香气会渗透到顶层 1-2cm

━━━━━━━━━━━━━━━━━━━━
◆ 咖啡豆选择（烤制用）
━━━━━━━━━━━━━━━━━━━━
必须中烘（浅烘花香会被烤制损失太多）
推荐：中烘耶加雪菲、中烘哥伦比亚、中烘肯尼亚

━━━━━━━━━━━━━━━━━━━━
◆ 成本与定位
━━━━━━━━━━━━━━━━━━━━
瑰夏豆：¥800-1500/10g
每台成本增加约 ¥1,500-2,000
定位：RURU 限量·最高端
建议售价：¥5,800-6,000/整模
产量：每周限定 3-5 台
目标客群：咖啡迷、高消费客人

━━━━━━━━━━━━━━━━━━━━
◆ 注意事项
━━━━━━━━━━━━━━━━━━━━
• 瑰夏冷萃很娇嫩，当天用完
• 不建议冷冻保存（花香会损失）
• 建议切块前装饰鲜花瓣（可食用玫瑰等）`,
  notesJa: `【ゲイシャ・デュオ v3C 革新的設計メモ】

一つのケーキで「2つのコーヒー体験」を実現：
• 焼成用：中煎り（コーヒーのボディ）
• 仕上げ：ゲイシャの冷萃（花香・白桃・ベルガモット）
• 冷蔵12時間で香りが上層に浸透`,
  ingredients: [
    { nameZh: "奶油奶酪", nameJa: "クリームチーズ", nameFr: "Cream cheese", qty: 260, unit: "g", brand: "kiri", unitPrice: 0, cost: 0, group: "bowl1", note: "室温" },
    { nameZh: "马斯卡彭", nameJa: "マスカルポーネ", nameFr: "Mascarpone", qty: 100, unit: "g", brand: "Galbani", unitPrice: 0, cost: 0, group: "bowl1", note: "室温" },
    { nameZh: "酸奶油", nameJa: "サワークリーム", nameFr: "Sour cream", qty: 40, unit: "g", brand: "中沢乳業", unitPrice: 0, cost: 0, group: "bowl1", note: "室温" },
    { nameZh: "砂糖", nameJa: "グラニュー糖", nameFr: "Sucre", qty: 100, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "" },
    { nameZh: "盐", nameJa: "塩", nameFr: "Sel", qty: 1.5, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "" },
    { nameZh: "柠檬皮屑", nameJa: "レモンの皮", nameFr: "Zeste de citron", qty: 0.25, unit: "個", brand: "", unitPrice: 0, cost: 0, group: "bowl2", note: "" },
    { nameZh: "全蛋", nameJa: "全卵", nameFr: "Œuf entier", qty: 120, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl3", note: "" },
    { nameZh: "蛋黄", nameJa: "卵黄", nameFr: "Jaune d'œuf", qty: 20, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl3", note: "" },
    { nameZh: "35%鲜奶油", nameJa: "35%生クリーム", nameFr: "Crème 35%", qty: 100, unit: "g", brand: "中沢", unitPrice: 0, cost: 0, group: "bowl4", note: "" },
    { nameZh: "中烘咖啡液（烤制用）", nameJa: "中煎りコーヒー液", nameFr: "Café filtré medium", qty: 60, unit: "g", brand: "中烘耶加雪菲", unitPrice: 0, cost: 0, group: "bowl4", note: "不用浅烘" },
    { nameZh: "中烘咖啡粉末", nameJa: "中煎りコーヒー粉", nameFr: "Café moulu medium", qty: 6, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl4", note: "" },
    { nameZh: "玉米淀粉", nameJa: "コーンスターチ", nameFr: "Maïzena", qty: 10, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl5", note: "" },
    { nameZh: "黑朗姆酒", nameJa: "ダークラム", nameFr: "Rhum brun", qty: 5, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "bowl5", note: "" },
    { nameZh: "瑰夏豆（冷萃用）", nameJa: "ゲイシャ豆（冷萃用）", nameFr: "Geisha beans", qty: 10, unit: "g", brand: "Panama Esmeralda", unitPrice: 0, cost: 0, group: "none", note: "前一天冷萃" },
    { nameZh: "冰水（冷萃用）", nameJa: "氷水（冷萃用）", nameFr: "Eau glacée", qty: 150, unit: "g", brand: "", unitPrice: 0, cost: 0, group: "none", note: "0-4°C" },
  ],
  stepsZh: [
    "【前一天】① 瑰夏豆 10g 中粗研磨",
    "【前一天】② 加 150g 冰水，冷藏浸泡 12 小时",
    "【前一天】③ 过滤咖啡液，小火浓缩到约 80g",
    "【前一天】④ 冷萃液冷藏备用",
    "【当天】⑤ 所有乳制品室温回温",
    "⑥ 奶油奶酪打至柔软",
    "⑦ 加入砂糖+盐+柠檬皮屑混合",
    "⑧ 分次加入全蛋+蛋黄",
    "⑨ 依次加入马斯卡彭、酸奶油",
    "⑩ 加入 35% 鲜奶油",
    "⑪ 加入中烘咖啡液、中烘咖啡粉末、朗姆酒",
    "⑫ 筛入玉米淀粉轻柔拌匀",
    "⑬ 面糊过筛",
    "⑭ 倒入 15cm セルクル",
    "⑮ 230°C 烤 28 分钟",
    "⑯ 出炉后趁热用毛刷涂瑰夏冷萃（分2-3次涂，共15-20g）",
    "⑰ 室温冷却 1 小时 → 冷藏 12 小时让瑰夏香气渗入",
  ],
  stepsJa: [
    "【前日】① ゲイシャ豆10gを中粗挽き",
    "【前日】② 氷水150gで12時間冷蔵浸漬",
    "【前日】③ こして約80gまで弱火で濃縮",
    "【前日】④ 冷萃液を冷蔵保存",
    "【当日】⑤ 乳製品を室温に戻す",
    "⑥ クリームチーズを滑らかに",
    "⑦ 砂糖+塩+レモン皮を混合",
    "⑧ 全卵+卵黄を分けて加える",
    "⑨ マスカルポーネ、サワークリームを加える",
    "⑩ 35%生クリームを加える",
    "⑪ 中煎りコーヒー液、中煎りコーヒー粉、ラムを加える",
    "⑫ コーンスターチを加え混ぜる",
    "⑬ こす",
    "⑭ セルクルに流し込む",
    "⑮ 230℃で28分",
    "⑯ 焼き上がり直後にゲイシャ冷萃（計15-20g）を2-3回に分けて塗る",
    "⑰ 室温1時間→冷蔵12時間で香りを浸透させる",
  ],
  imageUrls: [],
};


const AGREABLE_MOUSSE = {
  id: "comp_agreable_mousse",
  nameZh: "白巧焦糖慕斯",
  nameJa: "ムース ショコラブランキャラメル",
  nameFr: "Mousse chocolat blanc caramélisé",
  componentCategory: "mousse",
  yield: 1799, unit: "g",
  ingredients: [
    { nameZh: "淡奶油35%（焦糖用）", nameJa: "生クリーム35%（キャラメル用）", nameFr: "Crème 35%", qty: 135, unit: "g", brand: "", unitPrice: 1.40, cost: 189 },
    { nameZh: "牛乳", nameJa: "牛乳", nameFr: "Lait", qty: 135, unit: "g", brand: "", unitPrice: 0.25, cost: 34 },
    { nameZh: "细砂糖（焦糖用）", nameJa: "グラニュー糖（キャラメル用）", nameFr: "Sucre (caramel)", qty: 80, unit: "g", brand: "", unitPrice: 0.37, cost: 30 },
    { nameZh: "板明胶（金装）", nameJa: "板ゼラチン（ゴールド）", nameFr: "Gélatine en feuille (or)", qty: 4, unit: "g", brand: "新田", unitPrice: 7.00, cost: 28 },
    { nameZh: "蛋黄", nameJa: "卵黄", nameFr: "Jaunes d'œufs", qty: 180, unit: "g", brand: "", unitPrice: 0.60, cost: 108 },
    { nameZh: "焦糖白巧克力（Dulcey 35%）", nameJa: "ショコラブラン（Dulcey 35%）", nameFr: "Chocolat blond Dulcey", qty: 595, unit: "g", brand: "Valrhona Dulcey", unitPrice: 4.80, cost: 2856 },
    { nameZh: "淡奶油35%（后加）", nameJa: "生クリーム35%（後入れ）", nameFr: "Crème 35% (ajout final)", qty: 660, unit: "g", brand: "", unitPrice: 1.40, cost: 924 },
  ],
  stepsZh: [
    "淡奶油660g提前打发至6分立，放冰箱冷藏备用（整个流程最后才用）",
    "小锅中把牛乳135g加热至温热（不煮沸）",
    "另一小锅干煮细砂糖80g至焦糖化",
    "焦糖呈理想琥珀色时加入温热牛乳（注意：此时不加入冷淡奶油），立即停止焦糖化反应",
    "继续小火加热，将残留的硬焦糖粒完全融化均匀",
    "过筛倒入装有冷淡奶油135g的盆中（淡奶油全程不加热）",
    "把这些液体全部倒入装有蛋黄180g的盆中，搅拌均匀",
    "加入用冰水泡发并挤干水分的板明胶4g，搅拌混合",
    "液体倒回小锅，小火加热、持续搅拌至84°C",
    "离火后继续搅拌1〜2分钟（避免底部凝固成蛋花状、温度均匀化）",
    "焦糖白巧克力（Dulcey）不要事先融化，固体状态放入盆中",
    "将热液体全部倒入巧克力中，静置30秒〜1分钟",
    "把一半液体倒回小锅，剩下一半逐渐搅拌让巧克力乳化",
    "把倒出的液体分多次加回去充分乳化（量大时可用食品料理机）",
    "英式蛋奶酱底料冷却至45°C",
    "从冰箱取出冷藏的打发奶油，调整至6分立（若状态偏软可稍打几下）",
    "英式蛋奶酱底料（45°C）+ 打发奶油（10°C）混合，目标温度25〜28°C",
    "倒入模具，冷冻（白巧完全结晶化需24小时，前日仕込み必须）",
  ],
  stepsJa: [
    "生クリーム660gを6分立てに泡立て、冷蔵庫で保存（最後に使用）",
    "小鍋で牛乳135gを温める（沸騰させない）",
    "別の小鍋でグラニュー糖80gを乾キャラメル化する",
    "理想的な琥珀色になったら温めた牛乳を加える（冷たい生クリームは加熱しない）、キャラメル化を止める",
    "弱火に戻し、残った硬いカラメル粒を完全に融かす",
    "過篩して冷たい生クリーム135gが入ったボウルに注ぐ（生クリームは加熱しない）",
    "この液体を全量、卵黄180gが入ったボウルに加えて混ぜる",
    "氷水で戻して水気を切った板ゼラチン4gを加えて混ぜる",
    "液体を鍋に戻し、弱火で絶えず混ぜながら84°Cまで炊き上げる",
    "離火後も1〜2分混ぜ続ける（スクランブル状態防止・温度均一化）",
    "ショコラブラン（Dulcey）は融かさず、固体のままボウルに用意",
    "熱い液体を全量ショコラに注入し、30秒〜1分静置",
    "液体の半分を元の鍋に戻し、残り半分で徐々に乳化させる",
    "戻した液体を少しずつ加えながら完全に乳化（量が多い場合はロボクープ使用）",
    "アングレーズベースを45°Cまで冷却",
    "冷蔵庫から泡立てた生クリームを取り出し、6分立てに調整（柔らかければ少し泡立て直す）",
    "アングレーズベース（45°C）+ 泡立てた生クリーム（10°C）を混合、目標温度25〜28°C",
    "型入れ、冷凍（白巧の完全結晶化には24時間必要、前日仕込み必須）",
  ],
  notesZh: `【核心技术要点：猿館英名主厨流】
核心理念：每个工序都要极致地控制水分与温度

【7大独特做法】
1. 焦糖化只用牛奶停止（冷淡奶油全程不加热）
2. 明胶共煮：最初就投入，让水分与明胶一体化、蒸发多余水分
3. 84°C达到后继续搅拌1-2分钟（避免底部蛋花状、温度均匀化）
4. 「先倒后收」乳化法：保留可可脂结晶种
5. 选择焦糖白巧克力（Dulcey等、非法芙娜）
6. 温度计算：660g×10°C + 1139g×45°C → 理论32°C、实际25〜28°C
7. 过筛：主厨偶尔省略，但标准做法必须过筛

【水分比】
水分（135+135+180=450g）:巧克力（595g）≈ 1:1.3
这个比例最适合「先倒后收」乳化法

【为什么前日仕込み必须】
Dulcey 35% 可可脂含量约30〜35%
白巧克力系结晶时间约24小时

【关联知识点】
・板ゼラチン温度带资料
・ゼラチン失活的温度×时间法则
・ガナッシュ水分比与操作方式
・可可脂的6种结晶形态
・白巧 vs 黑巧 结晶时间
・温度流失的实战因素`,
    notesJa: `【核心技術ポイント：猿館英名シェフ流】
「各工程で水分と温度を極限までコントロールする」

【7つの独特手法】
1. カラメリゼは牛乳のみで止める（冷たい生クリームは加熱しない）
2. ゼラチン共炊き：最初から投入、水分一体化、余分な水分を蒸発
3. 84°C到達後も1-2分攪拌を続ける（スクランブル防止・温度均一化）
4. 「先入れ後戻し」乳化法：ココアバター結晶種を保持
5. カラメル化ホワイトチョコ（Dulcey等、Valrhona以外）を選ぶ
6. 温度計算：660g×10°C + 1139g×45°C → 理論32°C、実際25〜28°C
7. 過篩：シェフは時々省略するが、標準的には必須

【水分比】
水分（135+135+180=450g）:ショコラ（595g）≈ 1:1.3
「先入れ後戻し」がこの比率に最適

【なぜ前日仕込みが必須か】
Dulcey 35% ココアバター含量約30〜35%
ホワイトチョコ系の結晶化時間は約24時間

【関連知識】
・板ゼラチン温度帯資料
・ゼラチン失活の温度×時間法則
・ガナッシュ水分比と操作方法
・ココアバターの6つの結晶形態
・ホワイト vs ダーク 結晶化時間
・温度損失の実戦要因`,
  totalCost: 4169,
  updatedAt: new Date().toISOString(),
};


// ═══ v11 迁移：materials.pricePerG → priceRange { mid, asOf } ═══
// 幂等：已有 priceRange 则跳过；保留 pricePerG 字段不删，兼容老 UI 代码
function migrateMaterialsToPriceRange(materials) {
  if (!Array.isArray(materials)) return materials;
  return materials.map(m => {
    if (m && m.priceRange && typeof m.priceRange === 'object') return m;
    const p = parseFloat(m && m.pricePerG);
    if (!isNaN(p) && p > 0) {
      return { ...m, priceRange: { mid: String(p), asOf: "2026-04" } };
    }
    return m;
  });
}

// ═══ v14 迁移：imageUrls 字段统一格式 ═══
// 旧 string 'https://...' → { source, url, caption: '' }
// 旧 dict { url, caption } → 加 source 字段
// 新 { source, url?, imageId?, caption?, sourceUrl? } → 跳过（idempotent）
// source: 'orderie' | 'manual' | 'upload' | 'crawl' (v15 加)
// sourceUrl: 'crawl' 来源专用，记录抓自哪个 URL；其他来源不需要
function normalizeImageEntry(img) {
  if (typeof img === 'string') {
    return {
      source: img.includes('orderie.jp') ? 'orderie' : 'manual',
      url: img,
      caption: '',
    };
  }
  if (img && typeof img === 'object') {
    if (img.source) return img; // 已是新格式
    if (img.url) {
      return {
        source: img.url.includes('orderie.jp') ? 'orderie' : 'manual',
        url: img.url,
        imageId: img.imageId,
        caption: img.caption || '',
      };
    }
  }
  return null;
}

function migrateImageUrls(items) {
  if (!Array.isArray(items)) return items;
  return items.map(it => {
    if (!it || !Array.isArray(it.imageUrls) || it.imageUrls.length === 0) return it;
    const next = it.imageUrls.map(normalizeImageEntry).filter(Boolean);
    return { ...it, imageUrls: next };
  });
}

// v15: 从 imageUrls 数组里剥离 source='crawl' 的图（IP 分发包过滤用）
// 仅对 materials.imageUrls 有效：其他实体（recipes/components/creations/brands/productFamilies）
// 的 imageUrls 是 v14 之前的老格式 array<string>，不含 source 字段，无法产生 'crawl' 来源
function stripCrawlImages(items) {
  if (!Array.isArray(items)) return items;
  return items.map(it => {
    if (!it || !Array.isArray(it.imageUrls)) return it;
    const filtered = it.imageUrls.filter(img => !(img && typeof img === 'object' && img.source === 'crawl'));
    if (filtered.length === it.imageUrls.length) return it;
    return { ...it, imageUrls: filtered };
  });
}

// ─── v14 图片 IndexedDB: 存放本地上传 / 抓取的 Blob ─────────────
// 与 BACKUP_DB 同模式（原生 IndexedDB）。imageUrls[i].imageId 引用 store 里的 id。
const IMAGES_DB = "patisserie_images";
const IMAGES_STORE = "images";

function openImagesDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(IMAGES_DB, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        db.createObjectStore(IMAGES_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putImageBlob({ blob, mimeType, source, sku }) {
  try {
    const db = await openImagesDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGES_STORE, "readwrite");
      const req = tx.objectStore(IMAGES_STORE).add({
        blob,
        mimeType: mimeType || "image/jpeg",
        size: blob && blob.size ? blob.size : 0,
        source: source || "upload",
        sku: sku || undefined,
        addedAt: new Date().toISOString(),
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    if (typeof console !== "undefined" && console.warn) console.warn("[images] put failed:", e && e.message);
    return null;
  }
}

async function getImageBlob(id) {
  if (!id) return null;
  try {
    const db = await openImagesDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGES_STORE, "readonly");
      const req = tx.objectStore(IMAGES_STORE).get(id);
      req.onsuccess = () => resolve(req.result && req.result.blob ? req.result.blob : null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return null;
  }
}

async function deleteImageBlob(id) {
  if (!id) return;
  try {
    const db = await openImagesDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGES_STORE, "readwrite");
      const req = tx.objectStore(IMAGES_STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {}
}

// ─── 自动备份: IndexedDB 多版本快照 (v13.1) ───────────────────
// 每次 saveData 自动写一份到 IndexedDB,保留最近 BACKUP_MAX 份。
// 万一 localStorage 被清/损坏,可从备份列表里挑一个版本恢复。
const BACKUP_DB = "patisserie_backup";
const BACKUP_STORE = "snapshots";
const BACKUP_MAX = 30;

function openBackupDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(BACKUP_DB, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(BACKUP_STORE)) {
        const store = db.createObjectStore(BACKUP_STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("savedAt", "savedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// 同 payload 不重复备份(短时间内多次 save 内容相同时去重)
let _lastBackupPayloadLen = 0;
let _lastBackupTs = 0;
async function addBackupSnapshot(payload) {
  if (!payload) return;
  const now = Date.now();
  // 去重: 内容长度相同 + 距上次 < 1.5s 视为重复(自动保存连发)
  if (payload.length === _lastBackupPayloadLen && now - _lastBackupTs < 1500) return;
  _lastBackupPayloadLen = payload.length;
  _lastBackupTs = now;
  try {
    const db = await openBackupDB();
    const tx = db.transaction(BACKUP_STORE, "readwrite");
    const store = tx.objectStore(BACKUP_STORE);
    store.add({ payload, savedAt: new Date().toISOString(), size: payload.length });
    // 清理超过 BACKUP_MAX 的旧记录
    const idx = store.index("savedAt");
    const countReq = store.count();
    countReq.onsuccess = () => {
      const surplus = countReq.result - BACKUP_MAX;
      if (surplus > 0) {
        const cursorReq = idx.openCursor();
        let deleted = 0;
        cursorReq.onsuccess = () => {
          const cur = cursorReq.result;
          if (cur && deleted < surplus) {
            cur.delete();
            deleted++;
            cur.continue();
          }
        };
      }
    };
  } catch (e) {
    // 备份失败不影响主流程,只 warn
    if (typeof console !== "undefined" && console.warn) console.warn("[backup] failed:", e && e.message);
  }
}

async function listBackupSnapshots() {
  try {
    const db = await openBackupDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(BACKUP_STORE, "readonly");
      const req = tx.objectStore(BACKUP_STORE).getAll();
      req.onsuccess = () => resolve((req.result || []).sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || "")));
      req.onerror = () => resolve([]);
    });
  } catch (e) { return []; }
}

async function deleteBackupSnapshot(id) {
  try {
    const db = await openBackupDB();
    const tx = db.transaction(BACKUP_STORE, "readwrite");
    tx.objectStore(BACKUP_STORE).delete(id);
  } catch (e) {}
}

// ─── 内容质量扫描 v13.1: 中日混杂 + 图片 markdown ───────────────
// 假名(平假名 + 片假名) → 一定是日语
const KANA_REGEX = /[぀-ゟ゠-ヿ]/;
// 部分日本/繁体常见字符 (与简体不同写法), 出现在 zh 字段视为可疑
// 这是粗筛, 不全; 漏掉的让用户看结果再补
const JP_TRAD_REGEX = /[圧関様樣業學戀變應對爲將專滿実発両點時長處義價會體機県檢藝禮數聲個別結連続戰戦開閉學變實證圍邊裏麼歲萬車當紀稱讀寫畫龍齡]/;

// 检测中文字段里是否混入日语/繁体字符
function detectJpInZh(s) {
  if (!s || typeof s !== "string") return null;
  const km = s.match(KANA_REGEX);
  const jm = s.match(JP_TRAD_REGEX);
  const m = km || jm;
  if (!m) return null;
  const idx = s.indexOf(m[0]);
  const start = Math.max(0, idx - 12);
  const end = Math.min(s.length, idx + 25);
  return {
    kind: km ? "假名" : "日/繁汉字",
    char: m[0],
    snippet: (start > 0 ? "..." : "") + s.slice(start, end) + (end < s.length ? "..." : ""),
  };
}

// 检测文本里是否有 markdown 图片或 HTML <img> 标记 (但实际渲染是 plain text)
const IMG_MARKUP_REGEX = /(!\[[^\]]*\]\([^)]+\))|(<img[^>]*>)/i;
function detectImgMarkup(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(IMG_MARKUP_REGEX);
  if (!m) return null;
  const idx = s.indexOf(m[0]);
  const start = Math.max(0, idx - 12);
  const end = Math.min(s.length, idx + m[0].length + 12);
  return {
    kind: m[0].startsWith("![") ? "markdown" : "<img>",
    match: m[0],
    snippet: (start > 0 ? "..." : "") + s.slice(start, end) + (end < s.length ? "..." : ""),
  };
}

const ZH_FIELDS_MATERIAL = ["nameZh", "featuresZh", "usesZh", "notesZh"];
const ZH_FIELDS_BRAND = ["nameZh", "storyZh"];
const ALL_TEXT_FIELDS_MATERIAL = ["nameZh", "nameJa", "nameFr", "featuresZh", "featuresJa", "usesZh", "usesJa", "notesZh", "notesJa"];
const ALL_TEXT_FIELDS_BRAND = ["nameZh", "nameJa", "nameFr", "storyZh", "storyJa"];

function scanContentQuality(materials, brands) {
  const jpMixed = [];
  const imgMarkup = [];
  const checkOne = (entity, type, zhFields, allFields) => {
    const name = entity.nameZh || entity.nameJa || entity.nameFr || entity.id;
    zhFields.forEach(f => {
      const r = detectJpInZh(entity[f]);
      if (r) jpMixed.push({ type, id: entity.id, name, field: f, ...r });
    });
    if (entity.parameters && typeof entity.parameters === "object") {
      Object.entries(entity.parameters).forEach(([k, v]) => {
        const r = detectJpInZh(v);
        if (r) jpMixed.push({ type, id: entity.id, name, field: "参数:" + k, ...r });
      });
    }
    allFields.forEach(f => {
      const r = detectImgMarkup(entity[f]);
      if (r) imgMarkup.push({ type, id: entity.id, name, field: f, ...r });
    });
  };
  (materials || []).forEach(m => checkOne(m, "material", ZH_FIELDS_MATERIAL, ALL_TEXT_FIELDS_MATERIAL));
  (brands || []).forEach(b => checkOne(b, "brand", ZH_FIELDS_BRAND, ALL_TEXT_FIELDS_BRAND));
  return { jpMixed, imgMarkup };
}

function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (d && (d.recipes || d.cats)) {
      // v11 迁移
      if (!d.version || d.version < 11) {
        d.materials = migrateMaterialsToPriceRange(d.materials);
        if (!Array.isArray(d.shopMaterials)) d.shopMaterials = [];
      }
      // v12 迁移: 库存管理系统三实体
      if (!d.version || d.version < 12) {
        if (!Array.isArray(d.products)) d.products = [];
        if (!Array.isArray(d.salesLog)) d.salesLog = [];
        if (!Array.isArray(d.productionLog)) d.productionLog = [];
      }
      // v13 迁移: 供货商 + 采购清单
      if (!d.version || d.version < 13) {
        if (!Array.isArray(d.suppliers)) d.suppliers = [];
        // shopMaterials 旧数据保证有 supplierIds 字段(空数组)
        if (Array.isArray(d.shopMaterials)) {
          d.shopMaterials = d.shopMaterials.map(sm => Array.isArray(sm.supplierIds) ? sm : { ...sm, supplierIds: [] });
        }
      }
      // v14 迁移: imageUrls 字段统一格式（仅 materials；其他 4 实体待后续 bump）
      if (!d.version || d.version < 14) {
        d.materials = migrateImageUrls(d.materials);
      }
      // v15 迁移: imageUrls.source 加 'crawl' 枚举 + sourceUrl 字段约定（无字段迁移，新数据用）
      if (!d.version || d.version < 15) {
        // 'crawl' 是新增枚举值，旧数据不存在；normalizeImageEntry 已通过 spread 兼容新字段
      }
      // v16 迁移: suppliers.closureWindows 从 MM-DD 升级到 YYYY-MM-DD (绝对日期，跨年安全)
      if (!d.version || d.version < 16) {
        if (Array.isArray(d.suppliers)) {
          const yr = new Date().getFullYear();
          d.suppliers = d.suppliers.map(s => {
            if (!Array.isArray(s.closureWindows)) return s;
            const upgraded = s.closureWindows.map(w => {
              if (!w || !w.start || !w.end) return w;
              // 已经是 YYYY-MM-DD 则不动
              const isYMD = (str) => str.length === 10 && str.split("-").length === 3 && str.split("-")[0].length === 4;
              if (isYMD(w.start) && isYMD(w.end)) return w;
              // 老 MM-DD 升级: start 用当年, end 同年(若 end >= start) 或下一年(跨年)
              const startMD = w.start.length === 5 ? w.start : w.start.slice(-5);
              const endMD = w.end.length === 5 ? w.end : w.end.slice(-5);
              const endYear = endMD < startMD ? yr + 1 : yr;
              return { ...w, start: `${yr}-${startMD}`, end: `${endYear}-${endMD}` };
            });
            return { ...s, closureWindows: upgraded };
          });
        }
      }
      return d;
    }
  } catch (e) {}
  return null;
}

function saveData(recipes, cats, components, creations, knowledge, brands, materials, printSettings, customCompCats, productFamilies, shopMaterials, products, salesLog, productionLog, suppliers, appSettings) {
  try {
    const payload = JSON.stringify({ recipes, cats, components, creations, knowledge, brands, materials, printSettings, customCompCats, productFamilies, shopMaterials, products, salesLog, productionLog, suppliers, appSettings, savedAt: new Date().toISOString(), version: 17 });
    localStorage.setItem(STORAGE_KEY, payload);
    // 自动备份到 IndexedDB (fire-and-forget,失败不影响主流程)
    addBackupSnapshot(payload);
    return { ok: true, size: payload.length };
  } catch (e) {
    // v56: 不再静默吞错。localStorage 限额约 5MB,超出会抛 QuotaExceededError
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

// 智能合并：保留用户数据，同时补入缺失的预置项目
// 只在同 id 不存在时才加入，不会覆盖用户已经修改过的同 id 项目
function mergeWithDefaults(userItems, defaultItems) {
  const userIds = new Set((userItems || []).map(x => x.id));
  const missing = defaultItems.filter(d => !userIds.has(d.id));
  return [...(userItems || []), ...missing];
}

// 🔧 v57 新增:安全数字转换,避免 NaN 显示
// parseFloat("abc") === NaN,num("abc") === 0
// parseFloat("450g") === 450 (OK) / parseFloat("1KG") === 1 (错!要用 parsePackSizeToGrams)
function num(x, fallback = 0) {
  if (x == null || x === "") return fallback;
  const n = parseFloat(x);
  return isNaN(n) ? fallback : n;
}

// 🔧 v56 新增:把 packSize 字符串解析成克数
// 支持: "450" → 450 / "450g" → 450 / "1kg" → 1000 / "2.5KG" → 2500
// 多规格 "1KG/10KG" 取第一个: 1000
// "1kg 冷凍" → 1000
// 不合法或空 → 0
function parsePackSizeToGrams(ps) {
  if (!ps) return 0;
  const str = String(ps).trim();
  // 多规格 "1KG/10KG" 取第一段
  const first = str.split(/[\/、，,]/)[0].trim();
  const m = first.match(/^\s*(\d+(?:\.\d+)?)\s*(kg|kG|KG|Kg|g|G)?/);
  if (!m) return 0;
  const num = parseFloat(m[1]);
  if (isNaN(num)) return 0;
  const unit = (m[2] || 'g').toLowerCase();
  return unit === 'kg' ? num * 1000 : num;
}

// ─── UI primitives ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// 全局样式注入块
// 本 app 通体 inline style，写不了伪类 / 媒体查询 / @page。凡是这三类规则
// 一律放这里，用语义 class 挂到元素上。T 里不放这些。
// 过渡统一 .15s cubic-bezier(.2,0,.2,1)，只过渡 background / border-color / color / opacity，
// 不过渡 transform 和尺寸。
// ═══════════════════════════════════════════════════════════════
const GLOBAL_CSS = `
/* 中日文字体按当前语言切换（App 里的 useEffect 往 <html> 写 data-lang）。
   默认(含未设置时)走中文栈 —— 这个 app 是中文优先的。 */
:root {
  color-scheme: light;
  --k-cjk: "Noto Sans SC", "Zen Kaku Gothic New", -apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}
:root[data-lang="ja"] {
  --k-cjk: "Zen Kaku Gothic New", "Noto Sans SC", -apple-system, "Hiragino Sans", "Yu Gothic", system-ui, sans-serif;
}
.k-ease { transition: background .15s cubic-bezier(.2,0,.2,1), border-color .15s cubic-bezier(.2,0,.2,1), color .15s cubic-bezier(.2,0,.2,1), opacity .15s cubic-bezier(.2,0,.2,1); }

/* ── 按钮四型三态 ── */
.k-btn { transition: background .15s cubic-bezier(.2,0,.2,1), border-color .15s cubic-bezier(.2,0,.2,1), color .15s cubic-bezier(.2,0,.2,1), opacity .15s cubic-bezier(.2,0,.2,1); }
.k-btn:focus { outline: none; }
.k-btn:focus-visible { outline: 2px solid ${T.info}; outline-offset: 2px; }
.k-btn-default:hover:not(:disabled) { border-color: ${T.ink} !important; background: ${T.sunken} !important; }
.k-btn-default:active:not(:disabled) { background: ${T.line} !important; }
.k-btn-primary:hover:not(:disabled) { background: ${T.strong} !important; border-color: ${T.strong} !important; }
.k-btn-primary:active:not(:disabled) { background: #000000 !important; border-color: #000000 !important; }
.k-btn-ghost:hover:not(:disabled) { background: ${T.sunken} !important; color: ${T.ink} !important; }
.k-btn-danger:hover:not(:disabled) { background: ${T.danger} !important; color: #FFFFFF !important; }
.k-btn-danger:focus-visible { outline-color: ${T.danger}; }
.k-btn-success:hover:not(:disabled) { background: ${T.success} !important; color: #FFFFFF !important; }
.k-btn:disabled { background: transparent !important; border-color: ${T.line} !important; color: ${T.disabled} !important; cursor: not-allowed; }
.k-btn-primary:disabled { background: ${T.disabled} !important; border-color: ${T.disabled} !important; color: ${T.paper} !important; }

/* ── 表格 / 列表行 ── */
.k-row { transition: background .12s cubic-bezier(.2,0,.2,1); }
.k-row:hover { background: ${T.sunken}; }
/* 行内操作默认隐藏，hover 时在行尾淡入 —— 静止时一行只剩四个落点 */
.k-row .k-rowact { opacity: 0; transition: opacity .15s cubic-bezier(.2,0,.2,1); }
.k-row:hover .k-rowact, .k-row:focus-within .k-rowact { opacity: 1; }

/* ── 表单：标签在上方，focus 是描边转黑 + 3px 群青光晕，不做位移 ── */
.k-input { transition: border-color .15s cubic-bezier(.2,0,.2,1), box-shadow .15s cubic-bezier(.2,0,.2,1); }
.k-input:hover:not(:disabled) { border-color: ${T.muted}; }
.k-input:focus, .k-input:focus-visible { outline: none; border-color: ${T.ink}; box-shadow: 0 0 0 3px rgba(59,78,140,0.14); }
.k-input:disabled { background: ${T.sunken}; color: ${T.disabled}; }
.k-input::placeholder { color: ${T.muted}; opacity: 1; }
input, textarea, select, button { font-family: inherit; }

/* ── 顶部 tab：下划线式 ── */
.k-tab { transition: color .15s cubic-bezier(.2,0,.2,1), border-color .15s cubic-bezier(.2,0,.2,1); }
.k-tab:hover { color: ${T.ink}; }
.k-tab:focus-visible { outline: 2px solid ${T.info}; outline-offset: 2px; }

/* ── 折叠标签「+N」的悬浮展开 ── */
.k-more { position: relative; }
.k-more > .k-more-pop { display: none; position: absolute; left: 0; top: 100%; margin-top: 4px; z-index: ${T.z.popover};
  background: ${T.surface}; border: 1px solid ${T.border}; box-shadow: ${T.sh.popover}; padding: 8px; white-space: nowrap; }
.k-more:hover > .k-more-pop, .k-more:focus-within > .k-more-pop { display: flex; gap: 6px; }

/* ── 容器与断点 ── */
.rc-container { max-width: 1180px; margin: 0 auto; padding-left: 32px; padding-right: 32px; }
.k-mobile-only { display: none; }
/* 底栏和「更多」抽屉只在手机出现 */
.k-bottomnav, .k-drawer { display: none !important; }
@media (max-width: 1023px) {
  .rc-container { padding-left: 24px; padding-right: 24px; }
}
@media (max-width: 1023px) {
  /* 平板：配料表去掉品牌列 */
  .rc-ing-head, .rc-ing-row, .rc-ing-total { grid-template-columns: 1fr 110px 88px !important; }
}
@media (max-width: 599px) {
  .rc-container { padding-left: 16px; padding-right: 16px; }
  .k-desktop-only { display: none !important; }
  .k-mobile-only { display: block; }
  /* 顶部 10 tab 横滚条换成底部 5 tab 固定栏 */
  .k-topnav { display: none !important; }
  .k-bottomnav { display: grid !important; }
  .k-drawer { display: flex !important; }
  /* 内容区给底栏让出空间 */
  .k-main { padding-bottom: 96px !important; }
  /* 底栏在拇指区，所有可点元素 ≥ 44px */
  .k-bottomnav button { min-height: 52px; }
  /* 手机：配料行改「左名右量」两栏，行高 ≥ 60，盆色竖条加粗到 4px */
  .rc-ing-head { display: none !important; }
  .rc-ing-row, .rc-ing-total { grid-template-columns: 1fr auto !important; min-height: 60px; align-items: center !important; border-left-width: 4px !important; }
  .rc-ing-row { padding: 13px 0 !important; }
  /* 名称占满左侧两行，用量在右上、成本在右下，行高才齐 */
  .rc-ing-row > *:first-child { grid-row: 1 / span 2; align-self: center; }
  .rc-ing-row > *:nth-child(2) { grid-column: 2; align-self: end; }
  .rc-ing-row > *:last-child { grid-column: 2; align-self: start; }
  .rc-recipe-row { grid-template-columns: 1fr auto !important; gap: 12px !important; }
  /* 标题块单列 */
  .rc-title { grid-template-columns: 1fr !important; gap: 20px !important; }
  .rc-title > div:last-child { text-align: left !important; }
}

/* ── 中日切换后同一标题可能长 3 倍：一律允许换行，绝不固定宽度或 nowrap ── */
.k-fluid { min-width: 0; overflow-wrap: anywhere; }
`;

// 按钮四型三态。hover / focus-visible / disabled 由全局 <style> 里的 .k-btn 规则接管
// （inline style 写不了伪类），所以这里只给静止态。
function Btn({ children, onClick, variant = "default", size = "md", style: s, disabled, title, type }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    border: `1px solid ${T.border}`, borderRadius: T.radius,
    background: "transparent", color: T.ink,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: T.fontSans, fontWeight: 400, whiteSpace: "nowrap",
  };
  // sm 高 28 · md 高 32 · lg 高 44（手机端与主 CTA，满足 44px 触控）
  const sizes = {
    sm: { padding: "5px 12px", fontSize: 11 },
    md: { padding: "7px 14px", fontSize: 12 },
    lg: { padding: "12px 20px", fontSize: 14 },
  };
  const variants = {
    default: {},                                                        // = secondary
    primary: { background: T.ink, color: T.paper, borderColor: T.ink },
    ghost:   { border: "1px solid transparent", color: T.body },
    danger:  { color: T.danger, borderColor: T.danger, background: "transparent" }, // 危险动作描边起手，实心只在 hover
    success: { color: T.success, borderColor: T.success, background: "transparent" },
  };
  return (
    <button
      type={type} title={title} disabled={disabled} onClick={disabled ? undefined : onClick}
      className={`k-btn k-btn-${variants[variant] ? variant : "default"}`}
      style={{ ...base, ...sizes[size], ...(variants[variant] || {}), ...s }}
    >{children}</button>
  );
}

// ─── 自定义确认对话框（替代 window.confirm，确保在所有环境都能工作）────
// 2a §09 · 只在「不可撤销 + 影响到别的数据」时才拦（其余破坏性操作走「先做 + 撤销 toast」）。
// 标题直接写要删的东西的名字，不写「确认操作」；必须列出受影响的引用方。
// Esc 关闭，默认焦点在「取消」。
function ConfirmDialog({ message, onConfirm, onCancel, confirmText = "确定", cancelText = "取消", danger = true, kicker, title, refs = [] }) {
  const cancelRef = useRef(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onCancel?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(22,22,15,0.32)", zIndex: T.z.confirm, display: "flex", alignItems: "center", justifyContent: "center", padding: T.sp.xl }}>
      <div role="dialog" aria-modal="true"
        style={{ background: T.paper, border: `1px solid ${T.ink}`, borderRadius: T.radius, maxWidth: 420, width: "100%", boxShadow: T.sh.overlay }}>
        <div style={{ padding: "24px 24px 20px" }}>
          {kicker && <div style={{ ...T.fs.micro, color: T.subtle, fontFamily: T.fontSerif }}>{kicker}</div>}
          {title && <div style={{ ...T.fs.titleS, marginTop: T.sp.m, color: T.ink, fontFamily: T.fontSans }}>{title}</div>}
          <div style={{ ...T.fs.small, color: T.body, marginTop: title ? 10 : 0, whiteSpace: "pre-wrap", fontFamily: T.fontSans, lineHeight: 1.65 }}>{message}</div>
          {refs.length > 0 && (
            <div style={{ marginTop: 14, borderLeft: `3px solid ${T.warning}`, paddingLeft: T.sp.m, ...T.fs.caption, color: T.body, lineHeight: 1.6 }}>
              {refs.map((x, i) => <div key={i}>{x}</div>)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: T.sp.s, padding: "14px 24px", borderTop: `1px solid ${T.line}` }}>
          <button ref={cancelRef} onClick={onCancel} className="k-btn k-btn-ghost"
            style={{ ...T.fs.caption, padding: "7px 14px", color: T.body, background: "transparent", border: "1px solid transparent", borderRadius: T.radius, cursor: "pointer", fontFamily: T.fontSans }}>
            {cancelText}
          </button>
          <Btn variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmText}</Btn>
        </div>
      </div>
    </div>
  );
}

// 保存配方时弹出: 让用户勾选哪些"未关联材料"要批量加入价格表
function UnlinkedIngredientsDialog({ unlinkedItems, lang, onConfirm, onSkip, onCancel }) {
  // unlinkedItems: [{ idx, nameZh, nameJa, brand, unit, unitPrice }]
  const [checked, setChecked] = useState(() => {
    const init = {};
    unlinkedItems.forEach(it => { init[it.idx] = true; });
    return init;
  });
  const toggle = (idx) => setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
  const checkAll = () => {
    const all = {};
    unlinkedItems.forEach(it => { all[it.idx] = true; });
    setChecked(all);
  };
  const uncheckAll = () => setChecked({});
  const selectedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "1.5rem", maxWidth: 560, width: "100%", maxHeight: "80vh", overflow: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: "#111111", marginBottom: 6 }}>
          {lang === "zh"
            ? `本配方中有 ${unlinkedItems.length} 个材料未在价格表中`
            : `本レシピに価格表未登録の材料が ${unlinkedItems.length} 件あります`}
        </div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
          {lang === "zh"
            ? "勾选要加入价格表的材料,加入后下次输入同名材料就能自动关联。"
            : "価格表に追加する材料を選択。次回同名材料を入力時に自動連動します。"}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: 12 }}>
          <button onClick={checkAll} style={{ background: "none", border: "0.5px solid #CCCCCC", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 12 }}>
            {lang === "zh" ? "全选" : "全選択"}
          </button>
          <button onClick={uncheckAll} style={{ background: "none", border: "0.5px solid #CCCCCC", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 12 }}>
            {lang === "zh" ? "全不选" : "全解除"}
          </button>
          <span style={{ marginLeft: "auto", color: "#666", lineHeight: "22px" }}>{lang === "zh" ? `已选 ${selectedCount}` : `選択中 ${selectedCount}`}</span>
        </div>
        <div style={{ border: "0.5px solid #E5E5E5", borderRadius: 6, maxHeight: 320, overflow: "auto", marginBottom: 14 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ background: "#F5F5F5", position: "sticky", top: 0 }}>
              <tr>
                <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 400, color: "#666", borderBottom: "0.5px solid #E5E5E5", width: 32 }}></th>
                <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 400, color: "#666", borderBottom: "0.5px solid #E5E5E5" }}>{lang === "zh" ? "材料名" : "材料名"}</th>
                <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 400, color: "#666", borderBottom: "0.5px solid #E5E5E5" }}>{lang === "zh" ? "品牌" : "ブランド"}</th>
                <th style={{ padding: "6px 8px", textAlign: "right", fontWeight: 400, color: "#666", borderBottom: "0.5px solid #E5E5E5" }}>{lang === "zh" ? "单价" : "単価"}</th>
              </tr>
            </thead>
            <tbody>
              {unlinkedItems.map(it => (
                <tr key={it.idx} style={{ borderBottom: "0.5px solid #F0F0F0", cursor: "pointer" }} onClick={() => toggle(it.idx)}>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <input type="checkbox" checked={!!checked[it.idx]} onChange={() => toggle(it.idx)} style={{ cursor: "pointer" }} />
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <div>{pickLang(it, "name", lang)}</div>
                    {it.nameZh && it.nameJa && <div style={{ fontSize: 10, color: "#999" }}>{rawLang(it, "name", lang)}</div>}
                  </td>
                  <td style={{ padding: "6px 8px", color: "#666" }}>{it.brand || (lang === "zh" ? "—未定—" : "—未定—")}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#666" }}>{it.unitPrice ? `¥${it.unitPrice}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <Btn onClick={onCancel}>{lang === "zh" ? "返回继续编辑" : "編集に戻る"}</Btn>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={onSkip}>{lang === "zh" ? "跳过, 直接保存" : "スキップして保存"}</Btn>
            <Btn
              onClick={() => onConfirm(Object.keys(checked).filter(k => checked[k]).map(Number))}
              style={{ background: "#0F6E56", color: "#FFFFFF", borderColor: "#0F6E56" }}
              disabled={selectedCount === 0}
            >{lang === "zh" ? `加入并保存` : `追加して保存`}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ 智能模糊匹配 · 给一个 ing 找百科里最可能的候选 ═══
// ─── fuzzyMatchMaterial v57:改为 smartMatchMaterial 的薄包装
// 原来是独立的字符串 includes 匹配算法,现在统一到 smart 分词算法,结果更准
// 返回 {best, bestScore, candidates, highConfidence}
function fuzzyMatchMaterial(ing, materials, brands) {
  if (!ing || (!ing.nameZh && !ing.nameJa)) {
    return { best: null, bestScore: 0, candidates: [], highConfidence: false };
  }
  const scored = smartMatchMaterial(ing, materials, brands); // [{score, material}]
  const best = scored[0] || null;
  // 高置信度:最佳 ≥ 85 且与次优差 ≥ 15,或唯一候选 ≥ 85
  const highConfidence = !!(best && best.score >= 85 && (
    scored.length === 1 || (best.score - (scored[1]?.score || 0)) >= 15
  ));
  return {
    best: best?.material || null,
    bestScore: best?.score || 0,
    candidates: scored.map(x => x.material).slice(0, 5),
    highConfidence,
  };
}

// ═══ 备份恢复弹窗 (v13.1) ═══
function BackupRestoreDialog({ onClose, lang, showToast, confirmDialog }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    listBackupSnapshots().then(s => { if (alive) { setSnapshots(s); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      const m = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${m(d.getMonth()+1)}-${m(d.getDate())} ${m(d.getHours())}:${m(d.getMinutes())}:${m(d.getSeconds())}`;
    } catch { return iso || ""; }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const summarizePayload = (payload) => {
    try {
      const d = JSON.parse(payload);
      const n = (a) => Array.isArray(a) ? a.length : 0;
      return lang === "zh"
        ? `配方 ${n(d.recipes)} · 组件 ${n(d.components)} · 组合 ${n(d.creations)} · 材料 ${n(d.materials)} · 品牌 ${n(d.brands)} · 知识 ${n(d.knowledge)}`
        : `レシピ ${n(d.recipes)} · コンポ ${n(d.components)} · ケーキ ${n(d.creations)} · 材料 ${n(d.materials)} · ブランド ${n(d.brands)}`;
    } catch { return ""; }
  };

  const handleRestore = (snap) => {
    confirmDialog(
      lang === "zh"
        ? `恢复到 ${formatTime(snap.savedAt)} 的备份吗？\n\n当前数据会被这个版本覆盖（恢复前会自动把当前状态再存一份备份，所以可以反悔）。\n\n刷新页面后生效。`
        : `${formatTime(snap.savedAt)} のバックアップに戻しますか?\n現在の状態は自動で別のバックアップとして保存されます。`,
      () => {
        const current = localStorage.getItem(STORAGE_KEY);
        if (current && current !== snap.payload) addBackupSnapshot(current);
        localStorage.setItem(STORAGE_KEY, snap.payload);
        showToast(lang === "zh" ? "✓ 恢复成功，即将刷新" : "✓ 復元完了、リロード中");
        setTimeout(() => location.reload(), 800);
      }
    );
  };

  const handleDelete = (snap) => {
    confirmDialog(
      lang === "zh" ? "删除这个备份吗？(不可恢复)" : "このバックアップを削除?",
      async () => {
        await deleteBackupSnapshot(snap.id);
        const refreshed = await listBackupSnapshots();
        setSnapshots(refreshed);
        showToast(lang === "zh" ? "已删除" : "削除完了");
      }
    );
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.bgCard, borderRadius: T.radiusLg, padding: "1.5rem", width: "100%", maxWidth: 720, maxHeight: "92vh", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: T.fontSerif, fontSize: 18, fontWeight: 500, color: T.brand }}>
              🛟 {lang === "zh" ? "备份恢复" : "バックアップ復元"}
            </div>
            <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 4 }}>
              {lang === "zh"
                ? `自动备份 (浏览器 IndexedDB · 最多保留 ${BACKUP_MAX} 份 · 每次保存自动新增) · 当前 ${snapshots.length} 份`
                : `自動バックアップ (最大 ${BACKUP_MAX} 件) · 現在 ${snapshots.length} 件`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.textTertiary, padding: "4px 8px" }}>×</button>
        </div>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: T.textTertiary, fontSize: 12 }}>{lang === "zh" ? "读取中..." : "読込中..."}</div>
        ) : snapshots.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: T.textTertiary, fontSize: 13, lineHeight: 1.7 }}>
            {lang === "zh"
              ? <>暂无备份。<br/>下次保存数据时会自动产生第一份。</>
              : <>バックアップなし。<br/>次回保存時に自動作成されます。</>}
          </div>
        ) : (
          <div style={{ overflowY: "auto", flex: 1, border: `0.5px solid ${T.border}`, borderRadius: T.radius }}>
            {snapshots.map((s, i) => (
              <div key={s.id} style={{ padding: "10px 12px", borderBottom: i < snapshots.length - 1 ? `0.5px solid ${T.borderSoft}` : "none", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: T.textPrimary }}>
                    {formatTime(s.savedAt)}
                    <span style={{ color: T.textTertiary, fontSize: 10, marginLeft: 8 }}>· {formatSize(s.size)}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 2 }}>{summarizePayload(s.payload)}</div>
                </div>
                <Btn size="sm" onClick={() => handleRestore(s)}>{lang === "zh" ? "恢复" : "復元"}</Btn>
                <button onClick={() => handleDelete(s)} style={{ background: "none", border: "none", cursor: "pointer", color: T.danger, fontSize: 16, padding: "4px 8px" }} title={lang === "zh" ? "删除" : "削除"}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ 内容质量扫描弹窗 (v13.1) ═══
function ContentQualityScanDialog({ onClose, materials, brands, lang, onJumpMaterial, onJumpBrand }) {
  const result = useMemo(() => scanContentQuality(materials, brands), [materials, brands]);
  const [tab, setTab] = useState("jp");
  const list = tab === "jp" ? result.jpMixed : result.imgMarkup;

  const fieldLabel = (f) => {
    const map = {
      nameZh: "中文名", nameJa: "日文名", nameFr: "法文名",
      featuresZh: "特点(中)", featuresJa: "特点(日)",
      usesZh: "用途(中)", usesJa: "用途(日)",
      notesZh: "备注(中)", notesJa: "备注(日)",
      storyZh: "故事(中)", storyJa: "故事(日)",
    };
    return map[f] || f;
  };

  const handleJump = (issue) => {
    if (issue.type === "material") onJumpMaterial(issue.id);
    else if (issue.type === "brand") onJumpBrand(issue.id);
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.bgCard, borderRadius: T.radiusLg, padding: "1.5rem", width: "100%", maxWidth: 900, maxHeight: "92vh", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: T.fontSerif, fontSize: 18, fontWeight: 500, color: T.brand }}>🔍 {lang === "zh" ? "内容质量扫描" : "コンテンツ品質スキャン"}</div>
            <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 4 }}>
              {lang === "zh"
                ? `共扫描 ${materials.length} 条材料 + ${brands.length} 条厂家`
                : `${materials.length} 件材料 + ${brands.length} 件メーカー`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.textTertiary, padding: "4px 8px" }}>×</button>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setTab("jp")} style={{
            padding: "7px 14px", fontSize: 12, cursor: "pointer",
            border: `0.5px solid ${tab === "jp" ? T.accent : T.border}`,
            background: tab === "jp" ? T.bgSoft : T.bgCard,
            color: tab === "jp" ? T.accent : T.textSecondary,
            borderRadius: T.radius, fontWeight: tab === "jp" ? 500 : 400,
          }}>{lang === "zh" ? `🌐 中日语混杂 (${result.jpMixed.length})` : `🌐 中日混在 (${result.jpMixed.length})`}</button>
          <button onClick={() => setTab("img")} style={{
            padding: "7px 14px", fontSize: 12, cursor: "pointer",
            border: `0.5px solid ${tab === "img" ? T.accent : T.border}`,
            background: tab === "img" ? T.bgSoft : T.bgCard,
            color: tab === "img" ? T.accent : T.textSecondary,
            borderRadius: T.radius, fontWeight: tab === "img" ? 500 : 400,
          }}>{lang === "zh" ? `🖼️ 图片标记未渲染 (${result.imgMarkup.length})` : `🖼️ 画像マーク (${result.imgMarkup.length})`}</button>
        </div>

        {tab === "jp" && (
          <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: 8, padding: "8px 14px", fontSize: 11, color: "#854F0B", lineHeight: 1.6 }}>
            {lang === "zh"
              ? "💡 中文字段里混入了日语假名 / 日本汉字 / 繁体字符。中国用户看不懂。点「编辑」跳过去改成纯中文。"
              : "💡 中文フィールドに日本語/繁体字が混在"}
          </div>
        )}
        {tab === "img" && (
          <div style={{ background: "#DBEAFE", border: "0.5px solid #93C5FD", borderRadius: 8, padding: "8px 14px", fontSize: 11, color: "#1E40AF", lineHeight: 1.6 }}>
            {lang === "zh"
              ? "💡 文本字段里写了 ![](url) 或 <img> 标记，但应用是纯文本渲染（不会变图）。要么删掉这些标记，要么等图片功能上线后用 imageUrls 字段。"
              : "💡 ![](url) や <img> がplain textとして表示中"}
          </div>
        )}

        <div style={{ overflowY: "auto", flex: 1, border: `0.5px solid ${T.border}`, borderRadius: T.radius }}>
          {list.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: T.textTertiary, fontSize: 13 }}>
              {lang === "zh" ? "🎉 没发现这类问题" : "🎉 問題なし"}
            </div>
          ) : (
            list.map((issue, i) => (
              <div key={i} style={{ padding: "10px 12px", borderBottom: i < list.length - 1 ? `0.5px solid ${T.borderSoft}` : "none", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: T.textPrimary }}>
                    <span style={{ background: issue.type === "material" ? "#DBEAFE" : "#FEF3C7", color: issue.type === "material" ? "#1E40AF" : "#854F0B", padding: "1px 6px", borderRadius: 3, fontSize: 10, marginRight: 6 }}>
                      {issue.type === "material" ? (lang === "zh" ? "材料" : "材料") : (lang === "zh" ? "厂家" : "メーカー")}
                    </span>
                    {issue.name}
                    <span style={{ color: T.textTertiary, fontSize: 10, marginLeft: 6 }}>· {fieldLabel(issue.field)}{issue.kind && ` · ${issue.kind}`}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 3, fontFamily: T.fontSerif, fontStyle: "italic" }}>
                    {issue.snippet}
                  </div>
                </div>
                <Btn size="sm" onClick={() => handleJump(issue)}>{lang === "zh" ? "编辑" : "編集"}</Btn>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ 批量关联材料百科向导 ═══
function BulkMaterialLinkWizard({ recipes, components, creations, materials, brands, lang, onApply, onClose }) {
  // [B3 修复] 弹窗打开时锁 body 滚动,关闭时恢复 — 防手机滑动穿透
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, []);

  // 扫描所有 ing,未关联 materialId 的
  const allUnlinkedIngs = useMemo(() => {
    const list = [];
    recipes.forEach(r => {
      (r.ingredients || []).forEach((ing, ingIdx) => {
        if (ing.materialId) return;
        if (!ing.nameZh && !ing.nameJa) return;
        list.push({
          type: "recipe", parentId: r.id, parentName: r.nameZh || r.nameJa,
          ingIdx, ing, key: `recipe:${r.id}:${ingIdx}`,
        });
      });
    });
    components.forEach(c => {
      (c.ingredients || []).forEach((ing, ingIdx) => {
        if (ing.materialId) return;
        if (!ing.nameZh && !ing.nameJa) return;
        list.push({
          type: "component", parentId: c.id, parentName: c.nameZh || c.nameJa,
          ingIdx, ing, key: `component:${c.id}:${ingIdx}`,
        });
      });
    });
    creations.forEach(cr => {
      (cr.layers || []).forEach((l, layerIdx) => {
        (l.ingredients || []).forEach((ing, ingIdx) => {
          if (ing.materialId) return;
          if (!ing.nameZh && !ing.nameJa) return;
          list.push({
            type: "creation", parentId: cr.id, parentName: cr.nameZh || cr.nameJa,
            layerIdx, layerName: l.nameZh || l.nameJa, ingIdx, ing,
            key: `creation:${cr.id}:${layerIdx}:${ingIdx}`,
          });
        });
      });
    });
    return list;
  }, [recipes, components, creations]);

  // 为每个 unlinked ing 计算匹配候选
  const matchResults = useMemo(() => {
    const map = {};
    allUnlinkedIngs.forEach(item => {
      map[item.key] = fuzzyMatchMaterial(item.ing, materials, brands);
    });
    return map;
  }, [allUnlinkedIngs, materials, brands]);

  // 用户选择: { key: materialId | null | "skip" }
  const [selection, setSelection] = useState(() => {
    const init = {};
    allUnlinkedIngs.forEach(item => {
      const r = matchResults[item.key];
      // 高置信度自动选中最佳候选
      init[item.key] = r && r.highConfidence && r.best ? r.best.id : null;
    });
    return init;
  });

  const highConfidenceCount = Object.keys(matchResults).filter(k => matchResults[k].highConfidence).length;
  const selectedCount = Object.values(selection).filter(v => v && v !== "skip").length;
  const totalCount = allUnlinkedIngs.length;

  const [filter, setFilter] = useState("all"); // all / high / low / selected / skipped

  const filteredItems = allUnlinkedIngs.filter(item => {
    const r = matchResults[item.key];
    const sel = selection[item.key];
    if (filter === "high") return r && r.highConfidence;
    if (filter === "low") return r && !r.highConfidence && r.best;
    if (filter === "none") return !r || !r.best;
    if (filter === "selected") return sel && sel !== "skip";
    return true;
  });

  const applyAutoHighConfidence = () => {
    const next = { ...selection };
    Object.keys(matchResults).forEach(k => {
      const r = matchResults[k];
      if (r.highConfidence && r.best && !next[k]) next[k] = r.best.id;
    });
    setSelection(next);
  };

  const clearAll = () => {
    const next = {};
    allUnlinkedIngs.forEach(item => { next[item.key] = null; });
    setSelection(next);
  };

  const handleApply = () => {
    // 返回 { recipeId -> [{ingIdx, materialId}] } 等三个映射
    const result = { recipes: {}, components: {}, creations: {} };
    allUnlinkedIngs.forEach(item => {
      const mid = selection[item.key];
      if (!mid || mid === "skip") return;
      if (item.type === "recipe") {
        if (!result.recipes[item.parentId]) result.recipes[item.parentId] = [];
        result.recipes[item.parentId].push({ ingIdx: item.ingIdx, materialId: mid });
      } else if (item.type === "component") {
        if (!result.components[item.parentId]) result.components[item.parentId] = [];
        result.components[item.parentId].push({ ingIdx: item.ingIdx, materialId: mid });
      } else if (item.type === "creation") {
        if (!result.creations[item.parentId]) result.creations[item.parentId] = [];
        result.creations[item.parentId].push({ layerIdx: item.layerIdx, ingIdx: item.ingIdx, materialId: mid });
      }
    });
    onApply(result, selectedCount);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)", zIndex: 1500,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.bgCard, borderRadius: T.radiusLg, padding: "1.5rem",
          width: "100%", maxWidth: 900, maxHeight: "92vh",
          display: "flex", flexDirection: "column", gap: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: T.fontSerif, fontSize: 18, fontWeight: 500, color: T.brand }}>
              🤖 {lang === "zh" ? "批量关联材料百科" : "一括連動ウィザード"}
            </div>
            <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 4 }}>
              {lang === "zh"
                ? `扫描全部配方/组件/组合蛋糕,发现 ${totalCount} 个未关联材料 (高置信度自动匹配 ${highConfidenceCount} 个)`
                : `全レシピ/コンポーネント/ケーキをスキャン、未連動 ${totalCount} 件 (自動推定 ${highConfidenceCount} 件)`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.textTertiary, padding: "4px 8px" }}>×</button>
        </div>

        {totalCount === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: T.textTertiary }}>
            {lang === "zh" ? "🎉 所有材料都已关联到百科!" : "🎉 全て連動済み!"}
          </div>
        ) : (
          <>
            {/* 过滤 + 工具栏 */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {[
                { id: "all", label: lang === "zh" ? `全部 (${totalCount})` : `全て (${totalCount})` },
                { id: "high", label: lang === "zh" ? `✨ 高置信 (${Object.values(matchResults).filter(r => r.highConfidence).length})` : `✨ 高 (${Object.values(matchResults).filter(r => r.highConfidence).length})`, color: "#059669" },
                { id: "low", label: lang === "zh" ? `❓ 需确认 (${Object.values(matchResults).filter(r => !r.highConfidence && r.best).length})` : `❓ 確認 (${Object.values(matchResults).filter(r => !r.highConfidence && r.best).length})`, color: "#D97706" },
                { id: "none", label: lang === "zh" ? `🚫 无候选 (${Object.values(matchResults).filter(r => !r.best).length})` : `🚫 候補なし (${Object.values(matchResults).filter(r => !r.best).length})`, color: "#DC2626" },
                { id: "selected", label: lang === "zh" ? `✓ 已选 (${selectedCount})` : `✓ 選択 (${selectedCount})`, color: T.accent },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: "5px 10px", fontSize: 11, cursor: "pointer",
                    border: `0.5px solid ${filter === f.id ? (f.color || T.accent) : T.border}`,
                    background: filter === f.id ? T.bgSoft : T.bgCard,
                    color: filter === f.id ? (f.color || T.accent) : T.textSecondary,
                    borderRadius: T.radius, fontFamily: T.fontSans,
                    fontWeight: filter === f.id ? 500 : 400,
                  }}
                >{f.label}</button>
              ))}
              <div style={{ flex: 1 }} />
              <button
                onClick={applyAutoHighConfidence}
                style={{
                  padding: "5px 10px", fontSize: 11, cursor: "pointer",
                  border: "0.5px solid #059669", background: "#D1FAE5", color: "#059669",
                  borderRadius: T.radius, fontFamily: T.fontSans, fontWeight: 500,
                }}
              >{lang === "zh" ? "✨ 自动应用高置信" : "✨ 自動適用"}</button>
              <button
                onClick={clearAll}
                style={{
                  padding: "5px 10px", fontSize: 11, cursor: "pointer",
                  border: `0.5px solid ${T.border}`, background: T.bgCard, color: T.textSecondary,
                  borderRadius: T.radius, fontFamily: T.fontSans,
                }}
              >{lang === "zh" ? "清空所选" : "全解除"}</button>
            </div>

            {/* 列表 */}
            <div style={{ overflowY: "auto", flex: 1, border: `0.5px solid ${T.border}`, borderRadius: T.radius }}>
              {filteredItems.length === 0 && (
                <div style={{ padding: "2rem", textAlign: "center", color: T.textTertiary, fontSize: 12 }}>
                  {lang === "zh" ? "(当前筛选无项目)" : "(該当なし)"}
                </div>
              )}
              {filteredItems.map(item => {
                const r = matchResults[item.key];
                const sel = selection[item.key];
                const parentLabel = item.type === "recipe" ? (lang === "zh" ? "配方" : "レシピ")
                  : item.type === "component" ? (lang === "zh" ? "组件" : "コンポ")
                  : (lang === "zh" ? "组合蛋糕" : "ケーキ");
                return (
                  <div key={item.key} style={{
                    padding: "10px 12px",
                    borderBottom: `0.5px solid ${T.borderSoft}`,
                    background: sel && sel !== "skip" ? "#F0FDF4" : T.bgCard,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ flex: "0 0 36%", minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: T.textPrimary }}>
                        {item.ing.nameZh || item.ing.nameJa}
                        {item.ing.brand && <span style={{ color: T.textTertiary, fontSize: 10, marginLeft: 6 }}>· {item.ing.brand}</span>}
                      </div>
                      <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 2 }}>
                        <span style={{ background: T.bgMuted, padding: "1px 4px", borderRadius: 3 }}>{parentLabel}</span>
                        {" "}{item.parentName}
                        {item.layerName && ` / ${item.layerName}`}
                        {item.ing.qty && ` · ${item.ing.qty}${item.ing.unit || "g"}`}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: T.textTertiary }}>→</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {r && r.candidates.length > 0 ? (
                        <select
                          value={sel || ""}
                          onChange={(e) => setSelection(prev => ({ ...prev, [item.key]: e.target.value || null }))}
                          style={{
                            width: "100%", padding: "6px 8px", fontSize: 12,
                            border: `0.5px solid ${sel && sel !== "skip" ? "#059669" : (r.highConfidence ? "#0F6E56" : T.border)}`,
                            borderRadius: T.radius, background: T.bgCard,
                            color: T.textPrimary, cursor: "pointer",
                          }}
                        >
                          <option value="">{lang === "zh" ? "— 不关联 —" : "— 連動しない —"}</option>
                          {r.candidates.map(m => {
                            const b = brands.find(x => x.id === m.brandId);
                            const bName = b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : "";
                            const score = r.best?.id === m.id ? r.bestScore : null;
                            return (
                              <option key={m.id} value={m.id}>
                                {m === r.best && r.highConfidence ? "✨ " : ""}
                                {lang === "zh" ? (m.nameZh || m.nameJa) : (m.nameJa || m.nameZh)}
                                {bName ? ` (${bName})` : ""}
                                {m.pricePerG ? " " + fmtUnitPrice(m.pricePerG, curOf(m)) : ""}
                                {score !== null ? ` [${score}]` : ""}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <div style={{ fontSize: 11, color: T.textTertiary, fontStyle: "italic", padding: "6px 0" }}>
                          {lang === "zh" ? "🚫 百科里无相似候选 · 需先录入材料" : "🚫 候補なし · 先に材料登録"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 底部操作 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 11, color: T.textTertiary }}>
                {lang === "zh"
                  ? `将应用 ${selectedCount} 项关联 · 跳过 ${totalCount - selectedCount} 项`
                  : `${selectedCount} 件適用 · ${totalCount - selectedCount} 件スキップ`}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={onClose} style={{
                  padding: "7px 14px", fontSize: 12, cursor: "pointer",
                  border: `0.5px solid ${T.border}`, background: T.bgCard, color: T.textSecondary,
                  borderRadius: T.radius, fontFamily: T.fontSans,
                }}>{lang === "zh" ? "取消" : "キャンセル"}</button>
                <button
                  onClick={handleApply}
                  disabled={selectedCount === 0}
                  style={{
                    padding: "7px 14px", fontSize: 12,
                    cursor: selectedCount > 0 ? "pointer" : "not-allowed",
                    border: "0.5px solid #059669",
                    background: selectedCount > 0 ? "#059669" : "#A7F3D0",
                    color: "#FFFFFF",
                    borderRadius: T.radius, fontFamily: T.fontSans, fontWeight: 500,
                  }}
                >{lang === "zh" ? `✓ 应用 ${selectedCount} 个关联` : `✓ ${selectedCount} 件適用`}</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 通用工具:把选中的未关联 ings 加入到 cats 数组中,并返回更新后的 ings(填上 catId/brandIdx)
function applyUnlinkedToCats(ings, cats, selectedIdxs) {
  if (!Array.isArray(selectedIdxs) || selectedIdxs.length === 0) return { ings, cats };
  let newCats = [...cats];
  let nextCatNum = newCats.length + 1;
  // 防止本次新增中重名重复添加
  const newIngs = ings.map((ing, idx) => {
    if (!selectedIdxs.includes(idx)) return ing;
    if (!ing.nameZh && !ing.nameJa) return ing;
    if (ing.catId) return ing; // 已关联过了,跳过

    // 先看 newCats 里是否已经有这个名字(可能本次刚加进去)
    let cat = findCatByName(ing.nameZh, newCats) || findCatByName(ing.nameJa, newCats);
    if (!cat) {
      // 新建一个 cat
      const newId = "c" + nextCatNum + "_" + Date.now().toString(36);
      nextCatNum++;
      cat = {
        id: newId,
        nameZh: ing.nameZh || "",
        nameJa: ing.nameJa || "",
        unit: ing.unit || "g",
        brands: [],
      };
      // 如果有品牌信息和价格,作为第一个 brand
      if (ing.brand || ing.unitPrice) {
        cat.brands.push({
          nameZh: "",
          nameJa: ing.brand || "",
          price: ing.unitPrice || "",
        });
      }
      newCats = [...newCats, cat];
      return {
        ...ing,
        catId: cat.id,
        brandIdx: cat.brands.length > 0 ? 0 : null,
      };
    } else {
      // 已存在同名 cat,看品牌是否已存在
      let bi = ing.brand ? findBrandIdxByName(ing.brand, cat) : -1;
      if (bi < 0 && (ing.brand || ing.unitPrice)) {
        // 新增 brand 到这个 cat
        const newBrand = {
          nameZh: "",
          nameJa: ing.brand || "",
          price: ing.unitPrice || "",
        };
        const updatedCat = { ...cat, brands: [...cat.brands, newBrand] };
        bi = updatedCat.brands.length - 1;
        newCats = newCats.map(c => c.id === cat.id ? updatedCat : c);
      }
      return {
        ...ing,
        catId: cat.id,
        brandIdx: bi >= 0 ? bi : null,
      };
    }
  });
  return { ings: newIngs, cats: newCats };
}

// ─── kororā 字标 ────────────────────────────────────────────────
// 临时占位版：Zen Kaku Gothic New 300 · 字距 0.30em · 全小写 · ā 不可省。
// LuLu 的自绘字标定稿后，只需要改这一个组件（以及换掉 fontFamily / 换成 <svg>）。
function Wordmark({ size = 22, inverse = false, sub = true }) {
  const small = size <= 18;
  return (
    <div style={{ lineHeight: 1 }}>
      {/* 用 Jost（拉丁面）。ā 必须单独一个 span 且不吃字距 ——
          浏览器排版时会把 U+0101 拆成 a + 组合长音符，letter-spacing 会插进这两者中间，
          长音符就飘到字的右上角去了。把它拎出来单独渲染就不会被拆。 */}
      <div style={{
        fontFamily: '"Jost", sans-serif', fontSize: size, fontWeight: 300,
        lineHeight: 1, color: inverse ? T.paper : T.ink,
      }}>
        <span style={{ letterSpacing: small ? "0.26em" : "0.30em" }}>koror</span>
        <span style={{ letterSpacing: "normal" }}>ā</span>
      </div>
      {sub && !small && (
        <div style={{
          fontFamily: T.fontSerif, fontSize: Math.max(8, Math.round(size * 0.38)),
          letterSpacing: "0.24em", textTransform: "uppercase",
          color: T.subtle, marginTop: 6,
        }}>Boulangerie • Pâtisserie • Café</div>
      )}
    </div>
  );
}

// ─── 2a §09 状态与反馈 ──────────────────────────────────────────
// Toast · 左下角固定，最宽 420，5 秒消失，hover 暂停计时。
// 破坏性操作一律「先做 + 给撤销」，不拦确认框 —— 只有不可撤销且影响别的数据才用 ConfirmDialog。
function ToastItem({ t, onDone }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = setTimeout(onDone, t.ms);
    return () => clearTimeout(id);
  }, [paused, t.ms, t.id]);
  return (
    <div
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      style={{
        background: T.ink, color: T.paper, padding: "12px 16px", maxWidth: 420,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: T.sp.xl,
        boxShadow: T.sh.overlay, borderRadius: T.radius, pointerEvents: "auto",
      }}>
      <span style={{ ...T.fs.small, fontFamily: T.fontSans }}>{t.msg}</span>
      {t.undo && (
        <button onClick={() => { t.undo(); onDone(); }}
          style={{ ...T.fs.caption, letterSpacing: "0.1em", color: T.paper, background: "none", border: "none",
            borderBottom: `1px solid ${T.paper}`, paddingBottom: 1, cursor: "pointer", fontFamily: T.fontSans, flexShrink: 0 }}>
          撤销
        </button>
      )}
    </div>
  );
}

// 自动保存指示 · 三态。放在页面右上、按钮组左侧。失败态不自动消失。
function SaveStatus({ state, lang, onRetry }) {
  if (!state || state.status === "idle") return null;
  const dot = (c) => <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, display: "block", flexShrink: 0 }} />;
  const wrap = (c, node) => (
    <div style={{ display: "flex", alignItems: "center", gap: T.sp.s, ...T.fs.caption, color: c, fontFamily: T.fontSans, whiteSpace: "nowrap" }}>{node}</div>
  );
  if (state.status === "saving") return wrap(T.subtle, <>{dot(T.disabled)}{lang === "zh" ? "保存中…" : "保存中…"}</>);
  if (state.status === "saved") {
    const hh = state.at ? `${String(state.at.getHours()).padStart(2, "0")}:${String(state.at.getMinutes()).padStart(2, "0")}` : "";
    return wrap(T.success, <>{dot(T.success)}{lang === "zh" ? "已保存" : "保存済み"} {hh}</>);
  }
  return wrap(T.danger, <>{dot(T.danger)}{state.msg || (lang === "zh" ? "保存失败" : "保存失敗")}
    <button onClick={onRetry} style={{ background: "none", border: "none", borderBottom: `1px solid ${T.danger}`, color: T.danger, cursor: "pointer", padding: 0, font: "inherit" }}>
      {lang === "zh" ? "重试" : "再試行"}
    </button></>);
}

// 空态 · 两型。空态永远给下一步动作，不写「暂无数据」了事。
//   variant="first"  首次为空 —— 40px 方框占位 + 主副文案 + 1~2 个动作
//   variant="filter" 筛选无结果 —— 摆出生效条件、能一个个摘掉，不给「新建」按钮
function EmptyState({ variant = "first", title, hint, actions = [], chips = [], onClearAll, lang }) {
  return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      {variant === "first" && <div style={{ width: 40, height: 40, border: `1px solid ${T.border}`, margin: "0 auto" }} />}
      <div style={{ ...T.fs.body, marginTop: variant === "first" ? T.sp.xl : 0, color: T.ink }}>{title}</div>
      {hint && <div style={{ ...T.fs.caption, color: T.secondary, marginTop: 6, lineHeight: 1.6 }}>{hint}</div>}
      {variant === "filter" && chips.length > 0 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
          {chips.map((c, i) => (
            <button key={i} onClick={c.onRemove} className="k-btn"
              style={{ ...T.fs.label, padding: "3px 8px", background: T.sunken, color: T.body, border: "none", borderRadius: T.radius, cursor: "pointer", fontFamily: T.fontSans, letterSpacing: 0 }}>
              {c.label} ✕
            </button>
          ))}
        </div>
      )}
      {variant === "filter" && onClearAll && (
        <button onClick={onClearAll} className="k-btn"
          style={{ ...T.fs.caption, color: T.info, marginTop: 18, background: "none", border: "none", cursor: "pointer", fontFamily: T.fontSans }}>
          {lang === "zh" ? "清除全部筛选" : "フィルタをすべて解除"}
        </button>
      )}
      {variant === "first" && actions.length > 0 && (
        <div style={{ display: "flex", gap: T.sp.s, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          {actions.map((a, i) => (
            <Btn key={i} variant={i === 0 ? "primary" : "default"} onClick={a.onClick}>{a.label}</Btn>
          ))}
        </div>
      )}
    </div>
  );
}

// 局部错误 · 就地长在算不出来的那块旁边，不弹全局提示。永远说清「哪几项」和「怎么修」。
function InlineError({ title, detail, actionLabel, onAction }) {
  return (
    <div style={{ border: `1px solid ${T.danger}`, padding: "14px 16px", borderRadius: T.radius }}>
      <div style={{ ...T.fs.small, color: T.danger, fontFamily: T.fontSans }}>{title}</div>
      {detail && <div style={{ ...T.fs.caption, color: T.body, marginTop: 5, lineHeight: 1.6 }}>{detail}</div>}
      {actionLabel && (
        <div style={{ marginTop: T.sp.m }}>
          <Btn size="sm" variant="danger" onClick={onAction}>{actionLabel}</Btn>
        </div>
      )}
    </div>
  );
}

// 分组标签（盆）· 语义标签型：语义色描边 + 白底
function GroupPill({ gk, lang }) {
  const g = GROUPS[gk];
  if (!g || gk === "none" || !g.label) return null;
  const label = lang === "zh" ? g.zh : lang === "ja" ? g.ja : g.fr;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: T.radius, ...T.fs.caption,
      border: `1px solid ${g.labelBorder}`, color: g.labelColor,
      background: T.surface, fontFamily: T.fontSans,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: g.border, display: "inline-block", flexShrink: 0 }} />
      {label}
    </span>
  );
}

// 语言切换 · 1px ink 描边 + 中间竖线的两格
function LangToggle({ lang, onChange }) {
  const btn = (l, label, first) => (
    <button
      onClick={() => onChange(l)}
      className="k-btn"
      style={{
        padding: "6px 14px", cursor: "pointer", ...T.fs.label,
        fontFamily: T.fontSans, border: "none",
        borderLeft: first ? "none" : `1px solid ${T.ink}`,
        background: lang === l ? T.ink : "transparent",
        color: lang === l ? T.paper : T.body,
        minWidth: 44,
      }}
    >{label}</button>
  );
  return (
    <div style={{ display: "flex", border: `1px solid ${T.ink}`, borderRadius: T.radius, overflow: "hidden", flexShrink: 0 }}>
      {btn("zh", "中文", true)}{btn("ja", "日本語", false)}
    </div>
  );
}

// ─── 浮动保存栏 (sticky bottom bar) ──────────────────────────
function StickySaveBar({ onSave, label = "保存" }) {
  return (
    <div className="k-savebar" style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "rgba(250, 250, 248, 0.96)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      borderTop: `1px solid ${T.ink}`,
      padding: `${T.sp.m}px ${T.sp.xl}px`,
      zIndex: T.z.bar,
      display: "flex",
      justifyContent: "flex-end",
    }}>
      <button onClick={onSave} className="k-btn k-btn-primary" style={{
        background: T.ink,
        color: T.paper,
        border: `1px solid ${T.ink}`,
        borderRadius: T.radius,
        padding: "12px 28px",
        fontSize: 14,
        fontWeight: 400,
        cursor: "pointer",
        fontFamily: T.fontSans,
        letterSpacing: "0.02em",
      }}>{label}</button>
    </div>
  );
}

// ─── Recipe View (read-only) ──────────────────────────────────────
function RecipeView({ recipe: r, lang, onEdit, onBack, knowledge = [], onNavigateToKnowledge, onPrint, materials = [], brands = [], onNavigateToMaterial, shopMaterials = [], setShopMaterials, showToast }) {
  const name = pickLang(r, "name", lang);
  const nameOther = rawLang(r, "name", lang);

  // 🔢 缩放计算器
  const [targetYield, setTargetYield] = useState("");
  const originalYield = parseFloat(r.yield) || 0;
  const target = parseFloat(targetYield) || 0;
  const scale = (originalYield > 0 && target > 0) ? target / originalYield : 1;

  const grouped = {};
  GROUP_ORDER.forEach(g => grouped[g] = []);
  (r.ingredients || []).forEach(ing => {
    const g = ing.group || "none";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(ing);
  });

  // v11 Task #4: 本店原料优先,实时算成本(不再读 r.totalCost 这个过期快照)
  const liveTotalCost = (r.ingredients || []).reduce((s, ing) => s + getIngLiveCost(ing, materials, brands, []), 0);
  const _yieldNum = parseFloat(r.yield) || 0;
  const liveUnitCost = _yieldNum > 0 ? liveTotalCost / _yieldNum : 0;
  const _priceNum = toCNY(r.price, priceCurOf(r));   // v17: 售价折人民币,才能跟已折算的成本比
  const liveMargin = _priceNum > 0 && liveUnitCost > 0 ? ((_priceNum - liveUnitCost) / _priceNum) * 100 : 0;
  const mc = liveMargin >= 50 ? "green" : liveMargin >= 30 ? "amber" : "red";

  // 反向查找关联知识点
  const relatedKnowledge = knowledge.filter(k => {
    const related = k.relatedRecipes || [];
    const myNames = [r.nameZh, r.nameJa, r.nameFr].filter(Boolean).map(n => n.toLowerCase());
    return related.some(rn => {
      const rLower = (rn || "").toLowerCase();
      return myNames.some(mn => mn.includes(rLower) || rLower.includes(mn) ||
        rLower.split(/[（）()【】・]/g).some(kw => kw.length >= 2 && myNames.some(mn => mn.includes(kw))));
    });
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36, flexWrap: "wrap", gap: 8 }}>
        <div style={{ ...T.fs.micro, color: T.subtle, fontFamily: T.fontSerif }}>
          {lang === "zh" ? "配方详情" : "レシピ詳細"}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* v11: 一键把本配方所有有 materialId 的 ingredient 加到本店原料 */}
          {typeof setShopMaterials === "function" && (() => {
            const linkedIds = new Set(shopMaterials.map(x => x && x.materialId).filter(Boolean));
            const seen = new Set();
            const uniqueMissing = [];
            (r.ingredients || []).forEach(ing => {
              if (ing && ing.materialId && !linkedIds.has(ing.materialId) && !seen.has(ing.materialId)) {
                seen.add(ing.materialId);
                uniqueMissing.push(ing);
              }
            });
            if (uniqueMissing.length === 0) return null;
            return (
              <Btn size="sm" variant="success" onClick={() => {
                setShopMaterials(prev => {
                  const existing = new Set(prev.map(x => x && x.materialId).filter(Boolean));
                  const add = [];
                  uniqueMissing.forEach(ing => {
                    if (existing.has(ing.materialId)) return;
                    const m = materials.find(x => x.id === ing.materialId);
                    const ref = (m && m.priceRange && m.priceRange.mid) || (m && m.pricePerG) || ing.unitPrice || "";
                    add.push({
                      id: "sm_" + Date.now() + Math.random().toString(36).slice(2, 6),
                      materialId: ing.materialId,
                      pricePerG: String(ref),
                      packSize: (m && m.packSize) || "",
                      casePack: (m && m.casePack) || "",
                      note: "",
                    });
                  });
                  return [...prev, ...add];
                });
                if (typeof showToast === "function") showToast(lang === "zh" ? `✓ 加入本店原料 ${uniqueMissing.length} 条(以参考价)` : `✓ 仕入れ原料に ${uniqueMissing.length} 件追加`);
              }} title={lang === "zh" ? `把本配方 ${uniqueMissing.length} 条未添加的原料一键加入本店原料(以参考价,可后续修改)` : `${uniqueMissing.length} 件を仕入れ原料に一括追加`}>
                {lang === "zh" ? `+ 本店原料 (${uniqueMissing.length})` : `+ 仕入 (${uniqueMissing.length})`}
              </Btn>
            );
          })()}
          {onPrint && <Btn size="sm" onClick={onPrint}>{lang === "zh" ? "打印" : "印刷"}</Btn>}
          <Btn size="sm" variant="primary" onClick={onEdit}>{lang === "zh" ? "编辑" : "編集"}</Btn>
          <Btn size="sm" variant="ghost" onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* 标题块：左边名字阶梯，右边售价 —— 无卡片，底部压一条 1px ink 线 */}
      <div className="rc-title" style={{
        display: "grid", gridTemplateColumns: "1fr auto", gap: T.sp.block,
        alignItems: "end", paddingBottom: 28, borderBottom: `1px solid ${T.ink}`,
      }}>
        <div className="k-fluid">
          {r.nameFr ? (
            <>
              <h2 style={{ fontFamily: T.fontSerif, ...T.fs.display, color: T.ink, margin: "0 0 10px" }}>{r.nameFr}</h2>
              <div style={{ ...T.fs.strong, color: T.ink }}>{name}</div>
              {nameOther && nameOther !== name && (
                <div style={{ ...T.fs.small, color: T.secondary, marginTop: 3 }}>{nameOther}</div>
              )}
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: T.fontSerif, ...T.fs.displayS, color: T.ink, margin: "0 0 8px" }}>{name}</h2>
              {nameOther && nameOther !== name && (
                <div style={{ ...T.fs.small, color: T.secondary }}>{nameOther}</div>
              )}
            </>
          )}
          <div style={{ ...T.fs.label, color: T.subtle, marginTop: T.sp.l }}>
            {[r.mold, r.yield ? `${r.yield}${r.unit || "個"}` : null, r.temp, r.baketime, r.category].filter(Boolean).join("  ·  ")}
          </div>
        </div>

        {r.price > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ ...T.fs.micro, color: T.subtle, fontFamily: T.fontSerif }}>
              {lang === "zh" ? `售价 / ${r.unit || "個"}` : `売価 / ${r.unit || "個"}`}
            </div>
            <div style={{ fontFamily: T.fontSerif, fontSize: 38, fontWeight: 300, letterSpacing: "-0.02em", marginTop: 4, ...T.num, color: T.ink, lineHeight: 1.1 }}>
              ¥{Number(r.price).toLocaleString()}
            </div>
            <div style={{ ...T.fs.caption, marginTop: 6, color: liveMargin >= 50 ? T.success : liveMargin >= 30 ? T.warning : T.danger }}>
              {lang === "zh" ? "利润率" : "利益率"} {liveMargin.toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* 🔢 缩放计算 —— 压成一行，底部一条发丝线 */}
      {originalYield > 0 && (r.ingredients || []).length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: `${T.sp.l}px 0`, borderBottom: `1px solid ${T.line}`, flexWrap: "wrap", ...T.fs.caption, color: T.body }}>
          <span style={{ ...T.fs.micro, color: T.subtle, fontFamily: T.fontSerif }}>
            {lang === "zh" ? "缩放计算" : "スケール計算"}
          </span>
          <span>{lang === "zh" ? "原" : "原"} {originalYield}{r.unit || "個"}</span>
          <span style={{ color: T.disabled }}>→</span>
          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.border}`, background: T.surface, borderRadius: T.radius }}>
            <input
              type="number" className="k-input"
              value={targetYield}
              onChange={e => setTargetYield(e.target.value)}
              placeholder={originalYield}
              style={{ width: 62, border: 0, padding: "5px 8px", ...T.fs.small, fontFamily: "inherit", textAlign: "right", outline: "none", background: "transparent", ...T.num, color: T.ink }}
            />
            <span style={{ padding: "5px 8px 5px 0", color: T.subtle, ...T.fs.label }}>{r.unit || "個"}</span>
          </div>
          {target > 0 && (
            <span style={{ fontFamily: T.fontSerif, ...T.num, color: T.accent }}>× {scale.toFixed(3)}</span>
          )}
          {target > 0 && (
            <button onClick={() => setTargetYield("")} className="k-btn k-btn-ghost" style={{ ...T.fs.label, color: T.secondary, background: "none", border: "none", cursor: "pointer", fontFamily: T.fontSans, padding: "4px 8px" }}>
              {lang === "zh" ? "重置" : "リセット"}
            </button>
          )}
        </div>
      )}

      {/* ═══ 配料表 ═══
          四列 grid（名称 / 用量 / 品牌 / 成本）。列宽只在 ING_COLS 定义一次，表头和数据行共用。
          行间只有 1px 发丝线，无竖线、无斑马纹；分组标题不是一行数据，而是一个「呼吸位」。 */}
      <div style={{ marginTop: T.sp.block, marginBottom: T.sp.gap }}>
        {/* 空态：配方还没录配料 */}
        {(r.ingredients || []).length === 0 && (
          <EmptyState
            variant="first" lang={lang}
            title={lang === "zh" ? "还没有配料" : "まだ材料がありません"}
            hint={lang === "zh" ? "去编辑页添加，或从材料百科挑" : "編集画面で追加、または材料事典から選べます"}
            actions={[{ label: lang === "zh" ? "＋ 添加配料" : "＋ 材料を追加", onClick: onEdit }]}
          />
        )}

        {/* 局部错误：成本算不出来时，就地说清「哪几项」和「怎么修」，不弹全局提示 */}
        {(() => {
          const missing = (r.ingredients || []).filter(ing => getIngPriceSource(ing, materials) === "none");
          if (missing.length === 0 || (r.ingredients || []).length === 0) return null;
          const names = missing.map(ing => pickLang(ing, "name", lang)).join(" · ");
          return (
            <div style={{ marginBottom: T.sp.xxl }}>
              <InlineError
                title={lang === "zh" ? "成本算不全" : "原価が出せません"}
                detail={lang === "zh" ? `${missing.length} 项原料没有单价：${names}` : `${missing.length} 件に単価がありません：${names}`}
                actionLabel={lang === "zh" ? "去补单价" : "単価を入力"}
                onAction={onEdit}
              />
            </div>
          );
        })()}

        {/* 表头：10px 全大写微标签，下面压一条 1px ink 实线 */}
        <div className="rc-ing-head" style={{ display: "grid", gridTemplateColumns: ING_COLS, ...T.fs.micro, color: T.subtle, paddingBottom: 10, borderBottom: `1px solid ${T.ink}`, fontFamily: T.fontSerif }}>
          <div style={{ paddingLeft: T.sp.xl }}>
            {lang === "zh" ? "原料名称" : "原材料"}
            {scale !== 1 && <span style={{ color: T.accent, marginLeft: 6 }}>×{scale.toFixed(2)}</span>}
          </div>
          <div style={{ textAlign: "right" }}>{lang === "zh" ? "用量" : "分量"}</div>
          <div className="k-desktop-only" style={{ paddingLeft: T.sp.xxl }}>{lang === "zh" ? "品牌" : "ブランド"}</div>
          <div style={{ textAlign: "right" }}>{lang === "zh" ? "成本" : "原価"}</div>
        </div>

        {GROUP_ORDER.map(gk => {
          const arr = grouped[gk]; if (!arr || !arr.length) return null;
          const g = GROUPS[gk];
          return (
            <div key={gk}>
              {/* 分组标题 = 22px 上留白 + 色点 + 标签 + 发丝线 + 条数 */}
              {gk !== "none" && (
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: `22px 0 9px ${T.sp.xl}px` }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: g.border, flexShrink: 0 }} />
                  <span style={{ ...T.fs.label, letterSpacing: "0.16em", color: T.body }}>
                    {lang === "zh" ? g.zh : lang === "ja" ? g.ja : g.fr}
                  </span>
                  <span style={{ flex: 1, height: 1, background: T.line }} />
                  <span style={{ ...T.fs.micro, color: T.muted, ...T.num }}>{arr.length}</span>
                </div>
              )}
              {arr.map((ing, i) => {
                const n = pickLang(ing, "name", lang);
                const sub = rawLang(ing, "name", lang);
                const scaledQty = (parseFloat(ing.qty) || 0) * scale;
                const scaledCost = getIngLiveCost(ing, materials, brands, []) * scale;
                // 🔗 材料百科关联
                const linkedMat = ing.materialId ? materials.find(x => x.id === ing.materialId) : null;
                const canJump = linkedMat && onNavigateToMaterial;
                // 属性徽章 · 9px 描边无底色，只标事实。一行最多 2 个，第 3 个起折叠成「+N」
                const src = getIngPriceSource(ing, materials);
                const badges = [];
                if (src === "shop") badges.push({ t: lang === "zh" ? "本店" : "仕入", c: T.success, tip: lang === "zh" ? "本店采购价" : "仕入れ価" });
                else if (src === "ref") badges.push({ t: lang === "zh" ? "参考" : "参考", c: T.secondary, tip: lang === "zh" ? "百科参考价" : "百科参考価" });
                else if (src === "manual") badges.push({ t: lang === "zh" ? "手写" : "手入", c: T.info, tip: lang === "zh" ? "手写单价" : "手入力" });
                else badges.push({ t: lang === "zh" ? "无价" : "価格なし", c: T.warning, tip: lang === "zh" ? "无价格信息" : "価格情報なし" });
                if (linkedMat) badges.push({ t: lang === "zh" ? "百科" : "事典", c: T.muted, tip: lang === "zh" ? "已关联材料百科" : "事典連動" });
                const shown = badges.slice(0, 2), rest = badges.slice(2);
                return (
                  <div
                    key={i}
                    className="k-row rc-ing-row"
                    style={{
                      display: "grid", gridTemplateColumns: ING_COLS, alignItems: "baseline",
                      padding: "11px 0", borderBottom: `1px solid ${T.lineFaint}`,
                      borderLeft: `3px solid ${g.border}`,
                      cursor: canJump ? "pointer" : "default",
                    }}
                    onClick={canJump ? () => onNavigateToMaterial(linkedMat.id) : undefined}
                    title={canJump ? (lang === "zh" ? `点击跳转百科：${linkedMat.nameZh || linkedMat.nameJa}` : "事典へ跳ぶ") : ""}
                  >
                    <div className="k-fluid" style={{ paddingLeft: T.sp.xl }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: T.sp.s, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: "0.01em", color: T.ink }}>{n}</span>
                        {sub && sub !== n && <span style={{ ...T.fs.caption, color: T.subtle }}>{sub}</span>}
                        {shown.map((b, bi) => (
                          <span key={bi} title={b.tip} style={{ fontSize: 9, letterSpacing: "0.1em", padding: "2px 6px", border: `1px solid ${b.c}`, color: b.c, whiteSpace: "nowrap" }}>{b.t}</span>
                        ))}
                        {rest.length > 0 && (
                          <span className="k-more" style={{ fontSize: 9, letterSpacing: "0.1em", padding: "2px 6px", border: `1px solid ${T.border}`, color: T.secondary, cursor: "default" }} tabIndex={0}>
                            +{rest.length}
                            <span className="k-more-pop">
                              {rest.map((b, bi) => (
                                <span key={bi} style={{ fontSize: 9, letterSpacing: "0.1em", padding: "2px 6px", border: `1px solid ${b.c}`, color: b.c, whiteSpace: "nowrap" }}>{b.t}</span>
                              ))}
                            </span>
                          </span>
                        )}
                      </div>
                      {ing.nameFr && <div className="k-desktop-only" style={{ ...T.fs.label, color: T.muted, fontStyle: "italic", marginTop: 2, letterSpacing: 0 }}>{ing.nameFr}</div>}
                      {ing.note && <div style={{ ...T.fs.label, color: T.danger, marginTop: 4, lineHeight: 1.5, letterSpacing: 0 }}>{ing.note}</div>}
                    </div>
                    <div style={{ textAlign: "right", fontSize: 17, fontWeight: 400, ...T.num, color: scale !== 1 ? T.accent : T.ink, whiteSpace: "nowrap" }}>
                      {scale === 1 ? ing.qty : scaledQty.toFixed(1)}
                      <span style={{ ...T.fs.label, color: T.subtle, marginLeft: 3 }}>{ing.unit}</span>
                    </div>
                    <div className="k-desktop-only" style={{ paddingLeft: T.sp.xxl, ...T.fs.caption, color: T.body }}>{ing.brand || "—"}</div>
                    <div style={{ textAlign: "right", ...T.fs.small, color: T.body, ...T.num }}>{scaledCost > 0 ? `¥${scaledCost.toFixed(0)}` : ""}</div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* 汇总条：顶部 1px ink，微标签 + 大数字 */}
        {liveTotalCost > 0 && (
          <div className="rc-ing-total" style={{ display: "grid", gridTemplateColumns: ING_COLS, padding: "18px 0 0", borderTop: `1px solid ${T.ink}`, marginTop: 2, alignItems: "baseline" }}>
            <div style={{ paddingLeft: T.sp.xl, ...T.fs.micro, color: T.subtle, fontFamily: T.fontSerif }}>
              {lang === "zh" ? "原料总成本" : "材料原価合計"}
            </div>
            <div style={{ textAlign: "right", ...T.fs.caption, color: _priceNum > 0 && liveUnitCost > 0 ? (liveMargin >= 50 ? T.success : liveMargin >= 30 ? T.warning : T.danger) : T.muted, ...T.num }}>
              {_priceNum > 0 && liveUnitCost > 0 ? `${liveMargin.toFixed(1)}%` : "—"}
            </div>
            <div className="k-desktop-only" style={{ paddingLeft: T.sp.xxl, ...T.fs.caption, color: T.secondary, ...T.num }}>
              {lang === "zh" ? "单个成本" : "単個原価"} ¥{liveUnitCost.toFixed(1)}
            </div>
            <div style={{ textAlign: "right", fontSize: 22, fontFamily: T.fontSerif, ...T.num, color: T.ink }}>¥{liveTotalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        )}
      </div>

      {/* Steps */}
      {(() => {
        const displaySteps = pickSteps(r, lang);
        return displaySteps && displaySteps.length > 0 && (
          <div style={{ marginBottom: T.sp.gap }}>
            <div style={{ ...T.fs.micro, color: T.subtle, paddingBottom: 10, borderBottom: `1px solid ${T.ink}`, fontFamily: T.fontSerif }}>
              {lang === "zh" ? "制作流程" : "製法"}
            </div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {displaySteps.map((s, i) => {
                // 把【①】【②】【③】替换成彩色标签
                const bowlMap = { "①": "bowl1", "②": "bowl2", "③": "bowl3", "④": "bowl4", "⑤": "bowl5" };
                const parts = s.split(/(【[①②③④⑤]】)/g);
                return (
                  <li key={i} className="k-row" style={{ display: "grid", gridTemplateColumns: "44px 1fr", padding: "12px 0", borderBottom: `1px solid ${T.lineFaint}` }}>
                    <div style={{ ...T.fs.caption, color: T.muted, ...T.num, paddingTop: 2, fontFamily: T.fontSerif }}>{String(i + 1).padStart(2, "0")}</div>
                    <div className="k-fluid" style={{ ...T.fs.body, color: T.ink }}>
                      {parts.map((part, pi) => {
                        const match = part.match(/【([①②③④⑤])】/);
                        if (match) {
                          const gk = bowlMap[match[1]];
                          const g = GROUPS[gk];
                          return (
                            <span key={pi} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "1px 8px", borderRadius: T.radius, ...T.fs.caption, border: `1px solid ${g.labelBorder}`, color: g.labelColor, marginRight: 5, verticalAlign: "middle" }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: g.border, display: "inline-block" }} />
                              {lang === "zh" ? g.zh : lang === "ja" ? g.ja : g.fr}
                            </span>
                          );
                        }
                        return <span key={pi}>{part}</span>;
                      })}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })()}

      {(() => {
        const displayNotes = pickLang(r, "notes", lang) || r.notes;
        return (r.storage || r.allergens || displayNotes) && (
          <div style={{ marginBottom: T.sp.gap }}>
            <div style={{ ...T.fs.micro, color: T.subtle, paddingBottom: 10, borderBottom: `1px solid ${T.ink}`, fontFamily: T.fontSerif }}>
              {lang === "zh" ? "备注" : "メモ"}
            </div>
            {(r.storage || r.allergens) && (
              <div style={{ ...T.fs.caption, color: T.body, display: "flex", gap: T.sp.xxl, flexWrap: "wrap", padding: "12px 0", borderBottom: displayNotes ? `1px solid ${T.lineFaint}` : "none" }}>
                {r.storage && <span>{lang === "zh" ? "保存：" : "保存方法："}{r.storage}</span>}
                {r.allergens && <span>{lang === "zh" ? "过敏原：" : "アレルゲン："}{r.allergens}</span>}
              </div>
            )}
            {displayNotes && <div style={{ ...T.fs.body, color: T.body, whiteSpace: "pre-wrap", fontFamily: T.fontSans, paddingTop: 12 }}>{displayNotes}</div>}
          </div>
        );
      })()}

      {/* 🖼️ 图片展示 */}
      <ImageUrlsDisplay urls={r.imageUrls} />

      {/* 关联知识点（反向跳转） */}
      {relatedKnowledge.length > 0 && (
        <div style={{ marginBottom: T.sp.gap }}>
          <div style={{ ...T.fs.micro, color: T.subtle, paddingBottom: 10, borderBottom: `1px solid ${T.ink}`, fontFamily: T.fontSerif }}>
            {lang === "zh" ? "相关知识点" : "関連ナレッジ"}
          </div>
          <div style={{ display: "flex", gap: T.sp.s, flexWrap: "wrap", paddingTop: 12 }}>
            {relatedKnowledge.map(k => {
              const kTitle = pickLang(k, "title", lang);
              return (
                <button
                  key={k.id}
                  className="k-btn"
                  onClick={() => onNavigateToKnowledge && onNavigateToKnowledge(k.id)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.surface, color: T.info, padding: "4px 10px", borderRadius: T.radius, ...T.fs.caption, border: `1px solid ${T.info}`, cursor: "pointer", fontFamily: T.fontSans }}
                >
                  {kTitle} <span style={{ fontSize: 10, opacity: 0.7 }}>→</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 组件仓库 View ───────────────────────────────────────────────
function ComponentsView({ components, setComponents, cats, onUpdateCats, brands = [], materials = [], setMaterials, lang, setLang, viewId, setViewId, editTarget, setEditTarget, showToast, saved, confirmDialog, knowledge, onNavigateToKnowledge, onQuickAddKnowledge, onPrintComponent, customCompCats = [], onAddCustomCompCat }) {
  const [filterCat, setFilterCat] = useState("all");
  const [compViewMode, setCompViewMode] = useState("list"); // "list" | "matrix"

  if (editTarget !== null) {
    return (
      <ComponentEditForm
        component={editTarget === "new" ? null : editTarget}
        cats={cats}
        brands={brands}
        materials={materials}
        onSave={(c) => {
          setComponents(prev => {
            const found = prev.find(x => x.id === c.id);
            return found ? prev.map(x => x.id === c.id ? c : x) : [...prev, c];
          });
          showToast("✓ 组件已保存");
          setViewId(c.id);
          setEditTarget(null);
        }}
        onDelete={() => {
          confirmDialog("删除这个组件吗？\n（本操作无法撤销）", () => {
            setComponents(prev => prev.filter(x => x.id !== editTarget.id));
            showToast("已删除");
            setEditTarget(null);
          });
        }}
        onBack={() => {
          // [B4 修复] 有 id 跳详情(从详情进编辑则回详情),无 id 回列表(新建则回列表)
          if (editTarget && editTarget.id) setViewId(editTarget.id);
          setEditTarget(null);
        }}
        onQuickAddKnowledge={onQuickAddKnowledge}
        lang={lang}
        setLang={setLang}
        customCompCats={customCompCats}
        onAddCustomCompCat={onAddCustomCompCat}
        onUpdateCats={onUpdateCats}
      />
    );
  }

  if (viewId) {
    const comp = components.find(c => c.id === viewId);
    if (comp) {
      return (
        <ComponentDetail
          component={comp}
          lang={lang}
          setLang={setLang}
          knowledge={knowledge}
          onNavigateToKnowledge={onNavigateToKnowledge}
          onEdit={() => { setEditTarget(comp); setViewId(null); }}
          onBack={() => setViewId(null)}
          onPrint={onPrintComponent ? () => onPrintComponent(comp) : null}
          materials={materials}
          brands={brands}
        />
      );
    }
  }

  const filtered = filterCat === "all" ? components : components.filter(c => c.componentCategory === filterCat);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{lang === "zh" ? `组件仓库（${components.length}）` : `コンポーネント（${components.length}）`}</div>
          {saved && <span style={{ fontSize: 12, color: "#0F6E56" }}>{lang === "zh" ? "✓ 已保存" : "✓ 保存済み"}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn variant="primary" onClick={() => setEditTarget("new")}>{lang === "zh" ? "+ 新增组件" : "+ コンポーネント追加"}</Btn>
        </div>
      </div>

      {/* 📋 视图切换：列表 / 矩阵 */}
      <div style={{ display: "flex", gap: 3, marginBottom: "1rem", background: T.bgMuted, padding: 4, borderRadius: T.radius, alignItems: "center", flexWrap: "wrap", border: `0.5px solid ${T.borderSoft}` }}>
        <div style={{ fontSize: 11, color: T.textTertiary, marginLeft: 8, marginRight: 4, letterSpacing: "0.5px" }}>
          {lang === "zh" ? "视图" : "表示"}
        </div>
        <button
          onClick={() => setCompViewMode("list")}
          style={{
            padding: "6px 14px", fontSize: 12,
            border: "none",
            background: compViewMode === "list" ? T.brand : "transparent",
            color: compViewMode === "list" ? T.bgApp : T.textSecondary,
            borderRadius: T.radiusSm,
            cursor: "pointer",
            fontWeight: compViewMode === "list" ? 500 : 400,
            fontFamily: T.fontSans,
            transition: "all 0.15s",
          }}
        >{lang === "zh" ? "📋 列表" : "📋 リスト"}</button>
        <button
          onClick={() => setCompViewMode("matrix")}
          style={{
            padding: "6px 14px", fontSize: 12,
            border: "none",
            background: compViewMode === "matrix" ? T.brand : "transparent",
            color: compViewMode === "matrix" ? T.bgApp : T.textSecondary,
            borderRadius: T.radiusSm,
            cursor: "pointer",
            fontWeight: compViewMode === "matrix" ? 500 : 400,
            fontFamily: T.fontSans,
            transition: "all 0.15s",
          }}
        >{lang === "zh" ? "📊 矩阵" : "📊 マトリックス"}</button>
        {compViewMode === "matrix" && (
          <div style={{ fontSize: 11, color: T.textTertiary, marginLeft: "auto", marginRight: 10, fontStyle: "italic" }}>
            {lang === "zh" ? "风味 × 食感 全景图" : "風味 × 食感 マップ"}
          </div>
        )}
      </div>

      {/* 📊 矩阵视图 */}
      {compViewMode === "matrix" && (() => {
        const activeFamilies = FLAVOR_FAMILIES.filter(fam =>
          components.some(c => c.flavorFamily === fam.id)
        );
        const catCols = getAllCompCats().filter(ct => ct.id !== "other");
        const componentMap = {}; // key: "famId|catId" -> components[]
        components.forEach(c => {
          if (c.flavorFamily && c.componentCategory) {
            const k = `${c.flavorFamily}|${c.componentCategory}`;
            if (!componentMap[k]) componentMap[k] = [];
            componentMap[k].push(c);
          }
        });
        const totalFilled = Object.keys(componentMap).length;
        const totalCells = activeFamilies.length * catCols.length;
        const fillRate = totalCells > 0 ? Math.round(totalFilled / totalCells * 100) : 0;
        const untaggedCount = components.filter(c => !c.flavorFamily).length;

        return (
          <div>
            {/* 说明区 */}
            <div style={{ background: T.bgMuted, border: `0.5px solid ${T.borderSoft}`, borderRadius: T.radius, padding: "12px 16px", marginBottom: 14, fontSize: 12, color: T.textSecondary, lineHeight: 1.7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.brand, fontWeight: 500, marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>✦</span>
                <span>{lang === "zh" ? "风味 × 食感 开发全景图" : "風味 × 食感 開発マップ"}</span>
              </div>
              <div>
                {lang === "zh" ? (
                  <>每个组件需要打「风味标签」才会显示在这里。<strong style={{ color: T.accent }}>点彩色方块</strong>看详情，<strong style={{ color: T.textTertiary }}>点空格</strong>快速创建新组件。</>
                ) : (
                  <>コンポーネントに「風味タグ」を付けると表示されます。<strong style={{ color: T.accent }}>カラーセル</strong>で詳細、<strong style={{ color: T.textTertiary }}>空セル</strong>で新規作成。</>
                )}
              </div>
              {untaggedCount > 0 && (
                <div style={{ marginTop: 8, padding: "6px 10px", background: T.warningBg, color: T.warning, borderRadius: T.radiusSm, fontSize: 11 }}>
                  ⚠ {lang === "zh"
                    ? <><strong>{untaggedCount}</strong> 个组件尚未打风味标签，切换到列表视图逐个补充。</>
                    : <><strong>{untaggedCount}</strong> 個のコンポーネントに風味タグがありません。</>}
                </div>
              )}
            </div>

            {activeFamilies.length === 0 ? (
              <div style={{ background: T.bgMuted, border: `1px dashed ${T.border}`, borderRadius: T.radiusLg, padding: "3rem 2rem", textAlign: "center", color: T.textSecondary, fontSize: 13, lineHeight: 1.8 }}>
                <div style={{ fontFamily: T.fontSerif, fontSize: 20, color: T.textTertiary, marginBottom: 8, fontStyle: "italic" }}>Empty Canvas</div>
                {lang === "zh"
                  ? <>还没有打过风味标签的组件。<br /><span style={{ fontSize: 12, color: T.textTertiary }}>在组件编辑页填写「风味大类」字段即可显示在这里。</span></>
                  : <>風味タグ付きコンポーネントがありません。<br /><span style={{ fontSize: 12, color: T.textTertiary }}>コンポーネント編集の「風味大類」に入力してください。</span></>
                }
              </div>
            ) : (
              <>
                {/* 矩阵主体 */}
                <div style={{ overflowX: "auto", background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: 14 }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4, fontSize: 12, minWidth: 600, fontFamily: T.fontSans }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 500, minWidth: 120, position: "sticky", left: 0, background: T.bgCard, color: T.textTertiary, fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", fontFamily: T.fontSerif, fontStyle: "italic" }}>
                          {lang === "zh" ? "风味 × 食感" : "風味 × 食感"}
                        </th>
                        {catCols.map(ct => (
                          <th key={ct.id} style={{ padding: "10px 8px", fontWeight: 500, textAlign: "center", color: ct.color, fontSize: 11, borderBottom: `1px solid ${ct.color}33`, minWidth: 70 }}>
                            <div style={{ fontFamily: T.fontSerif, fontStyle: "italic" }}>
                              {lang === "zh" ? ct.zh : ct.ja}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeFamilies.map(fam => {
                        const rowCount = catCols.filter(ct => (componentMap[`${fam.id}|${ct.id}`] || []).length > 0).length;
                        return (
                          <tr key={fam.id}>
                            <td style={{ padding: "10px 12px", fontWeight: 500, color: fam.color, position: "sticky", left: 0, background: T.bgCard, borderRight: `1px solid ${fam.color}22`, minWidth: 120 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 16 }}>{fam.emoji}</span>
                                <span style={{ fontFamily: T.fontSerif, fontSize: 13 }}>
                                  {lang === "zh" ? fam.zh : fam.ja}
                                </span>
                              </div>
                              {rowCount > 0 && (
                                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2, letterSpacing: "0.5px" }}>
                                  {rowCount}/{catCols.length} {lang === "zh" ? "填充" : "充填"}
                                </div>
                              )}
                            </td>
                            {catCols.map(ct => {
                              const k = `${fam.id}|${ct.id}`;
                              const cellComps = componentMap[k] || [];
                              return (
                                <td key={ct.id} style={{ padding: 2, textAlign: "center", verticalAlign: "middle" }}>
                                  <MatrixCell
                                    cellComps={cellComps}
                                    fam={fam}
                                    ct={ct}
                                    lang={lang}
                                    onViewComponent={(id) => setViewId(id)}
                                    onCreateNew={() => {
                                      setEditTarget({
                                        ...{ nameZh: "", nameJa: "", nameFr: "", componentCategory: ct.id, flavorFamily: fam.id, flavorName: "", mold: "", yield: "", unit: "g", notesZh: "", notesJa: "", ingredients: [], stepsZh: [], stepsJa: [], imageUrls: [] }
                                      });
                                    }}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 图例 */}
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginTop: 12, fontSize: 11, color: T.textTertiary, padding: "8px 14px", background: T.bgMuted, borderRadius: T.radius, border: `0.5px solid ${T.borderSoft}` }}>
                  <span style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: 10 }}>{lang === "zh" ? "图例" : "凡例"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 22, height: 14, borderRadius: 3, background: "#D4A574", border: "0.5px solid #AC6B3A" }}></span>
                    {lang === "zh" ? "3+ 组件（深）" : "3+（濃）"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 22, height: 14, borderRadius: 3, background: "#F0E8D4", border: "0.5px solid #D4A574" }}></span>
                    {lang === "zh" ? "1-2 个（浅）" : "1-2（浅）"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 22, height: 14, borderRadius: 3, background: "transparent", border: "1px dashed #B8A38B" }}></span>
                    {lang === "zh" ? "空白 → 可创建" : "空白 → 作成可"}
                  </span>
                </div>

                {/* 统计（RURU 风格） */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginTop: 14 }}>
                  <div style={{ background: T.successBg, padding: "12px 14px", borderRadius: T.radius, border: `0.5px solid ${T.success}33` }}>
                    <div style={{ fontSize: 10, color: T.success, letterSpacing: "1px", textTransform: "uppercase" }}>
                      {lang === "zh" ? "已开发" : "開発済"}
                    </div>
                    <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.success, marginTop: 2 }}>
                      {totalFilled}
                    </div>
                  </div>
                  <div style={{ background: T.warningBg, padding: "12px 14px", borderRadius: T.radius, border: `0.5px solid ${T.warning}33` }}>
                    <div style={{ fontSize: 10, color: T.warning, letterSpacing: "1px", textTransform: "uppercase" }}>
                      {lang === "zh" ? "空白机会" : "空白"}
                    </div>
                    <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.warning, marginTop: 2 }}>
                      {totalCells - totalFilled}
                    </div>
                  </div>
                  <div style={{ background: T.bgMuted, padding: "12px 14px", borderRadius: T.radius, border: `0.5px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, color: T.textTertiary, letterSpacing: "1px", textTransform: "uppercase" }}>
                      {lang === "zh" ? "开发度" : "開発度"}
                    </div>
                    <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.brand, marginTop: 2 }}>
                      {fillRate}%
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* 📋 列表视图 */}
      {compViewMode === "list" && (<>

      {/* 分类筛选 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
        <button
          onClick={() => setFilterCat("all")}
          style={{
            padding: "5px 14px", fontSize: 12,
            border: filterCat === "all" ? `1px solid ${T.brand}` : `0.5px solid ${T.border}`,
            borderRadius: T.radiusPill,
            background: filterCat === "all" ? T.brand : T.bgCard,
            color: filterCat === "all" ? T.bgApp : T.textSecondary,
            cursor: "pointer",
            fontWeight: filterCat === "all" ? 500 : 400,
            fontFamily: T.fontSans,
            transition: "all 0.15s",
          }}
        >{lang === "zh" ? "全部" : "すべて"}</button>
        {[...COMPONENT_CATEGORIES, ...customCompCats].map(cat => {
          const count = components.filter(c => c.componentCategory === cat.id).length;
          const active = filterCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCat(cat.id)}
              style={{
                padding: "5px 14px", fontSize: 12,
                border: `${active ? 1 : 0.5}px solid ${active ? cat.color : T.border}`,
                borderRadius: T.radiusPill,
                background: active ? cat.bg : T.bgCard,
                color: active ? cat.color : T.textSecondary,
                cursor: "pointer",
                fontWeight: active ? 500 : 400,
                fontFamily: T.fontSans,
                transition: "all 0.15s",
              }}
            >
              {lang === "zh" ? cat.zh : cat.ja} {count > 0 && <span style={{ color: active ? cat.color : T.textMuted, marginLeft: 3, opacity: 0.7 }}>{count}</span>}
              {cat.custom && <span style={{ color: T.textMuted, marginLeft: 3, fontSize: 10 }}>⚙</span>}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#666666", fontSize: 13, lineHeight: 1.8 }}>
          {components.length === 0 ? (
            <>
              暂无组件。点「+ 新增组件」开始搭建你的配方积木库。<br/>
              <span style={{ fontSize: 12, color: "#999999" }}>
                在这里存入生地・慕斯・果冻・脆片・淋面等基础配方，<br/>组合蛋糕时可以直接调用。
              </span>
            </>
          ) : "此分类下暂无组件"}
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(c => {
          const cat = getCompCat(c.componentCategory);
          const name = pickLang(c, "name", lang);
          const nameSub = rawLang(c, "name", lang);
          const flavor = c.flavorFamily ? getFlavorFamily(c.flavorFamily) : null;
          const avatarLetter = (c.nameFr || name || "?").charAt(0).toUpperCase();
          return (
            <div
              key={c.id}
              onClick={() => setViewId(c.id)}
              style={{
                background: T.bgCard,
                border: `0.5px solid ${T.border}`,
                borderRadius: T.radiusLg,
                padding: "16px 20px",
                cursor: "pointer",
                borderLeft: `3px solid ${cat.color}`,
                transition: "border-color 0.15s, transform 0.12s",
                display: "flex",
                gap: 14,
                alignItems: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {/* 首字母圆形徽章（用食感分类的颜色） */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: cat.bg, color: cat.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.fontSerif, fontSize: 18, fontStyle: "italic", fontWeight: 500,
                flexShrink: 0,
              }}>{avatarLetter}</div>

              {/* 中间内容 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* 标题行 */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                  {c.nameFr && (
                    <span style={{ fontFamily: T.fontSerif, fontSize: 16, color: T.textPrimary, fontWeight: 500 }}>
                      {c.nameFr}
                    </span>
                  )}
                  <span style={{ fontSize: 14, color: c.nameFr ? T.textSecondary : T.textPrimary, fontWeight: c.nameFr ? 400 : 500 }}>
                    {c.nameFr ? "· " : ""}{name}
                  </span>
                  {nameSub && nameSub !== name && (
                    <span style={{ fontSize: 12, color: T.textTertiary }}>· {nameSub}</span>
                  )}
                </div>

                {/* 标签行 */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6, alignItems: "center" }}>
                  <span style={{ background: cat.bg, color: cat.color, padding: "2px 10px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500 }}>
                    {lang === "zh" ? cat.zh : cat.ja}
                  </span>
                  {flavor && (
                    <span style={{ background: flavor.bg, color: flavor.color, padding: "2px 10px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500 }}>
                      {flavor.emoji} {c.flavorName || (lang === "zh" ? flavor.zh : flavor.ja)}
                    </span>
                  )}
                </div>

                {/* 信息行 */}
                <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {[
                    c.yield ? `${c.yield} ${c.unit || "g"}` : null,
                    (c.ingredients?.length > 0) ? `${c.ingredients.length} ${lang === "zh" ? "种原料" : "種材料"}` : null,
                    c.totalCost > 0 ? `¥${c.totalCost.toFixed(0)}` : null,
                  ].filter(Boolean).map((t, i, arr) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{t}</span>
                      {i < arr.length - 1 && <span style={{ color: T.textMuted }}>·</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </>)}
    </div>
  );
}

// ─── 组件详情 View ───────────────────────────────────────────────
function ComponentDetail({ component: c, lang, setLang, onEdit, onBack, knowledge = [], onNavigateToKnowledge, onPrint, materials = [], brands = [] }) {
  const cat = getCompCat(c.componentCategory);
  const name = pickLang(c, "name", lang);
  const nameOther = rawLang(c, "name", lang);
  const notes = pickLang(c, "notes", lang) || c.notes;

  // 🔢 缩放计算器
  const [targetYield, setTargetYield] = useState("");
  const originalYield = parseFloat(c.yield) || 0;
  const target = parseFloat(targetYield) || 0;
  const scale = (originalYield > 0 && target > 0) ? target / originalYield : 1;

  // v11 Task #4: 本店原料优先,实时算总成本
  const liveTotalCost = (c.ingredients || []).reduce((s, ing) => s + getIngLiveCost(ing, materials, brands, []), 0);

  // 找到关联的知识点（反向查找：知识点的 relatedRecipes 里是否包含此组件的名字）
  const relatedKnowledge = knowledge.filter(k => {
    const related = k.relatedRecipes || [];
    const myNames = [c.nameZh, c.nameJa, c.nameFr].filter(Boolean).map(n => n.toLowerCase());
    return related.some(r => {
      const rLower = (r || "").toLowerCase();
      return myNames.some(mn => mn.includes(rLower) || rLower.includes(mn) ||
        rLower.split(/[（）()【】・]/g).some(kw => kw.length >= 2 && myNames.some(mn => mn.includes(kw))));
    });
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase" }}>
          {lang === "zh" ? "组件详情" : "コンポーネント詳細"}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onPrint && <Btn size="sm" onClick={onPrint}>{lang === "zh" ? "🖨 打印" : "🖨 印刷"}</Btn>}
          <Btn size="sm" onClick={onEdit}>{lang === "zh" ? "编辑" : "編集"}</Btn>
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      <div style={{
        background: T.bgCard,
        border: `0.5px solid ${T.border}`,
        borderRadius: T.radiusLg,
        padding: "1.75rem",
        marginBottom: "1rem",
        borderLeft: `3px solid ${cat.color}`,
        display: "flex",
        gap: 18,
        alignItems: "flex-start",
      }}>
        {/* 首字母徽章（用食感色） */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: cat.bg, color: cat.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: T.fontSerif, fontSize: 28, fontStyle: "italic", fontWeight: 500,
          flexShrink: 0,
        }}>
          {(c.nameFr || name || "?").charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {c.nameFr ? (
            <>
              <div style={{ fontFamily: T.fontSerif, fontSize: 26, fontWeight: 500, color: T.textPrimary, lineHeight: 1.2, letterSpacing: "-0.3px" }}>
                {c.nameFr}
              </div>
              <div style={{ fontSize: 14, color: T.textSecondary, marginTop: 4 }}>
                {name}{nameOther && nameOther !== name ? ` · ${nameOther}` : ""}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.textPrimary, lineHeight: 1.3 }}>
                {name}
              </div>
              {nameOther && nameOther !== name && (
                <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 3, fontStyle: "italic" }}>{nameOther}</div>
              )}
            </>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ background: cat.bg, color: cat.color, padding: "3px 12px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500 }}>
              {lang === "zh" ? cat.zh : cat.ja}
            </span>
            {c.flavorFamily && (() => {
              const fam = getFlavorFamily(c.flavorFamily);
              return (
                <span style={{ background: fam.bg, color: fam.color, padding: "3px 12px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500 }}>
                  {fam.emoji} {c.flavorName || (lang === "zh" ? fam.zh : fam.ja)}
                </span>
              );
            })()}
          </div>

          <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {[
              c.mold,
              c.yield ? `${c.yield}${c.unit || "g"}` : null,
              liveTotalCost > 0 ? `¥${liveTotalCost.toFixed(0)}` : null,
            ].filter(Boolean).map((t, i, arr) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{t}</span>
                {i < arr.length - 1 && <span style={{ color: T.textMuted }}>·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 🔢 缩放计算器 - RURU 风格 */}
      {originalYield > 0 && (c.ingredients || []).length > 0 && (
        <div style={{ background: T.bgMuted, border: `0.5px solid ${T.borderSoft}`, borderRadius: T.radius, padding: "12px 16px", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, color: T.accent, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>
              {lang === "zh" ? "✦ 缩放计算" : "✦ スケール計算"}
            </div>
            <div style={{ fontSize: 12, color: T.textSecondary }}>
              {lang === "zh" ? "原" : "原"}：<span style={{ fontFamily: T.fontSerif, fontWeight: 500 }}>{originalYield}{c.unit || "g"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: T.textSecondary }}>{lang === "zh" ? "目标" : "目標"}：</span>
              <input
                type="number"
                value={targetYield}
                onChange={e => setTargetYield(e.target.value)}
                placeholder={originalYield}
                style={{ width: 80, padding: "5px 10px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans }}
              />
              <span style={{ fontSize: 12, color: T.textSecondary }}>{c.unit || "g"}</span>
            </div>
            {target > 0 && (
              <div style={{ fontSize: 12, color: T.accent, fontWeight: 500, background: T.bgCard, padding: "4px 14px", borderRadius: T.radiusPill, fontFamily: T.fontSerif, fontStyle: "italic", border: `0.5px solid ${T.accentSoft}` }}>
                × {scale.toFixed(3)}
              </div>
            )}
            {target > 0 && (
              <button onClick={() => setTargetYield("")} style={{ fontSize: 11, color: T.textTertiary, background: "none", border: "none", cursor: "pointer", fontFamily: T.fontSans }}>
                {lang === "zh" ? "重置" : "リセット"}
              </button>
            )}
          </div>
          {target > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: T.textTertiary, fontStyle: "italic" }}>
              {lang === "zh" ? "下方原料已按比例缩放" : "下記材料は比率で計算されました"}
            </div>
          )}
        </div>
      )}

      {/* 原料 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>原材料{scale !== 1 && <span style={{ fontSize: 12, color: "#6D28D9", marginLeft: 8 }}>（已缩放 ×{scale.toFixed(3)}）</span>}</div>
        {(c.ingredients || []).length === 0 && <div style={{ fontSize: 13, color: "#999999" }}>（无原料）</div>}
        {(() => {
          // 按 group 分组显示
          const compGrouped = {};
          GROUP_ORDER.forEach(g => compGrouped[g] = []);
          (c.ingredients || []).forEach(ing => {
            const g = ing.group || "none";
            if (!compGrouped[g]) compGrouped[g] = [];
            compGrouped[g].push(ing);
          });
          return GROUP_ORDER.map(gk => {
            const arr = compGrouped[gk];
            if (!arr || !arr.length) return null;
            const gInfo = GROUPS[gk];
            return (
              <div key={gk}>
                {gk !== "none" && (
                  <div style={{ padding: "6px 0 4px", fontSize: 11 }}>
                    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, border: `1.5px solid ${gInfo.labelBorder}`, color: gInfo.labelColor, fontWeight: 500 }}>
                      {lang === "zh" ? gInfo.zh : gInfo.ja}
                    </span>
                  </div>
                )}
                {arr.map((ing, i) => {
                  const n = pickLang(ing, "name", lang);
                  const sub = rawLang(ing, "name", lang);
                  const scaledQty = (parseFloat(ing.qty) || 0) * scale;
                  const scaledCost = getIngLiveCost(ing, materials, brands, []) * scale;
                  return (
                    <div key={ing.nameZh + i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 40px 80px", gap: 0, padding: "8px 0", borderBottom: "0.5px solid #E5E5E5", alignItems: "center", borderLeft: gk !== "none" ? `4px solid ${gInfo.border}` : "none", paddingLeft: gk !== "none" ? 8 : 0 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{n || sub}</div>
                        {sub && sub !== n && <div style={{ fontSize: 11, color: "#666666" }}>{sub}</div>}
                        {ing.nameFr && <div style={{ fontSize: 10, color: "#888888", fontStyle: "italic" }}>{ing.nameFr}</div>}
                      </div>
                      <div style={{ textAlign: "right", fontWeight: 500, fontSize: 15, color: scale !== 1 ? "#6D28D9" : "#111111" }}>{scale === 1 ? ing.qty : scaledQty.toFixed(1)}</div>
                      <div style={{ fontSize: 13, color: "#666666", paddingLeft: 4 }}>{ing.unit}</div>
                      <div style={{ textAlign: "right", fontSize: 12, color: "#666666" }}>{scaledCost > 0 ? `¥${scaledCost.toFixed(0)}` : ""}</div>
                    </div>
                  );
                })}
              </div>
            );
          });
        })()}
      </div>

      {/* 制法 */}
      {(() => {
        const displaySteps = pickSteps(c, lang);
        return displaySteps && displaySteps.length > 0 && (
          <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
            <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>{lang === "zh" ? "制作流程" : "製法"}</div>
            <ol style={{ listStyle: "none", padding: 0 }}>
              {displaySteps.map((s, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: i < displaySteps.length - 1 ? "0.5px solid #E5E5E5" : "none" }}>
                  <div style={{ minWidth: 22, height: 22, borderRadius: "50%", background: "#F5F5F5", border: "0.5px solid #CCCCCC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7 }}>{s}</div>
                </li>
              ))}
            </ol>
          </div>
        );
      })()}

      {notes && (
        <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>备注</div>
          <div style={{ fontSize: 13, color: "#333333", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{notes}</div>
        </div>
      )}

      {/* 🖼️ 图片展示 */}
      <ImageUrlsDisplay urls={c.imageUrls} />

      {/* 关联知识点（反向跳转） */}
      {relatedKnowledge.length > 0 && (
        <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E5E5", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>📚 相关知识点（点击跳转）</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {relatedKnowledge.map(k => {
              const kTitle = pickLang(k, "title", lang);
              return (
                <button
                  key={k.id}
                  onClick={() => onNavigateToKnowledge && onNavigateToKnowledge(k.id)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EDE9FE", color: "#5B21B6", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}
                >
                  {kTitle} <span style={{ fontSize: 10, opacity: 0.7 }}>→</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 组件编辑 Form ────────────────────────────────────────────────
function ComponentEditForm({ component, cats, brands = [], materials = [], onSave, onDelete, onBack, onQuickAddKnowledge, lang = "zh", setLang, customCompCats = [], onAddCustomCompCat, onUpdateCats }) {
  const [pickerTargetIngId, setPickerTargetIngId] = useState(null); // 材料选择弹窗
  const [showBulkMatch, setShowBulkMatch] = useState(false); // 🤖 批量关联
  const [errorMsg, setErrorMsg] = useState("");
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const isNew = !component;
  const empty = { nameZh: "", nameJa: "", nameFr: "", componentCategory: "mousse", flavorFamily: "", flavorName: "", mold: "", yield: "", unit: "g", notesZh: "", notesJa: "", ingredients: [], stepsZh: [], stepsJa: [], imageUrls: [] };
  const [form, setForm] = useState(component ? { flavorFamily: "", flavorName: "", ...component } : empty);
  const [ings, setIngs] = useState(component
    ? component.ingredients.map((i, idx) => {
        const linked = autoLinkIng(i, cats);
        if (linked.materialId && Array.isArray(materials)) {
          const m = materials.find(x => x.id === linked.materialId);
          if (m) {
            const pp = getMaterialEffectivePrice(m);
            if (!isNaN(pp) && pp > 0) {
              const q = parseFloat(linked.qty) || 0;
              return { ...linked, _id: idx, unitPrice: String(pp), cost: q > 0 ? (q * pp).toFixed(1) : linked.cost };
            }
          }
        }
        return { ...linked, _id: idx };
      })
    : [{ _id: 0, nameZh: "", nameJa: "", nameFr: "", qty: "", unit: "g", brand: "", unitPrice: "", currency: "CNY", cost: "", catId: null, brandIdx: null }]);

  // 🧪 原料自动补全数据源：从价格表 cats 取双语名称和品牌
  const autoCompleteData = useMemo(() => {
    const zhSet = new Set();
    const jaSet = new Set();
    const brandSet = new Set();
    (cats || []).forEach(cat => {
      if (cat.nameZh) zhSet.add(cat.nameZh);
      if (cat.nameJa) jaSet.add(cat.nameJa);
      (cat.brands || []).forEach(b => {
        if (b.nameZh) brandSet.add(b.nameZh);
        if (b.nameJa) brandSet.add(b.nameJa);
      });
    });
    return {
      nameZh: Array.from(zhSet).sort(),
      nameJa: Array.from(jaSet).sort(),
      brand: Array.from(brandSet).sort(),
    };
  }, [cats]);

  // 兼容老数据：如果只有 steps 字段，从它初始化 stepsJa
  const initStepsZh = component?.stepsZh || [];
  const initStepsJa = component?.stepsJa || component?.steps || [];
  const maxStepLen = Math.max(initStepsZh.length, initStepsJa.length, 1);
  const [steps, setSteps] = useState(
    Array.from({ length: maxStepLen }, (_, i) => ({
      _id: i,
      textZh: initStepsZh[i] || "",
      textJa: initStepsJa[i] || "",
    }))
  );
  const nextIngId = useRef(ings.length);
  const nextStepId = useRef(steps.length);

  const totalCost = ings.reduce((s, i) => s + toCNY(i.cost, curOf(i)), 0);  // v17: 各按各的币种折成人民币再相加
  const updateIng = (id, field, val) => setIngs(prev => prev.map(i => i._id === id ? { ...i, [field]: val } : i));

  // 未关联材料对话框 state
  const [unlinkedDialog, setUnlinkedDialog] = useState(null); // null | { items: [...] }

  const doSave = (finalIngs) => {
    const validIngs = finalIngs.filter(i => i.nameZh || i.nameJa);
    // 🔗 自动用材料百科最新价刷新有 materialId 的 ing
    const refreshedIngs = validIngs.map(i => {
      if (!i.materialId) return i;
      const m = materials.find(x => x.id === i.materialId);
      if (!m) return { ...i, materialId: null };
      const pp = getMaterialEffectivePrice(m);
      if (isNaN(pp) || pp <= 0) return i;
      const q = parseFloat(i.qty) || 0;
      return { ...i, unitPrice: String(pp), cost: q > 0 ? (q * pp).toFixed(1) : i.cost };
    });
    const total = refreshedIngs.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
    const stepsZh = steps.map(s => s.textZh.trim()).filter(Boolean);
    const stepsJa = steps.map(s => s.textJa.trim()).filter(Boolean);
    onSave({
      ...form,
      id: component ? component.id : "comp_" + Date.now(),
      yield: parseFloat(form.yield) || 0,
      ingredients: refreshedIngs.map(({ _id, ...rest }) => rest),
      stepsZh,
      stepsJa,
      steps: undefined,
      totalCost: total,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSave = () => {
    if (!form.nameZh.trim()) {
      setErrorMsg("请输入组件名称");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    // 检测未关联材料(有名字但无 catId,且 onUpdateCats 可用)
    if (onUpdateCats) {
      const unlinked = ings
        .map((ing, i) => ({ ing, idx: i }))
        .filter(({ ing }) => (ing.nameZh || ing.nameJa) && !ing.catId)
        .map(({ ing, idx }) => ({
          idx,
          nameZh: ing.nameZh || "",
          nameJa: ing.nameJa || "",
          brand: ing.brand || "",
          unit: ing.unit || "g",
          unitPrice: ing.unitPrice || "",
        }));
      if (unlinked.length > 0) {
        setUnlinkedDialog({ items: unlinked });
        return;
      }
    }
    doSave(ings);
  };

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };
  const cat = getCompCat(form.componentCategory);

  return (
    <div>
      {unlinkedDialog && (
        <UnlinkedIngredientsDialog
          unlinkedItems={unlinkedDialog.items}
          lang={lang}
          onCancel={() => setUnlinkedDialog(null)}
          onSkip={() => { setUnlinkedDialog(null); doSave(ings); }}
          onConfirm={(selectedIdxs) => {
            const { ings: updatedIngs, cats: updatedCats } = applyUnlinkedToCats(ings, cats, selectedIdxs);
            setIngs(updatedIngs);
            if (onUpdateCats) onUpdateCats(updatedCats);
            setUnlinkedDialog(null);
            doSave(updatedIngs);
          }}
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{isNew ? (lang === "zh" ? "新增组件" : "コンポーネント追加") : (lang === "zh" ? "编辑组件" : "コンポーネント編集")}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!isNew && <Btn variant="danger" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* 💡 懒人模式提示 */}
      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：中日文任一填写即可，不必两种都填。名字、备注、步骤都是如此。
      </div>

      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem", borderLeft: `4px solid ${cat.color}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>组件名（中文）</label>
            <input value={form.nameZh} onChange={f("nameZh")} placeholder={lang === "zh" ? "白巧克力焦糖慕斯" : "ホワイトチョコキャラメルムース"} style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>组件名（日本語）</label>
            <input value={form.nameJa} onChange={f("nameJa")} placeholder={lang === "zh" ? "ムース ショコラブランキャラメル" : "ムース ショコラブランキャラメル"} style={inpStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>组件名（FR）</label>
            <input value={form.nameFr} onChange={f("nameFr")} placeholder="Mousse chocolat blanc" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "分类" : "カテゴリー"}</label>
            <select
              value={form.componentCategory}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  const name = prompt("新分类名称（中文）：");
                  if (!name || !name.trim()) return;
                  const nameJa = prompt("日本語名（留空则同中文）：") || name.trim();
                  const newId = "custom_" + Date.now();
                  const colorIdx = customCompCats.length % CUSTOM_CAT_COLORS.length;
                  const newCat = {
                    id: newId,
                    zh: name.trim(),
                    ja: nameJa.trim(),
                    color: CUSTOM_CAT_COLORS[colorIdx].color,
                    bg: CUSTOM_CAT_COLORS[colorIdx].bg,
                    custom: true,
                  };
                  if (onAddCustomCompCat) onAddCustomCompCat(newCat);
                  setForm(prev => ({ ...prev, componentCategory: newId }));
                } else {
                  f("componentCategory")(e);
                }
              }}
              style={inpStyle}
            >
              {COMPONENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.zh}</option>)}
              {customCompCats.length > 0 && <optgroup label="━ 自定义分类 ━">
                {customCompCats.map(c => <option key={c.id} value={c.id}>{c.zh}</option>)}
              </optgroup>}
              <option value="__new__">➕ 新建分类...</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "模具" : "型"}</label>
            <input value={form.mold || ""} onChange={f("mold")} placeholder="例：15cmセルクル、54×39cmテンパン" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "产出量" : "出来高"}</label>
            <input type="number" value={form.yield} onChange={f("yield")} placeholder="500" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "单位" : "単位"}</label>
            <input value={form.unit} onChange={f("unit")} placeholder="g" style={inpStyle} />
          </div>
        </div>
      </div>

      {/* 🏷 风味标签（用于矩阵视图和研发） */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 10, color: T.textPrimary }}>🏷 风味标签（可选·帮助矩阵视图）</div>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 10 }}>告诉系统这个组件是什么"口味"的，研发时可以按口味查找和组合。</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>风味大类</label>
            <select value={form.flavorFamily || ""} onChange={f("flavorFamily")} style={inpStyle}>
              <option value="">— 不指定 —</option>
              {FLAVOR_FAMILIES.map(fam => (
                <option key={fam.id} value={fam.id}>{fam.emoji} {fam.zh}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>具体风味（常见参考）</label>
            <input
              value={form.flavorName || ""}
              onChange={f("flavorName")}
              placeholder={form.flavorFamily ? (getFlavorFamily(form.flavorFamily).flavors.join("/") || "自定义") : "选择大类后显示建议"}
              list="flavorSuggestions"
              style={inpStyle}
            />
            <datalist id="flavorSuggestions">
              {form.flavorFamily && getFlavorFamily(form.flavorFamily).flavors.map(fl => (
                <option key={fl} value={fl} />
              ))}
            </datalist>
          </div>
        </div>
        {form.flavorFamily && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#666" }}>
            参考：{getFlavorFamily(form.flavorFamily).flavors.join(" · ")} ...（可自由填写）
          </div>
        )}
      </div>

      {/* 原料 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>{lang === "zh" ? "原材料" : "原材料"}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {materials && materials.length > 0 && (
              <Btn size="sm" onClick={() => setShowBulkMatch(true)} title={lang === "zh" ? "AI 扫描批量关联百科" : "一括関連"}>
                {lang === "zh" ? "🤖 批量关联" : "🤖 一括"}
              </Btn>
            )}
            <Btn size="sm" onClick={() => setIngs(prev => [...prev, { _id: nextIngId.current++, nameZh: "", nameJa: "", nameFr: "", qty: "", unit: "g", brand: "", unitPrice: "", currency: "CNY", cost: "", group: "none" }])}>{lang === "zh" ? "+ 追加" : "+ 追加"}</Btn>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ background: "#F5F5F5" }}>
                {["🔗","中文","日本語","FR","用量","单位","品牌","单价","成本","分组",""].map((h, i) => (
                  <th key={i} style={{ fontSize: 11, color: "#666666", fontWeight: 400, padding: "6px 6px 8px", textAlign: "left", borderBottom: "0.5px solid #E5E5E5", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ings.map(ing => {
                const ist = { padding: "4px 6px", fontSize: 12, border: "0.5px solid #CCCCCC", borderRadius: 4, background: "#FFFFFF", color: "#111111" };
                const g = GROUPS[ing.group || "none"] || GROUPS.none;
                const { cat: linkedCat, brand: linkedBrand } = resolveIngBinding(ing, cats);
                const linked = !!linkedCat;
                // 智能名字更新：输入后若匹配到价格表 cat,同步填充另一语言和 catId
                const onNameChange = (field, val) => {
                  const newIng = { ...ing, [field]: val };
                  // 清空品牌绑定(因为名字可能变了)
                  if (newIng.catId) {
                    const currentCat = cats.find(c => c.id === newIng.catId);
                    // 如果新名字和当前大类匹配则保持,否则解除
                    if (!currentCat || (
                      (currentCat.nameZh || "").toLowerCase() !== val.toLowerCase() &&
                      (currentCat.nameJa || "").toLowerCase() !== val.toLowerCase() &&
                      // 另一字段也可能是对应的,检查一下
                      (field === "nameZh" ? (currentCat.nameJa || "") : (currentCat.nameZh || "")).toLowerCase() !== (field === "nameZh" ? newIng.nameJa : newIng.nameZh || "").toLowerCase()
                    )) {
                      newIng.catId = null;
                      newIng.brandIdx = null;
                    }
                  }
                  // 尝试匹配新 cat
                  const matched = findCatByName(val, cats);
                  if (matched && !newIng.catId) {
                    newIng.catId = matched.id;
                    newIng.brandIdx = null;
                    // 同步填充另一语言名称(仅当为空时)
                    if (field === "nameZh" && !newIng.nameJa && matched.nameJa) newIng.nameJa = matched.nameJa;
                    if (field === "nameJa" && !newIng.nameZh && matched.nameZh) newIng.nameZh = matched.nameZh;
                    if (!newIng.unit && matched.unit) newIng.unit = matched.unit;
                  }
                  setIngs(prev => prev.map(i => i._id === ing._id ? newIng : i));
                };
                // 品牌选择
                const onBrandSelect = (idx) => {
                  setIngs(prev => prev.map(i => {
                    if (i._id !== ing._id) return i;
                    if (idx === "" || idx === null) {
                      return { ...i, brandIdx: null, brand: "" };
                    }
                    const bi = parseInt(idx);
                    const brand = linkedCat && linkedCat.brands[bi];
                    if (!brand) return i;
                    const price = parseFloat(brand.price) || 0;
                    const q = parseFloat(i.qty) || 0;
                    return {
                      ...i,
                      brandIdx: bi,
                      brand: getBrandName(brand, lang),
                      unitPrice: brand.price || "",
                      cost: q > 0 && price > 0 ? (q * price).toFixed(1) : i.cost,
                    };
                  }));
                };
                const { material: linkedMat } = resolveIngMaterial(ing, materials, brands);
                // 检查价格是否和价格表当前值不一致
                const priceDrift = linked && linkedBrand && linkedBrand.price && ing.unitPrice &&
                  Math.abs(parseFloat(linkedBrand.price) - parseFloat(ing.unitPrice)) > 0.001
                  ? parseFloat(linkedBrand.price) : null;
                return (
                  <tr key={ing._id} style={{ borderBottom: "0.5px solid #E5E5E5", borderLeft: `4px solid ${g.border}` }}>
                    <td style={{ padding: "3px 4px" }}>
                      <button
                        onClick={() => setPickerTargetIngId(ing._id)}
                        title={linkedMat
                          ? (lang === "zh" ? `✓ 关联:${linkedMat.nameZh || linkedMat.nameJa}` : `✓ 連動中`)
                          : (lang === "zh" ? "从材料百科选择" : "材料事典から選択")}
                        style={{
                          padding: "3px 6px", fontSize: 13, cursor: "pointer",
                          background: linkedMat ? "#059669" : T.bgCard,
                          color: linkedMat ? "#FFFFFF" : T.textSecondary,
                          border: `0.5px solid ${linkedMat ? "#059669" : T.border}`,
                          borderRadius: 4,
                          width: 30, height: 26,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}
                      >🔗</button>
                    </td>
                    <td style={{ padding: "3px 4px", position: "relative" }}>
                      <input list="autoNameZh" placeholder="中文" value={ing.nameZh||""} onChange={e=>onNameChange("nameZh", e.target.value)} style={{...ist, width: 100, borderColor: linkedMat ? "#059669" : (linked ? "#0F6E56" : "#CCCCCC")}} title={linkedMat ? `✓ 百科:${linkedMat.nameZh || linkedMat.nameJa}` : (linked ? `✓ 已关联「${getCatName(linkedCat, lang)}」` : "")} />
                    </td>
                    <td style={{ padding: "3px 4px" }}><input list="autoNameJa" placeholder="日本語" value={ing.nameJa||""} onChange={e=>onNameChange("nameJa", e.target.value)} style={{...ist, width: 100, borderColor: linkedMat ? "#059669" : (linked ? "#0F6E56" : "#CCCCCC")}} /></td>
                    <td style={{ padding: "3px 4px" }}><input placeholder="FR" value={ing.nameFr||""} onChange={e=>updateIng(ing._id,"nameFr",e.target.value)} style={{...ist, width: 70}} /></td>
                    <td style={{ padding: "3px 4px" }}><input type="number" placeholder="量" value={ing.qty||""} onChange={e=>{updateIng(ing._id,"qty",e.target.value);const up=parseFloat(ing.unitPrice)||0;if(up>0)updateIng(ing._id,"cost",(parseFloat(e.target.value)*up).toFixed(1));}} style={{...ist, width: 52}} /></td>
                    <td style={{ padding: "3px 4px" }}><input placeholder="g" value={ing.unit||""} onChange={e=>updateIng(ing._id,"unit",e.target.value)} style={{...ist, width: 36}} /></td>
                    <td style={{ padding: "3px 4px" }}>
                      {linked ? (
                        <select value={typeof ing.brandIdx === "number" ? ing.brandIdx : ""} onChange={e => onBrandSelect(e.target.value)} style={{...ist, width: 78, padding: "4px 3px"}} title={lang === "zh" ? "从价格表选品牌" : "価格表から選ぶ"}>
                          <option value="">{lang === "zh" ? "—未定—" : "—未定—"}</option>
                          {linkedCat.brands.map((b, bi) => <option key={bi} value={bi}>{getBrandName(b, lang)}</option>)}
                        </select>
                      ) : (
                        <input list="autoBrand" placeholder="品牌" value={ing.brand||""} onChange={e=>updateIng(ing._id,"brand",e.target.value)} style={{...ist, width: 66}} />
                      )}
                    </td>
                    <td style={{ padding: "3px 4px", position: "relative" }}>
                      <input type="number" placeholder="单价" value={ing.unitPrice||""} onChange={e=>{updateIng(ing._id,"unitPrice",e.target.value);const q=parseFloat(ing.qty)||0;if(q>0)updateIng(ing._id,"cost",(q*parseFloat(e.target.value)).toFixed(1));}} style={{...ist, width: 52}} />
                      {priceDrift !== null && (
                        <button onClick={() => {
                          setIngs(prev => prev.map(i => {
                            if (i._id !== ing._id) return i;
                            const q = parseFloat(i.qty) || 0;
                            return { ...i, unitPrice: String(priceDrift), cost: q > 0 ? (q * priceDrift).toFixed(1) : i.cost };
                          }));
                        }} style={{ display: "block", width: "100%", marginTop: 2, fontSize: 10, padding: "1px 3px", background: "#FEF3C7", border: "0.5px solid #F59E0B", borderRadius: 3, cursor: "pointer", color: "#92400E" }} title={lang === "zh" ? "价格表已更新为此值,点击同步" : "価格表の値に更新"}>→ ¥{priceDrift}</button>
                      )}
                    </td>
                    <td style={{ padding: "3px 4px" }}><input type="number" placeholder="自动" value={ing.cost||""} onChange={e=>updateIng(ing._id,"cost",e.target.value)} style={{...ist, width: 56, textAlign: "right"}} /></td>
                    <td style={{ padding: "3px 4px" }}>
                      <select value={ing.group || "none"} onChange={e=>updateIng(ing._id,"group",e.target.value)} style={{ ...ist, width: 80, padding: "4px 3px" }}>
                        {Object.entries(GROUPS).map(([k,v]) => <option key={k} value={k}>{lang === "zh" ? v.zh : v.ja}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "3px 4px" }}><button onClick={() => setIngs(prev=>prev.filter(i=>i._id !== ing._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#666666", fontSize: 15 }}>×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 🧪 自动补全数据源 */}
          <datalist id="autoNameZh">
            {autoCompleteData.nameZh.map(n => <option key={n} value={n} />)}
          </datalist>
          <datalist id="autoNameJa">
            {autoCompleteData.nameJa.map(n => <option key={n} value={n} />)}
          </datalist>
          <datalist id="autoBrand">
            {autoCompleteData.brand.map(n => <option key={n} value={n} />)}
          </datalist>
        </div>
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#F5F5F5", borderRadius: 6, fontSize: 13 }}>
          总成本：<strong style={{ fontSize: 16 }}>¥{totalCost.toFixed(0)}</strong>
          {form.yield && parseFloat(form.yield) > 0 && <span style={{ color: "#666666", marginLeft: 16 }}>每{form.unit || "g"}成本：¥{(totalCost/parseFloat(form.yield)).toFixed(2)}</span>}
        </div>
      </div>

      {/* 制法 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>制作流程（中日双语）</div>
          <Btn size="sm" onClick={() => setSteps(prev => [...prev, { _id: nextStepId.current++, textZh: "", textJa: "" }])}>{lang === "zh" ? "+ 追加" : "+ 追加"}</Btn>
        </div>
        {steps.map((s, i) => (
          <div key={s._id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: i < steps.length - 1 ? "0.5px dashed #E5E5E5" : "none" }}>
            <div style={{ minWidth: 22, height: 22, borderRadius: "50%", background: "#F5F5F5", border: "0.5px solid #CCCCCC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, marginTop: 7, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <input value={s.textZh || ""} onChange={e => setSteps(prev => prev.map(st => st._id === s._id ? { ...st, textZh: e.target.value } : st))} placeholder="中文步骤描述…" style={inpStyle} />
              <input value={s.textJa || ""} onChange={e => setSteps(prev => prev.map(st => st._id === s._id ? { ...st, textJa: e.target.value } : st))} placeholder="日本語ステップ…" style={inpStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
              <button
                onClick={() => setSteps(prev => { if (i === 0) return prev; const n = [...prev]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}
                disabled={i === 0}
                style={{ background: i === 0 ? "#F5F5F5" : "#FFFFFF", border: "0.5px solid #CCCCCC", cursor: i === 0 ? "not-allowed" : "pointer", color: i === 0 ? "#CCCCCC" : "#666666", fontSize: 11, padding: "2px 6px", borderRadius: 3 }}
                title="上移"
              >↑</button>
              <button
                onClick={() => setSteps(prev => { if (i === prev.length - 1) return prev; const n = [...prev]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n; })}
                disabled={i === steps.length - 1}
                style={{ background: i === steps.length - 1 ? "#F5F5F5" : "#FFFFFF", border: "0.5px solid #CCCCCC", cursor: i === steps.length - 1 ? "not-allowed" : "pointer", color: i === steps.length - 1 ? "#CCCCCC" : "#666666", fontSize: 11, padding: "2px 6px", borderRadius: 3 }}
                title="下移"
              >↓</button>
            </div>
            <button onClick={() => setSteps(prev => prev.filter(st => st._id !== s._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#666666", fontSize: 15, padding: "6px", marginTop: 4 }}>×</button>
          </div>
        ))}
      </div>

      {/* 备注 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>备注 / メモ</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>中文</label>
          <textarea value={form.notesZh || ""} onChange={f("notesZh")} placeholder="关键点・技术要点・风味特征等…" style={{...inpStyle, minHeight: 80, resize: "vertical"}} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>日本語</label>
          <textarea value={form.notesJa || ""} onChange={f("notesJa")} placeholder="ポイント・技術的注意・風味特性など…" style={{...inpStyle, minHeight: 80, resize: "vertical"}} />
        </div>
      </div>

      {/* 🖼️ 图片链接 */}
      <ImageUrlsEditor
        urls={form.imageUrls || []}
        onChange={(urls) => setForm(prev => ({ ...prev, imageUrls: urls }))}
      />

      {/* 🔗 快速新建相关知识点 */}
      {onQuickAddKnowledge && !isNew && (
        <div style={{ background: "#F3E8FF", border: "0.5px solid #C4B5FD", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#5B21B6" }}>{lang === "zh" ? "📚 快速新建相关知识点" : "📚 関連ナレッジを新規作成"}</div>
              <div style={{ fontSize: 11, color: "#6D28D9", marginTop: 3 }}>录入时想到某个技术点？一键添加到知识库并自动关联</div>
            </div>
            <Btn variant="primary" size="sm" onClick={() => setShowKnowledgeModal(true)}>{lang === "zh" ? "+ 新建知识点" : "+ ナレッジ新規"}</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
        {errorMsg && <span style={{ color: "#A32D2D", fontSize: 13, marginRight: 8 }}>⚠ {errorMsg}</span>}
        <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        <Btn variant="primary" onClick={handleSave}>{lang === "zh" ? "保存组件" : "コンポーネント保存"}</Btn>
      </div>

      {/* 快速知识点浮层 */}
      {showKnowledgeModal && (
        <QuickKnowledgeModal
          relatedName={form.nameZh || form.nameJa}
          onClose={() => setShowKnowledgeModal(false)}
          onSave={(k) => {
            onQuickAddKnowledge(k);
            setShowKnowledgeModal(false);
          }}
        />
      )}

      {/* 🔗 材料百科选择弹窗 */}
      {pickerTargetIngId !== null && (
        <MaterialPickerModal
          materials={materials}
          brands={brands}
          currentMaterialId={(ings.find(i => i._id === pickerTargetIngId) || {}).materialId || null}
          lang={lang}
          onClose={() => setPickerTargetIngId(null)}
          onSelect={(mat) => {
            setIngs(prev => prev.map(i => {
              if (i._id !== pickerTargetIngId) return i;
              if (mat === null) return { ...i, materialId: null };
              const b = brands.find(x => x.id === mat.brandId);
              const pp = getMaterialEffectivePrice(mat);
              const q = parseFloat(i.qty) || 0;
              return {
                ...i,
                materialId: mat.id,
                nameZh: i.nameZh || mat.nameZh || "",
                nameJa: i.nameJa || mat.nameJa || "",
                nameFr: i.nameFr || mat.nameFr || "",
                brand: b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : i.brand,
                unitPrice: !isNaN(pp) && pp > 0 ? String(pp) : i.unitPrice,
                cost: (!isNaN(pp) && pp > 0 && q > 0) ? (q * pp).toFixed(1) : i.cost,
              };
            }));
            setPickerTargetIngId(null);
          }}
        />
      )}

      {/* 🤖 批量智能关联弹窗 */}
      {showBulkMatch && (
        <BulkMatchModal
          ings={ings}
          materials={materials}
          brands={brands}
          lang={lang}
          onClose={() => setShowBulkMatch(false)}
          onApply={(selections) => {
            setIngs(prev => prev.map(i => {
              const matId = selections[i._id];
              if (matId == null) return i;
              const mat = materials.find(m => m.id === matId);
              if (!mat) return i;
              const b = brands.find(x => x.id === mat.brandId);
              const pp = getMaterialEffectivePrice(mat);
              const q = parseFloat(i.qty) || 0;
              return {
                ...i,
                materialId: mat.id,
                nameZh: i.nameZh || mat.nameZh || "",
                nameJa: i.nameJa || mat.nameJa || "",
                nameFr: i.nameFr || mat.nameFr || "",
                brand: b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : i.brand,
                unitPrice: !isNaN(pp) && pp > 0 ? String(pp) : i.unitPrice,
                cost: (!isNaN(pp) && pp > 0 && q > 0) ? (q * pp).toFixed(1) : i.cost,
              };
            }));
            setShowBulkMatch(false);
          }}
        />
      )}

      {/* 底部留白,避免内容被浮动保存栏遮挡 */}
      <div style={{ height: 80 }} />
      {/* 浮动保存栏 */}
      <StickySaveBar onSave={handleSave} label={lang === "zh" ? "保存组件" : "コンポーネント保存"} />
    </div>
  );
}

// ─── v14 图片渲染钩子: 自动选择 IndexedDB blob URL 或远程 url ──
// 兼容旧 string / 旧 dict / 新 {source, url, imageId, caption}
function useImageSrc(img) {
  const imageId = img && typeof img === 'object' ? img.imageId : null;
  const remoteUrl = typeof img === 'string' ? img : (img && img.url) || null;
  const [src, setSrc] = useState(imageId ? null : remoteUrl);
  useEffect(() => {
    if (!imageId) { setSrc(remoteUrl); return; }
    let cancelled = false;
    let createdBlobUrl = null;
    getImageBlob(imageId).then(blob => {
      if (cancelled) return;
      if (blob) {
        createdBlobUrl = URL.createObjectURL(blob);
        setSrc(createdBlobUrl);
      } else {
        setSrc(remoteUrl);
      }
    }).catch(() => { if (!cancelled) setSrc(remoteUrl); });
    return () => {
      cancelled = true;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, [imageId, remoteUrl]);
  return src;
}

// 通用图片缩略图组件，给列表 / 编辑器 / 详情页共用
function ImageThumb({ img, alt, style, onError, fallbackText }) {
  const src = useImageSrc(img);
  if (!src) {
    if (fallbackText) {
      return <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#999", background: "#F0F0F0" }}>{fallbackText}</div>;
    }
    return null;
  }
  return <img src={src} alt={alt} style={style} onError={onError} />;
}

// ─── 图片压缩工具函数（P2 上传专用，仅 ImageUrlsEditor 内部调用）─────
// 流程：长边 > 1200 缩放到 1200 → toBlob('image/jpeg', 0.85) → 若 > 500KB 重压 0.7
// 200KB 不强求（用户允许 200–500KB 区间）
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("图片解码失败"));
      img.onload = () => {
        const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
        const scale = longEdge > 1200 ? 1200 / longEdge : 1;
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas 不可用"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob1) => {
          if (!blob1) {
            reject(new Error("压缩失败 (toBlob 返回空)"));
            return;
          }
          if (blob1.size > 500 * 1024) {
            // 二次压缩 0.7
            canvas.toBlob((blob2) => {
              if (!blob2) {
                reject(new Error("二次压缩失败"));
                return;
              }
              resolve({ blob: blob2, mimeType: "image/jpeg", size: blob2.size });
            }, "image/jpeg", 0.7);
          } else {
            resolve({ blob: blob1, mimeType: "image/jpeg", size: blob1.size });
          }
        }, "image/jpeg", 0.85);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── 图片URL编辑器 ─────────────────────────────────────────────
function ImageUrlsEditor({ urls, onChange }) {
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef(null);

  const addImage = () => {
    const url = newUrl.trim();
    if (!url) {
      setError("请输入图片URL");
      return;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("URL必须以 http:// 或 https:// 开头");
      return;
    }
    // v57:防止粘贴超大 base64 data URI 把 localStorage 撑爆
    // 正常图床 URL 不会超过 500 字符,超过就劝退
    if (url.length > 1000) {
      setError("URL 过长 (>1000 字符),请先上传到图床 Imgur/Google Drive 再粘贴链接");
      return;
    }
    if (url.startsWith("data:")) {
      setError("不支持 base64 data 链接,会把本地存储撑爆。请用图床链接");
      return;
    }
    // v14: 推新格式（含 source 字段，按 host 自动判断）
    onChange([...urls, {
      source: url.includes('orderie.jp') ? 'orderie' : 'manual',
      url,
      caption: newCaption.trim(),
    }]);
    setNewUrl("");
    setNewCaption("");
    setError("");
  };

  const removeImage = (idx) => {
    // v14: 若有 imageId（IndexedDB 引用），级联删 blob
    const removed = urls[idx];
    if (removed && typeof removed === 'object' && removed.imageId) {
      deleteImageBlob(removed.imageId);
    }
    onChange(urls.filter((_, i) => i !== idx));
  };

  const updateCaption = (idx, caption) => {
    onChange(urls.map((img, i) => {
      if (i !== idx) return img;
      // v14: 处理旧 string 元素 — 升级为新格式后再加 caption
      if (typeof img === 'string') {
        return { source: img.includes('orderie.jp') ? 'orderie' : 'manual', url: img, caption };
      }
      return { ...img, caption };
    }));
  };

  // P2: 多文件串行上传（避免 IndexedDB 写入并发坑），单张失败跳过继续（决策 1）
  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setUploading(true);
    setError("");
    const skipped = [];
    let curUrls = urls.slice();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(`${i + 1}/${files.length}`);
      try {
        if (!file.type || !file.type.startsWith("image/")) {
          skipped.push(`${file.name}: 仅支持图片文件`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          skipped.push(`${file.name}: 单张超过 10MB`);
          continue;
        }
        const { blob, mimeType } = await compressImage(file);
        const imageId = await putImageBlob({ blob, mimeType, source: "upload" });
        if (!imageId) {
          skipped.push(`${file.name}: 写入存储失败`);
          continue;
        }
        // 实时累积式 onChange，每张完成立即推（缩略图实时显示）
        curUrls = [...curUrls, { source: "upload", imageId, caption: "" }];
        onChange(curUrls);
      } catch (err) {
        skipped.push(`${file.name}: ${err && err.message ? err.message : "处理失败"}`);
        if (typeof console !== "undefined" && console.error) console.error("[upload]", file.name, err);
      }
    }
    setUploading(false);
    setProgress("");
    if (skipped.length > 0) {
      setError(`跳过 ${skipped.length} 张: ${skipped.join("; ")}`);
    }
  };

  const inputStyle = { padding: "7px 10px", fontSize: 13, border: "0.5px solid #CCCCCC", borderRadius: "6px", background: "#FFFFFF", color: "#111111", fontFamily: "system-ui, sans-serif", boxSizing: "border-box" };

  return (
    <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>🖼️ 图片链接</div>
      <div style={{ fontSize: 11, color: "#666666", marginBottom: 12, lineHeight: 1.6 }}>
        点 <b>📷 上传图片</b> 选本地文件（自动压缩入库），或在下方粘贴远程 URL（<a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", textDecoration: "underline" }}>Imgur</a> / Google Drive 分享链接 / 微信长按复制等图床链接）。
      </div>

      {/* 已添加的图片列表 */}
      {urls.length > 0 && (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          {urls.map((img, i) => {
            // v14 兼容: 旧 string / 旧 dict / 新 object
            const imgUrl = typeof img === 'string' ? img : (img && img.url) || '';
            const imgCaption = typeof img === 'object' && img ? (img.caption || '') : '';
            const imgImageId = typeof img === 'object' && img ? img.imageId : null;
            const displayLabel = imgImageId ? `[本地] image#${imgImageId}` : imgUrl;
            return (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 8, background: "#F9FAFB", borderRadius: 8 }}>
                <ImageThumb img={img} alt={imgCaption || `图片${i+1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "0.5px solid #E5E5E5", flexShrink: 0 }} onError={(e) => { e.target.style.display = "none"; }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "#666666", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayLabel}</div>
                  <input
                    value={imgCaption}
                    onChange={e => updateCaption(i, e.target.value)}
                    placeholder="图片说明（可选）"
                    style={{ ...inputStyle, width: "100%", fontSize: 12 }}
                  />
                </div>
                <button onClick={() => removeImage(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 18, flexShrink: 0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* P2 上传按钮区（决策 2: 放 URL 粘贴行上面）*/}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ position: "absolute", left: "-9999px", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";  // 允许重选同名文件
        }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => { if (!uploading && fileInputRef.current) fileInputRef.current.click(); }}
          disabled={uploading}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "7px 14px", fontSize: 13,
            border: "0.5px solid #111111", borderRadius: "6px",
            background: "#111111", color: "#FFFFFF",
            cursor: uploading ? "not-allowed" : "pointer",
            fontFamily: "system-ui, sans-serif",
            opacity: uploading ? 0.6 : 1,
            transition: "opacity 0.12s",
          }}
        >
          {uploading ? `处理中... ${progress}` : "📷 上传图片"}
        </button>
        <span style={{ fontSize: 11, color: "#888888" }}>
          .jpg / .png / .webp，单张 ≤ 10MB，自动压缩到 ≤500KB
        </span>
      </div>

      {/* 添加新图片（URL 粘贴）*/}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 6, alignItems: "center" }}>
        <input
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          placeholder="https://i.imgur.com/xxx.jpg"
          style={inputStyle}
        />
        <input
          value={newCaption}
          onChange={e => setNewCaption(e.target.value)}
          placeholder="说明（可选）"
          style={inputStyle}
        />
        <Btn size="sm" variant="primary" onClick={addImage}>+ 添加</Btn>
      </div>
      {error && <div style={{ fontSize: 11, color: "#A32D2D", marginTop: 6 }}>⚠ {error}</div>}
    </div>
  );
}

// ─── 图片展示（用于详情页） ────────────────────────────────────
function ImageUrlsDisplay({ urls }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
      <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>🖼️ 图片</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
        {urls.map((img, i) => {
          // v14 兼容: 旧 string / 旧 dict / 新 object
          const imgUrl = typeof img === 'string' ? img : (img && img.url) || '';
          const imgCaption = typeof img === 'object' && img ? (img.caption || '') : '';
          const thumb = (
            <ImageThumb img={img} alt={imgCaption || `图片${i+1}`} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, border: "0.5px solid #E5E5E5", display: "block", cursor: imgUrl ? "pointer" : "default" }} onError={(e) => { e.target.style.display = "none"; }} />
          );
          return (
            <div key={i}>
              {imgUrl
                ? <a href={imgUrl} target="_blank" rel="noopener noreferrer">{thumb}</a>
                : thumb}
              {imgCaption && <div style={{ fontSize: 11, color: "#666666", marginTop: 4, textAlign: "center" }}>{imgCaption}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 📥 P3 v2 候选审查 dialog（B+X 方案，详见 .claude/p3_crawl_design_v2.md）────
function P3CandidateReviewDialog({ queue, onSelect, onReject, onCancel }) {
  const cur = queue.materials[queue.currentIdx];
  const total = queue.materials.length;
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        const idx = parseInt(e.key) - 1;
        if (idx < cur.candidates.length) onSelect(cur.candidates[idx]);
      } else if (e.key === ' ') { e.preventDefault(); onReject(); }
      else if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [queue.currentIdx]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.bgCard, borderRadius: T.radiusLg, padding: "1.5rem 1.75rem", maxWidth: 800, width: "100%", maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div style={{ fontFamily: T.fontSerif, fontSize: 16, fontWeight: 500, color: T.textPrimary }}>📥 P3 候选审查 · {queue.currentIdx + 1} / {total}</div>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: T.textTertiary, fontSize: 22 }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 6 }}>
          <b>{cur.material_nameZh || cur.material_id}</b> · 搜索词 <code style={{ fontSize: 11, background: T.bgMuted, padding: "1px 5px", borderRadius: 3 }}>{cur.searchTerm || '?'}</code> · 引擎 {cur.engine || '?'}
        </div>
        <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 14 }}>键盘 <kbd>1/2/3</kbd> 选 · <kbd>空格</kbd> 全否决 · <kbd>Esc</kbd> 取消整批</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
          {cur.candidates.slice(0, 3).map((c, i) => (
            <div key={i} onClick={() => onSelect(c)} style={{ cursor: "pointer", border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, padding: 8, background: T.bgCard, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: T.textPrimary }}>选 {i + 1}</div>
              <img src={c.thumbnailUrl} alt={c.alt || ''} style={{ width: "100%", aspectRatio: "1", objectFit: "contain", background: "#F8F8F8", borderRadius: 4 }} onError={(e) => { e.target.style.display = "none"; }} />
              <div style={{ fontSize: 10, color: T.textSecondary, lineHeight: 1.4, height: 48, overflow: "hidden" }}>{(c.alt || '').slice(0, 80)}</div>
              <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 10, color: "#3B82F6", textDecoration: "underline" }}>查看商品页 →</a>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn onClick={onReject} variant="danger">空格 全否决（不抓）</Btn>
        </div>
      </div>
    </div>
  );
}

function P3ImportReportDialog({ report, canUndo, onUndo, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.bgCard, borderRadius: T.radiusLg, padding: "1.5rem 1.75rem", maxWidth: 480, width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
        <div style={{ fontFamily: T.fontSerif, fontSize: 16, fontWeight: 500, marginBottom: 12 }}>📥 P3 批次完成{report.cancelled ? '（已取消）' : ''}</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 14, lineHeight: 1.7 }}>
          ✓ 写入: {report.ok}<br/>
          ✗ 全否决: {report.rejected}<br/>
          ⏭ 跳过: {report.skipped}{report.batch_id ? ` · batch ${report.batch_id}` : ''}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {canUndo && <Btn onClick={onUndo} variant="danger">撤销本批</Btn>}
          <Btn onClick={onClose}>关闭</Btn>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🏷 产品家族（Product Family）模块
// ═══════════════════════════════════════════════════════════════

// 家族颜色池 —— 与自定义组件分类共用同一张 8 色盘（原先两张表有 7 组完全重复）
const FAMILY_COLORS = PALETTE_8;

// ─── 家族编辑表单 ─────────────
function FamilyEditForm({ family, onSave, onDelete, onBack, lang = "zh" }) {
  const isNew = !family;
  const [form, setForm] = useState(family ? { ...family } : {
    nameZh: "", nameJa: "", nameFr: "",
    description: "",
    commonMold: "", commonTemp: "", commonTime: "",
    colorIdx: 0,
    tags: [],
    imageUrls: [],
  });
  const [newTag, setNewTag] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };

  const handleSave = () => {
    if (!form.nameZh.trim()) {
      setErrorMsg("请输入家族名称");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    onSave({
      ...form,
      id: family ? family.id : "family_" + Date.now(),
      updatedAt: new Date().toISOString(),
    });
  };

  const selectedColor = FAMILY_COLORS[form.colorIdx || 0];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{isNew ? "新建产品家族" : "编辑家族"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isNew && <Btn variant="danger" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {errorMsg && <div style={{ background: "#FCEBEB", border: "0.5px solid #F7C1C1", color: "#A32D2D", padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{errorMsg}</div>}

      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：家族用于管理同一类产品的多个变体（例：「巴斯克家族」下有 经典版、柚子版、橙花版等）。中日文任填其一。
      </div>

      {/* 基本信息 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem", borderLeft: `4px solid ${selectedColor.color}` }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>🏷 基本信息</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>家族名（中文）</label>
            <input value={form.nameZh} onChange={f("nameZh")} placeholder="例：巴斯克家族" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>家族名（日本語）</label>
            <input value={form.nameJa} onChange={f("nameJa")} placeholder="例：バスクチーズケーキ系" style={inpStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>家族描述</label>
          <textarea value={form.description} onChange={f("description")} placeholder="这个家族的产品有什么共同点？灵感来源？" style={{ ...inpStyle, minHeight: 60, resize: "vertical" }} />
        </div>

        {/* 颜色选择 */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>家族颜色</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FAMILY_COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => setForm(prev => ({ ...prev, colorIdx: i }))}
                style={{ width: 28, height: 28, borderRadius: "50%", background: c.color, border: form.colorIdx === i ? "2px solid #111" : "2px solid transparent", cursor: "pointer", padding: 0 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 通用制作参数 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>⚙ 家族通用参数（所有变体共用，仅作显示参考）</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "模具" : "型"}</label>
            <input value={form.commonMold || ""} onChange={f("commonMold")} placeholder="15cm セルクル" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "温度" : "温度"}</label>
            <input value={form.commonTemp || ""} onChange={f("commonTemp")} placeholder="230°C" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>时间</label>
            <input value={form.commonTime || ""} onChange={f("commonTime")} placeholder="28 分钟" style={inpStyle} />
          </div>
        </div>
      </div>

      {/* 标签 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>🏷 家族标签</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {(form.tags || []).map((tag, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: selectedColor.bg, color: selectedColor.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
              {tag}
              <button onClick={() => setForm(prev => ({ ...prev, tags: prev.tags.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: selectedColor.color, fontSize: 14, padding: 0, marginLeft: 2 }}>×</button>
            </span>
          ))}
        </div>
        <input
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && newTag.trim()) {
              e.preventDefault();
              if (!(form.tags || []).includes(newTag.trim())) {
                setForm(prev => ({ ...prev, tags: [...(prev.tags || []), newTag.trim()] }));
              }
              setNewTag("");
            }
          }}
          placeholder="回车添加标签：例 招牌、冷藏甜品、礼盒..."
          style={{ ...inpStyle, fontSize: 12 }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        <Btn variant="primary" onClick={handleSave}>{lang === "zh" ? "保存家族" : "ファミリー保存"}</Btn>
      </div>
    </div>
  );
}

// ─── 家族详情（包含对比功能） ─────────────
function FamilyDetail({ family, recipes, lang, onEdit, onBack, onViewRecipe }) {
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  const familyRecipes = recipes.filter(r => r.familyId === family.id);
  const fam = family;
  const famName = lang === "zh" ? (fam.nameZh || fam.nameJa) : (fam.nameJa || fam.nameZh);
  const color = FAMILY_COLORS[fam.colorIdx || 0];

  const toggleCompare = (rid) => {
    setSelectedForCompare(prev => {
      if (prev.includes(rid)) return prev.filter(x => x !== rid);
      if (prev.length >= 3) {
        alert("最多对比3个变体");
        return prev;
      }
      return [...prev, rid];
    });
  };

  // 对比数据：收集所有变体的原料，合并为一张表
  const compareRecipes = recipes.filter(r => selectedForCompare.includes(r.id));
  const allIngredientNames = [];
  compareRecipes.forEach(r => {
    (r.ingredients || []).forEach(ing => {
      const key = ing.nameZh || ing.nameJa;
      if (key && !allIngredientNames.includes(key)) allIngredientNames.push(key);
    });
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{famName}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn size="sm" onClick={onEdit}>{lang === "zh" ? "编辑" : "編集"}</Btn>
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* 家族封面 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem", borderLeft: `4px solid ${color.color}` }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 500 }}>{famName}</div>
            {fam.nameFr && <div style={{ fontSize: 13, color: "#888", fontStyle: "italic" }}>{fam.nameFr}</div>}
          </div>
          <div style={{ background: color.bg, color: color.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{familyRecipes.length} 个变体</div>
        </div>
        {fam.description && <div style={{ marginTop: 10, padding: "10px 14px", background: "#F9FAFB", borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: "#333", fontStyle: "italic" }}>「{fam.description}」</div>}

        {(fam.tags || []).length > 0 && (
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {fam.tags.map((t, i) => <span key={i} style={{ background: color.bg, color: color.color, padding: "2px 10px", borderRadius: 20, fontSize: 11 }}>{t}</span>)}
          </div>
        )}

        {(fam.commonMold || fam.commonTemp || fam.commonTime) && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: color.bg, borderRadius: 8, fontSize: 12, color: color.color, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span>⚙ 通用参数：</span>
            {fam.commonMold && <span>模具 {fam.commonMold}</span>}
            {fam.commonTemp && <span>温度 {fam.commonTemp}</span>}
            {fam.commonTime && <span>时间 {fam.commonTime}</span>}
          </div>
        )}
      </div>

      {/* 变体列表 / 对比模式切换 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>🧪 变体列表（{familyRecipes.length}）</div>
        {familyRecipes.length >= 2 && (
          <Btn size="sm" variant={compareMode ? "primary" : "default"} onClick={() => { setCompareMode(!compareMode); setSelectedForCompare([]); }}>
            {compareMode ? "退出对比" : "⚖ 对比模式"}
          </Btn>
        )}
      </div>

      {familyRecipes.length === 0 ? (
        <div style={{ background: "#F9FAFB", border: "1px dashed #CCC", borderRadius: 8, padding: "2rem", textAlign: "center", color: "#666", fontSize: 13 }}>
          这个家族还没有变体。<br />
          在配方一览里新建或编辑配方，选择归属到这个家族。
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8, marginBottom: "1rem" }}>
          {familyRecipes.map(r => {
            const n = pickLang(r, "name", lang);
            const isSelected = selectedForCompare.includes(r.id);
            return (
              <div
                key={r.id}
                onClick={() => compareMode ? toggleCompare(r.id) : onViewRecipe(r.id)}
                style={{ background: isSelected ? color.bg : "#FFFFFF", border: `0.5px solid ${isSelected ? color.color : "#E5E5E5"}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
              >
                {compareMode && <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ pointerEvents: "none" }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {r.variantLabel && <span style={{ background: color.bg, color: color.color, padding: "1px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{r.variantLabel}</span>}
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{n}</span>
                  </div>
                  {r.variantNotes && <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{r.variantNotes}</div>}
                </div>
                {!compareMode && <span style={{ color: "#999", fontSize: 12 }}>→</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* 对比视图 */}
      {compareMode && selectedForCompare.length >= 2 && (
        <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E5E5", borderRadius: 12, padding: "1rem", overflowX: "auto", marginTop: 10 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10, color: color.color }}>⚖ 原料对比（{compareRecipes.length}个变体）</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${color.color}` }}>
                <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 500, minWidth: 120 }}>原料</th>
                {compareRecipes.map(r => {
                  const n = pickLang(r, "name", lang);
                  return <th key={r.id} style={{ textAlign: "center", padding: "6px 10px", fontWeight: 500, minWidth: 100 }}>{r.variantLabel || n}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {allIngredientNames.map(ingName => (
                <tr key={ingName} style={{ borderBottom: "0.5px solid #F0F0F0" }}>
                  <td style={{ padding: "5px 10px", color: "#333" }}>{ingName}</td>
                  {compareRecipes.map(r => {
                    const ing = (r.ingredients || []).find(x => x.nameZh === ingName || x.nameJa === ingName);
                    return <td key={r.id} style={{ padding: "5px 10px", textAlign: "center", color: ing ? "#111" : "#CCC" }}>{ing ? `${ing.qty}${ing.unit || "g"}` : "—"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// （家族模块结束）
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 🖨 打印模块
// ═══════════════════════════════════════════════════════════════

// 默认SVG LOGO（用户可替换）- 简约"R"花体字，带糕点装饰
const DEFAULT_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="55" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
  <circle cx="60" cy="60" r="48" fill="none" stroke="#1a1a1a" stroke-width="0.5"/>
  <text x="60" y="68" font-family="Georgia, 'Times New Roman', serif" font-size="48" font-weight="400" fill="#1a1a1a" text-anchor="middle" font-style="italic">R</text>
  <text x="60" y="88" font-family="Georgia, serif" font-size="6" letter-spacing="3" fill="#1a1a1a" text-anchor="middle">— PATISSERIE —</text>
  <path d="M 30 95 Q 60 100 90 95" fill="none" stroke="#1a1a1a" stroke-width="0.5"/>
</svg>`;

const LOGO_DATA_URI = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(DEFAULT_LOGO_SVG)));

// ─── 打印设置弹窗 ─────────────
function PrintModal({ onClose, onConfirm, itemType }) {
  // 每个模板的推荐默认勾选（用户可改）
  const TEMPLATE_DEFAULTS = {
    kitchen:  { ingredients: true, steps: false, notes: true,  images: false, relatedKnowledge: false }, // 厨房：不要步骤和图片
    showcase: { ingredients: true, steps: false, notes: true,  images: true,  relatedKnowledge: false }, // 展示：要图片不要步骤
    archive:  { ingredients: true, steps: true,  notes: true,  images: true,  relatedKnowledge: true  }, // 归档：全部
  };

  const [template, setTemplate] = useState("kitchen");
  const [lang, setLang] = useState("ja");
  const [sections, setSections] = useState(TEMPLATE_DEFAULTS.kitchen);
  const [userModified, setUserModified] = useState(false); // 用户是否手动改过

  // 切换模板时，如果用户没手动改过，自动应用推荐默认；否则保留用户设置
  const handleTemplateChange = (newTemplate) => {
    setTemplate(newTemplate);
    if (!userModified) {
      setSections(TEMPLATE_DEFAULTS[newTemplate]);
    }
  };

  const handleSectionChange = (k, v) => {
    setSections(prev => ({ ...prev, [k]: v }));
    setUserModified(true); // 标记用户改过
  };

  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };

  const templates = [
    { id: "kitchen",  icon: "🍳", nameZh: "厨房操作台",   desc: "简洁1页·大字号·重点突出温度时间·适合边做边看" },
    { id: "showcase", icon: "✨", nameZh: "客户展示版",   desc: "精美排版·突出品牌故事·适合展示给客人或合作伙伴" },
    { id: "archive",  icon: "📔", nameZh: "归档笔记版",   desc: "详细多页·含完整笔记·适合收藏·类食谱书风格" },
  ];

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "1.5rem", maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>🖨 打印设置</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#999" }}>×</button>
        </div>

        {/* 模板选择 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>📋 选择模板</div>
          <div style={{ display: "grid", gap: 8 }}>
            {templates.map(t => (
              <div key={t.id} onClick={() => handleTemplateChange(t.id)} style={{ border: `1.5px solid ${template === t.id ? "#111111" : "#E5E5E5"}`, background: template === t.id ? "#F9FAFB" : "#FFFFFF", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 24 }}>{t.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t.nameZh}</div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{t.desc}</div>
                  </div>
                  {template === t.id && <div style={{ fontSize: 18, color: "#111" }}>✓</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 语言选择 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>🌐 打印语言</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["zh", "仅中文"], ["ja", "仅日文"], ["both", "中日双语"]].map(([v, label]) => (
              <button key={v} onClick={() => setLang(v)} style={{ flex: 1, padding: "8px 12px", fontSize: 12, border: `1.5px solid ${lang === v ? "#111111" : "#E5E5E5"}`, background: lang === v ? "#111111" : "#FFFFFF", color: lang === v ? "#FFFFFF" : "#111111", borderRadius: 8, cursor: "pointer", fontWeight: lang === v ? 500 : 400 }}>{label}</button>
            ))}
          </div>
        </div>

        {/* 显示选项 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>📝 显示内容</div>
          <div style={{ display: "grid", gap: 6 }}>
            {[
              ["ingredients", "原料"],
              ["steps", "制作流程"],
              ["notes", "注意事项·备注"],
              ["images", "图片"],
              ["relatedKnowledge", "关联知识点"],
            ].map(([k, label]) => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={sections[k]} onChange={e => handleSectionChange(k, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
          {!userModified && (
            <div style={{ fontSize: 10, color: "#999", marginTop: 4, fontStyle: "italic" }}>
              💡 已根据模板自动选择，可以手动调整
            </div>
          )}
        </div>

        <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 11, color: "#854F0B", lineHeight: 1.6 }}>
          💡 点击「打印预览」后，使用浏览器的「打印」(Ctrl+P / ⌘+P) 进行实际打印，或保存为PDF。<br />
          💰 价格信息不会打印（已隐藏）。
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn onClick={onClose}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
          <Btn variant="primary" onClick={() => onConfirm({ template, lang, sections })}>🖨 打印预览</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── 打印预览视图 ─────────────
function PrintView({ item, itemType, template, lang, sections, printSettings, onClose, onUpdateSettings }) {
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState(printSettings.logoUrl || "");
  const [brandNameInput, setBrandNameInput] = useState(printSettings.brandName || "kororā");
  const [subtitleInput, setSubtitleInput] = useState(printSettings.brandSubtitle || "PATISSERIE");

  const logoSrc = printSettings.logoUrl || LOGO_DATA_URI;
  const brandName = printSettings.brandName || "kororā";
  const brandSubtitle = printSettings.brandSubtitle || "PATISSERIE";

  const doPrint = () => {
    window.print();
  };

  const saveLogo = () => {
    onUpdateSettings({ logoUrl: logoUrlInput.trim(), brandName: brandNameInput.trim() || "kororā", brandSubtitle: subtitleInput.trim() || "Boulangerie • Pâtisserie • Café" });
    setShowLogoUpload(false);
  };

  const resetLogo = () => {
    setLogoUrlInput("");
    onUpdateSettings({ logoUrl: "", brandName: brandNameInput.trim() || "kororā", brandSubtitle: subtitleInput.trim() || "Boulangerie • Pâtisserie • Café" });
    setShowLogoUpload(false);
  };

  return (
    <>
      {/* 打印 CSS · 只在打印时生效 —— 按设计稿 2c「A4 黑白」规范
          纯黑白：所有底色转白、所有描边转 1px 实黑，盆改用粗体编号不用颜色，
          灰度打印或复印都不丢信息。正文最小 10pt，配料名 14pt 粗、用量 17pt 粗，
          站在操作台一臂远(约 60cm)能看清。 */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          /* 一行不跨页 */
          .print-area tr, .print-area li, .print-area .p-row { break-inside: avoid; page-break-inside: avoid; }
          /* 底色转白、描边转实黑 */
          .print-area * { background: transparent !important; box-shadow: none !important; }
          .print-area .p-hide-print { display: none !important; }
        }
        .print-area {
          background: white;
          color: #000;
          font-family: "Zen Kaku Gothic New", "Noto Sans JP", "Hiragino Sans", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
          line-height: 1.5;
          box-sizing: border-box;
        }
        .print-area h1, .print-area h2, .print-area h3 { font-family: inherit; margin: 0; }
        .print-area table { border-collapse: collapse; width: 100%; }
        /* 盆列：不用颜色，用粗体编号 */
        .print-area .p-bowl { font-size: 14pt; font-weight: 700; width: 42px; vertical-align: top; }
        /* 配料名 14pt 粗 · 日文名 11pt · 备注 10pt 粗 */
        .print-area .p-name { font-size: 14pt; font-weight: 700; line-height: 1.3; }
        .print-area .p-sub  { font-size: 11pt; line-height: 1.4; }
        .print-area .p-note { font-size: 10pt; font-weight: 700; margin-top: 2px; }
        /* 用量 17pt 粗，一臂远能看清 */
        .print-area .p-qty  { font-size: 17pt; font-weight: 700; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
        /* 每行右侧一个 22px 空格子，投一样勾一样 */
        .print-area .p-check { display: block; width: 22px; height: 22px; border: 1.5px solid #000; }
        .print-area .p-th { text-align: left; font-size: 10pt; font-weight: 400; letter-spacing: 0.14em; padding: 6px 0; border-bottom: 1px solid #000; }
        .print-area .p-td { padding: 9px 0; border-bottom: 1px solid #D8D8D8; vertical-align: top; }
        /* 步骤两栏排，13 步刚好一页装下 */
        .print-area .p-steps { display: grid; grid-template-columns: 1fr 1fr; gap: 0 32px; }
        .print-area .p-step { display: grid; grid-template-columns: 26px 1fr; padding: 5px 0; border-bottom: 1px solid #E4E4E4; }
        .print-area .p-step-n { font-size: 11pt; font-weight: 700; }
        .print-area .p-step-t { font-size: 12pt; line-height: 1.45; }
        .print-area .p-total { margin-top: 20px; border: 2px solid #000; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; }
        .print-area .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 120px;
          color: rgba(0, 0, 0, 0.04);
          font-family: "Jost", Georgia, serif;
          pointer-events: none;
          z-index: 0;
          letter-spacing: 10px;
          user-select: none;
        }
      `}</style>

      {/* 工具栏（打印时隐藏） */}
      <div className="no-print" style={{ position: "sticky", top: 0, background: T.brand, color: T.bgApp, padding: "12px 20px", zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: T.fontSerif, fontSize: 15, fontWeight: 500, letterSpacing: "0.5px" }}>
          {lang === "zh" ? "🖨 打印预览" : "🖨 印刷プレビュー"}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Btn size="sm" onClick={() => setShowLogoUpload(true)}>{lang === "zh" ? "⚙ LOGO设置" : "⚙ ロゴ設定"}</Btn>
          <Btn size="sm" variant="primary" onClick={doPrint}>{lang === "zh" ? "🖨 打印 (Ctrl+P)" : "🖨 印刷 (Ctrl+P)"}</Btn>
          <Btn size="sm" onClick={onClose}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* LOGO设置弹窗 */}
      {showLogoUpload && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(45,27,14,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, padding: 20 }} onClick={() => setShowLogoUpload(false)}>
          <div style={{ background: T.bgCard, borderRadius: T.radiusLg, padding: "1.5rem 1.75rem", maxWidth: 500, width: "100%", border: `0.5px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: T.fontSerif, fontSize: 18, fontWeight: 500, marginBottom: "1rem", color: T.brand }}>
              {lang === "zh" ? "⚙ LOGO 与品牌设置" : "⚙ ロゴ・ブランド設定"}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 5, letterSpacing: "0.3px" }}>
                {lang === "zh" ? "品牌名" : "ブランド名"}
              </div>
              <input value={brandNameInput} onChange={e => setBrandNameInput(e.target.value)} placeholder="kororā" style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, boxSizing: "border-box", fontFamily: T.fontSans }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 5, letterSpacing: "0.3px" }}>
                {lang === "zh" ? "副标题（可选）" : "サブタイトル（任意）"}
              </div>
              <input value={subtitleInput} onChange={e => setSubtitleInput(e.target.value)} placeholder="PATISSERIE" style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, boxSizing: "border-box", fontFamily: T.fontSans }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 5, letterSpacing: "0.3px" }}>
                {lang === "zh" ? "LOGO 图片 URL（留空用默认）" : "ロゴ画像 URL（空で既定）"}
              </div>
              <input value={logoUrlInput} onChange={e => setLogoUrlInput(e.target.value)} placeholder="https://i.imgur.com/xxx.png" style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, boxSizing: "border-box", fontFamily: T.fontSans }} />
              <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 4, fontStyle: "italic" }}>
                {lang === "zh" ? "建议正方形透明 PNG，尺寸 200×200 效果最佳" : "正方形の透明 PNG・200×200 推奨"}
              </div>
            </div>

            {(logoUrlInput || printSettings.logoUrl) && (
              <div style={{ marginBottom: 16, textAlign: "center", padding: 12, border: `0.5px dashed ${T.border}`, borderRadius: T.radius, background: T.bgMuted }}>
                <img src={logoUrlInput || printSettings.logoUrl} alt="LOGO" style={{ maxHeight: 80, maxWidth: 200 }} onError={(e) => e.target.style.display = "none"} />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <Btn size="sm" variant="danger" onClick={resetLogo}>
                {lang === "zh" ? "恢复默认" : "既定に戻す"}
              </Btn>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={() => setShowLogoUpload(false)}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
                <Btn variant="primary" onClick={saveLogo}>{lang === "zh" ? "保存" : "保存"}</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 打印区域（实际打印内容） */}
      <div className="print-area" style={{ padding: "20mm 15mm", maxWidth: "210mm", margin: "0 auto", background: "white", minHeight: "297mm", position: "relative" }}>
        {/* 水印 */}
        <div className="watermark">{brandName}</div>

        {template === "kitchen" && <KitchenTemplate item={item} itemType={itemType} lang={lang} sections={sections} logoSrc={logoSrc} brandName={brandName} brandSubtitle={brandSubtitle} />}
        {template === "showcase" && <ShowcaseTemplate item={item} itemType={itemType} lang={lang} sections={sections} logoSrc={logoSrc} brandName={brandName} brandSubtitle={brandSubtitle} />}
        {template === "archive" && <ArchiveTemplate item={item} itemType={itemType} lang={lang} sections={sections} logoSrc={logoSrc} brandName={brandName} brandSubtitle={brandSubtitle} />}
      </div>
    </>
  );
}

// ─── 模板1：厨房操作台版（简洁1页，大字号） ─────────────
function KitchenTemplate({ item, itemType, lang, sections, logoSrc, brandName, brandSubtitle }) {
  const getName = (it) => {
    if (lang === "zh") return it.nameZh || it.nameJa;
    if (lang === "ja") return it.nameJa || it.nameZh;
    return `${it.nameZh || ""} / ${it.nameJa || ""}`;
  };
  const getText = (zh, ja) => {
    if (lang === "zh") return zh || ja || "";
    if (lang === "ja") return ja || zh || "";
    return `${zh || ""}${zh && ja ? " / " : ""}${ja || ""}`;
  };

  const name = getName(item);
  const steps = lang === "ja" ? (item.stepsJa || item.steps || []) : (item.stepsZh || item.steps || []);
  const notesText = getText(item.notesZh, item.notesJa);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* 抬头：店名 + 配方名 / 右侧关键参数 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2px solid #000", paddingBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11pt", letterSpacing: "0.26em", fontWeight: 400 }}>{brandName}</div>
          <div style={{ fontSize: "24pt", fontWeight: 700, marginTop: "8px", lineHeight: 1.1 }}>{name}</div>
          {item.nameFr && <div style={{ fontSize: "13pt", marginTop: "4px" }}>{item.nameFr}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: "12pt", lineHeight: 1.7, marginLeft: "8mm", flexShrink: 0 }}>
          {item.yield && <div style={{ fontSize: "20pt", fontWeight: 700 }}>{item.yield} {item.unit || "個"}</div>}
          {item.mold && <div>{item.mold}</div>}
          {(item.temp || item.baketime) && <div style={{ fontWeight: 700 }}>{[item.temp, item.baketime].filter(Boolean).join(" / ")}</div>}
        </div>
      </div>

      {/* 原料表：盆用粗体编号(不用颜色) · 用量 17pt 粗 · 每行右侧一个勾选格 */}
      {sections.ingredients && item.ingredients && item.ingredients.length > 0 && (
        <table style={{ marginTop: "20px" }}>
          <thead>
            <tr>
              <th className="p-th" style={{ width: "42px" }}>{lang === "ja" ? "ボウル" : "盆"}</th>
              <th className="p-th">{lang === "ja" ? "材料" : "原料"}</th>
              <th className="p-th" style={{ textAlign: "right", width: "110px" }}>{lang === "ja" ? "分量" : "用量"}</th>
              <th className="p-th" style={{ paddingLeft: "16px", width: "60px" }}>✓</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // 按盆分组后依次输出；每组只有第一行显示 ①②③ 编号
              const marks = { bowl1: "①", bowl2: "②", bowl3: "③", bowl4: "④", bowl5: "⑤" };
              let lastGroup = null;
              return item.ingredients.map((ing, i) => {
                const gk = ing.group && ing.group !== "none" ? ing.group : null;
                const first = gk && gk !== lastGroup;
                lastGroup = gk;
                const zh = ing.nameZh || ing.nameJa || "";
                const ja = ing.nameJa || "";
                return (
                  <tr key={i}>
                    <td className="p-td p-bowl">{first ? marks[gk] : ""}</td>
                    <td className="p-td">
                      <div className="p-name">{lang === "ja" ? (ja || zh) : zh}</div>
                      {lang !== "ja" && ja && ja !== zh && <div className="p-sub">{ja}</div>}
                      {ing.note && <div className="p-note">{ing.note}</div>}
                    </td>
                    <td className="p-td p-qty">{ing.qty} {ing.unit || "g"}</td>
                    <td className="p-td" style={{ paddingLeft: "16px" }}><span className="p-check" /></td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      )}

      {/* 步骤：两栏排，13 步刚好一页装下 */}
      {sections.steps && steps.length > 0 && (
        <div style={{ marginTop: "24px", borderTop: "2px solid #000", paddingTop: "12px" }}>
          <div style={{ fontSize: "11pt", letterSpacing: "0.14em" }}>
            {lang === "ja" ? "作り方" : lang === "zh" ? "制作流程" : "制作流程 · 作り方"}
          </div>
          <div className="p-steps" style={{ marginTop: "8px" }}>
            {steps.map((s, i) => (
              <div key={i} className="p-step">
                <div className="p-step-n">{String(i + 1).padStart(2, "0")}</div>
                <div className="p-step-t">{s}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 注意事项 */}
      {sections.notes && notesText && (
        <div style={{ marginTop: "16px", border: "1px solid #000", padding: "10px 14px", fontSize: "10pt", lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>{lang === "ja" ? "注意" : "注意事项"}</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{notesText}</div>
        </div>
      )}

      {/* 底部 */}
      <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "9pt", color: "#444" }}>
        <div>{brandName} · {brandSubtitle} · {new Date().toLocaleDateString("zh-CN")}</div>
        <div>{lang === "ja" ? "ボウル ① → ⑤ の順に投入" : "盆序 ① → ⑤ 依次投料"}</div>
      </div>
    </div>
  );
}

// ─── 模板2：客户展示版（精美） ─────────────
function ShowcaseTemplate({ item, itemType, lang, sections, logoSrc, brandName, brandSubtitle }) {
  const getName = (it) => {
    if (lang === "zh") return it.nameZh || it.nameJa;
    if (lang === "ja") return it.nameJa || it.nameZh;
    return `${it.nameZh || ""} / ${it.nameJa || ""}`;
  };
  const getText = (zh, ja) => {
    if (lang === "zh") return zh || ja || "";
    if (lang === "ja") return ja || zh || "";
    return `${zh || ""}${zh && ja ? "\n" : ""}${ja || ""}`;
  };

  const name = getName(item);
  const steps = lang === "ja" ? (item.stepsJa || item.steps || []) : (item.stepsZh || item.steps || []);
  const notesText = getText(item.notesZh, item.notesJa);

  return (
    <div style={{ position: "relative", zIndex: 1, fontFamily: 'Georgia, "Hiragino Mincho ProN", "游明朝", "PingFang SC", serif', color: "#2D1B0E" }}>
      {/* 顶部封面区 */}
      <div style={{ textAlign: "center", paddingBottom: "12mm", borderBottom: "0.5px solid #AC6B3A", marginBottom: "10mm" }}>
        <img src={logoSrc} style={{ width: "30mm", height: "30mm", margin: "0 auto 5mm" }} alt="LOGO" />
        <div style={{ fontFamily: "Georgia, serif", fontSize: "14pt", letterSpacing: "8pt", marginBottom: "2mm", color: "#2D1B0E", fontWeight: 500 }}>{brandName}</div>
        <div style={{ fontSize: "9pt", letterSpacing: "4pt", color: "#7A5F4A", fontStyle: "italic" }}>— {brandSubtitle} —</div>
      </div>

      {/* 标题区 */}
      <div style={{ textAlign: "center", marginBottom: "10mm" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: "30pt", fontWeight: 400, marginBottom: "3mm", letterSpacing: "2pt", color: "#2D1B0E", lineHeight: 1.15 }}>{name}</div>
        {item.nameFr && <div style={{ fontFamily: "Georgia, serif", fontSize: "13pt", fontStyle: "italic", color: "#7A5F4A", letterSpacing: "1pt" }}>{item.nameFr}</div>}
        {/* 分隔线 */}
        <div style={{ margin: "6mm auto", width: "40mm", height: "0.5px", background: "#AC6B3A" }}></div>
        {/* 简介 */}
        {notesText && sections.notes && (
          <div style={{ fontSize: "11pt", fontStyle: "italic", color: "#444", lineHeight: 1.85, maxWidth: "140mm", margin: "0 auto", whiteSpace: "pre-wrap" }}>
            {notesText}
          </div>
        )}
      </div>

      {/* 工艺介绍 */}
      {sections.ingredients && item.ingredients && item.ingredients.length > 0 && (
        <div style={{ marginBottom: "8mm" }}>
          <div style={{ textAlign: "center", fontSize: "10pt", letterSpacing: "4pt", color: "#7A5F4A", marginBottom: "5mm", fontStyle: "italic" }}>— INGREDIENTS · 使用素材 —</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "3mm 8mm", fontSize: "10.5pt", lineHeight: 1.8 }}>
            {item.ingredients.map((ing, i) => {
              const ingName = getName(ing);
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "0.5px dotted #AAA", paddingBottom: "1mm" }}>
                  <span>{ingName}{ing.brand && <span style={{ fontSize: "9pt", color: "#888", marginLeft: "2mm" }}>({ing.brand})</span>}</span>
                  <span style={{ fontStyle: "italic", color: "#555" }}>{ing.qty}{ing.unit || "g"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 制法 */}
      {sections.steps && steps.length > 0 && (
        <div style={{ marginBottom: "8mm" }}>
          <div style={{ textAlign: "center", fontSize: "10pt", letterSpacing: 4, color: "#666", marginBottom: "5mm" }}>— PROCÉDÉ · 制作工艺 —</div>
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {steps.map((s, i) => (
              <li key={i} style={{ display: "flex", gap: "4mm", marginBottom: "3mm", fontSize: "10.5pt", lineHeight: 1.8 }}>
                <span style={{ fontStyle: "italic", color: "#999", minWidth: "8mm", textAlign: "right", fontSize: "11pt" }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 底部 */}
      <div style={{ marginTop: "15mm", paddingTop: "5mm", borderTop: "0.5px solid #1a1a1a", textAlign: "center", fontSize: "8pt", letterSpacing: 3, color: "#666" }}>
        <div>{brandName} PATISSERIE · HANDCRAFTED WITH CARE</div>
        <div style={{ marginTop: "1mm" }}>{new Date().toLocaleDateString("ja-JP")}</div>
      </div>
    </div>
  );
}

// ─── 模板3：归档笔记版（详细多页，类食谱书） ─────────────
function ArchiveTemplate({ item, itemType, lang, sections, logoSrc, brandName, brandSubtitle }) {
  const getName = (it) => {
    if (lang === "zh") return it.nameZh || it.nameJa;
    if (lang === "ja") return it.nameJa || it.nameZh;
    return `${it.nameZh || ""} / ${it.nameJa || ""}`;
  };
  const getText = (zh, ja) => {
    if (lang === "zh") return zh || ja || "";
    if (lang === "ja") return ja || zh || "";
    return `${zh || ""}${zh && ja ? "\n—\n" : ""}${ja || ""}`;
  };

  const name = getName(item);
  const stepsZh = item.stepsZh || item.steps || [];
  const stepsJa = item.stepsJa || item.steps || [];
  const notesText = getText(item.notesZh, item.notesJa);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* 顶部条 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "0.8px solid #2D1B0E", paddingBottom: "4mm", marginBottom: "6mm" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "3mm" }}>
          <img src={logoSrc} style={{ width: "12mm", height: "12mm" }} alt="LOGO" />
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "11pt", letterSpacing: "3pt", fontWeight: 500, color: "#2D1B0E" }}>{brandName}</div>
            <div style={{ fontSize: "7pt", letterSpacing: "2pt", color: "#7A5F4A", fontStyle: "italic" }}>{brandSubtitle}</div>
          </div>
        </div>
        <div style={{ fontSize: "9pt", color: "#7A5F4A", letterSpacing: "1pt", textTransform: "uppercase" }}>
          {itemType === "component" ? (lang === "ja" ? "コンポーネント" : "组件") : (lang === "ja" ? "レシピ" : "配方")}
        </div>
      </div>

      {/* 标题 */}
      <div style={{ marginBottom: "8mm" }}>
        <div style={{ fontFamily: 'Georgia, "Hiragino Mincho ProN", serif', fontSize: "24pt", fontWeight: 500, marginBottom: "2mm", color: "#2D1B0E", lineHeight: 1.15 }}>{name}</div>
        {item.nameFr && <div style={{ fontFamily: "Georgia, serif", fontSize: "12pt", fontStyle: "italic", color: "#7A5F4A" }}>{item.nameFr}</div>}

        {/* 元信息 */}
        <div style={{ marginTop: "4mm", display: "flex", gap: "6mm", flexWrap: "wrap", fontSize: "9pt", color: "#555" }}>
          {item.yield && <div><span style={{ color: "#999", letterSpacing: "0.5pt" }}>产量:</span> <strong style={{ fontFamily: "Georgia, serif", color: "#2D1B0E" }}>{item.yield}{item.unit || "個"}</strong></div>}
          {item.temp && <div><span style={{ color: "#888" }}>温度:</span> <strong>{item.temp}</strong></div>}
          {item.baketime && <div><span style={{ color: "#888" }}>时间:</span> <strong>{item.baketime}</strong></div>}
          {item.mold && <div><span style={{ color: "#888" }}>模具:</span> <strong>{item.mold}</strong></div>}
          {item.difficulty && <div><span style={{ color: "#888" }}>难度:</span> <strong>{item.difficulty}</strong></div>}
          {item.storage && <div><span style={{ color: "#888" }}>保存:</span> <strong>{item.storage}</strong></div>}
        </div>
      </div>

      {/* 原料 - 详细 */}
      {sections.ingredients && item.ingredients && item.ingredients.length > 0 && (
        <div style={{ marginBottom: "6mm" }}>
          <div style={{ fontSize: "12pt", fontWeight: 500, marginBottom: "3mm", paddingBottom: "1mm", borderBottom: "0.5px solid #666" }}>
            ─ {lang === "ja" ? "材料" : lang === "zh" ? "原料" : "原料 / 材料"} ─
          </div>
          <table style={{ fontSize: "10pt" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #999" }}>
                <th style={{ textAlign: "left", padding: "1.5mm", fontWeight: 400, fontSize: "8pt", color: "#666" }}>名称</th>
                <th style={{ textAlign: "right", padding: "1.5mm", fontWeight: 400, fontSize: "8pt", color: "#666", width: "15mm" }}>用量</th>
                <th style={{ textAlign: "left", padding: "1.5mm", fontWeight: 400, fontSize: "8pt", color: "#666", width: "8mm" }}>単位</th>
                <th style={{ textAlign: "left", padding: "1.5mm", fontWeight: 400, fontSize: "8pt", color: "#666", width: "35mm" }}>ブランド</th>
                <th style={{ textAlign: "left", padding: "1.5mm", fontWeight: 400, fontSize: "8pt", color: "#666" }}>备注</th>
              </tr>
            </thead>
            <tbody>
              {item.ingredients.map((ing, i) => {
                const ingName = getName(ing);
                const showGroup = ing.group && ing.group !== "none";
                const groupInfo = showGroup ? GROUPS[ing.group] : null;
                return (
                  <tr key={i} style={{ borderBottom: "0.25px solid #DDD" }}>
                    <td style={{ padding: "1.5mm" }}>
                      {groupInfo && <span style={{ display: "inline-block", marginRight: 3, fontSize: "8pt", color: groupInfo.labelColor, fontWeight: 700 }}>{groupInfo.label}</span>}
                      {ingName}
                    </td>
                    <td style={{ padding: "1.5mm", textAlign: "right", fontWeight: 500 }}>{ing.qty}</td>
                    <td style={{ padding: "1.5mm", color: "#666" }}>{ing.unit || "g"}</td>
                    <td style={{ padding: "1.5mm", color: "#666", fontSize: "9pt" }}>{ing.brand || ""}</td>
                    <td style={{ padding: "1.5mm", color: "#777", fontSize: "9pt" }}>{ing.note || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 制法 - 双语并列显示 */}
      {sections.steps && (stepsZh.length > 0 || stepsJa.length > 0) && (
        <div style={{ marginBottom: "6mm" }}>
          <div style={{ fontSize: "12pt", fontWeight: 500, marginBottom: "3mm", paddingBottom: "1mm", borderBottom: "0.5px solid #666" }}>
            ─ {lang === "ja" ? "作り方" : lang === "zh" ? "制法" : "制法 / 作り方"} ─
          </div>
          {lang === "both" && stepsZh.length > 0 && stepsJa.length > 0 ? (
            <table style={{ fontSize: "9.5pt" }}>
              <thead>
                <tr><th style={{ textAlign: "left", padding: "1mm", fontWeight: 400, fontSize: "8pt", color: "#666", width: "50%" }}>中文</th><th style={{ textAlign: "left", padding: "1mm", fontWeight: 400, fontSize: "8pt", color: "#666" }}>日本語</th></tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.max(stepsZh.length, stepsJa.length) }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "0.25px solid #DDD" }}>
                    <td style={{ padding: "2mm 1mm", verticalAlign: "top", lineHeight: 1.6 }}><strong style={{ color: "#999" }}>{i + 1}. </strong>{stepsZh[i] || ""}</td>
                    <td style={{ padding: "2mm 1mm", verticalAlign: "top", lineHeight: 1.6 }}><strong style={{ color: "#999" }}>{i + 1}. </strong>{stepsJa[i] || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <ol style={{ paddingLeft: "6mm", margin: 0, fontSize: "10pt", lineHeight: 1.8 }}>
              {(lang === "ja" ? stepsJa : stepsZh).map((s, i) => (
                <li key={i} style={{ marginBottom: "2mm" }}>{s}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* 备注 */}
      {sections.notes && notesText && (
        <div style={{ marginBottom: "6mm", background: "#FAF8F3", padding: "5mm 7mm", border: "0.5px solid #D4B896", fontSize: "10pt", lineHeight: 1.8 }}>
          <div style={{ fontSize: "10pt", fontWeight: 500, marginBottom: "2mm" }}>─ {lang === "ja" ? "メモ" : "备注"} ─</div>
          <div style={{ whiteSpace: "pre-wrap", fontFamily: '"Hiragino Mincho ProN", serif' }}>{notesText}</div>
        </div>
      )}

      {/* 底部 */}
      <div style={{ marginTop: "10mm", paddingTop: "3mm", borderTop: "0.5px solid #999", display: "flex", justifyContent: "space-between", fontSize: "8pt", color: "#666" }}>
        <div>{brandName} PATISSERIE · {brandSubtitle} · 归档笔记</div>
        <div>{new Date().toLocaleDateString("zh-CN")}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// （打印模块结束）
// ═══════════════════════════════════════════════════════════════

// ─── 快速知识点录入浮层 ─────────────────────────────────────────
function QuickKnowledgeModal({ relatedName, onClose, onSave, lang = "zh" }) {
  const [titleZh, setTitleZh] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [contentZh, setContentZh] = useState("");
  const [contentJa, setContentJa] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [error, setError] = useState("");

  const toggleTag = (tid) => {
    setSelectedTags(prev => prev.includes(tid) ? prev.filter(t => t !== tid) : [...prev, tid]);
  };

  const handleSave = () => {
    if (!titleZh.trim()) {
      setError("请输入标题（中文）");
      return;
    }
    if (!contentZh.trim()) {
      setError("请输入内容（中文）");
      return;
    }
    const newK = {
      id: "k_" + Date.now(),
      titleZh: titleZh.trim(),
      titleJa: titleJa.trim(),
      contentZh: contentZh.trim(),
      contentJa: contentJa.trim(),
      tags: selectedTags,
      relatedRecipes: relatedName ? [relatedName] : [],
    };
    onSave(newK);
  };

  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "1.5rem", maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>📚 快速新建知识点</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#999" }}>×</button>
        </div>

        {relatedName && (
          <div style={{ background: "#F3E8FF", padding: "8px 12px", borderRadius: 8, fontSize: 12, color: "#6D28D9", marginBottom: "1rem" }}>
            ✨ 保存后自动关联到「{relatedName}」
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>标题（中文）</label>
          <input value={titleZh} onChange={e => setTitleZh(e.target.value)} placeholder="例：焦糖中黄油的4大作用" style={inpStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>标题（日文）</label>
          <input value={titleJa} onChange={e => setTitleJa(e.target.value)} placeholder="例：キャラメルにおけるバターの4つの役割" style={inpStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>标签</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            {KNOWLEDGE_TAGS.map(tag => {
              const active = selectedTags.includes(tag.id);
              return (
                <button key={tag.id} onClick={() => toggleTag(tag.id)} style={{ padding: "4px 10px", fontSize: 11, border: `1.5px solid ${active ? tag.color : "#CCCCCC"}`, borderRadius: 20, background: active ? tag.bg : "#FFFFFF", color: active ? tag.color : "#111111", cursor: "pointer" }}>
                  {active ? "✓ " : ""}{tag.zh}
                </button>
              );
            })}
            {selectedTags.filter(t => !KNOWLEDGE_TAGS.find(kt => kt.id === t)).map(ct => (
              <button key={ct} onClick={() => toggleTag(ct)} style={{ padding: "4px 10px", fontSize: 11, border: "1.5px solid #8B5CF6", borderRadius: 20, background: "#F3E8FF", color: "#6D28D9", cursor: "pointer" }}>✓ {ct}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={customTag} onChange={e => setCustomTag(e.target.value)} onKeyDown={e => {
              if (e.key === "Enter" && customTag.trim()) {
                setSelectedTags(prev => prev.includes(customTag.trim()) ? prev : [...prev, customTag.trim()]);
                setCustomTag("");
              }
            }} placeholder="或输入自定义标签，回车添加" style={{ ...inpStyle, fontSize: 12 }} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>内容（中文）</label>
          <textarea value={contentZh} onChange={e => setContentZh(e.target.value)} placeholder="【核心内容】&#10;..." style={{...inpStyle, minHeight: 120, resize: "vertical"}} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>内容（日文）</label>
          <textarea value={contentJa} onChange={e => setContentJa(e.target.value)} placeholder="【】で節分け" style={{...inpStyle, minHeight: 120, resize: "vertical"}} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
          {error && <span style={{ color: "#A32D2D", fontSize: 12, marginRight: 8 }}>⚠ {error}</span>}
          <Btn onClick={onClose}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
          <Btn variant="primary" onClick={handleSave}>保存并关联</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── 组合蛋糕 View ───────────────────────────────────────────────
function CreationsView({ creations, setCreations, components, cats, onUpdateCats, brands = [], materials = [], lang, setLang, viewId, setViewId, editTarget, setEditTarget, showToast, saved, onUpdateComponent, confirmDialog, knowledge, onNavigateToKnowledge }) {
  if (editTarget !== null) {
    return (
      <CreationEditForm
        creation={editTarget === "new" ? null : editTarget}
        components={components}
        cats={cats}
        onUpdateCats={onUpdateCats}
        brands={brands}
        materials={materials}
        confirmDialog={confirmDialog}
        onSave={(c) => {
          setCreations(prev => {
            const found = prev.find(x => x.id === c.id);
            return found ? prev.map(x => x.id === c.id ? c : x) : [...prev, c];
          });
          showToast("✓ 组合蛋糕已保存");
          setViewId(c.id);
          setEditTarget(null);
        }}
        onDelete={() => {
          confirmDialog("删除这个组合蛋糕吗？", () => {
            setCreations(prev => prev.filter(x => x.id !== editTarget.id));
            showToast("已删除");
            setEditTarget(null);
          });
        }}
        onBack={() => {
          // [B4 修复] 有 id 跳详情,无 id 回列表
          if (editTarget && editTarget.id) setViewId(editTarget.id);
          setEditTarget(null);
        }}
        onUpdateComponent={onUpdateComponent}
      />
    );
  }

  if (viewId) {
    const cr = creations.find(c => c.id === viewId);
    if (cr) {
      return (
        <CreationDetail
          creation={cr}
          lang={lang}
          knowledge={knowledge}
          onNavigateToKnowledge={onNavigateToKnowledge}
          onEdit={() => { setEditTarget(cr); setViewId(null); }}
          onBack={() => setViewId(null)}
        />
      );
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{lang === "zh" ? `组合蛋糕（${creations.length}）` : `組立ケーキ（${creations.length}）`}</div>
          {saved && <span style={{ fontSize: 12, color: "#0F6E56" }}>{lang === "zh" ? "✓ 已保存" : "✓ 保存済み"}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn variant="primary" onClick={() => setEditTarget("new")}>{lang === "zh" ? "+ 新建蛋糕" : "+ ケーキ新規"}</Btn>
        </div>
      </div>

      {creations.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: T.textSecondary, fontSize: 13, lineHeight: 1.8 }}>
          {lang === "zh" ? "还没有组合蛋糕。" : "まだケーキがありません。"}<br />
          <span style={{ fontSize: 12, color: T.textTertiary, fontStyle: "italic" }}>
            {lang === "zh" ? (
              <>从「组件仓库」挑选组件像搭积木一样创建新蛋糕，<br />记录试吃反馈与改进方向。</>
            ) : (
              <>コンポーネントを積み上げて新しいケーキを作成し、<br />試食フィードバックと改善方向を記録します。</>
            )}
          </span>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {creations.map(c => {
          const name = pickLang(c, "name", lang);
          const nameSub = rawLang(c, "name", lang);
          const layers = c.layers || [];
          const totalCost = layers.reduce((s, l) => s + (l.totalCost || 0), 0);
          const servesNum = parseFloat(c.serves) || 1;
          const portionsNum = parseFloat(c.portions) || 1;
          const priceNum = toCNY(c.price, priceCurOf(c));
          const costPerPortion = totalCost / servesNum / portionsNum;
          const marginPct = priceNum > 0 && costPerPortion > 0 ? ((priceNum - costPerPortion) / priceNum * 100) : 0;

          // 状态映射
          const statusMap = {
            "試作":     { emoji: "🧪", label: lang === "zh" ? "试作" : "試作", color: "#A05A1E", bg: "#FBF0E0" },
            "定番":     { emoji: "⭐", label: lang === "zh" ? "定番" : "定番", color: "#2D6A4F", bg: "#E8F4EA" },
            "季节限定": { emoji: "🌸", label: lang === "zh" ? "季限" : "季限", color: "#6B4568", bg: "#EDE4F0" },
            "下架":     { emoji: "⏸",  label: lang === "zh" ? "下架" : "休止", color: "#7A5F4A", bg: T.bgMuted },
          };
          const statusInfo = statusMap[c.status] || statusMap["試作"];
          const avatarLetter = (c.nameFr || name || "?").charAt(0).toUpperCase();

          return (
            <div
              key={c.id}
              onClick={() => setViewId(c.id)}
              style={{
                background: T.bgCard,
                border: `0.5px solid ${T.border}`,
                borderRadius: T.radiusLg,
                padding: "16px 20px",
                cursor: "pointer",
                borderLeft: `3px solid ${statusInfo.color}`,
                transition: "border-color 0.15s, transform 0.12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {/* 第一行：徽章 + 标题 + 状态 + 价格 */}
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {/* 首字母徽章 */}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: statusInfo.bg, color: statusInfo.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: T.fontSerif, fontSize: 18, fontStyle: "italic", fontWeight: 500,
                  flexShrink: 0,
                }}>{avatarLetter}</div>

                {/* 标题 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    {c.nameFr && (
                      <span style={{ fontFamily: T.fontSerif, fontSize: 17, color: T.textPrimary, fontWeight: 500 }}>
                        {c.nameFr}
                      </span>
                    )}
                    <span style={{ fontSize: 14, color: c.nameFr ? T.textSecondary : T.textPrimary, fontWeight: c.nameFr ? 400 : 500 }}>
                      {c.nameFr ? "· " : ""}{name}
                    </span>
                    {nameSub && nameSub !== name && (
                      <span style={{ fontSize: 12, color: T.textTertiary }}>· {nameSub}</span>
                    )}
                  </div>
                  {/* 规格信息 */}
                  <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {[
                      layers.length > 0 ? `${layers.length} ${lang === "zh" ? "层" : "層"}` : null,
                      c.size || c.mold,
                      c.portions ? `${c.portions} ${lang === "zh" ? "份" : "人前"}` : null,
                      c.shelfLife,
                    ].filter(Boolean).map((t, i, arr) => (
                      <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{t}</span>
                        {i < arr.length - 1 && <span style={{ color: T.textMuted }}>·</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 右侧：状态 + 价格 */}
                <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                  <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: "3px 11px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>
                    {statusInfo.emoji} {statusInfo.label}
                  </span>
                  {priceNum > 0 && (
                    <div style={{ fontFamily: T.fontSerif, fontSize: 14, fontWeight: 500, color: T.textPrimary }}>
                      {fmtSellPrice(c.price, c)}
                    </div>
                  )}
                  {c.rating > 0 && (
                    <div style={{ color: T.accent, fontSize: 11, letterSpacing: "1px" }}>
                      {"★".repeat(c.rating)}<span style={{ opacity: 0.3 }}>{"★".repeat(5 - c.rating)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 第二行：层标签 */}
              {layers.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 12, paddingTop: 10, borderTop: `0.5px dashed ${T.borderSoft}` }}>
                  {layers.slice(0, 8).map((l, i) => {
                    const cat = getCompCat(l.componentCategory);
                    return (
                      <span key={i} style={{ background: cat.bg, color: cat.color, padding: "2px 10px", borderRadius: T.radiusPill, fontSize: 10, fontWeight: 500 }}>
                        {lang === "zh" ? cat.zh : cat.ja}
                      </span>
                    );
                  })}
                  {layers.length > 8 && (
                    <span style={{ fontSize: 10, color: T.textTertiary, padding: "2px 6px" }}>+{layers.length - 8}</span>
                  )}
                  {totalCost > 0 && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: T.textTertiary }}>
                      {lang === "zh" ? "原料" : "原価"} ¥{totalCost.toFixed(0)}
                      {marginPct > 0 && <span style={{ marginLeft: 8, color: marginPct >= 65 ? T.success : marginPct >= 50 ? T.warning : T.danger }}>· {marginPct.toFixed(0)}%</span>}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 组合蛋糕详情 ────────────────────────────────────────────────
// ─── 配方模式下的步骤展开子组件（二次点击） ─────────────
function LayerRecipeSteps({ steps, cat, lang }) {
  const [showSteps, setShowSteps] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => setShowSteps(!showSteps)} style={{ background: "#FFFFFF", border: `0.5px solid ${cat.color}`, color: cat.color, padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
        {showSteps ? "▼" : "▶"} {lang === "zh" ? "制作流程" : "作り方"}（{steps.length}步）
      </button>
      {showSteps && (
        <div style={{ background: "#FFFFFF", borderRadius: 6, padding: "8px 12px", marginTop: 6 }}>
          <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {steps.map((s, idx) => (
              <li key={idx} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "4px 0", fontSize: 12, lineHeight: 1.6 }}>
                <span style={{ minWidth: 18, height: 18, borderRadius: "50%", background: cat.bg, color: cat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 500, flexShrink: 0, marginTop: 2 }}>{idx + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function CreationDetail({ creation: c, lang, onEdit, onBack, knowledge = [], onNavigateToKnowledge }) {
  const [expandedLayer, setExpandedLayer] = useState(null);
  const [viewMode, setViewMode] = useState("detail"); // "detail" | "recipe" | "menu"
  const name = pickLang(c, "name", lang);
  const description = c.description || "";
  const layers = c.layers || [];

  // 🧮 新的成本计算逻辑
  const calcLayerActualCost = (l) => {
    const componentYield = parseFloat(l.yield) || 0;
    const usedAmount = parseFloat(l.usedAmount) || 0;
    const componentCost = parseFloat(l.totalCost) || 0;
    if (componentYield === 0) return componentCost;
    return componentCost * (usedAmount / componentYield);
  };

  const totalCostAll = layers.reduce((s, l) => s + calcLayerActualCost(l), 0);
  const servesNum = parseFloat(c.serves) || 1;
  const costPerCake = totalCostAll / servesNum;
  const portionsNum = parseFloat(c.portions) || 1;
  const costPerPortion = costPerCake / portionsNum;
  const priceNum = toCNY(c.price, priceCurOf(c));
  const marginPercent = priceNum > 0 ? ((priceNum - costPerPortion) / priceNum * 100) : 0;

  // 关联知识点（通过蛋糕名字匹配）
  const relatedKnowledge = (knowledge || []).filter(k =>
    (k.relatedRecipes || []).some(r => r === c.nameZh || r === c.nameJa)
  );

  // 状态对应emoji
  const statusInfo = {
    "試作": { emoji: "🧪", color: "#F59E0B", bg: "#FEF3C7", label: "試作中" },
    "定番": { emoji: "⭐", color: "#059669", bg: "#D1FAE5", label: "定番商品" },
    "季節限定": { emoji: "🌸", color: "#EC4899", bg: "#FCE7F3", label: "季节限定" },
    "下架": { emoji: "⏸", color: "#6B7280", bg: "#F3F4F6", label: "已下架" },
    "検討中": { emoji: "💭", color: "#8B5CF6", bg: "#EDE9FE", label: "検討中" },
  };
  const currentStatus = statusInfo[c.status] || statusInfo["試作"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase" }}>
          {lang === "zh" ? "组合蛋糕详情" : "ケーキ詳細"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn size="sm" onClick={onEdit}>{lang === "zh" ? "编辑" : "編集"}</Btn>
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* 📖 模式切换 - RURU 风格 */}
      <div style={{ display: "flex", gap: 3, marginBottom: "1rem", background: T.bgMuted, padding: 4, borderRadius: T.radius, alignItems: "center", flexWrap: "wrap", border: `0.5px solid ${T.borderSoft}` }}>
        <div style={{ fontSize: 11, color: T.textTertiary, marginLeft: 8, marginRight: 4, letterSpacing: "0.5px" }}>
          {lang === "zh" ? "视图" : "表示"}
        </div>
        {[
          { id: "detail", label: lang === "zh" ? "📖 详细" : "📖 詳細",    desc: lang === "zh" ? "全部信息" : "全情報" },
          { id: "recipe", label: lang === "zh" ? "📘 配方" : "📘 レシピ",  desc: lang === "zh" ? "制作用" : "制作用" },
          { id: "menu",   label: lang === "zh" ? "📗 菜单" : "📗 メニュー", desc: lang === "zh" ? "对外展示" : "展示用" },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => { setViewMode(m.id); setExpandedLayer(null); }}
            title={m.desc}
            style={{
              padding: "6px 14px", fontSize: 12, border: "none",
              background: viewMode === m.id ? T.brand : "transparent",
              color: viewMode === m.id ? T.bgApp : T.textSecondary,
              borderRadius: T.radiusSm, cursor: "pointer",
              fontWeight: viewMode === m.id ? 500 : 400,
              fontFamily: T.fontSans,
              transition: "all 0.15s",
            }}
          >{m.label}</button>
        ))}
      </div>

      {/* 🎂 封面卡片 - RURU 风格 */}
      <div style={{
        background: T.bgCard,
        border: `0.5px solid ${T.border}`,
        borderRadius: T.radiusLg,
        padding: "1.75rem",
        marginBottom: "1rem",
        borderLeft: `3px solid ${currentStatus.color}`,
        display: "flex",
        gap: 18,
        alignItems: "flex-start",
      }}>
        {/* 首字母徽章 */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: currentStatus.bg, color: currentStatus.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: T.fontSerif, fontSize: 28, fontStyle: "italic", fontWeight: 500,
          flexShrink: 0,
        }}>
          {(c.nameFr || name || "?").charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {c.nameFr ? (
                <>
                  <div style={{ fontFamily: T.fontSerif, fontSize: 26, fontWeight: 500, color: T.textPrimary, lineHeight: 1.2, letterSpacing: "-0.3px" }}>
                    {c.nameFr}
                  </div>
                  <div style={{ fontSize: 14, color: T.textSecondary, marginTop: 4 }}>{name}</div>
                </>
              ) : (
                <div style={{ fontFamily: T.fontSerif, fontSize: 24, fontWeight: 500, color: T.textPrimary, lineHeight: 1.3 }}>
                  {name}
                </div>
              )}
              {c.chef && viewMode !== "menu" && (
                <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 8, letterSpacing: "0.5px" }}>
                  <span style={{ fontStyle: "italic" }}>{lang === "zh" ? "師承" : "師事"}</span> · {c.chef}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end", flexShrink: 0 }}>
              <span style={{ background: currentStatus.bg, color: currentStatus.color, padding: "4px 12px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>
                {currentStatus.emoji} {currentStatus.label}
              </span>
              {c.rating > 0 && (
                <span style={{ color: T.accent, fontSize: 12, letterSpacing: "1px" }}>
                  {"★".repeat(c.rating)}<span style={{ opacity: 0.3 }}>{"★".repeat(5 - c.rating)}</span>
                </span>
              )}
            </div>
          </div>

          {/* 概念描述 */}
          {description && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: T.bgMuted, borderRadius: T.radius, fontSize: 13, lineHeight: 1.7, color: T.textSecondary, fontStyle: "italic", borderLeft: `2px solid ${T.accentSoft}` }}>
              {description}
            </div>
          )}

          {/* 🎨 口味标签 */}
          {(c.flavorTags || []).length > 0 && (
            <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {c.flavorTags.map((tag, i) => (
                <span key={i} style={{ background: T.bgSoft, color: T.accent, padding: "2px 10px", borderRadius: T.radiusPill, fontSize: 11 }}>{tag}</span>
              ))}
            </div>
          )}

          {/* 规格信息行 */}
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: T.textTertiary, alignItems: "center" }}>
            {[
              c.size,
              c.serves ? `${c.serves}${lang === "zh" ? "台" : "台"}` : null,
              c.portions ? `${c.portions}${lang === "zh" ? "等分" : "等分"}` : null,
              c.prepTime,
              c.shelfLife,
              layers.length > 0 ? `${layers.length}${lang === "zh" ? "层" : "層"}` : null,
            ].filter(Boolean).map((t, i, arr) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{t}</span>
                {i < arr.length - 1 && <span style={{ color: T.textMuted }}>·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 💰 成本与毛利分析（仅详细模式） */}
      {viewMode === "detail" && (
        <div style={{ background: "#F0FDF4", border: "0.5px solid #86EFAC", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10, color: "#166534" }}>💰 成本与毛利分析</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 11, color: "#666" }}>总批次成本</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "#166534" }}>¥{totalCostAll.toFixed(0)}</div>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 11, color: "#666" }}>单个蛋糕成本</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "#166534" }}>¥{costPerCake.toFixed(0)}</div>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 11, color: "#666" }}>单份成本</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "#166534" }}>¥{costPerPortion.toFixed(0)}</div>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 11, color: "#666" }}>单份售价</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{priceNum > 0 ? `¥${priceNum.toFixed(0)}` : "—"}</div>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 11, color: "#666" }}>毛利率</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: marginPercent >= 65 ? "#059669" : marginPercent >= 50 ? "#CA8A04" : "#DC2626" }}>
                {priceNum > 0 ? `${marginPercent.toFixed(1)}%` : "—"}
              </div>
            </div>
          </div>
          {priceNum > 0 && costPerPortion > 0 && (
            <div style={{ fontSize: 11, color: "#166534", marginTop: 8, lineHeight: 1.6 }}>
              {marginPercent >= 65 ? "✅ 毛利率健康（≥65%）" : marginPercent >= 50 ? "⚠️ 毛利率偏低（50-65%）" : "🚨 毛利率过低（<50%）"}
            </div>
          )}
        </div>
      )}

      {/* 💴 菜单模式下的售价简洁展示 */}
      {viewMode === "menu" && priceNum > 0 && (
        <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E5E5", borderRadius: "12px", padding: "1rem", marginBottom: "1rem", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#999", letterSpacing: 2 }}>PRICE</div>
          <div style={{ fontSize: 22, fontWeight: 400, marginTop: 4, color: "#111", fontFamily: "Georgia, serif" }}>{fmtSellPrice(c.price, c)}</div>
          {c.portions && <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>/ 每份</div>}
        </div>
      )}

      {/* 🎂 层结构（带示意图） */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>🎂 层结构（自上而下）</div>
        {layers.length === 0 && <div style={{ fontSize: 13, color: "#999999" }}>（尚未添加层）</div>}

        {layers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 12 }}>
            {/* 左侧：示意图 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, position: "sticky", top: 10, alignSelf: "start" }}>
              {layers.map((l, i) => {
                const cat = getCompCat(l.componentCategory);
                const usedAmount = parseFloat(l.usedAmount) || 0;
                // 根据用量动态调整高度（最小20px，最大60px）
                const heightPct = usedAmount > 0 ? Math.min(60, Math.max(20, usedAmount / 30)) : 28;
                const isHovered = expandedLayer === i;
                return (
                  <div
                    key={i}
                    onClick={() => setExpandedLayer(expandedLayer === i ? null : i)}
                    title={l.customName || l.nameZh || l.nameJa}
                    style={{ background: cat.color, height: heightPct, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 11, fontWeight: 500, cursor: "pointer", opacity: isHovered ? 1 : 0.85, transition: "opacity 0.15s" }}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>

            {/* 右侧：层列表 */}
            <div>
              {layers.map((l, i) => {
                const cat = getCompCat(l.componentCategory);
                const n = pickLang(l, "name", lang);
                const isExpanded = expandedLayer === i;
                const displaySteps = pickSteps(l, lang);
                const displayNotes = pickLang(l, "notes", lang) || l.notes;
                const actualCost = calcLayerActualCost(l);
                const usedAmount = parseFloat(l.usedAmount) || 0;

                return (
                  <div key={i} style={{ borderLeft: `4px solid ${cat.color}`, background: cat.bg, padding: "10px 14px", marginBottom: 8, borderRadius: "0 6px 6px 0" }}>
                    <div onClick={() => setExpandedLayer(isExpanded ? null : i)} style={{ cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, opacity: 0.6 }}>{isExpanded ? "▼" : "▶"}</span>
                            <span style={{ fontSize: 12, background: "#FFFFFF", color: cat.color, padding: "1px 8px", borderRadius: 20, fontWeight: 500 }}>{i + 1}</span>
                            {l.customName && <span style={{ fontSize: 13, fontWeight: 500, color: cat.color }}>{l.customName}</span>}
                          </div>
                          <div style={{ fontSize: 13, color: cat.color, fontWeight: l.customName ? 400 : 500, marginTop: 2, marginLeft: 22, opacity: l.customName ? 0.8 : 1 }}>
                            {n}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: cat.color, background: "#FFFFFF", padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>{lang === "zh" ? cat.zh : cat.ja}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#666666", marginLeft: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {viewMode === "detail" && (
                          <>
                            {usedAmount > 0 ? (
                              <span>📏 本层用量 <strong>{usedAmount}g</strong></span>
                            ) : (
                              <span style={{ color: "#CA8A04" }}>⚠ 未填用量</span>
                            )}
                            <span>💰 本层成本 <strong>¥{actualCost.toFixed(0)}</strong></span>
                            <span>🧪 {(l.ingredients || []).length}种原料</span>
                          </>
                        )}
                        {viewMode === "recipe" && (
                          <>
                            {usedAmount > 0 && <span>📏 <strong>{usedAmount}g</strong></span>}
                            <span>🧪 {(l.ingredients || []).length}种原料</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 展开详情（菜单模式不显示详情区） */}
                    {viewMode !== "menu" && isExpanded && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${cat.color}33` }}>
                        {/* 原料 */}
                        {(l.ingredients || []).length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12, color: cat.color, fontWeight: 500, marginBottom: 6 }}>{lang === "zh" ? "原料" : "材料"}（原组件{l.yield ? ` ${l.yield}${l.unit || "g"}` : ""}）</div>
                            <div style={{ background: "#FFFFFF", borderRadius: 6, padding: "8px 12px" }}>
                              {l.ingredients.map((ing, idx) => {
                                const ingName = lang === "zh" ? (ing.nameZh || ing.nameJa) : (ing.nameJa || ing.nameZh);
                                return (
                                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12, borderBottom: idx < l.ingredients.length - 1 ? "0.5px solid #F5F5F5" : "none" }}>
                                    <span>{ingName}{ing.brand && <span style={{ color: "#999", marginLeft: 6, fontSize: 11 }}>({ing.brand})</span>}</span>
                                    <span style={{ color: "#666" }}>{ing.qty}{ing.unit || "g"}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 步骤（详细模式展开，配方模式要用户再点一次） */}
                        {displaySteps.length > 0 && viewMode === "detail" && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12, color: cat.color, fontWeight: 500, marginBottom: 6 }}>{lang === "zh" ? "制作流程" : "作り方"}</div>
                            <div style={{ background: "#FFFFFF", borderRadius: 6, padding: "8px 12px" }}>
                              <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                                {displaySteps.map((s, idx) => (
                                  <li key={idx} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "4px 0", fontSize: 12, lineHeight: 1.6 }}>
                                    <span style={{ minWidth: 18, height: 18, borderRadius: "50%", background: cat.bg, color: cat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 500, flexShrink: 0, marginTop: 2 }}>{idx + 1}</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        )}

                        {/* 步骤（配方模式 - 二次点击展开） */}
                        {displaySteps.length > 0 && viewMode === "recipe" && (
                          <LayerRecipeSteps steps={displaySteps} cat={cat} lang={lang} />
                        )}

                        {/* 备注 */}
                        {displayNotes && (
                          <div>
                            <div style={{ fontSize: 12, color: cat.color, fontWeight: 500, marginBottom: 6 }}>{lang === "zh" ? "备注" : "メモ"}</div>
                            <div style={{ background: "#FFFFFF", borderRadius: 6, padding: "8px 12px", fontSize: 12, lineHeight: 1.7, color: "#333333", whiteSpace: "pre-wrap" }}>{displayNotes}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 🎂 整体组装工艺 (creation.stepsZh / stepsJa) — 多层组装的全局工艺步骤 */}
      {viewMode !== "menu" && (() => {
        const overallSteps = pickSteps(c, lang);
        if (overallSteps.length === 0) return null;
        return (
          <div style={{ background: "#FFFFFF", border: `0.5px solid ${T.border}`, borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
            <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>
              🎂 {lang === "zh" ? `整体组装工艺(${overallSteps.length} 步)` : `組立工程(${overallSteps.length} ステップ)`}
            </div>
            <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {overallSteps.map((s, idx) => (
                <li key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", fontSize: 13, lineHeight: 1.7, borderBottom: idx < overallSteps.length - 1 ? "0.5px solid #F5F5F5" : "none" }}>
                  <span style={{ minWidth: 22, height: 22, borderRadius: "50%", background: T.bgMuted, color: T.brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0, marginTop: 2 }}>{idx + 1}</span>
                  <span style={{ whiteSpace: "pre-wrap" }}>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      })()}

      {/* 📝 整体备注 (creation.notesZh / notesJa) */}
      {viewMode !== "menu" && (() => {
        const overallNotes = pickLang(c, "notes", lang);
        if (!overallNotes) return null;
        return (
          <div style={{ background: "#FFFBEB", border: "0.5px solid #FDE68A", borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
            <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 10, color: "#92400E" }}>
              📝 {lang === "zh" ? "整体备注" : "メモ"}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: "#78350F", whiteSpace: "pre-wrap" }}>{overallNotes}</div>
          </div>
        );
      })()}

      {/* 📝 试吃笔记（仅详细模式） */}
      {viewMode === "detail" && (c.tasting?.notes || c.tasting?.feedback || c.tasting?.improvement) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1rem" }}>
          {(c.tasting.notes || c.tasting.feedback) && (
            <div style={{ background: "#ECFDF5", border: "0.5px solid #86EFAC", borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10, color: "#166534" }}>✨ 好评点 / 整体感想</div>
              {c.tasting.date && <div style={{ fontSize: 11, color: "#166534", marginBottom: 8 }}>📅 {c.tasting.date}</div>}
              {c.tasting.notes && (
                <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: c.tasting.feedback ? 10 : 0, color: "#052e16" }}>{c.tasting.notes}</div>
              )}
              {c.tasting.feedback && (
                <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#166534", fontStyle: "italic", borderTop: c.tasting.notes ? "0.5px solid #86EFAC" : "none", paddingTop: c.tasting.notes ? 8 : 0 }}>
                  💬 {c.tasting.feedback}
                </div>
              )}
            </div>
          )}
          {c.tasting.improvement && (
            <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10, color: "#92400E" }}>🔧 改进方向 TODO</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#78350F" }}>{c.tasting.improvement}</div>
            </div>
          )}
        </div>
      )}

      {/* 🖼️ 图片展示（详细和菜单模式） */}
      {viewMode !== "recipe" && <ImageUrlsDisplay urls={c.imageUrls} />}

      {/* 📚 关联知识点（菜单模式隐藏） */}
      {viewMode !== "menu" && relatedKnowledge.length > 0 && (
        <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E5E5", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>📚 相关知识点（点击跳转）</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {relatedKnowledge.map(k => {
              const kTitle = pickLang(k, "title", lang);
              return (
                <button
                  key={k.id}
                  onClick={() => onNavigateToKnowledge && onNavigateToKnowledge(k.id)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EDE9FE", color: "#5B21B6", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}
                >
                  {kTitle} <span style={{ fontSize: 10, opacity: 0.7 }}>→</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 组合蛋糕编辑 Form ───────────────────────────────────────────
function CreationEditForm({ creation, components, cats, onUpdateCats, brands = [], materials = [], onSave, onDelete, onBack, onUpdateComponent, confirmDialog, knowledge = [], lang = "zh" }) {
  const isNew = !creation;
  const [errorMsg, setErrorMsg] = useState("");
  const empty = {
    nameZh: "", nameJa: "", nameFr: "",
    mold: "", size: "", serves: "", portions: "",
    description: "",
    chef: "", flavorTags: [],
    status: "試作",
    price: "", priceCurrency: "CNY", prepTime: "", shelfLife: "",
    layers: [],
    rating: 0,
    tasting: { date: "", notes: "", feedback: "", improvement: "" },
    imageUrls: []
  };
  const [form, setForm] = useState(creation ? {
    ...empty,
    ...creation,
    tasting: creation.tasting || { date: "", notes: "", feedback: "", improvement: "" },
    flavorTags: creation.flavorTags || [],
  } : empty);
  const [showComponentPicker, setShowComponentPicker] = useState(false);
  const [editingLayerIdx, setEditingLayerIdx] = useState(null);
  const [newFlavorTag, setNewFlavorTag] = useState("");

  // 🧮 单层实际成本 = 组件成本 × (本蛋糕用量 / 组件产出量)
  const calcLayerActualCost = (l) => {
    const componentYield = parseFloat(l.yield) || 0;
    const usedAmount = parseFloat(l.usedAmount) || 0;
    const componentCost = parseFloat(l.totalCost) || 0;
    if (componentYield === 0) return componentCost; // 没设置产出量，就用原成本
    return componentCost * (usedAmount / componentYield);
  };

  // 总成本（本批次，比如4台蛋糕）
  const totalCostAll = (form.layers || []).reduce((s, l) => s + calcLayerActualCost(l), 0);
  // 单个蛋糕成本
  const servesNum = parseFloat(form.serves) || 1;
  const costPerCake = totalCostAll / servesNum;
  // 单份成本
  const portionsNum = parseFloat(form.portions) || 1;
  const costPerPortion = costPerCake / portionsNum;
  // 毛利率
  const priceNum = toCNY(form.price, priceCurOf(form));
  const marginPercent = priceNum > 0 ? ((priceNum - costPerPortion) / priceNum * 100) : 0;

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const fTasting = (key) => (e) => setForm(prev => ({ ...prev, tasting: { ...prev.tasting, [key]: e.target.value } }));

  // 添加组件作为一层
  const addLayerFromComponent = (comp) => {
    const newLayer = {
      _lid: Date.now() + Math.random(),
      sourceComponentId: comp.id,
      customName: "", // 自定义层名（例：①顶层饼底）
      usedAmount: "", // 本蛋糕实际用量
      nameZh: comp.nameZh,
      nameJa: comp.nameJa,
      nameFr: comp.nameFr,
      componentCategory: comp.componentCategory,
      yield: comp.yield, // 组件原产出量（作为参考）
      unit: comp.unit,
      ingredients: JSON.parse(JSON.stringify(comp.ingredients || [])),
      stepsZh: [...(comp.stepsZh || comp.steps || [])],
      stepsJa: [...(comp.stepsJa || comp.steps || [])],
      notesZh: comp.notesZh || "",
      notesJa: comp.notesJa || "",
      totalCost: comp.totalCost || 0,
    };
    setForm(prev => ({ ...prev, layers: [...(prev.layers || []), newLayer] }));
    setShowComponentPicker(false);
  };

  // 添加空白层（不从组件库）
  const addEmptyLayer = (catId = "mousse") => {
    const newLayer = {
      _lid: Date.now() + Math.random(),
      sourceComponentId: null,
      customName: "", usedAmount: "",
      nameZh: "", nameJa: "", nameFr: "",
      componentCategory: catId,
      yield: "", unit: "g",
      ingredients: [],
      stepsZh: [],
      stepsJa: [],
      notesZh: "", notesJa: "",
      totalCost: 0,
    };
    setForm(prev => ({ ...prev, layers: [...(prev.layers || []), newLayer] }));
  };

  const deleteLayer = (idx) => {
    const doDelete = () => setForm(prev => ({ ...prev, layers: prev.layers.filter((_, i) => i !== idx) }));
    if (confirmDialog) {
      confirmDialog("删除这一层吗？", doDelete);
    } else {
      if (window.confirm("删除这一层吗？")) doDelete();
    }
  };

  const moveLayer = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= form.layers.length) return;
    const newLayers = [...form.layers];
    [newLayers[idx], newLayers[newIdx]] = [newLayers[newIdx], newLayers[idx]];
    setForm(prev => ({ ...prev, layers: newLayers }));
  };

  const updateLayer = (idx, updatedLayer) => {
    setForm(prev => ({
      ...prev,
      layers: prev.layers.map((l, i) => i === idx ? updatedLayer : l)
    }));
    setEditingLayerIdx(null);
  };

  const handleSave = () => {
    if (!form.nameZh.trim()) {
      setErrorMsg("请输入蛋糕名称");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    onSave({
      ...form,
      id: creation ? creation.id : "creation_" + Date.now(),
      layers: (form.layers || []).map(({ _lid, ...rest }) => rest),
      updatedAt: new Date().toISOString(),
    });
  };

  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };

  // 层编辑模式
  if (editingLayerIdx !== null) {
    const layer = form.layers[editingLayerIdx];
    return (
      <LayerEditForm
        layer={layer}
        cats={cats}
        onUpdateCats={onUpdateCats}
        brands={brands}
        materials={materials}
        onSave={(updated) => updateLayer(editingLayerIdx, updated)}
        onBack={() => setEditingLayerIdx(null)}
        onUpdateComponent={onUpdateComponent}
        lang={lang}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{isNew ? "新建组合蛋糕" : "编辑组合蛋糕"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isNew && <Btn variant="danger" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* 💡 懒人模式提示 */}
      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：中日文任一填写即可。规格和售价用于自动计算成本和毛利率。
      </div>

      {/* 基本信息 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>🏷️ 基本信息</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>蛋糕名（中文）</label>
            <input value={form.nameZh} onChange={f("nameZh")} placeholder="热带水果白巧克力慕斯蛋糕" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>蛋糕名（日本語）</label>
            <input value={form.nameJa} onChange={f("nameJa")} placeholder="アグレアブル トロピカル" style={inpStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>蛋糕名（FR）</label>
            <input value={form.nameFr} onChange={f("nameFr")} placeholder="Tropique Blanc" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>原作者 / 师承</label>
            <input value={form.chef || ""} onChange={f("chef")} placeholder="例：マプリエール 猿館シェフ" style={inpStyle} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>概念描述</label>
          <textarea value={form.description} onChange={f("description")} placeholder="这个蛋糕想表达什么？口味方向？灵感来源？" style={{...inpStyle, minHeight: 60, resize: "vertical"}} />
        </div>
      </div>

      {/* 📦 规格与商品化 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>📦 规格与售卖</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>尺寸/模具</label>
            <input value={form.size || form.mold || ""} onChange={f("size")} placeholder="15cm セルクル" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>制作台数</label>
            <input type="number" value={form.serves || ""} onChange={f("serves")} placeholder="4" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>每台切几份</label>
            <input type="number" value={form.portions || ""} onChange={f("portions")} placeholder="8" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>售价（每份 ¥）</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input type="number" value={form.price || ""} onChange={f("price")} placeholder="780" style={inpStyle} />
              {priceCurBtn(form, c => setForm(prev => ({ ...prev, priceCurrency: c })), lang)}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>制作时间</label>
            <input value={form.prepTime || ""} onChange={f("prepTime")} placeholder="例：3日（冷冻+組立）" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>保存期限</label>
            <input value={form.shelfLife || ""} onChange={f("shelfLife")} placeholder="例：冷藏2日" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>售卖状态</label>
            <select value={form.status || "試作"} onChange={f("status")} style={inpStyle}>
              <option value="試作">🧪 試作中</option>
              <option value="定番">⭐ 定番商品</option>
              <option value="季節限定">🌸 季节限定</option>
              <option value="下架">⏸ 已下架</option>
              <option value="検討中">💭 検討中</option>
            </select>
          </div>
        </div>

        {/* 🎨 口味标签 */}
        <div>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "🎨 口味标签" : "🎨 フレーバータグ"}</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            {(form.flavorTags || []).map((tag, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FCE7F3", color: "#BE185D", padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>
                {tag}
                <button onClick={() => setForm(prev => ({ ...prev, flavorTags: prev.flavorTags.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#BE185D", fontSize: 14, padding: 0, marginLeft: 2 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={newFlavorTag}
              onChange={e => setNewFlavorTag(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && newFlavorTag.trim()) {
                  e.preventDefault();
                  if (!(form.flavorTags || []).includes(newFlavorTag.trim())) {
                    setForm(prev => ({ ...prev, flavorTags: [...(prev.flavorTags || []), newFlavorTag.trim()] }));
                  }
                  setNewFlavorTag("");
                }
              }}
              placeholder="输入标签回车添加，例：热带水果、百香果、焦糖、清爽..."
              style={{ ...inpStyle, fontSize: 12 }}
            />
          </div>
        </div>
      </div>

      {/* 💰 成本与毛利分析 */}
      <div style={{ background: "#F0FDF4", border: "0.5px solid #86EFAC", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10, color: "#166534" }}>💰 成本与毛利（自动计算）</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, fontSize: 12 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: "#666" }}>总批次成本</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#166534" }}>¥{totalCostAll.toFixed(0)}</div>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: "#666" }}>单个蛋糕成本</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#166534" }}>¥{costPerCake.toFixed(0)}</div>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: "#666" }}>单份成本</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#166534" }}>¥{costPerPortion.toFixed(0)}</div>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: "#666" }}>售价</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{priceNum > 0 ? fmtSellPrice(form.price, form) : "—"}</div>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: "#666" }}>毛利率</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: marginPercent >= 65 ? "#059669" : marginPercent >= 50 ? "#CA8A04" : "#DC2626" }}>
              {priceNum > 0 ? `${marginPercent.toFixed(1)}%` : "—"}
            </div>
          </div>
        </div>
        {priceNum > 0 && costPerPortion > 0 && (
          <div style={{ fontSize: 11, color: "#166534", marginTop: 8, lineHeight: 1.6 }}>
            📊 {marginPercent >= 65 ? "✅ 毛利率健康（≥65%）" : marginPercent >= 50 ? "⚠️ 毛利率偏低（50-65%）建议调整" : "🚨 毛利率过低（<50%）需要涨价或降本"}
          </div>
        )}
        {(form.layers || []).length > 0 && !form.layers.every(l => l.usedAmount) && (
          <div style={{ fontSize: 11, color: "#CA8A04", marginTop: 6, lineHeight: 1.6 }}>
            💡 提示：点击下方每层「编辑」填写"本蛋糕实际用量"，才能精确计算成本
          </div>
        )}
      </div>

      {/* 层结构构建 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>🎂 层结构（自上而下）</div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>每层可设自定义名称、本蛋糕实际用量</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn size="sm" variant="primary" onClick={() => setShowComponentPicker(true)}>+ 从组件库选</Btn>
            <Btn size="sm" onClick={() => addEmptyLayer()}>{lang === "zh" ? "+ 新建空白层" : "+ 空白層追加"}</Btn>
          </div>
        </div>

        {(!form.layers || form.layers.length === 0) && (
          <div style={{ textAlign: "center", padding: "2rem", color: "#999999", fontSize: 13, border: "1px dashed #CCCCCC", borderRadius: 8 }}>
            还没有层。从组件库挑一个开始搭。
          </div>
        )}

        {/* 📐 结构示意图 + 详细列表 */}
        {(form.layers || []).length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "50px 1fr", gap: 10 }}>
            {/* 左侧：垂直堆叠示意图 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {form.layers.map((layer, idx) => {
                const cat = getCompCat(layer.componentCategory);
                return (
                  <div key={layer._lid || idx} title={layer.customName || layer.nameZh || layer.nameJa} style={{ background: cat.color, height: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 10, fontWeight: 500, opacity: 0.9 }}>
                    {idx + 1}
                  </div>
                );
              })}
            </div>

            {/* 右侧：详细列表 */}
            <div>
              {form.layers.map((layer, idx) => {
                const cat = getCompCat(layer.componentCategory);
                const name = layer.nameZh || layer.nameJa || "未命名";
                const actualCost = calcLayerActualCost(layer);
                const componentYield = parseFloat(layer.yield) || 0;
                const usedAmount = parseFloat(layer.usedAmount) || 0;
                const updateLayerField = (field, val) => setForm(prev => ({ ...prev, layers: prev.layers.map((l, i) => i === idx ? { ...l, [field]: val } : l) }));
                return (
                  <div key={layer._lid || idx} style={{ borderLeft: `4px solid ${cat.color}`, background: cat.bg, padding: "10px 14px", marginBottom: 8, borderRadius: "0 6px 6px 0" }}>
                    {/* 顶部：序号+类别+原组件名+来源+按钮 */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 12, background: "#FFFFFF", color: cat.color, padding: "2px 10px", borderRadius: 20, fontWeight: 500 }}>{idx + 1}. {cat.zh}</span>
                        <span style={{ fontSize: 13, color: cat.color }}>{name}</span>
                        {layer.sourceComponentId && <span style={{ fontSize: 10, color: "#999" }}>⟲ 来自组件库</span>}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button onClick={() => moveLayer(idx, -1)} disabled={idx === 0} style={{ background: "#FFFFFF", border: "1px solid #CCCCCC", borderRadius: 4, padding: "4px 8px", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1, fontSize: 12 }}>↑</button>
                        <button onClick={() => moveLayer(idx, 1)} disabled={idx === form.layers.length - 1} style={{ background: "#FFFFFF", border: "1px solid #CCCCCC", borderRadius: 4, padding: "4px 8px", cursor: idx === form.layers.length - 1 ? "default" : "pointer", opacity: idx === form.layers.length - 1 ? 0.3 : 1, fontSize: 12 }}>↓</button>
                        <button onClick={() => setEditingLayerIdx(idx)} style={{ background: "#FFFFFF", border: "1px solid #CCCCCC", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>{lang === "zh" ? "编辑" : "編集"}</button>
                        <button onClick={() => deleteLayer(idx)} style={{ background: "#FFFFFF", border: "1px solid #F7C1C1", color: "#A32D2D", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>×</button>
                      </div>
                    </div>

                    {/* 快速填写：自定义名 + 实际用量 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 6 }}>
                      <input
                        value={layer.customName || ""}
                        onChange={e => updateLayerField("customName", e.target.value)}
                        placeholder="自定义层名（例：顶层、中层饼底）"
                        style={{ padding: "5px 8px", fontSize: 11, border: "0.5px solid #CCCCCC", borderRadius: 4, background: "#FFFFFF", color: "#111", fontFamily: "system-ui, sans-serif" }}
                      />
                      <input
                        type="number"
                        value={layer.usedAmount || ""}
                        onChange={e => updateLayerField("usedAmount", e.target.value)}
                        placeholder={componentYield > 0 ? `本蛋糕用量(g)，原组件${componentYield}g` : "本蛋糕用量(g)"}
                        style={{ padding: "5px 8px", fontSize: 11, border: "0.5px solid #F59E0B", borderRadius: 4, background: "#FFFBEB", color: "#111", fontFamily: "system-ui, sans-serif" }}
                      />
                      <div style={{ padding: "5px 8px", fontSize: 11, color: "#666", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        {actualCost > 0 ? <span>本层成本 <strong style={{ color: "#059669" }}>¥{actualCost.toFixed(0)}</strong></span> : <span style={{ color: "#999" }}>填用量→算成本</span>}
                      </div>
                    </div>

                    {/* 提示用量未填 */}
                    {componentYield > 0 && !usedAmount && (
                      <div style={{ fontSize: 10, color: "#CA8A04", marginTop: 4 }}>
                        ⚠ 未填写用量，成本计算不准确
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 试吃笔记 */}
      <div style={{ background: "#FFFBEB", border: "0.5px solid #FDE68A", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10, color: "#92400E" }}>📝 试吃笔记</div>
        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>日期</label>
            <input type="date" value={form.tasting?.date || ""} onChange={fTasting("date")} style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>评分</label>
            <div style={{ display: "flex", gap: 4, padding: "7px 10px" }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm(prev => ({ ...prev, rating: prev.rating === n ? 0 : n }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: (form.rating || 0) >= n ? "#F59E0B" : "#CCCCCC", padding: 0 }}>★</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>整体感想（风味平衡・结构感・想法）</label>
          <textarea value={form.tasting?.notes || ""} onChange={fTasting("notes")} placeholder="这个组合尝起来如何？有什么值得记录的？" style={{...inpStyle, minHeight: 80, resize: "vertical"}} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>客人反馈</label>
          <textarea value={form.tasting?.feedback || ""} onChange={fTasting("feedback")} placeholder="试吃时收到的具体反馈" style={{...inpStyle, minHeight: 60, resize: "vertical"}} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "改进方向" : "改善方向"}</label>
          <textarea value={form.tasting?.improvement || ""} onChange={fTasting("improvement")} placeholder="下次可以调整什么？" style={{...inpStyle, minHeight: 60, resize: "vertical"}} />
        </div>
      </div>

      {/* 🖼️ 图片链接 */}
      <ImageUrlsEditor
        urls={form.imageUrls || []}
        onChange={(urls) => setForm(prev => ({ ...prev, imageUrls: urls }))}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
        {errorMsg && <span style={{ color: "#A32D2D", fontSize: 13, marginRight: 8 }}>⚠ {errorMsg}</span>}
        <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        <Btn variant="primary" onClick={handleSave}>{lang === "zh" ? "保存" : "保存"}</Btn>
      </div>

      {/* 组件选择弹窗 */}
      {showComponentPicker && (
        <ComponentPicker
          components={components}
          onSelect={addLayerFromComponent}
          onClose={() => setShowComponentPicker(false)}
        />
      )}
    </div>
  );
}

// ─── 组件选择弹窗 ─────────────────────────────────────────────
function ComponentPicker({ components, onSelect, onClose, lang = "zh" }) {
  const [filterCat, setFilterCat] = useState("all");
  const filtered = filterCat === "all" ? components : components.filter(c => c.componentCategory === filterCat);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#FFFFFF", borderRadius: "12px", padding: "1.5rem", maxWidth: 640, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>从组件库选择</div>
          <Btn size="sm" onClick={onClose}>关闭</Btn>
        </div>

        {components.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#666666", fontSize: 13 }}>
            组件库还是空的。<br />请先在「组件仓库」中添加组件。
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
              <button onClick={() => setFilterCat("all")} style={{ padding: "4px 12px", fontSize: 12, border: filterCat === "all" ? "1.5px solid #111111" : "1px solid #CCCCCC", borderRadius: 20, background: filterCat === "all" ? "#111111" : "#FFFFFF", color: filterCat === "all" ? "#FFFFFF" : "#111111", cursor: "pointer" }}>{lang === "zh" ? "全部" : "すべて"}</button>
              {getAllCompCats().map(cat => {
                const count = components.filter(c => c.componentCategory === cat.id).length;
                if (count === 0) return null;
                const active = filterCat === cat.id;
                return (
                  <button key={cat.id} onClick={() => setFilterCat(cat.id)} style={{ padding: "4px 12px", fontSize: 12, border: `1.5px solid ${active ? cat.color : "#CCCCCC"}`, borderRadius: 20, background: active ? cat.bg : "#FFFFFF", color: active ? cat.color : "#111111", cursor: "pointer" }}>
                    {cat.zh} ({count})
                  </button>
                );
              })}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {filtered.map(c => {
                const cat = getCompCat(c.componentCategory);
                return (
                  <div key={c.id} onClick={() => onSelect(c)} style={{ background: "#FFFFFF", border: "0.5px solid #E5E5E5", borderLeft: `4px solid ${cat.color}`, borderRadius: "8px", padding: "10px 14px", cursor: "pointer" }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.nameZh || c.nameJa}</div>
                    {c.nameJa && c.nameZh && <div style={{ fontSize: 12, color: "#666666", marginTop: 2 }}>{c.nameJa}</div>}
                    <div style={{ fontSize: 11, color: "#666666", marginTop: 4, display: "flex", gap: 10 }}>
                      <span style={{ background: cat.bg, color: cat.color, padding: "1px 8px", borderRadius: 20 }}>{cat.zh}</span>
                      <span>{(c.ingredients || []).length} 种原料</span>
                      <span>¥{(c.totalCost || 0).toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── 层编辑 Form ──────────────────────────────────────────────
function LayerEditForm({ layer, cats = [], brands = [], materials = [], onSave, onBack, onUpdateComponent, lang = "zh", onUpdateCats }) {
  const [form, setForm] = useState({ ...layer });
  const [pickerTargetIngId, setPickerTargetIngId] = useState(null);
  const [showBulkMatch, setShowBulkMatch] = useState(false); // 🤖 批量关联
  const [ings, setIngs] = useState((layer.ingredients || []).map((i, idx) => {
    const linked = autoLinkIng(i, cats);
    // 自动用百科最新价刷新
    if (linked.materialId && Array.isArray(materials)) {
      const m = materials.find(x => x.id === linked.materialId);
      if (m) {
        const pp = getMaterialEffectivePrice(m);
        if (!isNaN(pp) && pp > 0) {
          const q = parseFloat(linked.qty) || 0;
          return { ...linked, _id: idx, unitPrice: String(pp), cost: q > 0 ? (q * pp).toFixed(1) : linked.cost };
        }
      }
    }
    return { ...linked, _id: idx };
  }));
  const [steps, setSteps] = useState((layer.steps || []).map((s, i) => ({ _id: i, text: s })));
  const nextIngId = useRef(ings.length);
  const nextStepId = useRef(steps.length);

  // 双语自动补全数据源
  const autoCompleteData = useMemo(() => {
    const zhSet = new Set();
    const jaSet = new Set();
    const brandSet = new Set();
    (cats || []).forEach(cat => {
      if (cat.nameZh) zhSet.add(cat.nameZh);
      if (cat.nameJa) jaSet.add(cat.nameJa);
      (cat.brands || []).forEach(b => {
        if (b.nameZh) brandSet.add(b.nameZh);
        if (b.nameJa) brandSet.add(b.nameJa);
      });
    });
    return { nameZh: Array.from(zhSet).sort(), nameJa: Array.from(jaSet).sort(), brand: Array.from(brandSet).sort() };
  }, [cats]);

  const totalCost = ings.reduce((s, i) => s + toCNY(i.cost, curOf(i)), 0);  // v17: 各按各的币种折成人民币再相加
  const updateIng = (id, field, val) => setIngs(prev => prev.map(i => i._id === id ? { ...i, [field]: val } : i));
  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  // 未关联材料对话框
  const [unlinkedDialog, setUnlinkedDialog] = useState(null);

  const doSave = (finalIngs) => {
    const validIngs = finalIngs.filter(i => i.nameZh || i.nameJa);
    const refreshedIngs = validIngs.map(i => {
      if (!i.materialId) return i;
      const m = materials.find(x => x.id === i.materialId);
      if (!m) return { ...i, materialId: null };
      const pp = getMaterialEffectivePrice(m);
      if (isNaN(pp) || pp <= 0) return i;
      const q = parseFloat(i.qty) || 0;
      return { ...i, unitPrice: String(pp), cost: q > 0 ? (q * pp).toFixed(1) : i.cost };
    });
    const total = refreshedIngs.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
    onSave({
      ...form,
      ingredients: refreshedIngs.map(({ _id, ...rest }) => rest),
      steps: steps.map(s => s.text).filter(Boolean),
      totalCost: total,
    });
  };

  const handleSave = () => {
    if (onUpdateCats) {
      const unlinked = ings
        .map((ing, i) => ({ ing, idx: i }))
        .filter(({ ing }) => (ing.nameZh || ing.nameJa) && !ing.catId)
        .map(({ ing, idx }) => ({
          idx,
          nameZh: ing.nameZh || "",
          nameJa: ing.nameJa || "",
          brand: ing.brand || "",
          unit: ing.unit || "g",
          unitPrice: ing.unitPrice || "",
        }));
      if (unlinked.length > 0) {
        setUnlinkedDialog({ items: unlinked });
        return;
      }
    }
    doSave(ings);
  };

  const handleSyncBackToComponent = () => {
    if (!layer.sourceComponentId) {
      onBack(); // 这一层不是从组件库来的，直接返回
      return;
    }
    const validIngs = ings.filter(i => i.nameZh || i.nameJa);
    const total = validIngs.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
    const updated = {
      id: layer.sourceComponentId,
      nameZh: form.nameZh, nameJa: form.nameJa, nameFr: form.nameFr,
      componentCategory: form.componentCategory,
      yield: form.yield, unit: form.unit,
      ingredients: validIngs.map(({ _id, ...rest }) => rest),
      steps: steps.map(s => s.text).filter(Boolean),
      notesZh: form.notesZh || "", notesJa: form.notesJa || "",
      totalCost: total,
      updatedAt: new Date().toISOString(),
    };
    onUpdateComponent(updated);
  };

  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };
  const cat = getCompCat(form.componentCategory);

  return (
    <div>
      {unlinkedDialog && (
        <UnlinkedIngredientsDialog
          unlinkedItems={unlinkedDialog.items}
          lang={lang}
          onCancel={() => setUnlinkedDialog(null)}
          onSkip={() => { setUnlinkedDialog(null); doSave(ings); }}
          onConfirm={(selectedIdxs) => {
            const { ings: updatedIngs, cats: updatedCats } = applyUnlinkedToCats(ings, cats, selectedIdxs);
            setIngs(updatedIngs);
            if (onUpdateCats) onUpdateCats(updatedCats);
            setUnlinkedDialog(null);
            doSave(updatedIngs);
          }}
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>编辑层：{form.nameZh || form.nameJa || "未命名"}</div>
        <Btn onClick={onBack}>← 取消</Btn>
      </div>

      {layer.sourceComponentId && (
        <div style={{ background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: "8px", padding: "10px 14px", marginBottom: "1rem", fontSize: 12, color: "#1E40AF" }}>
          💡 这一层来自组件库。你可以自由调整不影响组件库。如果调整后想同步回组件库，保存前点「↻ 同步回组件库」。
        </div>
      )}

      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem", borderLeft: `4px solid ${cat.color}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>名（中文）</label><input value={form.nameZh || ""} onChange={f("nameZh")} style={inpStyle} /></div>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>名（日本語）</label><input value={form.nameJa || ""} onChange={f("nameJa")} style={inpStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "分类" : "カテゴリー"}</label>
            <select value={form.componentCategory} onChange={f("componentCategory")} style={inpStyle}>
              {getAllCompCats().map(c => <option key={c.id} value={c.id}>{c.zh}</option>)}
            </select>
          </div>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "产出量" : "出来高"}</label><input type="number" value={form.yield || ""} onChange={f("yield")} style={inpStyle} /></div>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "单位" : "単位"}</label><input value={form.unit || "g"} onChange={f("unit")} style={inpStyle} /></div>
        </div>
      </div>

      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>{lang === "zh" ? "原材料" : "原材料"}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {materials && materials.length > 0 && (
              <Btn size="sm" onClick={() => setShowBulkMatch(true)} title={lang === "zh" ? "AI 批量关联百科" : "一括関連"}>
                {lang === "zh" ? "🤖 批量关联" : "🤖 一括"}
              </Btn>
            )}
            <Btn size="sm" onClick={() => setIngs(prev => [...prev, { _id: nextIngId.current++, nameZh: "", nameJa: "", nameFr: "", qty: "", unit: "g", brand: "", unitPrice: "", currency: "CNY", cost: "" }])}>{lang === "zh" ? "+ 追加" : "+ 追加"}</Btn>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ background: "#F5F5F5" }}>
                {["🔗","中文","日本語","用量","单位","品牌","单价","成本",""].map((h, i) => (
                  <th key={i} style={{ fontSize: 11, color: "#666666", fontWeight: 400, padding: "6px 6px 8px", textAlign: "left", borderBottom: "0.5px solid #E5E5E5" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ings.map(ing => {
                const ist = { padding: "4px 6px", fontSize: 12, border: "0.5px solid #CCCCCC", borderRadius: 4, background: "#FFFFFF", color: "#111111" };
                const { cat: linkedCat, brand: linkedBrand } = resolveIngBinding(ing, cats);
                const linked = !!linkedCat;
                const onNameChange = (field, val) => {
                  const newIng = { ...ing, [field]: val };
                  if (newIng.catId) {
                    const currentCat = cats.find(c => c.id === newIng.catId);
                    if (!currentCat || (
                      (currentCat.nameZh || "").toLowerCase() !== val.toLowerCase() &&
                      (currentCat.nameJa || "").toLowerCase() !== val.toLowerCase() &&
                      (field === "nameZh" ? (currentCat.nameJa || "") : (currentCat.nameZh || "")).toLowerCase() !== (field === "nameZh" ? newIng.nameJa : newIng.nameZh || "").toLowerCase()
                    )) {
                      newIng.catId = null;
                      newIng.brandIdx = null;
                    }
                  }
                  const matched = findCatByName(val, cats);
                  if (matched && !newIng.catId) {
                    newIng.catId = matched.id;
                    newIng.brandIdx = null;
                    if (field === "nameZh" && !newIng.nameJa && matched.nameJa) newIng.nameJa = matched.nameJa;
                    if (field === "nameJa" && !newIng.nameZh && matched.nameZh) newIng.nameZh = matched.nameZh;
                    if (!newIng.unit && matched.unit) newIng.unit = matched.unit;
                  }
                  setIngs(prev => prev.map(i => i._id === ing._id ? newIng : i));
                };
                const onBrandSelect = (idx) => {
                  setIngs(prev => prev.map(i => {
                    if (i._id !== ing._id) return i;
                    if (idx === "" || idx === null) {
                      return { ...i, brandIdx: null, brand: "" };
                    }
                    const bi = parseInt(idx);
                    const brand = linkedCat && linkedCat.brands[bi];
                    if (!brand) return i;
                    const price = parseFloat(brand.price) || 0;
                    const q = parseFloat(i.qty) || 0;
                    return {
                      ...i,
                      brandIdx: bi,
                      brand: getBrandName(brand, lang),
                      unitPrice: brand.price || "",
                      cost: q > 0 && price > 0 ? (q * price).toFixed(1) : i.cost,
                    };
                  }));
                };
                const { material: linkedMat } = resolveIngMaterial(ing, materials, brands);
                const priceDrift = linked && linkedBrand && linkedBrand.price && ing.unitPrice &&
                  Math.abs(parseFloat(linkedBrand.price) - parseFloat(ing.unitPrice)) > 0.001
                  ? parseFloat(linkedBrand.price) : null;
                return (
                  <tr key={ing._id} style={{ borderBottom: "0.5px solid #E5E5E5" }}>
                    <td style={{ padding: "3px 4px" }}>
                      <button
                        onClick={() => setPickerTargetIngId(ing._id)}
                        title={linkedMat
                          ? (lang === "zh" ? `✓ 关联:${linkedMat.nameZh || linkedMat.nameJa}` : `✓ 連動中`)
                          : (lang === "zh" ? "从材料百科选择" : "材料事典から選択")}
                        style={{
                          padding: "3px 6px", fontSize: 13, cursor: "pointer",
                          background: linkedMat ? "#059669" : T.bgCard,
                          color: linkedMat ? "#FFFFFF" : T.textSecondary,
                          border: `0.5px solid ${linkedMat ? "#059669" : T.border}`,
                          borderRadius: 4,
                          width: 30, height: 26,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}
                      >🔗</button>
                    </td>
                    <td style={{ padding: "3px 4px" }}><input list="autoNameZh" placeholder="中文" value={ing.nameZh||""} onChange={e=>onNameChange("nameZh", e.target.value)} style={{...ist, width: 110, borderColor: linkedMat ? "#059669" : (linked ? "#0F6E56" : "#CCCCCC")}} title={linkedMat ? `✓ 百科:${linkedMat.nameZh || linkedMat.nameJa}` : (linked ? `✓ 已关联「${getCatName(linkedCat, lang)}」` : "")} /></td>
                    <td style={{ padding: "3px 4px" }}><input list="autoNameJa" placeholder="日本語" value={ing.nameJa||""} onChange={e=>onNameChange("nameJa", e.target.value)} style={{...ist, width: 110, borderColor: linkedMat ? "#059669" : (linked ? "#0F6E56" : "#CCCCCC")}} /></td>
                    <td style={{ padding: "3px 4px" }}><input type="number" placeholder="量" value={ing.qty||""} onChange={e=>{updateIng(ing._id,"qty",e.target.value);const up=parseFloat(ing.unitPrice)||0;if(up>0)updateIng(ing._id,"cost",(parseFloat(e.target.value)*up).toFixed(1));}} style={{...ist, width: 52}} /></td>
                    <td style={{ padding: "3px 4px" }}><input placeholder="g" value={ing.unit||""} onChange={e=>updateIng(ing._id,"unit",e.target.value)} style={{...ist, width: 36}} /></td>
                    <td style={{ padding: "3px 4px" }}>
                      {linked ? (
                        <select value={typeof ing.brandIdx === "number" ? ing.brandIdx : ""} onChange={e => onBrandSelect(e.target.value)} style={{...ist, width: 78, padding: "4px 3px"}} title={lang === "zh" ? "从价格表选品牌" : "価格表から選ぶ"}>
                          <option value="">{lang === "zh" ? "—未定—" : "—未定—"}</option>
                          {linkedCat.brands.map((b, bi) => <option key={bi} value={bi}>{getBrandName(b, lang)}</option>)}
                        </select>
                      ) : (
                        <input list="autoBrand" placeholder="品牌" value={ing.brand||""} onChange={e=>updateIng(ing._id,"brand",e.target.value)} style={{...ist, width: 66}} />
                      )}
                    </td>
                    <td style={{ padding: "3px 4px", position: "relative" }}>
                      <input type="number" placeholder="单价" value={ing.unitPrice||""} onChange={e=>{updateIng(ing._id,"unitPrice",e.target.value);const q=parseFloat(ing.qty)||0;if(q>0)updateIng(ing._id,"cost",(q*parseFloat(e.target.value)).toFixed(1));}} style={{...ist, width: 52}} />
                      {priceDrift !== null && (
                        <button onClick={() => {
                          setIngs(prev => prev.map(i => {
                            if (i._id !== ing._id) return i;
                            const q = parseFloat(i.qty) || 0;
                            return { ...i, unitPrice: String(priceDrift), cost: q > 0 ? (q * priceDrift).toFixed(1) : i.cost };
                          }));
                        }} style={{ display: "block", width: "100%", marginTop: 2, fontSize: 10, padding: "1px 3px", background: "#FEF3C7", border: "0.5px solid #F59E0B", borderRadius: 3, cursor: "pointer", color: "#92400E" }} title={lang === "zh" ? "价格表已更新,点击同步" : "価格表の値に更新"}>→ ¥{priceDrift}</button>
                      )}
                    </td>
                    <td style={{ padding: "3px 4px" }}><input type="number" placeholder="自动" value={ing.cost||""} onChange={e=>updateIng(ing._id,"cost",e.target.value)} style={{...ist, width: 56, textAlign: "right"}} /></td>
                    <td style={{ padding: "3px 4px" }}><button onClick={() => setIngs(prev=>prev.filter(i=>i._id !== ing._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#666666", fontSize: 15 }}>×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* 🧪 双语自动补全数据源 */}
          <datalist id="autoNameZh">
            {autoCompleteData.nameZh.map(n => <option key={n} value={n} />)}
          </datalist>
          <datalist id="autoNameJa">
            {autoCompleteData.nameJa.map(n => <option key={n} value={n} />)}
          </datalist>
          <datalist id="autoBrand">
            {autoCompleteData.brand.map(n => <option key={n} value={n} />)}
          </datalist>
        </div>
        <div style={{ marginTop: 12, padding: "8px 12px", background: "#F5F5F5", borderRadius: 6, fontSize: 13 }}>
          该层成本：<strong>¥{totalCost.toFixed(0)}</strong>
        </div>
      </div>

      {/* 制法 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>{lang === "zh" ? "制作流程" : "作り方"}</div>
          <Btn size="sm" onClick={() => setSteps(prev => [...prev, { _id: nextStepId.current++, text: "" }])}>{lang === "zh" ? "+ 追加" : "+ 追加"}</Btn>
        </div>
        {steps.map((s, i) => (
          <div key={s._id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ minWidth: 22, height: 22, borderRadius: "50%", background: "#F5F5F5", border: "0.5px solid #CCCCCC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, marginTop: 7, flexShrink: 0 }}>{i + 1}</div>
            <input value={s.text} onChange={e => setSteps(prev => prev.map(st => st._id === s._id ? { ...st, text: e.target.value } : st))} placeholder="步骤描述…" style={inpStyle} />
            <button onClick={() => setSteps(prev => prev.filter(st => st._id !== s._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#666666", fontSize: 15, padding: "6px" }}>×</button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {layer.sourceComponentId ? (
          <Btn variant="success" onClick={handleSyncBackToComponent}>↻ 同步回组件库</Btn>
        ) : <div />}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
          <Btn variant="primary" onClick={handleSave}>{lang === "zh" ? "保存层" : "レイヤー保存"}</Btn>
        </div>
      </div>
      {/* 🔗 材料百科选择弹窗 */}
      {pickerTargetIngId !== null && (
        <MaterialPickerModal
          materials={materials}
          brands={brands}
          currentMaterialId={(ings.find(i => i._id === pickerTargetIngId) || {}).materialId || null}
          lang={lang}
          onClose={() => setPickerTargetIngId(null)}
          onSelect={(mat) => {
            setIngs(prev => prev.map(i => {
              if (i._id !== pickerTargetIngId) return i;
              if (mat === null) return { ...i, materialId: null };
              const b = brands.find(x => x.id === mat.brandId);
              const pp = getMaterialEffectivePrice(mat);
              const q = parseFloat(i.qty) || 0;
              return {
                ...i,
                materialId: mat.id,
                nameZh: i.nameZh || mat.nameZh || "",
                nameJa: i.nameJa || mat.nameJa || "",
                nameFr: i.nameFr || mat.nameFr || "",
                brand: b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : i.brand,
                unitPrice: !isNaN(pp) && pp > 0 ? String(pp) : i.unitPrice,
                cost: (!isNaN(pp) && pp > 0 && q > 0) ? (q * pp).toFixed(1) : i.cost,
              };
            }));
            setPickerTargetIngId(null);
          }}
        />
      )}

      {/* 🤖 批量智能关联弹窗 */}
      {showBulkMatch && (
        <BulkMatchModal
          ings={ings}
          materials={materials}
          brands={brands}
          lang={lang}
          onClose={() => setShowBulkMatch(false)}
          onApply={(selections) => {
            setIngs(prev => prev.map(i => {
              const matId = selections[i._id];
              if (matId == null) return i;
              const mat = materials.find(m => m.id === matId);
              if (!mat) return i;
              const b = brands.find(x => x.id === mat.brandId);
              const pp = getMaterialEffectivePrice(mat);
              const q = parseFloat(i.qty) || 0;
              return {
                ...i,
                materialId: mat.id,
                nameZh: i.nameZh || mat.nameZh || "",
                nameJa: i.nameJa || mat.nameJa || "",
                nameFr: i.nameFr || mat.nameFr || "",
                brand: b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : i.brand,
                unitPrice: !isNaN(pp) && pp > 0 ? String(pp) : i.unitPrice,
                cost: (!isNaN(pp) && pp > 0 && q > 0) ? (q * pp).toFixed(1) : i.cost,
              };
            }));
            setShowBulkMatch(false);
          }}
        />
      )}

      {/* 底部留白,避免内容被浮动保存栏遮挡 */}
      <div style={{ height: 80 }} />
      {/* 浮动保存栏 */}
      <StickySaveBar onSave={handleSave} label={lang === "zh" ? "保存层" : "レイヤー保存"} />
    </div>
  );
}

// ─── 知识库 View ───────────────────────────────────────────────
function KnowledgeView({ knowledge, setKnowledge, lang, setLang, viewId, setViewId, editTarget, setEditTarget, showToast, saved, recipes, components, creations, onNavigate, confirmDialog }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("all");

  if (editTarget !== null) {
    return (
      <KnowledgeEditForm
        item={editTarget === "new" ? null : editTarget}
        recipes={recipes}
        components={components}
        creations={creations}
        onSave={(k) => {
          setKnowledge(prev => {
            const found = prev.find(x => x.id === k.id);
            return found ? prev.map(x => x.id === k.id ? k : x) : [...prev, k];
          });
          showToast("✓ 知识点已保存");
          setViewId(k.id);
          setEditTarget(null);
        }}
        onDelete={() => {
          confirmDialog("删除这条知识点吗？", () => {
            setKnowledge(prev => prev.filter(x => x.id !== editTarget.id));
            showToast("已删除");
            setEditTarget(null);
          });
        }}
        onBack={() => {
          // [B4 修复] 有 id 跳详情,无 id 回列表
          if (editTarget && editTarget.id) setViewId(editTarget.id);
          setEditTarget(null);
        }}
      />
    );
  }

  if (viewId) {
    const item = knowledge.find(k => k.id === viewId);
    if (item) {
      return (
        <KnowledgeDetail
          item={item}
          lang={lang}
          onEdit={() => { setEditTarget(item); setViewId(null); }}
          onBack={() => setViewId(null)}
          recipes={recipes}
          components={components}
          creations={creations}
          onNavigate={onNavigate}
        />
      );
    }
  }

  // 搜索和筛选
  const filtered = knowledge.filter(k => {
    // 标签筛选
    if (filterTag !== "all" && !(k.tags || []).includes(filterTag)) return false;

    // 搜索过滤
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchable = [
        k.titleZh, k.titleJa, k.contentZh, k.contentJa,
        ...(k.relatedRecipes || []),
      ].filter(Boolean).join(" ").toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{lang === "zh" ? `知识库（${knowledge.length}）` : `ナレッジ（${knowledge.length}）`}</div>
          {saved && <span style={{ fontSize: 12, color: "#0F6E56" }}>{lang === "zh" ? "✓ 已保存" : "✓ 保存済み"}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn variant="primary" onClick={() => setEditTarget("new")}>{lang === "zh" ? "+ 新增知识点" : "+ ナレッジ追加"}</Btn>
        </div>
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="🔍 搜索标题、内容、关联配方..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "9px 14px", fontSize: 14, border: "0.5px solid #CCCCCC", borderRadius: "8px", background: "#FFFFFF", color: "#111111", fontFamily: "system-ui, sans-serif", boxSizing: "border-box" }}
        />
      </div>

      {/* 标签筛选 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
        <button onClick={() => setFilterTag("all")} style={{ padding: "4px 12px", fontSize: 12, border: filterTag === "all" ? "1.5px solid #111111" : "1px solid #CCCCCC", borderRadius: 20, background: filterTag === "all" ? "#111111" : "#FFFFFF", color: filterTag === "all" ? "#FFFFFF" : "#111111", cursor: "pointer" }}>{lang === "zh" ? "全部" : "すべて"}</button>
        {KNOWLEDGE_TAGS.map(tag => {
          const count = knowledge.filter(k => (k.tags || []).includes(tag.id)).length;
          if (count === 0) return null;
          const active = filterTag === tag.id;
          return (
            <button key={tag.id} onClick={() => setFilterTag(tag.id)} style={{ padding: "4px 12px", fontSize: 12, border: `1.5px solid ${active ? tag.color : "#CCCCCC"}`, borderRadius: 20, background: active ? tag.bg : "#FFFFFF", color: active ? tag.color : "#111111", cursor: "pointer", fontWeight: active ? 500 : 400 }}>
              {lang === "zh" ? tag.zh : tag.ja} <span style={{ color: "#999999", marginLeft: 2 }}>({count})</span>
            </button>
          );
        })}
        {/* 自定义标签筛选 */}
        {(() => {
          const builtInIds = new Set(KNOWLEDGE_TAGS.map(t => t.id));
          const customTags = new Set();
          knowledge.forEach(k => (k.tags || []).forEach(t => {
            if (!builtInIds.has(t)) customTags.add(t);
          }));
          return Array.from(customTags).sort().map(tag => {
            const count = knowledge.filter(k => (k.tags || []).includes(tag)).length;
            const active = filterTag === tag;
            return (
              <button key={tag} onClick={() => setFilterTag(tag)} style={{ padding: "4px 12px", fontSize: 12, border: `1.5px solid ${active ? "#8B5CF6" : "#CCCCCC"}`, borderRadius: 20, background: active ? "#F3E8FF" : "#FFFFFF", color: active ? "#6D28D9" : "#111111", cursor: "pointer", fontWeight: active ? 500 : 400 }}>
                {tag} <span style={{ color: "#999999", marginLeft: 2 }}>({count})</span>
              </button>
            );
          });
        })()}
      </div>

      {/* 2a §09 两种空态必须长得不一样：
          「首次为空」给下一步动作；「筛选无结果」把生效条件摆出来能一个个摘掉，且不给「新建」按钮 */}
      {filtered.length === 0 && (
        knowledge.length === 0 ? (
          <EmptyState
            variant="first" lang={lang}
            title={lang === "zh" ? "还没有知识点" : "まだナレッジがありません"}
            hint={lang === "zh" ? "这里存放学过的技术要点，可以搜索、按标签筛选、与配方关联" : "学んだ技術ポイントを貯める場所です。検索・タグ絞り込み・レシピ連携ができます"}
            actions={[{ label: lang === "zh" ? "＋ 新增知识点" : "＋ ナレッジ追加", onClick: () => setEditTarget("new") }]}
          />
        ) : (
          <EmptyState
            variant="filter" lang={lang}
            title={lang === "zh" ? "没有匹配的知识点" : "一致するナレッジがありません"}
            hint={lang === "zh"
              ? `当前生效 ${[filterTag !== "all", !!searchQuery].filter(Boolean).length} 个条件`
              : `絞り込み ${[filterTag !== "all", !!searchQuery].filter(Boolean).length} 件`}
            chips={[
              ...(filterTag !== "all" ? [{ label: (getKnowledgeTag(filterTag)[lang === "zh" ? "zh" : "ja"]) || filterTag, onRemove: () => setFilterTag("all") }] : []),
              ...(searchQuery ? [{ label: `“${searchQuery}”`, onRemove: () => setSearchQuery("") }] : []),
            ]}
            onClearAll={() => { setFilterTag("all"); setSearchQuery(""); }}
          />
        )
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(k => {
          const title = pickLang(k, "title", lang);
          const content = pickLang(k, "content", lang);
          const preview = (content || "").replace(/【[^】]+】/g, "").replace(/\n+/g, " ").slice(0, 80);
          const avatarLetter = (title || "?").charAt(0).toUpperCase();
          return (
            <div
              key={k.id}
              onClick={() => setViewId(k.id)}
              style={{
                background: T.bgCard,
                border: `0.5px solid ${T.border}`,
                borderRadius: T.radiusLg,
                padding: "16px 20px",
                cursor: "pointer",
                borderLeft: `3px solid ${T.accentSoft}`,
                transition: "border-color 0.15s, transform 0.12s",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {/* 首字母徽章 */}
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: T.bgSoft, color: T.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.fontSerif, fontSize: 16, fontStyle: "italic", fontWeight: 500,
                flexShrink: 0,
              }}>{avatarLetter}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.fontSerif, fontSize: 15, fontWeight: 500, color: T.textPrimary, lineHeight: 1.3 }}>
                  {title}
                </div>
                {preview && (
                  <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.65, marginTop: 6, fontStyle: "italic" }}>
                    {preview}…
                  </div>
                )}
                {(k.tags || []).length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                    {(k.tags || []).map(tagId => {
                      const tag = getKnowledgeTag(tagId);
                      return (
                        <span key={tagId} style={{ background: tag.bg, color: tag.color, padding: "2px 10px", borderRadius: T.radiusPill, fontSize: 10, fontWeight: 500 }}>
                          {lang === "zh" ? tag.zh : tag.ja}
                        </span>
                      );
                    })}
                  </div>
                )}
                {(k.relatedRecipes || []).length > 0 && (
                  <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 8, letterSpacing: "0.3px" }}>
                    📎 {k.relatedRecipes.slice(0, 3).join(" · ")}{k.relatedRecipes.length > 3 ? ` +${k.relatedRecipes.length - 3}` : ""}
                  </div>
                )}
                {(k.imageUrls || []).length > 0 && (
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>
                    📷 {k.imageUrls.length} {lang === "zh" ? "张图" : "枚画像"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 知识点详情 ─────────────────────────────────────────────
function KnowledgeDetail({ item: k, lang, onEdit, onBack, onNavigate, recipes, components, creations }) {
  const title = pickLang(k, "title", lang);
  const content = pickLang(k, "content", lang);
  const titleOther = rawLang(k, "title", lang);

  // 智能匹配：在 recipes / components / creations 中查找对应项
  // 使用关键词匹配：只要关联名和候选项名称有共同的关键词就算匹配
  const findMatch = (relatedName) => {
    const q = (relatedName || "").toLowerCase().trim();
    if (!q) return null;

    // 提取关键词：去掉括号、特殊符号后的主要词
    const extractKeywords = (str) => {
      const cleaned = (str || "").toLowerCase()
        .replace(/[（）()【】\[\]・·、,， ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return cleaned.split(" ").filter(w => w.length >= 2);
    };

    const qKeywords = extractKeywords(q);
    if (qKeywords.length === 0) return null;

    // 匹配逻辑：候选项的名字中包含关联名的任何一个关键词，或反之
    const matchName = (item) => {
      const itemNames = [item.nameZh, item.nameJa, item.nameFr].filter(Boolean).map(n => n.toLowerCase());
      for (const name of itemNames) {
        // 完整包含
        if (name.includes(q) || q.includes(name)) return true;
        // 关键词交集
        const nameKeywords = extractKeywords(name);
        for (const kw of qKeywords) {
          if (kw.length >= 2 && nameKeywords.some(nk => nk.includes(kw) || kw.includes(nk))) return true;
        }
      }
      return false;
    };

    for (const r of (recipes || [])) if (matchName(r)) return { type: "recipe", item: r };
    for (const c of (components || [])) if (matchName(c)) return { type: "component", item: c };
    for (const cr of (creations || [])) if (matchName(cr)) return { type: "creation", item: cr };
    return null;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase" }}>
          {lang === "zh" ? "知识点详情" : "ナレッジ詳細"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn size="sm" onClick={onEdit}>{lang === "zh" ? "编辑" : "編集"}</Btn>
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      <div style={{
        background: T.bgCard,
        border: `0.5px solid ${T.border}`,
        borderRadius: T.radiusLg,
        padding: "2rem 1.75rem",
        marginBottom: "1rem",
        borderLeft: `3px solid ${T.accentSoft}`,
      }}>
        {/* 大标题 */}
        <div style={{ fontFamily: T.fontSerif, fontSize: 26, fontWeight: 500, color: T.textPrimary, lineHeight: 1.3, letterSpacing: "-0.3px" }}>
          {title}
        </div>
        {titleOther && titleOther !== title && (
          <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 6, fontStyle: "italic" }}>{titleOther}</div>
        )}

        {/* 标签 */}
        {(k.tags || []).length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
            {(k.tags || []).map(tagId => {
              const tag = getKnowledgeTag(tagId);
              return (
                <span key={tagId} style={{ background: tag.bg, color: tag.color, padding: "3px 12px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500 }}>
                  {lang === "zh" ? tag.zh : tag.ja}
                </span>
              );
            })}
          </div>
        )}

        {/* 分隔线 */}
        <div style={{ height: 1, background: T.borderSoft, margin: "20px 0" }}></div>

        {/* 内容 */}
        <div style={{ fontSize: 14, color: T.textPrimary, lineHeight: 1.95, whiteSpace: "pre-wrap", fontFamily: T.fontSans }}>{content}</div>

        {/* 📷 参考图片 */}
        {(k.imageUrls || []).length > 0 && (
          <div style={{ marginTop: 20 }}>
            <ImageUrlsDisplay urls={k.imageUrls} />
          </div>
        )}

        {/* 关联配方 - 可点击跳转 */}
        {(k.relatedRecipes || []).length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "0.5px solid #E5E5E5" }}>
            <div style={{ fontSize: 12, color: "#666666", marginBottom: 8, fontWeight: 500 }}>📎 关联配方 / 関連レシピ（点击跳转）</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {k.relatedRecipes.map((r, i) => {
                const match = findMatch(r);
                if (match && onNavigate) {
                  const typeLabel = { recipe: "配方", component: "组件", creation: "蛋糕" }[match.type];
                  const typeBg = { recipe: "#DBEAFE", component: "#D1FAE5", creation: "#FCE7F3" }[match.type];
                  const typeColor = { recipe: "#1E40AF", component: "#065F46", creation: "#9D174D" }[match.type];
                  return (
                    <button
                      key={i}
                      onClick={() => onNavigate(match.type, match.item.id)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: typeBg, color: typeColor, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}
                    >
                      <span style={{ fontSize: 10, opacity: 0.7 }}>[{typeLabel}]</span>
                      {r}
                      <span style={{ fontSize: 10, opacity: 0.7 }}>→</span>
                    </button>
                  );
                }
                // 未找到匹配项，只显示标签
                return <span key={i} style={{ background: "#F5F5F5", color: "#888888", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontStyle: "italic" }} title="未找到对应项">{r}</span>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 知识点编辑 Form ────────────────────────────────────────
function KnowledgeEditForm({ item, onSave, onDelete, onBack, recipes = [], components = [], creations = [], lang = "zh" }) {
  const [errorMsg, setErrorMsg] = useState("");
  const isNew = !item;
  const empty = { titleZh: "", titleJa: "", tags: [], relatedRecipes: [], contentZh: "", contentJa: "", imageUrls: [] };
  const [form, setForm] = useState(item ? { imageUrls: [], ...item, tags: item.tags || [], relatedRecipes: item.relatedRecipes || [] } : empty);
  const [relatedInput, setRelatedInput] = useState("");

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };

  const toggleTag = (tagId) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter(t => t !== tagId) : [...prev.tags, tagId]
    }));
  };

  const addRelated = () => {
    if (!relatedInput.trim()) return;
    setForm(prev => ({ ...prev, relatedRecipes: [...prev.relatedRecipes, relatedInput.trim()] }));
    setRelatedInput("");
  };

  const removeRelated = (i) => {
    setForm(prev => ({ ...prev, relatedRecipes: prev.relatedRecipes.filter((_, idx) => idx !== i) }));
  };

  const handleSave = () => {
    if (!form.titleZh.trim()) {
      setErrorMsg("请输入标题");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    if (!form.contentZh.trim()) {
      setErrorMsg("请输入内容");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    onSave({
      ...form,
      id: item ? item.id : "k_" + Date.now(),
      createdAt: item?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{isNew ? "新增知识点" : "编辑知识点"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isNew && <Btn variant="danger" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* 💡 懒人模式提示 */}
      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：中日文任一填写即可，不必两种都填。标题和内容都是如此。
      </div>

      {/* 标题 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>标题（中文）</label>
            <input value={form.titleZh} onChange={f("titleZh")} placeholder="例：板ゼラチン温度带资料" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>标题（日本語）</label>
            <input value={form.titleJa} onChange={f("titleJa")} placeholder="例：板ゼラチンの温度帯" style={inpStyle} />
          </div>
        </div>
      </div>

      {/* 标签 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>标签（多选）</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {KNOWLEDGE_TAGS.map(tag => {
            const active = form.tags.includes(tag.id);
            return (
              <button key={tag.id} onClick={() => toggleTag(tag.id)} style={{ padding: "5px 14px", fontSize: 12, border: `1.5px solid ${active ? tag.color : "#CCCCCC"}`, borderRadius: 20, background: active ? tag.bg : "#FFFFFF", color: active ? tag.color : "#111111", cursor: "pointer", fontWeight: active ? 500 : 400 }}>
                {active ? "✓ " : ""}{tag.zh}
              </button>
            );
          })}
          {/* 显示用户自定义标签 */}
          {form.tags.filter(t => !KNOWLEDGE_TAGS.find(kt => kt.id === t)).map(customTag => (
            <button key={customTag} onClick={() => toggleTag(customTag)} style={{ padding: "5px 14px", fontSize: 12, border: "1.5px solid #8B5CF6", borderRadius: 20, background: "#F3E8FF", color: "#6D28D9", cursor: "pointer", fontWeight: 500 }}>
              ✓ {customTag}
            </button>
          ))}
        </div>
        {/* 自定义标签输入 */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="text"
            placeholder="或输入自定义标签，回车添加"
            onKeyDown={e => {
              if (e.key === "Enter" && e.target.value.trim()) {
                const newTag = e.target.value.trim();
                if (!form.tags.includes(newTag)) {
                  setForm(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
                }
                e.target.value = "";
              }
            }}
            style={{ flex: 1, padding: "6px 10px", fontSize: 12, border: "0.5px solid #CCCCCC", borderRadius: 6, background: "#FFFFFF", color: "#111111", fontFamily: "system-ui, sans-serif" }}
          />
          <span style={{ fontSize: 11, color: "#999999" }}>回车添加</span>
        </div>
      </div>

      {/* 内容 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>内容</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "中文内容" : "中国語内容"}</label>
          <textarea value={form.contentZh} onChange={f("contentZh")} placeholder="用【】来分节。例：&#10;【核心内容】&#10;..." style={{...inpStyle, minHeight: 200, resize: "vertical", fontFamily: "system-ui, monospace"}} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "日文内容" : "日本語内容"}</label>
          <textarea value={form.contentJa} onChange={f("contentJa")} placeholder="【】で節分け" style={{...inpStyle, minHeight: 200, resize: "vertical", fontFamily: "system-ui, monospace"}} />
        </div>
      </div>

      {/* 📷 参考图片 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>{lang === "zh" ? "📷 参考图片" : "📷 参考画像"}</div>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 10 }}>支持粘贴图片 URL（Instagram/Imgur/自己云盘的链接）。每张图可加说明。</div>
        <ImageUrlsEditor
          urls={form.imageUrls || []}
          onChange={(urls) => setForm(prev => ({ ...prev, imageUrls: urls }))}
        />
      </div>

      {/* 关联配方 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>关联配方 / 组件 / 蛋糕</div>

        {/* 从现有数据中选择（可点击跳转的核心） */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>从已有项目选择（推荐）</label>
          <select
            onChange={e => {
              if (e.target.value) {
                const [type, name] = e.target.value.split("||");
                if (!form.relatedRecipes.includes(name)) {
                  setForm(prev => ({ ...prev, relatedRecipes: [...prev.relatedRecipes, name] }));
                }
                e.target.value = "";
              }
            }}
            defaultValue=""
            style={{...inpStyle, cursor: "pointer"}}
          >
            <option value="">-- 选择一项自动添加 --</option>
            {recipes.length > 0 && (
              <optgroup label="📘 配方">
                {recipes.map(r => {
                  const name = r.nameZh || r.nameJa;
                  return <option key={r.id} value={`recipe||${name}`}>{name}</option>;
                })}
              </optgroup>
            )}
            {components.length > 0 && (
              <optgroup label="📦 组件">
                {components.map(c => {
                  const name = c.nameZh || c.nameJa;
                  return <option key={c.id} value={`component||${name}`}>{name}</option>;
                })}
              </optgroup>
            )}
            {creations.length > 0 && (
              <optgroup label="🎂 组合蛋糕">
                {creations.map(cr => {
                  const name = cr.nameZh || cr.nameJa;
                  return <option key={cr.id} value={`creation||${name}`}>{name}</option>;
                })}
              </optgroup>
            )}
          </select>
        </div>

        {/* 手动输入（备选） */}
        <div>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>手动输入（用于还未录入的配方）</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={relatedInput}
              onChange={e => setRelatedInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addRelated())}
              placeholder="输入后按回车或点添加"
              style={{...inpStyle, flex: 1}}
            />
            <Btn onClick={addRelated}>添加</Btn>
          </div>
        </div>

        {form.relatedRecipes.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {form.relatedRecipes.map((r, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F5F5F5", padding: "4px 10px", borderRadius: 20, fontSize: 12 }}>
                {r}
                <button onClick={() => removeRelated(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#999999", fontSize: 14, padding: 0, marginLeft: 2 }}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
        {errorMsg && <span style={{ color: "#A32D2D", fontSize: 13, marginRight: 8 }}>⚠ {errorMsg}</span>}
        <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        <Btn variant="primary" onClick={handleSave}>{lang === "zh" ? "保存知识点" : "ナレッジ保存"}</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 📚 材料百科模块
// ═══════════════════════════════════════════════════════════════

// ─── 自动联动：计算材料的使用场景 ─────────────
function getUsageScenes(material, recipes, components, creations) {
  const results = [];
  // 🔗 优先:materialId 精确匹配
  const mid = material.id;
  // 回退:名字匹配(老配方兼容)
  const matchName = (ing) => {
    // 如果这个 ing 已经 materialId 关联别的 → 不再按名字匹配(避免重复)
    if (ing.materialId && ing.materialId !== mid) return false;
    const n1 = (ing.nameZh || "").trim().toLowerCase();
    const n2 = (ing.nameJa || "").trim().toLowerCase();
    const mn1 = (material.nameZh || "").trim().toLowerCase();
    const mn2 = (material.nameJa || "").trim().toLowerCase();
    const bn = (ing.brand || "").trim().toLowerCase();
    const mbn = (material.productBrandName || "").trim().toLowerCase();
    const nameMatch = (mn1 && (n1.includes(mn1) || mn1.includes(n1))) ||
                      (mn2 && (n2.includes(mn2) || mn2.includes(n2)));
    if (!nameMatch) return false;
    if (mbn && bn && !bn.includes(mbn) && !mbn.includes(bn)) return false;
    return true;
  };
  // 如果 ing 有 materialId,用它精确匹配;否则用名字
  const isMatch = (ing) => {
    if (ing.materialId) return ing.materialId === mid;
    return matchName(ing);
  };

  recipes.forEach(r => {
    (r.ingredients || []).forEach(ing => {
      if (isMatch(ing)) results.push({ type: "recipe", id: r.id, name: r.nameZh || r.nameJa, qty: ing.qty, unit: ing.unit, linked: !!ing.materialId });
    });
  });
  components.forEach(c => {
    (c.ingredients || []).forEach(ing => {
      if (isMatch(ing)) results.push({ type: "component", id: c.id, name: c.nameZh || c.nameJa, qty: ing.qty, unit: ing.unit, linked: !!ing.materialId });
    });
  });
  creations.forEach(cr => {
    (cr.layers || []).forEach(l => {
      (l.ingredients || []).forEach(ing => {
        if (isMatch(ing)) results.push({ type: "creation", id: cr.id, name: cr.nameZh || cr.nameJa, layerName: l.nameZh || l.nameJa, qty: ing.qty, unit: ing.unit, linked: !!ing.materialId });
      });
    });
  });
  return results;
}

// ─── 材料百科主视图 ─────────────
// [B7 修复] brandFilter / searchQ 提升到 App,从详情返回不丢筛选
function MaterialsView({ brands, setBrands, materials, setMaterials, shopMaterials = [], setShopMaterials, recipes, components, creations, lang, setLang, confirmDialog, showToast,
  categoryFilter, setCategoryFilter,
  subcategoryFilter, setSubcategoryFilter,
  brandFilter = "", setBrandFilter = () => {},
  searchQ = "", setSearchQ = () => {},
  brandViewId, setBrandViewId, brandEditTarget, setBrandEditTarget,
  materialViewId, setMaterialViewId, materialEditTarget, setMaterialEditTarget,
  materialReturnTo, setMaterialReturnTo,
  setTab, setViewId }) {

  // 编辑厂家
  if (brandEditTarget !== null) {
    return <BrandEditForm
      brand={brandEditTarget === "new" ? null : brandEditTarget}
      defaultCategory={categoryFilter}
      onSave={(b) => {
        setBrands(prev => {
          const found = prev.find(x => x.id === b.id);
          return found ? prev.map(x => x.id === b.id ? b : x) : [...prev, b];
        });
        showToast("✓ 厂家已保存");
        setBrandViewId(b.id);
        setBrandEditTarget(null);
      }}
      onDelete={() => {
        confirmDialog("删除这个厂家吗？其产品将被一并删除。", () => {
          setBrands(prev => prev.filter(x => x.id !== brandEditTarget.id));
          setMaterials(prev => prev.filter(x => x.brandId !== brandEditTarget.id));
          showToast("已删除");
          setBrandEditTarget(null);
          setBrandViewId(null);
        });
      }}
      onBack={() => setBrandEditTarget(null)}
    />;
  }

  // 编辑产品
  if (materialEditTarget !== null) {
    return <MaterialEditForm
      material={materialEditTarget === "new" ? null : materialEditTarget}
      brandId={brandViewId}
      brands={brands}
      onSave={(m) => {
        setMaterials(prev => {
          const found = prev.find(x => x.id === m.id);
          return found ? prev.map(x => x.id === m.id ? m : x) : [...prev, m];
        });
        showToast("✓ 产品已保存");
        setMaterialViewId(m.id);
        setMaterialEditTarget(null);
      }}
      onDelete={() => {
        confirmDialog("删除这个产品吗？", () => {
          setMaterials(prev => prev.filter(x => x.id !== materialEditTarget.id));
          showToast("已删除");
          setMaterialEditTarget(null);
          setMaterialViewId(null);
        });
      }}
      onBack={() => setMaterialEditTarget(null)}
    />;
  }

  // 产品详情
  if (materialViewId) {
    const m = materials.find(x => x.id === materialViewId);
    if (m) return <MaterialDetail
      material={m}
      brand={brands.find(b => b.id === m.brandId)}
      allMaterials={materials}
      recipes={recipes}
      components={components}
      creations={creations}
      lang={lang}
      onEdit={() => setMaterialEditTarget(m)}
      onBack={() => {
        // v11: 如果是从配方/组件跳转过来的,回到源头;否则回百科列表
        if (materialReturnTo && typeof setTab === "function") {
          if (materialReturnTo.viewId != null && typeof setViewId === "function") setViewId(materialReturnTo.viewId);
          setTab(materialReturnTo.tab);
          if (typeof setMaterialReturnTo === "function") setMaterialReturnTo(null);
        }
        setMaterialViewId(null);
      }}
      onNavigateToMaterial={(id) => setMaterialViewId(id)}
      shopMaterials={shopMaterials}
      setShopMaterials={setShopMaterials}
      showToast={showToast}
      returnLabel={materialReturnTo && materialReturnTo.tab === "view" ? (lang === "zh" ? "← 返回配方" : "← レシピへ戻る") : null}
    />;
  }

  // 厂家详情 + 产品列表
  if (brandViewId) {
    const b = brands.find(x => x.id === brandViewId);
    if (b) return <BrandDetail
      brand={b}
      materials={materials.filter(m => m.brandId === brandViewId)}
      allMaterials={materials}
      recipes={recipes}
      components={components}
      creations={creations}
      lang={lang}
      onEdit={() => setBrandEditTarget(b)}
      onBack={() => { setBrandViewId(null); setCategoryFilter(b.categoryId); }}
      onAddMaterial={() => setMaterialEditTarget("new")}
      onViewMaterial={(id) => setMaterialViewId(id)}
      onEditMaterial={(m) => setMaterialEditTarget(m)}
    />;
  }

  // 厂家列表(某分类下)
  if (categoryFilter) {
    return <CategoryDetailView
      categoryId={categoryFilter}
      brands={brands}
      materials={materials}
      recipes={recipes}
      components={components}
      creations={creations}
      lang={lang}
      subcategoryFilter={subcategoryFilter}
      setSubcategoryFilter={setSubcategoryFilter}
      setCategoryFilter={setCategoryFilter}
      brandFilter={brandFilter}
      setBrandFilter={setBrandFilter}
      searchQ={searchQ}
      setSearchQ={setSearchQ}
      setBrandViewId={setBrandViewId}
      setBrandEditTarget={setBrandEditTarget}
      setMaterialViewId={setMaterialViewId}
      setMaterialEditTarget={setMaterialEditTarget}
    />;
  }

  // 大分类列表（首页）
  return <MaterialsHomeView
    brands={brands}
    materials={materials}
    lang={lang}
    setCategoryFilter={setCategoryFilter}
    setBrandViewId={setBrandViewId}
    setMaterialViewId={setMaterialViewId}
  />;
}

// ═══ 材料百科首页(含全局搜索)═══
function MaterialsHomeView({ brands, materials, lang, setCategoryFilter, setBrandViewId, setMaterialViewId }) {
  const [searchQ, setSearchQ] = useState("");
  const q = searchQ.trim().toLowerCase();

  // 计算搜索结果
  const searchResults = useMemo(() => {
    if (!q) return { brands: [], materials: [] };
    const matchedBrands = brands.filter(b => {
      const hay = `${b.nameZh || ""} ${b.nameJa || ""} ${b.nameFr || ""} ${b.origin || ""}`.toLowerCase();
      return hay.includes(q);
    }).slice(0, 20);
    const matchedMaterials = materials.filter(m => {
      const hay = `${m.nameZh || ""} ${m.nameJa || ""} ${m.nameFr || ""}`.toLowerCase();
      return hay.includes(q);
    }).slice(0, 30);
    return { brands: matchedBrands, materials: matchedMaterials };
  }, [q, brands, materials]);

  // v57 性能优化:预聚合每个 category 的 brand/product 数量
  // 原来每次渲染 MATERIAL_CATEGORIES.map 里都 brands.filter().length,
  // 14 个分类 × (397 brands + 1416 materials) ≈ 25000 次比较每次重渲染
  const categoryCounts = useMemo(() => {
    const counts = {};
    brands.forEach(b => {
      if (!b.categoryId) return;
      if (!counts[b.categoryId]) counts[b.categoryId] = { brandCount: 0, productCount: 0 };
      counts[b.categoryId].brandCount++;
    });
    materials.forEach(m => {
      if (!m.categoryId) return;
      if (!counts[m.categoryId]) counts[m.categoryId] = { brandCount: 0, productCount: 0 };
      counts[m.categoryId].productCount++;
    });
    return counts;
  }, [brands, materials]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 2 }}>
            {lang === "zh" ? "原料库" : "材料ライブラリー"}
          </div>
          <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.brand, letterSpacing: "-0.3px" }}>
            {lang === "zh" ? "📚 材料百科" : "📚 材料事典"}
          </div>
        </div>
        <div style={{ fontSize: 11, color: T.textTertiary }}>
          {brands.length} {lang === "zh" ? "家厂商" : "社"} · {materials.length} {lang === "zh" ? "产品" : "製品"}
        </div>
      </div>

      {/* 🔍 全局搜索框 */}
      <div style={{ marginBottom: "1.25rem", position: "relative" }}>
        <input
          type="text"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder={lang === "zh" ? "🔍 搜索厂家或产品(名称/原产地/法语名 任选)..." : "🔍 メーカー・製品 検索..."}
          style={{
            width: "100%",
            padding: "10px 14px",
            fontSize: 13,
            border: `0.5px solid ${T.border}`,
            borderRadius: T.radius,
            background: T.bgCard,
            fontFamily: T.fontSans,
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
          onBlur={(e) => e.currentTarget.style.borderColor = T.border}
        />
        {searchQ && (
          <button
            onClick={() => setSearchQ("")}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 16, color: T.textTertiary, padding: "4px 8px",
            }}
            title={lang === "zh" ? "清除" : "クリア"}
          >×</button>
        )}
      </div>

      {/* 搜索结果显示 */}
      {q && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 10, fontWeight: 500 }}>
            {lang === "zh"
              ? `🔎 搜索 「${searchQ}」· 匹配 ${searchResults.brands.length} 厂家、${searchResults.materials.length} 产品`
              : `🔎 「${searchQ}」· ${searchResults.brands.length} 社 · ${searchResults.materials.length} 製品`
            }
          </div>

          {/* 厂家结果 */}
          {searchResults.brands.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "0.5px", marginBottom: 6 }}>
                {lang === "zh" ? "厂家" : "メーカー"}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {searchResults.brands.map(b => {
                  const cat = getMaterialCat(b.categoryId);
                  const productN = materials.filter(m => m.brandId === b.id).length;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setBrandViewId(b.id)}
                      style={{
                        padding: "7px 12px", fontSize: 12,
                        border: `0.5px solid ${T.border}`,
                        borderLeft: `3px solid ${cat ? cat.color : T.accentSoft}`,
                        borderRadius: T.radius,
                        background: T.bgCard,
                        cursor: "pointer",
                        fontFamily: T.fontSans,
                        color: T.textPrimary,
                        textAlign: "left",
                      }}
                    >
                      {cat ? cat.icon : ""} <strong>{lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)}</strong>
                      <span style={{ color: T.textTertiary, marginLeft: 6, fontSize: 10 }}>
                        {b.origin ? `· ${b.origin}` : ""} · {productN} {lang === "zh" ? "品" : "品"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 产品结果 */}
          {searchResults.materials.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "0.5px", marginBottom: 6 }}>
                {lang === "zh" ? "产品" : "製品"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
                {searchResults.materials.map(m => {
                  const b = brands.find(x => x.id === m.brandId);
                  const cat = getMaterialCat(m.categoryId);
                  const firstImg = Array.isArray(m.imageUrls) && m.imageUrls.length > 0 ? m.imageUrls[0] : null;
                  const mNm = lang === "zh" ? (m.nameZh || m.nameJa) : (m.nameJa || m.nameZh);
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMaterialViewId(m.id)}
                      style={{
                        padding: "8px 10px", fontSize: 12,
                        border: `0.5px solid ${T.border}`,
                        borderLeft: `3px solid ${m.isBest ? "#059669" : (cat ? cat.color : T.accentSoft)}`,
                        borderRadius: T.radius,
                        background: T.bgCard,
                        cursor: "pointer",
                        fontFamily: T.fontSans,
                        textAlign: "left",
                        color: T.textPrimary,
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      {firstImg && (
                        <ImageThumb
                          img={firstImg}
                          alt={mNm}
                          style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0, border: `0.5px solid ${T.border}` }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, lineHeight: 1.3 }}>
                          {m.isBest && <span style={{ color: "#059669" }}>⭐ </span>}
                          {mNm}
                        </div>
                        <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 2 }}>
                          {cat ? cat.icon : ""} {b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2a §09 筛选无结果：把生效条件摆出来能摘掉，不给「新建」按钮 —— 东西是有的，只是被筛掉了 */}
          {searchResults.brands.length === 0 && searchResults.materials.length === 0 && (
            <EmptyState
              variant="filter" lang={lang}
              title={lang === "zh" ? "没有匹配的材料" : "一致する材料がありません"}
              hint={lang === "zh" ? `在 ${materials.length} 种材料 / ${brands.length} 个品牌里都没找到` : `材料 ${materials.length} 件 / ブランド ${brands.length} 件から見つかりません`}
              chips={[{ label: `“${searchQ}”`, onRemove: () => setSearchQ("") }]}
              onClearAll={() => setSearchQ("")}
            />
          )}

          <div style={{ borderBottom: `0.5px solid ${T.border}`, marginTop: "1.25rem" }} />
        </div>
      )}

      {!q && (
        <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: "1.25rem", lineHeight: 1.7, fontStyle: "italic", padding: "10px 14px", background: T.bgMuted, borderRadius: T.radius, borderLeft: `2px solid ${T.accentSoft}` }}>
          {lang === "zh" ? "按分类 → 厂家 → 产品 三层结构管理原材料库，查看使用场景和横向对比。" : "カテゴリー → メーカー → 製品の3階層で材料を管理。"}
        </div>
      )}

      {/* 大分类网格(搜索时缩小) */}
      <div style={{
        fontSize: 11, color: T.textTertiary, letterSpacing: "1px", textTransform: "uppercase",
        marginBottom: 8, display: q ? "block" : "none"
      }}>
        {lang === "zh" ? "浏览大分类" : "カテゴリー一覧"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
        {MATERIAL_CATEGORIES.map(cat => {
          const c = categoryCounts[cat.id] || { brandCount: 0, productCount: 0 };
          const brandCount = c.brandCount;
          const productCount = c.productCount;
          return (
            <div
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              style={{
                background: T.bgCard,
                border: `0.5px solid ${T.border}`,
                borderLeft: `3px solid ${cat.color}`,
                borderRadius: T.radiusLg,
                padding: "18px 14px",
                cursor: "pointer",
                textAlign: "center",
                transition: "transform 0.12s, border-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</div>
              <div style={{ fontFamily: T.fontSerif, fontSize: 15, fontWeight: 500, color: cat.color, marginBottom: 4 }}>{lang === "zh" ? cat.zh : cat.ja}</div>
              <div style={{ fontSize: 10, color: T.textTertiary, letterSpacing: "0.5px" }}>
                {brandCount} {lang === "zh" ? "家" : "社"} · {productCount} {lang === "zh" ? "产品" : "製品"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══ 材料百科选择弹窗 (配方 ingredient 用它来关联) ═══
function MaterialPickerModal({ materials, brands, currentMaterialId, lang, onSelect, onClose }) {
  const [searchQ, setSearchQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");

  const q = searchQ.trim().toLowerCase();

  // 过滤
  const filtered = useMemo(() => {
    let list = materials;
    if (catFilter) list = list.filter(m => m.categoryId === catFilter);
    if (brandFilter) list = list.filter(m => m.brandId === brandFilter);
    if (q) {
      list = list.filter(m => {
        const hay = `${m.nameZh || ""} ${m.nameJa || ""} ${m.nameFr || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    // 排序: isBest 优先 > rating > 名字
    return [...list].sort((a, b) => {
      if ((b.isBest ? 1 : 0) !== (a.isBest ? 1 : 0)) return (b.isBest ? 1 : 0) - (a.isBest ? 1 : 0);
      if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
      return (a.nameZh || a.nameJa || "").localeCompare(b.nameZh || b.nameJa || "");
    }).slice(0, 100); // 最多 100 条结果
  }, [materials, q, catFilter, brandFilter]);

  // 动态取可选厂家 (根据当前 catFilter)
  const availableBrands = useMemo(() => {
    const brandIds = new Set();
    materials.forEach(m => {
      if (!catFilter || m.categoryId === catFilter) brandIds.add(m.brandId);
    });
    return brands.filter(b => brandIds.has(b.id))
      .sort((a, b) => (a.nameZh || a.nameJa || "").localeCompare(b.nameZh || b.nameJa || ""));
  }, [materials, brands, catFilter]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.4)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.bgCard, borderRadius: T.radiusLg, padding: "1.25rem",
          width: "100%", maxWidth: 720, maxHeight: "85vh",
          display: "flex", flexDirection: "column", gap: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: T.fontSerif, fontSize: 16, fontWeight: 500, color: T.brand }}>
            {lang === "zh" ? "🔗 从材料百科选择" : "🔗 材料事典から選択"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.textTertiary, padding: "4px 8px" }}>×</button>
        </div>

        {/* 搜索 + 过滤器 */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={lang === "zh" ? "🔍 搜索产品名..." : "🔍 製品名検索..."}
            autoFocus
            style={{
              flex: "2 1 200px", padding: "8px 12px", fontSize: 12,
              border: `0.5px solid ${T.border}`, borderRadius: T.radius,
              outline: "none", fontFamily: T.fontSans,
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
            onBlur={(e) => e.currentTarget.style.borderColor = T.border}
          />
          <select
            value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); setBrandFilter(""); }}
            style={{
              flex: "1 1 130px", padding: "8px 10px", fontSize: 12,
              border: `0.5px solid ${catFilter ? T.accent : T.border}`,
              borderRadius: T.radius, background: T.bgCard,
              color: catFilter ? T.accent : T.textSecondary, cursor: "pointer",
            }}
          >
            <option value="">{lang === "zh" ? "全部分类" : "全カテゴリー"}</option>
            {MATERIAL_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {lang === "zh" ? c.zh : c.ja}</option>
            ))}
          </select>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            style={{
              flex: "1 1 130px", padding: "8px 10px", fontSize: 12,
              border: `0.5px solid ${brandFilter ? T.accent : T.border}`,
              borderRadius: T.radius, background: T.bgCard,
              color: brandFilter ? T.accent : T.textSecondary, cursor: "pointer",
            }}
          >
            <option value="">{lang === "zh" ? "全部厂家" : "全メーカー"}</option>
            {availableBrands.map(b => (
              <option key={b.id} value={b.id}>{lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)}</option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: 11, color: T.textTertiary }}>
          {lang === "zh"
            ? `匹配 ${filtered.length} / ${materials.length} 产品 ${filtered.length === 100 ? "(仅显示前 100)" : ""}`
            : `${filtered.length} / ${materials.length} ${filtered.length === 100 ? "(上限 100)" : ""}`}
        </div>

        {/* 结果列表 */}
        <div style={{ overflowY: "auto", flex: 1, border: `0.5px solid ${T.border}`, borderRadius: T.radius }}>
          {filtered.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: T.textTertiary, fontSize: 12 }}>
              {lang === "zh" ? "未找到匹配材料" : "一致なし"}
            </div>
          )}
          {filtered.map(m => {
            const b = brands.find(x => x.id === m.brandId);
            const cat = getMaterialCat(m.categoryId);
            const isCurrent = currentMaterialId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => onSelect(m)}
                style={{
                  padding: "10px 14px",
                  borderBottom: `0.5px solid ${T.borderSoft}`,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  background: isCurrent ? T.bgSoft : T.bgCard,
                  borderLeft: `3px solid ${m.isBest ? "#059669" : (cat ? cat.color : "transparent")}`,
                }}
                onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = T.bgMuted; }}
                onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = T.bgCard; }}
              >
                <div style={{ fontSize: 18 }}>{cat ? cat.icon : "📦"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary }}>
                    {m.isBest && <span style={{ color: "#059669", marginRight: 3 }}>⭐</span>}
                    {m.isCouverture && <span style={{ color: "#B45309", marginRight: 3 }}>🏆</span>}
                    {lang === "zh" ? (m.nameZh || m.nameJa) : (m.nameJa || m.nameZh)}
                  </div>
                  <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 2 }}>
                    {b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : ""}
                    {m.pricePerG ? " · " + fmtUnitPrice(m.pricePerG, curOf(m)) : ""}
                    {m.rating ? ` · ${"★".repeat(m.rating)}` : ""}
                  </div>
                </div>
                {isCurrent && (
                  <div style={{ fontSize: 10, color: T.accent, padding: "2px 6px", background: T.bgSoft, borderRadius: 3 }}>
                    {lang === "zh" ? "当前" : "現在"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 10, color: T.textTertiary, fontStyle: "italic" }}>
            {lang === "zh" ? "💡 选中后自动填入名称、品牌、单价;百科价格变动时配方成本自动更新" : "💡 選択で自動入力、百科更新時に自動連動"}
          </div>
          {currentMaterialId && (
            <button
              onClick={() => onSelect(null)}
              style={{
                padding: "6px 12px", fontSize: 11, color: "#DC2626",
                background: "#FEE2E2", border: "0.5px solid #FCA5A5",
                borderRadius: T.radius, cursor: "pointer", fontFamily: T.fontSans,
              }}
            >
              {lang === "zh" ? "✕ 取消关联" : "✕ 関連解除"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ 批量智能匹配弹窗:一键扫描配方 ingredient 匹配到百科 ═══
function BulkMatchModal({ ings, materials, brands, lang, onApply, onClose }) {
  // [B3 修复] 弹窗打开时锁 body 滚动,关闭时恢复 — 防手机滑动穿透
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, []);

  // 对所有未关联的 ing 进行智能匹配
  const analysis = useMemo(() => {
    return ings
      .filter(ing => !ing.materialId && (ing.nameZh || ing.nameJa))
      .map(ing => ({
        ing,
        candidates: smartMatchMaterial(ing, materials, brands),
      }));
  }, [ings, materials, brands]);

  // 用户选中的映射: { [ing._id]: materialId | null }
  const [selections, setSelections] = useState(() => {
    const init = {};
    analysis.forEach(({ ing, candidates }) => {
      // 默认:匹配度 >= 70 自动选最高的一个
      if (candidates.length > 0 && candidates[0].score >= 70) {
        init[ing._id] = candidates[0].material.id;
      } else {
        init[ing._id] = null; // 不自动关联,让用户选
      }
    });
    return init;
  });

  const autoMatchCount = Object.values(selections).filter(v => v !== null).length;
  const totalCount = analysis.length;

  if (totalCount === 0) {
    return (
      <div onClick={onClose} style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.4)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          background: T.bgCard, borderRadius: T.radiusLg, padding: "1.5rem",
          width: "100%", maxWidth: 500, textAlign: "center",
        }}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 10 }}>
            {lang === "zh" ? "✅ 所有材料都已关联百科" : "✅ 全材料が事典連動済"}
          </div>
          <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 16 }}>
            {lang === "zh" ? "本配方没有需要批量匹配的材料。" : "一括マッチ対象なし。"}
          </div>
          <Btn onClick={onClose}>{lang === "zh" ? "关闭" : "閉じる"}</Btn>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.4)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bgCard, borderRadius: T.radiusLg, padding: "1.25rem",
        width: "100%", maxWidth: 820, maxHeight: "88vh",
        display: "flex", flexDirection: "column", gap: 10,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: T.fontSerif, fontSize: 16, fontWeight: 500, color: T.brand }}>
            {lang === "zh" ? "🤖 智能批量关联材料百科" : "🤖 一括スマート関連"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.textTertiary, padding: "4px 8px" }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary, background: T.bgMuted, padding: "10px 14px", borderRadius: T.radius, lineHeight: 1.7 }}>
          {lang === "zh"
            ? `🔍 共扫描 ${totalCount} 个未关联材料,AI 自动匹配了 ${autoMatchCount} 个高可信度结果(分数 ≥ 70)。请检查下方每一项并调整,然后点「应用」。`
            : `${totalCount} 件スキャン、${autoMatchCount} 件が高信頼(≥ 70)で自動選択。下記確認して「適用」。`}
        </div>

        <div style={{ overflowY: "auto", flex: 1, border: `0.5px solid ${T.border}`, borderRadius: T.radius }}>
          {analysis.map(({ ing, candidates }) => {
            const ingName = lang === "zh" ? (ing.nameZh || ing.nameJa) : (ing.nameJa || ing.nameZh);
            const selectedId = selections[ing._id];
            return (
              <div key={ing._id} style={{
                padding: "10px 14px", borderBottom: `0.5px solid ${T.borderSoft}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {ingName}
                    {ing.brand && <span style={{ color: T.textTertiary, marginLeft: 8, fontSize: 11 }}>· {ing.brand}</span>}
                    {ing.qty && <span style={{ color: T.textTertiary, marginLeft: 8, fontSize: 11 }}>{ing.qty}{ing.unit}</span>}
                  </div>
                  {selectedId && (
                    <span style={{ fontSize: 10, background: "#059669", color: "#fff", padding: "2px 6px", borderRadius: 3 }}>
                      ✓ {lang === "zh" ? "将关联" : "関連"}
                    </span>
                  )}
                </div>
                {candidates.length === 0 && (
                  <div style={{ fontSize: 11, color: T.textTertiary, fontStyle: "italic", padding: "4px 0" }}>
                    {lang === "zh" ? "未在百科找到匹配" : "該当なし"}
                  </div>
                )}
                {candidates.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 6px", borderRadius: 3 }}>
                      <input
                        type="radio"
                        name={`match-${ing._id}`}
                        checked={selectedId === null}
                        onChange={() => setSelections(prev => ({ ...prev, [ing._id]: null }))}
                      />
                      <span style={{ fontSize: 11, color: T.textTertiary }}>
                        {lang === "zh" ? "(不关联)" : "(関連しない)"}
                      </span>
                    </label>
                    {candidates.map(({ score, material: m }) => {
                      const b = brands.find(x => x.id === m.brandId);
                      const checked = selectedId === m.id;
                      const scoreColor = score >= 90 ? "#059669" : score >= 70 ? "#D97706" : "#6B7280";
                      return (
                        <label key={m.id} style={{
                          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                          padding: "4px 6px", borderRadius: 3,
                          background: checked ? T.bgSoft : "transparent",
                        }}>
                          <input
                            type="radio"
                            name={`match-${ing._id}`}
                            checked={checked}
                            onChange={() => setSelections(prev => ({ ...prev, [ing._id]: m.id }))}
                          />
                          <span style={{
                            fontSize: 10, color: "#fff", background: scoreColor,
                            padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", minWidth: 30, textAlign: "center",
                          }}>{score}</span>
                          <span style={{ fontSize: 12 }}>
                            {m.isBest && <span style={{ color: "#059669" }}>⭐ </span>}
                            {lang === "zh" ? (m.nameZh || m.nameJa) : (m.nameJa || m.nameZh)}
                            {b && <span style={{ color: T.textTertiary, fontSize: 10, marginLeft: 6 }}>
                              · {lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)}
                            </span>}
                            {m.pricePerG && <span style={{ color: T.textTertiary, fontSize: 10, marginLeft: 6 }}>· {fmtUnitPrice(m.pricePerG, curOf(m))}</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: T.textTertiary, fontStyle: "italic" }}>
            {lang === "zh"
              ? `将关联 ${Object.values(selections).filter(v => v !== null).length} 个材料`
              : `${Object.values(selections).filter(v => v !== null).length} 件関連`}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={onClose}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
            <Btn variant="primary" onClick={() => onApply(selections)}>
              {lang === "zh" ? "✓ 应用" : "✓ 適用"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ 大类详情视图(含搜索 + 厂家过滤 + 子分类 tab)═══
// [B7 修复] brandFilter / searchQ 改为接 props(原本内部 useState 在卸载时丢失)
function CategoryDetailView({
  categoryId, brands, materials, recipes, components, creations, lang,
  subcategoryFilter, setSubcategoryFilter, setCategoryFilter,
  brandFilter = "", setBrandFilter = () => {},
  searchQ = "", setSearchQ = () => {},
  setBrandViewId, setBrandEditTarget,
  setMaterialViewId, setMaterialEditTarget
}) {

  const cat = getMaterialCat(categoryId);
  const subcats = getSubcategoriesFor(categoryId);
  const hasSubcats = subcats.length > 1;

  // 当前大类下的全部产品
  const allProducts = materials.filter(m => m.categoryId === categoryId);

  // 当前大类下的全部厂家(用于过滤器 dropdown)
  const brandsInCategory = useMemo(() => {
    const brandIdsInUse = new Set(allProducts.map(m => m.brandId).filter(Boolean));
    return brands.filter(b => brandIdsInUse.has(b.id))
      .sort((a, b) => (a.nameZh || a.nameJa || "").localeCompare(b.nameZh || b.nameJa || ""));
  }, [allProducts, brands]);

  // 按搜索词 + 子分类 + 厂家 过滤
  const activeSubcat = subcategoryFilter;
  const q = searchQ.trim().toLowerCase();

  let filteredProducts = allProducts;
  if (activeSubcat) {
    filteredProducts = filteredProducts.filter(m => (m.subcategoryId || "other") === activeSubcat);
  }
  if (brandFilter) {
    filteredProducts = filteredProducts.filter(m => m.brandId === brandFilter);
  }
  if (q) {
    filteredProducts = filteredProducts.filter(m => {
      const hay = `${m.nameZh || ""} ${m.nameJa || ""} ${m.nameFr || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  // 算每个产品的使用频次
  const productWithUsage = filteredProducts.map(m => {
    const brand = brands.find(b => b.id === m.brandId);
    const usage = getUsageScenes({ ...m, productBrandName: brand ? (brand.nameZh || brand.nameJa) : "" }, recipes, components, creations).length;
    return { ...m, _brand: brand, _usage: usage };
  });

  // 排序
  productWithUsage.sort((a, b) => {
    if (b._usage !== a._usage) return b._usage - a._usage;
    if ((b.isBest ? 1 : 0) !== (a.isBest ? 1 : 0)) return (b.isBest ? 1 : 0) - (a.isBest ? 1 : 0);
    if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
    return (a.nameZh || a.nameJa || "").localeCompare(b.nameZh || b.nameJa || "");
  });

  // 每个子分类的产品数
  const productCountsBySubcat = {};
  subcats.forEach(s => { productCountsBySubcat[s.id] = 0; });
  allProducts.forEach(m => {
    const sid = m.subcategoryId || "other";
    productCountsBySubcat[sid] = (productCountsBySubcat[sid] || 0) + 1;
  });

  const hasActiveFilter = searchQ || brandFilter || activeSubcat;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Btn onClick={() => { setCategoryFilter(null); setSubcategoryFilter(null); }}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{cat.icon} {lang === "zh" ? cat.zh : cat.ja}</div>
          <div style={{ fontSize: 11, color: T.textTertiary }}>
            · {allProducts.length} {lang === "zh" ? "产品" : "製品"}
            · {brandsInCategory.length} {lang === "zh" ? "家" : "社"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => setBrandEditTarget("new")}>{lang === "zh" ? "+ 新厂家" : "+ メーカー"}</Btn>
          <Btn variant="primary" onClick={() => setMaterialEditTarget("new")}>{lang === "zh" ? "+ 新产品" : "+ 製品追加"}</Btn>
        </div>
      </div>

      {/* 🔍 搜索 + 厂家过滤 */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "2 1 280px", minWidth: 200 }}>
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={lang === "zh" ? `🔍 在 ${cat.zh} 中搜索产品...` : `🔍 ${cat.ja} 内検索...`}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 12,
              border: `0.5px solid ${T.border}`,
              borderRadius: T.radius,
              background: T.bgCard,
              fontFamily: T.fontSans,
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = T.accent}
            onBlur={(e) => e.currentTarget.style.borderColor = T.border}
          />
          {searchQ && (
            <button
              onClick={() => setSearchQ("")}
              style={{
                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none", cursor: "pointer",
                fontSize: 14, color: T.textTertiary, padding: "4px 6px",
              }}
            >×</button>
          )}
        </div>

        {/* 厂家过滤 dropdown */}
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          style={{
            padding: "8px 10px",
            fontSize: 12,
            border: `0.5px solid ${brandFilter ? T.accent : T.border}`,
            borderRadius: T.radius,
            background: T.bgCard,
            fontFamily: T.fontSans,
            color: brandFilter ? T.accent : T.textSecondary,
            cursor: "pointer",
            flex: "1 1 180px",
            minWidth: 140,
          }}
        >
          <option value="">{lang === "zh" ? `全部厂家(${brandsInCategory.length})` : `全メーカー(${brandsInCategory.length})`}</option>
          {brandsInCategory.map(b => {
            const productN = allProducts.filter(m => m.brandId === b.id).length;
            return (
              <option key={b.id} value={b.id}>
                {lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)} ({productN})
              </option>
            );
          })}
        </select>

        {hasActiveFilter && (
          <button
            onClick={() => { setSearchQ(""); setBrandFilter(""); setSubcategoryFilter(null); }}
            style={{
              padding: "8px 10px", fontSize: 11, color: T.textTertiary,
              background: "transparent", border: `0.5px solid ${T.border}`,
              borderRadius: T.radius, cursor: "pointer", fontFamily: T.fontSans,
            }}
          >
            {lang === "zh" ? "清除筛选" : "クリア"}
          </button>
        )}
      </div>

      {/* 子分类筛选栏 */}
      {hasSubcats && (
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setSubcategoryFilter(null)}
            style={{
              padding: "6px 12px", fontSize: 12, borderRadius: T.radius,
              border: `0.5px solid ${!activeSubcat ? T.accent : T.border}`,
              background: !activeSubcat ? T.bgSoft : T.bgCard,
              color: !activeSubcat ? T.accent : T.textSecondary,
              cursor: "pointer", fontFamily: T.fontSans,
              fontWeight: !activeSubcat ? 500 : 400,
            }}
          >
            {lang === "zh" ? "全部" : "すべて"} ({allProducts.length})
          </button>
          {subcats.map(s => {
            const count = productCountsBySubcat[s.id] || 0;
            if (count === 0) return null;
            const isActive = activeSubcat === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSubcategoryFilter(s.id)}
                style={{
                  padding: "6px 12px", fontSize: 12, borderRadius: T.radius,
                  border: `0.5px solid ${isActive ? T.accent : T.border}`,
                  background: isActive ? T.bgSoft : T.bgCard,
                  color: isActive ? T.accent : T.textSecondary,
                  cursor: "pointer", fontFamily: T.fontSans,
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {s.icon} {lang === "zh" ? s.zh : s.ja} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* 结果数提示 */}
      <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 10, fontStyle: "italic" }}>
        {hasActiveFilter
          ? (lang === "zh"
              ? `📊 筛选结果:${productWithUsage.length} / ${allProducts.length} 产品`
              : `📊 ${productWithUsage.length} / ${allProducts.length} 製品`)
          : (productWithUsage.length > 1
              ? (lang === "zh" ? "📊 按使用频次排序(高频在前),⭐ 标注主力,🏆 标注クーベルチュール" : "📊 使用頻度順、⭐ メイン、🏆 クーベルチュール")
              : "")
        }
      </div>

      {allProducts.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#666666", fontSize: 13, lineHeight: 1.8 }}>
          {lang === "zh" ? "暂无产品" : "製品なし"}<br />
          <Btn variant="primary" size="sm" onClick={() => setMaterialEditTarget("new")}>{lang === "zh" ? "+ 新增第一个产品" : "+ 最初の製品を追加"}</Btn>
        </div>
      )}

      {productWithUsage.length === 0 && allProducts.length > 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: T.textTertiary, fontSize: 12 }}>
          {lang === "zh" ? "当前筛选条件下无产品" : "該当製品なし"}
        </div>
      )}

      {/* 产品卡片网格 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {productWithUsage.map(m => {
          const brand = m._brand;
          const usage = m._usage;
          const sub = getMaterialSubcat(m.categoryId, m.subcategoryId);
          const pName = lang === "zh" ? (m.nameZh || m.nameJa) : (m.nameJa || m.nameZh);
          const bName = brand ? (lang === "zh" ? (brand.nameZh || brand.nameJa) : (brand.nameJa || brand.nameZh)) : "";

          const firstImg = Array.isArray(m.imageUrls) && m.imageUrls.length > 0 ? m.imageUrls[0] : null;
          return (
            <div
              key={m.id}
              onClick={() => setMaterialViewId(m.id)}
              style={{
                background: T.bgCard,
                border: `0.5px solid ${T.border}`,
                borderRadius: T.radiusLg,
                padding: "14px 16px",
                cursor: "pointer",
                borderLeft: `3px solid ${m.isBest ? "#059669" : T.accentSoft}`,
                display: "flex", flexDirection: "column", gap: 6,
                transition: "transform 0.12s, border-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {firstImg && (
                  <ImageThumb
                    img={firstImg}
                    alt={pName}
                    style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0, border: `0.5px solid ${T.border}` }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.fontSerif, fontSize: 14, fontWeight: 500, lineHeight: 1.3, color: T.textPrimary }}>
                    {m.isBest && <span style={{ color: "#059669", marginRight: 4 }}>⭐</span>}
                    {m.isCouverture && <span style={{ color: "#B45309", marginRight: 4 }} title="クーベルチュール">🏆</span>}
                    {pName}
                  </div>
                  {bName && (
                    <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                      {bName}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {sub && (
                  <span style={{ fontSize: 10, color: T.textTertiary, background: T.bgMuted, padding: "2px 6px", borderRadius: 3 }}>
                    {sub.icon} {lang === "zh" ? sub.zh : sub.ja}
                  </span>
                )}
                {usage > 0 && (
                  <span style={{ fontSize: 10, color: "#2563EB", background: "#DBEAFE", padding: "2px 6px", borderRadius: 3 }}>
                    📝 {usage} {lang === "zh" ? "次使用" : "回使用"}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 4 }}>
                <div style={{ fontFamily: T.fontSerif, fontSize: 14, fontWeight: 500, color: m.pricePerG ? T.textPrimary : T.textTertiary }}>
                  {m.pricePerG ? fmtUnitPrice(m.pricePerG, curOf(m)) : "—"}
                </div>
                <div style={{ color: "#F59E0B", fontSize: 11 }}>
                  {m.rating ? "★".repeat(m.rating) : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 厂家编辑 ─────────────
function BrandEditForm({ brand, defaultCategory, onSave, onDelete, onBack, lang = "zh" }) {
  const isNew = !brand;
  const [errorMsg, setErrorMsg] = useState("");
  const empty = { nameZh: "", nameJa: "", nameFr: "", categoryId: defaultCategory || "dairy_other", subcategoryId: "other", origin: "", foundedYear: "", storyZh: "", storyJa: "", imageUrls: [] };
  const [form, setForm] = useState(brand ? { ...brand } : empty);
  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    if (!form.nameZh.trim()) {
      setErrorMsg("请输入厂家名称");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    onSave({
      ...form,
      id: brand ? brand.id : "brand_" + Date.now(),
      foundedYear: form.foundedYear ? parseInt(form.foundedYear) : "",
      updatedAt: new Date().toISOString(),
    });
  };

  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{isNew ? "新增厂家" : "编辑厂家"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isNew && <Btn variant="danger" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：中日文任一填写即可。建议填写厂家故事，记录品牌的历史背景。
      </div>

      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>厂家名（中文）</label><input value={form.nameZh} onChange={f("nameZh")} placeholder="よつ葉乳业" style={inpStyle} /></div>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>厂家名（日文）</label><input value={form.nameJa} onChange={f("nameJa")} placeholder="よつ葉乳業" style={inpStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "法文名" : "フランス語名"}</label><input value={form.nameFr || ""} onChange={f("nameFr")} placeholder="(可选)" style={inpStyle} /></div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>大分类</label>
            <select value={form.categoryId} onChange={(e) => setForm(prev => ({ ...prev, categoryId: e.target.value, subcategoryId: "other" }))} style={inpStyle}>
              {MATERIAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.zh}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "子分类" : "サブカテゴリ"}</label>
            <select value={form.subcategoryId || "other"} onChange={f("subcategoryId")} style={inpStyle}>
              {getSubcategoriesFor(form.categoryId).map(s => <option key={s.id} value={s.id}>{s.icon} {lang === "zh" ? s.zh : s.ja}</option>)}
            </select>
          </div>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "产地" : "原産地"}</label><input value={form.origin || ""} onChange={f("origin")} placeholder="北海道" style={inpStyle} /></div>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "创立年份" : "創立年"}</label><input type="number" value={form.foundedYear || ""} onChange={f("foundedYear")} placeholder="1967" style={inpStyle} /></div>
        </div>
      </div>

      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>厂家简介</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>中文</label>
          <textarea value={form.storyZh || ""} onChange={f("storyZh")} placeholder="厂家历史、特色、哲学等..." style={{...inpStyle, minHeight: 100, resize: "vertical"}} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>日本語</label>
          <textarea value={form.storyJa || ""} onChange={f("storyJa")} placeholder="メーカーの歴史・特色・理念など..." style={{...inpStyle, minHeight: 100, resize: "vertical"}} />
        </div>
      </div>

      <ImageUrlsEditor urls={form.imageUrls || []} onChange={(urls) => setForm(prev => ({ ...prev, imageUrls: urls }))} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
        {errorMsg && <span style={{ color: "#A32D2D", fontSize: 13, marginRight: 8 }}>⚠ {errorMsg}</span>}
        <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        <Btn variant="primary" onClick={handleSave}>{lang === "zh" ? "保存厂家" : "メーカー保存"}</Btn>
      </div>
    </div>
  );
}

// ─── 厂家详情 + 产品列表 ─────────────
function BrandDetail({ brand, materials, allMaterials, recipes, components, creations, lang, onEdit, onBack, onAddMaterial, onViewMaterial, onEditMaterial }) {
  const cat = getMaterialCat(brand.categoryId);
  const name = pickLang(brand, "name", lang);
  const story = pickLang(brand, "story", lang);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase" }}>
          {lang === "zh" ? "厂家详情" : "メーカー詳細"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn size="sm" onClick={onEdit}>{lang === "zh" ? "编辑" : "編集"}</Btn>
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      <div style={{
        background: T.bgCard,
        border: `0.5px solid ${T.border}`,
        borderRadius: T.radiusLg,
        padding: "1.75rem",
        marginBottom: "1rem",
        borderLeft: `3px solid ${cat.color}`,
        display: "flex",
        gap: 18,
        alignItems: "flex-start",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: cat.bg, color: cat.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: T.fontSerif, fontSize: 28, fontStyle: "italic", fontWeight: 500,
          flexShrink: 0,
        }}>
          {(brand.nameFr || name || "?").charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {brand.nameFr ? (
            <>
              <div style={{ fontFamily: T.fontSerif, fontSize: 24, fontWeight: 500, color: T.textPrimary, lineHeight: 1.2, letterSpacing: "-0.3px" }}>
                {brand.nameFr}
              </div>
              <div style={{ fontSize: 14, color: T.textSecondary, marginTop: 4 }}>{name}</div>
            </>
          ) : (
            <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.textPrimary }}>
              {name}
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ background: cat.bg, color: cat.color, padding: "3px 12px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500 }}>
              {cat.icon} {lang === "zh" ? cat.zh : cat.ja}
            </span>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: T.textTertiary, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {brand.origin && <span>📍 {brand.origin}</span>}
            {brand.foundedYear && <span style={{ fontFamily: T.fontSerif, fontStyle: "italic" }}>est. {brand.foundedYear}</span>}
          </div>

          {story && (
            <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.75, whiteSpace: "pre-wrap", marginTop: 14, padding: "10px 14px", background: T.bgMuted, borderLeft: `2px solid ${T.accentSoft}`, borderRadius: T.radiusSm, fontStyle: "italic" }}>{story}</div>
          )}
        </div>
      </div>

      <ImageUrlsDisplay urls={brand.imageUrls} />

      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, color: T.textPrimary }}>
            📦 {lang === "zh" ? `产品列表 · ${materials.length}` : `製品リスト · ${materials.length}`}
          </div>
          <Btn variant="primary" size="sm" onClick={onAddMaterial}>{lang === "zh" ? "+ 新增产品" : "+ 製品追加"}</Btn>
        </div>

        {materials.length === 0 && (
          <div style={{ fontSize: 13, color: T.textTertiary, padding: "1.5rem 0", textAlign: "center", fontStyle: "italic" }}>
            {lang === "zh" ? "暂无产品，点击「+ 新增产品」开始" : "まだ製品がありません"}
          </div>
        )}

        <div style={{ display: "grid", gap: 8 }}>
          {materials.map(m => {
            const mName = lang === "zh" ? (m.nameZh || m.nameJa) : (m.nameJa || m.nameZh);
            const usage = getUsageScenes({ ...m, productBrandName: brand.nameZh || brand.nameJa }, recipes, components, creations);
            const _effP = getMaterialEffectivePrice(m);
            const casePrice = _effP > 0 && m.packSize && m.casePack ? (_effP * parsePackSizeToGrams(m.packSize) * parseFloat(m.casePack)) : 0;
            const firstImg = Array.isArray(m.imageUrls) && m.imageUrls.length > 0 ? m.imageUrls[0] : null;
            return (
              <div
                key={m.id}
                onClick={() => onViewMaterial(m.id)}
                style={{
                  background: T.bgMuted,
                  borderRadius: T.radius,
                  padding: "10px 14px",
                  cursor: "pointer",
                  border: `0.5px solid ${T.borderSoft}`,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.borderSoft; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  {firstImg && (
                    <ImageThumb
                      img={firstImg}
                      alt={mName}
                      style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 4, flexShrink: 0, border: `0.5px solid ${T.border}` }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.fontSerif, fontSize: 14, fontWeight: 500, color: T.textPrimary, marginBottom: 4 }}>
                      {m.isBest && <span style={{ color: T.success, marginRight: 4 }}>⭐</span>}
                      {mName}
                      {m.rating > 0 && <span style={{ color: T.accent, fontSize: 11, marginLeft: 6, letterSpacing: "0.5px" }}>{"★".repeat(m.rating)}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: T.textTertiary, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {[
                        m.packSize ? `${m.packSize}${m.casePack ? ` × ${m.casePack}` : ""}` : null,
                        m.pricePerG ? fmtUnitPrice(m.pricePerG, curOf(m)) : null,
                        casePrice > 0 ? `${lang === "zh" ? "箱价" : "箱価"} ${getMaterialRawPrice(m).currency === "CNY" ? "" : "≈"}¥${casePrice.toFixed(0)}` : null,
                      ].filter(Boolean).map((t, i, arr) => (
                        <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{t}</span>
                          {i < arr.length - 1 && <span style={{ color: T.textMuted }}>·</span>}
                        </span>
                      ))}
                    </div>
                    {m.notesZh && (
                      <div style={{ fontSize: 11, color: T.accent, marginTop: 4, fontStyle: "italic" }}>
                        📝 {m.notesZh}
                      </div>
                    )}
                  </div>
                  {usage.length > 0 && (
                    <div style={{ fontSize: 10, color: T.textTertiary, textAlign: "right", letterSpacing: "0.5px" }}>
                      {usage.length} {lang === "zh" ? "次使用" : "回使用"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 产品详情 ─────────────
function MaterialDetail({ material, brand, allMaterials, recipes, components, creations, lang, onEdit, onBack, onNavigateToMaterial, shopMaterials = [], setShopMaterials, showToast, returnLabel }) {
  const cat = getMaterialCat(material.categoryId);
  const name = pickLang(material, "name", lang);
  const features = lang === "zh" ? (material.featuresZh || material.featuresJa) : (material.featuresJa || material.featuresZh);
  const uses = lang === "zh" ? (material.usesZh || material.usesJa) : (material.usesJa || material.usesZh);
  const notes = pickLang(material, "notes", lang);

  // 自动联动使用场景
  const usage = getUsageScenes({ ...material, productBrandName: brand ? (brand.nameZh || brand.nameJa) : "" }, recipes, components, creations);

  // 箱价计算 (v11: 用 effective price, 读本店价优先)
  const _effPriceForCase = getMaterialEffectivePrice(material);
  const casePrice = _effPriceForCase > 0 && material.packSize && material.casePack
    ? (_effPriceForCase * parsePackSizeToGrams(material.packSize) * parseFloat(material.casePack)) : 0;

  // 同类产品横向对比
  const compareWith = allMaterials.filter(m => m.categoryId === material.categoryId && m.id !== material.id).slice(0, 5);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase" }}>
          {lang === "zh" ? "产品详情" : "製品詳細"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn size="sm" onClick={onEdit}>{lang === "zh" ? "编辑" : "編集"}</Btn>
          <Btn variant={returnLabel ? "primary" : "default"} onClick={onBack}>{returnLabel || (lang === "zh" ? "← 返回" : "← 戻る")}</Btn>
        </div>
      </div>

      {/* 基本信息 - RURU */}
      <div style={{
        background: T.bgCard,
        border: `0.5px solid ${T.border}`,
        borderRadius: T.radiusLg,
        padding: "1.75rem",
        marginBottom: "1rem",
        borderLeft: `3px solid ${cat.color}`,
        display: "flex",
        gap: 18,
        alignItems: "flex-start",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: cat.bg, color: cat.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: T.fontSerif, fontSize: 28, fontStyle: "italic", fontWeight: 500,
          flexShrink: 0,
        }}>
          {(material.nameFr || name || "?").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {material.nameFr ? (
            <>
              <div style={{ fontFamily: T.fontSerif, fontSize: 24, fontWeight: 500, color: T.textPrimary, lineHeight: 1.2 }}>
                {material.isBest && <span style={{ color: T.success, marginRight: 8, fontSize: 16 }}>⭐</span>}
                {material.nameFr}
              </div>
              <div style={{ fontSize: 14, color: T.textSecondary, marginTop: 4 }}>{name}</div>
            </>
          ) : (
            <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.textPrimary }}>
              {material.isBest && <span style={{ color: T.success, marginRight: 8, fontSize: 16 }}>⭐</span>}
              {name}
            </div>
          )}
          {brand && (
            <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 6, letterSpacing: "0.3px" }}>
              {lang === "zh" ? "厂家" : "メーカー"} · {lang === "zh" ? (brand.nameZh || brand.nameJa) : (brand.nameJa || brand.nameZh)}
            </div>
          )}
          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ background: cat.bg, color: cat.color, padding: "3px 12px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500 }}>
              {cat.icon} {lang === "zh" ? cat.zh : cat.ja}
            </span>
            {material.rating > 0 && (
              <span style={{ background: T.bgSoft, color: T.accent, padding: "3px 12px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500, letterSpacing: "0.5px" }}>
                {"★".repeat(material.rating)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 自动联动：使用场景 - RURU */}
      <div style={{ background: T.bgMuted, border: `0.5px solid ${T.borderSoft}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.accent }}>
          📊 {lang === "zh" ? "你的使用情况" : "使用状況"}
        </div>
        {usage.length === 0 ? (
          <div style={{ fontSize: 12, color: T.textTertiary, fontStyle: "italic" }}>
            {lang === "zh" ? "尚未在任何配方中使用" : "まだレシピで使用されていません"}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 10 }}>
              {lang === "zh" ? "在你的配方库中使用" : "配方ライブラリで使用"} <span style={{ fontFamily: T.fontSerif, fontSize: 16, fontWeight: 500, color: T.accent }}>{usage.length}</span> {lang === "zh" ? "次" : "回"}
            </div>
            <div style={{ display: "grid", gap: 5 }}>
              {usage.slice(0, 10).map((u, i) => (
                <div key={i} style={{ background: T.bgCard, borderRadius: T.radiusSm, padding: "7px 12px", fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center", border: `0.5px solid ${T.borderSoft}` }}>
                  <span style={{ color: T.textPrimary }}>
                    {u.type === "recipe" && "📖 "}
                    {u.type === "component" && "🧩 "}
                    {u.type === "creation" && "🎂 "}
                    {u.name}
                    {u.layerName && <span style={{ color: T.textTertiary, marginLeft: 4 }}>({u.layerName})</span>}
                  </span>
                  <span style={{ color: T.textTertiary, fontFamily: T.fontSerif, fontWeight: 500 }}>{u.qty}{u.unit}</span>
                </div>
              ))}
              {usage.length > 10 && (
                <div style={{ fontSize: 11, color: T.textTertiary, textAlign: "center", fontStyle: "italic" }}>
                  {lang === "zh" ? `…还有 ${usage.length - 10} 条` : `…他に ${usage.length - 10} 件`}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 规格和价格 - RURU */}
      {(material.packSize || material.pricePerG) && (
        <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>
            📦 {lang === "zh" ? "规格与价格" : "規格と価格"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
            {material.packSize && (
              <div style={{ background: T.bgMuted, padding: "10px 12px", borderRadius: T.radiusSm }}>
                <div style={{ fontSize: 10, color: T.textTertiary, letterSpacing: "0.5px", textTransform: "uppercase" }}>{lang === "zh" ? "单包" : "単パック"}</div>
                <div style={{ fontFamily: T.fontSerif, fontSize: 17, fontWeight: 500, color: T.textPrimary, marginTop: 2 }}>{/^\s*\d+(\.\d+)?\s*$/.test(material.packSize) ? `${material.packSize}g` : material.packSize}</div>
              </div>
            )}
            {material.casePack && (
              <div style={{ background: T.bgMuted, padding: "10px 12px", borderRadius: T.radiusSm }}>
                <div style={{ fontSize: 10, color: T.textTertiary, letterSpacing: "0.5px", textTransform: "uppercase" }}>{lang === "zh" ? "一箱" : "1ケース"}</div>
                <div style={{ fontFamily: T.fontSerif, fontSize: 17, fontWeight: 500, color: T.textPrimary, marginTop: 2 }}>{material.casePack} {lang === "zh" ? "包" : "パック"}</div>
              </div>
            )}
            {(() => {
              const refPrice = (material.priceRange && material.priceRange.mid) || material.pricePerG;
              if (!refPrice) return null;
              return (
                <div style={{ background: T.bgMuted, padding: "10px 12px", borderRadius: T.radiusSm }}>
                  <div style={{ fontSize: 10, color: T.textTertiary, letterSpacing: "0.5px", textTransform: "uppercase" }}>📖 {lang === "zh" ? "参考价" : "参考価"}</div>
                  <div style={{ fontFamily: T.fontSerif, fontSize: 17, fontWeight: 500, color: T.textPrimary, marginTop: 2 }}>{fmtUnitPrice(refPrice, curOf(material))}</div>
                  {material.priceRange && material.priceRange.asOf && (
                    <div style={{ fontSize: 9, color: T.textTertiary, marginTop: 2 }}>{material.priceRange.asOf}</div>
                  )}
                </div>
              );
            })()}
            {(() => {
              const sm = Array.isArray(shopMaterials) ? shopMaterials.find(x => x && x.materialId === material.id) : null;
              if (!sm || !sm.pricePerG) return null;
              return (
                <div style={{ background: T.successBg, padding: "10px 12px", borderRadius: T.radiusSm, border: `0.5px solid ${T.success}` }}>
                  <div style={{ fontSize: 10, color: T.success, letterSpacing: "0.5px", textTransform: "uppercase" }}>🏷️ {lang === "zh" ? "本店价" : "仕入価"}</div>
                  <div style={{ fontFamily: T.fontSerif, fontSize: 17, fontWeight: 500, color: T.success, marginTop: 2 }}>{fmtUnitPrice(sm.pricePerG, curOf(sm))}</div>
                </div>
              );
            })()}
            {casePrice > 0 && (
              <div style={{ background: T.successBg, padding: "10px 12px", borderRadius: T.radiusSm }}>
                <div style={{ fontSize: 10, color: T.success, letterSpacing: "0.5px", textTransform: "uppercase" }}>{lang === "zh" ? "整箱约" : "1ケース合計"}</div>
                <div style={{ fontFamily: T.fontSerif, fontSize: 17, fontWeight: 500, color: T.success, marginTop: 2 }}>{getMaterialRawPrice(material).currency === "CNY" ? "" : "≈"}¥{casePrice.toFixed(0)}</div>
              </div>
            )}
          </div>
          {/* v11: + 添加为本店原料 按钮 */}
          {typeof setShopMaterials === "function" && (() => {
            const existing = Array.isArray(shopMaterials) ? shopMaterials.find(x => x && x.materialId === material.id) : null;
            if (existing) {
              return (
                <div style={{ marginTop: 12, fontSize: 12, color: T.success, display: "flex", alignItems: "center", gap: 6 }}>
                  ✓ {lang === "zh" ? "已在本店原料" : "仕入れ原料登録済"}
                  <span style={{ color: T.textTertiary, fontSize: 11 }}>· 🏷️ {fmtUnitPrice(existing.pricePerG, curOf(existing))}</span>
                </div>
              );
            }
            const refPrice = (material.priceRange && material.priceRange.mid) || material.pricePerG || "";
            return (
              <div style={{ marginTop: 12 }}>
                <Btn variant="primary" size="sm" onClick={() => {
                  setShopMaterials(prev => [...prev, {
                    id: "sm_" + Date.now() + Math.random().toString(36).slice(2, 6),
                    materialId: material.id,
                    pricePerG: String(refPrice),
                    packSize: material.packSize || "",
                    casePack: material.casePack || "",
                    note: "",
                  }]);
                  if (typeof showToast === "function") showToast((lang === "zh" ? "✓ 已添加到本店原料 " : "✓ 仕入れ原料に追加 ") + fmtUnitPrice(refPrice, curOf(material)));
                }}>
                  {lang === "zh" ? "+ 添加为本店原料" : "+ 仕入れ原料に追加"}
                </Btn>
                <span style={{ marginLeft: 10, fontSize: 11, color: T.textTertiary }}>{lang === "zh" ? "以参考价预填,添加后可改" : "参考価で追加"}</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* 核心参数 - RURU */}
      {material.parameters && Object.keys(material.parameters).filter(k => material.parameters[k]).length > 0 && (
        <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>
            🧪 {lang === "zh" ? "核心参数" : "主要パラメータ"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {Object.entries(material.parameters).filter(([k, v]) => v).map(([k, v]) => (
              <div key={k} style={{ background: T.bgMuted, borderRadius: T.radiusSm, padding: "8px 12px" }}>
                <div style={{ fontSize: 10, color: T.textTertiary, letterSpacing: "0.3px", textTransform: "uppercase" }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2, color: T.textPrimary }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 特点 / 用途 - RURU */}
      {(features || uses) && (
        <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          {features && (
            <div style={{ marginBottom: uses ? 14 : 0 }}>
              <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 14, marginBottom: 6, color: T.textPrimary }}>
                💡 {lang === "zh" ? "特点" : "特徴"}
              </div>
              <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{features}</div>
            </div>
          )}
          {uses && (
            <div>
              <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 14, marginBottom: 6, color: T.textPrimary }}>
                🎯 {lang === "zh" ? "推荐用途" : "おすすめ用途"}
              </div>
              <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{uses}</div>
            </div>
          )}
        </div>
      )}

      {/* 个人笔记 */}
      {notes && (
        <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 5, color: "#854F0B" }}>📝 你的笔记</div>
          <div style={{ fontSize: 13, color: "#78350F", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{notes}</div>
        </div>
      )}

      {/* 图片 */}
      <ImageUrlsDisplay urls={material.imageUrls} />

      {/* 横向对比 */}
      {compareWith.length > 0 && (
        <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>🔄 同分类其他产品（横向对比）</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F5F5F5" }}>
                  <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 400, color: "#666" }}>产品</th>
                  <th style={{ textAlign: "right", padding: "6px 10px", fontWeight: 400, color: "#666" }}>{lang === "zh" ? "单价/100g" : "単価/100g"}</th>
                  <th style={{ textAlign: "center", padding: "6px 10px", fontWeight: 400, color: "#666" }}>评分</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "#EDE9FE", fontWeight: 500 }}>
                  <td style={{ padding: "6px 10px" }}>→ {name} (当前)</td>
                  <td style={{ padding: "6px 10px", textAlign: "right" }}>{material.pricePerG ? `¥${material.pricePerG}` : "—"}</td>
                  <td style={{ padding: "6px 10px", textAlign: "center", color: "#F59E0B" }}>{material.rating ? "★".repeat(material.rating) : "—"}</td>
                </tr>
                {compareWith.map(m => (
                  <tr
                    key={m.id}
                    onClick={() => { if (onNavigateToMaterial) onNavigateToMaterial(m.id); }}
                    style={{ borderTop: "0.5px solid #E5E5E5", cursor: onNavigateToMaterial ? "pointer" : "default", transition: "background 0.15s" }}
                    onMouseEnter={e => { if (onNavigateToMaterial) e.currentTarget.style.background = "#F5F5F5"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    title={onNavigateToMaterial ? (lang === "zh" ? "点击查看详情" : "クリックで詳細") : ""}
                  >
                    <td style={{ padding: "6px 10px" }}>
                      {onNavigateToMaterial && <span style={{ color: T.accent, marginRight: 4 }}>🔗</span>}
                      {lang === "zh" ? (m.nameZh || m.nameJa) : (m.nameJa || m.nameZh)}
                      {m.isBest && <span style={{ color: "#059669", marginLeft: 4 }}>⭐</span>}
                    </td>
                    <td style={{ padding: "6px 10px", textAlign: "right" }}>{m.pricePerG ? `¥${m.pricePerG}` : "—"}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center", color: "#F59E0B" }}>{m.rating ? "★".repeat(m.rating) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 💱 日元汇率设置卡(数据 tab) ─────────────
// 材料百科的存量是日元报价,配方成本要按这个折成人民币。
// 输入按「100 日元 = ? 元」,因为国内看汇率就是这个口径;存的是 1 日元 = ? 元。
function FxSettingCard({ appSettings, setAppSettings, lang }) {
  const [draft, setDraft] = useState(null);
  const zh = lang === "zh";
  const fx = appSettings.fxJpyToCny || DEFAULT_FX_JPY_CNY;
  const per100 = Math.round(fx * 100 * 1000) / 1000;
  const val = draft === null ? String(per100) : draft;
  const commit = (v) => {
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) setAppSettings(prev => ({ ...prev, fxJpyToCny: n / 100, fxUpdatedAt: new Date().toISOString() }));
  };
  const inp = { width: 88, padding: "6px 10px", fontSize: 14, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, textAlign: "right" };
  return (
    <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary, marginBottom: 4 }}>
        {zh ? "💱 日元汇率" : "💱 為替レート"}
      </div>
      <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 12, lineHeight: 1.7 }}>
        {zh
          ? "材料百科里的存量是日本原料、日元报价。算配方成本时按这个汇率折成人民币,新录的国内材料标人民币则原样计入。"
          : "百科の在庫は日本原料・円建て。原価計算時にこのレートで人民元に換算します。"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: T.textSecondary }}>{zh ? "100 日元 =" : "100 円 ="}</span>
        <input type="number" step="0.1" value={val}
          onChange={e => { setDraft(e.target.value); commit(e.target.value); }}
          onBlur={() => setDraft(null)} style={inp} />
        <span style={{ fontSize: 13, color: T.textSecondary }}>{zh ? "元" : "元"}</span>
        {appSettings.fxUpdatedAt && (
          <span style={{ fontSize: 11, color: T.textTertiary }}>
            · {zh ? "上次改于" : "更新"} {String(appSettings.fxUpdatedAt).slice(0, 10)}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 10, lineHeight: 1.6 }}>
        {zh
          ? `举例:日本黄油 2200円/kg → 折 ¥${Math.round(2200 * fx * 100) / 100}/kg(即 ¥${Math.round(220 * fx * 100) / 100}/100g)`
          : `例:バター 2200円/kg → ¥${Math.round(2200 * fx * 100) / 100}/kg`}
      </div>
    </div>
  );
}

// ─── 规格与价格:袋价 ⇄ 箱价 ⇄ 单价 三格互算 ─────────────
// 真值只有 pricePerG(全项目成本链只认它),袋价 / 箱价是派生值。
// 报价单给的通常是「一袋多少钱 / 一箱多少钱」,所以三格都能输入,
// 改哪一格就拿哪一格反算 pricePerG,另外两格跟着走。
// anchor = 用户最后按哪个口径报的价;改单包 / 一箱时保住那个口径重算 ¥/g
// (袋价 2200 不该因为把单包从 1000g 改成 500g 就被冲掉)。
// draft 只在正在输入的那一格保留原始字符串,失焦归一化 ——
// 免得 1000÷3 再×3 = 999.999999 这种来回换算的抖动。
function PackPriceFields({ packSize, casePack, pricePerG, currency, onChange, lang, inpStyle, textSpec = false, priceLabel = null, required = false, autoFocus = false }) {
  const [draft, setDraft] = useState(null);   // { field: "pack" | "case" | "g", value }
  const [anchor, setAnchor] = useState("g");  // 最后编辑过的价格口径
  const g = parsePackSizeToGrams(packSize);
  const cp = parseFloat(casePack) || 0;
  const ppg = parseFloat(pricePerG) || 0;
  const money = (n) => n > 0 ? String(Math.round(n * 100) / 100) : "";
  const r6 = (n) => String(Math.round(n * 1e6) / 1e6);
  const cur = curOf({ currency });
  const sym = cur === "CNY" ? "¥" : "円";
  const p100 = ppg > 0 ? String(Math.round(ppg * 100 * 100) / 100) : "";   // 单价格按 /100g 显示
  const packPrice = ppg > 0 && g > 0 ? ppg * g : 0;
  const casePrice = packPrice > 0 && cp > 0 ? packPrice * cp : 0;

  const show = (field, derived) => (draft && draft.field === field ? draft.value : derived);
  const editPrice = (field, divisor) => (e) => {
    const v = e.target.value;
    setDraft({ field, value: v });
    setAnchor(field);
    if (!v.trim()) { onChange({ pricePerG: "" }); return; }
    const n = parseFloat(v);
    if (isNaN(n) || n < 0) return;
    onChange({ pricePerG: divisor > 0 ? r6(n / divisor) : "" });
  };
  const editSpec = (key) => (e) => {
    const v = e.target.value;
    const ng = key === "packSize" ? parsePackSizeToGrams(v) : g;
    const ncp = key === "casePack" ? (parseFloat(v) || 0) : cp;
    const patch = { [key]: v };
    const keep = anchor === "pack" ? packPrice : anchor === "case" ? casePrice : 0;
    const div = anchor === "pack" ? ng : ng * ncp;
    if (keep > 0 && div > 0) patch.pricePerG = r6(keep / div);
    onChange(patch);
  };

  const zh = lang === "zh";
  const lab = { fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" };
  const lockStyle = { ...inpStyle, background: "#F5F5F5", color: T.textTertiary };
  const hasG = g > 0, hasCase = g > 0 && cp > 0;
  return (
    <>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: T.textTertiary, marginRight: 2, letterSpacing: "0.3px" }}>{zh ? "币种" : "通貨"}</span>
        {[["CNY", zh ? "¥ 人民币" : "¥ 人民元"], ["JPY", zh ? "円 日元" : "円 日本円"]].map(([c, label]) => {
          const on = cur === c;
          return (
            <button key={c} type="button" onClick={() => onChange({ currency: c })}
              style={{ padding: "4px 12px", fontSize: 11, fontWeight: 500, cursor: "pointer", borderRadius: T.radiusPill, fontFamily: T.fontSans,
                background: on ? T.accent : "transparent", color: on ? "#fff" : T.textSecondary, border: `0.5px solid ${on ? T.accent : T.border}` }}>
              {label}
            </button>
          );
        })}
        {cur === "JPY" && ppg > 0 && (
          <span style={{ fontSize: 11, color: T.textTertiary }}>
            ≈ ¥{Math.round(ppg * 100 * getFx() * 100) / 100}/100g{zh ? "（按当前汇率）" : "（現レート）"}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div><label style={lab}>{zh ? "单包(g)" : "単パック(g)"}</label><input type={textSpec ? "text" : "number"} value={packSize || ""} onChange={editSpec("packSize")} placeholder={textSpec ? "450 / 1kg" : "450"} style={inpStyle} /></div>
        <div><label style={lab}>{zh ? "一箱(包)" : "1ケース(パック)"}</label><input type={textSpec ? "text" : "number"} value={casePack || ""} onChange={editSpec("casePack")} placeholder={textSpec ? "20" : "30"} style={inpStyle} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label style={lab}>{zh ? `袋价(${sym}/包)` : `パック価(${sym})`}</label>
          <input type="number" step="0.01" value={show("pack", money(packPrice))} onChange={editPrice("pack", g)} onBlur={() => setDraft(null)}
            disabled={!hasG} placeholder={hasG ? "例:2200" : (zh ? "先填单包(g)" : "先に単パック")} style={hasG ? inpStyle : lockStyle} />
        </div>
        <div>
          <label style={lab}>{zh ? `箱价(${sym}/箱)` : `箱価(${sym})`}</label>
          <input type="number" step="0.01" value={show("case", money(casePrice))} onChange={editPrice("case", g * cp)} onBlur={() => setDraft(null)}
            disabled={!hasCase} placeholder={hasCase ? "例:26400" : (zh ? "先填单包 + 一箱" : "先に単パック+ケース")} style={hasCase ? inpStyle : lockStyle} />
        </div>
        <div>
          <label style={lab}>{(priceLabel || (zh ? "单价" : "単価")) + `(${sym}/100g)` + (required ? " *" : "")}</label>
          <input type="number" step="0.01" value={show("g", p100)} onChange={editPrice("g", 100)} onBlur={() => setDraft(null)} placeholder={cur === "CNY" ? "例:13" : "例:220"} style={inpStyle} autoFocus={autoFocus} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 8, lineHeight: 1.6 }}>
        {zh ? `💡 三格填任意一格,另外两格自动算。拿到的是袋价 / 箱价就直接填,不用自己换算 ${sym}/100g。` : "💡 いずれか 1 つ入力すれば残り 2 つは自動換算。"}
      </div>
    </>
  );
}

// ─── 产品编辑 ─────────────
function MaterialEditForm({ material, brandId, brands, onSave, onDelete, onBack, lang = "zh" }) {
  const isNew = !material;
  const [errorMsg, setErrorMsg] = useState("");

  const currentBrand = brands.find(b => b.id === (material?.brandId || brandId));
  const defaultCategory = material?.categoryId || currentBrand?.categoryId || "dairy_other";
  const defaultSubcategory = material?.subcategoryId || currentBrand?.subcategoryId || "other";

  const empty = {
    nameZh: "", nameJa: "", nameFr: "",
    brandId: brandId || "",
    categoryId: defaultCategory,
    subcategoryId: defaultSubcategory,
    packSize: "", casePack: "",
    currency: "CNY",              // v17: 新录的默认人民币(店在北京);老数据无此字段 = 日元
    parameters: {},
    featuresZh: "", featuresJa: "",
    usesZh: "", usesJa: "",
    pricePerG: "",
    rating: 0,
    isBest: false,
    isCouverture: false,
    notesZh: "", notesJa: "",
    imageUrls: []
  };
  const [form, setForm] = useState(material ? { ...material, parameters: material.parameters || {} } : empty);
  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const updateParam = (k, v) => setForm(prev => ({ ...prev, parameters: { ...prev.parameters, [k]: v } }));
  const addCustomParam = () => {
    const newKey = "自定义" + (Object.keys(form.parameters).length + 1);
    updateParam(newKey, "");
  };
  const removeParam = (k) => setForm(prev => {
    const p = { ...prev.parameters };
    delete p[k];
    return { ...prev, parameters: p };
  });

  const handleSave = () => {
    if (!form.nameZh.trim()) {
      setErrorMsg("请输入产品名称");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    if (!form.brandId) {
      setErrorMsg("请选择厂家");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    onSave({
      ...form,
      id: material ? material.id : "mat_" + Date.now(),
      rating: parseInt(form.rating) || 0,
      updatedAt: new Date().toISOString(),
    });
  };

  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };

  // 参数模板：显示预设字段 + 已有自定义字段
  const templateParams = MATERIAL_PARAM_TEMPLATES[form.categoryId] || [];
  const templateKeys = new Set(templateParams.map(p => p.key));
  const customKeys = Object.keys(form.parameters).filter(k => !templateKeys.has(k));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{isNew ? "新增产品" : "编辑产品"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isNew && <Btn variant="danger" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：中日文任一填写即可。参数按分类自动显示常用字段，可以自定义。
      </div>

      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>产品名（中文）</label><input value={form.nameZh} onChange={f("nameZh")} placeholder="よつ葉発酵黄油（无盐）" style={inpStyle} /></div>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>产品名（日文）</label><input value={form.nameJa} onChange={f("nameJa")} placeholder="北海道よつ葉 発酵ポンドバター（食塩不使用）" style={inpStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "法文名" : "フランス語名"}</label><input value={form.nameFr || ""} onChange={f("nameFr")} placeholder="(可选)" style={inpStyle} /></div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>厂家</label>
            <select value={form.brandId} onChange={e => {
              const b = brands.find(x => x.id === e.target.value);
              setForm(prev => ({ ...prev, brandId: e.target.value, categoryId: b ? b.categoryId : prev.categoryId, subcategoryId: b ? (b.subcategoryId || "other") : prev.subcategoryId }));
            }} style={inpStyle}>
              <option value="">- 选择厂家 -</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.nameZh || b.nameJa}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>大分类</label>
            <select value={form.categoryId} onChange={(e) => setForm(prev => ({ ...prev, categoryId: e.target.value, subcategoryId: "other" }))} style={inpStyle}>
              {MATERIAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.zh}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "子分类" : "サブカテゴリ"}</label>
            <select value={form.subcategoryId || "other"} onChange={f("subcategoryId")} style={inpStyle}>
              {getSubcategoriesFor(form.categoryId).map(s => <option key={s.id} value={s.id}>{s.icon} {lang === "zh" ? s.zh : s.ja}</option>)}
            </select>
          </div>
        </div>

        {/* 巧克力专用:couverture 标签 */}
        {form.categoryId === "chocolate" && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#FEF3C7", borderRadius: T.radiusSm, border: "0.5px solid #FDE68A" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", color: "#854F0B" }}>
              <input type="checkbox" checked={!!form.isCouverture} onChange={e => setForm(prev => ({ ...prev, isCouverture: e.target.checked }))} />
              <span style={{ fontWeight: 500 }}>🏆 クーベルチュール(专业级,可可脂 ≥ 31%)</span>
            </label>
          </div>
        )}
      </div>

      {/* 规格与价格 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>📦 规格与价格</div>
        <PackPriceFields packSize={form.packSize} casePack={form.casePack} pricePerG={form.pricePerG} currency={form.currency}
          onChange={patch => setForm(prev => ({ ...prev, ...patch }))} lang={lang} inpStyle={inpStyle} />
      </div>

      {/* 核心参数 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>🧪 核心参数</div>
          <Btn size="sm" onClick={addCustomParam}>+ 自定义字段</Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {templateParams.map(p => (
            <div key={p.key}>
              <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{p.key}</label>
              <input value={form.parameters[p.key] || ""} onChange={e => updateParam(p.key, e.target.value)} placeholder={p.placeholder} style={inpStyle} />
            </div>
          ))}
          {customKeys.map(k => (
            <div key={k} style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{k}</label>
                <input value={form.parameters[k] || ""} onChange={e => updateParam(k, e.target.value)} style={inpStyle} />
              </div>
              <button onClick={() => removeParam(k)} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 18, padding: "4px 8px" }}>×</button>
            </div>
          ))}
        </div>
      </div>

      {/* 特点 / 用途 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>💡 特点 & 用途</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>特点（中文）</label>
            <textarea value={form.featuresZh || ""} onChange={f("featuresZh")} placeholder="风味特征、物理性质等" style={{...inpStyle, minHeight: 60, resize: "vertical"}} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>特点（日文）</label>
            <textarea value={form.featuresJa || ""} onChange={f("featuresJa")} placeholder="風味特徴・物理特性など" style={{...inpStyle, minHeight: 60, resize: "vertical"}} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>推荐用途（中文）</label>
            <textarea value={form.usesZh || ""} onChange={f("usesZh")} placeholder="慕斯、饼底、ガナッシュ等" style={{...inpStyle, minHeight: 60, resize: "vertical"}} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>推荐用途（日文）</label>
            <textarea value={form.usesJa || ""} onChange={f("usesJa")} placeholder="ムース、生地、ガナッシュなど" style={{...inpStyle, minHeight: 60, resize: "vertical"}} />
          </div>
        </div>
      </div>

      {/* 评分 / 笔记 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>我的评分</label>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setForm(prev => ({ ...prev, rating: n }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: form.rating >= n ? "#F59E0B" : "#D1D5DB", padding: 0 }}>★</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>标记</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={form.isBest || false} onChange={e => setForm(prev => ({ ...prev, isBest: e.target.checked }))} />
              ⭐ 最優（本分类中最推荐）
            </label>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>个人笔记（中文）</label>
            <textarea value={form.notesZh || ""} onChange={f("notesZh")} placeholder="使用经验、小技巧、缺点..." style={{...inpStyle, minHeight: 60, resize: "vertical"}} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>个人笔记（日文）</label>
            <textarea value={form.notesJa || ""} onChange={f("notesJa")} placeholder="使用経験、コツ、欠点..." style={{...inpStyle, minHeight: 60, resize: "vertical"}} />
          </div>
        </div>
      </div>

      <ImageUrlsEditor urls={form.imageUrls || []} onChange={(urls) => setForm(prev => ({ ...prev, imageUrls: urls }))} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
        {errorMsg && <span style={{ color: "#A32D2D", fontSize: 13, marginRight: 8 }}>⚠ {errorMsg}</span>}
        <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        <Btn variant="primary" onClick={handleSave}>{lang === "zh" ? "保存产品" : "製品保存"}</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// （材料百科模块结束）
// ═══════════════════════════════════════════════════════════════

// ─── Edit Form ────────────────────────────────────────────────────
function EditForm({ recipe, cats, materials = [], brands = [], setMaterials, shopMaterials = [], setShopMaterials, onSave, onDelete, onBack, onQuickAddKnowledge, lang = "zh", productFamilies = [], onUpdateCats, showToast }) {
  const isNew = !recipe;
  const [errorMsg, setErrorMsg] = useState("");
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [pickerTargetIngId, setPickerTargetIngId] = useState(null); // 当前要选材料的 ing._id
  const [showBulkMatch, setShowBulkMatch] = useState(false); // 🤖 批量关联弹窗
  const empty = { nameZh: "", nameJa: "", nameFr: "", category: "焼き菓子", mold: "", yield: "", unit: "個", time: "", temp: "", baketime: "", price: "", priceCurrency: "CNY", difficulty: "★★ 普通", storage: "", allergens: "", notesZh: "", notesJa: "", ingredients: [], stepsZh: [], stepsJa: [], imageUrls: [], familyId: "", variantLabel: "", variantNotes: "" };
  const [form, setForm] = useState(recipe ? { familyId: "", variantLabel: "", variantNotes: "", ...recipe } : empty);
  const [ings, setIngs] = useState(recipe && recipe.ingredients && recipe.ingredients.length > 0
    ? recipe.ingredients.map((i, idx) => {
        const linked = autoLinkIng(i, cats);
        // 🔗 如果有 materialId 关联材料百科,自动用最新价刷新
        // v11: 同时记录 _originalPrice 快照,给"改价->保存到本店"UX 判定 dirty 用
        if (linked.materialId && Array.isArray(materials)) {
          const m = materials.find(x => x.id === linked.materialId);
          if (m) {
            const pp = getMaterialEffectivePrice(m);
            if (!isNaN(pp) && pp > 0) {
              const q = parseFloat(linked.qty) || 0;
              return { ...linked, _id: idx, unitPrice: String(pp), _originalPrice: String(pp), cost: q > 0 ? (q * pp).toFixed(1) : linked.cost };
            }
          }
        }
        return { ...linked, _id: idx, _originalPrice: linked.unitPrice || "" };
      })
    : [{ _id: 0, nameZh: "", nameJa: "", nameFr: "", qty: "", unit: "g", brand: "", unitPrice: "", currency: "CNY", cost: "", group: "none", note: "", catId: null, brandIdx: null, _originalPrice: "" }]);
  // v11: 勾选"保存到本店原料"状态,用户改价后底部提示条里显示
  const [saveToShop, setSaveToShop] = useState(false);

  // 🧪 原料自动补全数据源（双语）
  const autoCompleteData = useMemo(() => {
    const zhSet = new Set();
    const jaSet = new Set();
    const brandSet = new Set();
    (cats || []).forEach(cat => {
      if (cat.nameZh) zhSet.add(cat.nameZh);
      if (cat.nameJa) jaSet.add(cat.nameJa);
      (cat.brands || []).forEach(b => {
        if (b.nameZh) brandSet.add(b.nameZh);
        if (b.nameJa) brandSet.add(b.nameJa);
      });
    });
    return {
      nameZh: Array.from(zhSet).sort(),
      nameJa: Array.from(jaSet).sort(),
      brand: Array.from(brandSet).sort(),
    };
  }, [cats]);

  // 兼容老数据：老 recipes 可能只有单一 steps 字段
  const initStepsZh = recipe?.stepsZh || [];
  const initStepsJa = recipe?.stepsJa || recipe?.steps || [];
  const maxStepLen = Math.max(initStepsZh.length, initStepsJa.length, 1);
  const [steps, setSteps] = useState(
    Array.from({ length: maxStepLen }, (_, i) => ({
      _id: i,
      textZh: initStepsZh[i] || "",
      textJa: initStepsJa[i] || "",
    }))
  );
  const nextIngId = useRef(ings.length);
  const nextStepId = useRef(steps.length);

  const totalCost = ings.reduce((s, i) => s + toCNY(i.cost, curOf(i)), 0);  // v17: 各按各的币种折成人民币再相加
  const qty = parseFloat(form.yield) || 0;
  const price = toCNY(form.price, priceCurOf(form));   // v17: 同上,折算后再比
  const unitCost = qty > 0 ? totalCost / qty : 0;
  const margin = price > 0 ? ((price - unitCost) / price) * 100 : 0;
  const mc = margin >= 50 ? "green" : margin >= 30 ? "amber" : "red";

  const updateIng = (id, field, val) => setIngs(prev => prev.map(i => {
    if (i._id !== id) return i;
    const next = { ...i, [field]: val };
    // v11: 改 unitPrice 时判 dirty
    if (field === "unitPrice") {
      const origP = parseFloat(i._originalPrice);
      const newP = parseFloat(val);
      const origNormalized = isNaN(origP) ? "" : String(origP);
      const newNormalized = isNaN(newP) ? "" : String(newP);
      next._priceModified = origNormalized !== newNormalized && newNormalized !== "";
    }
    return next;
  }));
  // v11: 单行撤销改价,恢复到 _originalPrice
  const revertPrice = (id) => setIngs(prev => prev.map(i => {
    if (i._id !== id) return i;
    const q = parseFloat(i.qty) || 0;
    const op = parseFloat(i._originalPrice) || 0;
    return { ...i, unitPrice: i._originalPrice || "", cost: q > 0 && op > 0 ? (q * op).toFixed(1) : i.cost, _priceModified: false };
  }));

  // 未关联材料对话框
  const [unlinkedDialog, setUnlinkedDialog] = useState(null);

  const doSave = (finalIngs) => {
    const validIngs = finalIngs.filter(i => i.nameZh || i.nameJa);
    // 🔗 用材料百科最新价刷新有 materialId 的 ing
    // v11: _priceModified 的 ing 跳过 refresh,保留用户改的 unitPrice
    const refreshedIngs = validIngs.map(i => {
      if (i._priceModified) return i; // 用户手改过,不覆盖
      if (!i.materialId) return i;
      const m = materials.find(x => x.id === i.materialId);
      if (!m) return { ...i, materialId: null }; // 材料已被删除,清除关联
      const pp = getMaterialEffectivePrice(m);
      if (isNaN(pp) || pp <= 0) return i;
      const q = parseFloat(i.qty) || 0;
      return { ...i, unitPrice: String(pp), cost: q > 0 ? (q * pp).toFixed(1) : i.cost };
    });
    // v11: 如果勾了"保存到本店原料",把改过价且有 materialId 的 ing 写入 shopMaterials
    if (saveToShop && typeof setShopMaterials === "function") {
      const toUpsert = refreshedIngs.filter(i => i._priceModified && i.materialId && parseFloat(i.unitPrice) > 0);
      if (toUpsert.length > 0) {
        setShopMaterials(prev => {
          const next = [...prev];
          toUpsert.forEach(ing => {
            const idx = next.findIndex(sm => sm.materialId === ing.materialId);
            if (idx >= 0) {
              next[idx] = { ...next[idx], pricePerG: String(parseFloat(ing.unitPrice)) };
            } else {
              next.push({
                id: "sm_" + Date.now() + Math.random().toString(36).slice(2, 6),
                materialId: ing.materialId,
                pricePerG: String(parseFloat(ing.unitPrice)),
              });
            }
          });
          return next;
        });
        if (typeof showToast === "function") {
          showToast(lang === "zh" ? `✓ ${toUpsert.length} 项已保存到本店原料` : `✓ ${toUpsert.length} 件を仕入れ原料に保存`);
        }
      }
    }
    const total = refreshedIngs.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
    const q = parseFloat(form.yield) || 0, p = parseFloat(form.price) || 0;
    const uc = q > 0 ? total / q : 0, mg = p > 0 ? ((p - uc) / p) * 100 : 0;
    const stepsZh = steps.map(s => (s.textZh || "").trim()).filter(Boolean);
    const stepsJa = steps.map(s => (s.textJa || "").trim()).filter(Boolean);
    // 清理临时字段 _priceModified / _originalPrice
    const cleanIngs = refreshedIngs.map(({ _id, _priceModified, _originalPrice, ...rest }) => rest);
    onSave({
      ...form,
      id: recipe ? recipe.id : Date.now(),
      yield: q, price: p,
      ingredients: cleanIngs,
      stepsZh, stepsJa,
      steps: undefined,
      totalCost: total, unitCost: uc, margin: mg,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSave = () => {
    const nameZh = (form.nameZh || "").trim(), nameJa = (form.nameJa || "").trim();
    if (!nameZh) {
      setErrorMsg("请输入配方名称");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    // v11: 移除"未在价格表中"对话框 - cats 已废弃,用户可用"🤖批量关联向导"集中处理未关联百科的 ing
    doSave(ings);
  };

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const inp = (key, placeholder, type = "text", extra = {}) => (
    <input type={type} placeholder={placeholder} value={form[key] || ""} onChange={f(key)} style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "0.5px solid #CCCCCC", borderRadius: "6px", background: "#FFFFFF", color: "#111111", fontFamily: "system-ui, sans-serif", ...extra }} />
  );
  const sel = (key, options) => (
    <select value={form[key] || ""} onChange={f(key)} style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  const card = (children) => <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>{children}</div>;
  const grid = (cols, children) => <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, marginBottom: 12 }}>{children}</div>;
  const fld = (label, children) => <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{label}</label>{children}</div>;

  return (
    <div>
      {unlinkedDialog && (
        <UnlinkedIngredientsDialog
          unlinkedItems={unlinkedDialog.items}
          lang={lang}
          onCancel={() => setUnlinkedDialog(null)}
          onSkip={() => { setUnlinkedDialog(null); doSave(ings); }}
          onConfirm={(selectedIdxs) => {
            const { ings: updatedIngs, cats: updatedCats } = applyUnlinkedToCats(ings, cats, selectedIdxs);
            setIngs(updatedIngs);
            if (onUpdateCats) onUpdateCats(updatedCats);
            setUnlinkedDialog(null);
            doSave(updatedIngs);
          }}
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{isNew ? (lang === "zh" ? "新建配方" : "レシピ新規") : (lang === "zh" ? "编辑配方" : "レシピ編集")}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isNew && <Btn variant="danger" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* 💡 懒人模式提示 */}
      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：中日文任一填写即可，不必两种都填。名字、备注、步骤都是如此。
      </div>

      {card(<>
        {grid("1fr 1fr", [fld("配方名（中文）", inp("nameZh", "费南雪")), fld("配方名（日本語）", inp("nameJa", "フィナンシェ"))])}
        {grid("1fr 1fr", [fld("配方名（Français）", inp("nameFr", "Financier")), fld("分类", sel("category", ["焼き菓子","生菓子","パン・ヴィエノワズリー","ショコラ","アントルメ","タルト","その他"]))])}
        {grid("1fr 1fr 1fr 1fr", [fld("模具/规格", inp("mold", "SN1648 25連")), fld("产出数量", inp("yield", "25", "number")), fld("单位", inp("unit", "個")), fld("制作时间（分）", inp("time", "60", "number"))])}
        {grid("1fr 1fr 1fr 1fr", [fld("烘烤温度", inp("temp", "190°C")), fld("烘烤时间", inp("baketime", "10分→反転→4分")), fld(<>{lang === "zh" ? "销售单价" : "販売単価"}{priceCurBtn(form, c => setForm(prev => ({ ...prev, priceCurrency: c })), lang)}</>, inp("price", "0", "number")), fld("难度", sel("difficulty", ["★ 简单","★★ 普通","★★★ 困难","★★★★ 高难度"]))])}
        {grid("1fr 1fr", [fld("保存方法", inp("storage", "常温3日")), fld("过敏原", inp("allergens", "小麦・卵・乳"))])}
      </>)}

      {/* 🏷 产品家族归属（可选） */}
      {card(<>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 10, color: T.textPrimary }}>{lang === "zh" ? "🏷 产品家族（可选）" : "🏷 プロダクトファミリー（任意）"}</div>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 10 }}>把这个配方归属到某个家族，方便管理同类产品的多个变体（例：巴斯克家族下有经典版/柚子版/橙花版）。</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>归属家族</label>
            <select value={form.familyId || ""} onChange={f("familyId")} style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans }}>
              <option value="">— 不归属任何家族 —</option>
              {productFamilies.map(fm => (
                <option key={fm.id} value={fm.id}>{fm.nameZh || fm.nameJa}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>变体标签（例：v2.0、柚子版）</label>
            <input value={form.variantLabel || ""} onChange={f("variantLabel")} placeholder="v1.0 経典版 / v2.0 柚子版..." style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>变体说明（和家族基础版有何差异）</label>
          <input value={form.variantNotes || ""} onChange={f("variantNotes")} placeholder="例：+ 酸奶油40g、+ 柠檬皮屑1/4个" style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans }} />
        </div>
      </>)}

      {card(<>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>{lang === "zh" ? "原材料" : "原材料"}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {materials && materials.length > 0 && (
              <Btn size="sm" onClick={() => setShowBulkMatch(true)} title={lang === "zh" ? "AI 扫描所有未关联材料并推荐匹配" : "AI で未関連材料を一括マッチ"}>
                {lang === "zh" ? "🤖 批量关联百科" : "🤖 一括関連"}
              </Btn>
            )}
            <Btn size="sm" onClick={() => { setIngs(prev => [...prev, { _id: nextIngId.current++, nameZh: "", nameJa: "", nameFr: "", qty: "", unit: "g", brand: "", unitPrice: "", currency: "CNY", cost: "", group: "none" }]); }}>{lang === "zh" ? "+ 追加" : "+ 追加"}</Btn>
          </div>
        </div>

        {/* Group legend */}
        <div style={{ fontSize: 12, color: "#666666", marginBottom: 10 }}>
          <span>分组 = 可以一起称量放入</span><strong>同一个盆/锅</strong><span>的材料，同色条 = 同一容器</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {Object.entries(GROUPS).filter(([k]) => k !== "none").map(([k, g]) => (
              <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1.5px solid ${g.labelBorder}`, color: g.labelColor }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: g.border, display: "inline-block" }} />
                {g.zh}
              </span>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ background: "#F5F5F5" }}>
                {["🔗","名（中文）","名（日本語）","名（FR）","用量","単位","品牌","単価","成本(¥)","分组","備考",""].map((h, i) => (
                  <th key={i} style={{ fontSize: 11, color: "#666666", fontWeight: 400, padding: "6px 6px 8px", textAlign: "left", borderBottom: "0.5px solid #E5E5E5", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ings.map((ing) => {
                const g = GROUPS[ing.group || "none"];
                const iStyle = { padding: "4px 6px", fontSize: 12, border: "0.5px solid #CCCCCC", borderRadius: 4, background: "#FFFFFF", color: "#111111" };
                const { cat: linkedCat, brand: linkedBrand } = resolveIngBinding(ing, cats);
                const linked = !!linkedCat;
                const onNameChange = (field, val) => {
                  const newIng = { ...ing, [field]: val };
                  if (newIng.catId) {
                    const currentCat = cats.find(c => c.id === newIng.catId);
                    if (!currentCat || (
                      (currentCat.nameZh || "").toLowerCase() !== val.toLowerCase() &&
                      (currentCat.nameJa || "").toLowerCase() !== val.toLowerCase() &&
                      (field === "nameZh" ? (currentCat.nameJa || "") : (currentCat.nameZh || "")).toLowerCase() !== (field === "nameZh" ? newIng.nameJa : newIng.nameZh || "").toLowerCase()
                    )) {
                      newIng.catId = null;
                      newIng.brandIdx = null;
                    }
                  }
                  const matched = findCatByName(val, cats);
                  if (matched && !newIng.catId) {
                    newIng.catId = matched.id;
                    newIng.brandIdx = null;
                    if (field === "nameZh" && !newIng.nameJa && matched.nameJa) newIng.nameJa = matched.nameJa;
                    if (field === "nameJa" && !newIng.nameZh && matched.nameZh) newIng.nameZh = matched.nameZh;
                    if (!newIng.unit && matched.unit) newIng.unit = matched.unit;
                  }
                  setIngs(prev => prev.map(i => i._id === ing._id ? newIng : i));
                };
                const onBrandSelect = (idx) => {
                  setIngs(prev => prev.map(i => {
                    if (i._id !== ing._id) return i;
                    if (idx === "" || idx === null) {
                      return { ...i, brandIdx: null, brand: "" };
                    }
                    const bi = parseInt(idx);
                    const brand = linkedCat && linkedCat.brands[bi];
                    if (!brand) return i;
                    const price = parseFloat(brand.price) || 0;
                    const q = parseFloat(i.qty) || 0;
                    return {
                      ...i,
                      brandIdx: bi,
                      brand: getBrandName(brand, lang),
                      unitPrice: brand.price || "",
                      cost: q > 0 && price > 0 ? (q * price).toFixed(1) : i.cost,
                    };
                  }));
                };
                const { material: linkedMat, brand: linkedMatBrand } = resolveIngMaterial(ing, materials, brands);
                const priceDrift = linked && linkedBrand && linkedBrand.price && ing.unitPrice &&
                  Math.abs(parseFloat(linkedBrand.price) - parseFloat(ing.unitPrice)) > 0.001
                  ? parseFloat(linkedBrand.price) : null;
                return (
                  <tr key={ing._id} style={{ borderBottom: "0.5px solid #E5E5E5", borderLeft: `4px solid ${g.border}` }}>
                    <td style={{ padding: "3px 4px" }}>
                      <button
                        onClick={() => setPickerTargetIngId(ing._id)}
                        title={linkedMat
                          ? (lang === "zh" ? `✓ 关联:${linkedMat.nameZh || linkedMat.nameJa}\n点击修改或解除关联` : `✓ 連動中`)
                          : (lang === "zh" ? "从材料百科选择(自动填名/价/品牌)" : "材料事典から選択")}
                        style={{
                          padding: "3px 6px", fontSize: 13, cursor: "pointer",
                          background: linkedMat ? "#059669" : T.bgCard,
                          color: linkedMat ? "#FFFFFF" : T.textSecondary,
                          border: `0.5px solid ${linkedMat ? "#059669" : T.border}`,
                          borderRadius: 4,
                          width: 30, height: 26,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}
                      >🔗</button>
                    </td>
                    <td style={{ padding: "3px 4px" }}><input list="autoNameZhR" placeholder="名（中）" value={ing.nameZh||""} onChange={e=>onNameChange("nameZh", e.target.value)} style={{ ...iStyle, width: 110, borderColor: linkedMat ? "#059669" : (linked ? "#0F6E56" : "#CCCCCC") }} title={linkedMat ? `✓ 百科关联:${linkedMat.nameZh || linkedMat.nameJa}` : (linked ? `✓ 已关联「${getCatName(linkedCat, lang)}」` : "")} /></td>
                    <td style={{ padding: "3px 4px" }}><input list="autoNameJaR" placeholder="名（日）" value={ing.nameJa||""} onChange={e=>onNameChange("nameJa", e.target.value)} style={{ ...iStyle, width: 110, borderColor: linkedMat ? "#059669" : (linked ? "#0F6E56" : "#CCCCCC") }} /></td>
                    <td style={{ padding: "3px 4px" }}><input placeholder="FR" value={ing.nameFr||""} onChange={e=>updateIng(ing._id,"nameFr",e.target.value)} style={{ ...iStyle, width: 70 }} /></td>
                    <td style={{ padding: "3px 4px" }}><input type="number" placeholder="量" value={ing.qty||""} onChange={e=>{updateIng(ing._id,"qty",e.target.value);const up=parseFloat(ing.unitPrice)||0;if(up>0)updateIng(ing._id,"cost",(parseFloat(e.target.value)*up).toFixed(1));}} style={{ ...iStyle, width: 52 }} /></td>
                    <td style={{ padding: "3px 4px" }}><input placeholder="g" value={ing.unit||""} onChange={e=>updateIng(ing._id,"unit",e.target.value)} style={{ ...iStyle, width: 36 }} /></td>
                    <td style={{ padding: "3px 4px" }}>
                      {linkedMat ? (
                        // v11: 百科关联优先,品牌只读显示 linkedMatBrand(改品牌需解除关联重新选)
                        <div title={lang === "zh" ? "已从材料百科关联,品牌随百科条目锁定" : "材料事典連動中"} style={{ width: 78, padding: "4px 3px", fontSize: 11, color: "#059669", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          🔗 {linkedMatBrand ? (lang === "zh" ? (linkedMatBrand.nameZh || linkedMatBrand.nameJa) : (linkedMatBrand.nameJa || linkedMatBrand.nameZh)) : (ing.brand || "—")}
                        </div>
                      ) : linked ? (
                        <select value={typeof ing.brandIdx === "number" ? ing.brandIdx : ""} onChange={e => onBrandSelect(e.target.value)} style={{ ...iStyle, width: 78, padding: "4px 3px" }} title={lang === "zh" ? "从价格表选品牌" : "価格表から選ぶ"}>
                          <option value="">{lang === "zh" ? "—未定—" : "—未定—"}</option>
                          {linkedCat.brands.map((b, bi) => <option key={bi} value={bi}>{getBrandName(b, lang)}</option>)}
                        </select>
                      ) : (
                        <input list="autoBrandR" placeholder="品牌" value={ing.brand||""} onChange={e=>updateIng(ing._id,"brand",e.target.value)} style={{ ...iStyle, width: 66 }} />
                      )}
                    </td>
                    <td style={{ padding: "3px 4px", position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <input type="number" placeholder={curOf(ing) === "CNY" ? "¥/g" : "円/g"} value={ing.unitPrice||""} onChange={e=>{updateIng(ing._id,"unitPrice",e.target.value);const q=parseFloat(ing.qty)||0;if(q>0)updateIng(ing._id,"cost",(q*parseFloat(e.target.value)).toFixed(1));}} style={{ ...iStyle, width: 52, borderColor: ing._priceModified ? "#F59E0B" : undefined, background: ing._priceModified ? "#FFFBEB" : undefined }} />
                        {/* v17: 手写价的币种。关联了百科就跟百科走,这里只管手写的那些 */}
                        {!ing.materialId && (
                          <button type="button" onClick={() => updateIng(ing._id, "currency", curOf(ing) === "CNY" ? "JPY" : "CNY")}
                            title={lang === "zh" ? "这条单价的币种,点一下切换(人民币 / 日元)" : "この単価の通貨を切替"}
                            style={{ padding: "2px 4px", fontSize: 11, lineHeight: 1.2, background: curOf(ing) === "CNY" ? "transparent" : "#FEF3C7", border: `0.5px solid ${curOf(ing) === "CNY" ? T.border : "#F59E0B"}`, borderRadius: 3, cursor: "pointer", color: curOf(ing) === "CNY" ? T.textSecondary : "#92400E" }}>
                            {curOf(ing) === "CNY" ? "¥" : "円"}
                          </button>
                        )}
                        {ing._priceModified && (
                          <button onClick={() => revertPrice(ing._id)} title={lang === "zh" ? `撤销改价 (原 ¥${ing._originalPrice})` : `改価取消 (元 ¥${ing._originalPrice})`} style={{ padding: "2px 4px", fontSize: 11, background: "#FEF3C7", border: "0.5px solid #F59E0B", borderRadius: 3, cursor: "pointer", color: "#92400E" }}>↺</button>
                        )}
                      </div>
                      {priceDrift !== null && (
                        <button onClick={() => {
                          setIngs(prev => prev.map(i => {
                            if (i._id !== ing._id) return i;
                            const q = parseFloat(i.qty) || 0;
                            return { ...i, unitPrice: String(priceDrift), cost: q > 0 ? (q * priceDrift).toFixed(1) : i.cost };
                          }));
                        }} style={{ display: "block", width: "100%", marginTop: 2, fontSize: 10, padding: "1px 3px", background: "#FEF3C7", border: "0.5px solid #F59E0B", borderRadius: 3, cursor: "pointer", color: "#92400E" }} title={lang === "zh" ? "价格表已更新,点击同步" : "価格表の値に更新"}>→ ¥{priceDrift}</button>
                      )}
                    </td>
                    <td style={{ padding: "3px 4px" }}><input type="number" placeholder="自動" value={ing.cost||""} onChange={e=>updateIng(ing._id,"cost",e.target.value)} style={{ ...iStyle, width: 56, textAlign: "right" }} /></td>
                    <td style={{ padding: "3px 4px" }}>
                      <select value={ing.group||"none"} onChange={e=>updateIng(ing._id,"group",e.target.value)} style={{ ...iStyle, width: 70, padding: "4px 3px" }}>
                        {Object.entries(GROUPS).map(([k,v])=><option key={k} value={k}>{lang === "zh" ? v.zh : v.ja}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "3px 4px" }}><input placeholder="備考・用途メモ" value={ing.note||""} onChange={e=>updateIng(ing._id,"note",e.target.value)} style={{ ...iStyle, width: 120, fontSize: 11 }} /></td>
                    <td style={{ padding: "3px 4px" }}><button onClick={()=>setIngs(prev=>prev.filter(i=>i._id!==ing._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#666666", fontSize: 15, padding: "2px 4px" }}>×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 🧪 自动补全数据源 */}
          <datalist id="autoNameZhR">
            {autoCompleteData.nameZh.map(n => <option key={n} value={n} />)}
          </datalist>
          <datalist id="autoNameJaR">
            {autoCompleteData.nameJa.map(n => <option key={n} value={n} />)}
          </datalist>
          <datalist id="autoBrandR">
            {autoCompleteData.brand.map(n => <option key={n} value={n} />)}
          </datalist>
        </div>

        {/* Cost summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: "1rem" }}>
          {[["原料总成本", `¥${totalCost.toFixed(0)}`, ""], ["单个成本", unitCost > 0 ? `¥${unitCost.toFixed(1)}` : "—", ""], ["利润率", price > 0 && unitCost > 0 ? margin.toFixed(1) + "%" : "—", mc]].map(([label, val, c], i) => (
            <div key={i} style={{ background: "#F5F5F5", borderRadius: "6px", padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "#666666", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: c === "green" ? "#0F6E56" : c === "amber" ? "#854F0B" : c === "red" ? "#A32D2D" : "#111111" }}>{val}</div>
            </div>
          ))}
        </div>
      </>)}

      {card(<>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>制作流程（中日双语）</div>
          <Btn size="sm" onClick={() => setSteps(prev => [...prev, { _id: nextStepId.current++, textZh: "", textJa: "" }])}>{lang === "zh" ? "+ 追加" : "+ 追加"}</Btn>
        </div>
        {steps.map((s, i) => (
          <div key={s._id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: i < steps.length - 1 ? "0.5px dashed #E5E5E5" : "none" }}>
            <div style={{ minWidth: 22, height: 22, borderRadius: "50%", background: "#F5F5F5", border: "0.5px solid #CCCCCC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, marginTop: 7, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <input value={s.textZh || ""} onChange={e => setSteps(prev => prev.map(st => st._id === s._id ? { ...st, textZh: e.target.value } : st))} placeholder="中文步骤描述…" style={{ padding: "7px 10px", fontSize: 13, border: "0.5px solid #CCCCCC", borderRadius: "6px", background: "#FFFFFF", color: "#111111", boxSizing: "border-box", width: "100%" }} />
              <input value={s.textJa || ""} onChange={e => setSteps(prev => prev.map(st => st._id === s._id ? { ...st, textJa: e.target.value } : st))} placeholder="日本語ステップ…" style={{ padding: "7px 10px", fontSize: 13, border: "0.5px solid #CCCCCC", borderRadius: "6px", background: "#FFFFFF", color: "#111111", boxSizing: "border-box", width: "100%" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
              <button
                onClick={() => setSteps(prev => { if (i === 0) return prev; const n = [...prev]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}
                disabled={i === 0}
                style={{ background: i === 0 ? "#F5F5F5" : "#FFFFFF", border: "0.5px solid #CCCCCC", cursor: i === 0 ? "not-allowed" : "pointer", color: i === 0 ? "#CCCCCC" : "#666666", fontSize: 11, padding: "2px 6px", borderRadius: 3 }}
                title="上移"
              >↑</button>
              <button
                onClick={() => setSteps(prev => { if (i === prev.length - 1) return prev; const n = [...prev]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n; })}
                disabled={i === steps.length - 1}
                style={{ background: i === steps.length - 1 ? "#F5F5F5" : "#FFFFFF", border: "0.5px solid #CCCCCC", cursor: i === steps.length - 1 ? "not-allowed" : "pointer", color: i === steps.length - 1 ? "#CCCCCC" : "#666666", fontSize: 11, padding: "2px 6px", borderRadius: 3 }}
                title="下移"
              >↓</button>
            </div>
            <button onClick={() => setSteps(prev => prev.filter(st => st._id !== s._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#666666", fontSize: 15, padding: "6px", marginTop: 4 }}>×</button>
          </div>
        ))}
      </>)}

      {card(<>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>备注 / メモ</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>中文备注</label>
          <textarea value={form.notesZh || ""} onChange={f("notesZh")} placeholder="改良方案・季节展开・注意事项等…" style={{ width: "100%", minHeight: 120, padding: "7px 10px", fontSize: 13, border: "0.5px solid #CCCCCC", borderRadius: "6px", background: "#FFFFFF", color: "#111111", resize: "vertical", fontFamily: "system-ui, sans-serif", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>日本語メモ</label>
          <textarea value={form.notesJa || ""} onChange={f("notesJa")} placeholder="改良案・季節展開・注意点など…" style={{ width: "100%", minHeight: 120, padding: "7px 10px", fontSize: 13, border: "0.5px solid #CCCCCC", borderRadius: "6px", background: "#FFFFFF", color: "#111111", resize: "vertical", fontFamily: "system-ui, sans-serif", boxSizing: "border-box" }} />
        </div>
      </>)}

      {/* 🖼️ 图片链接 */}
      <ImageUrlsEditor
        urls={form.imageUrls || []}
        onChange={(urls) => setForm(prev => ({ ...prev, imageUrls: urls }))}
      />

      {/* 🔗 快速新建相关知识点 */}
      {onQuickAddKnowledge && !isNew && (
        <div style={{ background: "#F3E8FF", border: "0.5px solid #C4B5FD", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#5B21B6" }}>{lang === "zh" ? "📚 快速新建相关知识点" : "📚 関連ナレッジを新規作成"}</div>
              <div style={{ fontSize: 11, color: "#6D28D9", marginTop: 3 }}>录入时想到某个技术点？一键添加到知识库并自动关联</div>
            </div>
            <Btn variant="primary" size="sm" onClick={() => setShowKnowledgeModal(true)}>{lang === "zh" ? "+ 新建知识点" : "+ ナレッジ新規"}</Btn>
          </div>
        </div>
      )}

      {/* v11: 改价提示条 — 至少一行 ing 被改过单价才显示 */}
      {(() => {
        const modCount = ings.filter(i => i._priceModified).length;
        const upsertable = ings.filter(i => i._priceModified && i.materialId && parseFloat(i.unitPrice) > 0).length;
        if (modCount === 0) return null;
        return (
          <div style={{ background: "#FFFBEB", border: "0.5px solid #F59E0B", borderRadius: 8, padding: "12px 14px", marginTop: 12 }}>
            <div style={{ fontSize: 13, color: "#92400E", marginBottom: 6 }}>
              🟡 {lang === "zh" ? `你修改了 ${modCount} 项原料单价。` : `${modCount} 項の単価を変更しました。`}
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: upsertable > 0 ? "pointer" : "not-allowed", opacity: upsertable > 0 ? 1 : 0.5 }}>
              <input type="checkbox" checked={saveToShop} onChange={e => setSaveToShop(e.target.checked)} disabled={upsertable === 0} style={{ marginTop: 2 }} />
              <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.5 }}>
                {lang === "zh"
                  ? (upsertable > 0
                      ? <>保存到本店原料（其中 <b>{upsertable}</b> 项可落盘，下次打开直接用此价；{modCount - upsertable > 0 ? `其余 ${modCount - upsertable} 项没关联材料百科只存到本配方` : ""}）</>
                      : <>这些原料没关联材料百科，改价只存到本配方（要批量保存到本店原料需先用"🤖 批量关联"挂材料百科）</>)
                  : (upsertable > 0
                      ? <>仕入れ原料に保存（<b>{upsertable}</b> 件が永続化可能）</>
                      : <>材料百科リンクなし、このレシピのみに保存</>)
                }
              </div>
            </label>
          </div>
        );
      })()}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8, alignItems: "center" }}>
        {errorMsg && <span style={{ color: "#A32D2D", fontSize: 13, marginRight: 8 }}>⚠ {errorMsg}</span>}
        <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        <Btn variant="primary" onClick={handleSave}>{lang === "zh" ? "保存配方" : "レシピ保存"}</Btn>
      </div>

      {/* 快速知识点浮层 */}
      {showKnowledgeModal && (
        <QuickKnowledgeModal
          relatedName={form.nameZh || form.nameJa}
          onClose={() => setShowKnowledgeModal(false)}
          onSave={(k) => {
            onQuickAddKnowledge(k);
            setShowKnowledgeModal(false);
          }}
        />
      )}

      {/* 🔗 材料百科选择弹窗 */}
      {pickerTargetIngId !== null && (
        <MaterialPickerModal
          materials={materials}
          brands={brands}
          currentMaterialId={(ings.find(i => i._id === pickerTargetIngId) || {}).materialId || null}
          lang={lang}
          onClose={() => setPickerTargetIngId(null)}
          onSelect={(mat) => {
            setIngs(prev => prev.map(i => {
              if (i._id !== pickerTargetIngId) return i;
              if (mat === null) {
                // 取消关联
                return { ...i, materialId: null };
              }
              const b = brands.find(x => x.id === mat.brandId);
              const pp = getMaterialEffectivePrice(mat);
              const q = parseFloat(i.qty) || 0;
              return {
                ...i,
                materialId: mat.id,
                nameZh: i.nameZh || mat.nameZh || "",
                nameJa: i.nameJa || mat.nameJa || "",
                nameFr: i.nameFr || mat.nameFr || "",
                brand: b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : i.brand,
                unitPrice: !isNaN(pp) && pp > 0 ? String(pp) : i.unitPrice,
                cost: (!isNaN(pp) && pp > 0 && q > 0) ? (q * pp).toFixed(1) : i.cost,
              };
            }));
            setPickerTargetIngId(null);
          }}
        />
      )}

      {/* 🤖 批量智能关联弹窗 */}
      {showBulkMatch && (
        <BulkMatchModal
          ings={ings}
          materials={materials}
          brands={brands}
          lang={lang}
          onClose={() => setShowBulkMatch(false)}
          onApply={(selections) => {
            setIngs(prev => prev.map(i => {
              const matId = selections[i._id];
              if (matId == null) return i;
              const mat = materials.find(m => m.id === matId);
              if (!mat) return i;
              const b = brands.find(x => x.id === mat.brandId);
              const pp = getMaterialEffectivePrice(mat);
              const q = parseFloat(i.qty) || 0;
              return {
                ...i,
                materialId: mat.id,
                nameZh: i.nameZh || mat.nameZh || "",
                nameJa: i.nameJa || mat.nameJa || "",
                nameFr: i.nameFr || mat.nameFr || "",
                brand: b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : i.brand,
                unitPrice: !isNaN(pp) && pp > 0 ? String(pp) : i.unitPrice,
                cost: (!isNaN(pp) && pp > 0 && q > 0) ? (q * pp).toFixed(1) : i.cost,
              };
            }));
            setShowBulkMatch(false);
          }}
        />
      )}

      {/* 底部留白,避免内容被浮动保存栏遮挡 */}
      <div style={{ height: 80 }} />
      {/* 浮动保存栏 */}
      <StickySaveBar onSave={handleSave} label={lang === "zh" ? "保存配方" : "レシピ保存"} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🏷️ 本店原料 View (v11)
// 用户店里实际采购的原料清单,每条挂靠到一个材料百科 (materialId)
// 本店价 pricePerG 会优先于百科 priceRange.mid 作为配方成本的依据
// ═══════════════════════════════════════════════════════════════
function ShopMaterialsView({ shopMaterials, setShopMaterials, materials, brands, suppliers = [], lang, showToast, confirmDialog }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState(null);
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState(null); // { id, materialId, pricePerG, packSize?, casePack?, note?, _new? }

  const linkedIds = new Set(shopMaterials.map(sm => sm.materialId));
  const availableMaterials = materials.filter(m => !linkedIds.has(m.id));

  const mLabel = (m) => lang === "zh" ? (m.nameZh || m.nameJa) : (m.nameJa || m.nameZh);
  const bLabel = (b) => b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : "";

  const filteredAvailable = availableMaterials.filter(m => {
    if (catFilter && m.categoryId !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${m.nameZh || ''}${m.nameJa || ''}${m.nameFr || ''}`.toLowerCase();
      const brand = brands.find(b => b.id === m.brandId);
      const brandName = brand ? `${brand.nameZh || ''}${brand.nameJa || ''}`.toLowerCase() : '';
      return name.includes(q) || brandName.includes(q);
    }
    return true;
  });

  const handleAddFromPicker = (mat) => {
    const refPrice = (mat.priceRange && mat.priceRange.mid) || mat.pricePerG || "";
    setEditing({
      id: "sm_" + Date.now() + Math.random().toString(36).slice(2, 6),
      materialId: mat.id,
      pricePerG: refPrice,
      currency: curOf(mat),        // 价是从百科带过来的,币种跟着一起带,别把日元当人民币
      packSize: mat.packSize || "",
      casePack: mat.casePack || "",
      note: "",
      supplierIds: [],
      _new: true,
    });
    setPicker(false);
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.pricePerG || parseFloat(editing.pricePerG) <= 0) {
      showToast(lang === "zh" ? "⚠️ 本店价必须大于 0" : "⚠️ 仕入れ価格は 0 より大きく");
      return;
    }
    const clean = { ...editing };
    delete clean._new;
    setShopMaterials(prev => {
      const idx = prev.findIndex(x => x.id === clean.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = clean; return next; }
      return [...prev, clean];
    });
    showToast(lang === "zh" ? "✓ 已保存" : "✓ 保存しました");
    setEditing(null);
  };

  const handleDelete = () => {
    if (!editing) return;
    confirmDialog(
      lang === "zh" ? "删除这条本店原料吗？" : "この仕入れ原料を削除しますか?",
      () => {
        setShopMaterials(prev => prev.filter(x => x.id !== editing.id));
        showToast(lang === "zh" ? "已删除" : "削除しました");
        setEditing(null);
      }
    );
  };

  // ─── 编辑/新增表单 ───
  if (editing) {
    const mat = materials.find(m => m.id === editing.materialId);
    const brand = mat && brands.find(b => b.id === mat.brandId);
    const refPrice = (mat && mat.priceRange && mat.priceRange.mid) || (mat && mat.pricePerG);
    const inputStyle = { width: "100%", padding: "8px 10px", border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14, fontFamily: T.fontSans, background: T.bgCard, color: T.textPrimary };

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Btn onClick={() => setEditing(null)}>← {lang === "zh" ? "返回" : "戻る"}</Btn>
        </div>
        <div style={{ background: T.bgCard, borderRadius: T.radius, padding: 20, border: `0.5px solid ${T.border}` }}>
          <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 4, fontFamily: T.fontSerif, color: T.textPrimary }}>
            {editing._new ? (lang === "zh" ? "+ 新增本店原料" : "+ 仕入れ原料を追加") : (lang === "zh" ? "编辑本店原料" : "仕入れ原料を編集")}
          </div>
          <div style={{ fontSize: 14, color: T.textSecondary, marginBottom: 4 }}>
            {mat ? mLabel(mat) : (lang === "zh" ? `(材料不存在: ${editing.materialId})` : `(材料なし: ${editing.materialId})`)}
            {brand && <span style={{ marginLeft: 8, color: T.textTertiary }}>· {bLabel(brand)}</span>}
          </div>
          {refPrice && (
            <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 16 }}>
              📖 {lang === "zh" ? "百科参考价" : "百科参考価"}: {fmtUnitPrice(refPrice, curOf(mat))}
            </div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            {/* 供货商报价单给的是袋价 / 箱价,三格互算,填哪个都行 */}
            <div>
              <PackPriceFields packSize={editing.packSize} casePack={editing.casePack} pricePerG={editing.pricePerG} currency={editing.currency}
                onChange={patch => setEditing(prev => ({ ...prev, ...patch }))} lang={lang} inpStyle={inputStyle}
                textSpec autoFocus required priceLabel={lang === "zh" ? "本店价" : "仕入れ価格"} />
            </div>
            {/* v13: 供货商多选。第一个是主供货商(采购清单归属) */}
            {suppliers.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 4 }}>{lang === "zh" ? "供货商 (可多选,第一个=主供货商)" : "仕入先 (複数選択可,先頭=主)"}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {suppliers.map(sup => {
                    const sids = editing.supplierIds || [];
                    const idx = sids.indexOf(sup.id);
                    const active = idx >= 0;
                    const isPrimary = idx === 0;
                    return (
                      <button key={sup.id} type="button" onClick={() => {
                        setEditing(e => {
                          const cur = e.supplierIds || [];
                          const has = cur.indexOf(sup.id);
                          return { ...e, supplierIds: has >= 0 ? cur.filter(x => x !== sup.id) : [...cur, sup.id] };
                        });
                      }} style={{ padding: "5px 10px", fontSize: 11, fontWeight: 500, background: isPrimary ? T.accent : (active ? T.accentSoft : "transparent"), color: active ? "#fff" : T.textSecondary, border: `0.5px solid ${active ? T.accent : T.border}`, borderRadius: T.radiusPill, cursor: "pointer" }}>
                        {isPrimary && "🚚 "}{sup.name}
                      </button>
                    );
                  })}
                </div>
                {(editing.supplierIds || []).length > 1 && <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 5 }}>{lang === "zh" ? "· 第一个是采购清单归属;再点可取消" : "· 先頭が採購所属"}</div>}
              </div>
            )}
            {suppliers.length === 0 && (
              <div style={{ fontSize: 11, color: T.textTertiary, fontStyle: "italic", padding: "4px 0" }}>
                {lang === "zh" ? "还没有供货商。去「🚚供货商」tab 新建后,这里可以关联" : "仕入先未登録"}
              </div>
            )}
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 4 }}>{lang === "zh" ? "备注" : "メモ"}</div>
              <input value={editing.note || ""} onChange={e => setEditing({ ...editing, note: e.target.value })} placeholder={lang === "zh" ? "起订量 / 其他" : "最小ロット 等"} style={inputStyle} />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 8 }}>
            <div>{!editing._new && <Btn variant="danger" onClick={handleDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => setEditing(null)}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
              <Btn variant="success" onClick={handleSave}>{lang === "zh" ? "保存" : "保存"}</Btn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 从百科选择 picker ───
  if (picker) {
    const inputStyle = { flex: 1, padding: "8px 12px", border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14, fontFamily: T.fontSans, background: T.bgCard, color: T.textPrimary };
    return (
      <div>
        <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <Btn onClick={() => { setPicker(false); setSearch(""); setCatFilter(null); }}>← {lang === "zh" ? "返回" : "戻る"}</Btn>
          <input type="text" placeholder={lang === "zh" ? "搜索材料名 / 品牌..." : "材料 / ブランド検索..."} value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
          <button onClick={() => setCatFilter(null)} style={{ padding: "4px 10px", background: !catFilter ? T.brand : "transparent", color: !catFilter ? T.bgCard : T.textSecondary, border: `0.5px solid ${!catFilter ? T.brand : T.border}`, borderRadius: T.radiusPill, fontSize: 11, cursor: "pointer", fontFamily: T.fontSans }}>{lang === "zh" ? "全部" : "全部"}</button>
          {MATERIAL_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCatFilter(c.id)} style={{ padding: "4px 10px", background: catFilter === c.id ? c.color : "transparent", color: catFilter === c.id ? "#fff" : T.textSecondary, border: `0.5px solid ${catFilter === c.id ? c.color : T.border}`, borderRadius: T.radiusPill, fontSize: 11, cursor: "pointer", fontFamily: T.fontSans }}>{lang === "zh" ? c.zh : c.ja}</button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 8 }}>
          {lang === "zh" ? `${filteredAvailable.length} 条可添加 (共 ${materials.length} 条百科,已关联 ${linkedIds.size} 条)` : `${filteredAvailable.length} 件追加可能 (百科 ${materials.length} 件中 ${linkedIds.size} 件リンク済)`}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {filteredAvailable.slice(0, 200).map(m => {
            const brand = brands.find(b => b.id === m.brandId);
            const refPrice = (m.priceRange && m.priceRange.mid) || m.pricePerG;
            return (
              <div key={m.id} onClick={() => handleAddFromPicker(m)} style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary }}>{mLabel(m)}</div>
                  {brand && <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>{bLabel(brand)}</div>}
                </div>
                {refPrice && <div style={{ fontSize: 12, color: T.textSecondary, whiteSpace: "nowrap" }}>📖 {fmtUnitPrice(refPrice, curOf(mat))}</div>}
              </div>
            );
          })}
          {filteredAvailable.length > 200 && <div style={{ fontSize: 11, color: T.textTertiary, textAlign: "center", padding: 12 }}>{lang === "zh" ? `仅显示前 200 条,请用搜索/分类筛选剩余 ${filteredAvailable.length - 200} 条` : `200 件のみ表示`}</div>}
          {filteredAvailable.length === 0 && <div style={{ fontSize: 13, color: T.textSecondary, textAlign: "center", padding: 40 }}>{lang === "zh" ? "没有符合条件的材料" : "該当なし"}</div>}
        </div>
      </div>
    );
  }

  // ─── 主列表 ───
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: T.textPrimary, fontFamily: T.fontSerif }}>{lang === "zh" ? "🏷️ 本店原料" : "🏷️ 仕入れ原料"}</div>
          <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 3 }}>
            {lang === "zh" ? `${shopMaterials.length} 条实际采购 · 价格优先于百科参考价` : `${shopMaterials.length} 件 · 百科参考価より優先`}
          </div>
        </div>
        <Btn variant="primary" onClick={() => { setPicker(true); setSearch(""); setCatFilter(null); }}>
          {lang === "zh" ? "+ 从材料百科添加" : "+ 百科から追加"}
        </Btn>
      </div>

      {shopMaterials.length === 0 ? (
        <div style={{ background: T.bgSoft, borderRadius: T.radius, padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.8 }}>
            {lang === "zh"
              ? <>还没有本店原料。<br />点击右上角「+ 从材料百科添加」,<br />从 {materials.length} 条百科里挑你店实际用到的原料,<br />录入你的采购价。配方成本会自动优先用这个价。</>
              : <>仕入れ原料が未登録。<br />右上の「+ 百科から追加」を押して、<br />百科 {materials.length} 件から実際に使う原料を選び、<br />仕入れ価格を入力。</>
            }
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {shopMaterials.map(sm => {
            const mat = materials.find(m => m.id === sm.materialId);
            const brand = mat && brands.find(b => b.id === mat.brandId);
            const refPrice = (mat && mat.priceRange && mat.priceRange.mid) || (mat && mat.pricePerG);
            const diff = (sm.pricePerG && refPrice) ? (parseFloat(sm.pricePerG) - parseFloat(refPrice)) : null;
            return (
              <div key={sm.id} onClick={() => setEditing({ ...sm })} style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radius, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.textPrimary, fontFamily: T.fontSerif }}>
                    {mat ? mLabel(mat) : <span style={{ color: T.danger }}>{lang === "zh" ? `⚠️ 材料不存在(${sm.materialId})` : `⚠️ 材料なし`}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {brand && <span>{bLabel(brand)}</span>}
                    {sm.packSize && <span>· {sm.packSize}{sm.casePack ? ` × ${sm.casePack}` : ""}</span>}
                    {(() => {
                      const ids = sm.supplierIds || [];
                      if (ids.length === 0) return null;
                      const primary = suppliers.find(s => s.id === ids[0]);
                      if (!primary) return null;
                      return <span style={{ color: T.accent }}>· 🚚 {primary.name}{ids.length > 1 ? ` +${ids.length - 1}` : ""}</span>;
                    })()}
                    {sm.note && <span>· {sm.note}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 90 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.textPrimary, fontFamily: T.fontSerif }}>🏷️ {fmtUnitPrice(sm.pricePerG, curOf(sm))}</div>
                  {refPrice && diff !== null && Math.abs(diff) > 0.005 && (
                    <div style={{ fontSize: 10, color: diff > 0 ? T.danger : T.success, marginTop: 2 }}>
                      {diff > 0 ? "↑" : "↓"} {lang === "zh" ? "参考" : "参考"} ¥{refPrice}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🍰 商品 View (v12)
// 商品 = 对外销售的 SKU,一个商品可由 1~N 个 recipes/creations 组合(礼盒)
// 数据: { id, nameZh, nameJa, imageUrls, items:[{linkedId, linkedType, qty}],
//        currentStock, threshold, leadTimeDays, sellPrice, note }
// ═══════════════════════════════════════════════════════════════
// [B6 修复] 加 components 参数,商品可关联组件
function ProductsView({ products, setProducts, recipes, creations, components = [], lang, showToast, confirmDialog, viewId, setViewId, editTarget, setEditTarget, salesLog, setSalesLog, productionLog, setProductionLog }) {
  const today = new Date().toISOString().slice(0, 10);
  // v12: 销售/生产按天 upsert,同日累加。forDate 可指定补录日期
  const logQty = (kind, productId, addQty, forDate) => {
    const qn = parseFloat(addQty) || 0;
    if (qn <= 0) return;
    const d = forDate || today;
    const qtyField = kind === "sale" ? "soldQty" : "batchQty";
    const setter = kind === "sale" ? setSalesLog : setProductionLog;
    setter(prev => {
      const existing = (prev || []).find(x => x.productId === productId && x.date === d);
      if (existing) {
        return prev.map(x => x.id === existing.id ? { ...x, [qtyField]: (parseFloat(x[qtyField]) || 0) + qn, updatedAt: new Date().toISOString() } : x);
      }
      return [...(prev || []), {
        id: (kind === "sale" ? "sale_" : "prod_log_") + Date.now() + Math.random().toString(36).slice(2, 6),
        productId, date: d, [qtyField]: qn, createdAt: new Date().toISOString(),
      }];
    });
    // 联动库存: 销售扣, 生产加
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      const delta = kind === "sale" ? -qn : qn;
      return { ...p, currentStock: Math.max(0, (p.currentStock || 0) + delta) };
    }));
  };
  // v12: 删除一条销售/生产记录,反向回滚 currentStock
  const deleteLog = (kind, logId) => {
    const list = kind === "sale" ? salesLog : productionLog;
    const setter = kind === "sale" ? setSalesLog : setProductionLog;
    const log = (list || []).find(x => x.id === logId);
    if (!log) return;
    const qtyField = kind === "sale" ? "soldQty" : "batchQty";
    const q = parseFloat(log[qtyField]) || 0;
    setter(prev => prev.filter(x => x.id !== logId));
    // 反向调整: 销售记录删 → 库存加回; 生产记录删 → 库存扣回
    setProducts(prev => prev.map(p => {
      if (p.id !== log.productId) return p;
      const delta = kind === "sale" ? q : -q;
      return { ...p, currentStock: Math.max(0, (p.currentStock || 0) + delta) };
    }));
  };
  const mLabel = (obj) => obj ? (lang === "zh" ? (obj.nameZh || obj.nameJa) : (obj.nameJa || obj.nameZh)) : "";
  const inputStyle = { width: "100%", padding: "7px 10px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans };

  // ─── 编辑表单 ───
  if (editTarget !== null) {
    return <ProductEditForm
      product={editTarget._new ? null : editTarget}
      recipes={recipes}
      creations={creations}
      components={components}
      lang={lang}
      onSave={(p) => {
        setProducts(prev => {
          const found = prev.find(x => x.id === p.id);
          return found ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
        });
        showToast(lang === "zh" ? "✓ 商品已保存" : "✓ 商品保存");
        setViewId(p.id);
        setEditTarget(null);
      }}
      onDelete={() => {
        confirmDialog(lang === "zh" ? "删除这个商品吗？销售/生产历史不会自动删除。" : "この商品を削除しますか？", () => {
          setProducts(prev => prev.filter(x => x.id !== editTarget.id));
          showToast(lang === "zh" ? "已删除" : "削除しました");
          setEditTarget(null);
        });
      }}
      onBack={() => {
        // [B4 修复] 有 id 跳详情,无 id 回列表
        if (editTarget && editTarget.id) setViewId(editTarget.id);
        setEditTarget(null);
      }}
    />;
  }

  // ─── 详情页 ───
  if (viewId) {
    const p = products.find(x => x.id === viewId);
    if (!p) return null;
    const sales = salesLog.filter(s => s.productId === p.id).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const prods = productionLog.filter(l => l.productId === p.id).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase" }}>{lang === "zh" ? "商品详情" : "商品詳細"}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={() => setEditTarget(p)}>{lang === "zh" ? "编辑" : "編集"}</Btn>
            <Btn onClick={() => setViewId(null)}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
          </div>
        </div>
        <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <div style={{ fontFamily: T.fontSerif, fontSize: 24, fontWeight: 500, color: T.textPrimary, marginBottom: 4 }}>{mLabel(p)}</div>
          {p.nameZh && p.nameJa && <div style={{ fontSize: 13, color: T.textSecondary }}>{rawLang(p, "name", lang)}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 16 }}>
            <div style={{ background: T.bgMuted, padding: "10px 12px", borderRadius: T.radiusSm }}>
              <div style={{ fontSize: 10, color: T.textTertiary, textTransform: "uppercase" }}>{lang === "zh" ? "当前库存" : "現在庫"}</div>
              <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: (p.currentStock || 0) <= (p.threshold || 0) ? T.danger : T.textPrimary, marginTop: 2 }}>{p.currentStock || 0}</div>
            </div>
            <div style={{ background: T.bgMuted, padding: "10px 12px", borderRadius: T.radiusSm }}>
              <div style={{ fontSize: 10, color: T.textTertiary, textTransform: "uppercase" }}>{lang === "zh" ? "补货阈值" : "補充ライン"}</div>
              <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.textPrimary, marginTop: 2 }}>{p.threshold || 0}</div>
            </div>
            <div style={{ background: T.bgMuted, padding: "10px 12px", borderRadius: T.radiusSm }}>
              <div style={{ fontSize: 10, color: T.textTertiary, textTransform: "uppercase" }}>{lang === "zh" ? "制作周期" : "製作日数"}</div>
              <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.textPrimary, marginTop: 2 }}>{p.leadTimeDays || 0} {lang === "zh" ? "天" : "日"}</div>
            </div>
            {(p.sellPrice || 0) > 0 && (
              <div style={{ background: T.successBg, padding: "10px 12px", borderRadius: T.radiusSm }}>
                <div style={{ fontSize: 10, color: T.success, textTransform: "uppercase" }}>{lang === "zh" ? "销价" : "販売価"}</div>
                <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.success, marginTop: 2 }}>{fmtSellPrice(p.sellPrice, p)}</div>
              </div>
            )}
          </div>
          {/* [B5 修复] 备注双语,旧 note 兜底 */}
          {(() => {
            const noteText = pickLang(p, "notes", lang) || p.note;
            return noteText ? <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 12, lineHeight: 1.6 }}>📌 {noteText}</div> : null;
          })()}
        </div>
        <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12 }}>📦 {lang === "zh" ? "组成(每份含)" : "構成"}</div>
          {(p.items || []).length === 0 ? (
            <div style={{ fontSize: 12, color: T.textTertiary, fontStyle: "italic" }}>{lang === "zh" ? "未关联任何配方/组合蛋糕/组件" : "未関連"}</div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {p.items.map((it, i) => {
                // [B6 修复] 支持 component
                const target = it.linkedType === "creation" ? creations.find(c => c.id === it.linkedId)
                  : it.linkedType === "component" ? components.find(c => c.id === it.linkedId)
                  : recipes.find(r => r.id === it.linkedId);
                const emoji = it.linkedType === "creation" ? "🎂" : it.linkedType === "component" ? "🧩" : "🧁";
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: T.bgMuted, borderRadius: T.radiusSm, fontSize: 13 }}>
                    <div>
                      <span style={{ color: T.textTertiary, fontSize: 11, marginRight: 6 }}>{emoji}</span>
                      {target ? mLabel(target) : (lang === "zh" ? `(已删除 ${it.linkedId})` : `(削除済)`)}
                    </div>
                    <div style={{ color: T.textSecondary }}>× {it.qty || 1}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* v12: 销售录入(扣库存) */}
          <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1rem 1.25rem" }}>
            <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 14, marginBottom: 10 }}>📉 {lang === "zh" ? "销售录入" : "販売記録"}</div>
            <SalesInput kind="sale" today={today} onSubmit={(qty, d) => { logQty("sale", p.id, qty, d); showToast(lang === "zh" ? `✓ ${d === today ? "今日" : d} 销售 +${qty}(库存 -${qty})` : `✓ ${d} 販売 ${qty} 件`); }} lang={lang} />
            <div style={{ marginTop: 12, fontSize: 11, color: T.textTertiary, marginBottom: 6 }}>{lang === "zh" ? "最近 10 条" : "過去 10 件"}</div>
            {sales.length === 0 ? <div style={{ fontSize: 11, color: T.textTertiary, fontStyle: "italic" }}>—</div> : sales.slice(0, 10).map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "4px 0", borderBottom: `0.5px dashed ${T.borderSoft}` }}>
                <span>{s.date}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: T.danger }}>−{s.soldQty || 0}</span>
                  <button onClick={() => confirmDialog(lang === "zh" ? `删除 ${s.date} 销售 ${s.soldQty} 件? 库存会加回 ${s.soldQty}` : `${s.date} の販売 ${s.soldQty} 件を削除?`, () => deleteLog("sale", s.id))} title={lang === "zh" ? "删除(库存会回滚)" : "削除"} style={{ border: "none", background: "none", color: T.textTertiary, cursor: "pointer", fontSize: 14, padding: "0 4px", lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
          </div>
          {/* v12: 生产录入(加库存) */}
          <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1rem 1.25rem" }}>
            <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 14, marginBottom: 10 }}>📈 {lang === "zh" ? "生产录入" : "製造記録"}</div>
            <SalesInput kind="prod" today={today} onSubmit={(qty, d) => { logQty("prod", p.id, qty, d); showToast(lang === "zh" ? `✓ ${d === today ? "今日" : d} 生产 +${qty}(库存 +${qty})` : `✓ ${d} 製造 ${qty} 件`); }} lang={lang} />
            <div style={{ marginTop: 12, fontSize: 11, color: T.textTertiary, marginBottom: 6 }}>{lang === "zh" ? "最近 10 条" : "過去 10 件"}</div>
            {prods.length === 0 ? <div style={{ fontSize: 11, color: T.textTertiary, fontStyle: "italic" }}>—</div> : prods.slice(0, 10).map(l => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "4px 0", borderBottom: `0.5px dashed ${T.borderSoft}` }}>
                <span>{l.date}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: T.success }}>+{l.batchQty || 0}</span>
                  <button onClick={() => confirmDialog(lang === "zh" ? `删除 ${l.date} 生产 ${l.batchQty} 件? 库存会扣回 ${l.batchQty}` : `${l.date} の製造 ${l.batchQty} 件を削除?`, () => deleteLog("prod", l.id))} title={lang === "zh" ? "删除(库存会回滚)" : "削除"} style={{ border: "none", background: "none", color: T.textTertiary, cursor: "pointer", fontSize: 14, padding: "0 4px", lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── 主列表 ───
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 8, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: T.textPrimary, fontFamily: T.fontSerif }}>{lang === "zh" ? "🍰 商品" : "🍰 商品"}</div>
          <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 3 }}>{lang === "zh" ? `${products.length} 个商品 · 管理库存 / 待办 / 销售` : `${products.length} 件 · 在庫・予定・販売`}</div>
        </div>
        <Btn variant="primary" onClick={() => setEditTarget({ _new: true })}>{lang === "zh" ? "+ 新建商品" : "+ 新規商品"}</Btn>
      </div>
      {products.length === 0 ? (
        <div style={{ background: T.bgSoft, borderRadius: T.radius, padding: "40px 20px", textAlign: "center", fontSize: 13, color: T.textSecondary, lineHeight: 1.8 }}>
          {lang === "zh" ? <>还没有商品。<br/>商品 = 对外销售的单品或礼盒,绑定你的配方/组合蛋糕后<br/>可以管理库存、看每天该做什么、记销售。</> : <>商品未登録。<br/>販売するSKUとレシピを紐付けて在庫管理。</>}
        </div>
      ) : (
        <>
          {/* v12: 今日要做摘要 - 列出 currentStock <= threshold 的商品 */}
          {(() => {
            const low = products.filter(p => (p.currentStock || 0) <= (p.threshold || 0));
            if (low.length === 0) return null;
            return (
              <div style={{ background: T.dangerBg, border: `2px solid ${T.danger}`, borderRadius: T.radiusLg, padding: "16px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(220, 38, 38, 0.15)" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.danger, marginBottom: 10, fontFamily: T.fontSerif, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>⚠️</span>
                  <span>{lang === "zh" ? `今日要做 · ${low.length} 个商品低库存` : `今日の予定 · ${low.length} 件補充必要`}</span>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {low.map(p => {
                    const stock = p.currentStock || 0;
                    const th = p.threshold || 0;
                    const suggest = Math.max(1, th - stock + Math.max(1, Math.ceil(th / 2))); // 推荐做: 补到 threshold+50% buffer
                    return (
                      <div key={p.id} onClick={() => setViewId(p.id)} style={{ cursor: "pointer", background: T.bgCard, padding: "8px 12px", borderRadius: T.radiusSm, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                        <span style={{ fontWeight: 500 }}>{mLabel(p)}</span>
                        <span style={{ fontSize: 12 }}>
                          <span style={{ color: T.danger }}>{lang === "zh" ? `库存 ${stock}` : `在庫 ${stock}`}</span>
                          <span style={{ color: T.textTertiary, margin: "0 6px" }}>·</span>
                          <span style={{ color: T.warning, fontWeight: 500 }}>{lang === "zh" ? `建议做 ${suggest} 件` : `${suggest} 件推奨`}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          <div style={{ display: "grid", gap: 10 }}>
            {products.map(p => {
              const stock = p.currentStock || 0;
              const th = p.threshold || 0;
              const low = stock <= th;
              const adjust = (delta) => setProducts(prev => prev.map(x => x.id === p.id ? { ...x, currentStock: Math.max(0, (x.currentStock || 0) + delta) } : x));
              return (
                <div key={p.id} onClick={() => setViewId(p.id)} style={{ background: T.bgCard, border: `0.5px solid ${low ? T.danger : T.border}`, borderLeft: `3px solid ${low ? T.danger : T.accent}`, borderRadius: T.radius, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, fontFamily: T.fontSerif, color: T.textPrimary }}>{mLabel(p)}</div>
                    <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 3 }}>
                      {(p.items || []).length > 0 ? `${p.items.length} ${lang === "zh" ? "项组成" : "項目"}` : (lang === "zh" ? "未关联配方" : "未関連")}
                      {p.sellPrice > 0 && " · " + fmtSellPrice(p.sellPrice, p)}
                    </div>
                  </div>
                  {/* v12: 快捷 -1 / +1 按钮 */}
                  <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button onClick={e => { e.stopPropagation(); adjust(-1); }} disabled={stock === 0} title={lang === "zh" ? "库存 -1" : "-1"} style={{ width: 28, height: 28, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, cursor: stock === 0 ? "not-allowed" : "pointer", fontSize: 14, color: T.textSecondary, opacity: stock === 0 ? 0.4 : 1 }}>−</button>
                    <button onClick={e => { e.stopPropagation(); adjust(1); }} title={lang === "zh" ? "库存 +1" : "+1"} style={{ width: 28, height: 28, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, cursor: "pointer", fontSize: 14, color: T.textSecondary }}>+</button>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 80 }}>
                    <div style={{ fontSize: 20, fontFamily: T.fontSerif, fontWeight: 500, color: low ? T.danger : T.textPrimary }}>{stock}</div>
                    <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 2 }}>
                      {lang === "zh" ? "库存" : "在庫"} / {lang === "zh" ? "阈值" : "ライン"} {th}
                      {low && <span style={{ color: T.danger, marginLeft: 4 }}>⚠️</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// v12: 销售/生产录入小组件(共用) - 支持任意日期
function SalesInput({ kind, today, onSubmit, lang }) {
  const [val, setVal] = useState("");
  const [date, setDate] = useState(today);
  const submit = () => {
    const q = parseFloat(val) || 0;
    if (q <= 0) return;
    onSubmit(q, date);
    setVal("");
    // 日期保持用户选择,方便连续录入同一天多条
  };
  const color = kind === "sale" ? T.danger : T.success;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <input type="date" value={date} max={today} onChange={e => setDate(e.target.value || today)} style={{ padding: "6px 8px", fontSize: 12, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, minWidth: 120 }} title={lang === "zh" ? "选日期(可补录过去日期)" : "日付選択"} />
      <input type="number" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }} placeholder={lang === "zh" ? (kind === "sale" ? "几件" : "几件") : (kind === "sale" ? "数" : "数")} style={{ flex: 1, minWidth: 60, padding: "6px 8px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary }} />
      <button onClick={submit} disabled={!val || parseFloat(val) <= 0} style={{ padding: "6px 10px", fontSize: 12, background: (!val || parseFloat(val) <= 0) ? T.bgMuted : color, color: (!val || parseFloat(val) <= 0) ? T.textTertiary : "#fff", border: "none", borderRadius: T.radiusSm, cursor: (!val || parseFloat(val) <= 0) ? "not-allowed" : "pointer", fontWeight: 500 }}>{kind === "sale" ? (lang === "zh" ? "记录卖出" : "販売記録") : (lang === "zh" ? "记录生产" : "製造記録")}</button>
    </div>
  );
}

// 商品编辑表单 (v12)
// [B6 优化 v2] 商品关联 picker — 加搜索 + 分组折叠,防配方多了一长串
function ProductItemPicker({ recipes, components, creations, mLabel, lang, onPick, onCancel }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState({ recipe: false, component: false, creation: false });

  // 把 3 类数据归一格式 + 模糊匹配关键字
  const filterByQuery = (item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (item.name || "").toLowerCase().includes(q) || (item.cat || "").toLowerCase().includes(q);
  };

  const recipePool = recipes.map(r => ({ id: r.id, name: mLabel(r), cat: r.category || "" })).filter(filterByQuery);
  const componentPool = components.map(c => ({ id: c.id, name: mLabel(c), cat: c.category || "" })).filter(filterByQuery);
  const creationPool = creations.map(c => ({ id: c.id, name: mLabel(c), cat: "" })).filter(filterByQuery);

  // 搜索时强制展开所有段
  const isSearching = !!query.trim();
  const totalMatched = recipePool.length + componentPool.length + creationPool.length;
  const totalAll = recipes.length + components.length + creations.length;

  const Section = ({ title, emoji, pool, type, color, originCount }) => {
    if (originCount === 0) return null;
    const isCollapsed = !isSearching && collapsed[type];
    return (
      <div style={{ marginBottom: 12 }}>
        <div
          onClick={() => !isSearching && setCollapsed(c => ({ ...c, [type]: !c[type] }))}
          style={{ fontSize: 12, fontWeight: 500, color: color, marginBottom: 6, padding: "6px 8px", letterSpacing: "0.5px", cursor: isSearching ? "default" : "pointer", background: T.bgMuted, borderRadius: T.radiusSm, display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" }}
        >
          <span>{emoji} {title} <span style={{ color: T.textTertiary, fontWeight: 400, fontSize: 11 }}>{isSearching ? `(${pool.length}/${originCount})` : `(${originCount})`}</span></span>
          {!isSearching && <span style={{ fontSize: 11, color: T.textTertiary }}>{isCollapsed ? "▶" : "▼"}</span>}
        </div>
        {!isCollapsed && pool.length > 0 && (
          <div style={{ display: "grid", gap: 4 }}>
            {pool.map(item => (
              <div key={type + item.id} onClick={() => onPick(item.id, type)} style={{ padding: "10px 14px", background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>{item.name}</div>
                {item.cat && <div style={{ fontSize: 11, color: T.textTertiary }}>{item.cat}</div>}
              </div>
            ))}
          </div>
        )}
        {!isCollapsed && pool.length === 0 && isSearching && (
          <div style={{ fontSize: 11, color: T.textTertiary, fontStyle: "italic", padding: "4px 8px" }}>—</div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Btn onClick={onCancel}>← {lang === "zh" ? "返回" : "戻る"}</Btn>
        {isSearching && <span style={{ fontSize: 11, color: T.textTertiary }}>{lang === "zh" ? `匹配 ${totalMatched} / ${totalAll}` : `${totalMatched} / ${totalAll}`}</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>{lang === "zh" ? "选择关联项" : "関連項目を選択"}</div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={lang === "zh" ? "🔍 搜索名称 / 分类" : "🔍 検索"}
        style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, marginBottom: 16, fontFamily: T.fontSans }}
      />
      <Section title={lang === "zh" ? "配方" : "レシピ"} emoji="🧁" pool={recipePool} type="recipe" color="#a87b3e" originCount={recipes.length} />
      <Section title={lang === "zh" ? "组件" : "部品"} emoji="🧩" pool={componentPool} type="component" color="#5b8aa3" originCount={components.length} />
      <Section title={lang === "zh" ? "组合蛋糕" : "ケーキ"} emoji="🎂" pool={creationPool} type="creation" color="#a05a8d" originCount={creations.length} />
    </div>
  );
}

// [B6 修复] 加 components,商品可关联组件
function ProductEditForm({ product, recipes, creations, components = [], lang, onSave, onDelete, onBack }) {
  // [B5 修复] note → notesZh/notesJa 双语
  const empty = { nameZh: "", nameJa: "", imageUrls: [], items: [], currentStock: 0, threshold: 0, leadTimeDays: 0, sellPrice: 0, priceCurrency: "CNY", notesZh: "", notesJa: "" };
  // 旧数据兼容:有 note 但没 notesZh/notesJa,迁移到 notesZh
  const initial = product ? { ...empty, ...product } : empty;
  if (initial.note && !initial.notesZh && !initial.notesJa) {
    initial.notesZh = initial.note;
  }
  const [form, setForm] = useState(initial);
  const [picker, setPicker] = useState(null); // { forItemIdx? null=新增 }
  const [errorMsg, setErrorMsg] = useState("");
  const inputStyle = { width: "100%", padding: "7px 10px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans };
  const mLabel = (obj) => obj ? (lang === "zh" ? (obj.nameZh || obj.nameJa) : (obj.nameJa || obj.nameZh)) : "";

  const handleSave = () => {
    if (!(form.nameZh || "").trim()) {
      setErrorMsg(lang === "zh" ? "请输入商品名" : "商品名を入力");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    onSave({
      ...form,
      id: product ? product.id : ("prod_" + Date.now() + Math.random().toString(36).slice(2, 6)),
      currentStock: parseFloat(form.currentStock) || 0,
      threshold: parseFloat(form.threshold) || 0,
      leadTimeDays: parseFloat(form.leadTimeDays) || 0,
      sellPrice: parseFloat(form.sellPrice) || 0,
      priceCurrency: priceCurOf(form),
      items: (form.items || []).map(it => ({ ...it, qty: parseFloat(it.qty) || 1 })),
      updatedAt: new Date().toISOString(),
    });
  };

  const addItem = (linkedId, linkedType) => {
    setForm(f => ({ ...f, items: [...(f.items || []), { linkedId, linkedType, qty: 1 }] }));
    setPicker(null);
  };
  const updateItem = (idx, field, val) => setForm(f => ({ ...f, items: (f.items || []).map((it, i) => i === idx ? { ...it, [field]: val } : it) }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: (f.items || []).filter((_, i) => i !== idx) }));

  if (picker) {
    // [B6 优化 v2] picker 加搜索 + 分组折叠
    return <ProductItemPicker
      recipes={recipes} components={components} creations={creations}
      mLabel={mLabel} lang={lang}
      onPick={(id, type) => addItem(id, type)}
      onCancel={() => setPicker(null)}
    />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase" }}>{lang === "zh" ? (product ? "编辑商品" : "新建商品") : (product ? "商品編集" : "新規商品")}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {product && <Btn variant="danger" size="sm" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        </div>
      </div>

      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 4 }}>{lang === "zh" ? "商品名(中) *" : "商品名(中)"}</div>
            <input value={form.nameZh} onChange={e => setForm({ ...form, nameZh: e.target.value })} placeholder="例: 草莓蛋糕" style={inputStyle} />
          </label>
          <label>
            <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 4 }}>{lang === "zh" ? "商品名(日)" : "商品名(日) *"}</div>
            <input value={form.nameJa} onChange={e => setForm({ ...form, nameJa: e.target.value })} placeholder="例: 苺ショートケーキ" style={inputStyle} />
          </label>
        </div>
      </div>

      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15 }}>📦 {lang === "zh" ? "组成 (支持礼盒组合)" : "構成"}</div>
          <Btn size="sm" variant="primary" onClick={() => setPicker({})}>+ {lang === "zh" ? "加一项" : "追加"}</Btn>
        </div>
        {(form.items || []).length === 0 ? (
          <div style={{ fontSize: 12, color: T.textTertiary, fontStyle: "italic", padding: "12px 0" }}>{lang === "zh" ? "还没有组成项。点「+ 加一项」从配方/组合蛋糕/组件选。礼盒可加多项。" : "未追加"}</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {(form.items || []).map((it, i) => {
              // [B6 修复] 支持 component
              const target = it.linkedType === "creation" ? creations.find(c => c.id === it.linkedId)
                : it.linkedType === "component" ? components.find(c => c.id === it.linkedId)
                : recipes.find(r => r.id === it.linkedId);
              const emoji = it.linkedType === "creation" ? "🎂" : it.linkedType === "component" ? "🧩" : "🧁";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: T.bgMuted, borderRadius: T.radiusSm }}>
                  <span style={{ fontSize: 12, color: T.textTertiary }}>{emoji}</span>
                  <div style={{ flex: 1, fontSize: 13 }}>{target ? mLabel(target) : (lang === "zh" ? "(已删除)" : "(削除済)")}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: T.textTertiary }}>×</span>
                    <input type="number" value={it.qty || 1} onChange={e => updateItem(i, "qty", e.target.value)} style={{ ...inputStyle, width: 60, padding: "4px 6px" }} />
                  </div>
                  <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", cursor: "pointer", color: T.danger, fontSize: 16 }}>×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12 }}>📊 {lang === "zh" ? "库存 & 销售" : "在庫 & 販売"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <label>
            <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 4 }}>{lang === "zh" ? "当前库存" : "現在庫"}</div>
            <input type="number" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} style={inputStyle} />
          </label>
          <label>
            <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 4 }}>{lang === "zh" ? "补货阈值" : "補充ライン"}</div>
            <input type="number" value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} style={inputStyle} />
          </label>
          <label>
            <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 4 }}>{lang === "zh" ? "制作周期(天)" : "製作日数"}</div>
            <input type="number" value={form.leadTimeDays} onChange={e => setForm({ ...form, leadTimeDays: e.target.value })} style={inputStyle} />
          </label>
          <label>
            <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 4 }}>{lang === "zh" ? "销售单价(¥)" : "販売価(¥)"}</div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input type="number" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} style={inputStyle} />
              {priceCurBtn(form, c => setForm(prev => ({ ...prev, priceCurrency: c })), lang)}
            </div>
          </label>
        </div>
        <label style={{ display: "block", marginTop: 12 }}>
          <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 4 }}>{lang === "zh" ? "备注(中文)" : "メモ(中国語)"}</div>
          <input value={form.notesZh || ""} onChange={e => setForm({ ...form, notesZh: e.target.value })} placeholder="储存方式 / 保质期 / 其它" style={inputStyle} />
        </label>
        <label style={{ display: "block", marginTop: 8 }}>
          <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 4 }}>{lang === "zh" ? "备注(日文)" : "メモ(日本語)"}</div>
          <input value={form.notesJa || ""} onChange={e => setForm({ ...form, notesJa: e.target.value })} placeholder="保存方法 / 賞味期限 / その他" style={inputStyle} />
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8, alignItems: "center" }}>
        {errorMsg && <span style={{ color: T.danger, fontSize: 13, marginRight: 8 }}>⚠ {errorMsg}</span>}
        <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        <Btn variant="primary" onClick={handleSave}>{lang === "zh" ? "保存商品" : "商品保存"}</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🚚 供货商 View (v13)
// ═══════════════════════════════════════════════════════════════
const DAY_LABELS_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const DAY_LABELS_JA = ["日", "月", "火", "水", "木", "金", "土"];

function SuppliersView({ suppliers, setSuppliers, shopMaterials, materials, brands, lang, showToast, confirmDialog, viewId, setViewId, editTarget, setEditTarget }) {
  const mLabel = (m) => m ? (lang === "zh" ? (m.nameZh || m.nameJa) : (m.nameJa || m.nameZh)) : "";
  const dayLabels = lang === "zh" ? DAY_LABELS_ZH : DAY_LABELS_JA;

  if (editTarget !== null) {
    return <SupplierEditForm
      supplier={editTarget._new ? null : editTarget}
      lang={lang}
      onSave={(s) => {
        setSuppliers(prev => {
          const found = prev.find(x => x.id === s.id);
          return found ? prev.map(x => x.id === s.id ? s : x) : [...prev, s];
        });
        showToast(lang === "zh" ? "✓ 供货商已保存" : "✓ 仕入先保存");
        setViewId(s.id);
        setEditTarget(null);
      }}
      onDelete={() => {
        confirmDialog(lang === "zh" ? "删除这个供货商吗？本店原料上的关联会自动解除。" : "この仕入先を削除? 関連も解除されます。", () => {
          // 删 supplier + 从 shopMaterials 的 supplierIds 中剥离
          setSuppliers(prev => prev.filter(x => x.id !== editTarget.id));
          showToast(lang === "zh" ? "已删除" : "削除しました");
          setEditTarget(null);
        });
      }}
      onBack={() => {
        // [B4 修复] 有 id 跳详情,无 id 回列表
        if (editTarget && editTarget.id) setViewId(editTarget.id);
        setEditTarget(null);
      }}
    />;
  }

  if (viewId) {
    const s = suppliers.find(x => x.id === viewId);
    if (!s) return null;
    // 本店原料里用这个供货商的条目
    const linkedSMs = shopMaterials.filter(sm => Array.isArray(sm.supplierIds) && sm.supplierIds.includes(s.id));
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase" }}>{lang === "zh" ? "供货商详情" : "仕入先詳細"}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={() => setEditTarget(s)}>{lang === "zh" ? "编辑" : "編集"}</Btn>
            <Btn onClick={() => setViewId(null)}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
          </div>
        </div>
        <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <div style={{ fontFamily: T.fontSerif, fontSize: 24, fontWeight: 500, color: T.textPrimary, marginBottom: 12 }}>🚚 {s.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div style={{ background: T.bgMuted, padding: "10px 12px", borderRadius: T.radiusSm }}>
              <div style={{ fontSize: 10, color: T.textTertiary, textTransform: "uppercase" }}>{lang === "zh" ? "送货日(每周)" : "配送曜日"}</div>
              <div style={{ fontFamily: T.fontSerif, fontSize: 15, color: T.textPrimary, marginTop: 4 }}>
                {(s.deliveryDaysOfWeek || []).length === 0 ? <span style={{ color: T.textTertiary, fontStyle: "italic" }}>{lang === "zh" ? "未设" : "未設定"}</span> :
                  (s.deliveryDaysOfWeek || []).sort().map(d => dayLabels[d]).join(" · ")}
              </div>
            </div>
            <div style={{ background: T.bgMuted, padding: "10px 12px", borderRadius: T.radiusSm }}>
              <div style={{ fontSize: 10, color: T.textTertiary, textTransform: "uppercase" }}>{lang === "zh" ? "关联本店原料" : "関連仕入"}</div>
              <div style={{ fontFamily: T.fontSerif, fontSize: 18, fontWeight: 500, color: T.accent, marginTop: 4 }}>{linkedSMs.length}</div>
            </div>
          </div>
          {(s.closureWindows || []).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 6 }}>{lang === "zh" ? "闭店 / 休业窗口" : "休業期間"}</div>
              <div style={{ display: "grid", gap: 4 }}>
                {(s.closureWindows || []).map((w, i) => (
                  <div key={i} style={{ fontSize: 12, padding: "6px 10px", background: T.warningBg, borderRadius: T.radiusSm, display: "flex", justifyContent: "space-between" }}>
                    <span>{w.start} ~ {w.end}</span>
                    {w.label && <span style={{ color: T.warning }}>{w.label}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {s.note && <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 12, lineHeight: 1.6 }}>📌 {s.note}</div>}
        </div>
        {linkedSMs.length > 0 && (
          <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1rem 1.25rem" }}>
            <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 14, marginBottom: 10 }}>{lang === "zh" ? "关联的本店原料" : "関連する仕入原料"}</div>
            <div style={{ display: "grid", gap: 5 }}>
              {linkedSMs.slice(0, 30).map(sm => {
                const mat = materials.find(m => m.id === sm.materialId);
                return (
                  <div key={sm.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 10px", background: T.bgMuted, borderRadius: T.radiusSm }}>
                    <span>{mat ? mLabel(mat) : sm.materialId}</span>
                    <span style={{ color: T.textSecondary }}>{fmtUnitPrice(sm.pricePerG, curOf(sm))}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 8, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: T.textPrimary, fontFamily: T.fontSerif }}>{lang === "zh" ? "🚚 供货商" : "🚚 仕入先"}</div>
          <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 3 }}>{lang === "zh" ? `${suppliers.length} 家 · 管理送货日/闭店窗口,支撑采购清单计算` : `${suppliers.length} 社`}</div>
        </div>
        <Btn variant="primary" onClick={() => setEditTarget({ _new: true })}>{lang === "zh" ? "+ 新建供货商" : "+ 新規仕入先"}</Btn>
      </div>
      {suppliers.length === 0 ? (
        <div style={{ background: T.bgSoft, borderRadius: T.radius, padding: "40px 20px", textAlign: "center", fontSize: 13, color: T.textSecondary, lineHeight: 1.8 }}>
          {lang === "zh" ? <>还没有供货商。<br/>录入每家供货商的"每周几送货 + 闭店窗口",<br/>采购清单能算"新年前要一次性订多少 / 订什么"。</> : <>仕入先未登録。</>}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {suppliers.map(s => {
            const linkedCount = shopMaterials.filter(sm => Array.isArray(sm.supplierIds) && sm.supplierIds.includes(s.id)).length;
            const days = (s.deliveryDaysOfWeek || []).sort().map(d => dayLabels[d]).join(" · ");
            return (
              <div key={s.id} onClick={() => setViewId(s.id)} style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderLeft: `3px solid ${T.accent}`, borderRadius: T.radius, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, fontFamily: T.fontSerif, color: T.textPrimary }}>🚚 {s.name}</div>
                  <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 3 }}>
                    {days || (lang === "zh" ? "未设送货日" : "曜日未設定")}
                    {(s.closureWindows || []).length > 0 && ` · ${s.closureWindows.length} ${lang === "zh" ? "个闭店窗口" : "休業期間"}`}
                    {linkedCount > 0 && ` · ${linkedCount} ${lang === "zh" ? "种原料" : "件"}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SupplierEditForm({ supplier, lang, onSave, onDelete, onBack }) {
  const empty = { name: "", deliveryDaysOfWeek: [], closureWindows: [], note: "" };
  const [form, setForm] = useState(supplier ? { ...empty, ...supplier } : empty);
  const [errorMsg, setErrorMsg] = useState("");
  const inputStyle = { width: "100%", padding: "7px 10px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans };
  const dayLabels = lang === "zh" ? DAY_LABELS_ZH : DAY_LABELS_JA;

  const toggleDay = (d) => setForm(f => {
    const set = new Set(f.deliveryDaysOfWeek || []);
    if (set.has(d)) set.delete(d); else set.add(d);
    return { ...f, deliveryDaysOfWeek: Array.from(set).sort() };
  });
  const addWindow = () => setForm(f => ({ ...f, closureWindows: [...(f.closureWindows || []), { start: "", end: "", label: "" }] }));
  const updateWindow = (idx, field, val) => setForm(f => ({ ...f, closureWindows: (f.closureWindows || []).map((w, i) => i === idx ? { ...w, [field]: val } : w) }));
  const removeWindow = (idx) => setForm(f => ({ ...f, closureWindows: (f.closureWindows || []).filter((_, i) => i !== idx) }));

  const handleSave = () => {
    if (!(form.name || "").trim()) {
      setErrorMsg(lang === "zh" ? "请输入供货商名" : "仕入先名を入力");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    onSave({
      ...form,
      id: supplier ? supplier.id : ("sup_" + Date.now() + Math.random().toString(36).slice(2, 6)),
      closureWindows: (form.closureWindows || []).filter(w => w.start && w.end),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase" }}>{lang === "zh" ? (supplier ? "编辑供货商" : "新建供货商") : (supplier ? "仕入先編集" : "新規仕入先")}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {supplier && <Btn variant="danger" size="sm" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        </div>
      </div>
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 4 }}>{lang === "zh" ? "供货商名 *" : "仕入先名 *"}</div>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={lang === "zh" ? "例: TOMIZ / 富泽商店" : "例: TOMIZ"} style={inputStyle} autoFocus />
        </label>
      </div>
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 10 }}>📅 {lang === "zh" ? "送货日(每周)" : "配送曜日"}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {dayLabels.map((d, i) => {
            const active = (form.deliveryDaysOfWeek || []).includes(i);
            return (
              <button key={i} type="button" onClick={() => toggleDay(i)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 500, background: active ? T.accent : "transparent", color: active ? "#FFFFFF" : T.textSecondary, border: `0.5px solid ${active ? T.accent : T.border}`, borderRadius: T.radiusSm, cursor: "pointer", minWidth: 42 }}>{d}</button>
            );
          })}
        </div>
      </div>
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15 }}>🏖 {lang === "zh" ? "闭店 / 休业窗口" : "休業期間"}</div>
          <Btn size="sm" variant="primary" onClick={addWindow}>+ {lang === "zh" ? "加一条" : "追加"}</Btn>
        </div>
        <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 10 }}>{lang === "zh" ? "选择起止日期(支持跨年,例 2026-12-30 ~ 2027-01-03)" : "開始・終了日を選択(年跨ぎ対応)"}</div>
        {(form.closureWindows || []).length === 0 ? (
          <div style={{ fontSize: 12, color: T.textTertiary, fontStyle: "italic" }}>{lang === "zh" ? "没有闭店窗口(常年送货)" : "通年配送"}</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {(form.closureWindows || []).map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <input type="date" value={w.start || ""} onChange={e => updateWindow(i, "start", e.target.value)} style={{ ...inputStyle, minWidth: 140 }} />
                <span style={{ color: T.textTertiary }}>~</span>
                <input type="date" value={w.end || ""} min={w.start || undefined} onChange={e => updateWindow(i, "end", e.target.value)} style={{ ...inputStyle, minWidth: 140 }} />
                <input value={w.label || ""} onChange={e => updateWindow(i, "label", e.target.value)} placeholder={lang === "zh" ? "标签(新年休)" : "ラベル"} style={{ ...inputStyle, flex: 1, minWidth: 100 }} />
                <button onClick={() => removeWindow(i)} style={{ background: "none", border: "none", cursor: "pointer", color: T.danger, fontSize: 16 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 4 }}>{lang === "zh" ? "备注" : "メモ"}</div>
          <input value={form.note || ""} onChange={e => setForm({ ...form, note: e.target.value })} placeholder={lang === "zh" ? "联系人 / 电话 / 起订量 / 其他" : "担当者 等"} style={inputStyle} />
        </label>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
        {errorMsg && <span style={{ color: T.danger, fontSize: 13, marginRight: 8 }}>⚠ {errorMsg}</span>}
        <Btn onClick={onBack}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        <Btn variant="primary" onClick={handleSave}>{lang === "zh" ? "保存供货商" : "仕入先保存"}</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 📦 采购清单 View (v13)
// 给定窗口 → 按计划产量展开 ingredient 消耗 → 按 supplier 分组
// ═══════════════════════════════════════════════════════════════
// [B6 修复] 加 components,采购计算支持组件
function PurchaseView({ products, salesLog, recipes, creations, components = [], materials, brands, shopMaterials, suppliers, lang }) {
  const today = new Date().toISOString().slice(0, 10);
  const plus = (d, days) => { const x = new Date(d); x.setDate(x.getDate() + days); return x.toISOString().slice(0, 10); };
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(plus(today, 7));
  const days = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1);

  // 历史均值: 过去 30 天日均
  const avgPerDay = (productId) => {
    const since = plus(today, -30);
    const list = (salesLog || []).filter(s => s.productId === productId && s.date >= since);
    const total = list.reduce((a, s) => a + (parseFloat(s.soldQty) || 0), 0);
    return total / 30;
  };
  const suggestQty = (productId) => Math.ceil(avgPerDay(productId) * days * 1.2);

  // 每个 product 计划数量(可改)
  const [plan, setPlan] = useState(() => {
    const init = {};
    (products || []).forEach(p => { init[p.id] = suggestQty(p.id); });
    return init;
  });
  // 日期变化时重算默认推荐(只对没被用户手动改过的)
  const [dirtyPlanIds, setDirtyPlanIds] = useState(new Set());
  useEffect(() => {
    setPlan(prev => {
      const next = { ...prev };
      (products || []).forEach(p => {
        if (!dirtyPlanIds.has(p.id)) next[p.id] = suggestQty(p.id);
      });
      return next;
    });
  // eslint-disable-next-line
  }, [startDate, endDate]);

  const [computed, setComputed] = useState(null); // { grams: {materialId: g}, bySupplier: {supplierId: [{matId, grams}]} }
  const mLabel = (o) => o ? (lang === "zh" ? (o.nameZh || o.nameJa) : (o.nameJa || o.nameZh)) : "";
  const inputStyle = { padding: "6px 8px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary };

  const compute = () => {
    const grams = {}; // materialId -> 总克数
    const collect = (obj, multiplier) => {
      (obj.ingredients || []).forEach(ing => {
        const q = parseFloat(ing.qty) || 0;
        if (!ing.materialId || q <= 0) return;
        grams[ing.materialId] = (grams[ing.materialId] || 0) + q * multiplier;
      });
      (obj.layers || []).forEach(l => collect(l, multiplier));
    };
    (products || []).forEach(p => {
      const planQty = parseFloat(plan[p.id]) || 0;
      if (planQty <= 0) return;
      (p.items || []).forEach(it => {
        // [B6 修复] 支持 component(组件)
        const target = it.linkedType === "creation" ? creations.find(c => c.id === it.linkedId)
          : it.linkedType === "component" ? components.find(c => c.id === it.linkedId)
          : recipes.find(r => r.id === it.linkedId);
        if (!target) return;
        // recipe/component: 每份 item 需要 X.yield 个单位;实际要做 planQty * it.qty 个单位 → multiplier = planQty * it.qty / yield
        // creation: 每份 item 是一整个 creation,直接 planQty * it.qty
        const unit = parseFloat(it.qty) || 1;
        const mult = it.linkedType === "creation"
          ? planQty * unit
          : (planQty * unit) / Math.max(1, parseFloat(target.yield) || 1);
        collect(target, mult);
      });
    });
    // 按 supplier 分组
    const bySupplier = {}; // supplierId or '' -> [{materialId, grams, sm}]
    Object.entries(grams).forEach(([materialId, g]) => {
      const sm = (shopMaterials || []).find(x => x.materialId === materialId);
      const supId = sm && Array.isArray(sm.supplierIds) && sm.supplierIds[0] ? sm.supplierIds[0] : "";
      if (!bySupplier[supId]) bySupplier[supId] = [];
      bySupplier[supId].push({ materialId, grams: g, sm });
    });
    // 每组排序: 按克数降序
    Object.values(bySupplier).forEach(arr => arr.sort((a, b) => b.grams - a.grams));
    setComputed({ grams, bySupplier, computedAt: new Date().toISOString() });
  };

  // 闭店窗口判定(YYYY-MM-DD 绝对日期, v16+)
  const isClosureAt = (sup, dateStr) => {
    return (sup.closureWindows || []).some(w => {
      if (!w.start || !w.end) return false;
      return dateStr >= w.start && dateStr <= w.end;
    });
  };
  // 某 supplier 下次送货日: 从某日起往后找 deliveryDaysOfWeek 且不在闭店窗口的第一天
  const nextDelivery = (sup, fromDateStr) => {
    const days = new Set((sup.deliveryDaysOfWeek || []).map(Number));
    if (days.size === 0) return null;
    let d = new Date(fromDateStr);
    for (let i = 0; i < 14; i++) {
      const dayOfWeek = d.getDay();
      const ds = d.toISOString().slice(0, 10);
      if (days.has(dayOfWeek) && !isClosureAt(sup, ds)) return ds;
      d.setDate(d.getDate() + 1);
    }
    return null;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: T.textPrimary, fontFamily: T.fontSerif }}>{lang === "zh" ? "📦 采购清单" : "📦 仕入リスト"}</div>
          <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 3 }}>{lang === "zh" ? "窗口内要做多少 → 按供货商分组算采购量" : "期間の計画 → 仕入先別仕入量"}</div>
        </div>
      </div>

      {/* 日期窗口 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 14 }}>📅 {lang === "zh" ? "窗口" : "期間"}</div>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
          <span style={{ color: T.textTertiary }}>~</span>
          <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: 12, color: T.textSecondary }}>{lang === "zh" ? `共 ${days} 天` : `${days} 日間`}</span>
        </div>
        {/* supplier 送货日/闭店预览 */}
        {suppliers.length > 0 && (
          <div style={{ marginTop: 10, display: "grid", gap: 5 }}>
            {suppliers.map(sup => {
              const nextD = nextDelivery(sup, startDate);
              const isInWindowClosure = (sup.closureWindows || []).some(w => {
                if (!w.start || !w.end) return false;
                // 窗口 [startDate, endDate] 与闭店窗口 [w.start, w.end] 有重叠
                return startDate <= w.end && w.start <= endDate;
              });
              return (
                <div key={sup.id} style={{ fontSize: 11, color: T.textSecondary, display: "flex", gap: 10, alignItems: "center" }}>
                  <span>🚚 {sup.name}</span>
                  <span style={{ color: T.textTertiary }}>
                    {lang === "zh" ? "下次送货" : "次回"}: <b>{nextD || "—"}</b>
                  </span>
                  {isInWindowClosure && <span style={{ color: T.warning }}>⚠️ {lang === "zh" ? "窗口内有闭店" : "休業あり"}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 计划制作 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 14, marginBottom: 8 }}>🍰 {lang === "zh" ? "计划制作(默认按过去 30 天 × 1.2 buffer,可改)" : "計画量(過去30日 × 1.2)"}</div>
        {products.length === 0 ? (
          <div style={{ fontSize: 12, color: T.textTertiary, fontStyle: "italic" }}>{lang === "zh" ? "还没有商品" : "商品未登録"}</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {products.map(p => {
              const recommend = suggestQty(p.id);
              const cur = plan[p.id] == null ? recommend : plan[p.id];
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: T.bgMuted, borderRadius: T.radiusSm }}>
                  <div style={{ flex: 1, fontSize: 13 }}>{mLabel(p)}</div>
                  <div style={{ fontSize: 10, color: T.textTertiary, minWidth: 80 }}>{lang === "zh" ? `建议 ${recommend}` : `推奨 ${recommend}`}</div>
                  {/* [B2 修复] 手机端没原生 +/- 箭头 → 加自定义按钮; value 处理前置 0 */}
                  <button onClick={() => {
                    const next = Math.max(0, cur - 1);
                    setPlan(prev => ({ ...prev, [p.id]: next }));
                    setDirtyPlanIds(s => new Set([...s, p.id]));
                  }} style={{ width: 28, height: 28, borderRadius: T.radiusSm, border: `0.5px solid ${T.border}`, background: T.bgCard, fontSize: 16, lineHeight: 1, cursor: "pointer", color: T.textSecondary, flexShrink: 0 }}>−</button>
                  <input type="number" value={cur === 0 ? "" : cur} min="0" placeholder="0" onChange={e => {
                    const v = e.target.value;
                    setPlan(prev => ({ ...prev, [p.id]: v === "" ? 0 : parseFloat(v) }));
                    setDirtyPlanIds(s => new Set([...s, p.id]));
                  }} style={{ ...inputStyle, width: 50, textAlign: "center" }} />
                  <button onClick={() => {
                    const next = cur + 1;
                    setPlan(prev => ({ ...prev, [p.id]: next }));
                    setDirtyPlanIds(s => new Set([...s, p.id]));
                  }} style={{ width: 28, height: 28, borderRadius: T.radiusSm, border: `0.5px solid ${T.border}`, background: T.bgCard, fontSize: 16, lineHeight: 1, cursor: "pointer", color: T.textSecondary, flexShrink: 0 }}>+</button>
                  <span style={{ fontSize: 11, color: T.textTertiary }}>{p.unit || (lang === "zh" ? "件" : "件")}</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <Btn variant="primary" onClick={compute}>{lang === "zh" ? "📦 计算采购清单" : "📦 仕入計算"}</Btn>
        </div>
      </div>

      {/* 采购结果 */}
      {computed && (() => {
        const entries = Object.entries(computed.bySupplier).sort(([a], [b]) => {
          if (!a) return 1;
          if (!b) return -1;
          return 0;
        });
        return (
          <div>
            {entries.length === 0 && <div style={{ background: T.bgSoft, padding: 40, textAlign: "center", borderRadius: T.radius, color: T.textSecondary }}>{lang === "zh" ? "按当前计划无原料需求" : "計画内の仕入不要"}</div>}
            {entries.map(([supId, items]) => {
              const sup = suppliers.find(s => s.id === supId);
              const nextD = sup ? nextDelivery(sup, startDate) : null;
              const groupTotal = items.reduce((acc, it) => {
                const pricePerG = it.sm ? parseFloat(it.sm.pricePerG) : 0;
                return acc + (pricePerG > 0 ? pricePerG * it.grams : 0);
              }, 0);
              return (
                <div key={supId || "unassigned"} style={{ background: T.bgCard, border: `0.5px solid ${sup ? T.border : T.warning}`, borderLeft: `3px solid ${sup ? T.accent : T.warning}`, borderRadius: T.radiusLg, padding: "1rem 1.25rem", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                    <div>
                      <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15 }}>
                        {sup ? `🚚 ${sup.name}` : (lang === "zh" ? "⚠️ 未分配供货商" : "⚠️ 仕入先未設定")}
                      </div>
                      {sup && nextD && <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 3 }}>{lang === "zh" ? `下次送货 ${nextD}` : `次回配送 ${nextD}`}</div>}
                      {!sup && <div style={{ fontSize: 11, color: T.warning, marginTop: 3 }}>{lang === "zh" ? "去本店原料编辑里关联供货商" : "仕入先を関連付けてください"}</div>}
                    </div>
                    <div style={{ fontSize: 13, fontFamily: T.fontSerif, fontWeight: 500, color: T.accent }}>
                      {items.length} {lang === "zh" ? "种" : "件"}
                      {groupTotal > 0 && <span style={{ marginLeft: 8, color: T.success }}>¥{groupTotal.toFixed(0)}</span>}
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {items.map(it => {
                      const mat = materials.find(m => m.id === it.materialId);
                      const packG = it.sm && it.sm.packSize ? parsePackSizeToGrams(it.sm.packSize) : ((mat && mat.packSize) ? parsePackSizeToGrams(mat.packSize) : 0);
                      const packs = packG > 0 ? Math.ceil(it.grams / packG) : null;
                      const pricePerG = it.sm ? parseFloat(it.sm.pricePerG) : 0;
                      const subtotal = pricePerG > 0 ? pricePerG * it.grams : 0;
                      return (
                        <div key={it.materialId} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr", gap: 8, padding: "6px 10px", borderBottom: `0.5px dashed ${T.borderSoft}`, fontSize: 12, alignItems: "center" }}>
                          <div>{mat ? mLabel(mat) : <span style={{ color: T.danger }}>{it.materialId}</span>}</div>
                          <div style={{ textAlign: "right", color: T.textSecondary }}>{it.grams.toFixed(0)}g</div>
                          <div style={{ textAlign: "right", fontSize: 11, color: T.textTertiary }}>
                            {packs != null ? `${packs} ${lang === "zh" ? "包" : "パック"}` : (lang === "zh" ? "规格未知" : "規格?")}
                          </div>
                          <div style={{ textAlign: "right", fontFamily: T.fontSerif, color: subtotal > 0 ? T.textPrimary : T.textTertiary }}>
                            {subtotal > 0 ? `¥${subtotal.toFixed(0)}` : "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

// ─── 🔒 v1 内部テスト密码门 (LuLu 改这一行换密码) ─────────────────────
const RURU_V1_PWD = "ruru2026";
const RURU_V1_PWD_KEY = "ruru_v1_test_pwd_ok";

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (input === RURU_V1_PWD) {
      try { localStorage.setItem(RURU_V1_PWD_KEY, "true"); } catch {}
      onUnlock();
    } else {
      setError("パスワードが正しくありません / 密码不正确");
      setInput("");
    }
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.paper, padding: 20, fontFamily: T.fontSans, colorScheme: "light" }}>
      <style>{GLOBAL_CSS}</style>
      <form onSubmit={submit} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: "40px 32px", maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}><Wordmark size={26} /></div>
        <div style={{ ...T.fs.micro, color: T.subtle, marginBottom: 24, fontFamily: T.fontSerif }}>パティスリー管理 · v1 内部テスト</div>
        <div style={{ ...T.fs.small, color: T.body, marginBottom: 18, lineHeight: 1.7 }}>
          このアプリは内部テスト中です<br/>
          这个 app 正在内部测试中
        </div>
        <input
          type="password"
          className="k-input"
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          placeholder="パスワード / 密码"
          autoFocus
          style={{ width: "100%", padding: "10px 14px", fontSize: 14, border: `1px solid ${T.border}`, borderRadius: T.radius, marginBottom: 10, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: T.surface, color: T.ink }}
        />
        {error && <div style={{ ...T.fs.caption, color: T.danger, marginBottom: 8 }}>{error}</div>}
        <button type="submit" className="k-btn k-btn-primary" style={{ width: "100%", padding: "12px 14px", background: T.ink, color: T.paper, border: `1px solid ${T.ink}`, borderRadius: T.radius, fontSize: 14, fontWeight: 400, cursor: "pointer", marginTop: 6, fontFamily: "inherit" }}>入る / 进入</button>
        <div style={{ ...T.fs.label, color: T.muted, marginTop: 22, lineHeight: 1.7 }}>
          パスワードは LuLu からお伝えします<br/>
          一度入力すれば次回は不要です
        </div>
      </form>
    </div>
  );
}

// ─── 🔒 v1 内部测试 wrapper (默认 export, 包 PasswordGate + App) ─────
export default function AppRoot() {
  const [pwdOk, setPwdOk] = useState(() => {
    try { return localStorage.getItem(RURU_V1_PWD_KEY) === "true"; } catch { return false; }
  });
  if (!pwdOk) return <PasswordGate onUnlock={() => setPwdOk(true)} />;
  return <App />;
}

// ─── Main App ─────────────────────────────────────────────────────
function App() {
  const stored = loadData();
  // v1 内测: 默认种子 = 今天录入的 Framboisier + Caramel Abricot 全套
  // 老种子 (FINANCIER / COFFEE_BASQUE_* / AGREABLE_MOUSSE / DEFAULT_KNOWLEDGE / DEFAULT_CATS) 已隐藏 (代码保留以备回退)
  const [recipes, setRecipes] = useState(mergeWithDefaults(stored?.recipes, SEED_RECIPES));
  const [cats, setCats] = useState(migrateCats(stored?.cats) || []);
  const [components, setComponents] = useState(mergeWithDefaults(stored?.components, SEED_COMPONENTS));
  const [creations, setCreations] = useState(mergeWithDefaults(stored?.creations, SEED_CREATIONS));
  const [knowledge, setKnowledge] = useState(mergeWithDefaults(stored?.knowledge, SEED_KNOWLEDGE));
  // 📚 材料百科
  const [brands, setBrands] = useState(stored?.brands || []);
  const [materials, setMaterials] = useState(stored?.materials || []);
  // 🏷️ 本店原料（v11）：店铺实际采购的原料，带本店价
  const [shopMaterials, setShopMaterials] = useState(stored?.shopMaterials || []);
  // 🍰 商品 + 库存系统（v12）
  const [products, setProducts] = useState(stored?.products || []);
  const [salesLog, setSalesLog] = useState(stored?.salesLog || []);
  const [productionLog, setProductionLog] = useState(stored?.productionLog || []);
  const [productViewId, setProductViewId] = useState(null);
  const [productEditTarget, setProductEditTarget] = useState(null); // null=新建, obj=编辑
  // 🚚 供货商 + 采购清单（v13）
  const [suppliers, setSuppliers] = useState(stored?.suppliers || []);
  const [supplierViewId, setSupplierViewId] = useState(null);
  const [supplierEditTarget, setSupplierEditTarget] = useState(null);
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState(null); // 当前查看的分类
  const [materialSubcategoryFilter, setMaterialSubcategoryFilter] = useState(null); // 🆕 v5.3 子分类筛选
  // [B7 修复] 提升到 App 层,防止从详情返回时筛选丢失
  const [materialBrandFilter, setMaterialBrandFilter] = useState("");
  const [materialSearchQ, setMaterialSearchQ] = useState("");
  const [brandViewId, setBrandViewId] = useState(null);
  const [brandEditTarget, setBrandEditTarget] = useState(null);
  const [materialViewId, setMaterialViewId] = useState(null);
  // v11: 百科详情跳转源头,回退时用 { tab, viewId? / compViewId? } 还原
  const [materialReturnTo, setMaterialReturnTo] = useState(null);
  const [materialEditTarget, setMaterialEditTarget] = useState(null);
  // 🖨 打印设置（可用户自定义LOGO）
  const [printSettings, setPrintSettings] = useState(() => {
    const ps = stored?.printSettings || { logoUrl: "", brandName: "kororā", brandSubtitle: "Boulangerie • Pâtisserie • Café" };
    // 店名从 RURU 改成 kororā：只在用户没自定义过(还是旧默认值)时自动升级，改过的不动
    if (ps.brandName === "RURU") ps.brandName = "kororā";
    if (ps.brandSubtitle === "PATISSERIE") ps.brandSubtitle = "Boulangerie • Pâtisserie • Café";
    return ps;
  });
  // 📁 自定义组件分类
  const [customCompCats, setCustomCompCats] = useState(stored?.customCompCats || []);
  // 同步给全局查找函数
  useEffect(() => { setCustomCompCatsForLookup(customCompCats); }, [customCompCats]);
  // v11: 同步 shopMaterials 到全局 lookup,让所有 getMaterialEffectivePrice 调用能读到
  useEffect(() => { setShopMaterialsForLookup(shopMaterials); }, [shopMaterials]);
  // v17: 全局配置(目前只有日元汇率)。同样注入给成本链,让日元材料能折成人民币算成本
  const [appSettings, setAppSettings] = useState(() => ({ fxJpyToCny: DEFAULT_FX_JPY_CNY, ...(stored?.appSettings || {}) }));
  useEffect(() => { setFxForLookup(appSettings.fxJpyToCny); }, [appSettings.fxJpyToCny]);
  // 🏷 产品家族（Product Family）
  // v1 内测: 默认种子 = SEED_FAMILIES (family_buttercream_cake + family_pate_a_cake), 老 family_basque 已隐藏
  const [productFamilies, setProductFamilies] = useState(mergeWithDefaults(stored?.productFamilies, SEED_FAMILIES));
  const [familyViewMode, setFamilyViewMode] = useState("flat"); // "flat" | "family" | "onsale"
  // v17: 「在售中」标记。季节食材决定当季卖哪几款,标了的排到最前 + 单独一页。
  // 只是配方上的一个布尔,跟 products(可售单元 / 库存)是两回事,不联动。
  const toggleOnSale = (id) => setRecipes(prev => prev.map(r =>
    r.id === id ? { ...r, onSale: !r.onSale, updatedAt: new Date().toISOString() } : r));
  const [familyEditTarget, setFamilyEditTarget] = useState(null); // 正在编辑的家族
  const [familyViewId, setFamilyViewId] = useState(null); // 正在查看的家族详情
  const [printTarget, setPrintTarget] = useState(null); // { type: "recipe"|"component", data, template, lang, sections }
  const [tab, setTab] = useState("list");
  const [lang, setLang] = useState("zh"); // v17 中文优先: 默认中文启动 (LuLu 主要国内中文录入)
  const [moreOpen, setMoreOpen] = useState(false); // 手机端「更多」抽屉
  // 把当前语言写到 <html> 上，驱动 GLOBAL_CSS 里的 --k-cjk 切换中文/日文字体
  useEffect(() => {
    document.documentElement.setAttribute("data-lang", lang);
    document.documentElement.lang = lang === "ja" ? "ja" : "zh-CN";
  }, [lang]);
  const [viewId, setViewId] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // null=new, recipe obj=edit
  // 组件库 & 组合蛋糕 & 知识库 状态
  const [compViewId, setCompViewId] = useState(null);
  const [compEditTarget, setCompEditTarget] = useState(null);
  const [creationViewId, setCreationViewId] = useState(null);
  const [creationEditTarget, setCreationEditTarget] = useState(null);
  const [knowledgeViewId, setKnowledgeViewId] = useState(null);
  const [knowledgeEditTarget, setKnowledgeEditTarget] = useState(null);
  // Toast 队列（2a §09）：左下角、最多堆 3 条、5 秒消失、hover 暂停计时、可带「撤销」
  const [toasts, setToasts] = useState([]); // [{ id, msg, undo?, ttl }]
  const toastSeq = useRef(0);
  // 自动保存三态（2a §09）：idle / saving / saved(带时间) / error
  const [saveState, setSaveState] = useState({ status: "idle", at: null });
  const saved = saveState.status === "saved"; // 旧代码里的 saved 布尔仍在用，保持兼容
  // 自定义确认对话框状态（替代 window.confirm）
  const [confirmState, setConfirmState] = useState(null); // { message, onConfirm, confirmText?, danger?, title?, kicker?, refs? }

  // v56: 自动保存 debounce 800ms + 失败时 toast 提示
  // 之前:每次任意字段变更都立即全量 stringify(1-2MB),手机卡顿
  // 现在:停止输入 800ms 后才保存一次
  const doSave = () => saveData(recipes, cats, components, creations, knowledge, brands, materials, printSettings, customCompCats, productFamilies, shopMaterials, products, salesLog, productionLog, suppliers, appSettings);

  useEffect(() => {
    setSaveState(s => (s.status === "saving" ? s : { ...s, status: "saving" }));
    const t = setTimeout(() => {
      const res = doSave();
      if (res && res.ok) {
        // 数据只存在浏览器本地，所以「已保存」必须显式给出时间 —— 老板要能确信东西没丢
        setSaveState({ status: "saved", at: new Date() });
      } else {
        const msg = (res && res.error && res.error.includes("uota"))
          ? (lang === "zh" ? "保存失败：本地空间不足，去「数据」页清理旧数据" : "保存失敗：容量不足。データ画面で整理してください")
          : (lang === "zh" ? "保存失败，请截图给开发者" : "保存失敗。スクショを開発者へ");
        setSaveState({ status: "error", at: null, msg });
      }
    }, 800);
    return () => clearTimeout(t);
  }, [recipes, cats, components, creations, knowledge, brands, materials, printSettings, customCompCats, productFamilies, shopMaterials, products, salesLog, productionLog, suppliers, appSettings]);

  // showToast(msg) 保持旧签名可用；第二个参数可给 { undo, ms } 走「先做 + 给撤销」
  const showToast = (msg, opts = {}) => {
    const id = ++toastSeq.current;
    setToasts(prev => [...prev.slice(-2), { id, msg, undo: opts.undo, ms: opts.ms || (opts.undo ? 5000 : 2500) }]);
  };
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // 🔄 cats → materials 迁移
  const migrateCatsToMaterials = () => {
    // 扫描所有 cats 和它们的 brands,生成 new brands + new materials
    const newBrands = [];
    const newMaterials = [];
    const existingBrandNames = new Set(brands.map(b => (b.nameZh || "").toLowerCase()).concat(brands.map(b => (b.nameJa || "").toLowerCase())).filter(Boolean));
    const existingMatNames = new Set(materials.map(m => `${(m.nameZh || "").toLowerCase()}|${(m.brandId || "")}`));
    const catIdToMaterialMap = {}; // cat.id -> {brandIdx -> materialId}

    (cats || []).forEach(cat => {
      catIdToMaterialMap[cat.id] = {};
      (cat.brands || []).forEach((br, bi) => {
        if (!br.nameZh && !br.nameJa) return;
        const brName = (br.nameZh || br.nameJa || "").trim();
        if (!brName) return;

        // 找现有 brand 或 新建
        let existingBrand = brands.find(b =>
          ((b.nameZh || "").toLowerCase() === brName.toLowerCase()) ||
          ((b.nameJa || "").toLowerCase() === brName.toLowerCase())
        ) || newBrands.find(b =>
          ((b.nameZh || "").toLowerCase() === brName.toLowerCase()) ||
          ((b.nameJa || "").toLowerCase() === brName.toLowerCase())
        );

        if (!existingBrand) {
          existingBrand = {
            id: `brand_cats_${cat.id}_${bi}_${Date.now()}`,
            nameZh: br.nameZh || "",
            nameJa: br.nameJa || "",
            nameFr: "",
            categoryId: "other", // 无法从 cats 推断,归到其他
            subcategoryId: "other",
            origin: "",
            foundedYear: 0,
            storyZh: "从老价格表 cats 迁移",
            storyJa: "旧価格表から移行",
            imageUrls: [],
          };
          newBrands.push(existingBrand);
        }

        // 新建 material
        const matKey = `${(cat.nameZh || cat.nameJa || "").toLowerCase()}|${existingBrand.id}`;
        if (existingMatNames.has(matKey)) return; // 已有,跳过

        const newMat = {
          id: `mat_cats_${cat.id}_${bi}_${Date.now()}`,
          nameZh: cat.nameZh || "",
          nameJa: cat.nameJa || "",
          nameFr: "",
          brandId: existingBrand.id,
          categoryId: "other",
          subcategoryId: "other",
          packSize: "",
          parameters: {},
          featuresZh: "从老价格表 cats 迁移",
          featuresJa: "旧価格表から移行",
          usesZh: "",
          usesJa: "",
          pricePerG: br.price || "",
          rating: 0,
          isBest: false,
          notesZh: "",
          notesJa: "",
          imageUrls: [],
        };
        newMaterials.push(newMat);
        existingMatNames.add(matKey);
        catIdToMaterialMap[cat.id][bi] = newMat.id;
      });
    });

    if (newMaterials.length === 0) {
      showToast("✓ 无需迁移(老价格表为空或已迁移)");
      return;
    }

    confirmDialog(
      `将把老价格表的 ${(cats || []).length} 大类,${newMaterials.length} 个品牌/产品 迁移到材料百科。\n\n同时自动把历史配方里的 catId/brandIdx 关联转换为 materialId。\n\n确认迁移吗?`,
      () => {
        // 应用新 brands + materials
        setBrands(prev => [...prev, ...newBrands]);
        setMaterials(prev => [...prev, ...newMaterials]);

        // 更新所有 ing:有 catId+brandIdx 的,填上 materialId
        const applyToIng = (ing) => {
          if (ing.materialId) return ing; // 已有 materialId 不动
          if (!ing.catId || typeof ing.brandIdx !== "number") return ing;
          const mid = catIdToMaterialMap[ing.catId]?.[ing.brandIdx];
          if (!mid) return ing;
          return { ...ing, materialId: mid };
        };
        setRecipes(prev => prev.map(r => ({
          ...r,
          ingredients: (r.ingredients || []).map(applyToIng),
        })));
        setComponents(prev => prev.map(c => ({
          ...c,
          ingredients: (c.ingredients || []).map(applyToIng),
        })));
        setCreations(prev => prev.map(cr => ({
          ...cr,
          layers: (cr.layers || []).map(l => ({
            ...l,
            ingredients: (l.ingredients || []).map(applyToIng),
          })),
        })));
        showToast(`✓ 已迁移 ${newBrands.length} 厂商 + ${newMaterials.length} 产品到百科`);
      },
      { danger: false }
    );
  };

  // 🤖 批量关联向导
  const [showBulkLinkWizard, setShowBulkLinkWizard] = useState(false);
  // 🛟 备份恢复弹窗
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  // 🔍 内容质量扫描弹窗
  const [showQualityScan, setShowQualityScan] = useState(false);
  // 📷 P1: orderie 一键补图工具
  const [showOrderieFetcher, setShowOrderieFetcher] = useState(false);
  const [orderieImportProgress, setOrderieImportProgress] = useState(null); // { phase, current, total }
  const [orderieImportReport, setOrderieImportReport] = useState(null);     // { ok, dead_link, deadLinks }
  // 📥 P3 v2 候选审查 (B+X 方案，详见 .claude/p3_crawl_design_v2.md §7 / B3 v2 决策)
  const [p3ImportQueue, setP3ImportQueue] = useState(null);     // null | { batch_id, materials: [...], currentIdx, ok, rejected, skipped }
  const [p3LastBatchWrites, setP3LastBatchWrites] = useState([]); // [{ material_id, prevImageUrls, prev_crawl_failed }] L1 撤销轨迹
  const [p3ImportReport, setP3ImportReport] = useState(null);     // null | { ok, rejected, skipped, batch_id, cancelled? }
  // 📥 B4 v2: 进度持久化（独立 localStorage key 'p3_in_progress_batch'，不入主 saveData 通道）
  const [p3HasPendingBatch, setP3HasPendingBatch] = useState(false);
  // 持久化：批次进行中将 queue + writes 写 localStorage（撤销/完成/取消时由各 handler 清除）
  useEffect(() => {
    if (!p3ImportQueue) return;
    try { localStorage.setItem('p3_in_progress_batch', JSON.stringify({ savedAt: new Date().toISOString(), queue: p3ImportQueue, writes: p3LastBatchWrites })); } catch (e) {}
  }, [p3ImportQueue, p3LastBatchWrites]);
  // 恢复检测：mount 时看 localStorage 有无未完成批次 → 仅 setP3HasPendingBatch(true)，不自动弹 dialog（数据 Tab 卡片让 LuLu 主动恢复）
  useEffect(() => {
    try {
      const raw = localStorage.getItem('p3_in_progress_batch');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && data.queue && Array.isArray(data.queue.materials) && data.queue.materials.length > 0) setP3HasPendingBatch(true);
      else localStorage.removeItem('p3_in_progress_batch');
    } catch (e) { localStorage.removeItem('p3_in_progress_batch'); }
  }, []);
  const applyBulkLink = (result, count) => {
    // 应用配方
    if (Object.keys(result.recipes).length > 0) {
      setRecipes(prev => prev.map(r => {
        const updates = result.recipes[r.id];
        if (!updates) return r;
        const newIngs = (r.ingredients || []).map((ing, idx) => {
          const hit = updates.find(u => u.ingIdx === idx);
          if (!hit) return ing;
          const m = materials.find(x => x.id === hit.materialId);
          const b = m ? brands.find(x => x.id === m.brandId) : null;
          const pp = m ? getMaterialEffectivePrice(m) : NaN;
          const q = parseFloat(ing.qty) || 0;
          return {
            ...ing,
            materialId: hit.materialId,
            brand: b ? (b.nameZh || b.nameJa) : ing.brand,
            unitPrice: !isNaN(pp) && pp > 0 ? String(pp) : ing.unitPrice,
            cost: !isNaN(pp) && pp > 0 && q > 0 ? (q * pp).toFixed(1) : ing.cost,
          };
        });
        const total = newIngs.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
        const y = parseFloat(r.yield) || 0, p = parseFloat(r.price) || 0;
        return {
          ...r,
          ingredients: newIngs,
          totalCost: total,
          unitCost: y > 0 ? total / y : 0,
          margin: p > 0 ? ((p - (y > 0 ? total / y : 0)) / p) * 100 : 0,
        };
      }));
    }
    // 应用组件
    if (Object.keys(result.components).length > 0) {
      setComponents(prev => prev.map(c => {
        const updates = result.components[c.id];
        if (!updates) return c;
        const newIngs = (c.ingredients || []).map((ing, idx) => {
          const hit = updates.find(u => u.ingIdx === idx);
          if (!hit) return ing;
          const m = materials.find(x => x.id === hit.materialId);
          const b = m ? brands.find(x => x.id === m.brandId) : null;
          const pp = m ? getMaterialEffectivePrice(m) : NaN;
          const q = parseFloat(ing.qty) || 0;
          return {
            ...ing,
            materialId: hit.materialId,
            brand: b ? (b.nameZh || b.nameJa) : ing.brand,
            unitPrice: !isNaN(pp) && pp > 0 ? String(pp) : ing.unitPrice,
            cost: !isNaN(pp) && pp > 0 && q > 0 ? (q * pp).toFixed(1) : ing.cost,
          };
        });
        const total = newIngs.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
        return { ...c, ingredients: newIngs, totalCost: total };
      }));
    }
    // 应用组合蛋糕
    if (Object.keys(result.creations).length > 0) {
      setCreations(prev => prev.map(cr => {
        const updates = result.creations[cr.id];
        if (!updates) return cr;
        const newLayers = (cr.layers || []).map((l, li) => {
          const layerUpdates = updates.filter(u => u.layerIdx === li);
          if (!layerUpdates.length) return l;
          const newIngs = (l.ingredients || []).map((ing, idx) => {
            const hit = layerUpdates.find(u => u.ingIdx === idx);
            if (!hit) return ing;
            const m = materials.find(x => x.id === hit.materialId);
            const b = m ? brands.find(x => x.id === m.brandId) : null;
            const pp = m ? getMaterialEffectivePrice(m) : NaN;
            const q = parseFloat(ing.qty) || 0;
            return {
              ...ing,
              materialId: hit.materialId,
              brand: b ? (b.nameZh || b.nameJa) : ing.brand,
              unitPrice: !isNaN(pp) && pp > 0 ? String(pp) : ing.unitPrice,
              cost: !isNaN(pp) && pp > 0 && q > 0 ? (q * pp).toFixed(1) : ing.cost,
            };
          });
          return { ...l, ingredients: newIngs };
        });
        return { ...cr, layers: newLayers };
      }));
    }
    setShowBulkLinkWizard(false);
    showToast(`✓ 已关联 ${count} 个材料 · 成本自动重算`);
  };

  // 统一的确认对话框函数，替代 window.confirm
  // opts 可给 { title, kicker, refs: [...], confirmText, cancelText, danger }
  const confirmDialog = (message, onConfirm, opts = {}) => {
    setConfirmState({ message, onConfirm, ...opts });
  };

  const handleSaveRecipe = (r) => {
    setRecipes(prev => prev.find(x => x.id === r.id) ? prev.map(x => x.id === r.id ? r : x) : [...prev, r]);
    showToast("✓ 配方已保存");
    // 保存后跳到该配方详情页 (LuLu UX: 不要跳回列表)
    setViewId(r.id);
    setTab("view");
  };

  const handleDeleteRecipe = () => {
    if (!editTarget) return;
    const rName = pickLang(editTarget, "name", lang) || editTarget.nameFr || "";
    // 2a §09：必须列出受影响的引用方 —— 商品可能挂着这条配方，家族可能靠它成组
    const usedByProducts = products.filter(p => (p.items || []).some(it => it && it.linkedType === "recipe" && String(it.linkedId) === String(editTarget.id)));
    const fam = productFamilies.find(f => f.id === editTarget.familyId);
    const famSiblings = fam ? recipes.filter(x => x.familyId === fam.id && x.id !== editTarget.id) : [];
    const refs = [
      ...usedByProducts.map(p => `${lang === "zh" ? "商品" : "商品"}：${pickLang(p, "name", lang) || p.nameZh || p.nameJa}`),
      ...(famSiblings.length > 0 ? [`${lang === "zh" ? "家族" : "ファミリー"}：${fam.nameZh || fam.nameJa}（${lang === "zh" ? `还有 ${famSiblings.length} 个变体` : `他に ${famSiblings.length} 件`}）`] : []),
    ];
    const doDelete = () => {
      const snapshot = editTarget;
      setRecipes(prev => prev.filter(x => x.id !== snapshot.id));
      setTab("list");
      // 破坏性操作「先做 + 给撤销」
      showToast(lang === "zh" ? `已删除「${rName}」` : `「${rName}」を削除しました`, {
        undo: () => setRecipes(prev => prev.find(x => x.id === snapshot.id) ? prev : [...prev, snapshot]),
      });
    };
    if (refs.length > 0) {
      // 影响到别的数据 → 拦一下，并把引用方摆出来
      confirmDialog(
        lang === "zh"
          ? "删除后下面这些地方会缺东西。此操作不可撤销。"
          : "削除すると以下に影響します。この操作は取り消せません。",
        doDelete,
        {
          kicker: lang === "zh" ? "删除配方" : "レシピを削除",
          title: lang === "zh" ? `删除「${rName}」？` : `「${rName}」を削除？`,
          refs,
          confirmText: lang === "zh" ? "仍然删除" : "削除する",
        }
      );
    } else {
      // 没有引用方 → 不拦，直接删 + 给撤销
      doDelete();
    }
  };

  // 顶部 tab：下划线式（active = 2px ink 底边），不再是白胶囊
  const navBtn = (t, label, badge) => {
    const on = tab === t;
    return (
      <button
        key={t} onClick={() => setTab(t)} className="k-tab"
        style={{
          position: "relative", padding: "0 0 12px", background: "transparent",
          color: on ? T.ink : T.secondary, border: "none",
          borderBottom: on ? `2px solid ${T.ink}` : "2px solid transparent",
          marginBottom: -1, cursor: "pointer", fontSize: 13, fontWeight: on ? 500 : 400,
          whiteSpace: "nowrap", fontFamily: T.fontSans, display: "flex", gap: 5, alignItems: "baseline",
        }}
      >
        {label}
        {badge > 0 && <span style={{ fontFamily: T.fontSerif, fontSize: 9, color: T.danger, ...T.num }}>{badge}</span>}
      </button>
    );
  };

  // 10 个 tab 的配置（数据化：桌面顶栏 / 手机底栏 / 「更多」抽屉复用同一份）
  // mZh / mJa 是手机底栏用的短标签（底栏只有 5 格，塞不下「材料百科」四个字）
  const NAV = [
    { id: "products", zh: "商品", ja: "商品", mZh: "商品", mJa: "商品", badge: () => products.filter(p => (p.currentStock || 0) <= (p.threshold || 0)).length },
    { id: "purchase", zh: "采购", ja: "仕入" },
    { id: "list", zh: "配方一览", ja: "レシピ一覧", mZh: "配方", mJa: "レシピ" },
    { id: "components", zh: "组件仓库", ja: "コンポーネント", mZh: "组件", mJa: "パーツ" },
    { id: "creations", zh: "组合蛋糕", ja: "組立ケーキ" },
    { id: "knowledge", zh: "知识库", ja: "ナレッジ" },
    { id: "shopMaterials", zh: "本店原料", ja: "仕入れ原料" },
    { id: "suppliers", zh: "供货商", ja: "仕入先" },
    // v11: "价格表"(cats) 已被"本店原料"+"材料百科"取代,隐藏入口;代码仍保留做向后兼容
    { id: "materialsPedia", zh: "材料百科", ja: "材料事典", mZh: "材料", mJa: "材料" },
    { id: "data", zh: "数据", ja: "データ" },
  ];

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ recipes, cats, components, creations, knowledge, brands, materials, printSettings, customCompCats, productFamilies, shopMaterials, products, salesLog, productionLog, suppliers, appSettings, exportedAt: new Date().toISOString(), version: 17 }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `patisserie_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url); showToast("✓ 导出成功");
  };

  // v11: 导出"仅 IP 分发包" — 剥离 shopMaterials 避免泄露本店采购价
  // 用于打包卖给买家,买家导入后自己录 shopMaterials
  const exportPublicIP = () => {
    const payload = {
      recipes, components, creations, knowledge,
      brands,
      materials: stripCrawlImages(materials),  // v15: 剥离 source='crawl' 来源（版权外溢防护）
      printSettings, customCompCats, productFamilies,
      cats,                     // 老价格表保留(里面也可能有价,用户自决是否清理 cats)
      // shopMaterials 不导出 ← IP 保护核心
      exportedAt: new Date().toISOString(),
      version: 16,
      _ipPackage: true,         // 标记,导入端可识别这是分发包
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `patisserie_IP_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast(lang === "zh" ? `✓ IP 分发包已导出(剥离 ${shopMaterials.length} 条本店价)` : `✓ IP パック出力(仕入 ${shopMaterials.length} 件除外)`);
  };

  // v57 新增:导入前 schema 校验,防止格式错的 JSON 把 app 搞崩
  const validateImportSchema = (d) => {
    if (!d || typeof d !== "object") return "文件不是有效的 JSON 对象";
    const arrayFields = ["recipes", "cats", "components", "creations", "knowledge", "brands", "materials", "shopMaterials", "products", "salesLog", "productionLog", "suppliers"];
    for (const k of arrayFields) {
      if (d[k] !== undefined && !Array.isArray(d[k])) {
        return `字段 ${k} 应为数组,实际为 ${typeof d[k]}`;
      }
    }
    // 材料百科基本字段检查(如果有 materials 就抽样看看)
    if (Array.isArray(d.materials) && d.materials.length > 0) {
      const sample = d.materials[0];
      if (!sample.id || !sample.categoryId) {
        return "材料百科数据缺少 id 或 categoryId 字段";
      }
    }
    return null; // 校验通过
  };

  const importData = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        const err = validateImportSchema(d);
        if (err) {
          showToast((lang === "zh" ? "⚠️ 导入失败:" : "⚠️ インポート失敗:") + err);
          return;
        }
        confirmDialog("导入后将覆盖当前数据，确认？", () => {
          setRecipes(d.recipes || []);
          setCats(migrateCats(d.cats || []));
          setComponents(d.components || []);
          setCreations(d.creations || []);
          setKnowledge(d.knowledge || []);
          setBrands(d.brands || []);
          // v11: 导入时自动迁移 materials.pricePerG → priceRange
          // v14: 同时升级 imageUrls 字段格式
          setMaterials(migrateImageUrls(migrateMaterialsToPriceRange(d.materials || [])));
          setShopMaterials(Array.isArray(d.shopMaterials) ? d.shopMaterials.map(sm => Array.isArray(sm.supplierIds) ? sm : { ...sm, supplierIds: [] }) : []);
          setProducts(Array.isArray(d.products) ? d.products : []);
          setSalesLog(Array.isArray(d.salesLog) ? d.salesLog : []);
          setProductionLog(Array.isArray(d.productionLog) ? d.productionLog : []);
          setSuppliers(Array.isArray(d.suppliers) ? d.suppliers : []);
          if (d.printSettings) setPrintSettings(d.printSettings);
          if (d.appSettings) setAppSettings(prev => ({ ...prev, ...d.appSettings }));
          if (d.customCompCats) setCustomCompCats(d.customCompCats);
          if (d.productFamilies) setProductFamilies(d.productFamilies);
          showToast("✓ 数据导入成功");
        });
      } catch (err) {
        showToast((lang === "zh" ? "⚠️ 导入失败:JSON 格式错 - " : "⚠️ JSON エラー:") + (err.message || err));
      }
    };
    reader.readAsText(f);
  };

  // 🆕 合并导入：只新增不覆盖
  // - cats: 按 nameZh/nameJa 匹配,已有则只追加新品牌,没有则新建大类
  // - components/recipes/creations/knowledge/brands/materials: 按名字和id匹配,已有跳过
  const mergeImportData = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        const err = validateImportSchema(d);
        if (err) {
          showToast((lang === "zh" ? "⚠️ 合并导入失败:" : "⚠️ マージ失敗:") + err);
          return;
        }
        const report = { catsNew: 0, catsUpdated: 0, brandsAdded: 0, componentsNew: 0, recipesNew: 0, creationsNew: 0, knowledgeNew: 0 };

        confirmDialog(
          "合并导入不会覆盖现有数据,只会追加新内容。\n(新大类→新增; 已有大类→追加其中不重复的新品牌; 配方/组件/知识按名字去重)\n\n确认继续？",
          () => {
            // 1. 合并 cats
            if (Array.isArray(d.cats)) {
              const incomingCats = migrateCats(d.cats);
              setCats(prev => {
                const result = [...prev];
                incomingCats.forEach(inc => {
                  // 找现有大类(通过名字匹配,zh 或 ja 任一相同即视为同类)
                  const existingIdx = result.findIndex(c =>
                    (inc.nameZh && c.nameZh && inc.nameZh === c.nameZh) ||
                    (inc.nameJa && c.nameJa && inc.nameJa === c.nameJa)
                  );
                  if (existingIdx < 0) {
                    // 新大类
                    result.push({ ...inc, id: inc.id || ("c" + Date.now() + Math.random().toString(36).slice(2,6)) });
                    report.catsNew++;
                  } else {
                    // 已存在,合并 brands
                    const existing = result[existingIdx];
                    const newBrands = [...existing.brands];
                    let appendedBrandsInThisCat = 0;
                    (inc.brands || []).forEach(incBrand => {
                      const dup = newBrands.find(b =>
                        (incBrand.nameZh && b.nameZh && incBrand.nameZh === b.nameZh) ||
                        (incBrand.nameJa && b.nameJa && incBrand.nameJa === b.nameJa)
                      );
                      if (!dup) {
                        newBrands.push(incBrand);
                        appendedBrandsInThisCat++;
                      }
                    });
                    if (appendedBrandsInThisCat > 0) {
                      result[existingIdx] = { ...existing, brands: newBrands };
                      report.catsUpdated++;
                      report.brandsAdded += appendedBrandsInThisCat;
                    }
                  }
                });
                return result;
              });
            }

            // 2. 合并 components (按 id 或 nameZh/nameJa 去重)
            if (Array.isArray(d.components)) {
              setComponents(prev => {
                const result = [...prev];
                d.components.forEach(inc => {
                  const dup = result.find(c =>
                    (inc.id && c.id === inc.id) ||
                    (inc.nameZh && c.nameZh && inc.nameZh === c.nameZh) ||
                    (inc.nameJa && c.nameJa && inc.nameJa === c.nameJa)
                  );
                  if (!dup) {
                    result.push({ ...inc, id: inc.id || ("comp_" + Date.now() + Math.random().toString(36).slice(2,6)) });
                    report.componentsNew++;
                  }
                });
                return result;
              });
            }

            // 3. 合并 recipes
            if (Array.isArray(d.recipes)) {
              setRecipes(prev => {
                const result = [...prev];
                d.recipes.forEach(inc => {
                  const dup = result.find(r =>
                    (inc.id && r.id === inc.id) ||
                    (inc.nameZh && r.nameZh && inc.nameZh === r.nameZh) ||
                    (inc.nameJa && r.nameJa && inc.nameJa === r.nameJa)
                  );
                  if (!dup) {
                    result.push({ ...inc, id: inc.id || (Date.now() + Math.floor(Math.random() * 1000)) });
                    report.recipesNew++;
                  }
                });
                return result;
              });
            }

            // 4. 合并 creations
            if (Array.isArray(d.creations)) {
              setCreations(prev => {
                const result = [...prev];
                d.creations.forEach(inc => {
                  const dup = result.find(c =>
                    (inc.id && c.id === inc.id) ||
                    (inc.nameZh && c.nameZh && inc.nameZh === c.nameZh) ||
                    (inc.nameJa && c.nameJa && inc.nameJa === c.nameJa)
                  );
                  if (!dup) {
                    result.push({ ...inc, id: inc.id || ("creat_" + Date.now() + Math.random().toString(36).slice(2,6)) });
                    report.creationsNew++;
                  }
                });
                return result;
              });
            }

            // 5. 合并 knowledge (按 title 去重)
            if (Array.isArray(d.knowledge)) {
              setKnowledge(prev => {
                const result = [...prev];
                d.knowledge.forEach(inc => {
                  const dup = result.find(k =>
                    (inc.id && k.id === inc.id) ||
                    (inc.title && k.title && inc.title === k.title)
                  );
                  if (!dup) {
                    result.push({ ...inc, id: inc.id || ("k_" + Date.now() + Math.random().toString(36).slice(2,6)) });
                    report.knowledgeNew++;
                  }
                });
                return result;
              });
            }

            // 6. 合并 brands/materials (材料百科,按 id 匹配;已存在时合并新字段)
            if (Array.isArray(d.brands)) {
              setBrands(prev => {
                const result = [...prev];
                d.brands.forEach(inc => {
                  const existingIdx = result.findIndex(b => b.id === inc.id);
                  if (existingIdx < 0) {
                    result.push(inc);
                  } else {
                    // 已存在:合并字段,新数据的字段覆盖旧的(但不删除旧有的字段)
                    result[existingIdx] = { ...result[existingIdx], ...inc };
                  }
                });
                return result;
              });
            }
            if (Array.isArray(d.materials)) {
              setMaterials(prev => {
                // v11: priceRange 迁移；v14: imageUrls 格式升级
                const migrated = migrateImageUrls(migrateMaterialsToPriceRange(d.materials));
                const result = [...prev];
                migrated.forEach(inc => {
                  const existingIdx = result.findIndex(m => m.id === inc.id);
                  if (existingIdx < 0) {
                    result.push(inc);
                  } else {
                    // 已存在:合并字段
                    result[existingIdx] = { ...result[existingIdx], ...inc };
                  }
                });
                return result;
              });
            }
            // v11: 合并 shopMaterials（按 materialId 去重；没 materialId 的孤立条目按 id 去重）
            if (Array.isArray(d.shopMaterials)) {
              setShopMaterials(prev => {
                const result = [...prev];
                d.shopMaterials.forEach(inc => {
                  const key = inc.materialId || inc.id;
                  if (!key) return;
                  const existingIdx = result.findIndex(sm => (sm.materialId && sm.materialId === inc.materialId) || (sm.id && sm.id === inc.id));
                  if (existingIdx < 0) {
                    result.push({ ...inc, id: inc.id || ("sm_" + Date.now() + Math.random().toString(36).slice(2,6)), supplierIds: Array.isArray(inc.supplierIds) ? inc.supplierIds : [] });
                  } else {
                    result[existingIdx] = { ...result[existingIdx], ...inc, supplierIds: Array.isArray(inc.supplierIds) ? inc.supplierIds : (result[existingIdx].supplierIds || []) };
                  }
                });
                return result;
              });
            }

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // [B1 修复] 补充 7 个被遗漏的字段合并(2026-05-01)
            // products / salesLog / productionLog / suppliers / productFamilies / customCompCats / printSettings
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            // 7. 合并 products(商品,按 id/nameZh/nameJa 去重)
            if (Array.isArray(d.products)) {
              setProducts(prev => {
                const result = [...prev];
                d.products.forEach(inc => {
                  const dup = result.find(p =>
                    (inc.id && p.id === inc.id) ||
                    (inc.nameZh && p.nameZh && inc.nameZh === p.nameZh) ||
                    (inc.nameJa && p.nameJa && inc.nameJa === p.nameJa)
                  );
                  if (!dup) {
                    result.push({ ...inc, id: inc.id || ("prod_" + Date.now() + Math.random().toString(36).slice(2,6)) });
                    report.productsNew = (report.productsNew || 0) + 1;
                  }
                });
                return result;
              });
            }

            // 8. 合并 salesLog(销售记录,只按 id 去重)
            if (Array.isArray(d.salesLog)) {
              setSalesLog(prev => {
                const result = [...prev];
                d.salesLog.forEach(inc => {
                  const dup = inc.id && result.find(s => s.id === inc.id);
                  if (!dup) {
                    result.push({ ...inc, id: inc.id || ("sl_" + Date.now() + Math.random().toString(36).slice(2,6)) });
                    report.salesLogNew = (report.salesLogNew || 0) + 1;
                  }
                });
                return result;
              });
            }

            // 9. 合并 productionLog(生产记录,只按 id 去重)
            if (Array.isArray(d.productionLog)) {
              setProductionLog(prev => {
                const result = [...prev];
                d.productionLog.forEach(inc => {
                  const dup = inc.id && result.find(s => s.id === inc.id);
                  if (!dup) {
                    result.push({ ...inc, id: inc.id || ("pl_" + Date.now() + Math.random().toString(36).slice(2,6)) });
                    report.productionLogNew = (report.productionLogNew || 0) + 1;
                  }
                });
                return result;
              });
            }

            // 10. 合并 suppliers(供应商,按 id/nameZh/nameJa 去重)
            if (Array.isArray(d.suppliers)) {
              setSuppliers(prev => {
                const result = [...prev];
                d.suppliers.forEach(inc => {
                  const dup = result.find(s =>
                    (inc.id && s.id === inc.id) ||
                    (inc.nameZh && s.nameZh && inc.nameZh === s.nameZh) ||
                    (inc.nameJa && s.nameJa && inc.nameJa === s.nameJa)
                  );
                  if (!dup) {
                    result.push({ ...inc, id: inc.id || ("sup_" + Date.now() + Math.random().toString(36).slice(2,6)) });
                    report.suppliersNew = (report.suppliersNew || 0) + 1;
                  }
                });
                return result;
              });
            }

            // 11. 合并 productFamilies(产品家族,按 id/nameZh/nameJa 去重)
            if (Array.isArray(d.productFamilies)) {
              setProductFamilies(prev => {
                const result = [...prev];
                d.productFamilies.forEach(inc => {
                  const dup = result.find(f =>
                    (inc.id && f.id === inc.id) ||
                    (inc.nameZh && f.nameZh && inc.nameZh === f.nameZh) ||
                    (inc.nameJa && f.nameJa && inc.nameJa === f.nameJa)
                  );
                  if (!dup) {
                    result.push({ ...inc, id: inc.id || ("fam_" + Date.now() + Math.random().toString(36).slice(2,6)) });
                    report.familiesNew = (report.familiesNew || 0) + 1;
                  }
                });
                return result;
              });
            }

            // 12. 合并 customCompCats(自定义组件分类,按 id 去重)
            if (Array.isArray(d.customCompCats)) {
              setCustomCompCats(prev => {
                const result = [...prev];
                d.customCompCats.forEach(inc => {
                  const dup = inc.id && result.find(c => c.id === inc.id);
                  if (!dup) {
                    result.push(inc);
                    report.customCompCatsNew = (report.customCompCatsNew || 0) + 1;
                  }
                });
                return result;
              });
            }

            // 13. 合并 printSettings(对象;只在当前是默认值时才用导入的,避免覆盖用户配置)
            if (d.printSettings && typeof d.printSettings === "object") {
              setPrintSettings(prev => {
                const isDefault = !prev || (prev.brandName === "RURU" && !prev.logoUrl && prev.brandSubtitle === "PATISSERIE");
                return isDefault ? d.printSettings : prev;
              });
            }

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            // 报告
            const lines = [];
            if (report.catsNew) lines.push("+ 新大类: " + report.catsNew);
            if (report.brandsAdded) lines.push("+ 新品牌: " + report.brandsAdded + " (散布在 " + report.catsUpdated + " 个已有大类)");
            if (report.componentsNew) lines.push("+ 新组件: " + report.componentsNew);
            if (report.recipesNew) lines.push("+ 新配方: " + report.recipesNew);
            if (report.creationsNew) lines.push("+ 新组合蛋糕: " + report.creationsNew);
            if (report.knowledgeNew) lines.push("+ 新知识点: " + report.knowledgeNew);
            // [B1 修复] 7 个补字段的报告
            if (report.productsNew) lines.push("+ 新商品: " + report.productsNew);
            if (report.salesLogNew) lines.push("+ 新销售记录: " + report.salesLogNew);
            if (report.productionLogNew) lines.push("+ 新生产记录: " + report.productionLogNew);
            if (report.suppliersNew) lines.push("+ 新供应商: " + report.suppliersNew);
            if (report.familiesNew) lines.push("+ 新产品家族: " + report.familiesNew);
            if (report.customCompCatsNew) lines.push("+ 新组件分类: " + report.customCompCatsNew);

            const msg = lines.length > 0
              ? "✓ 合并完成\n" + lines.join("\n")
              : "无新内容可合并(都已存在)";
            showToast(msg);
          }
        );
      } catch (err) {
        showToast((lang === "zh" ? "⚠️ 合并导入失败:" : "⚠️ マージ失敗:") + (err.message || "JSON 格式错"));
      }
    };
    reader.readAsText(f);
  };

  // 📷 P1: orderie 一键补图 — 读 cache 目录（manifest.json + *.jpg）→ 写 IndexedDB → 更新 imageUrls
  const handleOrderieCacheImport = async (e) => {
    const files = [...(e.target.files || [])];
    if (files.length === 0) return;
    e.target.value = ""; // 允许下次再选同一文件夹

    const manifestFile = files.find(f => f.name === "manifest.json");
    if (!manifestFile) {
      showToast("⚠️ 未找到 manifest.json,请选 cache 顶层文件夹");
      return;
    }

    let manifest;
    try {
      manifest = JSON.parse(await manifestFile.text());
    } catch (err) {
      showToast("⚠️ manifest.json 解析失败: " + err.message);
      return;
    }

    if (!manifest.items || !Array.isArray(manifest.items)) {
      showToast("⚠️ manifest.json 格式错误（缺 items 数组）");
      return;
    }

    const jpgMap = new Map();
    for (const f of files) {
      if (f.name.toLowerCase().endsWith(".jpg")) jpgMap.set(f.name, f);
    }

    const okItems = manifest.items.filter(it => it.result === "ok");
    const deadLinks = manifest.items.filter(it => it.result === "dead_link");
    const networkErrors = manifest.items.filter(it => it.result === "network_error");

    setOrderieImportProgress({ phase: "writing", current: 0, total: okItems.length });

    // 收集 material 更新计划
    const updatesByMaterial = new Map();
    let processed = 0;

    for (const item of okItems) {
      const file = jpgMap.get(item.filename);
      if (!file) continue;
      try {
        const buf = await file.arrayBuffer();
        const blob = new Blob([buf], { type: "image/jpeg" });
        const imageId = await putImageBlob({ blob, mimeType: "image/jpeg", source: "orderie", sku: item.sku });
        if (!imageId) continue;
        if (!updatesByMaterial.has(item.id)) updatesByMaterial.set(item.id, []);
        updatesByMaterial.get(item.id).push({
          imageId, kind: item.kind, imageUrlsIndex: item.imageUrlsIndex, url: item.url, sku: item.sku,
        });
      } catch (err) {
        if (typeof console !== "undefined" && console.warn) console.warn("[orderie import] put failed:", item.sku, err);
      }
      processed++;
      setOrderieImportProgress({ phase: "writing", current: processed, total: okItems.length });
    }

    // 应用到 materials state
    setMaterials(prev => prev.map(m => {
      const updates = updatesByMaterial.get(m.id);
      if (!updates) return m;
      const urls = Array.isArray(m.imageUrls) ? [...m.imageUrls] : [];
      for (const u of updates) {
        if (u.kind === "existing" && u.imageUrlsIndex != null && urls[u.imageUrlsIndex]) {
          // 给已有条目挂 imageId（远程 url 保留作 fallback）
          const old = urls[u.imageUrlsIndex];
          urls[u.imageUrlsIndex] = typeof old === "string"
            ? { source: "orderie", url: old, imageId: u.imageId, caption: "" }
            : { ...old, imageId: u.imageId };
        } else {
          // to_fill: 新加一条
          urls.push({ source: "orderie", url: u.url, imageId: u.imageId, caption: "" });
        }
      }
      return { ...m, imageUrls: urls };
    }));

    setOrderieImportProgress(null);
    setOrderieImportReport({
      ok: processed,
      dead_link: deadLinks.length,
      network_error: networkErrors.length,
      deadLinks,
      networkErrors,
    });
    showToast(`✓ 导入 ${processed} 张图${deadLinks.length ? `、${deadLinks.length} 条死链待处理` : ""}`);
  };

  // 📷 P1: 清除死链（imageUrls 数组里 result='dead_link' 的条目）
  const handleClearDeadLinks = () => {
    if (!orderieImportReport || !orderieImportReport.deadLinks || orderieImportReport.deadLinks.length === 0) return;
    const deadLinks = orderieImportReport.deadLinks;
    confirmDialog(`确认清除 ${deadLinks.length} 条死链 imageUrls 条目？此操作不可撤销。`, () => {
      // 按 material id 分组
      const byMaterial = new Map();
      for (const dl of deadLinks) {
        if (dl.kind !== "existing" || dl.imageUrlsIndex == null) continue;
        if (!byMaterial.has(dl.id)) byMaterial.set(dl.id, new Set());
        byMaterial.get(dl.id).add(dl.imageUrlsIndex);
      }
      setMaterials(prev => prev.map(m => {
        const removeSet = byMaterial.get(m.id);
        if (!removeSet) return m;
        const urls = (m.imageUrls || []).filter((_, i) => !removeSet.has(i));
        return { ...m, imageUrls: urls };
      }));
      showToast(`✓ 已清除 ${deadLinks.length} 条死链`);
      setOrderieImportReport({ ...orderieImportReport, dead_link: 0, deadLinks: [] });
    });
  };

  // 📥 P3 v2: 导入候选 manifest (B+X 方案, see .claude/p3_crawl_design_v2.md)
  const handleP3CandidatesImport = async (e) => {
    const files = [...(e.target.files || [])];
    if (files.length === 0) return;
    e.target.value = "";
    // B4 v2: 开新批次前清旧持久化（防 2 批共存）
    localStorage.removeItem('p3_in_progress_batch');
    setP3HasPendingBatch(false);
    const manifestFile = files.find(f => f.name === "manifest.json");
    if (!manifestFile) { showToast("⚠️ 未找到 manifest.json，请选 batch 顶层文件夹"); return; }
    let manifest;
    try { manifest = JSON.parse(await manifestFile.text()); }
    catch (err) { showToast("⚠️ candidate manifest 格式无效: " + err.message); return; }
    if (!manifest.materials || !Array.isArray(manifest.materials)) { showToast("⚠️ candidate manifest 缺 materials 数组"); return; }
    // 分离 reviewable (status=success + 候选>0) vs failed (其他)
    const reviewable = manifest.materials.filter(it => it.status === 'success' && Array.isArray(it.candidates) && it.candidates.length > 0);
    const failed = manifest.materials.filter(it => !(it.status === 'success' && Array.isArray(it.candidates) && it.candidates.length > 0));
    // 批量写 _crawl_failed for failed (含撤销轨迹)
    const writes = [];
    setMaterials(prev => prev.map(m => {
      const f = failed.find(x => x.material_id === m.id);
      if (!f) return m;
      writes.push({ material_id: m.id, prevImageUrls: m.imageUrls ? [...m.imageUrls] : null, prev_crawl_failed: m._crawl_failed });
      return { ...m, _crawl_failed: { at: new Date().toISOString(), reason: f.status || 'no_candidates' } };
    }));
    setP3LastBatchWrites(writes);
    setP3ImportReport(null);
    if (reviewable.length === 0) {
      setP3ImportReport({ ok: 0, rejected: 0, skipped: failed.length, batch_id: manifest.batch_id });
      showToast(`⚠️ 此批 ${failed.length} 条无可审候选，已全部标 _crawl_failed`);
      return;
    }
    setP3ImportQueue({ batch_id: manifest.batch_id || 'unknown', materials: reviewable, currentIdx: 0, ok: 0, rejected: 0, skipped: failed.length });
  };

  // P3 写入决策 (action='select' / 'reject')
  const p3WriteCandidate = (action, candidate) => {
    if (!p3ImportQueue) return;
    const cur = p3ImportQueue.currentIdx;
    const item = p3ImportQueue.materials[cur];
    if (!item) return;
    const targetId = item.material_id;
    const target = materials.find(m => m.id === targetId);
    let nextOk = p3ImportQueue.ok, nextReject = p3ImportQueue.rejected, nextSkip = p3ImportQueue.skipped;
    if (target) {
      setP3LastBatchWrites(prev => [...prev, { material_id: targetId, prevImageUrls: target.imageUrls ? [...target.imageUrls] : null, prev_crawl_failed: target._crawl_failed }]);
      if (action === 'select' && candidate) {
        setMaterials(prev => prev.map(m => m.id === targetId ? { ...m, imageUrls: [...(m.imageUrls || []), {
          source: 'crawl', url: candidate.thumbnailUrl, sourceUrl: candidate.sourceUrl, caption: '', productId: candidate.productId
        }] } : m));
        nextOk++;
      } else if (action === 'reject') {
        setMaterials(prev => prev.map(m => m.id === targetId ? { ...m, _crawl_failed: { at: new Date().toISOString(), reason: 'all_rejected' } } : m));
        nextReject++;
      }
    } else {
      nextSkip++;
    }
    const nextIdx = cur + 1;
    if (nextIdx >= p3ImportQueue.materials.length) {
      setP3ImportReport({ ok: nextOk, rejected: nextReject, skipped: nextSkip, batch_id: p3ImportQueue.batch_id });
      setP3ImportQueue(null);
    } else {
      setP3ImportQueue({ ...p3ImportQueue, currentIdx: nextIdx, ok: nextOk, rejected: nextReject, skipped: nextSkip });
    }
  };

  // L1 撤销本批：把 p3LastBatchWrites 里每条 prev 还原
  const p3UndoBatch = () => {
    if (p3LastBatchWrites.length === 0) return;
    const writes = p3LastBatchWrites;
    setMaterials(prev => prev.map(m => {
      const w = writes.find(x => x.material_id === m.id);
      if (!w) return m;
      const next = { ...m };
      if (w.prevImageUrls === null || w.prevImageUrls === undefined) delete next.imageUrls;
      else next.imageUrls = w.prevImageUrls;
      if (w.prev_crawl_failed === undefined) delete next._crawl_failed;
      else next._crawl_failed = w.prev_crawl_failed;
      return next;
    }));
    showToast(`✓ 已撤销 ${writes.length} 条写入`);
    setP3LastBatchWrites([]);
    setP3ImportReport(null);
    // B4 v2: 撤销后清持久化
    localStorage.removeItem('p3_in_progress_batch');
    setP3HasPendingBatch(false);
  };

  // 📥 B4 v2: 恢复未完成批次（从 localStorage 读 queue + writes 还原 P3 state）
  const restoreP3Batch = () => {
    try {
      const raw = localStorage.getItem('p3_in_progress_batch');
      if (!raw) { setP3HasPendingBatch(false); return; }
      const data = JSON.parse(raw);
      if (!data || !data.queue || !Array.isArray(data.queue.materials)) {
        localStorage.removeItem('p3_in_progress_batch');
        setP3HasPendingBatch(false);
        showToast('⚠️ 持久化数据无效，已清除');
        return;
      }
      setP3LastBatchWrites(Array.isArray(data.writes) ? data.writes : []);
      setP3ImportQueue(data.queue);
      setP3HasPendingBatch(false);
      showToast(`✓ 恢复批次 ${data.queue.batch_id || '?'} (${data.queue.currentIdx + 1}/${data.queue.materials.length})`);
    } catch (e) {
      localStorage.removeItem('p3_in_progress_batch');
      setP3HasPendingBatch(false);
      showToast('⚠️ 持久化数据损坏，已清除');
    }
  };

  // 📤 B4 v2: 导出 P3 待爬清单（过滤已有图 / 已 _crawl_failed 的，给 Claude Code 端批量爬用）
  const handleP3ExportEligibleList = () => {
    const eligible = materials.filter(m => !(Array.isArray(m.imageUrls) && m.imageUrls.length > 0) && !m._crawl_failed);
    const brandMap = Object.fromEntries((brands || []).map(b => [b.id, b]));
    const list = eligible.map(m => {
      const b = brandMap[m.brandId] || {};
      return {
        material_id: m.id,
        nameZh: m.nameZh || '', nameJa: m.nameJa || '',
        brandJa: b.nameJa || '', brandZh: b.nameZh || '',
        _jan: m._jan || null,
        _orderie_sku: m._orderie_sku || null,
      };
    });
    const payload = { created_at: new Date().toISOString(), total: list.length, materials: list };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `p3_eligible_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast(`✓ 导出 ${list.length} 条待爬 material 清单`);
  };

  const viewingRecipe = recipes.find(r => r.id === viewId);

  return (
    <div style={{ fontFamily: T.fontSans, color: T.textPrimary, fontSize: 14, position: "relative", background: T.bgApp, minHeight: "100vh", colorScheme: "light" }}>
      <style>{GLOBAL_CSS}</style>
      {/* Toast 队列 · 左下角，最多堆 3 条 */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", bottom: 24, left: 24, right: 24, maxWidth: 420, zIndex: T.z.toast, display: "flex", flexDirection: "column", gap: T.sp.s, pointerEvents: "none" }}>
          {toasts.map(t => <ToastItem key={t.id} t={t} onDone={() => dismissToast(t.id)} />)}
        </div>
      )}

      {/* 🖨 打印设置弹窗 */}
      {printTarget && printTarget.stage === "settings" && (
        <PrintModal
          itemType={printTarget.type}
          onClose={() => setPrintTarget(null)}
          onConfirm={(opts) => setPrintTarget({ ...printTarget, stage: "preview", ...opts })}
        />
      )}

      {/* 🖨 打印预览 */}
      {printTarget && printTarget.stage === "preview" && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#FFFFFF", zIndex: 9998, overflow: "auto" }}>
          <PrintView
            item={printTarget.data}
            itemType={printTarget.type}
            template={printTarget.template}
            lang={printTarget.lang}
            sections={printTarget.sections}
            printSettings={printSettings}
            onClose={() => setPrintTarget(null)}
            onUpdateSettings={(newSettings) => setPrintSettings(newSettings)}
          />
        </div>
      )}

      {/* 自定义确认对话框 */}
      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          title={confirmState.title}
          kicker={confirmState.kicker}
          refs={confirmState.refs || []}
          confirmText={confirmState.confirmText || "确定"}
          cancelText={confirmState.cancelText || "取消"}
          danger={confirmState.danger !== false}
          onConfirm={() => {
            const fn = confirmState.onConfirm;
            setConfirmState(null);
            if (fn) fn();
          }}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {/* 🤖 批量关联材料百科向导 */}
      {showBulkLinkWizard && (
        <BulkMaterialLinkWizard
          recipes={recipes}
          components={components}
          creations={creations}
          materials={materials}
          brands={brands}
          lang={lang}
          onApply={applyBulkLink}
          onClose={() => setShowBulkLinkWizard(false)}
        />
      )}

      {/* 🛟 备份恢复弹窗 */}
      {showBackupDialog && (
        <BackupRestoreDialog
          onClose={() => setShowBackupDialog(false)}
          lang={lang}
          showToast={showToast}
          confirmDialog={confirmDialog}
        />
      )}

      {/* 🔍 内容质量扫描弹窗 */}
      {showQualityScan && (
        <ContentQualityScanDialog
          materials={materials}
          brands={brands}
          lang={lang}
          onClose={() => setShowQualityScan(false)}
          onJumpMaterial={(id) => {
            const m = materials.find(x => x.id === id);
            if (m) {
              setMaterialEditTarget(m);
              setTab("materials");
            }
          }}
          onJumpBrand={(id) => {
            const b = brands.find(x => x.id === id);
            if (b) {
              setBrandEditTarget(b);
              setTab("materials");
            }
          }}
        />
      )}

      {/* 📷 P1: orderie 一键补图工具 dialog */}
      {showOrderieFetcher && (
        <div onClick={() => !orderieImportProgress && setShowOrderieFetcher(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.bgCard, borderRadius: T.radiusLg, padding: "1.75rem 2rem", maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ fontFamily: T.fontSerif, fontSize: 18, fontWeight: 500, color: T.textPrimary }}>
                📷 orderie 一键补图工具
              </div>
              <button onClick={() => !orderieImportProgress && setShowOrderieFetcher(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textTertiary, fontSize: 22 }}>×</button>
            </div>

            <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7, marginBottom: "1.25rem" }}>
              扫所有 source='orderie' 但未本地化的图 + 738 条没 imageUrls 但有 _orderie_sku 的 material，下载到本地 cache 文件夹。完成后选择 cache 文件夹导入到 IndexedDB。
            </div>

            {/* Step 1: 终端命令 */}
            <div style={{ background: T.bgMuted, borderRadius: T.radius, padding: "1rem 1.25rem", marginBottom: "1rem", borderLeft: `3px solid ${T.accentSoft}` }}>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>① 在 WSL 终端跑这条命令</div>
              <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 10, lineHeight: 1.6 }}>
                先 cd 到项目目录 <code style={{ background: T.bgCard, padding: "1px 6px", borderRadius: 3 }}>cd "/mnt/c/Users/11508/Desktop/店铺数据/patisserie-manager"</code>，再跑：
              </div>
              <pre style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, padding: "10px 12px", fontSize: 11, fontFamily: "ui-monospace, monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6, margin: 0 }}>
{`# 测试模式（先跑这个，约 4 秒，验证可用）
node .claude/scripts/orderie_image_fetcher.cjs \\
  --input my_data_export.json \\
  --output /tmp/orderie_cache --test

# 全量模式（约 6 分钟，1416 条 SKU，预估命中 ~1200 张）
node .claude/scripts/orderie_image_fetcher.cjs \\
  --input my_data_export.json \\
  --output /tmp/orderie_cache`}
              </pre>
              <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 8, lineHeight: 1.6 }}>
                跑完后 cache 目录里会有 <code>orderie_images/*.jpg</code> + <code>manifest.json</code>。
              </div>
            </div>

            {/* Step 2: 导入 cache 目录 */}
            <div style={{ background: T.bgMuted, borderRadius: T.radius, padding: "1rem 1.25rem", marginBottom: "1rem", borderLeft: `3px solid ${T.accent}` }}>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>② 选择 cache 文件夹导入</div>
              <div style={{ fontSize: 11, color: T.textTertiary, marginBottom: 10, lineHeight: 1.6 }}>
                浏览器会让你选 cache 顶层目录（含 manifest.json + orderie_images/*.jpg）。所有图会写到 IndexedDB。
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: orderieImportProgress ? "not-allowed" : "pointer", background: orderieImportProgress ? T.bgMuted : "#E1F5EE", border: `0.5px solid ${orderieImportProgress ? T.border : "#0F6E56"}`, borderRadius: T.radiusSm, padding: "8px 16px", fontSize: 13, color: orderieImportProgress ? T.textTertiary : "#085041", fontFamily: T.fontSans, fontWeight: 500, opacity: orderieImportProgress ? 0.6 : 1 }}>
                {orderieImportProgress ? "处理中…" : "📁 选择 cache 文件夹"}
                <input type="file" webkitdirectory="" directory="" multiple onChange={handleOrderieCacheImport} disabled={!!orderieImportProgress} style={{ display: "none" }} />
              </label>
            </div>

            {/* 进度条 */}
            {orderieImportProgress && (
              <div style={{ marginBottom: "1rem", background: T.bgMuted, borderRadius: T.radius, padding: "0.75rem 1rem" }}>
                <div style={{ fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
                  写入 IndexedDB 中… {orderieImportProgress.current} / {orderieImportProgress.total}
                </div>
                <div style={{ background: T.bgCard, height: 6, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ background: T.accent, height: "100%", width: `${(orderieImportProgress.current / Math.max(1, orderieImportProgress.total)) * 100}%`, transition: "width 0.2s" }} />
                </div>
              </div>
            )}

            {/* 报告 */}
            {orderieImportReport && (
              <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radius, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>📊 导入报告</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
                  <div style={{ textAlign: "center", padding: "10px", background: "#E1F5EE", borderRadius: T.radiusSm }}>
                    <div style={{ fontSize: 22, fontWeight: 500, color: "#0F6E56", fontFamily: T.fontSerif }}>{orderieImportReport.ok}</div>
                    <div style={{ fontSize: 11, color: T.textSecondary }}>✓ 成功</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "10px", background: "#FEE2E2", borderRadius: T.radiusSm }}>
                    <div style={{ fontSize: 22, fontWeight: 500, color: "#A32D2D", fontFamily: T.fontSerif }}>{orderieImportReport.dead_link}</div>
                    <div style={{ fontSize: 11, color: T.textSecondary }}>✗ 死链</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "10px", background: "#FEF3C7", borderRadius: T.radiusSm }}>
                    <div style={{ fontSize: 22, fontWeight: 500, color: "#854F0B", fontFamily: T.fontSerif }}>{orderieImportReport.network_error}</div>
                    <div style={{ fontSize: 11, color: T.textSecondary }}>⚠ 网络错</div>
                  </div>
                </div>

                {orderieImportReport.deadLinks && orderieImportReport.deadLinks.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: "#A32D2D" }}>
                      死链清单（共 {orderieImportReport.deadLinks.length} 条，前 10 条）
                    </div>
                    <div style={{ maxHeight: 200, overflow: "auto", border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, marginBottom: 10 }}>
                      {orderieImportReport.deadLinks.slice(0, 10).map((dl, i) => (
                        <div key={i} style={{ fontSize: 11, padding: "6px 10px", borderBottom: i < 9 ? `0.5px solid ${T.borderSoft}` : "none", display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ color: T.textPrimary, fontFamily: "ui-monospace, monospace" }}>{dl.sku}</span>
                          <span style={{ color: T.textTertiary, fontSize: 10 }}>{dl.kind}</span>
                          <span style={{ color: T.textSecondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>{dl.id}</span>
                        </div>
                      ))}
                    </div>
                    <Btn variant="danger" size="sm" onClick={handleClearDeadLinks}>
                      🗑️ 全部清除（仅清 existing kind 死链）
                    </Btn>
                    <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 6, lineHeight: 1.5 }}>
                      to_fill kind 的死链不影响数据（material 本来就没图），无需清除。仅 existing kind（imageUrls 里有死 url）需要清。
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <Btn onClick={() => !orderieImportProgress && setShowOrderieFetcher(false)} disabled={!!orderieImportProgress}>
                {orderieImportProgress ? "处理中…" : "关闭"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* 📥 P3 v2 候选审查 dialog */}
      {p3ImportQueue && p3ImportQueue.materials[p3ImportQueue.currentIdx] && (
        <P3CandidateReviewDialog
          queue={p3ImportQueue}
          onSelect={(c) => p3WriteCandidate('select', c)}
          onReject={() => p3WriteCandidate('reject', null)}
          onCancel={() => {
            setP3ImportReport({ ok: p3ImportQueue.ok, rejected: p3ImportQueue.rejected, skipped: p3ImportQueue.skipped, batch_id: p3ImportQueue.batch_id, cancelled: true });
            setP3ImportQueue(null);
          }}
        />
      )}
      {/* 📥 P3 v2 批次完成总结 dialog (含 L1 撤销本批) */}
      {p3ImportReport && (
        <P3ImportReportDialog
          report={p3ImportReport}
          canUndo={p3LastBatchWrites.length > 0}
          onUndo={p3UndoBatch}
          onClose={() => {
            setP3ImportReport(null);
            setP3LastBatchWrites([]);
            // B4 v2: 完成关闭后清持久化
            localStorage.removeItem('p3_in_progress_batch');
            setP3HasPendingBatch(false);
          }}
        />
      )}

      {/* 🏷 家族编辑表单（全屏覆盖） */}
      {familyEditTarget && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#FFFFFF", zIndex: 500, overflow: "auto", padding: "1rem" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <FamilyEditForm
              family={familyEditTarget === "new" ? null : familyEditTarget}
              onSave={(fm) => {
                setProductFamilies(prev => {
                  const found = prev.find(x => x.id === fm.id);
                  return found ? prev.map(x => x.id === fm.id ? fm : x) : [...prev, fm];
                });
                showToast("✓ 家族已保存");
                setFamilyEditTarget(null);
              }}
              onDelete={() => {
                confirmDialog("删除这个家族吗？\n\n家族里的配方不会被删除，只会变成「未归属」状态。", () => {
                  setRecipes(prev => prev.map(r => r.familyId === familyEditTarget.id ? { ...r, familyId: "" } : r));
                  setProductFamilies(prev => prev.filter(x => x.id !== familyEditTarget.id));
                  showToast("家族已删除");
                  setFamilyEditTarget(null);
                });
              }}
              onBack={() => setFamilyEditTarget(null)}
            />
          </div>
        </div>
      )}

      {/* 🏷 家族详情（全屏覆盖） */}
      {familyViewId && (() => {
        const fm = productFamilies.find(f => f.id === familyViewId);
        if (!fm) { setFamilyViewId(null); return null; }
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#FFFFFF", zIndex: 500, overflow: "auto", padding: "1rem" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <FamilyDetail
                family={fm}
                recipes={recipes}
                lang={lang}
                onEdit={() => { setFamilyEditTarget(fm); setFamilyViewId(null); }}
                onBack={() => setFamilyViewId(null)}
                onViewRecipe={(rid) => { setFamilyViewId(null); setViewId(rid); setTab("view"); }}
              />
            </div>
          </div>
        );
      })()}

      {/* ═══ 顶部导航：字标 + 语言切换 / 下划线式 tab ═══ */}
      <div style={{ borderBottom: `1px solid ${T.ink}`, marginBottom: T.sp.block }}>
        <div className="rc-container" style={{ paddingTop: T.sp.xl, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: T.sp.l }}>
          <Wordmark size={22} />
          {/* 保存指示在按钮组左侧 —— 数据只在本地，老板要能确信东西没丢 */}
          <div style={{ display: "flex", alignItems: "center", gap: T.sp.l, flexShrink: 0 }}>
            <SaveStatus state={saveState} lang={lang} onRetry={() => {
              const res = doSave();
              setSaveState(res && res.ok ? { status: "saved", at: new Date() } : { ...saveState });
            }} />
            <LangToggle lang={lang} onChange={setLang} />
          </div>
        </div>
        <div className="rc-container k-topnav" style={{ paddingTop: 18, display: "flex", gap: 28, overflowX: "auto", flexWrap: "nowrap" }}>
          {NAV.map(n => navBtn(n.id, lang === "zh" ? n.zh : n.ja, n.badge ? n.badge() : 0))}
        </div>
      </div>

      {/* ═══ 手机端底部导航：5 个高频 tab 固定在拇指区，其余 5 个收进「更多」全屏抽屉 ═══ */}
      <div className="k-bottomnav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: T.z.bar,
        background: T.paper, borderTop: `1px solid ${T.ink}`,
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
      }}>
        {MOBILE_NAV.map(id => {
          const n = NAV.find(x => x.id === id);
          const on = tab === id;
          const badge = n.badge ? n.badge() : 0;
          return (
            <button key={id} onClick={() => { setTab(id); setMoreOpen(false); }}
              style={{
                padding: "12px 2px 16px", textAlign: "center", cursor: "pointer", background: "transparent",
                border: "none", borderTop: on && !moreOpen ? `2px solid ${T.ink}` : "2px solid transparent", marginTop: -1,
                color: on && !moreOpen ? T.ink : T.subtle, fontWeight: on && !moreOpen ? 500 : 400,
                fontSize: 12, fontFamily: T.fontSans, position: "relative",
              }}>
              {lang === "zh" ? n.mZh : n.mJa}
              {badge > 0 && <span style={{ fontFamily: T.fontSerif, fontSize: 9, color: T.danger, marginLeft: 3, ...T.num }}>{badge}</span>}
            </button>
          );
        })}
        <button onClick={() => setMoreOpen(v => !v)}
          style={{
            padding: "12px 2px 16px", textAlign: "center", cursor: "pointer", background: "transparent",
            border: "none", borderTop: moreOpen ? `2px solid ${T.ink}` : "2px solid transparent", marginTop: -1,
            color: moreOpen ? T.ink : T.subtle, fontWeight: moreOpen ? 500 : 400,
            fontSize: 12, fontFamily: T.fontSans,
          }}>
          {lang === "zh" ? "更多" : "その他"}
        </button>
      </div>

      {/* 「更多」全屏抽屉 */}
      {moreOpen && (
        <div className="k-drawer" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: T.z.drawer, background: T.paper, flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${T.ink}` }}>
            <Wordmark size={15} sub={false} />
            <Btn size="lg" variant="ghost" onClick={() => setMoreOpen(false)}>✕</Btn>
          </div>
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
            {NAV.filter(n => !MOBILE_NAV.includes(n.id)).map(n => (
              <button key={n.id} onClick={() => { setTab(n.id); setMoreOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                  minHeight: 56, padding: "0 16px", background: "transparent", cursor: "pointer",
                  border: "none", borderBottom: `1px solid ${T.lineFaint}`,
                  borderLeft: tab === n.id ? `3px solid ${T.ink}` : "3px solid transparent",
                  color: tab === n.id ? T.ink : T.body, fontSize: 16, fontFamily: T.fontSans, textAlign: "left",
                }}>
                <span>{lang === "zh" ? n.zh : n.ja}</span>
                <span style={{ color: T.muted }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rc-container k-main" style={{ paddingBottom: T.sp.gap }}>

      {/* LIST */}
      {tab === "list" && (
        <div>
          {/* 页头：微标签 + 大数字 + 主 CTA，底下压一条 1px ink 线 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: T.sp.xl, borderBottom: `1px solid ${T.ink}`, flexWrap: "wrap", gap: T.sp.m }}>
            <div>
              <div style={{ ...T.fs.micro, color: T.subtle, fontFamily: T.fontSerif }}>{lang === "zh" ? "配方一览" : "レシピ一覧"}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: T.sp.m, marginTop: T.sp.s }}>
                <div style={{ ...T.fs.titleL, fontFamily: T.fontSerif, ...T.num, color: T.ink }}>{recipes.length}</div>
                {saved && <span style={{ ...T.fs.caption, color: T.success }}>{lang === "zh" ? "✓ 已保存" : "✓ 保存済み"}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: T.sp.s, alignItems: "center" }}>
              <Btn variant="primary" onClick={() => { setEditTarget(null); setTab("edit"); }}>{lang === "zh" ? "＋ 新建配方" : "＋ レシピ新規"}</Btn>
            </div>
          </div>

          {/* 🏷 模式切换：平铺 vs 家族 */}
          <div style={{ display: "flex", gap: T.sp.xxl, marginTop: T.sp.l, marginBottom: T.sp.xxl, alignItems: "center", flexWrap: "wrap" }}>
            {[
              ["flat", lang === "zh" ? "全部配方" : "全レシピ"],
              ["onsale", `${lang === "zh" ? "在售中" : "販売中"}${recipes.filter(r => r.onSale).length ? " " + recipes.filter(r => r.onSale).length : ""}`],
              ["family", lang === "zh" ? "家族模式" : "ファミリー表示"],
            ].map(([m, label]) => (
              <button
                key={m} className="k-tab" onClick={() => setFamilyViewMode(m)}
                style={{
                  padding: "0 0 6px", ...T.fs.caption, border: "none", background: "transparent",
                  borderBottom: familyViewMode === m ? `1px solid ${T.ink}` : "1px solid transparent",
                  color: familyViewMode === m ? T.ink : T.secondary,
                  fontWeight: familyViewMode === m ? 500 : 400, cursor: "pointer", fontFamily: T.fontSans,
                }}
              >{label}</button>
            ))}
            {familyViewMode === "family" && (
              <Btn size="sm" onClick={() => setFamilyEditTarget("new")} style={{ marginLeft: "auto" }}>{lang === "zh" ? "＋ 新建家族" : "＋ ファミリー新規"}</Btn>
            )}
          </div>

          {recipes.length === 0 && (
            <EmptyState
              variant="first" lang={lang}
              title={lang === "zh" ? "还没有配方" : "まだレシピがありません"}
              hint={lang === "zh" ? "新建一条，或去「数据」页导入已有的配方包" : "新規作成するか、データ画面からインポートできます"}
              actions={[
                { label: lang === "zh" ? "＋ 新建配方" : "＋ レシピ新規", onClick: () => { setEditTarget(null); setTab("edit"); } },
                { label: lang === "zh" ? "去导入" : "インポート", onClick: () => setTab("data") },
              ]}
            />
          )}

          {/* 📋 平铺模式 —— 无卡片、无圆角、无阴影；行间只有 1px 发丝线，家族色 3px 左竖条 */}
          {/* v17: 「在售中」复用同一套行渲染,只换数据源 —— 平铺是「在售的排最前」,在售页是「只看在售」 */}
          {(familyViewMode === "flat" || familyViewMode === "onsale") && (() => {
            const onSaleList = recipes.filter(r => r.onSale);
            const listRecipes = familyViewMode === "onsale"
              ? onSaleList
              : [...recipes].sort((a, b) => (b.onSale ? 1 : 0) - (a.onSale ? 1 : 0));   // 稳定排序,同组内保持原顺序
            if (familyViewMode === "onsale" && onSaleList.length === 0) {
              return (
                <EmptyState
                  variant="first" lang={lang}
                  title={lang === "zh" ? "还没标记在售配方" : "販売中のレシピがありません"}
                  hint={lang === "zh" ? "去「全部配方」,点配方名左边的小圆圈就标上了。标过的会排到最前面。" : "「全レシピ」で名前の左の丸をタップすると販売中になります。"}
                  actions={[{ label: lang === "zh" ? "去全部配方" : "全レシピへ", onClick: () => setFamilyViewMode("flat") }]}
                />
              );
            }
            return (
            <div>
              {listRecipes.map(r => {
                const name = pickLang(r, "name", lang);
                const nameSub = lang === "zh" ? (r.nameJa || "") : (r.nameZh || "");
                const family = productFamilies.find(fm => fm.id === r.familyId);
                const famColor = family ? FAMILY_COLORS[family.colorIdx || 0] : null;
                // 利润率与详情页统一用实时计算，不再读会过期的 r.margin 快照
                const liveCost = (r.ingredients || []).reduce((s, ing) => s + getIngLiveCost(ing, materials, brands, []), 0);
                const yieldN = parseFloat(r.yield) || 0;
                const unitCost = yieldN > 0 ? liveCost / yieldN : 0;
                const priceN = toCNY(r.price, priceCurOf(r));   // v17: 折算后算利润率
                const margin = priceN > 0 && unitCost > 0 ? ((priceN - unitCost) / priceN) * 100 : 0;
                return (
                  <div
                    key={r.id}
                    className="k-row rc-recipe-row"
                    onClick={() => { setViewId(r.id); setTab("view"); }}
                    style={{
                      display: "grid", gridTemplateColumns: "1fr 130px 110px",
                      alignItems: "center", gap: T.sp.xl,
                      padding: `18px 0 18px ${T.sp.xl}px`,
                      borderBottom: `1px solid ${T.lineFaint}`,
                      borderLeft: `3px solid ${famColor ? famColor.color : "transparent"}`,
                      cursor: "pointer",
                    }}
                  >
                    <div className="k-fluid">
                      {/* 标题行：法文 20px / 主名 14px 500 / 副名 12px muted，同一 baseline */}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleOnSale(r.id); }}
                          title={r.onSale
                            ? (lang === "zh" ? "在售中 — 点一下取消" : "販売中 — タップで解除")
                            : (lang === "zh" ? "点一下标为在售(会排到最前面)" : "タップで販売中に")}
                          style={{
                            width: 18, height: 18, flex: "0 0 auto", padding: 0, border: "none", background: "transparent",
                            cursor: "pointer", lineHeight: 1, fontSize: 13, alignSelf: "center",
                            color: r.onSale ? T.success : T.line,
                          }}
                        >{r.onSale ? "●" : "○"}</button>
                        {r.nameFr && (
                          <span style={{ fontFamily: T.fontSerif, ...T.fs.titleS, color: T.ink, fontWeight: 400 }}>{r.nameFr}</span>
                        )}
                        <span style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{name}</span>
                        {nameSub && nameSub !== name && (
                          <span style={{ ...T.fs.caption, color: T.subtle }}>{nameSub}</span>
                        )}
                        {family && (
                          <span style={{ ...T.fs.micro, color: famColor.color, border: `1px solid ${famColor.color}`, padding: "2px 6px", textTransform: "none", letterSpacing: "0.06em" }}>
                            {lang === "zh" ? (family.nameZh || family.nameJa) : (family.nameJa || family.nameZh)}
                          </span>
                        )}
                        {r.variantLabel && (
                          <span style={{ ...T.fs.micro, color: T.secondary, background: T.sunken, padding: "2px 6px", textTransform: "none", letterSpacing: "0.06em" }}>{r.variantLabel}</span>
                        )}
                      </div>
                      {/* 规格行 */}
                      <div style={{ ...T.fs.label, color: T.muted, marginTop: 5, letterSpacing: "0.04em" }}>
                        {[r.mold, r.yield ? `${r.yield} ${r.unit || "個"}` : null, r.temp, r.baketime ? `${r.baketime}` : (r.time ? `${r.time}分` : null)].filter(Boolean).join("  ·  ")}
                      </div>
                    </div>

                    {/* 利润率 */}
                    <div style={{ textAlign: "right", ...T.fs.caption, ...T.num, color: margin >= 50 ? T.success : margin >= 30 ? T.warning : T.danger }}>
                      {priceN > 0 ? `${margin.toFixed(1)}%` : ""}
                    </div>
                    {/* 售价 */}
                    <div style={{ textAlign: "right", fontFamily: T.fontSerif, ...T.num, color: T.ink }}>
                      {priceN > 0
                        ? <span style={{ fontSize: 18 }}>{fmtSellPrice(r.price, r)}</span>
                        : <span style={{ ...T.fs.micro, color: T.muted }}>{lang === "zh" ? "未定价" : "未設定"}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })()}

          {/* 🏷 家族模式 */}
          {familyViewMode === "family" && (
            <div>
              {productFamilies.length === 0 && (
                <div style={{ background: T.sunken, border: `1px dashed ${T.border}`, borderRadius: T.radius, padding: "2rem", textAlign: "center", color: T.body, ...T.fs.small }}>
                  {lang === "zh" ? "还没有建立任何产品家族。" : "まだプロダクトファミリーがありません。"}<br />
                  {lang === "zh" ? "点击上方「＋ 新建家族」创建第一个家族。" : "上の「＋ ファミリー新規」から作成できます。"}<br /><br />
                  <span style={{ ...T.fs.caption, color: T.muted }}>{lang === "zh" ? "例如：巴斯克家族、费南雪家族、戚风家族…" : "例：バスク / フィナンシェ / シフォン…"}</span>
                </div>
              )}
              {productFamilies.map(fm => {
                const famRecipes = recipes.filter(r => r.familyId === fm.id);
                const famName = lang === "zh" ? (fm.nameZh || fm.nameJa) : (fm.nameJa || fm.nameZh);
                const color = FAMILY_COLORS[fm.colorIdx || 0];
                return (
                  <div
                    key={fm.id}
                    className="k-row"
                    onClick={() => setFamilyViewId(fm.id)}
                    style={{
                      padding: `18px 0 18px ${T.sp.xl}px`,
                      cursor: "pointer",
                      borderBottom: `1px solid ${T.lineFaint}`,
                      borderLeft: `3px solid ${color.color}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
                      <div style={{ fontFamily: T.fontSerif, ...T.fs.titleS, color: color.color }}>
                        {famName}
                      </div>
                      <span style={{ ...T.fs.label, color: T.muted, ...T.num }}>
                        {famRecipes.length} {lang === "zh" ? "个变体" : "バリエーション"}
                      </span>
                    </div>
                    {fm.description && (
                      <div style={{ ...T.fs.caption, color: T.body, marginTop: 6, lineHeight: 1.6 }}>
                        {fm.description.slice(0, 80)}{fm.description.length > 80 ? "..." : ""}
                      </div>
                    )}
                    {famRecipes.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: T.sp.s }}>
                        {famRecipes.slice(0, 5).map(r => {
                          const rn = lang === "zh" ? (r.nameZh || r.nameJa) : (r.nameJa || r.nameZh);
                          return (
                            <span key={r.id} style={{ background: T.sunken, color: T.body, padding: "3px 10px", borderRadius: T.radius, ...T.fs.label }}>
                              {r.variantLabel || rn}
                            </span>
                          );
                        })}
                        {famRecipes.length > 5 && (
                          <span style={{ ...T.fs.label, color: T.muted, padding: "3px 6px" }}>
                            +{famRecipes.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 未归属家族的配方（独立） */}
              {(() => {
                const orphanRecipes = recipes.filter(r => !r.familyId);
                if (orphanRecipes.length === 0) return null;
                return (
                  <div style={{ marginTop: T.sp.block }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, paddingBottom: 9 }}>
                      <span style={{ ...T.fs.label, color: T.body, letterSpacing: "0.16em" }}>
                        {lang === "zh" ? "未归属家族" : "独立"}
                      </span>
                      <span style={{ flex: 1, height: 1, background: T.line }} />
                      <span style={{ ...T.fs.micro, color: T.muted, ...T.num }}>{orphanRecipes.length}</span>
                    </div>
                    <div>
                      {orphanRecipes.map(r => {
                        const name = pickLang(r, "name", lang);
                        return (
                          <div key={r.id} className="k-row" onClick={() => { setViewId(r.id); setTab("view"); }} style={{ padding: `13px 0 13px ${T.sp.xl}px`, borderBottom: `1px solid ${T.lineFaint}`, cursor: "pointer", ...T.fs.small, color: T.body }}>
                            {name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* VIEW */}
      {tab === "view" && viewingRecipe && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          </div>
          <RecipeView recipe={viewingRecipe} lang={lang} knowledge={knowledge} onNavigateToKnowledge={(id) => { setKnowledgeViewId(id); setTab("knowledge"); }} onEdit={() => { setEditTarget(viewingRecipe); setTab("edit"); }} onBack={() => setTab("list")} onPrint={() => setPrintTarget({ type: "recipe", data: viewingRecipe, stage: "settings" })} materials={materials} brands={brands} onNavigateToMaterial={(id) => { setMaterialReturnTo({ tab: "view", viewId: viewingRecipe.id }); setMaterialViewId(id); setTab("materialsPedia"); }} shopMaterials={shopMaterials} setShopMaterials={setShopMaterials} showToast={showToast} />
        </div>
      )}

      {/* EDIT */}
      {tab === "edit" && (
        <EditForm recipe={editTarget} cats={cats} materials={materials} brands={brands} setMaterials={setMaterials} shopMaterials={shopMaterials} setShopMaterials={setShopMaterials} lang={lang} onSave={handleSaveRecipe} onDelete={handleDeleteRecipe} onBack={() => {
          // [B4 修复] 有 id 跳详情,无 id 回列表
          if (editTarget && editTarget.id) { setViewId(editTarget.id); setTab("view"); }
          else { setTab("list"); }
        }} onQuickAddKnowledge={(k) => { setKnowledge(prev => [...prev, k]); showToast("✓ 知识点已添加并关联"); }} productFamilies={productFamilies} onUpdateCats={setCats} showToast={showToast} />
      )}

      {/* MATERIALS */}
      {tab === "materials" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 2 }}>
                {lang === "zh" ? "快速参考" : "クイック参照"}
              </div>
              <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.brand, letterSpacing: "-0.3px" }}>
                {lang === "zh" ? "💰 价格对比表" : "💰 価格対比表"}
              </div>
            </div>
            <Btn variant="primary" onClick={() => setCats(prev => [...prev, { id: "c" + Date.now(), nameZh: "", nameJa: "", unit: "g", brands: [{ nameZh: "", nameJa: "", price: "" }] }])}>
              {lang === "zh" ? "+ 新增原料" : "+ 原料追加"}
            </Btn>
          </div>
          <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: "1.25rem", lineHeight: 1.7, fontStyle: "italic", padding: "10px 14px", background: T.bgMuted, borderRadius: T.radius, borderLeft: `2px solid ${T.accentSoft}` }}>
            {lang === "zh" ? "💡 简单的价格对比表。中日文任一填写即可。配方里输入名字时会自动匹配并联动。要录入厂家故事、规格等详细信息,请使用「📚材料百科」。" : "💡 シンプルな価格比較表。中日いずれか入力でOK。レシピで名前を入力すると自動連動します。詳細な仕様は「材料事典」へ。"}
          </div>
          {cats.map(c => {
            const best = c.brands.filter(b => (b.nameZh || b.nameJa) && parseFloat(b.price) > 0).reduce((a, b) => (!a || parseFloat(b.price) < parseFloat(a.price)) ? b : a, null);
            return (
              <div key={c.id} style={{ marginBottom: "1.5rem", background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 240, display: "grid", gridTemplateColumns: "1fr 1fr 60px", gap: 6 }}>
                    <input
                      value={c.nameZh || ""}
                      onChange={e => setCats(prev => prev.map(x => x.id === c.id ? { ...x, nameZh: e.target.value } : x))}
                      placeholder={lang === "zh" ? "原料名(中文)" : "原料名(中)"}
                      style={{ fontSize: 14, fontFamily: T.fontSerif, fontWeight: 500, border: `0.5px solid ${T.borderSoft}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, padding: "5px 8px", outline: "none" }}
                    />
                    <input
                      value={c.nameJa || ""}
                      onChange={e => setCats(prev => prev.map(x => x.id === c.id ? { ...x, nameJa: e.target.value } : x))}
                      placeholder={lang === "zh" ? "原料名(日文)" : "原料名(日)"}
                      style={{ fontSize: 14, fontFamily: T.fontSerif, fontWeight: 500, border: `0.5px solid ${T.borderSoft}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, padding: "5px 8px", outline: "none" }}
                    />
                    <input
                      value={c.unit || "g"}
                      onChange={e => setCats(prev => prev.map(x => x.id === c.id ? { ...x, unit: e.target.value } : x))}
                      placeholder="g"
                      style={{ fontSize: 13, border: `0.5px solid ${T.borderSoft}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textSecondary, padding: "5px 8px", outline: "none", textAlign: "center" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" onClick={() => setCats(prev => prev.map(x => x.id === c.id ? { ...x, brands: [...x.brands, { nameZh: "", nameJa: "", price: "" }] } : x))}>
                      {lang === "zh" ? "+ 品牌" : "+ ブランド"}
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={() => confirmDialog(lang === "zh" ? "删除这个原料吗？" : "この原料を削除？", () => setCats(prev => prev.filter(x => x.id !== c.id)))}>
                      {lang === "zh" ? "删除" : "削除"}
                    </Btn>
                  </div>
                </div>
                <div style={{ border: `0.5px solid ${T.borderSoft}`, borderRadius: T.radius, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.3fr 0.8fr 1fr 70px", background: T.bgMuted, borderBottom: `0.5px solid ${T.borderSoft}` }}>
                    {[
                      lang === "zh" ? "品牌(中)" : "ブランド(中)",
                      lang === "zh" ? "品牌(日)" : "ブランド(日)",
                      lang === "zh" ? "单价" : "単価",
                      lang === "zh" ? "/kg参考" : "/kg参考",
                      ""
                    ].map((h, i) => (
                      <div key={i} style={{ padding: "8px 10px", fontSize: 10, color: T.textTertiary, letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</div>
                    ))}
                  </div>
                  {c.brands.map((b, bi) => {
                    const isBest = best && (b.nameZh || b.nameJa) === (best.nameZh || best.nameJa) && b.price === best.price;
                    return (
                      <div key={bi} style={{ display: "grid", gridTemplateColumns: "1.3fr 1.3fr 0.8fr 1fr 70px", background: isBest ? T.successBg : T.bgCard, borderBottom: bi < c.brands.length - 1 ? `0.5px solid ${T.borderSoft}` : "none" }}>
                        <input
                          value={b.nameZh || ""}
                          onChange={e => setCats(prev => prev.map(x => x.id === c.id ? { ...x, brands: x.brands.map((bb, bj) => bj === bi ? { ...bb, nameZh: e.target.value } : bb) } : x))}
                          placeholder={lang === "zh" ? "中文" : "中"}
                          style={{ border: "none", borderRight: `0.5px solid ${T.borderSoft}`, padding: "9px 10px", fontSize: 13, background: "transparent", color: T.textPrimary, outline: "none", fontFamily: T.fontSans }}
                        />
                        <input
                          value={b.nameJa || ""}
                          onChange={e => setCats(prev => prev.map(x => x.id === c.id ? { ...x, brands: x.brands.map((bb, bj) => bj === bi ? { ...bb, nameJa: e.target.value } : bb) } : x))}
                          placeholder={lang === "zh" ? "日文" : "日"}
                          style={{ border: "none", borderRight: `0.5px solid ${T.borderSoft}`, padding: "9px 10px", fontSize: 13, background: "transparent", color: T.textPrimary, outline: "none", fontFamily: T.fontSans }}
                        />
                        <input
                          type="number"
                          value={b.price}
                          onChange={e => setCats(prev => prev.map(x => x.id === c.id ? { ...x, brands: x.brands.map((bb, bj) => bj === bi ? { ...bb, price: e.target.value } : bb) } : x))}
                          placeholder={lang === "zh" ? "単价" : "単価"}
                          style={{ border: "none", borderRight: `0.5px solid ${T.borderSoft}`, padding: "9px 10px", fontSize: 13, background: "transparent", color: T.textPrimary, outline: "none", fontFamily: T.fontSerif }}
                        />
                        <div style={{ padding: "9px 10px", fontSize: 12, color: T.textSecondary, fontFamily: T.fontSerif, borderRight: `0.5px solid ${T.borderSoft}` }}>
                          {(b.nameZh || b.nameJa) && parseFloat(b.price) > 0 ? (parseFloat(b.price) * 1000).toFixed(0) + "円/kg" : ""}
                        </div>
                        <div style={{ display: "flex", gap: 4, padding: "4px 8px", alignItems: "center" }}>
                          {isBest && (
                            <span style={{ background: T.success, color: T.bgApp, padding: "2px 6px", borderRadius: T.radiusPill, fontSize: 10, fontWeight: 500, letterSpacing: "0.5px" }}>
                              {lang === "zh" ? "最优" : "最優"}
                            </span>
                          )}
                          <button
                            onClick={() => setCats(prev => prev.map(x => x.id === c.id ? { ...x, brands: x.brands.filter((_, bj) => bj !== bi) } : x))}
                            style={{ background: "none", border: "none", cursor: "pointer", color: T.textTertiary, fontSize: 15, padding: "2px 4px" }}
                          >×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🍰 商品 (v12) */}
      {tab === "products" && (
        <ProductsView
          products={products}
          setProducts={setProducts}
          recipes={recipes}
          creations={creations}
          components={components}
          lang={lang}
          showToast={showToast}
          confirmDialog={confirmDialog}
          viewId={productViewId}
          setViewId={setProductViewId}
          editTarget={productEditTarget}
          setEditTarget={setProductEditTarget}
          salesLog={salesLog}
          setSalesLog={setSalesLog}
          productionLog={productionLog}
          setProductionLog={setProductionLog}
        />
      )}

      {/* 📦 采购清单 (v13) */}
      {tab === "purchase" && (
        <PurchaseView
          products={products}
          salesLog={salesLog}
          recipes={recipes}
          creations={creations}
          components={components}
          materials={materials}
          brands={brands}
          shopMaterials={shopMaterials}
          suppliers={suppliers}
          lang={lang}
        />
      )}

      {/* 🚚 供货商 (v13) */}
      {tab === "suppliers" && (
        <SuppliersView
          suppliers={suppliers}
          setSuppliers={setSuppliers}
          shopMaterials={shopMaterials}
          materials={materials}
          brands={brands}
          lang={lang}
          showToast={showToast}
          confirmDialog={confirmDialog}
          viewId={supplierViewId}
          setViewId={setSupplierViewId}
          editTarget={supplierEditTarget}
          setEditTarget={setSupplierEditTarget}
        />
      )}

      {/* 🏷️ 本店原料 (v11) */}
      {tab === "shopMaterials" && (
        <ShopMaterialsView
          shopMaterials={shopMaterials}
          setShopMaterials={setShopMaterials}
          materials={materials}
          brands={brands}
          suppliers={suppliers}
          lang={lang}
          showToast={showToast}
          confirmDialog={confirmDialog}
        />
      )}

      {/* 📚 材料百科 */}
      {tab === "materialsPedia" && (
        <MaterialsView
          brands={brands}
          setBrands={setBrands}
          materials={materials}
          setMaterials={setMaterials}
          shopMaterials={shopMaterials}
          setShopMaterials={setShopMaterials}
          recipes={recipes}
          components={components}
          creations={creations}
          lang={lang}
          setLang={setLang}
          confirmDialog={confirmDialog}
          showToast={showToast}
          categoryFilter={materialCategoryFilter}
          setCategoryFilter={setMaterialCategoryFilter}
          subcategoryFilter={materialSubcategoryFilter}
          setSubcategoryFilter={setMaterialSubcategoryFilter}
          brandFilter={materialBrandFilter}
          setBrandFilter={setMaterialBrandFilter}
          searchQ={materialSearchQ}
          setSearchQ={setMaterialSearchQ}
          brandViewId={brandViewId}
          setBrandViewId={setBrandViewId}
          brandEditTarget={brandEditTarget}
          setBrandEditTarget={setBrandEditTarget}
          materialViewId={materialViewId}
          setMaterialViewId={setMaterialViewId}
          materialEditTarget={materialEditTarget}
          setMaterialEditTarget={setMaterialEditTarget}
          materialReturnTo={materialReturnTo}
          setMaterialReturnTo={setMaterialReturnTo}
          setTab={setTab}
          setViewId={setViewId}
        />
      )}

      {/* 组件仓库 */}
      {tab === "components" && (
        <ComponentsView
          components={components}
          setComponents={setComponents}
          cats={cats}
          onUpdateCats={setCats}
          brands={brands}
          materials={materials}
          setMaterials={setMaterials}
          lang={lang} setLang={setLang}
          viewId={compViewId} setViewId={setCompViewId}
          editTarget={compEditTarget} setEditTarget={setCompEditTarget}
          showToast={showToast}
          saved={saved}
          confirmDialog={confirmDialog}
          knowledge={knowledge}
          onNavigateToKnowledge={(id) => { setKnowledgeViewId(id); setTab("knowledge"); }}
          onQuickAddKnowledge={(k) => {
            setKnowledge(prev => [...prev, k]);
            showToast("✓ 知识点已添加并关联");
          }}
          onPrintComponent={(comp) => setPrintTarget({ type: "component", data: comp, stage: "settings" })}
          customCompCats={customCompCats}
          onAddCustomCompCat={(newCat) => {
            setCustomCompCats(prev => [...prev, newCat]);
            showToast("✓ 新分类已添加");
          }}
        />
      )}

      {/* 组合蛋糕 */}
      {tab === "creations" && (
        <CreationsView
          creations={creations}
          setCreations={setCreations}
          components={components}
          cats={cats}
          onUpdateCats={setCats}
          brands={brands}
          materials={materials}
          lang={lang} setLang={setLang}
          viewId={creationViewId} setViewId={setCreationViewId}
          editTarget={creationEditTarget} setEditTarget={setCreationEditTarget}
          showToast={showToast}
          saved={saved}
          confirmDialog={confirmDialog}
          onUpdateComponent={(updated) => {
            confirmDialog("确定将此修改同步回组件库吗？\n\n这不会影响其他已创建的组合蛋糕，只会更新组件库里的原始配方。", () => {
              setComponents(prev => prev.map(c => c.id === updated.id ? updated : c));
              showToast("✓ 已更新回组件库");
            }, { danger: false });
          }}
          knowledge={knowledge}
          onNavigateToKnowledge={(id) => { setKnowledgeViewId(id); setTab("knowledge"); }}
        />
      )}

      {/* 知识库 */}
      {tab === "knowledge" && (
        <KnowledgeView
          knowledge={knowledge}
          setKnowledge={setKnowledge}
          lang={lang} setLang={setLang}
          viewId={knowledgeViewId} setViewId={setKnowledgeViewId}
          editTarget={knowledgeEditTarget} setEditTarget={setKnowledgeEditTarget}
          showToast={showToast}
          saved={saved}
          confirmDialog={confirmDialog}
          recipes={recipes}
          components={components}
          creations={creations}
          onNavigate={(type, id) => {
            setKnowledgeViewId(null); // 关闭知识详情
            if (type === "recipe") {
              setViewId(id);
              setTab("view");
            } else if (type === "component") {
              setCompViewId(id);
              setTab("components");
            } else if (type === "creation") {
              setCreationViewId(id);
              setTab("creations");
            }
          }}
        />
      )}

      {/* DATA */}
      {tab === "data" && (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>
              {lang === "zh" ? "系统" : "システム"}
            </div>
            <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.brand, letterSpacing: "-0.3px" }}>
              {lang === "zh" ? "数据管理" : "データ管理"}
            </div>
          </div>

          <FxSettingCard appSettings={appSettings} setAppSettings={setAppSettings} lang={lang} />

          {/* v57: 本地存储用量 */}
          {(() => {
            let used = 0;
            try { used = (localStorage.getItem(STORAGE_KEY) || "").length; } catch {}
            const usedMB = (used / 1024 / 1024);
            const limitMB = 5; // 典型手机 localStorage 限额
            const pct = Math.min(100, (usedMB / limitMB) * 100);
            const color = pct > 80 ? T.danger : pct > 60 ? T.warning : T.success;
            const bg = pct > 80 ? T.dangerBg : pct > 60 ? T.warningBg : T.successBg;
            return (
              <div style={{ background: bg, border: `0.5px solid ${color}`, borderRadius: T.radiusLg, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary }}>
                    {lang === "zh" ? "💾 本地存储用量" : "💾 ローカル使用量"}
                  </div>
                  <div style={{ fontSize: 12, color, fontWeight: 500 }}>
                    {usedMB.toFixed(2)} MB / ~{limitMB} MB ({pct.toFixed(0)}%)
                  </div>
                </div>
                <div style={{ background: T.bgMuted, height: 6, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ background: color, height: "100%", width: `${pct}%`, transition: "width 0.3s" }} />
                </div>
                {pct > 80 && (
                  <div style={{ fontSize: 11, color: T.danger, marginTop: 8, lineHeight: 1.6 }}>
                    {lang === "zh"
                      ? "⚠️ 存储接近上限,建议:导出数据 → 清理用不到的配方/图片/旧材料 → 重新导入"
                      : "⚠️ 容量接近上限,バックアップ → 不要データ削除を推奨"}
                  </div>
                )}
              </div>
            );
          })()}

          {(() => {
            // v17: 数据管理页整理 — 6 张操作卡片按用途分 3 组 + 小标题(功能/handler 不变,仅重排+加层次)
            const card = (s, i) => (
              <div key={i} style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "0.75rem" }}>
                <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, color: T.textPrimary, marginBottom: 4 }}>{s.title}</div>
                <p style={{ fontSize: 12, color: T.textSecondary, marginBottom: 12, lineHeight: 1.7 }}>{s.desc}</p>
                {s.action}
              </div>
            );
            const secTitle = (txt) => (
              <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.2px", textTransform: "uppercase", fontWeight: 500, margin: "1.5rem 0 0.6rem" }}>{txt}</div>
            );
            const backupCards = [
              { title: lang === "zh" ? "🛟 恢复备份(防丢失保险)" : "🛟 バックアップ復元", desc: lang === "zh" ? `✨ v13.1 新增。每次保存自动写一份到浏览器内置数据库 (IndexedDB,跟主数据隔离),保留最近 ${BACKUP_MAX} 份历史。万一 localStorage 数据丢失,从这里挑一个版本恢复。` : `自動バックアップ (最大 ${BACKUP_MAX} 件) から復元`, action: <Btn variant="primary" onClick={() => setShowBackupDialog(true)}>{lang === "zh" ? "🛟 打开恢复列表" : "🛟 復元リスト"}</Btn> },
              { title: lang === "zh" ? "导出数据(完整备份)" : "データエクスポート(フル)", desc: lang === "zh" ? "⚠️ 包含本店原料采购价。用于自己跨设备迁移或灾难恢复 —— 不要把这个文件发给客户或公开分享!" : "⚠️ 仕入れ原料の価格を含む。自分のバックアップ用。顧客に渡さないこと。", action: <Btn variant="success" onClick={exportData}>{lang === "zh" ? "↓ 导出完整备份" : "↓ フル出力"}</Btn> },
              { title: lang === "zh" ? "导入数据(覆盖)" : "データインポート(上書き)", desc: lang === "zh" ? "⚠️ 将覆盖现有数据!选择之前导出的 JSON 文件恢复全部数据。用于跨设备迁移或灾难恢复。" : "⚠️ 現在のデータを上書きします。デバイス移行や復旧時に使用。", action: <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, padding: "7px 14px", fontSize: 13, color: T.textPrimary, fontFamily: T.fontSans }}>{lang === "zh" ? "↑ 选择 JSON 文件(覆盖)" : "↑ JSON ファイルを選択"}<input type="file" accept=".json" onChange={importData} style={{ display: "none" }} /></label> },
            ];
            const exchangeCards = [
              { title: lang === "zh" ? "🆕 合并导入(只新增不覆盖)" : "🆕 マージインポート(追加のみ)", desc: lang === "zh" ? "✨ 推荐!只追加新内容,不覆盖现有数据。用于:从 Claude 拿到的新配方包 / 一键加入新材料和组件。已存在的项目会自动跳过。" : "✨ おすすめ!新規のみ追加、既存は上書きしない。Claude から受け取った新レシピパック等に使用。", action: <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", background: "#E1F5EE", border: `0.5px solid #0F6E56`, borderRadius: T.radiusSm, padding: "7px 14px", fontSize: 13, color: "#085041", fontFamily: T.fontSans, fontWeight: 500 }}>{lang === "zh" ? "+ 合并导入 JSON 文件" : "+ マージインポート"}<input type="file" accept=".json" onChange={mergeImportData} style={{ display: "none" }} /></label> },
              { title: lang === "zh" ? "📦 导出 IP 分发包(卖给买家用)" : "📦 IP パック出力(顧客向け)", desc: lang === "zh" ? `✨ 剥离本店原料 (${shopMaterials.length} 条) 的版本。百科/配方/组件/知识库完整保留。买家导入后看到的是百科参考价,自己录入本店价,不会看到你的采购价。` : `仕入れ原料 (${shopMaterials.length} 件) を除外。百科・レシピ等は完全保持。顧客は百科参考価のみ見え、自分の仕入れ価は別途入力。`, action: <Btn variant="primary" onClick={exportPublicIP}>{lang === "zh" ? "📦 导出 IP 分发包" : "📦 IP パック出力"}</Btn> },
            ];
            const maintainCards = [
              { title: lang === "zh" ? "🔍 内容质量扫描(中日混杂 + 图片标记)" : "🔍 品質スキャン", desc: lang === "zh" ? "扫描材料/厂家百科:① 中文字段里混入的日语假名 / 日本汉字 / 繁体字符 ② 文本里写了 ![](url) 或 <img> 但应用渲染成纯文本的图片标记。结果可点「编辑」直接跳过去改。" : "中日混在 / 画像マーク検出", action: <Btn onClick={() => setShowQualityScan(true)}>{lang === "zh" ? "🔍 启动扫描" : "🔍 スキャン"}</Btn> },
            ];
            return (
              <>
                {secTitle(lang === "zh" ? "备份与恢复（防数据丢失）" : "バックアップと復元（紛失防止）")}
                {backupCards.map(card)}
                {secTitle(lang === "zh" ? "内容交换（与 Claude / 买家）" : "データ交換")}
                {exchangeCards.map(card)}
                {secTitle(lang === "zh" ? "维护工具" : "メンテナンス")}
                {maintainCards.map(card)}
              </>
            );
          })()}
          <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
            <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, color: T.textPrimary, marginBottom: 4 }}>
              {lang === "zh" ? "⚙ 自定义组件分类" : "⚙ カスタムカテゴリー"}
            </div>
            <p style={{ fontSize: 12, color: T.textSecondary, marginBottom: 12, lineHeight: 1.7 }}>
              {lang === "zh" ? "在编辑组件时点击分类下拉里的「➕ 新建分类...」可自定义食感分类。" : "コンポーネント編集時の「➕ 新規カテゴリー」から追加できます。"}
            </p>
            {customCompCats.length === 0 ? (
              <div style={{ fontSize: 12, color: T.textTertiary, fontStyle: "italic" }}>
                {lang === "zh" ? "（暂无自定义分类）" : "（カスタムなし）"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {customCompCats.map((cc) => {
                  const inUse = components.filter(x => x.componentCategory === cc.id).length;
                  return (
                    <div key={cc.id} style={{ display: "flex", alignItems: "center", gap: 8, background: T.bgMuted, padding: "7px 12px", borderRadius: T.radiusSm, border: `0.5px solid ${T.borderSoft}` }}>
                      <span style={{ background: cc.bg, color: cc.color, padding: "2px 10px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500 }}>{cc.zh}</span>
                      <span style={{ fontSize: 11, color: T.textSecondary }}>{cc.ja}</span>
                      <span style={{ fontSize: 11, color: T.textTertiary, marginLeft: "auto" }}>
                        {inUse > 0 ? `${inUse}${lang === "zh" ? "个组件使用中" : "個使用中"}` : (lang === "zh" ? "未使用" : "未使用")}
                      </span>
                      <button onClick={() => {
                        if (inUse > 0) {
                          confirmDialog(`有 ${inUse} 个组件正在使用「${cc.zh}」，确认删除？删除后这些组件的分类会变为「其他」。`, () => {
                            setComponents(prev => prev.map(x => x.componentCategory === cc.id ? { ...x, componentCategory: "other" } : x));
                            setCustomCompCats(prev => prev.filter(x => x.id !== cc.id));
                            showToast("分类已删除");
                          });
                        } else {
                          setCustomCompCats(prev => prev.filter(x => x.id !== cc.id));
                          showToast("分类已删除");
                        }
                      }} style={{ background: "#FFFFFF", border: "1px solid #F7C1C1", color: "#A32D2D", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ background: "#F5F5F5", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>{lang === "zh" ? "当前数据" : "現在のデータ"}</div>
            <div style={{ fontSize: 13, color: "#666666", lineHeight: 2 }}>
              {lang === "zh" ? "配方" : "レシピ"}：<strong>{recipes.length}</strong> {lang === "zh" ? "个" : "件"}<br />
              {lang === "zh" ? "组件" : "コンポーネント"}：<strong>{components.length}</strong> {lang === "zh" ? "个" : "件"}<br />
              {lang === "zh" ? "组合蛋糕" : "組立ケーキ"}：<strong>{creations.length}</strong> {lang === "zh" ? "个" : "件"}<br />
              {lang === "zh" ? "知识点" : "ナレッジ"}：<strong>{knowledge.length}</strong> {lang === "zh" ? "条" : "件"}<br />
              {lang === "zh" ? "厂家" : "ブランド"}：<strong>{brands.length}</strong> {lang === "zh" ? "家" : "社"}<br />
              {lang === "zh" ? "材料百科" : "材料事典"}：<strong>{materials.length}</strong> {lang === "zh" ? "条" : "件"}<br />
              {lang === "zh" ? "本店原料" : "店舗仕入"}：<strong>{shopMaterials.length}</strong> {lang === "zh" ? "条" : "件"}<br />
              {lang === "zh" ? "商品" : "商品"}：<strong>{products.length}</strong> {lang === "zh" ? "个" : "件"}<br />
              {lang === "zh" ? "供货商" : "仕入先"}：<strong>{suppliers.length}</strong> {lang === "zh" ? "家" : "社"}<br />
              {lang === "zh" ? "产品家族" : "ファミリー"}：<strong>{productFamilies.length}</strong> {lang === "zh" ? "个" : "件"}<br />
              {lang === "zh" ? "销售记录" : "売上記録"}：<strong>{salesLog.length}</strong> {lang === "zh" ? "条" : "件"}<br />
              {lang === "zh" ? "生产记录" : "生産記録"}：<strong>{productionLog.length}</strong> {lang === "zh" ? "条" : "件"}
              {(cats || []).length > 0 && <><br />{lang === "zh" ? "老价格表（已废弃）" : "旧価格表（廃止）"}：<strong>{cats.length}</strong> {lang === "zh" ? "种" : "件"}</>}
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.danger}`, borderRadius: T.radiusLg, padding: "1.25rem" }}>
            <div style={{ fontWeight: 500, fontSize: 13, color: T.danger, marginBottom: 6 }}>危险操作</div>
            <p style={{ fontSize: 12, color: T.body, marginBottom: 10 }}>清除所有数据，不可撤销。请先导出备份。</p>
            <Btn variant="danger" onClick={() => confirmDialog("确认清除全部数据？此操作无法撤销！", () => { setRecipes([]); setCats([]); setComponents([]); setCreations([]); setKnowledge([]); setBrands([]); setMaterials([]); setShopMaterials([]); setProducts([]); setSalesLog([]); setProductionLog([]); setSuppliers([]); setProductFamilies([]); setCustomCompCats([]); showToast("已清除"); })}>清除全部数据</Btn>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
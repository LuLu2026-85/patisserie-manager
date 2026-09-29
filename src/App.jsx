
import { useState, useEffect, useRef, useMemo, Fragment } from "react";
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
  newCreation:   { zh: "+ 新建组合产品", ja: "+ 組立製品新規" },
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
// 其余 5 个（采购 / 组合产品 / 知识库 / 供货商 / 数据）收进「更多」全屏抽屉。
const MOBILE_NAV = ["list", "components", "products", "materialsPedia"];

// 配料表列宽：名称(吃剩余) / 用量 / 品牌 / 成本。
// 只在这里定义一次，表头 · 数据行 · 汇总条三处共用（原先在两个地方各写了一遍，改一处漏一处）
const ING_COLS = "1fr 96px 132px 88px";

// ───────────── 组件类别（用于仓库分类 & 组合产品的层结构）─────────────
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

// v17.1: 显示口径 —— LuLu 平时看人民币,但数据里存量是日元报价。
//   "CNY" = 全部折成人民币显示(日元的标 ≈,表示是换算来的),默认
//   "raw" = 各按各的原币种显示(核对日本报价单时用)
// 只影响「看」,不影响存储 —— 输入框永远是原币种,否则会把她填的数改掉。
// 成本 / 利润率不受这个开关影响:配方里可能混币种,必须统一人民币才加得起来。
let _displayCur = "CNY";
const setDisplayCurForLookup = (v) => { _displayCur = v === "raw" ? "raw" : "CNY"; };
const getDisplayCur = () => _displayCur;
// 一条记录(材料 / 本店原料 / 配料)的币种;无字段 = 老数据 = 日元
const curOf = (o) => (o && o.currency === "CNY") ? "CNY" : "JPY";
// 本地日期「YYYY-MM-DD」(北京时间)。toISOString().slice(0,10) 是 UTC 日期,北京早上 8 点前会落到前一天(2026-09-29 体检第 2 批)
const localDateStr = (d = new Date()) => {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
// 把任意币种的金额折成人民币
const toCNY = (v, currency) => {
  const n = parseFloat(v);
  if (isNaN(n) || n <= 0) return 0;
  return currency === "CNY" ? n : n * _fxJpyToCny;
};

// v17.2: 切币种时把已填的数按汇率换算过去 —— 保住「这笔钱的真实价值」不变。
// 只给币种按钮用(不是显示口径开关,那个不动存储)。切回去能原样还原,点错了再点一次即可。
const convCur = (v, from, to, dp = 6) => {
  const n = parseFloat(v);
  if (isNaN(n) || n <= 0 || from === to || !(_fxJpyToCny > 0)) return v;
  const p = Math.pow(10, dp);
  return String(Math.round((to === "CNY" ? n * _fxJpyToCny : n / _fxJpyToCny) * p) / p);
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
// 售价显示。存的永远是原币种原值(定价就是定价),但显示跟随全局口径 ——
// 老配方那个 450 是东京时期的 450 円,LuLu 平时看人民币,得给她折算过的数。
// opts.raw 强制原币种(编辑器里的输入框旁边用)。
const fmtSellPrice = (v, o, opts = {}) => {
  const n = parseFloat(v);
  if (isNaN(n) || n <= 0) return "";
  const isJpy = priceCurOf(o) === "JPY";
  if (isJpy && _displayCur === "CNY" && !opts.raw) {
    const cny = Math.round(n * _fxJpyToCny * 100) / 100;
    return cny > 0 ? `≈¥${cny.toLocaleString()}` : "";
  }
  return isJpy ? `${n.toLocaleString()}円` : `¥${n.toLocaleString()}`;
};
// 总价(袋价 / 箱价)的显示,同样跟随口径
const fmtTotalPrice = (v, currency, opts = {}) => {
  const n = parseFloat(v);
  if (isNaN(n) || n <= 0) return "";
  const isJpy = curOf({ currency }) === "JPY";
  if (isJpy && _displayCur === "CNY" && !opts.raw) {
    const cny = Math.round(n * _fxJpyToCny * 100) / 100;
    return cny > 0 ? `≈¥${cny.toLocaleString()}` : "";
  }
  return isJpy ? `${Math.round(n).toLocaleString()}円` : `¥${Math.round(n * 100) / 100}`;
};
// v17: 一个金额换算到另一币种的显示串。日元 → 人民币用汇率乘,人民币 → 日元用汇率除。
// 给「双币对照」行用 —— 报价单是日元,但记账和成本都要人民币,两个数得同时看见。
const fmtOther = (v, currency) => {
  const n = parseFloat(v);
  if (isNaN(n) || n <= 0) return "";
  if (curOf({ currency }) === "CNY") {
    const jpy = _fxJpyToCny > 0 ? n / _fxJpyToCny : 0;
    return jpy > 0 ? `${Math.round(jpy)}円` : "";
  }
  return `¥${Math.round(n * _fxJpyToCny * 100) / 100}`;
};

// 售价旁边的币种切换,一个字宽
const priceCurBtn = (obj, onToggle, lang, price = null) => (
  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation();
    const from = priceCurOf(obj), to = from === "CNY" ? "JPY" : "CNY";
    onToggle(to, convCur(price, from, to, 2)); }}
    title={lang === "zh" ? "售价的币种,点一下切换" : "販売価の通貨を切替"}
    style={{ marginLeft: 6, padding: "0 5px", fontSize: 11, lineHeight: 1.4, cursor: "pointer", verticalAlign: "middle",
      background: priceCurOf(obj) === "CNY" ? "transparent" : "#FEF3C7",
      border: `0.5px solid ${priceCurOf(obj) === "CNY" ? T.border : "#F59E0B"}`, borderRadius: 3,
      color: priceCurOf(obj) === "CNY" ? T.textSecondary : "#92400E" }}>
    {priceCurOf(obj) === "CNY" ? "¥" : "円"}
  </button>
);

// 配料行手写单价旁边的币种切换,配方 / 组件 / 层三个编辑页共用(组件和层原来没有,老行没有 currency = 日元,改不成人民币)。
// 语义同 priceCurBtn:「这笔钱是哪种钱」,切过去保住同一笔钱,单价、成本快照、改价前的原价一起折。
// onToggle 收要合并进这一行的字段。关联了百科的行别显示:那种行的价跟百科走,手写价不参与计算。
const ingCurBtn = (ing, onToggle, lang) => {
  const cur = curOf(ing), to = cur === "CNY" ? "JPY" : "CNY";
  return (
    <button type="button" onClick={() => onToggle({ currency: to, unitPrice: convCur(ing.unitPrice, cur, to), cost: convCur(ing.cost, cur, to, 2),
      ...(ing._originalPrice !== undefined ? { _originalPrice: convCur(ing._originalPrice, cur, to) } : {}) })}
      title={lang === "zh" ? "这条单价的币种,点一下切换(人民币 / 日元),已填的价一起换算" : "この単価の通貨を切替(入力済みの価格も換算)"}
      style={{ padding: "2px 4px", fontSize: 11, lineHeight: 1.2, cursor: "pointer", borderRadius: 3,
        background: cur === "CNY" ? "transparent" : "#FEF3C7",
        border: `0.5px solid ${cur === "CNY" ? T.border : "#F59E0B"}`,
        color: cur === "CNY" ? T.textSecondary : "#92400E" }}>
      {cur === "CNY" ? "¥" : "円"}
    </button>
  );
};

// 配料行 / 层的成本显示。整数四舍五入会把盐 1g 的 0.03 元显示成「¥0」,和「没价」(空白)分不清。
// 规则:不到 1 元两位小数、1 到 10 元一位小数、10 元以上整数,尾零去掉;小于 1 分显示「<¥0.01」。
// 批次总成本 / 单个成本不走这里(数大,整数够用)。
const fmtCost = (v) => {
  const n = parseFloat(v);
  if (!isFinite(n) || n <= 0) return "";
  if (n < 0.005) return "<¥0.01";
  if (n >= 10) return "¥" + Math.round(n).toLocaleString();
  return "¥" + (n < 1 ? n.toFixed(2) : n.toFixed(1)).replace(/\.?0+$/, "");
};

// opts.approx: 日元时附上按当前汇率折出的人民币参考值
// opts.raw: 强制原币种(输入框旁的对照之类,不跟全局口径走)
const fmtUnitPrice = (pricePerG, currency, opts = {}) => {
  const v = per100(pricePerG);
  if (!v) return "";
  const isJpy = curOf({ currency }) === "JPY";
  // 全局口径 = 人民币时,日元价折算显示,带 ≈ 表明是换算值
  if (isJpy && _displayCur === "CNY" && !opts.raw) {
    const cny = Math.round(parseFloat(v) * _fxJpyToCny * 100) / 100;
    return cny > 0 ? `≈¥${cny}/100g` : "";
  }
  if (!isJpy) return `¥${v}/100g`;
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
// v17.4: 「本店原料已有」判定,给关联候选排序 / 打「本店」标签用。不走 props,和上面的价格 helper 一样读注入值。
const isShopMaterialId = (id) => !!id && _shopMaterials.some(s => s && s.materialId === id);

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

// 步骤按行对齐(2026-09-29 体检 #31 / 第 2 批 2b C11):stepsZh[i] 和 stepsJa[i] 是同一步的两种语言。
// 存(stepsForSave):某一语言空着的行在那一语言里留 "",两种语言都空的行不存,每种语言末尾的 "" 去掉。
// 读(stepRows / pickSteps):第 i 行当前语言空 → 用另一语言的第 i 行;两边都空的行跳过;序号按显示出来的顺序数。
// 以前保存时两种语言各自把空行删掉,中间空一行,后面的步骤就整体错位一行(中文第 3 步对上日文第 4 步)。
// 某语言是空数组 → 用老字段 steps(兼容老数据,和 _effSteps 同一个规则)
const _stepStr = (s) => (s === undefined || s === null) ? "" : (typeof s === "string" ? s : String(s));
const _stepArr = (obj, L) => (Array.isArray(obj["steps" + L]) && obj["steps" + L].length) ? obj["steps" + L] : (Array.isArray(obj.steps) ? obj.steps : []);
// 返回 [{ zh, ja }],一行一步,已跳过两边都空的行;某一语言空着是 ""(不回退,双语并排用)
const stepRows = (obj) => {
  if (!obj) return [];
  const zh = _stepArr(obj, "Zh"), ja = _stepArr(obj, "Ja");
  const rows = [];
  for (let i = 0, n = Math.max(zh.length, ja.length); i < n; i++) {
    const z = _stepStr(zh[i]), j = _stepStr(ja[i]);
    const zOk = z.trim() !== "", jOk = j.trim() !== "";
    if (zOk || jOk) rows.push({ zh: zOk ? z : "", ja: jOk ? j : "" });
  }
  return rows;
};
// 显示用:一步一个字符串,当前语言这一行空着就用另一语言
const pickSteps = (obj, lang) => stepRows(obj).map(r => lang === "zh" ? (r.zh || r.ja) : (r.ja || r.zh));
// 编辑页保存:rows = 编辑页的步骤行 [{ textZh, textJa }](三个编辑页共用)
const stepsForSave = (rows) => {
  const zh = [], ja = [];
  (Array.isArray(rows) ? rows : []).forEach(s => {
    const z = _stepStr(s && s.textZh).trim(), j = _stepStr(s && s.textJa).trim();
    if (z || j) { zh.push(z); ja.push(j); }
  });
  const trimEnd = (a) => { let n = a.length; while (n > 0 && !a[n - 1]) n--; return a.slice(0, n); };
  return { stepsZh: trimEnd(zh), stepsJa: trimEnd(ja) };
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
  const shopIds = new Set(_shopMaterials.map(x => x && x.materialId).filter(Boolean)); // v17.4

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
    // v17.4: 中文 / 日文名上的重叠率单独记一份 —— 只靠法文名撞上的(「Sucre」⊂「Sucre inverti」)不算「对得齐」
    let zhJa = 0;

    if ((ingZhClean && mZhClean === ingZhClean) || (ingJaClean && mJaClean === ingJaClean)) {
      score = 100;
      zhJa = 1;
    } else {
      const overlapZh = tokenOverlap(ingTokensZh, mTokensZh);
      const overlapJa = tokenOverlap(ingTokensJa, mTokensJa);
      const overlapFr = tokenOverlap(ingTokensFr, mTokensFr);
      const maxOverlap = Math.max(overlapZh, overlapJa, overlapFr);
      zhJa = Math.max(overlapZh, overlapJa);

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
      results.push({ score: Math.min(100, score), material: m, inShop: shopIds.has(m.id), zhJa });
    }
  }

  results.sort((a, b) => b.score - a.score);
  // 仍按分数排(fuzzyMatchMaterial 靠 [0] / [1] 算置信度);够分(≥ 70)的本店候选不被「只留前 5」截掉
  return results.filter((r, i) => i < 5 || (r.inShop && r.score >= 70));
};

// v17.4 (2026-09-19, LuLu:「一键关联的逻辑改一下 最优先本店原料已有」)
// 本店候选「够格优先」= 本店原料已有 + 中文 / 日文名对得齐(zhJa ≥ 0.8)+ 分数 ≥ 85 + 不比最高分低 10 分以上。
// 两道门槛都不能去(主数据回归出来的):
//  · 「对得齐」:打分只看「你写的词有没有全出现在对方名字里」,「细砂糖」的法文 Sucre 会和 ハローデックス 的
//    Sucre inverti 全重叠打到 87,不加门槛 11 行砂糖会被勾成转化糖浆。
//  · 「不比最高分低 10 分以上」:「Union 业务用杏仁粉」精确命中 Union 100 分,本店 Marcona 靠泛称日文名
//    アーモンドパウダー 全重叠拿 85,不加门槛点名了品牌的行也会被本店抢走。
const shopMatchWins = (c, topScore = 0) => !!(c && c.inShop && c.zhJa >= 0.8 && c.score >= 85 && c.score >= topScore - 10);
// 自动勾选:够格的本店候选优先;否则分数最高且 ≥ minScore 的。cands 必须是 smartMatchMaterial 的原序(按分)
const pickAutoMatch = (cands, minScore = 70) => {
  if (!Array.isArray(cands) || cands.length === 0) return null;
  const hit = cands.find(c => shopMatchWins(c, cands[0].score));
  if (hit) return hit;
  return cands[0].score >= minScore ? cands[0] : null;
};
// 显示顺序:够分(≥ 70)的本店候选排最前,其余按分数(分数低的本店候选留在原位,只打标签,不当噪音浮上来)
const sortShopFirst = (cands) => {
  const w = (c) => (c.inShop && c.score >= 70) ? 1 : 0;
  return [...cands].sort((a, b) => (w(b) - w(a)) || (b.score - a.score));
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

// 一组配料的实时总成本(人民币)。组件卡片 / 选组件弹窗 / 组合蛋糕都走这里,不读存下来的 totalCost ——
// 那个数没有币种:东京时期存的是日元,v17 之后点过「保存层」的又是人民币,当人民币显示会差 23 倍
// (Framboisier 列表 ¥22,885、实际约 ¥312)。配方详情 / 组件详情一直是这么实时算的。
const getIngsLiveCost = (ings, materials, brands) => (ings || []).reduce((s, ing) => s + getIngLiveCost(ing, materials, brands, []), 0);
// 组合蛋糕单层实际成本 = 这一层配料的实时成本 × (本蛋糕用量 / 产出量);没设产出量就按整批
const calcLayerLiveCost = (l, materials, brands) => {
  const componentYield = parseFloat(l.yield) || 0;
  const usedAmount = parseUsedAmount(l.usedAmount, l.unit);  // 2026-09-29 体检第 2 批:以前 parseFloat,「约45g/个」按 0 算
  const componentCost = getIngsLiveCost(l.ingredients, materials, brands);
  if (componentYield === 0) return componentCost;
  return componentCost * (usedAmount / componentYield);
};

// BEGIN creation-follow helpers ──────────────────────────────────────────────
// v17.8 (2026-09-28)「组合产品的部分默认跟组件库走」+「整体配方」。
// creations[].layers[] 仍然存组件内容的副本 —— 成本 / 采购 / 材料用在哪 / 打印这些老读者一个字不用改。
// 多了两个标记,由 App 里的一个 effect 把组件库的最新内容「写进」跟组件库走的部分(syncFollowingLayers):
//   · follow: true        跟组件库走。组件一改,这一部分换成组件的最新内容;部分名 customName、用量 usedAmount 不动
//   · localVariant: true  本产品专用。在这个产品里单独改过(编辑部分、改了内容、没点「↻ 同步回组件库」),不再跟组件库
//   · 两个都没有 = 老数据。内容和组件库一样 → 标成 follow;不一样 → 原样不动,详情页提示「和组件库不一样」,
//     点「用组件库的 / 保留(本产品专用)」才定。绝不悄悄换内容。
// 比较只看部分编辑页能改的 + 名字 / 分类 / 备注。关联了百科的配料,单价 / 成本是打开编辑页时刷出来的快照
// (成本本来就按百科实时算),不算内容;没关联的,手填的单价 / 币种 / 成本算内容。
// matIds(现有材料 id 的 Set)用来把指向已删材料的 materialId 当成没关联 —— 部分编辑页保存时会清掉它们。
// ⚠️ 改这一段先跑 .claude/scripts/creation_follow_probe.cjs(把这段抽出来对主数据全量跑)。
// 2026-09-29 体检第 2 批:用量读数统一走 parseUsedAmount(calcLayerLiveCost / creationBatch / 详情页 / 编辑页)。
// 以前各处直接 parseFloat:「约45g/个」「約 60–80g」开头是字 → 按 0 算;「1kg」「1,000g」→ 按 1 g 算。
// 现在:千位逗号先去掉,开头的 约 / 約 / ~ / ～ 跳过,认 kg(部分的单位是 g 或空时 ×1000);读不出数字仍是 0。
// 只取开头那个数 —— 后面还有数字 / + / 「/个」「每个」这种写法由 usedAmountAmbiguous 提醒。
const _usedAmountLead = (raw) => {
  const s = String(raw === undefined || raw === null ? "" : raw).trim()
    .replace(/(\d),(?=\d{3}(?!\d))/g, "$1")
    .replace(/^(?:约|約|~|～)\s*/, "");
  const m = s.match(/^(\d+(?:\.\d+)?|\.\d+)\s*(kg|千克|公斤|g|克)?\s*/i);
  if (!m) return null;
  return { n: parseFloat(m[1]), kg: !!m[2] && !/^(g|克)$/i.test(m[2]), rest: s.slice(m[0].length) };
};
const parseUsedAmount = (raw, unit) => {
  const r = _usedAmountLead(raw);
  if (!r || !isFinite(r.n) || !(r.n > 0)) return 0;
  const u = String(unit === undefined || unit === null ? "" : unit).trim();
  return (r.kg && (!u || /^(g|克)$/i.test(u))) ? r.n * 1000 : r.n;
};
const _normTxt = (v) => (v === undefined || v === null || (typeof v === "number" && !isFinite(v))) ? "" : String(v).trim();
const _normNum = (v) => { const n = parseFloat(v); return isFinite(n) ? String(n) : _normTxt(v); };
// 产出量:空 / 0 都是「没填」(组件编辑页存的是 0,老副本里是 "",成本算法两者一样)
const _normYield = (v) => { const n = parseFloat(v); return (isFinite(n) && n > 0) ? String(n) : ""; };
// 和 pickSteps 同一个回退:某语言是空数组 → 用老字段 steps
const _effSteps = (x, L) => {
  const a = (x && Array.isArray(x["steps" + L]) && x["steps" + L].length) ? x["steps" + L] : ((x && Array.isArray(x.steps)) ? x.steps : []);
  return a;
};
// 步骤比较(C11):老写法是两种语言各自去掉空串后比。步骤按行对齐存以后,某一语言「中间」空一行,
// 老写法就看不出这一行对着哪一步(中文 [a,"",c] 和 [a,c] 比成一样)—— 只在这种时候再补一项逐行对照。
// 没有中间空行的数据(09-26 的全部数据都是)比较结果和以前一字不差,「打开部分编辑页不改就保存」不会变成本产品专用
const _stepsKeyTail = (x) => {
  const zh = _effSteps(x, "Zh").map(_normTxt), ja = _effSteps(x, "Ja").map(_normTxt);
  const rows = [];
  for (let i = 0, n = Math.max(zh.length, ja.length); i < n; i++) {
    const z = zh[i] || "", j = ja[i] || "";
    if (z || j) rows.push([z, j]);
  }
  const gap = (k) => { let blank = false; for (const r of rows) { if (!r[k]) blank = true; else if (blank) return true; } return false; };
  return (gap(0) || gap(1)) ? [rows] : [];
};
const _ingContentKey = (ing, matIds) => {
  const mid = (ing.materialId && (!matIds || matIds.has(ing.materialId))) ? String(ing.materialId) : "";
  // 备注 / 法文名也算内容(2b C1 / C2 起组件和部分编辑页都能改,不比的话组件里改的到不了部分、部分里改的会被下次同步悄悄盖掉;审查第 1 轮)
  const k = [_normTxt(ing.nameZh), _normTxt(ing.nameJa), _normNum(ing.qty), _normTxt(ing.unit) || "g", _normTxt(ing.group) || "none", mid, _normTxt(ing.brand), _normTxt(ing.note), _normTxt(ing.nameFr)];
  if (!mid) k.push(_normNum(ing.unitPrice), curOf(ing), _normNum(ing.cost));
  return k;
};
const layerContentKey = (x, matIds) => JSON.stringify(x ? [
  _normTxt(x.nameZh), _normTxt(x.nameJa), _normTxt(x.nameFr), _normTxt(x.componentCategory),
  _normYield(x.yield), _normTxt(x.unit) || "g",
  (Array.isArray(x.ingredients) ? x.ingredients : []).filter(i => i && (_normTxt(i.nameZh) || _normTxt(i.nameJa))).map(i => _ingContentKey(i, matIds)),
  _effSteps(x, "Zh").map(_normTxt).filter(Boolean), _effSteps(x, "Ja").map(_normTxt).filter(Boolean),
  _normTxt(x.notesZh), _normTxt(x.notesJa),
  ..._stepsKeyTail(x),
] : null);
const sameLayerContent = (layer, comp, matIds) => !!(layer && comp) && layerContentKey(layer, matIds) === layerContentKey(comp, matIds);
// 组件 → 部分的内容字段。加部分(addLayerFromComponent)和跟组件库同步共用这一个
const layerContentFromComponent = (comp) => ({
  nameZh: comp.nameZh, nameJa: comp.nameJa, nameFr: comp.nameFr,
  componentCategory: comp.componentCategory,
  yield: comp.yield, unit: comp.unit,
  ingredients: JSON.parse(JSON.stringify(comp.ingredients || [])),
  stepsZh: [..._effSteps(comp, "Zh")],
  stepsJa: [..._effSteps(comp, "Ja")],
  steps: undefined,
  notesZh: comp.notesZh || "", notesJa: comp.notesJa || "",
  totalCost: comp.totalCost || 0,
});
// 幂等:什么都不用改时原样返回同一个数组(effect 靠这个不空转)
const syncFollowingLayers = (creations, components, matIds) => {
  if (!Array.isArray(creations) || creations.length === 0) return creations;
  const compById = new Map();
  (components || []).forEach(c => { if (c && c.id != null && !compById.has(c.id)) compById.set(c.id, c); });
  const keyCache = new Map();
  const compKey = (c) => { if (!keyCache.has(c)) keyCache.set(c, layerContentKey(c, matIds)); return keyCache.get(c); };
  let any = false;
  const next = creations.map(cr => {
    const layers = (cr && Array.isArray(cr.layers)) ? cr.layers : null;
    if (!layers || layers.length === 0) return cr;
    let changed = false;
    const newLayers = layers.map(l => {
      if (!l || !l.sourceComponentId || l.localVariant) return l;
      const comp = compById.get(l.sourceComponentId);
      if (!comp) return l;                       // 组件删了:留着副本
      const ck = compKey(comp);
      if (layerContentKey(l, matIds) === ck) {
        if (l.follow) return l;
        changed = true;
        return { ...l, follow: true };           // 老数据,内容和组件库一样 → 从此跟组件库走
      }
      if (!l.follow) return l;                   // 老数据,内容不一样 → 不动,页面上提示
      const upd = { ...l, ...layerContentFromComponent(comp), follow: true };
      if (layerContentKey(upd, matIds) !== ck) return l;  // 防御:抄完还对不上就别抄,免得 effect 来回写
      changed = true;
      return upd;
    });
    if (!changed) return cr;
    any = true;
    return { ...cr, layers: newLayers };
  });
  return any ? next : creations;
};
// manual 手搭的(不是从组件库来的)/ orphan 组件已删 / local 本产品专用 / follow 跟组件库 / differs 老数据和组件库不一样
const layerLinkState = (l, components, matIds) => {
  if (!l || !l.sourceComponentId) return "manual";
  const comp = (components || []).find(c => c && c.id === l.sourceComponentId);
  if (!comp) return "orphan";
  if (l.localVariant) return "local";
  if (l.follow) return "follow";
  return sameLayerContent(l, comp, matIds) ? "follow" : "differs";
};
// 整体配方:做 n 个(叠层是 n 台)。用量 usedAmount 是按「制作个数」serves 这一批写的 —— 成本一直这么算
// (总成本 ÷ serves = 单个成本)→ 做 n 个的需要量 = 用量 × n ÷ serves;配料缩放 = 需要量 ÷ 组件产出量。
// 没填产出量的部分(手搭的),成本按整批算,这里也按「整批 × 倍数」。组件标了备货的,页面只给「从库存取多少」。
const creationBatch = (c, n, components, materials, brands) => {
  const serves = parseFloat(c && c.serves) > 0 ? parseFloat(c.serves) : 1;
  const N = parseFloat(n) > 0 ? parseFloat(n) : serves;
  const factor = N / serves;
  const parts = ((c && c.layers) || []).map((l0, idx) => {
    const l = l0 || {};
    const comp = l.sourceComponentId ? (components || []).find(x => x && x.id === l.sourceComponentId) : null;
    const used = parseUsedAmount(l.usedAmount, l.unit);  // 2026-09-29 体检第 2 批:和 calcLayerLiveCost 同一个读法(以前 parseFloat)
    const yieldNum = parseFloat(l.yield) || 0;
    const noUsed = yieldNum > 0 && !(used > 0);
    const scale = yieldNum > 0 ? (used > 0 ? used * factor / yieldNum : null) : factor;
    const needed = used > 0 ? used * factor : null;
    const stock = !!(comp && comp.prepMode === "stock");
    const ings = (l.ingredients || []).filter(i => i && (_normTxt(i.nameZh) || _normTxt(i.nameJa))).map(i => {
      const q = parseFloat(i.qty);
      return { ing: i, qty: (scale !== null && isFinite(q)) ? q * scale : null };
    });
    const cost = calcLayerLiveCost(l, materials, brands) * factor;
    const missingIngs = ings.filter(({ ing }) => (parseFloat(ing.qty) || 0) > 0 && !(getIngLiveCost(ing, materials, brands, []) > 0)).map(x => x.ing);
    return { layer: l, idx, comp, used, usedRaw: _normTxt(l.usedAmount), yieldNum, noUsed, scale, needed, stock, ings, cost, missingIngs, missingPrice: missingIngs.length > 0 };
  });
  const cost = parts.reduce((s, p) => s + p.cost, 0);
  return { serves, N, factor, parts, cost, incomplete: parts.some(p => p.missingPrice || p.noUsed) };
};
// 称量用的数:100 以上取整(千位加逗号)、10 到 100 一位小数、10 以下两位小数,尾零去掉
const fmtQty = (v) => {
  const n = parseFloat(v);
  if (!isFinite(n)) return "";
  const a = Math.abs(n);
  if (a >= 100) return Math.round(n).toLocaleString("en-US");
  return (a >= 10 ? n.toFixed(1) : n.toFixed(2)).replace(/\.?0+$/, "");
};
// 用量原文不是纯数字(「约 30g」「35g×3」)时,页面在算出来的克数旁边照抄原文,免得读错
const usedAmountNote = (raw) => {
  const s = _normTxt(raw);
  if (!s || /^\d+(\.\d+)?\s*(g|克)?$/i.test(s)) return "";
  return s;
};
// 开头的数字后面紧跟 + / – / × / 到 这类(「500g + 170g」「60–80g」「35g×3」):只认开头那个数就算错了,要提醒;
// 「12g（3 个，每个约 4 g）」这种括号里的说明不算
// 2026-09-29 体检第 2 批:以前只看紧跟在数字后面的第一个字 ——「430g 海绵 + 168g 浸液」「45g/个」都认不出,
// 开头带「约」的也不查。现在(括号里的说明先去掉)开头数字后面只要再出现数字、+ × * /、「每」就算有歧义;
// 开头读不出数字、但写了「每个 / 每台 / /个」(「每个 45g」)也算 —— 用量要写这一批一共多少,不是每个多少。
const usedAmountAmbiguous = (raw) => {
  const s = _normTxt(raw).replace(/[（(][^（）()]*[）)]/g, " ").trim();
  if (!s) return false;
  const r = _usedAmountLead(s);
  if (!r) return /每|[/／]/.test(s) && /\d/.test(s);
  return /^[+＋\-–—~～×xX*到至]/.test(r.rest) || /\d|[+＋×*/／]|每/.test(r.rest);
};
// END creation-follow helpers ────────────────────────────────────────────────


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
// 厂家专用:brands.categoryId 是可选的「主分类」。空 = 全品类 / 综合渠道(淘宝、进口商这种什么都卖的),
// 不能掉进 getMaterialCat 的「其他」兜底,得有自己的外观。
const BRAND_CAT_ALL = { id: "", zh: "全品类", ja: "全カテゴリ", icon: "🏪", color: "#4B5563", bg: "#E5E7EB" };
const getBrandCat = (b) => (b && b.categoryId) ? getMaterialCat(b.categoryId) : BRAND_CAT_ALL;

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
// 每次 saveData 自动写一份到 IndexedDB。万一 localStorage 被清/损坏,可从备份列表里挑一个版本恢复。
// 2026-09-29 体检第 2 批:以前只留最近 30 次保存(每停手 0.8 秒就算一次),误导入隔天才发现就找不回导入前的版本;
// 打开恢复列表还把 30 份整份数据全读进来逐份解析。现在:
//   · 分层保留:最近 BACKUP_RECENT 份 + 最近 BACKUP_HOURS 小时每小时一份 + 最近 BACKUP_DAYS 天每天一份(当天最早那份);内容和上一份一样不存
//   · 覆盖导入 / 清除全部 / 恢复备份之前存一份「固定」备份(pinned),不参与上面的轮换(最多 BACKUP_PINNED_MAX 份)
//   · 新库 patisserie_backup_v2 把小摘要(meta)和整份数据(payloads)分开存:列表只读摘要,点「恢复」才读整份
//   · 旧库 patisserie_backup(升级前的备份)照样能列、能恢复,只读时间不读内容;超过 BACKUP_DAYS 天的自动清掉
const BACKUP_DB = "patisserie_backup";          // 旧库(升级前)
const BACKUP_STORE = "snapshots";
const BACKUP_DB2 = "patisserie_backup_v2";      // 新库
const BACKUP_META = "meta";
const BACKUP_PAYLOADS = "payloads";
const BACKUP_RECENT = 15;
const BACKUP_DAYS = 14;
const BACKUP_HOURS = 12;
const BACKUP_PINNED_MAX = 10;
const BACKUP_SUMMARY_KEYS = ["recipes", "components", "creations", "materials", "brands", "knowledge"];

// 旧库:只打开已有的,没有就不建(旧版页面还开着时,它写进来的也能读到)
function openBackupDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(BACKUP_DB);
    req.onupgradeneeded = (e) => { try { e.target.transaction.abort(); } catch (err) {} };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      if (!db.objectStoreNames.contains(BACKUP_STORE)) { db.close(); reject(new Error("no legacy store")); return; }
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}

function openBackupDB2() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(BACKUP_DB2, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(BACKUP_META)) db.createObjectStore(BACKUP_META, { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains(BACKUP_PAYLOADS)) db.createObjectStore(BACKUP_PAYLOADS, { keyPath: "id" });
    };
    req.onsuccess = () => { const db = req.result; db.onversionchange = () => db.close(); resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

// 存档去掉末尾 savedAt 之后的内容(saveData 写入的格式),用来判断「和上一份一样」
function backupBodyOf(payload) {
  const i = payload.lastIndexOf(',"savedAt":');
  return (i > 0 && payload.length - i < 60) ? payload.slice(0, i) : payload;
}
// 字符串指纹(约 4 毫秒 / 186 万字),带长度
function backupHash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return str.length + ":" + (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
}
function backupSummary(src) {
  const o = {};
  BACKUP_SUMMARY_KEYS.forEach(k => { o[k] = Array.isArray(src && src[k]) ? src[k].length : 0; });
  return o;
}
// 轮换:返回要删掉的备份 id。固定备份只按「最多 BACKUP_PINNED_MAX 份」删最旧的,不和自动备份一起轮换
function pickBackupsToDelete(metas, now) {
  const sorted = [...(metas || [])].sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));   // 新 → 旧
  const keep = new Set();
  // 恢复前的固定备份单独算名额(审查发现:连着恢复 10 次找版本,覆盖导入前那份唯一的原数据就被挤掉了)
  const pins = sorted.filter(m => m.pinned);
  pins.filter(m => m.reason !== "restore").slice(0, BACKUP_PINNED_MAX).forEach(m => keep.add(m.id));
  pins.filter(m => m.reason === "restore").slice(0, BACKUP_PINNED_MAX).forEach(m => keep.add(m.id));
  const auto = sorted.filter(m => !m.pinned);
  auto.slice(0, BACKUP_RECENT).forEach(m => keep.add(m.id));
  // 最近 BACKUP_HOURS 小时每小时留一份(那一小时最早那份):卖货时每点一次 +/- 都存一份,
  // 只留最近 15 份的话几分钟就轮完,两小时前的状态就找不回来了
  const firstOfHour = new Map();
  auto.forEach(m => {
    const t = new Date(m.savedAt || "").getTime();
    if (isNaN(t) || now - t > BACKUP_HOURS * 3600000) return;
    const hour = Math.floor(t / 3600000);
    const cur = firstOfHour.get(hour);
    if (!cur || (m.savedAt || "") < (cur.savedAt || "")) firstOfHour.set(hour, m);
  });
  firstOfHour.forEach(m => keep.add(m.id));
  const cutoff = localDateStr(new Date(now - (BACKUP_DAYS - 1) * 86400000));
  const firstOfDay = new Map();
  auto.forEach(m => {
    const t = new Date(m.savedAt || "");
    if (isNaN(t.getTime())) { keep.add(m.id); return; }   // 读不出时间的不动
    const day = localDateStr(t);
    if (day < cutoff) return;
    const cur = firstOfDay.get(day);
    if (!cur || (m.savedAt || "") < (cur.savedAt || "")) firstOfDay.set(day, m);
  });
  firstOfDay.forEach(m => keep.add(m.id));
  return sorted.filter(m => !keep.has(m.id)).map(m => m.id);
}

// counts:保存时手上的数组(只取条数);没给就解析一遍 payload。opts = { pinned, reason: "import" | "clear" | "restore" }
// 返回 true = 存上了(或和上一份一样不用存)
let _lastBackupHash = "";
async function addBackupSnapshot(payload, counts, opts = {}) {
  if (!payload || typeof payload !== "string") return false;
  const pinned = !!opts.pinned;
  let hash = "";
  try { hash = backupHash(backupBodyOf(payload)); } catch (e) {}
  if (!pinned && hash && hash === _lastBackupHash) return true;
  let summary = null;
  try { summary = backupSummary(counts || JSON.parse(payload)); } catch (e) {}
  let db = null;
  try {
    db = await openBackupDB2();
    const ok = await new Promise((resolve) => {
      const tx = db.transaction([BACKUP_META, BACKUP_PAYLOADS], "readwrite");
      const metaStore = tx.objectStore(BACKUP_META);
      const payStore = tx.objectStore(BACKUP_PAYLOADS);
      let result = false;
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
      const all = metaStore.getAll();
      all.onsuccess = () => {
        const metas = all.result || [];
        const now = Date.now();
        const finish = (list) => { pickBackupsToDelete(list, now).forEach(id => { metaStore.delete(id); payStore.delete(id); }); result = true; };
        const newest = metas.reduce((a, m) => (!a || (m.savedAt || "") > (a.savedAt || "")) ? m : a, null);
        // 固定备份:库里任何一份内容一样就直接把那份标成固定(连着恢复几次找版本时,不再每次多存一份 1.8 MB 的重复)
        const same = (pinned && hash) ? (metas.find(m => m.hash === hash) || null) : ((newest && hash && newest.hash === hash) ? newest : null);
        if (same) {
          // 和已有的一份内容一样:不再多存一份;要固定就把那一份标成固定
          if (pinned && !same.pinned) {
            const upd = { ...same, pinned: true, reason: opts.reason || "" };
            metaStore.put(upd);
            finish(metas.map(m => m.id === upd.id ? upd : m));
          } else result = true;
          return;
        }
        const meta = { savedAt: new Date(now).toISOString(), size: payload.length, hash, summary, pinned, reason: pinned ? (opts.reason || "") : "" };
        const addReq = metaStore.add(meta);
        addReq.onsuccess = () => {
          const id = addReq.result;
          payStore.put({ id, payload });
          finish([...metas, { ...meta, id }]);
        };
      };
    });
    if (ok && hash) _lastBackupHash = hash;
    if (ok) pruneLegacyBackups();
    return ok;
  } catch (e) {
    // 备份失败不影响主流程,只 warn
    if (typeof console !== "undefined" && console.warn) console.warn("[backup] failed:", e && e.message);
    return false;
  } finally {
    try { if (db) db.close(); } catch (e) {}
  }
}

// 旧库里超过 BACKUP_DAYS 天的备份清掉(每次打开 App 只做一次;只读 key,不读内容)
let _legacyPruned = false;
async function pruneLegacyBackups() {
  if (_legacyPruned) return;
  _legacyPruned = true;
  let db = null;
  try {
    db = await openBackupDB();
    const cutoff = new Date(Date.now() - BACKUP_DAYS * 86400000).toISOString();
    await new Promise((resolve) => {
      const tx = db.transaction(BACKUP_STORE, "readwrite");
      tx.oncomplete = () => resolve(); tx.onerror = () => resolve(); tx.onabort = () => resolve();
      const store = tx.objectStore(BACKUP_STORE);
      const cur = store.index("savedAt").openKeyCursor(IDBKeyRange.upperBound(cutoff, true));
      cur.onsuccess = () => { const c = cur.result; if (c) { store.delete(c.primaryKey); c.continue(); } };
    });
  } catch (e) {} finally { try { if (db) db.close(); } catch (e) {} }
}

// 列表只返回摘要(不含整份数据)。旧库的只有时间,标 legacy
async function listBackupSnapshots() {
  const out = [];
  let db = null;
  try {
    db = await openBackupDB2();
    const metas = await new Promise((resolve) => {
      const req = db.transaction(BACKUP_META, "readonly").objectStore(BACKUP_META).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
    metas.forEach(m => out.push(m));
  } catch (e) {} finally { try { if (db) db.close(); } catch (e) {} }
  let ldb = null;
  try {
    ldb = await openBackupDB();
    const rows = await new Promise((resolve) => {
      const list = [];
      const cur = ldb.transaction(BACKUP_STORE, "readonly").objectStore(BACKUP_STORE).index("savedAt").openKeyCursor();
      cur.onsuccess = () => { const c = cur.result; if (c) { list.push({ id: "legacy_" + c.primaryKey, legacyId: c.primaryKey, savedAt: c.key, legacy: true }); c.continue(); } else resolve(list); };
      cur.onerror = () => resolve(list);
    });
    rows.forEach(r => out.push(r));
  } catch (e) {} finally { try { if (ldb) ldb.close(); } catch (e) {} }
  return out.sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")));
}

// 点「恢复」时才读整份数据;读不到返回 null
async function getBackupPayload(snap) {
  let db = null;
  try {
    db = snap.legacy ? await openBackupDB() : await openBackupDB2();
    const storeName = snap.legacy ? BACKUP_STORE : BACKUP_PAYLOADS;
    return await new Promise((resolve) => {
      const req = db.transaction(storeName, "readonly").objectStore(storeName).get(snap.legacy ? snap.legacyId : snap.id);
      req.onsuccess = () => resolve(req.result && typeof req.result.payload === "string" ? req.result.payload : null);
      req.onerror = () => resolve(null);
    });
  } catch (e) { return null; } finally { try { if (db) db.close(); } catch (e) {} }
}

async function deleteBackupSnapshot(snap) {
  let db = null;
  try {
    db = snap.legacy ? await openBackupDB() : await openBackupDB2();
    await new Promise((resolve) => {
      const tx = db.transaction(snap.legacy ? [BACKUP_STORE] : [BACKUP_META, BACKUP_PAYLOADS], "readwrite");
      tx.oncomplete = () => resolve(); tx.onerror = () => resolve(); tx.onabort = () => resolve();
      if (snap.legacy) tx.objectStore(BACKUP_STORE).delete(snap.legacyId);
      else { tx.objectStore(BACKUP_META).delete(snap.id); tx.objectStore(BACKUP_PAYLOADS).delete(snap.id); }
    });
  } catch (e) {} finally { try { if (db) db.close(); } catch (e) {} }
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

// 备份恢复写完存档、刷新页面之前置 true:这段时间任何保存都跳过(否则离开页面时的立即保存会把恢复的数据盖回去)
let _suspendSaves = false;
// 去掉 savedAt 之后的存档内容,用来判断「内容到底变没变」(见 saveData 的 opts.lastBody 和 App 的多窗口判断)
function storageBodyOf(raw) {
  try { if (!raw) return null; const o = JSON.parse(raw); delete o.savedAt; return JSON.stringify(o); } catch (e) { return null; }
}
function saveData(recipes, cats, components, creations, knowledge, brands, materials, printSettings, customCompCats, productFamilies, shopMaterials, products, salesLog, productionLog, suppliers, appSettings, opts = {}) {
  if (_suspendSaves) return { ok: true, skipped: true };
  try {
    // 2026-09-29:内容(不含 savedAt)和上次写入 / 载入时一样就不写 —— 每写一次,同源的其他窗口都会收到 storage 事件、
    // 被判成「过期」停止保存;以前新开或刷新一个窗口就会把另一个正在用的窗口踢成过期(内容其实一样)。顺带不再存重复的备份
    const body = JSON.stringify({ recipes, cats, components, creations, knowledge, brands, materials, printSettings, customCompCats, productFamilies, shopMaterials, products, salesLog, productionLog, suppliers, appSettings, version: 17 });
    if (opts.lastBody && opts.lastBody.current === body) return { ok: true, size: body.length, skipped: true };
    const payload = body.slice(0, -1) + ',"savedAt":' + JSON.stringify(new Date().toISOString()) + "}";
    localStorage.setItem(STORAGE_KEY, payload);
    if (opts.lastBody) opts.lastBody.current = body;
    // 自动备份到 IndexedDB (fire-and-forget,失败不影响主流程)
    // 2026-09-29 体检第 2 批:顺手带上条数做摘要(以前恢复列表要把每份整份数据解析一遍才知道条数)
    addBackupSnapshot(payload, { recipes, components, creations, materials, brands, knowledge });
    return { ok: true, size: payload.length };
  } catch (e) {
    // v56: 不再静默吞错。localStorage 限额约 5MB,超出会抛 QuotaExceededError
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

// 智能合并：保留用户数据，同时补入缺失的预置项目
// 合并导入时同 id 已存在的条目:修改时间(updatedAt)更晚的一边为准,另一边只补缺的字段。
// lockedKeys 是必须整组取同一边的字段(单价 + 币种):那一边没有的就删掉,不从另一边借 ——
// 2026-09-29 体检修:以前 {...本机, ...文件} 字段级合并,旧文件没有 currency 时本机的「人民币」标签留着、
// 单价却换成文件里的日元数。只有一边写了 updatedAt 时,写了的那边算新的(录入包要更新已有材料,生成时写上当前时间)。
// 两边都没写修改时间(老数据:本店原料 50 条一条都没有,材料 1838 条只有 73 条有)时沿用改之前的「文件为准」,
// 只是价格那组字段整组取文件那一边 —— 不然两台电脑之间合并导入永远更新不了这些老条目(审查发现)。
function mergeByNewer(existing, inc, lockedKeys = []) {
  const tLocal = Date.parse((existing && existing.updatedAt) || "") || 0;
  const tFile = Date.parse((inc && inc.updatedAt) || "") || 0;
  const fileWins = tFile > tLocal || (tFile === 0 && tLocal === 0);
  const next = fileWins ? { ...existing, ...inc } : { ...inc, ...existing };
  const src = fileWins ? inc : existing;
  lockedKeys.forEach(k => { if (src && Object.prototype.hasOwnProperty.call(src, k)) next[k] = src[k]; else delete next[k]; });
  return next;
}

// ─── 编辑页「有没有没保存的改动」(2026-09-29 体检修)────────────────────────
// 以前编辑页没保存就点顶部导航 / 手机底栏,内容当场丢,没有任何提醒。
// 每个编辑页调用 useDirtyGuard(() => 要比较的状态),把返回的 bind 挂到根元素上;
// App 切页前调 anyEditorDirty(),有改动就先问一句。
// 基准快照在她第一次按键 / 点击时才拍(捕获阶段,改动还没发生)——编辑页刚打开时 effect 会自动调整表单
// (比如组合产品把部分同步成组件库最新内容),在那之前拍会被误判成「改过」。改回原样也算没改。
const _dirtyChecks = new Set();
// 已经在 app 里问过「不保存,刷新」的,刷新时别再弹浏览器自己的离开提示(2026-09-29 体检第 2 批,审查发现问两遍)
let _skipUnloadPrompt = false;
const anyEditorDirty = () => { for (const f of _dirtyChecks) { try { if (f()) return true; } catch (e) { return true; } } return false; };
// 审查第 3 轮:比较时把 "" / null / [] 当成「没有这个字段」(第 5 轮加 false:没有 isCouverture 的材料勾上再取消会变成 false,以前白问一句)—— 原来没有 casePack 的材料,敲个 2 又删掉会变成 casePack: "",
// 以前算「改过」、离开时白问一句。顶层不动;数组里的空值两边都变 null,照样比得出增删
// 审查第 6 轮:数字一律按字符串比 —— 老数据的创立年份 / 库存 / 售价存的是数字 1919,输入框敲了又删掉写回的是 "1919",以前白问一句
const _dirtyNorm = (k, v) => (k !== "" && (v === "" || v === null || v === false || (Array.isArray(v) && v.length === 0))) ? undefined : ((typeof v === "number" && isFinite(v)) ? String(v) : v);
function useDirtyGuard(getState) {
  const latest = useRef(getState);
  latest.current = getState;
  const initial = useRef(null);
  useEffect(() => {
    const check = () => initial.current !== null && JSON.stringify(latest.current(), _dirtyNorm) !== initial.current;
    _dirtyChecks.add(check);
    return () => { _dirtyChecks.delete(check); };
  }, []);
  const arm = () => { if (initial.current === null) { try { initial.current = JSON.stringify(latest.current(), _dirtyNorm); } catch (e) { initial.current = ""; } } };
  const bind = { onPointerDownCapture: arm, onKeyDownCapture: arm };
  // 2026-09-29 第 2 批 2b C15:bind.isDirty() = 只看这一页自己改过没有(编辑页里的「← 返回」「取消」用;
  // anyEditorDirty 会把外层的组合产品编辑页也算进去)。不可枚举,{...bind} 挂到 div 上时不会被带成 DOM 属性
  Object.defineProperty(bind, "isDirty", { enumerable: false, value: () => { try { return initial.current !== null && JSON.stringify(latest.current(), _dirtyNorm) !== initial.current; } catch (e) { return true; } } });
  return bind;
}
// 编辑页自己的「← 返回」「取消」:有没保存的改动先问一句,文字和 App 的 goTab 一样(2026-09-29 体检第 2 批 2b)。
// confirmDialog 是 App 里那个;没传进来就直接走(不拦)
function confirmLeaveEditor(confirmDialog, lang, go) {
  if (typeof confirmDialog === "function" && anyEditorDirty()) {
    confirmDialog(
      lang === "zh" ? "这一页有还没保存的修改。现在离开,刚才改的内容会丢。" : "保存していない変更があります。移動すると失われます。",
      go,
      { title: lang === "zh" ? "还没保存" : "未保存", confirmText: lang === "zh" ? "不保存,离开" : "保存せず移動", cancelText: lang === "zh" ? "留在这里" : "戻る" }
    );
    return;
  }
  go();
}
// 写在列表页里面、没有单独组件的编辑表单(本店原料)用它当根元素:编辑表单出现 = 挂载,关掉 = 卸载,
// 快照跟着这一次编辑走(直接在列表页里调 useDirtyGuard,关掉编辑后快照还在,回到列表也会被当成「改过」)
function DirtyGuardScope({ watch, children }) {
  const bind = useDirtyGuard(() => watch);
  return <div {...bind}>{children}</div>;
}

// 只在同 id 不存在时才加入，不会覆盖用户已经修改过的同 id 项目
// 2026-09-29 体检第 2 批:以前删掉的预置条目刷新后又被补回来。dismissed = appSettings.dismissedSeedIds 的 Set,
// 元素是「实体:id」(如 "components:comp_ruru_xxx"),kind 是实体名;在里面的预置条目不再补
function mergeWithDefaults(userItems, defaultItems, dismissed, kind) {
  const userIds = new Set((userItems || []).map(x => x.id));
  const missing = defaultItems.filter(d => !userIds.has(d.id) && !(dismissed && kind && dismissed.has(kind + ":" + String(d.id))));
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
// 2026-09-29 体检修:以前只认 g / kg,「1L」「1.8L」被当成 1 克、1.8 克(填袋价后每克价大 1000 倍),
// 「1,000g」的千位逗号被当成多规格分隔符算成 1 克,「1/10/25KG」取第一段「1」又没单位也按 1 克。
// 现在:千位逗号先去掉;认 kg / g / L / ml(液体按 1 g/ml 近似)和中文 千克 / 公斤 / 克 / 升 / 毫升;
// 多规格取第一段,第一段没写单位就借后面第一个出现的单位;個 / 本 / 枚 / 号缶 这类计件规格认不出克数,返回 0(页面显示「规格未知」)。
function parsePackSizeToGrams(ps) {
  if (!ps) return 0;
  const str = String(ps).trim().replace(/(\d),(\d{3})(?!\d)/g, "$1$2");
  const parts = str.split(/[\/、，,]/).map(s => s.trim()).filter(Boolean);
  if (!parts.length) return 0;
  const re = /^\s*(\d+(?:\.\d+)?)\s*(kg|千克|公斤|ml|毫升|g|克|l|ℓ|升)?/i;
  const m = parts[0].match(re);
  if (!m) return 0;
  const num = parseFloat(m[1]);
  if (!isFinite(num)) return 0;
  let unit = m[2];
  if (!unit) {
    const rest = parts[0].slice(m[0].length).trim();
    if (rest && /^[個个本枚缶号號粒片袋箱入]/.test(rest)) return 0;
    for (const p of parts.slice(1)) { const mm = p.match(re); if (mm && mm[2]) { unit = mm[2]; break; } }
  }
  unit = (unit || "g").toLowerCase();
  if (unit === "kg" || unit === "千克" || unit === "公斤" || unit === "l" || unit === "ℓ" || unit === "升") return num * 1000;
  return num;
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
  /* 品牌列(k-desktop-only)在 600 到 1023px 也要藏,否则 4 个格子挤 3 列,成本被顶到第二行 */
  .rc-ing-head > .k-desktop-only, .rc-ing-row > .k-desktop-only, .rc-ing-total > .k-desktop-only { display: none !important; }
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
  const scored = smartMatchMaterial(ing, materials, brands); // [{score, material, inShop, zhJa}]
  // v17.4: 够格的本店候选直接当最佳且高置信;否则沿用「最佳 ≥ 85 且与次优差 ≥ 15,或唯一候选 ≥ 85」
  const shopBest = scored.find(c => shopMatchWins(c, scored[0].score)) || null;
  const best = shopBest || scored[0] || null;
  const highConfidence = !!shopBest || !!(best && best.score >= 85 && (
    scored.length === 1 || (best.score - (scored[1]?.score || 0)) >= 15
  ));
  return {
    best: best?.material || null,
    bestScore: best?.score || 0,
    candidates: sortShopFirst(scored).map(x => x.material),
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

  // 2026-09-29 体检第 2 批:摘要是备份时存下的条数,不再把每份整份数据解析一遍(以前 30 份 × 186 万字,每次重画都解析)
  const summarizeSnap = (s) => {
    if (s.legacy) return lang === "zh" ? "升级前的旧备份(内容在点「恢复」时才读取)" : "旧形式のバックアップ(内容は復元時に読込)";
    const d = s.summary;
    if (!d) return "";
    return lang === "zh"
      ? `配方 ${d.recipes || 0} · 组件 ${d.components || 0} · 组合 ${d.creations || 0} · 材料 ${d.materials || 0} · 品牌 ${d.brands || 0} · 知识 ${d.knowledge || 0}`
      : `レシピ ${d.recipes || 0} · コンポ ${d.components || 0} · 組立製品 ${d.creations || 0} · 材料 ${d.materials || 0} · ブランド ${d.brands || 0}`;
  };
  const reasonLabel = (r) => ({
    import: lang === "zh" ? "覆盖导入之前" : "上書きインポート前",
    clear: lang === "zh" ? "清除全部之前" : "全削除前",
    restore: lang === "zh" ? "恢复备份之前" : "復元前",
    "clear-cats": lang === "zh" ? "清掉旧价格表之前" : "旧価格表の削除前",   // 数据体检 H14(2026-09-29 第 2 批 2c)
  }[r] || "");

  const handleRestore = (snap) => {
    confirmDialog(
      lang === "zh"
        ? `恢复到 ${formatTime(snap.savedAt)} 的备份吗？\n\n当前数据会被这个版本覆盖（恢复前会自动把当前状态存一份「固定」备份，不会被轮换掉，所以可以反悔）。\n\n刷新页面后生效。`
        : `${formatTime(snap.savedAt)} のバックアップに戻しますか?\n現在の状態は自動で固定バックアップとして保存されます。`,
      async () => {
        // 2026-09-29 体检第 2 批:整份数据点「恢复」才读;恢复前的当前状态存成固定备份,并且等它存完再刷新
        const payload = await getBackupPayload(snap);
        if (!payload) { showToast(lang === "zh" ? "⚠️ 这份备份读不出来,没有恢复" : "⚠️ バックアップを読み込めませんでした"); return; }
        const doRestore = () => {
          try {
            _suspendSaves = true;   // 刷新前别再写:离开页面时的立即保存会把刚恢复的备份盖回去
            localStorage.setItem(STORAGE_KEY, payload);
          } catch (e) {
            _suspendSaves = false;
            showToast((lang === "zh" ? "⚠️ 恢复失败:" : "⚠️ 復元失敗:") + (e && e.message ? e.message : String(e)));
            return;
          }
          showToast(lang === "zh" ? "✓ 恢复成功，即将刷新" : "✓ 復元完了、リロード中");
          setTimeout(() => location.reload(), 800);
        };
        let pinned = true;
        try {
          const current = localStorage.getItem(STORAGE_KEY);
          if (current && current !== payload) pinned = await addBackupSnapshot(current, null, { pinned: true, reason: "restore" });
        } catch (e) { pinned = false; }
        // 审查发现:以前固定备份没存上也照样覆盖,对话框却说「会先存一份」。和覆盖导入 / 清除全部一样,存不上先问
        if (!pinned) {
          confirmDialog(
            lang === "zh" ? "恢复前的固定备份没存上(浏览器的数据库用不了)。仍然恢复吗?现在的数据会被覆盖,建议先点「导出完整备份」存一份文件。" : "固定バックアップを保存できません。それでも復元しますか?",
            doRestore,
            { title: lang === "zh" ? "备份没存上" : "バックアップ失敗", confirmText: lang === "zh" ? "仍然恢复" : "復元する" }
          );
          return;
        }
        doRestore();
      }
    );
  };

  const handleDelete = (snap) => {
    confirmDialog(
      lang === "zh" ? "删除这个备份吗？(不可恢复)" : "このバックアップを削除?",
      async () => {
        await deleteBackupSnapshot(snap);
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
                ? `自动备份(浏览器内置数据库):最近 ${BACKUP_RECENT} 份 + 最近 ${BACKUP_HOURS} 小时每小时一份 + 最近 ${BACKUP_DAYS} 天每天一份;覆盖导入、清除全部、恢复备份之前另存一份「固定」备份,不会被自动挤掉(最多 ${BACKUP_PINNED_MAX} 份) · 当前 ${snapshots.length} 份`
                : `自動バックアップ:最新 ${BACKUP_RECENT} 件 + ${BACKUP_HOURS} 時間は1時間1件 + ${BACKUP_DAYS} 日間は1日1件;上書き・全削除・復元の前は固定保存(最大 ${BACKUP_PINNED_MAX} 件) · 現在 ${snapshots.length} 件`}
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
                    {s.size > 0 && <span style={{ color: T.textTertiary, fontSize: 10, marginLeft: 8 }}>· {formatSize(s.size)}</span>}
                    {s.pinned && (
                      <span style={{ ...T.fs.label, color: T.info, border: `1px solid ${T.info}`, borderRadius: T.radius, padding: "0 6px", marginLeft: 8 }}>
                        {lang === "zh" ? "固定" : "固定"}{reasonLabel(s.reason) ? ` · ${reasonLabel(s.reason)}` : ""}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 2 }}>{summarizeSnap(s)}</div>
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

// ═══ 🩺 数据体检(2026-09-29 体检第 2 批 2c,LuLu:「2 要做」)═══
// 体检报告 synthesis.dataCleanup(data-1 到 data-16)里「数据本身」的问题,改成在 App 里自己查、自己改。
// computeDataHealth 是纯函数:只读传进来的数据、不改任何对象(条目里 obj / layer 是原对象的引用,给一键改认身份用),
// 返回 [{ id, audit, level, titleZh, titleJa, whyZh, whyJa, items: [{ key, kind, id, labelZh, labelJa, detailZh, detailJa, jump, ... }] }]。
// 面板 DataHealthPanel 只管显示和按钮;真正改数据的一键改在 App 里(dataHealthFix),都是「先改 + 撤销」,
// 撤销按对象身份还原(这几秒里被别处改过就不还原,提示一句)。
// 不查:data-4(照片编号撞车,碰图片代码,她说不急)、data-8(没关联也没单价的配料)、data-11(商品没挂配方)—— 她没勾。
// 用 node 对真数据跑:.claude/scripts/data_health/data_health_tests.cjs
const DH_LEVELS = {
  money:   { zh: "会算错钱",       ja: "金額がずれる",       color: T.danger },
  display: { zh: "显示或查找不对", ja: "表示・検索がずれる", color: T.warning },
  tidy:    { zh: "整理",           ja: "整理",               color: T.subtle },
  info:    { zh: "说明",           ja: "お知らせ",           color: T.info },
};
const DH_LEVEL_ORDER = ["money", "display", "tidy", "info"];
const _dhName = (o, lang) => { if (!o) return ""; const zh = lang !== "ja"; return String((zh ? (o.nameZh || o.nameJa) : (o.nameJa || o.nameZh)) || o.nameFr || "").trim(); };
const _dhTitle = (o, lang) => { if (!o) return ""; const zh = lang !== "ja"; return String((zh ? (o.titleZh || o.titleJa) : (o.titleJa || o.titleZh)) || "").trim(); };
// 疑似重复材料的比较键:全角半角统一、去空格、不分大小写
const _dhKey = (s) => String(s === undefined || s === null ? "" : s).normalize("NFKC").replace(/\s+/g, "").toLowerCase();
// 日文:假名,或只有日文用的过敏原词「卵」(中文标签写「蛋」)。「卵磷脂」(大豆卵磷脂 = 乳化剂)是中文,不算;「卵黄」不排除(日文汉字标签会写)。中点「・」不算日文(日文输入法打中文也会打出「小麦・鸡蛋・牛奶」),长音「ー」也不算
const _dhKana = /[ぁ-ゖァ-ヺ]|卵(?!磷)/;
// 按个数的规格(3 個 / 10 本入 / 1 袋 / 2 号缶 ……)读不出克数是正常的,不算问题
const _dhCountPack = /[個个本枚缶罐袋粒片箱入支张張盒瓶根颗顆卷巻錠]|セット|pcs?\b/i;
// 每克价 → 每 100g 的数(两位小数,去尾零)
const _dh100 = (p) => { const n = parseFloat(p); return (isFinite(n) && n > 0) ? String(Math.round(n * 100 * 100) / 100) : ""; };

function computeDataHealth(data) {
  const d = data || {};
  const A = (x) => Array.isArray(x) ? x.filter(v => v && typeof v === "object") : [];
  const recipes = A(d.recipes), components = A(d.components), creations = A(d.creations), knowledge = A(d.knowledge);
  const materials = A(d.materials), brands = A(d.brands), shopMaterials = A(d.shopMaterials);
  const productFamilies = A(d.productFamilies), cats = A(d.cats);
  const printSettings = (d.printSettings && typeof d.printSettings === "object") ? d.printSettings : {};
  const appSettings = (d.appSettings && typeof d.appSettings === "object") ? d.appSettings : {};
  const fx = parseFloat(appSettings.fxJpyToCny) > 0 ? parseFloat(appSettings.fxJpyToCny) : DEFAULT_FX_JPY_CNY;
  const zhN = (o) => _dhName(o, "zh"), jaN = (o) => _dhName(o, "ja");
  const noName = { zh: "（没有名字）", ja: "（名前なし）" };
  const matById = new Map(), brandById = new Map(), compById = new Map();
  materials.forEach(m => { if (m.id != null && !matById.has(m.id)) matById.set(m.id, m); });
  brands.forEach(b => { if (b.id != null && !brandById.has(b.id)) brandById.set(b.id, b); });
  components.forEach(c => { if (c.id != null && !compById.has(c.id)) compById.set(c.id, c); });
  const matIds = new Set(materials.map(m => m.id));
  // 和成本链 getMaterialEffectivePrice 同一个取价顺序:第一条本店原料的价 → 百科参考价 priceRange.mid → 老字段 pricePerG
  const shopFirst = new Map();
  shopMaterials.forEach(s => { if (s.materialId != null && !shopFirst.has(s.materialId)) shopFirst.set(s.materialId, s); });
  const matOwnPrice = (m) => {
    const mid = parseFloat(m && m.priceRange && m.priceRange.mid);
    if (mid > 0) return mid;
    const p = parseFloat(m && m.pricePerG);
    return p > 0 ? p : 0;
  };
  const matHasPrice = (m) => { if (!m) return false; const s = shopFirst.get(m.id); return (s && parseFloat(s.pricePerG) > 0) || matOwnPrice(m) > 0; };
  const toCny = (v, cur) => { const n = parseFloat(v); return (isFinite(n) && n > 0) ? (cur === "CNY" ? n : n * fx) : 0; };
  const named = (ings) => (Array.isArray(ings) ? ings : []).filter(i => i && (_normTxt(i.nameZh) || _normTxt(i.nameJa)));
  const TYPE = { recipe: ["配方", "レシピ"], component: ["组件", "パーツ"], creation: ["组合产品", "組み合わせ"] };
  const checks = [];

  // ── H1 本店原料币种没确认(data-1)──
  {
    const items = [];
    shopMaterials.forEach((s, i) => {
      if (s.currency === "CNY" || s.currency === "JPY") return;   // 写了币种 = 她确认过(JPY 也算)
      const m = s.materialId != null ? matById.get(s.materialId) : null;
      const v = parseFloat(s.pricePerG);
      const has = isFinite(v) && v > 0;
      const p100 = has ? _dh100(v) : "";
      const jpyCny100 = has ? _dh100(v * fx) : "";
      const refP = m ? matOwnPrice(m) : 0;
      const refCur = m ? curOf(m) : "JPY";
      const refCny = refP > 0 ? toCny(refP, refCur) : 0;
      // 按日元读比百科便宜 10 倍以上、按人民币读又在百科价 3 倍以内 → 数量级像人民币(只提示,不自动改)
      const looksCny = has && refCny > 0 && refCny / (v * fx) >= 10 && v >= refCny / 3 && v <= refCny * 3;
      const refZh = refP > 0 ? (refCur === "CNY" ? `¥${_dh100(refP)}/100g` : `${_dh100(refP)}円/100g ≈ ¥${_dh100(refCny)}/100g`) : "";
      items.push({
        key: `H1:${s.id != null ? s.id : "#" + i}`, kind: "shopMaterial", id: s.id, obj: s, looksCny, hasPrice: has,
        jump: m ? { kind: "materialView", id: m.id } : null,
        labelZh: m ? (zhN(m) || noName.zh) : "（材料百科里找不到这一条）", labelJa: m ? (jaN(m) || noName.ja) : "（材料事典に見つかりません）",
        detailZh: has
          ? `存的数:每克 ${v}。按日元读 = ${p100}円/100g(≈¥${jpyCny100}/100g);按人民币读 = ¥${p100}/100g${refZh ? `;材料百科价 ${refZh}` : ""}`
          : "还没填价",
        detailJa: has
          ? `保存値:1g あたり ${v}。円なら ${p100}円/100g(≈¥${jpyCny100}/100g)、人民元なら ¥${p100}/100g${refZh ? `。材料事典の価格 ${refZh}` : ""}`
          : "価格未入力",
      });
    });
    items.sort((a, b) => (b.looksCny ? 1 : 0) - (a.looksCny ? 1 : 0));
    checks.push({ id: "H1", audit: "data-1", level: "money",
      titleZh: "本店原料没写是哪种钱", titleJa: "仕入れ原料の通貨が未確認",
      whyZh: "本店原料没写币种时,App 一律当日元算(东京时期的老规矩)。如果其实是人民币价,成本只算出二十分之一左右。看一眼每条的数量级,点「是人民币」或「是日元」确认,点完就不再列出(数不变)。标了「看数量级像人民币」的是和材料百科价对过的,建议先看。",
      whyJa: "通貨が書かれていない仕入れ原料は円として計算されます。実は人民元なら、今の原価は本来の約 1/20 しか計算されていません。桁を見て「人民元」か「円」を押してください(数値は変わりません)。「人民元らしい」印は材料事典の価格と比べたものです。",
      items });
  }

  // ── H2 材料 / 厂家分类认不出(data-2)──
  {
    const valid = new Set(MATERIAL_CATEGORIES.map(c => c.id));
    const items = [];
    materials.forEach((m, i) => {
      if (valid.has(m.categoryId)) return;
      const cur = (m.categoryId === undefined || m.categoryId === null) ? "" : String(m.categoryId);
      const b = m.brandId != null ? brandById.get(m.brandId) : null;
      items.push({
        key: `H2:m:${m.id != null ? m.id : "#" + i}`, kind: "material", entity: "material", id: m.id, obj: m, current: cur,
        jump: { kind: "material", id: m.id },
        labelZh: zhN(m) || noName.zh, labelJa: jaN(m) || noName.ja,
        detailZh: `材料${b ? ` · 厂家「${zhN(b)}」` : ""} · 现在写的是「${cur || "空"}」`,
        detailJa: `材料${b ? ` · メーカー「${jaN(b)}」` : ""} · 現在の値「${cur || "空"}」`,
      });
    });
    brands.forEach((b, i) => {
      if (!b.categoryId || valid.has(b.categoryId)) return;   // 空 = 全品类,是正常值
      items.push({
        key: `H2:b:${b.id != null ? b.id : "#" + i}`, kind: "brand", entity: "brand", id: b.id, obj: b, current: String(b.categoryId),
        jump: { kind: "brand", id: b.id },
        labelZh: zhN(b) || noName.zh, labelJa: jaN(b) || noName.ja,
        detailZh: `厂家 · 现在写的是「${b.categoryId}」`, detailJa: `メーカー · 現在の値「${b.categoryId}」`,
      });
    });
    checks.push({ id: "H2", audit: "data-2", level: "display",
      titleZh: "材料 / 厂家的分类认不出", titleJa: "材料・メーカーの分類が不明",
      whyZh: "这些材料和厂家的分类是 App 认不出的旧写法(misc、dairy、c177… 这类),分类页里找不到它们,统一算进「其他」。在下拉里选对的分类,选了就改好,不再列出(5 秒内可以撤销)。厂家可以选「全品类」(淘宝、进口商这类什么都卖的)。",
      whyJa: "旧形式の分類(misc・dairy・c177… など)で、分類ページに出ず「その他」扱いになっています。プルダウンで正しい分類を選ぶとすぐ直ります(5 秒以内なら元に戻せます)。メーカーは「全カテゴリ」も選べます。",
      items });
  }

  // ── H3 配方挂着已经不存在的家族(data-3)──
  {
    const famIds = new Set(productFamilies.map(f => f.id));
    const items = [];
    // 5 月 1 日重建数据时丢的三个家族(恢复方案等她批);只有挂着这三个的条目才提这件事
    const lost0501 = new Set(["family_chocolate", "family_french_classic", "family_cheesecake"]);
    [["recipe", recipes], ["creation", creations]].forEach(([kind, list]) => list.forEach((r, i) => {
      if (!r.familyId || famIds.has(r.familyId)) return;
      const is0501 = lost0501.has(r.familyId);
      items.push({
        key: `H3:${kind}:${r.id != null ? r.id : "#" + i}`, kind, entity: kind, id: r.id, obj: r,
        jump: { kind, id: r.id },
        labelZh: zhN(r) || noName.zh, labelJa: jaN(r) || noName.ja,
        detailZh: `${TYPE[kind][0]} · 家族编号「${r.familyId}」已经不存在${is0501 ? "(5 月 1 日重建数据时丢的,恢复方案等你批)" : ""}`,
        detailJa: `${TYPE[kind][1]} · ファミリー「${r.familyId}」は存在しません${is0501 ? "(5/1 のデータ再構築で失われたもの。復元案を検討中)" : ""}`,
      });
    }));
    checks.push({ id: "H3", audit: "data-3", level: "display",
      titleZh: "挂着已经不存在的家族", titleJa: "存在しないファミリーを参照",
      whyZh: "这些配方 / 组合产品指向的家族已经不在了(删掉了,或导入时没带过来),家族模式里它们算「未归属」。要找回这个家族就先别点;不要了就点「改成不归属」(5 秒内可以撤销)。",
      whyJa: "これらのレシピ・組み合わせが参照するファミリーは存在しません(削除された、またはインポートに含まれていなかった)。ファミリー表示では「未所属」になります。ファミリーを戻すつもりなら押さずに、不要なら「未所属にする」を押してください(5 秒以内なら元に戻せます)。",
      items });
  }

  // ── H5 单位对不上的关联配料行(data-5)──
  {
    const items = [];
    const scan = (ings, base) => (Array.isArray(ings) ? ings : []).forEach((ing, j) => {
      if (!ing || !ing.materialId) return;
      const m = matById.get(ing.materialId);
      if (!m || !matHasPrice(m) || isGramUnit(ing.unit)) return;
      const nmZh = _normTxt(ing.nameZh) || _normTxt(ing.nameJa) || zhN(m);
      const nmJa = _normTxt(ing.nameJa) || _normTxt(ing.nameZh) || jaN(m);
      const qty = _normTxt(ing.qty), unit = _normTxt(ing.unit);
      items.push({
        key: `${base.key}:${j}`, kind: base.kind, id: base.id, jump: base.jump,
        labelZh: `${base.ownerZh} · ${nmZh}`, labelJa: `${base.ownerJa} · ${nmJa}`,
        detailZh: `${TYPE[base.type][0]} · 用量 ${qty || "?"} ${unit} · 关联了「${zhN(m)}」(按克计价)→ 成本按 ${qty || "?"} 克算${base.noteZh ? " · " + base.noteZh : ""}`,
        detailJa: `${TYPE[base.type][1]} · 分量 ${qty || "?"} ${unit} · 「${jaN(m)}」(g 単価)と連動 → 原価は ${qty || "?"} g で計算${base.noteJa ? " · " + base.noteJa : ""}`,
      });
    });
    recipes.forEach((r, i) => scan(r.ingredients, { key: `H5:r:${r.id != null ? r.id : "#" + i}`, type: "recipe", kind: "recipe", id: r.id, jump: { kind: "recipe", id: r.id }, ownerZh: zhN(r) || noName.zh, ownerJa: jaN(r) || noName.ja }));
    components.forEach((c, i) => scan(c.ingredients, { key: `H5:p:${c.id != null ? c.id : "#" + i}`, type: "component", kind: "component", id: c.id, jump: { kind: "component", id: c.id }, ownerZh: zhN(c) || noName.zh, ownerJa: jaN(c) || noName.ja }));
    creations.forEach((cr, i) => (Array.isArray(cr.layers) ? cr.layers : []).forEach((l, li) => {
      if (!l) return;
      const comp = l.sourceComponentId ? compById.get(l.sourceComponentId) : null;
      // 跟组件库走的部分:改组件就行(这里改会变成本产品专用),「去改」跳组件
      const follows = !!comp && layerLinkState(l, components, matIds) === "follow";
      scan(l.ingredients, {
        key: `H5:c:${cr.id != null ? cr.id : "#" + i}:${li}`, type: "creation", kind: "creation", id: cr.id,
        jump: follows ? { kind: "component", id: comp.id } : { kind: "creation", id: cr.id },
        ownerZh: `${zhN(cr) || noName.zh} · ${l.customName || zhN(l) || noName.zh}`, ownerJa: `${jaN(cr) || noName.ja} · ${l.customName || jaN(l) || noName.ja}`,
        noteZh: follows ? `这一部分跟组件库走,改组件「${zhN(comp)}」就行` : "",
        noteJa: follows ? `部品庫と連動中:パーツ「${jaN(comp)}」を直せば反映されます` : "",
      });
    }));
    checks.push({ id: "H5", audit: "data-5", level: "money",
      titleZh: "单位对不上的关联配料", titleJa: "単位が合わない連動材料",
      whyZh: "这些配料关联了材料百科(材料都按克计价),用量却写的是「個 / 本」这类。成本 = 材料每克价 × 用量,50 个干杏会按 50 克算,少算很多。改法:把用量改成克数;或者取消关联,直接填每个 / 每根的价。",
      whyJa: "材料事典(g 単価)と連動しているのに、分量が「個・本」などになっています。原価 = g 単価 × 分量なので、干し杏 50 個が 50 g として計算されます。分量を g に直すか、連動を外して 1 個あたりの単価を入力してください。",
      items });
  }

  // ── H6 组合产品用量读不出 / 读不准(data-6)──
  {
    const items = [];
    creations.forEach((cr, i) => (Array.isArray(cr.layers) ? cr.layers : []).forEach((l, li) => {
      if (!l || !(parseFloat(l.yield) > 0)) return;   // 没填产出量的部分成本按整批算,用量不参与计算
      const raw = _normTxt(l.usedAmount);
      const unit = _normTxt(l.unit) || "g";
      let zhD, jaD;
      if (!raw) { zhD = "没填用量 → 这一部分成本算成 0"; jaD = "分量未入力 → このパーツの原価は 0"; }
      else {
        const n = parseUsedAmount(l.usedAmount, l.unit);
        if (!(n > 0)) { zhD = `「${raw}」读不出数字 → 成本算成 0`; jaD = `「${raw}」は数値として読めません → 原価 0`; }
        else if (usedAmountAmbiguous(raw)) { zhD = `「${raw}」只认开头的数 → 按 ${fmtQty(n)} ${unit} 算`; jaD = `「${raw}」は先頭の数だけ読みます → ${fmtQty(n)} ${unit} で計算`; }
        else return;
      }
      items.push({
        key: `H6:${cr.id != null ? cr.id : "#" + i}:${li}`, kind: "creation", id: cr.id, jump: { kind: "creation", id: cr.id },
        labelZh: `${zhN(cr) || noName.zh} · ${l.customName || zhN(l) || noName.zh}`, labelJa: `${jaN(cr) || noName.ja} · ${l.customName || jaN(l) || noName.ja}`,
        detailZh: zhD, detailJa: jaD,
      });
    }));
    checks.push({ id: "H6", audit: "data-6", level: "money",
      titleZh: "组合产品的用量读不出 / 读不准", titleJa: "組み合わせの分量が読めない",
      whyZh: "组合产品每一部分的用量是「做这一批一共用多少」,成本和整体配方按它算。没填、读不出数字的部分成本算成 0;「500g + 170g」「约 45g/个」这种只认开头的数。改成一个总克数就好,说明可以写在括号里(括号里的字不影响计算)。",
      whyJa: "各パーツの分量は「このバッチ全体で使う量」で、原価と全体レシピはこれで計算します。未入力・読めないものは 0、「500g + 170g」「約45g/個」は先頭の数だけ読みます。合計の g を 1 つ書いてください(補足は括弧内に)。",
      items });
  }

  // ── H7 组合产品里内容是空的部分(data-7)──
  {
    const items = [];
    creations.forEach((cr, i) => (Array.isArray(cr.layers) ? cr.layers : []).forEach((l, li) => {
      if (!l || !l.sourceComponentId || named(l.ingredients).length > 0) return;
      const comp = compById.get(l.sourceComponentId);
      if (!comp) return;
      const n = named(comp.ingredients).length;
      if (!n) return;
      items.push({
        key: `H7:${cr.id != null ? cr.id : "#" + i}:${li}`, kind: "creation", id: cr.id, obj: cr, layer: l, layerIndex: li,
        jump: { kind: "creation", id: cr.id },
        labelZh: `${zhN(cr) || noName.zh} · ${l.customName || zhN(l) || zhN(comp) || noName.zh}`, labelJa: `${jaN(cr) || noName.ja} · ${l.customName || jaN(l) || jaN(comp) || noName.ja}`,
        detailZh: `这一部分 0 行原料;组件库「${zhN(comp)}」有 ${n} 行`, detailJa: `このパーツは材料 0 行。部品庫「${jaN(comp)}」は ${n} 行`,
      });
    }));
    checks.push({ id: "H7", audit: "data-7", level: "money",
      titleZh: "组合产品里内容是空的部分", titleJa: "中身が空のパーツ",
      whyZh: "这些部分一行原料都没有,但组件库里的那个组件有 —— 成本和整体配方都缺了这一块。点「用组件库的」:这一部分改成跟组件库走,内容换成组件库现在的(和组合产品详情页的同名按钮一样,5 秒内可以撤销)。",
      whyJa: "材料が 0 行のパーツですが、部品庫の元パーツには材料があります。「部品庫に合わせる」でこのパーツを部品庫と連動させ、中身を部品庫の最新に置き換えます(5 秒以内なら元に戻せます)。",
      items });
  }

  // ── H9 知识按钮找不到 / 同名(data-9)──
  {
    const items = [];
    const resolve = makeKnowledgeLinkResolver(recipes, components, creations);
    const tName = (x, zh) => `${TYPE[x.type] ? TYPE[x.type][zh ? 0 : 1] : ""}「${zh ? zhN(x.item) : jaN(x.item)}」`;
    knowledge.forEach((k, i) => {
      const seen = new Set();
      (Array.isArray(k.relatedRecipes) ? k.relatedRecipes : []).flatMap(splitLinkNames).forEach(n => {
        if (seen.has(n)) return;
        seen.add(n);
        const m = resolve(n);
        if (m && !m.ambiguous) return;
        items.push({
          key: `H9:${k.id != null ? k.id : "#" + i}:${n}`, kind: "knowledge", id: k.id, ambiguous: !!m,
          jump: { kind: "knowledge", id: k.id },
          labelZh: _dhTitle(k, "zh") || "（没有标题）", labelJa: _dhTitle(k, "ja") || "（タイトルなし）",
          detailZh: m ? `按钮「${n}」有 ${m.ambiguous.length} 个同名:${m.ambiguous.map(x => tName(x, true)).join("、")}` : `按钮「${n}」找不到对应的配方 / 组件 / 组合产品`,
          detailJa: m ? `ボタン「${n}」は同名が ${m.ambiguous.length} 件:${m.ambiguous.map(x => tName(x, false)).join("、")}` : `ボタン「${n}」に該当するレシピ・パーツ・組み合わせがありません`,
        });
      });
    });
    checks.push({ id: "H9", audit: "data-9", level: "display",
      titleZh: "知识的关联按钮找不到 / 同名", titleJa: "ナレッジの関連ボタンが迷子",
      whyZh: "知识页的「关联配方」按钮按名字找配方 / 组件 / 组合产品。下面这些名字一个都找不到(按钮点不动),或者找到好几个同名的(按钮不知道跳哪个)。去知识编辑页把名字改成和配方一样的写法(比如繁体「費」改简体「费」、加上版本号)。",
      whyJa: "ナレッジの「関連レシピ」ボタンは名前で探します。以下は見つからない名前、または同名が複数ある名前です。ナレッジ編集でレシピと同じ書き方に直してください。",
      items });
  }

  // ── H15 过敏原没填或只有日文(data-15)──
  {
    const items = [];
    recipes.forEach((r, i) => {
      const a = _normTxt(Array.isArray(r.allergens) ? r.allergens.join("、") : r.allergens);
      if (a && !_dhKana.test(a)) return;
      items.push({
        key: `H15:${r.id != null ? r.id : "#" + i}`, kind: "recipe", id: r.id, jump: { kind: "recipe", id: r.id },
        labelZh: zhN(r) || noName.zh, labelJa: jaN(r) || noName.ja,
        detailZh: a ? `写的是日文:${a}` : "没填", detailJa: a ? `日本語表記:${a}` : "未入力",
      });
    });
    checks.push({ id: "H15", audit: "data-15", level: "display",
      titleZh: "过敏原没填或只有日文", titleJa: "アレルゲン未入力・日本語のみ",
      whyZh: "北京的标签要中文;法定标注的用词也要你自己定,所以这里不自动翻译。去配方编辑页改。",
      whyJa: "北京のラベルには中国語が必要です。法定表示の用語はご自身で決めてください(自動翻訳はしません)。",
      items });
  }

  // ── H10 疑似重复材料(data-10)──
  {
    const items = [];
    const idx = new Map(materials.map((m, i) => [m, i]));
    const used = new Map();   // 材料 → 配料行关联了几行
    const bump = (ings) => (Array.isArray(ings) ? ings : []).forEach(g => { if (g && g.materialId != null) used.set(g.materialId, (used.get(g.materialId) || 0) + 1); });
    recipes.forEach(r => bump(r.ingredients));
    components.forEach(c => bump(c.ingredients));
    creations.forEach(cr => (Array.isArray(cr.layers) ? cr.layers : []).forEach(l => l && bump(l.ingredients)));
    const groups = new Map();
    materials.forEach(m => {
      if (m.brandId === undefined || m.brandId === null || m.brandId === "") return;
      [["nameZh", "zh"], ["nameJa", "ja"]].forEach(([f, t]) => {
        const k = _dhKey(m[f]);
        if (!k) return;
        const g = `${String(m.brandId)}\u0000${t}\u0000${k}`;
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(m);
      });
    });
    const seenPair = new Set();
    const useZh = (m) => { const n = used.get(m.id) || 0; return `${n ? `配料关联 ${n} 行` : "没有配料关联"}${shopFirst.has(m.id) ? " · 本店原料有" : ""}`; };
    const useJa = (m) => { const n = used.get(m.id) || 0; return `${n ? `連動 ${n} 行` : "連動なし"}${shopFirst.has(m.id) ? " · 仕入れ原料あり" : ""}`; };
    groups.forEach(list => {
      for (let x = 0; x < list.length; x++) for (let y = x + 1; y < list.length; y++) {
        const a0 = list[x], b0 = list[y];
        if (a0 === b0) continue;
        const [a, b] = idx.get(a0) < idx.get(b0) ? [a0, b0] : [b0, a0];
        const pk = `${idx.get(a)}|${idx.get(b)}`;
        if (seenPair.has(pk)) continue;
        seenPair.add(pk);
        const br = brandById.get(a.brandId);
        items.push({
          key: `H10:${pk}`, kind: "materialPair", id: a.id, a, b,
          jumpA: { kind: "materialView", id: a.id }, jumpB: { kind: "materialView", id: b.id },
          labelZh: `${zhN(a) || noName.zh} ↔ ${zhN(b) || noName.zh}`, labelJa: `${jaN(a) || noName.ja} ↔ ${jaN(b) || noName.ja}`,
          detailZh: `${br ? `厂家「${zhN(br)}」· ` : ""}A:${useZh(a)};B:${useZh(b)}`,
          detailJa: `${br ? `メーカー「${jaN(br)}」· ` : ""}A:${useJa(a)} / B:${useJa(b)}`,
        });
      }
    });
    checks.push({ id: "H10", audit: "data-10", level: "tidy",
      titleZh: "疑似重复的材料", titleJa: "重複しているかもしれない材料",
      whyZh: "同一个厂家下有中文名或日文名一样的两条材料,多半是手录一条、后来又导入一条。配方可能一半关联这条、一半关联那条,改价只改到一边。点「去看」对比一下,留一条就行(删之前看看哪条有配料在用)。这里不自动合并。",
      whyJa: "同じメーカーに同名の材料が 2 件あります(手入力とインポートの重複が多い)。「見る」で比べて 1 件に整理してください。自動では統合しません。",
      items });
  }

  // ── H12 步骤没翻完(data-12)──
  {
    const items = [];
    const scan = (o, i, kind) => {
      const rows = stepRows(o);
      if (!rows.length) return;
      const zhC = rows.filter(r => r.zh).length, jaC = rows.filter(r => r.ja).length;
      const missZh = rows.some(r => !r.zh);                       // 有步骤没有中文(中文界面显示的是日文)
      const missJa = jaC > 0 && rows.some(r => !r.ja);            // 已经开始写日文、还有几步没翻;一步日文都没有的不算(中文优先)
      if (!missZh && !missJa) return;
      items.push({
        key: `H12:${kind}:${o.id != null ? o.id : "#" + i}`, kind, id: o.id, jump: { kind, id: o.id },
        labelZh: zhN(o) || noName.zh, labelJa: jaN(o) || noName.ja,
        detailZh: `${TYPE[kind][0]} · 中文 ${zhC} 步 / 日文 ${jaC} 步`, detailJa: `${TYPE[kind][1]} · 中国語 ${zhC} / 日本語 ${jaC} 工程`,
      });
    };
    recipes.forEach((r, i) => scan(r, i, "recipe"));
    components.forEach((c, i) => scan(c, i, "component"));
    checks.push({ id: "H12", audit: "data-12", level: "tidy",
      titleZh: "步骤没翻完", titleJa: "工程の翻訳が途中",
      whyZh: "步骤的中文和日文是一行对一行的。下面这些有几步只有一种语言:缺中文的那几步,中文界面显示的是日文;缺日文的那几步,切到日文界面显示中文。只写了中文、一步日文都没有的不算(中文优先)。",
      whyJa: "工程は中国語と日本語が 1 行ずつ対応しています。以下は一部の工程が片方の言語しかありません。日本語が 1 行もないもの(中国語のみ)は対象外です。",
      items });
  }

  // ── H13 规格读不出 / 读得不确定的材料(data-13)──
  {
    const bad = [], multi = [];
    materials.forEach((m, i) => {
      const ps = _normTxt(m.packSize);
      if (!ps) return;
      const g = parsePackSizeToGrams(ps);
      const base = { kind: "material", id: m.id, jump: { kind: "material", id: m.id }, labelZh: zhN(m) || noName.zh, labelJa: jaN(m) || noName.ja };
      if (!(g > 0)) {
        if (_dhCountPack.test(ps)) return;
        bad.push({ ...base, key: `H13:${m.id != null ? m.id : "#" + i}`, detailZh: `规格「${ps}」读不出克数`, detailJa: `規格「${ps}」から g が読めません` });
        return;
      }
      // 几个规格写在一起、第一段自己没写单位的(1/10/25KG):单位是借后面的,读成 1 kg 值得看一眼。「200ml / 1000ml」每段都有单位,不列
      const parts = ps.replace(/(\d),(\d{3})(?!\d)/g, "$1$2").split(/[\/、，,]/).map(s => s.trim()).filter(Boolean);
      const m0 = parts.length > 1 ? parts[0].match(/^\s*(\d+(?:\.\d+)?)\s*(kg|千克|公斤|ml|毫升|g|克|l|ℓ|升)?/i) : null;
      if (m0 && !m0[2]) multi.push({ ...base, key: `H13:${m.id != null ? m.id : "#" + i}`, multi: true, detailZh: `规格「${ps}」有好几段,第一段没写单位,借后面的单位按 ${fmtQty(g)} g 算`, detailJa: `規格「${ps}」は複数あり、最初の値に単位がないため ${fmtQty(g)} g で計算` });
      // 只有一段、数字后面没写单位、跟着的字 App 又不认识(「60セット」「100錠」):解析器当成 60 g / 100 g,存的每克价其实是每套 / 每片的价
      const m1 = parts.length === 1 ? parts[0].match(/^\s*(\d+(?:\.\d+)?)\s*(kg|千克|公斤|ml|毫升|g|克|l|ℓ|升)?/i) : null;
      if (m1 && !m1[2] && /^\p{L}/u.test(parts[0].slice(m1[0].length).trim())) multi.push({ ...base, key: `H13:${m.id != null ? m.id : "#" + i}`, multi: true, detailZh: `规格「${ps}」没写克数,被当成 ${fmtQty(g)} g 读`, detailJa: `規格「${ps}」は g 表記がなく ${fmtQty(g)} g として読まれています` });
    });
    checks.push({ id: "H13", audit: "data-13", level: "tidy",
      titleZh: "规格读不出或读得不确定的材料", titleJa: "規格から g が読めない・曖昧な材料",
      whyZh: "规格(比如「1kg」「500g」)是用来从袋价 / 箱价算每克价的。读不出克数的,填袋价时算不出单价,只能直接填单价;几个规格写在一起、第一段没写单位的(1/10/25kg),App 借后面的单位按第一段算(1 kg),也列出来看一眼对不对;「60セット」「100錠」这种数字后面的字 App 不认识的,会被当成 60 g、100 g 读,也列出来。「3 個」「10 本入」这种按个数的规格不算问题,不列。",
      whyJa: "規格は袋・ケース価格から g 単価を出すのに使います。g が読めないものは袋価格から単価を計算できません。複数規格(1/10/25kg)は最初の値で計算します。「60セット」「100錠」など単位が読めないものは 60 g・100 g として読まれるため、これも表示します。個数の規格は対象外です。",
      items: [...bad, ...multi] });
  }

  // ── H14 旧价格表还在(data-14)──
  {
    const items = [];
    if (cats.length > 0) {
      const emptyN = cats.filter(c => !_normTxt(c.nameZh) && !_normTxt(c.nameJa)).length;
      items.push({ key: "H14:cats", kind: "cats", id: null, count: cats.length,
        labelZh: `旧价格表 ${cats.length} 条`, labelJa: `旧価格表 ${cats.length} 件`,
        detailZh: emptyN ? `其中 ${emptyN} 条名字是空的` : "", detailJa: emptyN ? `うち ${emptyN} 件は名前が空` : "" });
    }
    checks.push({ id: "H14", audit: "data-14", level: "tidy",
      titleZh: "旧价格表还在", titleJa: "旧価格表が残っています",
      whyZh: "旧价格表(v11 以前的)已经停用,界面早就藏起来了,成本也不读它。清掉让数据干净一点;配料行上留着的旧价格表编号不影响成本。清之前会自动存一份固定备份,5 秒内也可以撤销。",
      whyJa: "旧価格表(v11 以前)は使われておらず、原価計算にも使いません。削除前に固定バックアップを自動保存します(5 秒以内なら元に戻せます)。",
      items });
  }

  // ── H16 打印设置(data-16,只是说明,不算问题)──
  {
    const logo = _normTxt(printSettings.logoUrl);
    const sub = typeof printSettings.brandSubtitle === "string" ? printSettings.brandSubtitle.trim() : "";
    checks.push({ id: "H16", audit: "data-16", level: "info", items: [],
      titleZh: "打印抬头", titleJa: "印刷のヘッダー",
      whyZh: `${logo ? "LOGO 用的是你设的图片网址。" : "LOGO 没设,打印用的是定稿字标 kororā ✓。"}副标题现在是「${sub || "(空,不印)"}」。要改:任意一页点打印 → 打印预览上方的「⚙ LOGO设置」。`,
      whyJa: `${logo ? "ロゴは設定した画像 URL を使用。" : "ロゴ未設定のため、確定版ロゴ kororā で印刷されます ✓。"}サブタイトルは「${sub || "(空・印刷しない)"}」。変更は印刷プレビュー上部の「⚙ ロゴ設定」から。`,
    });
  }

  return DH_LEVEL_ORDER.flatMap(lv => checks.filter(c => c.level === lv));
}

// 面板:数据 tab「🩺 数据体检」打开,盖满屏(zIndex 在 toast 下面,撤销提示看得见)
// fix:App 给的一键改 { shopCurrency(item, cur), category(item, catId), clearFamily(item), layerFollow(item), clearCats(item) }
function DataHealthPanel({ recipes, components, creations, knowledge, materials, brands, shopMaterials, productFamilies, cats, printSettings, appSettings, lang, onClose, onJump, fix, topInset }) {
  const zh = lang !== "ja";
  // topInset:App 顶上正显示「别的窗口改过 / 有新版本」提示条(z 比面板高,会盖住面板的标题和关闭键)。
  // 面板从提示条下沿开始:提示条照样看得见、能点刷新,关闭键也露在外面(iPad 没有 Esc)
  const bannerBottom = () => { if (!topInset) return 0; const b = document.querySelector("[data-app-banner]"); return b ? Math.max(0, Math.ceil(b.getBoundingClientRect().bottom)) : 0; };
  const [topOff, setTopOff] = useState(bannerBottom);
  useEffect(() => {
    const m = () => setTopOff(bannerBottom());
    m(); window.addEventListener("resize", m);
    return () => window.removeEventListener("resize", m);
  }, [topInset, lang]);
  const checks = useMemo(
    () => computeDataHealth({ recipes, components, creations, knowledge, materials, brands, shopMaterials, productFamilies, cats, printSettings, appSettings }),
    [recipes, components, creations, knowledge, materials, brands, shopMaterials, productFamilies, cats, printSettings, appSettings]);
  const problems = checks.filter(c => c.level !== "info" && c.items.length > 0);
  const moneyN = problems.filter(c => c.level === "money").length;
  // 一开始只展开「会算错钱」的几类;其他点标题展开
  const [open, setOpen] = useState(() => { const o = {}; checks.forEach(c => { o[c.id] = c.level === "money" && c.items.length > 0; }); return o; });
  const [showAll, setShowAll] = useState({});
  const panelRef = useRef(null);
  // 一键改过的行留在原位置,按钮换成「✓ 已改好」(面板开着就一直留着)。以前改好的行立刻消失、下面的行顶上来,
  // 双击 / 连点的第二下落在下一行同一个按钮上,没看就改了(H1 把日元的本店原料标成人民币,成本差 20 倍)
  const [done, setDone] = useState({});
  const markDone = (c, it, idx, zhL, jaL) => setDone(d => ({ ...d, [it.key]: { check: c.id, it, idx, zh: zhL, ja: jaL } }));
  const shownOf = (c) => {
    const here = new Set(c.items.map(x => x.key));
    const out = c.items.map(it => ({ it, done: null }));
    Object.values(done).filter(d => d.check === c.id && !here.has(d.it.key)).sort((a, b) => a.idx - b.idx)
      .forEach(d => out.splice(Math.min(d.idx, out.length), 0, { it: d.it, done: d }));   // 撤销后又列出来的,按普通行显示
    return out;
  };
  const LIMIT = 20;
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // 面板上面还开着确认框(「备份没存上」)时,Esc 只关确认框(它自己听 Esc),面板不跟着关
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if ([...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some(d => d !== panelRef.current)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = orig; window.removeEventListener("keydown", onKey); };
  }, []);
  const L = (o, base) => zh ? o[base + "Zh"] : (o[base + "Ja"] || o[base + "Zh"]);
  const levelTag = (lv) => {
    const x = DH_LEVELS[lv];
    return <span style={{ ...T.fs.label, letterSpacing: 0, padding: "1px 6px", border: `1px solid ${x.color}`, color: x.color, background: T.surface, borderRadius: T.radius, whiteSpace: "nowrap", fontFamily: T.fontSans }}>{zh ? x.zh : x.ja}</span>;
  };
  const selStyle = { padding: "4px 8px", fontSize: 12, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, maxWidth: "100%" };
  const jumpBtn = (j, label) => j ? <Btn size="sm" onClick={() => onJump(j)}>{label || (zh ? "去改" : "直す")}</Btn> : null;
  const catLabel = (c) => `${c.icon} ${zh ? c.zh : c.ja}`;
  const actions = (c, it, idx) => {
    switch (c.id) {
      case "H1": return <>
        <Btn size="sm" variant={it.looksCny ? "primary" : "default"} onClick={() => { fix.shopCurrency(it, "CNY"); markDone(c, it, idx, "✓ 已标成人民币", "✓ 人民元にしました"); }}>{zh ? "是人民币" : "人民元"}</Btn>
        <Btn size="sm" onClick={() => { fix.shopCurrency(it, "JPY"); markDone(c, it, idx, "✓ 已标成日元", "✓ 円にしました"); }}>{zh ? "是日元" : "円"}</Btn>
        {jumpBtn(it.jump, zh ? "去看" : "見る")}
      </>;
      case "H2": return <>
        <select value="__pick" onChange={(e) => { const v = e.target.value; if (v === "__pick") return; fix.category(it, v); const mc = (it.entity === "brand" && !v) ? BRAND_CAT_ALL : getMaterialCat(v); markDone(c, it, idx, `✓ 分类改成 ${mc.icon} ${mc.zh}`, `✓ 分類を ${mc.icon} ${mc.ja} にしました`); }} style={selStyle}
          aria-label={zh ? "选分类" : "分類を選ぶ"}>
          <option value="__pick" disabled>{zh ? "选分类…" : "分類を選ぶ…"}</option>
          {it.entity === "brand" && <option value="">{catLabel(BRAND_CAT_ALL)}</option>}
          {MATERIAL_CATEGORIES.map(mc => <option key={mc.id} value={mc.id}>{catLabel(mc)}</option>)}
        </select>
        {jumpBtn(it.jump)}
      </>;
      case "H3": return <>
        <Btn size="sm" onClick={() => { fix.clearFamily(it); markDone(c, it, idx, "✓ 已改成不归属", "✓ 未所属にしました"); }}>{zh ? "改成不归属" : "未所属にする"}</Btn>
        {jumpBtn(it.jump)}
      </>;
      case "H7": return <>
        <Btn size="sm" onClick={() => { fix.layerFollow(it); markDone(c, it, idx, "✓ 已改成跟组件库走", "✓ 部品庫と連動させました"); }}>{zh ? "用组件库的" : "部品庫に合わせる"}</Btn>
        {jumpBtn(it.jump)}
      </>;
      case "H10": return <>
        {jumpBtn(it.jumpA, zh ? "去看 A" : "A を見る")}
        {jumpBtn(it.jumpB, zh ? "去看 B" : "B を見る")}
      </>;
      case "H14": return <Btn size="sm" variant="danger" onClick={() => fix.clearCats(it)}>{zh ? "清掉旧价格表" : "旧価格表を削除"}</Btn>;
      default: return jumpBtn(it.jump);
    }
  };
  const info = checks.find(c => c.level === "info");
  return (
    <div ref={panelRef} className="k-data-health" role="dialog" aria-modal="true" aria-label={zh ? "数据体检" : "データ診断"}
      style={{ position: "fixed", top: topOff, left: 0, right: 0, bottom: 0, zIndex: T.z.drawer, background: T.paper, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "8px 16px 96px", boxSizing: "border-box" }}>
        {/* 标题行贴顶:列表展开到几百条时,iPad(没有 Esc)不用滚回最上面也点得到「✕ 关闭」 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, position: "sticky", top: 0, zIndex: 1, background: T.paper, paddingTop: T.sp.s, paddingBottom: T.sp.l }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...T.fs.micro, color: T.subtle, fontFamily: T.fontSans }}>{zh ? "数据管理" : "データ管理"}</div>
            <div style={{ ...T.fs.titleS, color: T.ink, fontFamily: T.fontSans, marginTop: 2 }}>🩺 {zh ? "数据体检" : "データ診断"}</div>
          </div>
          <Btn variant="ghost" onClick={onClose}>{zh ? "✕ 关闭" : "✕ 閉じる"}</Btn>
        </div>
        {problems.length === 0 ? (
          <div style={{ border: `1px solid ${T.line}`, background: T.surface, marginBottom: T.sp.l }}>
            <EmptyState variant="first" lang={lang}
              title={zh ? "✓ 数据都没问题" : "✓ データに問題はありません"}
              hint={zh ? "下面各类都查过了,一条也没有。以后导入新数据、改了很多东西之后可以再来看一眼。" : "すべての項目を確認しました。大きな変更やインポートの後にまた見てください。"}
              actions={[{ label: zh ? "关闭" : "閉じる", onClick: onClose }]} />
          </div>
        ) : (
          <div style={{ ...T.fs.small, color: T.ink, lineHeight: 1.7, marginBottom: T.sp.l, fontFamily: T.fontSans }}>
            {zh ? <>共 <b>{problems.length}</b> 类问题要看,其中 <b style={{ color: moneyN ? T.danger : T.ink }}>{moneyN}</b> 类会让钱数算错。</>
                : <>確認が必要な項目 <b>{problems.length}</b> 種類、うち <b style={{ color: moneyN ? T.danger : T.ink }}>{moneyN}</b> 種類は金額に影響します。</>}
            <div style={{ ...T.fs.caption, color: T.secondary, marginTop: 4 }}>
              {zh ? "「是人民币」「用组件库的」、选分类这类按钮点了马上改好,左下角 5 秒内可以撤销;「去改」「去看」会关掉这一页,打开对应的编辑页 / 详情页。"
                  : "「人民元」「部品庫に合わせる」や分類の選択はすぐ反映され、左下から 5 秒以内に元に戻せます。「直す」「見る」はこの画面を閉じて編集・詳細ページを開きます。"}
            </div>
          </div>
        )}
        {checks.filter(c => c.level !== "info").map(c => {
          const n = c.items.length;
          const isOpen = !!open[c.id];
          const shown = shownOf(c);
          const list = showAll[c.id] ? shown : shown.slice(0, LIMIT);
          return (
            <section key={c.id} data-check={c.id} style={{ borderTop: `1px solid ${T.line}` }}>
              <button type="button" className="k-ease" aria-expanded={isOpen} disabled={shown.length === 0}
                onClick={() => setOpen(o => ({ ...o, [c.id]: !o[c.id] }))}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "14px 0", background: "none", border: "none", textAlign: "left", cursor: n ? "pointer" : "default", fontFamily: T.fontSans, color: T.ink }}>
                {levelTag(c.level)}
                <span style={{ ...T.fs.small, fontWeight: 500, flex: "1 1 160px", minWidth: 0, color: n ? T.ink : T.secondary }}>{zh ? c.titleZh : c.titleJa}</span>
                <span style={{ ...T.fs.small, ...T.num, color: n ? T.ink : T.success, whiteSpace: "nowrap" }}>
                  {n ? (zh ? `${n} 条` : `${n} 件`) : (zh ? "✓ 没有" : "✓ なし")}{n ? (isOpen ? " ▴" : " ▾") : ""}
                </span>
              </button>
              {isOpen && shown.length > 0 && (
                <div style={{ paddingBottom: T.sp.l }}>
                  <div style={{ ...T.fs.caption, color: T.body, lineHeight: 1.7, background: T.sunken, padding: "8px 12px", marginBottom: 4 }}>{zh ? c.whyZh : c.whyJa}</div>
                  {list.map(({ it, done: dn }, i) => (
                    <div key={it.key + "#" + i} data-item={it.key} data-done={dn ? "1" : undefined} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 0", borderTop: i ? `1px solid ${T.lineFaint}` : "none" }}>
                      <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                        <div style={{ ...T.fs.small, color: T.ink, overflowWrap: "anywhere" }}>
                          {L(it, "label")}
                          {it.looksCny && <span style={{ ...T.fs.label, letterSpacing: 0, marginLeft: 6, padding: "0 5px", border: `1px solid ${T.danger}`, color: T.danger, borderRadius: T.radius, whiteSpace: "nowrap" }}>{zh ? "看数量级像人民币" : "人民元らしい"}</span>}
                        </div>
                        {L(it, "detail") && <div style={{ ...T.fs.caption, color: T.secondary, marginTop: 2, overflowWrap: "anywhere" }}>{L(it, "detail")}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {dn ? <span style={{ ...T.fs.caption, color: T.success, minHeight: 28, display: "inline-flex", alignItems: "center", fontFamily: T.fontSans }}>{zh ? dn.zh : dn.ja}</span> : actions(c, it, i)}
                      </div>
                    </div>
                  ))}
                  {shown.length > LIMIT && (
                    <button type="button" className="k-ease" onClick={() => setShowAll(s => ({ ...s, [c.id]: !s[c.id] }))}
                      style={{ ...T.fs.caption, color: T.info, background: "none", border: "none", cursor: "pointer", padding: "8px 0", fontFamily: T.fontSans }}>
                      {showAll[c.id] ? (zh ? "收起,只看前 20 条" : "先頭 20 件だけ表示") : (zh ? `显示全部 ${shown.length} 条` : `すべて表示(${shown.length} 件)`)}
                    </button>
                  )}
                </div>
              )}
            </section>
          );
        })}
        {info && (
          <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 14, display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            {levelTag("info")}
            <span style={{ ...T.fs.small, fontWeight: 500, color: T.ink, fontFamily: T.fontSans }}>{zh ? info.titleZh : info.titleJa}</span>
            <div style={{ ...T.fs.caption, color: T.body, lineHeight: 1.7, flexBasis: "100%", overflowWrap: "anywhere" }}>{zh ? info.whyZh : info.whyJa}</div>
          </div>
        )}
        {problems.length > 0 && <div style={{ display: "flex", justifyContent: "center", marginTop: T.sp.xxl }}><Btn onClick={onClose}>{zh ? "关闭" : "閉じる"}</Btn></div>}
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
        // v17.8: 跟组件库走的部分不单独列 —— 关联组件里那一行就会带过来;在这里关联,下一次同步会被组件库的内容盖掉
        if (layerLinkState(l, components) === "follow") return;
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
                ? `扫描全部配方/组件/组合产品,发现 ${totalCount} 个未关联材料 (高置信度自动匹配 ${highConfidenceCount} 个)`
                : `全レシピ/コンポーネント/組立製品をスキャン、未連動 ${totalCount} 件 (自動推定 ${highConfidenceCount} 件)`}
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
                  : (lang === "zh" ? "组合产品" : "組立製品");
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
                                {isShopMaterialId(m.id) ? (lang === "zh" ? "🏪本店 " : "🏪仕入 ") : ""}
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
function RecipeView({ recipe: r, lang, onEdit, onBack, knowledge = [], recipes = [], components = [], creations = [], onNavigateToKnowledge, onPrint, materials = [], brands = [], onNavigateToMaterial, shopMaterials = [], setShopMaterials, showToast }) {
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
  // 2026-09-29 体检第 2 批:以前有原料没价时利润率照常显示、看着像准确值;成本为 0 时显示红色 0.0% 像亏本。
  // 和下面「成本算不全」红框同一个判定(getIngPriceSource === "none")
  const _missingPriceCount = (r.ingredients || []).filter(ing => getIngPriceSource(ing, materials) === "none").length;
  // 2026-09-29 体检第 2 批:以前缩放后点「打印」印的是原配方的量。缩放过就把按倍数算好的副本交给打印(只给打印用,不写回数据)
  const handlePrint = () => {
    if (!onPrint) return;
    if (scale === 1) { onPrint(); return; }
    onPrint({
      ...r,
      yield: fmtQty(target).replace(/,/g, ""),
      ingredients: (r.ingredients || []).map(ing => {
        const q = parseFloat(ing.qty);
        return isFinite(q) ? { ...ing, qty: fmtQty(q * scale) } : ing;   // 「适量」这类读不出数字的原样印
      }),
      _printScale: { from: originalYield, to: target, factor: scale },
    });
  };

  // 反向查找关联知识点(和知识页按钮同一套规则,见 makeKnowledgeLinkResolver)
  const relatedKnowledge = knowledgeLinksTo("recipe", r.id, knowledge, recipes, components, creations);

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
                      currency: m ? curOf(m) : curOf(ing),   // v17: 价取自百科就用百科币种,兜底到手写价的币种
                      packSize: (m && m.packSize) || "",
                      casePack: (m && m.casePack) || "",
                      note: "",
                      updatedAt: new Date().toISOString(),   // 合并导入按修改时间取新的一边(mergeByNewer)
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
          {onPrint && <Btn size="sm" onClick={handlePrint}>{lang === "zh" ? "打印" : "印刷"}</Btn>}
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
              {fmtSellPrice(r.price, r)}
            </div>
            <div style={{ ...T.fs.caption, marginTop: 6, color: liveUnitCost > 0 ? (liveMargin >= 50 ? T.success : liveMargin >= 30 ? T.warning : T.danger) : T.muted }}>
              {lang === "zh" ? "利润率" : "利益率"} {liveUnitCost > 0 ? `${liveMargin.toFixed(1)}%` : "—"}
            </div>
            {_missingPriceCount > 0 && liveUnitCost > 0 && (
              <div style={{ ...T.fs.label, marginTop: 2, color: T.warning }}>
                {lang === "zh" ? "成本不全·利润率虚高" : "原価不完全・利益率は実際より高く出ます"}
              </div>
            )}
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
                      {/* 2026-09-29 体检第 2 批:以前缩放后一律留 1 位小数,0.1g 皮屑缩小后显示 0.0;「适量」这类显示成 0.0 */}
                      {scale === 1 ? ing.qty : (isFinite(parseFloat(ing.qty)) ? fmtQty(scaledQty) : ing.qty)}
                      <span style={{ ...T.fs.label, color: T.subtle, marginLeft: 3 }}>{ing.unit}</span>
                    </div>
                    <div className="k-desktop-only" style={{ paddingLeft: T.sp.xxl, ...T.fs.caption, color: T.body }}>{ing.brand || "—"}</div>
                    <div style={{ textAlign: "right", ...T.fs.small, color: T.body, ...T.num }}>{fmtCost(scaledCost)}</div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* 汇总条：顶部 1px ink，微标签 + 大数字 */}
        {liveTotalCost > 0 && (
          <div className="rc-ing-total" style={{ display: "grid", gridTemplateColumns: ING_COLS, padding: "18px 0 0", borderTop: `1px solid ${T.ink}`, marginTop: 2, alignItems: "baseline" }}>
            {/* 2026-09-29 体检第 2 批:以前缩放后每行成本变了、总成本还是原配方的,上下对不上 —— 总成本跟着缩放并标倍数 */}
            <div style={{ paddingLeft: T.sp.xl, ...T.fs.micro, color: T.subtle, fontFamily: T.fontSerif }}>
              {lang === "zh" ? "原料总成本" : "材料原価合計"}
              {scale !== 1 && <span style={{ color: T.accent, marginLeft: 6 }}>×{scale.toFixed(2)}</span>}
            </div>
            <div style={{ textAlign: "right", ...T.fs.caption, color: _priceNum > 0 && liveUnitCost > 0 ? (liveMargin >= 50 ? T.success : liveMargin >= 30 ? T.warning : T.danger) : T.muted, ...T.num }}>
              {_priceNum > 0 && liveUnitCost > 0 ? `${liveMargin.toFixed(1)}%` : "—"}
              {_priceNum > 0 && liveUnitCost > 0 && _missingPriceCount > 0 && (
                <div style={{ ...T.fs.label, color: T.warning, whiteSpace: "normal" }}>{lang === "zh" ? "成本不全·利润率虚高" : "原価不完全・利益率は過大"}</div>
              )}
            </div>
            {/* 2026-09-29 体检第 2 批:单个成本以前只在电脑宽度显示、只到 0.1 元 —— 挪到总成本下面,所有屏幕都显示,走 fmtCost */}
            <div className="k-desktop-only" />
            <div style={{ textAlign: "right", fontSize: 22, fontFamily: T.fontSerif, ...T.num, color: T.ink }}>
              ¥{(liveTotalCost * scale).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              {liveUnitCost > 0 && (
                <div style={{ ...T.fs.label, fontFamily: T.fontSans, color: T.secondary, whiteSpace: "nowrap" }}>
                  {lang === "zh" ? "单个成本" : "単個原価"} {fmtCost(liveUnitCost)}
                </div>
              )}
            </div>
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
function ComponentsView({ components, setComponents, cats, onUpdateCats, brands = [], materials = [], setMaterials, setShopMaterials, lang, setLang, viewId, setViewId, editTarget, setEditTarget, showToast, saved, confirmDialog, knowledge, recipes = [], creations = [], onNavigateToKnowledge, onQuickAddKnowledge, onPrintComponent, customCompCats = [], onAddCustomCompCat, products = [] }) {
  // 2026-09-29 体检第 2 批:products 只用来在删组件时列出挂着它的商品(没传就只列组合产品)
  const [filterCat, setFilterCat] = useState("all");
  const [compViewMode, setCompViewMode] = useState("list"); // "list" | "matrix"
  const [compSearch, setCompSearch] = useState("");
  // 「在用」标记(2026-09-26):和配方的 onSale 同一套思路 —— 组件上一个布尔,标了的排到最前 + 「在用中」筛选。
  // 缺省 = 不在用,老数据不用迁移。跟组合蛋糕 layers 里存的组件快照无关,不联动。
  const toggleInUse = (id) => setComponents(prev => prev.map(x =>
    x.id === id ? { ...x, inUse: !x.inUse, updatedAt: new Date().toISOString() } : x));

  if (editTarget !== null) {
    return (
      <ComponentEditForm
        component={editTarget === "new" ? null : editTarget}
        cats={cats}
        brands={brands}
        materials={materials}
        setShopMaterials={setShopMaterials}
        showToast={showToast}
        confirmDialog={confirmDialog}
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
          // 2026-09-29 体检第 2 批:以前只问「删除这个组件吗？」,不说哪些组合产品 / 商品在用它,删了也不能撤销。
          // 照删配方(handleDeleteRecipe):有引用 → 确认框列出引用方;没引用 → 直接删 + 撤销
          const snap = components.find(x => x.id === editTarget.id) || editTarget;
          const cName = pickLang(snap, "name", lang) || snap.nameFr || "";
          const usedByCreations = (creations || []).filter(cr => (cr.layers || []).some(l => l && l.sourceComponentId === snap.id));
          const usedByProducts = (products || []).filter(p => (p.items || []).some(it => it && it.linkedType === "component" && String(it.linkedId) === String(snap.id)));
          const refs = [
            ...usedByCreations.map(cr => `${lang === "zh" ? "组合产品" : "組立製品"}：${pickLang(cr, "name", lang) || cr.nameFr || ""}`),
            ...usedByProducts.map(p => `${lang === "zh" ? "商品" : "商品"}：${pickLang(p, "name", lang) || p.nameZh || p.nameJa || ""}`),
          ];
          const doDelete = () => {
            const idx = components.findIndex(x => x.id === snap.id);
            setComponents(prev => prev.filter(x => x.id !== snap.id));
            setEditTarget(null);
            showToast(lang === "zh" ? `已删除「${cName}」` : `「${cName}」を削除しました`, {
              undo: () => setComponents(prev => {
                if (prev.find(x => x.id === snap.id)) return prev;
                const next = [...prev];
                next.splice(idx >= 0 ? Math.min(idx, next.length) : next.length, 0, snap);
                return next;
              }),
            });
          };
          if (refs.length > 0) {
            confirmDialog(
              lang === "zh"
                ? "下面这些地方在用这个组件。删除后，组合产品里的这一部分保留当时的内容，但不再跟组件库同步；商品里这一项会显示「已删除」，采购计划会少算它。"
                : "以下で使われています。削除すると組立製品のパーツは部品庫と連動しなくなり、商品は「削除済み」になります。",
              doDelete,
              {
                kicker: lang === "zh" ? "删除组件" : "部品を削除",
                title: lang === "zh" ? `删除「${cName}」？` : `「${cName}」を削除？`,
                refs,
                confirmText: lang === "zh" ? "仍然删除" : "削除する",
              }
            );
          } else {
            doDelete();
          }
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
          recipes={recipes}
          components={components}
          creations={creations}
          onNavigateToKnowledge={onNavigateToKnowledge}
          onEdit={() => { setEditTarget(comp); setViewId(null); }}
          onBack={() => setViewId(null)}
          onPrint={onPrintComponent ? (scaled) => onPrintComponent(scaled || comp) : null}
          materials={materials}
          brands={brands}
        />
      );
    }
  }

  // ── 列表视图的数据:搜索 × 分类 / 在用 筛选;「全部」和「在用中」时按分类分段 ──
  const compQuery = compSearch.trim().toLowerCase();
  const matchQuery = (c) => !compQuery || [c.nameZh, c.nameJa, c.nameFr, c.flavorName].some(s => (s || "").toLowerCase().includes(compQuery));
  const inUseCount = components.filter(c => c.inUse).length;
  const baseList = filterCat === "all" ? components
    : filterCat === "inuse" ? components.filter(c => c.inUse)
    : components.filter(c => c.componentCategory === filterCat);
  const filtered = baseList.filter(matchQuery);
  const inUseFirst = (list) => [...list].sort((a, b) => (b.inUse ? 1 : 0) - (a.inUse ? 1 : 0));   // 稳定排序,同组内保持原顺序
  const groupedView = filterCat === "all" || filterCat === "inuse";
  const listCats = [...COMPONENT_CATEGORIES, ...customCompCats];
  const knownCatIds = new Set(listCats.map(ct => ct.id));
  const compGroups = listCats
    .map(ct => ({ cat: ct, items: inUseFirst(filtered.filter(c => (knownCatIds.has(c.componentCategory) ? c.componentCategory : "other") === ct.id)) }))
    .filter(g => g.items.length > 0);
  // 被哪些组合蛋糕用到:按 layers[].sourceComponentId 反查,只显示不写数据;同一个蛋糕用了好几层只算一次
  const usedIn = {};
  (creations || []).forEach(cr => {
    const crName = pickLang(cr, "name", lang) || cr.nameFr || "";
    new Set((cr.layers || []).map(l => l && l.sourceComponentId).filter(Boolean))
      .forEach(id => { (usedIn[id] = usedIn[id] || []).push(crName); });
  });
  const emptyChips = [];
  if (filterCat !== "all") {
    const ct = filterCat === "inuse" ? null : getCompCat(filterCat);
    emptyChips.push({ label: ct ? (lang === "zh" ? ct.zh : ct.ja) : (lang === "zh" ? "在用中" : "使用中"), onRemove: () => setFilterCat("all") });
  }
  if (compQuery) emptyChips.push({ label: `「${compSearch.trim()}」`, onRemove: () => setCompSearch("") });

  const renderCompCard = (c) => {
    const cat = getCompCat(c.componentCategory);
    const name = pickLang(c, "name", lang);
    const nameSub = rawLang(c, "name", lang);
    const flavor = c.flavorFamily ? getFlavorFamily(c.flavorFamily) : null;
    const avatarLetter = (c.nameFr || name || "?").charAt(0).toUpperCase();
    const uses = usedIn[c.id] || [];
    const usageText = uses.length === 0 ? null
      : lang === "zh"
        ? (uses.length === 1 ? `用在「${uses[0]}」` : `用在「${uses[0]}」等 ${uses.length} 个组合产品`)
        : (uses.length === 1 ? `「${uses[0]}」で使用` : `「${uses[0]}」ほか ${uses.length} 件で使用`);
    const liveCost = getIngsLiveCost(c.ingredients, materials, brands);  // 不读 c.totalCost,见 getIngsLiveCost
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
        // 悬停只换上右下三边,左边分类色条保持不变(原来整圈换色,移开后色条会变灰)
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.borderLeftColor = cat.color; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.borderLeftColor = cat.color; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        {/* 在用圆点(和配方「在售中」同款);点它不进详情 */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleInUse(c.id); }}
          title={c.inUse
            ? (lang === "zh" ? "在用 — 点一下取消" : "使用中 — タップで解除")
            : (lang === "zh" ? "点一下标为在用(会排到最前面)" : "タップで使用中に")}
          aria-label={c.inUse ? (lang === "zh" ? "取消在用" : "使用中を解除") : (lang === "zh" ? "标为在用" : "使用中にする")}
          style={{
            width: 18, height: 18, flex: "0 0 auto", padding: 0, border: "none", background: "transparent",
            cursor: "pointer", lineHeight: 1, fontSize: 13,
            color: c.inUse ? T.success : T.line,
          }}
        >{c.inUse ? "●" : "○"}</button>

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
          <div title={uses.length > 1 ? uses.join(" / ") : undefined} style={{ fontSize: 11, color: T.textTertiary, marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {[
              c.yield ? `${c.yield} ${c.unit || "g"}` : null,
              (c.ingredients?.length > 0) ? `${c.ingredients.length} ${lang === "zh" ? "种原料" : "種材料"}` : null,
              liveCost > 0 ? `¥${liveCost.toFixed(0)}` : null,
              usageText,
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
  };

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

      {/* 🔍 搜索:中 / 日 / 法名和风味名都能搜 */}
      <input
        type="text"
        className="k-input"
        value={compSearch}
        onChange={e => setCompSearch(e.target.value)}
        placeholder={lang === "zh" ? "搜索组件名(中文 / 日文 / 法文都行)" : "コンポーネント名で検索(中・日・仏)"}
        style={{ width: "100%", maxWidth: 360, padding: "8px 12px", marginBottom: 10, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14, fontFamily: T.fontSans, background: T.bgCard, color: T.textPrimary, boxSizing: "border-box" }}
      />

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
        <button
          onClick={() => setFilterCat("inuse")}
          style={{
            padding: "5px 14px", fontSize: 12,
            border: `${filterCat === "inuse" ? 1 : 0.5}px solid ${filterCat === "inuse" ? T.success : T.border}`,
            borderRadius: T.radiusPill,
            background: filterCat === "inuse" ? T.successBg : T.bgCard,
            color: filterCat === "inuse" ? T.success : T.textSecondary,
            cursor: "pointer",
            fontWeight: filterCat === "inuse" ? 500 : 400,
            fontFamily: T.fontSans,
            transition: "all 0.15s",
          }}
        >
          <span style={{ color: T.success, marginRight: 4 }}>●</span>{lang === "zh" ? "在用中" : "使用中"}
          {inUseCount > 0 && <span style={{ color: filterCat === "inuse" ? T.success : T.textMuted, marginLeft: 3, opacity: 0.7 }}>{inUseCount}</span>}
        </button>
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

      {components.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#666666", fontSize: 13, lineHeight: 1.8 }}>
          暂无组件。点「+ 新增组件」开始搭建你的配方积木库。<br/>
          <span style={{ fontSize: 12, color: "#999999" }}>
            在这里存入生地・慕斯・果冻・脆片・淋面等基础配方，<br/>做组合产品时可以直接调用。
          </span>
        </div>
      )}

      {components.length > 0 && filtered.length === 0 && (
        filterCat === "inuse" && inUseCount === 0 && !compQuery ? (
          <EmptyState
            variant="first" lang={lang}
            title={lang === "zh" ? "还没标记在用的组件" : "使用中のコンポーネントがありません"}
            hint={lang === "zh" ? "点组件卡片最左边的小圆圈就标上了。标过的会排到最前面。" : "カード左端の丸をタップすると使用中になり、先頭に並びます。"}
            actions={[{ label: lang === "zh" ? "去全部组件" : "すべてへ", onClick: () => setFilterCat("all") }]}
          />
        ) : (
          <EmptyState
            variant="filter" lang={lang}
            title={lang === "zh" ? "没有符合条件的组件" : "条件に合うコンポーネントがありません"}
            chips={emptyChips}
            onClearAll={() => { setFilterCat("all"); setCompSearch(""); }}
          />
        )
      )}

      {groupedView ? (
        <div style={{ display: "grid", gap: 20 }}>
          {compGroups.map(({ cat, items }) => (
            <div key={cat.id} style={{ display: "grid", gap: 10 }}>
              {/* 分段小标题:分类名 + 个数 */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, paddingBottom: 6, borderBottom: `1px solid ${T.lineFaint}` }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: cat.color }}>{lang === "zh" ? cat.zh : cat.ja}</span>
                <span style={{ fontSize: 11, color: T.textMuted, ...T.num }}>{items.length}</span>
              </div>
              {items.map(renderCompCard)}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {inUseFirst(filtered).map(renderCompCard)}
        </div>
      )}
      </>)}
    </div>
  );
}

// ─── 组件详情 View ───────────────────────────────────────────────
function ComponentDetail({ component: c, lang, setLang, onEdit, onBack, knowledge = [], recipes = [], components = [], creations = [], onNavigateToKnowledge, onPrint, materials = [], brands = [] }) {
  const cat = getCompCat(c.componentCategory);
  const name = pickLang(c, "name", lang);
  const nameOther = rawLang(c, "name", lang);
  const notes = pickLang(c, "notes", lang) || c.notes;

  // 🔢 缩放计算器
  const [targetYield, setTargetYield] = useState("");
  const originalYield = parseFloat(c.yield) || 0;
  const target = parseFloat(targetYield) || 0;
  const scale = (originalYield > 0 && target > 0) ? target / originalYield : 1;
  // 2026-09-29 体检第 2 批:以前缩放后点「打印」印的还是原配方的量。缩放过就把缩放后的副本交给打印
  // (ComponentsView 的 onPrint 收到副本就用副本,没收到用原组件);只是打印用的副本,不写回数据。
  const scaledForPrint = () => {
    if (scale === 1) return null;
    const unitTxt = c.unit || "g";
    const tag = (zh) => zh ? `（按 ${fmtQty(target)}${unitTxt} 缩放，原 ${fmtQty(originalYield)}${unitTxt} ×${fmtQty(scale)}）` : `（${fmtQty(target)}${unitTxt} に換算・元 ${fmtQty(originalYield)}${unitTxt} ×${fmtQty(scale)}）`;
    const isNum = (v) => v !== undefined && v !== null && /^\s*(\d+(\.\d+)?|\.\d+)\s*$/.test(String(v));
    return {
      ...c,
      nameZh: c.nameZh ? c.nameZh + tag(true) : c.nameZh,
      nameJa: c.nameJa ? c.nameJa + tag(false) : c.nameJa,
      yield: String(target),
      // 用量和屏幕上同一个读法 fmtQty(10 以下两位小数,盐 0.03 g 不再印成 0.0);去掉千位逗号免得下游 parseFloat 读成 1;「适量」这种不是数字的原样
      ingredients: (c.ingredients || []).map(ing => ({
        ...ing,
        qty: isNum(ing.qty) ? fmtQty(parseFloat(ing.qty) * scale).replace(/,/g, "") : ing.qty,
        cost: isNum(ing.cost) ? String(parseFloat(ing.cost) * scale) : ing.cost,
      })),
    };
  };

  // v11 Task #4: 本店原料优先,实时算总成本
  const liveTotalCost = (c.ingredients || []).reduce((s, ing) => s + getIngLiveCost(ing, materials, brands, []), 0);

  // 找到关联的知识点(反向查找,和知识页按钮同一套规则,见 makeKnowledgeLinkResolver)
  const relatedKnowledge = knowledgeLinksTo("component", c.id, knowledge, recipes, components, creations);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase" }}>
          {lang === "zh" ? "组件详情" : "コンポーネント詳細"}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onPrint && <Btn size="sm" onClick={() => onPrint(scaledForPrint())}>{lang === "zh" ? (scale !== 1 ? "🖨 打印（缩放后）" : "🖨 打印") : (scale !== 1 ? "🖨 印刷（換算後）" : "🖨 印刷")}</Btn>}
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
            {/* v17.8: 备货 = 整批做好存着,组合产品的整体配方里只写「从库存取多少」 */}
            {c.prepMode === "stock" && (
              <span title={lang === "zh" ? "整批做好存着，组合产品的整体配方里只写「从库存取多少」" : "まとめて仕込んで保管"}
                style={{ background: "#FFFFFF", color: T.warning, border: `0.5px solid ${T.warning}`, padding: "3px 12px", borderRadius: T.radiusPill, fontSize: 11, fontWeight: 500 }}>
                {lang === "zh" ? "备货" : "作り置き"}
              </span>
            )}
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
                      <div style={{ textAlign: "right", fontWeight: 500, fontSize: 15, color: scale !== 1 ? "#6D28D9" : "#111111" }}>{scale === 1 ? ing.qty : (isFinite(parseFloat(ing.qty)) ? fmtQty(scaledQty) : ing.qty)}</div>
                      <div style={{ fontSize: 13, color: "#666666", paddingLeft: 4 }}>{ing.unit}</div>
                      <div style={{ textAlign: "right", fontSize: 12, color: "#666666" }}>{fmtCost(scaledCost)}</div>
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

// ─── 配料表(配方 / 组件 / 组合产品的部分 三个编辑页共用)────────────────────
// 2026-09-29 体检第 2 批 2b 第一步:三个编辑页原来各抄一份配料表(约 150 行 × 3),改一处漏两处。
// 现在只有这一份。三页之间现有的差异(列、占位符、title、宽度、datalist id、配方独有的改价追踪 / ↺ / 品牌锁 / 分组图例、
// 部分编辑页没有 FR / 分组 / 竖条 …)第一步一律原样保留,写在下面这张表里;第二步再逐条统一。
// 约定:ings / setIngs 状态留在编辑页里(useDirtyGuard 靠它判断改没改),这里只收 props;
// 选材料 / 批量关联两个弹窗由 IngredientLinkModals 渲染在编辑页根元素里(位置和以前一样)。
// 表头 / 占位符 / title 三页同一套,跟中日文走(2026-09-29 第 2 批 2b C4;以前三页各写各的,配方页中文界面也是日文表头)
const ING_TABLE_TXT = {
  zh: {
    headers: ["🔗", "中文名", "日文名", "法文名", "用量", "单位", "品牌", "单价", "成本", "分组", "备注", ""],
    nameZh: "中文名", nameJa: "日文名", brand: "品牌", cost: "自动", note: "备注・用途",
    bulkTitle: "扫描所有没关联材料百科的原料,推荐匹配", bulkLabel: "🤖 批量关联百科",
    pick: "从材料百科选择(自动填名 / 价 / 品牌)",
    linked: (n) => `✓ 关联:${n}\n点击修改或解除关联`,
    matTitle: (n) => `✓ 百科关联:${n}`,
    catTitle: (n) => `✓ 已关联「${n}」`,
    drift: "价格表已更新,点击同步",
    priceTh: "克 / 毫升的行按每 100g(100ml)填;其他单位(本、個、kg …)按每个单位填",
    unitMismatch: (u) => `这一行按「${u}」计量,但关联的材料按克计价,成本会算错。改成克,或者取消关联后直接填每${u}的价`,
  },
  ja: {
    headers: ["🔗", "中国語名", "日本語名", "フランス語名", "分量", "単位", "ブランド", "単価", "原価", "グループ", "備考", ""],
    nameZh: "中国語名", nameJa: "日本語名", brand: "ブランド", cost: "自動", note: "備考・用途メモ",
    bulkTitle: "未関連の材料を材料事典と一括マッチ", bulkLabel: "🤖 一括関連",
    pick: "材料事典から選択(名前・単価・ブランドを自動入力)",
    linked: (n) => `✓ 連動中:${n}\nクリックで変更・解除`,
    matTitle: (n) => `✓ 材料事典:${n}`,
    catTitle: (n) => `✓ 価格表「${n}」に連動`,
    drift: "価格表の値に更新",
    priceTh: "g / ml の行は 100g(100ml)あたりで入力。その他の単位(本・個・kg など)は 1 単位あたり",
    unitMismatch: (u) => `この行は「${u}」単位ですが、連動した材料はグラム単価です。原価が正しく計算されません。グラムに直すか、連動を外して 1${u}あたりの単価を入力してください`,
  },
};
// 三页之间还剩的差异。品牌 datalist 的 id 三页不同(同一页面里不会同时出现两张表,分开只是沿用老 id);
// 名字的 datalist(旧价格表)C9 去掉了,换成材料百科联想
const ING_TABLE_VARIANTS = {
  recipe: {
    listIds: { brand: "autoBrandR" },
    where: { zh: "本配方", ja: "このレシピ" },
  },
  component: {
    listIds: { brand: "autoBrand" },
    where: { zh: "本组件", ja: "このコンポーネント" },
  },
  layer: {
    listIds: { brand: "autoBrand" },
    where: { zh: "这一部分", ja: "このパーツ" },
  },
};

// C15:三个配料表编辑页(和组合产品编辑页)自己的「← 返回」「取消」—— 这一页有没保存的改动先问一句,文字同切页的 goTab;
// 没传 confirmDialog 就直接走。用 useDirtyGuard 的 bind.isDirty(只看这一页),不用 anyEditorDirty:
// 部分编辑页开着时外层组合产品编辑页也挂着,外层改过名字、这一部分没改,点「← 取消」不该问
const confirmLeave = (isDirty, confirmDialog, lang, go) => {
  if (typeof confirmDialog === "function" && typeof isDirty === "function" && isDirty()) {
    confirmDialog(
      lang === "zh" ? "这一页有还没保存的修改。现在离开,刚才改的内容会丢。" : "保存していない変更があります。移動すると失われます。",
      go,
      { title: lang === "zh" ? "还没保存" : "未保存", confirmText: lang === "zh" ? "不保存,离开" : "保存せず移動", cancelText: lang === "zh" ? "留在这里" : "戻る" }
    );
    return;
  }
  go();
};

// ─── 配料行单价:按「每 100 g」填(2026-09-29 第 2 批 2b C5)─────────────────────
// 人民币每克价全是 0.008 这种读不动的小数,供货商报价、材料百科、本店原料显示的又都是每 100 g。
// 所以单位是 g / ml / 空(以及 克 / 毫升)的行,输入框显示「存的每克价 × 100」,填进去的数 ÷ 100 再存;
// 其他单位(kg / 本 / 個 / 枚 / L …)按「每单位」原样填 —— 成本 = 用量 × 单价,不换算单位。
// **存储永远是每单位价(unitPrice),/100g 只在这个输入框里**。
// 审查第 7 轮:先 NFKC —— 输入法全角模式敲出来的「ｇ」「ｍｌ」「㎖」也算克 / 毫升(以前当成「本」这类单位:黄框说成本算错、改价存不进本店原料);「㎏」归一成 kg,仍不是克。存的单位不改
const isGramUnit = (unit) => /^(?:g|ml|克|毫升)?$/i.test(String(unit === undefined || unit === null ? "" : unit).normalize("NFKC").trim());
const ingPriceBasis = (unit) => {
  const u = String(unit === undefined || unit === null ? "" : unit).normalize("NFKC").trim();
  if (isGramUnit(u)) return { per100: true, label: /^(?:ml|毫升)$/i.test(u) ? "100ml" : "100g" };
  return { per100: false, label: u };
};
// 存的每单位价 → 输入框里显示的数。toPrecision(12) 去掉 0.1 × 100 = 10.000000000000002 这种浮点尾巴
const ingPriceShown = (stored, per100) => {
  if (!stored) return "";
  // 按「本 / kg」填的行也去掉浮点尾巴(关联材料刷新来的每克价是 0.012899999999999998 这种)
  if (!per100) { const m = parseFloat(stored); return isFinite(m) ? String(Number(m.toPrecision(12))) : String(stored); }
  const n = parseFloat(stored);
  return isFinite(n) ? String(Number((n * 100).toPrecision(12))) : "";
};
// 输入框里填的数 → 存的每单位价
const ingPriceStored = (text, per100) => {
  if (!per100 || text === "") return text;
  const n = parseFloat(text);
  return isFinite(n) ? String(Number((n / 100).toPrecision(12))) : "";
};
// C14:数字框防误滚。聚焦的 number 输入框被滚轮扫过会一格一格改数(单价 0.03 滚一下变 1.03),
// 滚轮一来就让它失焦,数不动、页面照常滚
const blurOnWheel = (e) => { e.currentTarget.blur(); };

// 单价输入框。draft = 她正在敲的原文:「1.」「0.50」这种换算一次就会变样(敲「1.」被吃成「1」),
// 所以只要存下去的值还是这份原文算出来的那个,就照原文显示;失焦、或者值被别处改了(↺ / 选材料 / 切币种 / 改单位)就按存的值重算
function IngPriceInput({ ing, placeholder, style, onChangeStored }) {
  const { per100 } = ingPriceBasis(ing.unit);
  const [draft, setDraft] = useState(null);
  const cur = ing.unitPrice === undefined || ing.unitPrice === null ? "" : ing.unitPrice;
  const live = draft && draft.stored === cur && draft.per100 === per100;
  const shown = live ? draft.text : ingPriceShown(cur, per100);
  // 审查第 6 轮:base = 开始敲之前存的原值。敲回一开始显示的那个数就原样还回去(清空照旧存 "",老数据存数字 0 的不还成 0)—— 存的 0.12727999999999998 显示成 12.728,
  // 敲 1 再删掉以前会存成 0.12728,离开时白问「还没保存」
  return (
    <input type="number" placeholder={placeholder} value={shown}
      onChange={e => { const text = e.target.value; const base = live ? draft.base : cur; const stored = (text !== "" && text === ingPriceShown(base, per100)) ? base : ingPriceStored(text, per100); setDraft({ text, stored, per100, base }); onChangeStored(stored); }}
      onBlur={() => setDraft(null)}
      onWheel={blurOnWheel}
      style={style} />
  );
}

// ─── 配料名字联想(2026-09-29 第 2 批 2b C9)─────────────────────────────
// 以前中文名 / 日文名输入框联想的是旧价格表 cats(已停用),打字打到和价格表同名还会悄悄绑上价格表。
// 现在联想本店原料 + 材料百科:打字时出下拉,最多 8 条,本店原料排前(带「本店」标签和每 100g 价);
// 点一条 = 和 🔗 选材料弹窗一模一样的写法(applyMaterialPick),只多一步:正在打字的那个名字框换成材料的名字(没有就保留她打的);不点就是普通手填,什么都不关联。
// 只按中 / 日 / 法文名找(同选材料弹窗),NFKC + 不分大小写 + 不管空格
const normIngSuggest = (s) => String(s == null ? "" : s).normalize("NFKC").toLowerCase().replace(/\s+/g, "");
const _ingSuggestNames = new WeakMap();   // 材料对象 → 归一化后的名字(材料一改就是新对象,缓存自然作废)
function suggestMaterialsForIng(text, materials, limit = 8) {
  const k = normIngSuggest(text);
  if (!k || !Array.isArray(materials)) return [];
  const shopIds = new Set(_shopMaterials.map(s => s && s.materialId).filter(Boolean));
  const hits = [];
  for (const m of materials) {
    if (!m || !m.id) continue;
    let names = _ingSuggestNames.get(m);
    if (!names) { names = [m.nameZh, m.nameJa, m.nameFr].map(normIngSuggest).filter(Boolean); _ingSuggestNames.set(m, names); }
    // 0 = 名字完全一样,1 = 开头就是,2 = 名字里有
    let rank = 3;
    for (const n of names) { const r = n === k ? 0 : n.startsWith(k) ? 1 : n.includes(k) ? 2 : 3; if (r < rank) rank = r; }
    if (rank < 3) hits.push({ m, rank, shop: shopIds.has(m.id) ? 1 : 0 });
  }
  const nm = (m) => String(m.nameZh || m.nameJa || m.nameFr || "");
  hits.sort((a, b) => (b.shop - a.shop) || (a.rank - b.rank)
    || ((b.m.isBest ? 1 : 0) - (a.m.isBest ? 1 : 0)) || ((b.m.rating || 0) - (a.m.rating || 0))
    || (nm(a.m).length - nm(b.m).length) || nm(a.m).localeCompare(nm(b.m)));
  return hits.slice(0, limit).map(x => x.m);
}

// 中文名 / 日文名输入框 + 联想下拉(三个编辑页共用,IngredientTable 里用)。
// 表格外层是 overflowX:auto,下拉用 position:fixed 按输入框的位置放,不会被裁掉;页面 / 表格滚动、改窗口大小时跟着挪,点别处收起。
// 选项用 onMouseDown + preventDefault(输入框不失焦):用 onClick 的话输入框的 blur 先把面板关了,点不进来。
// 键盘:↑↓ 挑、Enter 选挑着的那条(没挑过就只是收起,不会替她关联第一条)、Esc 收起;
// 输入法组词时(isComposing / keyCode 229)一个键都不接 —— 那时的 Enter 是在选字;组词中也不出下拉,选完字再按整词找
function IngNameInput({ value, placeholder, title, style, materials, brands, lang, onChangeText, onPickMaterial }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const [rect, setRect] = useState(null);
  const [composing, setComposing] = useState(false);
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const touchingBox = useRef(false);   // 手指正按在下拉里(见 onBlur)
  const zh = lang === "zh";
  const text = value == null ? "" : String(value);
  const list = useMemo(() => (open && !composing) ? suggestMaterialsForIng(text, materials) : [], [open, composing, text, materials]);
  const place = () => {
    const el = inputRef.current;
    if (!el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, bottom: r.bottom, left: r.left });
  };
  const openFor = (v) => { touchingBox.current = false; setHi(-1); if (String(v == null ? "" : v).trim()) { place(); setOpen(true); } else setOpen(false); };
  useEffect(() => {
    if (!open) return;
    const away = (e) => {
      const t = e.target;
      if ((inputRef.current && inputRef.current.contains(t)) || (boxRef.current && boxRef.current.contains(t))) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", away);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    const vvp = window.visualViewport;   // 键盘弹起 / 收起、页面被推着平移时重新摆
    if (vvp) { vvp.addEventListener("resize", place); vvp.addEventListener("scroll", place); }
    return () => {
      document.removeEventListener("mousedown", away);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      if (vvp) { vvp.removeEventListener("resize", place); vvp.removeEventListener("scroll", place); }
    };
  }, [open]);
  const choose = (m) => { touchingBox.current = false; setOpen(false); setHi(-1); onPickMaterial(m); };
  const shown = open && !composing && list.length > 0 && !!rect;
  const onKeyDown = (e) => {
    const ne = e.nativeEvent || {};
    if (composing || ne.isComposing || e.keyCode === 229) return;
    if (e.key === "Escape") { if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); setHi(-1); } return; }
    if (e.key === "ArrowDown") {
      if (!open) { if (text.trim()) { e.preventDefault(); openFor(text); } return; }
      if (list.length) { e.preventDefault(); setHi(h => Math.min(h + 1, list.length - 1)); }
      return;
    }
    if (e.key === "ArrowUp") { if (shown) { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); } return; }
    if (e.key === "Enter" && open) {
      e.preventDefault();
      if (hi >= 0 && hi < list.length) choose(list[hi]); else { setOpen(false); setHi(-1); }
    }
  };
  let box = null;
  if (shown) {
    const vw = (typeof window !== "undefined" && window.innerWidth) || 1024;
    const vh = (typeof window !== "undefined" && window.innerHeight) || 768;
    const w = Math.max(160, Math.min(320, vw - 16));
    const left = Math.max(8, Math.min(rect.left, vw - w - 8));
    // 上下还有多少地方按「看得见的那一块」(visualViewport)量:iPad / iPhone 键盘弹起来只缩 visualViewport,innerHeight 还算着键盘底下,
    // 以前靠下的行照样往下开、整个下拉躲在键盘后面。摆放仍按 innerHeight(position:fixed 认的是它)
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    const visTop = vv && vv.height > 0 ? (vv.offsetTop || 0) : 0;
    const visBottom = vv && vv.height > 0 ? visTop + vv.height : vh;
    const below = visBottom - rect.bottom - 8, above = rect.top - visTop - 8;
    const up = below < 180 && above > below;   // 输入框靠近屏幕底下(手机键盘弹起来时常见)就往上开
    const pos = up ? { bottom: vh - rect.top + 2, maxHeight: Math.max(120, Math.min(380, above)) } : { top: rect.bottom + 2, maxHeight: Math.max(120, Math.min(380, below)) };
    box = (
      // 容器也 preventDefault:点到下拉的滚动条 / 底下那行提示时输入框不失焦(失焦会把下拉收掉)
      <div ref={boxRef} role="listbox" onMouseDown={(e) => e.preventDefault()}
        onTouchStart={() => { touchingBox.current = true; }}
        onTouchEnd={() => { setTimeout(() => { touchingBox.current = false; }, 500); }}
        onTouchCancel={() => { touchingBox.current = false; }}
        style={{ position: "fixed", left, width: w, ...pos, overflowY: "auto", zIndex: T.z.popover, background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, boxShadow: T.sh.popover, textAlign: "left" }}>
        {list.map((m, i) => {
          const b = (brands || []).find(x => x && x.id === m.brandId);
          const bName = b ? (zh ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : "";
          const pp = getMaterialEffectivePrice(m);
          const price = pp > 0 ? fmtUnitPrice(pp, "CNY") : "";
          const sub = [bName, price].filter(Boolean).join(" · ");
          return (
            <div key={m.id} role="option" aria-selected={i === hi}
              onMouseDown={(e) => { e.preventDefault(); choose(m); }}
              onMouseEnter={() => setHi(i)}
              style={{ padding: "6px 10px", cursor: "pointer", background: i === hi ? T.bgMuted : "transparent", borderBottom: `0.5px solid ${T.borderSoft}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textPrimary }}>
                <span style={{ flex: "0 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(zh ? (m.nameZh || m.nameJa) : (m.nameJa || m.nameZh)) || m.nameFr || m.id}</span>
                {isShopMaterialId(m.id) && <span title={zh ? "本店原料已有" : "仕入れ済み"} style={{ flex: "0 0 auto", fontSize: 9, letterSpacing: "0.1em", padding: "1px 5px", border: `1px solid ${T.success}`, color: T.success, whiteSpace: "nowrap" }}>{zh ? "本店" : "仕入"}</span>}
              </div>
              {sub && <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
            </div>
          );
        })}
        <div style={{ padding: "5px 10px", fontSize: 10, color: T.textTertiary, lineHeight: 1.5 }}>
          {zh ? "点一条 = 关联材料百科(价格、品牌跟着填);不点就是手填" : "選ぶと材料事典に連動(単価・ブランドを自動入力)。選ばなければ手入力のまま"}
        </div>
      </div>
    );
  }
  return (
    <>
      <input ref={inputRef} placeholder={placeholder} value={text} title={title} autoComplete="off"
        onChange={e => {
          const v = e.target.value;
          onChangeText(v);
          const ne = e.nativeEvent || {};
          if (!composing && !ne.isComposing) openFor(v);
        }}
        onCompositionStart={() => { setComposing(true); }}
        onCompositionEnd={e => { setComposing(false); openFor(e.target.value); }}
        onKeyDown={onKeyDown}
        onBlur={() => { if (touchingBox.current) return; setOpen(false); setHi(-1); }}
        style={style} />
      {box}
    </>
  );
}

// 配料表本体:「原材料」标题行(🤖 批量关联 / + 追加)+ 分组图例 + 表格(名字格带材料百科联想 IngNameInput)+ 品牌的 datalist。
// 表格下面的成本汇总三页各不一样,留在编辑页里。
// nextIdRef = 编辑页的 useRef(ings.length),新行 _id 从它取(_id 可能是 0,判断一律 !== null)。
function IngredientTable({ variant, ings, setIngs, nextIdRef, cats, materials, brands, lang, onPickMaterial, onOpenBulk }) {
  const v = ING_TABLE_VARIANTS[variant];
  const tx = ING_TABLE_TXT[lang === "zh" ? "zh" : "ja"];

  // 品牌格(没关联百科、也没关联旧价格表的行)的自动补全:旧价格表 cats 里的品牌名。
  // 名字的补全 C9 换成了材料百科联想(IngNameInput),不再从 cats 取
  const brandSuggestions = useMemo(() => {
    const brandSet = new Set();
    (cats || []).forEach(cat => {
      (cat.brands || []).forEach(b => {
        if (b.nameZh) brandSet.add(b.nameZh);
        if (b.nameJa) brandSet.add(b.nameJa);
      });
    });
    return Array.from(brandSet).sort();
  }, [cats]);

  const updateIng = (id, field, val) => setIngs(prev => prev.map(i => {
    if (i._id !== id) return i;
    const next = { ...i, [field]: val };
    // 改价追踪(v11 配方页起;2026-09-29 第 2 批 2b C6 三页都做,体检 #21):
    // 只有「关联了材料百科、材料还在」的行改了单价才标 _priceModified(黄框 + ↺ + 底下「保存到本店原料」);
    // 改回原价 / 清空 / 没关联的行一律不留这个键 —— 留着 false,未保存判定会一直算「改过」
    if (field === "unitPrice") {
      const linkedOk = !!(i.materialId && (materials || []).some(m => m && m.id === i.materialId));
      const o = parseFloat(i._originalPrice), n = parseFloat(val);
      const changed = isFinite(n) && !(isFinite(o) && Math.abs(o - n) <= 1e-9 * Math.max(1, Math.abs(o)));
      if (linkedOk && changed) next._priceModified = true; else delete next._priceModified;
    }
    // 单位换了口径时丢掉手改的价:不在这里逐键判断(审查第 4 轮),见下面 commitUnit
    return next;
  }));
  // 改用量 / 单价时顺手重算这一行的成本:另一个数 > 0 才算(没单价时手填的成本不动,老规矩)。
  // C8:读不出数字(清空了)时成本写 "",以前会写成字符串 "NaN"。按这一刻的行算(以前拿渲染时的旧值)
  const updateQtyOrPrice = (id, field, val) => {
    updateIng(id, field, val);
    setIngs(prev => prev.map(i => {
      if (i._id !== id) return i;
      const q = parseFloat(i.qty), p = parseFloat(i.unitPrice);
      if (field === "qty" ? !(p > 0) : !(q > 0)) return i;
      return { ...i, cost: (isFinite(q) && isFinite(p)) ? (q * p).toFixed(1) : "" };
    }));
  };
  // v11: 单行撤销改价,恢复到 _originalPrice。关联的材料有价时原价是按人民币刷出来的,币种也放回 CNY
  const revertPrice = (id) => setIngs(prev => prev.map(i => i._id !== id ? i : revertRow(i)));
  const revertRow = (i) => {
    const q = parseFloat(i.qty) || 0;
    const op = parseFloat(i._originalPrice) || 0;
    const m = i.materialId ? (materials || []).find(x => x && x.id === i.materialId) : null;
    const { _priceModified, ...rest } = i;
    return { ...rest, unitPrice: i._originalPrice || "", ...(m && getMaterialEffectivePrice(m) > 0 ? { currency: "CNY" } : {}), cost: q > 0 && op > 0 ? (q * op).toFixed(1) : i.cost };
  };
  // 审查第 3 轮:单位在「克 / 毫升」和「本 / 個」之间换了,手改的单价口径就不对了(按本填的 30 会变成每克 30、存进本店原料),
  // 丢掉手改的价、回到材料百科的价,同 revertPrice。
  // 审查第 4 轮:改成离开单位框时拿「点进去之前的单位」比 —— 以前每敲一个键就判断,g 改 ml 敲到「m」、拼音输入「毫升」敲到「h」
  // 都会把同口径的手改价悄悄丢掉。点保存 / 别的按钮时单位框先失焦,所以真换了口径照样先丢价再保存
  const unitAtFocus = useRef({});
  // 审查第 6 轮:切去别的窗口(微信看报价)整个窗口失焦也会触发 blur,这时她还在这一格里 —— 不判断、留着点进去之前的单位,
  // 回来时浏览器把焦点还给这一格,onFocus 看到 unitResume 就不覆盖起点
  const unitResume = useRef(null);
  const commitUnit = (id, e) => {
    if (e && typeof document !== "undefined" && document.activeElement === e.target && typeof document.hasFocus === "function" && !document.hasFocus()) { unitResume.current = id; return; }
    if (unitResume.current === id) unitResume.current = null;
    const from = unitAtFocus.current[id];
    delete unitAtFocus.current[id];
    if (from === undefined) return;
    setIngs(prev => prev.map(i => (i._id === id && i._priceModified && isGramUnit(from) !== isGramUnit(i.unit)) ? revertRow(i) : i));
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{lang === "zh" ? "原材料" : "原材料"}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {materials && materials.length > 0 && (
            <Btn size="sm" onClick={onOpenBulk} title={tx.bulkTitle}>
              {tx.bulkLabel}
            </Btn>
          )}
          <Btn size="sm" onClick={() => setIngs(prev => [...prev, { _id: nextIdRef.current++, nameZh: "", nameJa: "", nameFr: "", qty: "", unit: "g", brand: "", unitPrice: "", currency: "CNY", cost: "", group: "none" }])}>{lang === "zh" ? "+ 追加" : "+ 追加"}</Btn>
        </div>
      </div>

      {/* 分组图例(2026-09-29 第 2 批 2b C2:以前只有配方页有,组件 / 部分编辑页也有分组列了,三页都给) */}
      <div style={{ fontSize: 12, color: "#666666", marginBottom: 10 }}>
        {lang === "zh"
          ? <><span>分组 = 可以一起称量放入</span><strong>同一个盆/锅</strong><span>的材料，同色条 = 同一容器</span></>
          : <><span>グループ = </span><strong>同じボウル/鍋</strong><span>にまとめて計量できる材料、同じ色の線 = 同じ容器</span></>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {Object.entries(GROUPS).filter(([k]) => k !== "none").map(([k, g]) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1.5px solid ${g.labelBorder}`, color: g.labelColor }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: g.border, display: "inline-block" }} />
              {lang === "zh" ? g.zh : g.ja}
            </span>
          ))}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead>
            <tr style={{ background: "#F5F5F5" }}>
              {tx.headers.map((h, i) => (
                <th key={i} style={{ fontSize: 11, color: "#666666", fontWeight: 400, padding: "6px 6px 8px", textAlign: "left", borderBottom: "0.5px solid #E5E5E5", whiteSpace: "nowrap" }} title={i === 7 ? tx.priceTh : undefined}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ings.map(ing => {
              const ist = { padding: "4px 6px", fontSize: 12, border: "0.5px solid #CCCCCC", borderRadius: 4, background: "#FFFFFF", color: "#111111" };
              // 行首盆色竖条。认不出的分组值(导入的 bowl6 之类)按「未分组」显示,数据里的值不动(以前配方页遇到会白屏)
              const grp = (typeof ing.group === "string" && Object.prototype.hasOwnProperty.call(GROUPS, ing.group)) ? ing.group : "none";   // 只认 GROUPS 自己的键(bowl6 / 空 / 其他 → none)
              const g = GROUPS[grp];
              const { cat: linkedCat, brand: linkedBrand } = resolveIngBinding(ing, cats);
              const linked = !!linkedCat;
              // 改名字:已绑旧价格表的行,名字对不上了就解绑(catId / brandIdx 清掉)。
              // C9 起打字不再自动绑价格表(以前打到和价格表同名会悄悄绑上、补另一种语言的名字);打开时的 autoLinkIng 照旧
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
                setIngs(prev => prev.map(i => i._id === ing._id ? newIng : i));
              };
              // C9:在名字联想里点了一条材料 = 和 🔗 选材料弹窗选中同一个写法;
              // 只多一步:正在打字的那个名字框换成材料的名字(打「黄」选了「四叶 无盐黄油」,名字不能只剩一个「黄」)。材料没有这种语言的名字就保留她打的
              const onSuggestPick = (field) => (mat) => setIngs(prev => prev.map(i => i._id !== ing._id ? i
                : applyMaterialPick({ ...i, [field]: (mat && mat[field]) || i[field] }, mat, brands, lang)));
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
                    // 旧价格表 cats 全是东京时期的日元每克价:这一行改标日元(新行缺省是人民币,不标会把日元数当人民币,成本大约 20 倍)
                    // 「↺ 撤销改价」记的原价 _originalPrice 也跟着换成日元口径,不然撤销会把人民币原价当日元恢复(审查发现)
                    ...(price > 0 ? { currency: "JPY", ...(i._originalPrice !== undefined && i._originalPrice !== "" && curOf(i) !== "JPY" ? { _originalPrice: convCur(i._originalPrice, curOf(i), "JPY") } : {}) } : {}),
                    cost: q > 0 && price > 0 ? (q * price).toFixed(1) : i.cost,
                  };
                }));
              };
              const { material: linkedMat, brand: linkedMatBrand } = resolveIngMaterial(ing, materials, brands);
              // C10:关联了材料(材料都按克计价)但单位不是 g / ml / 空 → 成本 = 用量 × 每克价,按「本」写的行只算出几分之一
              const unitMismatch = !!linkedMat && !isGramUnit(ing.unit);
              // 单价按每 100g 还是每单位填。审查第 7 轮:按「本」的关联行,材料有价时框里是打开时刷新来的每克价,口径写「/g」(以前写「¥/本」,1.29 像一根香草荚的价);材料没价时算的是手填价,仍写「/本」
              const basis = unitMismatch && getMaterialEffectivePrice(linkedMat) > 0 ? { per100: false, label: "g" } : ingPriceBasis(ing.unit);
              // ¥ / 円 切换按钮只给手写价的行。C7:判断「找不到关联材料」而不是「没有 materialId」——
              // 材料被删掉的行价格其实是手写价在算,以前没有按钮,币种改不了
              const curBtnShown = !linkedMat;
              // 检查价格是否和价格表当前值不一致
              const priceDrift = linked && linkedBrand && linkedBrand.price && ing.unitPrice && curOf(ing) !== "CNY" &&   // 旧价格表是东京时期的日元价,人民币行不拿它比(点了会把日元数原样写成人民币)
                Math.abs(parseFloat(linkedBrand.price) - parseFloat(ing.unitPrice)) > 0.001
                ? parseFloat(linkedBrand.price) : null;
              return (
                <tr key={ing._id} style={{ borderBottom: "0.5px solid #E5E5E5", borderLeft: `4px solid ${g.border}` }}>
                  <td style={{ padding: "3px 4px" }}>
                    <button
                      onClick={() => onPickMaterial(ing._id)}
                      title={linkedMat ? tx.linked(pickLang(linkedMat, "name", lang)) : tx.pick}
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
                  <td style={{ padding: "3px 4px" }}>
                    <IngNameInput placeholder={tx.nameZh} value={ing.nameZh||""} onChangeText={val=>onNameChange("nameZh", val)} materials={materials} brands={brands} lang={lang} onPickMaterial={onSuggestPick("nameZh")} style={{ ...ist, width: 110, borderColor: linkedMat ? "#059669" : (linked ? "#0F6E56" : "#CCCCCC") }} title={linkedMat ? tx.matTitle(pickLang(linkedMat, "name", lang)) : (linked ? tx.catTitle(getCatName(linkedCat, lang)) : "")} />
                  </td>
                  <td style={{ padding: "3px 4px" }}><IngNameInput placeholder={tx.nameJa} value={ing.nameJa||""} onChangeText={val=>onNameChange("nameJa", val)} materials={materials} brands={brands} lang={lang} onPickMaterial={onSuggestPick("nameJa")} style={{ ...ist, width: 110, borderColor: linkedMat ? "#059669" : (linked ? "#0F6E56" : "#CCCCCC") }} /></td>
                  <td style={{ padding: "3px 4px" }}><input placeholder="FR" value={ing.nameFr||""} onChange={e=>updateIng(ing._id,"nameFr",e.target.value)} style={{ ...ist, width: 70 }} /></td>
                  <td style={{ padding: "3px 4px" }}><input type="number" placeholder="量" value={ing.qty||""} onChange={e=>updateQtyOrPrice(ing._id,"qty",e.target.value)} onWheel={blurOnWheel} style={{ ...ist, width: 52 }} /></td>
                  <td style={{ padding: "3px 4px" }}><input placeholder="g" value={ing.unit||""} onFocus={()=>{ if (unitResume.current === ing._id) unitResume.current = null; else unitAtFocus.current[ing._id] = ing.unit || ""; }} onBlur={e=>commitUnit(ing._id, e)} onChange={e=>updateIng(ing._id,"unit",e.target.value)} title={unitMismatch ? tx.unitMismatch(String(ing.unit).trim()) : undefined} style={{ ...ist, width: 36, borderColor: unitMismatch ? "#F59E0B" : "#CCCCCC", background: unitMismatch ? "#FFFBEB" : "#FFFFFF" }} /></td>
                  <td style={{ padding: "3px 4px" }}>
                    {linkedMat ? (
                      // v11: 百科关联优先,品牌只读显示 linkedMatBrand(改品牌需解除关联重新选)。
                      // 2026-09-29 第 2 批 2b C3:以前只有配方页锁,组件 / 部分编辑页关联了百科还能手改品牌,改了也不起作用
                      <div title={lang === "zh" ? "已从材料百科关联,品牌随百科条目锁定" : "材料事典連動中"} style={{ width: 78, padding: "4px 3px", fontSize: 11, color: "#059669", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        🔗 {linkedMatBrand ? (lang === "zh" ? (linkedMatBrand.nameZh || linkedMatBrand.nameJa) : (linkedMatBrand.nameJa || linkedMatBrand.nameZh)) : (ing.brand || "—")}
                      </div>
                    ) : linked ? (
                      <select value={typeof ing.brandIdx === "number" ? ing.brandIdx : ""} onChange={e => onBrandSelect(e.target.value)} style={{ ...ist, width: 78, padding: "4px 3px" }} title={lang === "zh" ? "从价格表选品牌" : "価格表から選ぶ"}>
                        <option value="">{lang === "zh" ? "—未定—" : "—未定—"}</option>
                        {linkedCat.brands.map((b, bi) => <option key={bi} value={bi}>{getBrandName(b, lang)}</option>)}
                      </select>
                    ) : (
                      <input list={v.listIds.brand} placeholder={tx.brand} value={ing.brand||""} onChange={e=>updateIng(ing._id,"brand",e.target.value)} style={{ ...ist, width: 66 }} />
                    )}
                  </td>
                  <td style={{ padding: "3px 4px", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      {/* C5:g / ml / 空 的行按每 100g 填(存的仍是每克价),其他单位按每单位填 */}
                      <IngPriceInput ing={ing} placeholder={`${curOf(ing) === "CNY" ? "¥" : "円"}/${basis.label}`}
                        onChangeStored={p=>updateQtyOrPrice(ing._id,"unitPrice",p)}
                        // 改过价:黄框黄底。两个键一直都在(没改过时写回和 ist 一样的值):键时有时无,React 会先清掉 borderColor,把 border 简写里的颜色也清掉
                        style={{ ...ist, width: 52, borderColor: ing._priceModified ? "#F59E0B" : "#CCCCCC", background: ing._priceModified ? "#FFFBEB" : "#FFFFFF" }} />
                      {/* v17: 手写价的币种。关联了百科就跟百科走,这里只管手写的那些 */}
                      {curBtnShown && ingCurBtn(ing, patch => setIngs(prev => prev.map(i => i._id === ing._id ? { ...i, ...patch } : i)), lang)}
                      {/* 口径小字:填好数以后占位符看不见了,这里一直写着按什么填 */}
                      <span style={{ fontSize: 10, color: T.textTertiary, whiteSpace: "nowrap" }}>{curBtnShown ? "" : (curOf(ing) === "CNY" ? "¥" : "円")}/{basis.label}</span>
                      {ing._priceModified && (
                        <button onClick={() => revertPrice(ing._id)} title={(lang === "zh" ? "撤销改价 (原 " : "改価取消 (元 ") + fmtUnitPrice(ing._originalPrice, curOf(ing)) + ")"} style={{ padding: "2px 4px", fontSize: 11, background: "#FEF3C7", border: "0.5px solid #F59E0B", borderRadius: 3, cursor: "pointer", color: "#92400E" }}>↺</button>
                      )}
                    </div>
                    {priceDrift !== null && (
                      <button onClick={() => {
                        setIngs(prev => prev.map(i => {
                          if (i._id !== ing._id) return i;
                          const q = parseFloat(i.qty) || 0;
                          return { ...i, unitPrice: String(priceDrift), cost: q > 0 ? (q * priceDrift).toFixed(1) : i.cost };
                        }));
                      }} style={{ display: "block", width: "100%", marginTop: 2, fontSize: 10, padding: "1px 3px", background: "#FEF3C7", border: "0.5px solid #F59E0B", borderRadius: 3, cursor: "pointer", color: "#92400E" }} title={tx.drift}>→ {fmtUnitPrice(priceDrift, "JPY")}</button>
                    )}
                  </td>
                  <td style={{ padding: "3px 4px" }}><input type="number" placeholder={tx.cost} value={ing.cost||""} onChange={e=>updateIng(ing._id,"cost",e.target.value)} onWheel={blurOnWheel} style={{ ...ist, width: 56, textAlign: "right" }} /></td>
                  <td style={{ padding: "3px 4px" }}>
                    {/* 认不出的分组值下拉显示「未分组」;不去动它,她选了别的才改 */}
                    <select value={grp} onChange={e=>updateIng(ing._id,"group",e.target.value)} style={{ ...ist, width: 80, padding: "4px 3px" }}>
                      {Object.entries(GROUPS).map(([k, gv]) => <option key={k} value={k}>{lang === "zh" ? gv.zh : gv.ja}</option>)}
                    </select>
                  </td>
                  {/* 备注:三页都有(2026-09-29 第 2 批 2b C1,以前组件 / 部分编辑页看不见,组件 106 行、部分 61 行备注改不了) */}
                  <td style={{ padding: "3px 4px" }}><input placeholder={tx.note} value={ing.note||""} onChange={e=>updateIng(ing._id,"note",e.target.value)} style={{ ...ist, width: 120, fontSize: 11 }} /></td>
                  <td style={{ padding: "3px 4px" }}><button onClick={() => setIngs(prev=>prev.filter(i=>i._id !== ing._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#666666", fontSize: 15, padding: "2px 4px" }}>×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 品牌格的自动补全(旧价格表的品牌名) */}
        <datalist id={v.listIds.brand}>
          {brandSuggestions.map(n => <option key={n} value={n} />)}
        </datalist>
      </div>
    </>
  );
}

// 🔗 选材料 / 🤖 批量关联:把一条材料百科写进配料行(两个弹窗、三个编辑页共用同一个写法)
function linkMaterialToIng(i, mat, brands, lang) {
  const b = brands.find(x => x.id === mat.brandId);
  const pp = getMaterialEffectivePrice(mat);
  const q = parseFloat(i.qty) || 0;
  const ok = !isNaN(pp) && pp > 0;
  // C6:换了材料 = 价格重新从百科来,之前的改价标记作废,↺ 的原价也换成这次写进去的价(以前配方页选完材料一直是黄的)
  const { _priceModified, ...rest } = i;
  return {
    ...rest,
    materialId: mat.id,
    nameZh: i.nameZh || mat.nameZh || "",
    nameJa: i.nameJa || mat.nameJa || "",
    nameFr: i.nameFr || mat.nameFr || "",
    brand: b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : i.brand,
    unitPrice: !isNaN(pp) && pp > 0 ? String(pp) : i.unitPrice,
    // v17: pp 是 getMaterialEffectivePrice 出口折算后的人民币,写进 unitPrice 必须标 CNY,
    // 否则缺省当日元、算成本时再乘一次汇率,成本会被压低 23 倍
    currency: (!isNaN(pp) && pp > 0) ? "CNY" : i.currency,
    cost: (!isNaN(pp) && pp > 0 && q > 0) ? (q * pp).toFixed(1) : i.cost,
    _originalPrice: (ok ? String(pp) : i.unitPrice) || "",
  };
}

// 🔗 选材料弹窗的 onSelect 和名字联想下拉(C9)共用的写法:mat = null 是取消关联(改价标记跟着作废),否则 linkMaterialToIng
function applyMaterialPick(i, mat, brands, lang) {
  if (mat === null) { const { _priceModified, ...rest } = i; return { ...rest, materialId: null }; }
  return linkMaterialToIng(i, mat, brands, lang);
}
const pickMaterialForRow = (setIngs, rowId, mat, brands, lang) =>
  setIngs(prev => prev.map(i => i._id !== rowId ? i : applyMaterialPick(i, mat, brands, lang)));

// 保存时哪些配料行留下:中文名或日文名去掉空格后不为空(2026-09-29 第 2 批 2b C13,三页统一)。
// 以前按「有没有值」,只有空格的行也会存下来,但跟组件库比较(_ingContentKey)和整体配方 / 采购(creationBatch)又把它当空行,两边对不上
const ingHasName = (i) => !!i && !!(String(i.nameZh == null ? "" : i.nameZh).trim() || String(i.nameJa == null ? "" : i.nameJa).trim());

// C6:改了价的关联行写进本店原料(三个编辑页保存时共用;写法同 v11 配方页:有就改价,没有就新建一条,带币种和修改时间)。
// rows 是保存时刷新过的行;返回 { n: 写了几条, undo }。
// 审查第 2 轮:默认勾着会直接盖掉本店原料原来的进货价,所以给撤销(2a §09「先做 + 给撤销」):
// 改掉的条目记下原样、新建的记下 id;撤销时只动「还是这次写的那个价」的条目,之后她又改过的不碰
function saveIngPricesToShop(rows, setShopMaterials) {
  // 只存按克计量的行:本店原料 pricePerG 是每克价,「本 / 個 / kg」行填的是每单位价,存进去会把每克价放大几十上千倍(审查第 1 轮)
  const toUpsert = rows.filter(i => i._priceModified && i.materialId && isGramUnit(i.unit) && parseFloat(i.unitPrice) > 0);
  if (toUpsert.length === 0 || typeof setShopMaterials !== "function") return { n: 0, undo: null };
  // 新 id 和时间在 updater 外面定好:开发模式 StrictMode 会把 updater 跑两遍,两遍结果要一样
  const now = new Date().toISOString();
  const plan = toUpsert.map(ing => ({ ing, newId: "sm_" + Date.now() + Math.random().toString(36).slice(2, 6) }));
  let prevById = {}, written = {}, addedIds = new Set();
  setShopMaterials(prev => {
    prevById = {}; written = {}; addedIds = new Set();   // updater 可能跑两遍,每遍从头记
    const next = [...prev];
    plan.forEach(({ ing, newId }) => {
      const idx = next.findIndex(sm => sm.materialId === ing.materialId);
      if (idx >= 0) {
        const old = next[idx];
        if (!addedIds.has(old.id) && !(old.id in prevById)) prevById[old.id] = old;   // 同一材料两行时只记最早的原样
        next[idx] = { ...old, pricePerG: String(parseFloat(ing.unitPrice)), currency: curOf(ing), updatedAt: now };   // v17: 币种跟手写价走;修改时间给合并导入用
        written[old.id] = next[idx];
      } else {
        next.push({
          id: newId,
          materialId: ing.materialId,
          pricePerG: String(parseFloat(ing.unitPrice)),
          currency: curOf(ing),   // v17
          updatedAt: now,
        });
        addedIds.add(newId);
        written[newId] = next[next.length - 1];
      }
    });
    return next;
  });
  // 还是这次写进去的那个价(没被她之后再改过)才撤
  const untouched = (sm) => { const w = written[sm.id]; return !!w && sm.pricePerG === w.pricePerG && curOf(sm) === curOf(w) && sm.updatedAt === w.updatedAt; };
  const undo = () => setShopMaterials(prev => prev
    .filter(sm => !(addedIds.has(sm.id) && untouched(sm)))
    .map(sm => (prevById[sm.id] && untouched(sm)) ? prevById[sm.id] : sm));
  return { n: toUpsert.length, undo };
}

// 保存时刷新关联行的价(三个编辑页共用):材料已删 → 清掉关联;改过价的行保留她填的价(C6,以前只有配方页这样);
// 其余按材料百科(本店价优先)的最新价刷新。pp 是人民币,必须标 CNY
function refreshIngForSave(i, materials) {
  if (!i.materialId) return i;
  const m = (materials || []).find(x => x.id === i.materialId);
  if (!m) { const { _priceModified, ...rest } = i; return { ...rest, materialId: null }; }
  if (i._priceModified) return i;
  const pp = getMaterialEffectivePrice(m);
  if (isNaN(pp) || pp <= 0) return i;
  const q = parseFloat(i.qty) || 0;
  return { ...i, unitPrice: String(pp), currency: "CNY", cost: q > 0 ? (q * pp).toFixed(1) : i.cost };
}

// C6:改了「关联材料百科」的行的单价 → 提示条 + 「同时保存到本店原料」(默认勾上)。三个编辑页共用
function PriceChangeBanner({ ings, saveToShop, setSaveToShop, lang }) {
  const mod = ings.filter(i => i._priceModified);
  if (mod.length === 0) return null;
  const ok = mod.filter(i => i.materialId && isGramUnit(i.unit) && parseFloat(i.unitPrice) > 0).length;   // 和 saveIngPricesToShop 同一条件
  const nonGram = mod.some(i => i.materialId && !isGramUnit(i.unit));
  const zh = lang === "zh";
  // 09-29 浏览器实测补:这种行改的价不光存不进本店原料,材料百科有价时成本也不按它算(getIngUnitPrice 关联行取材料的价),以前只说了前半句
  const nonGramText = zh ? "按「本 / 個」这类单位计量的行,改的单价不会存到本店原料;材料百科有价时,成本也还是按材料的每克价算(单位对不上,见单位格的黄框)。要按每本 / 每个算,点行首 🔗「取消关联」,再填每本的价。" : "本・個などの単位の行は、変更した単価が仕入れ原料に保存されません。材料事典に価格がある場合、原価も材料のグラム単価で計算されます。1本・1個あたりで計算するには、行頭の 🔗 で連動を解除してから単価を入力してください。";
  return (
    <div style={{ background: "#FFFBEB", border: "0.5px solid #F59E0B", borderRadius: 8, padding: "12px 14px", marginTop: 12, marginBottom: 8 }}>
      <div style={{ fontSize: 13, color: "#92400E", marginBottom: 6 }}>
        🟡 {zh ? `你改了 ${mod.length} 项关联材料百科的原料单价。` : `材料事典に連動した ${mod.length} 件の単価を変更しました。`}
      </div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: ok > 0 ? "pointer" : "not-allowed", opacity: ok > 0 ? 1 : 0.5 }}>
        <input type="checkbox" checked={saveToShop} onChange={e => setSaveToShop(e.target.checked)} disabled={ok === 0} style={{ marginTop: 2 }} />
        <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.5 }}>
          {zh
            ? (ok > 0 ? <>同时保存到本店原料（<b>{ok}</b> 项。存了以后，所有用到这个材料的配方 / 组件都按这个价算成本）</> : (nonGram ? nonGramText : <>单价要大于 0 才能保存到本店原料</>))
            : (ok > 0 ? <>仕入れ原料にも保存（<b>{ok}</b> 件。この材料を使うすべてのレシピ / コンポーネントの原価がこの単価になります）</> : (nonGram ? nonGramText : <>単価が 0 より大きい行だけ仕入れ原料に保存できます</>))}
        </div>
      </label>
      {ok > 0 && nonGram && (
        <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.5, marginTop: 6 }}>{nonGramText}</div>
      )}
      {/* 只在「能存、但她取消了勾」时说;本来就存不了(本 / 個 行、单价 0)时上面已经说了原因 */}
      {ok > 0 && !saveToShop && (
        <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.5, marginTop: 6 }}>
          {zh ? "不存的话，这几行保存后还是按材料百科的价算。" : "保存しない場合、これらの行は保存後も材料事典の単価で計算されます。"}
        </div>
      )}
    </div>
  );
}

// 配料表的两个弹窗。渲染在编辑页根元素里(useDirtyGuard 靠根元素的捕获阶段拍快照),位置和以前一样。
// pickerTargetIngId:要选材料的那一行的 _id(可能是 0,所以判断用 !== null)
function IngredientLinkModals({ variant, ings, setIngs, materials, brands, lang, pickerTargetIngId, setPickerTargetIngId, showBulkMatch, setShowBulkMatch }) {
  const where = (ING_TABLE_VARIANTS[variant] || ING_TABLE_VARIANTS.recipe).where;
  return (
    <>
      {/* 🔗 材料百科选择弹窗 */}
      {pickerTargetIngId !== null && (
        <MaterialPickerModal
          materials={materials}
          brands={brands}
          currentMaterialId={(ings.find(i => i._id === pickerTargetIngId) || {}).materialId || null}
          lang={lang}
          onClose={() => setPickerTargetIngId(null)}
          onSelect={(mat) => {
            pickMaterialForRow(setIngs, pickerTargetIngId, mat, brands, lang);   // 选中 / 取消关联;名字联想(C9)点一条也走这个
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
          where={lang === "zh" ? where.zh : where.ja}
          onClose={() => setShowBulkMatch(false)}
          onApply={(selections) => {
            setIngs(prev => prev.map(i => {
              const matId = selections[i._id];
              if (matId == null) return i;
              const mat = materials.find(m => m.id === matId);
              if (!mat) return i;
              return linkMaterialToIng(i, mat, brands, lang);
            }));
            setShowBulkMatch(false);
          }}
        />
      )}
    </>
  );
}


// ─── 组件编辑 Form ────────────────────────────────────────────────
function ComponentEditForm({ component, cats, brands = [], materials = [], onSave, onDelete, onBack, onQuickAddKnowledge, lang = "zh", setLang, customCompCats = [], onAddCustomCompCat, onUpdateCats, setShopMaterials, showToast, confirmDialog }) {
  const [pickerTargetIngId, setPickerTargetIngId] = useState(null); // 材料选择弹窗
  const [showBulkMatch, setShowBulkMatch] = useState(false); // 🤖 批量关联
  const [errorMsg, setErrorMsg] = useState("");
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  // 2026-09-29 体检第 2 批:新建分类的小输入框(以前用 prompt);null = 没打开
  const [newCat, setNewCat] = useState(null);
  const addNewCat = () => {
    const zh = ((newCat && newCat.zh) || "").trim();
    if (!zh) return;
    const ja = ((newCat && newCat.ja) || "").trim() || zh;
    const newId = "custom_" + Date.now();
    const colorIdx = customCompCats.length % CUSTOM_CAT_COLORS.length;
    const cat = { id: newId, zh, ja, color: CUSTOM_CAT_COLORS[colorIdx].color, bg: CUSTOM_CAT_COLORS[colorIdx].bg, custom: true };
    if (onAddCustomCompCat) onAddCustomCompCat(cat);
    setForm(prev => ({ ...prev, componentCategory: newId }));
    setNewCat(null);
  };
  // 矩阵空格新建时传进来的是「只带预设分类 / 风味、没有 id」的对象,也算新建(以前当成编辑已有组件,存出来 id 是空的)
  const isNew = !component || !component.id;
  const empty = { nameZh: "", nameJa: "", nameFr: "", componentCategory: "mousse", flavorFamily: "", flavorName: "", mold: "", yield: "", unit: "g", notesZh: "", notesJa: "", ingredients: [], stepsZh: [], stepsJa: [], imageUrls: [] };
  const [form, setForm] = useState(component ? { flavorFamily: "", flavorName: "", ...component } : empty);
  const [ings, setIngs] = useState(component && (component.ingredients || []).length > 0
    ? component.ingredients.map((i, idx) => {
        const linked = autoLinkIng(i, cats);
        if (linked.materialId && Array.isArray(materials)) {
          const m = materials.find(x => x.id === linked.materialId);
          if (m) {
            const pp = getMaterialEffectivePrice(m);
            if (!isNaN(pp) && pp > 0) {
              const q = parseFloat(linked.qty) || 0;
              return { ...linked, _id: idx, unitPrice: String(pp), currency: "CNY", _originalPrice: String(pp), cost: q > 0 ? (q * pp).toFixed(1) : linked.cost };  // v17: pp 已折成人民币,不标 CNY 会被当日元再乘一次汇率
            }
          }
        }
        return { ...linked, _id: idx, _originalPrice: linked.unitPrice || "" };   // C6:_originalPrice = 改价追踪 / ↺ 的原价(保存时去掉)
      })
    : [{ _id: 0, nameZh: "", nameJa: "", nameFr: "", qty: "", unit: "g", brand: "", unitPrice: "", currency: "CNY", cost: "", catId: null, brandIdx: null }]);
  const [saveToShop, setSaveToShop] = useState(true);   // C6:改了关联材料的价 → 保存时同时写本店原料(默认勾上)

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
  const dirtyBind = useDirtyGuard(() => ({ form, ings, steps }));   // 没保存就切页时 App 先问一句
  const leave = () => confirmLeave(dirtyBind.isDirty, confirmDialog, lang, onBack);   // C15:「← 返回」「取消」有改动先问

  const totalCost = ings.reduce((s, i) => s + toCNY(i.cost, curOf(i)), 0);  // v17: 各按各的币种折成人民币再相加

  // 未关联材料对话框 state
  const [unlinkedDialog, setUnlinkedDialog] = useState(null); // null | { items: [...] }

  const doSave = (finalIngs) => {
    const validIngs = finalIngs.filter(ingHasName);   // C13:名字只有空格的行不存
    // 🔗 自动用材料百科最新价刷新有 materialId 的 ing;改过价的保留她填的价(C6)
    const refreshedIngs = validIngs.map(i => refreshIngForSave(i, materials));
    if (saveToShop) {
      const { n, undo } = saveIngPricesToShop(refreshedIngs, setShopMaterials);   // 审查第 2 轮:给撤销
      if (n > 0 && typeof showToast === "function") showToast(lang === "zh" ? `✓ ${n} 项已保存到本店原料` : `✓ ${n} 件を仕入れ原料に保存`, { undo });
    }
    const total = refreshedIngs.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
    const { stepsZh, stepsJa } = stepsForSave(steps);   // C11:中日按行对齐存(中间空着的留 "")
    onSave({
      ...form,
      id: (component && component.id) ? component.id : "comp_" + Date.now(),
      yield: parseFloat(form.yield) || 0,
      ingredients: refreshedIngs.map(({ _id, _priceModified, _originalPrice, ...rest }) => rest),
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
    // 2026-09-29:不再弹「有 N 个材料未在价格表中」。那张旧价格表(cats)v11 起已停用,配方编辑页早就去掉了这一步;
    // 组件这里还在弹,33 个组件里 30 个一保存就弹,点「加入并保存」还会往停用的表里写日元人民币混着的数
    doSave(ings);
  };

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };
  const cat = getCompCat(form.componentCategory);

  return (
    <div {...dirtyBind}>
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
          <Btn onClick={leave}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* 💡 懒人模式提示 */}
      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：中文名必填，日文可以不填。备注、步骤中日文任一填写即可。
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
                  // 2026-09-29 体检第 2 批:以前连弹两个浏览器自带输入框(prompt),嵌入环境里可能不弹;改成下拉下面的小输入框
                  setNewCat({ zh: "", ja: "" });
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
            {newCat && (
              <div style={{ marginTop: 6, padding: 8, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgMuted, display: "flex", flexDirection: "column", gap: 6 }}
                onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); setNewCat(null); } }}>
                <input autoFocus value={newCat.zh} onChange={e => setNewCat(p => ({ ...p, zh: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addNewCat(); } }}
                  placeholder={lang === "zh" ? "新分类名称（中文）" : "新しい分類名（中国語）"} style={{ ...inpStyle, fontSize: 12 }} />
                <input value={newCat.ja} onChange={e => setNewCat(p => ({ ...p, ja: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addNewCat(); } }}
                  placeholder={lang === "zh" ? "日文名（留空则同中文）" : "日本語名（空欄なら中国語と同じ）"} style={{ ...inpStyle, fontSize: 12 }} />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Btn size="sm" variant="ghost" onClick={() => setNewCat(null)}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
                  <Btn size="sm" variant="primary" disabled={!newCat.zh.trim()} onClick={addNewCat}>{lang === "zh" ? "添加" : "追加"}</Btn>
                </div>
              </div>
            )}
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
          {/* v17.8: 备货 = 整批做好存着(千层面团、泡芙壳这类),组合产品的整体配方里只写「从库存取多少」 */}
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "备货" : "作り置き"}</label>
            <label title={lang === "zh" ? "整批做好存着，组合产品的整体配方里只写「从库存取多少」" : "まとめて仕込んで保管。組立製品のレシピでは「ストックから何 g」だけ表示"}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 0", cursor: "pointer", color: T.textSecondary }}>
              <input type="checkbox" checked={form.prepMode === "stock"} onChange={e => setForm(prev => ({ ...prev, prepMode: e.target.checked ? "stock" : undefined }))} />
              {lang === "zh" ? "整批做好存着" : "まとめて仕込み"}
            </label>
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
        {/* 配料表:三个编辑页共用 IngredientTable,差异在 ING_TABLE_VARIANTS.component */}
        <IngredientTable variant="component" ings={ings} setIngs={setIngs} nextIdRef={nextIngId} cats={cats} materials={materials} brands={brands} lang={lang}
          onPickMaterial={setPickerTargetIngId} onOpenBulk={() => setShowBulkMatch(true)} />
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

      {/* C6:改了关联材料百科的单价 → 提示条 + 保存到本店原料 */}
      <PriceChangeBanner ings={ings} saveToShop={saveToShop} setSaveToShop={setSaveToShop} lang={lang} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
        {errorMsg && <span style={{ color: "#A32D2D", fontSize: 13, marginRight: 8 }}>⚠ {errorMsg}</span>}
        <Btn onClick={leave}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
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

      {/* 🔗 选材料 / 🤖 批量关联 两个弹窗(三个编辑页共用,见 IngredientLinkModals) */}
      <IngredientLinkModals variant="component" ings={ings} setIngs={setIngs} materials={materials} brands={brands} lang={lang}
        pickerTargetIngId={pickerTargetIngId} setPickerTargetIngId={setPickerTargetIngId} showBulkMatch={showBulkMatch} setShowBulkMatch={setShowBulkMatch} />

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
      {/* minmax(0, …):输入框自带最小宽度,手机上以前把整页撑出横向滚动 */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) auto", gap: 6, alignItems: "center" }}>
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
  // 2026-09-29 体检第 2 批(审查发现):切页时 goTab 会关掉家族编辑层,没接离开保护的话改了一半直接丢
  const dirtyBind = useDirtyGuard(() => ({ form, newTag }));

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
    <div {...dirtyBind}>
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
function FamilyDetail({ family, recipes, creations = [], lang, onEdit, onBack, onViewRecipe, onViewCreation }) {
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  const familyRecipes = recipes.filter(r => r.familyId === family.id);
  // v17.8: 挂了这个家族的组合产品(比如 Framboisier)也列出来;不参与原料对比
  const familyCreations = (creations || []).filter(c => c && c.familyId === family.id);
  const fam = family;
  const famName = lang === "zh" ? (fam.nameZh || fam.nameJa) : (fam.nameJa || fam.nameZh);
  const color = FAMILY_COLORS[fam.colorIdx || 0];

  // 2026-09-29 体检第 2 批:以前勾第 4 个时在 setState 里弹浏览器原生 alert(项目禁用,嵌入环境可能不显示)—— 改成按钮旁的一行提示
  const [compareLimitHit, setCompareLimitHit] = useState(false);
  const toggleCompare = (rid) => {
    if (!selectedForCompare.includes(rid) && selectedForCompare.length >= 3) {
      setCompareLimitHit(true);
      return;
    }
    setCompareLimitHit(false);
    setSelectedForCompare(prev => {
      if (prev.includes(rid)) return prev.filter(x => x !== rid);
      if (prev.length >= 3) return prev;
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
          <div style={{ background: color.bg, color: color.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{familyRecipes.length} 个变体{familyCreations.length > 0 ? ` · ${familyCreations.length} 个组合产品` : ""}</div>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {compareMode && compareLimitHit && (
              <span role="status" style={{ fontSize: 12, color: T.warning }}>
                {lang === "zh" ? "最多对比 3 个变体，先取消一个再勾" : "比較は 3 件まで。1 件外してから選んでください"}
              </span>
            )}
            <Btn size="sm" variant={compareMode ? "primary" : "default"} onClick={() => { setCompareMode(!compareMode); setSelectedForCompare([]); setCompareLimitHit(false); }}>
              {compareMode ? "退出对比" : "⚖ 对比模式"}
            </Btn>
          </div>
        )}
      </div>

      {familyRecipes.length === 0 ? (familyCreations.length > 0 ? null : (
        <div style={{ background: "#F9FAFB", border: "1px dashed #CCC", borderRadius: 8, padding: "2rem", textAlign: "center", color: "#666", fontSize: 13 }}>
          这个家族还没有变体。<br />
          在配方一览里新建或编辑配方，选择归属到这个家族。
        </div>
      )) : (
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

      {/* v17.8: 这个家族里的组合产品 */}
      {familyCreations.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10 }}>🧩 {lang === "zh" ? "组合产品" : "組立製品"}（{familyCreations.length}）</div>
          <div style={{ display: "grid", gap: 8 }}>
            {familyCreations.map(cr => (
              <div key={cr.id} onClick={() => onViewCreation && onViewCreation(cr.id)}
                style={{ background: "#FFFFFF", border: "0.5px solid #E5E5E5", borderRadius: 8, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, color: T.info, border: `0.5px solid ${T.info}`, padding: "0 6px", borderRadius: T.radiusPill }}>{lang === "zh" ? "组合" : "組立"}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{cr.nameFr && cr.nameFr !== pickLang(cr, "name", lang) ? `${cr.nameFr} · ` : ""}{pickLang(cr, "name", lang)}</span>
                <span style={{ color: "#999", fontSize: 12 }}>→</span>
              </div>
            ))}
          </div>
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

// 默认 LOGO(用户可在打印预览「⚙ LOGO设置」换成自己的图片网址)。
// 2026-09-29:从旧的「R」花体占位图换成定稿字标 —— 桌面「kororā logo相关/线稿版/字标_kororā_纯黑.svg」原样内嵌(纯黑矢量,黑白打印最清楚)
const DEFAULT_LOGO_SVG = `<svg id="a" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270.91 54.12"><defs><style>.b{fill:#000000;}</style></defs><path class="b" d="M265.57,2.31c-.1-.12-.25-.18-.4-.18l-17.5,.6c-.23,0-.43,.18-.47,.4l-.77,3.97c-.03,.15,.01,.3,.11,.42s.25,.18,.4,.18l17.5-.6c.23,0,.43-.18,.47-.4l.77-3.97c.03-.15-.01-.3-.11-.42Z"/><path d="M88.51,28.14c-.75-4.86-3.61-8.46-7.97-10.8h0s-.09-.05-.13-.07c-.03-.02-.06-.04-.1-.06-.18-.09-.33-.17-.47-.2-1.84-.82-3.74-1.43-5.65-1.73-.8-.13-1.06,.04-1.13,.87-.16,1.96-.42,3.91-.64,5.86-.09,.83-.08,1.36,.15,1.76,.03,.05,.1,.14,.59,.64,.36,.36,.55,.55,.9,.87,.49,.45,3.25,4.21,2.73,9.44-.07,.75-.63,5.16-4,8.28-1.95,1.81-4.25,2.69-6.97,2.05-2.61-.62-4.61-3.27-4.91-6.47-.37-3.82,.44-7.13,2.55-9.86,.78-1.01,1.73-1.94,2.88-2.79,1.25-.93,1.39-1.43,.91-2.98-.58-1.88-1.2-3.75-1.71-5.64-.22-.8-.5-.92-1.27-.64-2.05,.73-4.03,1.82-5.86,3.18-5.87,4.37-10.09,11.59-9.56,19.37,.24,3.48,1.35,6.62,3.66,9.29,3.5,4.04,8.06,5.57,13.22,5.6,4.68,.02,8.97-1.27,12.74-3.92,7.59-5.33,11.52-12.54,10.04-22.07Z"/><path d="M183.23,28.14c-.75-4.86-3.61-8.46-7.97-10.8h0s-.09-.05-.13-.07c-.03-.02-.06-.04-.1-.06-.18-.09-.33-.17-.47-.2-1.84-.82-3.74-1.43-5.65-1.73-.8-.13-1.06,.04-1.13,.87-.16,1.96-.42,3.91-.64,5.86-.09,.83-.08,1.36,.15,1.76,.03,.05,.1,.14,.59,.64,.36,.36,.55,.55,.9,.87,.49,.45,3.25,4.21,2.73,9.44-.07,.75-.63,5.16-4,8.28-1.95,1.81-4.25,2.69-6.97,2.05-2.61-.62-4.61-3.27-4.91-6.47-.37-3.82,.44-7.13,2.55-9.86,.78-1.01,1.73-1.94,2.88-2.79,1.25-.93,1.39-1.43,.91-2.98-.58-1.88-1.2-3.75-1.71-5.64-.22-.8-.5-.92-1.27-.64-2.05,.73-4.03,1.82-5.86,3.18-5.87,4.37-10.09,11.59-9.56,19.37,.24,3.48,1.35,6.62,3.66,9.29,3.5,4.04,8.06,5.57,13.22,5.6,4.68,.02,8.97-1.27,12.74-3.92,7.59-5.33,11.52-12.54,10.04-22.07Z"/><path d="M132.29,14.97c-.41,.07-.82,.07-1.23,.17-2.58,.65-4.9,1.83-7.04,3.37-2.42,1.74-4.54,3.81-6.68,6.16,0-.5-.05-.78-.01-1.06,.3-2.15,.6-4.31,.94-6.45,.08-.51,0-.72-.46-.8h-3.91c-2.06,.09-4.12-.02-6.17-.04-.89-.01-1.14,.33-1.24,1.04-.8,5.63-1.61,11.27-2.4,16.9-.88,6.27-1.73,12.54-2.66,18.8-.14,.95,.11,1.06,.94,1.05,3.32-.04,6.63-.04,9.95,0,.91,0,1.25-.35,1.27-1.24,.06-3.12,.51-6.19,1.38-9.18,2.19-7.46,6.47-13.16,13.74-16.34,.59-.26,1.15-.55,1.7-.86,.72-.41,1.15-.96,1.26-1.8,.4-3.04,.83-6.08,1.26-9.12,.07-.53-.07-.7-.62-.61Z"/><path d="M225.24,14.97c-.41,.07-.82,.07-1.23,.17-2.58,.65-4.9,1.83-7.04,3.37-2.42,1.74-4.54,3.81-6.68,6.16,0-.5-.05-.78-.01-1.06,.3-2.15,.6-4.31,.94-6.45,.08-.51,0-.72-.46-.8h-3.91c-2.06,.09-4.12-.02-6.17-.04-.89-.01-1.14,.33-1.24,1.04-.8,5.63-1.61,11.27-2.4,16.9-.88,6.27-1.73,12.54-2.66,18.8-.14,.95,.11,1.06,.94,1.05,3.32-.04,6.63-.04,9.95,0,.91,0,1.25-.35,1.27-1.24,.06-3.12,.51-6.19,1.38-9.18,2.19-7.46,6.47-13.16,13.74-16.34,.59-.26,1.15-.55,1.7-.86,.72-.41,1.15-.96,1.26-1.8,.4-3.04,.83-6.08,1.26-9.12,.07-.53-.07-.7-.62-.61Z"/><path d="M29.6,54.1c-1.19,0-2.38-.04-3.57,.02-.59,.03-.95-.21-1.23-.93-.49-1.3-1-2.58-1.51-3.86-.46-1.15-.38-.85-1.08-2.74-.92-2.5-1.34-3.77-1.29-4.2,.08-.68,1.5-1.96,4.33-4.5,1.1-.99,2.04-1.79,2.64-1.56,.36,.14,.42,.6,.48,.75,1.81,5.25,3.64,10.49,5.5,15.71,.21,.6,.28,.97,.09,1.16-.18,.18-.53,.15-.68,.14-.77-.05-1.94-.05-3.67,.01Z"/><path d="M30.02,16.21c-1.01-.01-1.77,.32-2.45,1.06-2.69,2.94-5.42,5.85-8.13,8.77-1.34,1.44-2.69,2.88-4.04,4.31l-.2-.08c.02-.35,.03-.7,.07-1.05,.37-3.18,.75-6.36,1.12-9.53,.48-4.07,.96-8.14,1.44-12.2,.09-.78,.36-3.06,.72-6.1,.03-.25,.05-.5,.09-.75s.09-.44-.02-.55c-.07-.07-.17-.08-.24-.07H7.68s-.07,0-.11,.03c-.01,.01-.02,.02-.02,.03l-.09,.65v.02l-.12,.83h0L3.75,27.06h0c-.32,2.32-.65,4.63-.97,6.95C1.87,40.44,.98,46.87,.03,53.29c-.12,.8,.17,.84,.78,.83,3.25-.02,6.5-.02,9.76,0,.73,0,1.12-.22,1.22-1,.31-2.41,.67-4.81,1.01-7.22,.08-.6,.14-1.17,.6-1.66,8.33-8.98,16.65-17.97,24.97-26.96,.22-.24,.58-.41,.54-1.05-2.96,0-5.92,.02-8.88-.01Z"/><path class="b" d="M269.99,16.44c-1.7,.06-3.41,.01-5.12,.02-1.19,0-2.38,0-3.57,.02-.51,.01-1,.07-1.11,.79-.85,5.92-1.73,11.83-2.61,17.75-.46,3.07-1.5,5.89-3.59,8.21-1.81,2.01-4.09,2.67-6.72,1.9-2.53-.74-3.89-2.58-4.39-5.08-.23-1.17-1.3-5.19,.91-8.97,.34-.59,1.68-2.88,4.26-4.27,.21-.11,.61-.3,1.02-.49,.32-.15,1.44-.57,1.77-.8,.22-.17,.41-.37,.41-.37l.02-.03c.55-.62,.99-4.44,.99-4.44h0c.15-1.04,.57-3.07,.49-4.43,0-.17-.04-.54-.3-.79-.35-.33-.91-.26-1.17-.23-5.1,.73-7.61,2.04-7.61,2.04-1.77,.92-3.95,2.06-6.25,4.32-3.82,3.76-5.32,8.02-5.93,10.27,0,0-1.51,4.95-.97,10.66,.21,2.16,.65,3.62,1.23,4.85,.44,.92,.99,1.8,1.66,2.62,2.06,2.52,4.74,3.71,7.89,4.04,4.3,.44,8.17-.45,11.38-3.44,.6-.56,1.23-1.1,1.99-1.77,.11,1.18,.25,2.19,.28,3.21,.02,.68,.29,.89,.94,.89,2.9-.02,5.8-.01,8.7,0,.69,0,1.03-.25,1.13-.98,.36-2.63,.79-5.25,1.18-7.87,.84-5.63,1.66-11.26,2.5-16.89,.48-3.23,.97-6.45,1.46-9.68,.11-.71-.04-1.06-.88-1.04Z"/></svg>`;

const LOGO_DATA_URI = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(DEFAULT_LOGO_SVG)));

// ─── 打印设置弹窗 ─────────────
function PrintModal({ onClose, onConfirm, itemType }) {
  // 每个模板的推荐默认勾选（用户可改）
  const TEMPLATE_DEFAULTS = {
    // 2026-09-29 体检第 2 批:以前还有「图片」「关联知识点」两个勾选,三个模板都没读,勾不勾印出来一样 —— 去掉
    kitchen:  { ingredients: true, steps: false, notes: true }, // 厨房：不要步骤
    showcase: { ingredients: true, steps: false, notes: true }, // 展示：不要步骤
    archive:  { ingredients: true, steps: true,  notes: true }, // 归档：全部
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
  // v17.8: 组合产品的整体配方只有一种版式(A4 生产单),只选语言和印不印做法 / 备注
  const isCreation = itemType === "creation";
  const [cSections, setCSections] = useState({ steps: true, notes: false });

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "1.5rem", maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>🖨 打印设置</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#999" }}>×</button>
        </div>

        {isCreation && (
          <div style={{ fontSize: 12, color: "#666", marginBottom: 16, lineHeight: 1.6 }}>
            📘 整体配方 · A4 生产单：每部分的量和做法，最后是组装。个数按详情页里填的算。
          </div>
        )}

        {/* 模板选择 */}
        {!isCreation && <div style={{ marginBottom: 16 }}>
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
        </div>}

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
        {isCreation ? (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>📝 显示内容</div>
            <div style={{ display: "grid", gap: 6 }}>
              {[["steps", "做法（每部分的步骤 + 整体组装）"], ["notes", "备注"]].map(([k, label]) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!cSections[k]} onChange={e => setCSections(prev => ({ ...prev, [k]: e.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ) : (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>📝 显示内容</div>
          <div style={{ display: "grid", gap: 6 }}>
            {[
              ["ingredients", "原料"],
              ["steps", "制作流程"],
              ["notes", "注意事项·备注"],
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
        )}

        <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 11, color: "#854F0B", lineHeight: 1.6 }}>
          💡 点击「打印预览」后，使用浏览器的「打印」(Ctrl+P / ⌘+P) 进行实际打印，或保存为PDF。<br />
          💰 价格信息不会打印（已隐藏）。
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn onClick={onClose}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
          <Btn variant="primary" onClick={() => onConfirm(isCreation ? { template: "creation", lang, sections: cSections } : { template, lang, sections })}>🖨 打印预览</Btn>
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
  // 2026-09-29 体检第 2 批:以前副标题清空保存后又被填回默认值、没设过时印写死的 PATISSERIE —— 现在空就是不印
  const [subtitleInput, setSubtitleInput] = useState(typeof printSettings.brandSubtitle === "string" ? printSettings.brandSubtitle : "");

  const logoSrc = printSettings.logoUrl || LOGO_DATA_URI;
  const brandName = printSettings.brandName || "kororā";
  const brandSubtitle = typeof printSettings.brandSubtitle === "string" ? printSettings.brandSubtitle.trim() : "";

  const doPrint = () => {
    window.print();
  };

  const saveLogo = () => {
    onUpdateSettings({ logoUrl: logoUrlInput.trim(), brandName: brandNameInput.trim() || "kororā", brandSubtitle: subtitleInput.trim() });
    setShowLogoUpload(false);
  };

  const resetLogo = () => {
    setLogoUrlInput("");
    onUpdateSettings({ logoUrl: "", brandName: brandNameInput.trim() || "kororā", brandSubtitle: subtitleInput.trim() });
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
          /* 2026-09-29 体检修:预览外层是「固定在屏幕上、自带滚动条」的框,打印时只有一页高,超出的被裁掉 ——
             多页的单子只印出第一页(或第一页重复几张)。打印时把外层放回正常文档流、不裁切,
             app 其余部分直接不排版(只 visibility:hidden 还会占位,多出白纸)。
             .print-area 行内写了 position:relative 和 min-height:297mm,要用 !important 盖掉。 */
          #root > div > *:not(.print-overlay) { display: none !important; }
          .print-overlay { position: static !important; overflow: visible !important; height: auto !important; }
          .print-area { position: static !important; min-height: 0 !important; width: 100%; }
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
          <Btn size="sm" onClick={() => setShowLogoUpload(true)} style={{ background: T.paper }}>{lang === "zh" ? "⚙ LOGO设置" : "⚙ ロゴ設定"}</Btn>
          <Btn size="sm" variant="primary" onClick={doPrint}>{lang === "zh" ? "🖨 打印 (Ctrl+P)" : "🖨 印刷 (Ctrl+P)"}</Btn>
          <Btn size="sm" onClick={onClose} style={{ background: T.paper }}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
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
              <input value={subtitleInput} onChange={e => setSubtitleInput(e.target.value)} placeholder={lang === "zh" ? "留空 = 不印副标题" : "空欄なら印刷しません"} style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, boxSizing: "border-box", fontFamily: T.fontSans }} />
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

        {itemType === "creation" ? (
          <CreationPrintTemplate data={item} lang={lang} sections={sections} brandName={brandName} brandSubtitle={brandSubtitle} />
        ) : (
          <>
            {template === "kitchen" && <KitchenTemplate item={item} itemType={itemType} lang={lang} sections={sections} logoSrc={logoSrc} brandName={brandName} brandSubtitle={brandSubtitle} />}
            {template === "showcase" && <ShowcaseTemplate item={item} itemType={itemType} lang={lang} sections={sections} logoSrc={logoSrc} brandName={brandName} brandSubtitle={brandSubtitle} />}
            {template === "archive" && <ArchiveTemplate item={item} itemType={itemType} lang={lang} sections={sections} logoSrc={logoSrc} brandName={brandName} brandSubtitle={brandSubtitle} />}
          </>
        )}
      </div>
    </>
  );
}

// 2026-09-29 体检第 2 批:三个老模板共用的小工具
// 原料按盆 ①→⑤ 排(同一盆内保持录入顺序),和屏幕一致;以前厨房版 / 归档版按录入顺序印,页脚却写「盆序 ①→⑤ 依次投料」
const printSortByBowl = (ings) => (ings || []).map((ing, i) => ({ ing, i }))
  .sort((a, b) => {
    const oa = GROUP_ORDER.indexOf(a.ing && GROUPS[a.ing.group] ? a.ing.group : "none");
    const ob = GROUP_ORDER.indexOf(b.ing && GROUPS[b.ing.group] ? b.ing.group : "none");
    return (oa - ob) || (a.i - b.i);
  })
  .map(x => x.ing);
// 总耗时 time:数字 = 分钟;文字(「约 30 分钟」)原样;0 / 空不印
const printTimeText = (t, lang) => {
  const s = t == null ? "" : String(t).trim();
  if (!s || s === "0") return "";
  if (/^\d+(\.\d+)?$/.test(s)) return lang === "ja" ? `${s} 分` : `${s} 分钟`;
  return s;
};
// 配方详情「缩放计算」后打印:抬头写「做 100 個(原 25 個 ×4)」;没缩放返回 null
const printScaleText = (item, lang) => {
  const p = item && item._printScale;
  if (!p) return null;
  const u = item.unit || "個";
  return lang === "ja"
    ? { main: `${fmtQty(p.to)} ${u} 仕込み`, sub: `(元 ${fmtQty(p.from)} ${u} ×${fmtQty(p.factor)})` }
    : { main: `做 ${fmtQty(p.to)} ${u}`, sub: `(原 ${fmtQty(p.from)} ${u} ×${fmtQty(p.factor)})` };
};

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
  // 某语言是空数组时回退另一语言(以前 stepsJa: [] 是真值,日文版步骤整段空白)
  const steps = pickSteps(item, lang === "ja" ? "ja" : "zh");
  // 2026-09-29 体检第 2 批:以前选「中日双语」只印中文步骤 —— 双语时每步下面加印日文
  // C11:按行对齐取这一行的日文;这一行中文空着(主行已经回退成日文)或日文空着就不重复印
  const stepsSub = lang === "both" ? stepRows(item).map(r => r.ja) : null;
  const notesText = getText(item.notesZh, item.notesJa);
  const scaleText = printScaleText(item, lang);
  const ingsSorted = printSortByBowl(item.ingredients);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* 抬头：店名 + 配方名 / 右侧关键参数 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2px solid #000", paddingBottom: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11pt", letterSpacing: "0.26em", fontWeight: 400 }}>{brandName}</div>
          <div style={{ fontSize: "24pt", fontWeight: 700, marginTop: "8px", lineHeight: 1.1 }}>{name}</div>
          {item.nameFr && <div style={{ fontSize: "13pt", marginTop: "4px" }}>{item.nameFr}</div>}
          {/* 2026-09-29 体检第 2 批:过敏原以前三个模板都不印 */}
          {item.allergens && <div style={{ fontSize: "10pt", fontWeight: 700, marginTop: "6px" }}>{lang === "ja" ? "アレルゲン" : "过敏原"}：{item.allergens}</div>}
        </div>
        {/* 2026-09-29 体检第 2 批:以前右栏不收缩不换行,温度时间写得长时把名字挤成一条、右边超出纸边 —— 限宽 55% 并允许换行 */}
        <div style={{ textAlign: "right", fontSize: "12pt", lineHeight: 1.7, marginLeft: "8mm", flexShrink: 1, maxWidth: "55%", overflowWrap: "anywhere" }}>
          {item.yield && <div style={{ fontSize: "20pt", fontWeight: 700 }}>{scaleText ? scaleText.main : `${item.yield} ${item.unit || "個"}`}</div>}
          {scaleText && <div style={{ fontSize: "10pt" }}>{scaleText.sub}</div>}
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
              return ingsSorted.map((ing, i) => {
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
                <div className="p-step-t">
                  {s}
                  {stepsSub && stepsSub[i] && stepsSub[i] !== s && <div className="p-sub" style={{ fontSize: "10pt", marginTop: "2px" }}>{stepsSub[i]}</div>}
                </div>
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
        <div>{[brandName, brandSubtitle, new Date().toLocaleDateString("zh-CN")].filter(Boolean).join(" · ")}</div>
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
  // 某语言是空数组时回退另一语言(以前 stepsJa: [] 是真值,日文版步骤整段空白)
  const steps = pickSteps(item, lang === "ja" ? "ja" : "zh");
  // 2026-09-29 体检第 2 批:以前选「中日双语」只印中文步骤 —— 双语时每步下面加印日文
  // C11:按行对齐取这一行的日文;这一行中文空着(主行已经回退成日文)或日文空着就不重复印
  const stepsSub = lang === "both" ? stepRows(item).map(r => r.ja) : null;
  const notesText = getText(item.notesZh, item.notesJa);
  // 2026-09-29 体检第 2 批:过敏原和总耗时以前从不打印
  const lb = (zh, ja) => lang === "ja" ? ja : lang === "both" ? `${zh} / ${ja}` : zh;
  const timeText = printTimeText(item.time, lang === "ja" ? "ja" : "zh");
  const scaleText = printScaleText(item, lang);   // 缩放后打印:展示版也标出「做多少(原多少 ×倍)」(审查发现只有这一版没标)

  return (
    <div style={{ position: "relative", zIndex: 1, fontFamily: 'Georgia, "Hiragino Mincho ProN", "游明朝", "PingFang SC", serif', color: "#2D1B0E" }}>
      {/* 顶部封面区 */}
      <div style={{ textAlign: "center", paddingBottom: "12mm", borderBottom: "0.5px solid #AC6B3A", marginBottom: "10mm" }}>
        <img src={logoSrc} style={{ display: "block", width: "auto", height: "auto", maxWidth: "60mm", maxHeight: "30mm", margin: "0 auto 5mm" }} alt="LOGO" />
        {/* 默认 logo 就是「kororā」字标,再排一遍文字店名就重复了;换了自定义 logo 才排 */}
        {logoSrc !== LOGO_DATA_URI && <div style={{ fontFamily: "Georgia, serif", fontSize: "14pt", letterSpacing: "8pt", marginBottom: "2mm", color: "#2D1B0E", fontWeight: 500 }}>{brandName}</div>}
        {brandSubtitle && <div style={{ fontSize: "9pt", letterSpacing: "4pt", color: "#7A5F4A", fontStyle: "italic" }}>— {brandSubtitle} —</div>}
      </div>

      {/* 标题区 */}
      <div style={{ textAlign: "center", marginBottom: "10mm" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: "30pt", fontWeight: 400, marginBottom: "3mm", letterSpacing: "2pt", color: "#2D1B0E", lineHeight: 1.15 }}>{name}</div>
        {item.nameFr && <div style={{ fontFamily: "Georgia, serif", fontSize: "13pt", fontStyle: "italic", color: "#7A5F4A", letterSpacing: "1pt" }}>{item.nameFr}</div>}
        {scaleText && <div style={{ fontSize: "10pt", color: "#7A5F4A", marginTop: "2mm" }}>{scaleText.main} {scaleText.sub}</div>}
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

      {(item.allergens || timeText) && (
        <div style={{ marginBottom: "8mm", textAlign: "center", fontSize: "10pt", color: "#444", display: "flex", justifyContent: "center", gap: "8mm", flexWrap: "wrap" }}>
          {item.allergens && <span>{lb("过敏原", "アレルゲン")}：{item.allergens}</span>}
          {timeText && <span>{lb("制作时间", "所要時間")}：{timeText}</span>}
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
                <span>
                  {s}
                  {stepsSub && stepsSub[i] && stepsSub[i] !== s && <span style={{ display: "block", fontSize: "9.5pt", color: "#555" }}>{stepsSub[i]}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 底部 */}
      <div style={{ marginTop: "15mm", paddingTop: "5mm", borderTop: "0.5px solid #1a1a1a", textAlign: "center", fontSize: "8pt", letterSpacing: 3, color: "#666" }}>
        <div>{[brandName, brandSubtitle].filter(Boolean).join(" · ")}</div>
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
  // C11:步骤按行对齐(stepRows:空数组回退老字段 steps、两边都空的行跳过),双语并排时同一行的中日对在一起
  const stepLines = stepRows(item);
  const hasStepsZh = stepLines.some(r => r.zh), hasStepsJa = stepLines.some(r => r.ja);
  const notesText = getText(item.notesZh, item.notesJa);
  // 2026-09-29 体检第 2 批:以前选「仅日文」时信息行 / 表头 / 页脚还是写死的中文(表头中日混排)—— 标签跟着打印语言走
  const lb = (zh, ja) => lang === "ja" ? ja : zh;
  const timeText = printTimeText(item.time, lang === "ja" ? "ja" : "zh");
  const scaleText = printScaleText(item, lang);
  const ingsSorted = printSortByBowl(item.ingredients);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* 顶部条 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "0.8px solid #2D1B0E", paddingBottom: "4mm", marginBottom: "6mm" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "3mm" }}>
          <img src={logoSrc} style={{ width: "auto", height: "auto", maxWidth: "40mm", maxHeight: "12mm" }} alt="LOGO" />
          <div>
            {logoSrc !== LOGO_DATA_URI && <div style={{ fontFamily: "Georgia, serif", fontSize: "11pt", letterSpacing: "3pt", fontWeight: 500, color: "#2D1B0E" }}>{brandName}</div>}
            {brandSubtitle && <div style={{ fontSize: "7pt", letterSpacing: "2pt", color: "#7A5F4A", fontStyle: "italic" }}>{brandSubtitle}</div>}
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
          {item.yield && <div><span style={{ color: "#999", letterSpacing: "0.5pt" }}>{lb("产量", "仕上がり")}:</span> <strong style={{ fontFamily: "Georgia, serif", color: "#2D1B0E" }}>{scaleText ? `${scaleText.main} ${scaleText.sub}` : `${item.yield}${item.unit || "個"}`}</strong></div>}
          {item.temp && <div><span style={{ color: "#888" }}>{lb("温度", "温度")}:</span> <strong>{item.temp}</strong></div>}
          {item.baketime && <div><span style={{ color: "#888" }}>{lb("烘烤时间", "焼成時間")}:</span> <strong>{item.baketime}</strong></div>}
          {timeText && <div><span style={{ color: "#888" }}>{lb("制作时间", "所要時間")}:</span> <strong>{timeText}</strong></div>}
          {item.mold && <div><span style={{ color: "#888" }}>{lb("模具", "型")}:</span> <strong>{item.mold}</strong></div>}
          {item.difficulty && <div><span style={{ color: "#888" }}>{lb("难度", "難易度")}:</span> <strong>{item.difficulty}</strong></div>}
          {item.storage && <div><span style={{ color: "#888" }}>{lb("保存", "保存")}:</span> <strong>{item.storage}</strong></div>}
          {item.allergens && <div><span style={{ color: "#888" }}>{lb("过敏原", "アレルゲン")}:</span> <strong>{item.allergens}</strong></div>}
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
                <th style={{ textAlign: "left", padding: "1.5mm", fontWeight: 400, fontSize: "8pt", color: "#666" }}>{lb("名称", "材料名")}</th>
                <th style={{ textAlign: "right", padding: "1.5mm", fontWeight: 400, fontSize: "8pt", color: "#666", width: "15mm" }}>{lb("用量", "分量")}</th>
                <th style={{ textAlign: "left", padding: "1.5mm", fontWeight: 400, fontSize: "8pt", color: "#666", width: "8mm" }}>{lb("单位", "単位")}</th>
                <th style={{ textAlign: "left", padding: "1.5mm", fontWeight: 400, fontSize: "8pt", color: "#666", width: "35mm" }}>{lb("品牌", "ブランド")}</th>
                <th style={{ textAlign: "left", padding: "1.5mm", fontWeight: 400, fontSize: "8pt", color: "#666" }}>{lb("备注", "備考")}</th>
              </tr>
            </thead>
            <tbody>
              {ingsSorted.map((ing, i) => {
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
      {sections.steps && stepLines.length > 0 && (
        <div style={{ marginBottom: "6mm" }}>
          <div style={{ fontSize: "12pt", fontWeight: 500, marginBottom: "3mm", paddingBottom: "1mm", borderBottom: "0.5px solid #666" }}>
            ─ {lang === "ja" ? "作り方" : lang === "zh" ? "制法" : "制法 / 作り方"} ─
          </div>
          {lang === "both" && hasStepsZh && hasStepsJa ? (
            <table style={{ fontSize: "9.5pt" }}>
              <thead>
                <tr><th style={{ textAlign: "left", padding: "1mm", fontWeight: 400, fontSize: "8pt", color: "#666", width: "50%" }}>中文</th><th style={{ textAlign: "left", padding: "1mm", fontWeight: 400, fontSize: "8pt", color: "#666" }}>日本語</th></tr>
              </thead>
              <tbody>
                {stepLines.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "0.25px solid #DDD" }}>
                    <td style={{ padding: "2mm 1mm", verticalAlign: "top", lineHeight: 1.6 }}><strong style={{ color: "#999" }}>{i + 1}. </strong>{r.zh}</td>
                    <td style={{ padding: "2mm 1mm", verticalAlign: "top", lineHeight: 1.6 }}><strong style={{ color: "#999" }}>{i + 1}. </strong>{r.ja}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <ol style={{ paddingLeft: "6mm", margin: 0, fontSize: "10pt", lineHeight: 1.8 }}>
              {pickSteps(item, lang === "ja" ? "ja" : "zh").map((s, i) => (
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
        <div>{[brandName, brandSubtitle, lb("归档笔记", "アーカイブ")].filter(Boolean).join(" · ")}</div>
        <div>{new Date().toLocaleDateString("zh-CN")}</div>
      </div>
    </div>
  );
}

// ─── 模板4：组合产品整体配方（v17.8，A4 生产单，黑白）─────────────
// data = { creation, batch }:详情页「📘 配方」按个数算好的那一份(creationBatch),打印和屏幕一个数。
// 沿用上面 PrintView 的 p-* 规范(纯黑白、盆用粗体编号、用量粗体),价格一律不印。
function CreationPrintTemplate({ data, lang, sections = {}, brandName, brandSubtitle }) {
  const c = (data && data.creation) || {};
  const batch = (data && data.batch) || { parts: [], N: 1, serves: 1, factor: 1 };
  const L = lang === "ja" ? "ja" : "zh";
  const W = creationWords(creationStructureOf(c), L);
  const tx = (zhText, jaText) => lang === "ja" ? jaText : (lang === "both" ? `${zhText} · ${jaText}` : zhText);
  const nameOf = (x) => {
    if (!x) return "";
    if (lang !== "both") return pickLang(x, "name", L);
    const a = [x.nameZh, x.nameJa].filter(Boolean);
    return a.filter((v, i) => a.indexOf(v) === i).join(" / ");
  };
  const marks = { bowl1: "①", bowl2: "②", bowl3: "③", bowl4: "④", bowl5: "⑤" };
  const stepsBlock = (x) => {
    // C11:按行对齐。主行 = 当前语言,这一行空着用另一语言;双语时这一行中文有字才在下面印日文(中文空着时主行已经是日文,不重复印)
    const rows = stepRows(x);
    const main = rows.map(r => L === "ja" ? (r.ja || r.zh) : (r.zh || r.ja));
    if (!main.length) return null;
    const sub = lang === "both" ? rows.map(r => r.zh ? r.ja : "") : null;
    return (
      <div className="p-steps" style={{ marginTop: "6px" }}>
        {main.map((s, i) => (
          <div key={i} className="p-step">
            <div className="p-step-n">{String(i + 1).padStart(2, "0")}</div>
            <div className="p-step-t" style={{ fontSize: "10.5pt" }}>
              {s}
              {sub && sub[i] && <div className="p-sub" style={{ fontSize: "9.5pt", marginTop: "2px" }}>{sub[i]}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };
  const notesOf = (x) => {
    if (lang === "both") return [x.notesZh, x.notesJa].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join("\n—\n");
    return pickLang(x, "notes", L) || x.notes || "";
  };
  const rowsOf = (p) => {
    const rows = p.noUsed
      ? (p.layer.ingredients || []).filter(i => i && (_normTxt(i.nameZh) || _normTxt(i.nameJa))).map(i => ({ ing: i, qty: isFinite(parseFloat(i.qty)) ? parseFloat(i.qty) : null }))
      : p.ings;
    const order = (r) => { const k = GROUPS[r.ing.group] ? r.ing.group : "none"; return GROUP_ORDER.indexOf(k); };
    return rows.map((r, i) => ({ r, i })).sort((a, b) => (order(a.r) - order(b.r)) || (a.i - b.i)).map(x => x.r);
  };
  const qtyText = (r) => {
    const raw = _normTxt(r.ing.qty);
    if (r.qty !== null && r.qty > 0) return `${fmtQty(r.qty)} ${r.ing.unit || "g"}`;
    return (raw && !isFinite(parseFloat(raw))) ? raw : "—";
  };
  const assemblyNotes = notesOf(c);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* 抬头:店名 + 产品名 / 右侧做几个 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2px solid #000", paddingBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11pt", letterSpacing: "0.26em" }}>{brandName}</div>
          <div style={{ fontSize: "24pt", fontWeight: 700, marginTop: "8px", lineHeight: 1.1 }}>{nameOf(c)}</div>
          {c.nameFr && <div style={{ fontSize: "13pt", marginTop: "4px" }}>{c.nameFr}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: "11pt", lineHeight: 1.7, marginLeft: "8mm", flexShrink: 0 }}>
          <div style={{ fontSize: "20pt", fontWeight: 700 }}>{tx("做", "仕込み")} {fmtQty(batch.N)} {W.unit}</div>
          <div>{tx(`用量按 ${fmtQty(batch.serves)} ${W.unit} 写 × ${fmtQty(batch.factor)}`, `基準 ${fmtQty(batch.serves)} × ${fmtQty(batch.factor)}`)}</div>
          <div>{new Date().toLocaleDateString("zh-CN")}</div>
        </div>
      </div>

      {/* 总览:每部分要多少、备货还是现做 */}
      <table style={{ marginTop: "14px" }}>
        <thead>
          <tr>
            <th className="p-th" style={{ width: "32px" }}>#</th>
            <th className="p-th">{tx("部分", "パーツ")}</th>
            <th className="p-th" style={{ width: "90px" }}>{tx("方式", "区分")}</th>
            <th className="p-th" style={{ textAlign: "right", width: "110px" }}>{tx("需要", "必要量")}</th>
          </tr>
        </thead>
        <tbody>
          {batch.parts.map(p => (
            <tr key={p.idx}>
              <td className="p-td" style={{ padding: "5px 0", fontWeight: 700 }}>{String(p.idx + 1).padStart(2, "0")}</td>
              <td className="p-td" style={{ padding: "5px 0" }}>
                <span style={{ fontWeight: 700 }}>{p.layer.customName || nameOf(p.layer)}</span>
                {p.layer.customName && nameOf(p.layer) && nameOf(p.layer) !== p.layer.customName && <span style={{ fontSize: "9.5pt", marginLeft: "6px" }}>{nameOf(p.layer)}</span>}
              </td>
              <td className="p-td" style={{ padding: "5px 0" }}>{p.stock ? tx("备货", "作り置き") : tx("现做", "当日")}</td>
              <td className="p-td" style={{ padding: "5px 0", textAlign: "right", fontWeight: 700, fontSize: "12pt", ...T.num }}>{p.needed !== null ? `${fmtQty(p.needed)} g` : (p.noUsed ? "?" : tx(`整批 ×${fmtQty(batch.factor)}`, `×${fmtQty(batch.factor)}`))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 各部分 */}
      {batch.parts.map(p => {
        const l = p.layer;
        const title = l.customName || nameOf(l);
        const compName = nameOf(l);
        const note = usedAmountNote(l.usedAmount);
        const partNotes = sections.notes ? notesOf(l) : "";
        const rows = p.stock ? [] : rowsOf(p);
        let lastGroup = null;
        return (
          <div key={p.idx} style={{ marginTop: "20px" }}>
            <div className="p-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1.5px solid #000", paddingBottom: "4px", breakAfter: "avoid", pageBreakAfter: "avoid" }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: "11pt", fontWeight: 700, marginRight: "6px" }}>{String(p.idx + 1).padStart(2, "0")}</span>
                <span style={{ fontSize: "15pt", fontWeight: 700 }}>{title}</span>
                {l.customName && compName && compName !== title && <span style={{ fontSize: "10pt", marginLeft: "8px" }}>{compName}</span>}
                <span style={{ fontSize: "9pt", marginLeft: "8px", border: "1px solid #000", padding: "0 4px" }}>{p.stock ? tx("备货", "作り置き") : tx("现做", "当日")}</span>
              </div>
              <div style={{ fontSize: "17pt", fontWeight: 700, whiteSpace: "nowrap", ...T.num }}>{p.needed !== null ? `${fmtQty(p.needed)} ${l.unit || "g"}` : ""}</div>
            </div>
            {note && <div style={{ fontSize: "9pt", marginTop: "3px" }}>{tx("用量原文", "原文")}：{note}</div>}
            {p.noUsed && <div style={{ fontSize: "10pt", fontWeight: 700, marginTop: "4px" }}>⚠ {tx("没填用量：下面是整批配方，没按个数算", "使用量未入力：全量レシピ")}</div>}
            {/* 2026-09-29 体检第 2 批:「500g + 170g」这类用量屏幕上有黄色提醒,打印单上以前没有,员工照大号数字做会少做 */}
            {!p.noUsed && usedAmountAmbiguous(l.usedAmount) && <div style={{ fontSize: "10pt", fontWeight: 700, marginTop: "4px" }}>⚠ {tx(`用量只认开头的数字，按 ${fmtQty(p.used)} ${l.unit || "g"} 一批算，请核对用量原文`, `先頭の数字 ${fmtQty(p.used)} ${l.unit || "g"} で計算。原文を確認`)}</div>}
            {p.stock ? (
              <div style={{ fontSize: "12pt", marginTop: "6px" }}>
                {tx("从库存取", "ストックから")} <strong style={{ fontSize: "14pt" }}>{p.needed !== null ? `${fmtQty(p.needed)} ${l.unit || "g"}` : ""}</strong>
              </div>
            ) : (
              <>
                {rows.length > 0 && (
                  <table style={{ marginTop: "4px" }}>
                    <tbody>
                      {rows.map((r, i) => {
                        const gk = GROUPS[r.ing.group] && r.ing.group !== "none" ? r.ing.group : null;
                        const first = gk && gk !== lastGroup;
                        lastGroup = gk;
                        const zhN = r.ing.nameZh || r.ing.nameJa || "";
                        const jaN = r.ing.nameJa || "";
                        return (
                          <tr key={i}>
                            <td className="p-td p-bowl" style={{ padding: "6px 0", fontSize: "12pt" }}>{first ? marks[gk] : ""}</td>
                            <td className="p-td" style={{ padding: "6px 0" }}>
                              <div className="p-name" style={{ fontSize: "12pt" }}>{L === "ja" ? (jaN || zhN) : zhN}</div>
                              {lang === "both" && jaN && jaN !== zhN && <div className="p-sub" style={{ fontSize: "9.5pt" }}>{jaN}</div>}
                              {r.ing.note && <div className="p-note" style={{ fontSize: "9pt" }}>{r.ing.note}</div>}
                            </td>
                            <td className="p-td p-qty" style={{ padding: "6px 0", fontSize: "14pt" }}>{qtyText(r)}</td>
                            <td className="p-td" style={{ padding: "6px 0 6px 14px", width: "40px" }}><span className="p-check" /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {sections.steps && stepsBlock(l)}
              </>
            )}
            {partNotes && (
              <div style={{ marginTop: "6px", border: "1px solid #000", padding: "6px 10px", fontSize: "9.5pt", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{partNotes}</div>
            )}
          </div>
        );
      })}

      {/* 整体组装 */}
      {sections.steps && pickSteps(c, L).length > 0 && (
        <div style={{ marginTop: "24px", borderTop: "2px solid #000", paddingTop: "10px" }}>
          <div style={{ fontSize: "12pt", fontWeight: 700, letterSpacing: "0.1em" }}>{tx("整体组装", "組立")}</div>
          {stepsBlock(c)}
        </div>
      )}
      {sections.notes && assemblyNotes && (
        <div style={{ marginTop: "14px", border: "1px solid #000", padding: "10px 14px", fontSize: "10pt", lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>{tx("整体备注", "メモ")}</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{assemblyNotes}</div>
        </div>
      )}

      {/* 底部 */}
      <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "9pt", color: "#444" }}>
        <div>{[brandName, brandSubtitle, new Date().toLocaleDateString("zh-CN")].filter(Boolean).join(" · ")}</div>
        <div>{tx("盆序 ① → ⑤ 依次投料", "ボウル ① → ⑤ の順に投入")}</div>
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

  // 2026-09-29 体检第 2 批:以前背景一收到 click 就关 —— 在框里拖选文字、松手在灰色背景上也算,写好的内容全丢。
  // 现在按下和松开都在背景上才算点背景;表单里写了东西时,关之前在框里问一句(不用浏览器自带弹窗)
  const downOnBackdrop = useRef(false);
  const [askClose, setAskClose] = useState(false);
  const hasContent = !!(titleZh.trim() || titleJa.trim() || contentZh.trim() || contentJa.trim() || customTag.trim() || selectedTags.length);
  const requestClose = () => { if (hasContent) setAskClose(true); else onClose(); };
  const askCloseRef = useRef(null);
  useEffect(() => { if (askClose && askCloseRef.current && askCloseRef.current.scrollIntoView) askCloseRef.current.scrollIntoView({ block: "nearest" }); }, [askClose]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
      onMouseDown={e => { downOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { const both = downOnBackdrop.current && e.target === e.currentTarget; downOnBackdrop.current = false; if (both) requestClose(); }}>
      <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "1.5rem", maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>📚 快速新建知识点</div>
          <button onClick={requestClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#999" }}>×</button>
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

        {askClose && (
          <div ref={askCloseRef} style={{ border: `0.5px solid ${T.warning}`, background: T.bgMuted, borderRadius: T.radiusSm, padding: "8px 12px", marginBottom: 12, fontSize: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ flex: 1, minWidth: 180, color: T.textPrimary }}>{lang === "zh" ? "写的内容还没保存，关掉就没了。确定关闭吗？" : "入力内容は保存されていません。閉じますか？"}</span>
            <Btn size="sm" onClick={() => setAskClose(false)}>{lang === "zh" ? "继续编辑" : "編集を続ける"}</Btn>
            <Btn size="sm" variant="danger" onClick={onClose}>{lang === "zh" ? "不保存，关闭" : "保存せず閉じる"}</Btn>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
          {error && <span style={{ color: "#A32D2D", fontSize: 12, marginRight: 8 }}>⚠ {error}</span>}
          <Btn onClick={requestClose}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
          <Btn variant="primary" onClick={handleSave}>保存并关联</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── 组合产品的「结构」(2026-09-27) ─────────────────────────────────
// creations[].structure:"stack" 叠层(一层压一层、自上而下,蛋糕类)/ "assembly" 拼装(壳、馅、顶各是一部分、不分上下,
// 泡芙 / 塔 / 丹麦 / 夹馅面包类)。缺省 = 叠层,老数据不迁移。慕斯的夹心就是叠层里中间的一层(剖面图的画法),不另设类型。
// 只影响文字和示意图:拼装不画左侧竖条、「层」改「部分」、「台」改「个」;layers 的顺序 / 用量 / 成本算法一概不动。
// 跟结构有关的叫法全部从 creationWords 取,别在页面里散写「层」「台」。
const CREATION_STRUCTURES = [
  { id: "stack",    zh: "叠层", ja: "積層",      hintZh: "一层压一层，自上而下（蛋糕类）",                       hintJa: "上から下へ積み重ねる（ケーキ類）" },
  { id: "assembly", zh: "拼装", ja: "組み合わせ", hintZh: "壳、馅、顶各是一部分，不分上下（泡芙 / 塔 / 丹麦类）", hintJa: "殻・中身・トップの組み合わせ、上下なし（シュー / タルト類）" },
];
const creationStructureOf = (c) => (c && c.structure === "assembly") ? "assembly" : "stack";
const creationWords = (structure, lang = "zh") => {
  const stack = structure !== "assembly";
  const zh = lang === "zh";
  return {
    isStack: stack,
    partCount: (n) => stack ? `${n} ${zh ? "层" : "層"}` : `${n} ${zh ? "个部分" : "パーツ"}`,
    unit: stack ? "台" : (zh ? "个" : "個"),
    sectionTitle: stack ? (zh ? "🎂 层结构（自上而下）" : "🎂 層構成（上から下へ）") : (zh ? "🧩 组成部分" : "🧩 構成パーツ"),
    sectionHint: stack ? "每层可设自定义名称；用量按「制作台数」这一批写" : "每部分可设自定义名称；用量按「制作个数」这一批写",
    emptyDetail: stack ? "（尚未添加层）" : "（尚未添加组成部分）",
    emptyEdit: stack ? "还没有层。从组件库挑一个开始搭。" : "还没有组成部分。从组件库挑一个开始。",
    newBlank: stack ? (zh ? "+ 新建空白层" : "+ 空白層追加") : (zh ? "+ 新建空白部分" : "+ 空白パーツ追加"),
    customNamePh: stack ? "自定义层名（例：顶层、中层饼底、夹心）" : "自定义名称（例：外壳、内馅、顶部）",
    usedLabel: stack ? "本层用量" : "用量",
    costLabel: stack ? "本层成本" : "成本",
    servesLabel: stack ? "制作台数" : "制作个数",
    portionsLabel: stack ? "每台切几份" : "每个分几份",
    perUnitCost: stack ? "单台成本" : "单个成本",
    tipFillUsed: `💡 提示：下方每${stack ? "层" : "部分"}填上用量（做「${stack ? "制作台数" : "制作个数"}」那么多时一共要多少克），才能算出成本和整体配方`,
    deleteConfirm: stack ? "删除这一层吗？" : "删除这一部分吗？",
    editTitle: stack ? "编辑层：" : "编辑部分：",
    // v17.8: 部分编辑页顶上的说明,按这一部分和组件库的关系(layerLinkState)给
    linkNote: (state) => {
      const p = stack ? "层" : "部分";
      if (state === "local") return `💡 这一${p}是本产品专用：改了只影响这个产品。想让组件库（和跟组件库走的其他产品）也这么改，点「↻ 同步回组件库」，之后这一${p}又跟组件库走。`;
      if (state === "differs") return `💡 这一${p}和组件库现在的内容不一样（老数据）。在这里保存 = 本产品专用；点「↻ 同步回组件库」= 用这里的内容更新组件库。`;
      if (state === "orphan") return `💡 原组件已从组件库删除，这里是当时的内容，只属于这个产品。`;
      return `💡 这一${p}跟组件库走：组件库一改，这里跟着变。在这里改了内容、没点「↻ 同步回组件库」，保存后就变成「本产品专用」，不再跟组件库。想让组件库和其他产品一起改，点「↻ 同步回组件库」。`;
    },
    saveBtn: stack ? (zh ? "保存层" : "レイヤー保存") : (zh ? "保存这部分" : "パーツ保存"),
  };
};

// v17.8: 部分和组件库的关系(layerLinkState)在页面上的标签。手搭的(manual)不打标签
const LAYER_LINK_TAGS = {
  follow:  { zh: "⟲ 跟组件库",   ja: "⟲ 部品庫と連動", color: T.success,       hint: "组件库一改，这一部分跟着变" },
  local:   { zh: "本产品专用",    ja: "この製品専用",    color: T.info,          hint: "在这个产品里单独改过，不再跟组件库" },
  differs: { zh: "和组件库不一样", ja: "部品庫と相違",    color: T.danger,        hint: "老数据：和组件库现在的内容不一样，在详情页选用哪个" },
  orphan:  { zh: "组件已删除",    ja: "部品は削除済み",  color: T.textTertiary,  hint: "原组件已从组件库删除，这里保留当时的内容" },
};
// 老数据「和组件库不一样」时说清差在哪,按 layerContentKey 的顺序
const LAYER_DIFF_FIELDS = [
  ["名字", "名前"], ["名字", "名前"], ["名字", "名前"], ["分类", "分類"], ["产出量", "出来高"], ["单位", "単位"],
  ["原料", "材料"], ["步骤", "工程"], ["步骤", "工程"], ["备注", "メモ"], ["备注", "メモ"],
  ["步骤", "工程"],   // C11:步骤中间有空行时补的逐行对照(_stepsKeyTail),只差在对齐也要说「步骤」
];
const layerDiffLabels = (l, comp, matIds, lang = "zh") => {
  if (!l || !comp) return [];
  const a = JSON.parse(layerContentKey(l, matIds)), b = JSON.parse(layerContentKey(comp, matIds));
  const out = [];
  LAYER_DIFF_FIELDS.forEach((f, i) => {
    const label = lang === "zh" ? f[0] : f[1];
    if (JSON.stringify(a[i]) !== JSON.stringify(b[i]) && !out.includes(label)) out.push(label);
  });
  return out;
};

// ─── 组合产品 View ───────────────────────────────────────────────
function CreationsView({ creations, setCreations, components, recipes = [], cats, onUpdateCats, brands = [], materials = [], setShopMaterials, lang, setLang, viewId, setViewId, editTarget, setEditTarget, showToast, saved, onUpdateComponent, confirmDialog, knowledge, onNavigateToKnowledge,
  onPrintCreation, returnToList = false, onReturnToList, onOpenFromList, products = [] }) {
  // 2026-09-29 体检第 2 批:products 只用来在删组合产品时列出挂着它的商品
  // v17.8: 详情页就地改一个产品(部分的「跟组件库 / 本产品专用」标记)
  const updateCreation = (id, updater) => setCreations(prev => prev.map(x => x.id === id ? { ...updater(x), updatedAt: new Date().toISOString() } : x));
  if (editTarget !== null) {
    return (
      <CreationEditForm
        creation={editTarget === "new" ? null : editTarget}
        components={components}
        cats={cats}
        onUpdateCats={onUpdateCats}
        brands={brands}
        materials={materials}
        setShopMaterials={setShopMaterials}
        confirmDialog={confirmDialog}
        showToast={showToast}
        onSave={(c) => {
          setCreations(prev => {
            const found = prev.find(x => x.id === c.id);
            return found ? prev.map(x => x.id === c.id ? c : x) : [...prev, c];
          });
          showToast("✓ 组合产品已保存");
          setViewId(c.id);
          setEditTarget(null);
        }}
        onDelete={() => {
          // 2026-09-29 体检第 2 批:以前只问「删除这个组合产品吗？」,不说哪些商品挂着它(删了商品页只剩「已删除」、
          // 采购计划悄悄少算),也不能撤销。照删配方:有商品挂着 → 确认框列出来;没有 → 直接删 + 撤销
          const snap = creations.find(x => x.id === editTarget.id) || editTarget;
          const cName = pickLang(snap, "name", lang) || snap.nameFr || "";
          const usedByProducts = (products || []).filter(p => (p.items || []).some(it => it && it.linkedType === "creation" && String(it.linkedId) === String(snap.id)));
          const refs = usedByProducts.map(p => `${lang === "zh" ? "商品" : "商品"}：${pickLang(p, "name", lang) || p.nameZh || p.nameJa || ""}`);
          const doDelete = () => {
            const idx = creations.findIndex(x => x.id === snap.id);
            setCreations(prev => prev.filter(x => x.id !== snap.id));
            setEditTarget(null);
            showToast(lang === "zh" ? `已删除「${cName}」` : `「${cName}」を削除しました`, {
              undo: () => setCreations(prev => {
                if (prev.find(x => x.id === snap.id)) return prev;
                const next = [...prev];
                next.splice(idx >= 0 ? Math.min(idx, next.length) : next.length, 0, snap);
                return next;
              }),
            });
          };
          if (refs.length > 0) {
            confirmDialog(
              lang === "zh"
                ? "下面这些商品挂着这个组合产品。删除后商品里这一项会显示「已删除」，采购计划会少算它的原料。"
                : "以下の商品に含まれています。削除すると商品では「削除済み」になり、仕入れ計画から外れます。",
              doDelete,
              {
                kicker: lang === "zh" ? "删除组合产品" : "組立製品を削除",
                title: lang === "zh" ? `删除「${cName}」？` : `「${cName}」を削除？`,
                refs,
                confirmText: lang === "zh" ? "仍然删除" : "削除する",
              }
            );
          } else {
            doDelete();
          }
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
          recipes={recipes}
          components={components}
          creations={creations}
          materials={materials}
          brands={brands}
          onNavigateToKnowledge={onNavigateToKnowledge}
          onEdit={() => { setEditTarget(cr); setViewId(null); }}
          onBack={() => { if (returnToList && onReturnToList) onReturnToList(); else setViewId(null); }}
          backLabel={returnToList ? (lang === "zh" ? "← 返回配方一览" : "← レシピ一覧へ") : null}
          onUpdateCreation={updateCreation}
          showToast={showToast}
          onPrint={onPrintCreation}
        />
      );
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{lang === "zh" ? `组合产品（${creations.length}）` : `組立製品（${creations.length}）`}</div>
          {saved && <span style={{ fontSize: 12, color: "#0F6E56" }}>{lang === "zh" ? "✓ 已保存" : "✓ 保存済み"}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn variant="primary" onClick={() => setEditTarget("new")}>{lang === "zh" ? "+ 新建组合产品" : "+ 組立製品新規"}</Btn>
        </div>
      </div>

      {creations.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: T.textSecondary, fontSize: 13, lineHeight: 1.8 }}>
          {lang === "zh" ? "还没有组合产品。" : "まだ組立製品がありません。"}<br />
          <span style={{ fontSize: 12, color: T.textTertiary, fontStyle: "italic" }}>
            {lang === "zh" ? (
              <>从「组件仓库」挑选组件像搭积木一样创建新产品（蛋糕、泡芙、塔……），<br />记录试吃反馈与改进方向。</>
            ) : (
              <>コンポーネントを組み合わせて新しい製品（ケーキ、シュー、タルト…）を作成し、<br />試食フィードバックと改善方向を記録します。</>
            )}
          </span>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {creations.map(c => {
          const name = pickLang(c, "name", lang);
          const nameSub = rawLang(c, "name", lang);
          const layers = c.layers || [];
          const totalCost = layers.reduce((s, l) => s + calcLayerLiveCost(l, materials, brands), 0);  // 和详情页同一套:实时算 + 按本蛋糕用量折
          const servesNum = parseFloat(c.serves) || 1;
          const portionsNum = parseFloat(c.portions) || 1;
          const priceNum = toCNY(c.price, priceCurOf(c));
          const costPerPortion = totalCost / servesNum / portionsNum;
          const marginPct = priceNum > 0 && costPerPortion > 0 ? ((priceNum - costPerPortion) / priceNum * 100) : 0;
          // 2026-09-29 体检第 2 批:列表上以前看不出哪款的用量没填 / 读不准(成本按 0 或只按开头的数算)
          const usedWarnCount = layers.filter(l => l && ((parseFloat(l.yield) > 0 && !(parseUsedAmount(l.usedAmount, l.unit) > 0)) || usedAmountAmbiguous(l.usedAmount))).length;

          // 状态映射(key 和编辑页的下拉框一致:季節限定是日文汉字「節」;以前写成「节」、又漏了検討中,这两个状态都被显示成試作)
          const statusMap = {
            "試作":     { emoji: "🧪", label: lang === "zh" ? "试作" : "試作", color: "#A05A1E", bg: "#FBF0E0" },
            "定番":     { emoji: "⭐", label: lang === "zh" ? "定番" : "定番", color: "#2D6A4F", bg: "#E8F4EA" },
            "季節限定": { emoji: "🌸", label: lang === "zh" ? "季限" : "季限", color: "#6B4568", bg: "#EDE4F0" },
            "下架":     { emoji: "⏸",  label: lang === "zh" ? "下架" : "休止", color: "#7A5F4A", bg: T.bgMuted },
            "検討中":   { emoji: "💭", label: lang === "zh" ? "考虑中" : "検討中", color: "#5B4A8C", bg: "#ECE8F4" },
          };
          const statusInfo = statusMap[c.status] || statusMap["試作"];
          const avatarLetter = (c.nameFr || name || "?").charAt(0).toUpperCase();

          return (
            <div
              key={c.id}
              onClick={() => { if (onOpenFromList) onOpenFromList(); setViewId(c.id); }}
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
                      layers.length > 0 ? creationWords(creationStructureOf(c), lang).partCount(layers.length) : null,
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
                  {/* 2026-09-29 体检第 2 批:用量没填 / 读不准的提醒;没有成本时也要出,所以不放在成本那个 span 里 */}
                  {usedWarnCount > 0 && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: T.warning }}
                      title={lang === "zh" ? "这几个部分的用量没填、读不出数字，或写法有歧义（只按开头的数字算），成本和毛利不准。去「编辑」改成这一批一共多少克的纯数字。" : "使用量が未入力・読めない・曖昧な部分があります"}>
                      ⚠ {lang === "zh" ? `${usedWarnCount} 个${creationWords(creationStructureOf(c), lang).isStack ? "层" : "部分"}用量没填或读不准` : `使用量要確認 ${usedWarnCount}`}
                    </span>
                  )}
                  {totalCost > 0 && (
                    <span style={{ marginLeft: usedWarnCount > 0 ? 8 : "auto", fontSize: 11, color: T.textTertiary }}>
                      {lang === "zh" ? "原料" : "原価"} ¥{totalCost.toFixed(0)}
                      {/* 2026-09-29 体检第 2 批:以前 marginPct > 0 才显示,亏本(负毛利)的反而整栏空着;负数走红色 */}
                      {priceNum > 0 && costPerPortion > 0 && <span style={{ marginLeft: 8, color: marginPct >= 65 ? T.success : marginPct >= 50 ? T.warning : T.danger }}>· {marginPct.toFixed(0)}%</span>}
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

// ─── 组合产品详情 ────────────────────────────────────────────────
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

// ─── v17.8 组合产品「整体配方」(详情页「📘 配方」)────────────────────────────
// 做 N 个:每部分需要多少;现做的配料按个数缩好(照组件的 ①②③ 盆分组)+ 做法;组件标了「备货」的只给「从库存取」,
// 整批配方点开看;最后整体组装 + 这一批的成本。算法全在 creationBatch,打印用同一份结果。
// rows: [{ ing, qty }],qty 是要显示的数(已缩放或原量),null / 0 时显示原文(「适量」之类)或「—」
function SheetIngRows({ rows, lang }) {
  const grouped = {};
  GROUP_ORDER.forEach(g => { grouped[g] = []; });
  rows.forEach(r => { grouped[GROUPS[r.ing.group] ? r.ing.group : "none"].push(r); });
  return GROUP_ORDER.map(gk => {
    const arr = grouped[gk];
    if (!arr.length) return null;
    const g = GROUPS[gk];
    return (
      <div key={gk}>
        {gk !== "none" && (
          <div style={{ padding: "6px 0 4px", fontSize: 11 }}>
            <span style={{ display: "inline-block", padding: "1px 8px", borderRadius: T.radiusPill, border: `1px solid ${g.labelBorder}`, color: g.labelColor, fontWeight: 500 }}>{lang === "zh" ? g.zh : g.ja}</span>
          </div>
        )}
        {arr.map((r, i) => {
          const n = pickLang(r.ing, "name", lang);
          const sub = rawLang(r.ing, "name", lang);
          const raw = _normTxt(r.ing.qty);
          const q = (r.qty !== null && r.qty > 0) ? fmtQty(r.qty) : ((raw && !isFinite(parseFloat(raw))) ? raw : "—");
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 88px 36px", gap: 6, padding: "6px 0", borderBottom: `0.5px solid ${T.lineFaint}`, alignItems: "baseline", borderLeft: gk !== "none" ? `3px solid ${g.border}` : "3px solid transparent", paddingLeft: 8 }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{n || sub}</span>
                {sub && sub !== n && <span style={{ fontSize: 11, color: T.textTertiary, marginLeft: 6 }}>{sub}</span>}
                {r.ing.note && <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>{r.ing.note}</div>}
              </div>
              <div style={{ textAlign: "right", fontSize: 15, fontWeight: 500, fontFamily: T.fontSerif, ...T.num }}>{q}</div>
              <div style={{ fontSize: 12, color: T.textSecondary }}>{q === "—" || !isFinite(parseFloat(q.replace(/,/g, ""))) ? "" : (r.ing.unit || "g")}</div>
            </div>
          );
        })}
      </div>
    );
  });
}

function SheetSteps({ steps, lang }) {
  if (!steps || steps.length === 0) return null;
  return (
    <ol style={{ margin: "8px 0 0", padding: 0, listStyle: "none" }}>
      {steps.map((s, i) => (
        <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "4px 0", fontSize: 12.5, lineHeight: 1.65 }}>
          <span style={{ minWidth: 20, fontFamily: T.fontSerif, color: T.textTertiary, ...T.num }}>{String(i + 1).padStart(2, "0")}</span>
          <span style={{ whiteSpace: "pre-wrap" }}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function CreationRecipeSheet({ c, lang, components = [], materials = [], brands = [], onPrint }) {
  const zh = lang === "zh";
  const W = creationWords(creationStructureOf(c), lang);
  const serves = parseFloat(c.serves) > 0 ? parseFloat(c.serves) : 1;
  const [nText, setNText] = useState(String(serves));
  const [open, setOpen] = useState({});   // `${idx}:batch` / `${idx}:notes` → 展开
  const toggle = (k) => setOpen(prev => ({ ...prev, [k]: !prev[k] }));
  const n = parseFloat(nText) > 0 ? parseFloat(nText) : serves;
  const batch = creationBatch(c, n, components, materials, brands);
  const unit = W.unit;
  const noUsedCount = batch.parts.filter(p => p.noUsed).length;
  const missingNames = [...new Set(batch.parts.flatMap(p => p.missingIngs.map(i => pickLang(i, "name", lang))).filter(Boolean))];
  const assembly = pickSteps(c, lang);
  const overallNotes = pickLang(c, "notes", lang);
  const box = { background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1rem 1.25rem", marginBottom: "1rem" };
  const unscaledRows = (l) => (l.ingredients || []).filter(i => i && (_normTxt(i.nameZh) || _normTxt(i.nameJa))).map(i => ({ ing: i, qty: isFinite(parseFloat(i.qty)) ? parseFloat(i.qty) : null }));

  return (
    <div>
      {/* 做几个 + 打印 */}
      <div style={{ ...box, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <span>{zh ? "做" : "仕込み"}</span>
          <input type="number" min="1" step="1" inputMode="numeric" value={nText}
            onChange={e => setNText(e.target.value)}
            style={{ width: 72, padding: "6px 8px", fontSize: 16, border: `1px solid ${T.ink}`, borderRadius: T.radius, fontFamily: T.fontSerif, textAlign: "right", ...T.num }} />
          <span>{unit}</span>
        </label>
        <span style={{ fontSize: 12, color: T.textTertiary }}>
          {zh ? `用量按「${W.servesLabel} ${serves}」这一批写，现在是它的 ${fmtQty(batch.factor)} 倍` : `使用量は仕込み数 ${serves} 基準、現在 ${fmtQty(batch.factor)} 倍`}
        </span>
        <div style={{ marginLeft: "auto" }}>
          {onPrint && <Btn size="sm" onClick={() => onPrint({ creation: c, batch })}>{zh ? "🖨 打印" : "🖨 印刷"}</Btn>}
        </div>
      </div>

      {/* 各部分 */}
      {batch.parts.length === 0 && <div style={{ ...box, fontSize: 13, color: T.textTertiary }}>{W.emptyDetail}</div>}
      {batch.parts.map(p => {
        const l = p.layer;
        const cat = getCompCat(l.componentCategory);
        const compName = pickLang(l, "name", lang);
        const title = l.customName || compName || (zh ? "未命名" : "無題");
        const note = usedAmountNote(l.usedAmount);
        const steps = pickSteps(l, lang);
        const partNotes = pickLang(l, "notes", lang) || l.notes;
        const showBatch = !!open[`${p.idx}:batch`];
        return (
          <div key={p.idx} style={{ ...box, borderLeft: `4px solid ${cat.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: T.fontSerif, fontSize: 12, color: cat.color, ...T.num }}>{String(p.idx + 1).padStart(2, "0")}</span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{title}</span>
                  <span style={{ fontSize: 10, padding: "0 6px", border: `0.5px solid ${p.stock ? T.warning : T.border}`, color: p.stock ? T.warning : T.textTertiary, borderRadius: T.radiusPill }}>
                    {p.stock ? (zh ? "备货" : "作り置き") : (zh ? "现做" : "当日仕込み")}
                  </span>
                </div>
                {l.customName && compName && compName !== l.customName && (
                  <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 2, marginLeft: 26 }}>{compName}</div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {p.needed !== null ? (
                  <div style={{ fontFamily: T.fontSerif, fontSize: 20, fontWeight: 500, ...T.num }}>
                    {fmtQty(p.needed)}<span style={{ fontSize: 12, marginLeft: 3, color: T.textSecondary }}>{l.unit || "g"}</span>{/* 2026-09-29 体检第 2 批:以前写死 g,单位是「颗 / 个」的部分也显示成克 */}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: T.textTertiary }}>{p.yieldNum > 0 ? "" : (zh ? `整批 × ${fmtQty(batch.factor)}` : `全量 × ${fmtQty(batch.factor)}`)}</div>
                )}
              </div>
            </div>
            {note && <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 4 }}>{zh ? "用量原文：" : "原文："}{note}</div>}

            {p.noUsed && (
              <div style={{ fontSize: 12, color: T.danger, marginTop: 8 }}>
                ⚠ {zh ? "这一部分没填用量（或读不出数字），下面是组件的整批配方，没按个数算。去「编辑」里填上用量。" : "使用量が未入力のため、下は全量レシピです。"}
              </div>
            )}
            {!p.noUsed && usedAmountAmbiguous(l.usedAmount) && (
              <div style={{ fontSize: 12, color: T.warning, marginTop: 8 }}>
                ⚠ {zh ? `用量只认开头的数字，按 ${fmtQty(p.used)} ${l.unit || "g"} 一批算（是这一批一共的量，不是每个的量）。不对的话去「编辑」改成纯数字。` : `先頭の数字 ${fmtQty(p.used)} ${l.unit || "g"} で計算しています。`}
              </div>
            )}

            {p.stock ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13 }}>
                  {p.needed !== null ? (zh ? `从库存取 ${fmtQty(p.needed)} ${l.unit || "g"}` : `ストックから ${fmtQty(p.needed)} ${l.unit || "g"}`) : (zh ? "从库存取" : "ストックから")}
                </div>
                <button type="button" onClick={() => toggle(`${p.idx}:batch`)}
                  style={{ marginTop: 6, background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: T.textSecondary, fontFamily: T.fontSans }}>
                  {showBatch ? "▼" : "▶"} {zh ? `整批配方${p.yieldNum > 0 ? `（组件整批 ${fmtQty(p.yieldNum)} ${l.unit || "g"}）` : ""}` : "全量レシピ"}
                </button>
                {showBatch && (
                  <div style={{ marginTop: 6 }}>
                    <SheetIngRows rows={unscaledRows(l)} lang={lang} />
                    <SheetSteps steps={steps} lang={lang} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                <SheetIngRows rows={p.noUsed ? unscaledRows(l) : p.ings} lang={lang} />
                <SheetSteps steps={steps} lang={lang} />
              </div>
            )}

            {partNotes && (
              <div style={{ marginTop: 8 }}>
                <button type="button" onClick={() => toggle(`${p.idx}:notes`)}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: T.textTertiary, fontFamily: T.fontSans }}>
                  {open[`${p.idx}:notes`] ? "▼" : "▶"} {zh ? "备注" : "メモ"}
                </button>
                {open[`${p.idx}:notes`] && <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: 4 }}>{partNotes}</div>}
              </div>
            )}
          </div>
        );
      })}

      {/* 整体组装 */}
      {assembly.length > 0 && (
        <div style={box}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{zh ? `整体组装（${assembly.length} 步）` : `組立（${assembly.length} 工程）`}</div>
          <SheetSteps steps={assembly} lang={lang} />
        </div>
      )}
      {overallNotes && (
        <div style={box}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{zh ? "整体备注" : "メモ"}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: T.textSecondary, whiteSpace: "pre-wrap", marginTop: 6 }}>{overallNotes}</div>
        </div>
      )}

      {/* 这一批的成本 */}
      <div style={{ ...box, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "baseline" }}>
        <span style={{ fontSize: 13 }}>{zh ? `这一批（${fmtQty(batch.N)} ${unit}）原料成本` : `原価（${fmtQty(batch.N)} ${unit}）`}
          <strong style={{ fontFamily: T.fontSerif, fontSize: 17, marginLeft: 8, ...T.num }}>{fmtCost(batch.cost) || "¥0"}</strong></span>
        <span style={{ fontSize: 12, color: T.textSecondary }}>{zh ? `单个 ${fmtCost(batch.cost / batch.N) || "¥0"}` : `1 ${unit} ${fmtCost(batch.cost / batch.N) || "¥0"}`}</span>
        {batch.incomplete && (
          <span style={{ fontSize: 11, color: T.warning, border: `0.5px solid ${T.warning}`, borderRadius: T.radiusPill, padding: "1px 8px" }}
            title={[missingNames.length ? `${zh ? "没价" : "価格なし"}：${missingNames.join("、")}` : "", noUsedCount ? (zh ? `${noUsedCount} 个部分没填用量` : `使用量未入力 ${noUsedCount}`) : ""].filter(Boolean).join("\n")}>
            {zh ? "算不全" : "未確定"}{missingNames.length ? (zh ? `：${missingNames.length} 项原料没价` : `：価格なし ${missingNames.length}`) : ""}{noUsedCount ? (zh ? `，${noUsedCount} 个部分没填用量` : `、未入力 ${noUsedCount}`) : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// 2026-09-29 体检第 2 批:毛利卡片以前只看有没有填售价 —— 各部分都没填用量时单份成本 ¥0、毛利率绿色 100%;
// 有部分没填用量 / 原料没价时照样显示,看起来很健康。详情页和编辑页共用这一个判断:
// 成本是 0 → 毛利率显示「—」;算不全(creationBatch.incomplete)或用量写法有歧义 → 不给绿色,标「算不全 / 用量待确认」并说清原因。
const creationMarginView = ({ batch, priceNum, costPerPortion, marginPercent, lang = "zh" }) => {
  const zh = lang !== "ja";
  const parts = (batch && batch.parts) || [];
  const noUsedCount = parts.filter(p => p.noUsed).length;
  const missingCount = new Set(parts.flatMap(p => p.missingIngs.map(i => _normTxt(i.nameZh) || _normTxt(i.nameJa)))).size;
  const ambiguousCount = parts.filter(p => !p.noUsed && usedAmountAmbiguous(p.layer.usedAmount)).length;
  const zeroCost = !(costPerPortion > 0);
  const incomplete = !!(batch && batch.incomplete) || (zeroCost && parts.length > 0);  // 还没加部分时只显示「—」,不提示
  const unsure = incomplete || ambiguousCount > 0;
  const reasons = [
    noUsedCount ? (zh ? `${noUsedCount} 个部分没填用量（或读不出数字）` : `使用量未入力 ${noUsedCount}`) : "",
    missingCount ? (zh ? `${missingCount} 项原料没价` : `価格なし ${missingCount}`) : "",
    ambiguousCount ? (zh ? `${ambiguousCount} 个部分的用量只按开头的数字算` : `使用量が曖昧 ${ambiguousCount}`) : "",
    (zeroCost && !noUsedCount && !missingCount) ? (zh ? "还算不出成本" : "原価を計算できません") : "",
  ].filter(Boolean);
  const showPct = priceNum > 0 && !zeroCost;
  return {
    unsure,
    text: showPct ? `${marginPercent.toFixed(1)}%` : "—",
    // 低于 50% 先标红:成本算不全时实际毛利只会更低,不能因为「不确定」降成黄色(审查发现)
    color: !showPct ? T.textSecondary : marginPercent < 50 ? T.danger : unsure ? T.warning : marginPercent >= 65 ? T.success : T.warning,
    badge: unsure ? (incomplete ? (zh ? "算不全" : "未確定") : (zh ? "用量待确认" : "使用量要確認")) : "",
    note: unsure ? `⚠ ${zh ? "成本" : "原価"}${incomplete ? (zh ? "算不全" : "未確定") : (zh ? "可能不准" : "要確認")}：${reasons.join(zh ? "，" : "、")}${showPct && incomplete ? (zh ? "。这里的毛利率虚高，实际比这里低。" : "。この粗利率は過大で、実際はもっと低くなります。") : ""}` : "",
  };
};

function CreationDetail({ creation: c, lang, onEdit, onBack, backLabel = null, onUpdateCreation, showToast, onPrint, knowledge = [], recipes = [], components = [], creations = [], materials = [], brands = [], onNavigateToKnowledge }) {
  const [expandedLayer, setExpandedLayer] = useState(null);
  const [viewMode, setViewMode] = useState("detail"); // "detail" | "recipe" | "menu"
  const name = pickLang(c, "name", lang);
  const description = c.description || "";
  const layers = c.layers || [];
  const W = creationWords(creationStructureOf(c), lang);  // 叠层 / 拼装的叫法

  // v17.8: 每部分和组件库的关系 + 老数据「和组件库不一样」的处理按钮(先做 + 给撤销)
  const matIds = useMemo(() => new Set((materials || []).map(m => m && m.id)), [materials]);
  const linkStates = layers.map(l => layerLinkState(l, components, matIds));
  const differsIdx = linkStates.map((s, i) => s === "differs" ? i : -1).filter(i => i >= 0);
  const layerTitle = (l) => l.customName || pickLang(l, "name", lang) || "";
  // 2026-09-29 体检第 2 批:撤销以前按「第几个部分」还原 —— 这几秒里进编辑删了前面的部分,旧内容会写到别的部分上。
  // 现在按身份认:组件 id + 它是这个产品里第几个用同一组件的部分(_lid 保存时会去掉,不能用);认不出就不还原,提示一句。
  const layerKeyAt = (arr, i) => {
    const sid = arr[i] && arr[i].sourceComponentId;
    if (!sid) return null;
    let k = 0;
    for (let j = 0; j < i; j++) if (arr[j] && arr[j].sourceComponentId === sid) k++;
    return `${sid}#${k}`;
  };
  const patchLayers = (patches, msg) => {
    if (!onUpdateCreation) return;
    const before = {};   // 身份 → 改之前的整个部分
    Object.keys(patches).forEach(i => { const key = layerKeyAt(layers, Number(i)); if (key) before[key] = layers[i]; });
    onUpdateCreation(c.id, cr => ({ ...cr, layers: (cr.layers || []).map((l, i) => patches[i] ? { ...l, ...patches[i] } : l) }));
    if (showToast) showToast(msg, { undo: () => {
      const want = Object.keys(before).length;
      let restored = -1;   // 更新函数没跑 = 产品已经不在了
      onUpdateCreation(c.id, cr => {
        const cur = cr.layers || [];
        let n = 0;
        // 同一个组件用了两次、中间又删了一个时,「第几个」会错位到另一部分上:部分名和用量也得对得上才还原(审查发现)
        const samePart = (l, b) => (l.customName || "") === (b.customName || "") && String(l.usedAmount || "") === String(b.usedAmount || "");
        const next = cur.map((l, i) => { const key = layerKeyAt(cur, i); const b = key ? before[key] : undefined; if (b !== undefined && samePart(l, b)) { n++; return b; } return l; });
        restored = n;
        return { ...cr, layers: next };
      });
      // 更新函数在 React 渲染时才跑,等它跑完再看还原了几个
      setTimeout(() => {
        if (restored < want) showToast(lang === "zh" ? "有的部分已经改过或删掉了，找不到原来那一部分，没有还原" : "該当パーツが見つからないため、一部を元に戻せませんでした");
      }, 0);
    } });
  };
  const applyLib = (idxs) => {
    const patches = {};
    idxs.forEach(i => { patches[i] = { follow: true, localVariant: false }; });
    patchLayers(patches, idxs.length === 1
      ? `「${layerTitle(layers[idxs[0]])}」改成跟组件库走，内容换成组件库现在的`
      : `${idxs.length} 个${W.isStack ? "层" : "部分"}改成跟组件库走，内容换成组件库现在的`);
  };
  const keepLocal = (i) => patchLayers({ [i]: { follow: false, localVariant: true } }, `「${layerTitle(layers[i])}」标成本产品专用，不再跟组件库`);

  // 🧮 单层实际成本:按这一层的配料实时算,不读存下来的 totalCost(没有币种,见 getIngsLiveCost)
  const calcLayerActualCost = (l) => calcLayerLiveCost(l, materials, brands);

  const totalCostAll = layers.reduce((s, l) => s + calcLayerActualCost(l), 0);
  const servesNum = parseFloat(c.serves) || 1;
  const costPerCake = totalCostAll / servesNum;
  const portionsNum = parseFloat(c.portions) || 1;
  const costPerPortion = costPerCake / portionsNum;
  const priceNum = toCNY(c.price, priceCurOf(c));
  const marginPercent = priceNum > 0 ? ((priceNum - costPerPortion) / priceNum * 100) : 0;
  // 2026-09-29 体检第 2 批:算不全时毛利卡片要标出来(以前没填用量时显示绿色 100%)
  const marginView = creationMarginView({ batch: creationBatch(c, null, components, materials, brands), priceNum, costPerPortion, marginPercent, lang });

  // 关联知识点(反向查找,和知识页按钮同一套规则,见 makeKnowledgeLinkResolver)
  const relatedKnowledge = knowledgeLinksTo("creation", c.id, knowledge, recipes, components, creations);

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
          {lang === "zh" ? "组合产品详情" : "組立製品詳細"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn size="sm" onClick={onEdit}>{lang === "zh" ? "编辑" : "編集"}</Btn>
          <Btn onClick={onBack}>{backLabel || (lang === "zh" ? "← 返回" : "← 戻る")}</Btn>
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
              c.serves ? `${c.serves}${W.unit}` : null,
              c.portions ? `${c.portions}${lang === "zh" ? "等分" : "等分"}` : null,
              c.prepTime,
              c.shelfLife,
              layers.length > 0 ? W.partCount(layers.length) : null,
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
              <div style={{ fontSize: 11, color: "#666" }}>{W.perUnitCost}</div>
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
              {/* 2026-09-29 体检第 2 批:成本 0 → 「—」;算不全 → 不给绿色 + 标签(以前绿色 100%) */}
              <div style={{ fontSize: 16, fontWeight: 500, color: marginView.color }}>
                {marginView.text}
              </div>
              {marginView.badge && (
                <span style={{ display: "inline-block", marginTop: 2, fontSize: 10, color: T.warning, border: `0.5px solid ${T.warning}`, borderRadius: T.radiusPill, padding: "0 6px" }}>{marginView.badge}</span>
              )}
            </div>
          </div>
          {marginView.note && (
            <div style={{ fontSize: 11, color: T.warning, marginTop: 8, lineHeight: 1.6 }}>{marginView.note}</div>
          )}
          {/* 成本算不全但已经低于 50%:照样亮红线(实际只会更低) */}
          {priceNum > 0 && costPerPortion > 0 && (!marginView.note || marginPercent < 50) && (
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

      {/* 📘 配方模式 = 整体配方(v17.8):按个数算、能打印,组装步骤和整体备注也在里面 */}
      {viewMode === "recipe" && (
        <CreationRecipeSheet key={c.id} c={c} lang={lang} components={components} materials={materials} brands={brands} onPrint={onPrint} />
      )}

      {/* 🎂 层结构（带示意图） */}
      {viewMode !== "recipe" && (
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>{W.sectionTitle}</div>
        {layers.length === 0 && <div style={{ fontSize: 13, color: "#999999" }}>{W.emptyDetail}</div>}
        {/* v17.8: 老数据里和组件库现在的内容不一样的部分,先照旧显示产品里存的版本,点了才换 */}
        {viewMode === "detail" && differsIdx.length > 0 && (
          <div style={{ border: `0.5px solid ${T.danger}`, background: "#FFFFFF", padding: "8px 12px", marginBottom: 12, fontSize: 12, lineHeight: 1.6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ flex: 1, minWidth: 200 }}>
              {lang === "zh"
                ? `${differsIdx.length} 个${W.isStack ? "层" : "部分"}和组件库现在的内容不一样（老数据）。现在显示的还是这个产品里存的版本，在下面逐个选用哪个。`
                : `${differsIdx.length} 件が部品庫の現在の内容と異なります（旧データ）。下で個別に選択してください。`}
            </span>
            {differsIdx.length >= 2 && onUpdateCreation && (
              <Btn size="sm" onClick={() => applyLib(differsIdx)}>{lang === "zh" ? "全部用组件库的" : "すべて部品庫に合わせる"}</Btn>
            )}
          </div>
        )}

        {layers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: W.isStack ? "60px 1fr" : "1fr", gap: 12 }}>
            {/* 左侧：示意图(只有叠层画;拼装不分上下,不画) */}
            {W.isStack && <div style={{ display: "flex", flexDirection: "column", gap: 2, position: "sticky", top: 10, alignSelf: "start" }}>
              {layers.map((l, i) => {
                const cat = getCompCat(l.componentCategory);
                const usedAmount = parseUsedAmount(l.usedAmount, l.unit);  // 2026-09-29 体检第 2 批:和成本同一个读法
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
            </div>}

            {/* 右侧：层列表 */}
            <div>
              {layers.map((l, i) => {
                const cat = getCompCat(l.componentCategory);
                const n = pickLang(l, "name", lang);
                const isExpanded = expandedLayer === i;
                const displaySteps = pickSteps(l, lang);
                const displayNotes = pickLang(l, "notes", lang) || l.notes;
                const actualCost = calcLayerActualCost(l);
                const usedAmount = parseUsedAmount(l.usedAmount, l.unit);  // 2026-09-29 体检第 2 批:和成本同一个读法(以前「约45g/个」显示未填)
                const usedUnit = l.unit || "g";  // 2026-09-29 体检第 2 批:以前写死 g,单位是「颗 / 个」时写错

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
                              <span>📏 {W.usedLabel} <strong>{usedAmountNote(l.usedAmount) ? l.usedAmount : `${usedAmount}${usedUnit}`}</strong>{usedAmountAmbiguous(l.usedAmount) && <span style={{ color: "#CA8A04" }}>（按 {fmtQty(usedAmount)} {usedUnit} 算）</span>}</span>
                            ) : (
                              <span style={{ color: "#CA8A04" }}>⚠ {usedAmountNote(l.usedAmount) ? `用量读不出数字（${l.usedAmount}）` : "未填用量"}</span>
                            )}
                            <span>💰 {W.costLabel} <strong>{fmtCost(actualCost)}</strong></span>
                            <span>🧪 {(l.ingredients || []).length}种原料</span>
                            {LAYER_LINK_TAGS[linkStates[i]] && linkStates[i] !== "differs" && (
                              <span title={LAYER_LINK_TAGS[linkStates[i]].hint} style={{ color: LAYER_LINK_TAGS[linkStates[i]].color }}>
                                {lang === "zh" ? LAYER_LINK_TAGS[linkStates[i]].zh : LAYER_LINK_TAGS[linkStates[i]].ja}
                              </span>
                            )}
                          </>
                        )}
                        {viewMode === "recipe" && (
                          <>
                            {usedAmount > 0 && <span>📏 <strong>{usedAmount}{usedUnit}</strong></span>}
                            <span>🧪 {(l.ingredients || []).length}种原料</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* v17.8: 和组件库不一样(老数据)→ 两个按钮;本产品专用 → 可改回跟组件库。都是先做 + 给撤销 */}
                    {viewMode === "detail" && onUpdateCreation && linkStates[i] === "differs" && (
                      <div style={{ marginTop: 8, marginLeft: 22, padding: "6px 10px", background: "#FFFFFF", border: `0.5px solid ${T.danger}`, fontSize: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ flex: 1, minWidth: 160, color: T.danger }}>
                          {lang === "zh" ? "和组件库现在的内容不一样" : "部品庫と相違"}
                          {(() => { const comp = components.find(x => x && x.id === l.sourceComponentId); const d = layerDiffLabels(l, comp, matIds, lang); return d.length ? (lang === "zh" ? `（差在：${d.join("、")}）` : `（${d.join("・")}）`) : ""; })()}
                        </span>
                        <Btn size="sm" onClick={(e) => { e.stopPropagation(); applyLib([i]); }}>{lang === "zh" ? "用组件库的" : "部品庫に合わせる"}</Btn>
                        <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); keepLocal(i); }}>{lang === "zh" ? "保留（本产品专用）" : "この製品専用で残す"}</Btn>
                      </div>
                    )}
                    {viewMode === "detail" && onUpdateCreation && linkStates[i] === "local" && isExpanded && (
                      <div style={{ marginTop: 8, marginLeft: 22 }}>
                        <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); applyLib([i]); }}>{lang === "zh" ? "↺ 改回跟组件库" : "↺ 部品庫に戻す"}</Btn>
                      </div>
                    )}

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
      )}

      {/* 🎂 整体组装工艺 (creation.stepsZh / stepsJa) — 多层组装的全局工艺步骤(配方模式在整体配方里) */}
      {viewMode === "detail" && (() => {
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

      {/* 📝 整体备注 (creation.notesZh / notesJa)(配方模式在整体配方里) */}
      {viewMode === "detail" && (() => {
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

// ─── 组合产品编辑 Form ───────────────────────────────────────────
function CreationEditForm({ creation, components, cats, onUpdateCats, brands = [], materials = [], setShopMaterials, onSave, onDelete, onBack, onUpdateComponent, confirmDialog, showToast, knowledge = [], lang = "zh" }) {
  const isNew = !creation;
  const matIds = useMemo(() => new Set((materials || []).map(m => m && m.id)), [materials]);
  const [errorMsg, setErrorMsg] = useState("");
  const empty = {
    nameZh: "", nameJa: "", nameFr: "",
    mold: "", size: "", serves: "", portions: "",
    description: "",
    chef: "", flavorTags: [],
    status: "試作",
    price: "", priceCurrency: "CNY", prepTime: "", shelfLife: "",
    structure: "stack",  // 叠层 / 拼装,见 CREATION_STRUCTURES;老数据没有这个字段 = 叠层
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
  const dirtyBind = useDirtyGuard(() => form);   // 没保存就切页时 App 先问一句(部分编辑页另有自己的)
  const leave = () => confirmLeave(dirtyBind.isDirty, confirmDialog, lang, onBack);   // C15:「← 返回」「取消」有改动先问
  // v17.8: 编辑期间组件库变了(比如刚「↻ 同步回组件库」),表单里跟组件库走的部分也换成最新内容,
  // 不然打开同组件的另一部分看到的是旧的,原样保存会被当成「改过」而变成本产品专用
  useEffect(() => {
    setForm(prev => syncFollowingLayers([prev], components, matIds)[0]);
  }, [components, matIds]);
  const structure = creationStructureOf(form);
  const W = creationWords(structure, lang);  // 叠层 / 拼装的叫法,切换只换文字和示意图,不动 layers

  // 🧮 单层实际成本 = 这一层配料的实时成本 × (本蛋糕用量 / 组件产出量),和详情页同一个函数
  const calcLayerActualCost = (l) => calcLayerLiveCost(l, materials, brands);

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
  // 2026-09-29 体检第 2 批:和详情页同一个判断,算不全时毛利卡片不给绿色 100%
  const marginView = creationMarginView({ batch: creationBatch(form, null, components, materials, brands), priceNum, costPerPortion, marginPercent, lang });

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const fTasting = (key) => (e) => setForm(prev => ({ ...prev, tasting: { ...prev.tasting, [key]: e.target.value } }));

  // 添加组件作为一层 —— 内容字段和「跟组件库同步」共用 layerContentFromComponent,默认跟组件库走
  const addLayerFromComponent = (comp) => {
    const newLayer = {
      _lid: Date.now() + Math.random(),
      sourceComponentId: comp.id,
      customName: "", // 自定义层名（例：①顶层饼底）
      usedAmount: "", // 这一批(制作个数)的用量
      ...layerContentFromComponent(comp),
      follow: true,
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
      confirmDialog(W.deleteConfirm, doDelete);
    } else {
      if (window.confirm(W.deleteConfirm)) doDelete();
    }
  };

  const moveLayer = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= form.layers.length) return;
    const newLayers = [...form.layers];
    [newLayers[idx], newLayers[newIdx]] = [newLayers[newIdx], newLayers[idx]];
    setForm(prev => ({ ...prev, layers: newLayers }));
  };

  // 保存部分时定标记:内容和组件库一样 → 跟组件库;不一样 → 本产品专用。
  // opts.synced = 刚点了「↻ 同步回组件库」(组件库这一刻还没刷新到这里,不能拿来比),直接算跟组件库
  const updateLayer = (idx, updatedLayer, opts = {}) => {
    let next = updatedLayer;
    if (updatedLayer && updatedLayer.sourceComponentId) {
      const comp = components.find(c => c && c.id === updatedLayer.sourceComponentId);
      if (opts.synced) {
        next = { ...updatedLayer, follow: true, localVariant: false };
      } else if (comp) {
        if (sameLayerContent(updatedLayer, comp, matIds)) {
          next = { ...updatedLayer, follow: true, localVariant: false };
        } else {
          next = { ...updatedLayer, follow: false, localVariant: true };
          if (layerLinkState(form.layers[idx], components, matIds) === "follow" && showToast) {
            const nm = updatedLayer.customName || updatedLayer.nameZh || updatedLayer.nameJa || "";
            showToast(`「${nm}」改成了本产品专用，不再跟组件库。想让组件库也改，编辑这一部分时点「↻ 同步回组件库」。`, { ms: 6000 });
          }
        }
      }
    }
    setForm(prev => ({
      ...prev,
      layers: prev.layers.map((l, i) => i === idx ? next : l)
    }));
    setEditingLayerIdx(null);
  };

  const handleSave = () => {
    if (!form.nameZh.trim()) {
      setErrorMsg("请输入产品名称");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    onSave({
      ...form,
      id: creation ? creation.id : "creation_" + Date.now(),
      structure,
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
        structure={structure}
        cats={cats}
        onUpdateCats={onUpdateCats}
        brands={brands}
        materials={materials}
        onSave={(updated, opts) => updateLayer(editingLayerIdx, updated, opts)}
        onBack={() => setEditingLayerIdx(null)}
        onUpdateComponent={onUpdateComponent}
        linkState={layerLinkState(layer, components, matIds)}
        lang={lang}
        setShopMaterials={setShopMaterials}
        showToast={showToast}
        confirmDialog={confirmDialog}
      />
    );
  }

  return (
    <div {...dirtyBind}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{isNew ? "新建组合产品" : "编辑组合产品"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isNew && <Btn variant="danger" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={leave}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* 💡 懒人模式提示 */}
      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：中文名必填，日文可以不填。规格和售价用于自动计算成本和毛利率。
      </div>

      {/* 基本信息 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>🏷️ 基本信息</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>产品名（中文）</label>
            <input value={form.nameZh} onChange={f("nameZh")} placeholder="热带水果白巧克力慕斯蛋糕" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>产品名（日本語）</label>
            <input value={form.nameJa} onChange={f("nameJa")} placeholder="アグレアブル トロピカル" style={inpStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>产品名（FR）</label>
            <input value={form.nameFr} onChange={f("nameFr")} placeholder="Tropique Blanc" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>原作者 / 师承</label>
            <input value={form.chef || ""} onChange={f("chef")} placeholder="例：マプリエール 猿館シェフ" style={inpStyle} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>概念描述</label>
          <textarea value={form.description} onChange={f("description")} placeholder="这个产品想表达什么？口味方向？灵感来源？" style={{...inpStyle, minHeight: 60, resize: "vertical"}} />
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
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{W.servesLabel}</label>
            <input type="number" value={form.serves || ""} onChange={f("serves")} placeholder="4" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{W.portionsLabel}</label>
            <input type="number" value={form.portions || ""} onChange={f("portions")} placeholder="8" style={inpStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>售价（每份 ¥）</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input type="number" value={form.price || ""} onChange={f("price")} placeholder="780" style={inpStyle} />
              {priceCurBtn(form, (c, p) => setForm(prev => ({ ...prev, priceCurrency: c, price: p })), lang, form.price)}
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
            <div style={{ color: "#666" }}>{W.perUnitCost}</div>
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
            {/* 2026-09-29 体检第 2 批:成本 0 → 「—」;算不全 → 不给绿色 + 标签(以前绿色 100%) */}
            <div style={{ fontSize: 15, fontWeight: 500, color: marginView.color }}>
              {marginView.text}
            </div>
            {marginView.badge && (
              <span style={{ display: "inline-block", marginTop: 2, fontSize: 10, color: T.warning, border: `0.5px solid ${T.warning}`, borderRadius: T.radiusPill, padding: "0 6px" }}>{marginView.badge}</span>
            )}
          </div>
        </div>
        {marginView.note && (
          <div style={{ fontSize: 11, color: T.warning, marginTop: 8, lineHeight: 1.6 }}>{marginView.note}</div>
        )}
        {priceNum > 0 && costPerPortion > 0 && (!marginView.note || marginPercent < 50) && (
          <div style={{ fontSize: 11, color: "#166534", marginTop: 8, lineHeight: 1.6 }}>
            📊 {marginPercent >= 65 ? "✅ 毛利率健康（≥65%）" : marginPercent >= 50 ? "⚠️ 毛利率偏低（50-65%）建议调整" : "🚨 毛利率过低（<50%）需要涨价或降本"}
          </div>
        )}
        {(form.layers || []).length > 0 && !form.layers.every(l => l.usedAmount) && (
          <div style={{ fontSize: 11, color: "#CA8A04", marginTop: 6, lineHeight: 1.6 }}>
            {W.tipFillUsed}
          </div>
        )}
      </div>

      {/* 层结构构建 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{W.sectionTitle}</div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{W.sectionHint}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn size="sm" variant="primary" onClick={() => setShowComponentPicker(true)}>+ 从组件库选</Btn>
            <Btn size="sm" onClick={() => addEmptyLayer()}>{W.newBlank}</Btn>
          </div>
        </div>

        {/* 结构:叠层 / 拼装。只换文字和示意图,不动已加的层 */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: T.textTertiary }}>{lang === "zh" ? "结构" : "構造"}</span>
          {CREATION_STRUCTURES.map(s => {
            const active = structure === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, structure: s.id }))}
                title={lang === "zh" ? s.hintZh : s.hintJa}
                style={{
                  padding: "4px 12px", fontSize: 12, cursor: "pointer", fontFamily: T.fontSans,
                  border: `${active ? 1 : 0.5}px solid ${active ? T.brand : T.border}`, borderRadius: T.radiusPill,
                  background: active ? T.brand : T.bgCard, color: active ? T.bgApp : T.textSecondary,
                  fontWeight: active ? 500 : 400, transition: "all 0.15s",
                }}
              >{lang === "zh" ? s.zh : s.ja}</button>
            );
          })}
          <span style={{ fontSize: 11, color: T.textTertiary }}>
            {(CREATION_STRUCTURES.find(s => s.id === structure) || CREATION_STRUCTURES[0])[lang === "zh" ? "hintZh" : "hintJa"]}
          </span>
        </div>

        {(!form.layers || form.layers.length === 0) && (
          <div style={{ textAlign: "center", padding: "2rem", color: "#999999", fontSize: 13, border: "1px dashed #CCCCCC", borderRadius: 8 }}>
            {W.emptyEdit}
          </div>
        )}

        {/* 📐 结构示意图 + 详细列表 */}
        {(form.layers || []).length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: W.isStack ? "50px 1fr" : "1fr", gap: 10 }}>
            {/* 左侧：垂直堆叠示意图(只有叠层画;拼装不分上下,不画) */}
            {W.isStack && <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {form.layers.map((layer, idx) => {
                const cat = getCompCat(layer.componentCategory);
                return (
                  <div key={layer._lid || idx} title={layer.customName || layer.nameZh || layer.nameJa} style={{ background: cat.color, height: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 10, fontWeight: 500, opacity: 0.9 }}>
                    {idx + 1}
                  </div>
                );
              })}
            </div>}

            {/* 右侧：详细列表 */}
            <div>
              {form.layers.map((layer, idx) => {
                const cat = getCompCat(layer.componentCategory);
                const name = layer.nameZh || layer.nameJa || "未命名";
                const actualCost = calcLayerActualCost(layer);
                const componentYield = parseFloat(layer.yield) || 0;
                const usedAmount = parseUsedAmount(layer.usedAmount, layer.unit);  // 2026-09-29 体检第 2 批:和成本同一个读法(以前 parseFloat)
                const usedUnit = layer.unit || "g";  // 2026-09-29 体检第 2 批:以前提示和占位字写死 g
                const usedNote = usedAmountNote(layer.usedAmount);
                const linkTag = LAYER_LINK_TAGS[layerLinkState(layer, components, matIds)];
                const updateLayerField = (field, val) => setForm(prev => ({ ...prev, layers: prev.layers.map((l, i) => i === idx ? { ...l, [field]: val } : l) }));
                return (
                  <div key={layer._lid || idx} style={{ borderLeft: `4px solid ${cat.color}`, background: cat.bg, padding: "10px 14px", marginBottom: 8, borderRadius: "0 6px 6px 0" }}>
                    {/* 顶部：序号+类别+原组件名+来源+按钮 */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 12, background: "#FFFFFF", color: cat.color, padding: "2px 10px", borderRadius: 20, fontWeight: 500 }}>{idx + 1}. {cat.zh}</span>
                        <span style={{ fontSize: 13, color: cat.color }}>{name}</span>
                        {linkTag && <span title={linkTag.hint} style={{ fontSize: 10, color: linkTag.color, border: `0.5px solid ${linkTag.color}`, borderRadius: T.radiusPill, padding: "0 6px", background: "#FFFFFF" }}>{linkTag.zh}</span>}
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
                        placeholder={W.customNamePh}
                        style={{ padding: "5px 8px", fontSize: 11, border: "0.5px solid #CCCCCC", borderRadius: 4, background: "#FFFFFF", color: "#111", fontFamily: "system-ui, sans-serif" }}
                      />
                      {/* v17.8: 文字框 —— 老数据里有「約 60–80g(φ15 1 片)」这种带说明的用量,数字框会显示成空白;
                          计算只认开头的数字(parseFloat),读不出数字时下面提示 */}
                      <input
                        type="text"
                        inputMode="decimal"
                        value={layer.usedAmount || ""}
                        onChange={e => updateLayerField("usedAmount", e.target.value)}
                        placeholder={componentYield > 0 ? `这一批的用量 ${usedUnit}（组件整批 ${componentYield}${usedUnit}）` : `这一批的用量 ${usedUnit}`}
                        title={`用量 = 做「${W.servesLabel}」那么多${W.isStack ? "台" : "个"}时，这一部分一共要多少`}
                        style={{ padding: "5px 8px", fontSize: 11, border: "0.5px solid #F59E0B", borderRadius: 4, background: "#FFFBEB", color: "#111", fontFamily: "system-ui, sans-serif" }}
                      />
                      <div style={{ padding: "5px 8px", fontSize: 11, color: "#666", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        {actualCost > 0 ? <span>{W.costLabel} <strong style={{ color: "#059669" }}>{fmtCost(actualCost)}</strong></span> : <span style={{ color: "#999" }}>填用量→算成本</span>}
                      </div>
                    </div>

                    {/* 提示用量未填 / 带说明的用量只认开头的数字 */}
                    {componentYield > 0 && !usedAmount && (
                      <div style={{ fontSize: 10, color: "#CA8A04", marginTop: 4 }}>
                        {usedNote ? `⚠ 用量读不出数字，成本和整体配方都按 0 算。改成这一批一共多少的纯数字（${usedUnit}）` : "⚠ 未填写用量，成本计算不准确"}
                      </div>
                    )}
                    {usedAmount > 0 && usedAmountAmbiguous(layer.usedAmount) && (
                      <div style={{ fontSize: 10, color: "#CA8A04", marginTop: 4 }}>
                        ⚠ 只认开头的数字：按 {fmtQty(usedAmount)} {usedUnit} 算（是这一批一共的量，不是每个的量）。不对的话改成纯数字（{usedUnit}）
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
        <Btn onClick={leave}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
        <Btn variant="primary" onClick={handleSave}>{lang === "zh" ? "保存" : "保存"}</Btn>
      </div>

      {/* 组件选择弹窗 */}
      {showComponentPicker && (
        <ComponentPicker
          components={components}
          materials={materials}
          brands={brands}
          onSelect={addLayerFromComponent}
          onClose={() => setShowComponentPicker(false)}
        />
      )}
    </div>
  );
}

// ─── 组件选择弹窗 ─────────────────────────────────────────────
function ComponentPicker({ components, materials = [], brands = [], onSelect, onClose, lang = "zh" }) {
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
                      <span>¥{getIngsLiveCost(c.ingredients, materials, brands).toFixed(0)}</span>
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
function LayerEditForm({ layer, structure = "stack", cats = [], brands = [], materials = [], onSave, onBack, onUpdateComponent, linkState = "follow", lang = "zh", onUpdateCats, setShopMaterials, showToast, confirmDialog }) {
  const W = creationWords(structure, lang);  // 叠层 / 拼装的叫法(「层」还是「部分」)
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
          return { ...linked, _id: idx, unitPrice: String(pp), currency: "CNY", _originalPrice: String(pp), cost: q > 0 ? (q * pp).toFixed(1) : linked.cost };  // v17: pp 已折成人民币,不标 CNY 会被当日元再乘一次汇率
        }
      }
    }
    return { ...linked, _id: idx, _originalPrice: linked.unitPrice || "" };   // C6:_originalPrice = 改价追踪 / ↺ 的原价(保存 / 同步回组件库时去掉)
  }));
  const [saveToShop, setSaveToShop] = useState(true);   // C6:改了关联材料的价 → 保存时同时写本店原料(默认勾上)
  // 层从组件带来的是 stepsZh / stepsJa(addLayerFromComponent);以前这里只读老字段 steps,打开就是空的。
  // 和组件编辑页同一套:中日两栏,老数据只有 steps 时放进日文栏
  const initStepsZh = layer.stepsZh || [];
  const initStepsJa = layer.stepsJa || layer.steps || [];
  const [steps, setSteps] = useState(
    Array.from({ length: Math.max(initStepsZh.length, initStepsJa.length, 1) }, (_, i) => ({
      _id: i,
      textZh: initStepsZh[i] || "",
      textJa: initStepsJa[i] || "",
    }))
  );
  const dirtyBind = useDirtyGuard(() => ({ form, ings, steps }));   // 没保存就切页时 App 先问一句
  const leave = () => confirmLeave(dirtyBind.isDirty, confirmDialog, lang, onBack);   // C15:「← 取消」「取消」这一部分有改动先问
  // 保存层和同步回组件库共用。老字段 steps 要清掉,不然两栏都删空时 pickSteps 会回退到它
  const stepsOut = () => ({
    ...stepsForSave(steps),   // C11:中日按行对齐存(中间空着的留 "")
    steps: undefined,
  });
  const nextIngId = useRef(ings.length);
  const nextStepId = useRef(steps.length);

  const totalCost = ings.reduce((s, i) => s + toCNY(i.cost, curOf(i)), 0);  // v17: 各按各的币种折成人民币再相加
  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  // 未关联材料对话框
  const [unlinkedDialog, setUnlinkedDialog] = useState(null);

  // opts.synced:刚同步回组件库,这一部分直接算「跟组件库」(见 CreationEditForm.updateLayer)
  const doSave = (finalIngs, opts) => {
    const validIngs = finalIngs.filter(ingHasName);   // C13:名字只有空格的行不存
    // 改过价的关联行保留她填的价(C6);勾着「保存到本店原料」就同时写进去
    const refreshedIngs = validIngs.map(i => refreshIngForSave(i, materials));
    if (saveToShop) {
      const { n, undo } = saveIngPricesToShop(refreshedIngs, setShopMaterials);   // 审查第 2 轮:给撤销
      // 审查第 2 轮:部分保存时本店原料就写进去了,不等组合产品保存;提示写明,免得她以为「不保存离开」能撤回
      if (n > 0 && typeof showToast === "function") showToast(lang === "zh" ? `✓ ${n} 项已保存到本店原料(立即生效,组合产品不保存也会保留)` : `✓ ${n} 件を仕入れ原料に保存(すぐ反映・組み合わせを保存しなくても残ります)`, { undo });
    }
    const total = refreshedIngs.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
    onSave({
      ...form,
      ingredients: refreshedIngs.map(({ _id, _priceModified, _originalPrice, ...rest }) => rest),
      ...stepsOut(),
      totalCost: total,
    }, opts);
  };

  const handleSave = () => {
    // 2026-09-29:同组件编辑页,不再弹已停用的旧价格表「未在价格表中」对话框
    doSave(ings);
  };

  const handleSyncBackToComponent = () => {
    if (!layer.sourceComponentId) {
      onBack(); // 这一层不是从组件库来的，直接返回
      return;
    }
    const validIngs = ings.filter(ingHasName);
    const total = validIngs.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
    // 只带这一页能看到、能改的字段,App 那边按字段合并到原组件上。
    // 组件自己的法文名 / 整体备注这一页没有输入框,层里存的只是加层时的旧副本,推回去会盖掉组件后来的修改,所以不带
    // (配料行的备注 / 法文名在配料表里能改,随 ingredients 一起带)
    const updated = {
      id: layer.sourceComponentId,
      nameZh: form.nameZh, nameJa: form.nameJa,
      componentCategory: form.componentCategory,
      yield: form.yield, unit: form.unit,
      ingredients: validIngs.map(({ _id, _priceModified, _originalPrice, ...rest }) => rest),
      ...stepsOut(),
      totalCost: total,
      updatedAt: new Date().toISOString(),
    };
    // v17.8: 确认同步后顺手把这一部分也存上并标「跟组件库」—— 组件库刚被改成这里的内容,两边已经一样
    onUpdateComponent(updated, () => doSave(ings, { synced: true }));
  };

  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };
  const cat = getCompCat(form.componentCategory);

  return (
    <div {...dirtyBind}>
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
        <div style={{ fontSize: 16, fontWeight: 500 }}>{W.editTitle}{form.nameZh || form.nameJa || "未命名"}</div>
        <Btn onClick={leave}>← 取消</Btn>
      </div>

      {layer.sourceComponentId && (
        <div style={{ background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: "8px", padding: "10px 14px", marginBottom: "1rem", fontSize: 12, color: "#1E40AF", lineHeight: 1.6 }}>
          {W.linkNote(linkState)}
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
        {/* 配料表:三个编辑页共用 IngredientTable,差异在 ING_TABLE_VARIANTS.layer */}
        <IngredientTable variant="layer" ings={ings} setIngs={setIngs} nextIdRef={nextIngId} cats={cats} materials={materials} brands={brands} lang={lang}
          onPickMaterial={setPickerTargetIngId} onOpenBulk={() => setShowBulkMatch(true)} />
        {/* 2026-09-29 体检第 2 批:以前叫「该层成本」,其实是组件整批的成本(还是存下来的成本快照),
            和产品编辑页按用量折算的「本层成本」差好几倍。改名 + 按实时价 + 另给一行按用量折算的这一部分成本 */}
        {(() => {
          const zh = lang !== "ja";
          const liveIngs = ings.filter(ingHasName);
          const batchCost = getIngsLiveCost(liveIngs, materials, brands);
          const yNum = parseFloat(form.yield) || 0;
          const unitTxt = form.unit || "g";
          const usedNum = parseUsedAmount(form.usedAmount, form.unit);
          const partCost = calcLayerLiveCost({ ...form, ingredients: liveIngs }, materials, brands);
          const partWord = W.isStack ? (zh ? "本层" : "この層") : (zh ? "这一部分" : "このパーツ");
          return (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#F5F5F5", borderRadius: 6, fontSize: 13 }}>
              <div>{zh ? "组件整批成本" : "全量原価"}{yNum > 0 ? `（${fmtQty(yNum)} ${unitTxt}）` : ""}：<strong>{fmtCost(batchCost) || "¥0"}</strong></div>
              <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>
                {yNum > 0
                  ? (usedNum > 0
                    ? (zh ? `${partWord}用 ${fmtQty(usedNum)} ${unitTxt}，成本 ${fmtCost(partCost) || "¥0"}（按用量 ÷ 产出量折算，产品成本按这个算）` : `${partWord} ${fmtQty(usedNum)} ${unitTxt}：${fmtCost(partCost) || "¥0"}`)
                    : (zh ? `${partWord}还没填用量，按用量折算的成本算不出（回产品编辑页填用量）` : "使用量未入力のため按分原価は未計算"))
                  : (zh ? `没填产出量：整批成本都算进产品成本` : "出来高未入力：全量原価をそのまま計上")}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 制法 */}
      <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>{lang === "zh" ? "制作流程（中日双语）" : "作り方（中国語・日本語）"}</div>
          <Btn size="sm" onClick={() => setSteps(prev => [...prev, { _id: nextStepId.current++, textZh: "", textJa: "" }])}>{lang === "zh" ? "+ 追加" : "+ 追加"}</Btn>
        </div>
        {/* 和组件编辑页(ComponentEditForm)同一套:每步中日两格 + 上移下移 */}
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

      {/* C6:改了关联材料百科的单价 → 提示条 + 保存到本店原料 */}
      <PriceChangeBanner ings={ings} saveToShop={saveToShop} setSaveToShop={setSaveToShop} lang={lang} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {layer.sourceComponentId && linkState !== "orphan" ? (
          <Btn variant="success" onClick={handleSyncBackToComponent}>↻ 同步回组件库</Btn>
        ) : <div />}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={leave}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
          <Btn variant="primary" onClick={handleSave}>{W.saveBtn}</Btn>
        </div>
      </div>
      {/* 🔗 选材料 / 🤖 批量关联 两个弹窗(三个编辑页共用,见 IngredientLinkModals) */}
      <IngredientLinkModals variant="layer" ings={ings} setIngs={setIngs} materials={materials} brands={brands} lang={lang}
        pickerTargetIngId={pickerTargetIngId} setPickerTargetIngId={setPickerTargetIngId} showBulkMatch={showBulkMatch} setShowBulkMatch={setShowBulkMatch} />

      {/* 底部留白,避免内容被浮动保存栏遮挡 */}
      <div style={{ height: 80 }} />
      {/* 浮动保存栏 */}
      <StickySaveBar onSave={handleSave} label={W.saveBtn} />
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
        onBack={() => confirmLeaveEditor(confirmDialog, lang, () => {
          // [B4 修复] 有 id 跳详情,无 id 回列表
          if (editTarget && editTarget.id) setViewId(editTarget.id);
          setEditTarget(null);
        })}
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

// ─── 知识 ↔ 配方/组件/蛋糕 的名字关联(v17.5, 2026-09-25)─────────────
// 知识页的「关联配方」按钮,和配方 / 组件 / 蛋糕详情页底下的「相关知识」,都走这一套,两个方向永远对得上。
// 从严到松四档,某一档只命中一个就是它;命中两个以上不猜(按钮灰 + 标「N 个同名」,反查时每个候选页都列):
//   ① 全名相同(不管全角半角、大小写、法文重音、空格、中间点「・·」)
//   ② 去掉版本号(v1.0 / v3C / v0)后相同   ③ 再去掉括号里的备注后相同
//   ④ 是某一项名字的一部分(至少 2 个字,纯英文至少 4 个字母)
// 旧规则把名字拆成碎词、碎词撞上就算,「v1.0」「ショコラ」「de」都能把按钮带走,165 个按钮跳错 55 个。
// 改这套规则前先跑 .claude/scripts/entry/compare_knowledge_links.cjs(对主数据逐个按钮对比改前改后)。
// 旧数据里有 4 条被粘成「A「, 」B」的一串(引号被批量换成了「」),读的时候拆开
const splitLinkNames = (r) => String(r || "").split(/「\s*[,，、]\s*」/).map(s => s.trim()).filter(Boolean);
const _linkKeyCache = new Map();
function linkKeys(name) {
  const raw = String(name || "");
  let hit = _linkKeyCache.get(raw);
  if (hit) return hit;
  const base = raw.normalize("NFKC").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");   // é→e;日文浊点不受影响
  const noVer = base.replace(/(^|[^a-z0-9])v\d+(?:\.\d+)*[a-z]?(?![a-z0-9])/g, "$1");
  const core = noVer.replace(/\([^()]*\)|【[^【】]*】|\[[^\[\]]*\]/g, "");
  const squash = s => s.replace(/[\s・·•]/g, "");
  hit = { full: squash(base), noVer: squash(noVer), core: squash(core) };
  _linkKeyCache.set(raw, hit);
  return hit;
}
// 名字 → 目标:{ type, item } / { ambiguous: [{ type, item }, ...] } / null
function makeKnowledgeLinkResolver(recipes, components, creations) {
  const cands = [];
  for (const [type, list] of [["recipe", recipes], ["component", components], ["creation", creations]])
    for (const item of list || []) {
      const keys = [item.nameZh, item.nameJa, item.nameFr].filter(Boolean).map(linkKeys);
      if (keys.length) cands.push({ type, item, keys });
    }
  return (name) => {
    const q = linkKeys(name);
    if (!q.full) return null;
    const partOf = q.core.length >= (/^[\x00-\x7f]+$/.test(q.core) ? 4 : 2);
    const tiers = [
      k => k.full === q.full,
      k => k.noVer === q.noVer,
      k => !!q.core && k.core === q.core,
      k => partOf && k.core.includes(q.core),
    ];
    for (const test of tiers) {
      const hits = cands.filter(c => c.keys.some(test));
      if (hits.length === 1) return { type: hits[0].type, item: hits[0].item };
      if (hits.length > 1) return { ambiguous: hits.map(h => ({ type: h.type, item: h.item })) };
    }
    return null;
  };
}
// 详情页反查:哪些知识的按钮指向这一项(同名多个候选时也算)
function knowledgeLinksTo(type, id, knowledge, recipes, components, creations) {
  const resolve = makeKnowledgeLinkResolver(recipes, components, creations);
  return (knowledge || []).filter(k => (k.relatedRecipes || []).flatMap(splitLinkNames).some(n => {
    const m = resolve(n);
    return !!m && (m.ambiguous || [m]).some(x => x.type === type && x.item.id === id);
  }));
}

// ─── 知识点详情 ─────────────────────────────────────────────
function KnowledgeDetail({ item: k, lang, onEdit, onBack, onNavigate, recipes, components, creations }) {
  const title = pickLang(k, "title", lang);
  const content = pickLang(k, "content", lang);
  const titleOther = rawLang(k, "title", lang);

  // 在 recipes / components / creations 里按名字找目标,规则见上面 makeKnowledgeLinkResolver
  const resolveLink = makeKnowledgeLinkResolver(recipes, components, creations);

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
              {k.relatedRecipes.flatMap(splitLinkNames).map((r, i) => {
                const match = resolveLink(r);
                if (match && match.ambiguous) {
                  const names = match.ambiguous.map(x => x.item.nameZh || x.item.nameJa).join(" / ");
                  return (
                    <span key={i} style={{ background: "#F5F5F5", color: "#888888", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontStyle: "italic" }} title={`${match.ambiguous.length} 个同名:${names}\n在「编辑」里写全名或从下拉里重选,就能跳`}>
                      {r}<span style={{ fontSize: 10, fontStyle: "normal", marginLeft: 6 }}>{lang === "zh" ? `${match.ambiguous.length} 个同名` : `同名 ${match.ambiguous.length} 件`}</span>
                    </span>
                  );
                }
                if (match && onNavigate) {
                  const typeLabel = { recipe: "配方", component: "组件", creation: "组合产品" }[match.type];
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
  const dirtyBind = useDirtyGuard(() => ({ form, relatedInput }));   // 没保存就切页 / 返回时先问一句(「关联配方」框里敲了还没点添加的也算)

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
    <div {...dirtyBind}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{isNew ? "新增知识点" : "编辑知识点"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isNew && <Btn variant="danger" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* 💡 懒人模式提示 */}
      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：中文标题必填，日文可以不填。内容中日文任一填写即可。
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
        <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, marginBottom: 12, color: T.textPrimary }}>关联配方 / 组件 / 组合产品</div>

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
              <optgroup label="🎂 组合产品">
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
    // 2026-09-29 体检第 2 批:原来配料名为空(只填中文的行,日文名是 "")时 mn.includes("") 恒真,
    // 名字短的配料(「水」「盐」)被材料名包含也算 → 1838 个材料里 1834 个显示「有使用」。
    // 现在:配料名必须非空,而且只接受「配料名包含材料名」(含完全相等),不再反过来。
    const nameMatch = (mn1 && n1 && n1.includes(mn1)) ||
                      (mn2 && n2 && n2.includes(mn2));
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
  // 2026-09-29 体检第 2 批:「跟组件库走」的部分是组件的副本,组件那一行已经列过,原来又按整批量再列一遍(重复计数)。
  const _followCompIds = new Set((components || []).map(c => c && c.id).filter(id => id != null));
  creations.forEach(cr => {
    (cr.layers || []).forEach(l => {
      if (l && l.sourceComponentId && l.follow && !l.localVariant && _followCompIds.has(l.sourceComponentId)) return;
      (l.ingredients || []).forEach(ing => {
        if (isMatch(ing)) results.push({ type: "creation", id: cr.id, name: cr.nameZh || cr.nameJa, layerName: l.nameZh || l.nameJa, qty: ing.qty, unit: ing.unit, linked: !!ing.materialId });
      });
    });
  });
  return results;
}

// ─── 材料百科主视图 ─────────────
// [B7 修复] brandFilter / searchQ 提升到 App,从详情返回不丢筛选
function MaterialsViewBody({ brands, setBrands, materials, setMaterials, shopMaterials = [], setShopMaterials, recipes, components, creations, lang, setLang, confirmDialog, showToast,
  categoryFilter, setCategoryFilter,
  subcategoryFilter, setSubcategoryFilter,
  brandFilter = "", setBrandFilter = () => {},
  searchQ = "", setSearchQ = () => {},
  brandViewId, setBrandViewId, brandEditTarget, setBrandEditTarget,
  materialViewId, setMaterialViewId, materialEditTarget, setMaterialEditTarget,
  materialReturnTo, setMaterialReturnTo,
  setTab, setViewId,
  // v17.3 厂家管理:由外层 MaterialsView 提供(状态 + 删/合并的唯一写出口)
  brandManageOpen = false, setBrandManageOpen = () => {}, requestDelete = () => {}, requestMerge = () => {} }) {

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
        // v17.3: 不再连带删材料。名下有材料 → 先弹「挪到哪家」;没材料 → 直接删 + 给撤销
        requestDelete([brandEditTarget.id], () => { setBrandEditTarget(null); setBrandViewId(null); });
      }}
      onBack={() => confirmLeaveEditor(confirmDialog, lang, () => setBrandEditTarget(null))}
    />;
  }

  // 编辑产品
  if (materialEditTarget !== null) {
    return <MaterialEditForm
      material={materialEditTarget === "new" ? null : materialEditTarget}
      brandId={brandViewId}
      brands={brands}
      materials={materials}
      defaultCategoryId={categoryFilter}
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
        // 2026-09-29 体检第 2 批:原来只弹「删除这个产品吗?」,不说哪些配方 / 本店原料在用,删完成本悄悄变。
        // 现在:有关联(配料行 materialId 指向它 / 本店原料挂着它)→ 把引用方列进 refs 再确认;没人用 → 直接删 + 撤销。
        const snap = materials.find(x => x.id === materialEditTarget.id) || materialEditTarget;
        const zh = lang === "zh";
        const mName = (zh ? (snap.nameZh || snap.nameJa) : (snap.nameJa || snap.nameZh)) || snap.nameFr || "";
        const linked = (ings) => (ings || []).some(i => i && i.materialId === snap.id);
        const nm = (x) => (zh ? (x.nameZh || x.nameJa) : (x.nameJa || x.nameZh)) || x.nameFr || "";
        const shopN = (shopMaterials || []).filter(s => s && s.materialId === snap.id).length;
        const refs = [
          ...(recipes || []).filter(r => r && linked(r.ingredients)).map(r => `${zh ? "配方" : "レシピ"}：${nm(r)}`),
          ...(components || []).filter(c => c && linked(c.ingredients)).map(c => `${zh ? "组件" : "パーツ"}：${nm(c)}`),
          ...(creations || []).filter(cr => cr && (cr.layers || []).some(l => l && linked(l.ingredients))).map(cr => `${zh ? "组合产品" : "組み合わせ"}：${nm(cr)}`),
          ...(shopN > 0 ? [zh ? `本店原料：${shopN} 条进价挂在这个产品上(删后不再参与成本)` : `仕入れ原料：${shopN} 件(削除後は原価に反映されません)`] : []),
        ];
        const doDelete = () => {
          const idx = materials.findIndex(x => x.id === snap.id);
          setMaterials(prev => prev.filter(x => x.id !== snap.id));
          setMaterialEditTarget(null);
          setMaterialViewId(null);
          showToast(zh ? `已删除「${mName}」` : `「${mName}」を削除しました`, {
            undo: () => setMaterials(prev => {
              if (prev.find(x => x.id === snap.id)) return prev;
              const next = [...prev];
              next.splice(idx >= 0 ? Math.min(idx, next.length) : next.length, 0, snap);
              return next;
            }),
          });
        };
        if (refs.length === 0) { doDelete(); return; }
        confirmDialog(
          zh ? "下面这些地方关联了这个产品。删除后,它们的成本会改用配料行里手写的单价或当初存下的成本快照,可能和现在不一样。"
             : "以下がこの製品を参照しています。削除すると原価は手入力単価または保存時のスナップショットで計算されます。",
          doDelete,
          {
            kicker: zh ? "删除产品" : "製品を削除",
            title: zh ? `删除「${mName}」?` : `「${mName}」を削除?`,
            refs,
            confirmText: zh ? "仍然删除" : "削除する",
          }
        );
      }}
      onBack={() => confirmLeaveEditor(confirmDialog, lang, () => setMaterialEditTarget(null))}
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
      onBack={() => { setBrandViewId(null); if (!brandManageOpen) setCategoryFilter(b.categoryId || null); }}
      onAddMaterial={() => setMaterialEditTarget("new")}
      onViewMaterial={(id) => setMaterialViewId(id)}
      onEditMaterial={(m) => setMaterialEditTarget(m)}
    />;
  }

  // 厂家管理(v17.3):批量删 / 合并 / 改主分类
  if (brandManageOpen) {
    return <BrandManageView
      brands={brands} setBrands={setBrands} materials={materials} lang={lang}
      onBack={() => setBrandManageOpen(false)}
      onViewBrand={(id) => setBrandViewId(id)}
      onDeleteBrands={requestDelete}
      onMergeBrands={requestMerge}
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
    onManageBrands={() => setBrandManageOpen(true)}
  />;
}

// ═══ 材料百科首页(含全局搜索)═══
function MaterialsHomeView({ brands, materials, lang, setCategoryFilter, setBrandViewId, setMaterialViewId, onManageBrands }) {
  const [searchQ, setSearchQ] = useState("");
  const q = searchQ.trim().toLowerCase();
  // 2026-09-29 体检第 2 批:原来只取前 20 家 / 30 个,标题却写「匹配 30 产品」(黄油实际 37 个)。
  // 现在先算全量、标题写真实总数,超出时提示「只显示前 N 个」+「显示全部」;记的是点「显示全部」时的搜索词,换词自动收起。
  const [showAllQ, setShowAllQ] = useState(null);
  const showAll = showAllQ !== null && showAllQ === q;

  // 计算搜索结果
  const searchResults = useMemo(() => {
    if (!q) return { brands: [], materials: [], brandTotal: 0, materialTotal: 0 };
    const allBrands = brands.filter(b => {
      const hay = `${b.nameZh || ""} ${b.nameJa || ""} ${b.nameFr || ""} ${b.origin || ""}`.toLowerCase();
      return hay.includes(q);
    });
    const allMaterials = materials.filter(m => {
      const hay = `${m.nameZh || ""} ${m.nameJa || ""} ${m.nameFr || ""}`.toLowerCase();
      return hay.includes(q);
    });
    return {
      brands: showAll ? allBrands : allBrands.slice(0, 20),
      materials: showAll ? allMaterials : allMaterials.slice(0, 30),
      brandTotal: allBrands.length, materialTotal: allMaterials.length,
    };
  }, [q, brands, materials, showAll]);
  const searchTruncated = searchResults.brands.length < searchResults.brandTotal || searchResults.materials.length < searchResults.materialTotal;

  // v57 性能优化:预聚合每个 category 的 brand/product 数量
  // 原来每次渲染 MATERIAL_CATEGORIES.map 里都 brands.filter().length,
  // 14 个分类 × (397 brands + 1416 materials) ≈ 25000 次比较每次重渲染
  const categoryCounts = useMemo(() => {
    // 「这个分类下有几家厂家」= 在这个分类下有材料的厂家 ∪ 主分类挂在这里的厂家。
    // 一家厂家可以同时算进多个分类(中沢乳业 = 奶油 + 牛奶芝士;淘宝 = 全品类),
    // 所以各分类的厂家数相加会大于厂家总数 —— 这是对的,不是重复计数。
    const counts = {};
    const brandSets = {};
    const touch = (cat) => { if (!counts[cat]) counts[cat] = { brandCount: 0, productCount: 0 }; if (!brandSets[cat]) brandSets[cat] = new Set(); };
    // 2026-09-29 体检第 2 批:原来按原始 categoryId 计数,misc / dairy / 旧编号(170 个材料)哪张卡都不算,「其他」显示 0。
    // 现在统一走 getMaterialCat(...).id:认不出的归「其他」,和分类页、卡片颜色同一个口径。
    brands.forEach(b => { if (!b.categoryId) return; const cid = getMaterialCat(b.categoryId).id; touch(cid); brandSets[cid].add(b.id); });
    materials.forEach(m => {
      if (!m.categoryId) return;
      const cid = getMaterialCat(m.categoryId).id;
      touch(cid);
      counts[cid].productCount++;
      if (m.brandId) brandSets[cid].add(m.brandId);
    });
    Object.keys(brandSets).forEach(cat => { counts[cat].brandCount = brandSets[cat].size; });
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
        <div style={{ fontSize: 11, color: T.textTertiary, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span>{brands.length} {lang === "zh" ? "家厂商" : "社"} · {materials.length} {lang === "zh" ? "产品" : "製品"}</span>
          {onManageBrands && <Btn size="sm" onClick={onManageBrands}>{lang === "zh" ? "管理厂家" : "メーカー管理"}</Btn>}
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
              ? `🔎 搜索 「${searchQ}」· 匹配 ${searchResults.brandTotal} 厂家、${searchResults.materialTotal} 产品`
              : `🔎 「${searchQ}」· ${searchResults.brandTotal} 社 · ${searchResults.materialTotal} 製品`
            }
            {searchTruncated && (
              <span style={{ fontWeight: 400, color: T.textTertiary, marginLeft: 8 }}>
                {lang === "zh"
                  ? `(只显示前 ${searchResults.brands.length} 家、${searchResults.materials.length} 个)`
                  : `(先頭 ${searchResults.brands.length} 社・${searchResults.materials.length} 件のみ表示)`}
                <button type="button" onClick={() => setShowAllQ(q)}
                  style={{ marginLeft: 6, padding: 0, background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 12, fontFamily: T.fontSans, textDecoration: "underline" }}>
                  {lang === "zh" ? "显示全部" : "すべて表示"}
                </button>
              </span>
            )}
          </div>

          {/* 厂家结果 */}
          {searchResults.brands.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "0.5px", marginBottom: 6 }}>
                {lang === "zh" ? "厂家" : "メーカー"}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {searchResults.brands.map(b => {
                  const cat = getBrandCat(b);
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


// ═══ 厂家管理 (v17.3, 2026-09-14) ═══
// 三件事:批量删、合并、就地改主分类。核心规则:**删厂家永远不删材料** —— 名下有材料的,
// 必须先选一家接手(BrandReassignDialog),材料改挂过去再删。没材料的直接删 + 给撤销。
// 删 / 合并只有一个写出口 applyBrandRemoval,编辑页的「删除」和管理页的批量删都走它。
function MaterialsView(props) {
  const { brands, setBrands, materials, setMaterials, lang, showToast } = props;
  const [brandManageOpen, setBrandManageOpen] = useState(false);
  // { mode: "delete" | "merge", sourceIds: [...], afterDone?: fn }
  const [reassign, setReassign] = useState(null);
  const zh = lang === "zh";
  const bName = (b) => (zh ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) || b.nameFr || "(无名)";

  // 删 deleteIds 这几家;它们名下的材料全部改挂到 targetId(没材料时 targetId 可空)。先做 + 给撤销。
  const applyBrandRemoval = (deleteIds, targetId, afterDone) => {
    const del = new Set(deleteIds.filter(id => id !== targetId));
    if (del.size === 0) return;
    const moved = materials.filter(m => del.has(m.brandId));
    if (moved.length > 0 && !targetId) return; // 有材料必须先选接手的厂家,不能裸删
    const removed = brands.map((b, i) => [i, b]).filter(([, b]) => del.has(b.id));
    const prevBrandOf = new Map(moved.map(m => [m.id, m.brandId]));
    const now = new Date().toISOString();
    if (moved.length > 0) setMaterials(prev => prev.map(m => del.has(m.brandId) ? { ...m, brandId: targetId, updatedAt: now } : m));
    setBrands(prev => prev.filter(b => !del.has(b.id)));
    const target = targetId ? brands.find(b => b.id === targetId) : null;
    const names = removed.map(([, b]) => bName(b));
    const who = names.length <= 2 ? names.map(n => `「${n}」`).join("") : (zh ? `${names.length} 家` : `${names.length} 社`);
    const tName = target ? bName(target) : "";
    const msg = zh
      ? (moved.length > 0 ? `已删除${who},${moved.length} 条材料挪到「${tName}」` : `已删除${who}`)
      : (moved.length > 0 ? `${who} を削除、材料 ${moved.length} 件を「${tName}」へ` : `${who} を削除`);
    showToast(msg, {
      undo: () => {
        setBrands(prev => {
          const next = prev.filter(b => !del.has(b.id));
          removed.forEach(([i, b]) => next.splice(Math.min(i, next.length), 0, b));
          return next;
        });
        if (moved.length > 0) setMaterials(prev => prev.map(m => prevBrandOf.has(m.id) ? { ...m, brandId: prevBrandOf.get(m.id) } : m));
      },
    });
    if (afterDone) afterDone();
  };

  // 页面调用的两个入口
  const requestDelete = (ids, afterDone) => {
    const set = new Set(ids);
    const n = materials.filter(m => set.has(m.brandId)).length;
    if (n === 0) applyBrandRemoval(ids, null, afterDone);
    else setReassign({ mode: "delete", sourceIds: ids, afterDone });
  };
  const requestMerge = (ids, afterDone) => {
    if (ids.length < 2) return;
    setReassign({ mode: "merge", sourceIds: ids, afterDone });
  };

  return (
    <>
      <MaterialsViewBody {...props}
        brandManageOpen={brandManageOpen} setBrandManageOpen={setBrandManageOpen}
        requestDelete={requestDelete} requestMerge={requestMerge} />
      {reassign && (
        <BrandReassignDialog
          mode={reassign.mode}
          sources={brands.filter(b => reassign.sourceIds.includes(b.id))}
          brands={brands}
          materials={materials}
          lang={lang}
          onCancel={() => setReassign(null)}
          onConfirm={(targetId) => {
            const r = reassign;
            setReassign(null);
            applyBrandRemoval(r.sourceIds, targetId, r.afterDone);
          }}
        />
      )}
    </>
  );
}

// 「挪到哪家」对话框。mode="delete":从其余厂家里选接手的;mode="merge":从选中的几家里选保留的。
function BrandReassignDialog({ mode, sources, brands, materials, lang, onConfirm, onCancel }) {
  const zh = lang === "zh";
  const merge = mode === "merge";
  const [target, setTarget] = useState(merge && sources[0] ? sources[0].id : "");
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const srcSet = new Set(sources.map(b => b.id));
  const countOf = (id) => materials.filter(m => m.brandId === id).length;
  const bName = (b) => (zh ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) || b.nameFr || "(无名)";
  const total = sources.reduce((acc, b) => acc + countOf(b.id), 0);
  const movedN = merge ? total - (target ? countOf(target) : 0) : total;
  const targetBrand = brands.find(b => b.id === target);
  const inpStyle = { width: "100%", padding: "8px 12px", fontSize: 13, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, background: T.bgCard, color: T.textPrimary, fontFamily: T.fontSans, boxSizing: "border-box" };
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(22,22,15,0.32)", zIndex: T.z.confirm, display: "flex", alignItems: "center", justifyContent: "center", padding: T.sp.xl }}>
      <div role="dialog" aria-modal="true"
        style={{ background: T.paper, border: `1px solid ${T.ink}`, borderRadius: T.radius, maxWidth: 460, width: "100%", boxShadow: T.sh.overlay }}>
        <div style={{ padding: "24px 24px 20px" }}>
          <div style={{ ...T.fs.micro, color: T.subtle, fontFamily: T.fontSerif }}>{merge ? (zh ? "合并厂家" : "メーカーを統合") : (zh ? "删除厂家" : "メーカーを削除")}</div>
          <div style={{ ...T.fs.titleS, marginTop: T.sp.m, color: T.ink, fontFamily: T.fontSans }}>
            {merge
              ? (zh ? `${sources.length} 家合成一家,保留哪家?` : `${sources.length} 社を1社に。残すのは?`)
              : (zh ? `这 ${sources.length} 家名下还有 ${total} 条材料` : `${sources.length} 社に材料が ${total} 件`)}
          </div>
          <div style={{ ...T.fs.small, color: T.body, marginTop: 10, fontFamily: T.fontSans, lineHeight: 1.65 }}>
            {merge
              ? (zh ? "其余几家名下的材料会全部改挂到保留的那家,然后删掉那几家。材料一条不丢。" : "他社の材料は残す社へ移し、他社は削除します。材料は失われません。")
              : (zh ? "材料不会被删。选一家接手,删除后这些材料会挂到那家名下。" : "材料は削除しません。引き継ぐメーカーを選んでください。")}
          </div>
          {merge ? (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
              {sources.map(b => (
                <label key={b.id} className="k-row"
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: `1px solid ${target === b.id ? T.ink : T.border}`, borderRadius: T.radius, cursor: "pointer", background: T.surface }}>
                  <input type="radio" name="brand-merge-keep" checked={target === b.id} onChange={() => setTarget(b.id)} style={{ margin: 0 }} />
                  <span style={{ ...T.fs.small, color: T.ink, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: T.fontSans }}>
                    {bName(b)}
                    {b.nameFr && b.nameFr !== bName(b) ? <span style={{ color: T.muted, marginLeft: 6 }}>{b.nameFr}</span> : null}
                  </span>
                  <span style={{ ...T.fs.caption, ...T.num, color: T.secondary, flexShrink: 0, fontFamily: T.fontSans }}>{countOf(b.id)} {zh ? "条" : "件"}</span>
                </label>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              <div style={{ ...T.fs.caption, color: T.body, marginBottom: 6, fontFamily: T.fontSans }}>
                {sources.map(b => `「${bName(b)}」`).join("")}{zh ? " 的材料挪到:" : " の材料の移動先:"}
              </div>
              <BrandPicker brands={brands.filter(b => !srcSet.has(b.id))} value={target} categoryId={sources[0] ? sources[0].categoryId : null} onChange={setTarget} lang={lang} inpStyle={inpStyle} />
            </div>
          )}
          {target && movedN > 0 && (
            <div style={{ marginTop: 14, borderLeft: `3px solid ${T.warning}`, paddingLeft: T.sp.m, ...T.fs.caption, color: T.body, lineHeight: 1.6, fontFamily: T.fontSans }}>
              {zh ? `${movedN} 条材料 → 「${targetBrand ? bName(targetBrand) : ""}」` : `材料 ${movedN} 件 → 「${targetBrand ? bName(targetBrand) : ""}」`}
              {merge ? (zh ? `,然后删除其余 ${sources.length - 1} 家` : `、他 ${sources.length - 1} 社を削除`) : (zh ? `,然后删除这 ${sources.length} 家` : `、${sources.length} 社を削除`)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: T.sp.s, padding: "14px 24px", borderTop: `1px solid ${T.line}` }}>
          <button onClick={onCancel} className="k-btn k-btn-ghost"
            style={{ ...T.fs.caption, padding: "7px 14px", color: T.body, background: "transparent", border: "1px solid transparent", borderRadius: T.radius, cursor: "pointer", fontFamily: T.fontSans }}>
            {zh ? "取消" : "キャンセル"}
          </button>
          <Btn variant={merge ? "primary" : "danger"} disabled={!target} onClick={() => target && onConfirm(target)}>
            {merge ? (zh ? "合并" : "統合する") : (zh ? "挪过去并删除" : "移動して削除")}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// 厂家管理页:一张可勾选的表(名称 / 主分类 / 材料数),筛「0 材料」「全品类」「疑似重名」,勾选后批量删或合并。
function BrandManageView({ brands, setBrands, materials, lang, onBack, onViewBrand, onDeleteBrands, onMergeBrands }) {
  const zh = lang === "zh";
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");   // all | empty | allcat | dup
  const [sort, setSort] = useState("count");     // count | name | cat
  const [selected, setSelected] = useState(() => new Set());
  const [limit, setLimit] = useState(120);
  const [catEditId, setCatEditId] = useState(null);
  const bName = (b) => (zh ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) || b.nameFr || "(无名)";

  // 每家的材料数 + 材料横跨了几个分类
  const stats = useMemo(() => {
    const m = new Map();
    materials.forEach(x => {
      if (!x.brandId) return;
      let st = m.get(x.brandId);
      if (!st) { st = { n: 0, cats: new Set() }; m.set(x.brandId, st); }
      st.n++;
      if (x.categoryId) st.cats.add(x.categoryId);
    });
    return m;
  }, [materials]);
  const countOf = (id) => (stats.get(id) ? stats.get(id).n : 0);

  // 疑似重名:中 / 日 / 法任一名字归一化(去空格、括号、点号,不分大小写)后撞车。值 = 撞车的那个键,用来把同组排到一起。
  const dupGroup = useMemo(() => {
    const norm = (v) => String(v || "").toLowerCase().replace(/[\s\u3000()（）\[\]【】「」・·、,.，。'’"“”\-_/]/g, "");
    const byName = new Map();
    brands.forEach(b => {
      const keys = new Set([b.nameZh, b.nameJa, b.nameFr].map(norm).filter(k => k.length >= 2));
      keys.forEach(k => { if (!byName.has(k)) byName.set(k, new Set()); byName.get(k).add(b.id); });
    });
    const group = new Map();
    byName.forEach((ids, k) => { if (ids.size >= 2) ids.forEach(id => { if (!group.has(id)) group.set(id, k); }); });
    return group;
  }, [brands]);

  const orphanN = useMemo(() => {
    const ids = new Set(brands.map(b => b.id));
    return materials.filter(m => m.brandId && !ids.has(m.brandId)).length;
  }, [brands, materials]);
  const emptyN = brands.reduce((acc, b) => acc + (countOf(b.id) === 0 ? 1 : 0), 0);
  const allCatN = brands.reduce((acc, b) => acc + (b.categoryId ? 0 : 1), 0);
  const dupN = dupGroup.size;

  const kw = q.trim().toLowerCase();
  const list = useMemo(() => {
    const catName = (b) => (b.categoryId ? (zh ? getMaterialCat(b.categoryId).zh : getMaterialCat(b.categoryId).ja) : "");
    const l = brands.filter(b => {
      if (filter === "empty" && countOf(b.id) !== 0) return false;
      if (filter === "allcat" && b.categoryId) return false;
      if (filter === "dup" && !dupGroup.has(b.id)) return false;
      if (kw && !`${b.nameZh || ""}${b.nameJa || ""}${b.nameFr || ""}${b.origin || ""}`.toLowerCase().includes(kw)) return false;
      return true;
    });
    const byName = (a, b) => bName(a).localeCompare(bName(b), "zh");
    if (filter === "dup") l.sort((a, b) => dupGroup.get(a.id).localeCompare(dupGroup.get(b.id)) || byName(a, b));
    else if (sort === "name") l.sort(byName);
    else if (sort === "cat") l.sort((a, b) => catName(a).localeCompare(catName(b), "zh") || countOf(b.id) - countOf(a.id) || byName(a, b));
    else l.sort((a, b) => countOf(b.id) - countOf(a.id) || byName(a, b));
    return l;
  }, [brands, filter, kw, sort, stats, dupGroup, zh]);
  const shown = list.slice(0, limit);

  const toggle = (id) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const clearSel = () => setSelected(new Set());
  const allVisibleSelected = list.length > 0 && list.every(b => selected.has(b.id));
  const toggleAll = () => setSelected(prev => {
    if (allVisibleSelected) { const n = new Set(prev); list.forEach(b => n.delete(b.id)); return n; }
    const n = new Set(prev); list.forEach(b => n.add(b.id)); return n;
  });
  const selIds = brands.filter(b => selected.has(b.id)).map(b => b.id); // 只算还存在的
  const selMat = selIds.reduce((acc, id) => acc + countOf(id), 0);

  // 就地改主分类:换了分类就把子分类重置成「其他」;改成全品类子分类清空(和 BrandEditForm 同规则)
  const changeCat = (b, catId) => {
    setBrands(prev => prev.map(x => x.id === b.id
      ? { ...x, categoryId: catId, subcategoryId: catId ? (x.categoryId === catId ? (x.subcategoryId || "other") : "other") : "", updatedAt: new Date().toISOString() }
      : x));
    setCatEditId(null);
  };

  const inpStyle = { padding: "8px 10px", fontSize: 12, border: `0.5px solid ${T.border}`, borderRadius: T.radius, background: T.bgCard, fontFamily: T.fontSans, color: T.textPrimary, boxSizing: "border-box" };
  const chip = (key, label, n) => {
    const on = filter === key;
    return (
      <button key={key} onClick={() => { setFilter(key); setLimit(120); }} className="k-btn"
        style={{ padding: "6px 12px", fontSize: 12, borderRadius: T.radius, border: `0.5px solid ${on ? T.accent : T.border}`, background: on ? T.bgSoft : T.bgCard, color: on ? T.accent : T.textSecondary, cursor: "pointer", fontFamily: T.fontSans, fontWeight: on ? 500 : 400 }}>
        {label} ({n})
      </button>
    );
  };
  const filterLabel = { empty: zh ? "0 材料" : "材料 0", allcat: zh ? "全品类" : "全カテゴリ", dup: zh ? "疑似重名" : "重複疑い" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: T.textTertiary, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 2 }}>{zh ? "材料百科" : "材料事典"}</div>
          <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: T.brand, letterSpacing: "-0.3px" }}>{zh ? "厂家管理" : "メーカー管理"}</div>
        </div>
        <Btn onClick={onBack}>{zh ? "← 返回" : "← 戻る"}</Btn>
      </div>

      <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: "1rem", lineHeight: 1.7, padding: "10px 14px", background: T.bgMuted, borderRadius: T.radius, borderLeft: `2px solid ${T.accentSoft}` }}>
        {zh
          ? "勾选后可以批量删除或合并。删厂家不会删材料:名下有材料的,会先让你选一家接手。点分类标签可以直接改主分类。"
          : "チェックして一括削除・統合。メーカー削除で材料は消えません(引き継ぎ先を選びます)。分類ラベルをクリックで変更。"}
        {orphanN > 0 && <span style={{ color: T.warning }}>{zh ? ` 另有 ${orphanN} 条材料挂在已不存在的厂家上。` : ` 存在しないメーカーの材料が ${orphanN} 件。`}</span>}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input type="text" value={q} onChange={(e) => { setQ(e.target.value); setLimit(120); }} className="k-input"
          placeholder={zh ? "🔍 搜厂家名 / 产地…" : "🔍 メーカー名・産地…"}
          style={{ ...inpStyle, flex: "1 1 200px", minWidth: 160 }} />
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...inpStyle, cursor: "pointer" }} title={zh ? "排序" : "並び替え"}>
          <option value="count">{zh ? "材料多 → 少" : "材料数 多→少"}</option>
          <option value="name">{zh ? "按名称" : "名前順"}</option>
          <option value="cat">{zh ? "按分类" : "分類順"}</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {chip("all", zh ? "全部" : "すべて", brands.length)}
        {chip("empty", filterLabel.empty, emptyN)}
        {chip("allcat", filterLabel.allcat, allCatN)}
        {chip("dup", filterLabel.dup, dupN)}
      </div>

      {selIds.length > 0 && (
        <div style={{ position: "sticky", top: 0, zIndex: T.z.sticky, background: T.ink, color: T.paper, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8, borderRadius: T.radius, boxShadow: T.sh.popover }}>
          <span style={{ ...T.fs.small, flex: "1 1 160px", fontFamily: T.fontSans }}>
            {zh ? `已选 ${selIds.length} 家 · 名下 ${selMat} 条材料` : `${selIds.length} 社選択 · 材料 ${selMat} 件`}
          </span>
          <Btn size="sm" variant="danger" style={{ background: T.paper }} onClick={() => onDeleteBrands(selIds, clearSel)}>
            {zh ? (selMat > 0 ? "删除(先挪材料)" : "删除") : "削除"}
          </Btn>
          <Btn size="sm" disabled={selIds.length < 2} style={{ color: T.paper, borderColor: T.paper }} onClick={() => onMergeBrands(selIds, clearSel)}>
            {zh ? "合并为一家" : "1社に統合"}
          </Btn>
          <button onClick={clearSel} className="k-btn"
            style={{ ...T.fs.caption, color: T.paper, background: "none", border: "none", cursor: "pointer", fontFamily: T.fontSans, opacity: 0.8 }}>
            {zh ? "取消选择" : "選択解除"}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState variant="filter" lang={lang}
          title={zh ? "没有符合条件的厂家" : "該当するメーカーがありません"}
          hint={zh ? `${brands.length} 家里都没找到` : `${brands.length} 社の中に見つかりません`}
          chips={[
            ...(kw ? [{ label: `“${q}”`, onRemove: () => setQ("") }] : []),
            ...(filter !== "all" ? [{ label: filterLabel[filter], onRemove: () => setFilter("all") }] : []),
          ]}
          onClearAll={() => { setQ(""); setFilter("all"); }} />
      ) : (
        <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg }}>
          <div style={{ display: "grid", gridTemplateColumns: "24px minmax(0,1fr) auto auto", gap: 10, alignItems: "center", padding: "8px 10px", background: T.sunken, borderBottom: `1px solid ${T.line}`, ...T.fs.label, color: T.subtle, fontFamily: T.fontSans }}>
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} title={zh ? "全选 / 全不选(当前筛选结果)" : "全選択 / 解除"} style={{ cursor: "pointer", margin: 0 }} />
            <span>{zh ? `厂家 · ${list.length} 家` : `メーカー · ${list.length} 社`}</span>
            <span>{zh ? "主分类" : "主分類"}</span>
            <span style={{ textAlign: "right" }}>{zh ? "材料" : "材料"}</span>
          </div>
          {shown.map(b => {
            const isSel = selected.has(b.id);
            const n = countOf(b.id);
            const st = stats.get(b.id);
            const cat = getBrandCat(b);
            const isDup = dupGroup.has(b.id);
            const primary = bName(b);
            const sub = [b.nameJa && b.nameJa !== primary ? b.nameJa : null, b.nameZh && b.nameZh !== primary ? b.nameZh : null, b.nameFr && b.nameFr !== primary ? b.nameFr : null, b.origin].filter(Boolean).join(" · ");
            return (
              <div key={b.id} className="k-row"
                style={{ display: "grid", gridTemplateColumns: "24px minmax(0,1fr) auto auto", gap: 10, alignItems: "center", padding: "8px 10px", borderBottom: `1px solid ${T.lineFaint}`, background: isSel ? T.sunken : "transparent" }}>
                <input type="checkbox" checked={isSel} onChange={() => toggle(b.id)} style={{ cursor: "pointer", margin: 0 }} />
                <div style={{ minWidth: 0, cursor: "pointer" }} onClick={() => toggle(b.id)}>
                  <div style={{ ...T.fs.small, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: T.fontSans }}>
                    {primary}
                    {isDup && <span style={{ marginLeft: 6, fontSize: 10, color: T.warning, border: `1px solid ${T.warning}`, borderRadius: T.radius, padding: "0 4px" }}>{zh ? "重名?" : "重複?"}</span>}
                  </div>
                  {(sub || (st && st.cats.size > 1)) && (
                    <div style={{ ...T.fs.caption, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: T.fontSans }}>
                      {sub}{sub && st && st.cats.size > 1 ? " · " : ""}{st && st.cats.size > 1 ? (zh ? `材料跨 ${st.cats.size} 类` : `${st.cats.size} 分類にまたがる`) : ""}
                    </div>
                  )}
                </div>
                {catEditId === b.id ? (
                  <select autoFocus value={b.categoryId || ""} onChange={(e) => changeCat(b, e.target.value)} onBlur={() => setCatEditId(null)}
                    style={{ ...inpStyle, padding: "4px 6px", maxWidth: 150 }}>
                    <option value="">{BRAND_CAT_ALL.icon} {zh ? BRAND_CAT_ALL.zh : BRAND_CAT_ALL.ja}</option>
                    {MATERIAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {zh ? c.zh : c.ja}</option>)}
                  </select>
                ) : (
                  <button className="k-btn" onClick={() => setCatEditId(b.id)} title={zh ? "点一下改主分类" : "クリックで主分類を変更"}
                    style={{ background: cat.bg, color: cat.color, border: "none", padding: "3px 8px", borderRadius: T.radiusPill, fontSize: 11, cursor: "pointer", fontFamily: T.fontSans, whiteSpace: "nowrap" }}>
                    {cat.icon} {zh ? cat.zh : cat.ja} ▾
                  </button>
                )}
                <button className="k-btn" onClick={() => onViewBrand(b.id)} title={zh ? "看这家的材料" : "このメーカーの材料"}
                  style={{ ...T.fs.caption, ...T.num, color: n === 0 ? T.muted : T.info, background: "none", border: "none", cursor: "pointer", fontFamily: T.fontSans, minWidth: 44, textAlign: "right", padding: "4px 0", textDecoration: n === 0 ? "none" : "underline", textUnderlineOffset: 3 }}>
                  {n} {zh ? "条" : "件"}
                </button>
              </div>
            );
          })}
          {list.length > shown.length && (
            <div style={{ padding: 12, textAlign: "center" }}>
              <Btn size="sm" onClick={() => setLimit(l => l + 120)}>{zh ? `再显示 ${Math.min(120, list.length - shown.length)} 家(还有 ${list.length - shown.length})` : `さらに ${Math.min(120, list.length - shown.length)} 社(残り ${list.length - shown.length})`}</Btn>
            </div>
          )}
        </div>
      )}
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
    // 2026-09-29 体检第 2 批:原来严格相等,misc / 旧编号的材料按分类筛不出来;认不出的归「其他」
    if (catFilter) list = list.filter(m => m.categoryId && getMaterialCat(m.categoryId).id === catFilter);
    if (brandFilter) list = list.filter(m => m.brandId === brandFilter);
    if (q) {
      list = list.filter(m => {
        const hay = `${m.nameZh || ""} ${m.nameJa || ""} ${m.nameFr || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    // 排序: 本店原料已有 (v17.4) > isBest > rating > 名字。_shopMaterials 是渲染期注入的,弹窗每次打开都是新的,不进依赖
    const shopIds = new Set(_shopMaterials.map(x => x && x.materialId).filter(Boolean));
    return [...list].sort((a, b) => {
      const sa = shopIds.has(a.id) ? 1 : 0, sb = shopIds.has(b.id) ? 1 : 0;
      if (sa !== sb) return sb - sa;
      if ((b.isBest ? 1 : 0) !== (a.isBest ? 1 : 0)) return (b.isBest ? 1 : 0) - (a.isBest ? 1 : 0);
      if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
      return (a.nameZh || a.nameJa || "").localeCompare(b.nameZh || b.nameJa || "");
    }).slice(0, 100); // 最多 100 条结果
  }, [materials, q, catFilter, brandFilter]);

  // 动态取可选厂家 (根据当前 catFilter)
  const availableBrands = useMemo(() => {
    const brandIds = new Set();
    materials.forEach(m => {
      if (!catFilter || (m.categoryId && getMaterialCat(m.categoryId).id === catFilter)) brandIds.add(m.brandId);
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
                    {isShopMaterialId(m.id) && <span title={lang === "zh" ? "本店原料已有" : "仕入れ済み"} style={{ fontSize: 9, letterSpacing: "0.1em", padding: "1px 5px", border: `1px solid ${T.success}`, color: T.success, marginLeft: 6, whiteSpace: "nowrap", verticalAlign: "middle" }}>{lang === "zh" ? "本店" : "仕入"}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 2 }}>
                    {b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : ""}
                    {/* 2026-09-29 第 2 批 2b C12:显示选中后真正写进配料行的价(本店价优先、折人民币),以前显示百科旧字段 pricePerG,和写进去的对不上 */}
                    {(() => { const pp = getMaterialEffectivePrice(m); return pp > 0 ? " · " + fmtUnitPrice(pp, "CNY") : ""; })()}
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
function BulkMatchModal({ ings, materials, brands, lang, onApply, onClose, where }) {
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
      .map(ing => {
        const scored = smartMatchMaterial(ing, materials, brands);
        // v17.4: 本店原料已有的候选排最前;自动勾选也是够格的本店优先(规则见 shopMatchWins)
        return { ing, candidates: sortShopFirst(scored), auto: pickAutoMatch(scored) };
      });
  }, [ings, materials, brands]);

  // 用户选中的映射: { [ing._id]: materialId | null }
  const [selections, setSelections] = useState(() => {
    const init = {};
    analysis.forEach(({ ing, auto }) => {
      init[ing._id] = auto ? auto.material.id : null; // 没够格的候选就不自动关联,让用户选
    });
    return init;
  });

  const autoMatchCount = Object.values(selections).filter(v => v !== null).length;
  const shopAutoCount = analysis.filter(a => a.auto && a.auto.inShop).length;
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
            {/* C12:按编辑页说(以前组件 / 部分编辑页也写「本配方」) */}
            {lang === "zh" ? `${where || "本配方"}没有需要批量匹配的材料。` : `${where || "このレシピ"}には一括マッチ対象の材料がありません。`}
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
            ? `🔍 共扫描 ${totalCount} 个未关联材料,AI 自动匹配了 ${autoMatchCount} 个高可信度结果(分数 ≥ 70)${shopAutoCount > 0 ? `,其中 ${shopAutoCount} 个优先勾了本店原料已有的` : ""}。本店原料已有的候选标「本店」并尽量排前。请检查下方每一项并调整,然后点「应用」。`
            : `${totalCount} 件スキャン、${autoMatchCount} 件が高信頼(≥ 70)で自動選択${shopAutoCount > 0 ? `(うち仕入れ済み ${shopAutoCount} 件を優先)` : ""}。仕入れ済みは先頭に「仕入」表示。下記確認して「適用」。`}
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
                    {candidates.map(({ score, material: m, inShop }) => {
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
                            {inShop && <span title={lang === "zh" ? "本店原料已有" : "仕入れ済み"} style={{ fontSize: 9, letterSpacing: "0.1em", padding: "1px 5px", border: `1px solid ${T.success}`, color: T.success, marginLeft: 6, whiteSpace: "nowrap", verticalAlign: "middle" }}>{lang === "zh" ? "本店" : "仕入"}</span>}
                            {b && <span style={{ color: T.textTertiary, fontSize: 10, marginLeft: 6 }}>
                              · {lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)}
                            </span>}
                            {/* C12:显示应用后真正写进配料行的价(本店价优先、折人民币,每 100g) */}
                            {getMaterialEffectivePrice(m) > 0 && <span style={{ color: T.textTertiary, fontSize: 10, marginLeft: 6 }}>· {fmtUnitPrice(getMaterialEffectivePrice(m), "CNY")}</span>}
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
  // 2026-09-29 体检第 2 批:原来严格相等,misc / dairy / 旧编号的材料哪个分类页都进不去。认不出的归「其他」(和首页计数同口径)
  const allProducts = materials.filter(m => m.categoryId && getMaterialCat(m.categoryId).id === cat.id);

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
  // 审查第 6 轮:老数据 350 家的创立年份存的是 0(输入框显示空、保存也写 ""),表单里先当 "",敲一位再删掉才不会白问「还没保存」
  const [form, setForm] = useState(brand ? { ...brand, ...(brand.foundedYear === 0 ? { foundedYear: "" } : {}) } : empty);
  const dirtyBind = useDirtyGuard(() => form);   // 没保存就切页 / 返回时先问一句
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
    <div {...dirtyBind}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{isNew ? "新增厂家" : "编辑厂家"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isNew && <Btn variant="danger" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：中文名必填，日文可以不填。建议填写厂家故事，记录品牌的历史背景。
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
            <select value={form.categoryId || ""} onChange={(e) => setForm(prev => ({ ...prev, categoryId: e.target.value, subcategoryId: e.target.value ? "other" : "" }))} style={inpStyle}>
              {/* 空 = 全品类:淘宝、1688、进口商这种什么都卖的渠道;它会出现在每一个它有材料的分类下 */}
              <option value="">{BRAND_CAT_ALL.icon} {lang === "zh" ? "全品类 / 综合渠道(淘宝、进口商等)" : "全カテゴリ / 総合"}</option>
              {MATERIAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.zh}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{lang === "zh" ? "子分类" : "サブカテゴリ"}</label>
            {form.categoryId ? (
              <select value={form.subcategoryId || "other"} onChange={f("subcategoryId")} style={inpStyle}>
                {getSubcategoriesFor(form.categoryId).map(s => <option key={s.id} value={s.id}>{s.icon} {lang === "zh" ? s.zh : s.ja}</option>)}
              </select>
            ) : (
              <div style={{ ...inpStyle, background: "#F5F5F5", color: T.textTertiary }}>{lang === "zh" ? "全品类不分子类" : "—"}</div>
            )}
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
  const cat = getBrandCat(brand);
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
                        (() => {
                          // 这一行是百科条目,拿不到本店原料的规格,所以箱价一律用
                          // 百科价 × 百科规格 —— 混用会算出一个哪边都不是的数。
                          const _refP = parseFloat((m.priceRange && m.priceRange.mid) || m.pricePerG);
                          const _rawCase = _refP > 0 && m.packSize && m.casePack
                            ? _refP * parsePackSizeToGrams(m.packSize) * parseFloat(m.casePack) : 0;
                          return _rawCase > 0 ? `${lang === "zh" ? "箱价" : "箱価"} ${fmtTotalPrice(_rawCase, curOf(m))}` : null;
                        })(),
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
                  {curOf(material) === "JPY" && getDisplayCur() === "raw" && (
                    <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 2 }}>≈ {fmtOther(parseFloat(refPrice) * 100, "JPY")}/100g</div>
                  )}
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
                  {curOf(sm) === "JPY" && getDisplayCur() === "raw" && (
                    <div style={{ fontSize: 10, color: T.success, opacity: 0.75, marginTop: 2 }}>≈ {fmtOther(parseFloat(sm.pricePerG) * 100, "JPY")}/100g</div>
                  )}
                </div>
              );
            })()}
            {casePrice > 0 && (
              <div style={{ background: T.successBg, padding: "10px 12px", borderRadius: T.radiusSm }}>
                <div style={{ fontSize: 10, color: T.success, letterSpacing: "0.5px", textTransform: "uppercase" }}>{lang === "zh" ? "整箱约" : "1ケース合計"}</div>
                <div style={{ fontFamily: T.fontSerif, fontSize: 17, fontWeight: 500, color: T.success, marginTop: 2 }}>
                  {(() => {
                    const _rp = getMaterialRawPrice(material);
                    // 价来自本店原料,规格就得用本店原料那一条的 —— 同一批货,价和规格必须配套。
                    // 否则会拿百科的「1kg」去乘本店的 11kg 桶价,箱价差出好几倍。
                    const _sm = _rp.source === "shop" && Array.isArray(shopMaterials)
                      ? shopMaterials.find(x => x && x.materialId === material.id) : null;
                    const _ps = (_sm && _sm.packSize) || material.packSize;
                    const _cp = (_sm && _sm.casePack) || material.casePack;
                    const _rawCase = _rp.price > 0 && _ps && _cp
                      ? _rp.price * parsePackSizeToGrams(_ps) * parseFloat(_cp) : 0;
                    return fmtTotalPrice(_rawCase, _rp.currency);
                  })()}
                </div>
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
                    currency: curOf(material),   // v17: 价从百科带过来,币种必须一起带
                    packSize: material.packSize || "",
                    casePack: material.casePack || "",
                    note: "",
                    updatedAt: new Date().toISOString(),   // 合并导入按修改时间取新的一边(mergeByNewer)
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
                  {/* 2026-09-29 体检第 2 批:原来直接拼 `¥${pricePerG}`(每克原值 + 一律写 ¥),表头却是「/100g」,差约 100 倍、日元也标成 ¥。改走 fmtUnitPrice + 实际取用的那条价 */}
                  <td style={{ padding: "6px 10px", textAlign: "right" }}>{(() => { const rp = getMaterialRawPrice(material); return fmtUnitPrice(rp.price, rp.currency) || "—"; })()}</td>
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
                    <td style={{ padding: "6px 10px", textAlign: "right" }}>{(() => { const rp = getMaterialRawPrice(m); return fmtUnitPrice(rp.price, rp.currency) || "—"; })()}</td>
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

// ─── 🏭 厂家选择器:输入即筛 ─────────────
// 469 家用原生 <select> 翻不动。中 / 日 / 法名都能搜,同一大分类的排最前
// (录凝固剂时先看到凝固剂厂家,而不是从乳业开始翻)。
// 选项用 onMouseDown 而不是 onClick —— input 的 blur 会先触发,onClick 就永远进不来。
function BrandPicker({ brands, value, categoryId, onChange, lang, inpStyle, inCatBrandIds = null }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const boxRef = useRef(null);
  const zh = lang === "zh";
  const selected = brands.find(b => b.id === value);
  const label = (b) => (zh ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) || "(无名)";

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const kw = q.trim().toLowerCase();
  const all = useMemo(() => {
    const hit = kw
      ? brands.filter(b => `${b.nameZh || ""}${b.nameJa || ""}${b.nameFr || ""}`.toLowerCase().includes(kw))
      : brands.slice();
    // 排序三档:本类(主分类是本类,或在本类下已有材料)> 全品类渠道 > 其余;档内保持原顺序
    const rank = (b) => (b.categoryId === categoryId || (inCatBrandIds && inCatBrandIds.has(b.id))) ? 0 : (!b.categoryId ? 1 : 2);
    return hit.sort((a, b) => rank(a) - rank(b));
  }, [brands, kw, categoryId, inCatBrandIds]);
  const list = all.slice(0, 50);

  const pick = (b) => {
    onChange(b ? b.id : "");
    setQ("");
    setOpen(false);
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi(h => Math.min(h + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { if (open && list[hi]) { e.preventDefault(); pick(list[hi]); } }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          value={open ? q : (selected ? label(selected) : "")}
          onChange={e => { setQ(e.target.value); setOpen(true); setHi(0); }}
          onFocus={() => { setQ(""); setOpen(true); setHi(0); }}
          onKeyDown={onKey}
          placeholder={selected ? label(selected) : (zh ? "输入厂家名搜索…" : "メーカー名で検索…")}
          style={{ ...inpStyle, paddingRight: selected ? 26 : 12 }}
        />
        {selected && !open && (
          <button type="button" onClick={() => pick(null)} title={zh ? "清除" : "クリア"}
            style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", color: T.textTertiary, fontSize: 14, lineHeight: 1, padding: "2px 4px" }}>×</button>
        )}
      </div>
      {open && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "calc(100% + 3px)", zIndex: T.z.popover,
          background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm,
          boxShadow: T.sh.popover, maxHeight: 260, overflowY: "auto",
        }}>
          {list.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: 12, color: T.textTertiary }}>
              {zh ? `没有匹配「${q}」的厂家。去「材料百科」页可以新建厂家。` : `「${q}」に一致するメーカーなし`}
            </div>
          )}
          {list.map((b, i) => {
            const sameCat = b.categoryId === categoryId || (inCatBrandIds && inCatBrandIds.has(b.id));
            const isAll = !b.categoryId;
            return (
              <div key={b.id}
                onMouseDown={(e) => { e.preventDefault(); pick(b); }}
                onMouseEnter={() => setHi(i)}
                style={{
                  padding: "7px 12px", fontSize: 13, cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "space-between", gap: 8,
                  background: i === hi ? T.bgMuted : "transparent",
                  color: b.id === value ? T.accent : T.textPrimary,
                  fontWeight: b.id === value ? 500 : 400,
                }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label(b)}</span>
                {sameCat && <span style={{ fontSize: 10, color: T.success, flex: "0 0 auto" }}>{zh ? "本类" : "同分類"}</span>}
                {!sameCat && isAll && <span style={{ fontSize: 10, color: T.textTertiary, flex: "0 0 auto" }}>{zh ? "全品类" : "全カテゴリ"}</span>}
              </div>
            );
          })}
          {all.length > list.length && (
            <div style={{ padding: "7px 12px", fontSize: 11, color: T.textTertiary, borderTop: `0.5px solid ${T.borderSoft}` }}>
              {zh ? `还有 ${all.length - list.length} 家,继续输入缩小范围` : `他 ${all.length - list.length} 件`}
            </div>
          )}
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

      {/* v17.1: 价格显示口径 —— 存量是日元报价,但平时要看人民币 */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, marginTop: 14, paddingTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary, marginBottom: 8 }}>
          {zh ? "💴 价格显示口径" : "💴 価格の表示通貨"}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {[["CNY", zh ? "¥ 都折成人民币" : "¥ 人民元に統一"], ["raw", zh ? "円 各按原币种" : "円 元の通貨のまま"]].map(([v, label]) => {
            const on = (appSettings.displayCurrency || "CNY") === v;
            return (
              <button key={v} type="button"
                onClick={() => setAppSettings(prev => ({ ...prev, displayCurrency: v }))}
                style={{ padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", borderRadius: T.radiusPill, fontFamily: T.fontSans,
                  background: on ? T.accent : "transparent", color: on ? "#fff" : T.textSecondary,
                  border: `0.5px solid ${on ? T.accent : T.border}` }}>
                {label}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 8, lineHeight: 1.7 }}>
          {zh
            ? "选「都折成人民币」时,日元报价按上面的汇率折算显示,并标一个 ≈ 表示是换算来的(例:450円 的售价显示成 ≈¥" + (Math.round(450 * fx * 100) / 100) + ")。存进去的还是原来的数字和币种,只是给你看的口径变了 —— 录入框里永远是原币种,不会被改。"
            : "「人民元に統一」だと円建ては上のレートで換算表示(≈ 付き)。保存される値は元のまま、入力欄も元の通貨です。"}
        </div>
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
  // 她最后填的袋价 / 箱价原数。改规格时拿它重算单价,不再用「当前每克价 × 当前克数」现算 ——
  // 以前把单包 1000 删空再打 500,中间经过「1」「空」「5」,每步都拿上一步算坏的单价去乘,袋价最后变 11000(2026-09-29 体检修)
  const [anchorVal, setAnchorVal] = useState(0);
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
    if (!v.trim()) { setAnchorVal(0); onChange({ pricePerG: "" }); return; }
    const n = parseFloat(v);
    if (isNaN(n) || n < 0) return;
    if (field !== "g") setAnchorVal(n);
    onChange({ pricePerG: divisor > 0 ? r6(n / divisor) : "" });
  };
  const editSpec = (key) => (e) => {
    const v = e.target.value;
    const ng = key === "packSize" ? parsePackSizeToGrams(v) : g;
    const ncp = key === "casePack" ? (parseFloat(v) || 0) : cp;
    const patch = { [key]: v };
    const keep = anchor === "pack" ? (anchorVal > 0 ? anchorVal : packPrice) : anchor === "case" ? (anchorVal > 0 ? anchorVal : casePrice) : 0;
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
            <button key={c} type="button" onClick={() => { if (c === cur) return; setDraft(null); setAnchorVal(v => v > 0 ? (parseFloat(convCur(v, cur, c, 2)) || 0) : 0); onChange({ currency: c, pricePerG: convCur(pricePerG, cur, c) }); }}
              style={{ padding: "4px 12px", fontSize: 11, fontWeight: 500, cursor: "pointer", borderRadius: T.radiusPill, fontFamily: T.fontSans,
                background: on ? T.accent : "transparent", color: on ? "#fff" : T.textSecondary, border: `0.5px solid ${on ? T.accent : T.border}` }}>
              {label}
            </button>
          );
        })}
        {ppg > 0 && (
          <span style={{ fontSize: 11, color: T.textTertiary }}>
            {zh ? `当前汇率 100 日元 = ${Math.round(getFx() * 100 * 1000) / 1000} 元` : `100円 = ${Math.round(getFx() * 100 * 1000) / 1000}元`}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div><label style={lab}>{zh ? "单包(g)" : "単パック(g)"}</label><input type={textSpec ? "text" : "number"} value={packSize || ""} onChange={editSpec("packSize")} placeholder={textSpec ? "450 / 1kg" : "450"} style={inpStyle} /></div>
        <div><label style={lab}>{zh ? "一箱(包)" : "1ケース(パック)"}</label><input type={textSpec ? "text" : "number"} value={casePack || ""} onChange={editSpec("casePack")} placeholder={textSpec ? "20" : "30"} style={inpStyle} /></div>
      </div>
      {String(packSize || "").trim() && !hasG && (
        <div style={{ fontSize: 11, color: T.warning, margin: "-6px 0 10px" }}>
          {zh ? "规格里没认出克数(比如「20個」「4号缶」),袋价和箱价没法换算,直接填单价" : "規格からグラム数を読めません。単価を直接入力してください"}
        </div>
      )}
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
      {/* v17: 双币对照 —— 报价单给的是一种钱,记账和成本用另一种,两个数得同时看见 */}
      {ppg > 0 && (
        <div style={{ marginTop: 10, padding: "8px 12px", background: T.bgMuted, borderRadius: T.radiusSm, fontSize: 11, color: T.textSecondary, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: T.textTertiary }}>
            💱 {zh ? (cur === "JPY" ? "折人民币" : "折日元") : (cur === "JPY" ? "人民元換算" : "円換算")}
          </span>
          {packPrice > 0 && <span>{zh ? "袋价" : "パック"} <b style={{ fontWeight: 500, color: T.textPrimary }}>{fmtOther(packPrice, cur)}</b></span>}
          {casePrice > 0 && <span>{zh ? "箱价" : "箱"} <b style={{ fontWeight: 500, color: T.textPrimary }}>{fmtOther(casePrice, cur)}</b></span>}
          <span>{zh ? "单价" : "単価"} <b style={{ fontWeight: 500, color: T.textPrimary }}>{fmtOther(ppg * 100, cur)}</b>/100g</span>
        </div>
      )}
      <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 8, lineHeight: 1.6 }}>
        {zh ? `💡 三格填任意一格,另外两格自动算。拿到的是袋价 / 箱价就直接填,不用自己换算 ${sym}/100g。` : "💡 いずれか 1 つ入力すれば残り 2 つは自動換算。"}
      </div>
    </>
  );
}

// ─── 产品编辑 ─────────────
function MaterialEditForm({ material, brandId, brands, materials = [], defaultCategoryId = null, onSave, onDelete, onBack, lang = "zh" }) {
  const isNew = !material;
  const [errorMsg, setErrorMsg] = useState("");

  const currentBrand = brands.find(b => b.id === (material?.brandId || brandId));
  // 从分类页点「+ 新产品」进来时,默认就是那个分类(defaultCategoryId = categoryFilter),别一律落到牛奶芝士
  const defaultCategory = material?.categoryId || currentBrand?.categoryId || defaultCategoryId || "dairy_other";
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
  const dirtyBind = useDirtyGuard(() => form);   // 没保存就切页 / 返回时先问一句
  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  // 当前大分类下已有材料的厂家 → 给 BrandPicker 排前并标「本类」(厂家的主分类只是提示,真正的归属看材料)
  const inCatBrandIds = useMemo(() => new Set(materials.filter(m => m.categoryId === form.categoryId && m.brandId).map(m => m.brandId)), [materials, form.categoryId]);

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
    // v17: pricePerG 和 priceRange.mid 必须一起写。
    // 编辑器改的是 pricePerG,但成本链(getMaterialEffectivePrice)和「添加为本店原料」
    // 读的是 priceRange.mid —— v11 迁移留下的双字段。只写一个 = 改了价不生效。
    const _mid = String(form.pricePerG == null ? "" : form.pricePerG).trim();
    const _oldMid = String((form.priceRange && form.priceRange.mid) != null ? form.priceRange.mid : "").trim();
    const _thisMonth = new Date().toISOString().slice(0, 7);
    const _priceRange = _mid
      ? {
          ...(form.priceRange || {}),
          mid: _mid,
          // 价变了才动 asOf —— 它记的是「这个价是什么时候的」
          asOf: (_mid !== _oldMid) ? _thisMonth : ((form.priceRange && form.priceRange.asOf) || _thisMonth),
        }
      // 2026-09-29 体检第 2 批:原来单价删空时 priceRange.mid 原样留着,成本链照旧用旧价;再切人民币,旧日元数被当人民币放大约 21 倍。
      // 现在:她删了价(原来有价)或切了币种 → mid 一起清空。原来就没填单价、币种也没动 → 不碰 priceRange(不替老数据做决定)。
      : (form.priceRange && (String((material && material.pricePerG) ?? "").trim() !== "" || curOf(form) !== curOf(material || {})))
        ? { ...form.priceRange, mid: "" }
        : form.priceRange;
    onSave({
      ...form,
      priceRange: _priceRange,
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
    <div {...dirtyBind}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{isNew ? "新增产品" : "编辑产品"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isNew && <Btn variant="danger" onClick={onDelete}>{lang === "zh" ? "删除" : "削除"}</Btn>}
          <Btn onClick={onBack}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：中文名必填，日文可以不填。参数按分类自动显示常用字段，可以自定义。
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
            <BrandPicker
              brands={brands} value={form.brandId} categoryId={form.categoryId} lang={lang} inpStyle={inpStyle} inCatBrandIds={inCatBrandIds}
              onChange={(id) => {
                const b = brands.find(x => x.id === id);
                // 厂家有主分类才联动;全品类厂家(淘宝这种)不动用户已选的分类
                const follow = !!(b && b.categoryId);
                setForm(prev => ({ ...prev, brandId: id, categoryId: follow ? b.categoryId : prev.categoryId, subcategoryId: follow ? (b.subcategoryId || "other") : prev.subcategoryId }));
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>大分类</label>
            <select value={form.categoryId} onChange={(e) => setForm(prev => ({ ...prev, categoryId: e.target.value, subcategoryId: "other" }))} style={inpStyle}>
              {/* 2026-09-29 体检第 2 批:老数据的分类(misc / dairy / 旧编号)不在列表里,下拉看着停在「黄油」,一保存就被改掉。补一项原样保留 */}
              {form.categoryId && !MATERIAL_CATEGORIES.some(c => c.id === form.categoryId) && (
                <option value={form.categoryId}>{lang === "zh" ? "(未归类)" : "(未分類)"}</option>
              )}
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
        {/* 2026-09-29 体检第 2 批:原来没传 textSpec,单包是数字框,「1KG」「200g/1KG」这类老规格(97%)显示成空框,重填会覆盖原文 */}
        <PackPriceFields packSize={form.packSize} casePack={form.casePack} pricePerG={form.pricePerG} currency={form.currency}
          onChange={patch => setForm(prev => ({ ...prev, ...patch }))} lang={lang} inpStyle={inpStyle} textSpec />
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
function EditForm({ recipe, cats, materials = [], brands = [], setMaterials, shopMaterials = [], setShopMaterials, onSave, onDelete, onBack, onQuickAddKnowledge, lang = "zh", productFamilies = [], onUpdateCats, showToast, confirmDialog }) {
  const isNew = !recipe;
  const [errorMsg, setErrorMsg] = useState("");
  const [nameZhMissing, setNameZhMissing] = useState(false);   // 2026-09-29 体检第 2 批:点保存时中文名空 → 名字框旁边标红
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
              return { ...linked, _id: idx, unitPrice: String(pp), currency: "CNY", _originalPrice: String(pp), cost: q > 0 ? (q * pp).toFixed(1) : linked.cost };  // v17: pp 已折成人民币;不标 CNY,「保存到本店原料」会把人民币数当日元存进去
            }
          }
        }
        return { ...linked, _id: idx, _originalPrice: linked.unitPrice || "" };
      })
    : [{ _id: 0, nameZh: "", nameJa: "", nameFr: "", qty: "", unit: "g", brand: "", unitPrice: "", currency: "CNY", cost: "", group: "none", note: "", catId: null, brandIdx: null, _originalPrice: "" }]);
  // v11: 勾选"保存到本店原料"状态,用户改价后底部提示条里显示。C6:默认勾上(改了关联材料的价,多半就是本店进价)
  const [saveToShop, setSaveToShop] = useState(true);

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
  const dirtyBind = useDirtyGuard(() => ({ form, ings, steps }));   // 没保存就切页时 App 先问一句
  const leave = () => confirmLeave(dirtyBind.isDirty, confirmDialog, lang, onBack);   // C15:「← 返回」「取消」有改动先问

  const totalCost = ings.reduce((s, i) => s + toCNY(i.cost, curOf(i)), 0);  // v17: 各按各的币种折成人民币再相加
  const qty = parseFloat(form.yield) || 0;
  const price = toCNY(form.price, priceCurOf(form));   // v17: 同上,折算后再比
  const unitCost = qty > 0 ? totalCost / qty : 0;
  const margin = price > 0 ? ((price - unitCost) / price) * 100 : 0;
  const mc = margin >= 50 ? "green" : margin >= 30 ? "amber" : "red";

  // 改单价追踪(_priceModified)和 ↺ 撤销改价在共用配料表 IngredientTable 里;提示条是 PriceChangeBanner,写本店原料是 saveIngPricesToShop

  // 未关联材料对话框
  const [unlinkedDialog, setUnlinkedDialog] = useState(null);

  const doSave = (finalIngs) => {
    const validIngs = finalIngs.filter(ingHasName);   // C13:名字只有空格的行不存
    // 🔗 用材料百科最新价刷新有 materialId 的 ing;改过价的(_priceModified)保留她填的价
    const refreshedIngs = validIngs.map(i => refreshIngForSave(i, materials));
    // v11: 如果勾了"保存到本店原料",把改过价且有 materialId 的 ing 写入 shopMaterials
    if (saveToShop) {
      const { n, undo } = saveIngPricesToShop(refreshedIngs, setShopMaterials);   // 审查第 2 轮:给撤销
      if (n > 0 && typeof showToast === "function") showToast(lang === "zh" ? `✓ ${n} 项已保存到本店原料` : `✓ ${n} 件を仕入れ原料に保存`, { undo });
    }
    const total = refreshedIngs.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
    const q = parseFloat(form.yield) || 0, p = parseFloat(form.price) || 0;
    const uc = q > 0 ? total / q : 0, mg = p > 0 ? ((p - uc) / p) * 100 : 0;
    const { stepsZh, stepsJa } = stepsForSave(steps);   // C11:中日按行对齐存(中间空着的留 "")
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
      // 2026-09-29 体检第 2 批:原来提示「中日文任一填写即可」,只填日文却被拦;报错只在页面最底下闪 3 秒。
      // 现在按「录入只强制中文」统一成「中文名必填」,名字框旁边也标出来(填了中文名就消失)。
      setNameZhMissing(true);
      setErrorMsg(lang === "zh" ? "请填写中文配方名(在页面最上面)" : "中国語のレシピ名を入力してください(ページ上部)");
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
  // 子元素按位置给 key(以前直接塞数组,控制台一直报「列表缺 key」)
  const grid = (cols, children) => <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, marginBottom: 12 }}>{children.map((c, i) => <Fragment key={i}>{c}</Fragment>)}</div>;
  const fld = (label, children) => <div><label style={{ fontSize: 11, color: T.textTertiary, display: "block", marginBottom: 5, letterSpacing: "0.3px" }}>{label}</label>{children}</div>;

  return (
    <div {...dirtyBind}>
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
          <Btn onClick={leave}>{lang === "zh" ? "← 返回" : "← 戻る"}</Btn>
        </div>
      </div>

      {/* 💡 懒人模式提示 */}
      <div style={{ background: "#FEF3C7", border: "0.5px solid #FDE68A", borderRadius: "8px", padding: "8px 14px", marginBottom: "1rem", fontSize: 12, color: "#854F0B" }}>
        💡 提示：配方名中文必填，日文可以不填。备注、步骤中日文任一填写即可，不必两种都填。
      </div>

      {card(<>
        {grid("1fr 1fr", [fld("配方名（中文）*", <>{inp("nameZh", "费南雪", "text", nameZhMissing && !(form.nameZh || "").trim() ? { border: `1px solid ${T.danger}` } : {})}{nameZhMissing && !(form.nameZh || "").trim() && <div style={{ color: T.danger, fontSize: 12, marginTop: 4 }}>⚠ {lang === "zh" ? "中文名必填,填好再保存" : "中国語名は必須です"}</div>}</>), fld("配方名（日本語）", inp("nameJa", "フィナンシェ"))])}
        {grid("1fr 1fr", [fld("配方名（Français）", inp("nameFr", "Financier")), fld("分类", sel("category", ["焼き菓子","生菓子","パン・ヴィエノワズリー","ショコラ","アントルメ","タルト","その他"]))])}
        {grid("1fr 1fr 1fr 1fr", [fld("模具/规格", inp("mold", "SN1648 25連")), fld("产出数量", inp("yield", "25", "number")), fld("单位", inp("unit", "個")), fld("制作时间（分）", inp("time", "60", "number"))])}
        {grid("1fr 1fr 1fr 1fr", [fld("烘烤温度", inp("temp", "190°C")), fld("烘烤时间", inp("baketime", "10分→反転→4分")), fld(<>{lang === "zh" ? "销售单价" : "販売単価"}{priceCurBtn(form, (c, p) => setForm(prev => ({ ...prev, priceCurrency: c, price: p })), lang, form.price)}</>, inp("price", "0", "number")), fld("难度", sel("difficulty", ["★ 简单","★★ 普通","★★★ 困难","★★★★ 高难度"]))])}
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
              {/* 2026-09-29 体检第 2 批:挂的家族已经不存在(5/1 丢的那几个)时,下拉看着是「不归属」,其实还挂着旧编号。补一项照实显示,保存也不会悄悄清掉 */}
              {form.familyId && !productFamilies.some(fm => fm.id === form.familyId) && (
                <option value={form.familyId}>⚠ 已丢失的家族（{form.familyId}）</option>
              )}
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
        {/* 配料表:三个编辑页共用 IngredientTable,差异在 ING_TABLE_VARIANTS.recipe */}
        <IngredientTable variant="recipe" ings={ings} setIngs={setIngs} nextIdRef={nextIngId} cats={cats} materials={materials} brands={brands} lang={lang}
          onPickMaterial={setPickerTargetIngId} onOpenBulk={() => setShowBulkMatch(true)} />

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

      {/* v11: 改价提示条 — 至少一行关联材料百科的 ing 被改过单价才显示(C6 起三页共用 PriceChangeBanner) */}
      <PriceChangeBanner ings={ings} saveToShop={saveToShop} setSaveToShop={setSaveToShop} lang={lang} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8, alignItems: "center" }}>
        {errorMsg && <span style={{ color: "#A32D2D", fontSize: 13, marginRight: 8 }}>⚠ {errorMsg}</span>}
        <Btn onClick={leave}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
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

      {/* 🔗 选材料 / 🤖 批量关联 两个弹窗(三个编辑页共用,见 IngredientLinkModals) */}
      <IngredientLinkModals variant="recipe" ings={ings} setIngs={setIngs} materials={materials} brands={brands} lang={lang}
        pickerTargetIngId={pickerTargetIngId} setPickerTargetIngId={setPickerTargetIngId} showBulkMatch={showBulkMatch} setShowBulkMatch={setShowBulkMatch} />

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
function ShopMaterialsView({ shopMaterials, setShopMaterials, materials, brands, suppliers = [], recipes = [], components = [], creations = [], lang, showToast, confirmDialog }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState(null);
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState(null); // { id, materialId, pricePerG, packSize?, casePack?, note?, _new? }

  const linkedIds = new Set(shopMaterials.map(sm => sm.materialId));
  const availableMaterials = materials.filter(m => !linkedIds.has(m.id));

  const mLabel = (m) => lang === "zh" ? (m.nameZh || m.nameJa) : (m.nameJa || m.nameZh);
  const bLabel = (b) => b ? (lang === "zh" ? (b.nameZh || b.nameJa) : (b.nameJa || b.nameZh)) : "";

  const filteredAvailable = availableMaterials.filter(m => {
    if (catFilter && getMaterialCat(m.categoryId).id !== catFilter) return false;  // 2026-09-29 体检第 2 批:认不出的分类(misc / 旧 id)归「其他」,以前按分类筛不出来
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
    const clean = { ...editing, updatedAt: new Date().toISOString() };   // 修改时间给合并导入用(mergeByNewer)
    delete clean._new;
    setShopMaterials(prev => {
      const idx = prev.findIndex(x => x.id === clean.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = clean; return next; }
      return [...prev, clean];
    });
    showToast(lang === "zh" ? "✓ 已保存" : "✓ 保存しました");
    setEditing(null);
  };

  // 2026-09-29 体检第 2 批:以前只问「删除这条本店原料吗?」,不说哪些配方的成本会从本店进价退回百科参考价(可能是日元折算)
  const handleDelete = () => {
    if (!editing) return;
    const snapshot = shopMaterials.find(x => x.id === editing.id);
    if (!snapshot) { setEditing(null); return; }
    const mid = snapshot.materialId;
    const stillPriced = shopMaterials.some(x => x.id !== snapshot.id && x.materialId === mid && x.pricePerG);   // 还有同材料的另一条本店价顶着 → 成本不变
    const usesMat = (ings) => (ings || []).some(i => i && i.materialId === mid);
    const nm = (o) => pickLang(o, "name", lang) || o.nameFr || "";
    const refs = (!mid || stillPriced || !materials.some(m => m.id === mid)) ? [] : [
      ...recipes.filter(r => r && usesMat(r.ingredients)).map(r => `${lang === "zh" ? "配方" : "レシピ"}：${nm(r)}`),
      ...components.filter(c => c && usesMat(c.ingredients)).map(c => `${lang === "zh" ? "组件" : "パーツ"}：${nm(c)}`),
      ...creations.filter(cr => cr && (cr.layers || []).some(l => l && usesMat(l.ingredients))).map(cr => `${lang === "zh" ? "组合产品" : "組み合わせ"}：${nm(cr)}`),
    ];
    const doDelete = () => {
      setShopMaterials(prev => prev.filter(x => x.id !== snapshot.id));
      setEditing(null);
      showToast(lang === "zh" ? "已删除本店原料" : "仕入れ原料を削除しました", {
        undo: () => setShopMaterials(prev => prev.find(x => x.id === snapshot.id) ? prev : [...prev, snapshot]),
      });
    };
    if (refs.length === 0) { doDelete(); return; }
    confirmDialog(
      lang === "zh"
        ? "删除后,下面这些地方的成本会改用材料百科的参考价(不再用本店进价,百科是日元的会按汇率折算)。"
        : "削除すると、以下の原価は仕入れ価格ではなく百科の参考価格で計算されます。",
      doDelete,
      {
        kicker: lang === "zh" ? "删除本店原料" : "仕入れ原料を削除",
        title: lang === "zh" ? `有 ${refs.length} 处在用这个材料` : `${refs.length} 件で使用中`,
        refs,
        confirmText: lang === "zh" ? "仍然删除" : "削除する",
      }
    );
  };

  // ─── 编辑/新增表单 ───
  if (editing) {
    const mat = materials.find(m => m.id === editing.materialId);
    const brand = mat && brands.find(b => b.id === mat.brandId);
    const refPrice = (mat && mat.priceRange && mat.priceRange.mid) || (mat && mat.pricePerG);
    const inputStyle = { width: "100%", padding: "8px 10px", border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14, fontFamily: T.fontSans, background: T.bgCard, color: T.textPrimary };
    // 2026-09-29 体检第 2 批 2b:「← 返回」「取消」有没保存的改动先问一句(以前直接关,填好的价当场丢)
    const leaveEditing = () => confirmLeaveEditor(confirmDialog, lang, () => setEditing(null));

    return (
      <DirtyGuardScope key={editing.id} watch={editing}>
        <div style={{ marginBottom: 16 }}>
          <Btn onClick={leaveEditing}>← {lang === "zh" ? "返回" : "戻る"}</Btn>
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
              📖 {lang === "zh" ? "百科参考价" : "百科参考価"}: {fmtUnitPrice(refPrice, curOf(mat), { raw: true })}
              {mat && mat.priceRange && mat.priceRange.asOf && <span style={{ marginLeft: 6 }}>({mat.priceRange.asOf})</span>}
              <span style={{ marginLeft: 6, color: T.textMuted }}>{lang === "zh" ? "· 要改去「材料百科」里改" : "· 変更は材料事典から"}</span>
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
              <Btn onClick={leaveEditing}>{lang === "zh" ? "取消" : "キャンセル"}</Btn>
              <Btn variant="success" onClick={handleSave}>{lang === "zh" ? "保存" : "保存"}</Btn>
            </div>
          </div>
        </div>
      </DirtyGuardScope>
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
                {refPrice && <div style={{ fontSize: 12, color: T.textSecondary, whiteSpace: "nowrap" }}>📖 {fmtUnitPrice(refPrice, curOf(m))}</div>}
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
            // v17: 只有同币种才比得了 —— 本店价人民币 vs 百科日元,两个数直接相减没有意义
            const diff = (sm.pricePerG && refPrice && mat && curOf(sm) === curOf(mat))
              ? (parseFloat(sm.pricePerG) - parseFloat(refPrice)) : null;
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
                      {diff > 0 ? "↑" : "↓"} {lang === "zh" ? "参考" : "参考"} {fmtUnitPrice(refPrice, curOf(mat))}
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
  // 2026-09-29 体检第 2 批:以前用 UTC 日期,北京早上 8 点前记的销售 / 生产落到前一天,日期框也选不了今天
  const today = localDateStr();
  // v12: 销售/生产按天 upsert,同日累加。forDate 可指定补录日期
  // 2026-09-29 体检第 2 批:卖出比库存多时库存停在 0,删记录却按整条数量加回 → 凭空多出库存。
  // 现在销售记录另存 stockOut(实际扣掉的件数,同日累加),删除按它回滚;老记录没有这个字段 = 按卖出数。返回实际扣掉的件数
  const logQty = (kind, productId, addQty, forDate) => {
    const qn = parseFloat(addQty) || 0;
    if (qn <= 0) return 0;
    const d = forDate || today;
    const qtyField = kind === "sale" ? "soldQty" : "batchQty";
    const setter = kind === "sale" ? setSalesLog : setProductionLog;
    const cur = products.find(p => p.id === productId);
    const out = kind === "sale" ? Math.min(qn, Math.max(0, parseFloat(cur && cur.currentStock) || 0)) : qn;
    setter(prev => {
      const existing = (prev || []).find(x => x.productId === productId && x.date === d);
      if (existing) {
        return prev.map(x => x.id === existing.id ? { ...x, [qtyField]: (parseFloat(x[qtyField]) || 0) + qn,
          ...(kind === "sale" ? { stockOut: (x.stockOut != null ? (parseFloat(x.stockOut) || 0) : (parseFloat(x.soldQty) || 0)) + out } : {}),
          updatedAt: new Date().toISOString() } : x);
      }
      return [...(prev || []), {
        id: (kind === "sale" ? "sale_" : "prod_log_") + Date.now() + Math.random().toString(36).slice(2, 6),
        productId, date: d, [qtyField]: qn, ...(kind === "sale" ? { stockOut: out } : {}), createdAt: new Date().toISOString(),
      }];
    });
    // 联动库存: 销售扣(只扣实际有的), 生产加
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      const delta = kind === "sale" ? -out : qn;
      return { ...p, currentStock: Math.max(0, (p.currentStock || 0) + delta) };
    }));
    return out;
  };
  // 销售记录删掉时库存加回多少(老记录没有 stockOut = 按卖出数)
  const saleStockBack = (s) => s.stockOut != null ? (parseFloat(s.stockOut) || 0) : (parseFloat(s.soldQty) || 0);
  // v12: 删除一条销售/生产记录,反向回滚 currentStock
  const deleteLog = (kind, logId) => {
    const list = kind === "sale" ? salesLog : productionLog;
    const setter = kind === "sale" ? setSalesLog : setProductionLog;
    const log = (list || []).find(x => x.id === logId);
    if (!log) return;
    const qtyField = kind === "sale" ? "soldQty" : "batchQty";
    const q = kind === "sale" ? saleStockBack(log) : (parseFloat(log[qtyField]) || 0);
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
          setViewId(null);   // 编辑页是从详情进的,不清掉就会停在已删商品的详情(白屏)
        });
      }}
      onBack={() => confirmLeaveEditor(confirmDialog, lang, () => {
        // [B4 修复] 有 id 跳详情,无 id 回列表
        if (editTarget && editTarget.id) setViewId(editTarget.id);
        setEditTarget(null);
      })}
    />;
  }

  // ─── 详情页 ───
  if (viewId) {
    const p = products.find(x => x.id === viewId);
    if (!p) { setTimeout(() => setViewId(null), 0); return null; }   // 兜底:找不到这条(删了 / 导入替换了)就回列表
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
              <div style={{ fontFamily: T.fontSerif, fontSize: 22, fontWeight: 500, color: (p.threshold || 0) > 0 && (p.currentStock || 0) <= p.threshold ? T.danger : T.textPrimary, marginTop: 2 }}>{p.currentStock || 0}</div>
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
            <div style={{ fontSize: 12, color: T.textTertiary, fontStyle: "italic" }}>{lang === "zh" ? "未关联任何配方/组合产品/组件" : "未関連"}</div>
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
            {/* 2026-09-29 体检第 2 批:卖超库存时以前照样提示「库存 -N」,其实只扣到 0 */}
            <SalesInput kind="sale" today={today} onSubmit={(qty, d) => { const out = logQty("sale", p.id, qty, d); showToast(out < qty
              ? (lang === "zh" ? `⚠️ ${d === today ? "今日" : d} 销售 +${qty},但库存只有 ${out},库存记为 0(多卖的 ${qty - out} 件没扣库存)` : `⚠️ ${d} 販売 ${qty} 件、在庫は ${out} 件のみ → 在庫 0`)
              : (lang === "zh" ? `✓ ${d === today ? "今日" : d} 销售 +${qty}(库存 -${qty})` : `✓ ${d} 販売 ${qty} 件`)); }} lang={lang} />
            <div style={{ marginTop: 12, fontSize: 11, color: T.textTertiary, marginBottom: 6 }}>{lang === "zh" ? "最近 10 条" : "過去 10 件"}</div>
            {sales.length === 0 ? <div style={{ fontSize: 11, color: T.textTertiary, fontStyle: "italic" }}>—</div> : sales.slice(0, 10).map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "4px 0", borderBottom: `0.5px dashed ${T.borderSoft}` }}>
                <span>{s.date}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: T.danger }}>−{s.soldQty || 0}</span>
                  <button onClick={() => confirmDialog(lang === "zh" ? `删除 ${s.date} 销售 ${s.soldQty} 件? 库存会加回 ${saleStockBack(s)}` : `${s.date} の販売 ${s.soldQty} 件を削除?`, () => deleteLog("sale", s.id))} title={lang === "zh" ? "删除(库存会回滚)" : "削除"} style={{ border: "none", background: "none", color: T.textTertiary, cursor: "pointer", fontSize: 14, padding: "0 4px", lineHeight: 1 }}>×</button>
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
          {lang === "zh" ? <>还没有商品。<br/>商品 = 对外销售的单品或礼盒,绑定你的配方/组合产品后<br/>可以管理库存、看每天该做什么、记销售。</> : <>商品未登録。<br/>販売するSKUとレシピを紐付けて在庫管理。</>}
        </div>
      ) : (
        <>
          {/* v12: 今日要做摘要 - 列出 currentStock <= threshold 的商品 */}
          {(() => {
            // 2026-09-29 体检第 2 批:以前没设补货线(0)的商品 0 <= 0 永远挂在红框里,现在补货线 > 0 才算低库存(下面卡片、详情页同一口径)
            const low = products.filter(p => (p.threshold || 0) > 0 && (p.currentStock || 0) <= p.threshold);
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
              const low = th > 0 && stock <= th;
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
      <Section title={lang === "zh" ? "组合产品" : "組立製品"} emoji="🎂" pool={creationPool} type="creation" color="#a05a8d" originCount={creations.length} />
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
  // 没保存就切页 / 取消时先问一句。要写在下面「选组成项」那个提前 return 之前(hook 顺序不能变);
  // 选组成项的页面是点本页「+ 加一项」进去的,那一下已经拍过快照,所以它的根元素不用再挂
  const dirtyBind = useDirtyGuard(() => form);
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
    <div {...dirtyBind}>
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
          <div style={{ fontSize: 12, color: T.textTertiary, fontStyle: "italic", padding: "12px 0" }}>{lang === "zh" ? "还没有组成项。点「+ 加一项」从配方/组合产品/组件选。礼盒可加多项。" : "未追加"}</div>
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
                    {/* 2026-09-29 体检第 2 批:以前 value={it.qty || 1},按退格清空立刻变回 1,再输 2 成了 12;空着保存时 handleSave 兜底成 1 */}
                    <input type="number" value={it.qty ?? 1} onChange={e => updateItem(i, "qty", e.target.value)} style={{ ...inputStyle, width: 60, padding: "4px 6px" }} />
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
              {priceCurBtn(form, (c, p) => setForm(prev => ({ ...prev, priceCurrency: c, sellPrice: p })), lang, form.sellPrice)}
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

function SuppliersView({ suppliers, setSuppliers, shopMaterials, setShopMaterials, materials, brands, lang, showToast, confirmDialog, viewId, setViewId, editTarget, setEditTarget }) {
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
          // 删 supplier + 从 shopMaterials 的 supplierIds 中剥离(以前注释这么写、代码没做,确认框的话不兑现)
          const sid = editTarget.id;
          setSuppliers(prev => prev.filter(x => x.id !== sid));
          if (setShopMaterials) setShopMaterials(prev => prev.map(sm => Array.isArray(sm.supplierIds) && sm.supplierIds.includes(sid) ? { ...sm, supplierIds: sm.supplierIds.filter(x => x !== sid), updatedAt: new Date().toISOString() } : sm));
          showToast(lang === "zh" ? "已删除" : "削除しました");
          setEditTarget(null);
          setViewId(null);   // 同商品:不清掉会停在已删供货商的详情(白屏)
        });
      }}
      onBack={() => confirmLeaveEditor(confirmDialog, lang, () => {
        // [B4 修复] 有 id 跳详情,无 id 回列表
        if (editTarget && editTarget.id) setViewId(editTarget.id);
        setEditTarget(null);
      })}
    />;
  }

  if (viewId) {
    const s = suppliers.find(x => x.id === viewId);
    if (!s) { setTimeout(() => setViewId(null), 0); return null; }   // 兜底:找不到就回列表
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
  const dirtyBind = useDirtyGuard(() => form);   // 没保存就切页 / 取消时先问一句
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
    <div {...dirtyBind}>
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
  // 2026-09-29 体检第 2 批:以前用 UTC 日期,北京早上 8 点前默认开始日差一天;plus 按本地日历加减天数
  const today = localDateStr();
  const plus = (d, days) => { const [y, m, dd] = String(d).split("-").map(Number); return localDateStr(new Date(y, m - 1, dd + days)); };
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(plus(today, 7));
  const days = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1);

  // 历史均值: 过去 30 天日均
  // 2026-09-29 体检第 2 批:以前分母固定 30,开业第 7 天卖了 700 个只算成每天 23 个。
  // 现在分母 = min(30, 从这个商品最早一条记录到今天的天数),不足 30 天在「建议」旁标「按最近 X 天」
  const salesSpan = (productId) => {
    const since = plus(today, -30);
    const all = (salesLog || []).filter(s => s.productId === productId);
    const list = all.filter(s => s.date >= since);
    // 从这个商品「有史以来第一条」销售记录算起(审查发现:只看 30 天内最早那条,偶尔卖一次的老商品会被当成新品,建议量翻好几倍)
    const earliest = all.reduce((m, s) => (s.date && s.date < m ? s.date : m), today);
    const span = Math.round((new Date(today) - new Date(earliest)) / 86400000) + 1;
    return { list, span: Math.min(30, Math.max(1, span || 1)) };
  };
  const avgPerDay = (productId) => {
    const { list, span } = salesSpan(productId);
    const total = list.reduce((a, s) => a + (parseFloat(s.soldQty) || 0), 0);
    return total / span;
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
    // 2026-09-29 体检第 2 批:以前没关联百科的配料、用量不是数字的配料、没填用量的部分、没挂配方的商品、挂的配方已删除,
    // 全都悄悄跳过,页面像是算全了。现在收集起来,结果区末尾列「这些没算进来」。key = 原因 + 出处 → 名字集合(去重)
    const skipped = new Map();
    const skip = (reason, src, name) => {
      const k = reason + "\u0000" + src;
      if (!skipped.has(k)) skipped.set(k, { reason, src, names: new Set() });
      if (name) skipped.get(k).names.add(name);
    };
    const ingName = (ing) => mLabel(ing) || ing.nameFr || "";
    const collect = (obj, multiplier, src) => {
      (obj.ingredients || []).forEach(ing => {
        if (!ing) return;
        const q = parseFloat(ing.qty) || 0;
        const nm = ingName(ing);
        if (!ing.materialId) { if (nm) skip("unlinked", src, nm); return; }
        if (q <= 0) { skip("badQty", src, `${nm}${_normTxt(ing.qty) ? `(${ing.qty})` : ""}`); return; }
        grams[ing.materialId] = (grams[ing.materialId] || 0) + q * multiplier;
      });
      (obj.layers || []).forEach(l => collect(l, multiplier, src));
    };
    (products || []).forEach(p => {
      const planQty = parseFloat(plan[p.id]) || 0;
      if (planQty <= 0) return;
      if ((p.items || []).length === 0) skip("noItems", mLabel(p));
      (p.items || []).forEach(it => {
        // [B6 修复] 支持 component(组件)
        const target = it.linkedType === "creation" ? creations.find(c => c.id === it.linkedId)
          : it.linkedType === "component" ? components.find(c => c.id === it.linkedId)
          : recipes.find(r => r.id === it.linkedId);
        if (!target) { skip("missing", mLabel(p)); return; }
        const src = mLabel(target) || target.nameFr || "";
        // recipe/component: 每份 item 需要 X.yield 个单位;实际要做 planQty * it.qty 个单位 → multiplier = planQty * it.qty / yield
        const unit = parseFloat(it.qty) || 1;
        if (it.linkedType === "creation") {
          // v17.8: 组合产品要做 planQty * it.qty 个,和整体配方同一套算法(creationBatch):每部分按「用量 ÷ 组件产出量」折。
          // 以前是「每部分整批 × 个数」,圣多诺黑做 12 个会算出 12 批千层。备货的部分也算(原料一样要买);没填用量的部分算不出,跳过
          const b = creationBatch(target, planQty * unit, components, materials || [], brands || []);
          b.parts.forEach(p => {
            if (p.noUsed) { skip("noUsed", src, p.layer.customName || mLabel(p.layer) || `#${p.idx + 1}`); return; }
            p.ings.forEach(({ ing, qty }) => {
              if (!ing.materialId) { skip("unlinked", src, ingName(ing)); return; }
              if (!(qty > 0)) { skip("badQty", src, `${ingName(ing)}${_normTxt(ing.qty) ? `(${ing.qty})` : ""}`); return; }
              grams[ing.materialId] = (grams[ing.materialId] || 0) + qty;
            });
          });
          return;
        }
        const mult = (planQty * unit) / Math.max(1, parseFloat(target.yield) || 1);
        collect(target, mult, src);
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
    setComputed({ grams, bySupplier, skipped: [...skipped.values()].map(x => ({ ...x, names: [...x.names] })), computedAt: new Date().toISOString() });
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
    // 2026-09-29 体检第 2 批:以前 new Date("YYYY-MM-DD") 是 UTC 零点、再用 UTC 取日期;改成按本地日历走(日期框清空时不再算)
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fromDateStr || "");
    if (!ymd) return null;
    let d = new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
    for (let i = 0; i < 14; i++) {
      const dayOfWeek = d.getDay();
      const ds = localDateStr(d);
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
              const sp = salesSpan(p.id);
              const spanNote = sp.list.length > 0 && sp.span < 30 ? (lang === "zh" ? `(按最近 ${sp.span} 天)` : `(直近 ${sp.span} 日)`) : "";
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: T.bgMuted, borderRadius: T.radiusSm }}>
                  <div style={{ flex: 1, fontSize: 13 }}>{mLabel(p)}</div>
                  <div style={{ fontSize: 10, color: T.textTertiary, minWidth: 80 }}>{lang === "zh" ? `建议 ${recommend}` : `推奨 ${recommend}`}{spanNote}</div>
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
              // 本店价按各自币种折成人民币再相加(没写币种 = 日元,见 curOf);日元折算的标 ≈
              const groupTotal = items.reduce((acc, it) => {
                const pricePerG = it.sm ? toCNY(it.sm.pricePerG, curOf(it.sm)) : 0;
                return acc + (pricePerG > 0 ? pricePerG * it.grams : 0);
              }, 0);
              const groupApprox = items.some(it => it.sm && curOf(it.sm) === "JPY" && parseFloat(it.sm.pricePerG) > 0);
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
                      {groupTotal > 0 && <span style={{ marginLeft: 8, color: T.success }}>{groupApprox ? "≈" : ""}¥{groupTotal.toFixed(0)}</span>}
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {items.map(it => {
                      const mat = materials.find(m => m.id === it.materialId);
                      const packG = it.sm && it.sm.packSize ? parsePackSizeToGrams(it.sm.packSize) : ((mat && mat.packSize) ? parsePackSizeToGrams(mat.packSize) : 0);
                      const packs = packG > 0 ? Math.ceil(it.grams / packG) : null;
                      const pricePerG = it.sm ? toCNY(it.sm.pricePerG, curOf(it.sm)) : 0;
                      const subtotal = pricePerG > 0 ? pricePerG * it.grams : 0;
                      const approx = !!(it.sm && curOf(it.sm) === "JPY");
                      return (
                        <div key={it.materialId} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr", gap: 8, padding: "6px 10px", borderBottom: `0.5px dashed ${T.borderSoft}`, fontSize: 12, alignItems: "center" }}>
                          <div>{mat ? mLabel(mat) : <span style={{ color: T.danger }}>{it.materialId}</span>}</div>
                          <div style={{ textAlign: "right", color: T.textSecondary }}>{it.grams.toFixed(0)}g</div>
                          <div style={{ textAlign: "right", fontSize: 11, color: T.textTertiary }}>
                            {packs != null ? `${packs} ${lang === "zh" ? "包" : "パック"}` : (lang === "zh" ? "规格未知" : "規格?")}
                          </div>
                          <div style={{ textAlign: "right", fontFamily: T.fontSerif, color: subtotal > 0 ? T.textPrimary : T.textTertiary }}>
                            {subtotal > 0 ? `${approx ? "≈" : ""}¥${subtotal.toFixed(0)}` : "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* 2026-09-29 体检第 2 批:以前跳过的东西不提示,现在末尾列「这些没算进来」 */}
            {(computed.skipped || []).length > 0 && (() => {
              const zh = lang === "zh";
              const reasonText = {
                noItems: zh ? "商品没挂任何配方 / 组合产品 / 组件" : "レシピ未関連の商品",
                missing: zh ? "商品挂的配方 / 组合产品 / 组件已删除" : "関連先が削除済み",
                noUsed: zh ? "这几个部分没填「用量」,整部分没算" : "使用量未入力のパーツ",
                unlinked: zh ? "没关联材料百科" : "百科未関連",
                badQty: zh ? "用量没填或不是数字" : "分量が数字でない",
              };
              const total = computed.skipped.reduce((a, x) => a + Math.max(1, x.names.length), 0);
              return (
                <div style={{ background: T.bgCard, border: `0.5px solid ${T.warning}`, borderLeft: `3px solid ${T.warning}`, borderRadius: T.radiusLg, padding: "1rem 1.25rem", marginBottom: "0.75rem" }}>
                  <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, color: T.warning }}>⚠️ {zh ? `这些没算进来(${total} 项)` : `計算に含まれていないもの(${total} 件)`}</div>
                  <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 3, marginBottom: 8 }}>{zh ? "照上面的单子下单会少买这些。补好关联 / 用量后再点一次「计算采购清单」。" : "上のリストには含まれていません。"}</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {computed.skipped.map((x, i) => (
                      <div key={i} style={{ fontSize: 12, lineHeight: 1.6, color: T.textSecondary }}>
                        <span style={{ color: T.textPrimary, fontWeight: 500 }}>「{x.src}」</span>
                        <span style={{ color: T.warning, margin: "0 6px" }}>{reasonText[x.reason] || x.reason}</span>
                        {x.names.length > 0 && <span>{x.names.join(zh ? "、" : "、")}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
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
      setError("密码不正确 / パスワードが正しくありません");   // 2026-09-29 体检第 2 批:密码页改中文在前(以前日文为主,北京员工看不懂)
      setInput("");
    }
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.paper, padding: 20, fontFamily: T.fontSans, colorScheme: "light" }}>
      <style>{GLOBAL_CSS}</style>
      <form onSubmit={submit} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: "40px 32px", maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}><Wordmark size={26} /></div>
        <div style={{ ...T.fs.micro, color: T.subtle, marginBottom: 24, fontFamily: T.fontSerif }}>配方管理 · v1 内部测试</div>
        <div style={{ ...T.fs.small, color: T.body, marginBottom: 18, lineHeight: 1.7 }}>
          这个 app 正在内部测试中<br/>
          <span style={{ ...T.fs.caption, color: T.subtle }}>このアプリは内部テスト中です</span>
        </div>
        <input
          type="password"
          className="k-input"
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          placeholder="密码 / パスワード"
          autoFocus
          style={{ width: "100%", padding: "10px 14px", fontSize: 14, border: `1px solid ${T.border}`, borderRadius: T.radius, marginBottom: 10, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: T.surface, color: T.ink }}
        />
        {error && <div style={{ ...T.fs.caption, color: T.danger, marginBottom: 8 }}>{error}</div>}
        <button type="submit" className="k-btn k-btn-primary" style={{ width: "100%", padding: "12px 14px", background: T.ink, color: T.paper, border: `1px solid ${T.ink}`, borderRadius: T.radius, fontSize: 14, fontWeight: 400, cursor: "pointer", marginTop: 6, fontFamily: "inherit" }}>进入 / 入る</button>
        <div style={{ ...T.fs.label, color: T.muted, marginTop: 22, lineHeight: 1.7 }}>
          密码请向 LuLu 要 · 输入一次,下次就不用再输<br/>
          パスワードは LuLu から · 一度入力すれば次回は不要
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
  // 2026-09-29 体检第 2 批:以前 const stored = loadData() 写在函数体里,App 每重画一次就把整份存档(约 186 万字)重新解析一遍;
  // 现在只在第一次渲染读一次,下面各 useState 的初值也改成惰性函数(只在第一次算)
  const [stored] = useState(loadData);
  // 删掉过的预置条目(见 mergeWithDefaults / 下面的 dismissedSeedIds effect)
  const [dismissedSeeds] = useState(() => new Set(Array.isArray(stored?.appSettings?.dismissedSeedIds) ? stored.appSettings.dismissedSeedIds : []));
  // v1 内测: 默认种子 = 今天录入的 Framboisier + Caramel Abricot 全套
  // 老种子 (FINANCIER / COFFEE_BASQUE_* / AGREABLE_MOUSSE / DEFAULT_KNOWLEDGE / DEFAULT_CATS) 已隐藏 (代码保留以备回退)
  const [recipes, setRecipes] = useState(() => mergeWithDefaults(stored?.recipes, SEED_RECIPES, dismissedSeeds, "recipes"));
  const [cats, setCats] = useState(() => migrateCats(stored?.cats) || []);
  const [components, setComponents] = useState(() => mergeWithDefaults(stored?.components, SEED_COMPONENTS, dismissedSeeds, "components"));
  const [creations, setCreations] = useState(() => mergeWithDefaults(stored?.creations, SEED_CREATIONS, dismissedSeeds, "creations"));
  const [knowledge, setKnowledge] = useState(() => mergeWithDefaults(stored?.knowledge, SEED_KNOWLEDGE, dismissedSeeds, "knowledge"));
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
  // v17: 从 useEffect 挪到渲染期 —— effect 在渲染之后跑,改完本店价这一帧的成本
  // 和箱价还会用旧价算。setter 幂等、不动 React 状态,渲染期调用是安全的。
  setShopMaterialsForLookup(shopMaterials);
  // v17: 全局配置(日元汇率 + 价格显示口径)。注入给成本链和显示 helper。
  // ⚠️ 故意不放 useEffect —— effect 在渲染之后跑,改完汇率/口径这一帧列表还会显示旧数字。
  // 这两个 setter 幂等、不改 React 状态,渲染期间调用是安全的。
  const [appSettings, setAppSettings] = useState(() => ({
    fxJpyToCny: DEFAULT_FX_JPY_CNY,
    displayCurrency: "CNY",     // LuLu 平时看人民币
    ...(stored?.appSettings || {}),
  }));
  setFxForLookup(appSettings.fxJpyToCny);
  setDisplayCurForLookup(appSettings.displayCurrency);
  // 🏷 产品家族（Product Family）
  // v1 内测: 默认种子 = SEED_FAMILIES (family_buttercream_cake + family_pate_a_cake), 老 family_basque 已隐藏
  const [productFamilies, setProductFamilies] = useState(() => mergeWithDefaults(stored?.productFamilies, SEED_FAMILIES, dismissedSeeds, "productFamilies"));
  // 2026-09-29 体检第 2 批:删掉的预置条目以前刷新后又被补回来(Framboisier、8 个组件、5 条知识……)。
  // 载入时没被删过的预置条目都已补齐,所以「现在数据里找不到的预置 id」= 她删掉的(不管从哪一页删、清除全部还是覆盖导入),
  // 记进 appSettings.dismissedSeedIds,下次载入 mergeWithDefaults 跳过;撤销删除 / 合并导入加回来后自动从名单里去掉
  useEffect(() => {
    const absent = [];
    const scan = (kind, items, seeds) => {
      const ids = new Set((items || []).map(x => String(x && x.id)));
      (seeds || []).forEach(s => { if (s && !ids.has(String(s.id))) absent.push(kind + ":" + String(s.id)); });
    };
    scan("recipes", recipes, SEED_RECIPES);
    scan("components", components, SEED_COMPONENTS);
    scan("creations", creations, SEED_CREATIONS);
    scan("knowledge", knowledge, SEED_KNOWLEDGE);
    scan("productFamilies", productFamilies, SEED_FAMILIES);
    absent.sort();
    setAppSettings(prev => {
      const cur = Array.isArray(prev.dismissedSeedIds) ? [...prev.dismissedSeedIds].sort() : [];
      if (cur.join("\n") === absent.join("\n")) return prev;
      return { ...prev, dismissedSeedIds: absent };
    });
  }, [recipes, components, creations, knowledge, productFamilies]);
  const [familyViewMode, setFamilyViewMode] = useState("flat"); // "flat" | "family" | "onsale"
  // v17: 「在售中」标记。季节食材决定当季卖哪几款,标了的排到最前 + 单独一页。
  // 只是配方上的一个布尔,跟 products(可售单元 / 库存)是两回事,不联动。
  const toggleOnSale = (id) => setRecipes(prev => prev.map(r =>
    r.id === id ? { ...r, onSale: !r.onSale, updatedAt: new Date().toISOString() } : r));
  // v17.8: 组合产品也能标「在售中」,和配方一起列在配方一览
  const toggleCreationOnSale = (id) => setCreations(prev => prev.map(c =>
    c.id === id ? { ...c, onSale: !c.onSale, updatedAt: new Date().toISOString() } : c));
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
  // v17.8: 从配方一览点进组合产品时记 "list",详情页「返回」回配方一览而不是组合产品列表。
  // 离开组合产品 tab(点导航去别处)就作废,免得以后从组合产品列表点进去,返回却跳到配方一览
  const [creationReturnTo, setCreationReturnTo] = useState(null);
  useEffect(() => { if (tab !== "creations") setCreationReturnTo(null); }, [tab]);
  // 2026-09-29 体检修:离开组件 / 组合产品页就关掉编辑页。以前「正在编辑哪一条」留在 App 上,
  // 切回来编辑页还开着、里面是切走前的旧内容,这时保存会把中间改过的在用 / 在售标记改回去;
  // 从知识库点「关联组件」打开的也是这个旧编辑页
  useEffect(() => {
    if (tab !== "components") setCompEditTarget(null);
    if (tab !== "creations") setCreationEditTarget(null);
    // 2026-09-29 第 2 批 2b(施工时发现):商品 / 供货商 / 材料百科的编辑页同样会留着。商品最危险 ——
    // 编辑页开着切去卖货,库存变了,回来一保存,表单里切走前的旧库存数把新的盖掉。
    // (数据页「内容体检」跳材料 / 厂家编辑是同一次操作里先设编辑对象再切到 materialsPedia,切过去以后 tab 已经是它,不会被清)
    if (tab !== "products") setProductEditTarget(null);
    if (tab !== "suppliers") setSupplierEditTarget(null);
    if (tab !== "materialsPedia") { setBrandEditTarget(null); setMaterialEditTarget(null); }
  }, [tab]);
  // 导航按钮切页:编辑页有没保存的改动先问一句(以前直接切走,十几行配料当场丢)
  const goTab = (t) => {
    // 2026-09-29 体检第 2 批:家族详情 / 编辑是盖满屏的一层,以前点底栏切了页它还盖在上面,像导航失灵 —— 切页时一起关掉
    const go = () => { setTab(t); setMoreOpen(false); setFamilyViewId(null); setFamilyEditTarget(null); };
    // 家族编辑层开着时,点当前这个 tab 也会关掉它,所以也要问
    if ((t !== tab || familyEditTarget !== null) && anyEditorDirty()) {
      confirmDialog(
        lang === "zh" ? "这一页有还没保存的修改。现在离开,刚才改的内容会丢。" : "保存していない変更があります。移動すると失われます。",
        go,
        { title: lang === "zh" ? "还没保存" : "未保存", confirmText: lang === "zh" ? "不保存,离开" : "保存せず移動", cancelText: lang === "zh" ? "留在这里" : "戻る" }
      );
      return;
    }
    go();
  };
  // 关网页 / 刷新时也提醒(浏览器自己的提示框;有的内嵌窗口不显示,不影响)
  useEffect(() => {
    const onBeforeUnload = (e) => { if (_skipUnloadPrompt) return; if (anyEditorDirty()) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);
  const [knowledgeViewId, setKnowledgeViewId] = useState(null);
  const [knowledgeEditTarget, setKnowledgeEditTarget] = useState(null);
  // 2026-09-29 体检第 2 批 2b:离开知识库就关掉知识编辑页(照上面组件 / 组合产品)。以前切回来编辑页还开着、是旧内容;
  // 从配方详情点「相关知识」跳过来,也被这个旧编辑页挡住看不到那条知识
  useEffect(() => { if (tab !== "knowledge") setKnowledgeEditTarget(null); }, [tab]);
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
  // 2026-09-29 体检修:同一份数据开在两个窗口(桌面图标的 App 窗口 + 浏览器标签页)时,每个窗口都拿自己内存里的整份数据写回去,
  // 旧窗口点一下在售圆点就把新窗口录的内容整份冲掉。浏览器的 storage 事件只在「别的窗口」写入时触发 ——
  // 收到就把本窗口标成过期:停掉自动保存,顶上提示刷新。
  // 只按「内容」判断:本窗口最后一次写入 / 载入的存档内容(不含 savedAt)。别的窗口写进来的内容和它一样就不算改过
  // (审查发现:只看有没有写,新开或刷新一个窗口就会把另一个正在用的窗口踢成过期,两个窗口来回互踢)
  const staleRef = useRef(false);
  const lastBodyRef = useRef(undefined);
  if (lastBodyRef.current === undefined) {
    try { lastBodyRef.current = storageBodyOf(localStorage.getItem(STORAGE_KEY)); } catch (e) { lastBodyRef.current = null; }
  }
  const [staleWindow, setStaleWindow] = useState(false);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY && e.key !== null) return;
      if (e.key === STORAGE_KEY && storageBodyOf(e.newValue) === lastBodyRef.current) return;
      staleRef.current = true; setStaleWindow(true);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  // 2026-09-29 体检第 2 批(新功能):App 更新以后,以前要关掉重开才换上新版,她不知道自己用的是旧版。
  // 离线缓存(src/sw.js)下载好新版会 skipWaiting + clients.claim,页面收到 controllerchange ——
  // 只有「之前已经有旧版在管这一页」时才算更新(第一次安装也会触发,那次不提示),顶上出一条「刷新」提示。
  // 页面开着时每 30 分钟问一次有没有新版,切回这个标签页 / 从后台切回 app 时也问(只在页面看得见时问,两次至少隔 1 分钟)。
  // 不支持离线缓存的浏览器什么都不做。
  const [swUpdateReady, setSwUpdateReady] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    let hadController = !!sw.controller;
    const onChange = () => { if (hadController) setSwUpdateReady(true); hadController = true; };
    sw.addEventListener("controllerchange", onChange);
    // 问一次有没有新版(只是重新取一下 sw.js,很小);两次之间至少隔 1 分钟,免得来回切页一直发请求
    let lastCheck = 0;
    const check = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (Date.now() - lastCheck < 60 * 1000) return;
      lastCheck = Date.now();
      try { sw.getRegistration().then(r => { if (r) r.update().catch(() => {}); }).catch(() => {}); } catch (e) {}
    };
    const timer = setInterval(check, 30 * 60 * 1000);
    // 09-29 她推完一直开着页面没看到新版:切回这个标签页 / iPad 从后台切回 app 时也问一次
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => { sw.removeEventListener("controllerchange", onChange); clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("focus", onVisible); };
  }, []);
  const doSave = () => staleRef.current
    ? { ok: false, error: "stale" }
    : saveData(recipes, cats, components, creations, knowledge, brands, materials, printSettings, customCompCats, productFamilies, shopMaterials, products, salesLog, productionLog, suppliers, appSettings, { lastBody: lastBodyRef });
  // 刚改完 0.8 秒内就关页面 / 切走 iPad,防抖计时器来不及跑,最后一次修改会丢:离开时立刻存一次
  const saveNowRef = useRef(doSave);
  saveNowRef.current = doSave;
  const pendingRef = useRef(false);   // 有没有还没写进去的改动;没有就不在离开时写(每写一次都会让别的窗口变成「过期」)
  useEffect(() => {
    const flush = () => {
      if (staleRef.current || !pendingRef.current) return;
      const res = saveNowRef.current();
      if (res && res.ok) pendingRef.current = false;
    };
    const onVis = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => { window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  // 2026-09-29 体检第 2 批:覆盖导入 / 清除全部之前存一份「固定」备份(不参与自动轮换)。
  // 先把还没写进去的改动写掉,再拿存档里的内容备份。返回 true = 存上了
  const pinBackupNow = async (reason) => {
    try {
      if (pendingRef.current && !staleRef.current) {
        const res = saveNowRef.current();
        if (res && res.ok) pendingRef.current = false;
      }
      const cur = localStorage.getItem(STORAGE_KEY);
      if (!cur) return true;   // 本来就没有存档,没什么可备份的
      return await addBackupSnapshot(cur, null, { pinned: true, reason });
    } catch (e) { return false; }
  };

  useEffect(() => {
    if (staleRef.current) {
      setSaveState({ status: "error", at: null, msg: lang === "zh" ? "已停止保存:数据在别的窗口改过,请刷新" : "保存停止:別のウィンドウで変更されました。再読み込みしてください" });
      return;
    }
    setSaveState(s => (s.status === "saving" ? s : { ...s, status: "saving" }));
    pendingRef.current = true;
    const t = setTimeout(() => {
      const res = doSave();
      if (res && res.ok) {
        pendingRef.current = false;
        // 数据只存在浏览器本地，所以「已保存」必须显式给出时间 —— 老板要能确信东西没丢
        setSaveState({ status: "saved", at: new Date() });
      } else if (res && res.error === "stale") {
        setSaveState({ status: "error", at: null, msg: lang === "zh" ? "已停止保存:数据在别的窗口改过,请刷新" : "保存停止:別のウィンドウで変更されました。再読み込みしてください" });
      } else {
        const msg = (res && res.error && res.error.includes("uota"))
          ? (lang === "zh" ? "保存失败：本地空间不足，去「数据」页清理旧数据" : "保存失敗：容量不足。データ画面で整理してください")
          : (lang === "zh" ? "保存失败，请截图给开发者" : "保存失敗。スクショを開発者へ");
        setSaveState({ status: "error", at: null, msg });
      }
    }, 800);
    return () => clearTimeout(t);
  }, [recipes, cats, components, creations, knowledge, brands, materials, printSettings, customCompCats, productFamilies, shopMaterials, products, salesLog, productionLog, suppliers, appSettings, staleWindow]);

  // v17.8: 组合产品里「跟组件库走」的部分 = 组件的最新内容(写进副本,见 syncFollowingLayers)。
  // 组件 / 组合产品 / 材料一变就对一遍;没东西要改时原样返回同一个数组,setState 不会重渲染,不会空转。
  // 老数据第一次打开时,和组件库一样的部分会被标上 follow(只加标记,内容不动)。
  useEffect(() => {
    const matIds = new Set((materials || []).map(m => m && m.id));
    setCreations(prev => syncFollowingLayers(prev, components, matIds));
  }, [components, creations, materials]);

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
            currency: (!isNaN(pp) && pp > 0) ? "CNY" : ing.currency, // v17: pp 是折算后的人民币
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
            currency: (!isNaN(pp) && pp > 0) ? "CNY" : ing.currency, // v17: pp 是折算后的人民币
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
              currency: (!isNaN(pp) && pp > 0) ? "CNY" : ing.currency, // v17: pp 是折算后的人民币
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
  // 2026-09-29 体检第 2 批:导入确认框点「确定」时要读「那一刻」的数据(闭包里的可能是选文件时的旧值)
  const dataRef = useRef(null);
  dataRef.current = { recipes, cats, components, creations, knowledge, brands, materials, shopMaterials, products, salesLog, productionLog, suppliers, productFamilies, customCompCats };
  // 合并 / 覆盖导入的结果,留在数据页上(提示条 5 秒就没了)
  const [importReport, setImportReport] = useState(null);

  // ═══ 🩺 数据体检(2026-09-29 体检第 2 批 2c)═══ 数据 tab 打开面板;检查在 computeDataHealth,跳转和一键改在这里
  const [showDataHealth, setShowDataHealth] = useState(false);
  // 跳到对应的编辑页 / 详情页:先关面板,同一次操作里先设对象再切 tab(切 tab 的 effect 只清「不在那个 tab」的编辑对象,
  // 和「内容质量扫描」跳材料是同一个做法)。从数据 tab 出发,没有编辑页开着,不用走 goTab 的未保存提醒
  const jumpToItem = ({ kind, id } = {}) => {
    const byId = (arr) => (arr || []).find(x => x && x.id === id);
    const target = kind === "recipe" ? byId(recipes) : kind === "component" ? byId(components) : kind === "creation" ? byId(creations)
      : (kind === "material" || kind === "materialView") ? byId(materials) : kind === "brand" ? byId(brands) : kind === "knowledge" ? byId(knowledge) : null;
    if (!target) { showToast(lang === "zh" ? "找不到这一条了,可能已经删掉" : "見つかりません(削除済みかもしれません)"); return; }
    setShowDataHealth(false);
    if (kind === "recipe") { setEditTarget(target); setTab("edit"); }
    else if (kind === "component") { setCompEditTarget(target); setTab("components"); }
    else if (kind === "creation") { setCreationEditTarget(target); setTab("creations"); }
    // 材料百科的查看状态(看过的材料 / 厂家详情、从配方点进来的返回键)在 App 里,切 tab 不清;跳进编辑页前清掉,保存 / 返回后才不冒出以前看过的另一条
    else if (kind === "material") { setBrandEditTarget(null); setMaterialReturnTo(null); setMaterialViewId(null); setBrandViewId(null); setMaterialEditTarget(target); setTab("materialsPedia"); }
    else if (kind === "materialView") { setBrandEditTarget(null); setMaterialEditTarget(null); setMaterialReturnTo(null); setMaterialViewId(target.id); setTab("materialsPedia"); }
    else if (kind === "brand") { setMaterialEditTarget(null); setMaterialReturnTo(null); setMaterialViewId(null); setBrandEditTarget(target); setTab("materialsPedia"); }
    else if (kind === "knowledge") { setKnowledgeEditTarget(target); setTab("knowledge"); }
  };
  // 一键改:先改 + 撤销(2a §09)。按对象身份换:改的是面板上看到的那一个对象;撤销时换回原对象,
  // 这几秒里被别处又改过(身份变了)就不还原,提示一句。本店原料 / 材料 / 厂家写 updatedAt(合并导入按它取新的一边)
  const dhStale = () => showToast(lang === "zh" ? "这一条刚被改过,请再看一眼" : "直前に変更されています。もう一度確認してください");
  const dhNoUndo = () => showToast(lang === "zh" ? "这一条之后又改过,没有撤销" : "その後変更されたため、元に戻しませんでした");
  const dhReplaceOne = (list, setList, orig, patch, msg) => {
    if (!orig || !list.includes(orig)) { dhStale(); return; }
    const fixed = { ...orig, ...patch };
    setList(prev => { const i = prev.indexOf(orig); if (i < 0) return prev; const next = prev.slice(); next[i] = fixed; return next; });
    showToast(msg, { undo: () => {
      let back = false;
      setList(prev => { const i = prev.indexOf(fixed); if (i < 0) return prev; back = true; const next = prev.slice(); next[i] = orig; return next; });
      setTimeout(() => { if (!back) dhNoUndo(); }, 0);   // 更新函数在 React 渲染时才跑,等它跑完再看
    } });
  };
  // 组合产品里的一个部分:和详情页 layerKeyAt 同一个认法(组件 id + 同一组件的第几个),撤销时还要部分名和用量对得上
  const dhLayerKey = (arr, i) => {
    const sid = arr[i] && arr[i].sourceComponentId;
    if (!sid) return null;
    let k = 0;
    for (let j = 0; j < i; j++) if (arr[j] && arr[j].sourceComponentId === sid) k++;
    return `${sid}#${k}`;
  };
  // H14 正在存备份 / 清旧价格表:这段时间再点(双击)不再清第二次(以前两次都清,先出的那条提示点撤销会说「之后又改过」)
  const dhClearCatsBusy = useRef(false);
  const dataHealthFix = {
    // H1:本店原料是哪种钱。数不变,只写币种
    shopCurrency: (item, cur) => {
      const zh = lang === "zh";
      const nm = zh ? item.labelZh : (item.labelJa || item.labelZh);
      dhReplaceOne(shopMaterials, setShopMaterials, item.obj, { currency: cur === "CNY" ? "CNY" : "JPY", updatedAt: new Date().toISOString() },
        zh ? `「${nm}」标成${cur === "CNY" ? "人民币" : "日元"}(数没变)` : `「${nm}」を${cur === "CNY" ? "人民元" : "円"}にしました(数値はそのまま)`);
    },
    // H2:材料 / 厂家的分类。厂家可以选 ""(全品类)
    category: (item, catId) => {
      const zh = lang === "zh";
      const nm = zh ? item.labelZh : (item.labelJa || item.labelZh);
      const c = (item.entity === "brand" && !catId) ? BRAND_CAT_ALL : getMaterialCat(catId);
      const msg = zh ? `「${nm}」分类改成「${c.zh}」` : `「${nm}」の分類を「${c.ja}」にしました`;
      // 小分类跟着换(同厂家管理页 changeCat / 编辑页):旧的小分类在新大类里有就留着,没有就「其他」;厂家选全品类 → ""
      const oldSub = item.obj && item.obj.subcategoryId;
      const patch = { categoryId: catId, subcategoryId: catId ? ((MATERIAL_SUBCATEGORIES[catId] || []).some(s => s.id === oldSub) ? oldSub : "other") : "", updatedAt: new Date().toISOString() };
      if (item.entity === "brand") dhReplaceOne(brands, setBrands, item.obj, patch, msg);
      else dhReplaceOne(materials, setMaterials, item.obj, patch, msg);
    },
    // H3:家族已经不在了 → 不归属(和删家族时一样写 "")
    clearFamily: (item) => {
      const zh = lang === "zh";
      const nm = zh ? item.labelZh : (item.labelJa || item.labelZh);
      const patch = { familyId: "", updatedAt: new Date().toISOString() };
      const msg = zh ? `「${nm}」改成不归属任何家族` : `「${nm}」を未所属にしました`;
      if (item.entity === "creation") dhReplaceOne(creations, setCreations, item.obj, patch, msg);
      else dhReplaceOne(recipes, setRecipes, item.obj, patch, msg);
    },
    // H7:空的部分改成跟组件库走(和组合产品详情页「用组件库的」同一个写法),内容由同步 effect 写进去
    layerFollow: (item) => {
      const zh = lang === "zh";
      const cr0 = item.obj, l0 = item.layer;
      const li = cr0 && Array.isArray(cr0.layers) ? cr0.layers.indexOf(l0) : -1;
      if (!creations.includes(cr0) || li < 0) { dhStale(); return; }
      const key = dhLayerKey(cr0.layers, li);
      setCreations(prev => prev.map(c => (c && c.id === cr0.id && (c.layers || []).includes(l0))
        ? { ...c, layers: c.layers.map(l => l === l0 ? { ...l0, follow: true, localVariant: false } : l) } : c));
      const nm = zh ? item.labelZh : (item.labelJa || item.labelZh);
      showToast(zh ? `「${nm}」改成跟组件库走,内容换成组件库现在的` : `「${nm}」を部品庫と連動させました`, { undo: () => {
        let back = false;
        setCreations(prev => prev.map(c => {
          if (!c || c.id !== cr0.id) return c;
          const cur = c.layers || [];
          const hit = cur.findIndex((l, i) => l && dhLayerKey(cur, i) === key && (l.customName || "") === (l0.customName || "") && String(l.usedAmount || "") === String(l0.usedAmount || ""));
          if (hit < 0) return c;
          back = true;
          const next = cur.slice(); next[hit] = l0;
          return { ...c, layers: next };
        }));
        setTimeout(() => { if (!back) dhNoUndo(); }, 0);
      } });
    },
    // H14:清掉旧价格表 cats。先存一份固定备份;存不上再问一次(同「清除全部」)
    clearCats: async () => {
      const zh = lang === "zh";
      const orig = cats;
      if (!orig || orig.length === 0) return;
      const doClear = (pinned) => {
        const emptied = [];
        setCats(emptied);
        showToast(zh ? `旧价格表 ${orig.length} 条已清掉${pinned ? "(清之前存了固定备份)" : ""}` : `旧価格表 ${orig.length} 件を削除しました`, { undo: () => {
          let back = false;
          setCats(prev => { if (prev !== emptied) return prev; back = true; return orig; });
          setTimeout(() => { if (!back) dhNoUndo(); }, 0);
        } });
      };
      if (dhClearCatsBusy.current) return;
      dhClearCatsBusy.current = true;
      try {
        if (await pinBackupNow("clear-cats")) doClear(true);
        else confirmDialog(
          zh ? "清之前的固定备份没存上(浏览器的数据库用不了)。仍然清掉旧价格表吗?清掉后 5 秒内还能撤销。" : "削除前の固定バックアップを保存できませんでした。それでも削除しますか?",
          () => doClear(false),
          { title: zh ? "备份没存上" : "バックアップ失敗", confirmText: zh ? "仍然清掉" : "削除する", refs: [zh ? `旧价格表:${orig.length} 条(已停用,成本不读它)` : `旧価格表:${orig.length} 件`] });
      } finally { dhClearCatsBusy.current = false; }
    },
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
        key={t} onClick={() => goTab(t)} className="k-tab"
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
    { id: "creations", zh: "组合产品", ja: "組立製品" },
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
    // 2026-09-29 体检第 2 批:文件名用北京本地日期(以前 UTC,早上 8 点前导出的名字是昨天)
    const a = document.createElement("a"); a.href = url; a.download = `patisserie_${localDateStr()}.json`; a.click();
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
      version: 17,
      _ipPackage: true,         // 标记,导入端可识别这是分发包
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `patisserie_IP_${localDateStr()}.json`; a.click();   // 2026-09-29 体检第 2 批:本地日期
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

  // 覆盖导入时逐类说「现有几条 → 文件几条 / 清空」(2026-09-29 体检第 2 批)
  const IMPORT_ENTITY_LABELS = [
    ["recipes", "配方", "レシピ"], ["components", "组件", "コンポーネント"], ["creations", "组合产品", "組立製品"],
    ["knowledge", "知识", "ナレッジ"], ["brands", "厂家", "メーカー"], ["materials", "材料百科", "材料事典"],
    ["shopMaterials", "本店原料", "仕入れ原料"], ["products", "商品", "商品"], ["salesLog", "销售记录", "売上記録"],
    ["productionLog", "生产记录", "生産記録"], ["suppliers", "供货商", "仕入先"], ["cats", "老价格表", "旧価格表"],
  ];
  const importData = (e) => {
    const f = e.target.files[0];
    e.target.value = "";   // 2026-09-29 体检第 2 批:清空选择,同一个文件第二次选也能触发(以前取消后再选没反应)
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        const err = validateImportSchema(d);
        if (err) {
          showToast((lang === "zh" ? "⚠️ 导入失败:" : "⚠️ インポート失敗:") + err);
          return;
        }
        // 2026-09-29 体检第 2 批:以前确认框只写「导入后将覆盖当前数据」,局部包误点这里会把材料库等整块清空。
        // 现在逐类列出「现有 → 文件 / 清空」,文件里缺的类别直接建议改用合并导入;覆盖前自动存一份固定备份
        const cur = dataRef.current || {};
        const emptied = [], replaced = [];
        IMPORT_ENTITY_LABELS.forEach(([k, zh, ja]) => {
          const label = lang === "zh" ? zh : ja;
          const curN = Array.isArray(cur[k]) ? cur[k].length : 0;
          if (!Array.isArray(d[k])) {
            if (curN > 0) emptied.push(lang === "zh" ? `${label}：现有 ${curN} 条 → 清空(文件里没有)` : `${label}：${curN} 件 → 空になる(ファイルにない)`);
          } else if (curN > 0 || d[k].length > 0) {
            replaced.push(lang === "zh" ? `${label}：现有 ${curN} 条 → 换成文件里的 ${d[k].length} 条` : `${label}：${curN} 件 → ${d[k].length} 件`);
          }
        });
        const partial = emptied.length > 0;
        const msg = lang === "zh"
          ? (partial
              ? `这个文件里没有下面标「清空」的几类数据,覆盖导入会把你现有的这些全部清空。\n\n如果这是录入包(只含几条新配方 / 组件 / 知识),请点「取消」,改用下面的「合并导入」。\n\n覆盖前会自动存一份「固定」备份,出错可以在「恢复备份」里找回。`
              : `文件里的数据会整体替换你现有的数据。\n\n覆盖前会自动存一份「固定」备份,出错可以在「恢复备份」里找回。`)
          : (partial
              ? `このファイルにないデータは空になります。新規パックなら「キャンセル」してマージインポートを使ってください。\n上書き前に固定バックアップを保存します。`
              : `ファイルの内容で現在のデータを置き換えます。\n上書き前に固定バックアップを保存します。`);
        const applyOverwrite = () => {
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
          showToast(lang === "zh" ? "✓ 数据导入成功" : "✓ インポート完了", { ms: 5000 });
          setImportReport({ kind: "overwrite", fileName: f.name, at: new Date(), lines: [...emptied, ...replaced], skipped: [] });
        };
        confirmDialog(msg, async () => {
          if (await pinBackupNow("import")) applyOverwrite();
          else confirmDialog(
            lang === "zh" ? "覆盖前的固定备份没存上(浏览器的数据库用不了)。仍然覆盖吗?建议先点「导出完整备份」存一份文件。" : "固定バックアップを保存できませんでした。それでも上書きしますか?",
            applyOverwrite,
            { title: lang === "zh" ? "备份没存上" : "バックアップ失敗", confirmText: lang === "zh" ? "仍然覆盖" : "上書きする" }
          );
        }, {
          title: lang === "zh" ? (partial ? "覆盖导入会清空数据" : "覆盖导入") : (partial ? "上書きでデータが消えます" : "上書きインポート"),
          kicker: lang === "zh" ? "导入数据(覆盖)" : "上書きインポート",
          refs: [...emptied, ...replaced],
          confirmText: lang === "zh" ? (partial ? "仍然覆盖" : "覆盖导入") : "上書きする",
        });
      } catch (err) {
        showToast((lang === "zh" ? "⚠️ 导入失败:JSON 格式错 - " : "⚠️ JSON エラー:") + (err.message || err));
      }
    };
    reader.readAsText(f);
  };

  // 🆕 合并导入：只新增不覆盖
  // - cats: 按 nameZh/nameJa 匹配,已有则只追加新品牌,没有则新建大类
  // - components/recipes/creations/knowledge: 按名字和 id 匹配,已有跳过;brands/materials/shopMaterials: 已有的按修改时间取新的一边(mergeByNewer)
  const mergeImportData = (e) => {
    const f = e.target.files[0];
    e.target.value = "";   // 2026-09-29 体检第 2 批:清空选择,同一个文件第二次选也能触发(以前取消后再选没反应)
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        const err = validateImportSchema(d);
        if (err) {
          showToast((lang === "zh" ? "⚠️ 合并导入失败:" : "⚠️ マージ失敗:") + err);
          return;
        }

        confirmDialog(
          "合并导入:文件里的新条目追加进来。\n\n配方 / 组件 / 组合产品 / 知识按 id 或名字去重,已有的不动。\n材料百科、厂家、本店原料已有的,只有文件里那条的修改时间更晚才用文件的,否则保留本机的(价格和币种总是同一边的,不会拆开)。\n销售 / 生产记录同一条以修改时间晚的为准。\n\n确认继续？",
          () => {
            // 2026-09-29 体检第 2 批:以前计数写在 setX(prev => …) 里面,点确定时确认框先关(App 已有待处理更新),
            // 那些函数要等下次渲染才执行,拼提示时计数全是 0 —— 永远显示「无新内容可合并(都已存在)」,其实已经加进去了。
            // 现在先用「点确定那一刻」的数据(dataRef)在外面算好要加的条目和计数,再 setX 追加;结果留在数据页上。
            const cur = dataRef.current || {};
            const lines = [];
            const skipped = [];
            const genId = (prefix) => prefix + Date.now() + Math.random().toString(36).slice(2, 6);
            const nameOf = (x) => (x && (x.nameZh || x.nameJa || x.nameFr || x.titleZh || x.titleJa || x.title || x.id)) || "";
            // 按 isDup 去重,返回要追加的条目(文件里自己重复的也只加第一条)
            const pickNew = (base, incoming, isDup, makeId, label) => {
              const add = [];
              (incoming || []).forEach(inc => {
                if (!inc || typeof inc !== "object") return;
                const dup = (base || []).find(x => x && isDup(x, inc)) || add.find(x => isDup(x, inc));
                if (dup) { if (label) skipped.push(`${label}「${nameOf(inc)}」`); return; }
                add.push(makeId ? { ...inc, id: inc.id || makeId() } : inc);
              });
              return add;
            };
            // 追加:再按 id 挡一次(万一这之间别处也加了同 id 的)
            const appendTo = (setter, add) => {
              if (!add.length) return;
              setter(prev => {
                const ids = new Set((prev || []).map(x => x && x.id));
                const a = add.filter(x => !(x.id !== undefined && ids.has(x.id)));
                return a.length ? [...(prev || []), ...a] : prev;
              });
            };
            const sameName = (a, b) => (b.id && a.id === b.id) || (b.nameZh && a.nameZh && b.nameZh === a.nameZh) || (b.nameJa && a.nameJa && b.nameJa === a.nameJa);
            const zh = lang === "zh";

            // 1. 合并 cats(按名字匹配大类,已有则只追加新品牌)
            if (Array.isArray(d.cats)) {
              const incomingCats = migrateCats(d.cats);
              const mergeCats = (prevCats) => {
                const result = [...(prevCats || [])];
                const rep = { catsNew: 0, catsUpdated: 0, brandsAdded: 0 };
                incomingCats.forEach(inc => {
                  const existingIdx = result.findIndex(c =>
                    (inc.nameZh && c.nameZh && inc.nameZh === c.nameZh) ||
                    (inc.nameJa && c.nameJa && inc.nameJa === c.nameJa)
                  );
                  if (existingIdx < 0) {
                    result.push({ ...inc, id: inc.id || ("c" + Date.now() + Math.random().toString(36).slice(2,6)) });
                    rep.catsNew++;
                  } else {
                    const existing = result[existingIdx];
                    const newBrands = [...(existing.brands || [])];
                    let appended = 0;
                    (inc.brands || []).forEach(incBrand => {
                      const dup = newBrands.find(b =>
                        (incBrand.nameZh && b.nameZh && incBrand.nameZh === b.nameZh) ||
                        (incBrand.nameJa && b.nameJa && incBrand.nameJa === b.nameJa)
                      );
                      if (!dup) { newBrands.push(incBrand); appended++; }
                    });
                    if (appended > 0) {
                      result[existingIdx] = { ...existing, brands: newBrands };
                      rep.catsUpdated++;
                      rep.brandsAdded += appended;
                    }
                  }
                });
                return { result, rep };
              };
              const { rep } = mergeCats(cur.cats);
              if (rep.catsNew || rep.brandsAdded) setCats(prev => mergeCats(prev).result);
              if (rep.catsNew) lines.push((zh ? "+ 老价格表新大类 " : "+ 旧価格表カテゴリー ") + rep.catsNew);
              if (rep.brandsAdded) lines.push((zh ? "+ 老价格表新品牌 " : "+ 旧価格表ブランド ") + rep.brandsAdded);
            }

            // 2. 组件 / 3. 配方 / 4. 组合产品(按 id 或 nameZh / nameJa 去重,已有的不动)
            if (Array.isArray(d.components)) {
              const add = pickNew(cur.components, d.components, sameName, () => genId("comp_"), zh ? "组件" : "コンポ");
              appendTo(setComponents, add);
              if (add.length) lines.push((zh ? "+ 新组件 " : "+ コンポーネント ") + add.length);
            }
            if (Array.isArray(d.recipes)) {
              const add = pickNew(cur.recipes, d.recipes, sameName, () => Date.now() + Math.floor(Math.random() * 1000), zh ? "配方" : "レシピ");
              appendTo(setRecipes, add);
              if (add.length) lines.push((zh ? "+ 新配方 " : "+ レシピ ") + add.length);
            }
            if (Array.isArray(d.creations)) {
              const add = pickNew(cur.creations, d.creations, sameName, () => genId("creat_"), zh ? "组合产品" : "組立製品");
              appendTo(setCreations, add);
              if (add.length) lines.push((zh ? "+ 新组合产品 " : "+ 組立製品 ") + add.length);
            }

            // 5. 知识:按 id,或中文 / 日文标题(去掉空格、全半角、大小写差别后)相同去重
            // (2026-09-29 体检第 2 批:以前比的是 title 字段,知识条目根本没有这个字段,按标题去重从来没生效)
            if (Array.isArray(d.knowledge)) {
              const normT = (s) => typeof s === "string" ? s.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase() : "";
              const sameT = (a, b) => { const x = normT(a), y = normT(b); return !!x && x === y; };
              const isDupK = (k, inc) => (inc.id && k.id === inc.id) || sameT(k.titleZh, inc.titleZh) || sameT(k.titleJa, inc.titleJa) || sameT(k.title, inc.title);
              const add = pickNew(cur.knowledge, d.knowledge, isDupK, () => genId("k_"), zh ? "知识" : "ナレッジ");
              appendTo(setKnowledge, add);
              if (add.length) lines.push((zh ? "+ 新知识点 " : "+ ナレッジ ") + add.length);
            }

            // 6. 合并 brands/materials (材料百科,按 id 匹配;已存在时合并新字段)
            const countNewById = (base, incoming) => {
              const ids = new Set((base || []).map(x => x && x.id));
              let n = 0, m = 0;
              (incoming || []).forEach(inc => { if (inc && ids.has(inc.id)) m++; else n++; });
              return [n, m];
            };
            if (Array.isArray(d.brands)) {
              const [n, m] = countNewById(cur.brands, d.brands);
              if (n) lines.push((zh ? "+ 新厂家 " : "+ メーカー ") + n);
              if (m) lines.push(zh ? `· 已有厂家 ${m} 家:按修改时间取新的一边` : `· 既存メーカー ${m}:新しい方を採用`);
              setBrands(prev => {
                const result = [...prev];
                d.brands.forEach(inc => {
                  const existingIdx = result.findIndex(b => b.id === inc.id);
                  if (existingIdx < 0) {
                    result.push(inc);
                  } else {
                    // 已存在:修改时间更晚的一边为准,另一边只补缺的字段(2026-09-29,见 mergeByNewer)
                    result[existingIdx] = mergeByNewer(result[existingIdx], inc, []);
                  }
                });
                return result;
              });
            }
            if (Array.isArray(d.materials)) {
              const [n, m] = countNewById(cur.materials, d.materials);
              if (n) lines.push((zh ? "+ 新材料 " : "+ 材料 ") + n);
              if (m) lines.push(zh ? `· 已有材料 ${m} 条:按修改时间取新的一边` : `· 既存材料 ${m}:新しい方を採用`);
              setMaterials(prev => {
                // v11: priceRange 迁移；v14: imageUrls 格式升级
                const migrated = migrateImageUrls(migrateMaterialsToPriceRange(d.materials));
                const result = [...prev];
                migrated.forEach(inc => {
                  const existingIdx = result.findIndex(m => m.id === inc.id);
                  if (existingIdx < 0) {
                    result.push(inc);
                  } else {
                    // 已存在:修改时间更晚的一边为准;单价 / 参考价 / 币种三样永远同一边(以前字段级合并,
                    // 旧文件没有 currency,本机的「人民币」标签留着、单价却换成文件里的日元数,成本错 20 到 50 倍)
                    result[existingIdx] = mergeByNewer(result[existingIdx], inc, ["pricePerG", "priceRange", "currency"]);
                  }
                });
                return result;
              });
            }
            // v11: 合并 shopMaterials（按 materialId 去重；没 materialId 的孤立条目按 id 去重）
            if (Array.isArray(d.shopMaterials)) {
              const base = cur.shopMaterials || [];
              let n = 0, m = 0;
              d.shopMaterials.forEach(inc => {
                if (!inc || !(inc.materialId || inc.id)) return;
                if (base.some(sm => (sm.materialId && sm.materialId === inc.materialId) || (sm.id && sm.id === inc.id))) m++; else n++;
              });
              if (n) lines.push((zh ? "+ 新本店原料 " : "+ 仕入れ原料 ") + n);
              if (m) lines.push(zh ? `· 已有本店原料 ${m} 条:按修改时间取新的一边` : `· 既存仕入れ原料 ${m}:新しい方を採用`);
              setShopMaterials(prev => {
                const result = [...prev];
                d.shopMaterials.forEach(inc => {
                  const key = inc.materialId || inc.id;
                  if (!key) return;
                  const existingIdx = result.findIndex(sm => (sm.materialId && sm.materialId === inc.materialId) || (sm.id && sm.id === inc.id));
                  if (existingIdx < 0) {
                    result.push({ ...inc, id: inc.id || ("sm_" + Date.now() + Math.random().toString(36).slice(2,6)), supplierIds: Array.isArray(inc.supplierIds) ? inc.supplierIds : [] });
                  } else {
                    // 同材料百科:修改时间更晚的一边为准,本店价和币种同一边
                    const merged = mergeByNewer(result[existingIdx], inc, ["pricePerG", "currency"]);
                    result[existingIdx] = { ...merged, supplierIds: Array.isArray(merged.supplierIds) ? merged.supplierIds : [] };
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
              const add = pickNew(cur.products, d.products, sameName, () => genId("prod_"), zh ? "商品" : "商品");
              appendTo(setProducts, add);
              if (add.length) lines.push((zh ? "+ 新商品 " : "+ 商品 ") + add.length);
            }

            // 8 / 9. 销售 / 生产记录:按 id 去重;同一条(同 id)两边都有时,修改时间(没有就用创建时间)晚的为准
            // (2026-09-29 体检第 2 批:以前同 id 整条跳过,另一台电脑下午在同一条上追加的销量合并不过来)
            const logTime = (x) => Date.parse((x && (x.updatedAt || x.createdAt)) || "") || 0;
            const mergeLogs = (base, incoming, prefix) => {
              const add = [];
              const replace = new Map();
              (incoming || []).forEach(inc => {
                if (!inc || typeof inc !== "object") return;
                if (!inc.id) { add.push({ ...inc, id: genId(prefix) }); return; }
                const inAdd = add.findIndex(x => x.id === inc.id);
                if (inAdd >= 0) { if (logTime(inc) > logTime(add[inAdd])) add[inAdd] = inc; return; }
                const dup = (base || []).find(s => s && s.id === inc.id);
                if (!dup) { add.push(inc); return; }
                const prevRep = replace.get(inc.id);
                if (logTime(inc) > logTime(prevRep || dup)) replace.set(inc.id, inc);
              });
              return { add, replace };
            };
            const applyLogs = (setter, { add, replace }) => {
              if (!add.length && !replace.size) return;
              setter(prev => {
                let changed = false;
                let next = (prev || []).map(x => {
                  const r = x && replace.get(x.id);
                  if (r && logTime(r) > logTime(x)) { changed = true; return r; }
                  return x;
                });
                const ids = new Set(next.map(x => x && x.id));
                const a = add.filter(x => !ids.has(x.id));
                if (a.length) { next = [...next, ...a]; changed = true; }
                return changed ? next : prev;
              });
            };
            let logsReplaced = 0;
            if (Array.isArray(d.salesLog)) {
              const r = mergeLogs(cur.salesLog, d.salesLog, "sl_");
              applyLogs(setSalesLog, r);
              if (r.add.length) lines.push((zh ? "+ 新销售记录 " : "+ 売上記録 ") + r.add.length);
              if (r.replace.size) { lines.push(zh ? `· 销售记录 ${r.replace.size} 条换成了修改时间更晚的那份` : `· 売上記録 ${r.replace.size} 件を新しい方に更新`); logsReplaced += r.replace.size; }
            }
            if (Array.isArray(d.productionLog)) {
              const r = mergeLogs(cur.productionLog, d.productionLog, "pl_");
              applyLogs(setProductionLog, r);
              if (r.add.length) lines.push((zh ? "+ 新生产记录 " : "+ 生産記録 ") + r.add.length);
              if (r.replace.size) { lines.push(zh ? `· 生产记录 ${r.replace.size} 条换成了修改时间更晚的那份` : `· 生産記録 ${r.replace.size} 件を新しい方に更新`); logsReplaced += r.replace.size; }
            }
            if (logsReplaced) lines.push(zh ? "⚠ 商品的当前库存没有跟着这些记录改,请到「商品」页核对一下库存" : "⚠ 在庫数は自動で変わりません。商品画面で確認してください");

            // 10. 合并 suppliers(供应商,按 id/nameZh/nameJa 去重)
            if (Array.isArray(d.suppliers)) {
              const add = pickNew(cur.suppliers, d.suppliers, sameName, () => genId("sup_"), zh ? "供货商" : "仕入先");
              appendTo(setSuppliers, add);
              if (add.length) lines.push((zh ? "+ 新供货商 " : "+ 仕入先 ") + add.length);
            }

            // 11. 合并 productFamilies(产品家族,按 id/nameZh/nameJa 去重)
            if (Array.isArray(d.productFamilies)) {
              const add = pickNew(cur.productFamilies, d.productFamilies, sameName, () => genId("fam_"), zh ? "家族" : "ファミリー");
              appendTo(setProductFamilies, add);
              if (add.length) lines.push((zh ? "+ 新产品家族 " : "+ ファミリー ") + add.length);
            }

            // 12. 合并 customCompCats(自定义组件分类,按 id 去重)
            if (Array.isArray(d.customCompCats)) {
              const add = pickNew(cur.customCompCats, d.customCompCats, (a, b) => !!(b.id && a.id === b.id), null, null);
              appendTo(setCustomCompCats, add);
              if (add.length) lines.push((zh ? "+ 新组件分类 " : "+ コンポ分類 ") + add.length);
            }

            // 13. 合并 printSettings(对象;只在当前是默认值时才用导入的,避免覆盖用户配置)
            if (d.printSettings && typeof d.printSettings === "object") {
              setPrintSettings(prev => {
                const isDefault = !prev || (prev.brandName === "RURU" && !prev.logoUrl && prev.brandSubtitle === "PATISSERIE");
                return isDefault ? d.printSettings : prev;
              });
            }

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            // 报告:提示条给一句话,完整结果(含因同名 / 同编号跳过的条目)留在数据页上
            const added = lines.filter(l => l.startsWith("+"));
            const msg = added.length > 0
              ? (zh ? "✓ 合并完成:" : "✓ マージ完了:") + added.map(l => l.slice(2)).join(" · ")
              : lines.length > 0
                ? (zh ? "✓ 合并完成(没有新增条目;已有的条目按修改时间比过,取了新的一边)" : "✓ マージ完了(新規なし)")
                : (zh ? "没有新内容:文件里的条目这里都已经有了" : "新しい内容はありません(すべて既存)");
            showToast(msg + (skipped.length ? (zh ? ` · 跳过 ${skipped.length} 条同名(详见数据页)` : ` · 同名スキップ ${skipped.length}`) : ""), { ms: 8000 });
            setImportReport({ kind: "merge", fileName: f.name, at: new Date(), lines, skipped });
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
    a.href = url; a.download = `p3_eligible_${localDateStr()}.json`; a.click();   // 2026-09-29 体检第 2 批:本地日期
    URL.revokeObjectURL(url);
    showToast(`✓ 导出 ${list.length} 条待爬 material 清单`);
  };

  const viewingRecipe = recipes.find(r => r.id === viewId);

  return (
    <div style={{ fontFamily: T.fontSans, color: T.textPrimary, fontSize: 14, position: "relative", background: T.bgApp, minHeight: "100vh", colorScheme: "light" }}>
      <style>{GLOBAL_CSS}</style>
      {/* 2026-09-29:别的窗口改过数据 → 本窗口已停止保存,提示刷新(见 staleRef) */}
      {staleWindow && (
        <div role="alert" data-app-banner="" style={{ position: "sticky", top: 0, zIndex: T.z.toast, background: T.danger, color: "#FFFFFF", padding: "10px 16px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", fontSize: 13, lineHeight: 1.6 }}>
          <span style={{ flex: 1, minWidth: 220 }}>
            {lang === "zh"
              ? "这份数据在别的窗口或标签页里改过了。这个窗口已经停止保存,免得把那边的修改冲掉。请刷新载入最新数据(这个窗口里刚改、还没存的内容会丢)。"
              : "別のウィンドウでデータが変更されました。このウィンドウは保存を停止しています。再読み込みしてください。"}
          </span>
          <button type="button" onClick={() => window.location.reload()} style={{ background: "#FFFFFF", color: T.danger, border: "none", borderRadius: T.radius, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            {lang === "zh" ? "刷新" : "再読み込み"}
          </button>
        </div>
      )}
      {/* 2026-09-29 体检第 2 批:新版本下载好了 → 提示刷新(见 swUpdateReady)。中性色,不是出错 */}
      {swUpdateReady && !staleWindow && (
        <div role="status" data-app-banner="" style={{ position: "sticky", top: 0, zIndex: T.z.toast - 1, background: T.sunken, color: T.ink, borderBottom: `1px solid ${T.line}`, padding: "8px 16px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", fontSize: 13, lineHeight: 1.6 }}>
          <span style={{ flex: 1, minWidth: 220 }}>
            {lang === "zh"
              ? "新版本已经下载好了。点「刷新」换上新版(编辑页里没保存的内容请先保存)。"
              : "新しいバージョンの準備ができました。「再読み込み」で切り替えます(編集中の内容は先に保存してください)。"}
          </span>
          <button type="button"
            onClick={() => {
              const reload = () => { _skipUnloadPrompt = true; window.location.reload(); };
              if (anyEditorDirty()) {
                confirmDialog(
                  lang === "zh" ? "编辑页里有还没保存的修改。现在刷新,刚才改的内容会丢。" : "保存していない変更があります。再読み込みすると失われます。",
                  reload,
                  { title: lang === "zh" ? "还没保存" : "未保存", confirmText: lang === "zh" ? "不保存,刷新" : "保存せず再読み込み", cancelText: lang === "zh" ? "先不刷新" : "戻る" }
                );
                return;
              }
              reload();
            }}
            style={{ background: T.ink, color: T.paper, border: "none", borderRadius: T.radius, padding: "5px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            {lang === "zh" ? "刷新" : "再読み込み"}
          </button>
        </div>
      )}
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
        <div className="print-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#FFFFFF", zIndex: 9998, overflow: "auto" }}>
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

      {/* 🩺 数据体检面板(2026-09-29 第 2 批 2c) */}
      {showDataHealth && (
        <DataHealthPanel
          recipes={recipes} components={components} creations={creations} knowledge={knowledge}
          materials={materials} brands={brands} shopMaterials={shopMaterials} productFamilies={productFamilies}
          cats={cats} printSettings={printSettings} appSettings={appSettings}
          lang={lang}
          onClose={() => setShowDataHealth(false)}
          onJump={jumpToItem}
          fix={dataHealthFix}
          topInset={staleWindow ? "stale" : swUpdateReady ? "sw" : ""}
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
            // 2026-09-29 体检第 2 批:以前跳到 "materials"(已废弃的旧价格表),材料编辑页没打开;材料百科是 "materialsPedia"
            const m = materials.find(x => x.id === id);
            if (m) {
              setMaterialEditTarget(m);
              setTab("materialsPedia");
            }
          }}
          onJumpBrand={(id) => {
            const b = brands.find(x => x.id === id);
            if (b) {
              setBrandEditTarget(b);
              setTab("materialsPedia");
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
      {/* 2026-09-29 体检第 2 批:手机上底栏(约 68px)压在这一层下沿,「保存家族」被挡住 —— 底部留出 96px */}
      {familyEditTarget && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#FFFFFF", zIndex: 500, overflow: "auto", padding: "1rem", paddingBottom: 96 }}>
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
                confirmDialog("删除这个家族吗？\n\n家族里的配方和组合产品不会被删除，只会变成「未归属」状态。", () => {
                  setRecipes(prev => prev.map(r => r.familyId === familyEditTarget.id ? { ...r, familyId: "" } : r));
                  setCreations(prev => prev.map(c => c.familyId === familyEditTarget.id ? { ...c, familyId: "" } : c));   // v17.8 组合产品也挂家族,以前删家族漏了它们
                  setProductFamilies(prev => prev.filter(x => x.id !== familyEditTarget.id));
                  showToast("家族已删除");
                  setFamilyEditTarget(null);
                });
              }}
              onBack={() => confirmLeaveEditor(confirmDialog, lang, () => setFamilyEditTarget(null))}
            />
          </div>
        </div>
      )}

      {/* 🏷 家族详情（全屏覆盖） */}
      {familyViewId && (() => {
        const fm = productFamilies.find(f => f.id === familyViewId);
        if (!fm) { setFamilyViewId(null); return null; }
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#FFFFFF", zIndex: 500, overflow: "auto", padding: "1rem", paddingBottom: 96 }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <FamilyDetail
                family={fm}
                recipes={recipes}
                creations={creations}
                lang={lang}
                onEdit={() => { setFamilyEditTarget(fm); setFamilyViewId(null); }}
                onBack={() => setFamilyViewId(null)}
                onViewRecipe={(rid) => { setFamilyViewId(null); setViewId(rid); setTab("view"); }}
                onViewCreation={(cid) => { setFamilyViewId(null); setCreationReturnTo("list"); setCreationEditTarget(null); setCreationViewId(cid); setTab("creations"); }}
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
            <button key={id} onClick={() => goTab(id)}
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
              <button key={n.id} onClick={() => goTab(n.id)}
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
                <div style={{ ...T.fs.titleL, fontFamily: T.fontSerif, ...T.num, color: T.ink }}>{recipes.length + creations.length}</div>
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
              ["onsale", (() => { const k = recipes.filter(r => r.onSale).length + creations.filter(c => c.onSale).length; return `${lang === "zh" ? "在售中" : "販売中"}${k ? " " + k : ""}`; })()],
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

          {recipes.length === 0 && creations.length === 0 && (
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
            // v17.8: 组合产品和配方混在一起列(带「组合」标签),在售圆点、在售中一页一起算
            const items = [...recipes.map(r => ({ kind: "recipe", x: r })), ...creations.map(c => ({ kind: "creation", x: c }))];
            const onSaleList = items.filter(it => it.x.onSale);
            const listItems = familyViewMode === "onsale"
              ? onSaleList
              : [...items].sort((a, b) => (b.x.onSale ? 1 : 0) - (a.x.onSale ? 1 : 0));   // 稳定排序,同组内保持原顺序
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
              {listItems.map(it => {
                if (it.kind === "creation") {
                  // 组合产品行:样式照配方行,多一个「组合」标签;单个成本 = 总成本 ÷ 制作个数 ÷ 每个分几份(和组合产品页同一口径)
                  const c = it.x;
                  const cName = pickLang(c, "name", lang);
                  const cSub = lang === "zh" ? (c.nameJa || "") : (c.nameZh || "");
                  const cFamily = productFamilies.find(fm => fm.id === c.familyId);
                  const cFamColor = cFamily ? FAMILY_COLORS[cFamily.colorIdx || 0] : null;
                  const Wc = creationWords(creationStructureOf(c), lang);
                  const cTotal = (c.layers || []).reduce((s, l) => s + calcLayerLiveCost(l, materials, brands), 0);
                  const cPer = cTotal / (parseFloat(c.serves) || 1) / (parseFloat(c.portions) || 1);
                  const cPrice = toCNY(c.price, priceCurOf(c));
                  const cMargin = cPrice > 0 && cPer > 0 ? ((cPrice - cPer) / cPrice) * 100 : 0;
                  const openCreation = () => { setCreationReturnTo("list"); setCreationEditTarget(null); setCreationViewId(c.id); setTab("creations"); };
                  return (
                    <div
                      key={"creation_row_" + c.id}
                      className="k-row rc-recipe-row"
                      onClick={openCreation}
                      style={{
                        display: "grid", gridTemplateColumns: "1fr 130px 110px",
                        alignItems: "center", gap: T.sp.xl,
                        padding: `18px 0 18px ${T.sp.xl}px`,
                        borderBottom: `1px solid ${T.lineFaint}`,
                        borderLeft: `3px solid ${cFamColor ? cFamColor.color : "transparent"}`,
                        cursor: "pointer",
                      }}
                    >
                      <div className="k-fluid">
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleCreationOnSale(c.id); }}
                            title={c.onSale
                              ? (lang === "zh" ? "在售中 — 点一下取消" : "販売中 — タップで解除")
                              : (lang === "zh" ? "点一下标为在售(会排到最前面)" : "タップで販売中に")}
                            style={{
                              // 2026-09-29 体检第 2 批:空圈以前是 T.line(白底上几乎看不见)、点击区只有 18px;
                              // 改 T.muted,点击区 32px,负边距把占位压回 18px,行排版不变
                              width: 32, height: 32, margin: -7, flex: "0 0 auto", padding: 0, border: "none", background: "transparent",
                              cursor: "pointer", lineHeight: 1, fontSize: 13, alignSelf: "center",
                              color: c.onSale ? T.success : T.muted,
                            }}
                          >{c.onSale ? "●" : "○"}</button>
                          {c.nameFr && (
                            <span style={{ fontFamily: T.fontSerif, ...T.fs.titleS, color: T.ink, fontWeight: 400 }}>{c.nameFr}</span>
                          )}
                          <span style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{cName}</span>
                          {cSub && cSub !== cName && (
                            <span style={{ ...T.fs.caption, color: T.subtle }}>{cSub}</span>
                          )}
                          <span style={{ ...T.fs.micro, color: T.info, border: `1px solid ${T.info}`, padding: "2px 6px", textTransform: "none", letterSpacing: "0.06em" }}>
                            {lang === "zh" ? "组合" : "組立"}
                          </span>
                          {cFamily && (
                            <span style={{ ...T.fs.micro, color: cFamColor.color, border: `1px solid ${cFamColor.color}`, padding: "2px 6px", textTransform: "none", letterSpacing: "0.06em" }}>
                              {lang === "zh" ? (cFamily.nameZh || cFamily.nameJa) : (cFamily.nameJa || cFamily.nameZh)}
                            </span>
                          )}
                        </div>
                        <div style={{ ...T.fs.label, color: T.muted, marginTop: 5, letterSpacing: "0.04em" }}>
                          {[c.size || c.mold, c.serves ? `${c.serves} ${Wc.unit}` : null, (c.layers || []).length ? Wc.partCount(c.layers.length) : null, c.shelfLife].filter(Boolean).join("  ·  ")}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", ...T.fs.caption, ...T.num, color: cMargin >= 50 ? T.success : cMargin >= 30 ? T.warning : T.danger }}>
                        {cPrice > 0 && cPer > 0 ? `${cMargin.toFixed(1)}%` : ""}
                      </div>
                      <div style={{ textAlign: "right", fontFamily: T.fontSerif, ...T.num, color: T.ink }}>
                        {cPrice > 0
                          ? <span style={{ fontSize: 18 }}>{fmtSellPrice(c.price, c)}</span>
                          : <span style={{ ...T.fs.micro, color: T.muted }}>{lang === "zh" ? "未定价" : "未設定"}</span>}
                      </div>
                    </div>
                  );
                }
                const r = it.x;
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
                // 2026-09-29 体检第 2 批:有售价但成本算不出来(配料都没价 / 没填出品数)时,以前显示红色「0.0%」像是亏本 → 改显示灰色「缺成本」;
                // 有几行没单价时成本偏低、利润率虚高,在下面标「N 项没价·利润率虚高」(和详情页「成本算不全」同一口径;09-29 她选的叫法,原来「偏高」看不懂是什么偏高)
                const noPriceN = priceN > 0 && unitCost > 0 ? (r.ingredients || []).filter(ing => getIngPriceSource(ing, materials) === "none").length : 0;
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
                            // 2026-09-29 体检第 2 批:空圈改 T.muted(以前 T.line 几乎看不见),点击区 32px,负边距保持原占位 18px
                            width: 32, height: 32, margin: -7, flex: "0 0 auto", padding: 0, border: "none", background: "transparent",
                            cursor: "pointer", lineHeight: 1, fontSize: 13, alignSelf: "center",
                            color: r.onSale ? T.success : T.muted,
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
                      {priceN > 0 && unitCost > 0 ? `${margin.toFixed(1)}%` : ""}
                      {priceN > 0 && !(unitCost > 0) && <span style={{ color: T.muted }}>{liveCost > 0 && !(yieldN > 0) ? (lang === "zh" ? "缺出品数" : "出来数なし") : (lang === "zh" ? "缺成本" : "原価なし")}</span>}
                      {noPriceN > 0 && (
                        <div style={{ ...T.fs.label, color: T.muted }} title={lang === "zh" ? "有原料没单价,成本算少了,显示的利润率比实际高" : "単価のない材料があり、利益率は実際より高く出ています"}>
                          {/* 分两行:一行放不下时会把左边的名字挤成两行(手机宽度下可丽露实测) */}
                          {lang === "zh" ? <>{noPriceN} 项没价<br />利润率虚高</> : <>単価なし {noPriceN}<br />利益率過大</>}
                        </div>
                      )}
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
                const famCreations = creations.filter(c => c.familyId === fm.id);   // v17.8
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
                        {famCreations.length > 0 && ` · ${famCreations.length} ${lang === "zh" ? "个组合" : "組立"}`}
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
                    {famCreations.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: T.sp.s }}>
                        {famCreations.slice(0, 5).map(c => (
                          <span key={c.id} style={{ background: T.sunken, color: T.body, padding: "3px 10px", borderRadius: T.radius, ...T.fs.label }}>
                            <span style={{ color: T.info, marginRight: 4 }}>{lang === "zh" ? "组合" : "組立"}</span>{pickLang(c, "name", lang)}
                          </span>
                        ))}
                        {famCreations.length > 5 && (
                          <span style={{ ...T.fs.label, color: T.muted, padding: "3px 6px" }}>+{famCreations.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 未归属家族的配方（独立）+ v17.8 没挂家族(或家族已删)的组合产品 */}
              {(() => {
                // 2026-09-29 体检第 2 批:挂着已不存在的家族的配方(熔岩巧克力 / 波尔多可丽露 / 纽约芝士)以前在家族模式里哪都看不到,和组合产品一样归到这里
                const orphanRecipes = recipes.filter(r => !r.familyId || !productFamilies.some(f => f.id === r.familyId));
                const orphanCreations = creations.filter(c => !c.familyId || !productFamilies.some(f => f.id === c.familyId));
                if (orphanRecipes.length === 0 && orphanCreations.length === 0) return null;
                return (
                  <div style={{ marginTop: T.sp.block }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, paddingBottom: 9 }}>
                      <span style={{ ...T.fs.label, color: T.body, letterSpacing: "0.16em" }}>
                        {lang === "zh" ? "未归属家族" : "独立"}
                      </span>
                      <span style={{ flex: 1, height: 1, background: T.line }} />
                      <span style={{ ...T.fs.micro, color: T.muted, ...T.num }}>{orphanRecipes.length + orphanCreations.length}</span>
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
                      {orphanCreations.map(c => (
                        <div key={"creation_row_" + c.id} className="k-row"
                          onClick={() => { setCreationReturnTo("list"); setCreationEditTarget(null); setCreationViewId(c.id); setTab("creations"); }}
                          style={{ padding: `13px 0 13px ${T.sp.xl}px`, borderBottom: `1px solid ${T.lineFaint}`, cursor: "pointer", ...T.fs.small, color: T.body }}>
                          <span style={{ ...T.fs.micro, color: T.info, border: `1px solid ${T.info}`, padding: "1px 5px", marginRight: 8, textTransform: "none", letterSpacing: "0.06em" }}>{lang === "zh" ? "组合" : "組立"}</span>
                          {pickLang(c, "name", lang)}
                        </div>
                      ))}
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
          <RecipeView recipe={viewingRecipe} lang={lang} knowledge={knowledge} recipes={recipes} components={components} creations={creations} onNavigateToKnowledge={(id) => { setKnowledgeViewId(id); setTab("knowledge"); }} onEdit={() => { setEditTarget(viewingRecipe); setTab("edit"); }} onBack={() => setTab("list")} onPrint={(scaled) => setPrintTarget({ type: "recipe", data: (scaled && scaled._printScale) ? scaled : viewingRecipe, stage: "settings" })} materials={materials} brands={brands} onNavigateToMaterial={(id) => { setMaterialReturnTo({ tab: "view", viewId: viewingRecipe.id }); setMaterialViewId(id); setTab("materialsPedia"); }} shopMaterials={shopMaterials} setShopMaterials={setShopMaterials} showToast={showToast} />
        </div>
      )}

      {/* EDIT */}
      {tab === "edit" && (
        <EditForm recipe={editTarget} cats={cats} materials={materials} brands={brands} setMaterials={setMaterials} shopMaterials={shopMaterials} setShopMaterials={setShopMaterials} lang={lang} onSave={handleSaveRecipe} onDelete={handleDeleteRecipe} onBack={() => {
          // [B4 修复] 有 id 跳详情,无 id 回列表
          if (editTarget && editTarget.id) { setViewId(editTarget.id); setTab("view"); }
          else { setTab("list"); }
        }} onQuickAddKnowledge={(k) => { setKnowledge(prev => [...prev, k]); showToast("✓ 知识点已添加并关联"); }} productFamilies={productFamilies} onUpdateCats={setCats} showToast={showToast} confirmDialog={confirmDialog} />
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
          setShopMaterials={setShopMaterials}
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
          recipes={recipes}
          components={components}
          creations={creations}
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
          setShopMaterials={setShopMaterials}
          lang={lang} setLang={setLang}
          viewId={compViewId} setViewId={setCompViewId}
          editTarget={compEditTarget} setEditTarget={setCompEditTarget}
          showToast={showToast}
          saved={saved}
          confirmDialog={confirmDialog}
          knowledge={knowledge}
          recipes={recipes}
          creations={creations}
          products={products}
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

      {/* 组合产品 */}
      {tab === "creations" && (
        <CreationsView
          creations={creations}
          setCreations={setCreations}
          components={components}
          recipes={recipes}
          products={products}
          cats={cats}
          onUpdateCats={setCats}
          brands={brands}
          materials={materials}
          setShopMaterials={setShopMaterials}
          lang={lang} setLang={setLang}
          viewId={creationViewId} setViewId={setCreationViewId}
          editTarget={creationEditTarget} setEditTarget={setCreationEditTarget}
          showToast={showToast}
          saved={saved}
          confirmDialog={confirmDialog}
          onUpdateComponent={(updated, onDone) => {
            // v17.8: 组件一改,「跟组件库走」的组合产品跟着变 —— 按 2a §09 把受影响的产品列出来
            const matIds = new Set((materials || []).map(m => m && m.id));
            const followers = creations.filter(cr => (cr.layers || []).some(l => l && l.sourceComponentId === updated.id && layerLinkState(l, components, matIds) === "follow"));
            const refs = followers.map(cr => `${lang === "zh" ? "会跟着变" : "連動して変わる"}：${pickLang(cr, "name", lang) || cr.nameFr || ""}`);
            confirmDialog("确定将此修改同步回组件库吗？\n\n会更新组件的中日文名、分类、产出量、单位、原料（含每一行的备注、法文名）和步骤；组件自己的风味、模具、图片、整体备注、法文名不会动。\n\n用到这个组件、并且「跟组件库走」的组合产品会一起变；标了「本产品专用」的不变。这一部分之后也跟组件库走。", () => {
              // 按字段合并到原组件上,不整体替换:层里只带这一页能改的字段,
              // 风味 / 模具 / 图片 / 备注 / 在用这些组件自己的东西原样保留(以前整体替换,同步一次全被清掉)
              setComponents(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
              showToast("✓ 已更新回组件库");
              if (onDone) onDone();
            }, { danger: false, refs });
          }}
          knowledge={knowledge}
          onNavigateToKnowledge={(id) => { setKnowledgeViewId(id); setTab("knowledge"); }}
          onPrintCreation={(payload) => setPrintTarget({ type: "creation", data: payload, stage: "settings" })}
          returnToList={creationReturnTo === "list"}
          onReturnToList={() => { setCreationReturnTo(null); setCreationViewId(null); setTab("list"); }}
          onOpenFromList={() => setCreationReturnTo(null)}
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

          {/* 🩺 数据体检(2026-09-29 第 2 批 2c):放最上面 */}
          <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusLg, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
            <div style={{ fontFamily: T.fontSerif, fontWeight: 500, fontSize: 15, color: T.textPrimary, marginBottom: 4 }}>
              🩺 {lang === "zh" ? "数据体检" : "データ診断"}
            </div>
            <p style={{ fontSize: 12, color: T.textSecondary, marginBottom: 12, lineHeight: 1.7 }}>
              {lang === "zh"
                ? "查一遍数据里会让钱数算错、显示不对、需要整理的地方(本店原料的币种、单位对不上的配料、组合产品读不出的用量、认不出的分类、疑似重复的材料……),每一条都能跳过去改,能安全改的直接给按钮(比如「是人民币」「用组件库的」、选分类),点了马上改好,5 秒内可以撤销。"
                : "金額計算・表示・整理が必要なデータを一覧にします(通貨未確認の仕入れ原料、単位が合わない材料、読めない分量、不明な分類、重複材料など)。各項目から編集ページへ移動でき、安全なものはワンタップで直せます(5 秒以内なら元に戻せます)。"}
            </p>
            <Btn variant="primary" onClick={() => setShowDataHealth(true)}>{lang === "zh" ? "打开数据体检" : "データ診断を開く"}</Btn>
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
              { title: lang === "zh" ? "🛟 恢复备份(防丢失保险)" : "🛟 バックアップ復元", desc: lang === "zh" ? `每次保存自动写一份到浏览器内置数据库(跟主数据分开存):保留最近 ${BACKUP_RECENT} 份,再加最近 ${BACKUP_HOURS} 小时每小时一份、最近 ${BACKUP_DAYS} 天每天一份;内容没变不重复存。覆盖导入、清除全部、恢复备份之前,会另存一份「固定」备份,不会被自动挤掉。万一数据丢了或导错了,从这里挑一个版本恢复。` : `自動バックアップ:最新 ${BACKUP_RECENT} 件 + ${BACKUP_DAYS} 日間は1日1件。上書き・全削除・復元の前は固定保存。`, action: <Btn variant="primary" onClick={() => setShowBackupDialog(true)}>{lang === "zh" ? "🛟 打开恢复列表" : "🛟 復元リスト"}</Btn> },
              { title: lang === "zh" ? "导出数据(完整备份)" : "データエクスポート(フル)", desc: lang === "zh" ? "⚠️ 包含本店原料采购价。用于自己跨设备迁移或灾难恢复 —— 不要把这个文件发给客户或公开分享!" : "⚠️ 仕入れ原料の価格を含む。自分のバックアップ用。顧客に渡さないこと。", action: <Btn variant="success" onClick={exportData}>{lang === "zh" ? "↓ 导出完整备份" : "↓ フル出力"}</Btn> },
              { title: lang === "zh" ? "导入数据(覆盖)" : "データインポート(上書き)", desc: lang === "zh" ? "⚠️ 将覆盖现有数据!选择之前导出的完整备份 JSON 恢复全部数据。用于跨设备迁移或灾难恢复。录入包(只含几条新配方 / 组件 / 知识)请用下面的「合并导入」,用这里会把文件里没有的数据清空。" : "⚠️ 現在のデータを上書きします。デバイス移行や復旧時に使用。", action: <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: T.radiusSm, padding: "7px 14px", fontSize: 13, color: T.textPrimary, fontFamily: T.fontSans }}>{lang === "zh" ? "↑ 选择 JSON 文件(覆盖)" : "↑ JSON ファイルを選択"}<input type="file" accept=".json" onChange={importData} style={{ display: "none" }} /></label> },
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
                {/* 2026-09-29 体检第 2 批:导入结果留在页面上(以前只有 2.5 秒的提示条,而且合并导入的计数永远是 0) */}
                {importReport && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.info}`, padding: "1rem 1.25rem", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ ...T.fs.small, fontWeight: 500, color: T.ink }}>
                        {importReport.kind === "merge" ? (lang === "zh" ? "上次合并导入的结果" : "前回のマージ結果") : (lang === "zh" ? "上次覆盖导入的结果" : "前回の上書き結果")}
                        <span style={{ ...T.fs.label, color: T.subtle, fontWeight: 400, marginLeft: 8 }}>{importReport.fileName} · {String(importReport.at.getHours()).padStart(2, "0")}:{String(importReport.at.getMinutes()).padStart(2, "0")}</span>
                      </div>
                      <button type="button" onClick={() => setImportReport(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.subtle, fontSize: 16, padding: "0 4px" }} title={lang === "zh" ? "关掉" : "閉じる"}>×</button>
                    </div>
                    <div style={{ ...T.fs.caption, color: T.body, marginTop: 6, lineHeight: 1.7 }}>
                      {importReport.lines.length === 0
                        ? (lang === "zh" ? "没有新内容:文件里的条目这里都已经有了。" : "新しい内容はありませんでした。")
                        : importReport.lines.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                    {importReport.skipped.length > 0 && (
                      <div style={{ ...T.fs.caption, color: T.secondary, marginTop: 8, lineHeight: 1.7 }}>
                        <div style={{ color: T.body }}>{lang === "zh" ? `因为这里已有同名或同编号的,跳过了 ${importReport.skipped.length} 条(已有的没动):` : `同名・同IDのため ${importReport.skipped.length} 件スキップ:`}</div>
                        <div>{importReport.skipped.slice(0, 30).join("、")}{importReport.skipped.length > 30 ? (lang === "zh" ? ` 等 ${importReport.skipped.length} 条` : ` ほか`) : ""}</div>
                      </div>
                    )}
                  </div>
                )}
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
              {lang === "zh" ? "组合产品" : "組立製品"}：<strong>{creations.length}</strong> {lang === "zh" ? "个" : "件"}<br />
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
            {/* 2026-09-29 体检第 2 批:清除前先存一份「固定」备份(不参与自动轮换),以前清完只能靠很快就被挤掉的自动备份 */}
            <Btn variant="danger" onClick={() => confirmDialog("确认清除全部数据？\n\n清除前会自动存一份「固定」备份,可以在「恢复备份」里找回。", async () => {
              const doClear = () => { setRecipes([]); setCats([]); setComponents([]); setCreations([]); setKnowledge([]); setBrands([]); setMaterials([]); setShopMaterials([]); setProducts([]); setSalesLog([]); setProductionLog([]); setSuppliers([]); setProductFamilies([]); setCustomCompCats([]); showToast("已清除"); };
              if (await pinBackupNow("clear")) doClear();
              else confirmDialog("清除前的固定备份没存上(浏览器的数据库用不了)。仍然清除吗?建议先点上面的「导出完整备份」存一份文件。", doClear, { title: "备份没存上", confirmText: "仍然清除" });
            })}>清除全部数据</Btn>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
# 甜点配方管理器

LuLu 自用的甜点店配方 / 组件 / 知识库管理工具。只在浏览器里跑，不需要服务器，数据存在你电脑本地。

---

## 怎么跑

```bash
npm install      # 第一次或换电脑后
npm run dev      # 浏览器打开 http://localhost:5173
npm run build    # 打包到 dist/
```

## 数据在哪

| 数据 | 位置 |
|---|---|
| 配方 / 组件 / 组合 / 知识 / 材料 | 浏览器 **localStorage**（key: `patisserie_v4`）|
| 上传的图片 | 浏览器 **IndexedDB** |
| `my_data_export.json` | 你手动导出的最新备份（项目根目录）|

⚠️ **清浏览器数据 = 删配方**。务必定期导出备份。

---

## 备份 / 恢复

- **备份**：数据 Tab → "导出 JSON" → 覆盖项目根目录 `my_data_export.json`
- **救数据**：`backups/` 里有历史快照（按日期命名）→ 拷一份到根目录改名为 `my_data_export.json` → 数据 Tab → "导入 JSON"

---

## 目录结构

```
patisserie-manager/
├── src/App.jsx           ← 主代码（单文件，约 14000 行，故意不拆）
├── src/main.jsx          ← 入口（只挂载 App）
├── my_data_export.json   ← 当前主数据
├── backups/              ← 历史数据快照（按日期命名的 .bak）
├── RURU_packages/        ← 录入包归档（材料 / 配方 / 知识批量导入）
├── CLAUDE.md             ← 给 Claude Code 看的工作规矩
├── .claude/              ← Claude Code 工作文档（progress / handoff / SOP / skills）
└── README.md             ← 本文件
```

---

## 想加新东西怎么办

让 Claude 先读这两份文档：
1. `CLAUDE.md` — 4 铁律 + 风险分级 + 关口流程
2. `.claude/recipe_entry_sop.md` — 录入新 recipe / component / knowledge 的 4 阶段 SOP

代码改动全部进 `src/App.jsx` 单文件，不要拆模块（除非专门重构）。

---

## 故障速查

| 现象 | 排查 |
|---|---|
| `npm run dev` 改文件不刷新 | 已开 polling 模式，重启服务器试试 |
| 数据没了 | `backups/` 拿最新快照恢复 |
| 图片丢了 | IndexedDB 被清，从备份导入恢复 |
| 中日字段不成对（切日语空白）| 让 Claude 跑 `lang-pair-check` skill |
| 想看某实体代码段 | Claude Code 输 `/section creations`（或 recipes / knowledge 等）|

# mold 现有能力 vs MoldLive 规格书兼容性分析

> 生成日期：2026-05-28
> 最终更新：2026-05-28（全线交付）
> mold 版本：0.1.1+（已就绪） | 规格书：`Z:\agentworkspace\mold-live\建议.md`

---

## 1. 最终状态：全部问题已解决

| # | 问题 | mold 侧 | MoldLive 侧 | 状态 |
|---|---|---|---|---|
| 1 | `length` filter 缺失 | `src/filter.mbt` 已添加 | Mock + 真实 WASM 均通过 | ✅ |
| 2 | `loop.index` 不支持 | `src/render.mbt` 已注入 loop 对象 | Mock + 真实 WASM 均通过 | ✅ |
| 3 | WASM 编译目标不存在 | `src/wasm-export/` 已交付 | `mold.wasm` 已部署上线 | ✅ |

---

## 2. MoldLive 实施状态

| Task | 内容 | 状态 |
|---|---|---|
| 1 | 项目脚手架（Vite + TS + TW + 目录结构） | ✅ |
| 2 | Store + debounce + encode + Vitest（27 tests） | ✅ |
| 3 | WASM Mock + Loader + mold.wasm 对接 | ✅ |
| 4 | 4 个示例数据 | ✅ |
| 5 | 三栏布局 + CodeMirror 6 + 暗色主题 | ✅ |
| 6 | 渲染流水线（debounce → JSON 校验 → WASM → store） | ✅ |
| 7 | mold 语法高亮（`{{ }}` / `{% %}` / `{# #}`） | ✅ |
| 8 | 顶栏（Tab 切换 / Share / GitHub）+ 状态栏 | ✅ |
| 9 | URL hash 状态同步（#example= / #t=&d=） | ✅ |
| 10 | SVG 输出模式（innerHTML + fallback） | ✅ |
| 11 | 移动端响应式（可折叠面板） | ✅ |
| 12 | CI/CD（GitHub Actions → GitHub Pages） | ✅ |
| 13 | 性能验收（JS 6.5KB / CSS 4KB / Acc 96 / LCP 557ms） | ✅ |

---

## 3. 部署信息

| 项目 | 值 |
|---|---|
| 仓库 | https://github.com/robinfang/mold-live |
| 线上地址 | https://mold-live.run |
| 构建方式 | GitHub Actions → push main 自动部署 |
| WASM 接口 | `mold_render(template: string, dataJson: string) → string`（JSON 信封） |
| WASM 加载 | `WebAssembly.instantiate(bytes, {}, { builtins: ["js-string"], importedStringConstants: "_" })` |
| Mock fallback | `VITE_USE_WASM=false` 或 WASM 加载失败时自动切换 |

---

## 4. WASM 接口契约（最终版）

### JS 调用方式

```js
const { instance } = await WebAssembly.instantiate(bytes, {}, {
  builtins: ["js-string"],
  importedStringConstants: "_",
});
instance.exports._start();
const result = instance.exports.mold_render(template, dataJson);
```

### 返回值（始终为 JSON 信封）

成功：
```json
{"output":"Hello WASM!"}
```

失败：
```json
{"error":{"kind":"template","message":"unclosed interpolation tag","line":1,"column":1}}
```

- 8 种 MoldError 变体逐一映射到 `kind` + `message` + `line` + `column`
- 通过有无 `error` 字段区分成功/失败，无歧义
- 浏览器要求：Chrome 128+（wasm-gc + js-string-builtins）

---

## 5. 体积指标

| 指标 | 目标 | 实际 |
|---|---|---|
| JS 主 bundle gzip | < 80 KB | **6.5 KB** |
| CSS gzip | < 10 KB | **4.1 KB** |
| WASM gzip | < 100 KB | ~55 KB |
| CodeMirror 懒加载 chunk | — | 105 KB（按需） |

---

## 6. mold 源码关键位置速查

| 文件 | 职责 |
|---|---|
| `src/token.mbt` | Token 类型定义 |
| `src/lexer.mbt` | 词法分析（两阶段：block / interpolation） |
| `src/ast.mbt` | AST 节点（`Node` / `Expr` 枚举） |
| `src/parser.mbt` | 语法分析 |
| `src/value.mbt` | 运行时值模型（`Value` 枚举 + `from_json`） |
| `src/context.mbt` | 上下文解析 + scope 支持 |
| `src/filter.mbt` | Filter 注册与分派（含 `length`） |
| `src/render.mbt` | AST 渲染（含 `loop` 元变量注入） |
| `src/error.mbt` | 错误类型 + `SourceSpan`（line / column） |
| `src/top.mbt` | 公开 API（`render` / `Template` / `Engine`） |
| `src/wasm-export/main.mbt` | WASM 导出层（`mold_render(template, dataJson) → String`） |
| `src/wasm-export/moon.pkg` | WASM 构建配置 |

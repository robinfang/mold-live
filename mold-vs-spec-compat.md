# mold 现有能力 vs MoldLive 规格书兼容性分析

> 生成日期：2026-05-28（2026-05-28 更新）
> mold 版本：0.1.1+（`Z:\agentworkspace\mold`）
> 规格书：`Z:\agentworkspace\mold-live\建议.md`
> 本批改动状态：**阶段 0 完成，WASM 导出层已交付**

---

## 1. 问题总览

| # | 问题 | 规格书位置 | mold 现状 | 影响示例 | 状态 |
|---|---|---|---|---|---|
| 1 | `length` filter 缺失 | §9.1 Hello | 内置 filter 无 `length` | Hello（1 处） | ✅ 已修复 |
| 2 | `loop.index` 不支持 | §9.4 Offline Report | `for` 循环不注入 `loop` 元变量 | Offline Report（1 处） | ✅ 已修复 |
| 3 | WASM 编译目标不存在 | §3 / §13 | 纯 MoonBit 库，无 WASM build target | 全局（真实渲染） | ✅ 已交付（wasm-gc + js-string-builtins）

---

## 2. 问题 1：`length` filter 缺失 — ✅ 已修复

**已交付实现**（`src/filter.mbt`）：

| 输入类型 | 返回值 |
|---|---|
| `Array(items)` | `Int(items.length())` |
| `String(s)` | `Int(s.length())` |
| `Null` | `Int(0)` |
| 其他 | `TypeMismatch` 错误 |

测试覆盖：`src/filter_test.mbt`（数组、空数组、字符串、null、类型错误各 1 个）。

以下原始分析仅作历史参考。

<details>
<summary>原始分析（已过时）</summary>

---

## 3. 问题 2：`loop.index` 不支持 — ✅ 已修复

**已交付实现**（`src/render.mbt`）：

`for` 循环体自动注入 `loop` 对象，包含 5 个属性：

| 属性 | 含义 |
|---|---|
| `loop.index` | 1-based 序号 |
| `loop.index0` | 0-based 序号 |
| `loop.first` | 是否是第一个元素 |
| `loop.last` | 是否是最后一个元素 |
| `loop.length` | 数组总长度 |

测试覆盖：`src/mold_test.mbt`（index / index0 / first / last / length / 嵌套 for 各 1 个）。

以下原始分析仅作历史参考。

<details>
<summary>原始分析（已过时）</summary>

### 规格书期望

```text
{% for p in top_products %}
{{ loop.index }}. **{{ p.name }}** — ${{ p.revenue }} ({{ p.units }} units)
{% endfor %}
```

来自 Offline Report 示例（§9.4），期望 `for` 循环内可访问 `loop` 元变量，至少包含 `loop.index`（1-based 序号）。

### mold 现状

`src/render.mbt` 中 `For` 分支的实现（第 70-86 行）：

```moonbit
For(item_name, iterable_expr, body) => {
  let iterable = eval_expr(iterable_expr, ctx, scope, filters)
  match iterable {
    Array(items) =>
      for item in items {
        let item_scope : Map[String, Value] = Map::from_array([
          (item_name, item),
        ])
        // ... render with item_scope
      }
    _ => raise TypeMismatch(("cannot iterate", "array"))
  }
}
```

`item_scope` 只包含迭代变量本身（如 `p`），**不注入任何 `loop` 元变量**。

### 解决方案

#### 方案 A：在 mold 的 `for` 渲染中注入 `loop` 对象（推荐）

参考 Jinja2 的 `loop` 变量，在 `item_scope` 中额外注入一个 `"loop"` 键，值为 `Object`：

```moonbit
// 在 for item in items 循环中，用索引 i 构建 loop 对象
let loop_obj = @mold.object(Map::from_array([
  ("index",  @mold.int(i + 1)),       // 1-based
  ("index0", @mold.int(i)),           // 0-based
  ("first",  @mold.bool(i == 0)),
  ("last",   @mold.bool(i == items.length() - 1)),
  ("length", @mold.int(items.length())),
]))

let item_scope = Map::from_array([
  (item_name, item),
  ("loop", loop_obj),
])
```

注意：当前代码用 `for item in items`（无索引），需改为 `for i = 0; i < items.length(); i = i + 1` 来获取索引。

需要改动：
1. `src/render.mbt` — `For` 分支，改为索引循环 + 构建 `loop` 对象 + 注入 scope
2. `src/mold_test.mbt` — 添加 `loop.index`、`loop.first`、`loop.last` 等测试

改动量约 20 行 + 测试。

#### 方案 B：修改示例，不依赖 `loop.index`

Offline Report 示例改为 Markdown 无序列表：

```text
{% for p in top_products %}
- **{{ p.name }}** — ${{ p.revenue }} ({{ p.units }} units)
{% endfor %}
```

简单，但失去有序编号演示效果。

#### 方案 C：仅 Mock 渲染器实现

同问题 1 的方案 C。

### 建议

**方案 A。** `loop` 元变量是模板引擎的高频需求（Jinja2 / Django / Twig / Liquid 全部支持），且实现不复杂。建议至少实现 `index`、`index0`、`first`、`last`、`length` 五个属性。</details>

---

## 4. 问题 3：WASM 编译目标 — ✅ 已交付（wasm-gc + js-string-builtins）

### 实际实施方案

采用 **wasm-gc 目标 + JS String Builtins 提案**，而非规格书原文中的线性内存 C-ABI。

**mold 侧**（`src/wasm-export/`）：

| 字段 | 值 |
|---|---|
| 编译目标 | `moon build --target wasm-gc` |
| String 传递 | `use-js-builtin-string: true`，MoonBit `String` ↔ JS `string` 通过 `externref` 零拷贝 |
| 导出函数 | `mold_render(template: String, data_json: String) → String` |
| 错误处理 | 成功返回渲染结果，失败返回 `{"error":{"kind":"render","message":"..."}}` JSON |
| 内存管理 | GC 托管，无 alloc/dealloc |

**JS 调用方式**：

```js
const { instance } = await WebAssembly.instantiate(bytes, {}, {
  builtins: ["js-string"],
  importedStringConstants: "_",
});
instance.exports.mold_render("Hello {{ name }}!", `{"name":"WASM"}`);
// → {"output":"Hello WASM!"}
```

**返回值格式**（始终为 JSON 信封）：

成功：
```json
{"output":"Hello WASM!"}
```

失败：
```json
{"error":{"kind":"template","message":"unclosed interpolation tag","line":1,"column":1}}
{"error":{"kind":"json","message":"invalid JSON","line":0,"column":0}}
```

- `kind`: `"template"` 或 `"json"`
- `message`: 具体错误信息
- `line` / `column`: 错误位置（`SourceSpan` 有值时）
- 成功/失败通过有无 `error` 字段区分，无歧义

**与规格书原文的主要差异**：

| | 规格书原文 | 实际实现 |
|---|---|---|
| 编译目标 | 未指定 | wasm-gc |
| 接口 | `render(ptr, len, ptr, len) → ptr` | `mold_render(template, dataJson) → result` |
| 内存模型 | 线性内存 + alloc/dealloc | GC 托管，无手动内存管理 |
| 字符串传递 | UTF-8 字节缓冲区 | externref 直接映射 |
| 错误传递 | 28 字节 packed 结构体 | JSON 字符串 |
| 浏览器支持 | — | Chrome 128+，Node.js 24.13.1+ |

### 规格书原文（已不再适用）

<details>
<summary>原始规格书 §3 WASM 接口契约（已过时）</summary>

- `mold.wasm` 暴露 `render(tplPtr, tplLen, dataPtr, dataLen) -> resultPtr` 的 C-ABI 导出函数
- 结果结构体 28 字节 packed（小端序），包含 ok / output_ptr / output_len / err_line / err_col / err_msg_ptr / err_msg_len
- JS 侧通过 `WebAssembly.instantiate` 加载，用 `memory.buffer` 的 `DataView` 读写

</details>

---

## 5. 执行顺序（更新）

```
✅ 阶段 0：mold 功能补齐（已完成 — 在 mold 项目中）
  ✅ 5a. 添加 length filter        → src/filter.mbt + filter_test.mbt
  ✅ 5b. 添加 loop 元变量支持       → src/render.mbt + mold_test.mbt
  ✅ 5c. WASM 导出包               → src/wasm-export/
  🔲 待发版 → v0.2.0

阶段 1：MoldLive UI 开发（在 mold-live 项目中）
  ├── Task 1  — 项目脚手架
  ├── Task 2  — 状态中心 + 工具
  ├── Task 3  — WASM Mock 渲染器（参考实际 WASM 能力设计）
  ├── Task 4  — 示例数据
  ├── Task 5  — 三栏布局 + 编辑器
  ├── Task 6  — 渲染流水线接通
  ├── Task 7  — mold 语法高亮
  ├── Task 8  — 顶栏 + 状态栏
  ├── Task 9  — URL 状态同步
  ├── Task 10 — SVG 输出模式
  ├── Task 11 — 移动端响应式
  ├── Task 12 — CI/CD
  └── Task 13 — 性能验收

阶段 2：WASM 真实对接
  └── 用 src/wasm-export/ 产物替换 Mock → 浏览器验证
```

---

## 6. Mock 渲染器能力范围

在阶段 0 完成后，Mock 渲染器需要支持以下语法（用于驱动 4 个示例）：

| 语法 | Mock 行为 | 用到的示例 |
|---|---|---|
| `{{ var }}` | 简单变量替换 | 全部 |
| `{{ obj.field }}` | 点路径访问 | Email / SVG / Offline |
| `{% for x in arr %}...{% endfor %}` | 循环，注入 `loop` 对象 | Hello / Email / Offline |
| `{% if cond %}...{% endif %}` | 条件判断（简单 truthy 检查） | Email |
| `{% if cond %}...{% else %}...{% endif %}` | 条件 + else | — |
| `{{ expr \| length }}` | 返回数组长度 | Hello |
| `{{ expr \| default(val) }}` | 空值兜底 | —（备用） |
| `{# comment #}` | 注释，不输出 | —（语法高亮需要识别） |

**不需要** Mock 实现的（spec 明确排除或示例未使用）：
- `include`
- 自定义 filter
- whitespace control（`{%-` / `-%}`）
- 比较表达式（`==` / `!=` / `<` / `>`）
- 布尔表达式（`and` / `or` / `not`）

---

## 7. 附录：mold 源码关键位置速查

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
| `src/wasm-export/moon.pkg` | WASM 构建配置（`use-js-builtin-string` + exports） |

import type { Example } from "./index";

export const hello: Example = {
  id: "hello",
  label: "👋 Hello",
  hint: "A 5-second intro to mold syntax.",
  template: `Hello, {{ name }}!

You have {{ skills | length }} skills:
{% for skill in skills %}
  - {{ skill }}
{% endfor %}`,
  dataJson: `{
  "name": "MoonBit",
  "skills": ["WASM", "Type Inference", "Pattern Matching", "中文模板渲染"]
}`,
  outputMode: "text",
};

import type { Example } from "./index";

export const offlineReport: Example = {
  id: "offline-report",
  label: "📴 Offline",
  hint: "Works without a network. Try going offline.",
  template: `# Sales Report — {{ period }}

**Generated:** {{ generated_at }}

## Summary

- Total Revenue: \${{ summary.revenue }}
- Orders: {{ summary.orders }}
- Avg Order Value: \${{ summary.aov }}

## Top Products

{% for p in top_products %}
{{ loop.index }}. **{{ p.name }}** — \${{ p.revenue }} ({{ p.units }} units)
{% endfor %}

---
*This report runs entirely in your browser. No data was sent to any server.*`,
  dataJson: `{
  "period": "May 2026",
  "generated_at": "2026-05-28",
  "summary": { "revenue": 184200, "orders": 1247, "aov": 147.7 },
  "top_products": [
    { "name": "Widget Pro", "revenue": 52000, "units": 320 },
    { "name": "Gadget X", "revenue": 38400, "units": 240 },
    { "name": "Tool Kit", "revenue": 21800, "units": 150 },
    { "name": "开发者工具", "revenue": 15600, "units": 120 }
  ]
}`,
  outputMode: "text",
};

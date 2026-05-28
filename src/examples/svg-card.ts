import type { Example } from "./index";

export const svgCard: Example = {
  id: "svg-card",
  label: "🎨 SVG Card",
  hint: "Output is rendered as an image. Try changing the color.",
  template: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260">
  <rect width="400" height="260" rx="12" fill="{{ bg }}"/>
  <text x="24" y="60" font-family="sans-serif" font-size="28" font-weight="700" fill="{{ fg }}">{{ name }}</text>
  <text x="24" y="92" font-family="sans-serif" font-size="16" fill="{{ fg }}" opacity="0.8">{{ title }}</text>
  <text x="24" y="140" font-family="sans-serif" font-size="14" fill="{{ fg }}" opacity="0.6">{{ subtitle }}</text>
  <text x="24" y="220" font-family="monospace" font-size="14" fill="{{ fg }}" opacity="0.6">{{ url }}</text>
</svg>`,
  dataJson: `{
  "name": "Robin Fang",
  "title": "Building mold for MoonBit",
  "subtitle": "面向 MoonBit 生态的轻量模板引擎",
  "url": "mold-live.run",
  "bg": "#0c0a09",
  "fg": "#fafafa"
}`,
  outputMode: "svg",
};

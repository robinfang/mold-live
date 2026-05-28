# MoldLive

In-browser playground for [mold](https://github.com/robinfang/mold) — a template engine written in MoonBit, compiled to WASM.

**Live**: https://mold-live.run

![screenshot](docs/screenshot.png)

## Why

mold runs anywhere WASM runs. MoldLive proves it by rendering templates 100% in your browser, no server roundtrip.

## Stack

- TypeScript + Vite (no UI framework)
- CodeMirror 6
- Tailwind CSS
- mold compiled to WebAssembly (wasm-gc)

## Develop

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Test

```bash
pnpm test
```

## TODO

- [ ] Add PWA manifest for full offline mode
- [ ] Persist last template in localStorage as fallback to URL state

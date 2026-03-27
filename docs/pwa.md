# Progressive Web App (PWA)

NxtUp is installable as a PWA: a **Web App Manifest**, **service worker** (Workbox via **vite-plugin-pwa**), and head tags wire it together. There are **no** custom `+page.server.ts` or server-only PWA endpoints; everything is built into the client output at `vite build`.

## Stack

| Piece | Role |
|-------|------|
| [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) | Generates `sw.js` + Workbox runtime, merges manifest into the build, exposes `virtual:pwa-register`. |
| [`static/manifest.json`](../static/manifest.json) | Canonical manifest content (name, icons, theme, `start_url`, `display`, etc.). |
| [`vite.config.ts`](../vite.config.ts) | Imports `static/manifest.json` and passes it to `VitePWA({ manifest: … })` so the plugin and static copy stay aligned. |
| [`src/routes/+layout.svelte`](../src/routes/+layout.svelte) | `<link rel="manifest">`, `theme-color`, `apple-touch-icon`, and **production-only** `registerSW` from `virtual:pwa-register`. |
| [`src/app.d.ts`](../src/app.d.ts) | `/// <reference types="vite-plugin-pwa/client" />` for TypeScript / virtual module types. |

## Manifest

- **Edit** [`static/manifest.json`](../static/manifest.json) for display name, colors, `start_url`, `scope`, and `icons`.
- **Theme tokens** follow the app palette (e.g. `background_color` / `theme_color` aligned with NxtUp dark + primary accent).
- **`vite.config.ts` must import the same file** after changes so the plugin’s emitted manifest matches what SvelteKit serves from `static/`.

### Icon `src` paths

Manifest icon entries must use **URL paths from the site root**, for example `/icons/manifest-icon-192.maskable.png`.  
If a tool (e.g. `pwa-asset-generator`) writes filesystem-style paths such as `../static/icons/...`, **replace them** with `/icons/...` so browsers resolve them correctly.

Place icon files under **`static/icons/`** so they are served at **`/icons/...`**.

## Service worker

- **Strategy:** `generateSW` (default) — Workbox precaches built assets (JS, CSS, HTML, fonts, images, etc.) from the production client bundle.
- **Updates:** `registerType: 'autoUpdate'` — when a new build is deployed, the new worker activates and clients refresh (via `registerSW({ immediate: true })` in production).
- **`injectRegister: false`** — registration is explicit in the app (no auto-injected script in HTML).
- **Development:** `devOptions.enabled: false` — no service worker during `bun run dev` / `bun run prod`; use **`bun run build`** then **`bun run preview`** to test the SW locally.

## Head tags

[`+layout.svelte`](../src/routes/+layout.svelte) includes:

- `rel="manifest"` → `/manifest.json`
- `meta name="theme-color"`
- `apple-touch-icon` → should match a real file under `static/icons/` (e.g. `/icons/apple-touch-icon.png`)

Keep **layout** and **manifest** icon story consistent (sizes and filenames).

## Regenerating icons (optional)

The repo may use **`pwa-asset-generator`** for splash screens and multiple sizes. From the project root, a SvelteKit-friendly variant:

```bash
bun x pwa-asset-generator "./src/lib/assets/icons/master-app-icon.png" "./static/icons" -m "./static/manifest.json" -i "./src/app.html"
```

Afterward:

1. Fix any icon `src` values in `static/manifest.json` to **`/icons/<filename>`** if the tool emitted wrong paths.
2. Re-run **`bun run check`** — `vite.config.ts` imports the JSON; types must still satisfy `Partial<ManifestOptions>` (e.g. valid `orientation` / icon shapes).

## Verifying locally

1. `bun run build`
2. `bun run preview`
3. Open DevTools → **Application** → **Manifest** and **Service workers**.

Production installs require **HTTPS** (or localhost for development).

## Firebase / offline

Precaching speeds up loading the **shell** and static assets. **Firestore and Auth** still need network (or separate offline configuration such as persistence rules) unless you add **runtime caching** in Workbox — that is intentionally out of scope unless you decide to extend `workbox` options in `vite.config.ts`.

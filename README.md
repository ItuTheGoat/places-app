# NxtUp (places-app)

**NxtUp** is a mobile-first web app for shared lists and places—helping you answer *“What are we doing next?”* quickly. It is installable as a PWA.

## Features (at a glance)

- Lists and places stored in Firebase; collaborate with others on shared lists
- Firebase Auth: Google (popup) and email/password (see [`src/lib/firebase/auth.ts`](src/lib/firebase/auth.ts))
- Rich place capture: categories, status, images (Firebase Storage), and more
- SPA-style flows: shallow routes, fast interactions, thumb-friendly UI

## Tech stack

| Area | Choice |
|------|--------|
| Framework | [SvelteKit](https://kit.svelte.dev/) 2, [Svelte](https://svelte.dev/) 5 (runes), TypeScript |
| Build | [Vite](https://vitejs.dev/) 7, `@sveltejs/adapter-auto` |
| Package manager / runtime | [Bun](https://bun.sh/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 4, [DaisyUI](https://daisyui.com/), `@tailwindcss/vite` |
| Icons | [Font Awesome](https://fontawesome.com/) (`@fortawesome/fontawesome-free`) |
| Backend | [Firebase](https://firebase.google.com/) — Auth, Firestore, Storage, Analytics (when supported) |
| Forms | [sveltekit-superforms](https://superforms.cieran.dev/) + [Zod](https://zod.dev/) (SPA mode for place flows) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + [`static/manifest.json`](static/manifest.json) |

Firebase is initialized in [`src/lib/firebase/index.ts`](src/lib/firebase/index.ts).

## Architecture

- **Client-only data:** The app loads Firebase from the browser. There are no SvelteKit server load functions or `+page.server.ts` for core app data.
- **Place create / edit:** Uses Superforms in **SPA** mode with Zod validation; persistence goes through the Firebase SDK (not form actions). See [`docs/places-create-update.md`](docs/places-create-update.md).
- **Firestore shape:** Flat collections — `users`, `lists`, `places` (see [`firestore.rules`](firestore.rules) for server-side rules).

API routes are reserved for work that must run on a server (secrets, privileged third-party calls). Everything else talks to Firebase directly from the client.

## Prerequisites

- [Bun](https://bun.sh/) installed
- A Firebase project with **Authentication**, **Cloud Firestore**, and **Cloud Storage** enabled
- Deploy [`firestore.rules`](firestore.rules) (and Storage rules if you use them) to match your environments

## Environment variables

Create **`.env.dev`** and **`.env.prod`** in the project root. Vite exposes variables prefixed with `VITE_` or `FIREBASE_` (see [`vite.config.ts`](vite.config.ts)).

Required Firebase web config keys (same names as in the Firebase console):

| Variable | Purpose |
|----------|---------|
| `FIREBASE_API_KEY` | Web API key |
| `FIREBASE_AUTH_DOMAIN` | Auth domain |
| `FIREBASE_PROJECT_ID` | Project ID |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `FIREBASE_APP_ID` | App ID |
| `FIREBASE_MEASUREMENT_ID` | Analytics (optional but referenced in code) |

Do **not** commit real secrets. Keep `.env.*` local or in your deployment provider’s secret store.

### Vite modes

| Command | Mode | Loads |
|---------|------|--------|
| `bun run dev` | `dev` | `.env.dev` |
| `bun run prod` | `prod` | `.env.prod` |

## Setup

```sh
bun install
# Add .env.dev (and .env.prod if needed) with the FIREBASE_* variables above
bun run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Dev server (`vite dev --mode dev`) |
| `bun run prod` | Dev server against prod env (`vite dev --mode prod`) |
| `bun run build` | Production build |
| `bun run preview` | Preview the production build locally |
| `bun run check` | `svelte-check` + sync |
| `bun run check:watch` | Same as `check`, in watch mode |
| `bun run lint` | ESLint |
| `bun run lint:unused` | Stricter unused-variable checks |

## PWA and service worker

The service worker is **disabled** during `bun run dev` / `bun run prod`. To verify the manifest and service worker, run `bun run build` then `bun run preview` and use the browser’s Application tab. Details: [`docs/pwa.md`](docs/pwa.md).

## Documentation

| Doc | Topic |
|-----|--------|
| [`docs/pwa.md`](docs/pwa.md) | Manifest, Workbox, icons, local verification |
| [`docs/places-create-update.md`](docs/places-create-update.md) | Place forms, Superforms SPA, Zod, images |
| [`docs/shared-lists-crud.md`](docs/shared-lists-crud.md) | Shared lists create / rename / delete |
| [`docs/list-invites.md`](docs/list-invites.md) | List invites |
| [`docs/design-spec.md`](docs/design-spec.md) | UI layout, typography, colors |
| [`docs/design-principles.md`](docs/design-principles.md) | Product and UX principles |
| [`docs/theme-tokens.md`](docs/theme-tokens.md) | Theme tokens |

## Repo note

This package is marked `private` in `package.json`. There is no `LICENSE` file in the repository; treat usage and redistribution according to your own policies if you fork or publish.

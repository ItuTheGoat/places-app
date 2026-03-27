# NxtUp Theme Tokens

## Overview
NxtUp uses a dark-first DaisyUI theme with semantic tokens. Components should consume tokens (`bg-base-*`, `text-base-content`, `btn-primary`) rather than raw color values.

## Palette Source
- Background: `#0F172A`
- Surface: `#1E293B`
- Primary Accent: `#22C55E`
- Secondary Accent: `#38BDF8`
- Text Primary: `#F8FAFC`
- Text Secondary: `#94A3B8`

## DaisyUI Token Mapping
- `--color-base-100`: `#0F172A` (main app background)
- `--color-base-200`: `#1E293B` (surface background)
- `--color-base-300`: `#334155` (surface separation)
- `--color-base-content`: `#F8FAFC` (primary text)
- `--color-primary`: `#22C55E`
- `--color-primary-content`: `#052E16`
- `--color-secondary`: `#38BDF8`
- `--color-secondary-content`: `#082F49`
- `--color-neutral`: `#1E293B`
- `--color-neutral-content`: `#F8FAFC`
- `--color-info`: `#38BDF8`
- `--color-success`: `#22C55E`
- `--color-warning`: `#F59E0B`
- `--color-error`: `#EF4444`

## Usage Notes
- Use `bg-base-100` for app shell backgrounds.
- Use `bg-base-200` for cards and elevated surfaces.
- Use `text-base-content` for primary text and `text-slate-400` for supporting text.
- Primary actions should use `btn-primary` and `rounded-xl`.
- Secondary actions should use `btn-outline` or `btn-ghost`.

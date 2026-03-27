# Places: create & update (SPA)

This app loads Firebase **only on the client** (no `+page.server.ts`, no server actions). Place forms use **SvelteKit Superforms** in **SPA mode** with **Zod** schemas.

## Routes

| Route | Purpose |
|-------|---------|
| `/places/new` | Multi-step wizard: create a list only if you have zero lists, then place details, then images; then Firestore + Storage. |
| `/places/[placeId]/edit` | Single-page editor: fields + images together. |

The home page (`/`) loads all of the user’s places via **`getPlacesForUser`** and includes a **floating action button** linking to `/places/new`.

### `/places/new` wizard

- If you **already have at least one list**, the flow starts at **place details** (list dropdown) → **images** → save.
- If you have **no lists**, **step 1** is **create list** (same stack as `/lists/new`: `ListForm` + `createList`). **Join list** stays on `/lists/join`.
- After list creation, lists are reloaded and the new list is fixed for the rest of the wizard (`listFieldLocked`).
- **Images** are only on the last step, with previews and main-image selection (same rules as before).
- Submit runs **`createPlace` → `uploadPlaceImages` → `updatePlace`** then navigates home.

## Validation stack

- **Zod 3** (stable `zod` dependency, e.g. `3.25.x`): schema and `placeFormZodAdapter` / `placeFormZodClient` in `$lib/schemas/placeForm.ts`.
- **Superforms**: `SPA: true`, validators use `placeFormZodClient`. If TypeScript complains at the adapter boundary, `@ts-expect-error` documents that superforms’ `ZodObjectType` is narrower than Zod 3.25’s exports (runtime is correct).
- **No server round-trip** for validation: `onUpdate` runs after client validation succeeds (see Superforms SPA docs).

## Form fields

Maps to `PlaceDoc` (see `$lib/types/place.ts`):

- Required relationship: `listId` (user must belong to that list).
- Core: `name`, `category`, `status`, `priority`.
- Optional: `location`, `mapsUrl`, `vibe`, `notes`.

`listId` is **immutable** on edit (Firestore helper omits changing `listId`).

## Images

Rules enforced in UI and documented here:

- **Max 5** images per place.
- **Max 5 MB** per file (client-side check before upload).
- Exactly one image must be marked **Main**; stored as `mainImageUrl` on the place document (must be one of `imageUrls`).

### Create flow

1. `createPlace` with empty `imageUrls` (and no `mainImageUrl` yet).
2. `uploadPlaceImages(placeId, files)` → download URLs.
3. `updatePlace` with `imageUrls` + `mainImageUrl`.

Storage paths follow `$lib/firebase/storage.ts`: `places/{placeId}/{uuid}.jpg`.

### Edit flow

- Existing images are kept as URL rows; new files upload after any removals.
- Removed images are deleted from Storage (`deletePlaceImageByUrl`) when no longer referenced.

## Firestore rules

`firestore.rules` enforces `imageUrls` as a list with **at most 5** entries and optional `mainImageUrl` as a string. Stricter field validation stays in app code (Zod).

## Related files

- `$lib/components/places/PlaceForm.svelte` — create/edit: **PlaceFieldsForm** + **PlaceImagesStep** + SPA Superforms.
- `$lib/components/places/PlaceFieldsForm.svelte` — field UI (list + text fields).
- `$lib/components/places/PlaceImagesStep.svelte` — image picker, previews, main image.
- `$lib/components/places/PlaceNewWizardBody.svelte` — steps 2–3 of `/places/new` (details + images) with Superforms.
- `$lib/schemas/placeForm.ts` — Zod schema + Firestore field mapping.
- `$lib/firebase/firestore.ts` — `createPlace`, `updatePlace`, `getPlaceById`, `getPlacesForUser`, etc.
- `$lib/firebase/storage.ts` — upload/delete helpers.
- `docs/shared-lists-crud.md` — shared list create/rename/delete flow and owner-only permissions.

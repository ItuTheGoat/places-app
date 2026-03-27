# Shared Lists: CRUD (SPA)

Shared lists are managed fully on the client with Firebase SDKs. The app uses **SvelteKit Superforms** in **SPA mode** with **Zod** validation (no server form actions).

## Routes

| Route | Purpose |
|-------|---------|
| `/lists/new` | Create a new shared list. |
| `/lists/[listId]/edit` | Rename, delete, or manage **invite codes** (owner-only). |
| `/lists/join` | Join a list with an 8-character invite code (signed-in users). |

Home (`/`) includes entry points for creating lists, editing owned lists, and joining with a code.

**Invites** (one-time codes, audit log) are documented in [`docs/list-invites.md`](list-invites.md).

## Data model

`ListDoc` fields (`$lib/types/list.ts`):

- `name: string`
- `ownerId: string`
- `memberIds: string[]`
- `createdAt: Timestamp`

## Validation stack

- **Schema**: `$lib/schemas/listForm.ts`
  - `listFormSchema`
  - `listFormZodAdapter`
  - `listFormZodClient`
  - `defaultListFormValues`
  - `listFormToFirestoreFields`
- **Form component**: `$lib/components/lists/ListForm.svelte`
  - `SPA: true`
  - `validationMethod: 'oninput'`
  - submit logic via `onUpdate`

## Create flow

1. Initialize Superforms client form with `superValidate(...)`.
2. Require signed-in user.
3. Call `createList({ name, ownerId: uid, memberIds: [uid] })`.
4. Navigate back to `/`.

## Rename flow

1. Load list by ID (`getListById`).
2. Require signed-in user and `ownerId === auth.uid`.
3. Submit validated name via `updateListName(listId, name)`.

## Delete flow

Delete is owner-only and guarded in app code:

1. Confirm owner. The user must confirm deletion in the **in-app dialog** (`ListDeleteConfirmModal` on `/lists/[listId]/edit`); destructive deletes are never performed from a single click alone.
2. Check list contents with `getPlacesByListId(listId)`.
3. If places exist, block deletion with:
   - `Move or delete places in this list before deleting it.`
4. If empty, call `deleteList(listId)` and navigate home.

## Firestore rules

`firestore.rules` enforces:

- `lists.create`: authenticated owner creation with owner included in members.
- `lists.read`: any list member.
- `lists.update`: **owner** for any field change, **or** a **narrow self-join** update that only adds `request.auth.uid` to `memberIds` (invite redeem).
- `lists.delete`: **owner-only**.

## Firestore indexes

Current list/related queries used by this flow:

- `lists`: `where(memberIds, 'array-contains', uid)` + `orderBy(createdAt, 'desc')`
- `places`: `where(listId, '==', listId)` + `orderBy(createdAt, 'desc')` (delete guard)

Both are already covered by existing indexes in `firestore.indexes.json`. Invite code lookups for an active code per list use `listInviteCodes` with `listId` + `consumed` (see `list-invites.md`).

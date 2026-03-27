# List invites (invite codes)

List owners generate a **single-use, 8-character code** so others can join a shared list without sharing email addresses in the app.

**Alphabet:** **Join** accepts any **Crockford Base32** string (32 symbols; omits `I`, `L`, `O`, `U`). **New codes** are generated from a **consonant-only** subset (also omits `A` and `E`) to reduce word-like strings. **Profanity guard:** generation rejects a small blocklist of substrings and retries (not exhaustive; see roadmap for server-side checks).

## User journey

1. **Owner** opens **Edit list** for a list they own, taps **Generate invite code**, and shares the code (or a link that includes it) out of band.
2. **Joiner** signs in, opens **Join list** (`/lists/join`), enters the code, and submits.
3. Firestore runs a **transaction** that:
   - adds the joiner’s Firebase Auth `uid` to the list’s `memberIds` with `arrayUnion`;
   - marks the invite code as **consumed** (one-time use);
   - appends a row to **`listInviteRedemptions`** with `usedByUid`, `usedByEmail`, and `usedAt` for audit.

## Data model

| Collection | Id | Purpose |
|------------|-----|---------|
| `listInviteCodes` | 8-char Crockford code (new codes: consonant-only subset) | Pending invite; `consumed` flips to `true` after use. |
| `listInviteRedemptions` | Auto id | Append-only audit: who redeemed which code and when. |

Types: `$lib/types/listInvite.ts`.

## Security model

- **Lists** stay **member-readable**; **owner** can still rename/delete and create invites.
- **Self-join**: Firestore rules allow a **narrow** `lists` update when the only membership change is adding **`request.auth.uid`** to `memberIds` and other list fields are unchanged.
- **Invite codes** are unguessable in practice (random 8 chars from 30 symbols for **new** codes; full Crockford remains valid for join). **Do not** expose list or query all codes.
- **Rate limiting** in the app is **client-side only** (see below). It improves UX and reduces casual abuse but **does not** stop scripted guessing across devices or IPs.

## Client-side rate limiting

Implemented in `$lib/utils/inviteRedeemRateLimit.ts` using `localStorage`:

- After **3** failed redeem attempts, the user is blocked for **1 hour**.
- After that lockout, the **next** failed attempt blocks for **1 day** (escalation).
- A **successful** redeem clears counters.

**Limitations:** Cleared storage, another browser, or automation bypasses this. **Not** a security boundary.

## Roadmap: server-side enforcement (goal)

The intended direction is to move redeem and abuse controls to trusted infrastructure:

- **Callable Cloud Function** or **HTTPS endpoint** (Firebase Admin SDK) to validate codes, apply `memberIds` updates, and write audit rows in one place.
- **App Check** on client calls to reduce unauthenticated automation.
- **Per-UID and/or per-IP rate limits** on the server (e.g. Redis, Cloud Tasks, or platform limits).
- Optional **hard delete** of consumed invite docs after audit write.
- Monitoring and alerts on unusual redeem volume or brute-force patterns.

Until then, rely on **strong random codes**, **Firestore rules**, and **client rate limits** as a convenience layer only.

## Related files

- `$lib/utils/inviteCode.ts` — Crockford consonant alphabet, `normalizeInviteCode`, `generateListInviteCode` (blocklist retry)
- `$lib/firebase/firestore.ts` — `createListInvite`, `getActiveInviteCodeForList`, `revokeListInviteCode`, `redeemListInvite` (re-exports `generateListInviteCode`)
- `$lib/schemas/listInviteForm.ts` — Zod + Superforms for join form
- `$lib/components/lists/JoinListForm.svelte` — join UI
- `firestore.rules` — `listInviteCodes`, `listInviteRedemptions`, list self-join updates
- `firestore.indexes.json` — composite index on `listInviteCodes` for `listId` + `consumed` (owner loads active code)

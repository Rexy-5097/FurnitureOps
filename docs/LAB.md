# FurnitureOps Lab (`/lab`)

A sandboxed redesign that lives next to the production app. It runs on mock data,
so it needs **no Supabase or Upstash keys**, and it does not change `/`, `/dashboard`,
`/login`, `/admin` or the existing `/api/*` routes.

## Design direction

The storefront follows a soft retail layout: a dark green utility bar, a cream header,
a deep plum hero with a pill search and quick links, a cut-out category grid, white
product cards on cream, three promo cards, sage/sand benefit tiles, a sage newsletter
band and a dark green footer. Type pairs Cormorant Garamond (headings, wordmark, prices,
italic accents) with Manrope (UI and body), both self-hosted via `next/font`. Colours are tokens in `src/features/lab/lab.css`; light is the
default and dark is opt-in from the header.

All names, copy and imagery are FurnitureOps' own; no third-party brand assets are used.

## Run it

```bash
pnpm install
pnpm dev
# open http://localhost:3000/lab
```

On a Vercel preview deployment of this branch, open `<preview-url>/lab`.

## Pages

| Route | What to test |
| --- | --- |
| `/lab` | Editorial home (Server Component, ISR, `next/image` with blur placeholders) |
| `/lab/collection` | Search, room filters, sort, in-stock toggle (all in the URL). Open **Lab switches** to slow the network, force a 503, or turn background sync on/off |
| `/lab/collection/[id]` | Click a card for the quick-view modal (intercepting route). Refresh to get the full page (SSG + ISR) |
| `/lab/sign-in` | Pick guest, staff or admin (mock httpOnly cookie session) |
| `/lab/studio` | Protected. Staff can add pieces and change stock; admin can also delete and reset |
| `/lab/bench` | Hooks experiments: React.memo/useCallback, batching, effect cleanup, controlled vs uncontrolled, shallow vs deep copy |
| `/lab/syllabus` | INT252 / INT257 topic → file → "try it" map |
| `/api/lab/inventory` | REST: `GET ?q=&category=&sort=&inStock=1`, `POST` |
| `/api/lab/inventory/:id` | REST: `GET`, `PATCH`, `DELETE` (403 unless admin) |
| `/api/lab/health` | Edge runtime health check |

## Quick test checklist

- [ ] Visiting `/lab/studio` as a guest redirects to `/lab/sign-in?next=/lab/studio`
- [ ] Submitting the empty studio form shows Zod errors under each field
- [ ] A valid piece appears in the ledger, the collection, and at `/lab/collection/<slug>`
- [ ] As staff, there is no delete column; `DELETE /api/lab/inventory/<id>` returns 403
- [ ] As admin, delete asks for confirmation and the row disappears immediately
- [ ] Moodboard hearts persist across reloads; currency switch reformats every price
- [ ] Theme toggle works and is remembered; layout has no sideways scroll at 375 px

## Notes

- Data is in memory (`src/features/lab/data/store.ts`). It resets when the server restarts
  and is per-instance on serverless hosts. That is intentional for a sandbox.
- The lab layout sets `robots: noindex`.
- When the redesign is approved, the components in `src/features/lab` can be wired to
  the real Supabase hooks (`useInventory`) in place of the lab store.

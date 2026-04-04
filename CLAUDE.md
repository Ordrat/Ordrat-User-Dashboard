# Ordrat Dashboard — Development Guidelines

## Second Brain
Vault: **`/Users/agala/Documents/Obsidian Vault/`**
- `Project-Knowledge/dashboard-system-architecture.md` — architecture, stack, auth flow, PWA
- `Ordrat Dashboard.md` — product roadmap & feature ideas
- **Framework docs**: always use **Context7 MCP** — vault snapshots are stale.

---

## Stack
Next.js 16.x (App Router) · React 19 · Tailwind CSS 4 · TypeScript 5.x · TanStack Query 5.x · React Hook Form + Zod · NextAuth v4 · Serwist + @serwist/next · idb (IndexedDB) · ReUI/Metronic 9

Frontend-only — all data via `.NET API` at `https://api.ordrat.com`. No Prisma, no full-stack.

---

## Rules

**UI components**: Never build from scratch — always use `components/ui/`. `Toaster` + `ConfirmDialog` are already in root layout — do not add again.

**Translations**: All text via `useTranslation('common')`. Keep `messages/en.json` + `messages/ar.json` in sync.

**Package manager**: `pnpm` only. Never `npm install <pkg>` — desyncs lockfile → Vercel build fails.

**API paths**: Never hardcode. Use `ENDPOINTS` from `lib/ordrat-api/endpoints.ts`. Query `swagger.json` first when adding endpoints.

**`ordratFetch()`**: Use for all client-side calls (Bearer token + 401 retry + offline queue). Raw `fetch` only in NextAuth (server-side).

**`networkMode: 'always'`**: Set globally in `QueryProvider` — do NOT add per-hook.

**Toolbar title**: Every page calls `usePageMeta(t('key'))` — title from i18n, never hardcoded.

**`suppressHydrationWarning`**: Only on elements mutated by `useEffect` before hydration. Never to suppress bugs.

**Mobile / no horizontal scroll**: Every page must be free of horizontal overflow on all screen sizes. Rules:
- Always wrap `<Table>` in `<div className="overflow-x-auto">` — never place `<Table>` directly inside a `<Card>` or page div without this wrapper.
- Page root divs use `min-w-0` to prevent flex/grid children from escaping their container.
- Fixed-size embeds (QR canvas, maps, charts) use `[&_canvas]:max-w-full [&_canvas]:h-auto [&_svg]:max-w-full [&_svg]:h-auto` on their wrapper, plus `overflow-hidden` on the container.
- Never use `min-w-[Npx]` on elements that sit at page level — only on internal UI components (inputs, badges).
- Filter bars use `flex flex-wrap` so they reflow on small screens instead of overflowing.

**Page layout**: Every dashboard section has a `layout.tsx` that applies `mx-auto w-full max-w-5xl` — do NOT add `max-w-*` or `mx-auto` inside individual pages. Applies to all sections: `store-settings/`, `dashboard/`, and any new sections added in the future.

**Store Settings routing**: Pages live under `app/[locale]/(dashboard)/store-settings/<page>/`. Sidebar paths use `/store-settings/<page>`.

**PWA precache (all pages)**: Every page added to the sidebar menu MUST have a corresponding entry in `ROUTE_API_ENDPOINTS` in `hooks/use-page-precache.ts`. List all API endpoints the page fetches. Use `() => []` for filter-driven or no-data pages. This applies to ALL dashboard sections, not just store-settings.

---

## State — Decision Tree

```
API data?              → TanStack Query  (lib/ordrat-api/<domain>.ts)
Single component?      → useState / React Hook Form
Layout/nav (title)?    → LayoutContext via usePageMeta()
Cross-feature UI?      → Zustand useUIStore  (confirm dialogs)
Table filters/pagination? → Zustand useTableStore
```

Query key conventions:
```
['shop', shopId]  ['branches', shopId]  ['orders', shopId]
['order', orderId]  ['currencies']  ['themes']
```

staleTime/gcTime for authenticated data: `60_000` / `86_400_000` (matches SW 24h TTL).
Reference data (currencies, themes): `600_000` / `86_400_000`.

---

## Key Files

| File | Purpose |
|---|---|
| `proxy.ts` | Route protection + RBAC (not `middleware.ts`) |
| `lib/api-client.ts` | `ordratFetch()` — token + offline queue |
| `lib/ordrat-api/endpoints.ts` | All API paths — single source of truth |
| `lib/ordrat-api/schemas.ts` | Zod response schemas |
| `lib/offline-db.ts` | IndexedDB offline queue (idb) |
| `stores/ui-store.ts` | `useUIStore` — confirm dialog, global UI |
| `stores/table-store.ts` | `useTableStore` — table filters + pagination |
| `components/providers/query-provider.tsx` | QueryClient — `networkMode: 'always'` globally |
| `hooks/use-page-precache.ts` | SW pre-cache map — register new page routes here |
| `app/sw.ts` | Serwist SW — StaleWhileRevalidate for all `api.ordrat.com` GETs |

---

## Commands

```bash
pnpm dev              # dev server — SW disabled (hot reload conflict)
pnpm build && pnpm start  # test PWA/offline locally
npx tsc --noEmit      # type check
npm run swagger:sync  # refresh local swagger.json from backend
```

Vercel runs `pnpm build` on every push — SW always active in production.

---

## PWA — New Domain Checklist

Every new `lib/ordrat-api/<domain>.ts` + page must follow all of these:

- [ ] **`_entityType`** on every mutation `ordratFetch` call; **`_entityId`** on update/delete — drives queue deduplication
- [ ] **`if (!isOffline) toast.success(...)`** in every page mutation handler — prevents double toast (import `useOnlineStatus`)
- [ ] **`onSuccess` cache merge + `refetchType: 'none'`** when GET response omits saved fields (e.g. nameEn/nameAr)
- [ ] **Register** new page route + endpoints in `ROUTE_API_ENDPOINTS` in `hooks/use-page-precache.ts`
- [ ] **`staleTime`/`gcTime`** aligned per table above
- [ ] No per-endpoint SW rules — global rule in `app/sw.ts` covers all `api.ordrat.com` GETs

Mutation pattern:
```ts
// domain file
await ordratFetch(`/api/Order/Update/${id}`, {
  method: 'PUT', body: JSON.stringify(input),
  _entityType: 'Order', _entityId: id,
});

// page handler
const { isOffline } = useOnlineStatus();
await updateOrder.mutateAsync(values);
if (!isOffline) toast.success(t('orders.saved'));
```

Sign-out already clears IndexedDB queue + SW cache globally — no per-domain cleanup.

---

## Speckit Workflow

Every new feature must go through Speckit before implementation.

| Command | What it does |
|---|---|
| `/speckit.specify "description"` | Creates branch `NNN-name` + `specs/NNN-name/spec.md` |
| `/speckit.clarify` | Fills spec gaps |
| `/speckit.plan` | Generates `plan.md`, `research.md`, `data-model.md`, `contracts/` |
| `/speckit.tasks` | Generates `tasks.md` by user story |
| `/speckit.implement` | Executes tasks, marks complete |

After implement: `npx tsc --noEmit` → validate → merge to main.

---

## Visual

**Brand color**: `#B91C1C` (deep red) — `--brand` in `globals.css`. Foreground: white.
**Page content**: `bg-card`. **Layout chrome** (sidebar/header): `bg-muted` — never override.
**Logo files** in `public/media/app/`: `logo.svg` (light), `logo-dark.png` (dark), `default-logo.svg/..-dark.svg` (full-width). Don't reference `mini-logo-*.svg` — doesn't exist.
**SheetContent**: always include `<SheetTitle className="sr-only">` — Radix requires a DialogTitle.

---

## Architecture Notes

- Route protection: `proxy.ts` (server-side) + `useSession` guard in dashboard layout (client fallback)
- `BACKEND_API_URL` = server-only; `NEXT_PUBLIC_BACKEND_API_URL` = client
- Token refresh: `refreshToken` sent as HTTP **header** on `POST /api/Auth/RefreshAccessToken`
- `userType` from backend is a number — coerced via `z.coerce.string()` in schemas
- Empty `shopId` after login → redirect to `https://ordrat.com/seller-setup?sellerId=<id>`

## Recent Changes
- 005-store-settings-extensions: Added TypeScript 5.x + Next.js 16.x (App Router), React 19, TanStack Query 5.x, React Hook Form + Zod, `qr-code-styling` (new)
- 004-pwa-offline-resilience: IndexedDB offline queue, SW cache clear on sign-out, mount-time queue flush, `_entityType`/`_entityId` deduplication
- 003-pwa-offline-caching: Serwist + @serwist/next, StaleWhileRevalidate for API GETs

## Active Technologies
- TypeScript 5.x + Next.js 16.x (App Router), React 19, TanStack Query 5.x, React Hook Form + Zod, `qr-code-styling` (new) (005-store-settings-extensions)
- N/A — frontend-only, all data via .NET API at `api.ordrat.com` (005-store-settings-extensions)

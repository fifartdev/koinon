# Claude Code — Koinon Project

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see `.claude/skills/payload/reference/` for detailed docs.

---

## Project: Koinon — Multi-Tenant Club SaaS

### Stack
- **Framework**: Next.js 16 (App Router) + Payload CMS 3.83
- **Database**: Neon Postgres (`@payloadcms/db-postgres`) — both dev and prod
- **Auth**: Payload native JWT, stored in `payload-token` cookie
- **Email**: Resend SDK — key configured, `FROM = noreply@koinon.app`
- **Styling**: Tailwind CSS v4 (`postcss.config.mjs` + `src/app/(frontend)/globals.css`)
- **Fonts**: Bricolage Grotesque (display) + DM Sans (body) via `next/font/google` in layout.tsx
- **PWA**: `public/manifest.json` + `public/sw.js` (offline fallback)
- **Language**: All frontend UI is in **Greek**. Day names are stored in the DB as English (`Monday`…`Sunday`) and translated to Greek at render time via a `DAY_GREEK` map defined in each file that displays them.

---

## First-Run Checklist (new machine / new clone)

```bash
npm install
npm run generate:types        # regenerates payload-types.ts from all 7 collections
npm run generate:importmap    # required for Lexical richText RSC components
npm run dev
```

Then open `localhost:3000/admin` and create the first user. Manually set its `role` to `master` in the DB. All other roles flow from there.

> Re-run `generate:importmap` any time a collection using `richText` is added or changed.

---

## Multi-Tenancy

- **Strategy**: Path-based — `/{club-slug}/...`
- **Tenant collection**: `tenants` with a unique `slug` field (unique + indexed)
- **Isolation**: Every tenant-scoped collection has a required `tenant` relationship field; access control functions enforce query constraints, not just booleans
- **Proxy** (`src/proxy.ts`): Decodes `payload-token` JWT without a DB call using base64 decode + expiry check. Redirects unauthenticated/unauthorised users before layout renders. **`master` users are always redirected to `/admin`** — they never reach the frontend.
- **Layout validation** (`src/app/(frontend)/[club-slug]/layout.tsx`): Server component that queries Payload for the tenant by slug + `isActive: true`. Calls `notFound()` if missing — never shows stale/wrong data.

---

## Collections

| Collection      | Slug            | Key fields                                                                                                                                              |
|-----------------|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| Users           | `users`         | email, firstName, lastName, landline, mobile, homeAddress, role (saveToJWT), tenant (saveToJWT), globalDiscountType, globalDiscountValue, globalDiscountNote |
| Tenants         | `tenants`       | name, slug (unique+index), logo, heroImage, clubInfo (richText), contactEmail, isActive                                                                 |
| Services        | `services`      | title, description (richText), tutor, tenant, pricingType (monthly/per-session), fee (monthly €), sessionFee (per-session €), weeklySchedule, isActive  |
| Enrollments     | `enrollments`   | member→users, service→services, tenant, paymentStatus, paidAt, enrolledAt, planType, planTotal, planStart, discountType, discountValue, discountNote     |
| Announcements   | `announcements` | title, content (textarea), tenant, isPinned, status (draft/published), publishedAt                                                                       |
| Notifications   | `notifications` | title, message, type, tenant, recipient→users, isRead                                                                                                   |
| Receipts        | `receipts`      | receiptNumber (free text), member→users, tenant, issuedBy→users (auto), issuedAt, paymentMethod, lineItems (array), totalAmount, notes                  |
| Media           | `media`         | Payload upload default + alt text                                                                                                                       |

### Users — extended profile fields
`landline`, `mobile`, `homeAddress` are optional `text` fields added after initial build. Run `generate:types` after any schema change to keep `payload-types.ts` current.

---

## User Roles

| Role         | Access                                                                             |
|--------------|------------------------------------------------------------------------------------|
| `master`     | Full Payload `/admin` only — proxy always redirects master away from all frontend  |
| `superadmin` | All data; creates tenants and club admins                                          |
| `club-admin` | `/dashboard` + own tenant's data only                                              |
| `member`     | `/member-area` + own tenant's published data + own enrollments + own receipts      |

Both `role` and `tenant` are stored in the JWT via `saveToJWT: true` — middleware reads them without any DB call.

---

## Route Structure

```
src/app/
├── (payload)/admin/                        # Payload admin — master only
├── (frontend)/
│   ├── layout.tsx                          # Root HTML shell; body is text-slate-900 (NOT text-white)
│   ├── globals.css                         # @import "tailwindcss" + @theme tokens + keyframes
│   ├── page.tsx                            # Global SaaS landing page — has text-white on its own wrapper
│   ├── offline/page.tsx                    # PWA offline fallback
│   └── [club-slug]/
│       ├── layout.tsx                      # Server: validates tenant exists + isActive
│       ├── page.tsx                        # Public club landing (services + announcements)
│       ├── login/page.tsx                  # Client — useParams(); two modes: regular login + invite set-password (token+email params)
│       ├── dashboard/
│       │   ├── layout.tsx                  # Server auth guard (club-admin+) + sidebar nav
│       │   ├── page.tsx                    # Stats overview (members, services, unpaid count)
│       │   ├── members/
│       │   │   ├── page.tsx                # Member table + MemberActions (resend/delete) + Εγγραφές link
│       │   │   ├── invite/page.tsx         # Invite form → POST /api/invite
│       │   │   └── [id]/enrollments/page.tsx  # Service assignment: checkboxes + payment toggle per service
│       │   ├── services/
│       │   │   ├── page.tsx                # Service cards + Μέλη link + ServiceActions (edit/delete)
│       │   │   ├── new/page.tsx            # Server wrapper → ServiceForm (create)
│       │   │   └── [id]/
│       │   │       ├── edit/page.tsx       # Server wrapper → ServiceForm (edit, tenant-scoped)
│       │   │       └── members/page.tsx    # Enrolled members list for a service (read-only + link to edit enrollments)
│       ├── receipt/[id]/page.tsx            # Printable receipt (shared — member + admin); shows club + member details; PrintButton triggers window.print()
│       │   ├── announcements/
│       │   │   ├── page.tsx                # Announcement list with draft/published badges + AnnouncementActions
│       │   │   ├── new/page.tsx            # Server wrapper → AnnouncementForm (create)
│       │   │   └── [id]/edit/page.tsx      # Server wrapper → AnnouncementForm (edit, tenant-scoped)
│       │   ├── payments/page.tsx           # Balance table (server) + PaymentsClient (month selector + IssueReceiptModal)
│       │   └── receipts/page.tsx           # Full receipt history for the tenant
│       └── member-area/
│           ├── layout.tsx                  # Server auth guard + sticky nav + bottom nav (🏠📅🧾🔔) + InstallPWA
│           ├── page.tsx                    # Home: balance card + enrollments + unread count + announcements
│           ├── schedule/page.tsx           # Weekly schedule — DAY_GREEK map for display
│           ├── receipts/page.tsx           # Member's own receipt list
│           └── notifications/page.tsx      # Full inbox, mark-all-read on mount (NotificationList client component)
├── api/
│   ├── invite/route.ts                     # POST: create user + forgotPassword token + Resend email
│   ├── resend-invite/route.ts              # POST {userId}: new token + re-send invite email
│   └── delete-member/route.ts             # DELETE {userId}: remove member (tenant-scoped)
```

---

## Access Control (`src/access/index.ts`)

All functions return `boolean | Where` (query constraint). Never return `true` for untrusted callers.

| Function               | Behaviour                                                        |
|------------------------|------------------------------------------------------------------|
| `isMaster`             | `role === 'master'` only                                         |
| `isSuperadminOrAbove`  | master + superadmin                                              |
| `isClubAdminOrAbove`   | master + superadmin + club-admin                                 |
| `isAuthenticated`      | any logged-in user                                               |
| `tenantAdminWrite`     | write scoped to user's tenant; master/superadmin bypass          |
| `tenantMemberRead`     | read scoped to user's tenant (club-admin + member)               |
| `usersReadAccess`      | club-admin → own tenant; member → own record only                |
| `usersUpdateAccess`    | club-admin → own tenant; member → own record only                |
| `enrollmentsReadAccess`| club-admin → tenant; member → own enrollments only               |
| `ownNotificationsAccess`| recipient === user.id; master/superadmin bypass                 |
| `receiptsReadAccess`   | club-admin → tenant; member → own receipts only                  |
| `publicRead`           | `() => true` — used on Tenants for public landing page queries   |

---

## Notification Hooks (`afterChange`)

| Trigger                                  | Action                                                           |
|------------------------------------------|------------------------------------------------------------------|
| Announcement `status` → `published`      | inline `payload.find()` + `payload.create()` (notifications) + `sendAnnouncementEmail()` to all members; uses `overrideAccess: true` (no `req`) to avoid deepmerge circular-ref crash |
| Enrollment `paymentStatus` → `unpaid`    | `createNotification()` + `sendPaymentReminderEmail()` to member  |
| Service `operation === 'create'`         | `broadcastToTenantMembers()` in-app only                         |
| Receipt `operation === 'create'`         | `createNotification()` to member — "Απόδειξη Πληρωμής #N Xε"   |

**Loop prevention**: always pass `context: { skipNotification: true }` on any `payload.create` called inside a hook. The hook checks `if (context.skipNotification) return` at the top.

**Transaction safety**: pass `req` to nested payload operations to stay in the same DB transaction. Exception: if the hook `req` object causes a deepmerge circular-reference crash (see Key Patterns), use `overrideAccess: true` without `req` after manually enforcing access.

---

## Custom API Routes (`src/app/api/`)

All routes authenticate via `payload.auth({ headers })` and enforce tenant isolation manually.

| Route                        | Method   | Body                              | Who       | What                                                    |
|------------------------------|----------|-----------------------------------|-----------|---------------------------------------------------------|
| `/api/invite`                | POST     | `{email, firstName, lastName}`    | admin+    | Creates member, generates reset token, sends invite     |
| `/api/resend-invite`         | POST     | `{userId}`                        | admin+    | Generates fresh token, re-sends invite email            |
| `/api/delete-member`         | DELETE   | `{userId}`                        | admin+    | Deletes member; enforces same-tenant check              |

**Tenant ID normalisation**: SQLite IDs are integers. Always wrap tenant ID extraction in `String(...)` before comparing — `1 !== '1'` will cause false Forbidden errors.

```ts
const tenantId = String(
  typeof user.tenant === 'object' && user.tenant !== null
    ? (user.tenant as { id: unknown }).id
    : user.tenant ?? ''
)
```

Service create/edit/delete uses **Payload's built-in REST API** (`/api/services`) directly from the client — the `tenantAdminWrite` access control enforces isolation server-side.

---

## Resend Integration (`src/lib/resend.ts`)

```
RESEND_API_KEY=re_...        ← configured in .env
RESEND_FROM_EMAIL=noreply@koinon.app
```

Three exported functions:
- `sendInviteEmail({ to, clubName, inviteUrl, inviterName })`
- `sendPaymentReminderEmail({ to, memberName, serviceName, clubName, dashboardUrl })`
- `sendAnnouncementEmail({ to, memberName, announcementTitle, clubName, memberAreaUrl })`

All email calls in hooks are wrapped in `try/catch` — failure is non-fatal.

---

## Global Landing Page (`src/app/(frontend)/page.tsx`)

**Design system**: "Obsidian SaaS" — dark near-black background (`#07070f`), indigo-400 accent (`#818cf8`), Bricolage Grotesque display font.

**Important**: The root `<body>` is `text-slate-900`. The landing page sets `text-white` on its own outer `<div>` — do NOT move `text-white` back to `<body>` or all form inputs across the app will have invisible white text.

**Club landing page** (`[club-slug]/page.tsx`): the content area below the hero has a near-black background (`#07070f`). Section headings ("Υπηρεσίες", "Ανακοινώσεις") must be `text-white`, not `text-slate-800`. Empty-state messages use `text-slate-400`. Announcement cards are `bg-white` so inner text uses normal slate colors. Announcement body (`a.content`) is rendered as plain text with `whitespace-pre-wrap` below the title.

**Key CSS utilities** (defined in `globals.css`):
- `.animate-fade-up` / `.animate-fade-up-2/3/4` — staggered hero entrance (CSS-only, `opacity: 0` start)
- `.animate-float` — floating dashboard mockup (7s ease-in-out infinite)
- `.animate-ticker` — club type ticker strip (32s linear infinite)
- `.animate-orb` — background glow orbs (8s pulse)
- `.text-gradient` — indigo→violet gradient text clip
- `.dot-grid` — radial-gradient dot pattern overlay
- `.glass` — `rgba(255,255,255,0.04)` + blur backdrop + subtle border
- `.feature-card` — hover lift + indigo border glow

**Sections**: sticky nav → hero (headline + floating dashboard mockup) → ticker strip → features grid (6 cards) → how it works (3 steps) → pricing teaser → final CTA → footer.

---

## PWA

- `public/manifest.json` — name: Koinon, theme: `#4f46e5`, icons at `public/icons/icon-192.png` + `icon-512.png` (⚠️ PNG files not yet added — add before shipping)
- `public/sw.js` — caches `/offline` and `/manifest.json`; serves offline fallback for failed navigations
- `src/components/InstallPWA.tsx` — client component; listens for `beforeinstallprompt`; shown in member-area layout after login; respects `localStorage pwa-dismissed` flag

---

## Components (`src/components/`)

| File                   | Type   | Purpose                                                                            |
|------------------------|--------|------------------------------------------------------------------------------------|
| `NotificationBell.tsx` | client | Bell icon with unread badge; polls `/api/notifications` every 30s; mark-read on click |
| `InstallPWA.tsx`       | client | PWA "Προσθήκη στην Αρχική" prompt; member-area only; respects pwa-dismissed flag   |
| `LogoutButton.tsx`     | client | POSTs to `/api/users/logout`, then `router.push(/{slug}/login)`; used in dashboard + member-area layouts |
| `MemberActions.tsx`    | client | Επαναποστολή + Διαγραφή buttons for each member row; inline delete confirmation    |
| `ServiceActions.tsx`   | client | Επεξεργασία link + Διαγραφή button for each service card; calls Payload REST API   |
| `ServiceForm.tsx`      | client | Full service create/edit form; dynamic weeklySchedule slots; used by new + edit pages |
| `EnrollmentForm.tsx`   | client | Service assignment: checkbox + payment toggle + expandable "Πλάνο" section (planType/planTotal/planStart + discount fields) |
| `IssueReceiptModal.tsx`| client | Modal: loads enrollments + prior receipts, pre-fills period + amount, admin edits + issues receipt via POST /api/receipts |
| `PaymentsClient.tsx`   | client | Month selector (‹ ›, URL queryParam) + balance table + triggers IssueReceiptModal per member row |
| `AnnouncementForm.tsx` | client | Announcement create/edit form; sends `publishedAt` from client when `status='published'`; used by new + edit pages |
| `AnnouncementActions.tsx` | client | Επεξεργασία link + Διαγραφή button per announcement row; calls `DELETE /api/announcements/{id}` |
| `PrintButton.tsx`         | client | Calls `window.print()`; has `no-print` class so it hides itself during print |

---

## Key Patterns

- **Client components with dynamic params**: use `useParams()` from `next/navigation`, NOT the `params: Promise<...>` prop pattern (which is for server components only).
- **Hooks**: pass `req` to all nested payload calls for transaction atomicity.
- **Hook loops**: use `context: { skipNotification: true }` guard.
- **Local API security**: use `overrideAccess: false` in API routes when acting on behalf of a user. Use `overrideAccess: true` only when you have already manually enforced tenant/role checks (e.g. `delete-member`).
- **JWT**: `saveToJWT: true` on `role` and `tenant` — middleware reads these without a DB call.
- **Stale types**: run `npm run generate:types` after any schema change.
- **Stale importmap**: run `npm run generate:importmap` after adding/changing collections that use `richText`.
- **Tenant ID type**: Postgres IDs are integers. Always `String(id)` before comparing tenant IDs. Never use `===` directly on a raw extracted tenant value.
- **Input text visibility**: body is `text-slate-900`. Always add explicit `text-slate-900` on `<input>` and `<select>` inside forms to be safe.
- **Greek day names**: stored as English in DB. Use the `DAY_GREEK` constant (`{ Monday: 'Δευτέρα', … }`) for display. Each file that shows days defines its own local copy.
- **Payload REST relationship fields**: when POSTing/PATCHing to `/api/{collection}`, relationship fields (e.g. `tenant`) must be sent as a **number** (integer), not a string — `tenant: Number(tenantId)`. Sending a numeric string causes a 400 "field is invalid" error. Same applies when calling `payload.create()` locally — pass `tenant: Number(tenantId)`.
- **`payload.forgotPassword()` return type**: in Payload 3.x this returns a `string` (the token) directly — **not** an object `{ token }`. Always use `const token = await payload.forgotPassword(...)`, never `const { token } = ...`.
- **API route error handling**: always wrap `payload.findByID` and `payload.delete/create` in try/catch and return `Response.json({ message })` with an appropriate status. If they throw and are uncaught, Next.js returns an HTML 500 page — not JSON — causing `res.json()` to throw "Unexpected end of JSON input" on the client.
- **Deleting a user (member)**: Postgres enforces foreign key constraints. Always delete related `enrollments`, `notifications`, and `receipts` (by `member`/`recipient`) before calling `payload.delete` on the user. The `delete-member` route handles this cascade in order.
- **Client-side fetch error parsing**: when reading error body with `res.json()`, always wrap it in a nested try/catch — the server may return non-JSON (HTML error page) on uncaught exceptions. Fallback to a static message string.
- **Logout**: never use a plain `<form action="/api/users/logout">` — Payload returns JSON, not a redirect. Always use `LogoutButton` (or equivalent client component) that calls the endpoint and then does `router.push(/{slug}/login)`.
- **Payload deepmerge circular-reference crash (Payload 3.83)**: `deepMergeWithSourceArrays` in `node_modules/payload/dist/utilities/deepMerge.js` has no circular-reference guard. It is called during every write operation (`payload.create` / `payload.update`) and will stack-overflow if any field config or hook `req` object has circular refs (e.g. Lexical editor config, or the raw `req` from an `afterChange` hook). Fix: the function has been patched with a `WeakSet` guard in `node_modules/payload/dist/utilities/deepMerge.js`. Persist with `npx patch-package payload` → commit `patches/payload+3.83.0.patch`.
- **Date fields with conditional logic**: never rely on a field-level `beforeChange` hook to set a date value based on `siblingData` (e.g. setting `publishedAt` when `status === 'published'`). Payload's internal deepmerge can cause `siblingData` to be incomplete. Instead, compute and send the date value explicitly from the client/API route in the request body.
- **`announcements.content` is `textarea`**: was originally `richText` (Lexical). Migrated to `textarea` (plain text) via migration `20260424_180000.ts`. Do not revert to `richText` without running a new migration.
- **Receipt printing**: use the shared route `/{club-slug}/receipt/{id}` — accessible to both members and admins; renders club name + contact email, member name + email + phone, full line items (base/discount/final), total, notes, issuer. `PrintButton` calls `window.print()`. The `.no-print` CSS class (defined in `globals.css` `@media print`) hides the toolbar during print. Use `@page { margin: 1.5cm }` for clean page margins.

---

## Pricing & Receipts System (`src/lib/pricing.ts`)

- **`computeRate(baseRate, enrollment, member)`** — applies enrollment discount + member global discount; returns `{ enrollmentDiscount, globalDiscount, finalRate }`
- **`nextPeriodDescription(planType, planStart, planTotal, unitsAlreadyInvoiced)`** — returns "Απρίλιος 2026" (monthly) or "12 συνεδρίες" (sessions)
- **`planIsComplete(planTotal, unitsInvoiced)`** — true when all units invoiced
- **`MONTHS_GR[]`** — Greek month names array
- Payments page skips enrollments with `planTotal = 0` (not configured yet) to avoid false "✓ Εξοφλήθη" display

Receipt `issuedBy` is auto-set via `beforeChange` hook from `req.user` — never send it from the client.

---

## Schema Migrations (Neon Postgres)

Migration is complete. For future schema changes:
```bash
npm run payload migrate:create --name description-of-change
npm run payload migrate
```

---

## Env Variables

```bash
PAYLOAD_SECRET=...
DATABASE_URL=postgresql://...?sslmode=verify-full&channel_binding=require   # Neon connection string
RESEND_API_KEY=re_...                 # configured
RESEND_FROM_EMAIL=noreply@koinon.app  # configured
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

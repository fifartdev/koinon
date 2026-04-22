# Claude Code — Koinon Project

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see `.claude/skills/payload/reference/` for detailed docs.

---

## Project: Koinon — Multi-Tenant Club SaaS

### Stack
- **Framework**: Next.js 16 (App Router) + Payload CMS 3.83
- **Database**: SQLite (dev) → Neon Postgres (prod via `@payloadcms/db-postgres`)
- **Auth**: Payload native JWT, stored in `payload-token` cookie
- **Email**: Resend SDK — key configured, `FROM = noreply@koinon.app`
- **Styling**: Tailwind CSS v4 (`postcss.config.mjs` + `src/app/(frontend)/globals.css`)
- **Fonts**: Bricolage Grotesque (display) + DM Sans (body) via `next/font/google` in layout.tsx
- **PWA**: `public/manifest.json` + `public/sw.js` (offline fallback)

---

## First-Run Checklist (new machine / new clone)

```bash
npm install
npm run generate:types   # regenerates payload-types.ts from all 7 collections
npm run dev
```

Then open `localhost:3000/admin` and create the first user. Manually set its `role` to `master` in the DB. All other roles flow from there.

---

## Multi-Tenancy

- **Strategy**: Path-based — `/{club-slug}/...`
- **Tenant collection**: `tenants` with a unique `slug` field (unique + indexed)
- **Isolation**: Every tenant-scoped collection has a required `tenant` relationship field; access control functions enforce query constraints, not just booleans
- **Middleware** (`src/middleware.ts`): Decodes `payload-token` JWT without a DB call using base64 decode + expiry check. Redirects unauthenticated/unauthorised users before layout renders.
- **Layout validation** (`src/app/(frontend)/[club-slug]/layout.tsx`): Server component that queries Payload for the tenant by slug + `isActive: true`. Calls `notFound()` if missing — never shows stale/wrong data.

---

## Collections

| Collection      | Slug            | Key fields                                                                          |
|-----------------|-----------------|-------------------------------------------------------------------------------------|
| Users           | `users`         | email, firstName, lastName, role (saveToJWT), tenant (saveToJWT)                   |
| Tenants         | `tenants`       | name, slug (unique+index), logo, heroImage, clubInfo (richText), contactEmail, isActive |
| Services        | `services`      | title, description (richText), tutor, tenant, weeklySchedule (array), fee, isActive |
| Enrollments     | `enrollments`   | member→users, service→services, tenant, paymentStatus (paid/unpaid), paidAt, enrolledAt |
| Announcements   | `announcements` | title, content (richText), tenant, isPinned, status (draft/published), publishedAt  |
| Notifications   | `notifications` | title, message, type, tenant, recipient→users, isRead                               |
| Media           | `media`         | Payload upload default + alt text                                                   |

---

## User Roles

| Role         | Access                                                        |
|--------------|---------------------------------------------------------------|
| `master`     | Full Payload `/admin` + unrestricted data access              |
| `superadmin` | All data; creates tenants and club admins                     |
| `club-admin` | `/dashboard` + own tenant's data only                         |
| `member`     | `/member-area` + own tenant's published data + own enrollments|

Both `role` and `tenant` are stored in the JWT via `saveToJWT: true` — middleware reads them without any DB call.

---

## Route Structure

```
src/app/
├── (payload)/admin/              # Payload admin — master only
├── (frontend)/
│   ├── layout.tsx                # Root HTML shell; loads Bricolage + DM Sans via next/font
│   ├── globals.css               # @import "tailwindcss" + @theme tokens + keyframes
│   ├── page.tsx                  # Global SaaS landing page (dark obsidian theme)
│   ├── offline/page.tsx          # PWA offline fallback
│   └── [club-slug]/
│       ├── layout.tsx            # Server: validates tenant exists + isActive
│       ├── page.tsx              # Public club landing (services + announcements)
│       ├── login/page.tsx        # Client component — uses useParams(), NOT Promise prop
│       ├── dashboard/
│       │   ├── layout.tsx        # Server auth guard (club-admin+) + sidebar nav
│       │   ├── page.tsx          # Stats overview (members, services, unpaid count)
│       │   ├── members/page.tsx  # Member table + invite link
│       │   ├── services/page.tsx # Service cards with schedule chips
│       │   ├── announcements/    # Announcement list with draft/published badges
│       │   └── payments/page.tsx # Enrollment table with Paid/Unpaid badges
│       └── member-area/
│           ├── layout.tsx        # Server auth guard + sticky nav + bottom nav + InstallPWA
│           ├── page.tsx          # Home: enrollments + unread count + announcements
│           ├── schedule/page.tsx # Weekly schedule built from enrollment→service data
│           └── notifications/    # Full inbox, sorted by createdAt
├── api/
│   └── invite/route.ts           # POST: create user + forgotPassword token + Resend invite
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
| `publicRead`           | `() => true` — used on Tenants for public landing page queries   |

---

## Notification Hooks (`afterChange`)

| Trigger                                  | Action                                                           |
|------------------------------------------|------------------------------------------------------------------|
| Announcement `status` → `published`      | `broadcastToTenantMembers()` + `sendAnnouncementEmail()` to all  |
| Enrollment `paymentStatus` → `unpaid`    | `createNotification()` + `sendPaymentReminderEmail()` to member  |
| Service `operation === 'create'`         | `broadcastToTenantMembers()` in-app only                         |

**Loop prevention**: always pass `context: { skipNotification: true }` on any `payload.create` called inside a hook. The hook checks `if (context.skipNotification) return` at the top.

**Transaction safety**: always pass `req` to nested payload operations to stay in the same DB transaction.

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

**Floating dashboard mockup**: pure HTML/CSS element inside `DashboardMockup` component showing stats (47/6/3), activity feed, and a member row — no images needed.

---

## PWA

- `public/manifest.json` — name: Koinon, theme: `#4f46e5`, icons at `public/icons/icon-192.png` + `icon-512.png` (⚠️ PNG files not yet added — add before shipping)
- `public/sw.js` — caches `/offline` and `/manifest.json`; serves offline fallback for failed navigations
- `src/components/InstallPWA.tsx` — client component; listens for `beforeinstallprompt`; shown in member-area layout after login; respects `localStorage pwa-dismissed` flag

---

## Components (`src/components/`)

| File                  | Type   | Purpose                                                       |
|-----------------------|--------|---------------------------------------------------------------|
| `NotificationBell.tsx`| client | Bell icon with unread badge; polls `/api/notifications` every 30s; mark-read on hover |
| `InstallPWA.tsx`      | client | PWA "Add to Home Screen" prompt; post-login, member-area only |

---

## Key Patterns

- **Client components with dynamic params**: use `useParams()` from `next/navigation`, NOT the `params: Promise<...>` prop pattern (which is for server components only).
- **Hooks**: pass `req` to all nested payload calls for transaction atomicity.
- **Hook loops**: use `context: { skipNotification: true }` guard.
- **Local API security**: use `overrideAccess: false` in API routes when acting on behalf of a user.
- **JWT**: `saveToJWT: true` on `role` and `tenant` — middleware reads these without a DB call.
- **Stale types**: run `npm run generate:types` after any schema change.

---

## Production Migration (SQLite → Neon Postgres)

1. `npm install @payloadcms/db-postgres`
2. In `src/payload.config.ts`, swap `sqliteAdapter` for:
   ```ts
   import { postgresAdapter } from '@payloadcms/db-postgres'
   db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } })
   ```
3. Set `DATABASE_URL` to the Neon connection string in production env
4. Run `npm run payload migrate` on first deploy

---

## Env Variables

```bash
PAYLOAD_SECRET=...
DATABASE_URL=file:./.db               # dev
# DATABASE_URL=postgresql://...       # prod (Neon)
RESEND_API_KEY=re_...                 # configured
RESEND_FROM_EMAIL=noreply@koinon.app  # configured
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

# HelpHub

A privacy-first complaint and assistance-request platform: people can report
problems, ask for help, and attach proof, without exposing their name,
contact details, or exact location to the public or to other users.

> ⚠️ **This is a working scaffold, not a finished, audited product.** It
> implements the architecture and privacy separation described in the
> project brief, but several integrations are deliberately stubbed (object
> storage, malware scanning, geocoding — see "What's stubbed" below) and it
> has not had a security, privacy, or legal review. **Do not launch this
> with real complainants' data until it has been through all four**, per
> the brief's own closing requirement. It was built without network access
> to install dependencies or run a live server, so treat it as reviewed-by-
> construction, not tested end-to-end — run it locally and exercise every
> flow yourself before trusting it.

## Why it's built this way

The core privacy requirement — complainants can speak up without exposing
themselves — is enforced structurally, not just by UI choices:

- **Identity lives in a separate table** (`PrivateComplainantData`), not as
  columns on `Complaint`. A public query can't leak a name or phone number
  by accident, because it isn't in the table it's querying.
- **Public API responses use an explicit field allowlist**
  (`src/lib/public-data.ts`), not `select: { ... everything except X }`.
  Adding a sensitive column to `Complaint` later can't silently start
  leaking it — you'd have to add it to the allowlist on purpose.
- **Exact location (lat/lng/address) is never read by public code paths.**
  Only `src/lib/admin-data.ts`, which is permission-checked, touches those
  columns.
- **Every admin view of private identity, exact location, or evidence is
  audit-logged** (`AuditLog`, `EvidenceAccessLog`) — see `src/lib/audit.ts`.
- **Role-based access is centralized** in `src/lib/rbac.ts` rather than
  scattered `if (role === ...)` checks, so the permission table is one
  place to review.
- **Evidence files are never public.** They're written to private object
  storage and read only through short-lived signed URLs, which is the one
  piece you must wire up to a real storage provider before this is usable
  (see below).
- **Tracking codes are shown once and stored only as a hash** — not even an
  admin with raw database access can read out a complainant's tracking
  code and impersonate them on the tracking page.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL ·
JWT sessions (`jose`) · TOTP two-factor auth (`otplib`) · Zod validation.

## Getting started

```bash
npm install
cp .env.example .env     # fill in real values — see comments in the file
npx prisma migrate dev --name init
npm run seed              # creates one SUPER_ADMIN with 2FA enrolled, prints a QR code
npm run dev
```

Requires Node 18+ and a Postgres database. This project was written and
reviewed without a live network connection, so **run `npm install` and the
dev server yourself before relying on it** — treat the first run as a smoke
test.

## What's stubbed and must be wired up before launch

These are intentionally left as clearly-marked stubs rather than guessed
implementations, because getting them wrong is worse than leaving them
obvious:

| File | What to do |
|---|---|
| `src/lib/storage.ts` | Wire `putPrivateObject` / `getSignedDownloadUrl` to a real S3-compatible bucket (e.g. `@aws-sdk/client-s3`). The bucket must deny all public reads at the policy level, not just by not linking to it. |
| `src/lib/storage.ts` (`scanForMalware`) | Connect to a real ClamAV daemon or scanning API. It currently fails closed (`FAILED`) with no scanner configured, so evidence stays `PENDING` and hidden from admins rather than being silently trusted. |
| `src/lib/geo.ts` | Connect a real reverse-geocoding provider, called server-side only, and keep it rounded to district/city — never return raw coordinates to a public route. |
| CAPTCHA | `src/lib/captcha.ts` is a self-hosted arithmetic challenge so bot-resistance isn't absent without external network calls. Replace with hCaptcha / reCAPTCHA / Turnstile before launch. |
| Duplicate/spam detection | `src/lib/spam.ts` uses simple, explainable heuristics (link count, repetition, exact-content hash within 7 days). They *flag* a complaint for review; they never reject one. Tune or replace with a real classifier as volume grows. |
| Database migration | `schema.prisma` gained `contentHash`, `autoFlagged`, `autoFlagReason` and a `ComplaintReport` model. Run `npx prisma migrate dev` before starting. |
| Admin 2FA enrollment | The seed script creates one admin with 2FA pre-enrolled for local dev. There's no self-service "scan this QR code" enrollment UI yet for additional admins — add one before you need to onboard real staff, rather than sharing TOTP secrets by hand. |
| Admin user management | `PERMISSIONS.MANAGE_ADMIN_USERS` is defined in `rbac.ts` but there's no UI/API route for a Super Admin to create or deactivate other admins yet — add one rather than editing the database directly in production. |
| `prisma/schema.prisma` retention | No automatic deletion/anonymization job exists yet. Add one once you've decided (and written into the Privacy Policy) how long data is retained. |
| Legal pages | `/privacy-policy`, `/terms`, `/community-guidelines` have real structure but placeholder legal text — have them reviewed by counsel for your jurisdiction. |
| `/emergency` | Has placeholder text where real regional emergency numbers and hotlines must go. Don't launch with placeholders. |

## What's implemented

Complaint wizard (4 steps + review, CAPTCHA, honeypot) · tracking by number + secret
code · two-way anonymous messaging (complainant ↔ officer, no contact details
exchanged) · public complaint pages (admin-published only, allowlisted fields) ·
abuse reporting on public complaints · admin dashboard with search/filter ·
complaint detail with RBAC-gated identity/location, evidence viewing via
audited signed URLs, assign, verify, status updates, messaging · moderation
queue (PII-free) · statistics page · CSRF double-submit on all admin
mutations · audit + evidence-access logging · all six policy pages.

## Known gaps

- No self-service admin creation / 2FA enrollment UI or admin-user management.
- No "request additional evidence" button (an officer can do this today by messaging
  the complainant and setting status to Verification Required).
- Internal notes exist in the schema (`isInternalNote`) but the status form only writes
  complainant-visible updates; there's no internal-note UI yet.
- Regional-language switching: the preferred-language field is captured, but the UI isn't translated.
- No admin map view; precise coordinates display as text only.
- Storage, malware scanning, and geocoding remain stubs (see table above).
- Not type-checked or run: the build environment had no network access. Syntax
  and import resolution were checked, but expect to fix a few type errors on first `npm run build`.

## Pre-launch checklist (from the project brief, section 18)

- [ ] Independent security review (auth, RBAC, file upload, injection, headers)
- [ ] Privacy review against the jurisdictions you operate in
- [ ] Legal review of Terms, Privacy Policy, Community Guidelines
- [ ] Data protection / retention policy finalized and implemented
- [ ] Real object storage + malware scanning wired up and tested
- [ ] Admin 2FA enrollment flow built (not just seeded)
- [ ] Load-tested rate limiting switched from the Postgres-backed stub in
      `src/lib/rateLimit.ts` to Redis for real traffic
- [ ] Backups and incident-response process in place

## Project layout

```
src/
  app/                  Pages (public + admin) and API routes
  components/
    complaint-form/     The 4-step complaint wizard
    admin/               Admin-only UI pieces
    ui/                  Shared presentational components
  lib/
    db.ts                Prisma client
    auth.ts              Password hashing, sessions, 2FA
    rbac.ts               Permission table + per-complaint access checks
    public-data.ts        Allowlisted queries for anything public
    admin-data.ts          Permission-checked, audit-logged admin queries
    storage.ts              Private evidence storage (stubbed, see above)
    geo.ts                   Location generalization (stubbed, see above)
    validation.ts             All Zod input schemas
    rateLimit.ts               Anti-abuse rate limiting
    csrf.ts                     Double-submit CSRF tokens
    ids.ts                       Complaint number / tracking code generation
    audit.ts                      Audit log writer
prisma/
  schema.prisma                   Full data model, see comments at the top
  seed.ts                          Creates a local dev Super Admin
```

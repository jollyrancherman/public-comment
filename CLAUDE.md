# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This file provides context and guidance for Claude when working on the **Public Comment Application** project.  
It explains the vision, requirements, architecture, data model, and development philosophy. Use this to stay aligned with goals when generating or refactoring code.

---

## 🎯 Vision

A secure, accessible, and extensible platform for residents to:

- Submit public comments on city meetings.
- Engage in community-driven recommendations.
- Provide council members with clear insights into public sentiment.

Designed to scale, with **privacy, moderation, and auditability** as core principles.

---

## 👥 User Roles

- **Resident** — standard user submitting comments.
- **Moderator** — reviews/flags content.
- **Staff** — city staff; manages agendas.
- **Council Member** — elected officials with dashboard access.
- **Admin** — full control.

Authentication: **6-digit email OTP** (no passwords).  
Optional: residents may add an address (not verified in v1).

---

## 📅 Meetings & Agendas

- **Agenda Items**: flat structure like `A1`, `A2`, `B1`.
- **Agenda Upload**: CSV/JSON import (primary). Optional scraper later.
- **Submission Rules**:
  - Comments accepted anytime.
  - Comments only **visible once meeting starts**.
  - Comments submitted after a meeting ends roll into the **next meeting**.
  - Residents can **withdraw** comments until the council takes up that item.

---

## 💬 Commenting

- **One-to-many**: One comment can apply to multiple agenda items.
- **AI moderation pipeline**:
  - PII & profanity redaction (raw stored, public version displayed).
  - Risk flagging (harassment, threats, slurs).
- **Visibility states**: `PENDING_VISIBLE`, `VISIBLE`, `HIDDEN`, `WITHDRAWN`.
- **Stances**: For, Against, Concerned, Neutral.
- **Location**: Stored in PostGIS, rounded for privacy.

---

## 🔎 Moderation

- Moderation dashboard for flagged comments.
- Actions: hide, restore, annotate.
- Audit trail of all moderator actions.
- Policy enforcement with keyword lists + AI classification.

---

## 📊 Council Dashboard

- Counts of stances (For / Against / Concerned / Neutral).
- Quality metrics: length, civility, uniqueness.
- Time series charts for comment activity.
- Map aggregation by ZIP/district (PostGIS polygons).
- CSV export for packets.

---

## 💡 Recommendations Forum

- Residents post proposals.
- Discussion threads + upvote/downvote system.
- Sorting: hot, new, top.
- Tagging for categories.
- Rate-limiting to prevent spam.

---

## 📬 Notifications

- OTP login emails.
- Submission/withdrawal confirmations.
- Staff digests and threshold alerts.

---

## 🛠 Tech Stack

- **Frontend**: Next.js (App Router, RSC), Tailwind.
- **Auth**: Auth.js with custom email OTP provider.
- **Database**: PostgreSQL + PostGIS.
- **ORM**: Prisma.
- **APIs**: Next.js API routes + Zod validation.
- **Moderation**: Regex + AI classifier.
- **Hosting**: Vercel + Neon/Supabase (or VPS).

---

## 🗄 Data Model (highlights)

- **User**: email, role, optional address.
- **EmailOTP**: code hash, expiry, attempts.
- **Meeting**: title, body (council/commission), start/end.
- **AgendaItem**: code (`A1`), title, description, cutoff.
- **Comment**: raw vs public body, stance, visibility, geom (PostGIS).
- **CommentOnItem**: join for many-to-many.
- **Recommendation**: proposals, threaded comments, votes.

---

## 📑 Records & Retention

- Store both raw + redacted versions.
- Immutable moderation audit log.
- Export endpoints for CSV/JSON packets.
- Retention policy documented in repo.

---

## 🔒 Security & Integrity

- OTP request & comment rate limiting.
- Withdrawals allowed until item cutoff.
- Captcha / IP heuristics for abuse.
- WCAG 2.1 AA accessibility.

---

## 🧭 Development Philosophy

- **KISS** — keep components simple and composable.
- **YAGNI** — implement only what’s needed now; design for extension.
- **Fail Fast** — validate inputs early; strict rate limits.
- **Audit Everything** — immutable logs for moderation and records.
- **Accessibility First** — semantic HTML, ARIA, keyboard nav.

---

## ✅ MVP Checklist

1. OTP login + role system.
2. Upload meetings + single-level agenda items.
3. Comment submission (one-to-many, stance, optional location).
4. AI moderation + redaction.
5. Visibility gating (only public once meeting starts).
6. Withdrawal support.
7. Basic moderation dashboard.
8. Council dashboard (counts, CSV export).
9. Recommendations forum (posts, comments, votes).

---

Use this file to stay aligned on goals and design decisions. When in doubt, default to **simplicity, transparency, and auditability**.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev
# or: yarn dev | pnpm dev | bun dev

# Build for production with Turbopack
npm run build
# or: yarn build | pnpm build | bun build

# Start production server
npm run start
# or: yarn start | pnpm start | bun start

# Run ESLint
npm run lint
# or: yarn lint | pnpm lint | bun lint
```

## Architecture

This is a Next.js 15 application using:

- **App Router** with pages located in `src/app/`
- **TypeScript** with strict mode enabled
- **Tailwind CSS v4** with PostCSS configuration
- **Turbopack** bundler for both development and production builds
- **Path alias** `@/*` maps to `./src/*` for imports

## Project Structure

- `src/app/` - App Router pages and layouts
  - `layout.tsx` - Root layout with Geist fonts
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with Tailwind directives
- `public/` - Static assets served at root path
- Configuration files:
  - `next.config.ts` - Next.js configuration
  - `tsconfig.json` - TypeScript configuration with Next.js plugin
  - `eslint.config.mjs` - ESLint flat config extending Next.js rules
  - `postcss.config.mjs` - PostCSS configuration for Tailwind CSS v4

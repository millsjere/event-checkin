# VLISCO SIP & SHOP — Event Check-In

Mobile-first guest check-in system. Guests scan a QR code, land on a public
form (first name, last name, phone, email), and their check-in is stored in
Supabase. A separate admin dashboard shows the live guest list, lets you
search, export CSV, and generate/share the QR code.

## Stack

- Vite + React + TypeScript
- Tailwind CSS (mobile-first)
- Supabase (Postgres + Row Level Security + Auth)
- React Router

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase project
   details (Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

3. In the Supabase dashboard, open **SQL Editor** and run
   [`supabase/schema.sql`](supabase/schema.sql). This creates the `checkins`
   table, duplicate-prevention unique indexes (email + phone), and Row Level
   Security policies:
   - Anyone (anon) can **insert** a check-in.
   - Only signed-in admins (**authenticated**) can **read** or **delete**
     check-ins — the public can never read back the guest list.

4. Create an admin login: **Authentication → Users → Add user**, enter an
   email/password, and check **Auto Confirm User** so it doesn't need an
   email-confirmation click. This is the account you'll use to sign into
   `/admin`.

5. Start the dev server:

   ```bash
   npm run dev
   ```

## Routes

- `/` — public check-in form (this is what the QR code should point to)
- `/admin` — admin login + live dashboard (guest list, search, CSV export,
  QR code card, delete)

## Security note

This is a client-only single-page app (no backend server). The Supabase
`anon`/publishable key is public by design — safety comes entirely from the
RLS policies in `supabase/schema.sql`, not from hiding the key. The admin
dashboard is gated by real Supabase Auth (not a hardcoded password), and the
RLS `select`/`delete` policies only allow the `authenticated` role, so
signing in is required to see or remove guest data.

## Deploying

Build with `npm run build`, then deploy the `dist/` folder to any static
host (Vercel, Netlify, etc.). Set the same `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` environment variables on the host.

# Copilot Instructions – طرنوس GPT App

## Project Overview
This is a professional GPT (Get Paid To) web application:
- **Framework:** Next.js 15 App Router
- **Styling:** Tailwind CSS v4 (light mode, Apple-style minimalism)
- **Font:** IBM Plex Sans Arabic – RTL layout (`dir="rtl"`)
- **Backend:** Supabase (PostgreSQL + Auth)
- **Language:** TypeScript

## Key Conventions
- All UI is in Arabic; layout direction is RTL.
- Light mode only – no dark mode variants.
- Use `bg-gray-50`, `bg-white`, `text-gray-900`, `text-gray-500`, `border-gray-100` as the base palette.
- Accent color: `blue-600` for primary actions and highlights.
- Use `rounded-2xl`, `shadow-sm`, `hover:shadow-md`, `hover:-translate-y-0.5` for card components.
- Transitions: `transition-all duration-200` or `transition-colors duration-200`.

## Database Tables (Supabase)
- `profiles` – user data and `balance_points`
- `transactions` – points-earning events
- `withdrawals` – cash-out requests

## Supabase Clients
- `lib/supabase.ts` → `supabase` (browser, anon key)
- `lib/supabase.ts` → `createAdminClient()` (server-side, service role key, bypasses RLS)

## Postback Webhook
`GET /api/postback` – secured by `POSTBACK_SECRET_KEY`:
1. Validate `secret_key`
2. Look up `user_id` in `profiles`
3. Increment `balance_points`
4. Insert into `transactions`

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `POSTBACK_SECRET_KEY` (server only)

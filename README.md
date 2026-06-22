# Sensi Store

React + Vite storefront backed by Supabase Authentication and PostgreSQL. Customer profiles and orders are stored in Supabase, while the browser keeps only the active login session.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql` once. The script creates the tables, profile trigger, indexes, and row-level security policies.
3. In Authentication settings, enable Email/Password. Add the production Render hostname to the allowed redirect URLs when email confirmation or password reset is enabled.
4. Create the admin account with `bglspeedy@gmail.com` in Supabase Authentication. The SQL trigger assigns its admin profile automatically.
5. Copy `.env.example` to `.env.local` and set the project URL and publishable/anon key. Never put a Supabase secret or service-role key in a `VITE_` variable.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Render Static deployment

Create a Render Static Site with:

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_ADMIN_EMAIL`

`public/_redirects` contains the SPA fallback needed for direct visits to `/dashboard`, `/admin`, and other React routes.

## Data and security

- Supabase Auth verifies passwords; plaintext passwords are never written to `public.users`.
- Row-level security limits customers to their own profile and orders.
- Only the authenticated `bglspeedy@gmail.com` account can list all users/orders or change payment and delivery statuses.
- Manual UPI orders start with `Pending` payment and order statuses. The admin dashboard can mark payment as Pending, Paid, or Failed and an order as Pending, Processing, or Delivered.

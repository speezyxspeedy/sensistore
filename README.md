# Sensi Store

React + Vite storefront backed by Supabase PostgreSQL. Customer accounts and orders are stored in Supabase, while the current public user profile is kept in browser localStorage.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`. The script creates the users/orders tables and the direct-table policies required by this frontend-only login flow.
3. In the SQL editor, initialize the locked admin email with your own strong password: `select public.initialize_store_admin('replace-with-a-strong-admin-password');`
4. Copy `.env.example` to `.env.local` and set the project URL and publishable/anon key. Never put a Supabase secret or service-role key in a `VITE_` variable.

Supabase Auth email confirmation and signup/login RPCs are not used. Existing Supabase Auth passwords cannot be imported because providers never expose password hashes; existing users must create a new application account after this migration.

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

- Customer passwords are PBKDF2-derived in the browser before insertion; plaintext passwords are not stored.
- This requested direct-table/localStorage flow is suitable only for a lightweight prototype. Because it has no trusted server-side identity, it cannot provide strong tenant isolation or server-enforced administrator authorization.
- Only the authenticated `bglspeedy@gmail.com` account can list all users/orders or change payment and delivery statuses.
- Manual UPI orders start with `Pending` payment and order statuses. The admin dashboard can mark payment as Pending, Paid, or Failed and an order as Pending, Processing, or Delivered.

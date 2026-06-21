# Sensi Store

Production-oriented React storefront for custom gaming sensitivity packages. It includes Firebase customer authentication, protected dashboards, private screenshot uploads, server-verified payment order creation, an admin workflow, transactional email, contact/legal pages, rate limiting, and Vercel deployment configuration.

## Architecture

- React + Vite + Tailwind CSS frontend
- Firebase Authentication for customers and administrators
- Firestore for verified orders, private payment sessions, admin records, and distributed rate limits
- Firebase Storage for HUD and sensitivity screenshots
- Vercel Node functions for payment initiation, webhook verification, status updates, and Nodemailer
- Orders are created only by the verified BharatPe webhook. The browser cannot create or mark an order paid.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill every required value.
3. Create a Firebase Web App.
4. Enable Firebase Authentication → Email/Password, Firestore, and Storage.
5. Deploy rules:

   ```bash
   firebase deploy --only firestore:rules,storage
   ```

6. Install the Vercel CLI and run `vercel dev` so both Vite and `/api` functions are available.

Using `npm run dev` starts only the frontend; payment, contact, and delivery-email APIs require Vercel Functions.

## Admin setup

1. Create `bglspeedy@gmail.com` in Firebase Authentication with a strong password.
2. Set both `VITE_ADMIN_EMAIL` and server-side `ADMIN_EMAIL` to that same address.
3. Sign in through the normal account page or `/admin/login`; successful admin login redirects to `/admin`.

Never store the password in `VITE_ADMIN_PASSWORD` or another `VITE_` variable. Vite embeds those values in public browser JavaScript. The password is entered at login and verified by Firebase Authentication; Firestore rules and server APIs independently restrict admin access to the configured email.

Admin status changes use a server endpoint. Marking an order Delivered triggers the delivery email once when changing from another status.

## BharatPe gateway setup

BharatPe does not publish a general-purpose official npm payment SDK. Gateway credentials, endpoints, request fields, signature headers, amount units, and webhook status values are supplied through merchant onboarding and can differ by merchant product/version.

The isolated adapter is at `api/_lib/bharatpe.js`. Before accepting real money:

1. Complete BharatPe Payment Gateway merchant onboarding.
2. Put the merchant-provided create/status URLs and secrets into Vercel environment variables.
3. Match the adapter payload/header names to the integration document issued to your merchant account.
4. Register `https://YOUR_DOMAIN/api/payments/webhook` as the webhook URL.
5. Confirm the webhook signature header and run successful, failed, cancelled, duplicate-webhook, and amount-mismatch tests in BharatPe’s sandbox/UAT environment.

The application deliberately returns an error when gateway configuration is absent. It never shows Payment Successful without a verified webhook and server-side payment-status check.

## SMTP email

Use any SMTP provider supported by Nodemailer. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and `SUPPORT_EMAIL` in Vercel. Test SPF, DKIM, and DMARC before launch.

## Deploy to Vercel

1. Push the project to GitHub/GitLab/Bitbucket.
2. Import it in Vercel. Framework Preset: Vite.
3. Add all `.env.example` variables to Project Settings → Environment Variables. Never expose server secrets with a `VITE_` prefix.
4. Deploy and update `APP_URL` to the final HTTPS domain.
5. Add the final domain to Firebase Authentication → Authorized domains.
6. Deploy Firebase rules and register the production BharatPe webhook.
7. Run a real end-to-end low-value payment test and verify Firestore order creation plus both emails.

Build command: `npm run build`. Output directory: `dist`.

## Production checklist

- Replace community/support placeholder links.
- Have the included starter legal policies reviewed for your jurisdiction and business.
- Enable Firebase App Check for web, Firestore, Storage, and callable surfaces where supported.
- Configure Firestore TTL for `rateLimits.expiresAt` and `paymentSessions.expiresAt`.
- Configure a Storage lifecycle policy to remove abandoned `order-uploads` after an appropriate retention window.
- Monitor webhook errors and SMTP failures in Vercel logs.
- Restrict Firebase Admin credentials to server-only Vercel environment variables and rotate leaked credentials immediately.

# Sensi Store

React + Vite storefront with Firebase Authentication, Firestore orders, Firebase Storage screenshots, customer tracking, an email-locked admin dashboard, and manual UPI verification.

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and add the Firebase Web App values.
3. In Firebase Console, enable Authentication → Sign-in method → Email/Password.
4. Create Firestore and Storage, then deploy the included rules:

   ```bash
   firebase deploy --only firestore:rules,storage
   ```

5. Run `npm run dev` and open `http://localhost:5173`.

Create `bglspeedy@gmail.com` in Firebase Authentication to use `/admin`. The password is always checked by Firebase and must never be stored in a `VITE_` environment variable.

## Firebase authorized domains

Firebase Console → Authentication → Settings → Authorized domains must contain:

- `localhost`
- your exact `*.vercel.app` hostname
- your exact `*.onrender.com` hostname
- any custom production domain

If a deployed login reports `auth/unauthorized-domain`, add the hostname shown in the browser and redeploy only if environment variables also changed. For `auth/operation-not-allowed`, enable Email/Password. For `auth/configuration-not-found`, initialize Authentication for the same Firebase project used by the Vite variables.

## Payments

`VITE_PAYMENT_MODE=manual` is the default. Customers enter a UPI transaction ID and the order is stored with `paymentStatus: "Pending"`; the administrator marks it Paid or Failed.

`src/services/paymentService.js` contains the gateway abstraction. `/api/create-payment` and `/api/verify-payment` are authenticated server placeholders for a future BharatPe/Razorpay integration. Merchant keys and signature secrets belong only in backend environment variables without a `VITE_` prefix. A real gateway implementation must verify the provider signature, amount, currency, order ID, and final status server-side before marking an order Paid.

## Deploy to Vercel

1. Import the GitHub repository and select the Vite preset.
2. Build command: `npm run build`; output directory: `dist`.
3. Add all `VITE_FIREBASE_*`, `VITE_ADMIN_EMAIL`, and `VITE_PAYMENT_MODE` values in Project Settings → Environment Variables.
4. Add the Vercel hostname to Firebase Authorized domains and deploy the Firebase rules.
5. Keep automatic production deployments enabled for the production Git branch. Every push to that branch will trigger a new build.

`vercel.json` contains the SPA rewrite so direct visits to `/admin`, `/dashboard`, and other React routes load correctly.

## Deploy to Render Static Site

1. Create a Static Site from the GitHub repository.
2. Build command: `npm install && npm run build`; publish directory: `dist`.
3. Add the same public environment variables from `.env.example`.
4. Add the Render hostname to Firebase Authorized domains and deploy the Firebase rules.
5. Enable Auto-Deploy for the selected production branch.

`public/_redirects` supplies `/* /index.html 200` for client-side routing. Render Static does not run the `/api` Node functions; manual payment mode works there because order creation and admin review use Firebase directly. Use Vercel or a separate backend before enabling an online gateway.

## Security notes

- Firestore rules require the signed-in UID on customer orders and allow status changes only for `bglspeedy@gmail.com`.
- Storage rules let customers upload into their own UID folder and let only the owner/admin read those objects.
- Do not commit `.env.local`, Firebase Admin private keys, Razorpay secrets, or BharatPe secrets.

# PostureLab

PostureLab is a measurement-first posture scan web app built with Next.js, TypeScript, and MediaPipe. It captures guided posture photos, turns pose landmarks into repeatable measurements, groups those metrics into body-level findings, and builds a corrective exercise plan from the latest scan.

This is a portfolio project and local prototype for posture self-tracking. It is not medical software and does not diagnose medical conditions.

## Features

- Guided front, left-side, right-side, and back upper-body photo capture
- MediaPipe pose-landmark analysis for posture-photo measurements
- Scan quality checks for repeatable setup and cleaner comparison
- Body-level findings for forward head posture, shoulder symmetry, trunk stacking, and upper-back curve proxy signals
- Personalized corrective exercise plan generated from the latest scan
- Scan history, workout completion, check-ins, Pro weekly reviews, and report views
- Report copy/download plus authenticated cloud data export
- Health endpoint for deployment smoke checks
- Installable web-app manifest and generated app icons
- Sitemap and robots routes for public web discovery
- Social sharing metadata with a generated Open Graph preview image
- Vercel Web Analytics and Speed Insights hooks for launch observability
- Structured JSON route and server-action logs for launch-critical endpoints and mutations
- LocalStorage persistence with optional Supabase cloud sync
- Production-ready scaffolding for Supabase Auth, Supabase Storage, Supabase Postgres, and Stripe subscriptions

## Screenshots

Screenshots or a short demo GIF should be added after the paid-service setup is finished.

- Home and workflow overview
- Guided scan capture
- Results and body findings
- Corrective exercise plan

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- MediaPipe Tasks Vision
- Vitest
- ESLint
- LocalStorage
- Supabase
- Stripe Checkout and Billing Portal
- Vercel Web Analytics and Speed Insights

## Local Development

Requirements:

- Node.js 20.9.0 or newer
- npm

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For paid-web-app setup, see [PRODUCTION_SETUP.md](/Users/teague/Documents/PostureProject/PRODUCTION_SETUP.md).
For remaining launch work, see [LAUNCH_TRACKER.md](/Users/teague/Documents/PostureProject/LAUNCH_TRACKER.md).

## Local Supabase

The repo includes Supabase CLI config and migrations for local database testing:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:status
```

`npm run supabase:status` prints local values using the same env var names expected by the app.

## Verification

```bash
npm run verify
npm run supabase:live-check
npm run stripe:catalog-plan
npm run stripe:live-check
npm run smoke:prod
npm run smoke:ready
npm run launch:status
npm run launch:ready
npm run vercel:env-plan
npm run vercel:env-check
```

Current local verification:

- `npm run verify`: runs the secret scanner, Supabase schema checker, tests, lint, and production build
- `npm run supabase:live-check`: checks live Supabase tables and the private scan-image bucket after env vars are installed
- `npm run stripe:catalog-plan`: prints Stripe CLI commands for the Pro monthly/yearly products and prices without printing keys
- `npm run stripe:live-check`: checks live Stripe monthly/yearly recurring prices after env vars are installed
- `npm run smoke:prod`: checks the deployed health endpoint, pricing checkout state, and unsigned webhook rejection
- `npm run smoke:ready`: requires production health to report live Supabase and Stripe env wiring before launch
- `npm run launch:status`: summarizes git cleanliness, local env readiness, schema checks, and production smoke state
- `npm run launch:ready`: includes live Supabase, Stripe, and Vercel env checks for the final pre-charge gate and exits nonzero until ready
- `npm run vercel:env-plan`: checks which local env values are ready to add to Vercel without printing values
- `npm run vercel:env-check`: checks required Vercel env var names and targets without printing values
- Current test suite: 46 files passed, 145 tests passed

The setup, launch-status, Stripe catalog-plan, Vercel env-plan, and Vercel env-check commands do not print secret values. The secret scanner checks tracked and untracked source files for Stripe and Supabase secret-shaped values. Keep real keys in `.env.local` and Vercel environment variables only.

GitHub Actions runs `npm run verify` on pull requests and pushes to `main`.

## Support And Security

For product support, see [SUPPORT.md](/Users/teague/Documents/PostureProject/SUPPORT.md). For private vulnerability reporting and sensitive-data rules, see [SECURITY.md](/Users/teague/Documents/PostureProject/SECURITY.md).

## Project Boundary

PostureLab estimates posture patterns from 2D photo landmarks. The output is intended for personal tracking, exercise planning, and comparing scans over time. It should not be used as medical diagnosis, treatment advice, or a replacement for a licensed clinician.

## Roadmap

- Add screenshots and a short demo GIF
- Improve onboarding for camera positioning and lighting
- Add calibration helpers for more consistent measurements
- Connect production Supabase and Stripe credentials in Vercel
- Get legal review of the privacy policy and terms before charging users
- Deploy a public demo with clear privacy and safety boundaries

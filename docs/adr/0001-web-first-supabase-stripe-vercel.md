# ADR 0001: Web-First Supabase, Stripe, and Vercel Stack

Status: Accepted

Date: 2026-09-06

## Context

PostureLab needs guided camera capture, local-first scans, authenticated cloud sync, private posture photos, subscriptions, customer billing self-service, webhook-driven entitlement updates, and a deployment path that can be verified before charging customers.

The main alternatives considered were:

- Base44 as the primary app platform
- iOS-first native app
- Custom database, auth, storage, and billing infrastructure
- Web-first Next.js app using managed services

## Decision

Build PostureLab as a web-first Next.js app on Vercel, with Supabase for Auth/Postgres/private Storage and Stripe Billing for subscriptions.

Use Codex-connected services where they are available and reliable:

- Supabase connector for organization/project discovery, cost confirmation, project creation, and SQL execution after explicit approval
- Vercel CLI for deployment and env checks while the Vercel connector has scope authorization gaps
- Stripe skill guidance plus Stripe CLI/Dashboard because Stripe MCP create/list tools are not exposed in this session

## Rationale

Supabase is a better fit than custom infrastructure for user accounts, row-level security, relational scan data, private image storage, and export/delete workflows.

Stripe Billing is a better fit than custom subscription logic because it handles hosted checkout, recurring billing, payment methods, retries, customer billing self-service, and webhook delivery semantics.

Vercel is a better fit than self-hosting because the app is already Next.js, needs predictable preview/production deploys, and can be checked with deployment, env, smoke, and readiness scripts.

Base44 remains useful for rapid app prototypes, but this app needs tighter control over camera UX, health-adjacent data handling, private photo storage, Stripe webhooks, and production verification. Keeping it outside Base44 also avoids integration ambiguity with the user's existing Base44 app.

iOS can come later if mobile distribution proves necessary. A web-first app is faster to ship, works on desktop and mobile browsers, supports shareable URLs, avoids App Store review during validation, and lets the business model be tested before native investment.

## Consequences

- The product can launch as a paid web app before native app work.
- Supabase and Stripe setup must be completed and verified before paid features go live.
- The launch gate remains `npm run launch:ready`.
- The app should keep using managed services for auth, billing, storage, deployment, and observability unless a managed option clearly fails the product requirement.
- Future iOS work should reuse the Supabase and Stripe backend rather than replacing it.

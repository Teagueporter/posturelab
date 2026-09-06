# Security Policy

## Supported Version

The supported code line is the current `main` branch.

## Reporting A Vulnerability

Do not open a public GitHub issue for a suspected security problem involving authentication, private scan photos, account export/delete behavior, billing, webhook handling, or exposed secrets.

Email `teagueporter5@gmail.com` with:

- A short description of the issue
- Reproduction steps
- The affected route, file, or workflow
- Whether any private scan data, payment data, or credentials may be exposed

## Sensitive Data Rules

- Do not send real Stripe keys, Supabase service role keys, webhook signing secrets, or `.env.local` contents.
- Do not attach other people's scan photos.
- Use test-mode Stripe data when reporting billing issues.
- Redact user ids, emails, and signed scan-photo URLs unless they are essential to reproduce the issue.

## Scope

In scope:

- Account authentication and session handling
- Supabase row-level security and private storage access
- Stripe Checkout, Customer Portal, webhook verification, and webhook retry behavior
- Account export and deletion behavior
- Secret handling and logging

Out of scope:

- Medical advice, diagnosis, treatment decisions, or exercise safety claims
- Issues caused by unsupported browser camera permissions or device-specific camera hardware
- Social engineering or physical access to a user's device

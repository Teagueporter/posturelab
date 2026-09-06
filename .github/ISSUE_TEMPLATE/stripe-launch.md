---
name: Stripe launch task
about: Configure PostureLab Pro billing
title: "Configure Stripe products, prices, and webhook"
labels: launch, stripe
assignees: ""
---

## Goal

Turn on Stripe test-mode billing for PostureLab Pro.

## Tasks

- [ ] Create product `Posture Pro Monthly`.
- [ ] Add recurring monthly price, suggested `$4.99`.
- [ ] Create product `Posture Pro Yearly`.
- [ ] Add recurring yearly price, suggested `$29`.
- [ ] Create a restricted runtime key with minimum permissions documented in `PRODUCTION_SETUP.md`:
  - Customers read/write
  - Checkout Sessions write
  - Customer Portal Sessions write
  - Subscriptions read/write
- [ ] Create webhook endpoint: `https://posturelab-six.vercel.app/api/stripe/webhook`.
- [ ] Subscribe webhook to:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] Add publishable key, restricted key, webhook secret, and price IDs to Vercel env vars.

## Verification

- [ ] Test signed-in checkout in Stripe test mode.
- [ ] Test Customer Portal from Account.
- [ ] Test webhook delivery and subscription sync.
- [ ] Confirm duplicate webhook deliveries do not duplicate side effects.
- [ ] Confirm failed/stale webhook events remain retryable.

## Tax Note

Before charging live users, review Stripe Tax registrations. The app intentionally does not enable `automatic_tax` yet.

---
name: Supabase launch task
about: Create and verify the PostureLab Supabase backend
title: "Create Supabase project and apply production schema"
labels: launch, supabase
assignees: ""
---

## Goal

Create the dedicated Supabase backend for PostureLab and apply the production schema.

## Context

- Target organization: `teagueporter's projects`
- Organization ID: `vercel_icfg_qqsgYASShKraJS8qi3PBxC9e`
- Connector-quoted cost: `$0/month` as rechecked on September 6, 2026

## Tasks

- [ ] Create Supabase project named `posturelab` in the target organization after explicit cost approval.
- [ ] Apply `supabase/migrations/20260906052834_initial_production_schema.sql`.
- [ ] Confirm RLS is enabled on every public app table.
- [ ] Confirm `scan-images` storage bucket is private.
- [ ] Confirm storage policies scope objects to the signed-in user's folder.
- [ ] Configure Supabase Auth redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://posturelab-six.vercel.app/auth/callback`
- [ ] Capture project URL, publishable key, and service role key for Vercel env setup.

## Verification

- [ ] `npm run supabase:schema-check`
- [ ] Supabase migration/advisor checks after the project exists.
- [ ] `/api/health` reports Supabase as `configured` after Vercel env vars are added and redeployed.

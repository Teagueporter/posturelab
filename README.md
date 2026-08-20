# PostureLab

PostureLab is a measurement-first posture scan MVP built with Next.js, TypeScript, and MediaPipe. It captures guided posture photos, turns pose landmarks into repeatable measurements, groups those metrics into body-level findings, and builds a corrective exercise plan from the latest scan.

This is a portfolio project and local prototype for posture self-tracking. It is not medical software and does not diagnose medical conditions.

## Features

- Guided front, left-side, right-side, and back upper-body photo capture
- MediaPipe pose-landmark analysis for posture-photo measurements
- Scan quality checks for repeatable setup and cleaner comparison
- Body-level findings for forward head posture, shoulder symmetry, trunk stacking, and upper-back curve proxy signals
- Personalized corrective exercise plan generated from the latest scan
- Scan history, workout completion, check-ins, weekly progress trends, and report views
- LocalStorage persistence with no backend required

## Screenshots

Screenshots or a short demo GIF should be added after the app is published.

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

## Local Development

Requirements:

- Node.js 20.9.0 or newer
- npm

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm test
npm run lint
npm run build
```

Current local verification:

- `npm test`: 15 files passed, 29 tests passed
- `npm run lint`: passed
- `npm run build`: passed with Node `>=20.9.0`

## Project Boundary

PostureLab estimates posture patterns from 2D photo landmarks. The output is intended for personal tracking, exercise planning, and comparing scans over time. It should not be used as medical diagnosis, treatment advice, or a replacement for a licensed clinician.

## Roadmap

- Add screenshots and a short demo GIF
- Add exportable scan reports
- Improve onboarding for camera positioning and lighting
- Add optional cloud sync and authentication
- Add calibration helpers for more consistent measurements
- Deploy a public demo with clear privacy and safety boundaries

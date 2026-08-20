# GitHub Overhaul Agent Prompt

You are helping me overhaul my GitHub after a layoff. Be practical, portfolio-focused, and do the work instead of giving generic advice.

## Goals

1. Make my GitHub profile look credible to recruiters, engineering managers, and collaborators.
2. Publish or polish my PostureLab project as a strong portfolio repo.
3. Improve repository names, READMEs, descriptions, topics, pinned projects, and visible project structure.
4. Keep everything honest: do not exaggerate production usage, medical claims, AI capability, or employment history.

## Current Project To Publish

Project name: `PostureLab`

Description:
Measurement-first posture scan MVP built with Next.js. It captures front, left-side, right-side, and back upper-body posture photos, uses pose landmarks to calculate posture-photo measurements, groups raw metrics into body-level findings, and builds a personalized corrective exercise plan from the latest scan.

Tech:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- MediaPipe Tasks Vision
- Vitest
- LocalStorage persistence

Suggested repo name:
`posturelab`

Suggested one-line GitHub description:
`Posture photo analysis and personalized corrective exercise planning built with Next.js, TypeScript, and MediaPipe.`

Important boundary:
This is for posture self-tracking and exercise planning. It is not medical diagnosis.

## Tasks

1. Inspect my GitHub account and current repositories.
2. Recommend which repos to pin, archive, rename, or improve.
3. Create or update the `posturelab` repo.
4. Add a strong README with:
   - product summary
   - screenshots or demo GIF placeholders if images are unavailable
   - features
   - tech stack
   - local setup
   - verification commands
   - safety/medical boundary
   - roadmap
5. Add useful repo topics, for example:
   - `nextjs`
   - `typescript`
   - `mediapipe`
   - `computer-vision`
   - `health-tech`
   - `posture`
   - `fitness`
6. Make the GitHub profile README more compelling:
   - concise intro
   - current focus
   - selected projects
   - contact links
   - no fluff
7. Create a checklist of final manual items I need to do, such as adding screenshots, enabling Pages/Vercel, or pinning repos if the API cannot do it.

## Style Preferences

- Keep the profile clear and confident, not desperate or gimmicky.
- Emphasize shipped projects, product thinking, data/AI/vision work, and practical engineering.
- Avoid overclaiming. Say "MVP", "prototype", or "local app" where appropriate.
- Prefer short, readable READMEs with good structure.

## Verification

For the PostureLab project, run:

```bash
npm test
npm run lint
npm run build
```

Do not publish generated folders:
- `node_modules/`
- `.next/`
- `out/`
- `.env*`

Do not include unrelated nested projects such as `fleet-manager/`.

# Tiger5 MOTM Tracker (v2)

Premium React dashboard for Tiger5 Man of the Match tracking.

## What is included in v2

- Cover hero section (uses `public/cover/tiger5-cover.jpg`)
- KPI strip (total matches, unique winners, top winner, best streak)
- Leaderboard module
- Recent winners timeline/history
- Filters:
  - Player filter
  - Date presets: All Time, This Month, Last 3 Months, This Year
  - Reset button
- Theme toggle (light/dark) with persistence via localStorage
- WhatsApp CTA card/button
- Avatar support with static image folder and JSON mapping
- Existing ingestion path kept intact (`normalize:data` and `update:chat`)

## Data flow

1. Raw CSV source is normalized into `src/data/matches.json`
2. React app reads `src/data/matches.json`
3. Chat updates write back into `src/data/matches.json`

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run lint
npm run build
```

## Normalize data from source CSV

```bash
npm run normalize:data
```

## Chat update ingestion

```bash
npm run update:chat -- "today's man of the match is Shivansh"
```

This appends/updates today's entry in `src/data/matches.json`.

---

## Avatar upload flow (admin)

### Files/folders used

- Image files: `public/avatars/`
- Mapping JSON: `src/data/avatarMap.json`

### Mapping format

```json
{
  "byDate": {
    "2026-03-14": "anshul.jpg"
  },
  "byWinner": {
    "Shivansh": "shivansh.jpg"
  }
}
```

Rules:
- `byDate` is preferred (exact match date wins).
- If no date match, `byWinner` is used.
- If no mapping found, initials placeholder is shown.

### Tiny admin instruction

Drop image into `public/avatars/` + update `src/data/avatarMap.json`.

---

## Deploy (Vercel)

1. Push latest code to GitHub (`main` branch).
2. In Vercel, import the repo `Sukrittt/tiger5-motm-tracker`.
3. Framework preset: **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy.

For updates, push commits to GitHub and Vercel will auto-redeploy.

## Project structure

- `src/App.jsx` – dashboard UI + filtering + theme + avatar resolution
- `src/data/matches.json` – normalized dataset consumed by UI
- `src/data/avatarMap.json` – date/name to avatar mapping
- `public/avatars/` – winner photos
- `public/cover/tiger5-cover.jpg` – hero cover image
- `scripts/normalizeData.mjs` – CSV normalization script
- `scripts/updateFromChat.mjs` – chat message parser + safe updater

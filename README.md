# Tiger5 MOTM Tracker

Minimal React app to track Tiger5 "Man of the Match" winners.

## Features (MVP)

- Leaderboard (winner counts)
- Recent winners/history by date
- Top stats (total matches, unique winners, top winner)
- Chat-style update ingestion:
  - Parses messages like `today's man of the match is <name>`
  - Safely enforces one winner per date (update if date already exists)

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

> Uses the inbound CSV path provided during setup.

## Chat update ingestion

```bash
npm run update:chat -- "today's man of the match is Shivansh"
```

This appends/updates today's entry in `src/data/matches.json`.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Go to Vercel → New Project → Import GitHub repo.
3. Framework preset: Vite.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy.

## Project structure

- `src/App.jsx` – UI and leaderboard/history logic
- `src/data/matches.json` – normalized dataset consumed by UI
- `scripts/normalizeData.mjs` – CSV normalization script
- `scripts/updateFromChat.mjs` – chat message parser + safe updater

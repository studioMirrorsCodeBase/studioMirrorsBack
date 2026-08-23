# Video Vault (Retro Edition)

A tiny retro-Windows-styled app to paste video links, store them, and view them all later.

## Repo structure

```
video-vault/
├── index.html                    # Page structure / markup
├── css/
│   └── style.css                 # Retro Windows-style visuals
├── js/
│   ├── db.js                     # Data layer (currently localStorage mock)
│   └── app.js                    # UI logic - wires buttons to db.js
├── netlify/
│   └── functions/
│       └── videos.js             # MOCK serverless function (placeholder for real DB)
├── netlify.toml                  # Netlify build/deploy config
└── README.md
```

## How it works right now

- `js/db.js` stores links in the browser's `localStorage`, so the site is fully
  functional the moment it's deployed - no database setup required.
- `netlify/functions/videos.js` exists as a **mock/dummy** serverless function.
  It's not called yet, but the folder is wired up in `netlify.toml` so Netlify
  will deploy it automatically, ready for you to connect a real database later.
- Every important step (adding a link, reading links, rendering the list) logs
  to the browser console with `[DB READ]`, `[DB WRITE]`, `[ADD ...]`,
  `[VIEW ...]`, `[RENDER]` tags so you can trace exactly what's happening.

## Deploying to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project** → pick this repo.
3. Build settings: leave the publish directory as `.` (root) - already set in `netlify.toml`.
4. Deploy. That's it - no environment variables or database needed yet.

## Upgrading to a real database later

1. Connect **Netlify Database** (or any Postgres provider) to this site.
2. Replace the dummy logic in `netlify/functions/videos.js` with real
   queries against that database.
3. In `js/db.js`, swap the localStorage code in `getVideos()` and
   `addVideo()` for the commented-out `fetch('/.netlify/functions/videos')`
   examples already included in that file.
4. `js/app.js` requires **no changes** - it only talks to `DB.getVideos()`
   and `DB.addVideo()`, regardless of what's powering them underneath.

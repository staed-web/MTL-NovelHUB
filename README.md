# NovelHub

A responsive novel discovery, translation, and reading app built with React, Vite, and Express. Requires Node.js 24.

## Run

```sh
npm ci --cache /tmp/novelhub-npm
npm run dev
```

The application listens on port 3000 (override with `PORT`). `npm run build` creates the production bundle; `npm start` serves it and the API.

## Features

- Search the curated sample catalog by title, author, and tags; filter original language and sort ratings or chapter count.
- Bookmark novels into a persistent local library with Fantasy and Romance collections.
- Import a public HTML chapter URL or paste Chinese, Japanese, or Korean text.
- Translate into English, Spanish, French, German, Hindi, Portuguese, or Indonesian using the MyMemory API.
- Read imported translations with adjustable text size and light/dark themes. Catalog reader previews use clearly labeled demo prose.

## Scope and external requirements

The catalog is illustrative, not a licensed or live novel index. Imports extract a single chapter; they do not crawl whole books. Login, paywall, JavaScript-only pages, and anti-bot protections are not bypassed. Use content you have permission to access.

MyMemory is a free external translation provider with daily quotas and varying translation quality. The backend splits text into requests below the provider's byte limit. A 15,000-character input limit applies. No API credential is required; reliable high-volume production translation requires a separately selected paid provider. Text is sent to MyMemory only on translation, not stored by this app. Bookmarks and preferences are stored in the browser, not synchronized accounts.

Network access is needed to `api.mymemory.translated.net` and the host of each imported chapter. Artwork and fonts are bundled locally. Auto-detection uses Unicode script clues; Japanese text containing only kanji must be selected manually. The server supports the environment's standard HTTP proxy configuration. Import checks reject local/private destinations and validate redirects; deploy behind an egress firewall for defense in depth against malicious DNS and redirects. Add authentication, request throttling, a durable catalog, and account storage before a public production launch.

## Checks

Run `npm test` with the application running to exercise the API validation and HTTP readiness. `npm run build` validates the production frontend bundle.

## Vercel hosting

Import this GitHub repository into Vercel. The committed `vercel.json` builds the Vite frontend and serves Express through `api/index.js`; no API key is required. Use Node.js 24. `FRONTEND_ORIGINS` may contain a comma-separated list of allowed browser origins; it defaults to `https://staed-web.github.io` for the GitHub Pages copy. Backend translations are subject to provider quotas and function time limits; prefer short chapters. The app's backend is not hosted by GitHub Pages.

## GitHub Pages hosting

In GitHub **Settings → Pages → Build and deployment**, select **GitHub Actions**. The committed workflow deploys the frontend when `main` changes or when manually run. The expected URL after a successful deployment is `https://staed-web.github.io/MTL-NovelHUB/`.

To connect the Pages frontend to the Vercel backend, set the repository Actions variable `VITE_API_BASE_URL` to your verified Vercel origin (e.g. `https://your-project.vercel.app`, with no trailing path), then rerun the Pages workflow. Until that is configured, Pages provides discovery, bookmarks, and reader previews with a clear message that translation/import are not connected. The Vercel copy uses its own same-origin API and does not need this variable.

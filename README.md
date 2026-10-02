# NovelHub

A responsive novel discovery, translation, and reading app built with React, Vite, and Express. Requires Node.js 22 or later.

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

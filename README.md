# Space Trader PWA

A faithful reimagining of the classic Palm OS game **Space Trader** (2002, Pieter Spronck), built as a Progressive Web App — playable offline on iPhone and Android.

## Play

→ **[Play online](https://IlyaMoskva.github.io/space-trader/)**

Or install on iPhone: open the link in Safari → Share → Add to Home Screen.

## Features

- 50-system procedurally generated galaxy with connectivity guarantee
- Dynamic market prices (tech level + government + news events)
- 10 ship types, weapons, shields, gadgets, mercenaries
- Quests: Dragonfly, Alien Invasion, Wild, Warn the Doctor
- Special encounters: Alien Learning Machine, Elite Captains, Marie Celeste
- Full offline play via PWA service worker
- Auto-save to localStorage

## Dev setup

```bash
npm install
npm run dev
```

## Build & deploy

Push to `main` — GitHub Actions builds and deploys to GitHub Pages automatically.

Before first deploy:
1. In `vite.config.js`, set `base: '/YOUR_REPO_NAME/'`
2. In GitHub repo Settings → Pages → Source: **GitHub Actions**

## Credits

Original game by [Pieter Spronck](https://spronck.net/spacetrader/), released under GPL.  
This port built with React + Vite + vite-plugin-pwa.

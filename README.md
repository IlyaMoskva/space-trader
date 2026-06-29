# Space Trader PWA v0.23.0

A faithful reimagining of the classic Palm OS game **Space Trader** (2002, Pieter Spronck), built as a Progressive Web App — installable on iPhone and Android, playable fully offline.

🎮 **[Play online](https://ilyamoskva.github.io/space-trader/)**

**Install on iPhone:** Safari → Share → Add to Home Screen → works offline.

---

## What is Space Trader?

Trading RPG originally for Palm OS. Start with a Gnat-class ship, pulse laser, 1000 cr on planet Lave. Goal: accumulate 500,000 cr, buy a moon, retire.

---

## What's in this version

### Galaxy
- 50 procedurally generated systems via **Poisson Disk Sampling + bridge repair**
- Even spread across the map — no clustering around Lave
- Every system reachable from Lave; all ships jump 11–17 pc

### Ships
All 10 ships have unique **Star Wars–style SVG pixel art** silhouettes. Enemy ships are mirrored in combat.

| Ship | Jump | Slots W/S/G/C | Price |
|---|---|---|---|
| Flea | 17 pc | 0/0/1/0 | 2,000 cr |
| Gnat | 14 pc | 1/0/1/0 | start |
| Firefly | 17 pc | 1/1/1/1 | 25,000 cr |
| Mosquito | 13 pc | 2/1/1/1 | 30,000 cr |
| Bumblebee | 15 pc | 1/2/2/2 | 40,000 cr |
| Beetle | 12 pc | 2/1/3/2 | 60,000 cr |
| Hornet | 16 pc | 3/2/2/2 | 100,000 cr |
| Grasshopper | 15 pc | 2/2/3/3 | 150,000 cr |
| Termite | 11 pc | 1/3/3/3 | 225,000 cr |
| Wasp | 14 pc | 3/2/2/3 | 300,000 cr |

### Economy — three-layer pricing
1. **Tech profile** — each commodity has produced/consumed tech levels
2. **Government modifier** — Anarchy subsidises everything; Theocracy marks up drugs ×2.2
3. **Live stock curve** — buying raises price, selling lowers it

**14 planet events** move prices for 2–8 days. News feed shows neighbouring system events with price effects and days remaining — click to plot course.

### Skills

| Skill | Effect |
|---|---|
| **Pilot** | +4%/level evasion · −4%/level police notice |
| **Fighter** | +5%/level hit chance |
| **Trader** | Equipment sell price 70% + 2%/level |
| **Engineer** | Repair −5%/level · auto-repair 3%/level chance per jump |

Gain: beat stronger enemies (+skill), Elite Captains (trade gear), Alien Machine (3000 cr), Alien Tonic (500 cr), quest rewards.

### Combat
- **Pirate scaling** by your actual gear — never sends Elite ships at a rookie
- **Wave attacks** in high-pirate systems (1–3 waves)
- **Pirate flee** when hull < 25%; chance depends on relative Pilot skills
- Shields shown per-slot: ⬡ Energy (blue), ◆ Reflective (gold), ⚡ Lightning (gold)

### Reputation (−10 to +10)

| Range | Label | Effect |
|---|---|---|
| +7..+10 | LEGEND | Police lenient; pirates come angrier |
| +4..+6 | RESPECTED | — |
| 0..+3 | NEUTRAL | — |
| −1..−3 | SUSPECT | Police inspect more often |
| −4..−6 | WANTED | Police attacks on sight |
| −7..−10 | PIRATE ⚠ HUNTED | Bounty hunters spawn; weak pirates flee |

Attack traders (rep −2), pay fines in Bank, surrender to police (rep +3).

### Contracts (JOBS tab)
| Type | Mechanic | Reward |
|---|---|---|
| 📦 Delivery | Cargo in hold, deadline = distance-based | Distance-based |
| ⚔️ Extermination | Kill N pirates via PATROL | 800–2000 cr/kill |
| 🎯 Assassination | Boss fight on arrival | 5000–15000 cr |

### Mercenaries (JOBS tab)
0–3 available per planet, based on population and character. High-tech planets attract engineers/traders; lawless planets attract fighters. Skill comparison shows where a merc improves your effective skill.

### Story Quests (hidden until revealed via news)
| Quest | Reward |
|---|---|
| 🐉 Dragonfly | Destroy experimental ship → Lightning Shield |
| 👾 Alien Invasion | Warn planet in time → Fuel Compressor |
| 🔬 Warn the Doctor | Race 12 days → Portable Singularity |
| 🤝 Wild | Smuggle with Beam Laser → +1 Pilot |

---

## Tech stack

React 18 · Vite 5 · vite-plugin-pwa · VT323 pixel font · localStorage

### Project structure
```
src/
├── App.jsx              # root — CSS + App() only (~238 lines)
├── constants/           # ships, commodities, world, events, mercenaries
├── engine/              # pure functions — no React
│   ├── utils.js         # rnd, pick, dist, fuelCost, isServiceBanned
│   ├── galaxy.js        # generateGalaxy (Poisson + bridge repair)
│   ├── market.js        # pricing, events, stock
│   ├── combat.js        # effectiveSkills, generatePirateShip, encounter, round
│   ├── contracts.js     # generate, arrival, kills, pirate jobs
│   ├── quests.js        # generate, hints, arrival
│   ├── travel.js        # applyTravel, applyPatrol, buildNews, getTravelState
│   └── newGame.js       # createNewGame
├── hooks/               # useGameState, useCombat
├── components/          # ShipSprite, GalaxyMap, StatusBar, MenuModal, QuestPopup, StarsCanvas, SkillBar
├── screens/             # TitleScreen, GameScreen
└── tabs/                # TradeScreen, TravelScreen, ShipScreen, BankScreen, ContractsScreen, LogScreen, EncounterScreen
```

## Dev

```bash
npm install
npm run dev
npm test          # 54 checks: 34 game logic + import checker + 20 travel engine
npm run build     # runs tests first, then vite build
```

## Deploy

Push to `master` → GitHub Actions → `gh-pages` branch.

**Settings → Pages → Source → gh-pages → / (root)**

---

## Credits

Original game by [Pieter Spronck](https://spronck.net/spacetrader/), GPL.
PWA port: React + Vite. System names from Elite (1984).

See [CHANGELOG.md](CHANGELOG.md) for full history.

# Space Trader PWA v0.3.0

A faithful reimagining of the classic Palm OS game **Space Trader** (2002, Pieter Spronck), built as a Progressive Web App — installable on iPhone and Android, playable fully offline.

🎮 **[Play online](https://ilyamoskva.github.io/space-trader/)**

**Install on iPhone:** Safari → Share → Add to Home Screen → works offline.

---

## What is Space Trader?

Trading RPG originally for Palm OS. Start with a Gnat-class ship, pulse laser, 1000 cr on planet Lave. Two ways to win: retire peacefully on the Moon, or save the galaxy from alien invasion.

---

## What's in this version

### Galaxy
- 50 procedurally generated systems via **Poisson Disk Sampling + bridge repair**
- Even spread across the map — no clustering around Lave
- Every system reachable from Lave; all ships jump 11–17 pc

### Ships
All 10 human ships have unique **pixel-art SVG silhouettes** (insect-tech style). The 4 alien ship types use a distinct organic/biomechanical visual language so they're instantly recognizable as hostile in combat.

| Ship | Jump | Hull | Slots W/S/G/C | Price |
|---|---|---|---|---|
| Flea | 17 pc | 25 | 0/0/1/0 | 2,000 cr |
| Gnat | 14 pc | 100 | 1/0/1/0 | start |
| Firefly | 17 pc | 130 | 1/1/1/1 | 25,000 cr |
| Mosquito | 13 pc | 150 | 2/1/1/1 | 30,000 cr |
| Bumblebee | 15 pc | 150 | 1/2/2/2 | 40,000 cr |
| Beetle | 12 pc | 150 | 2/1/3/2 | 60,000 cr |
| Hornet | 16 pc | 200 | 3/2/2/2 | 100,000 cr |
| Grasshopper | 15 pc | 200 | 2/2/3/3 | 150,000 cr |
| Termite | 11 pc | 200 | 1/3/3/3 | 225,000 cr |
| Wasp | 14 pc | 200 | 3/2/2/3 | 300,000 cr |

### Economy — three-layer pricing
1. **Tech profile** — each commodity has produced/consumed tech levels
2. **Government modifier** — Anarchy subsidises everything; strict governments mark up drugs
3. **Live stock curve** — buying raises price, selling lowers it

**14 planet events** move prices for 2–8 days. News feed shows neighbouring system events with price effects and days remaining — click to plot course.

### Skills

| Skill | Effect |
|---|---|
| **Pilot** | +4%/level evasion · −4%/level police notice · improves alien flee chance |
| **Fighter** | +5%/level hit chance |
| **Trader** | Equipment sell price 70% + 2%/level |
| **Engineer** | Repair −5%/level · auto-repair on jump · ≥5 gives +1 hull/round in alien combat, ≥8 gives +2/round |

Gain: beat stronger enemies (+skill), Elite Captains (trade gear), Alien Learning Machine (3000 cr), Alien Tonic (500 cr), quest rewards.

### Combat
- **Pirate scaling** by your actual gear — never sends Elite ships at a rookie
- **Wave attacks** in high-pirate systems (1–3 waves)
- **Pirate flee** when hull < 25%; chance depends on relative Pilot skills
- Shields shown per-slot: ⬡ Energy (blue), ◆ Reflective (gold), ⚡ Lightning (gold, quest-only)
- **Attacking traders**: rep −1 to open fire, another −1 on the kill (−2 total); their full cargo hold (3–5 tons) spills out guaranteed
- **Killing pirates or aliens rewards reputation** (+1 each) — only civilians and police cost rep

### Reputation (−10 to +10)

| Range | Label | Effect |
|---|---|---|
| +7..+10 | LEGEND | Police lenient; pirates come angrier |
| +4..+6 | RESPECTED | — |
| 0..+3 | NEUTRAL | — |
| −1..−3 | SUSPECT | Police inspect more often |
| −4..−6 | WANTED | Police attacks on sight; pirate contracts unlock |
| −7..−10 | PIRATE ⚠ HUNTED | Bounty hunters spawn; weak pirates flee |

**Recovery paths**: passive (+1/10 days, blocked by unredeemed murders), clean police inspections (accumulating chance), Shadow Broker (pays for kill-record cleanup), legal fees at the Bank, completing government contracts.

**Service restrictions**: strict governments (Communist/Confederation/Democracy/Corporate State) refuse service at rep ≤ −3 — except during a war event, or for hull/shield repair (available at 3× price everywhere).

### Contracts (JOBS tab)
| Type | Mechanic | Reward |
|---|---|---|
| 📦 Delivery | Cargo in hold, deadline = distance-based | Distance-based |
| ⚔️ Extermination | Kill N pirates via PATROL | 800–2000 cr/kill |
| 🎯 Assassination | Boss fight on arrival | 5000–15000 cr |
| 🏴 Pirate jobs | Available at rep ≤ −4: patrol/freighter/diplomat hits | Credits + equipment |

### Mercenaries (JOBS tab)
0–3 available per planet, based on population and character. High-tech planets attract engineers/traders; lawless planets attract fighters. Skill comparison shows where a merc improves your effective skill. During an active alien invasion, passing ships sometimes broadcast distress calls instead of crew rumors.

---

## The Alien Invasion storyline

Quests unlock progressively based on player experience — no "save the galaxy" thrown at a rookie on day one.

| Act | Unlocks when | What opens up |
|---|---|---|
| 1 | Game start | Trading, pirates, ordinary contracts |
| 2 | 5 pirate kills OR 30 days | 🐉 Dragonfly quest, 🤝 Wild quest, atmospheric news hints |
| 3 | Fighter ≥4 + good weapon + non-starter ship | 👾 Alien Invasion quest (deadline starts at reveal, not creation) |
| 4 | 3+ alien kills OR invasion active | War-time contracts, scientist NPC (buys artifacts at premium) |
| 5 | 10+ alien kills + 5+ artifacts | 💥 Mothership quest — the final battle |

### How the invasion starts
The **Alien Invasion** quest gives a fair warning window (12–18 days from when it's revealed, not from game start) to defend a target system. Arrive in time and you fight off 3 scout waves:
- **Win**: Fuel Compressor reward, the system gets fortified (police +2) — but the invasion starts anyway, just in a different system
- **Lose or ignore the deadline**: the system you were meant to defend becomes ground zero

This is deliberate — one win doesn't stop a galaxy-wide invasion, it just changes where it begins.

### Occupation mechanics
Each system can host up to 15 aliens depending on planet size (Tiny=3 → Gargantuan=15).

| Stage | Trigger | Market | Repair | Shields |
|---|---|---|---|---|
| Scouted | 1–4 aliens | Open | Normal | Normal |
| Dictatorship | 5+ aliens, system not yet aged out | Closed | OK (tech≥2) | OK (tech≥2) |
| Anarchy | Small planets immediately; Medium at 30 days; Large/Huge at 60 days | Closed | OK (tech≥2) | **None** |

Every 3 days: aliens reinforce (8–25% chance, faster as occupation ages), NPC defenders fight back (police×12% + tech×4% per roll, multiple rolls on well-defended systems — can fully liberate a system), and fully occupied systems (5+) spread to the nearest uninfected neighbour. **30+ occupied systems = game over.**

### Alien ships

| Ship | Hull | Weapons | Special | Flee difficulty |
|---|---|---|---|---|
| Scout | 80 | 1× pulse | Fast — hard to escape | Hard |
| Cruiser | 180 | 2× pulse | Plasma burst (60 dmg, 25%, bypasses shields) | Easy |
| Dreadnought | 350 | 3× pulse | Plasma burst (100 dmg, 20%) | Easy (slow) |
| Mothership | 350 | 3× pulse | Plasma burst (70 dmg, 15%); hitAccuracy 0.6 — less accurate vs maneuverable ships | Easy (slow) |

All alien ships regenerate hull each combat round unless you carry a **Regen Inhibitor**.

### Anti-alien equipment
- **Alien Disruptor** (weapon, tech 7+, 45,000 cr) — deals 2× damage vs aliens
- **Regen Inhibitor** (gadget, tech 8+, 10 artifacts required, 60,000 cr) — blocks alien hull regen entirely
- **Cloaking Device** (gadget, tech 7+, 5 artifacts required, 35,000 cr) — +40% flee chance vs aliens
- **Repair Droid** (gadget, tech 6+, 30,000 cr) — +3 hull/round during combat, stacks with Engineer skill

### Alien Artifacts
Drop on kill (40–80% chance depending on ship size). Sell at any unoccupied planet: 3,000 cr regular, 5,000 cr at hi-tech (tech≥6) systems with a research scientist. Accumulate toward gadget unlocks.

### The Mothership — final battle
Reached via a 3-wave encounter: two Alien Cruiser escorts, then the Mothership itself. Combat simulation (n=200 per scenario) shows a well-equipped Wasp with Military Laser + Alien Disruptor + dual shields + Regen Inhibitor wins **64–75%** of full encounters — Lightning Shield (quest reward) is a nice-to-have, not required.

**Destroying the Mothership ends the invasion globally** and triggers a separate ending: an honorable military discharge, distinct from the peaceful Moon retirement.

### If you lose your ship
The **Escape Pod** gadget saves your life but not your stuff: ship and equipment destroyed, cargo lost in space, crew evacuated and disbanded. You keep credits, skills, and alien artifacts (small enough to fit in a suit pocket). If left with under 1,000 cr, the government tops you up to 1,000 — a survival stipend so you're not stranded with literally nothing.

---

## Two endings

| | 🌙 Moon retirement | 🎖️ Military victory |
|---|---|---|
| Path | Economic — accumulate wealth | Combat — destroy the Mothership |
| Requirement | Net worth (credits+cargo+ship−debt) ≥ 500,000 cr, with ≥500,000 cr cash on hand | Win the full Mothership encounter |
| Tone | Quiet luxury retirement on Utopia | Parade, honors, Hall of Heroes |

---

## Tech stack

React 18 · Vite 5 · manual Service Worker (better iOS support than vite-plugin-pwa) · VT323 pixel font · localStorage

### Project structure
```
src/
├── App.jsx              # root — CSS + App() only
├── constants/           # ships, commodities, world, events, mercenaries, aliens
├── engine/              # pure functions — no React
│   ├── utils.js         # rnd, pick, dist, fuelCost, isServiceBanned, applyEscapePod
│   ├── galaxy.js        # generateGalaxy (Poisson + bridge repair)
│   ├── market.js        # pricing, events, stock
│   ├── combat.js        # effectiveSkills, generatePirateShip, encounter generation
│   ├── contracts.js     # generate, arrival, kills, pirate jobs
│   ├── story.js         # getStoryAct, questUnlocked — progressive narrative gating
│   ├── quests.js        # generate, hints, arrival (act-gated)
│   ├── aliens.js        # invasion tick, occupation, alien combat, artifacts
│   ├── travel.js        # applyTravel, applyPatrol, buildNews, getTravelState
│   └── newGame.js       # createNewGame
├── hooks/               # useGameState, useCombat
├── components/          # ShipSprite (human + alien), GalaxyMap, StatusBar, MenuModal, QuestPopup, StarsCanvas, SkillBar
├── screens/             # TitleScreen, GameScreen (handles all ending screens)
└── tabs/                # TradeScreen, TravelScreen, ShipScreen, BankScreen, ContractsScreen, LogScreen, EncounterScreen
scripts/
├── bump-sw-version.cjs   # auto-bumps SW cache name on npm version
└── inject-sw-assets.cjs  # injects hashed JS/CSS paths into dist/sw.js post-build
public/
└── sw.js                 # manual service worker
```

## Dev

```bash
npm install
npm run dev
npm test          # 92 checks: 34 game logic + import checker + 20 travel + 38 alien/story
npm run build     # runs tests first, then vite build + SW asset injection
npm version patch # bumps version + SW cache name automatically
node test-combat-sim.cjs   # combat balance simulation (win/loss rates per scenario)
```

## Deploy

Push to `master` → GitHub Actions → `gh-pages` branch.

**Settings → Pages → Source → gh-pages → / (root)**

---

## Credits

Original game by [Pieter Spronck](https://spronck.net/spacetrader/), GPL.
PWA port: React + Vite. System names from Elite (1984).

See [CHANGELOG.md](CHANGELOG.md) for full history.

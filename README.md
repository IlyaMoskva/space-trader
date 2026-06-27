# Space Trader PWA

A faithful reimagining of the classic Palm OS game **Space Trader** (2002, Pieter Spronck), built as a Progressive Web App — installable on iPhone and Android, playable fully offline.

## Play

→ **[Play online](https://ilyamoskva.github.io/space-trader/)**

**Install on iPhone:** Safari → Share → Add to Home Screen → works offline.

---

## What is Space Trader?

Trading RPG originally for Palm OS (2002). Start with a Gnat-class ship, pulse laser, 1000 cr on planet Lave. Goal: accumulate 500,000 cr, buy a moon, retire.

---

## Faithful to the original

- Gnat start, 1000 cr, planet Lave
- 10 ship types (Flea → Wasp) with weapon / shield / gadget / crew slots
- 11 commodities including 2 illegal
- Tech levels 0–8 and 8 government types affecting prices
- Police inspections, pirate combat, bank with 1%/day interest
- Escape Pod, story quests, win condition

---

## What's new

### Ships
All 10 ships have unique **Star Wars–style SVG pixel art** silhouettes — Flea as a dart, Gnat as X-wing, Mosquito as TIE Interceptor, Wasp as Imperial Star Destroyer. Enemy ships are mirrored in combat. Energy shields show as blue bars, reflective shields as gold.

### Galaxy
- 50 procedurally generated systems per game, clustered, Lave at centre
- **Connectivity guaranteed**: every system reachable from Lave at Gnat range (14 pc); 2+ systems always within Flea range (5 pc)
- Full-galaxy map auto-fits to actual system spread; jump-range circle; Local/Full toggle

### Economy — three-layer pricing
1. **Tech profile**: each commodity has `produced` and `consumed` tech levels — agricultural planets produce food cheaply, Hi-Tech planets produce robots cheaply
2. **Government modifier**: Anarchy subsidises everything; Communist subsidises raw/medicine; Democracy regulates weapons; Theocracy marks up drugs ×2.2
3. **Live stock curve**: buying depletes stock and raises price; selling adds to stock and lowers it; refreshes 35% on revisit

**14 planet events** move prices for 2–8 days — War, Drought, Plague, Harvest, Tech Boom, Strike, Pirate Raids, Economic Boom, Ore Strike, Drug Crackdown, Cold Winter, Flood, Festival, Industrial Accident. Events shown in news feed with `⚠`.

**P/L column** in trade screen shows live profit/loss per unit vs average buy price.

### Skills — all four matter

| Skill | Effect |
|---|---|
| **Pilot** | +4%/level evasion · −4%/level police notice |
| **Fighter** | +5%/level hit chance |
| **Trader** | Equipment sell price 70% + 2%/level (max 90%) |
| **Engineer** | Repair −5%/level · auto-repair 3%/level chance per jump |

Ways to improve: Elite Captains (6 named, trade gear for +1), Alien Learning Machine (3000 cr, 60% chance), Alien Tonic (500 cr, 40%), quest rewards (Wild → +1 Pilot).

### Mercenaries
8 unique crew members; daily wages per jump; effective skill = max(yours, best merc), shown as `4/9`; crew slots per ship (Flea/Gnat: 0, Wasp: 3).

### Pirate scaling

Threat = system tech + kills/5:

| Label | Ships | Weapon | Shields |
|---|---|---|---|
| WEAK | Flea–Firefly | Pulse | — |
| MODERATE | Gnat–Bumblebee | Pulse | — |
| ARMED | Mosquito–Hornet | Beam | Energy |
| DANGEROUS | Beetle–Termite | Beam | Energy |
| ELITE | Grasshopper–Wasp | Military | Reflective |

Bounty scales with ship class: Flea 300–600 cr, Wasp 2000–2300 cr.

### Contracts (JOBS tab)

1–3 per planet, refreshed on visit, max 3 active, one of each type per board:

| Type | Mechanic | Reward |
|---|---|---|
| 📦 Delivery | Cargo occupies hold, time limit, ~30% penalty | Distance-based |
| ⚔️ Extermination | Kill N pirates; use **PATROL** on WARP tab | 800–2000 cr/kill |
| 🎯 Assassination | Named boss fight on arrival | 5000–15000 cr |

### Trader encounters
Split into **THEY SELL** (legal goods at slight discount) and **THEY BUY** (anything including illegal, sometimes at premium). Safe way to offload contraband.

### Story quests

| Quest | Reward |
|---|---|
| 🐉 Dragonfly | Boss fight → Lightning Shield |
| 👾 Alien Invasion | Warn planet → Fuel Compressor (+3 pc) |
| 🔬 Warn the Doctor | Race 12 days → Portable Singularity |
| 🤝 Wild | Smuggle with Beam Laser+ → +1 Pilot |

---

## Tech stack

React 18 · Vite 5 · vite-plugin-pwa · VT323 pixel font · localStorage only

## Dev

```bash
npm install
npm run dev
npm test        # 33 game logic tests
npm run build
```

## Deploy

Push to `master` → GitHub Actions builds and deploys to `gh-pages`.

**Settings → Pages → Source → Deploy from a branch → `gh-pages` → `/ (root)`**

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Credits

Original game by [Pieter Spronck](https://spronck.net/spacetrader/), GPL.
PWA port: React + Vite. System names from Elite (1984).

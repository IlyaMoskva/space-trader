# Changelog

All notable changes to Space Trader PWA.

---

## [0.4.0] — Ships, Quests, Bounties, New planet events

### Added
- **Star Wars–style ship sprites** — all 10 ships replaced with unique SVG pixel art silhouettes:
  Flea (dart), Gnat (X-wing), Firefly (A-wing), Mosquito (TIE Interceptor),
  Bumblebee (Millennium Falcon), Beetle (CR90 Corvette), Hornet (Venator),
  Grasshopper (Mon Calamari), Termite (Nebulon-B), Wasp (Imperial Star Destroyer)
- **ShipSprite component** — SVG drawn inline, `flip` prop mirrors enemy ship in combat
- Ships displayed in: combat screen (52px, enemy flipped), ship status (32px), shipyard (28px), menu (18px)
- **Shields shown in combat** — energy shield (blue bar ⬡) and reflective shield (gold bar ◆) displayed separately for both sides
- **Pirate scaling** — threat score = system tech + kills/5; WEAK→ELITE labels in combat
- **Threat label + enemy weapon** shown before fighting
- **All 4 skills have real effects**:
  Pilot: evasion + police notice reduction;
  Fighter: hit chance;
  Trader: equipment sell price +2%/level;
  Engineer: repair discount −5%/level + auto-repair in flight
- Skill effects described under each skill in SHIP → STATUS
- **Contracts system** (JOBS tab) — 1–3 per planet, max 3 active, one of each type per board, unique target systems:
  📦 Delivery, ⚔️ Extermination, 🎯 Assassination
- **PATROL button** on WARP tab — costs 1 day, guarantees pirate encounter in contract target system
- **Sell weapons/shields** from ship screen with Trader bonus applied
- **Trader encounter** fully implemented — split into THEY SELL / THEY BUY sections;
  buys illegal goods (no police risk); prices show ↓/↑ vs base
- **4 new planet events**: Cold Winter (furs+, medicine+, food+), Flood (water glut, food+, machines+),
  Festival (games+, food+), Industrial Accident (machines+, robots+, medicine+)
- **Contract history** shows last 5 (newest first), with from/to system names and reward
- **Equipment auto-sold** when buying ship with fewer slots — sells cheapest first (sorted by price), Trader bonus applied
- **Bounty scales with ship class** — Flea 300–600 cr, Wasp 2000–2300 cr

### Balanced
- Extermination reward: 800–2000 cr/kill (was 300–700)
- Assassination reward: 5000–15000 cr (was 1500–5000)
- Plague medicine effect: ×1.7 (was ×2.2 — too easy to exploit)
- Random pirate bounty: scaled by ship tier (was flat 50–500 cr)

### Fixed
- Duplicate `arrivedSys` variable — Vite build failure
- `PARSEC_SCALE` declared after `generateGalaxy` — silent `ReferenceError` on New Game
- `bfsReachable` crashing on `undefined` from `Array.find`
- Galaxy connectivity repair runs up to 1000 iterations
- Duplicate system names (Uszaa, Reorte, Riedquat, Maregees)
- New Game button `disabled` blocked onClick
- No way to sell or replace weapons/shields
- Three contracts on one board could be same type targeting same system
- Contract history showed oldest 5 instead of newest 5
- Buying a new ship cleared all equipment (now transfers what fits, sells rest)
- Trader encounter showed only "CONTINUE" button with no actual trading
- `minTech` for weapons/shields now explicit — no more index-based hack

---

## [0.3.0] — Skills, Mercenaries, Quests

### Added
- **Mercenary system**: 8 named crew, daily wages per jump, effective skill `4/9`, crew quarters per ship
- **Elite Captains**: 6 named — trade gear for +1 skill
- **Alien Learning Machine**: 3000 cr, 60% success
- **Portable Singularity**: instant jump to any system (Doctor quest), usable in SHIP → STATUS
- **Crew quarters** (`slots_c`) on all ships; smaller ship auto-fires excess crew
- **JOBS tab** in main navigation

### Fixed
- Quest PLOT COURSE pre-selects target on map
- `function QuestsScreen` lost during refactor

---

## [0.2.0] — Economy & Galaxy

### Added
- **Dynamic market pricing**: tech profile × gov modifier × stock curve
- **10 events** affecting prices (War, Drought, Plague, etc.)
- **P/L column** in trade screen
- **Off-market barter** at 65% base
- **Galaxy connectivity guarantee**: BFS repair, Flea range guarantee
- **Dynamic map bounding box**
- **50 systems**, clustered generation; Lave fixed at centre
- Quests: Dragonfly, Alien Invasion, Wild, Warn the Doctor
- Special encounters: Marie Celeste, Famous Captain, Sealed Cargo, Alien Tonic, Mercenary Offer

### Fixed
- Galaxy coordinates 0–2000, proper parsec scale
- Jump range circle aspect ratio
- System names all starting with "A"

---

## [0.1.0] — Initial prototype

### Added
- React PWA scaffold (Vite + vite-plugin-pwa)
- Procedural galaxy, 22 systems
- Trading, 10 ship types, combat, police, bank, escape pod
- Auto-save to localStorage, menu, starfield

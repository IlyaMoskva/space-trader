# Changelog

All notable changes to Space Trader PWA.

---

## [Unreleased] — current

### Architecture
- **Modular refactor** — monolithic App.jsx (4100 lines) split into 32 files:
  - `constants/` — ships, commodities, world data, events, mercenaries
  - `engine/` — pure functions: galaxy, market, combat, contracts, quests, utils
  - `hooks/` — useGameState (localStorage), useCombat (fight/flee/surrender)
  - `components/` — ShipSprite, GalaxyMap, StatusBar, MenuModal, QuestPopup, StarsCanvas, SkillBar
  - `screens/` — TitleScreen, GameScreen
  - `tabs/` — TradeScreen, TravelScreen, ShipScreen, BankScreen, ContractsScreen, LogScreen, EncounterScreen
- **Static import checker** (`test-imports.cjs`) — finds missing imports before deploy
- `npm test` runs both game logic tests (33) and import checker

### Galaxy
- **Poisson Disk Sampling + bridge repair** — even spread, no clustering around Lave
- Min separation 12 pc, MIN_JUMP=11 pc, MAX_JUMP=17 pc (all ships)
- BFS connectivity check → find components → insert bridge planets → repeat until connected
- **Flea jump 5 pc → 17 pc** — diplomatic courier with hyperdrive; eliminates special seeding

### Combat
- **Pirate scaling by player power** — threat capped at `playerPower + 2`; playerPower = fighter/10×4 + weaponTier + shipTier/9×3
- Never sends Elite ships at a rookie with a Pulse laser
- **Pirate flee** — when hull < 25%, escape chance = 15% + 5%/level above player Pilot; partial bounty on escape
- **Wave attacks** — pirates=1: rarely 2 waves; pirates=2: 1–2; pirates=3: 1–3; indicator shown in combat
- **Skill gain on win** — base 5% + 10%/level enemy exceeds player power, max 50%
- **Combat blocks tabs** — nav hidden during any encounter; stale encounter cleared on jump

### Reputation (−10 to +10)
- Shown as 10-bar gauge in StatusBar: LEGEND / RESPECTED / NEUTRAL / SUSPECT / WANTED / PIRATE ⚠ HUNTED
- **+7..+10**: pirates come ANGRY — better equipped
- **−7..−10**: weak pirates may flee on sight (cowardChance)
- **−6..−4**: police attacks on sight (hostile encounter)
- **−5 and below**: bounty hunters spawn; scale with rep severity
- **ATTACK button** on trader encounter at rep ≤ −3 (rep −2, policeRecord +1)
- **Surrender to police** → fine + jail days + rep +3
- **PAY FINE** in Bank → |rep| × 1000 cr → rep +3

### Contracts (JOBS tab)
- **Extermination deadline** = travelDays + killCount×2 + 2 (min 8) — always enough time
- **Assassination auto-triggers** boss fight on arrival at target system
- **PATROL guaranteed** pirate encounter; system with active contract always has pirates
- Deadline checked on every jump (not just on arrival)
- Contract history shows last 5 newest first with from/to systems and reward

### Mercenaries (JOBS tab)
- **Planet-based availability** — 30% base chance + 6%/size level; changes every 3 days
- **Civilian bias** on high-tech/large planets (engineers, traders, pilots)
- **Fighter bias** on lawless/small planets (ex-pirates, military renegades)
- Skill comparison table shows your effective vs merc — green ▲ where merc helps
- Hire/fire from JOBS; mercs shown in SHIP → STATUS with effective skill `4/9`

### Quests
- **All 4 quests start hidden** — revealed through news feed (60% chance per arrival)
- Quest hints appear in NEWS → LOG with `►` prefix; "New special contract — check JOBS"
- **QUESTS tab removed** — quests shown in JOBS as ✦ Special Contracts
- Wild quest shows `✓ Beam Laser equipped` / `✗ Requires Beam Laser or better`
- Dragonfly: Lightning Shield installed if slot free, else saved to specialItems for later install

### News Feed (LOG tab)
- **Actionable news** — events in neighbouring systems within jump range
- Shows price effects: `↑ Medicine, Furs` / `↓ Robots` and days remaining `(3d left)`
- `LOCAL:` prefix for current system events
- Click nearby event → switches to WARP tab with that system selected
- News refreshed on every arrival

### Economy
- **14 planet events**: War, Drought, Plague, Harvest, Tech Boom, Strike, Pirate Raids, Economic Boom, Ore Strike, Drug Crackdown, Cold Winter, Flood, Festival, Industrial Accident
- Cold Winter: Furs ×1.8, Medicine +20%, Food +30%, Water +15%
- Event eligibility filters: no accidents on pre-industrial, no floods on desert, no festivals in Anarchy

### Ships & Equipment
- **Ship purchase** — equipment transfers to new ship (slots permitting), excess auto-sold cheapest first with Trader bonus
- **Shield recharge** on planet (tech ≥ 2) with Engineer discount
- **Lightning Shield** [UNIQUE] — marked in shield list, confirmation before selling

### Special Encounters
- **Famous Captain** — shows brief note if you lack the item (no disabled button)
- **Alien Machine / Tonic** — option hidden if can't afford (no disabled button)
- **Trader encounter** split into THEY SELL / THEY BUY; buys illegal goods without police risk

### UI/UX
- **Ship sprites** — Star Wars–style SVG pixel art for all 10 ships; enemy flipped in combat
- **effectiveSelected** — Travel button disappears when arrived at selected system
- **Population** shown in destination info panel
- `npm test` outputs "✓ All tests passed — safe to commit!" before deploy

---

## [0.3.0] — Skills, Mercenaries, Quests

### Added
- Mercenary system: 8 named crew, daily wages per jump, effective skill display
- Elite Captains: trade gear for +1 skill
- Alien Learning Machine, Portable Singularity, Alien Tonic
- JOBS tab, crew quarters per ship

---

## [0.2.0] — Economy & Galaxy

### Added
- Dynamic market pricing: tech profile × gov modifier × stock curve
- 10 events affecting prices
- P/L column, off-market barter at 65%
- 50 systems, Lave at centre, BFS connectivity

---

## [0.1.0] — Initial prototype

### Added
- React PWA scaffold (Vite + vite-plugin-pwa)
- Procedural galaxy, trading, combat, police, bank, escape pod
- Auto-save to localStorage

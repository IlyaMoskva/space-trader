# Changelog

All notable changes to Space Trader PWA.

---

## [0.3.0] — Alien Invasion

### Bug Fixes
- **Critical: ATTACK on trader did nothing** — `useCombat`'s `enemy` state used a lazy `useState` initializer that only ran once on mount. When a trader encounter transitioned to `type:"pirate"` via `onDone()`, the encounter prop changed but `enemy` stayed `null` forever — combat silently failed (only FLEE worked). Fixed with a `useEffect` that re-syncs `enemy` whenever the `encounter` prop changes.
- **Civilian/trader kill loot rebalanced**: killing a trader now drops their entire hold (3–5 tons, guaranteed, drawn from their actual sellGoods/buyGoods) instead of a random 1–3 unit chance — they had a full cargo bay, it should all spill out.
- **Reputation on civilian kill**: opening fire costs rep −1 immediately (unchanged); the kill itself now adds another −1, for −2 total — previously the kill alone cost −2 with no separate fire penalty, double-counting.
- **Pirate kills now reward reputation** (+1) directly, not just via extermination contract completion. Matches alien kills (which already gave +1).

### Alien Invasion System
- **`constants/aliens.js`** — 3 ship types, occupation stages, gadget/weapon constants
- **`engine/aliens.js`** — full invasion engine: `generateAlienEncounter`, `tickAlienInvasion`, `onAlienKilled`, `checkAlienInvasionStart`, `getOccupationStatus`, `getOccupiedServices`, `doAlienCombatRound`, `sellArtifactsAtScientist`, `maxAliensForSystem`
- **test-aliens.cjs** — 28 alien engine tests
- Total tests: 82 (34 + imports + 20 travel + 28 alien)

### Alien Ships
| Ship | Hull | Weapons | Plasma | Regen | Flee |
|---|---|---|---|---|---|
| Scout | 80 | 1× pulse | — | 3/round | Hard (fast) |
| Cruiser | 180 | 2× pulse | 60 dmg 25% | 5/round | Easy |
| Dreadnought | 350 | 3× pulse | 100 dmg 20% | 8/round | Easy (slow) |

Threat = density × age → ship tier scales as occupation ages

### Occupation Progression
- Max aliens per planet: Tiny=3, Small=5, Medium=8, Large=10, Huge=12, Gargantuan=15
- `scouted` — 1–4 aliens, market intact, warnings in news
- Small: anarchy at 5 aliens immediately
- Medium: dictatorship → anarchy at 30 days
- Large/Huge: dictatorship → anarchy at 60 days
- **Dictatorship**: no market, repair+shields OK (tech≥2)
- **Anarchy**: no market, repair OK, NO shields

### Invasion Mechanics
- Starts when `alien_invasion` quest fails/deadline passes
- **Tick every 3 days**: grow (8-25%/tick), NPC defense (police×12%+tech×4%), spread at 5+ aliens
- NPC high-police systems make 2-3 rolls per tick — can liberate entire system
- **Spread**: 5 aliens → nearest uninfected neighbour within 200 coords
- **Game over** at 30+ occupied systems
- Liberation progress bar in WARP tab

### Alien Combat
- Hull regeneration 3–8 hp/round — blocked by Regen Inhibitor gadget
- Plasma burst bypasses shields entirely
- **Alien Disruptor** weapon: 25 dmg × 2 vs aliens, shown with `👾 ×2 vs aliens` label
- **Regen Inhibitor** gadget (10 artifacts, tech 8+): blocks regen
- **Cloaking Device** gadget (5 artifacts, tech 7+): +40% flee vs aliens
- Hard to escape scouts (fast); easy to escape dreadnoughts (slow)
- Killing alien: rep +1, artifact drop 40–80%

### Artifact Economy
- **Regular planets**: 3,000 cr
- **Hi-tech (≥6) unoccupied**: 5,000 cr (scientist buys) via `sellArtifactsAtScientist`
- Can't sell on occupied planets
- Accumulate total for gadget unlocks

### Encounter Integration
- `generateEncounter` in combat.js checks `alienCount`: 5% per alien, max 40%
- Patrol in invaded system → guaranteed alien encounter
- PATROL panel shows liberation progress bar (X/maxAliens)
- **Civilian ship distress call**: 40% chance during invasion → alien system news + plot course
- Alien news items are clickable → WARP tab

### Map
- Invaded systems: orange (scouted) / red (occupied) dots
- Alien count icons: `👾👾👾` beside system name (max 5 shown)

### Escape Pod (fixed)
- Loses: ship, all weapons/shields, cargo, crew (disbanded)
- Keeps: credits, skills, alien artifacts, quest state
- New ship: Gnat with no equipment
- Government compensation: +cr to reach 1,000 if nearly broke

### Service Worker
- Manual `public/sw.js` replaces vite-plugin-pwa (better iOS)
- `scripts/bump-sw-version.cjs` auto-bumps on `npm version`
- `scripts/inject-sw-assets.cjs` injects hashed assets post-build
- Update banner in browser when new SW ready

### Alien Ship Types
| Ship | Hull | Weapons | Plasma | Regen | Flee |
|---|---|---|---|---|---|
| Scout | 80 | 1× pulse | — | 3/round | Hard (fast) |
| Cruiser | 180 | 2× pulse | 60 dmg, 25% | 5/round | Easy |
| Dreadnought | 350 | 3× pulse | 100 dmg, 20% | 8/round | Easy (slow) |

### Occupation Progression
- `scouted` — 1–4 aliens, market works, warnings in news
- Tiny/Small: anarchy immediately at 5 aliens
- Medium/Large: dictatorship phase → anarchy at 30 days
- Huge/Gargantuan: dictatorship → anarchy at 60 days
- **Dictatorship**: no market, repair OK, shields OK (tech ≥ 2)
- **Anarchy**: no market, repair OK, NO shields
- War on planet lifts service restrictions

### Invasion Mechanics
- Starts when `alien_invasion` quest fails or deadline passes
- Seeds 1–2 systems near quest target
- **Tick every 3 days**: NPC defense roll (police+tech), spread at 5/5 aliens
- **Game over** if 30+ systems occupied
- NPC defense: `police × 15% + tech × 5%` chance to reduce alien count
- **Spread**: 5 aliens → attack nearest uninfected neighbour within 200 coords

### Combat
- Alien encounters in invaded systems + 15% chance in neighbouring systems
- **Hull regeneration** each round (3–8 hp) — blocked by Regen Inhibitor gadget
- **Plasma burst** bypasses shields entirely
- **Alien Disruptor** weapon: 25 dmg × 2 vs aliens = 50 effective (available tech 7+)
- **Regen Inhibitor** gadget: blocks regen (requires 10 artifacts, tech 8+)
- **Cloaking Device** gadget: +40% flee chance vs aliens (requires 5 artifacts, tech 7+)
- Killing alien: rep +1, artifact drop (40–80% chance), reduces system alien count
- **Alien game over screen** if galaxy falls

### Galaxy Map
- Invaded systems shown in orange/red dots
- Alien icons beside system name: `👾👾👾` (1 per alien, max 5)
- 5/5 systems show red dot colour

### Alien Artifacts
- Drop on alien kill (type-dependent chance)
- Sell anywhere not occupied: 3,000 cr each
- Accumulate total for gadget unlock (5 → Cloaking, 10 → Regen Inhibitor)
- TradeScreen shows artifact section when in hold

### Service Worker
- Manual `public/sw.js` replaces vite-plugin-pwa (better iOS support)
- `scripts/bump-sw-version.cjs` — auto-bumps cache on `npm version`
- `scripts/inject-sw-assets.cjs` — injects hashed JS/CSS paths post-build
- "Update available" banner when new SW ready
- `npm run build` = tests + vite build + sw asset injection

### Story Act System (engine/story.js)
Progressive narrative — quests unlock based on player experience:

| Act | Condition | Unlocks |
|---|---|---|
| 1 | Start | Trading, pirates |
| 2 | kills≥5 OR days≥30 | Dragonfly, Wild, atmospheric hints |
| 3 | fighter≥4 + good weapon + good ship | Alien Invasion (deadline from reveal) |
| 4 | alienKills≥3 OR invasion active | War contracts, scientist NPC |
| 5 | alienKills≥10 + artifacts≥5 | Mothership quest |

- `getStoryAct(game)` — pure function, checked on every arrival
- `questUnlocked(questId, act)` — gates quest reveal
- Act 2 atmospheric news hints: strange disappearances, radio interference
- **Warn the Doctor removed** — replaced by scientist NPC encounter (Акт 4)

### Quest Changes
- **Alien Invasion** — `daysLeft: null` at creation; set to `rnd(12,18)` at **reveal time** so player has fair warning
- **Alien Invasion victory** — triggers defensive battle (3 scout waves); win → Fuel Compressor + system fortified (police+2) + invasion starts elsewhere
- **Mothership** (new, Act 5) — 800 hull, 4 weapons, 150 plasma, regen 15/round; destroying it ends invasion globally + rep+5
- **Wild quest** — now accepts Alien Disruptor as valid weapon

### Tests
- 38 alien/story tests (was 28)
- 10 new story act tests: act thresholds, quest unlock gates, invasion daysLeft=null at creation
- Total: **92 checks**

---

## [0.23.0] — Reputation, Services, Travel Refactor

### Architecture
- TravelScreen refactor: logic → `engine/travel.js` (360 → 138 lines)
- `npm run build` runs tests first
- 54 checks before this release

### Reputation system (complete)
- Passive recovery every 10 days (blocked for murderers)
- Clean police inspections: accumulating probability N×15%
- Shadow Broker: |rep|×2000 cr → rep +3, scrubs 1 kill
- Legal fees blocked for murderers
- Government contracts expunge kills ("our killer")
- Pirate contracts (rep ≤ −4): 3 job types

### Service restrictions
- Strict govs (Communist/Confed/Democracy/Corp.State) ban at rep ≤ −3
- Repair always available at 3× price
- Banned port: sell = dump (free); crisis goods always sellable
- Crisis delivery bonus: rep +1

### Economy
- Duplicate weapons/shields allowed
- Moon: net worth = credits + cargo + ship − debt ≥ 500k; cash required to buy
- Illegal goods: always rep −1; bust chance based on police + rep

---

## [0.3.0-pre / 0.22.x] — Earlier changes
See git history.


### Architecture
- **TravelScreen refactor** — all business logic moved to `src/engine/travel.js`; TravelScreen is now rendering + handlers only (360 → 138 lines)
- `engine/travel.js` exports `getTravelState`, `applyTravel`, `applyPatrol`, `buildNews`
- **test-travel.cjs** — 20 travel engine tests: fuel cost, day increment, market init, shield recharge, debt interest, merc wages, news building, bulletin board, rep recovery, patrol encounters
- **`npm run build` runs tests first** — `npm test && vite build`; broken test blocks deploy
- Total test coverage: 34 game logic + import checker + 20 travel = **54 checks**
- Version bumped to 0.23.0

### Reputation system (complete)
- **Passive recovery** — +1 every 10 days toward 0; blocked for murderers (killedCivilian/killedPolice > 0)
- **Clean police inspections** — accumulating probability (N × 15%, max 60%); counter resets on gain; only toward 0
- **Shadow Broker** — random space encounter, |rep| × 2000 cr → rep +3, also scrubs 1 kill from record
- **Legal fees** (Bank) — 5000 × |rep+2| cr → rep +1; blocked entirely when player has kills
- **Surrender to police** — fine × 800 + jail days (+5/kill for murderers); rep → −1 (or −3 with kills); reduces kill count by 1
- **Government contracts** — extermination completion expunges 1 kill; assassination expunges 2 kills ("our killer")
- **Pirate contracts** (rep ≤ −4) — three types: patrol elimination, freighter attack, diplomat assassination; accepting costs rep −1; completion adds credits + optional equipment

### Service restrictions
- **Strict governments** (Communist, Confed, Democracy, Corp. State) ban services at rep ≤ −3
- War event on planet lifts all restrictions
- **Repair allowed at 3× price** — "they won't let you die, but won't make it easy"
- **Trade: sell → DUMP** — banned port refuses purchase; cargo dumped for free to clear space
- **Crisis goods** (medicine/food/water during plague/drought/war) always sellable even at banned port
- **Crisis delivery bonus** — arriving with crisis goods during matching event → rep +1

### Pirate contracts (criminal path)
- Three job types scale with rep severity: patrol elimination (−4), freighter (−6), diplomat/Flea (−8)
- Accepting costs rep −1 immediately; deadline 6–12 days
- Rewards: credits + optional equipment (Military Laser, Beam Laser, Energy Shield)
- Completion tracked via `onPirateJobKill` — fires when killing civilian or police in target system

### Combat & encounters
- **Kill counters** in StatusBar: ⚔ pirates / 💀 civilians / 🚔 police (shown only if > 0)
- **ATTACK on traders** — always available; starts real combat (merchant has Pulse Laser, no shields); win → killedCivilian++, rep −2, loot cargo
- **Police kills** → killedPolice++, rep −3, policeRecord +2; triggers wave escalation
- **Pirate waves scale with rep**: rep −4..−6: +1 wave; rep −7..−10: +2 waves, each harder
- **Police waves scale with killedPolice**: 1 kill → 1–2 cops; 3+ kills → 2–4, military tier
- **SURRENDER removed from pirate combat** — only available vs police

### Economy & trading
- **Duplicate weapons/shields** allowed (removed uniqueness filter)
- **Illegal goods** — always rep −1; bust chance = police × 10% + |rep| × 5%; bust = confiscation + fine × 1.5 + rep −2 total
- **Moon purchase** — net worth = credits + cargo value + ship value − debt ≥ 500,000; shows breakdown; cash ≥ 500k required to buy

### Bank
- **Separate sliders** for Borrow (0..maxBorrow) and Repay (0..min(debt,credits))
- **REPAY ALL** button
- **Legal fees** section replaces PAY FINE — expensive, blocked for murderers

### Mercenaries
- **Space encounter** → rumor: "Dupont looking for work in Zaonce" → added to News Feed
- Planet-based availability restored after refactor

### Fuel Compressor
- Moved from gadget slot → `specialItems` (doesn't occupy equipment slot)
- Shown in SHIP → STATUS → Special Items as `⛽ Fuel Compressor · Jump range +3 pc`
- Transfer preserved across ship purchases

### UI/UX
- **Repair always visible** at tech < 2 — disabled with hint; at banned port — 3× price
- **Population** shown in destination panel (regression test added)
- Debug "Combat contracts" block removed
- App.jsx cleaned of stale comments (238 lines)
- PWA `skipWaiting + clientsClaim` — immediate service worker update on deploy

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


### Architecture
- **Modular refactor** — monolithic App.jsx (4100 lines) split into 32 files:
  - `constants/` — ships, commodities, world data, events, mercenaries
  - `engine/` — pure functions: galaxy, market, combat, contracts, quests, utils
  - `hooks/` — useGameState (localStorage), useCombat (fight/flee/surrender)
  - `components/` — ShipSprite, GalaxyMap, StatusBar, MenuModal, QuestPopup, StarsCanvas, SkillBar
  - `screens/` — TitleScreen, GameScreen
  - `tabs/` — TradeScreen, TravelScreen, ShipScreen, BankScreen, ContractsScreen, LogScreen, EncounterScreen
- **Static import checker** (`test-imports.cjs`) — finds missing imports before deploy
- `npm test` runs both game logic tests (34) and import checker
- App.jsx cleaned of stale comments — imports + CSS + App() only
- PWA `skipWaiting + clientsClaim` — new service worker activates immediately on deploy

### Galaxy
- **Poisson Disk Sampling + bridge repair** — even spread, no clustering around Lave
- Min separation 12 pc, MIN_JUMP=11 pc, MAX_JUMP=17 pc (all ships)
- **Flea jump 5 pc → 17 pc** — diplomatic courier with hyperdrive

### Combat
- **Pirate scaling by player power** — `playerPower = fighter/10×6 + weaponTier×0.5 + shipTier/9×2`; threat capped at `playerPower + 2`
- Fighter skill weighted most — weapon/ship are tools, skill is experience
- **Skill gain on win** — base 8% + 12%/level enemy exceeds player; **diminishing returns** `× (1 - skill/15)`; Fighter 9 = 40% of base chance
- **Pirate flee** — hull < 25%, escape chance = 15% + 5%/level above player Pilot
- **Wave attacks** — pirates=1: rarely 2; pirates=2: 1–2; pirates=3: 1–3
- **SURRENDER removed from pirate combat** — only available vs police

### Reputation (−10 to +10)
- Gauge in StatusBar: LEGEND / RESPECTED / NEUTRAL / SUSPECT / WANTED / PIRATE ⚠ HUNTED
- **+7..+10**: pirates come ANGRY — better equipped
- **−7..−10**: weak pirates may flee on sight
- **−6..−4**: police attacks on sight
- **−5 and below**: bounty hunters spawn
- **ATTACK button** on trader at rep ≤ −3
- **Surrender to police** → fine + jail days + rep +3
- **PAY FINE** in Bank → |rep| × 1000 cr → rep +3

### Contracts (JOBS tab)
- **Extermination deadline** = travelDays + killCount×2 + 2 (min 8)
- **Deadline checked in `updateGame()`** — single source of truth; fails immediately when days advance (patrol, jump, any action)
- **PATROL** guaranteed encounter; system with active contract always has pirates
- Contract history shows last 5 newest first

### Mercenaries (JOBS tab)
- **Planet-based availability** — 30% base + 6%/size; civilian bias on hi-tech, fighter bias on lawless
- Skill comparison: green ▲ where merc improves effective skill
- **Restored after refactor** (was missing)

### Economy
- **Illegal goods on planet** — always rep −1; random police bust (police×10% + |rep|×5%, max 70%) → confiscation + fine×1.5 + rep −2 total
- **14 planet events** with Cold Winter, Flood, Festival, Industrial Accident
- **Duplicate weapons/shields** now allowed — can install 3× Military Laser

### Bank
- **Separate sliders** for Borrow (0..maxBorrow) and Repay (0..credits)
- **REPAY ALL** button — one click to pay maximum possible
- **Moon purchase** requires net worth ≥ 500,000 cr (credits − debt), not just credits

### Quests
- **Dragonfly boss fight fixed** — arrival now converts `type:"boss"` to `type:"pirate"` correctly; was silently dropped
- All 4 quests start hidden; revealed through news (60% per arrival)
- Wild quest shows equipment requirement status

### News Feed (LOG tab)
- **Restored after refactor** — nearby systems within jump range with price effects and days remaining
- `LOCAL:` prefix for current system; click nearby event → WARP tab
- **Informative format**: `Zaonce: Plague reported. ↑ Medicine (5d left) → WARP`

### Ships & Equipment
- **Repair/recharge always visible** — disabled with hint when tech < 2, not hidden
- Ship purchase: equipment transfers, excess auto-sold cheapest first
- Lightning Shield [UNIQUE] marked in list, confirmation before selling

### Special Encounters
- **Famous Captain** — brief note if you lack item (no disabled button)
- **Alien Machine / Tonic / Sealed Cargo** — option hidden if can't afford
- Mercenary offer in space → redirects to Jobs board

### UI/UX
- Travel button disappears when arrived at selected system (`effectiveSelected`)
- Population shown in destination info panel (test added to prevent regression)
- Debug "Combat contracts" block removed from WARP tab
- Stale comments removed from App.jsx

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

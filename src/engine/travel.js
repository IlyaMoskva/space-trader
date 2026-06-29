import { fuelCost, canReach, PARSEC_SCALE } from './utils.js';
import { initMarket, refreshMarket } from './market.js';
import { generateContracts, checkContractArrival } from './contracts.js';
import { generateQuests, revealQuestHints, checkQuestArrival } from './quests.js';
import { generateEncounter, generatePirateShip } from './combat.js';
import { tickAlienInvasion, checkAlienInvasionStart, generateAlienEncounter } from './aliens.js';
import { SHIPS, WEAPONS } from '../constants/ships.js';
import { COMMODITIES } from '../constants/commodities.js';
import { TECH_LEVELS, GOV_TYPES, SIZES } from '../constants/world.js';
import { rnd } from './utils.js';

// ── Derived travel state (pure, no side effects) ─────────────────────────────

export function getTravelState(game, selected) {
  const currentSys = game.galaxy[game.currentSystem];
  const effectiveSelected = selected === game.currentSystem ? null : selected;
  const selectedSys = effectiveSelected !== null ? game.galaxy[effectiveSelected] : null;
  const jumpRange = game.ship.jump
    + (game.gadgets.some(g => g.id === 'fuel_compressor') ? 3 : 0)
    + ((game.specialItems || []).includes('fuel_compressor') ? 3 : 0);
  const fuel = selectedSys ? fuelCost(currentSys, selectedSys) : 0;
  const inRange = selectedSys ? canReach(currentSys, selectedSys, jumpRange) : false;
  const canTravel = !!(selectedSys && inRange && game.credits >= fuel);
  return { currentSys, effectiveSelected, selectedSys, jumpRange, fuel, inRange, canTravel };
}

// ── News builder ─────────────────────────────────────────────────────────────

export function buildNews(newGame, arrivedSysId, jumpRange) {
  const arrivedSys = newGame.galaxy[arrivedSysId];
  const rangeCoords = jumpRange * 10;

  const staticNews = [
    { text: arrivedSys.name + ' — ' + TECH_LEVELS[arrivedSys.tech] + ' · ' + GOV_TYPES[arrivedSys.gov] + ' · Pop ' + SIZES[arrivedSys.size] }
  ];

  const sysEvents = arrivedSys.market?.events || [];
  const localEventNews = sysEvents
    .filter(e => (e.daysLeft ?? 0) > 0)
    .map(e => {
      const ups   = Object.keys(e.effects||{}).filter(k => e.effects[k] > 1.15).map(k => COMMODITIES.find(c=>c.id===k)?.name||k);
      const downs = Object.keys(e.effects||{}).filter(k => e.effects[k] < 0.85).map(k => COMMODITIES.find(c=>c.id===k)?.name||k);
      let fx = '';
      if (ups.length)   fx += ' ↑ ' + ups.join(', ');
      if (downs.length) fx += ' ↓ ' + downs.join(', ');
      return { text: 'LOCAL: ' + e.text + fx + ' (' + e.daysLeft + 'd)', event: true };
    });

  const nearbyEventNews = [];
  for (const sys of newGame.galaxy) {
    if (sys.id === arrivedSysId) continue;
    const d = Math.hypot(sys.x - arrivedSys.x, sys.y - arrivedSys.y);
    if (d > rangeCoords) continue;
    for (const ev of (sys.market?.events || [])) {
      if ((ev.daysLeft ?? 0) <= 0) continue;
      const ups   = Object.keys(ev.effects||{}).filter(k => ev.effects[k] > 1.15).map(k => COMMODITIES.find(c=>c.id===k)?.name||k);
      const downs = Object.keys(ev.effects||{}).filter(k => ev.effects[k] < 0.85).map(k => COMMODITIES.find(c=>c.id===k)?.name||k);
      let fx = '';
      if (ups.length)   fx += ' ↑ ' + ups.join(', ');
      if (downs.length) fx += ' ↓ ' + downs.join(', ');
      nearbyEventNews.push({ text: sys.name + ': ' + ev.text + fx + ' (' + ev.daysLeft + 'd left)', event: true, system: sys.id });
    }
  }

  const questNews = newGame.quests
    .filter(q => q.status === 'available')
    .map(q => ({ text: q.desc, quest: true }));

  return [...staticNews, ...localEventNews, ...nearbyEventNews, ...questNews].slice(0, 10);
}

// ── Core travel logic ────────────────────────────────────────────────────────

/**
 * Applies all side effects of jumping to `selected` system.
 * Returns { newGame, enc, bossEnc, popups }
 *   enc      — random encounter (or null)
 *   bossEnc  — priority boss encounter (or null)
 *   popups   — quest popups to show
 */
export function applyTravel(game, selected, fuel) {
  const selectedSys = game.galaxy[selected];

  // 1. Update galaxy: init/refresh market
  let newGalaxy = game.galaxy.map(s => {
    if (s.id !== selected) return s;
    const market = s.market ? refreshMarket(s.market) : initMarket(s);
    return { ...s, visited: true, market };
  });
  if (!newGalaxy[game.currentSystem].market) {
    newGalaxy = newGalaxy.map(s => s.id === game.currentSystem ? { ...s, market: initMarket(s) } : s);
  }

  let newGame = {
    ...game,
    currentSystem: selected,
    galaxy: newGalaxy,
    credits: game.credits - fuel,
    days: game.days + 1,
    shields: game.shields.map(s => ({ ...s, current: Math.min(s.max, s.current + 30) })),
  };

  // 2. Engineer auto-repair
  const eng = newGame.skills?.engineer || 0;
  if (eng > 0 && newGame.hull < newGame.hullMax && Math.random() < eng * 0.03) {
    const repaired = Math.max(1, Math.floor(eng / 2));
    const newHull = Math.min(newGame.hullMax, newGame.hull + repaired);
    if (newHull > newGame.hull) {
      newGame.hull = newHull;
      newGame.log = [{ type: 'good', text: 'Engineer patched hull +' + repaired + ' hp' }, ...newGame.log];
    }
  }

  // 3. Debt interest
  if (newGame.debt > 0) {
    const interest = Math.ceil(newGame.debt * 0.01);
    newGame.debt += interest;
    newGame.log = [{ type: 'warn', text: 'Interest: +' + interest + ' cr debt (total: ' + newGame.debt + ' cr)' }, ...newGame.log];
  }

  // 4. Passive reputation recovery (no murders, every 10 days)
  const rep = newGame.reputation || 0;
  const kills = (newGame.killedCivilian || 0) + (newGame.killedPolice || 0);
  if (rep < 0 && kills === 0 && newGame.days % 10 === 0) {
    newGame.reputation = Math.min(0, rep + 1);
    newGame.log = [{ type: 'info', text: 'Time passes. Reputation slowly recovering (' + newGame.reputation + ')' }, ...newGame.log];
  }

  // 5. Mercenary wages
  const mercs = newGame.mercenaries || [];
  if (mercs.length > 0) {
    const totalPay = mercs.reduce((s, m) => s + m.cost, 0);
    if (newGame.credits >= totalPay) {
      newGame.credits -= totalPay;
      newGame.log = [{ type: 'warn', text: 'Crew wages: ' + totalPay + ' cr (' + mercs.map(m => m.name).join(', ') + ')' }, ...newGame.log];
    } else {
      newGame.mercenaries = [];
      newGame.log = [{ type: 'bad', text: "Can't pay crew wages! All mercenaries have left." }, ...newGame.log];
    }
  }

  // 6. Quest day tracking
  newGame.quests = newGame.quests.map(q => {
    if (q.daysLeft !== undefined && q.status === 'available') {
      const dl = q.daysLeft - 1;
      if (dl <= 0 && q.id === 'alien_invasion') {
        const sysIdx = newGame.galaxy.findIndex(s => s.id === q.targetSystem);
        if (sysIdx >= 0) {
          newGame.galaxy = newGame.galaxy.map((s, i) => i === sysIdx ? { ...s, tech: Math.max(0, s.tech - 3) } : s);
          newGame.log = [{ type: 'bad', text: q.name + ' FAILED! Planet devastated.' }, ...newGame.log];
        }
        return { ...q, status: 'failed', daysLeft: 0 };
      }
      return { ...q, daysLeft: dl };
    }
    return q;
  });

  // 7. Travel log entry
  newGame.log = [{ type: 'info', text: 'Traveled to ' + selectedSys.name + '. Fuel: ' + fuel + ' cr' }, ...newGame.log].slice(0, 50);

  // 8. Build news
  const jumpRange = game.ship.jump
    + (game.gadgets.some(g => g.id === 'fuel_compressor') ? 3 : 0)
    + ((game.specialItems || []).includes('fuel_compressor') ? 3 : 0);
  newGame.news = buildNews(newGame, selected, jumpRange);

  // 9. Contract arrivals
  const { newGame: contractGame } = checkContractArrival(newGame, selected);
  newGame = contractGame;

  // 10. Bulletin board
  newGame.bulletinBoard = generateContracts(newGame.galaxy[selected], newGame.galaxy, newGame.days);

  // 11. Quest hints + arrival
  newGame = revealQuestHints(newGame, selected);
  const { newGame: questGame, popups } = checkQuestArrival(newGame, selected);
  newGame = questGame;

  // 12. Alien invasion tick (every 3 days) + check if invasion should start
  newGame = checkAlienInvasionStart(newGame);
  if (newGame.alienInvasionActive && newGame.days % 3 === 0) {
    const { game: alienGame, news: alienNews, gameOver } = tickAlienInvasion(newGame);
    newGame = alienGame;
    if (alienNews.length > 0) {
      newGame.news = [...alienNews, ...(newGame.news || [])].slice(0, 10);
    }
    if (gameOver) {
      newGame.alienGameOver = true;
    }
  }

  // 13. Alien encounter in invaded/neighbouring system
  const destSys = newGame.galaxy[selected];
  if (destSys.alienCount > 0 || isNearInvadedSystem(newGame.galaxy, selected)) {
    const alienChance = Math.min(0.7, (destSys.alienCount || 0) * 0.12 +
      (isNearInvadedSystem(newGame.galaxy, selected) ? 0.15 : 0));
    if (Math.random() < alienChance) {
      const alienEnc = generateAlienEncounter(destSys, newGame);
      return { newGame, enc: alienEnc, bossEnc: null, popups };
    }
  }

  // 14. Boss encounters take priority
  // a) Assassination
  const pendingAssassination = newGame.activeContracts?.find(
    c => c.type === 'assassination' && c.status === 'pending_fight'
  );
  if (pendingAssassination) {
    const bossShip = SHIPS[Math.min(SHIPS.length - 1, 5 + rnd(0, 2))];
    const bossEnc = {
      type: 'pirate', sub: 'assassination', contractId: pendingAssassination.id,
      ship: { ...bossShip, name: pendingAssassination.targetName },
      weapon: WEAPONS[2], hull: bossShip.hull + 50, hullMax: bossShip.hull + 50,
      shields: 200, shieldsMax: 200, wave: 1, maxWaves: 1,
    };
    newGame.log = [{ type: 'bad', text: '⚠ ' + pendingAssassination.targetName + ' spotted! Engaging!' }, ...newGame.log];
    return { newGame, enc: null, bossEnc, popups: [] };
  }

  // b) Dragonfly / quest boss
  const bossPopup = popups.find(p => p.encounter);
  if (bossPopup) {
    const raw = bossPopup.encounter;
    const bossEnc = {
      type: 'pirate', sub: raw.sub || 'dragonfly',
      ship: raw.ship, weapon: raw.weapon || WEAPONS[2],
      hull: raw.hull, hullMax: raw.hullMax,
      shields: raw.shields, shieldsMax: raw.shieldsMax,
      wave: 1, maxWaves: 1,
    };
    newGame.log = [{ type: 'bad', text: '🐉 DRAGONFLY spotted! It\'s turning to engage!' }, ...newGame.log];
    return { newGame, enc: null, bossEnc, popups: [] };
  }

  // 13. Random encounter
  const enc = generateEncounter(newGame.galaxy[selected], newGame);
  return { newGame, enc, bossEnc: null, popups };
}

function isNearInvadedSystem(galaxy, systemId) {
  const sys = galaxy[systemId];
  return galaxy.some(s => s.id !== systemId && (s.alienCount || 0) > 0 &&
    Math.hypot(s.x - sys.x, s.y - sys.y) < 200);
}

// ── Patrol logic ─────────────────────────────────────────────────────────────

/**
 * Applies one patrol day. Returns { newGame, enc, bossEnc }
 */
export function applyPatrol(game, patrolContracts) {
  const sys = game.galaxy[game.currentSystem];
  let newGame = {
    ...game,
    days: game.days + 1,
    shields: game.shields.map(s => ({ ...s, current: Math.min(s.max, s.current + 10) })),
    log: [{ type: 'info', text: 'Patrolling ' + sys.name + '...' }, ...game.log],
  };

  // Assassination boss fight
  const assassinContract = patrolContracts.find(c => c.type === 'assassination');
  if (assassinContract) {
    const bossShip = SHIPS[Math.min(SHIPS.length - 1, 5 + rnd(0, 2))];
    const bossEnc = {
      type: 'pirate', sub: 'assassination', contractId: assassinContract.id,
      ship: { ...bossShip, name: assassinContract.targetName },
      weapon: WEAPONS[2], hull: bossShip.hull + 50, hullMax: bossShip.hull + 50,
      shields: 200, shieldsMax: 200, wave: 1, maxWaves: 1,
    };
    newGame.activeContracts = newGame.activeContracts.map(c =>
      c.id === assassinContract.id ? { ...c, status: 'pending_fight' } : c
    );
    newGame.log = [{ type: 'bad', text: '⚠ ' + assassinContract.targetName + ' located! Engaging!' }, ...newGame.log];
    return { newGame, enc: null, bossEnc };
  }

  // Extermination pirate
  const hasActiveContract = patrolContracts.some(c => c.type === 'extermination');
  const hasPirates = sys.pirates >= 1 || hasActiveContract;
  if (hasPirates) {
    const enc = { ...generatePirateShip(sys, game), type: 'pirate', wave: 1, maxWaves: 1,
      patrolContractSystem: game.currentSystem };
    return { newGame, enc, bossEnc: null };
  }

  newGame.log = [{ type: 'warn', text: 'Patrol found nothing — pirates may have fled.' }, ...newGame.log];
  return { newGame, enc: null, bossEnc: null };
}


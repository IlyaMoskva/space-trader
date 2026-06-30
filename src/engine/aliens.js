import { ALIEN_SHIPS, ALIEN_ARTIFACT } from '../constants/aliens.js';
import { rnd, pick } from './utils.js';

// ── Max alien count per planet size ──────────────────────────────────────────
// Tiny=3, Small=5, Medium=8, Large=10, Huge=12, Gargantuan=15
const MAX_ALIENS_BY_SIZE = [3, 5, 8, 10, 12, 15];

export function maxAliensForSystem(sys) {
  return MAX_ALIENS_BY_SIZE[sys.size] || 8;
}

// ── Occupation status ─────────────────────────────────────────────────────────

export function getOccupationStatus(sys) {
  if (!sys.alienCount) return null;
  const days  = sys.alienDays || 0;
  const small = sys.size <= 1;
  const large = sys.size >= 4;

  if (sys.alienCount < 5) return 'scouted';

  // Full occupation — speed determined by planet size
  if (small)  return 'occupied_anarchy';
  if (large)  return days >= 60 ? 'occupied_anarchy' : days >= 30 ? 'occupied_dictatorship' : 'scouted';
  /* medium */ return days >= 30 ? 'occupied_anarchy' : 'occupied_dictatorship';
}

export function getOccupiedServices(sys) {
  const status = getOccupationStatus(sys);
  if (!status || status === 'scouted') return { market: true, repair: true, shields: true };
  const anarchy = status === 'occupied_anarchy';
  return {
    market:  false,
    repair:  sys.tech >= 2,
    shields: !anarchy && sys.tech >= 2,
  };
}

// ── Threat level: ship type based on alienCount and alienDays ─────────────────

function threatLevel(sys) {
  const count = sys.alienCount || 0;
  const days  = sys.alienDays || 0;
  const max   = maxAliensForSystem(sys);
  // 0-10 scale: count/max gives density; days push toward elite over time
  const density = count / max;
  const age = Math.min(1, days / 120);
  return Math.round((density * 6 + age * 4));
}

export function generateAlienEncounter(system, player) {
  const threat = threatLevel(system);
  const shipTemplate = threat >= 8 ? ALIEN_SHIPS[2]   // dreadnought
                     : threat >= 4 ? ALIEN_SHIPS[1]   // cruiser
                     : ALIEN_SHIPS[0];                 // scout

  const status   = getOccupationStatus(system);
  const count    = system.alienCount || 0;
  const maxWaves = status === 'occupied_anarchy' && count >= 8 ? 3
                 : count >= 5 ? 2 : 1;

  return {
    type: "alien",
    sub:  shipTemplate.id,
    ship: { ...shipTemplate },
    hull: shipTemplate.hull, hullMax: shipTemplate.hullMax,
    shields: 0, shieldsMax: 0,
    regen: shipTemplate.regen,
    hasPlasma: shipTemplate.hasPlasma,
    plasma: shipTemplate.plasma || null,
    pulseDamage: shipTemplate.pulseDamage,
    weapons: shipTemplate.weapons,
    fleeHard: shipTemplate.fleeHard,
    wave: 1, maxWaves,
  };
}

// ── Combat round ──────────────────────────────────────────────────────────────

export function doAlienCombatRound(game, encounter, action) {
  const hasRegenInhibitor = (game.gadgets || []).some(g => g.id === 'regen_inhibitor');
  const hasRepairDroid    = (game.gadgets || []).some(g => g.id === 'repair_droid');
  const eff               = effectiveSkillsLocal(game);
  const disruptors        = (game.weapons || []).filter(w => w.id === 'alien_disruptor');
  const otherWeapons      = (game.weapons || []).filter(w => w.id !== 'alien_disruptor');

  const log = [];
  let playerHull    = game.hull;
  let playerShields = (game.shields || []).reduce((s, sh) => s + sh.current, 0);
  let alienHull     = encounter.hull;

  // ── Player attacks ──────────────────────────────────────────────────────────
  if (action === 'fight') {
    const hitChance = Math.min(0.95, 0.55 + eff.fighter * 0.04);

    for (const w of disruptors) {
      if (Math.random() < hitChance) {
        const dmg = rnd(5, w.damage) * 2;
        alienHull -= dmg;
        log.push({ type: 'good', text: '⚡ Alien Disruptor: ' + dmg + ' dmg (×2 vs alien)' });
      }
    }
    for (const w of otherWeapons) {
      if (Math.random() < hitChance) {
        const dmg = rnd(5, w.damage);
        alienHull -= dmg;
        log.push({ type: 'good', text: w.name + ': ' + dmg + ' dmg' });
      }
    }
    if (disruptors.length === 0 && otherWeapons.length === 0) {
      if (Math.random() < hitChance) {
        const dmg = rnd(3, 8);
        alienHull -= dmg;
        log.push({ type: 'good', text: 'Emergency lasers: ' + dmg + ' dmg' });
      }
    }

    if (alienHull <= 0) {
      log.push({ type: 'good', text: encounter.ship.name + ' destroyed!' });
      return { playerHull, playerShields, alienHull: 0, log, ended: true, result: 'win' };
    }
  }

  // ── Alien regeneration ──────────────────────────────────────────────────────
  if (encounter.regen > 0) {
    if (hasRegenInhibitor) {
      log.push({ type: 'good', text: 'Regen Inhibitor blocks regeneration!' });
    } else {
      alienHull = Math.min(encounter.hullMax, alienHull + encounter.regen);
      log.push({ type: 'info', text: encounter.ship.name + ' regenerates ' + encounter.regen + ' hull' });
    }
  }

  // ── Player in-combat repair ─────────────────────────────────────────────────
  // Engineer passive: ≥5 → +1 hp/round, ≥8 → +2 hp/round
  const engHeal = eff.engineer >= 8 ? 2 : eff.engineer >= 5 ? 1 : 0;
  // Repair Droid gadget: +3 hp/round
  const droidHeal = hasRepairDroid ? 3 : 0;
  const totalHeal = engHeal + droidHeal;
  if (totalHeal > 0 && playerHull < game.hullMax) {
    playerHull = Math.min(game.hullMax, playerHull + totalHeal);
    log.push({ type: 'good', text: '🔧 In-combat repair: +' + totalHeal + ' hull' + (hasRepairDroid ? ' (droid)' : '') });
  }

  // ── Alien attacks ───────────────────────────────────────────────────────────
  // Large ships (isMothership or dreadnought) are less accurate vs maneuverable ships
  // hitAccuracy: encounter override (0-1), default 1.0
  const alienAccuracyMod = encounter.hitAccuracy ?? 1.0;
  const evadeChance = Math.min(0.60, (0.10 + eff.pilot * 0.04) / alienAccuracyMod);

  for (let i = 0; i < encounter.weapons; i++) {
    if (Math.random() < evadeChance) {
      log.push({ type: 'good', text: 'Evaded alien shot!' });
      continue;
    }
    const dmg = rnd(encounter.pulseDamage[0], encounter.pulseDamage[1]);
    if (playerShields > 0) {
      const absorbed = Math.min(playerShields, dmg);
      playerShields -= absorbed;
      if (dmg - absorbed > 0) playerHull -= (dmg - absorbed);
      log.push({ type: 'bad', text: 'Alien pulse: ' + dmg + ' dmg (shield -' + absorbed + ')' });
    } else {
      playerHull -= dmg;
      log.push({ type: 'bad', text: 'Alien pulse: ' + dmg + ' dmg' });
    }
  }

  // Plasma burst — bypasses shields entirely
  if (encounter.hasPlasma && encounter.plasma && Math.random() < encounter.plasma.chance) {
    const dmg = encounter.plasma.damage;
    playerHull -= dmg;
    log.push({ type: 'bad', text: '⚡ PLASMA BURST: ' + dmg + ' dmg (bypasses shields!)' });
  }

  if (playerHull <= 0) {
    log.push({ type: 'bad', text: 'Ship destroyed by ' + encounter.ship.name + '!' });
    return { playerHull: 0, playerShields, alienHull, log, ended: true, result: 'dead' };
  }

  return { playerHull, playerShields, alienHull, log, ended: false, result: null };
}

function effectiveSkillsLocal(game) {
  const base  = game.skills || {};
  const mercs = game.mercenaries || [];
  const res   = {};
  for (const sk of ['pilot', 'fighter', 'trader', 'engineer']) {
    res[sk] = Math.min(10, (base[sk] || 0) +
      mercs.reduce((m, c) => m + (c.skills[sk] > (base[sk]||0) ? c.skills[sk] - (base[sk]||0) : 0), 0));
  }
  return res;
}

// ── Kill tracking ─────────────────────────────────────────────────────────────

export function onAlienKilled(game, systemId, alienShipType) {
  let newGame = { ...game };
  const sysIdx = newGame.galaxy.findIndex(s => s.id === systemId);
  if (sysIdx < 0) return newGame;

  const sys = newGame.galaxy[sysIdx];
  const newCount = Math.max(0, (sys.alienCount || 1) - 1);

  newGame.galaxy = newGame.galaxy.map((s, i) =>
    i !== sysIdx ? s : {
      ...s,
      alienCount: newCount,
      alienDays:  newCount === 0 ? 0 : s.alienDays,
    }
  );

  if (newCount === 0) {
    newGame.log = [{ type: 'good', text: '✅ ' + sys.name + ' cleared of alien presence!' }, ...newGame.log];
  }

  newGame.killedAliens = (newGame.killedAliens || 0) + 1;
  newGame.reputation   = Math.min(10, (newGame.reputation || 0) + 1);

  // Artifact drop
  const ship = ALIEN_SHIPS.find(s => s.id === alienShipType) || ALIEN_SHIPS[0];
  if (Math.random() < ship.artifactChance) {
    const existing = newGame.cargo.find(c => c.id === 'alien_artifact');
    if (existing) {
      newGame.cargo = newGame.cargo.map(c =>
        c.id === 'alien_artifact' ? { ...c, qty: c.qty + 1 } : c);
    } else {
      newGame.cargo = [...newGame.cargo, { id: 'alien_artifact', qty: 1, buyPrice: 0 }];
    }
    newGame.alienArtifacts = (newGame.alienArtifacts || 0) + 1;
    newGame.log = [{ type: 'good', text: 'Alien artifact recovered! (total: ' + newGame.alienArtifacts + ')' }, ...newGame.log];
  }

  return newGame;
}

// ── Invasion tick ─────────────────────────────────────────────────────────────

export function tickAlienInvasion(game) {
  if (!game.alienInvasionActive) return { game, news: [] };

  const news = [];
  let newGalaxy = game.galaxy.map(s => ({ ...s }));

  for (let i = 0; i < newGalaxy.length; i++) {
    const sys = newGalaxy[i];
    if (!sys.alienCount) continue;

    // Age the occupation
    sys.alienDays = (sys.alienDays || 0) + 3;

    // Aliens reinforce — grow toward max based on days
    const max      = maxAliensForSystem(sys);
    const growRate = sys.alienDays > 60 ? 0.25 : sys.alienDays > 30 ? 0.15 : 0.08;
    if (sys.alienCount < max && Math.random() < growRate) {
      sys.alienCount++;
      if (sys.alienCount === 5) {
        news.push({ text: '🔴 ' + sys.name + ' FULLY OCCUPIED by aliens!', event: true, system: sys.id });
      }
    }

    // NPC defense roll: high police/tech = effective resistance
    // Multiple rolls for high-defended systems (raid mechanics)
    const defBase   = (sys.police || 0) * 0.12 + (sys.tech || 0) * 0.04;
    const raidRolls = sys.police >= 3 ? 3 : sys.police >= 2 ? 2 : 1;
    let killed = 0;
    for (let r = 0; r < raidRolls; r++) {
      if (Math.random() < defBase && sys.alienCount > 0) {
        sys.alienCount--;
        killed++;
      }
    }

    if (killed > 0) {
      if (sys.alienCount === 0) {
        sys.alienDays = 0;
        news.push({ text: '✅ Defense forces liberated ' + sys.name + '!', event: true, system: sys.id });
      } else if (killed >= 2) {
        news.push({ text: '🛡 Military raid on ' + sys.name + ' — ' + killed + ' aliens killed (' + sys.alienCount + '/' + max + ')', event: true, system: sys.id });
      } else {
        news.push({ text: '🛡 Patrol skirmish in ' + sys.name + ' (' + sys.alienCount + '/' + max + ')', event: true, system: sys.id });
      }
    }

    // Spread: fully occupied (5+) → attack nearest uninfected neighbour
    if (sys.alienCount >= 5) {
      const neighbours = newGalaxy
        .filter(s => s.id !== sys.id && !s.alienCount &&
          Math.hypot(s.x - sys.x, s.y - sys.y) < 200)
        .sort((a, b) => Math.hypot(a.x - sys.x, a.y - sys.y) - Math.hypot(b.x - sys.x, b.y - sys.y));
      if (neighbours.length > 0) {
        const target = newGalaxy.find(s => s.id === neighbours[0].id);
        if (target) {
          target.alienCount = 1;
          target.alienDays  = 0;
          news.push({ text: '⚠ Alien forces advance toward ' + target.name + '!', event: true, system: target.id });
        }
      }
    }
  }

  const occupiedCount = newGalaxy.filter(s => (s.alienCount || 0) >= 5).length;
  const gameOver = occupiedCount >= 30;

  return {
    game: { ...game, galaxy: newGalaxy, alienOccupied: occupiedCount },
    news,
    gameOver,
  };
}

// ── Invasion start ────────────────────────────────────────────────────────────

export function checkAlienInvasionStart(game) {
  const quest = (game.quests || []).find(q => q.id === 'alien_invasion');
  if (!quest) return game;
  if (quest.status === 'done') return game;
  if (game.alienInvasionActive) return game;

  const shouldStart = quest.status === 'failed' ||
    (quest.daysLeft !== undefined && quest.daysLeft <= 0);
  if (!shouldStart) return game;

  const targetSys = game.galaxy.find(s => s.id === quest.targetSystem);
  if (!targetSys) return game;

  const seeds = game.galaxy
    .filter(s => s.id !== targetSys.id &&
      Math.hypot(s.x - targetSys.x, s.y - targetSys.y) < 250)
    .slice(0, 2);

  const newGalaxy = game.galaxy.map(s => {
    if (s.id === targetSys.id || seeds.find(sd => sd.id === s.id)) {
      return { ...s, alienCount: 1, alienDays: 0 };
    }
    return s;
  });

  return {
    ...game,
    galaxy: newGalaxy,
    alienInvasionActive: true,
    log: [{ type: 'bad', text: '🚨 ALIEN INVASION DETECTED near ' + targetSys.name + '!' }, ...game.log],
  };
}

// ── Artifact sell at scientist (hi-tech planets) ─────────────────────────────

export function sellArtifactsAtScientist(game, qty) {
  const sys = game.galaxy[game.currentSystem];
  // Only hi-tech (tech >= 6) unoccupied planets
  if (sys.tech < 6 || (sys.alienCount || 0) >= 5) return null;

  const artCargo = game.cargo.find(c => c.id === 'alien_artifact');
  if (!artCargo || artCargo.qty < qty) return null;

  const price = 5000; // scientist pays more
  const total = qty * price;
  const newCargo = game.cargo
    .map(c => c.id === 'alien_artifact' ? { ...c, qty: c.qty - qty } : c)
    .filter(c => c.qty > 0);

  return {
    ...game,
    credits: game.credits + total,
    cargo: newCargo,
    log: [{ type: 'good', text: 'Scientist purchased ' + qty + ' artifact(s) for ' + total.toLocaleString() + ' cr' }, ...game.log],
  };
}

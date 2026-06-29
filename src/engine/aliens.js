import { ALIEN_SHIPS, ALIEN_ARTIFACT, OCCUPATION_SPEED } from '../constants/aliens.js';
import { rnd, pick } from './utils.js';

// ── Occupation status ─────────────────────────────────────────────────────────

export function getOccupationStatus(sys) {
  if (!sys.alienCount) return null;
  const days  = sys.alienDays || 0;
  const speed = OCCUPATION_SPEED.fast.includes(sys.size)   ? 'fast'
              : OCCUPATION_SPEED.medium.includes(sys.size) ? 'medium' : 'slow';

  if (sys.alienCount < 5) return 'scouted';

  // Full occupation — speed determines anarchy timeline
  if (speed === 'fast')   return 'occupied_anarchy';
  if (speed === 'medium') return days >= 30  ? 'occupied_anarchy' : 'occupied_dictatorship';
  /* slow */              return days >= 60  ? 'occupied_anarchy'
                               : days >= 30 ? 'occupied_dictatorship' : 'scouted';
}

// What services are available on an occupied planet
export function getOccupiedServices(sys) {
  const status = getOccupationStatus(sys);
  if (!status || status === 'scouted') return { market: true, repair: true, shields: true };
  const anarchy = status === 'occupied_anarchy';
  return {
    market:  false,                              // always gone under occupation
    repair:  sys.tech >= 2,                      // hull repair if tech allows
    shields: !anarchy && sys.tech >= 2,          // shields only in dictatorship phase
  };
}

// ── Alien encounter generation ────────────────────────────────────────────────

export function generateAlienEncounter(system, player) {
  const alienCount = system.alienCount || 0;
  const status     = getOccupationStatus(system);

  // Encounter chance: 0 in non-invaded; scales with alien density
  // Also possible in neighbouring systems (passed in from travel.js)
  const threat = alienCount >= 5 ? 3 : alienCount >= 3 ? 2 : 1;
  const shipTemplate = threat >= 3 ? ALIEN_SHIPS[2]   // dreadnought
                     : threat >= 2 ? ALIEN_SHIPS[1]   // cruiser
                     : ALIEN_SHIPS[0];                 // scout

  // Wave: occupied systems may send 2 ships
  const maxWaves = status === 'occupied_anarchy' && alienCount >= 4 ? 2 : 1;

  return {
    type: "alien",
    sub: shipTemplate.id,
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

// ── Combat round for aliens ───────────────────────────────────────────────────

export function doAlienCombatRound(game, encounter, action) {
  const hasRegenInhibitor = (game.gadgets || []).some(g => g.id === 'regen_inhibitor');
  const hasCloaking       = (game.gadgets || []).some(g => g.id === 'cloaking_device');
  const hasDisruptor      = (game.weapons || []).some(w => w.id === 'alien_disruptor');
  const eff               = effectiveSkillsLocal(game);

  const log = [];
  let playerHull    = game.hull;
  let playerShields = game.shields.reduce ? game.shields.reduce((s, sh) => s + sh.current, 0) : 0;
  let alienHull     = encounter.hull;
  let ended = false;
  let result = null;

  // ── Player attacks ────────────────────────────────────────────────────────
  if (action === 'fight') {
    const hitChance = Math.min(0.95, 0.55 + eff.fighter * 0.04);
    if (Math.random() < hitChance) {
      const weapon     = game.weapons?.[0];
      let baseDmg = weapon ? rnd(5, weapon.damage) : rnd(3, 8);
      if (hasDisruptor) baseDmg = Math.round(baseDmg * 1.5); // disruptor bonus vs aliens
      alienHull -= baseDmg;

      // Extra shots for multi-weapon alien disruptors
      if (hasDisruptor && game.weapons.filter(w => w.id === 'alien_disruptor').length > 1) {
        const bonus = rnd(5, 15);
        alienHull -= bonus;
        log.push({ type: 'good', text: 'Disruptor secondary shot: ' + bonus + ' dmg' });
      }
      log.push({ type: 'good', text: 'Hit ' + encounter.ship.name + ' for ' + baseDmg + ' dmg (hull: ' + Math.max(0, alienHull) + ')' });
    } else {
      log.push({ type: 'warn', text: 'Missed!' });
    }

    // Alien dead?
    if (alienHull <= 0) {
      ended = true; result = 'win';
      log.push({ type: 'good', text: encounter.ship.name + ' destroyed!' });
      return { playerHull, playerShields, alienHull: 0, log, ended, result, fled: false };
    }
  }

  // ── Alien regeneration ────────────────────────────────────────────────────
  if (!hasRegenInhibitor && encounter.regen > 0) {
    const regen = encounter.regen;
    alienHull = Math.min(encounter.hullMax, alienHull + regen);
    log.push({ type: 'info', text: encounter.ship.name + ' regenerates ' + regen + ' hull' });
  } else if (hasRegenInhibitor && encounter.regen > 0) {
    log.push({ type: 'good', text: 'Regen Inhibitor blocks regeneration!' });
  }

  // ── Alien attacks ─────────────────────────────────────────────────────────
  const evadeChance = Math.min(0.40, 0.10 + eff.pilot * 0.03);

  // Pulse shots (each weapon fires)
  for (let i = 0; i < encounter.weapons; i++) {
    if (Math.random() < evadeChance) { log.push({ type: 'good', text: 'Evaded alien shot!' }); continue; }
    const dmg = rnd(encounter.pulseDamage[0], encounter.pulseDamage[1]);
    if (playerShields > 0) {
      const absorbed = Math.min(playerShields, dmg);
      playerShields -= absorbed;
      const bleed = dmg - absorbed;
      if (bleed > 0) playerHull -= bleed;
      log.push({ type: 'bad', text: 'Alien pulse: ' + dmg + ' dmg (shield absorbed ' + absorbed + ')' });
    } else {
      playerHull -= dmg;
      log.push({ type: 'bad', text: 'Alien pulse: ' + dmg + ' dmg' });
    }
  }

  // Plasma burst (cruiser/dreadnought)
  if (encounter.hasPlasma && encounter.plasma && Math.random() < encounter.plasma.chance) {
    const dmg = encounter.plasma.damage;
    // Plasma ignores shields
    playerHull -= dmg;
    log.push({ type: 'bad', text: '⚡ PLASMA BURST: ' + dmg + ' dmg (bypasses shields!)' });
  }

  // Player dead?
  if (playerHull <= 0) {
    ended = true; result = 'dead';
    log.push({ type: 'bad', text: 'Ship destroyed by aliens!' });
  }

  return { playerHull, playerShields, alienHull, log, ended, result, fled: false };
}

// Minimal effectiveSkills copy to avoid circular dep
function effectiveSkillsLocal(game) {
  const base  = game.skills || {};
  const mercs = game.mercenaries || [];
  const result = {};
  for (const sk of ['pilot','fighter','trader','engineer']) {
    result[sk] = Math.min(10, (base[sk] || 0) + mercs.reduce((m, c) => m + (c.skills[sk] > (base[sk]||0) ? c.skills[sk] - (base[sk]||0) : 0), 0));
  }
  return result;
}

// ── Invasion tick (called every 3 days in travel.js) ─────────────────────────

export function tickAlienInvasion(game) {
  if (!game.alienInvasionActive) return { game, news: [] };

  const news = [];
  let newGalaxy = game.galaxy.map(s => ({ ...s }));

  for (let i = 0; i < newGalaxy.length; i++) {
    const sys = newGalaxy[i];
    if (!sys.alienCount) continue;

    // Age the occupation
    sys.alienDays = (sys.alienDays || 0) + 3;

    // NPC defense roll: police + 10% base per system tech
    const defenseStrength = (sys.police || 0) * 0.15 + (sys.tech || 0) * 0.05;
    if (Math.random() < defenseStrength && sys.alienCount > 0) {
      sys.alienCount = Math.max(0, sys.alienCount - 1);
      if (sys.alienCount === 0) {
        sys.alienDays = 0;
        news.push({ text: '✅ Defense forces repelled aliens from ' + sys.name + '!', event: true });
      } else {
        news.push({ text: '🛡 Defense forces fought back in ' + sys.name + ' (' + sys.alienCount + '/5)', event: true });
      }
    }

    // Spread: 5/5 aliens → attack nearest uninfected neighbour
    if (sys.alienCount >= 5) {
      const neighbours = newGalaxy
        .filter(s => s.id !== sys.id && !s.alienCount &&
          Math.hypot(s.x - sys.x, s.y - sys.y) < 200)
        .sort((a, b) => Math.hypot(a.x - sys.x, a.y - sys.y) -
                        Math.hypot(b.x - sys.x, b.y - sys.y));
      if (neighbours.length > 0) {
        const target = newGalaxy.find(s => s.id === neighbours[0].id);
        if (target) {
          target.alienCount = 1;
          target.alienDays  = 0;
          news.push({ text: '⚠ Alien forces advance toward ' + target.name + '!', event: true });
        }
      }
    }
  }

  // Game over if >30 systems occupied
  const occupiedCount = newGalaxy.filter(s => s.alienCount >= 5).length;
  const gameOver = occupiedCount >= 30;

  return {
    game: { ...game, galaxy: newGalaxy, alienOccupied: occupiedCount },
    news,
    gameOver,
  };
}

// ── Kill tracking ─────────────────────────────────────────────────────────────

export function onAlienKilled(game, systemId, alienShipType) {
  let newGame = { ...game };
  const sys = newGame.galaxy.find(s => s.id === systemId);

  // Reduce alien count in system
  if (sys && sys.alienCount > 0) {
    newGame.galaxy = newGame.galaxy.map(s =>
      s.id === systemId
        ? { ...s, alienCount: Math.max(0, s.alienCount - 1),
            alienDays: s.alienCount <= 1 ? 0 : s.alienDays }
        : s
    );
    if (sys.alienCount <= 1) {
      newGame.log = [{ type: 'good', text: sys.name + ' cleared of alien presence!' }, ...newGame.log];
    }
  }

  // Kill counter
  newGame.killedAliens = (newGame.killedAliens || 0) + 1;

  // Rep bonus for defending
  newGame.reputation = Math.min(10, (newGame.reputation || 0) + 1);

  // Artifact drop
  const ship = ALIEN_SHIPS.find(s => s.id === alienShipType) || ALIEN_SHIPS[0];
  if (Math.random() < ship.artifactChance) {
    const artifact = { id: 'alien_artifact', qty: 1, buyPrice: 0 };
    newGame.cargo = [...(newGame.cargo || []), artifact];
    newGame.alienArtifacts = (newGame.alienArtifacts || 0) + 1;
    newGame.log = [{ type: 'good', text: 'Alien artifact recovered! (total: ' + (newGame.alienArtifacts) + ')' }, ...newGame.log];
  }

  return newGame;
}

// ── Check if alien invasion should start ─────────────────────────────────────

export function checkAlienInvasionStart(game) {
  const quest = (game.quests || []).find(q => q.id === 'alien_invasion');
  if (!quest) return game;
  if (quest.status === 'done') return game;       // player saved the day
  if (game.alienInvasionActive) return game;       // already started

  // Start if quest failed OR deadline passed
  const shouldStart = quest.status === 'failed' ||
    (quest.daysLeft !== undefined && quest.daysLeft <= 0);
  if (!shouldStart) return game;

  // Seed invasion: 1-2 systems near quest target get 1 alien each
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
    log: [{ type: 'bad', text: '🚨 ALIEN INVASION DETECTED! First ships spotted near ' + targetSys.name }, ...game.log],
  };
}

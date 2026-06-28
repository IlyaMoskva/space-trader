import { SHIPS, WEAPONS, SHIELDS } from '../constants/ships.js';
import { rnd, pick } from './utils.js';

function effectiveSkills(game) {
  const mercs = game.mercenaries || [];
  const result = { ...game.skills };
  ["pilot","fighter","trader","engineer"].forEach(sk => {
    const best = mercs.reduce((m, merc) => Math.max(m, merc.skills[sk] || 0), 0);
    result[sk] = Math.max(result[sk], best);
  });
  return result;
}

function generatePirateShip(system, playerKills) {
  const kills = playerKills || 0;
  const techLevel = system?.tech || 0;

  // Threat score: 0-10 based on system tech + player reputation
  // Every 5 kills adds 1 threat point, capped at 5 from kills
  const threatFromKills = Math.min(5, Math.floor(kills / 5));
  const threat = Math.min(10, techLevel + threatFromKills);

  // Pick ship tier based on threat with some randomness
  let shipPool;
  if (threat <= 2) {
    shipPool = SHIPS.slice(0, 3);       // Flea, Gnat, Firefly
  } else if (threat <= 4) {
    shipPool = SHIPS.slice(1, 5);       // Gnat → Bumblebee
  } else if (threat <= 6) {
    shipPool = SHIPS.slice(3, 7);       // Mosquito → Hornet
  } else if (threat <= 8) {
    shipPool = SHIPS.slice(5, 9);       // Beetle → Termite
  } else {
    shipPool = SHIPS.slice(7, 10);      // Grasshopper → Wasp
  }

  const ship = pick(shipPool);

  // Pick weapon scaled to threat
  const weaponTier = Math.min(WEAPONS.length - 1, Math.floor(threat / 4));
  const weapon = WEAPONS[weaponTier];

  // Shields: only mid+ threat pirates have shields
  const shieldStrength = threat >= 5
    ? (threat >= 8 ? SHIELDS[1].strength : SHIELDS[0].strength)
    : 0;

  return { ship, weapon, hull: ship.hull, hullMax: ship.hull, shields: shieldStrength, shieldsMax: shieldStrength };
}

function generateEncounter(currentSystem, player) {
  const pilotSkill = player.skills?.pilot || 0;
  const rep = player.reputation || 0;
  const specialChance = 12;

  // Police: more aggressive toward criminals, less toward heroes
  // At rep -7..-10: police actively hunt (doubled chance)
  // At rep +7..+10: police give benefit of doubt (halved chance)
  const policeBase = currentSystem.police * 15 * (1 - pilotSkill * 0.04);
  const policeChance = rep <= -7 ? policeBase * 2
    : rep >= 7 ? policeBase * 0.5
    : policeBase;

  // Pirates: heroes attract stronger/more aggressive pirates
  // Pirates: criminals may be feared by weak pirates
  const pirateChance = currentSystem.pirates * 20;

  // Merchant: always possible, player can attack them as pirate
  const merchantChance = 15;

  // Bounty hunters: hunt players with rep <= -5
  const bountyChance = rep <= -5 ? Math.abs(rep) * 3 : 0;

  const r = rnd(0, 100);

  // Bounty hunters first (most dangerous for criminals)
  if (rep <= -5 && r < bountyChance) {
    const tierBonus = Math.floor(Math.abs(rep) / 3); // better ships for worse criminals
    const shipPool = SHIPS.slice(Math.min(4, tierBonus), Math.min(8, 4 + tierBonus));
    const ship = pick(shipPool);
    return {
      type: "police", sub: "bounty_hunter",
      ship, weapon: WEAPONS[Math.min(2, tierBonus)],
      hull: ship.hull + 30, hullMax: ship.hull + 30,
      shields: tierBonus >= 2 ? 200 : 0, shieldsMax: tierBonus >= 2 ? 200 : 0,
      bounty: true,
    };
  }

  if (r < specialChance) {
    const specials = ["marie_celeste","famous_captain","sealed_cargo","tonic","alien_machine","mercenary_offer"];
    return { type: "special", sub: pick(specials) };
  }

  if (r < specialChance + pirateChance) {
    const { ship, weapon, hull, hullMax, shields, shieldsMax } = generatePirateShip(currentSystem, player.killed);

    // High rep (+7..+10): pirates know you — come angrier, better equipped
    const angryMod = rep >= 7 ? 1 : 0;
    const finalWeapon = angryMod && weapon.id !== "military" ? WEAPONS[Math.min(WEAPONS.length-1, WEAPONS.indexOf(weapon)+1)] : weapon;
    const finalShields = angryMod ? Math.max(shields, 100) : shields;

    // Low rep (-7..-10): weak pirates may surrender without fighting
    const cowardChance = rep <= -7
      ? Math.max(0, (Math.abs(rep) - 6) * 0.10 - (SHIPS.indexOf(ship) * 0.05))
      : 0;

    const maxWaves = currentSystem.pirates >= 3 ? rnd(1, 3)
      : currentSystem.pirates >= 2 ? rnd(1, 2)
      : Math.random() < 0.25 ? 2 : 1;

    return {
      type: "pirate", ship,
      weapon: finalWeapon,
      hull, hullMax,
      shields: finalShields, shieldsMax: finalShields,
      wave: 1, maxWaves,
      cowardChance,  // pirate may flee on sight
      angry: angryMod > 0,
    };
  }

  if (r < specialChance + pirateChance + policeChance) {
    // Criminal player: police is hostile (wants to arrest)
    const hostile = rep <= -6;
    if (hostile) {
      const tierBonus = Math.floor(Math.abs(rep) / 3);
      const ship = SHIPS[Math.min(SHIPS.length-1, 3 + tierBonus)];
      return {
        type: "police", sub: "hostile",
        ship, weapon: WEAPONS[Math.min(2, tierBonus)],
        hull: ship.hull, hullMax: ship.hull,
        shields: 100, shieldsMax: 100,
      };
    }
    return { type: "police", contraband: player.cargo.some(c => {
      const com = COMMODITIES.find(x => x.id === c.id);
      return com && com.illegal;
    })};
  }

  if (r < specialChance + pirateChance + policeChance + merchantChance) {
    // Merchant ship — player can trade or (if pirate) attack
    const sellGoods = [];
    const buyGoods  = [];
    const legalPool   = COMMODITIES.filter(c => !c.illegal);
    const illegalPool = COMMODITIES.filter(c => c.illegal);
    const usedSell = new Set();
    for (let i = 0; i < rnd(2,3); i++) {
      const available = legalPool.filter(x => !usedSell.has(x.id));
      if (!available.length) break;
      const c = available[Math.floor(Math.random() * available.length)];
      usedSell.add(c.id);
      sellGoods.push({ id: c.id, name: c.name, price: Math.round(c.base * (0.80 + Math.random() * 0.15)) });
    }
    const usedBuy = new Set();
    for (let i = 0; i < rnd(2,4); i++) {
      const available = [...legalPool.slice(0,3), ...illegalPool].filter(x => !usedBuy.has(x.id));
      if (!available.length) break;
      const c = Math.random() < 0.5 && illegalPool.filter(x => !usedBuy.has(x.id)).length > 0
        ? illegalPool.filter(x => !usedBuy.has(x.id))[0]
        : available[Math.floor(Math.random() * available.length)];
      usedBuy.add(c.id);
      const mult = c.illegal ? (0.90 + Math.random() * 0.40) : (0.85 + Math.random() * 0.20);
      buyGoods.push({ id: c.id, name: c.name, price: Math.round(c.base * mult), illegal: c.illegal });
    }
    // Pick a random merchant ship (small/mid class)
    const merchantShip = SHIPS[rnd(1, 5)];
    return { type: "trader", sellGoods, buyGoods, merchantShip };
  }

  return null;
}

function doCombatRound(player, enemy, playerAction) {
  const log = [];
  // Deep copy shields to prevent mutation of React state
  let newPlayer = { ...player, shields: player.shields.map(s => ({ ...s })) };
  let newEnemy = { ...enemy };
  let ended = false;
  let result = null;

  if (playerAction === "fight") {
    const weaponDmg = player.weapons.reduce((s, w) => s + w.damage, 0);
    const eff = effectiveSkills(player);
    const hitChance = 0.4 + eff.fighter * 0.05;
    if (Math.random() < hitChance) {
      let dmg = rnd(Math.floor(weaponDmg * 0.6), weaponDmg);
      if (newEnemy.shields > 0) {
        const absorbed = Math.min(newEnemy.shields, dmg);
        newEnemy.shields -= absorbed;
        dmg -= absorbed;
      }
      newEnemy.hull -= dmg;
      log.push({ type: "good", text: "Your lasers hit for " + (weaponDmg) + " dmg!" });
      if (newEnemy.hull <= 0) {
        log.push({ type: "good", text: "Enemy ship destroyed! You found cargo." });
        ended = true; result = "win";
      }
    } else {
      log.push({ type: "info", text: "Your shot missed." });
    }
  }

  if (!ended) {
    const enemyDmg = enemy.weapon ? rnd(5, enemy.weapon.damage) : rnd(3, 10);
    const effDef = effectiveSkills(newPlayer);
    const evadeChance = 0.2 + effDef.pilot * 0.04;

    // Pirate flee attempt: when hull < 25%
    // Escape chance = pirate pilot advantage OVER player, no base bonus
    // Positive only if pirate is genuinely better pilot than player
    if (!ended && newEnemy.hull > 0 && newEnemy.hull < newEnemy.hullMax * 0.25) {
      const shipIdx = SHIPS.findIndex(s => s.id === enemy.ship?.id) ?? 2;
      // Pirate pilot: 0–10 scale matching ship tier (Flea=1, Wasp=9)
      const piratePilotSkill = Math.round(1 + shipIdx * 0.88);
      const playerPilotSkill = effDef.pilot;
      // Escape chance: base 15% + 5% per level pirate exceeds player, capped 10-70%
      const escapeChance = Math.min(0.70, Math.max(0.10,
        0.15 + (piratePilotSkill - playerPilotSkill) * 0.05
      ));
      if (Math.random() < escapeChance) {
        log.push({ type: "warn", text: "Pirate ship is badly damaged — they're making a run for it!" });
        ended = true; result = "pirate_fled";
      }
    }
  }

  if (!ended) {
    const enemyDmg = enemy.weapon ? rnd(5, enemy.weapon.damage) : rnd(3, 10);
    const effDef = effectiveSkills(newPlayer);
    const evadeChance = 0.2 + effDef.pilot * 0.04;
    if (Math.random() > evadeChance) {
      let dmg = enemyDmg;
      const totalShields = newPlayer.shields.reduce((s, sh) => s + sh.current, 0);
      if (totalShields > 0) {
        const absorbed = Math.min(totalShields, dmg);
        dmg -= absorbed;
        let rem = absorbed;
        newPlayer.shields = newPlayer.shields.map(sh => {
          if (rem <= 0) return sh;
          const take = Math.min(sh.current, rem);
          rem -= take;
          return { ...sh, current: sh.current - take };
        });
        log.push({ type: "warn", text: "Shields absorbed " + absorbed + " damage." });
      }
      if (dmg > 0) {
        newPlayer.hull -= dmg;
        log.push({ type: "bad", text: "Hull hit for " + dmg + " damage!" });
      }
      if (newPlayer.hull <= 0) {
        if (newPlayer.gadgets.some(g => g.id === "escape_pod")) {
          log.push({ type: "bad", text: "Ship destroyed! Escape pod activated." });
          newPlayer.hull = 10; newPlayer.cargo = [];
          ended = true; result = "escaped";
        } else {
          log.push({ type: "bad", text: "Your ship is destroyed. GAME OVER." });
          ended = true; result = "dead";
        }
      }
    } else {
      log.push({ type: "info", text: "You evaded the attack!" });
    }
  }

  return { player: newPlayer, enemy: newEnemy, log, ended, result };
}

export { effectiveSkills, generatePirateShip, generateEncounter, doCombatRound };

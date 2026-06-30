import { COMMODITIES } from '../constants/commodities.js';
import { rnd, pick } from './utils.js';
import { SHIPS, WEAPONS } from '../constants/ships.js';
import { getStoryAct, questUnlocked } from './story.js';

function generateQuests(systems) {
  const quests = [];
  const sysIds = systems.map(s => s.id);

  // Act 2: Dragonfly — stolen experimental ship
  const q1sys = pick(sysIds.slice(5));
  quests.push({
    id: "dragonfly", name: "Dragonfly", status: "hidden",
    targetSystem: q1sys, unlockAct: 2,
    hint: "Rumours speak of an experimental ship spotted near " + systems[q1sys].name + ".",
    desc: "The stolen ship DRAGONFLY was last seen near " + systems[q1sys].name + ". Destroy it to claim the experimental shield.",
    reward: "lightning_shield", emoji: "🐉",
  });

  // Act 3: Alien Invasion — deadline starts when quest is revealed
  // Target system is far from Lave so player needs real travel time
  const q2sys = pick(sysIds.slice(8));
  quests.push({
    id: "alien_invasion", name: "Alien Invasion", status: "hidden",
    targetSystem: q2sys, unlockAct: 3,
    daysLeft: null, // set when revealed: rnd(12,18)
    hint: "Emergency broadcast: alien fleet detected heading for " + systems[q2sys].name + "!",
    desc: "Warn defenses at " + systems[q2sys].name + " and defend against the first wave. Reward: Fuel Compressor.",
    reward: "fuel_compressor", emoji: "👾",
  });

  // Act 2: Wild — smuggle passenger (no change)
  const q3sys = pick(sysIds.slice(8).filter(id => id !== q2sys));
  quests.push({
    id: "wild", name: "Smuggle Wild", status: "hidden",
    targetSystem: q3sys, unlockAct: 2,
    hint: "A shady figure in the spaceport is looking for a discreet pilot heading toward " + systems[q3sys].name + ".",
    desc: "Smuggle Wild to " + systems[q3sys].name + ". Requires Beam Laser+. Reward: +1 Pilot.",
    reward: "pilot_skill", requiresBeamLaser: true, emoji: "🤝",
  });

  // Act 5: Mothership — final battle (revealed in Act 5)
  const q5sys = pick(sysIds.slice(10).filter(id => id !== q2sys && id !== q3sys));
  quests.push({
    id: "mothership", name: "Alien Mothership", status: "hidden",
    targetSystem: q5sys, unlockAct: 5,
    hint: "Intelligence reports: an alien Mothership coordinates the invasion from near " + systems[q5sys].name + ".",
    desc: "Destroy the Alien Mothership near " + systems[q5sys].name + ". Ending the invasion requires destroying it. Extreme danger.",
    reward: "mothership_victory", emoji: "💥",
  });

  return quests;
}

function revealQuestHints(game, arrivedSystemId) {
  let newGame = { ...game };
  const act    = getStoryAct(newGame);
  const hidden = newGame.quests.filter(q =>
    q.status === "hidden" && questUnlocked(q.id, act)
  );
  if (hidden.length === 0) return newGame;

  // 60% chance per arrival to reveal one eligible hidden quest
  if (Math.random() > 0.6) return newGame;

  const q = pick(hidden);

  // Set deadline for alien_invasion at reveal time
  const extra = q.id === "alien_invasion"
    ? { daysLeft: rnd(12, 18), deadlineSetDay: newGame.days }
    : {};

  newGame.quests = newGame.quests.map(x =>
    x.id === q.id ? { ...x, status: "available", ...extra } : x
  );
  newGame.news = [{ text: q.hint, quest: true }, ...(newGame.news || [])].slice(0, 8);
  newGame.log  = [{ type: "warn", text: "► New special contract: " + q.name + " — check JOBS." }, ...newGame.log];
  return newGame;
}

function checkQuestArrival(game, arrivedSystemId) {
  let newGame = { ...game };
  let popups  = [];

  newGame.quests = newGame.quests.map(q => {
    if (q.status !== "available") return q;
    if (q.targetSystem !== arrivedSystemId) return q;

    // ── Alien Invasion ────────────────────────────────────────────────────────
    if (q.id === "alien_invasion") {
      // Trigger defensive battle — 3 scouts
      const wave = {
        type: "alien", sub: "alien_scout",
        ship: { ...SHIPS[1], name: "Alien Scout" },
        hull: 80, hullMax: 80, shields: 0, shieldsMax: 0,
        regen: 3, hasPlasma: false, plasma: null,
        pulseDamage: [5,15], weapons: 1, fleeHard: true,
        wave: 1, maxWaves: 3,
        questId: q.id,
        isDefensiveBattle: true,
      };
      popups.push({
        title: "👾 ALIEN VANGUARD!",
        body: "You arrive just as the alien scouts emerge from hyperspace. 3 ships detected!\n\nDefend the planet — destroy all 3 to secure the system.",
        color: "#ff4400",
        encounter: wave,
      });
      // Quest stays "available" — completion handled in useCombat after winning all waves
      return q;
    }

    // ── Dragonfly ─────────────────────────────────────────────────────────────
    if (q.id === "dragonfly") {
      popups.push({
        title: "🐉 DRAGONFLY SPOTTED!",
        body: "The stolen ship DRAGONFLY is here! Its experimental shields are active. You must destroy it to claim the reward.",
        color: "#ff6b35",
        encounter: {
          type: "boss", sub: "dragonfly",
          ship: { ...SHIPS[4], name: "Dragonfly", emoji: "🐉" },
          weapon: WEAPONS[2], hull: 180, hullMax: 180, shields: 250, shieldsMax: 250,
        },
      });
      return q;
    }

    // ── Wild ──────────────────────────────────────────────────────────────────
    if (q.id === "wild") {
      const hasBeam = game.weapons.some(w => w.id === "beam" || w.id === "military" || w.id === "alien_disruptor");
      if (!hasBeam) {
        popups.push({ title: "🚔 WILD QUEST", body: "Wild won't board without protection. You need a Beam Laser or better.", color: "#ff6b35" });
        return q;
      }
      newGame.skills = { ...newGame.skills, pilot: Math.min(10, newGame.skills.pilot + 1) };
      newGame.log    = [{ type: "good", text: "Wild delivered safely. +1 Pilot!" }, ...newGame.log];
      popups.push({ title: "🤝 WILD DELIVERED!", body: "Wild is safely delivered. You slipped through three police checkpoints like a ghost.\n\nReward: +1 Pilot skill.", color: "#4fc3f7" });
      return { ...q, status: "done" };
    }

    // ── Mothership ────────────────────────────────────────────────────────────
    if (q.id === "mothership") {
      // Wave 1+2: cruiser escorts; wave 3: mothership
      const escort = {
        type: "alien", sub: "alien_cruiser",
        ship: { id: "alien_cruiser", name: "Alien Cruiser", emoji: "👾👾",
                hull: 180, hullMax: 180 },
        hull: 180, hullMax: 180, shields: 0, shieldsMax: 0,
        regen: 5, hasPlasma: true,
        plasma: { damage: 60, chance: 0.25 },
        pulseDamage: [5, 15], weapons: 2, fleeHard: false,
        hitAccuracy: 1.0,
        wave: 1, maxWaves: 3,
        isMothership: false, questId: q.id,
        isEscort: true,
      };
      popups.push({
        title: "💥 ALIEN MOTHERSHIP DETECTED",
        body: "The colossal Mothership looms ahead — surrounded by escort cruisers.\n\n2 cruisers guard the approach. Destroy them to reach the Mothership.\n\nWarning: extreme danger.",
        color: "#ff0000",
        encounter: escort,
      });
      return q;
    }

    return q;
  });

  return { newGame, popups };
}

export { generateQuests, revealQuestHints, checkQuestArrival };

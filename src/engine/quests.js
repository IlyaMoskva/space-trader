import { COMMODITIES } from '../constants/commodities.js';
import { rnd, pick } from './utils.js';
import { SHIPS, WEAPONS } from '../constants/ships.js';

function generateQuests(systems) {
  const quests = [];
  const sysIds = systems.map(s => s.id);

  const q1sys = pick(sysIds.slice(5));
  quests.push({ id: "dragonfly", name: "Dragonfly", status: "hidden", targetSystem: q1sys,
    hint: "Rumours speak of an experimental ship spotted near " + systems[q1sys].name + ".",
    desc: "The stolen ship DRAGONFLY was last seen near " + systems[q1sys].name + ". Destroy it to claim the experimental shield.",
    reward: "lightning_shield", emoji: "🐉" });

  const q2sys = pick(sysIds.slice(3));
  quests.push({ id: "alien_invasion", name: "Alien Invasion", status: "hidden", targetSystem: q2sys, daysLeft: rnd(10, 16),
    hint: "Emergency broadcast: alien fleet detected heading for " + systems[q2sys].name + "!",
    desc: "Warn defenses at " + systems[q2sys].name + " before the deadline. Reward: Fuel Compressor.",
    reward: "fuel_compressor", emoji: "👾" });

  const q3sys = pick(sysIds.slice(8));
  quests.push({ id: "wild", name: "Smuggle Wild", status: "hidden", targetSystem: q3sys,
    hint: "A shady figure in the spaceport is looking for a discreet pilot heading toward " + systems[q3sys].name + ".",
    desc: "Smuggle Wild to " + systems[q3sys].name + ". Requires Beam Laser+. Reward: +1 Pilot.",
    reward: "mercenary", requiresBeamLaser: true, emoji: "🤝" });

  const q4sys = pick(sysIds.slice(2));
  quests.push({ id: "doctor", name: "Warn the Doctor", status: "hidden", targetSystem: q4sys, daysLeft: 12,
    hint: "Urgent message intercepted: a scientist on " + systems[q4sys].name + " must be warned within 12 days.",
    desc: "Reach " + systems[q4sys].name + " in 12 days and stop the experiment. Reward: Portable Singularity.",
    reward: "singularity", emoji: "🔬" });

  return quests;
}

function revealQuestHints(game, arrivedSystemId) {
  let newGame = { ...game };
  const hidden = newGame.quests.filter(q => q.status === "hidden");
  if (hidden.length === 0) return newGame;

  // Each visit: 60% chance to reveal one hidden quest via news
  if (Math.random() > 0.6) return newGame;

  const q = pick(hidden);
  newGame.quests = newGame.quests.map(x =>
    x.id === q.id ? { ...x, status: "available" } : x
  );
  // Add hint to news feed
  newGame.news = [{ text: q.hint, quest: true }, ...(newGame.news || [])].slice(0, 8);
  newGame.log = [{ type: "warn", text: "New special contract available — check JOBS." }, ...newGame.log];
  return newGame;
}

function checkQuestArrival(game, arrivedSystemId) {
  let newGame = { ...game };
  let popups = [];

  newGame.quests = newGame.quests.map(q => {
    if (q.status !== "available") return q;
    if (q.targetSystem !== arrivedSystemId) return q;

    // Quest-specific completion logic
    if (q.id === "alien_invasion") {
      newGame.specialItems = [...(newGame.specialItems || []), "fuel_compressor"];
      newGame.log = [{ type: "good", text: "Alien Invasion: PLANET SAVED! Reward: Fuel Compressor." }, ...newGame.log];
      popups.push({ title: "👾 ALIENS REPELLED!", body: "You arrived in time. The planetary defense forces scramble at your warning. The alien fleet retreats.\n\nReward: Fuel Compressor installed — jump range +3 parsecs.", color: "#00ff88" });
      return { ...q, status: "done" };
    }

    if (q.id === "doctor") {
      newGame.specialItems = [...(newGame.specialItems || []), "singularity"];
      newGame.log = [{ type: "good", text: "Doctor warned! Experiment cancelled. Reward: Portable Singularity." }, ...newGame.log];
      popups.push({ title: "🔬 EXPERIMENT HALTED!", body: "You reach the lab just in time. The doctor listens. The universe breathes again.\n\nReward: Portable Singularity — instant jump to any system.", color: "#ffd700" });
      return { ...q, status: "done" };
    }

    if (q.id === "dragonfly") {
      // Trigger a boss fight — handled via encounter
      popups.push({ title: "🐉 DRAGONFLY SPOTTED!", body: "The stolen ship DRAGONFLY is here! Its experimental shields are active. You must destroy it to claim the reward.", color: "#ff6b35", encounter: { type: "boss", sub: "dragonfly", ship: { ...SHIPS[4], name: "Dragonfly", emoji: "🐉" }, weapon: WEAPONS[2], hull: 180, hullMax: 180, shields: 250, shieldsMax: 250 } });
      return q;
    }

    if (q.id === "wild") {
      const hasBeam = game.weapons.some(w => w.id === "beam" || w.id === "military");
      if (!hasBeam) {
        popups.push({ title: "🚔 WILD QUEST", body: "Wild won't board without protection. You need a Beam Laser or better.", color: "#ff6b35" });
        return q;
      }
      newGame.skills = { ...newGame.skills, pilot: Math.min(10, newGame.skills.pilot + 1) };
      newGame.log = [{ type: "good", text: "Wild delivered safely. +1 Pilot!" }, ...newGame.log];
      popups.push({ title: "🤝 WILD DELIVERED!", body: "Wild is safely delivered. You slipped through three police checkpoints like a ghost.\n\nReward: +1 Pilot skill + free mercenary slot.", color: "#4fc3f7" });
      return { ...q, status: "done" };
    }

    return q;
  });

  return { newGame, popups };
}

export { generateQuests, revealQuestHints, checkQuestArrival };

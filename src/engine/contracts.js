import { COMMODITIES } from '../constants/commodities.js';
import { CONTRACT_NAMES } from '../constants/events.js';
import { rnd, pick, dist, distParsecs } from './utils.js';

function generateContracts(system, galaxy, days) {
  const contracts = [];
  const sysName = system.name;
  const count = 1 + Math.floor((system.size + system.tech) / 5);

  // Track used types and target systems to avoid duplicates
  const usedTypes = new Set();
  const usedTargets = new Set([system.id]);

  // Shuffle contract types for this system
  const typePool = ["delivery", "extermination", "assassination"]
    .sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(count, 3); i++) {
    // Pick a type not yet used this board
    const type = typePool[i] || pick(["delivery","extermination","assassination"]);
    if (usedTypes.has(type)) continue;
    usedTypes.add(type);

    if (type === "delivery") {
      const destinations = galaxy.filter(s =>
        s.id !== system.id && distParsecs(system, s) > 15
      );
      if (destinations.length === 0) continue;
      const dest = pick(destinations);
      const distance = Math.round(distParsecs(system, dest));
      const daysAllowed = Math.max(4, Math.round(distance / 10) + rnd(2, 5));
      const cargoQty = rnd(1, 4);
      const reward = Math.round((distance * 80 + cargoQty * 200 + rnd(0, 500)) / 50) * 50;
      contracts.push({
        id: "c_" + system.id + "_" + i + "_" + days,
        type: "delivery",
        title: pick(CONTRACT_NAMES.delivery),
        from: sysName, fromId: system.id,
        toId: dest.id, to: dest.name,
        cargoQty, daysAllowed,
        deadline: days + daysAllowed,
        reward, penalty: Math.round(reward * 0.3),
        status: "available", emoji: "📦",
      });

    } else if (type === "extermination") {
      // Pick a target system different from any already used
      const pirateSystems = galaxy.filter(s =>
        !usedTargets.has(s.id) && s.pirates >= 1 && distParsecs(system, s) < 30
      );
      const targetSys = pirateSystems.length > 0
        ? pick(pirateSystems)
        : galaxy.filter(s => !usedTargets.has(s.id) && s.id !== system.id)[0] || system;
      usedTargets.add(targetSys.id);

      const killCount = rnd(2, 5);
      const rewardPerKill = rnd(800, 2000);
      const reward = Math.round(killCount * rewardPerKill / 50) * 50;
      // Deadline: travel time + 2 days per kill + 2 buffer
      const travelDays = Math.ceil(dist(system, targetSys) / 120); // ~12pc/day average
      const daysAllowed = Math.max(8, travelDays + killCount * 2 + 2);
      contracts.push({
        id: "c_" + system.id + "_" + i + "_" + days,
        type: "extermination",
        title: pick(CONTRACT_NAMES.extermination),
        from: sysName, fromId: system.id,
        targetSystemId: targetSys.id,
        targetSystemName: targetSys.name,
        killCount, killsCompleted: 0, daysAllowed,
        deadline: days + daysAllowed,
        reward, penalty: Math.round(reward * 0.2),
        status: "available", emoji: "⚔️",
      });

    } else {
      // assassination — unique target system
      const candidates = galaxy.filter(s =>
        !usedTargets.has(s.id) && s.id !== system.id && distParsecs(system, s) < 60
      );
      if (candidates.length === 0) continue;
      const targetSys = pick(candidates);
      usedTargets.add(targetSys.id);

      const targetName = pick(CONTRACT_NAMES.assassination);
      // Assassination: highest risk, highest reward — named target, boss fight
      const reward = Math.round(rnd(5000, 15000) / 500) * 500;
      const daysAllowed = rnd(6, 12);
      contracts.push({
        id: "c_" + system.id + "_" + i + "_" + days,
        type: "assassination",
        title: "Eliminate: " + targetName,
        from: sysName, fromId: system.id,
        targetSystemId: targetSys.id,
        targetSystemName: targetSys.name,
        targetName, daysAllowed,
        deadline: days + daysAllowed,
        reward, penalty: 0,
        status: "available", emoji: "🎯",
      });
    }
  }
  return contracts;
}

function checkContractArrival(game, arrivedSystemId) {
  let newGame = { ...game };
  const completedContracts = [];
  const failedContracts = [];

  newGame.activeContracts = (newGame.activeContracts || []).map(c => {
    // Delivery completion
    if (c.type === "delivery" && c.toId === arrivedSystemId && c.status === "active") {
      const newCargo = newGame.cargo.map(item =>
        item.id === "contract_cargo_" + c.id
          ? { ...item, qty: item.qty - c.cargoQty }
          : item
      ).filter(item => item.qty > 0);
      newGame.cargo = newCargo;
      newGame.credits += c.reward;
      newGame.reputation = (newGame.reputation || 0) + 2;
      completedContracts.push(c);
      newGame.log = [{ type: "good", text: "Delivery complete: " + c.title + " → +" + c.reward + " cr" }, ...newGame.log];
      return { ...c, status: "done" };
    }
    // Assassination completion
    if (c.type === "assassination" && c.targetSystemId === arrivedSystemId && c.status === "active") {
      // Will trigger boss encounter — mark as pending fight
      return { ...c, status: "pending_fight" };
    }
    return c;
  });

  // Bonus rep for carrying crisis goods — medicine in plague, food in drought/war, water in drought
  const arrivedSys = newGame.galaxy[arrivedSystemId];
  const events = arrivedSys?.market?.events || [];
  const crisisMap = {
    plague:   ["medicine"],
    drought:  ["food", "water"],
    war:      ["food", "medicine", "machines"],
    coldwinter: ["food", "medicine"],
  };
  const crisisBonusGoods = new Set(
    events.flatMap(e => crisisMap[e.id] || [])
  );
  if (crisisBonusGoods.size > 0) {
    const cargoIds = new Set(newGame.cargo.map(c => c.id));
    const hasCrisisGoods = [...crisisBonusGoods].some(id => cargoIds.has(id));
    if (hasCrisisGoods) {
      newGame.reputation = Math.min(10, (newGame.reputation || 0) + 1);
      const goodsList = [...crisisBonusGoods].filter(id => cargoIds.has(id)).join(", ");
      newGame.log = [{ type: "good", text: "Crisis relief appreciated! Brought " + goodsList + " during " + events[0].text + " → Rep +1" }, ...newGame.log];
    }
  }

  return { newGame, completedContracts, failedContracts };
}

function onPirateKilled(game) {
  let newGame = { ...game };
  newGame.activeContracts = (newGame.activeContracts || []).map(c => {
    if (c.type === "extermination" && c.status === "active" &&
        c.targetSystemId === game.currentSystem) {
      if (c.deadline < game.days) return c;
      const done = c.killsCompleted + 1 >= c.killCount;
      if (done) {
        newGame.credits += c.reward;
        newGame.reputation = (newGame.reputation || 0) + 1;
        // "He's our killer" — gov contracts can expunge one kill from record
        const totalKills = (newGame.killedCivilian || 0) + (newGame.killedPolice || 0);
        if (totalKills > 0) {
          if ((newGame.killedPolice || 0) > 0)
            newGame.killedPolice = newGame.killedPolice - 1;
          else
            newGame.killedCivilian = newGame.killedCivilian - 1;
          newGame.log = [{ type: "good", text: "Extermination complete! +" + c.reward + " cr · Gov cleared 1 kill from your record" }, ...newGame.log];
        } else {
          newGame.log = [{ type: "good", text: "Extermination contract complete! +" + c.reward + " cr" }, ...newGame.log];
        }
        return { ...c, killsCompleted: c.killsCompleted + 1, status: "done" };
      }
      newGame.log = [{ type: "info", text: "Kill " + (c.killsCompleted + 1) + "/" + c.killCount + " — " + c.title }, ...newGame.log];
      return { ...c, killsCompleted: c.killsCompleted + 1 };
    }
    return c;
  });
  return newGame;
}

function onPirateJobKill(game, sub) {
  // Called when player kills civilian (sub="civilian") or police (sub="hostile"/"bounty_hunter")
  let newGame = { ...game };
  const killType = (sub === "civilian") ? ["diplomat", "freighter"] : ["patrol"];

  newGame.activeContracts = (newGame.activeContracts || []).map(c => {
    if (c.type !== "pirate_job" || c.status !== "active") return c;
    if (!killType.includes(c.subType)) return c;
    if (c.targetSystemId !== game.currentSystem) return c;
    if (c.deadline < game.days) return c;

    // Contract complete — pay out
    newGame.credits += c.reward;
    newGame.reputation = Math.max(-10, (newGame.reputation || 0) + c.repCost);

    // Optional equipment reward
    if (c.rewardItem === "military_laser") {
      const laser = { id: "military", name: "Military Laser", damage: 35, price: 35000, minTech: 6 };
      if (newGame.weapons.length < newGame.ship.slots_w)
        newGame.weapons = [...newGame.weapons, laser];
    } else if (c.rewardItem === "energy_shield") {
      const shield = { id: "energy", name: "Energy Shield", strength: 200, max: 200, current: 200, price: 25000, minTech: 5 };
      if (newGame.shields.length < newGame.ship.slots_s)
        newGame.shields = [...newGame.shields, shield];
    } else if (c.rewardItem === "beam_laser") {
      const laser = { id: "beam", name: "Beam Laser", damage: 25, price: 12000, minTech: 4 };
      if (newGame.weapons.length < newGame.ship.slots_w)
        newGame.weapons = [...newGame.weapons, laser];
    }

    const itemNote = c.rewardItem ? " + equipment" : "";
    newGame.log = [{ type: "warn", text: "Pirate contract done: " + c.reward.toLocaleString() + " cr" + itemNote + ". Rep " + c.repCost }, ...newGame.log];
    return { ...c, status: "done" };
  });
  return newGame;
}

export { generateContracts, checkContractArrival, onPirateKilled, onPirateJobKill };

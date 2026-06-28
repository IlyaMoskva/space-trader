import { useState, useCallback, useRef } from "react";
import { doCombatRound, generatePirateShip } from "../engine/combat.js";
import { effectiveSkills } from "../engine/combat.js";
import { onPirateKilled } from "../engine/contracts.js";
import { SHIPS } from "../constants/ships.js";
import { rnd } from "../engine/utils.js";

export function useCombat({ game, encounter, onUpdate, onDone }) {
  const [combatLog, setCombatLog] = useState([]);
  const [enemy, setEnemy]         = useState(encounter?.type === "pirate" ? encounter : null);
  const [phase, setPhase]         = useState("choice");

  const gameRef = useRef(game);
  gameRef.current = game;

  const flee = useCallback(() => {
    const fleeChance = 0.3 + (game.skills.pilot || 0) * 0.06;
    if (Math.random() < fleeChance) {
      onUpdate({ ...game, log: [{ type: "info", text: "Fled from " + encounter.type + "!" }, ...game.log] });
      onDone();
    } else {
      setCombatLog(l => [{ type: "bad", text: "Failed to flee!" }, ...l]);
      if (encounter.type === "pirate" && phase !== "choice") {
        fightRound("flee_failed");
      }
    }
  }, [game, encounter, phase, onUpdate, onDone]);

  const surrender = useCallback(() => {
    const lostCargo = game.cargo.slice(0, Math.ceil(game.cargo.length / 2));
    const newCargo  = game.cargo.slice(Math.ceil(game.cargo.length / 2));
    onUpdate({ ...game, cargo: newCargo,
      log: [{ type: "warn", text: "Surrendered. Lost " + lostCargo.length + " cargo types." }, ...game.log] });
    onDone();
  }, [game, onUpdate, onDone]);

  const fightRound = useCallback((action) => {
    if (!enemy || phase === "ended") return;
    setPhase("fighting");
    const currentGame = gameRef.current;
    const { player: newPlayer, enemy: newEnemy, log: roundLog, ended, result } =
      doCombatRound(currentGame, enemy, action || "fight");
    setCombatLog(l => [...roundLog, ...l].slice(0, 20));
    setEnemy(newEnemy);

    if (ended) {
      setPhase("ended");
      let finalGame = { ...currentGame, hull: newPlayer.hull, shields: newPlayer.shields, cargo: newPlayer.cargo };

      if (result === "win") {
        if (encounter.sub === "assassination" && encounter.contractId) {
          const contract = finalGame.activeContracts?.find(c => c.id === encounter.contractId);
          if (contract) {
            finalGame.credits += contract.reward;
            finalGame.reputation = (finalGame.reputation || 0) + 3;
            finalGame.activeContracts = finalGame.activeContracts.map(c =>
              c.id === encounter.contractId ? { ...c, status: "done" } : c);
            finalGame.log = [{ type: "good", text: contract.targetName + " eliminated! Reward: " + contract.reward.toLocaleString() + " cr" }, ...finalGame.log];
          }
        } else if (encounter.sub === "dragonfly") {
          const ls = { id: "lightning", name: "Lightning Shield", strength: 350, max: 350, current: 350, price: 80000 };
          if (finalGame.shields.length < finalGame.ship.slots_s) {
            finalGame.shields = [...finalGame.shields, ls];
            finalGame.log = [{ type: "good", text: "DRAGONFLY destroyed! Lightning Shield installed." }, ...finalGame.log];
          } else {
            finalGame.specialItems = [...(finalGame.specialItems || []), "lightning_shield"];
            finalGame.log = [{ type: "good", text: "DRAGONFLY destroyed! Lightning Shield salvaged — check SHIP → STATUS." }, ...finalGame.log];
          }
          finalGame.quests = finalGame.quests.map(q => q.id === "dragonfly" ? { ...q, status: "done" } : q);
        } else {
          // Regular pirate
          const shipIdx = Math.max(0, SHIPS.findIndex(s => s.id === encounter?.ship?.id));
          const bounty = Math.round((300 + shipIdx * 200 + rnd(0, 300)) / 50) * 50;
          finalGame.credits += bounty;
          finalGame.killed = (finalGame.killed || 0) + 1;
          finalGame = onPirateKilled(finalGame);
          finalGame.log = [{ type: "good", text: "Destroyed " + (encounter?.ship?.name || "pirate") + "! Bounty: " + bounty + " cr" }, ...finalGame.log];

          // Combat skill gain
          const eff = effectiveSkills(finalGame);
          const myWeaponTier = finalGame.weapons.length
            ? Math.max(...finalGame.weapons.map(w => w.id==="military"?3:w.id==="beam"?2:1)) : 0;
          const myShipTier = SHIPS.findIndex(s => s.id === finalGame.ship.id) ?? 0;
          // Fighter skill weighted most heavily — weapon/ship are tools, skill is experience
          const playerPower = Math.round((eff.fighter/10*6) + myWeaponTier*0.5 + (myShipTier/9*2));
          const enemyWeaponTier = encounter.weapon?.id==="military"?3:encounter.weapon?.id==="beam"?2:1;
          const enemyPower = Math.round((shipIdx/9*7) + enemyWeaponTier);
          const gainChance = Math.min(0.60, 0.08 + Math.max(0, (enemyPower - playerPower) * 0.12));
          const sk = finalGame.skills.pilot <= finalGame.skills.fighter ? "pilot" : "fighter";
          const cur = finalGame.skills[sk];
          // Diminishing returns: each level harder to gain (skill 9 = 40% of base chance)
          const diminished = gainChance * (1 - cur / 15);
          if (Math.random() < diminished) {
            if (cur < 10) {
              finalGame.skills = { ...finalGame.skills, [sk]: cur + 1 };
              finalGame.log = [{ type: "good", text: (sk === "pilot" ? "Pilot" : "Fighter") + " +1 (now " + (cur+1) + ")!" }, ...finalGame.log];
            }
          }

          // Wave attack
          const currentWave = encounter.wave || 1;
          const maxWaves = encounter.maxWaves || 1;
          if (currentWave < maxWaves) {
            const sys = finalGame.galaxy[finalGame.currentSystem];
            const nextPirate = generatePirateShip(sys, finalGame);
            const nextEnc = { ...nextPirate, type: "pirate", wave: currentWave + 1, maxWaves };
            finalGame.log = [{ type: "bad", text: "Another pirate closes in! Wave " + (currentWave+1) + "/" + maxWaves }, ...finalGame.log];
            onUpdate(finalGame);
            setTimeout(() => {
              setPhase("choice");
              setEnemy(nextEnc);
              setCombatLog([{ type: "bad", text: "⚠ Wave " + (currentWave+1) + "/" + maxWaves + " — another attacker!" }]);
              onDone(nextEnc);
            }, 1200);
            return;
          }
        }
      } else if (result === "pirate_fled") {
        const shipIdx = Math.max(0, SHIPS.findIndex(s => s.id === encounter?.ship?.id));
        const bounty = Math.round((150 + shipIdx * 100 + rnd(0, 150)) / 50) * 50;
        finalGame.credits += bounty;
        finalGame.log = [{ type: "warn", text: "Pirate escaped! Partial bounty: " + bounty + " cr" }, ...finalGame.log];
      } else if (result === "dead") {
        finalGame.dead = true;
      }
      onUpdate(finalGame);
      if (result !== "dead") setTimeout(() => onDone(), 800);
    } else {
      onUpdate({ ...currentGame, hull: newPlayer.hull, shields: newPlayer.shields });
    }
  }, [enemy, phase, encounter, onUpdate, onDone]);

  return { combatLog, enemy, phase, fightRound, flee, surrender };
}

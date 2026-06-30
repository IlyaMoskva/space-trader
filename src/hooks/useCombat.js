import { useState, useCallback, useRef, useEffect } from "react";
import { doCombatRound, generatePirateShip } from "../engine/combat.js";
import { effectiveSkills } from "../engine/combat.js";
import { onPirateKilled, onPirateJobKill } from "../engine/contracts.js";
import { SHIPS, WEAPONS } from "../constants/ships.js";
import { rnd, pick, applyEscapePod } from "../engine/utils.js";

export function useCombat({ game, encounter, onUpdate, onDone }) {
  const [combatLog, setCombatLog] = useState([]);
  const [enemy, setEnemy]         = useState(encounter?.type === "pirate" ? encounter : null);
  const [phase, setPhase]         = useState("choice");

  const gameRef = useRef(game);
  gameRef.current = game;

  const prevEncounterRef = useRef(encounter);
  useEffect(() => {
    if (prevEncounterRef.current === encounter) return; // same reference, skip
    prevEncounterRef.current = encounter;
    if (encounter?.type === "pirate") {
      setEnemy(encounter);
      setPhase("choice");
      setCombatLog([]);
    } else {
      setEnemy(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounter]);

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
            // High-value gov contract expunges up to 2 kills from record
            const totalKills = (finalGame.killedCivilian || 0) + (finalGame.killedPolice || 0);
            if (totalKills > 0) {
              const expunge = Math.min(2, totalKills);
              let kc = finalGame.killedCivilian || 0;
              let kp = finalGame.killedPolice || 0;
              for (let i = 0; i < expunge; i++) {
                if (kp > 0) kp--; else kc--;
              }
              finalGame.killedCivilian = kc;
              finalGame.killedPolice = kp;
              finalGame.log = [{ type: "good", text: contract.targetName + " eliminated! Reward: " + contract.reward.toLocaleString() + " cr · Gov expunged " + expunge + " kill(s) from record" }, ...finalGame.log];
            } else {
              finalGame.log = [{ type: "good", text: contract.targetName + " eliminated! Reward: " + contract.reward.toLocaleString() + " cr" }, ...finalGame.log];
            }
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
        } else if (encounter.isDefensiveBattle && encounter.questId === "alien_invasion") {
          // Alien invasion defensive battle — check if all waves done
          const currentWave = encounter.wave || 1;
          const maxWaves    = encounter.maxWaves || 3;
          if (currentWave >= maxWaves) {
            // All waves defeated — quest success
            finalGame.specialItems = [...(finalGame.specialItems || []), "fuel_compressor"];
            finalGame.quests = finalGame.quests.map(q =>
              q.id === "alien_invasion" ? { ...q, status: "done" } : q
            );
            // Fortify the defended system: police+2
            finalGame.galaxy = finalGame.galaxy.map(s =>
              s.id === finalGame.currentSystem
                ? { ...s, alienCount: 0, alienDays: 0, police: Math.min(3, (s.police||0) + 2) }
                : s
            );
            // Invasion still starts — but in a different random system
            const altSeed = finalGame.galaxy
              .filter(s => s.id !== finalGame.currentSystem && !(s.alienCount||0))
              .sort(() => Math.random() - 0.5)[0];
            if (altSeed) {
              finalGame.galaxy = finalGame.galaxy.map(s =>
                s.id === altSeed.id ? { ...s, alienCount: 1, alienDays: 0 } : s
              );
              finalGame.alienInvasionActive = true;
              finalGame.log = [
                { type: "good", text: "👾 PLANET DEFENDED! Fuel Compressor reward. Police forces fortified." },
                { type: "bad",  text: "⚠ Alien scouts spotted near " + altSeed.name + " — the invasion continues elsewhere!" },
                ...finalGame.log
              ];
            } else {
              finalGame.alienInvasionActive = true;
              finalGame.log = [{ type: "good", text: "👾 PLANET DEFENDED! Fuel Compressor reward." }, ...finalGame.log];
            }
          }
          // Wave handling continues in the wave section below
        } else if (encounter.isMothership) {
          // Mothership destroyed — end the invasion, military honors
          finalGame.quests = finalGame.quests.map(q =>
            q.id === "mothership" ? { ...q, status: "done" } : q
          );
          finalGame.galaxy = finalGame.galaxy.map(s =>
            ({ ...s, alienCount: 0, alienDays: 0 })
          );
          finalGame.alienInvasionActive = false;
          finalGame.alienGameOver = false;
          finalGame.reputation = Math.min(10, (finalGame.reputation || 0) + 5);
          finalGame.militaryVictory = true;
          finalGame.log = [
            { type: "good", text: "💥 ALIEN MOTHERSHIP DESTROYED! The invasion is over!" },
            { type: "good", text: "Rep +5. All systems reporting alien withdrawal." },
            ...finalGame.log
          ];
        } else if (encounter.sub === "civilian") {
          // Killed a merchant — full cargo hold drops (3-5 tons, guaranteed)
          // Their hold was full of whatever they were trading
          const availableGoods = encounter.sellGoods?.length > 0
            ? encounter.sellGoods
            : (encounter.buyGoods || []);
          let lootTons = rnd(3, 5);
          const stolen = [];
          if (availableGoods.length > 0) {
            while (lootTons > 0) {
              const g = pick(availableGoods);
              const qty = Math.min(lootTons, rnd(1, 2));
              stolen.push({ id: g.id, qty, buyPrice: 0 });
              lootTons -= qty;
            }
          }
          // Merge duplicate ids
          const merged = [];
          for (const s of stolen) {
            const ex = merged.find(m => m.id === s.id);
            if (ex) ex.qty += s.qty; else merged.push({ ...s });
          }
          finalGame.cargo = [...(finalGame.cargo || []), ...merged];
          finalGame.killedCivilian = (finalGame.killedCivilian || 0) + 1;
          // Kill penalty is -2 total; the -1 for opening fire was already applied on ATTACK
          finalGame.reputation = Math.max(-10, (finalGame.reputation || 0) - 1);
          finalGame.policeRecord = (finalGame.policeRecord || 0) + 1;
          finalGame = onPirateJobKill(finalGame, "civilian");
          const totalQty = merged.reduce((s,m)=>s+m.qty,0);
          finalGame.log = [{ type: "bad", text: "Destroyed " + (encounter?.ship?.name || "merchant") + "! Looted " + totalQty + "t of cargo. Rep −2 total." }, ...finalGame.log];
        } else {
          // Regular pirate or hostile police
          const isPolice = encounter.sub === "hostile" || encounter.sub === "bounty_hunter";
          const shipIdx = Math.max(0, SHIPS.findIndex(s => s.id === encounter?.ship?.id));
          const bounty = Math.round((300 + shipIdx * 200 + rnd(0, 300)) / 50) * 50;
          finalGame.credits += bounty;
          if (isPolice) {
            finalGame.killedPolice = (finalGame.killedPolice || 0) + 1;
            finalGame.reputation = Math.max(-10, (finalGame.reputation || 0) - 3);
            finalGame.policeRecord = (finalGame.policeRecord || 0) + 2;
            finalGame = onPirateJobKill(finalGame, "hostile");
            finalGame.log = [{ type: "bad", text: "Destroyed " + (encounter?.ship?.name || "police ship") + "! Rep −3. Bounty: " + bounty + " cr" }, ...finalGame.log];
          } else {
            finalGame.killed = (finalGame.killed || 0) + 1;
            finalGame.reputation = Math.min(10, (finalGame.reputation || 0) + 1);
            finalGame = onPirateKilled(finalGame);
            finalGame.log = [{ type: "good", text: "Destroyed " + (encounter?.ship?.name || "pirate") + "! Bounty: " + bounty + " cr · Rep +1" }, ...finalGame.log];
          }

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

          // Wave attack — pirate, police, or mothership escort
          const currentWave = encounter.wave || 1;
          const maxWaves = encounter.maxWaves || 1;
          if (currentWave < maxWaves) {
            const sys = finalGame.galaxy[finalGame.currentSystem];
            const isPoliceWave = encounter.sub === "hostile" || encounter.sub === "bounty_hunter";
            const isMothership = encounter.questId === "mothership";
            let nextEnc;

            if (isMothership && currentWave === 2) {
              // Wave 3: the Mothership itself
              nextEnc = {
                type: "alien", sub: "alien_mothership",
                ship: { id: "alien_mothership", name: "Alien Mothership", emoji: "💥",
                        hull: 350, hullMax: 350 },
                hull: 350, hullMax: 350, shields: 0, shieldsMax: 0,
                regen: 8, hasPlasma: true,
                plasma: { damage: 70, chance: 0.15 },
                pulseDamage: [10, 22], weapons: 3, fleeHard: false,
                hitAccuracy: 0.6,  // large ship — less accurate vs maneuverable ships
                wave: 3, maxWaves: 3,
                isMothership: true, questId: "mothership",
              };
              finalGame.log = [{ type: "bad", text: "💥 ALIEN MOTHERSHIP emerges! This is the final fight!" }, ...finalGame.log];
            } else if (isMothership) {
              // Wave 1→2: second escort cruiser
              nextEnc = {
                type: "alien", sub: "alien_cruiser",
                ship: { id: "alien_cruiser", name: "Alien Cruiser", emoji: "👾👾",
                        hull: 180, hullMax: 180 },
                hull: 180, hullMax: 180, shields: 0, shieldsMax: 0,
                regen: 5, hasPlasma: true,
                plasma: { damage: 60, chance: 0.25 },
                pulseDamage: [5, 15], weapons: 2, fleeHard: false,
                hitAccuracy: 1.0,
                wave: currentWave + 1, maxWaves: 3,
                isMothership: false, questId: "mothership", isEscort: true,
              };
              finalGame.log = [{ type: "bad", text: "👾 Second escort cruiser attacks! Wave " + (currentWave+1) + "/3" }, ...finalGame.log];
            } else if (isPoliceWave) {
              const killedPolice = finalGame.killedPolice || 0;
              const tier = Math.min(3, Math.floor(killedPolice / 1));
              const nextShip = SHIPS[Math.min(SHIPS.length-1, 3 + tier)];
              nextEnc = {
                type: "police", sub: "hostile",
                ship: nextShip, weapon: WEAPONS[Math.min(2, tier)],
                hull: nextShip.hull, hullMax: nextShip.hull,
                shields: 100 + tier * 50, shieldsMax: 100 + tier * 50,
                wave: currentWave + 1, maxWaves,
              };
              finalGame.log = [{ type: "bad", text: "Police reinforcements! Wave " + (currentWave+1) + "/" + maxWaves }, ...finalGame.log];
            } else {
              const nextPirate = generatePirateShip(sys, finalGame);
              nextEnc = { ...nextPirate, type: "pirate", sub: encounter.sub,
                wave: currentWave + 1, maxWaves };
              finalGame.log = [{ type: "bad", text: "Another pirate closes in! Wave " + (currentWave+1) + "/" + maxWaves }, ...finalGame.log];
            }
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
        const hasEscapePod = finalGame.gadgets?.some(g => g.id === "escape_pod");
        if (hasEscapePod) {
          finalGame = applyEscapePod(finalGame);
        } else {
          finalGame.dead = true;
        }
      }
      onUpdate(finalGame);
      if (result !== "dead") setTimeout(() => onDone(), 800);
    } else {
      onUpdate({ ...currentGame, hull: newPlayer.hull, shields: newPlayer.shields });
    }
  }, [enemy, phase, encounter, onUpdate, onDone]);

  return { combatLog, enemy, phase, fightRound, flee, surrender };
}

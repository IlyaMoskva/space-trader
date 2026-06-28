import { useState, useEffect, useCallback, useRef } from 'react';
import { distParsecs, fuelCost, canReach } from '../engine/utils.js';
import { generateEncounter } from '../engine/combat.js';
import { generateContracts, checkContractArrival, onPirateKilled } from '../engine/contracts.js';
import { checkQuestArrival, revealQuestHints } from '../engine/quests.js';
import { generateSystemEvents, initMarket } from '../engine/market.js';
import { COMMODITIES } from '../constants/commodities.js';
import { TECH_LEVELS, GOV_TYPES, SIZES } from '../constants/world.js';
import { generatePirateShip } from '../engine/combat.js';
import GalaxyMap from '../components/GalaxyMap.jsx';
import QuestPopup from '../components/QuestPopup.jsx';
import { SHIPS, WEAPONS } from '../constants/ships.js';
import { rnd } from '../engine/utils.js';
import { refreshMarket } from '../engine/market.js';

function TravelScreen({ game, onUpdate, onEncounter, onQuestPopup, initialSelected }) {
  const [selected, setSelected] = useState(initialSelected ?? null);

  // Sync if initialSelected changes (e.g. Plot Course pressed again)
  useEffect(() => {
    if (initialSelected !== null && initialSelected !== undefined) {
      setSelected(initialSelected);
    }
  }, [initialSelected]);
  const currentSys = game.galaxy[game.currentSystem];
  const selectedSys = selected !== null ? game.galaxy[selected] : null;
  const jumpRange = game.ship.jump + (game.gadgets.some(g => g.id === "fuel_compressor") ? 3 : 0);
  const fuel = selectedSys ? fuelCost(currentSys, selectedSys) : 0;
  const inRange = selectedSys ? canReach(currentSys, selectedSys, jumpRange) : false;
  const canTravel = selectedSys && inRange && game.credits >= fuel;

  const travel = () => {
    if (!canTravel) return;
    let newGalaxy = game.galaxy.map(s => {
      if (s.id !== selected) return s;
      // Init market on first visit, refresh on revisit
      const market = s.market
        ? refreshMarket(s.market)
        : initMarket(s);
      return { ...s, visited: true, market };
    });
    // Also ensure starting system has a market
    if (!newGalaxy[game.currentSystem].market) {
      newGalaxy = newGalaxy.map(s => s.id === game.currentSystem
        ? { ...s, market: initMarket(s) } : s);
    }
    let newGame = {
      ...game,
      currentSystem: selected,
      galaxy: newGalaxy,
      credits: game.credits - fuel,
      days: game.days + 1,
      shields: game.shields.map(s => ({ ...s, current: Math.min(s.max, s.current + 30) })),
    };

    // Engineer auto-repair: chance = engineer*3%, amount = engineer/2 hp
    const eng = newGame.skills?.engineer || 0;
    if (eng > 0 && newGame.hull < newGame.hullMax) {
      const repairChance = eng * 0.03;
      if (Math.random() < repairChance) {
        const repaired = Math.max(1, Math.floor(eng / 2));
        const newHull = Math.min(newGame.hullMax, newGame.hull + repaired);
        if (newHull > newGame.hull) {
          newGame.hull = newHull;
          newGame.log = [{ type: "good", text: "Engineer patched hull +" + repaired + " hp" }, ...newGame.log];
        }
      }
    }

    // Check contract deadlines on every jump
    newGame.activeContracts = (newGame.activeContracts || []).map(c => {
      if (c.status === "active" && c.deadline <= newGame.days) {
        newGame.credits -= c.penalty;
        newGame.reputation = (newGame.reputation || 0) - 1;
        newGame.log = [{ type: "bad", text: "Contract FAILED: " + c.title + " — penalty " + c.penalty + " cr" }, ...newGame.log];
        return { ...c, status: "failed" };
      }
      return c;
    });

    // Debt interest: 1% per day
    if (newGame.debt > 0) {
      const interest = Math.ceil(newGame.debt * 0.01);
      newGame.debt = newGame.debt + interest;
      newGame.log = [{ type: "warn", text: "Interest: +" + interest + " cr debt (total: " + newGame.debt + " cr)" }, ...newGame.log];
    }

    // Mercenary daily pay
    const mercs = newGame.mercenaries || [];
    if (mercs.length > 0) {
      const totalPay = mercs.reduce((s, m) => s + m.cost, 0);
      if (newGame.credits >= totalPay) {
        newGame.credits -= totalPay;
        newGame.log = [{ type: "warn", text: "Crew wages: " + totalPay + " cr (" + mercs.map(m => m.name).join(", ") + ")" }, ...newGame.log];
      } else {
        // Can't pay — mercs leave
        newGame.mercenaries = [];
        newGame.log = [{ type: "bad", text: "Can't pay crew wages! All mercenaries have left." }, ...newGame.log];
      }
    }

    // Quest day tracking
    newGame.quests = newGame.quests.map(q => {
      if (q.daysLeft !== undefined && q.status === "available") {
        const dl = q.daysLeft - 1;
        if (dl <= 0 && q.id === "alien_invasion") {
          const sysIdx = newGame.galaxy.findIndex(s => s.id === q.targetSystem);
          if (sysIdx >= 0) {
            newGame.galaxy = newGame.galaxy.map((s, i) => i === sysIdx ? { ...s, tech: Math.max(0, s.tech - 3) } : s);
            newGame.log = [{ type: "bad", text: q.name + " FAILED! Planet devastated." }, ...newGame.log];
          }
          return { ...q, status: "failed", daysLeft: 0 };
        }
        return { ...q, daysLeft: dl };
      }
      return q;
    });

    const logEntry = { type: "info", text: "Traveled to " + selectedSys.name + ". Fuel: " + fuel + " cr" };
    newGame.log = [logEntry, ...newGame.log].slice(0, 50);

    // Build news from system events + galaxy-wide quest news
    const arrivedSys = newGame.galaxy[selected];
    const sysEvents = arrivedSys.market?.events || [];
    const eventNews = sysEvents.map(e => ({ text: e.text, quest: false, event: true }));
    const questNews = newGame.quests
      .filter(q => q.status === "available")
      .map(q => ({ text: q.desc, quest: true }));
    const staticNews = [
      { text: arrivedSys.name + " — " + TECH_LEVELS[arrivedSys.tech] + " · " + GOV_TYPES[arrivedSys.gov] + " · Pop " + SIZES[arrivedSys.size] }
    ];
    newGame.news = [...eventNews, ...staticNews, ...questNews].slice(0, 8);

    setSelected(null);

    // Check contract arrivals
    const { newGame: contractGame } = checkContractArrival(newGame, selected);
    newGame = contractGame;

    // Generate bulletin board for new system
    newGame.bulletinBoard = generateContracts(arrivedSys, newGame.galaxy, newGame.days);

    // Reveal quest hints via news
    newGame = revealQuestHints(newGame, selected);

    // Check quest arrivals
    const { newGame: questGame, popups } = checkQuestArrival(newGame, selected);
    newGame = questGame;

    // Trigger assassination boss fight if we just arrived at target
    const pendingAssassination = newGame.activeContracts?.find(
      c => c.type === "assassination" && c.status === "pending_fight"
    );
    if (pendingAssassination) {
      const bossShip = SHIPS[Math.min(SHIPS.length - 1, 5 + rnd(0, 2))]; // Hornet-Grasshopper tier boss
      const bossEnc = {
        type: "pirate",
        sub: "assassination",
        contractId: pendingAssassination.id,
        ship: { ...bossShip, name: pendingAssassination.targetName },
        weapon: WEAPONS[2], // Military laser
        hull: bossShip.hull + 50, hullMax: bossShip.hull + 50,
        shields: 200, shieldsMax: 200,
        wave: 1, maxWaves: 1,
      };
      newGame.log = [{ type: "bad", text: "⚠ " + pendingAssassination.targetName + " spotted! Engaging!" }, ...newGame.log];
      onEncounter(newGame, bossEnc);
      return;
    }

    const enc = generateEncounter(newGame.galaxy[selected], newGame);

    // Boss fight from quest takes priority
    const bossPopup = popups.find(p => p.encounter);
    if (bossPopup) {
      onEncounter(newGame, bossPopup.encounter);
      return;
    }

    if (popups.length > 0) {
      onUpdate(newGame);
      onQuestPopup(popups[0]);
      return;
    }

    if (enc) { onEncounter(newGame, enc); }
    else { onUpdate(newGame); }
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Galaxy Chart</div>
        <GalaxyMap galaxy={game.galaxy} current={game.currentSystem} selected={selected}
          onSelect={setSelected} jumpRange={jumpRange} />
        {selectedSys && (
          <div style={{ marginTop: 8 }}>
            <div className="stat-row"><span className="stat-label">Destination</span><span className="stat-val-blue">{selectedSys.name}</span></div>
            <div className="stat-row"><span className="stat-label">Tech Level</span><span className="stat-val">{TECH_LEVELS[selectedSys.tech]}</span></div>
            <div className="stat-row"><span className="stat-label">Government</span><span className="stat-val">{GOV_TYPES[selectedSys.gov]}</span></div>
            <div className="stat-row">
              <span className="stat-label">Distance</span>
              <span className={inRange ? "stat-val-green" : "stat-val-red"}>
                {Math.round(distParsecs(currentSys, selectedSys) * 10) / 10} pc {inRange ? "✓" : "✗ too far"}
              </span>
            </div>
            {inRange && <div className="stat-row"><span className="stat-label">Fuel Cost</span><span className="stat-val-gold">{fuel} cr</span></div>}
            <div className="stat-row"><span className="stat-label">Pirates</span><span className={selectedSys.pirates > 1 ? "stat-val-red" : "stat-val"}>{"★".repeat(selectedSys.pirates + 1)}</span></div>
            <div style={{ marginTop: 10 }}>
              {inRange ? (
                <button className={canTravel ? "btn btn-green" : "btn btn-disabled"} onClick={travel} style={{ width: "100%" }}>
                  ▶ TRAVEL TO {selectedSys.name.toUpperCase()}
                </button>
              ) : (
                <div style={{ fontSize: 15, color: "#ff6b35", textAlign: "center", padding: 6, border: "1px solid #ff6b3544", borderRadius: 2 }}>
                  Too far — need a better ship or Fuel Compressor
                </div>
              )}
            </div>
          </div>
        )}
        {!selectedSys && <div style={{ fontSize: 15, color: "#555588", textAlign: "center", marginTop: 8 }}>Click a system to plot course</div>}

        {/* PATROL — active contracts targeting current system */}
        {(() => {
          const patrolContracts = (game.activeContracts || []).filter(c =>
            (c.status === "active" || c.status === "pending_fight") &&
            (c.type === "extermination" || c.type === "assassination") &&
            c.targetSystemId === game.currentSystem
          );

          // Debug: show all combat contracts regardless of system
          const allCombatContracts = (game.activeContracts || []).filter(c =>
            c.type === "extermination" || c.type === "assassination"
          );

          if (patrolContracts.length === 0) {
            if (allCombatContracts.length === 0) return null;
            // Show inactive contracts with explanation
            return (
              <div style={{ marginTop: 10, border: "1px solid #2a2a5a", borderRadius: 4, padding: 10 }}>
                <div style={{ fontSize: 14, color: "#555588", marginBottom: 6 }}>Combat contracts:</div>
                {allCombatContracts.map(c => (
                  <div key={c.id} style={{ fontSize: 13, color: "#444466", marginBottom: 4 }}>
                    {c.emoji} {c.title}
                    <span style={{ marginLeft: 6, color:
                      c.status === "failed" ? "#ff4444" :
                      c.targetSystemId !== game.currentSystem ? "#888800" : "#555588"
                    }}>
                      {c.status === "failed" ? "— FAILED (expired)" :
                       c.targetSystemId !== game.currentSystem
                         ? "— patrol in " + (game.galaxy.find(s => s.id === c.targetSystemId)?.name || "?")
                         : "— " + c.status}
                    </span>
                  </div>
                ))}
              </div>
            );
          }
          const sys = game.galaxy[game.currentSystem];
          const hasPirates = sys.pirates >= 1;

          const patrol = () => {
            let newGame = {
              ...game,
              days: game.days + 1,
              shields: game.shields.map(s => ({ ...s, current: Math.min(s.max, s.current + 10) })),
              log: [{ type: "info", text: "Patrolling " + sys.name + "..." }, ...game.log],
            };

            // Assassination: always trigger boss fight
            const assassinContract = patrolContracts.find(c => c.type === "assassination");
            if (assassinContract) {
              const bossShip = SHIPS[Math.min(SHIPS.length - 1, 5 + rnd(0, 2))];
              const bossEnc = {
                type: "pirate", sub: "assassination",
                contractId: assassinContract.id,
                ship: { ...bossShip, name: assassinContract.targetName },
                weapon: WEAPONS[2], hull: bossShip.hull + 50, hullMax: bossShip.hull + 50,
                shields: 200, shieldsMax: 200, wave: 1, maxWaves: 1,
              };
              // Mark as pending_fight
              newGame.activeContracts = newGame.activeContracts.map(c =>
                c.id === assassinContract.id ? { ...c, status: "pending_fight" } : c
              );
              newGame.log = [{ type: "bad", text: "⚠ " + assassinContract.targetName + " located! Engaging!" }, ...newGame.log];
              onEncounter(newGame, bossEnc);
              return;
            }

            // Extermination: random pirate
            if (hasPirates) {
              const { ship, weapon, hull, hullMax, shields, shieldsMax } = generatePirateShip(sys, game.killed);
              const enc = { type: "pirate", ship, weapon, hull, hullMax, shields, shieldsMax, wave: 1, maxWaves: 1,
                patrolContractSystem: game.currentSystem }; // explicit system for kill tracking
              onEncounter(newGame, enc);
            } else {
              newGame.log = [{ type: "warn", text: "Patrol found nothing — pirates may have fled." }, ...newGame.log];
              onUpdate(newGame);
            }
          };

          return (
            <div style={{ marginTop: 10, border: "1px solid #ff6b3566", borderRadius: 4, padding: 10 }}>
              <div style={{ fontSize: 15, color: "#ff6b35", marginBottom: 6 }}>
                ⚔️ Active contract in this system
              </div>
              {patrolContracts.map(c => (
                <div key={c.id} style={{ fontSize: 14, color: "#8888bb", marginBottom: 4 }}>
                  {c.title} — {c.type === "extermination" ? c.killsCompleted + "/" + c.killCount + " kills" : "target present"}
                </div>
              ))}
              <button
                className={"btn " + (hasPirates ? "btn-red" : "btn-gray")}
                style={{ width: "100%", marginTop: 6 }}
                onClick={patrol}>
                {hasPirates ? "🔍 PATROL (+1 day, find pirates)" : "🔍 PATROL — no pirates detected"}
              </button>
              {!hasPirates && (
                <div style={{ fontSize: 13, color: "#555588", marginTop: 4 }}>
                  This system has no pirate activity (★)
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}


export default TravelScreen;

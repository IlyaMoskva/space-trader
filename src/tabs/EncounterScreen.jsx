import { useState, useEffect, useCallback, useRef } from 'react';
import { SHIPS, WEAPONS } from '../constants/ships.js';
import { COMMODITIES } from '../constants/commodities.js';
import { rnd } from '../engine/utils.js';
import { effectiveSkills, generatePirateShip } from '../engine/combat.js';
import { onPirateKilled } from '../engine/contracts.js';
import { useCombat } from '../hooks/useCombat.js';
import { doAlienCombatRound, onAlienKilled, sellArtifactsAtScientist } from '../engine/aliens.js';
import { applyEscapePod } from '../engine/utils.js';
import ShipSprite from '../components/ShipSprite.jsx';
import { ELITE_CAPTAINS, MERCENARY_POOL } from '../constants/mercenaries.js';
import { pick } from '../engine/utils.js';

function EncounterScreen({ game, encounter, onUpdate, onDone }) {
  const { combatLog, enemy, phase, fightRound, flee, surrender } = useCombat({ game, encounter, onUpdate, onDone });

  // ── Alien encounter ────────────────────────────────────────────────────────
  if (encounter.type === "alien") {
    return <AlienEncounterScreen game={game} encounter={encounter} onUpdate={onUpdate} onDone={onDone} />;
  }

  if (encounter.type === "pirate") {
    // Coward check: weak pirate may surrender on sight
    const cowardChance = encounter.cowardChance || 0;
    if (cowardChance > 0 && phase === "choice" && Math.random() < cowardChance) {
      // Auto-flee on first render — handle via a one-time effect
    }

    const threatLabel = encounter.shields > 0
      ? (encounter.shields >= 200 ? "ELITE" : "ARMED")
      : encounter.weapon?.id === "military" ? "DANGEROUS"
      : encounter.weapon?.id === "beam" ? "MODERATE" : "WEAK";
    const threatColor = threatLabel === "ELITE" ? "#ff4444"
      : threatLabel === "DANGEROUS" ? "#ff6b35"
      : threatLabel === "ARMED" || threatLabel === "MODERATE" ? "#ffd700"
      : "#8888bb";

    const isBountyHunter = encounter.sub === "bounty_hunter";

    return (
      <div className="encounter-box">
        <div className="encounter-title">
          {isBountyHunter ? "🎯 BOUNTY HUNTER" : "⚠ PIRATE ENCOUNTER"}
          <span style={{ fontSize: 13, color: threatColor, marginLeft: 10 }}>[{threatLabel}]</span>
          {encounter.angry && <span style={{ fontSize: 13, color: "#ff4444", marginLeft: 8 }}>ANGRY</span>}
          {encounter.maxWaves > 1 && (
            <span style={{ fontSize: 13, color: "#ff6b35", marginLeft: 10 }}>
              WAVE {encounter.wave}/{encounter.maxWaves}
            </span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
          <div style={{ textAlign: "center" }}>
            <ShipSprite shipId={game.ship.id} size={52}/>
            <div style={{ fontSize: 16, color: "#00ff88" }}>YOU</div>
            <div style={{ fontSize: 15, color: "#00ff88" }}>Hull: {game.hull}</div>
            {game.shields.length > 0 && (
              <div style={{ fontSize: 13 }}>
                {game.shields.map((sh, i) => (
                  <div key={i} style={{ color: sh.id === "reflective" || sh.id === "lightning" ? "#ffd700" : "#4fc3f7" }}>
                    {sh.id === "lightning" ? "⚡" : sh.id === "reflective" ? "◆" : "⬡"} {sh.current}/{sh.max}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize: 16, color: "#ff6b35", alignSelf: "center" }}>VS</div>
          <div style={{ textAlign: "center" }}>
            <ShipSprite shipId={encounter.ship.id} size={52} flip={true}/>
            <div style={{ fontSize: 16, color: "#ff6b35" }}>PIRATE {encounter.ship.name.toUpperCase()}</div>
            <div style={{ fontSize: 15, color: "#ff6b35" }}>Hull: {enemy?.hull ?? encounter.hull}</div>
            {encounter.shields > 0 && <div style={{ fontSize: 13, color: "#4fc3f7" }}>Shield: {enemy?.shields ?? encounter.shields}</div>}
            <div style={{ fontSize: 13, color: "#888888" }}>{encounter.weapon?.name}</div>
          </div>
        </div>
        <div style={{ maxHeight: 80, overflow: "hidden", marginBottom: 10 }}>
          {combatLog.map((e, i) => <div key={i} className={"log-entry " + e.type}>{e.text}</div>)}
        </div>
        {phase !== "ended" && (
          <div className="flex-gap">
            <button className="btn btn-red" onClick={() => fightRound("fight")}>⚔ FIGHT</button>
            <button className="btn btn-blue" onClick={flee}>↗ FLEE</button>
          </div>
        )}
      </div>
    );
  }

  if (encounter.type === "police") {
    // Hostile police / bounty hunter — full combat
    if (encounter.sub === "hostile" || encounter.sub === "bounty_hunter") {
      return (
        <div className="encounter-box" style={{ borderColor: "#ff4444" }}>
          <div className="encounter-title" style={{ color: "#ff4444" }}>
            {encounter.sub === "bounty_hunter" ? "🎯 BOUNTY HUNTER" : "🔴 POLICE INTERCEPTOR"}
            <span style={{ fontSize: 13, color: "#ff6b35", marginLeft: 8 }}>HOSTILE</span>
          </div>
          <div className="encounter-desc">
            {encounter.sub === "bounty_hunter"
              ? "\"Commander " + game.commander + "! You have a price on your head. Stand down or be destroyed!\""
              : "\"All ships halt! By order of the law — you are under arrest!\""}
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
            <div style={{ textAlign: "center" }}>
              <ShipSprite shipId={game.ship.id} size={52}/>
              <div style={{ fontSize: 14, color: "#00ff88" }}>Hull: {game.hull}</div>
            </div>
            <div style={{ fontSize: 16, color: "#ff4444", alignSelf: "center" }}>VS</div>
            <div style={{ textAlign: "center" }}>
              <ShipSprite shipId={encounter.ship?.id || "hornet"} size={52} flip={true}/>
              <div style={{ fontSize: 14, color: "#ff4444" }}>{encounter.ship?.name || "Police"}</div>
              <div style={{ fontSize: 13, color: "#ff4444" }}>Hull: {(enemy?.hull ?? encounter.hull)}</div>
            </div>
          </div>
          <div style={{ maxHeight: 60, overflow: "hidden", marginBottom: 8 }}>
            {combatLog.map((e, i) => <div key={i} className={"log-entry " + e.type}>{e.text}</div>)}
          </div>
          {phase !== "ended" && (
            <div className="flex-gap">
              <button className="btn btn-red" onClick={() => fightRound("fight")}>⚔ FIGHT</button>
              <button className="btn btn-blue" onClick={flee}>↗ FLEE</button>
              <button className="btn btn-gray" onClick={() => {
                const rep = game.reputation || 0;
                const fine = Math.max(500, Math.abs(rep) * 800);
                const kills = (game.killedCivilian || 0) + (game.killedPolice || 0);
                // Murderers serve longer: +5 days per kill
                const jailDays = Math.max(2, Math.abs(rep) * 2) + kills * 5;
                // After prison: SUSPECT (-2), killers stay worse
                const newRep = kills > 0 ? Math.min(-3, rep + 2) : Math.min(-1, rep + 2);
                // Serving time reduces kill count by 1 — "paid your debt"
                const newKilledCivilian = Math.max(0, (game.killedCivilian || 0) - (kills > 0 ? 1 : 0));
                const newKilledPolice   = newKilledCivilian === (game.killedCivilian || 0)
                  ? Math.max(0, (game.killedPolice || 0) - 1) : (game.killedPolice || 0);
                onUpdate({ ...game,
                  credits: Math.max(0, game.credits - fine),
                  days: game.days + jailDays,
                  reputation: newRep,
                  killedCivilian: newKilledCivilian,
                  killedPolice: newKilledPolice,
                  policeRecord: (game.policeRecord || 0) + 1,
                  log: [{ type: "bad", text: "Arrested! Fine: " + fine.toLocaleString() + " cr · " + jailDays + " days" + (kills > 0 ? " (murder sentence)" : "") + " · Rep → " + newRep }, ...game.log],
                });
                onDone();
              }}>🏳 SURRENDER</button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="encounter-box" style={{ borderColor: "#4fc3f7" }}>
        <div className="encounter-title" style={{ color: "#4fc3f7" }}>🔵 POLICE INSPECTION</div>
        <div className="encounter-desc">
          {encounter.contraband
            ? "Officer: \"We detect illegal goods in your hold. Surrender your contraband or face arrest!\""
            : "Officer: \"Routine inspection. Your papers appear to be in order. Carry on, Commander.\""}
        </div>
        {encounter.contraband ? (
          <div className="flex-gap">
            <button className="btn btn-red" onClick={() => {
              const newCargo = game.cargo.filter(c => !COMMODITIES.find(x => x.id === c.id)?.illegal);
              const entry = { type: "warn", text: "Contraband seized by police!" };
              onUpdate({ ...game, cargo: newCargo, policeRecord: game.policeRecord + 1, log: [entry, ...game.log] });
              onDone();
            }}>COMPLY</button>
            <button className="btn btn-gray" onClick={flee}>FLEE</button>
          </div>
        ) : (
          <button className="btn btn-blue" onClick={() => {
            const rep = game.reputation || 0;
            if (rep < 0) {
              // Accumulate clean checks — each one has increasing chance of rep +1
              // cleanChecks resets when rep improves
              const cleanChecks = (game.cleanChecks || 0) + 1;
              // Chance = cleanChecks × 15%, max 60%
              const chance = Math.min(0.60, cleanChecks * 0.15);
              if (Math.random() < chance) {
                onUpdate({ ...game,
                  reputation: Math.min(0, rep + 1),
                  cleanChecks: 0, // reset counter after rep gain
                  log: [{ type: "good", text: "Clean record noted by patrol. Rep +1 (" + Math.min(0, rep+1) + ")" }, ...game.log],
                });
              } else {
                onUpdate({ ...game, cleanChecks,
                  log: [{ type: "info", text: "Clean inspection #" + cleanChecks + ". Keep it up." }, ...game.log],
                });
              }
            } else {
              onDone();
            }
            onDone();
          }}>ACKNOWLEDGED</button>
        )}
      </div>
    );
  }

  if (encounter.type === "trader") {
    const { sellGoods = [], buyGoods = [] } = encounter;
    const cargoUsed = game.cargo.reduce((s, c) => s + c.qty, 0);
    const cargoFree = game.cargoCapacity - cargoUsed;

    const buyFromTrader = (item) => {
      if (game.credits < item.price || cargoFree < 1) return;
      const newCargo = [...game.cargo];
      const idx = newCargo.findIndex(c => c.id === item.id);
      if (idx >= 0) {
        const old = newCargo[idx];
        newCargo[idx] = { ...old, qty: old.qty + 1, buyPrice: Math.round((old.buyPrice * old.qty + item.price) / (old.qty + 1)) };
      } else {
        newCargo.push({ id: item.id, qty: 1, buyPrice: item.price });
      }
      onUpdate({ ...game, credits: game.credits - item.price, cargo: newCargo,
        log: [{ type: "good", text: "Bought 1x " + item.name + " @ " + item.price + " cr" }, ...game.log] });
    };

    const sellToTrader = (item) => {
      const held = game.cargo.find(c => c.id === item.id);
      if (!held || held.qty < 1) return;
      const profit = item.price - (held.buyPrice || 0);
      const newCargo = game.cargo.map(c => c.id === item.id ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0);
      onUpdate({ ...game, credits: game.credits + item.price, cargo: newCargo,
        log: [{ type: profit >= 0 ? "good" : "warn", text: "Sold 1x " + item.name + " @ " + item.price + " cr (" + (profit >= 0 ? "+" : "") + profit + ")" }, ...game.log] });
    };

    return (
      <div className="encounter-box" style={{ borderColor: "#00ff88" }}>
        <div className="encounter-title" style={{ color: "#00ff88" }}>🚀 TRADER VESSEL</div>
        <div style={{ fontSize: 15, color: "#8888bb", marginBottom: 10 }}>
          A merchant hails you. No police monitoring this exchange.
          <span style={{ color: "#555588", marginLeft: 8 }}>Hold: {cargoUsed}/{game.cargoCapacity}</span>
        </div>

        {/* What they sell */}
        {sellGoods.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 14, color: "#4fc3f7", marginBottom: 4 }}>THEY SELL</div>
            {sellGoods.map(item => {
              const base = COMMODITIES.find(c => c.id === item.id)?.base || item.price;
              const isGood = item.price < base;
              const canBuy = game.credits >= item.price && cargoFree > 0;
              return (
                <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0", borderBottom:"1px solid #1a1a3a" }}>
                  <span style={{ fontSize:15, color:"#c0c0ff" }}>{item.name}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:15, color: isGood ? "#00ff88" : "#ffd700" }}>
                      {item.price} cr{isGood ? " ↓" : ""}
                    </span>
                    <button className="qty-btn" style={canBuy ? {borderColor:"#00ff88",color:"#00ff88"} : {opacity:0.3}}
                      onClick={() => buyFromTrader(item)}>B</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* What they buy */}
        {buyGoods.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 14, color: "#ffd700", marginBottom: 4 }}>THEY BUY — no questions asked</div>
            {buyGoods.map(item => {
              const base = COMMODITIES.find(c => c.id === item.id)?.base || item.price;
              const isPremium = item.price > base * 0.95;
              const held = game.cargo.find(c => c.id === item.id)?.qty || 0;
              const canSell = held > 0;
              return (
                <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0", borderBottom:"1px solid #1a1a3a" }}>
                  <span style={{ fontSize:15, color: item.illegal ? "#ff6b35" : "#c0c0ff" }}>
                    {item.name}{item.illegal ? " ⚠" : ""}
                    {held > 0 && <span style={{color:"#00ff88",marginLeft:4}}>({held} in hold)</span>}
                  </span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:15, color: isPremium ? "#00ff88" : "#888888" }}>
                      {item.price} cr{isPremium ? " ↑" : ""}
                    </span>
                    <button className="qty-btn" style={canSell ? {borderColor:"#ff6b35",color:"#ff6b35"} : {opacity:0.3}}
                      onClick={() => sellToTrader(item)}>S</button>
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize:12, color:"#555566", marginTop:4 }}>⚠ = illegal goods · ↑ = above market price</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="btn btn-gray" onClick={() => onDone()}>DEPART</button>
          <button className="btn btn-red" onClick={() => {
            // Start actual combat with the merchant ship
            const ms = encounter.merchantShip || SHIPS[2];
            onUpdate({ ...game,
              reputation: Math.max(-10, (game.reputation || 0) - 1),
              log: [{ type: "bad", text: "You open fire on the merchant! Rep −1." }, ...game.log],
            });
            // Re-trigger as pirate-style combat
            onDone({ ...encounter, type: "pirate", sub: "civilian",
              ship: ms, weapon: encounter.weapon || WEAPONS[0],
              hull: encounter.hull || ms.hull, hullMax: encounter.hullMax || ms.hull,
              shields: 0, shieldsMax: 0, wave: 1, maxWaves: 1 });
          }}>⚔ ATTACK (rep −1)</button>
        </div>
      </div>
    );
  }

  if (encounter.type === "special") {
    const specials = {
      marie_celeste: {
        title: "🚢 MARIE CELESTE",
        desc: "You find a drifting Flea-class vessel — the Marie Celeste. It appears abandoned. The cargo hold contains Narcotics. Salvage law says you may take it, but...",
        options: [
          { label: "TAKE CARGO", action: () => {
            const newCargo = [...game.cargo, { id: "narcotics", qty: 3, buyPrice: 0 }];
            onUpdate({ ...game, cargo: newCargo, log: [{ type: "warn", text: "Took Marie Celeste cargo — police may be watching!" }, ...game.log] });
            onDone();
          }, cls: "btn-red" },
          { label: "IGNORE", action: () => onDone(), cls: "btn-gray" },
        ]
      },
      famous_captain: (() => {
        const captain = pick(ELITE_CAPTAINS);
        const hasItem = captain.wants === "military"
          ? game.weapons.some(w => w.id === "military")
          : captain.wants === "beam"
          ? game.weapons.some(w => w.id === "beam")
          : game.shields.some(s => s.id === captain.wants);

        if (!hasItem) return {
          title: captain.emoji + " " + captain.name.toUpperCase(),
          desc: captain.name + " hails you. \"Looking for a pilot with a " + captain.wantsName + ". Keep it in mind if you ever come across one.\"",
          options: [{ label: "ACKNOWLEDGED", action: () => onDone(), cls: "btn-gray" }]
        };

        return {
          title: captain.emoji + " " + captain.name.toUpperCase(),
          desc: captain.name + " hails you. \"I need your " + captain.wantsName + ". In exchange — I'll teach you something you won't forget.\"",
          options: [
            { label: "TRADE → " + captain.gives, action: () => {
              let newWeapons = game.weapons;
              let newShields = game.shields;
              if (captain.wants === "military" || captain.wants === "beam") {
                newWeapons = game.weapons.filter(w => w.id !== captain.wants);
              } else {
                newShields = game.shields.filter(s => s.id !== captain.wants);
              }
              const newSkills = { ...game.skills, [captain.skill]: Math.min(10, game.skills[captain.skill] + 1) };
              onUpdate({ ...game, weapons: newWeapons, shields: newShields, skills: newSkills,
                log: [{ type: "good", text: captain.name + ": traded " + captain.wantsName + " → " + captain.gives }, ...game.log] });
              onDone();
            }, cls: "btn-gold" },
            { label: "DECLINE", action: () => onDone(), cls: "btn-gray" },
          ]
        };
      })(),
      alien_machine: {
        title: "👽 ALIEN ENCOUNTER",
        desc: "A strange alien vessel drifts alongside you. Through its hull you can see a glowing learning machine. The alien gestures — 3,000 credits for one session.",
        options: [
          ...(game.credits >= 3000 ? [{ label: "USE MACHINE (3000 cr)", action: () => {
            const s = pick(["pilot","fighter","trader","engineer"]);
            const worked = Math.random() < 0.6;
            const newSkills = worked ? { ...game.skills, [s]: Math.min(10, game.skills[s] + 1) } : game.skills;
            onUpdate({ ...game, credits: game.credits - 3000, skills: newSkills,
              log: [{ type: worked ? "good" : "warn", text: worked ? "Alien machine worked! +" + s + " skill" : "Machine malfunctioned — no effect." }, ...game.log] });
            onDone();
          }, cls: "btn-blue" }] : [{ label: "INTRIGUING — NOT ENOUGH CREDITS", action: () => onDone(), cls: "btn-gray" }]),
          { label: "IGNORE", action: () => onDone(), cls: "btn-gray" },
        ]
      },
      mercenary_offer: (() => {
        // 40% chance: alien invasion distress call if invasion active
        const invaded = game.alienInvasionActive
          ? (game.galaxy || []).filter(s => (s.alienCount||0) > 0) : [];
        if (invaded.length > 0 && Math.random() < 0.4) {
          const sys = pick(invaded);
          const status = (sys.alienCount||0) >= 5 ? "OCCUPIED" : "under attack";
          return {
            title: "🛸 DISTRESS BROADCAST",
            desc: '"Mayday from ' + sys.name + '! Alien forces are ' + status + '. ' + sys.alienCount + ' ships detected. Anyone in range, please respond!"',
            options: [
              { label: "NOTED — PLOT COURSE", action: () => {
                onUpdate({ ...game,
                  news: [{ text: "👾 " + sys.name + ": aliens " + status + " (" + sys.alienCount + " ships)", event: true, system: sys.id }, ...(game.news||[])].slice(0,10),
                  log:  [{ type: "warn", text: "Distress call from " + sys.name + " — aliens " + status }, ...game.log],
                });
                onDone();
              }, cls: "btn-red" },
              { label: "IGNORE", action: () => onDone(), cls: "btn-gray" },
            ]
          };
        }

        const merc = pick(MERCENARY_POOL.filter(m =>
          !(game.mercenaries || []).find(x => x.id === m.id)
        ));
        if (!merc) return {
          title: "🛸 PASSING SHIP",
          desc: "A trader hails you briefly. Nothing useful to report.",
          options: [{ label: "ACKNOWLEDGED", action: () => onDone(), cls: "btn-gray" }]
        };
        const targetSys = pick(game.galaxy.filter(s => s.id !== game.currentSystem && !(s.alienCount >= 5)));
        const skillStr = "P:" + merc.skills.pilot + " F:" + merc.skills.fighter +
          " T:" + merc.skills.trader + " E:" + merc.skills.engineer;
        return {
          title: "🛸 PASSING SHIP",
          desc: "A pilot hails you. \"Heard a spacer named " + merc.name + " is looking for work out of " + (targetSys?.name||"somewhere") + ". Good skills — " + skillStr + ".\"",
          options: [
            { label: "THANKS FOR THE TIP", action: () => {
              onUpdate({ ...game,
                news: [{ text: merc.name + " (crew) available in " + (targetSys?.name||"?") + " · " + skillStr, event: false }, ...(game.news||[])].slice(0, 10),
                log: [{ type: "info", text: "Tip: " + merc.name + " looking for work in " + (targetSys?.name||"?") }, ...game.log],
              });
              onDone();
            }, cls: "btn-blue" },
            { label: "NOT INTERESTED", action: () => onDone(), cls: "btn-gray" },
          ]
        };
      })(),
      sealed_cargo: {
        title: "🎁 SEALED CARGO",
        desc: "A second-hand dealer offers you 3 sealed cargo containers for 1,000 cr. Could be anything — water to robots!",
        options: [
          ...(game.credits >= 1000 ? [{ label: "BUY (1000 cr)", action: () => {
            const items = ["water","furs","food","ore","games","medicine","robots"];
            const newCargo = [...game.cargo, { id: pick(items), qty: 3, buyPrice: 333 }];
            onUpdate({ ...game, credits: game.credits - 1000, cargo: newCargo,
              log: [{ type: "info", text: "Opened sealed cargo!" }, ...game.log] });
            onDone();
          }, cls: "btn-gold" }] : []),
          { label: game.credits >= 1000 ? "PASS" : "CAN'T AFFORD — PASS", action: () => onDone(), cls: "btn-gray" },
        ]
      },
      tonic: {
        title: "🧪 ALIEN TONIC",
        desc: "A traveler offers you a bottle of alien brew. Rumored to enhance skills — expiration date unreadable.",
        options: [
          ...(game.credits >= 500 ? [{ label: "DRINK (500 cr)", action: () => {
            const s = pick(["pilot","fighter","trader","engineer"]);
            const worked = Math.random() < 0.4;
            const newSkills = worked ? { ...game.skills, [s]: Math.min(10, game.skills[s] + 1) } : game.skills;
            onUpdate({ ...game, credits: game.credits - 500, skills: newSkills,
              log: [{ type: worked ? "good" : "warn", text: worked ? "Tonic worked! +" + s : "Tonic had no effect." }, ...game.log] });
            onDone();
          }, cls: "btn-green" }] : []),
          { label: game.credits >= 500 ? "DECLINE" : "CAN'T AFFORD — DECLINE", action: () => onDone(), cls: "btn-gray" },
        ]
      },
      record_wipe: (() => {
        const rep = game.reputation || 0;
        // Cost scales with how bad your record is: 2000 per rep point below 0
        const cost = Math.abs(rep) * 2000;
        // Wipe gives +3 rep, but never above -1 (can't buy full clean slate instantly)
        const newRep = Math.min(-1, rep + 3);
        const canAfford = game.credits >= cost;
        return {
          title: "🖥 SHADOW BROKER",
          desc: "A hacker's ship drifts alongside, running on no transponder. An encrypted message: \"I've seen your file. It's... colorful. I can make some of it disappear. " + cost.toLocaleString() + " cr for a partial scrub — three points off the record. Interested?\"",
          options: [
            ...(canAfford ? [{
              label: "PAY " + cost.toLocaleString() + " cr (Rep " + rep + " → " + newRep + ")",
              action: () => {
                const kills = (game.killedCivilian || 0) + (game.killedPolice || 0);
                const newKilledCivilian = kills > 0 ? Math.max(0, (game.killedCivilian || 0) - 1) : (game.killedCivilian || 0);
                const newKilledPolice   = newKilledCivilian === (game.killedCivilian || 0) && kills > 0
                  ? Math.max(0, (game.killedPolice || 0) - 1) : (game.killedPolice || 0);
                onUpdate({ ...game,
                  credits: game.credits - cost,
                  reputation: newRep,
                  killedCivilian: newKilledCivilian,
                  killedPolice: newKilledPolice,
                  log: [{ type: "good", text: "Record partially wiped. Rep: " + rep + " → " + newRep + (kills > 0 ? " · 1 kill scrubbed from databases" : "") }, ...game.log],
                });
                onDone();
              }, cls: "btn-gold"
            }] : [{ label: "CAN'T AFFORD (" + cost.toLocaleString() + " cr)", action: () => onDone(), cls: "btn-gray" }]),
            { label: "DECLINE", action: () => onDone(), cls: "btn-gray" },
          ]
        };
      })(),
      pirate_contract: (() => {
        const rep = game.reputation || 0;
        const targetSys = pick(game.galaxy.filter(s => s.id !== game.currentSystem));

        // Job type depends on how bad reputation is
        const jobType = rep <= -8
          ? pick(["diplomat", "diplomat", "freighter"])  // worst: assassination missions
          : rep <= -6
          ? pick(["diplomat", "freighter", "patrol"])
          : pick(["freighter", "patrol", "patrol"]);     // -4..-5: easier jobs

        const JOBS = {
          diplomat: {
            title: "🔱 UNDERWORLD CONTRACT",
            npc: "A cloaked vessel slides alongside. An encrypted channel opens.",
            task: "A Flea-class diplomatic courier is en route to " + targetSys.name + ". The package it carries must not arrive. Intercept and destroy it — no witnesses.",
            reward: { credits: rnd(8, 18) * 1000, item: pick(["military_laser", "energy_shield", null]) },
            repCost: -4,
            subType: "diplomat",
          },
          freighter: {
            title: "💀 PIRATE JOB",
            npc: "A scarred Hornet-class ship hails you on an unmarked frequency.",
            task: "A merchant convoy is passing through " + targetSys.name + ". Destroy the lead freighter and take the cargo. We'll pay on delivery.",
            reward: { credits: rnd(4, 10) * 1000, item: pick(["beam_laser", null, null]) },
            repCost: -3,
            subType: "freighter",
          },
          patrol: {
            title: "🔫 DIRTY WORK",
            npc: "Someone hails you on a pirate frequency. Voice distorted.",
            task: "A police patrol in " + targetSys.name + " is getting too close to our operations. Eliminate them. Payment on completion — no questions asked.",
            reward: { credits: rnd(5, 12) * 1000, item: null },
            repCost: -3,
            subType: "patrol",
          },
        };

        const job = JOBS[jobType];
        const rewardStr = job.reward.credits.toLocaleString() + " cr"
          + (job.reward.item ? " + equipment" : "");

        const acceptJob = () => {
          const deadline = game.days + rnd(6, 12);
          const newContract = {
            id: "pirate_" + Date.now(),
            type: "pirate_job",
            subType: job.subType,
            title: job.title.replace(/.*? /, "").slice(0, 30),
            targetSystemId: targetSys.id,
            targetSystemName: targetSys.name,
            reward: job.reward.credits,
            rewardItem: job.reward.item,
            repCost: job.repCost,
            deadline,
            status: "active",
            emoji: "💀",
            killsCompleted: 0,
            killCount: 1,
          };
          onUpdate({ ...game,
            activeContracts: [...(game.activeContracts || []), newContract],
            reputation: Math.max(-10, rep - 1), // accepting already costs rep
            log: [{ type: "bad", text: "Took pirate contract: " + newContract.title + " in " + targetSys.name + " · deadline " + deadline + "d" }, ...game.log],
          });
          onDone();
        };

        return {
          title: job.title,
          desc: job.npc + "\n\n\"" + job.task + "\"\n\nReward: " + rewardStr + " · Rep " + job.repCost + " · " + rnd(6,12) + " days",
          options: [
            { label: "ACCEPT (" + rewardStr + ")", action: acceptJob, cls: "btn-red" },
            { label: "REFUSE", action: () => onDone(), cls: "btn-gray" },
          ]
        };
      })(),
    };

    const spec = specials[encounter.sub] || specials.sealed_cargo;
    return (
      <div className="encounter-box" style={{ borderColor: "#ffd700" }}>
        <div className="encounter-title" style={{ color: "#ffd700" }}>{spec.title}</div>
        <div className="encounter-desc">{spec.desc}</div>
        <div className="flex-gap">
          {spec.options.map((opt, i) => (
            <button key={i} className={"btn " + opt.cls} onClick={opt.action}>{opt.label}</button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}


// ── Alien Encounter ───────────────────────────────────────────────────────────
function AlienEncounterScreen({ game, encounter, onUpdate, onDone }) {
  const [combatLog, setCombatLog] = useState([]);
  const [alienHull, setAlienHull]   = useState(encounter.hull);
  const [phase, setPhase]           = useState("choice");
  const gameRef = useRef(game);
  gameRef.current = game;

  const hasCloaking = (game.gadgets || []).some(g => g.id === 'cloaking_device');
  const alienHullMax = encounter.hullMax;

  const fight = () => {
    if (phase === 'ended') return;
    setPhase('fighting');
    const g = gameRef.current;
    const { playerHull, playerShields, alienHull: newAlienHull,
            log, ended, result } = doAlienCombatRound(g, { ...encounter, hull: alienHull }, 'fight');

    setCombatLog(l => [...log, ...l].slice(0, 20));

    // Update player shields in game state
    let updatedShields = g.shields;
    if (g.shields.length > 0 && playerShields !== g.shields.reduce((s,sh)=>s+sh.current,0)) {
      let remaining = playerShields;
      updatedShields = g.shields.map(sh => {
        const cur = Math.min(sh.max, remaining);
        remaining = Math.max(0, remaining - sh.max);
        return { ...sh, current: cur };
      });
    }

    setAlienHull(Math.max(0, newAlienHull));

    if (ended) {
      setPhase('ended');
      if (result === 'win') {
        let finalGame = { ...g, hull: playerHull, shields: updatedShields };
        finalGame = onAlienKilled(finalGame, g.currentSystem, encounter.sub);
        // Wave?
        const currentWave = encounter.wave || 1;
        if (currentWave < (encounter.maxWaves || 1)) {
          finalGame.log = [{ type: 'bad', text: 'Another alien closing in! Wave ' + (currentWave+1) }, ...finalGame.log];
          onUpdate(finalGame);
          setTimeout(() => {
            const nextEnc = { ...encounter, hull: encounter.hullMax, wave: currentWave + 1 };
            setAlienHull(nextEnc.hull);
            setPhase('choice');
            setCombatLog([{ type: 'bad', text: '⚠ Wave ' + (currentWave+1) + '/' + encounter.maxWaves }]);
            onDone(nextEnc);
          }, 1200);
          return;
        }
        onUpdate(finalGame);
        setTimeout(() => onDone(), 800);
      } else if (result === 'dead') {
        const hasEscapePod = (g.gadgets || []).some(gg => gg.id === 'escape_pod');
        if (hasEscapePod) {
          onUpdate(applyEscapePod(g));
          setTimeout(() => onDone(), 800);
        } else {
          onUpdate({ ...g, hull: playerHull, dead: true });
        }
      }
    } else {
      onUpdate({ ...g, hull: playerHull, shields: updatedShields });
    }
  };

  const flee = () => {
    // Cloaking device helps; fleeHard aliens are fast scouts
    const base = 0.30 + (game.skills?.pilot || 0) * 0.05;
    const cloak = hasCloaking ? 0.40 : 0;
    const penalty = encounter.fleeHard ? -0.20 : 0;
    const chance = Math.min(0.90, base + cloak + penalty);
    if (Math.random() < chance) {
      onUpdate({ ...game, log: [{ type: 'info', text: 'Escaped from ' + encounter.ship.name + '!' }, ...game.log] });
      onDone();
    } else {
      setCombatLog(l => [{ type: 'bad', text: 'Failed to flee! ' + encounter.ship.name + ' is too fast!' }, ...l]);
      fight(); // alien still attacks
    }
  };

  const alienPct = Math.round((alienHull / alienHullMax) * 100);
  const playerPct = Math.round((game.hull / game.hullMax) * 100);

  return (
    <div className="panel" style={{ borderColor: '#ff4400' }}>
      <div className="panel-title" style={{ color: '#ff6600' }}>
        👾 ALIEN ENCOUNTER — {encounter.ship.name.toUpperCase()}
        {encounter.maxWaves > 1 && <span style={{ color: '#ff4444', marginLeft: 8 }}>Wave {encounter.wave}/{encounter.maxWaves}</span>}
      </div>

      {/* Ship sprites */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '8px 0' }}>
        <ShipSprite shipId={game.ship.id} size={56}/>
        <div style={{ fontSize: 22, color: '#ff4400' }}>⚔</div>
        <ShipSprite shipId={encounter.sub} size={56} flip={true}/>
      </div>

      {/* Status bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '8px 0' }}>
        <div>
          <div style={{ fontSize: 13, color: '#ff6600', marginBottom: 2 }}>{encounter.ship.name}</div>
          <div style={{ background: '#1a0a00', height: 10, borderRadius: 3, border: '1px solid #ff4400' }}>
            <div style={{ width: alienPct + '%', height: '100%', background: '#ff4400', borderRadius: 3, transition: 'width 0.3s' }}/>
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>{Math.max(0, alienHull)}/{alienHullMax} hull</div>
          {encounter.regen > 0 && !((game.gadgets||[]).some(g=>g.id==='regen_inhibitor')) &&
            <div style={{ fontSize: 11, color: '#ff8800' }}>↺ regenerates {encounter.regen}/round</div>}
        </div>
        <div>
          <div style={{ fontSize: 13, color: '#00ff88', marginBottom: 2 }}>Your ship</div>
          <div style={{ background: '#001a00', height: 10, borderRadius: 3, border: '1px solid #00ff44' }}>
            <div style={{ width: playerPct + '%', height: '100%', background: '#00ff44', borderRadius: 3, transition: 'width 0.3s' }}/>
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>{game.hull}/{game.hullMax} hull</div>
        </div>
      </div>

      {/* Alien capabilities */}
      <div style={{ fontSize: 13, color: '#ff8800', marginBottom: 8 }}>
        {encounter.ship.weapons}× pulse [{encounter.pulseDamage[0]}-{encounter.pulseDamage[1]}]
        {encounter.hasPlasma && <span style={{ color: '#ff4444', marginLeft: 8 }}>⚡ plasma burst ({Math.round(encounter.plasma.chance*100)}% · {encounter.plasma.damage} dmg · bypasses shields)</span>}
        {encounter.fleeHard && <span style={{ color: '#ffaa00', marginLeft: 8 }}>· FAST — hard to escape</span>}
      </div>

      {/* Combat log */}
      {combatLog.length > 0 && (
        <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 8, fontSize: 13 }}>
          {combatLog.map((e, i) => <div key={i} className={"log-entry " + e.type}>{e.text}</div>)}
        </div>
      )}

      {phase !== 'ended' && (
        <div className="flex-gap">
          <button className="btn btn-red" onClick={fight}>⚔ FIGHT</button>
          <button className="btn btn-blue" onClick={flee}>
            {hasCloaking ? '🫥 CLOAK & FLEE' : '↗ FLEE'}
            {encounter.fleeHard && !hasCloaking && <span style={{ fontSize: 11 }}> (risky)</span>}
          </button>
        </div>
      )}
    </div>
  );
}

export default EncounterScreen;

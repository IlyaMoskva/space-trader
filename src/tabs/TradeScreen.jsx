import { useState, useEffect, useCallback, useRef } from 'react';
import { COMMODITIES } from '../constants/commodities.js';
import { getMarketPrices } from '../engine/market.js';
import { effectiveSkills } from '../engine/combat.js';
import { GOV_TYPES, TECH_LEVELS, SIZES, GOV_CATEGORY_MOD } from '../constants/world.js';
import { initMarket, getCommodityCategory, priceFromStock } from '../engine/market.js';
import { isServiceBanned } from '../engine/utils.js';
import { getOccupiedServices, sellArtifactsAtScientist } from '../engine/aliens.js';

function TradeScreen({ game, onUpdate }) {
  const sys = game.galaxy[game.currentSystem];

  // Ensure market exists (for start system)
  const market = sys.market || initMarket(sys);
  const prices = getMarketPrices(market);

  const contractCargoUsed = (game.activeContracts || [])
    .filter(c => c.type === "delivery" && c.status === "active")
    .reduce((s, c) => s + c.cargoQty, 0);
  const cargoUsed = game.cargo.filter(c => !c.contractId).reduce((s, c) => s + c.qty, 0) + contractCargoUsed;
  const cargoFree = game.cargoCapacity - cargoUsed;

  const getCargoQty = (id) => {
    const c = game.cargo.find(x => x.id === id);
    return c ? c.qty : 0;
  };

  // Update market in galaxy state
  const updateMarket = (newMarket, newCargo, creditsDelta, logEntry) => {
    const newGalaxy = game.galaxy.map(s =>
      s.id === sys.id ? { ...s, market: newMarket } : s
    );
    onUpdate({ ...game, credits: game.credits + creditsDelta, cargo: newCargo,
      galaxy: newGalaxy, log: [logEntry, ...game.log].slice(0, 50) });
  };

  const buy = (id) => {
    const m = market[id];
    if (!m || m.stock <= 0) return;
    const price = prices[id];
    if (!price || game.credits < price || cargoFree < 1) return;
    const com = COMMODITIES.find(c => c.id === id);

    const newMarket = { ...market, [id]: { ...m, stock: m.stock - 1 } };
    const newCargo = [...game.cargo];
    const idx = newCargo.findIndex(c => c.id === id);
    // track avg buy price
    if (idx >= 0) {
      const old = newCargo[idx];
      const avgPrice = Math.round((old.buyPrice * old.qty + price) / (old.qty + 1));
      newCargo[idx] = { ...old, qty: old.qty + 1, buyPrice: avgPrice };
    } else {
      newCargo.push({ id, qty: 1, buyPrice: price });
    }
    updateMarket(newMarket, newCargo, -price,
      { type: "good", text: "Bought 1x " + com.name + " @ " + price + " cr" });
  };

  const crisisGoods = new Set(
    (market.events || []).flatMap(e =>
      ({plague:["medicine"], drought:["food","water"], war:["food","medicine","machines"], coldwinter:["food","medicine"]})[e.id] || []
    )
  );

  const sell = (id) => {
    const held = getCargoQty(id);
    if (held <= 0) return;
    const m = market[id];
    const com = COMMODITIES.find(c => c.id === id);
    const events = market.events || [];

    // Banned port: can dump cargo (price=0) to free space; crisis goods sold normally
    if (banned && !crisisGoods.has(id)) {
      const newCargo = game.cargo.map(c =>
        c.id === id ? { ...c, qty: c.qty - 1 } : c
      ).filter(c => c.qty > 0);
      onUpdate({ ...game, cargo: newCargo,
        log: [{ type: "warn", text: "Dumped 1x " + com.name + " (port refused purchase)" }, ...game.log] });
      return;
    }

    let sellPrice, belowMarket;
    if (m && m.basePrice && m.baseStock > 0) {
      // Planet trades this commodity — use live stock price (selling adds to stock → price drops)
      sellPrice = priceFromStock(m.basePrice, m.stock, m.baseStock, events, id);
      belowMarket = false;
    } else {
      // Planet doesn't normally trade it — black market / barter price
      // Use 65% of base commodity price, modified by gov
      const baseCom = COMMODITIES.find(c => c.id === id);
      const govMod = GOV_CATEGORY_MOD[sys.gov] || GOV_CATEGORY_MOD[5];
      const cat = getCommodityCategory(id);
      const baseVal = Math.floor(baseCom.base * (govMod[cat] || 1.0) * 0.65);
      sellPrice = Math.max(5, baseVal);
      belowMarket = true;
    }

    const bought = game.cargo.find(c => c.id === id)?.buyPrice || 0;
    const profit = sellPrice - bought;
    const profitStr = profit >= 0 ? " (+" + profit + " profit)" : " (" + profit + " loss)";
    const marketNote = belowMarket ? " [below market]" : "";

    const newMarket = (m && m.baseStock > 0)
      ? { ...market, [id]: { ...m, stock: m.stock + 1 } }
      : market;
    const newCargo = game.cargo.map(c =>
      c.id === id ? { ...c, qty: c.qty - 1 } : c
    ).filter(c => c.qty > 0);

    // Illegal goods: always -1 rep; random police bust based on police level and rep
    if (com?.illegal) {
      const rep = game.reputation || 0;
      const bustChance = Math.min(0.70, sys.police * 0.10 + Math.max(0, -rep) * 0.05);
      if (Math.random() < bustChance) {
        // Busted — no sale proceeds, goods confiscated, fine, rep -2
        const fine = Math.round(sellPrice * 1.5);
        const newGalaxy = game.galaxy.map(s => s.id === sys.id ? { ...s, market: newMarket } : s);
        onUpdate({ ...game,
          credits: Math.max(0, game.credits - fine),
          cargo: newCargo,
          galaxy: newGalaxy,
          policeRecord: (game.policeRecord || 0) + 1,
          reputation: Math.max(-10, rep - 2),
          log: [{ type: "bad", text: "Busted selling " + com.name + "! Fine: " + fine + " cr. Rep −2." }, ...game.log],
        });
        return;
      }
      // Not caught — sale goes through, rep -1
      const newGalaxy = game.galaxy.map(s => s.id === sys.id ? { ...s, market: newMarket } : s);
      onUpdate({ ...game,
        credits: game.credits + sellPrice,
        cargo: newCargo,
        galaxy: newGalaxy,
        policeRecord: (game.policeRecord || 0) + 1,
        reputation: Math.max(-10, rep - 1),
        log: [{ type: "warn", text: "Sold 1x " + com.name + " @ " + sellPrice + " cr" + profitStr + " [illegal, rep −1]" }, ...game.log],
      });
      return;
    }

    updateMarket(newMarket, newCargo, sellPrice,
      { type: profit >= 0 ? "good" : "warn",
        text: "Sold 1x " + com.name + " @ " + sellPrice + " cr" + profitStr + marketNote });
  };

  // Price trend vs base (before events)
  const priceTrend = (id) => {
    const m = market[id];
    if (!m || !m.basePrice) return null;
    const cur = prices[id];
    if (!cur) return null;
    const events = market.events || [];
    const evMult = events.reduce((acc, ev) => acc * (ev.effects[id] || 1.0), 1.0);
    // Show event tag if active event affects this commodity
    const hasEvent = Math.abs(evMult - 1.0) > 0.05;
    if (cur > m.basePrice * 1.2) return { symbol: "▲", color: "#ff6b35", event: hasEvent };
    if (cur < m.basePrice * 0.8) return { symbol: "▼", color: "#00ff88", event: hasEvent };
    return { symbol: "─", color: "#555588", event: false };
  };

  const occupied = getOccupiedServices(sys);
  const banned = isServiceBanned(sys, game.reputation || 0) || !occupied.market;

  return (
    <div>
      <div className="panel">
        <div className="panel-title">
          {sys.name} · {TECH_LEVELS[sys.tech]} · {GOV_TYPES[sys.gov]} · Pop {SIZES[sys.size]}
          <span className="badge badge-gold" style={{ marginLeft: 8 }}>Cargo {cargoUsed}/{game.cargoCapacity}</span>
        </div>
        {banned && (
          <div style={{ padding: "8px 0", color: "#ff6b35", fontSize: 14 }}>
            {!occupied.market && (sys.alienCount || 0) >= 5
              ? "👾 Market destroyed — alien occupation. You can dump cargo to free space."
              : "⛔ Market closed — " + GOV_TYPES[sys.gov] + " government refuses to trade with criminals."}
          </div>
        )}
        <div className="commodity-row header" style={{ gridTemplateColumns: "1fr 65px 38px 38px 50px 28px 28px" }}>
          <div>COMMODITY</div><div>PRICE</div><div>STOCK</div><div>HOLD</div><div>P/L</div><div></div><div></div>
        </div>
        {COMMODITIES.map(com => {
          const m = market[com.id];
          const price = prices[com.id];
          const held = getCargoQty(com.id);
          const stock = m?.stock ?? 0;
          const trend = priceTrend(com.id);
          const canBuy = !banned && price && game.credits >= price && cargoFree > 0 && stock > 0;
          const canSell = !banned && held > 0;

          const govMod = GOV_CATEGORY_MOD[sys.gov] || GOV_CATEGORY_MOD[5];
          const cat = getCommodityCategory(com.id);
          const offMarketPrice = !price && held > 0
            ? Math.max(5, Math.floor(com.base * (govMod[cat] || 1.0) * 0.65))
            : null;

          const cargoEntry = game.cargo.find(c => c.id === com.id);
          const buyPrice = cargoEntry?.buyPrice || 0;
          const currentSellPrice = price || offMarketPrice;
          const pl = held > 0 && buyPrice > 0 && currentSellPrice
            ? currentSellPrice - buyPrice : null;

          if (!price && held === 0) return null;
          return (
            <div key={com.id} className="commodity-row" style={{ gridTemplateColumns: "1fr 65px 38px 38px 50px 28px 28px" }}>
              <div className={com.illegal ? "com-name com-illegal" : "com-name"}>
                {com.name}{com.illegal && " ⚠"}
              </div>
              <div style={{ color: price ? "#ffd700" : "#aa9944", display: "flex", alignItems: "center", gap: 2 }}>
                {price ? price : offMarketPrice ? offMarketPrice + "~" : "—"}
                {trend && <span style={{ color: trend.color, fontSize: 16 }}>{trend.symbol}</span>}
                {trend?.event && <span style={{ color: "#ffd700", fontSize: 15 }} title="Affected by local event">!</span>}
              </div>
              <div style={{ color: stock > 5 ? "#8888bb" : stock > 0 ? "#ffd700" : "#ff6b35" }}>
                {price ? stock : "—"}
              </div>
              <div style={{ color: held > 0 ? "#00ff88" : "#555588" }}>{held}</div>
              <div style={{ fontSize: 14, color: pl === null ? "#444466" : pl > 0 ? "#00ff88" : pl < 0 ? "#ff6b35" : "#888888" }}>
                {pl === null ? "—" : (pl > 0 ? "+" : "") + pl}
              </div>
              <button className="qty-btn"
                style={canBuy ? { borderColor: "#00ff88", color: "#00ff88" } : { opacity: 0.3 }}
                onClick={() => buy(com.id)}>B</button>
              <button className="qty-btn"
                style={held > 0 ? (banned && !crisisGoods.has(com.id) ? { borderColor: "#555588", color: "#888888" } : { borderColor: "#ff6b35", color: "#ff6b35" }) : { opacity: 0.3 }}
                title={banned && !crisisGoods.has(com.id) ? "Dump cargo (port refuses purchase)" : "Sell"}
                onClick={() => sell(com.id)}>
                {banned && !crisisGoods.has(com.id) && held > 0 ? "D" : "S"}
              </button>
            </div>
          );
        })}
      {/* Contract cargo — locked items */}
      {(game.activeContracts || []).filter(c => c.type === "delivery" && c.status === "active").map(c => (
        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "6px 4px", borderBottom: "1px solid #1a1a3a", fontSize: 14 }}>
          <span style={{ color: "#ffd700" }}>📦 {c.title}</span>
          <span style={{ color: "#555588" }}>{c.cargoQty}t · locked · → {c.to}</span>
        </div>
      ))}
      </div>

      {/* Alien artifacts */}
      {(game.cargo || []).some(c => c.id === "alien_artifact") && (() => {
        const artCargo = game.cargo.find(c => c.id === "alien_artifact");
        const qty = artCargo?.qty || 0;
        const isOccupied = (game.galaxy[game.currentSystem]?.alienCount || 0) >= 5;
        if (isOccupied) return null;
        const isScientist = sys.tech >= 6;
        const sellPrice   = isScientist ? 5000 : 3000;
        const priceLabel  = isScientist ? "5,000 cr (scientist)" : "3,000 cr";
        return (
          <div className="panel" style={{ marginTop: 8, borderColor: "#ff6600" }}>
            <div className="panel-title" style={{ color: "#ff6600" }}>
              👾 Alien Artifacts ({qty} in hold · {game.alienArtifacts || 0} total collected)
            </div>
            <div style={{ fontSize: 14, color: "#8888bb", marginBottom: 8 }}>
              {isScientist
                ? "⚗️ Research institute here pays premium: " + priceLabel
                : "Sell for " + priceLabel + " · Hi-tech planets pay 5,000 cr"}
              <span style={{ color: "#ffd700", marginLeft: 8 }}>
                Regen Inhibitor needs 10 · Cloaking needs 5
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-gold" onClick={() => {
                const ng = sellArtifactsAtScientist(game, 1);
                if (ng) { onUpdate(ng); return; }
                // Fallback regular sell
                const newCargo = game.cargo.map(c =>
                  c.id === "alien_artifact" ? { ...c, qty: c.qty - 1 } : c
                ).filter(c => c.qty > 0);
                onUpdate({ ...game, credits: game.credits + sellPrice, cargo: newCargo,
                  log: [{ type: "good", text: "Sold alien artifact for " + sellPrice.toLocaleString() + " cr" }, ...game.log] });
              }}>SELL ONE ({sellPrice.toLocaleString()} cr)</button>
              <button className="btn btn-red" onClick={() => {
                const ng = sellArtifactsAtScientist(game, qty);
                if (ng) { onUpdate(ng); return; }
                const total = qty * sellPrice;
                const newCargo = game.cargo.filter(c => c.id !== "alien_artifact");
                onUpdate({ ...game, credits: game.credits + total, cargo: newCargo,
                  log: [{ type: "good", text: "Sold " + qty + " artifacts for " + total.toLocaleString() + " cr" }, ...game.log] });
              }}>SELL ALL ({(qty * sellPrice).toLocaleString()} cr)</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


export default TradeScreen;

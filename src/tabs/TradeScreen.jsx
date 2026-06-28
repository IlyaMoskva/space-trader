import { useState, useEffect, useCallback, useRef } from 'react';
import { COMMODITIES } from '../constants/commodities.js';
import { getMarketPrices } from '../engine/market.js';
import { effectiveSkills } from '../engine/combat.js';

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

  const sell = (id) => {
    const held = getCargoQty(id);
    if (held <= 0) return;
    const m = market[id];
    const com = COMMODITIES.find(c => c.id === id);
    const events = market.events || [];

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

  return (
    <div>
      <div className="panel">
        <div className="panel-title">
          {sys.name} · {TECH_LEVELS[sys.tech]} · {GOV_TYPES[sys.gov]} · Pop {SIZES[sys.size]}
          <span className="badge badge-gold" style={{ marginLeft: 8 }}>Cargo {cargoUsed}/{game.cargoCapacity}</span>
        </div>
        <div className="commodity-row header" style={{ gridTemplateColumns: "1fr 65px 38px 38px 50px 28px 28px" }}>
          <div>COMMODITY</div><div>PRICE</div><div>STOCK</div><div>HOLD</div><div>P/L</div><div></div><div></div>
        </div>
        {COMMODITIES.map(com => {
          const m = market[com.id];
          const price = prices[com.id];
          const held = getCargoQty(com.id);
          const stock = m?.stock ?? 0;
          const trend = priceTrend(com.id);
          const canBuy = price && game.credits >= price && cargoFree > 0 && stock > 0;
          const canSell = held > 0;

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
                style={canSell ? { borderColor: "#ff6b35", color: "#ff6b35" } : { opacity: 0.3 }}
                onClick={() => sell(com.id)}>S</button>
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
    </div>
  );
}


export default TradeScreen;

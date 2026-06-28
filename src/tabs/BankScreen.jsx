import { useState, useEffect, useCallback, useRef } from 'react';

function BankScreen({ game, onUpdate }) {
  const [amount, setAmount] = useState(1000);
  const maxBorrow = Math.max(0, game.credits * 2 - game.debt);
  const maxRepay  = Math.min(game.debt, game.credits);

  const borrow = () => {
    if (amount > maxBorrow || amount < 100) return;
    onUpdate({ ...game, credits: game.credits + amount, debt: game.debt + amount,
      log: [{ type: "warn", text: "Borrowed " + amount + " cr. Debt: " + (game.debt + amount) }, ...game.log] });
  };
  const repay = (pay) => {
    const actual = Math.min(pay ?? amount, game.debt, game.credits);
    if (actual <= 0) return;
    onUpdate({ ...game, credits: game.credits - actual, debt: game.debt - actual,
      log: [{ type: "good", text: "Repaid " + actual.toLocaleString() + " cr. Remaining debt: " + (game.debt - actual).toLocaleString() }, ...game.log] });
  };

  // Two separate sliders: borrow (0..maxBorrow) and repay (0..maxRepay)
  const canBorrow = maxBorrow >= 100;
  const canRepay  = maxRepay > 0;

  return (
    <div className="panel">
      <div className="panel-title">Galactic Bank</div>
      <div className="stat-row"><span className="stat-label">Credits</span><span className="stat-val-green">{game.credits.toLocaleString()} cr</span></div>
      <div className="stat-row"><span className="stat-label">Debt</span><span className="stat-val-red">{game.debt.toLocaleString()} cr</span></div>
      <div className="stat-row"><span className="stat-label">Daily Interest</span><span className="stat-val-red">{game.debt > 0 ? "+" + Math.ceil(game.debt * 0.01) + " cr/day" : "—"}</span></div>
      <div className="stat-row"><span className="stat-label">Max Borrow</span><span className="stat-val">{maxBorrow > 0 ? maxBorrow.toLocaleString() + " cr" : "—"}</span></div>

      {/* Borrow section */}
      {canBorrow && (
        <div style={{ marginTop: 12, padding: "10px", border: "1px solid #2a2a5a", borderRadius: 4 }}>
          <div style={{ fontSize: 14, color: "#8888bb", marginBottom: 6 }}>Borrow</div>
          <input type="range" min="100" max={maxBorrow} step="100"
            value={Math.min(amount, maxBorrow)}
            onChange={e => setAmount(+e.target.value)}
            style={{ width: "100%", accentColor: "#ffd700", marginBottom: 4 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 16, color: "#ffd700" }}>{Math.min(amount, maxBorrow).toLocaleString()} cr</span>
            <button className="btn btn-gold" onClick={borrow}>BORROW</button>
          </div>
        </div>
      )}

      {/* Repay section */}
      {canRepay && (
        <div style={{ marginTop: 10, padding: "10px", border: "1px solid #1a3a1a", borderRadius: 4 }}>
          <div style={{ fontSize: 14, color: "#8888bb", marginBottom: 6 }}>Repay (you have {game.credits.toLocaleString()} cr)</div>
          <input type="range" min="100" max={maxRepay} step="100"
            value={Math.min(amount, maxRepay)}
            onChange={e => setAmount(+e.target.value)}
            style={{ width: "100%", accentColor: "#00ff88", marginBottom: 4 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, color: "#00ff88" }}>{Math.min(amount, maxRepay).toLocaleString()} cr</span>
            <button className="btn btn-green" onClick={() => repay()}>REPAY</button>
            <button className="btn btn-blue" onClick={() => repay(maxRepay)}>REPAY ALL</button>
          </div>
        </div>
      )}
      {!canRepay && game.debt === 0 && (
        <div style={{ marginTop: 10, fontSize: 15, color: "#00ff88" }}>✓ No debt</div>
      )}
      {(game.reputation || 0) <= -3 && (() => {
        const rep = game.reputation || 0;
        const kills = (game.killedCivilian || 0) + (game.killedPolice || 0);
        // Fines don't work for murderers — blood money stays on record
        if (kills > 0) return (
          <div style={{ marginTop: 14, border: "1px solid #ff4444", borderRadius: 4, padding: 10 }}>
            <div style={{ fontSize: 15, color: "#ff4444", marginBottom: 6 }}>⚠ Criminal Record — Rep {rep}</div>
            <div style={{ fontSize: 14, color: "#555566" }}>
              You have {kills} kill{kills > 1 ? "s" : ""} on record. Fines cannot clear a murder charge.
              Rebuild reputation through deeds or find a Shadow Broker.
            </div>
          </div>
        );
        // Cost: 5000 per rep point below -2 (not -3 threshold), minimum 5000
        const clearCost = Math.max(5000, Math.abs(rep + 2) * 5000);
        // Only clears 1 point — expensive and slow
        const newRep = rep + 1;
        const canClear = game.credits >= clearCost;
        return (
          <div style={{ marginTop: 14, border: "1px solid #ff6b35", borderRadius: 4, padding: 10 }}>
            <div style={{ fontSize: 15, color: "#ff6b35", marginBottom: 6 }}>⚠ Criminal Record — Rep {rep}</div>
            <div style={{ fontSize: 14, color: "#8888bb", marginBottom: 8 }}>
              Pay legal fees to clear one charge → Rep {newRep}
              {rep <= -7 && <span style={{ color: "#ff4444" }}> · Bounty hunters are active</span>}
            </div>
            <button className={"btn " + (canClear ? "btn-gold" : "btn-disabled")}
              onClick={() => {
                if (!canClear) return;
                onUpdate({ ...game,
                  credits: game.credits - clearCost,
                  reputation: newRep,
                  log: [{ type: "good", text: "Legal fees paid: " + clearCost.toLocaleString() + " cr. Rep: " + rep + " → " + newRep }, ...game.log],
                });
              }}>
              PAY LEGAL FEES ({clearCost.toLocaleString()} cr → Rep {newRep})
            </button>
          </div>
        );
      })()}
      {(() => {
        const netWorth = game.credits - (game.debt || 0);
        if (netWorth < 500000) return null;
        return (
          <div style={{ marginTop: 14, border: "1px solid #ffd700", borderRadius: 4, padding: 10 }}>
            <div style={{ fontSize: 16, color: "#ffd700", marginBottom: 8 }}>🌙 MOON FOR SALE — UTOPIA SYSTEM</div>
            <div style={{ fontSize: 15, color: "#aaa8cc", marginBottom: 8 }}>
              Retire in luxury! Cost: 500,000 cr
              {game.debt > 0 && <span style={{ color: "#00ff88", marginLeft: 6 }}>Net worth: {netWorth.toLocaleString()} cr ✓</span>}
            </div>
            <button className="btn btn-gold" onClick={() => {
              if (game.credits - (game.debt || 0) < 500000) return;
              onUpdate({ ...game, credits: game.credits - 500000, retired: true });
            }}>
              BUY MOON & RETIRE
            </button>
          </div>
        );
      })()}
    </div>
  );
}


export default BankScreen;

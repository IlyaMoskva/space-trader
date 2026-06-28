import { useState, useEffect, useCallback, useRef } from 'react';

function BankScreen({ game, onUpdate }) {
  const [amount, setAmount] = useState(1000);
  const maxBorrow = Math.max(0, game.credits * 2 - game.debt);
  const borrow = () => {
    if (amount > maxBorrow || amount < 100) return;
    onUpdate({ ...game, credits: game.credits + amount, debt: game.debt + amount,
      log: [{ type: "warn", text: "Borrowed " + amount + " cr. Debt: " + (game.debt + amount) }, ...game.log] });
  };
  const repay = () => {
    const pay = Math.min(amount, game.debt, game.credits);
    if (pay <= 0) return;
    onUpdate({ ...game, credits: game.credits - pay, debt: game.debt - pay,
      log: [{ type: "good", text: "Repaid " + pay + " cr. Debt: " + (game.debt - pay) }, ...game.log] });
  };
  return (
    <div className="panel">
      <div className="panel-title">Galactic Bank</div>
      <div className="stat-row"><span className="stat-label">Credits</span><span className="stat-val-green">{game.credits.toLocaleString()} cr</span></div>
      <div className="stat-row"><span className="stat-label">Debt</span><span className="stat-val-red">{game.debt.toLocaleString()} cr</span></div>
      <div className="stat-row"><span className="stat-label">Daily Interest</span><span className="stat-val-red">{game.debt > 0 ? "+" + Math.ceil(game.debt * 0.01) + " cr/day" : "—"}</span></div>
      <div className="stat-row"><span className="stat-label">Max Borrow</span><span className="stat-val">{maxBorrow.toLocaleString()} cr</span></div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 15, color: "#8888bb", marginBottom: 6 }}>Amount</div>
        <input type="range" min="100" max={Math.max(1000, maxBorrow)} step="100" value={amount}
          onChange={e => setAmount(+e.target.value)}
          style={{ width: "100%", accentColor: "#4fc3f7", marginBottom: 6 }} />
        <div style={{ fontSize: 17, color: "#ffd700", textAlign: "center", marginBottom: 10 }}>{amount.toLocaleString()} cr</div>
        <div className="flex-gap">
          <button className={amount <= maxBorrow ? "btn btn-gold" : "btn btn-disabled"} onClick={borrow}>BORROW</button>
          <button className={game.debt > 0 && game.credits > 0 ? "btn btn-green" : "btn btn-disabled"} onClick={repay}>REPAY</button>
        </div>
      </div>
      {(game.reputation || 0) <= -3 && (() => {
        const rep = game.reputation || 0;
        const clearCost = Math.abs(rep) * 1000;
        const newRep = Math.min(-1, rep + 3);
        const canClear = game.credits >= clearCost;
        return (
          <div style={{ marginTop: 14, border: "1px solid #ff6b35", borderRadius: 4, padding: 10 }}>
            <div style={{ fontSize: 15, color: "#ff6b35", marginBottom: 6 }}>⚠ Criminal Record — Rep {rep}</div>
            <div style={{ fontSize: 14, color: "#8888bb", marginBottom: 8 }}>
              Pay {clearCost.toLocaleString()} cr to clear part of your record → Rep {newRep}
              {rep <= -7 && <span style={{ color: "#ff4444" }}> · Bounty hunters are active</span>}
            </div>
            <button className={"btn " + (canClear ? "btn-gold" : "btn-disabled")}
              onClick={() => {
                if (!canClear) return;
                onUpdate({ ...game,
                  credits: game.credits - clearCost,
                  reputation: newRep,
                  log: [{ type: "good", text: "Paid " + clearCost + " cr to clear criminal record. Rep: " + newRep }, ...game.log],
                });
              }}>
              PAY FINE ({clearCost.toLocaleString()} cr)
            </button>
          </div>
        );
      })()}
      {game.credits >= 500000 && (
        <div style={{ marginTop: 14, border: "1px solid #ffd700", borderRadius: 4, padding: 10 }}>
          <div style={{ fontSize: 16, color: "#ffd700", marginBottom: 8 }}>🌙 MOON FOR SALE — UTOPIA SYSTEM</div>
          <div style={{ fontSize: 15, color: "#aaa8cc", marginBottom: 8 }}>Retire in luxury! Cost: 500,000 cr</div>
          <button className="btn btn-gold" onClick={() => {
            if (game.credits < 500000) return;
            onUpdate({ ...game, credits: game.credits - 500000, retired: true });
          }}>
            BUY MOON & RETIRE
          </button>
        </div>
      )}
    </div>
  );
}


export default BankScreen;

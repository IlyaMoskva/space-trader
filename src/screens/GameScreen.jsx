import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState } from '../hooks/useGameState.js';
import { generateEncounter } from '../engine/combat.js';
import { checkContractArrival, onPirateKilled } from '../engine/contracts.js';
import { checkQuestArrival, revealQuestHints } from '../engine/quests.js';
import StatusBar from '../components/StatusBar.jsx';
import MenuModal from '../components/MenuModal.jsx';
import QuestPopup from '../components/QuestPopup.jsx';
import TradeScreen from '../tabs/TradeScreen.jsx';
import TravelScreen from '../tabs/TravelScreen.jsx';
import ShipScreen from '../tabs/ShipScreen.jsx';
import BankScreen from '../tabs/BankScreen.jsx';
import ContractsScreen from '../tabs/ContractsScreen.jsx';
import LogScreen from '../tabs/LogScreen.jsx';
import EncounterScreen from '../tabs/EncounterScreen.jsx';

function GameScreen({ game, onUpdate, onNewGame, onTitle }) {
  const [tab, setTab] = useState("trade");
  const [encounter, setEncounter] = useState(null);
  const [questPopup, setQuestPopup] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [questTarget, setQuestTarget] = useState(null);

  const handleEncounter = (newGame, enc) => {
    onUpdate(newGame);
    setEncounter(enc);
  };

  const handleEncounterDone = (nextEncounter) => {
    // nextEncounter must be a real encounter object, not a browser Event
    if (nextEncounter && nextEncounter.type && typeof nextEncounter.type === "string" && nextEncounter.ship) {
      setEncounter(nextEncounter);
    } else {
      setEncounter(null);
    }
  };

  const handleSave = () => {
    try { localStorage.setItem("spacetrader_save", JSON.stringify(game)); } catch {}
  };

  // Navigate to travel tab and pre-select a target system
  const handlePlotCourse = (systemId) => {
    setQuestTarget(systemId);
    setTab("travel");
  };

  if (game.retired) {
    return (
      <div className="title-screen">
        <div style={{ fontSize: 19, color: "#ffd700", marginBottom: 16, lineHeight: 2 }}>🌙 RETIRED!</div>
        <div style={{ fontSize: 16, color: "#00ff88", marginBottom: 12 }}>Commander {game.commander}</div>
        <div style={{ fontSize: 15, color: "#8888bb", marginBottom: 4 }}>Days: {game.days}</div>
        <div style={{ fontSize: 15, color: "#8888bb", marginBottom: 20 }}>Ships destroyed: {game.killed || 0}</div>
        <div style={{ fontSize: 16, color: "#4fc3f7", marginBottom: 20 }}>You bought a moon in Utopia and retired in luxury.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-gold" onClick={onNewGame}>NEW GAME</button>
          <button className="btn btn-gray" onClick={onTitle}>TITLE SCREEN</button>
        </div>
      </div>
    );
  }

  if (game.alienGameOver) {
    return (
      <div className="title-screen">
        <div style={{ fontSize: 19, color: "#ff4400", marginBottom: 16 }}>👾 THE GALAXY HAS FALLEN</div>
        <div style={{ fontSize: 15, color: "#8888bb", marginBottom: 8 }}>
          The alien forces have conquered over 30 systems.<br/>
          Humanity's last outposts have gone dark.
        </div>
        <div style={{ fontSize: 14, color: "#555566", marginBottom: 8 }}>
          Commander {game.commander} · Day {game.days} · {game.killedAliens || 0} aliens destroyed
        </div>
        <div style={{ fontSize: 14, color: "#ff6600", marginBottom: 20 }}>
          The Warn the Doctor quest could have stopped this...
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-red" onClick={onNewGame}>NEW GAME</button>
          <button className="btn btn-gray" onClick={onTitle}>TITLE SCREEN</button>
        </div>
      </div>
    );
  }

  if (game.dead) {
    return (
      <div className="title-screen">
        <div style={{ fontSize: 19, color: "#ff6b35", marginBottom: 16 }}>GAME OVER</div>
        <div style={{ fontSize: 15, color: "#8888bb", marginBottom: 20 }}>Your ship was destroyed.<br/>No escape pod found.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-red" onClick={onNewGame}>NEW GAME</button>
          <button className="btn btn-gray" onClick={onTitle}>TITLE SCREEN</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {menuOpen && (
        <MenuModal game={game} onClose={() => setMenuOpen(false)}
          onSave={handleSave} onNewGame={onNewGame} onTitle={onTitle} />
      )}
      {questPopup && <QuestPopup popup={questPopup} onClose={() => setQuestPopup(null)} />}
      <StatusBar game={game} onMenu={() => setMenuOpen(true)} />
      {encounter && (
        <EncounterScreen game={game} encounter={encounter}
          onUpdate={onUpdate} onDone={handleEncounterDone} />
      )}
      {!encounter && (<>
        <div className="nav-tabs">
          {[["trade","TRADE"],["travel","WARP"],["ship","SHIP"],["bank","BANK"],["jobs","JOBS"],["log","LOG"]].map(([id, label]) => (
            <button key={id} className={"tab" + (tab === id ? " active" : "")} onClick={() => { setTab(id); if (id !== "travel") setQuestTarget(null); }}>{label}</button>
          ))}
        </div>
        {tab === "trade" && <TradeScreen game={game} onUpdate={onUpdate} />}
        {tab === "travel" && <TravelScreen game={game} onUpdate={onUpdate} onEncounter={handleEncounter} onQuestPopup={setQuestPopup} initialSelected={questTarget} />}
        {tab === "ship" && <ShipScreen game={game} onUpdate={onUpdate} />}
        {tab === "bank" && <BankScreen game={game} onUpdate={onUpdate} />}
        {tab === "jobs" && <ContractsScreen game={game} onUpdate={onUpdate} onPlotCourse={handlePlotCourse} />}
        {tab === "log" && <LogScreen game={game} onPlotCourse={handlePlotCourse} />}
      </>)}
    </div>
  );
}


export default GameScreen;

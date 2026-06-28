import { useState, useEffect, useCallback, useRef } from "react";
import { SHIPS, WEAPONS, SHIELDS, GADGETS } from "./constants/ships.js";
import { COMMODITIES } from "./constants/commodities.js";
import { GOV_TYPES, TECH_LEVELS, SIZES, SYSTEM_NAMES, SPECIAL_RES, COMMODITY_TECH_PROFILE, GOV_CATEGORY_MOD } from "./constants/world.js";
import { EVENT_TEMPLATES, CONTRACT_NAMES } from "./constants/events.js";
import { ELITE_CAPTAINS, MERCENARY_POOL } from "./constants/mercenaries.js";
import { rnd, pick, dist, distParsecs, fuelCost, canReach, jumpRangeCoords } from "./engine/utils.js";
import { generateGalaxy } from "./engine/galaxy.js";
import { generateSystemEvents, initMarket, getMarketPrices, refreshMarket, applyEventEffects } from "./engine/market.js";
import { generateContracts, checkContractArrival, onPirateKilled } from "./engine/contracts.js";
import { generateQuests, revealQuestHints, checkQuestArrival } from "./engine/quests.js";
import { effectiveSkills, generatePirateShip, generateEncounter, doCombatRound } from "./engine/combat.js";
import { createNewGame } from "./engine/newGame.js";
import { useGameState } from "./hooks/useGameState.js";
import { useCombat } from "./hooks/useCombat.js";
import ShipSprite from "./components/ShipSprite.jsx";
import StarsCanvas from "./components/StarsCanvas.jsx";
import SkillBar from "./components/SkillBar.jsx";
import GalaxyMap from "./components/GalaxyMap.jsx";
import StatusBar from "./components/StatusBar.jsx";
import MenuModal from "./components/MenuModal.jsx";
import QuestPopup from "./components/QuestPopup.jsx";
import TitleScreen from "./screens/TitleScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";

const FONT = "'VT323', monospace";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #07071a; }
.st-root {
  font-family: 'VT323', monospace;
  background: #07071a;
  color: #e0e0ff;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}
.stars-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
.st-content { position: relative; z-index: 1; max-width: 700px; margin: 0 auto; padding: 12px; }
.panel {
  background: #0d0d2b;
  border: 1px solid #2a2a6a;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 10px;
}
.panel-title {
  font-size: 15px;
  color: #4fc3f7;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #1a1a4a;
}
.btn {
  font-family: 'VT323', monospace;
  font-size: 16px;
  padding: 5px 12px;
  border: 1px solid;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.1s;
  letter-spacing: 1px;
  background: transparent;
}
.btn:active { transform: scale(0.96); }
.btn-green { border-color: #00ff88; color: #00ff88; }
.btn-green:hover { background: #00ff8822; }
.btn-blue { border-color: #4fc3f7; color: #4fc3f7; }
.btn-blue:hover { background: #4fc3f722; }
.btn-red { border-color: #ff6b35; color: #ff6b35; }
.btn-red:hover { background: #ff6b3522; }
.btn-gold { border-color: #ffd700; color: #ffd700; }
.btn-gold:hover { background: #ffd70022; }
.btn-gray { border-color: #555588; color: #8888bb; }
.btn-gray:hover { background: #3333661a; }
.btn-disabled { border-color: #555577; color: #9999bb; cursor: not-allowed; opacity: 0.65; }
.stat-row { display: flex; justify-content: space-between; align-items: center; font-size: 15px; padding: 3px 0; border-bottom: 1px solid #1a1a3a; }
.stat-row:last-child { border-bottom: none; }
.stat-label { color: #8888bb; }
.stat-val { color: #e0e0ff; }
.stat-val-green { color: #00ff88; }
.stat-val-gold { color: #ffd700; }
.stat-val-red { color: #ff6b35; }
.stat-val-blue { color: #4fc3f7; }
.hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.credit-display { font-size: 22px; color: #00ff88; }
.day-display { font-size: 15px; color: #8888bb; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
.commodity-row {
  display: grid;
  grid-template-columns: 1fr 60px 60px 32px 32px;
  gap: 4px;
  align-items: center;
  font-size: 14px;
  padding: 3px 4px;
  border-bottom: 1px solid #1a1a3a;
}
.commodity-row:last-child { border-bottom: none; }
.commodity-row.header { color: #555588; font-size: 12px; }
.com-name { color: #c0c0ff; }
.com-illegal { color: #ff6b35; }
.qty-btn {
  font-family: 'VT323', monospace;
  font-size: 18px;
  width: 26px; height: 24px;
  border: 1px solid #2a2a6a;
  background: #0a0a22;
  color: #8888bb;
  cursor: pointer;
  border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.qty-btn:hover { border-color: #4fc3f7; color: #4fc3f7; }
.nav-tabs { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
.tab {
  font-family: 'VT323', monospace;
  font-size: 15px;
  padding: 3px 8px;
  border: 1px solid #2a2a6a;
  background: transparent;
  color: #555588;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.1s;
}
.tab.active { border-color: #4fc3f7; color: #4fc3f7; background: #4fc3f711; }
.tab:hover:not(.active) { border-color: #3a3a7a; color: #8888bb; }
.encounter-box {
  border: 1px solid #ff6b35;
  background: #1a0a05;
  border-radius: 4px;
  padding: 14px;
  margin-bottom: 10px;
}
.encounter-title { font-size: 20px; color: #ff6b35; margin-bottom: 10px; }
.encounter-desc { font-size: 15px; color: #cc9977; line-height: 1.5; margin-bottom: 12px; }
.log-entry { font-size: 14px; color: #8888bb; padding: 2px 0; border-bottom: 1px solid #111133; line-height: 1.4; }
.log-entry.good { color: #00cc66; }
.log-entry.bad { color: #ff4444; }
.log-entry.info { color: #4fc3f7; }
.log-entry.warn { color: #ffd700; }
.pixel-ship { font-size: 24px; margin: 6px 0; }
.skill-bar { height: 6px; background: #111133; border-radius: 1px; flex: 1; margin-left: 8px; }
.skill-fill { height: 100%; background: #4fc3f7; border-radius: 1px; transition: width 0.3s; }
.galaxy-map { position: relative; width: 100%; padding-top: 60%; background: #050510; border: 1px solid #1a1a4a; border-radius: 4px; margin-bottom: 8px; overflow: hidden; }
.system-dot { position: absolute; width: 8px; height: 8px; border-radius: 50%; cursor: pointer; transform: translate(-50%, -50%); transition: all 0.1s; }
.system-dot:hover { transform: translate(-50%, -50%) scale(1.6); }
.system-dot.current { box-shadow: 0 0 0 2px #00ff88; }
.system-dot.selected { box-shadow: 0 0 0 2px #ffd700; }
.system-label { position: absolute; font-size: 11px; color: #555588; transform: translateX(-50%); white-space: nowrap; pointer-events: none; margin-top: 2px; }
.news-item { font-size: 14px; color: #aaa8cc; line-height: 1.5; padding: 4px 0; border-bottom: 1px solid #1a1a3a; }
.news-item.quest { color: #ffd700; }
.news-item.danger { color: #ff6b35; }
.progress-bar { height: 8px; background: #111133; border-radius: 2px; margin: 4px 0; }
.progress-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
.title-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; }
.title-logo { font-size: 42px; color: #4fc3f7; letter-spacing: 6px; line-height: 1.4; margin-bottom: 20px; }
.title-sub { font-size: 16px; color: #555588; margin-bottom: 30px; letter-spacing: 3px; }
.input-field {
  font-family: 'VT323', monospace;
  font-size: 18px;
  background: #0a0a22;
  border: 1px solid #2a2a6a;
  color: #e0e0ff;
  padding: 6px 10px;
  border-radius: 2px;
  width: 100%;
  outline: none;
}
.input-field:focus { border-color: #4fc3f7; }
.select-field {
  font-family: 'VT323', monospace;
  font-size: 16px;
  background: #0a0a22;
  border: 1px solid #2a2a6a;
  color: #e0e0ff;
  padding: 6px 8px;
  border-radius: 2px;
  width: 100%;
  outline: none;
}
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.85);
  z-index: 100;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.modal {
  background: #0d0d2b;
  border: 1px solid #4fc3f7;
  border-radius: 4px;
  padding: 16px;
  max-width: 480px;
  width: 100%;
  font-size: 15px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-title { font-size: 20px; color: #4fc3f7; margin-bottom: 12px; }
.divider { border: none; border-top: 1px solid #1a1a4a; margin: 8px 0; }
.badge { font-size: 12px; padding: 1px 5px; border-radius: 2px; display: inline-block; margin-left: 4px; }
.badge-green { background: #00332211; border: 1px solid #00ff88; color: #00ff88; }
.badge-red { background: #33000011; border: 1px solid #ff6b35; color: #ff6b35; }
.badge-gold { background: #33330011; border: 1px solid #ffd700; color: #ffd700; }
.flex-gap { display: flex; gap: 6px; flex-wrap: wrap; }
`;

export default function App() {
  const { game, screen, setScreen, updateGame, startGame, handleNewGame, handleTitle, lastCmdr } = useGameState();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="st-root">
        <StarsCanvas />
        <div className="st-content">
          {screen === "title" && (
            <TitleScreen
              onStart={startGame}
              hasSave={!!game}
              onResume={() => setScreen("game")}
              prevName={game?.commander || lastCmdr}
            />
          )}
          {screen === "game" && game && (
            <GameScreen game={game} onUpdate={updateGame}
              onNewGame={handleNewGame} onTitle={handleTitle} />
          )}
        </div>
      </div>
    </>
  );
}

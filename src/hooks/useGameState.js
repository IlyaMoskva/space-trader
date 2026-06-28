import { useState, useEffect, useCallback } from "react";
import { createNewGame } from "../engine/newGame.js";

const SAVE_KEY   = "spacetrader_save";
const CMDR_KEY   = "spacetrader_lastcmdr";

export function useGameState() {
  const [game, setGame]     = useState(null);
  const [screen, setScreen] = useState("title");

  // Auto-load save on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) { setGame(JSON.parse(saved)); setScreen("game"); }
    } catch {}
  }, []);

  const updateGame = useCallback((newGame) => {
    setGame(newGame);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(newGame)); } catch {}
  }, []);

  const startGame = useCallback((name, skills) => {
    try {
      const g = createNewGame(name, skills);
      updateGame(g);
      setScreen("game");
    } catch (e) {
      console.error("startGame failed:", e);
      alert("Error starting game: " + e.message);
    }
  }, [updateGame]);

  const handleNewGame = useCallback(() => {
    try {
      const lastName = game?.commander || "";
      localStorage.removeItem(SAVE_KEY);
      if (lastName) localStorage.setItem(CMDR_KEY, lastName);
    } catch {}
    setGame(null);
    setScreen("title");
  }, [game]);

  const handleTitle = useCallback(() => setScreen("title"), []);

  const lastCmdr = (() => {
    try { return localStorage.getItem(CMDR_KEY) || ""; } catch { return ""; }
  })();

  return { game, screen, setScreen, updateGame, startGame, handleNewGame, handleTitle, lastCmdr };
}

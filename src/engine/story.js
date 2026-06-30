// ── Story act system ──────────────────────────────────────────────────────────
// Acts gate which quests and events are available.
// Checked on every arrival and news reveal.

export function getStoryAct(game) {
  const pirate    = game.killed       || 0;
  const alien     = game.killedAliens || 0;
  const fighter   = (game.skills?.fighter || 0) + ((game.mercenaries||[]).reduce((m,c)=>Math.max(m,c.skills.fighter||0),0));
  const hasWeapon = (game.weapons||[]).some(w => w.id === 'military' || w.id === 'beam' || w.id === 'alien_disruptor');
  const goodShip  = !['flea','gnat'].includes(game.ship?.id);
  const artifacts = game.alienArtifacts || 0;

  if (alien >= 10 && artifacts >= 5)          return 5; // Mothership
  if (alien >= 3  || game.alienInvasionActive) return 4; // War
  if (fighter >= 4 && hasWeapon && goodShip)  return 3; // First Contact
  if (pirate >= 5  || (game.days||0) >= 30)   return 2; // Trouble Brewing
  return 1;                                              // Civilian life
}

// Human-readable act names for news/log
export const ACT_NAMES = {
  1: "Civilian",
  2: "Trouble Brewing",
  3: "First Contact",
  4: "War",
  5: "Final Battle",
};

// Check if a quest should be revealed based on current act
export function questUnlocked(questId, act) {
  const UNLOCK = {
    dragonfly:       2,   // Act 2: first sign of trouble
    alien_invasion:  3,   // Act 3: player is combat-ready
    mothership:      5,   // Act 5: veteran alien killer
  };
  return act >= (UNLOCK[questId] || 1);
}

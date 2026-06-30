

const PARSEC_SCALE = 10; // 1 parsec = 10 coordinate units

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function pick(arr) { return arr[rnd(0, arr.length - 1)]; }

function dist(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function distParsecs(a, b) {
  return dist(a, b) / PARSEC_SCALE;
}

function fuelCost(from, to) {
  return Math.ceil(distParsecs(from, to));
}

function canReach(from, to, jumpRange) {
  return distParsecs(from, to) <= jumpRange;
}

function jumpRangeCoords(jumpRange) {
  return jumpRange * PARSEC_SCALE;
}



// Governments that enforce reputation-based service bans
const STRICT_GOVS = [4, 5, 6, 7]; // Communist, Confed, Democracy, Corp. State

// Returns true if the planet bans services for this player
// War event overrides ban (desperate times)
function isServiceBanned(system, reputation, activeEvents) {
  // Occupied systems have different rules (handled separately)
  if ((system.alienCount || 0) >= 5) return false; // handled by getOccupiedServices
  if (!STRICT_GOVS.includes(system.gov)) return false;
  if (reputation >= -2) return false;
  const events = activeEvents || system.market?.events || [];
  const atWar = events.some(e => e.id === "war");
  if (atWar) return false;
  return true;
}

// Escape pod activation — player survives but loses ship, equipment, cargo and crew
export function applyEscapePod(game) {
  const podShip = { id: "gnat", name: "Gnat", hull: 14, hullMax: 14, cargo: 15,
    slots_w: 1, slots_s: 0, slots_g: 1, slots_c: 0, jump: 14, price: 10000 };

  const newGadgets = (game.gadgets || []).filter(g => g.id !== "escape_pod");
  const lostEquip  = Math.round(((game.ship?.price || 0) * 0.5) +
    (game.weapons || []).reduce((s, w) => s + w.price, 0) +
    (game.shields || []).reduce((s, sh) => s + sh.price, 0) +
    newGadgets.reduce((s, g) => s + (g.price || 0), 0));

  const crewFired  = (game.mercenaries || []).map(m => m.name);
  const cargoLost  = (game.cargo || []).filter(c => c.id !== "alien_artifact");
  // Alien artifacts survive (small, in your suit pocket)
  const savedCargo = (game.cargo || []).filter(c => c.id === "alien_artifact");

  // Government compensation if nearly broke
  const compensation = game.credits < 1000 ? Math.max(0, 1000 - game.credits) : 0;

  const log = [
    { type: "warn", text: "🚀 ESCAPE POD DEPLOYED! Ship and cargo lost in space." },
    { type: "bad",  text: "Lost ~" + lostEquip.toLocaleString() + " cr in equipment and " + cargoLost.length + " cargo type(s)." },
    ...(crewFired.length > 0 ? [{ type: "warn", text: "Crew evacuated and disbanded: " + crewFired.join(", ") + "." }] : []),
    ...(compensation > 0    ? [{ type: "good", text: "Government emergency grant: +" + compensation + " cr (survival stipend)." }] : []),
    ...game.log,
  ];

  return {
    ...game,
    ship:             podShip,
    hull:             podShip.hull,
    hullMax:          podShip.hullMax,
    weapons:          [],
    shields:          [],
    gadgets:          newGadgets,
    mercenaries:      [],
    cargo:            savedCargo,
    credits:          game.credits + compensation,
    escapedFromCombat: true,
    log,
  };
}

export { rnd, pick, dist, distParsecs, fuelCost, canReach, jumpRangeCoords, PARSEC_SCALE, isServiceBanned };

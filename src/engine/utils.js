

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

export { rnd, pick, dist, distParsecs, fuelCost, canReach, jumpRangeCoords, PARSEC_SCALE, isServiceBanned };

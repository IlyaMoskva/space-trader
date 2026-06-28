import { SYSTEM_NAMES, GOV_TYPES, TECH_LEVELS, SIZES } from '../constants/world.js';
import { rnd, pick, dist, distParsecs } from './utils.js';

function generateGalaxy() {
  // ── Config ────────────────────────────────────────────────────────────────
  const GSIZE    = 2000;
  const PARSEC   = 10;           // 1 parsec = 10 coord units
  const MIN_JUMP = 5  * PARSEC;  // 50  coords — Flea minimum
  const MAX_JUMP = 14 * PARSEC;  // 140 coords — Gnat range
  const MIN_DIST = 6  * PARSEC;  // 60  coords — Poisson disk radius
  const TARGET   = 50;
  const MARGIN   = 100;          // keep systems off the edge

  const names = ["Lave",
    ...SYSTEM_NAMES.filter(n => n !== "Lave").sort(() => Math.random() - 0.5)];
  let ni = 0;
  const mkSys = (x, y) => ({
    id: -1, name: names[ni++] || ("S" + ni),
    x, y,
    tech: ni === 1 ? 5 : rnd(0, 8),
    gov:  ni === 1 ? 6 : rnd(0, 7),
    size: ni === 1 ? 3 : rnd(0, 5),
    special: rnd(0, 10),
    pirates: ni === 1 ? 1 : rnd(0, 3),
    police:  ni === 1 ? 2 : rnd(0, 3),
    visited: false, market: null,
  });

  // ── Step 1: Poisson Disk Sampling ─────────────────────────────────────────
  // Classic Bridson algorithm: grid-accelerated, O(n).
  const cellSize = MIN_DIST / Math.SQRT2;
  const cols = Math.ceil(GSIZE / cellSize);
  const rows = Math.ceil(GSIZE / cellSize);
  const grid = new Array(cols * rows).fill(-1);  // stores point index
  const points = [];    // [{x,y}]
  const active = [];    // indices into points[]

  const gridCell = (x, y) => {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return col + row * cols;
  };

  const tooClose = (x, y) => {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nc = col + dc, nr = row + dr;
        if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
        const idx = grid[nc + nr * cols];
        if (idx === -1) continue;
        const p = points[idx];
        if (Math.hypot(p.x - x, p.y - y) < MIN_DIST) return true;
      }
    }
    return false;
  };

  const addPoint = (x, y) => {
    const idx = points.length;
    points.push({ x, y });
    grid[gridCell(x, y)] = idx;
    active.push(idx);
  };

  // Seed: Lave at centre + 2 Flea-range points near it
  addPoint(1000, 1000);

  // Flea neighbours — bypass tooClose since Flea range < MIN_DIST
  for (let i = 0; i < 2; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 60 && !placed; attempt++) {
      const a = Math.random() * Math.PI * 2;
      const r = 40 + Math.random() * 8;
      const x = Math.round(1000 + Math.cos(a) * r);
      const y = Math.round(1000 + Math.sin(a) * r);
      if (x < MARGIN || x > GSIZE-MARGIN || y < MARGIN || y > GSIZE-MARGIN) continue;
      // Only avoid other Flea candidates (not Lave or Poisson grid)
      if (points.slice(1).some(p => Math.hypot(p.x-x, p.y-y) < 25)) continue;
      addPoint(x, y);
      placed = true;
    }
    if (!placed) {
      // Force fallback
      const a = i * Math.PI + 0.3;
      addPoint(Math.round(1000 + Math.cos(a)*44), Math.round(1000 + Math.sin(a)*44));
    }
  }

  const K = 30; // candidates per active point
  while (active.length > 0 && points.length < TARGET) {
    const ri = Math.floor(Math.random() * active.length);
    const pi = active[ri];
    const p = points[pi];
    let found = false;

    for (let k = 0; k < K; k++) {
      const a = Math.random() * Math.PI * 2;
      const r = MIN_DIST + Math.random() * MIN_DIST; // MIN_DIST..2*MIN_DIST
      const x = Math.round(p.x + Math.cos(a) * r);
      const y = Math.round(p.y + Math.sin(a) * r);
      if (x < MARGIN || x > GSIZE-MARGIN || y < MARGIN || y > GSIZE-MARGIN) continue;
      if (!tooClose(x, y)) {
        addPoint(x, y);
        found = true;
        if (points.length >= TARGET) break;
      }
    }

    if (!found) active.splice(ri, 1); // exhausted
  }

  // If Poisson ran dry before TARGET, fill remainder near random existing points
  while (points.length < TARGET) {
    const p = points[Math.floor(Math.random() * points.length)];
    for (let attempt = 0; attempt < 40; attempt++) {
      const a = Math.random() * Math.PI * 2;
      const r = MIN_DIST + Math.random() * MIN_DIST;
      const x = Math.round(p.x + Math.cos(a) * r);
      const y = Math.round(p.y + Math.sin(a) * r);
      if (x >= MARGIN && x <= GSIZE-MARGIN && y >= MARGIN && y <= GSIZE-MARGIN
          && !tooClose(x, y)) {
        addPoint(x, y);
        break;
      }
    }
  }

  // Trim to TARGET
  while (points.length > TARGET) points.pop();

  // ── Step 2: Build systems from points ─────────────────────────────────────
  const systems = points.map((p, i) => {
    const s = mkSys(Math.round(p.x), Math.round(p.y));
    s.id = i;
    return s;
  });
  // Ensure Lave is id=0 with correct attributes
  systems[0].name = "Lave";
  systems[0].tech  = 5; systems[0].gov   = 6;
  systems[0].size  = 3; systems[0].pirates = 1; systems[0].police = 2;

  // ── Step 3: Remove planets that are < MIN_JUMP from any neighbour ─────────
  // (Skip Lave and its guaranteed Flea neighbours at id=1,2)
  const toRemove = new Set();
  for (let i = 0; i < systems.length; i++) {
    if (i < 3 || toRemove.has(i)) continue; // never remove Lave + Flea pair
    for (let j = i + 1; j < systems.length; j++) {
      if (j < 3 || toRemove.has(j)) continue;
      if (Math.hypot(systems[i].x - systems[j].x, systems[i].y - systems[j].y) < MIN_JUMP) {
        toRemove.add(j);
      }
    }
  }
  let filtered = systems.filter((_, i) => !toRemove.has(i));
  // Re-assign ids
  filtered.forEach((s, i) => s.id = i);

  // ── Step 4: BFS connectivity + bridge repair ───────────────────────────────
  const bfs = (arr) => {
    if (!arr.length) return new Set();
    const seen = new Set([0]); const q = [0];
    while (q.length) {
      const cur = arr[q.shift()]; if (!cur) continue;
      arr.filter(s => !seen.has(s.id) && Math.hypot(cur.x-s.x, cur.y-s.y) <= MAX_JUMP)
         .forEach(s => { seen.add(s.id); q.push(s.id); });
    }
    return seen;
  };

  const getComponents = (arr) => {
    const visited = new Set(); const components = [];
    for (const s of arr) {
      if (visited.has(s.id)) continue;
      const comp = new Set([s.id]); const q = [s.id];
      while (q.length) {
        const cur = arr[q.shift()]; if (!cur) continue;
        arr.filter(o => !comp.has(o.id) && Math.hypot(cur.x-o.x, cur.y-o.y) <= MAX_JUMP)
           .forEach(o => { comp.add(o.id); q.push(o.id); });
      }
      comp.forEach(id => visited.add(id));
      components.push([...comp].map(id => arr.find(s => s.id === id)));
    }
    return components;
  };

  for (let repair = 0; repair < 30; repair++) {
    const comps = getComponents(filtered);
    if (comps.length === 1) break;

    // Find the closest pair of systems from different components
    let minD = Infinity, bestA = null, bestB = null;
    for (let ci = 0; ci < comps.length; ci++) {
      for (let cj = ci + 1; cj < comps.length; cj++) {
        for (const sa of comps[ci]) {
          for (const sb of comps[cj]) {
            const d = Math.hypot(sa.x-sb.x, sa.y-sb.y);
            if (d < minD) { minD = d; bestA = sa; bestB = sb; }
          }
        }
      }
    }

    if (!bestA) break;

    // How many bridges needed? Each covers MAX_JUMP coords.
    const bridgesNeeded = Math.ceil(minD / MAX_JUMP) - 1;

    for (let b = 1; b <= bridgesNeeded; b++) {
      const t = b / (bridgesNeeded + 1);
      const bx = Math.round(bestA.x + (bestB.x - bestA.x) * t);
      const by = Math.round(bestA.y + (bestB.y - bestA.y) * t);
      const newId = filtered.length;
      filtered.push({
        id: newId, name: names[ni++] || ("Bridge" + newId),
        x: bx, y: by,
        tech: rnd(0,8), gov: rnd(0,7), size: rnd(0,5),
        special: rnd(0,10), pirates: rnd(0,3), police: rnd(0,3),
        visited: false, market: null, bridge: true,
      });
    }
    // Re-assign ids so getComponents works on next pass
    filtered.forEach((s,i) => s.id = i);
  }

  // Final trim to TARGET — remove excess non-bridge systems from the end
  while (filtered.length > TARGET) {
    // Find last non-bridge, non-Lave system
    let removed = false;
    for (let i = filtered.length - 1; i >= 1; i--) {
      if (!filtered[i].bridge) { filtered.splice(i, 1); removed = true; break; }
    }
    if (!removed) filtered.pop();
  }
  filtered.forEach((s,i) => s.id = i);

  return filtered;
}

export { generateGalaxy };

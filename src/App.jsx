import { useState, useEffect, useCallback, useRef } from "react";

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

// ─── GAME DATA ───────────────────────────────────────────────────────────────

const SHIPS = [
  { id: "flea",        name: "Flea",        hull: 25,  cargo: 10, slots_w: 0, slots_s: 0, slots_g: 1, slots_c: 0, jump: 5,  price: 2000,   emoji: "🛸" },
  { id: "gnat",        name: "Gnat",        hull: 100, cargo: 15, slots_w: 1, slots_s: 0, slots_g: 1, slots_c: 0, jump: 14, price: 0,      emoji: "🚀" },
  { id: "firefly",     name: "Firefly",     hull: 130, cargo: 20, slots_w: 1, slots_s: 1, slots_g: 1, slots_c: 1, jump: 17, price: 25000,  emoji: "🛩️" },
  { id: "mosquito",    name: "Mosquito",    hull: 150, cargo: 15, slots_w: 2, slots_s: 1, slots_g: 1, slots_c: 1, jump: 13, price: 30000,  emoji: "⚡" },
  { id: "bumblebee",   name: "Bumblebee",   hull: 150, cargo: 25, slots_w: 1, slots_s: 2, slots_g: 2, slots_c: 2, jump: 15, price: 40000,  emoji: "🐝" },
  { id: "beetle",      name: "Beetle",      hull: 150, cargo: 50, slots_w: 2, slots_s: 1, slots_g: 3, slots_c: 2, jump: 12, price: 60000,  emoji: "🪲" },
  { id: "hornet",      name: "Hornet",      hull: 200, cargo: 20, slots_w: 3, slots_s: 2, slots_g: 2, slots_c: 2, jump: 16, price: 100000, emoji: "🐝" },
  { id: "grasshopper", name: "Grasshopper", hull: 200, cargo: 30, slots_w: 2, slots_s: 2, slots_g: 3, slots_c: 3, jump: 15, price: 150000, emoji: "🦗" },
  { id: "termite",     name: "Termite",     hull: 200, cargo: 60, slots_w: 1, slots_s: 3, slots_g: 3, slots_c: 3, jump: 11, price: 225000, emoji: "🪲" },
  { id: "wasp",        name: "Wasp",        hull: 200, cargo: 35, slots_w: 3, slots_s: 2, slots_g: 2, slots_c: 3, jump: 14, price: 300000, emoji: "🐝" },
];

const WEAPONS = [
  { id: "pulse",    name: "Pulse Laser",    damage: 15, price: 2000,  minTech: 0 },
  { id: "beam",     name: "Beam Laser",     damage: 25, price: 12000, minTech: 2 },
  { id: "military", name: "Military Laser", damage: 35, price: 35000, minTech: 5 },
];
const SHIELDS = [
  { id: "energy",     name: "Energy Shield",     strength: 100, price: 5000,  minTech: 2 },
  { id: "reflective", name: "Reflective Shield",  strength: 200, price: 25000, minTech: 5 },
];
const GADGETS = [
  { id: "cargo5",    name: "Cargo Bay +5",       price: 8000,  desc: "+5 cargo" },
  { id: "nav_comp",  name: "Nav Computer",        price: 15000, desc: "+1 pilot" },
  { id: "tgt_comp",  name: "Targeting System",    price: 20000, desc: "+1 fighter" },
  { id: "dmg_ctrl",  name: "Damage Control",      price: 15000, desc: "+1 engineer" },
  { id: "escape_pod",name: "Escape Pod",          price: 10000, desc: "Survive destruction" },
];

const COMMODITIES = [
  { id: "water",     name: "Water",      base: 30,  minTech: 0, illegal: false, variance: 4 },
  { id: "furs",      name: "Furs",       base: 250, minTech: 0, illegal: false, variance: 10 },
  { id: "food",      name: "Food",       base: 100, minTech: 1, illegal: false, variance: 5 },
  { id: "ore",       name: "Ore",        base: 350, minTech: 2, illegal: false, variance: 20 },
  { id: "games",     name: "Games",      base: 250, minTech: 3, illegal: false, variance: 20 },
  { id: "firearms",  name: "Firearms",   base: 1250,minTech: 3, illegal: false, variance: 100 },
  { id: "medicine",  name: "Medicine",   base: 650, minTech: 4, illegal: false, variance: 40 },
  { id: "machines",  name: "Machines",   base: 900, minTech: 4, illegal: false, variance: 60 },
  { id: "robots",    name: "Robots",     base: 3500,minTech: 6, illegal: false, variance: 200 },
  { id: "narcotics", name: "Narcotics",  base: 3500,minTech: 5, illegal: true,  variance: 400 },
  { id: "firearms2", name: "Weapons",    base: 2500,minTech: 5, illegal: true,  variance: 300 },
];

const GOV_TYPES = ["Anarchy","Feudal","Mult-Gov","Dictatorship","Communist","Confed","Democracy","Corp. State"];
const TECH_LEVELS = ["Pre-Ag","Agri","Medi","Medieval","Renaiss","Early Ind","Industrial","Post-Ind","Hi-Tech"];
const SIZES = ["Tiny","Small","Medium","Large","Huge","Gargantuan"];
const SPECIAL_RES = ["NOTHING","MINERAL RICH","MINERAL POOR","DESERT","LOTS OF WATER","RICH SOIL","POOR SOIL","RICH FAUNA","LIFELESS","WEIRD MUSHROOMS","SPECIAL"];

const SYSTEM_NAMES = [
  "Lave","Zaonce","Diso","Leesti","Reorte","Tionisla","Riedquat","Uszaa","Bierle","Qucerat",
  "Xeer","Vetitice","Mirece","Onrira","Celabile","Sotibe","Aronar","Oresri","Teaatis",
  "Biarge","Edxelin","Orarra","Digebiti","Ededleen","Gemaza","Mautice","Tibicele","Celeisen",
  "Solati","Nusera","Isveve","Usreor","Tiqua","Cemave","Maregees","Atbevete","Reorade","Rexebe",
  "Vequess","Labeve","Tiveve","Razorce","Solrace","Ceesxe","Tibecea","Orvequ",
  "Nexus","Kravat","Gemulon","Utopia","Baratas","Melina","Zuul","Orti","Ceedra",
  "Xelal","Virexe","Orexe","Lesoso","Quator","Velass","Razaor","Morala","Tionat","Celaran",
  "Diqua","Rigeza","Maatis","Tiorqu","Verees","Solave","Cearso","Xeoner","Bibege","Orrere",
  "Leosis","Cearge","Riredi","Orqueve","Teanre","Dixees","Solave2","Biarge2","Ceinso","Usveor",
];

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rnd(0, arr.length - 1)]; }

// Coordinate system: galaxy is 2000×2000 coord units.
// 1 parsec = PARSEC_SCALE coordinate units.
// Gnat: jump=14 pc → 140 coord units radius → roughly 4-7 systems in range
const PARSEC_SCALE = 10;

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

function generateGalaxy() {
  const systems = [];
  const usedNames = new Set();

  // 2000×2000 coord space, PARSEC_SCALE=10
  // Flea jump=5pc=50 coords, Gnat=14pc=140, best ship=17pc=170
  // Min separation = 5pc = 50 coords (Flea must be able to hop)
  const GSIZE    = 2000;
  const MIN_DIST = 50;   // 5 parsecs — Flea minimum jump
  const GNAT_R   = 140;  // Gnat range
  const MAX_R    = 170;  // best ship range
  const FLEA_R   = 50;   // Flea range

  const shuffledNames = ["Lave", ...SYSTEM_NAMES.filter(n => n !== "Lave").sort(() => Math.random() - 0.5)];

  // 6 cluster centres spread across the full space
  const centres = [
    { x: 1000, y: 1000 },
    { x: rnd(200,  600),  y: rnd(200,  600)  },
    { x: rnd(1400, 1800), y: rnd(200,  600)  },
    { x: rnd(200,  600),  y: rnd(1400, 1800) },
    { x: rnd(1400, 1800), y: rnd(1400, 1800) },
    { x: rnd(600,  1400), y: rnd(200,  600)  },
  ];

  // Place a system near (cx,cy) between minR and maxR, respecting MIN_DIST
  const place = (cx, cy, minR, maxR) => {
    let x, y, attempts = 0;
    do {
      const angle = Math.random() * Math.PI * 2;
      const r = minR + Math.random() * (maxR - minR);
      x = Math.round(cx + Math.cos(angle) * r);
      y = Math.round(cy + Math.sin(angle) * r);
      x = Math.max(80, Math.min(GSIZE - 80, x));
      y = Math.max(80, Math.min(GSIZE - 80, y));
      attempts++;
    } while (attempts < 100 && systems.some(s => dist(s, {x, y}) < MIN_DIST));
    return { x, y };
  };

  for (let i = 0; i < 50; i++) {
    const name = shuffledNames[i] || ("Sys-" + i);
    usedNames.add(name);
    let pos;

    if (i === 0) {
      // Lave — centre
      pos = { x: 1000, y: 1000 };
    } else if (i <= 2) {
      // 2 systems within Flea range (40-48 coords = 4-4.8 pc)
      pos = place(1000, 1000, 40, 48);
    } else if (i <= 7) {
      // 5 more systems within Gnat range (55-135 coords)
      pos = place(1000, 1000, 55, 135);
    } else {
      // Rest: scatter from cluster centres across the full galaxy
      const c = pick(centres);
      pos = place(c.x, c.y, 60, 700);
    }

    systems.push({
      id: i, name, x: pos.x, y: pos.y,
      tech:    i === 0 ? 5 : rnd(0, 8),
      gov:     i === 0 ? 6 : rnd(0, 7),
      size:    i === 0 ? 3 : rnd(0, 5),
      special: rnd(0, 10),
      pirates: i === 0 ? 1 : rnd(0, 3),
      police:  i === 0 ? 2 : rnd(0, 3),
      visited: false,
      market:  null,
    });
  }

  // ── Connectivity guarantee ────────────────────────────────────────────────
  // After initial placement, some systems may be unreachable from Lave via
  // GNAT_R jumps. We fix this by reseeding each unreachable system within
  // GNAT_R of a randomly chosen already-reachable system, building outward
  // like a spanning tree. This is O(n) and guarantees full connectivity.

  const bfsReachable = (arr, startId, r) => {
    const seen = new Set([startId]);
    const q = [startId];
    while (q.length) {
      const cur = arr.find(s => s.id === q.shift());
      if (!cur) continue;
      arr.filter(s => !seen.has(s.id) && dist(s, cur) <= r)
        .forEach(s => { seen.add(s.id); q.push(s.id); });
    }
    return seen;
  };

  // Place each unreachable system near a reachable one, updating connectivity
  // after each move. Guaranteed to terminate: each move connects at least one
  // new system, so at most 50 iterations needed.
  for (let safety = 0; safety < 1000; safety++) {
    const reachable = bfsReachable(systems, 0, GNAT_R);
    if (reachable.size === systems.length) break;

    const unreachable = systems.filter(s => !reachable.has(s.id));
    const reachableList = systems.filter(s => reachable.has(s.id));
    const target = unreachable[0];
    const anchor = reachableList[Math.floor(Math.random() * reachableList.length)];

    let placed = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 60 + Math.random() * 60; // 60-120 coords, well within GNAT_R=140
      const nx = Math.round(Math.max(80, Math.min(GSIZE - 80, anchor.x + Math.cos(angle) * r)));
      const ny = Math.round(Math.max(80, Math.min(GSIZE - 80, anchor.y + Math.sin(angle) * r)));
      if (!systems.some(s => s.id !== target.id && dist(s, {x:nx, y:ny}) < MIN_DIST)) {
        target.x = nx; target.y = ny;
        placed = true;
        break;
      }
    }
    if (!placed) {
      // Force — connectivity > spacing
      const angle = Math.random() * Math.PI * 2;
      target.x = Math.round(Math.max(80, Math.min(GSIZE - 80, anchor.x + Math.cos(angle) * 80)));
      target.y = Math.round(Math.max(80, Math.min(GSIZE - 80, anchor.y + Math.sin(angle) * 80)));
    }
  }

  // ── Isolation check: no system more than MAX_R from all others ────────────
  for (const sys of systems) {
    if (sys.id === 0) continue;
    const hasNearNeighbour = systems.some(s => s.id !== sys.id && dist(s, sys) <= MAX_R);
    if (!hasNearNeighbour) {
      const closest = systems
        .filter(s => s.id !== sys.id)
        .reduce((best, s) => dist(s, sys) < dist(best, sys) ? s : best);
      const d = dist(closest, sys);
      const ratio = (MAX_R - 15) / d;
      sys.x = Math.max(80, Math.min(GSIZE - 80, Math.round(closest.x + (sys.x - closest.x) * ratio)));
      sys.y = Math.max(80, Math.min(GSIZE - 80, Math.round(closest.y + (sys.y - closest.y) * ratio)));
    }
  }

  return systems;
}

// ─── COMMODITY METADATA ──────────────────────────────────────────────────────
// tech modifier: how tech level shifts price relative to base
// positive = produced here (cheaper), negative = consumed/imported (pricier)
// Format: [techLevel] → multiplier offset from 1.0
const COMMODITY_TECH_PROFILE = {
  water:     { produced: [0,1,2],    consumed: [6,7,8] },  // cheap on agri, dear on hi-tech
  furs:      { produced: [0,1,2,3],  consumed: [5,6,7,8] },
  food:      { produced: [1,2,3],    consumed: [6,7,8] },
  ore:       { produced: [2,3,4],    consumed: [5,6,7,8] },
  games:     { produced: [4,5],      consumed: [0,1,2] },
  firearms:  { produced: [4,5,6],    consumed: [0,1,2,3] },
  medicine:  { produced: [5,6,7],    consumed: [0,1,2,3,4] },
  machines:  { produced: [4,5,6],    consumed: [0,1,2,3] },
  robots:    { produced: [7,8],      consumed: [0,1,2,3,4] },
  narcotics: { produced: [5,6],      consumed: [] },
  firearms2: { produced: [5,6,7],    consumed: [0,1,2] },
};

// Government price modifiers per commodity category
// [govIndex]: { category: multiplier }
// categories: raw (water/furs/food/ore), industrial (machines/robots), luxury (games), weapons, drugs, medicine
const GOV_CATEGORY_MOD = {
  // Anarchy (0): cheap everything, drugs open
  0: { raw: 0.75, industrial: 0.85, luxury: 0.90, weapons: 0.80, drugs: 0.90, medicine: 0.90 },
  // Feudal (1): cheap raw, pricey luxury
  1: { raw: 0.80, industrial: 0.90, luxury: 1.20, weapons: 0.95, drugs: 1.10, medicine: 1.00 },
  // Multi-Gov (2): slight chaos, moderate everything
  2: { raw: 0.95, industrial: 1.00, luxury: 1.00, weapons: 1.05, drugs: 1.10, medicine: 1.00 },
  // Dictatorship (3): cheap weapons, expensive drugs (black market suppressed)
  3: { raw: 0.90, industrial: 0.95, luxury: 0.90, weapons: 0.80, drugs: 1.40, medicine: 1.05 },
  // Communist (4): subsidised raw & medicine, expensive luxury
  4: { raw: 0.75, industrial: 0.90, luxury: 1.30, weapons: 1.10, drugs: 1.50, medicine: 0.75 },
  // Confederacy (5): balanced
  5: { raw: 0.95, industrial: 1.00, luxury: 1.05, weapons: 1.00, drugs: 1.20, medicine: 1.00 },
  // Democracy (6): regulated — pricier overall, medicine fair
  6: { raw: 1.05, industrial: 1.10, luxury: 1.15, weapons: 1.20, drugs: 1.60, medicine: 1.00 },
  // Corporate (7): premium on luxury, cheap industrial
  7: { raw: 1.00, industrial: 0.90, luxury: 1.25, weapons: 1.05, drugs: 1.30, medicine: 1.10 },
  // Theocracy (8) — extra: drugs VERY expensive (ritual/forbidden)
  8: { raw: 0.90, industrial: 1.00, luxury: 0.95, weapons: 1.10, drugs: 2.20, medicine: 1.05 },
};

function getCommodityCategory(id) {
  if (["water","furs","food","ore"].includes(id)) return "raw";
  if (["machines","robots"].includes(id)) return "industrial";
  if (["games"].includes(id)) return "luxury";
  if (["firearms","firearms2"].includes(id)) return "weapons";
  if (["narcotics"].includes(id)) return "drugs";
  if (["medicine"].includes(id)) return "medicine";
  return "industrial";
}

// ─── EVENTS SYSTEM ───────────────────────────────────────────────────────────

const EVENT_TEMPLATES = [
  // War affects: food+, water+, medicine+, weapons+, luxury-
  { id: "war",       text: "{sys} is at war!",
    effects: { food: 1.4, water: 1.3, medicine: 1.6, firearms: 1.5, firearms2: 1.5, games: 0.5 },
    duration: [4, 8], pirates: +1 },
  // Drought: food+, water++
  { id: "drought",   text: "Drought grips {sys}.",
    effects: { water: 2.0, food: 1.6, medicine: 1.2 },
    duration: [3, 6] },
  // Plague: medicine++, food+, water+
  { id: "plague",    text: "Plague reported on {sys}.",
    effects: { medicine: 2.2, food: 1.3, water: 1.3, robots: 0.8 },
    duration: [3, 5] },
  // Bountiful harvest: food-, water-
  { id: "harvest",   text: "Bumper harvest on {sys}.",
    effects: { food: 0.5, furs: 0.7, water: 0.7 },
    duration: [2, 4] },
  // Tech boom: robots-, machines-, games+
  { id: "techboom",  text: "Tech boom on {sys}.",
    effects: { robots: 0.7, machines: 0.75, games: 1.3 },
    duration: [3, 5] },
  // Workers' strike: machines+, robots+
  { id: "strike",    text: "Workers strike on {sys}.",
    effects: { machines: 1.5, robots: 1.4, food: 1.1 },
    duration: [2, 4] },
  // Pirate raids: food+, water+, firearms+
  { id: "pirates",   text: "Pirates raid {sys} shipping lanes.",
    effects: { food: 1.2, water: 1.2, firearms: 1.3 },
    duration: [3, 6], pirates: +1 },
  // Economic boom: luxury+, games+, medicine-
  { id: "boom",      text: "Economic boom on {sys}.",
    effects: { games: 1.4, medicine: 0.8, machines: 0.9 },
    duration: [3, 5] },
  // Ore strike: ore-
  { id: "orestrike", text: "Rich ore deposits found near {sys}.",
    effects: { ore: 0.5, machines: 0.9 },
    duration: [3, 6] },
  // Drug crackdown: narcotics++
  { id: "crackdown", text: "Drug crackdown on {sys}.",
    effects: { narcotics: 1.8, firearms2: 1.3 },
    duration: [2, 5] },
];

function generateSystemEvents(system) {
  // 0–2 events per system, weighted by conditions
  const events = [];
  const count = Math.random() < 0.4 ? 0 : Math.random() < 0.6 ? 1 : 2;
  const eligible = EVENT_TEMPLATES.filter(e => {
    // No tech boom on pre-industrial planets
    if (e.id === "techboom" && system.tech < 4) return false;
    // No harvest on hi-tech
    if (e.id === "harvest" && system.tech > 5) return false;
    // No ore strike on service economies
    if (e.id === "orestrike" && system.tech > 6) return false;
    return true;
  });
  const used = new Set();
  for (let i = 0; i < count; i++) {
    const e = pick(eligible.filter(e => !used.has(e.id)));
    if (!e) break;
    used.add(e.id);
    events.push({
      id: e.id,
      text: e.text.replace("{sys}", system.name),
      effects: e.effects,
      daysLeft: rnd(e.duration[0], e.duration[1]),
      pirates: e.pirates || 0,
    });
  }
  return events;
}

// Apply event multipliers on top of base price
function applyEventEffects(basePrice, commodityId, events) {
  if (!events || events.length === 0) return basePrice;
  let mult = 1.0;
  events.forEach(ev => {
    if (ev.effects[commodityId]) mult *= ev.effects[commodityId];
  });
  return Math.round(basePrice * mult);
}

// ─── PRICE ENGINE ─────────────────────────────────────────────────────────────

// Stock capacity scales with planet size and tech
function getBaseStock(system, commodity) {
  if (commodity.minTech > system.tech) return 0;
  const profile = COMMODITY_TECH_PROFILE[commodity.id];
  const isProducer = profile?.produced.includes(system.tech);
  const sizeBase = (system.size + 1) * 8;  // 8..48
  // Producers have more stock
  const techMod = isProducer ? 16 : 4;
  return Math.max(2, sizeBase + techMod + rnd(0, 6));
}

function getBasePrice(system, commodity) {
  if (commodity.minTech > system.tech) return null;

  let p = commodity.base;

  // 1. Tech level modifier
  const profile = COMMODITY_TECH_PROFILE[commodity.id];
  if (profile) {
    if (profile.produced.includes(system.tech)) {
      // This planet produces it → cheaper
      p = Math.floor(p * 0.65);
    } else if (profile.consumed.includes(system.tech)) {
      // This planet needs it but can't produce → pricier
      p = Math.floor(p * 1.40);
    }
    // If neither → base price, slight variance
  }

  // 2. Government modifier by category
  const cat = getCommodityCategory(commodity.id);
  const govMods = GOV_CATEGORY_MOD[system.gov] || GOV_CATEGORY_MOD[5];
  p = Math.floor(p * (govMods[cat] || 1.0));

  // 3. Illegal surcharge (risk premium on top of everything)
  if (commodity.illegal) p = Math.floor(p * 1.4);

  return Math.max(8, p);
}

// Price from current stock vs base stock + event effects
function priceFromStock(basePrice, stock, baseStock, events, commodityId) {
  if (baseStock === 0) return null;
  const ratio = stock / baseStock;
  const mult = ratio <= 0 ? 3.0 : Math.max(0.4, Math.min(3.0, 1 / Math.sqrt(ratio)));
  const stockPrice = Math.max(5, Math.round(basePrice * mult));
  return applyEventEffects(stockPrice, commodityId, events);
}

// Initialise market with events
function initMarket(system) {
  const events = generateSystemEvents(system);
  const market = { events };
  COMMODITIES.forEach(c => {
    const bs = getBaseStock(system, c);
    market[c.id] = {
      stock: bs,
      baseStock: bs,
      basePrice: getBasePrice(system, c),
    };
  });
  return market;
}

// Get live prices (stock curve × event multipliers)
function getMarketPrices(market) {
  const prices = {};
  const events = market.events || [];
  COMMODITIES.forEach(c => {
    const m = market[c.id];
    if (!m || m.basePrice === null || m.baseStock === 0) { prices[c.id] = null; return; }
    prices[c.id] = priceFromStock(m.basePrice, m.stock, m.baseStock, events, c.id);
  });
  return prices;
}

// Refresh market on revisit: restore stock, age events
function refreshMarket(market) {
  const refreshed = { ...market };
  // Age events — remove expired ones
  refreshed.events = (market.events || [])
    .map(e => ({ ...e, daysLeft: e.daysLeft - 1 }))
    .filter(e => e.daysLeft > 0);
  // Restore stock 35%
  COMMODITIES.forEach(c => {
    const m = market[c.id];
    if (!m) return;
    const restored = Math.ceil((m.baseStock - m.stock) * 0.35);
    refreshed[c.id] = { ...m, stock: Math.min(m.baseStock, m.stock + restored) };
  });
  return refreshed;
}

// ─── CONTRACTS ───────────────────────────────────────────────────────────────
// Dynamic per-planet jobs: delivery, extermination, assassination
// Generated fresh on each visit, taken from the bulletin board

const CONTRACT_NAMES = {
  delivery: [
    "Urgent medical supplies",
    "Diplomatic pouch",
    "Rare crystal shipment",
    "Scientific equipment",
    "Frozen specimens",
    "Military rations",
    "Encrypted data core",
    "Luxury goods package",
    "Spare reactor parts",
    "Agricultural seeds",
  ],
  extermination: [
    "Pirate menace terrorises shipping",
    "Raiders intercepted near jump point",
    "Bounty on local pirate gang",
    "Clear the shipping lanes",
    "Merchant convoy protection needed",
  ],
  assassination: [
    "Rogue commander",
    "Pirate kingpin",
    "Smuggler lord",
    "Wanted arms dealer",
    "Fugitive warlord",
  ],
};

function generateContracts(system, galaxy, days) {
  const contracts = [];
  const sysName = system.name;

  // 1-3 contracts depending on system size and tech
  const count = 1 + Math.floor((system.size + system.tech) / 5);

  for (let i = 0; i < Math.min(count, 3); i++) {
    const roll = Math.random();

    if (roll < 0.50) {
      // DELIVERY — pick a destination system
      const destinations = galaxy.filter(s =>
        s.id !== system.id && distParsecs(system, s) > 15
      );
      if (destinations.length === 0) continue;
      const dest = pick(destinations);
      const distance = Math.round(distParsecs(system, dest));
      const daysAllowed = Math.max(4, Math.round(distance / 10) + rnd(2, 5));
      const cargoQty = rnd(1, 4);
      const reward = Math.round((distance * 80 + cargoQty * 200 + rnd(0, 500)) / 50) * 50;
      contracts.push({
        id: "c_" + system.id + "_" + i + "_" + days,
        type: "delivery",
        title: pick(CONTRACT_NAMES.delivery),
        from: sysName,
        fromId: system.id,
        toId: dest.id,
        to: dest.name,
        cargoQty,
        daysAllowed,
        deadline: days + daysAllowed,
        reward,
        penalty: Math.round(reward * 0.3),
        status: "available",
        emoji: "📦",
      });

    } else if (roll < 0.80) {
      // EXTERMINATION — kill N pirates in current or nearby system
      const killCount = rnd(2, 5);
      const reward = killCount * rnd(300, 700);
      const daysAllowed = rnd(5, 10);
      // Target: current system if pirates≥1, else pick nearby
      const targetSys = system.pirates >= 1 ? system
        : galaxy.find(s => s.id !== system.id && distParsecs(system, s) < 20 && s.pirates >= 1) || system;
      contracts.push({
        id: "c_" + system.id + "_" + i + "_" + days,
        type: "extermination",
        title: pick(CONTRACT_NAMES.extermination),
        from: sysName,
        fromId: system.id,
        targetSystemId: targetSys.id,
        targetSystemName: targetSys.name,
        killCount,
        killsCompleted: 0,
        daysAllowed,
        deadline: days + daysAllowed,
        reward,
        penalty: Math.round(reward * 0.2),
        status: "available",
        emoji: "⚔️",
      });

    } else {
      // ASSASSINATION — kill a named target in a specific system
      const targetSystems = galaxy.filter(s =>
        s.id !== system.id && distParsecs(system, s) < 60
      );
      if (targetSystems.length === 0) continue;
      const targetSys = pick(targetSystems);
      const targetName = pick(CONTRACT_NAMES.assassination);
      const reward = rnd(1500, 5000);
      const daysAllowed = rnd(6, 12);
      contracts.push({
        id: "c_" + system.id + "_" + i + "_" + days,
        type: "assassination",
        title: "Eliminate: " + targetName,
        from: sysName,
        fromId: system.id,
        targetSystemId: targetSys.id,
        targetSystemName: targetSys.name,
        targetName,
        daysAllowed,
        deadline: days + daysAllowed,
        reward,
        penalty: 0,
        status: "available",
        emoji: "🎯",
      });
    }
  }
  return contracts;
}

// Check active contracts on arrival at a system
function checkContractArrival(game, arrivedSystemId) {
  let newGame = { ...game };
  const completedContracts = [];
  const failedContracts = [];

  newGame.activeContracts = (newGame.activeContracts || []).map(c => {
    // Delivery completion
    if (c.type === "delivery" && c.toId === arrivedSystemId && c.status === "active") {
      const newCargo = newGame.cargo.map(item =>
        item.id === "contract_cargo_" + c.id
          ? { ...item, qty: item.qty - c.cargoQty }
          : item
      ).filter(item => item.qty > 0);
      newGame.cargo = newCargo;
      newGame.credits += c.reward;
      newGame.reputation = (newGame.reputation || 0) + 2;
      completedContracts.push(c);
      newGame.log = [{ type: "good", text: "Delivery complete: " + c.title + " → +" + c.reward + " cr" }, ...newGame.log];
      return { ...c, status: "done" };
    }
    // Assassination completion
    if (c.type === "assassination" && c.targetSystemId === arrivedSystemId && c.status === "active") {
      // Will trigger boss encounter — mark as pending fight
      return { ...c, status: "pending_fight" };
    }
    return c;
  });

  // Deadline check
  newGame.activeContracts = (newGame.activeContracts || []).map(c => {
    if (c.status === "active" && c.deadline < newGame.days) {
      newGame.credits -= c.penalty;
      newGame.reputation = (newGame.reputation || 0) - 1;
      failedContracts.push(c);
      newGame.log = [{ type: "bad", text: "Contract FAILED: " + c.title + " — penalty " + c.penalty + " cr" }, ...newGame.log];
      return { ...c, status: "failed" };
    }
    return c;
  });

  return { newGame, completedContracts, failedContracts };
}

// Called when player kills a pirate — update extermination contracts
function onPirateKilled(game) {
  let newGame = { ...game };
  newGame.activeContracts = (newGame.activeContracts || []).map(c => {
    if (c.type === "extermination" && c.status === "active" &&
        c.targetSystemId === game.currentSystem) {
      const done = c.killsCompleted + 1 >= c.killCount;
      if (done) {
        newGame.credits += c.reward;
        newGame.reputation = (newGame.reputation || 0) + 1;
        newGame.log = [{ type: "good", text: "Extermination contract complete! +" + c.reward + " cr" }, ...newGame.log];
        return { ...c, killsCompleted: c.killsCompleted + 1, status: "done" };
      }
      return { ...c, killsCompleted: c.killsCompleted + 1 };
    }
    return c;
  });
  return newGame;
}


function generateQuests(systems) {
  const quests = [];
  const sysIds = systems.map(s => s.id);
  
  const q1sys = pick(sysIds.slice(5));
  quests.push({ id: "dragonfly", name: "Dragonfly", status: "available", targetSystem: q1sys,
    desc: "The experimental ship DRAGONFLY, carrying a stolen shield prototype, was last seen near " + systems[q1sys].name + ". Reward: Lightning Shield.",
    reward: "lightning_shield" });

  const q2sys = pick(sysIds.slice(3));
  quests.push({ id: "alien_invasion", name: "Alien Invasion", status: "available", targetSystem: q2sys, daysLeft: rnd(10, 16),
    desc: "Alien fleet detected! Warn defenses at " + systems[q2sys].name + " within the time limit.",
    reward: "fuel_compressor" });

  const q3sys = pick(sysIds.slice(8));
  quests.push({ id: "wild", name: "Smuggle Wild", status: "available", targetSystem: q3sys,
    desc: "A shady contact asks you to smuggle someone called Wild to " + systems[q3sys].name + ". Requires beam laser+. Reward: free mercenary.",
    reward: "mercenary", requiresBeamLaser: true });

  const q4sys = pick(sysIds.slice(2));
  quests.push({ id: "doctor", name: "Warn the Doctor", status: "available", targetSystem: q4sys, daysLeft: 12,
    desc: "Travel to " + systems[q4sys].name + " in 12 days and stop the experiment. Reward: Portable Singularity.",
    reward: "singularity" });

  return quests;
}

// ─── QUEST COMPLETION CHECK ─────────────────────────────────────────────────

function checkQuestArrival(game, arrivedSystemId) {
  let newGame = { ...game };
  let popups = [];

  newGame.quests = newGame.quests.map(q => {
    if (q.status !== "available") return q;
    if (q.targetSystem !== arrivedSystemId) return q;

    // Quest-specific completion logic
    if (q.id === "alien_invasion") {
      newGame.gadgets = [...(newGame.gadgets || []), { id: "fuel_compressor", name: "Fuel Compressor", desc: "+3 jump range" }];
      newGame.log = [{ type: "good", text: "Alien Invasion: PLANET SAVED! Reward: Fuel Compressor." }, ...newGame.log];
      popups.push({ title: "👾 ALIENS REPELLED!", body: "You arrived in time. The planetary defense forces scramble at your warning. The alien fleet retreats.\n\nReward: Fuel Compressor installed — jump range +3 parsecs.", color: "#00ff88" });
      return { ...q, status: "done" };
    }

    if (q.id === "doctor") {
      newGame.specialItems = [...(newGame.specialItems || []), "singularity"];
      newGame.log = [{ type: "good", text: "Doctor warned! Experiment cancelled. Reward: Portable Singularity." }, ...newGame.log];
      popups.push({ title: "🔬 EXPERIMENT HALTED!", body: "You reach the lab just in time. The doctor listens. The universe breathes again.\n\nReward: Portable Singularity — instant jump to any system.", color: "#ffd700" });
      return { ...q, status: "done" };
    }

    if (q.id === "dragonfly") {
      // Trigger a boss fight — handled via encounter
      popups.push({ title: "🐉 DRAGONFLY SPOTTED!", body: "The stolen ship DRAGONFLY is here! Its experimental shields are active. You must destroy it to claim the reward.", color: "#ff6b35", encounter: { type: "boss", sub: "dragonfly", ship: { ...SHIPS[4], name: "Dragonfly", emoji: "🐉" }, weapon: WEAPONS[2], hull: 180, hullMax: 180, shields: 250, shieldsMax: 250 } });
      return q;
    }

    if (q.id === "wild") {
      const hasBeam = game.weapons.some(w => w.id === "beam" || w.id === "military");
      if (!hasBeam) {
        popups.push({ title: "🚔 WILD QUEST", body: "Wild won't board without protection. You need a Beam Laser or better.", color: "#ff6b35" });
        return q;
      }
      newGame.skills = { ...newGame.skills, pilot: Math.min(10, newGame.skills.pilot + 1) };
      newGame.log = [{ type: "good", text: "Wild delivered safely. +1 Pilot!" }, ...newGame.log];
      popups.push({ title: "🤝 WILD DELIVERED!", body: "Wild is safely delivered. You slipped through three police checkpoints like a ghost.\n\nReward: +1 Pilot skill + free mercenary slot.", color: "#4fc3f7" });
      return { ...q, status: "done" };
    }

    return q;
  });

  return { newGame, popups };
}

// ─── ELITE CAPTAINS ──────────────────────────────────────────────────────────

const ELITE_CAPTAINS = [
  { name: "Captain Huie",    skill: "fighter",  wants: "military", wantsName: "Military Laser",  gives: "+1 Fighter",  emoji: "⚔️" },
  { name: "Captain Hoff",    skill: "pilot",    wants: "energy",   wantsName: "Energy Shield",   gives: "+1 Pilot",    emoji: "🛸" },
  { name: "Captain Ravindra",skill: "trader",   wants: "beam",     wantsName: "Beam Laser",      gives: "+1 Trader",   emoji: "💰" },
  { name: "Captain Foret",   skill: "engineer", wants: "reflective",wantsName:"Reflective Shield",gives: "+1 Engineer", emoji: "🔧" },
  { name: "Captain Teng",    skill: "fighter",  wants: "beam",     wantsName: "Beam Laser",      gives: "+1 Fighter",  emoji: "⚔️" },
  { name: "Captain Scarlett",skill: "pilot",    wants: "military", wantsName: "Military Laser",  gives: "+1 Pilot",    emoji: "🛸" },
];

// ─── MERCENARIES ─────────────────────────────────────────────────────────────

const MERCENARY_POOL = [
  { id: "m1", name: "Zack",    cost: 30,  skills: { pilot: 8, fighter: 3, trader: 2, engineer: 4 } },
  { id: "m2", name: "Alexia",  cost: 45,  skills: { pilot: 3, fighter: 9, trader: 2, engineer: 3 } },
  { id: "m3", name: "Benno",   cost: 35,  skills: { pilot: 4, fighter: 4, trader: 8, engineer: 2 } },
  { id: "m4", name: "Irini",   cost: 40,  skills: { pilot: 2, fighter: 3, trader: 3, engineer: 9 } },
  { id: "m5", name: "Dupont",  cost: 50,  skills: { pilot: 7, fighter: 7, trader: 2, engineer: 3 } },
  { id: "m6", name: "Vesna",   cost: 55,  skills: { pilot: 3, fighter: 8, trader: 4, engineer: 8 } },
  { id: "m7", name: "Khalid",  cost: 25,  skills: { pilot: 6, fighter: 2, trader: 7, engineer: 3 } },
  { id: "m8", name: "Torres",  cost: 60,  skills: { pilot: 9, fighter: 5, trader: 2, engineer: 4 } },
];

// Compute effective skills including mercenaries
function effectiveSkills(game) {
  const mercs = game.mercenaries || [];
  const result = { ...game.skills };
  ["pilot","fighter","trader","engineer"].forEach(sk => {
    const best = mercs.reduce((m, merc) => Math.max(m, merc.skills[sk] || 0), 0);
    result[sk] = Math.max(result[sk], best);
  });
  return result;
}

function generateEncounter(currentSystem, player) {
  const pilotSkill = player.skills?.pilot || 0;
  const policeChance = currentSystem.police * 15 * (1 - pilotSkill * 0.04); // Pilot 10 = -40%
  const pirateChance = currentSystem.pirates * 20;
  const specialChance = 12;
  const r = rnd(0, 100);

  if (r < specialChance) {
    const specials = ["marie_celeste","famous_captain","sealed_cargo","tonic","alien_machine","mercenary_offer"];
    return { type: "special", sub: pick(specials) };
  }
  if (r < specialChance + pirateChance) {
    const ship = pick(SHIPS.slice(0, 5));
    return { type: "pirate", ship, weapon: pick(WEAPONS.slice(0, 2)),
      hull: ship.hull, hullMax: ship.hull, shields: ship.slots_s > 0 ? 100 : 0, shieldsMax: ship.slots_s > 0 ? 100 : 0 };
  }
  if (r < specialChance + pirateChance + policeChance) {
    return { type: "police", contraband: player.cargo.some(c => {
      const com = COMMODITIES.find(x => x.id === c.id);
      return com && com.illegal;
    })};
  }
  if (r < specialChance + pirateChance + policeChance + 15) {
    return { type: "trader" };
  }
  return null;
}

// ─── COMBAT ──────────────────────────────────────────────────────────────────

function doCombatRound(player, enemy, playerAction) {
  const log = [];
  let newPlayer = { ...player };
  let newEnemy = { ...enemy };
  let ended = false;
  let result = null;

  if (playerAction === "fight") {
    const weaponDmg = player.weapons.reduce((s, w) => s + w.damage, 0);
    const eff = effectiveSkills(player);
    const hitChance = 0.4 + eff.fighter * 0.05;
    if (Math.random() < hitChance) {
      let dmg = rnd(Math.floor(weaponDmg * 0.6), weaponDmg);
      if (newEnemy.shields > 0) {
        const absorbed = Math.min(newEnemy.shields, dmg);
        newEnemy.shields -= absorbed;
        dmg -= absorbed;
      }
      newEnemy.hull -= dmg;
      log.push({ type: "good", text: "Your lasers hit for " + (weaponDmg) + " dmg!" });
      if (newEnemy.hull <= 0) {
        log.push({ type: "good", text: "Enemy ship destroyed! You found cargo." });
        ended = true; result = "win";
      }
    } else {
      log.push({ type: "info", text: "Your shot missed." });
    }
  }

  if (!ended) {
    const enemyDmg = enemy.weapon ? rnd(5, enemy.weapon.damage) : rnd(3, 10);
    const effDef = effectiveSkills(newPlayer);
    const evadeChance = 0.2 + effDef.pilot * 0.04;
    if (Math.random() > evadeChance) {
      let dmg = enemyDmg;
      const totalShields = newPlayer.shields.reduce((s, sh) => s + sh.current, 0);
      if (totalShields > 0) {
        const absorbed = Math.min(totalShields, dmg);
        dmg -= absorbed;
        let rem = absorbed;
        newPlayer.shields = newPlayer.shields.map(sh => {
          if (rem <= 0) return sh;
          const take = Math.min(sh.current, rem);
          rem -= take;
          return { ...sh, current: sh.current - take };
        });
        log.push({ type: "warn", text: "Shields absorbed " + absorbed + " damage." });
      }
      if (dmg > 0) {
        newPlayer.hull -= dmg;
        log.push({ type: "bad", text: "Hull hit for " + dmg + " damage!" });
      }
      if (newPlayer.hull <= 0) {
        if (newPlayer.gadgets.some(g => g.id === "escape_pod")) {
          log.push({ type: "bad", text: "Ship destroyed! Escape pod activated." });
          newPlayer.hull = 10; newPlayer.cargo = [];
          ended = true; result = "escaped";
        } else {
          log.push({ type: "bad", text: "Your ship is destroyed. GAME OVER." });
          ended = true; result = "dead";
        }
      }
    } else {
      log.push({ type: "info", text: "You evaded the attack!" });
    }
  }

  return { player: newPlayer, enemy: newEnemy, log, ended, result };
}

// ─── INITIAL STATE ───────────────────────────────────────────────────────────

function createNewGame(name, skills) {
  const galaxy = generateGalaxy();
  const startSys = galaxy[0];
  startSys.visited = true;
  startSys.market = initMarket(startSys);
  const quests = generateQuests(galaxy);
  const startEvents = startSys.market.events || [];
  const startNews = [
    { text: "Welcome to Lave. " + TECH_LEVELS[startSys.tech] + " economy, " + GOV_TYPES[startSys.gov] + " government." },
    ...startEvents.map(e => ({ text: e.text, event: true })),
    { text: quests[0].desc, quest: true },
    { text: quests[1].desc, quest: true },
  ];
  return {
    commander: name,
    credits: 1000,
    debt: 0,
    days: 1,
    killed: 0,
    policeRecord: 0,
    reputation: 0,
    skills: { pilot: skills.pilot, fighter: skills.fighter, trader: skills.trader, engineer: skills.engineer },
    ship: { ...SHIPS[1] },
    weapons: [{ ...WEAPONS[0] }],
    shields: [],
    gadgets: [],
    cargo: [],
    cargoCapacity: 15,
    hull: 100,
    hullMax: 100,
    currentSystem: 0,
    galaxy,
    quests,
    log: [{ type: "info", text: "Day 1: Commander " + name + " begins trading career." }],
    specialItems: [],
    news: startNews,
    activeContracts: [],
    bulletinBoard: generateContracts(startSys, galaxy, 1),
    reputation: 0,
  };
}

// ─── STARS CANVAS ────────────────────────────────────────────────────────────

function StarsCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      z: Math.random() * 2 + 0.2,
      speed: Math.random() * 0.0002 + 0.00005,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.x -= s.speed;
        if (s.x < 0) { s.x = 1; s.y = Math.random(); }
        const size = s.z * 0.8;
        const alpha = Math.min(1, s.z * 0.5);
        ctx.fillStyle = `rgba(180,180,255,${alpha})`;
        ctx.fillRect(Math.floor(s.x * canvas.width), Math.floor(s.y * canvas.height), Math.ceil(size), Math.ceil(size));
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="stars-canvas" />;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function SkillBar({ val, base, max = 10 }) {
  return (
    <div className="skill-bar" style={{ position: "relative" }}>
      {base !== undefined && base < val && (
        <div style={{ position: "absolute", height: "100%", background: "#4fc3f755", borderRadius: 1, width: (val / max * 100) + "%" }} />
      )}
      <div className="skill-fill" style={{ width: ((base !== undefined ? base : val) / max * 100) + "%" }} />
    </div>
  );
}

function GalaxyMap({ galaxy, current, selected, onSelect, jumpRange }) {
  const [zoom, setZoom] = useState(false);
  const currentSys = galaxy[current];
  const jrCoords = jumpRangeCoords(jumpRange);
  const ZOOM_R_PCT = 42;
  const PAD = 0.05; // 5% padding around bounding box

  // Dynamic bounding box from actual system positions
  const xs = galaxy.map(s => s.x);
  const ys = galaxy.map(s => s.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  // Use the larger span for both axes to keep square proportions
  const span = Math.max(spanX, spanY);
  const padAbs = span * PAD;
  const bbMinX = minX - padAbs;
  const bbMinY = minY - padAbs;
  const bbSpan = span + padAbs * 2;

  // Map coord → % position on screen
  const toVx = (x) => zoom
    ? 50 + ((x - currentSys.x) / jrCoords) * ZOOM_R_PCT
    : ((x - bbMinX) / bbSpan) * 100;
  const toVy = (y) => zoom
    ? 50 + ((y - currentSys.y) / jrCoords) * ZOOM_R_PCT
    : ((y - bbMinY) / bbSpan) * 100;

  // Circle radius as % of map square
  const circleRPct = zoom
    ? ZOOM_R_PCT
    : (jrCoords / bbSpan) * 100;

  const visibleSystems = galaxy.filter(s => {
    const vx = toVx(s.x), vy = toVy(s.y);
    return vx >= -4 && vx <= 104 && vy >= -4 && vy <= 104;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 16, color: "#555588" }}>
          {zoom
            ? "LOCAL — " + jumpRange + " pc range shown"
            : "FULL GALAXY — " + galaxy.length + " systems"}
        </div>
        <button className="btn btn-gray" style={{ fontSize: 16, padding: "3px 8px" }}
          onClick={() => setZoom(z => !z)}>
          {zoom ? "⊞ FULL MAP" : "⊕ LOCAL VIEW"}
        </button>
      </div>

      <div style={{
        position: "relative", width: "100%", paddingTop: "100%",
        background: "#050510", border: "1px solid #1a1a4a",
        borderRadius: 4, marginBottom: 6, overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>

          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <circle
              cx={toVx(currentSys.x) + "%"}
              cy={toVy(currentSys.y) + "%"}
              r={circleRPct + "%"}
              fill="none" stroke="#00ff8840" strokeWidth="1" strokeDasharray="4 3"
            />
          </svg>

          {visibleSystems.map(sys => {
            const vx = toVx(sys.x);
            const vy = toVy(sys.y);
            const inRange = canReach(currentSys, sys, jumpRange);
            const isCurrent = sys.id === current;
            const isSelected = sys.id === selected;
            const dpc = Math.round(distParsecs(currentSys, sys) * 10) / 10;

            const color = isCurrent ? "#00ff88"
              : isSelected ? "#ffd700"
              : sys.visited ? "#4fc3f7"
              : "#6666aa";
            const opacity = isCurrent || isSelected ? 1 : 0.75;
            const size = isCurrent ? 9 : isSelected ? 8 : 6;
            const showLabel = true;

            return (
              <div key={sys.id}>
                <div style={{
                  position: "absolute",
                  left: vx + "%", top: vy + "%",
                  width: size, height: size, borderRadius: "50%",
                  background: color, opacity,
                  transform: "translate(-50%,-50%)",
                  cursor: sys.id !== current ? "pointer" : "default",
                  boxShadow: isCurrent ? "0 0 0 2px #00ff8866"
                    : isSelected ? "0 0 0 2px #ffd70066" : "none",
                  zIndex: isCurrent || isSelected ? 2 : 1,
                }}
                  onClick={() => sys.id !== current && onSelect(sys.id)}
                  title={sys.name + " — " + dpc + " pc" + (inRange ? " ✓" : "")}
                />
                {showLabel && (
                  <div style={{
                    position: "absolute",
                    left: vx + "%", top: "calc(" + vy + "% + 5px)",
                    transform: "translateX(-50%)",
                    fontSize: isCurrent ? 13 : 11,
                    lineHeight: 1,
                    color: isCurrent ? "#00ff88"
                      : isSelected ? "#ffd700"
                      : sys.visited ? "#4fc3f7"
                      : "#9999cc",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 3,
                    textShadow: "0 0 3px #000, 0 0 5px #000",
                    fontFamily: "'VT323', monospace",
                  }}>
                    {sys.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, fontSize: 16, color: "#555588", flexWrap: "wrap" }}>
        <span style={{ color: "#00ff88" }}>● Current</span>
        <span style={{ color: "#ffd700" }}>● Selected</span>
        <span style={{ color: "#4fc3f7" }}>● Visited</span>
        <span style={{ color: "#6666aa" }}>● Unvisited</span>
      </div>
    </div>
  );
}

function StatusBar({ game, onMenu }) {
  const sys = game.galaxy[game.currentSystem];
  return (
    <div className="panel" style={{ marginBottom: 8 }}>
      <div className="hdr">
        <div>
          <div className="credit-display">⬡ {game.credits.toLocaleString()} cr</div>
          <div style={{ fontSize: 15, color: "#555588", marginTop: 3 }}>CMDR {game.commander}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div className="day-display">Day {game.days}</div>
            <div style={{ fontSize: 15, color: "#4fc3f7", marginTop: 3 }}>{sys.name}</div>
          </div>
          <button className="btn btn-gray" onClick={onMenu}
            style={{ fontSize: 15, padding: "5px 8px", lineHeight: 1 }}>☰ MENU</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
        <div>
          <div style={{ fontSize: 16, color: "#555588", marginBottom: 2 }}>HULL</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: (game.hull / game.hullMax * 100) + "%", background: game.hull > 50 ? "#00ff88" : game.hull > 25 ? "#ffd700" : "#ff6b35" }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 16, color: "#555588", marginBottom: 2 }}>SHIELDS</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: (game.shields.length > 0 ? (game.shields[0].current / game.shields[0].max * 100) : 0) + "%", background: "#4fc3f7" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────

function TitleScreen({ onStart, hasSave, onResume, prevName }) {
  const [name, setName] = useState(prevName || "");
  const [pts, setPts] = useState({ pilot: 4, fighter: 4, trader: 4, engineer: 4 });
  const total = pts.pilot + pts.fighter + pts.trader + pts.engineer;
  const maxPts = 16;

  useEffect(() => {
    if (prevName && !name) setName(prevName);
  }, [prevName]);

  const adj = (skill, delta) => {
    const nv = pts[skill] + delta;
    if (nv < 1 || nv > 10) return;
    if (delta > 0 && total >= maxPts) return;
    setPts(p => ({ ...p, [skill]: nv }));
  };

  return (
    <div className="title-screen">
      <div className="title-logo">SPACE<br/>TRADER</div>
      <div className="title-sub">A PALM OS CLASSIC · PWA EDITION</div>
      <div className="panel" style={{ width: "100%", maxWidth: 380 }}>
        <div className="panel-title">Commander Name</div>
        <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Enter name..." maxLength={12} />
        <div className="panel-title" style={{ marginTop: 14 }}>Skill Points ({maxPts - total} left)</div>
        {Object.entries(pts).map(([skill, val]) => (
          <div key={skill} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 15, color: "#8888bb", width: 72, textTransform: "capitalize" }}>{skill}</div>
            <button className="qty-btn" onClick={() => adj(skill, -1)}>-</button>
            <div style={{ fontSize: 16, color: "#ffd700", width: 24, textAlign: "center" }}>{val}</div>
            <button className="qty-btn" onClick={() => adj(skill, +1)}>+</button>
            <SkillBar val={val} />
          </div>
        ))}
        <div style={{ marginTop: 12, textAlign: "center", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {hasSave && (
            <button className="btn btn-blue" style={{ width: "100%" }} onClick={onResume}>
              ▶ CONTINUE GAME
            </button>
          )}
          <button className="btn btn-green"
            style={(!name.trim() || total !== maxPts) ? { opacity: 0.4, cursor: "not-allowed", width: "100%" } : { width: "100%" }}
            onClick={() => {
              if (!name.trim() || total !== maxPts) return;
              onStart(name.trim(), pts);
            }}>
            ✦ NEW GAME
          </button>
        </div>
      </div>
    </div>
  );
}

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

function TravelScreen({ game, onUpdate, onEncounter, onQuestPopup, initialSelected }) {
  const [selected, setSelected] = useState(initialSelected ?? null);

  // Sync if initialSelected changes (e.g. Plot Course pressed again)
  useEffect(() => {
    if (initialSelected !== null && initialSelected !== undefined) {
      setSelected(initialSelected);
    }
  }, [initialSelected]);
  const currentSys = game.galaxy[game.currentSystem];
  const selectedSys = selected !== null ? game.galaxy[selected] : null;
  const jumpRange = game.ship.jump + (game.gadgets.some(g => g.id === "fuel_compressor") ? 3 : 0);
  const fuel = selectedSys ? fuelCost(currentSys, selectedSys) : 0;
  const inRange = selectedSys ? canReach(currentSys, selectedSys, jumpRange) : false;
  const canTravel = selectedSys && inRange && game.credits >= fuel;

  const travel = () => {
    if (!canTravel) return;
    let newGalaxy = game.galaxy.map(s => {
      if (s.id !== selected) return s;
      // Init market on first visit, refresh on revisit
      const market = s.market
        ? refreshMarket(s.market)
        : initMarket(s);
      return { ...s, visited: true, market };
    });
    // Also ensure starting system has a market
    if (!newGalaxy[game.currentSystem].market) {
      newGalaxy = newGalaxy.map(s => s.id === game.currentSystem
        ? { ...s, market: initMarket(s) } : s);
    }
    let newGame = {
      ...game,
      currentSystem: selected,
      galaxy: newGalaxy,
      credits: game.credits - fuel,
      days: game.days + 1,
      shields: game.shields.map(s => ({ ...s, current: Math.min(s.max, s.current + 30) })),
    };

    // Engineer auto-repair: chance = engineer*3%, amount = engineer/2 hp
    const eng = newGame.skills?.engineer || 0;
    if (eng > 0 && newGame.hull < newGame.hullMax) {
      const repairChance = eng * 0.03;
      if (Math.random() < repairChance) {
        const repaired = Math.max(1, Math.floor(eng / 2));
        const newHull = Math.min(newGame.hullMax, newGame.hull + repaired);
        if (newHull > newGame.hull) {
          newGame.hull = newHull;
          newGame.log = [{ type: "good", text: "Engineer patched hull +" + repaired + " hp" }, ...newGame.log];
        }
      }
    }

    // Debt interest: 1% per day
    if (newGame.debt > 0) {
      const interest = Math.ceil(newGame.debt * 0.01);
      newGame.debt = newGame.debt + interest;
      newGame.log = [{ type: "warn", text: "Interest: +" + interest + " cr debt (total: " + newGame.debt + " cr)" }, ...newGame.log];
    }

    // Mercenary daily pay
    const mercs = newGame.mercenaries || [];
    if (mercs.length > 0) {
      const totalPay = mercs.reduce((s, m) => s + m.cost, 0);
      if (newGame.credits >= totalPay) {
        newGame.credits -= totalPay;
        newGame.log = [{ type: "warn", text: "Crew wages: " + totalPay + " cr (" + mercs.map(m => m.name).join(", ") + ")" }, ...newGame.log];
      } else {
        // Can't pay — mercs leave
        newGame.mercenaries = [];
        newGame.log = [{ type: "bad", text: "Can't pay crew wages! All mercenaries have left." }, ...newGame.log];
      }
    }

    // Quest day tracking
    newGame.quests = newGame.quests.map(q => {
      if (q.daysLeft !== undefined && q.status === "available") {
        const dl = q.daysLeft - 1;
        if (dl <= 0 && q.id === "alien_invasion") {
          const sysIdx = newGame.galaxy.findIndex(s => s.id === q.targetSystem);
          if (sysIdx >= 0) {
            newGame.galaxy = newGame.galaxy.map((s, i) => i === sysIdx ? { ...s, tech: Math.max(0, s.tech - 3) } : s);
            newGame.log = [{ type: "bad", text: q.name + " FAILED! Planet devastated." }, ...newGame.log];
          }
          return { ...q, status: "failed", daysLeft: 0 };
        }
        return { ...q, daysLeft: dl };
      }
      return q;
    });

    const logEntry = { type: "info", text: "Traveled to " + selectedSys.name + ". Fuel: " + fuel + " cr" };
    newGame.log = [logEntry, ...newGame.log].slice(0, 50);

    // Build news from system events + galaxy-wide quest news
    const arrivedSys = newGame.galaxy[selected];
    const sysEvents = arrivedSys.market?.events || [];
    const eventNews = sysEvents.map(e => ({ text: e.text, quest: false, event: true }));
    const questNews = newGame.quests
      .filter(q => q.status === "available")
      .map(q => ({ text: q.desc, quest: true }));
    const staticNews = [
      { text: arrivedSys.name + " — " + TECH_LEVELS[arrivedSys.tech] + " · " + GOV_TYPES[arrivedSys.gov] + " · Pop " + SIZES[arrivedSys.size] }
    ];
    newGame.news = [...eventNews, ...staticNews, ...questNews].slice(0, 8);

    setSelected(null);

    // Check contract arrivals
    const { newGame: contractGame } = checkContractArrival(newGame, selected);
    newGame = contractGame;

    // Generate bulletin board for new system
    const arrivedSys = newGame.galaxy[selected];
    newGame.bulletinBoard = generateContracts(arrivedSys, newGame.galaxy, newGame.days);

    // Check quest arrivals
    const { newGame: questGame, popups } = checkQuestArrival(newGame, selected);
    newGame = questGame;

    const enc = generateEncounter(newGame.galaxy[selected], newGame);

    // Boss fight from quest takes priority
    const bossPopup = popups.find(p => p.encounter);
    if (bossPopup) {
      onEncounter(newGame, bossPopup.encounter);
      return;
    }

    if (popups.length > 0) {
      onUpdate(newGame);
      onQuestPopup(popups[0]);
      return;
    }

    if (enc) { onEncounter(newGame, enc); }
    else { onUpdate(newGame); }
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Galaxy Chart</div>
        <GalaxyMap galaxy={game.galaxy} current={game.currentSystem} selected={selected}
          onSelect={setSelected} jumpRange={jumpRange} />
        {selectedSys && (
          <div style={{ marginTop: 8 }}>
            <div className="stat-row"><span className="stat-label">Destination</span><span className="stat-val-blue">{selectedSys.name}</span></div>
            <div className="stat-row"><span className="stat-label">Tech Level</span><span className="stat-val">{TECH_LEVELS[selectedSys.tech]}</span></div>
            <div className="stat-row"><span className="stat-label">Government</span><span className="stat-val">{GOV_TYPES[selectedSys.gov]}</span></div>
            <div className="stat-row">
              <span className="stat-label">Distance</span>
              <span className={inRange ? "stat-val-green" : "stat-val-red"}>
                {Math.round(distParsecs(currentSys, selectedSys) * 10) / 10} pc {inRange ? "✓" : "✗ too far"}
              </span>
            </div>
            {inRange && <div className="stat-row"><span className="stat-label">Fuel Cost</span><span className="stat-val-gold">{fuel} cr</span></div>}
            <div className="stat-row"><span className="stat-label">Pirates</span><span className={selectedSys.pirates > 1 ? "stat-val-red" : "stat-val"}>{"★".repeat(selectedSys.pirates + 1)}</span></div>
            <div style={{ marginTop: 10 }}>
              {inRange ? (
                <button className={canTravel ? "btn btn-green" : "btn btn-disabled"} onClick={travel} style={{ width: "100%" }}>
                  ▶ TRAVEL TO {selectedSys.name.toUpperCase()}
                </button>
              ) : (
                <div style={{ fontSize: 15, color: "#ff6b35", textAlign: "center", padding: 6, border: "1px solid #ff6b3544", borderRadius: 2 }}>
                  Too far — need a better ship or Fuel Compressor
                </div>
              )}
            </div>
          </div>
        )}
        {!selectedSys && <div style={{ fontSize: 15, color: "#555588", textAlign: "center", marginTop: 8 }}>Click a system to plot course</div>}
      </div>
    </div>
  );
}

function SingularityItem({ game, onUpdate }) {
  const [picking, setPicking] = useState(false);
  const [filter, setFilter] = useState("");

  const use = (targetId) => {
    const targetSys = game.galaxy.find(s => s.id === targetId);
    if (!targetSys) return;
    const newItems = (game.specialItems || []).filter(x => x !== "singularity");
    let newGalaxy = game.galaxy.map(s =>
      s.id === targetId
        ? { ...s, visited: true, market: s.market ? refreshMarket(s.market) : initMarket(s) }
        : s
    );
    onUpdate({
      ...game,
      currentSystem: targetId,
      galaxy: newGalaxy,
      specialItems: newItems,
      days: game.days + 1,
      log: [{ type: "good", text: "Singularity used! Jumped to " + targetSys.name + " instantly." }, ...game.log],
    });
    setPicking(false);
  };

  const filtered = game.galaxy.filter(s =>
    s.id !== game.currentSystem &&
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
        <span style={{ fontSize: 15, color: "#ffd700" }}>🌀 Portable Singularity</span>
        <button className="btn btn-gold" style={{ fontSize: 14, padding: "3px 10px" }}
          onClick={() => setPicking(p => !p)}>
          {picking ? "CANCEL" : "USE"}
        </button>
      </div>
      <div style={{ fontSize: 14, color: "#555588", marginBottom: picking ? 8 : 0 }}>
        One-time instant jump to any system
      </div>
      {picking && (
        <div style={{ border: "1px solid #ffd70055", borderRadius: 4, padding: 10, background: "#0a0a1a" }}>
          <div style={{ fontSize: 14, color: "#ffd700", marginBottom: 8 }}>Select destination:</div>
          <input
            className="input-field"
            placeholder="Filter systems..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ marginBottom: 8, fontSize: 14 }}
          />
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.map(s => (
              <div key={s.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "4px 0", borderBottom: "1px solid #1a1a3a",
              }}>
                <span style={{ fontSize: 14, color: s.visited ? "#4fc3f7" : "#8888bb" }}>
                  {s.name}
                  {s.visited && <span style={{ color: "#555588", fontSize: 12 }}> · {TECH_LEVELS[s.tech]}</span>}
                </span>
                <button className="btn btn-gold" style={{ fontSize: 13, padding: "2px 8px" }}
                  onClick={() => use(s.id)}>
                  JUMP →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ShipScreen({ game, onUpdate }) {
  const sys = game.galaxy[game.currentSystem];
  const [tab, setTab] = useState("status");

  const buyWeapon = (w) => {
    if (game.credits < w.price) return;
    if (game.weapons.length >= game.ship.slots_w) return;
    onUpdate({ ...game, credits: game.credits - w.price, weapons: [...game.weapons, { ...w }],
      log: [{ type: "good", text: "Installed " + w.name }, ...game.log] });
  };
  const buyShield = (s) => {
    if (game.credits < s.price) return;
    if (game.shields.length >= game.ship.slots_s) return;
    onUpdate({ ...game, credits: game.credits - s.price, shields: [...game.shields, { ...s, current: s.strength, max: s.strength }],
      log: [{ type: "good", text: "Installed " + s.name }, ...game.log] });
  };
  const buyGadget = (g) => {
    if (game.credits < g.price) return;
    if (game.gadgets.some(x => x.id === g.id)) return;
    let extra = {};
    if (g.id === "cargo5") extra = { cargoCapacity: game.cargoCapacity + 5 };
    if (g.id === "nav_comp") extra = { skills: { ...game.skills, pilot: Math.min(10, game.skills.pilot + 1) } };
    if (g.id === "tgt_comp") extra = { skills: { ...game.skills, fighter: Math.min(10, game.skills.fighter + 1) } };
    if (g.id === "dmg_ctrl") extra = { skills: { ...game.skills, engineer: Math.min(10, game.skills.engineer + 1) } };
    onUpdate({ ...game, credits: game.credits - g.price, gadgets: [...game.gadgets, { ...g }], ...extra,
      log: [{ type: "good", text: "Installed " + g.name }, ...game.log] });
  };
  const repairHull = () => {
    const needed = game.hullMax - game.hull;
    const engineerDiscount = 1 - (game.skills.engineer || 0) * 0.05; // Engineer 10 = -50%
    const costPerHp = Math.max(1, Math.round(2 * engineerDiscount));
    const cost = needed * costPerHp;
    if (game.credits < cost || needed === 0) return;
    onUpdate({ ...game, hull: game.hullMax, credits: game.credits - cost,
      log: [{ type: "good", text: "Hull repaired for " + cost + " cr (Engineer discount applied)" }, ...game.log] });
  };
  const buyShip = (s) => {
    const val = Math.floor(SHIPS.find(x => x.id === game.ship.id)?.price * 0.7 || 0);
    const cost = s.price - val;
    if (game.credits < cost) return;
    const keptMercs = (game.mercenaries || []).slice(0, s.slots_c ?? 0);
    const firedCount = (game.mercenaries || []).length - keptMercs.length;
    const logEntries = [{ type: "good", text: "Traded up to " + s.name + "!" }];
    if (firedCount > 0) logEntries.push({ type: "warn", text: firedCount + " crew member(s) let go — no quarters on new ship." });
    onUpdate({ ...game, credits: game.credits - cost, ship: { ...s },
      hull: s.hull, hullMax: s.hull, weapons: [], shields: [], gadgets: [],
      cargoCapacity: s.cargo, mercenaries: keptMercs,
      log: [...logEntries, ...game.log] });
  };

  const canRepair = game.hull < game.hullMax && sys.tech >= 2;

  return (
    <div>
      <div className="nav-tabs">
        {["status","weapons","shields","gadgets","ships"].map(t => (
          <button key={t} className={"tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>{t.toUpperCase()}</button>
        ))}
      </div>
      {tab === "status" && (
        <div className="panel">
          <div className="panel-title">{game.ship.emoji} {game.ship.name}</div>
          <div className="stat-row"><span className="stat-label">Hull</span><span className="stat-val-green">{game.hull}/{game.hullMax}</span></div>
          <div className="stat-row"><span className="stat-label">Cargo</span><span className="stat-val">{game.cargo.reduce((s,c)=>s+c.qty,0)}/{game.cargoCapacity}</span></div>
          <div className="stat-row"><span className="stat-label">Jump Range</span><span className="stat-val-blue">{game.ship.jump} pc</span></div>
          <div className="stat-row"><span className="stat-label">Weapon Slots</span><span className="stat-val">{game.weapons.length}/{game.ship.slots_w}</span></div>
          <div className="stat-row"><span className="stat-label">Shield Slots</span><span className="stat-val">{game.shields.length}/{game.ship.slots_s}</span></div>
          <div className="stat-row"><span className="stat-label">Gadget Slots</span><span className="stat-val">{game.gadgets.length}/{game.ship.slots_g}</span></div>
          <div className="stat-row"><span className="stat-label">Crew Quarters</span><span className={(game.mercenaries||[]).length > 0 ? "stat-val-blue" : "stat-val"}>{(game.mercenaries||[]).length}/{game.ship.slots_c ?? 0}</span></div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {game.weapons.map((w, i) => <span key={i} className="badge badge-red">{w.name}</span>)}
            {game.shields.map((s, i) => <span key={i} className="badge badge-green">{s.name} {s.current}/{s.max}</span>)}
            {game.gadgets.map((g, i) => <span key={i} className="badge badge-gold">{g.name}</span>)}
          </div>

          {(game.specialItems || []).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="panel-title">Special Items</div>
              {(game.specialItems || []).includes("singularity") && (
                <SingularityItem game={game} onUpdate={onUpdate} />
              )}
              {(game.specialItems || []).includes("lightning_shield") && (
                <div className="stat-row">
                  <span className="stat-label">⚡ Lightning Shield</span>
                  <span className="stat-val-blue">Installed on ship</span>
                </div>
              )}
            </div>
          )}
          {canRepair && (() => {
            const needed = game.hullMax - game.hull;
            const discount = 1 - (game.skills.engineer || 0) * 0.05;
            const costPerHp = Math.max(1, Math.round(2 * discount));
            const cost = needed * costPerHp;
            return (
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-green" onClick={repairHull} style={{ fontSize: 15 }}>
                  REPAIR HULL ({cost} cr{game.skills.engineer > 0 ? " · Eng discount" : ""})
                </button>
              </div>
            );
          })()}
          <div className="panel-title" style={{ marginTop: 14 }}>Skills</div>
          {(() => {
            const eff = effectiveSkills(game);
            const effects = {
              pilot:    "Evasion +" + (game.skills.pilot * 4) + "% · Police notice -" + (game.skills.pilot * 4) + "%",
              fighter:  "Hit chance +" + (game.skills.fighter * 5) + "%",
              trader:   "Equipment sell +" + (game.skills.trader * 2) + "% vs base",
              engineer: "Repair -" + (game.skills.engineer * 5) + "% · Auto-repair " + (game.skills.engineer * 3) + "% /jump",
            };
            return Object.entries(game.skills).map(([sk, v]) => (
              <div key={sk} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ fontSize: 15, color: "#8888bb", width: 80, textTransform: "capitalize" }}>{sk}</div>
                  <div style={{ fontSize: 16, color: "#ffd700", width: 20 }}>{v}</div>
                  {eff[sk] > v && (
                    <div style={{ fontSize: 15, color: "#00ff88", width: 28 }}>/{eff[sk]}</div>
                  )}
                  <SkillBar val={eff[sk]} base={v} />
                </div>
                <div style={{ fontSize: 12, color: "#555588", marginLeft: 80, marginTop: 1 }}>
                  {effects[sk]}
                </div>
              </div>
            ));
          })()}
          {(game.mercenaries || []).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="panel-title">Crew</div>
              {(game.mercenaries || []).map(m => (
                <div key={m.id} style={{ padding: "6px 0", borderBottom: "1px solid #1a1a3a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, color: "#c0c0ff" }}>🧑‍🚀 {m.name}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 14, color: "#ff6b35" }}>{m.cost} cr/day</span>
                      <button className="btn btn-red" style={{ fontSize: 13, padding: "2px 8px" }}
                        onClick={() => {
                          const newMercs = (game.mercenaries || []).filter(x => x.id !== m.id);
                          onUpdate({ ...game, mercenaries: newMercs,
                            log: [{ type: "warn", text: m.name + " has left the crew." }, ...game.log] });
                        }}>FIRE</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#555588", marginTop: 3 }}>
                    P:{m.skills.pilot} F:{m.skills.fighter} T:{m.skills.trader} E:{m.skills.engineer}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === "weapons" && (
        <div className="panel">
          <div className="panel-title">Weapons ({game.weapons.length}/{game.ship.slots_w} slots)</div>
          {game.weapons.length === 0 && <div style={{ fontSize: 15, color: "#555588", marginBottom: 8 }}>No weapons installed</div>}
          {game.weapons.map((w, i) => (
            <div key={i} className="stat-row">
              <span className="stat-label">{w.name} <span style={{color:"#ff6b35"}}>DMG {w.damage}</span></span>
              <button className="btn btn-red" style={{ fontSize: 13, padding: "3px 8px" }}
                onClick={() => {
                  const traderBonus = (game.skills.trader || 0) * 0.02;
                  const sellPrice = Math.floor(w.price * (0.7 + traderBonus));
                  onUpdate({ ...game,
                    weapons: game.weapons.filter((_, j) => j !== i),
                    credits: game.credits + sellPrice,
                    log: [{ type: "info", text: "Sold " + w.name + " for " + sellPrice + " cr (Trader +" + Math.round(traderBonus*100) + "%)" }, ...game.log],
                  });
                }}>
                SELL {Math.floor(w.price * (0.7 + (game.skills.trader||0)*0.02)).toLocaleString()} cr
              </button>
            </div>
          ))}
          <hr className="divider" />
          {WEAPONS.filter(w => sys.tech >= w.minTech && !game.weapons.some(x => x.id === w.id)).map(w => {
            const slotFree = game.weapons.length < game.ship.slots_w;
            const canBuy = game.credits >= w.price && slotFree;
            return (
              <div key={w.id} className="stat-row">
                <span className="stat-label">{w.name} <span style={{color:"#555588"}}>dmg {w.damage}</span></span>
                <button className={"btn " + (canBuy ? "btn-gold" : "btn-disabled")}
                  style={{ fontSize: 15, padding: "4px 8px" }} onClick={() => buyWeapon(w)}>
                  {w.price.toLocaleString()} cr
                </button>
              </div>
            );
          })}
          {game.weapons.length >= game.ship.slots_w && game.ship.slots_w > 0 && (
            <div style={{ fontSize: 13, color: "#7777aa", marginTop: 6 }}>
              Slots full — sell a weapon to replace it
            </div>
          )}
        </div>
      )}
      {tab === "shields" && (
        <div className="panel">
          <div className="panel-title">Shields ({game.shields.length}/{game.ship.slots_s} slots)</div>
          {game.shields.map((s, i) => (
            <div key={i} className="stat-row">
              <span className="stat-label">{s.name} <span style={{color:"#4fc3f7"}}>{s.current}/{s.max}</span></span>
              <button className="btn btn-red" style={{ fontSize: 13, padding: "3px 8px" }}
                onClick={() => {
                  const traderBonus = (game.skills.trader || 0) * 0.02;
                  const sellPrice = Math.floor(s.price * (0.7 + traderBonus));
                  onUpdate({ ...game,
                    shields: game.shields.filter((_, j) => j !== i),
                    credits: game.credits + sellPrice,
                    log: [{ type: "info", text: "Sold " + s.name + " for " + sellPrice + " cr (Trader +" + Math.round(traderBonus*100) + "%)" }, ...game.log],
                  });
                }}>
                SELL {Math.floor(s.price * (0.7 + (game.skills.trader||0)*0.02)).toLocaleString()} cr
              </button>
            </div>
          ))}
          <hr className="divider" />
          {SHIELDS.filter(s => sys.tech >= s.minTech && !game.shields.some(x => x.id === s.id)).map(s => {
            const canBuy = game.credits >= s.price && game.shields.length < game.ship.slots_s;
            return (
              <div key={s.id} className="stat-row">
                <span className="stat-label">{s.name} <span style={{color:"#555588"}}>+{s.strength}</span></span>
                <button className={"btn " + (canBuy ? "btn-blue" : "btn-disabled")}
                  style={{ fontSize: 15, padding: "4px 8px" }} onClick={() => buyShield(s)}>
                  {s.price.toLocaleString()} cr
                </button>
              </div>
            );
          })}
          {game.shields.length >= game.ship.slots_s && game.ship.slots_s > 0 && (
            <div style={{ fontSize: 13, color: "#7777aa", marginTop: 6 }}>
              Slots full — sell a shield to replace it
            </div>
          )}
        </div>
      )}
      {tab === "gadgets" && (
        <div className="panel">
          <div className="panel-title">Gadgets ({game.gadgets.length}/{game.ship.slots_g} slots)</div>
          {GADGETS.map(g => {
            const owned = game.gadgets.some(x => x.id === g.id);
            const canBuy = !owned && game.credits >= g.price && game.gadgets.length < game.ship.slots_g;
            return (
              <div key={g.id} className="stat-row">
                <span className="stat-label">{g.name} <span style={{ color: "#555588" }}>({g.desc})</span></span>
                {owned ? <span className="badge badge-green">OWNED</span>
                  : <button className={"btn " + (canBuy ? "btn-gold" : "btn-disabled")}
                      style={{ fontSize: 15, padding: "4px 8px" }} onClick={() => buyGadget(g)}>{g.price.toLocaleString()} cr</button>}
              </div>
            );
          })}
        </div>
      )}
      {tab === "ships" && (
        <div className="panel">
          <div className="panel-title">Shipyard</div>
          {SHIPS.map(s => {
            const tradeVal = Math.floor((SHIPS.find(x => x.id === game.ship.id)?.price || 0) * 0.7);
            const cost = s.price - tradeVal;
            const canBuy = s.id !== game.ship.id && game.credits >= cost;
            return (
              <div key={s.id} style={{ padding: "8px 0", borderBottom: "1px solid #1a1a3a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 16, color: s.id === game.ship.id ? "#00ff88" : "#c0c0ff" }}>{s.emoji} {s.name}</span>
                  {s.id === game.ship.id ? <span className="badge badge-green">CURRENT</span>
                    : <button className={"btn " + (canBuy ? "btn-gold" : "btn-disabled")}
                        style={{ fontSize: 16, padding: "3px 6px" }} onClick={() => buyShip(s)}>
                        {cost > 0 ? "+" + cost.toLocaleString() + " cr" : Math.abs(cost).toLocaleString() + " cr back"}
                      </button>}
                </div>
                <div style={{ fontSize: 16, color: "#555588", marginTop: 3 }}>
                  Hull:{s.hull} Cargo:{s.cargo} W:{s.slots_w} S:{s.slots_s} G:{s.slots_g} Crew:{s.slots_c} Jmp:{s.jump}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      {game.credits >= 500000 && (
        <div style={{ marginTop: 14, border: "1px solid #ffd700", borderRadius: 4, padding: 10 }}>
          <div style={{ fontSize: 16, color: "#ffd700", marginBottom: 8 }}>🌙 MOON FOR SALE — UTOPIA SYSTEM</div>
          <div style={{ fontSize: 15, color: "#aaa8cc", marginBottom: 8 }}>Retire in luxury! Cost: 500,000 cr</div>
          <button className="btn btn-gold" onClick={() => onUpdate({ ...game, credits: game.credits - 500000, retired: true })}>
            BUY MOON & RETIRE
          </button>
        </div>
      )}
    </div>
  );
}

function ContractsScreen({ game, onUpdate, onPlotCourse }) {
  const board = game.bulletinBoard || [];
  const active = (game.activeContracts || []).filter(c => c.status === "active" || c.status === "pending_fight");
  const done = (game.activeContracts || []).filter(c => c.status === "done" || c.status === "failed");
  const maxActive = 3;

  const takeContract = (c) => {
    if (active.length >= maxActive) return;
    let newGame = { ...game };

    // For delivery — add cargo to hold
    if (c.type === "delivery") {
      const freeSpace = game.cargoCapacity - game.cargo.reduce((s, x) => s + x.qty, 0);
      if (freeSpace < c.cargoQty) return; // not enough space
      newGame.cargo = [...game.cargo, {
        id: "contract_cargo_" + c.id,
        qty: c.cargoQty,
        buyPrice: 0,
        label: c.title,
        contractId: c.id,
      }];
    }

    newGame.activeContracts = [...(game.activeContracts || []),
      { ...c, status: "active" }];
    newGame.bulletinBoard = (game.bulletinBoard || []).filter(x => x.id !== c.id);
    newGame.log = [{ type: "info", text: "Contract taken: " + c.title }, ...newGame.log];
    onUpdate(newGame);
  };

  const abandonContract = (c) => {
    let newGame = { ...game };
    // Remove contract cargo
    if (c.type === "delivery") {
      newGame.cargo = game.cargo.map(item =>
        item.id === "contract_cargo_" + c.id
          ? { ...item, qty: item.qty - c.cargoQty }
          : item
      ).filter(item => item.qty > 0);
    }
    newGame.credits -= c.penalty;
    newGame.reputation = (newGame.reputation || 0) - 1;
    newGame.activeContracts = (game.activeContracts || []).map(x =>
      x.id === c.id ? { ...x, status: "failed" } : x
    );
    newGame.log = [{ type: "bad", text: "Contract abandoned: " + c.title + " — penalty " + c.penalty + " cr" }, ...newGame.log];
    onUpdate(newGame);
  };

  const daysLeft = (c) => c.deadline - game.days;
  const urgentColor = (dl) => dl <= 2 ? "#ff6b35" : dl <= 4 ? "#ffd700" : "#8888bb";

  return (
    <div>
      {/* Bulletin Board */}
      <div className="panel">
        <div className="panel-title">
          📋 Bulletin Board — {game.galaxy[game.currentSystem].name}
          <span className="badge badge-gold" style={{ marginLeft: 8 }}>{active.length}/{maxActive} active</span>
        </div>
        {board.length === 0 && (
          <div style={{ fontSize: 15, color: "#555588", padding: "8px 0" }}>No contracts available here.</div>
        )}
        {board.map(c => {
          const cargoFree = game.cargoCapacity - game.cargo.reduce((s, x) => s + x.qty, 0);
          const cantTake = active.length >= maxActive
            || (c.type === "delivery" && cargoFree < c.cargoQty);
          return (
            <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid #1a1a3a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 16, color: "#ffd700", marginBottom: 4 }}>
                    {c.emoji} {c.title}
                  </div>
                  <div style={{ fontSize: 14, color: "#8888bb", lineHeight: 1.6 }}>
                    {c.type === "delivery" && <>Deliver {c.cargoQty}t to <span style={{ color: "#4fc3f7" }}>{c.to}</span> · {c.daysAllowed} days</>}
                    {c.type === "extermination" && <>Kill {c.killCount} pirates in <span style={{ color: "#4fc3f7" }}>{c.targetSystemName}</span> · {c.daysAllowed} days</>}
                    {c.type === "assassination" && <>Eliminate target in <span style={{ color: "#4fc3f7" }}>{c.targetSystemName}</span> · {c.daysAllowed} days</>}
                  </div>
                  {c.type === "delivery" && cargoFree < c.cargoQty && (
                    <div style={{ fontSize: 13, color: "#ff6b35", marginTop: 2 }}>⚠ Not enough cargo space ({cargoFree}t free)</div>
                  )}
                </div>
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <div style={{ fontSize: 16, color: "#00ff88", marginBottom: 4 }}>+{c.reward.toLocaleString()} cr</div>
                  {c.penalty > 0 && <div style={{ fontSize: 13, color: "#ff6b35" }}>−{c.penalty} penalty</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className={"btn " + (cantTake ? "btn-disabled" : "btn-green")}
                  style={{ fontSize: 14, padding: "4px 12px" }}
                  onClick={() => !cantTake && takeContract(c)}>
                  ACCEPT
                </button>
                {(c.type === "extermination" || c.type === "assassination") && (
                  <button className="btn btn-blue" style={{ fontSize: 14, padding: "4px 10px" }}
                    onClick={() => onPlotCourse(c.targetSystemId)}>
                    PLOT COURSE →
                  </button>
                )}
                {c.type === "delivery" && (
                  <button className="btn btn-blue" style={{ fontSize: 14, padding: "4px 10px" }}
                    onClick={() => onPlotCourse(c.toId)}>
                    PLOT COURSE →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active contracts */}
      {active.length > 0 && (
        <div className="panel">
          <div className="panel-title">Active Contracts</div>
          {active.map(c => {
            const dl = daysLeft(c);
            return (
              <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid #1a1a3a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 15, color: "#c0c0ff" }}>{c.emoji} {c.title}</div>
                  <div style={{ fontSize: 14, color: urgentColor(dl) }}>⏱ {dl}d left</div>
                </div>
                <div style={{ fontSize: 13, color: "#8888bb", marginTop: 3, lineHeight: 1.6 }}>
                  {c.type === "delivery" && <>→ {c.to} · {c.cargoQty}t in hold</>}
                  {c.type === "extermination" && <>{c.killsCompleted}/{c.killCount} kills in {c.targetSystemName}</>}
                  {c.type === "assassination" && <>Target: {c.targetName} in {c.targetSystemName}</>}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {(c.type === "delivery") && (
                    <button className="btn btn-blue" style={{ fontSize: 13, padding: "3px 8px" }}
                      onClick={() => onPlotCourse(c.toId)}>→ {c.to}</button>
                  )}
                  {(c.type === "extermination" || c.type === "assassination") && (
                    <button className="btn btn-blue" style={{ fontSize: 13, padding: "3px 8px" }}
                      onClick={() => onPlotCourse(c.targetSystemId)}>→ {c.targetSystemName}</button>
                  )}
                  <button className="btn btn-red" style={{ fontSize: 13, padding: "3px 8px" }}
                    onClick={() => abandonContract(c)}>ABANDON</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed/failed */}
      {done.length > 0 && (
        <div className="panel">
          <div className="panel-title">History</div>
          {done.slice(0, 5).map(c => (
            <div key={c.id} className="stat-row">
              <span style={{ fontSize: 14, color: "#8888bb" }}>{c.emoji} {c.title}</span>
              <span className={"badge " + (c.status === "done" ? "badge-green" : "badge-red")}>
                {c.status === "done" ? "DONE" : "FAILED"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestsScreen({ game, onPlotCourse }) {
  return (
    <div>
      {game.quests.map(q => {
        const targetSys = q.targetSystem !== undefined ? game.galaxy.find(s => s.id === q.targetSystem) : null;
        return (
          <div key={q.id} className="panel" style={{ borderColor: q.status === "done" ? "#00ff8844" : q.status === "failed" ? "#ff6b3544" : "#2a2a6a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 17, color: q.status === "done" ? "#00ff88" : q.status === "failed" ? "#ff6b35" : "#ffd700" }}>{q.name}</div>
              <span className={"badge " + (q.status === "done" ? "badge-green" : q.status === "failed" ? "badge-red" : "badge-gold")}>
                {q.status.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: 16, color: "#8888bb", lineHeight: 1.5, marginBottom: 6 }}>{q.desc}</div>
            {q.status === "available" && targetSys && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 16, color: "#555588" }}>Target:</span>
                <span style={{ fontSize: 16, color: "#4fc3f7" }}>{targetSys.name}</span>
                <button className="btn btn-blue" style={{ fontSize: 16, padding: "2px 8px" }}
                  onClick={() => onPlotCourse(targetSys.id)}>
                  PLOT COURSE →
                </button>
              </div>
            )}
            {q.daysLeft !== undefined && q.status === "available" && (
              <div style={{ fontSize: 16, color: q.daysLeft <= 2 ? "#ff6b35" : "#ffd700", marginTop: 4 }}>
                ⏱ {q.daysLeft} days remaining
              </div>
            )}
          </div>
        );
      })}
      <div className="panel">
        <div className="panel-title">News Feed</div>
        {game.news.map((n, i) => (
          <div key={i} className={"news-item" + (n.quest ? " quest" : n.event ? " danger" : "")}>
            {n.event && "⚠ "}{n.quest && "► "}{n.text}
          </div>
        ))}
        {game.news.length === 0 && <div style={{ fontSize: 16, color: "#555588" }}>No news at this location.</div>}
      </div>
    </div>
  );
}

function LogScreen({ game }) {
  return (
    <div className="panel">
      <div className="panel-title">Captain's Log</div>
      {game.log.map((e, i) => <div key={i} className={"log-entry " + (e.type || "")}>{e.text}</div>)}
    </div>
  );
}

function EncounterScreen({ game, encounter, onUpdate, onDone }) {
  const [combatLog, setCombatLog] = useState([]);
  const [enemy, setEnemy] = useState(encounter.type === "pirate" ? encounter : null);
  const [phase, setPhase] = useState("choice");

  const flee = () => {
    const fleeChance = 0.3 + game.skills.pilot * 0.06;
    if (Math.random() < fleeChance) {
      onUpdate({ ...game, log: [{ type: "info", text: "Fled from " + encounter.type + "!" }, ...game.log] });
      onDone();
    } else {
      setCombatLog(l => [{ type: "bad", text: "Failed to flee!" }, ...l]);
      if (encounter.type === "pirate" && phase !== "choice") {
        fightRound("flee_failed");
      }
    }
  };

  const surrender = () => {
    const lostCargo = game.cargo.slice(0, Math.ceil(game.cargo.length / 2));
    const newCargo = game.cargo.slice(Math.ceil(game.cargo.length / 2));
    const entry = { type: "warn", text: "Surrendered. Lost " + lostCargo.length + " cargo types." };
    onUpdate({ ...game, cargo: newCargo, log: [entry, ...game.log] });
    onDone();
  };

  const fightRound = useCallback((action) => {
    if (!enemy || phase === "ended") return;
    setPhase("fighting");
    const { player: newPlayer, enemy: newEnemy, log: roundLog, ended, result } = doCombatRound(game, enemy, action || "fight");
    setCombatLog(l => [...roundLog, ...l].slice(0, 20));
    setEnemy(newEnemy);
    if (ended) {
      setPhase("ended");
      let finalGame = { ...game, hull: newPlayer.hull, shields: newPlayer.shields, cargo: newPlayer.cargo };
      if (result === "win") {
        const bounty = rnd(50, 500);
        finalGame.credits = finalGame.credits + bounty;
        finalGame.killed = (finalGame.killed || 0) + 1;
        finalGame = onPirateKilled(finalGame);
        finalGame.log = [{ type: "good", text: "Destroyed pirate! Bounty: " + bounty + " cr" }, ...finalGame.log];
      } else if (result === "dead") {
        finalGame.dead = true;
      }
      onUpdate(finalGame);
      if (result !== "dead") setTimeout(onDone, 800);
    } else {
      onUpdate({ ...game, hull: newPlayer.hull, shields: newPlayer.shields });
    }
  }, [enemy, game, phase, onUpdate, onDone]);

  if (encounter.type === "pirate") {
    return (
      <div className="encounter-box">
        <div className="encounter-title">⚠ PIRATE ENCOUNTER</div>
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>{game.ship.emoji}</div>
            <div style={{ fontSize: 16, color: "#00ff88" }}>YOU</div>
            <div style={{ fontSize: 15, color: "#00ff88" }}>Hull: {game.hull}</div>
          </div>
          <div style={{ fontSize: 16, color: "#ff6b35", alignSelf: "center" }}>VS</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>{encounter.ship.emoji}</div>
            <div style={{ fontSize: 16, color: "#ff6b35" }}>PIRATE {encounter.ship.name.toUpperCase()}</div>
            <div style={{ fontSize: 15, color: "#ff6b35" }}>Hull: {enemy?.hull ?? encounter.hull}</div>
          </div>
        </div>
        <div style={{ maxHeight: 80, overflow: "hidden", marginBottom: 10 }}>
          {combatLog.map((e, i) => <div key={i} className={"log-entry " + e.type}>{e.text}</div>)}
        </div>
        {phase !== "ended" && (
          <div className="flex-gap">
            <button className="btn btn-red" onClick={() => fightRound("fight")}>⚔ FIGHT</button>
            <button className="btn btn-blue" onClick={flee}>↗ FLEE</button>
            <button className="btn btn-gray" onClick={surrender}>🏳 SURRENDER</button>
          </div>
        )}
      </div>
    );
  }

  if (encounter.type === "police") {
    return (
      <div className="encounter-box" style={{ borderColor: "#4fc3f7" }}>
        <div className="encounter-title" style={{ color: "#4fc3f7" }}>🔵 POLICE INSPECTION</div>
        <div className="encounter-desc">
          {encounter.contraband
            ? "Officer: \"We detect illegal goods in your hold. Surrender your contraband or face arrest!\""
            : "Officer: \"Routine inspection. Your papers appear to be in order. Carry on, Commander.\""}
        </div>
        {encounter.contraband ? (
          <div className="flex-gap">
            <button className="btn btn-red" onClick={() => {
              const newCargo = game.cargo.filter(c => !COMMODITIES.find(x => x.id === c.id)?.illegal);
              const entry = { type: "warn", text: "Contraband seized by police!" };
              onUpdate({ ...game, cargo: newCargo, policeRecord: game.policeRecord + 1, log: [entry, ...game.log] });
              onDone();
            }}>COMPLY</button>
            <button className="btn btn-gray" onClick={flee}>FLEE</button>
          </div>
        ) : (
          <button className="btn btn-blue" onClick={onDone}>ACKNOWLEDGED</button>
        )}
      </div>
    );
  }

  if (encounter.type === "trader") {
    return (
      <div className="encounter-box" style={{ borderColor: "#00ff88" }}>
        <div className="encounter-title" style={{ color: "#00ff88" }}>🚀 TRADER ENCOUNTER</div>
        <div className="encounter-desc">A merchant vessel hails you. They offer to sell you rare goods at market price.</div>
        <button className="btn btn-green" onClick={onDone}>CONTINUE</button>
      </div>
    );
  }

  if (encounter.type === "special") {
    const specials = {
      marie_celeste: {
        title: "🚢 MARIE CELESTE",
        desc: "You find a drifting Flea-class vessel — the Marie Celeste. It appears abandoned. The cargo hold contains Narcotics. Salvage law says you may take it, but...",
        options: [
          { label: "TAKE CARGO", action: () => {
            const newCargo = [...game.cargo, { id: "narcotics", qty: 3, buyPrice: 0 }];
            onUpdate({ ...game, cargo: newCargo, log: [{ type: "warn", text: "Took Marie Celeste cargo — police may be watching!" }, ...game.log] });
            onDone();
          }, cls: "btn-red" },
          { label: "IGNORE", action: () => onDone(), cls: "btn-gray" },
        ]
      },
      famous_captain: (() => {
        const captain = pick(ELITE_CAPTAINS);
        const hasItem = captain.wants === "military"
          ? game.weapons.some(w => w.id === "military")
          : captain.wants === "beam"
          ? game.weapons.some(w => w.id === "beam")
          : game.shields.some(s => s.id === captain.wants);
        return {
          title: captain.emoji + " " + captain.name.toUpperCase(),
          desc: captain.name + " hails you in a Wasp-class ship. \"I need a " + captain.wantsName + " urgently. I can teach you something valuable in return.\"",
          options: [
            { label: hasItem ? "TRADE (" + captain.gives + ")" : "NO " + captain.wantsName.toUpperCase(), action: () => {
              if (!hasItem) return;
              let newWeapons = game.weapons;
              let newShields = game.shields;
              if (captain.wants === "military" || captain.wants === "beam") {
                newWeapons = game.weapons.filter(w => w.id !== captain.wants);
              } else {
                newShields = game.shields.filter(s => s.id !== captain.wants);
              }
              const newSkills = { ...game.skills, [captain.skill]: Math.min(10, game.skills[captain.skill] + 1) };
              onUpdate({ ...game, weapons: newWeapons, shields: newShields, skills: newSkills,
                log: [{ type: "good", text: captain.name + ": traded " + captain.wantsName + " → " + captain.gives }, ...game.log] });
              onDone();
            }, cls: hasItem ? "btn-gold" : "btn-disabled" },
            { label: "DECLINE", action: () => onDone(), cls: "btn-gray" },
          ]
        };
      })(),
      alien_machine: {
        title: "👽 ALIEN ENCOUNTER",
        desc: "A strange alien vessel drifts alongside you. Through its hull you can see a glowing learning machine. The alien gestures — 3,000 credits for one session.",
        options: [
          { label: game.credits >= 3000 ? "USE MACHINE (3000 cr)" : "CAN'T AFFORD", action: () => {
            if (game.credits < 3000) return;
            const skills = ["pilot","fighter","trader","engineer"];
            const s = pick(skills);
            const worked = Math.random() < 0.6;
            const newSkills = worked ? { ...game.skills, [s]: Math.min(10, game.skills[s] + 1) } : game.skills;
            onUpdate({ ...game, credits: game.credits - 3000, skills: newSkills,
              log: [{ type: worked ? "good" : "warn", text: worked ? "Alien machine worked! +" + s + " skill" : "Machine malfunctioned — no effect (deprecated model)." }, ...game.log] });
            onDone();
          }, cls: game.credits >= 3000 ? "btn-blue" : "btn-disabled" },
          { label: "IGNORE", action: () => onDone(), cls: "btn-gray" },
        ]
      },
      mercenary_offer: (() => {
        const merc = pick(MERCENARY_POOL.filter(m => !(game.mercenaries || []).find(x => x.id === m.id)));
        if (!merc) return {
          title: "🤝 MERCENARY",
          desc: "A spacer offers their services, but your crew is full.",
          options: [{ label: "DECLINE", action: () => onDone(), cls: "btn-gray" }]
        };
        const maxMercs = game.ship.slots_c ?? 0;
        const full = (game.mercenaries || []).length >= maxMercs;
        return {
          title: "🤝 MERCENARY: " + merc.name.toUpperCase(),
          desc: merc.name + " is looking for work. Skills: Pilot " + merc.skills.pilot + " / Fighter " + merc.skills.fighter + " / Trader " + merc.skills.trader + " / Engineer " + merc.skills.engineer + ". Daily rate: " + merc.cost + " cr/day.",
          options: [
            { label: full ? "NO CREW QUARTERS" : "HIRE (" + merc.cost + " cr/day)", action: () => {
              if (full) return;
              const newMercs = [...(game.mercenaries || []), merc];
              onUpdate({ ...game, mercenaries: newMercs,
                log: [{ type: "good", text: merc.name + " hired for " + merc.cost + " cr/day." }, ...game.log] });
              onDone();
            }, cls: full ? "btn-disabled" : "btn-green" },
            { label: "PASS", action: () => onDone(), cls: "btn-gray" },
          ]
        };
      })(),
      sealed_cargo: {
        title: "🎁 SEALED CARGO",
        desc: "A second-hand dealer offers you 3 sealed cargo containers for 1,000 cr. Could be anything — water to robots!",
        options: [
          { label: "BUY (1000 cr)", action: () => {
            if (game.credits < 1000) return;
            const items = ["water","furs","food","ore","games","medicine","robots"];
            const newCargo = [...game.cargo, { id: pick(items), qty: 3, buyPrice: 333 }];
            onUpdate({ ...game, credits: game.credits - 1000, cargo: newCargo, log: [{ type: "info", text: "Opened sealed cargo!" }, ...game.log] });
            onDone();
          }, cls: game.credits >= 1000 ? "btn-gold" : "btn-disabled" },
          { label: "PASS", action: () => onDone(), cls: "btn-gray" },
        ]
      },
      tonic: {
        title: "🧪 ALIEN TONIC",
        desc: "A traveler offers you a bottle of alien brew. Rumored to enhance skills — expiration date unreadable.",
        options: [
          { label: "DRINK (500 cr)", action: () => {
            if (game.credits < 500) return;
            const skills = ["pilot","fighter","trader","engineer"];
            const s = pick(skills);
            const worked = Math.random() < 0.4;
            const newSkills = worked ? { ...game.skills, [s]: Math.min(10, game.skills[s] + 1) } : game.skills;
            onUpdate({ ...game, credits: game.credits - 500, skills: newSkills,
              log: [{ type: worked ? "good" : "warn", text: worked ? "Tonic worked! +" + s : "Tonic had no effect." }, ...game.log] });
            onDone();
          }, cls: game.credits >= 500 ? "btn-green" : "btn-disabled" },
          { label: "DECLINE", action: () => onDone(), cls: "btn-gray" },
        ]
      },
    };

    const spec = specials[encounter.sub] || specials.sealed_cargo;
    return (
      <div className="encounter-box" style={{ borderColor: "#ffd700" }}>
        <div className="encounter-title" style={{ color: "#ffd700" }}>{spec.title}</div>
        <div className="encounter-desc">{spec.desc}</div>
        <div className="flex-gap">
          {spec.options.map((opt, i) => (
            <button key={i} className={"btn " + opt.cls} onClick={opt.action}>{opt.label}</button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function MenuModal({ game, onClose, onSave, onNewGame, onTitle }) {
  const [confirmNew, setConfirmNew] = useState(false);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ borderColor: "#4fc3f7" }}>
        <div className="modal-title">☰ MENU</div>

        <div className="stat-row"><span className="stat-label">Commander</span><span className="stat-val">{game.commander}</span></div>
        <div className="stat-row"><span className="stat-label">Day</span><span className="stat-val">{game.days}</span></div>
        <div className="stat-row"><span className="stat-label">Credits</span><span className="stat-val-green">{game.credits.toLocaleString()} cr</span></div>
        <div className="stat-row"><span className="stat-label">Ship</span><span className="stat-val">{game.ship.emoji} {game.ship.name}</span></div>
        <div className="stat-row" style={{ marginBottom: 14 }}><span className="stat-label">Kills</span><span className="stat-val">{game.killed || 0}</span></div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <button className="btn btn-green" style={{ width: "100%", textAlign: "left" }} onClick={() => { onSave(); onClose(); }}>
            💾 SAVE GAME
          </button>
          <button className="btn btn-blue" style={{ width: "100%", textAlign: "left" }} onClick={onTitle}>
            ← TITLE SCREEN
          </button>
          {!confirmNew ? (
            <button className="btn btn-red" style={{ width: "100%", textAlign: "left" }} onClick={() => setConfirmNew(true)}>
              ✕ NEW GAME
            </button>
          ) : (
            <div style={{ border: "1px solid #ff6b35", borderRadius: 2, padding: 10 }}>
              <div style={{ fontSize: 15, color: "#ff6b35", marginBottom: 8 }}>Current save will be lost. Sure?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-red" style={{ flex: 1 }} onClick={onNewGame}>YES, NEW GAME</button>
                <button className="btn btn-gray" style={{ flex: 1 }} onClick={() => setConfirmNew(false)}>CANCEL</button>
              </div>
            </div>
          )}
          <button className="btn btn-gray" style={{ width: "100%", textAlign: "left" }} onClick={onClose}>
            ▶ CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}


function QuestPopup({ popup, onClose }) {
  if (!popup) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}
        style={{ borderColor: popup.color || "#ffd700" }}>
        <div className="modal-title" style={{ color: popup.color || "#ffd700", fontSize: 19, lineHeight: 1.8 }}>
          {popup.title}
        </div>
        <div style={{ fontSize: 16, color: "#aaa8cc", lineHeight: 2, whiteSpace: "pre-line", marginBottom: 16 }}>
          {popup.body}
        </div>
        <button className="btn btn-gold" onClick={onClose} style={{ width: "100%" }}>
          ACKNOWLEDGED ▶
        </button>
      </div>
    </div>
  );
}

// ─── MAIN GAME ────────────────────────────────────────────────────────────────

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

  const handleEncounterDone = () => setEncounter(null);

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
      <div className="nav-tabs">
        {[["trade","TRADE"],["travel","WARP"],["ship","SHIP"],["bank","BANK"],["jobs","JOBS"],["quests","QUESTS"],["log","LOG"]].map(([id, label]) => (
          <button key={id} className={"tab" + (tab === id ? " active" : "")} onClick={() => { setTab(id); if (id !== "travel") setQuestTarget(null); }}>{label}</button>
        ))}
      </div>
      {tab === "trade" && <TradeScreen game={game} onUpdate={onUpdate} />}
      {tab === "travel" && <TravelScreen game={game} onUpdate={onUpdate} onEncounter={handleEncounter} onQuestPopup={setQuestPopup} initialSelected={questTarget} />}
      {tab === "ship" && <ShipScreen game={game} onUpdate={onUpdate} />}
      {tab === "bank" && <BankScreen game={game} onUpdate={onUpdate} />}
      {tab === "jobs" && <ContractsScreen game={game} onUpdate={onUpdate} onPlotCourse={handlePlotCourse} />}
      {tab === "quests" && <QuestsScreen game={game} onPlotCourse={handlePlotCourse} />}
      {tab === "log" && <LogScreen game={game} />}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("title");
  const [game, setGame] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("spacetrader_save");
      if (saved) { setGame(JSON.parse(saved)); setScreen("game"); }
    } catch {}
  }, []);

  const updateGame = useCallback((newGame) => {
    setGame(newGame);
    try { localStorage.setItem("spacetrader_save", JSON.stringify(newGame)); } catch {}
  }, []);

  const startGame = (name, skills) => {
    try {
      const g = createNewGame(name, skills);
      updateGame(g);
      setScreen("game");
    } catch (e) {
      console.error("startGame failed:", e);
      alert("Error starting game: " + e.message);
    }
  };

  const handleNewGame = () => {
    try {
      const lastName = game?.commander || "";
      localStorage.removeItem("spacetrader_save");
      if (lastName) localStorage.setItem("spacetrader_lastcmdr", lastName);
    } catch {}
    setGame(null);
    setScreen("title");
  };

  const handleTitle = () => {
    // Save current game but go to title — can resume
    setScreen("title");
  };

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
              prevName={game?.commander || (() => { try { return localStorage.getItem("spacetrader_lastcmdr") || ""; } catch { return ""; } })()}
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

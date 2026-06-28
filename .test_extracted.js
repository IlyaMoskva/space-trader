
const useState = (v) => [typeof v === "function" ? v() : v, () => {}];
const useEffect = () => {};
const useCallback = (f) => f;
const useRef = () => ({ current: null });

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
.btn-disabled { border-color: #333355; color: #444466; cursor: not-allowed; opacity: 0.5; }
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
  { id: "pulse",    name: "Pulse Laser",    damage: 15, price: 2000  },
  { id: "beam",     name: "Beam Laser",     damage: 25, price: 12000 },
  { id: "military", name: "Military Laser", damage: 35, price: 35000 },
];
const SHIELDS = [
  { id: "energy",    name: "Energy Shield",    strength: 100, price: 5000  },
  { id: "reflective",name: "Reflective Shield",strength: 200, price: 25000 },
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
  "Xeer","Vetitice","Mirece","Uszaa","Onrira","Celabile","Sotibe","Aronar","Oresri","Teaatis",
  "Biarge","Edxelin","Orarra","Digebiti","Ededleen","Gemaza","Mautice","Tibicele","Celeisen","Reorte",
  "Solati","Nusera","Isveve","Usreor","Reorade","Tiqua","Cemave","Maregees","Atbevete","Riedquat",
  "Vequess","Rexebe","Labeve","Maregees","Tiveve","Razorce","Solrace","Ceesxe","Tibecea","Orvequ",
  "Nexus","Kravat","Gemulon","Utopia","Baratas","Melina","Oresria","Zuul","Orti","Ceedra",
  "Xelal","Virexe","Orexe","Lesoso","Quator","Velass","Razaor","Morala","Tionat","Celaran",
  "Diqua","Rigeza","Maatis","Tiorqu","Verees","Solave","Cearso","Xeoner","Bibege","Orrere",
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

  // ── Connectivity repair (BFS from Lave at Gnat range) ────────────────────
  const neighbours = (arr, s, r) => arr.filter(o => o.id !== s.id && dist(o, s) <= r);

  const bfsReachable = (arr, startId, r) => {
    const seen = new Set([startId]);
    const q = [startId];
    while (q.length) {
      const cur = arr.find(s => s.id === q.shift());
      if (!cur) continue;
      for (const nb of neighbours(arr, cur, r)) {
        if (!seen.has(nb.id)) { seen.add(nb.id); q.push(nb.id); }
      }
    }
    return seen;
  };

  // Up to 15 repair passes
  for (let pass = 0; pass < 15; pass++) {
    const reachable = bfsReachable(systems, 0, GNAT_R);
    if (reachable.size === systems.length) break;

    for (const sys of systems) {
      if (reachable.has(sys.id)) continue;

      // Closest reachable system
      const closest = [...reachable]
        .map(id => systems.find(s => s.id === id))
        .filter(Boolean)
        .reduce((best, s) => dist(s, sys) < dist(best, sys) ? s : best);

      // Move to GNAT_R - 15 from closest (well inside range)
      const d = dist(closest, sys);
      if (d < 1) continue;
      const target = GNAT_R - 15;
      const ratio = target / d;
      let nx = Math.round(closest.x + (sys.x - closest.x) * ratio);
      let ny = Math.round(closest.y + (sys.y - closest.y) * ratio);
      nx = Math.max(80, Math.min(GSIZE - 80, nx));
      ny = Math.max(80, Math.min(GSIZE - 80, ny));

      // Small nudge if overlapping another system
      for (let t = 0; t < 20; t++) {
        if (!systems.some(s => s.id !== sys.id && dist(s, {x:nx, y:ny}) < MIN_DIST)) break;
        nx += rnd(-20, 20); ny += rnd(-20, 20);
        nx = Math.max(80, Math.min(GSIZE - 80, nx));
        ny = Math.max(80, Math.min(GSIZE - 80, ny));
      }
      sys.x = nx; sys.y = ny;
    }
  }

  // ── Isolation check: no system more than MAX_R from all others ────────────
  for (const sys of systems) {
    if (sys.id === 0) continue;
    if (neighbours(systems, sys, MAX_R).length === 0) {
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

// ─── QUESTS ──────────────────────────────────────────────────────────────────

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
  const policeChance = currentSystem.police * 15;
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
  };
}

// ─── STARS CANVAS ────────────────────────────────────────────────────────────

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
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

/**
 * Combat simulation — test-combat-sim.cjs
 * Runs N battles per scenario, reports win/loss rates.
 * Usage: node test-combat-sim.cjs
 */
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const SRC  = path.join(__dirname, 'src');
const RUNS = 200;

const loadFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.replace(/^export \{[\s\S]*?\};/gm, '')
    .split('\n')
    .filter(l => !l.trim().startsWith('import '))
    .map(l => l.replace(/^export (function|const|class) /, '$1 '))
    .join('\n');
};

const FILES = [
  'constants/ships.js','constants/commodities.js','constants/world.js',
  'constants/events.js','constants/mercenaries.js','constants/aliens.js',
  'engine/utils.js','engine/galaxy.js','engine/market.js',
  'engine/contracts.js','engine/story.js','engine/quests.js',
  'engine/combat.js','engine/newGame.js','engine/aliens.js','engine/travel.js',
];

const ctx = vm.createContext({ Math, Array, Object, console, JSON,
  undefined, NaN, Infinity, parseInt, parseFloat, isNaN, isFinite });
vm.runInContext(
  'const Math=globalThis.Math;const Array=globalThis.Array;' +
  'const Object=globalThis.Object;const JSON=globalThis.JSON;',
  ctx
);
vm.runInContext(FILES.map(f => loadFile(path.join(SRC, f))).join('\n'), ctx);

const { doAlienCombatRound, createNewGame } = ctx;
const SHIPS   = vm.runInContext('SHIPS',   ctx);
const WEAPONS = vm.runInContext('WEAPONS', ctx);
const SHIELDS = vm.runInContext('SHIELDS', ctx);
const GADGETS = vm.runInContext('GADGETS', ctx);

// ── Encounter templates ───────────────────────────────────────────────────────

const ENC = {
  scout: {
    type:"alien", sub:"alien_scout",
    ship:{ id:"alien_scout", name:"Alien Scout" },
    hull:80, hullMax:80, regen:3, hasPlasma:false, plasma:null,
    pulseDamage:[5,15], weapons:1, fleeHard:true, hitAccuracy:1.0,
  },
  cruiser: {
    type:"alien", sub:"alien_cruiser",
    ship:{ id:"alien_cruiser", name:"Alien Cruiser" },
    hull:180, hullMax:180, regen:5, hasPlasma:true,
    plasma:{ damage:60, chance:0.25 }, pulseDamage:[5,15], weapons:2,
    fleeHard:false, hitAccuracy:1.0,
  },
  mothership: {
    type:"alien", sub:"alien_mothership",
    ship:{ id:"alien_mothership", name:"Alien Mothership" },
    hull:350, hullMax:350, regen:8, hasPlasma:true,
    plasma:{ damage:70, chance:0.15 }, pulseDamage:[10,22], weapons:3,
    fleeHard:false, hitAccuracy:0.6, isMothership:true,
  },
};

function enc(type) {
  return { ...ENC[type], shields:0, shieldsMax:0, wave:1, maxWaves:1 };
}

// ── Game builder ──────────────────────────────────────────────────────────────

function makeGame(cfg) {
  const ship = SHIPS.find(s => s.id === cfg.ship) || SHIPS[SHIPS.length-1];
  const shields = (cfg.shields || []).map(id => {
    // Lightning shield not in SHIELDS array (quest-only) — add manually
    if (id === 'lightning') return { id:'lightning', name:'Lightning Shield', strength:350, max:350, current:350, price:80000 };
    const s = SHIELDS.find(sh => sh.id === id);
    return s ? { ...s, max: s.strength, current: s.strength } : null;
  }).filter(Boolean);

  return {
    hull: ship.hull, hullMax: ship.hull,
    ship,
    skills: { pilot: cfg.pilot||5, fighter: cfg.fighter||5, trader:5, engineer: cfg.engineer||5 },
    weapons: (cfg.weapons||[]).map(id => WEAPONS.find(w => w.id === id)).filter(Boolean),
    shields,
    gadgets: (cfg.gadgets||[]).map(id => ({ id, name:id, price:0 })),
    mercenaries: [],
    cargo: [],
  };
}

// ── Single battle ─────────────────────────────────────────────────────────────

function battle(cfg, encounters) {
  let game = makeGame(cfg);

  for (const template of encounters) {
    let e = { ...template, hull: template.hullMax };
    let won = false;

    for (let r = 0; r < 60; r++) {
      const res = doAlienCombatRound(game, e, 'fight');

      // Sync shields back
      let rem = res.playerShields;
      const newShields = game.shields.map(s => {
        const cur = Math.min(s.max, rem); rem = Math.max(0, rem - s.max);
        return { ...s, current: cur };
      });
      game = { ...game, hull: Math.max(0, res.playerHull), shields: newShields };
      e    = { ...e, hull: Math.max(0, res.alienHull) };

      if (res.ended) {
        if (res.result === 'dead') return { result:'dead', rounds: r+1, hull: 0 };
        if (res.result === 'win')  { won = true; break; }
      }
    }
    if (!won) return { result:'timeout', rounds:60, hull: game.hull };
  }
  return { result:'win', rounds:0, hull: game.hull };
}

// ── Scenario runner ───────────────────────────────────────────────────────────

function run(label, cfg, encounters) {
  let wins=0, deaths=0, to=0, hullSum=0;
  for (let i=0; i<RUNS; i++) {
    const r = battle(cfg, encounters);
    if      (r.result==='win')     { wins++;  hullSum+=r.hull; }
    else if (r.result==='dead')    { deaths++; }
    else                            { to++; }
  }
  const wp  = Math.round(wins/RUNS*100);
  const dp  = Math.round(deaths/RUNS*100);
  const avg = wins > 0 ? Math.round(hullSum/wins) : 0;
  const bar = '█'.repeat(Math.round(wp/5)) + '░'.repeat(20-Math.round(wp/5));
  const ico = wp>=60?'✅':wp>=30?'⚠️ ':'❌';
  console.log(`  ${ico} ${label}`);
  console.log(`     [${bar}] ${wp}% win · ${dp}% die · avg hull left: ${avg}`);
  return wp;
}

// ── Scenarios ─────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(60)}`);
console.log(`  ALIEN COMBAT SIMULATION  (n=${RUNS} per scenario)`);
console.log(`${'═'.repeat(60)}`);

// ─── vs Scout ───────────────────────────────────────────────────────────────
console.log('\n── vs Scout (early game check) ─────────────────────────');
run('Gnat · Pulse · F3 P3',
  { ship:'gnat', weapons:['pulse'], shields:[], gadgets:[], fighter:3, pilot:3 },
  [enc('scout')]);
run('Firefly · Beam · F5 P5',
  { ship:'firefly', weapons:['beam'], shields:['energy'], gadgets:[], fighter:5, pilot:5 },
  [enc('scout')]);

// ─── vs Cruiser ─────────────────────────────────────────────────────────────
console.log('\n── vs Cruiser (mid-game) ────────────────────────────────');
run('Hornet · Beam · F5 P5  (no regen block)',
  { ship:'hornet', weapons:['beam'], shields:['energy'], gadgets:[], fighter:5, pilot:5 },
  [enc('cruiser')]);
run('Hornet · Beam · F5 P5  + RegenInhibitor',
  { ship:'hornet', weapons:['beam'], shields:['energy'], gadgets:['regen_inhibitor'], fighter:5, pilot:5 },
  [enc('cruiser')]);
run('Wasp · Military + Disruptor · F8 P7  + RegenInhibitor',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['energy','reflective'],
    gadgets:['regen_inhibitor'], fighter:8, pilot:7 },
  [enc('cruiser')]);

// ─── Mothership solo ────────────────────────────────────────────────────────
console.log('\n── vs Mothership solo (hull 350, hitAccuracy 0.6) ───────');
run('Wasp · Mil+Dis · 2×shield · F9 P5  no extras',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['energy','reflective'],
    gadgets:['regen_inhibitor'], fighter:9, pilot:5 },
  [enc('mothership')]);
run('Wasp · Mil+Dis · 2×shield · F9 P9  no extras',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['energy','reflective'],
    gadgets:['regen_inhibitor'], fighter:9, pilot:9 },
  [enc('mothership')]);
run('Wasp · Mil+Dis · Lightning · F9 P9  no extras',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['energy','lightning'],
    gadgets:['regen_inhibitor'], fighter:9, pilot:9 },
  [enc('mothership')]);
run('Wasp · Mil+Dis · 2×Reflective (no quest item) · F9 P9',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['reflective','reflective'],
    gadgets:['regen_inhibitor'], fighter:9, pilot:9 },
  [enc('mothership')]);
run('Wasp · Mil+Dis · Lightning · F9 P9  + RepairDroid + Eng8',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['energy','lightning'],
    gadgets:['regen_inhibitor','repair_droid'], fighter:9, pilot:9, engineer:8 },
  [enc('mothership')]);

// ─── Full encounter: 2 cruisers + mothership ────────────────────────────────
console.log('\n── Full encounter: Cruiser × 2 → Mothership ────────────');
const full = [enc('cruiser'), enc('cruiser'), enc('mothership')];

run('Wasp · Mil+Dis · 2×shield · F8 P7  no extras',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['energy','reflective'],
    gadgets:['regen_inhibitor'], fighter:8, pilot:7 },
  full);
run('Wasp · Mil+Dis · 2×shield · F9 P9  no extras',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['energy','reflective'],
    gadgets:['regen_inhibitor'], fighter:9, pilot:9 },
  full);
run('Wasp · Mil+Dis · Lightning · F9 P9  + RepairDroid',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['energy','lightning'],
    gadgets:['regen_inhibitor','repair_droid'], fighter:9, pilot:9, engineer:8 },
  full);
run('Wasp · Mil+Dis · 2×Reflective (no quest item) · F9 P9 + RepairDroid',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['reflective','reflective'],
    gadgets:['regen_inhibitor','repair_droid'], fighter:9, pilot:9, engineer:8 },
  full);
run('Wasp · Mil+Dis · 2×Reflective (no quest item) · F8 P7  no extras',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['reflective','reflective'],
    gadgets:['regen_inhibitor'], fighter:8, pilot:7 },
  full);
run('Wasp · Mil+Dis · Lightning · F9 P9  + RepairDroid + Eng9',
  { ship:'wasp', weapons:['military','alien_disruptor'], shields:['energy','lightning'],
    gadgets:['regen_inhibitor','repair_droid'], fighter:9, pilot:9, engineer:9 },
  full);
run('Grasshopper · Beam+Dis · 2×shield · F7 P7  + RegenInhibitor',
  { ship:'grasshopper', weapons:['beam','alien_disruptor'], shields:['energy','reflective'],
    gadgets:['regen_inhibitor'], fighter:7, pilot:7 },
  full);
run('Termite · Mil+Dis · Lightning · F9 P9  + RepairDroid',
  { ship:'termite', weapons:['military','alien_disruptor'], shields:['energy','lightning'],
    gadgets:['regen_inhibitor','repair_droid'], fighter:9, pilot:9, engineer:8 },
  full);

// ─── Sanity ─────────────────────────────────────────────────────────────────
console.log('\n── Sanity (should die) ──────────────────────────────────');
run('Firefly · Pulse · F3 P3  vs Mothership',
  { ship:'firefly', weapons:['pulse'], shields:[], gadgets:[], fighter:3, pilot:3 },
  [enc('mothership')]);

console.log(`\n${'═'.repeat(60)}\n`);

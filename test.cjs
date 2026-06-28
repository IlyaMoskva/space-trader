#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// ── Load game source ──────────────────────────────────────────────────────────
const src = fs.readFileSync(path.join(__dirname, "src/App.jsx"), "utf8");
const lines = src.split("\n");
// App.jsx now only contains App() — all logic is in engine/constants
// starsIdx not needed; pureLines will be empty (just CSS/FONT consts)
const starsIdx = lines.findIndex(l => l.trim().startsWith("export default function App"));

const pureLines = lines.slice(0, starsIdx)
  .filter(l => !l.trim().startsWith("import "))
  .filter(l => !l.trim().startsWith("export "));

// Load constants from separate files (strip import/export keywords for vm)
const loadConstant = (file) =>
  fs.readFileSync(path.join(__dirname, "src/constants", file), "utf8")
    .split("\n")
    .filter(l => !l.trim().startsWith("import ") && !l.trim().startsWith("export "))
    .join("\n");

const constantsSrc = [
  "ships.js", "commodities.js", "world.js", "events.js", "mercenaries.js"
].map(loadConstant).join("\n");

// Load engine files (strip import/export for vm)
const loadEngine = (file) =>
  fs.readFileSync(path.join(__dirname, "src/engine", file), "utf8")
    .split("\n")
    .filter(l => !l.trim().startsWith("import ") && !l.trim().startsWith("export "))
    .join("\n");

const engineSrc = [
  "utils.js", "galaxy.js", "market.js", "contracts.js", "quests.js", "combat.js", "newGame.js"
].map(loadEngine).join("\n");

const stub = `
const useState = (v) => [typeof v === "function" ? v() : v, () => {}];
const useEffect = () => {};
const useCallback = (f) => f;
const useRef = () => ({ current: null });
`;

// Export all game symbols to globalThis so they survive vm const scoping
const exporter = `
Object.assign(globalThis, {
  rnd, pick,
  PARSEC_SCALE, dist, distParsecs, fuelCost, canReach, jumpRangeCoords,
  SYSTEM_NAMES, generateGalaxy,
  SHIPS, WEAPONS, SHIELDS, GADGETS, COMMODITIES,
  GOV_TYPES, TECH_LEVELS, SIZES, SPECIAL_RES,
  COMMODITY_TECH_PROFILE, GOV_CATEGORY_MOD, getCommodityCategory,
  EVENT_TEMPLATES, generateSystemEvents, applyEventEffects,
  getBaseStock, getBasePrice, priceFromStock, initMarket, getMarketPrices, refreshMarket,
  ELITE_CAPTAINS, MERCENARY_POOL, effectiveSkills,
  CONTRACT_NAMES, generateContracts, checkContractArrival, onPirateKilled,
  generateQuests, generateEncounter, doCombatRound,
  createNewGame,
});
`;

const ctx = Object.assign(Object.create(null), global);
vm.createContext(ctx);
vm.runInContext(stub + constantsSrc + "\n" + engineSrc + "\n" + pureLines.join("\n") + "\n" + exporter, ctx);

const {
  generateGalaxy, createNewGame, generateContracts,
  getMarketPrices, priceFromStock, initMarket, refreshMarket,
  doCombatRound, effectiveSkills, distParsecs,
  SHIPS, WEAPONS, COMMODITIES, MERCENARY_POOL,
} = ctx;

// ── Test framework ────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log("  ✓", name); passed++; }
  catch(e) { console.error("  ✗", name + "\n    → " + e.message); failed++; }
}
const assert = (c, msg) => { if (!c) throw new Error(msg || "assertion failed"); };

// ── Tests ─────────────────────────────────────────────────────────────────────
console.log("\n=== Space Trader — Test Suite ===");

// Galaxy
console.log("\nGalaxy (10 runs):");
for (let i = 0; i < 10; i++) {
  test(`run ${i+1}: connectivity · unique names · Flea range`, () => {
    const g = generateGalaxy();
    assert(g.length === 50, `size=${g.length}`);
    assert(g[0].name === "Lave", `first=${g[0].name}`);
    assert(g[0].x === 1000 && g[0].y === 1000, "Lave not at (1000,1000)");

    // Full connectivity via BFS at Gnat range (14 pc)
    const seen = new Set([0]), q = [0];
    while (q.length) {
      const id = q.shift();
      const cur = g[id];
      if (!cur) continue;
      g.filter(s => !seen.has(s.id) && Math.hypot(cur.x-s.x, cur.y-s.y) <= 140)
       .forEach(s => { seen.add(s.id); q.push(s.id); });
    }
    assert(seen.size === 50, `reachable=${seen.size}/50 from Lave`);

    // Unique names
    const names = g.map(s => s.name);
    assert(new Set(names).size === names.length, "duplicate system names");

    // Flea can reach ≥2 neighbours
    const flea = g.filter(s => s.id !== 0 && distParsecs(g[0], s) <= 5);
    assert(flea.length >= 2, `flea neighbours=${flea.length} (need ≥2)`);

    // All coords within 0-2000
    assert(g.every(s => s.x>=0&&s.x<=2000&&s.y>=0&&s.y<=2000), "coord out of bounds");

    // No system isolated beyond max jump (17 pc)
    for (const s of g) {
      const nbrs = g.filter(o => o.id!==s.id && distParsecs(o,s)<=17);
      assert(nbrs.length > 0, `${s.name} has no neighbour within 17 pc`);
    }
  });
}

// Game creation
console.log("\nGame creation:");
let game;
test("createNewGame completes", () => {
  game = createNewGame("Cmdr", { pilot:4, fighter:4, trader:4, engineer:4 });
});
test("credits = 1000", () => assert(game.credits === 1000));
test("starts at Lave", () => assert(game.currentSystem === 0 && game.galaxy[0].name === "Lave"));
test("pulse laser equipped", () => assert(game.weapons[0]?.id === "pulse"));
test("4 story quests", () => assert(game.quests.length === 4));
test("bulletin board has contracts", () => {
  assert(Array.isArray(game.bulletinBoard), "not array");
  assert(game.bulletinBoard.length >= 1, `count=${game.bulletinBoard.length}`);
});
test("Lave market has events array", () => {
  assert(Array.isArray(game.galaxy[0].market?.events));
});
test("skills sum to 16", () => {
  const s = game.skills;
  assert(s.pilot+s.fighter+s.trader+s.engineer === 16);
});
test("ship is Gnat", () => assert(game.ship.id === "gnat"));

// Market
console.log("\nMarket:");
test("all prices are positive numbers", () => {
  const p = getMarketPrices(game.galaxy[0].market);
  Object.entries(p).forEach(([id, v]) => {
    if (v !== null) assert(v > 0 && Number.isFinite(v), `${id}=${v}`);
  });
});
test("≥4 commodities available at Lave", () => {
  const p = getMarketPrices(game.galaxy[0].market);
  const n = Object.values(p).filter(v => v !== null).length;
  assert(n >= 4, `only ${n} available`);
});
test("buying lowers stock and raises price", () => {
  const m = game.galaxy[0].market;
  const c = COMMODITIES.find(x => m[x.id]?.stock > 1);
  assert(c, "no stocked commodity found");
  const { basePrice, stock, baseStock } = m[c.id];
  const p1 = priceFromStock(basePrice, stock, baseStock, [], c.id);
  const p2 = priceFromStock(basePrice, stock - 1, baseStock, [], c.id);
  assert(p2 >= p1, `price should rise: ${p1} → ${p2}`);
});
test("war event raises food price", () => {
  const war = [{ effects: { food: 1.4 } }];
  const m = game.galaxy[0].market;
  const c = COMMODITIES.find(x => x.id === "food" && m[x.id]?.basePrice);
  if (!c) return; // food not available at Lave — skip
  const { basePrice, stock, baseStock } = m[c.id];
  const normal = priceFromStock(basePrice, stock, baseStock, [], c.id);
  const war_p = priceFromStock(basePrice, stock, baseStock, war, c.id);
  assert(war_p > normal, `war: ${war_p} should > normal: ${normal}`);
});
test("market refreshes stock on revisit", () => {
  const m = { ...game.galaxy[0].market };
  const c = COMMODITIES.find(x => m[x.id]?.baseStock > 2);
  if (!c) return;
  m[c.id] = { ...m[c.id], stock: 0 };
  const r = refreshMarket(m);
  assert(r[c.id].stock > 0, "stock not restored");
});

// Contracts
console.log("\nContracts:");
test("generates 1-3 per system", () => {
  const cs = generateContracts(game.galaxy[0], game.galaxy, 1);
  assert(cs.length >= 1 && cs.length <= 3, `count=${cs.length}`);
});
test("all contract types and fields valid (20 runs)", () => {
  const valid = ["delivery","extermination","assassination"];
  for (let i = 0; i < 20; i++) {
    const cs = generateContracts(game.galaxy[i % 50], game.galaxy, i + 1);
    cs.forEach(c => {
      assert(valid.includes(c.type), `type=${c.type}`);
      assert(c.reward > 0, `reward=${c.reward}`);
      assert(c.deadline > 1, `deadline=${c.deadline}`);
      assert(c.emoji, "missing emoji");
      if (c.type === "delivery") {
        assert(game.galaxy.find(s => s.id === c.toId), `dest ${c.toId} not found`);
        assert(c.cargoQty >= 1, `qty=${c.cargoQty}`);
      }
      if (c.type === "extermination") {
        assert(c.killCount >= 2, `kills=${c.killCount}`);
      }
    });
  }
});

// Combat
console.log("\nCombat:");
const enemy0 = { hull:100, hullMax:100, shields:0, shieldsMax:0, weapon: WEAPONS[0] };
test("doCombatRound returns valid shape", () => {
  const r = doCombatRound(game, enemy0, "fight");
  assert(r.player && r.enemy && Array.isArray(r.log) && typeof r.ended === "boolean");
});
test("fighting eventually damages enemy", () => {
  let g = { ...game }, e = { ...enemy0 };
  let anyHit = false;
  for (let i = 0; i < 20; i++) {
    const r = doCombatRound(g, e, "fight");
    g = r.player; e = r.enemy;
    if (r.log.some(l => l.type === "good")) anyHit = true;
    if (r.ended) break;
  }
  assert(anyHit || e.hull < enemy0.hull, "never damaged enemy in 20 rounds");
});

// Skills
console.log("\nSkills:");
test("effectiveSkills ≥ base for all skills", () => {
  const eff = effectiveSkills(game);
  ["pilot","fighter","trader","engineer"].forEach(sk =>
    assert(eff[sk] >= game.skills[sk], `${sk}: ${eff[sk]} < ${game.skills[sk]}`)
  );
});
test("Alexia (fighter=9) boosts effective fighter", () => {
  const alexia = MERCENARY_POOL.find(m => m.name === "Alexia");
  assert(alexia, "Alexia not in MERCENARY_POOL");
  const g2 = { ...game, mercenaries: [alexia] };
  assert(effectiveSkills(g2).fighter >= 9, `fighter=${effectiveSkills(g2).fighter}`);
});

// Ship data
console.log("\nShip data:");
test("all ships have required fields including slots_c", () => {
  SHIPS.forEach(s => {
    assert(s.id && s.name && s.hull > 0 && s.cargo > 0, `${s.id} missing basic fields`);
    assert(typeof s.slots_c === "number", `${s.id} missing slots_c`);
    assert(s.jump > 0, `${s.id} jump=${s.jump}`);
    assert(s.price >= 0, `${s.id} price=${s.price}`);
  });
});
test("Flea=17pc · Gnat=14pc · Wasp=14pc", () => {
  assert(SHIPS.find(s => s.id === "flea")?.jump === 17, "Flea jump≠17");
  assert(SHIPS.find(s => s.id === "gnat")?.jump === 14, "Gnat jump≠14");
  assert(SHIPS.find(s => s.id === "wasp")?.jump === 14, "Wasp jump≠14");
});
test("Flea and Gnat have 0 crew quarters", () => {
  assert(SHIPS.find(s => s.id === "flea")?.slots_c === 0, "Flea crew≠0");
  assert(SHIPS.find(s => s.id === "gnat")?.slots_c === 0, "Gnat crew≠0");
});

// ── Summary ───────────────────────────────────────────────────────────────────
// ── UI smoke checks ───────────────────────────────────────────────────────────
const travelSrc = fs.readFileSync(path.join(__dirname, "src/tabs/TravelScreen.jsx"), "utf8");
test("TravelScreen shows Population field", () => {
  assert(travelSrc.includes("Population"), "Population row missing from TravelScreen");
  assert(travelSrc.includes("SIZES[selectedSys.size]"), "SIZES lookup missing");
});

console.log("\n" + "─".repeat(40));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("\nFix failures before committing.");
  process.exit(1);
} else {
  console.log("\n✓ All tests passed — safe to commit!");
}

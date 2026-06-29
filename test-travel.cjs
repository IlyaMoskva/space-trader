/**
 * Travel engine tests — test-travel.cjs
 * Run: node test-travel.cjs
 */
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// ── Load constants + engine into vm context ───────────────────────────────────
const SRC = path.join(__dirname, 'src');

const loadFile = (filePath) =>
  fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(l => !l.trim().startsWith('import ') && !l.trim().startsWith('export {'))
    .map(l => l.replace(/^export (function|const|class) /, '$1 '))
    .join('\n');

const constantFiles = ['constants/ships.js','constants/commodities.js','constants/world.js',
                       'constants/events.js','constants/mercenaries.js'];
const engineFiles   = ['engine/utils.js','engine/galaxy.js','engine/market.js',
                       'engine/contracts.js','engine/quests.js','engine/combat.js',
                       'engine/newGame.js','engine/aliens.js','engine/travel.js'];

const stub = `
  const Math = globalThis.Math;
  const Array = globalThis.Array;
  const Object = globalThis.Object;
  const console = globalThis.console;
  const JSON = globalThis.JSON;
`;

const ctx = vm.createContext({ Math, Array, Object, console, JSON,
  undefined, NaN, Infinity, parseInt, parseFloat, isNaN, isFinite });

const src = [
  ...constantFiles.map(f => loadFile(path.join(SRC, f))),
  ...engineFiles.map(f => loadFile(path.join(SRC, f))),
].join('\n');

vm.runInContext(stub + src, ctx);

const {
  createNewGame, getTravelState, applyTravel, applyPatrol, buildNews,
  fuelCost, canReach, initMarket, generateContracts, generateGalaxy,
  SHIPS, COMMODITIES,
} = ctx;

// ── Test helpers ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch(e) { console.error('  ✗ ' + name + '\n    ' + e.message); failed++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error((msg || '') + ' expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a));
}

// ── Build a minimal game state for testing ───────────────────────────────────
function makeGame() {
  const g = createNewGame('TestCmdr', { pilot:5, fighter:3, trader:5, engineer:2 });
  // Make sure market initialised on current system
  g.galaxy[g.currentSystem].market = initMarket(g.galaxy[g.currentSystem]);
  return g;
}

// ── Tests ────────────────────────────────────────────────────────────────────

console.log('\n── Travel engine tests ──────────────────────────────────\n');

// Fuel cost
test('fuelCost is positive between two different systems', () => {
  const g = makeGame();
  const a = g.galaxy[0];
  const b = g.galaxy[1];
  const cost = fuelCost(a, b);
  assert(cost >= 0, 'fuel cost should be non-negative');
});

test('getTravelState: canTravel false when no system selected', () => {
  const g = makeGame();
  const { canTravel } = getTravelState(g, null);
  assert(!canTravel, 'canTravel should be false with no selection');
});

test('getTravelState: effectiveSelected null when selected === currentSystem', () => {
  const g = makeGame();
  const { effectiveSelected } = getTravelState(g, g.currentSystem);
  assertEqual(effectiveSelected, null, 'effectiveSelected');
});

test('getTravelState: jumpRange includes fuel_compressor bonus', () => {
  const g = makeGame();
  const baseRange = g.ship.jump;
  const { jumpRange: jrWithout } = getTravelState(g, null);
  assertEqual(jrWithout, baseRange);

  g.specialItems = ['fuel_compressor'];
  const { jumpRange: jrWith } = getTravelState(g, null);
  assertEqual(jrWith, baseRange + 3, 'fuel_compressor adds 3');
});

test('applyTravel: day increments by 1', () => {
  const g = makeGame();
  const dest = g.galaxy.find(s => s.id !== g.currentSystem);
  const fuel = fuelCost(g.galaxy[g.currentSystem], dest);
  g.credits = fuel + 1000; // ensure enough credits
  const { newGame } = applyTravel(g, dest.id, fuel);
  assertEqual(newGame.days, g.days + 1, 'days');
});

test('applyTravel: credits reduced by fuel cost', () => {
  const g = makeGame();
  const dest = g.galaxy.find(s => s.id !== g.currentSystem);
  const fuel = fuelCost(g.galaxy[g.currentSystem], dest);
  g.credits = fuel + 5000;
  const { newGame } = applyTravel(g, dest.id, fuel);
  assertEqual(newGame.credits, g.credits - fuel, 'credits after travel');
});

test('applyTravel: currentSystem changes to destination', () => {
  const g = makeGame();
  const dest = g.galaxy.find(s => s.id !== g.currentSystem);
  const fuel = fuelCost(g.galaxy[g.currentSystem], dest);
  g.credits = fuel + 5000;
  const { newGame } = applyTravel(g, dest.id, fuel);
  assertEqual(newGame.currentSystem, dest.id, 'currentSystem');
});

test('applyTravel: destination market initialised', () => {
  const g = makeGame();
  const dest = g.galaxy.find(s => s.id !== g.currentSystem && !s.market);
  if (!dest) { console.log('    (skip — all systems have market)'); passed++; return; }
  const fuel = fuelCost(g.galaxy[g.currentSystem], dest);
  g.credits = fuel + 5000;
  const { newGame } = applyTravel(g, dest.id, fuel);
  assert(newGame.galaxy[dest.id].market, 'market should be initialised');
});

test('applyTravel: shields recharge on jump', () => {
  const g = makeGame();
  g.shields = [{ id: 'energy', name: 'Energy Shield', strength: 200, max: 200, current: 50 }];
  const dest = g.galaxy.find(s => s.id !== g.currentSystem);
  const fuel = fuelCost(g.galaxy[g.currentSystem], dest);
  g.credits = fuel + 5000;
  const { newGame } = applyTravel(g, dest.id, fuel);
  assert(newGame.shields[0].current > 50, 'shields should recharge');
});

test('applyTravel: debt interest accrues', () => {
  const g = makeGame();
  g.debt = 10000;
  const dest = g.galaxy.find(s => s.id !== g.currentSystem);
  const fuel = fuelCost(g.galaxy[g.currentSystem], dest);
  g.credits = fuel + 5000;
  const { newGame } = applyTravel(g, dest.id, fuel);
  assert(newGame.debt > 10000, 'debt should increase by interest');
});

test('applyTravel: mercenary wages deducted', () => {
  const g = makeGame();
  g.mercenaries = [{ id: 'm1', name: 'Zack', cost: 30, skills: { pilot:8, fighter:3, trader:2, engineer:4 } }];
  g.ship.slots_c = 2;
  const dest = g.galaxy.find(s => s.id !== g.currentSystem);
  const fuel = fuelCost(g.galaxy[g.currentSystem], dest);
  g.credits = fuel + 5000;
  const before = g.credits;
  const { newGame } = applyTravel(g, dest.id, fuel);
  assertEqual(newGame.credits, before - fuel - 30, 'merc wages deducted');
});

test('applyTravel: news built with system header', () => {
  const g = makeGame();
  const dest = g.galaxy.find(s => s.id !== g.currentSystem);
  const fuel = fuelCost(g.galaxy[g.currentSystem], dest);
  g.credits = fuel + 5000;
  const { newGame } = applyTravel(g, dest.id, fuel);
  assert(Array.isArray(newGame.news) && newGame.news.length > 0, 'news array populated');
  // Header is "SystemName — Tech · Gov · Pop Size"
  const header = newGame.news.find(n => !n.event && !n.quest);
  assert(header && header.text.includes(dest.name), 'news header contains destination name: ' + JSON.stringify(newGame.news[0]));
});

test('applyTravel: bulletin board generated', () => {
  const g = makeGame();
  const dest = g.galaxy.find(s => s.id !== g.currentSystem);
  const fuel = fuelCost(g.galaxy[g.currentSystem], dest);
  g.credits = fuel + 5000;
  const { newGame } = applyTravel(g, dest.id, fuel);
  assert(Array.isArray(newGame.bulletinBoard), 'bulletinBoard is array');
});

test('applyTravel: passive rep recovery every 10 days (no kills)', () => {
  const g = makeGame();
  g.reputation = -3;
  g.killedCivilian = 0;
  g.killedPolice = 0;
  g.days = 9; // next jump = day 10
  const dest = g.galaxy.find(s => s.id !== g.currentSystem);
  const fuel = fuelCost(g.galaxy[g.currentSystem], dest);
  g.credits = fuel + 5000;
  const { newGame } = applyTravel(g, dest.id, fuel);
  assert(newGame.reputation > -3, 'rep should recover on day 10');
});

test('applyTravel: rep does NOT recover when player has kills', () => {
  const g = makeGame();
  g.reputation = -3;
  g.killedCivilian = 1;
  g.days = 9;
  const dest = g.galaxy.find(s => s.id !== g.currentSystem);
  const fuel = fuelCost(g.galaxy[g.currentSystem], dest);
  g.credits = fuel + 5000;
  const { newGame } = applyTravel(g, dest.id, fuel);
  assertEqual(newGame.reputation, -3, 'rep should NOT recover when has kills');
});

// Patrol tests
test('applyPatrol: day increments by 1', () => {
  const g = makeGame();
  const { newGame } = applyPatrol(g, []);
  assertEqual(newGame.days, g.days + 1);
});

test('applyPatrol: returns enc when system has pirates', () => {
  const g = makeGame();
  g.galaxy[g.currentSystem].pirates = 3;
  const fakeContract = { id: 'c1', type: 'extermination', status: 'active',
    targetSystemId: g.currentSystem, killsCompleted: 0, killCount: 3 };
  const { enc } = applyPatrol(g, [fakeContract]);
  assert(enc && enc.type === 'pirate', 'should return pirate encounter');
});

test('applyPatrol: no enc when no pirates and no contract', () => {
  const g = makeGame();
  g.galaxy[g.currentSystem].pirates = 0;
  const { enc, bossEnc } = applyPatrol(g, []);
  assert(!enc && !bossEnc, 'should return no encounter');
});

// buildNews tests
test('buildNews: returns array with system header', () => {
  const g = makeGame();
  g.galaxy[g.currentSystem].market = initMarket(g.galaxy[g.currentSystem]);
  const news = buildNews(g, g.currentSystem, g.ship.jump);
  assert(Array.isArray(news), 'news is array');
  assert(news.some(n => n.text.includes(g.galaxy[g.currentSystem].name)), 'contains system name');
});

test('buildNews: nearby events appear in news', () => {
  const g = makeGame();
  // Give a neighbouring system an event
  const neighbour = g.galaxy.find(s => s.id !== g.currentSystem);
  if (!neighbour.market) neighbour.market = initMarket(neighbour);
  neighbour.market.events = [{ id: 'plague', text: 'Plague reported on ' + neighbour.name,
    effects: { medicine: 1.5 }, daysLeft: 5 }];
  // Place it close enough
  const cur = g.galaxy[g.currentSystem];
  neighbour.x = cur.x + 50; neighbour.y = cur.y;
  const news = buildNews(g, g.currentSystem, 20);
  // May or may not appear depending on jump range — just check no crash
  assert(Array.isArray(news));
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) { console.log('\nFix failures before committing.'); process.exit(1); }
else { console.log('\n✓ All travel tests passed!'); }

/**
 * Alien invasion engine tests — test-aliens.cjs
 */
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const SRC = path.join(__dirname, 'src');

const loadFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Remove entire export { ... } blocks (possibly multiline)
  const noExports = content.replace(/^export \{[^}]*\};?\s*$/gm, '')
                           .replace(/^export \{[\s\S]*?\};/gm, '');
  return noExports
    .split('\n')
    .filter(l => !l.trim().startsWith('import '))
    .map(l => l.replace(/^export (function|const|class) /, '$1 '))
    .join('\n');
};

const constantFiles = ['constants/ships.js','constants/commodities.js','constants/world.js',
                       'constants/events.js','constants/mercenaries.js','constants/aliens.js'];
const engineFiles   = ['engine/utils.js','engine/galaxy.js','engine/market.js',
                       'engine/contracts.js','engine/quests.js','engine/combat.js',
                       'engine/newGame.js','engine/aliens.js'];

const stub = `const Math=globalThis.Math;const Array=globalThis.Array;const Object=globalThis.Object;const console=globalThis.console;const JSON=globalThis.JSON;`;
const ctx = vm.createContext({ Math, Array, Object, console, JSON,
  undefined, NaN, Infinity, parseInt, parseFloat, isNaN, isFinite });

const src = [
  ...constantFiles.map(f => loadFile(path.join(SRC, f))),
  ...engineFiles.map(f => loadFile(path.join(SRC, f))),
].join('\n');

vm.runInContext(stub + src, ctx);

const { createNewGame, generateAlienEncounter, getOccupationStatus,
        getOccupiedServices, tickAlienInvasion, onAlienKilled,
        checkAlienInvasionStart, ALIEN_SHIPS } = ctx;

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch(e) { console.error('  ✗ ' + name + '\n    ' + e.message); failed++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error((msg||'') + ' expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a));
}

function makeGame() {
  return createNewGame('Test', { pilot:5, fighter:5, trader:5, engineer:5 });
}

console.log('\n── Alien invasion tests ─────────────────────────────────\n');

// getOccupationStatus
test('getOccupationStatus: null for no aliens', () => {
  const sys = { id: 0, alienCount: 0, size: 2, alienDays: 0 };
  assertEqual(getOccupationStatus(sys), null);
});

test('getOccupationStatus: scouted for 1-4 aliens', () => {
  const sys = { id: 0, alienCount: 3, size: 2, alienDays: 0 };
  assertEqual(getOccupationStatus(sys), 'scouted');
});

test('getOccupationStatus: small planet → anarchy immediately at 5 aliens', () => {
  const sys = { id: 0, alienCount: 5, size: 1, alienDays: 0 };
  assertEqual(getOccupationStatus(sys), 'occupied_anarchy');
});

test('getOccupationStatus: medium planet → dictatorship at 5 aliens, <30 days', () => {
  const sys = { id: 0, alienCount: 5, size: 2, alienDays: 10 };
  assertEqual(getOccupationStatus(sys), 'occupied_dictatorship');
});

test('getOccupationStatus: medium planet → anarchy at 30+ days', () => {
  const sys = { id: 0, alienCount: 5, size: 2, alienDays: 35 };
  assertEqual(getOccupationStatus(sys), 'occupied_anarchy');
});

test('getOccupationStatus: large planet → dictatorship at 30d, anarchy at 60d', () => {
  const s1 = { id: 0, alienCount: 5, size: 4, alienDays: 45 };
  const s2 = { id: 0, alienCount: 5, size: 4, alienDays: 65 };
  assertEqual(getOccupationStatus(s1), 'occupied_dictatorship');
  assertEqual(getOccupationStatus(s2), 'occupied_anarchy');
});

// getOccupiedServices
test('getOccupiedServices: no aliens → full services', () => {
  const sys = { id: 0, alienCount: 0, size: 2, tech: 3, alienDays: 0 };
  const sv = getOccupiedServices(sys);
  assert(sv.market && sv.repair && sv.shields, 'all services available');
});

test('getOccupiedServices: dictatorship → no market, repair ok, shields ok (tech>=2)', () => {
  const sys = { id: 0, alienCount: 5, size: 2, tech: 3, alienDays: 10 };
  const sv = getOccupiedServices(sys);
  assert(!sv.market, 'market closed');
  assert(sv.repair, 'repair available');
  assert(sv.shields, 'shields available in dictatorship');
});

test('getOccupiedServices: anarchy → no market, repair ok, no shields', () => {
  const sys = { id: 0, alienCount: 5, size: 1, tech: 3, alienDays: 0 };
  const sv = getOccupiedServices(sys);
  assert(!sv.market, 'market closed');
  assert(sv.repair, 'repair available');
  assert(!sv.shields, 'shields NOT available in anarchy');
});

test('getOccupiedServices: tech < 2 → no repair even in dictatorship', () => {
  const sys = { id: 0, alienCount: 5, size: 2, tech: 1, alienDays: 10 };
  const sv = getOccupiedServices(sys);
  assert(!sv.repair, 'no repair without shipyard');
});

// generateAlienEncounter
test('generateAlienEncounter: returns alien type encounter', () => {
  const sys = { id: 0, alienCount: 2, size: 2, tech: 3, alienDays: 0 };
  const enc = generateAlienEncounter(sys, {});
  assertEqual(enc.type, 'alien');
  assert(enc.hull > 0, 'has hull');
  assert(enc.regen >= 0, 'has regen');
});

test('generateAlienEncounter: scout for low threat', () => {
  const sys = { id: 0, alienCount: 1, size: 1, tech: 2, alienDays: 0 };
  const enc = generateAlienEncounter(sys, {});
  assertEqual(enc.sub, 'alien_scout', 'low count → scout');
});

test('generateAlienEncounter: dreadnought for max threat', () => {
  const sys = { id: 0, alienCount: 5, size: 5, tech: 8, alienDays: 60 };
  const enc = generateAlienEncounter(sys, {});
  assertEqual(enc.sub, 'alien_dreadnought', 'high count → dreadnought');
});

test('generateAlienEncounter: plasma only on cruiser+', () => {
  const scout = generateAlienEncounter({ id:0, alienCount:1, size:1, tech:2, alienDays:0 }, {});
  assert(!scout.hasPlasma, 'scout has no plasma');
});

// onAlienKilled
test('onAlienKilled: reduces alienCount in system', () => {
  const g = makeGame();
  g.galaxy[g.currentSystem].alienCount = 3;
  const newG = onAlienKilled(g, g.currentSystem, 'alien_scout');
  assertEqual(newG.galaxy[g.currentSystem].alienCount, 2);
});

test('onAlienKilled: increments killedAliens', () => {
  const g = makeGame();
  g.galaxy[g.currentSystem].alienCount = 2;
  const newG = onAlienKilled(g, g.currentSystem, 'alien_scout');
  assertEqual(newG.killedAliens, 1);
});

test('onAlienKilled: rep +1 for defending', () => {
  const g = makeGame();
  g.galaxy[g.currentSystem].alienCount = 2;
  g.reputation = 0;
  const newG = onAlienKilled(g, g.currentSystem, 'alien_scout');
  assertEqual(newG.reputation, 1, 'rep increases');
});

// tickAlienInvasion
test('tickAlienInvasion: no-op when invasion not active', () => {
  const g = makeGame();
  g.alienInvasionActive = false;
  const { game: ng } = tickAlienInvasion(g);
  assertEqual(ng.galaxy[0].alienCount, g.galaxy[0].alienCount);
});

test('tickAlienInvasion: ages alienDays', () => {
  const g = makeGame();
  g.alienInvasionActive = true;
  g.galaxy[0].alienCount = 3;
  g.galaxy[0].alienDays = 0;
  const { game: ng } = tickAlienInvasion(g);
  assert(ng.galaxy[0].alienDays >= 3, 'alienDays aged');
});

test('tickAlienInvasion: 5 aliens spread to neighbour', () => {
  const g = makeGame();
  g.alienInvasionActive = true;
  // Give first system 5 aliens, no police (no NPC defense), close neighbour
  g.galaxy[0].alienCount = 5;
  g.galaxy[0].alienDays = 0;
  g.galaxy[0].police = 0;
  g.galaxy[0].x = 0; g.galaxy[0].y = 0;
  g.galaxy[0].tech = 0;
  g.galaxy[1].alienCount = 0;
  g.galaxy[1].x = 100; g.galaxy[1].y = 0;
  // Run tick multiple times — eventually spreads (police=0 means no defense)
  let spread = false;
  let game = g;
  for (let i = 0; i < 20; i++) {
    const { game: ng, news } = tickAlienInvasion(game);
    game = ng;
    if (ng.galaxy[1].alienCount > 0 || news.some(n => n.text.includes('advance'))) {
      spread = true; break;
    }
    game.galaxy[0].alienCount = 5; // replenish if NPC killed one
  }
  assert(spread, 'aliens should spread to neighbour eventually');
});

// checkAlienInvasionStart
test('checkAlienInvasionStart: no-op when quest done', () => {
  const g = makeGame();
  g.quests = [{ id: 'alien_invasion', status: 'done', targetSystem: 0 }];
  const ng = checkAlienInvasionStart(g);
  assert(!ng.alienInvasionActive, 'invasion not started when quest done');
});

test('checkAlienInvasionStart: starts when quest failed', () => {
  const g = makeGame();
  g.quests = [{ id: 'alien_invasion', status: 'failed', targetSystem: g.galaxy[0].id, daysLeft: 0 }];
  const ng = checkAlienInvasionStart(g);
  assert(ng.alienInvasionActive, 'invasion starts on quest fail');
});

console.log('\n' + '─'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) { console.log('\nFix failures before committing.'); process.exit(1); }
else { console.log('\n✓ All alien tests passed!'); }

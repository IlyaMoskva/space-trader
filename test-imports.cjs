/**
 * Static import checker — verifies all identifiers used in each file
 * are either imported, defined locally, or are React/JS builtins.
 * Run: node test-imports.cjs
 */
const fs   = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');

// JS/React globals — never need importing
const GLOBALS = new Set([
  'undefined','null','true','false','NaN','Infinity','console','Math','Array',
  'Object','String','Number','Boolean','Date','JSON','Promise','Set','Map',
  'parseInt','parseFloat','isNaN','isFinite','setTimeout','clearTimeout',
  'setInterval','clearInterval','fetch','window','document','navigator',
  'localStorage','sessionStorage','alert','confirm','performance',
  'React','useState','useEffect','useCallback','useRef','useReducer',
  'Fragment','createContext','useContext','forwardRef',
  // JSX intrinsics
  'div','span','button','input','textarea','select','option','form',
  'h1','h2','h3','p','ul','li','svg','rect','polygon','ellipse','circle',
  'g','path','text','style','img','a','label','br','hr','pre','code',
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function walkSrc() {
  const files = [];
  function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory() && f !== 'node_modules') walk(full);
      else if (f.endsWith('.jsx') || f.endsWith('.js')) files.push(full);
    }
  }
  walk(SRC);
  return files;
}

function getImports(content) {
  const imported = new Set();
  // named: import { A, B as C } from ...
  for (const m of content.matchAll(/import\s+\{([^}]+)\}/g))
    for (const n of m[1].split(','))
      imported.add(n.trim().split(/\s+as\s+/)[0].trim());
  // default: import Foo from ...
  for (const m of content.matchAll(/import\s+(\w+)\s+from/g))
    imported.add(m[1]);
  return imported;
}

function getDefined(content) {
  const defined = new Set();
  for (const m of content.matchAll(/(?:function|class)\s+(\w+)/g))  defined.add(m[1]);
  for (const m of content.matchAll(/(?:const|let|var)\s+(\w+)/g))   defined.add(m[1]);
  for (const m of content.matchAll(/export\s+default\s+function\s+(\w+)/g)) defined.add(m[1]);
  return defined;
}

// All exported names across the project
function getAllExports() {
  const exports = new Set();
  for (const file of walkSrc()) {
    const content = fs.readFileSync(file, 'utf8');
    for (const m of content.matchAll(/export\s+\{([^}]+)\}/g))
      for (const n of m[1].split(','))
        exports.add(n.trim().split(/\s+as\s+/)[0].trim());
    for (const m of content.matchAll(/export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g))
      exports.add(m[1]);
  }
  return exports;
}

// Barrel index files — only re-export, don't use identifiers
const BARREL_FILES = new Set(['index.js', 'index.jsx']);

// ── Main ─────────────────────────────────────────────────────────────────────

const allExports = getAllExports();
const errors = [];

for (const file of walkSrc()) {
  const rel   = file.replace(SRC + '/', '');
  const fname = path.basename(file);
  if (BARREL_FILES.has(fname)) continue;

  const content  = fs.readFileSync(file, 'utf8');
  // Strip strings and comments to avoid false positives
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, '""')
    .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""')
    .replace(/`[^`\\]*(?:\\.[^`\\]*)*`/g, '""');

  const imported = getImports(content);
  const defined  = getDefined(stripped);
  const available = new Set([...imported, ...defined, ...GLOBALS]);

  // Find all identifier tokens that are in allExports but not available
  for (const name of allExports) {
    if (available.has(name)) continue;
    if (name.length < 3) continue;
    // Must appear as a standalone identifier (word boundary) in stripped code
    const re = new RegExp(`\\b${name}\\b`);
    if (re.test(stripped)) {
      errors.push({ file: rel, name });
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
const unique = [...new Set(errors.map(e => `${e.file}: ${e.name}`))].sort();

if (unique.length === 0) {
  console.log('✓ All imports OK');
  process.exit(0);
} else {
  console.log(`✗ ${unique.length} missing import(s):\n`);
  unique.forEach(e => console.log('  ' + e));
  process.exit(1);
}

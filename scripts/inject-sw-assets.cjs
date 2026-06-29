/**
 * Post-build script: injects hashed JS/CSS filenames into dist/sw.js
 * Run automatically after vite build via package.json postbuild
 */
const fs   = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const SW   = path.join(DIST, 'sw.js');

if (!fs.existsSync(SW)) {
  console.error('dist/sw.js not found — run vite build first');
  process.exit(1);
}

// Find all hashed JS/CSS assets in dist/assets/
const assetsDir = path.join(DIST, 'assets');
const hashedFiles = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir)
      .filter(f => /\.(js|css)$/.test(f))
      .map(f => `  "/space-trader/assets/${f}",`)
  : [];

console.log(`  Found ${hashedFiles.length} hashed assets`);

// Replace placeholder comment with actual file list
let sw = fs.readFileSync(SW, 'utf8');
sw = sw.replace(
  '  // __HASHED_ASSETS__ — replaced by inject-sw-version.cjs',
  hashedFiles.join('\n')
);

fs.writeFileSync(SW, sw);
console.log('  ✓ sw.js updated with hashed assets');

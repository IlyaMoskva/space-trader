/**
 * Bumps SW cache version in public/sw.js to match package.json version.
 * Run: node scripts/bump-sw-version.cjs
 * Called automatically on `npm version patch/minor/major`
 */
const fs  = require('fs');
const path = require('path');

const pkg     = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = pkg.version;
const SW      = path.join(__dirname, '..', 'public', 'sw.js');

let sw = fs.readFileSync(SW, 'utf8');
sw = sw.replace(
  /const CACHE_NAME = "space-trader-v[^"]+";/,
  `const CACHE_NAME = "space-trader-v${version}";`
);
fs.writeFileSync(SW, sw);
console.log(`✓ SW cache bumped to space-trader-v${version}`);

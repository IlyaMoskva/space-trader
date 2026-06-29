// ── Alien ship types ──────────────────────────────────────────────────────────
const ALIEN_SHIPS = [
  {
    id: "alien_scout",
    name: "Alien Scout",
    emoji: "👾",
    hull: 80, hullMax: 80,
    weapons: 1,
    pulseDamage: [5, 15],
    hasPlasma: false,
    regen: 3,          // hp restored each round
    fleeHard: true,    // hard to escape from (fast)
    reward: 800,
    artifactChance: 0.4,
  },
  {
    id: "alien_cruiser",
    name: "Alien Cruiser",
    emoji: "👾👾",
    hull: 180, hullMax: 180,
    weapons: 2,
    pulseDamage: [5, 15],
    hasPlasma: true,
    plasma: { damage: 60, chance: 0.25 },
    regen: 5,
    fleeHard: false,
    reward: 2000,
    artifactChance: 0.6,
  },
  {
    id: "alien_dreadnought",
    name: "Alien Dreadnought",
    emoji: "👾👾👾",
    hull: 350, hullMax: 350,
    weapons: 3,
    pulseDamage: [8, 20],
    hasPlasma: true,
    plasma: { damage: 100, chance: 0.20 },
    regen: 8,
    fleeHard: false,   // slow but unstoppable
    reward: 5000,
    artifactChance: 0.8,
  },
];

// ── Occupation status thresholds ──────────────────────────────────────────────
// alienDays: days since first alien arrived
const OCCUPATION_STAGES = {
  scouted:               0,   // 1-4 aliens, market works, warnings in news
  occupied_anarchy:     30,   // 5 aliens, small planets: market gone immediately
  occupied_dictatorship: 60,  // medium planets reach anarchy at 30d, dictatorship phase
};

// Planet size thresholds for occupation speed
// size 0-1 (Tiny/Small): anarchy immediately at 5 aliens
// size 2-3 (Medium/Large): anarchy at 30 days
// size 4-5 (Huge/Gargantuan): dictatorship first, anarchy at 60 days
const OCCUPATION_SPEED = {
  fast:   [0, 1],   // Tiny, Small
  medium: [2, 3],   // Medium, Large
  slow:   [4, 5],   // Huge, Gargantuan
};

// ── Alien weapon constants ────────────────────────────────────────────────────
const ALIEN_DISRUPTOR = {
  id: "alien_disruptor",
  name: "Alien Disruptor",
  damage: 25,       // base damage — x2 vs aliens
  vsAlienMultiplier: 2,
  price: 45000,
  minTech: 7,
  emoji: "🔫",
};

// ── Alien gadgets ─────────────────────────────────────────────────────────────
const ALIEN_GADGETS = [
  {
    id: "regen_inhibitor",
    name: "Regen Inhibitor",
    desc: "Blocks alien hull regeneration in combat",
    artifactsRequired: 10,
    price: 60000,
    minTech: 8,
    emoji: "⚗️",
  },
  {
    id: "cloaking_device",
    name: "Cloaking Device",
    desc: "+40% flee chance vs aliens",
    artifactsRequired: 5,
    price: 35000,
    minTech: 7,
    emoji: "🫥",
  },
];

// ── Alien artifact ────────────────────────────────────────────────────────────
const ALIEN_ARTIFACT = {
  id: "alien_artifact",
  name: "Alien Artifact",
  sellPrice: 3000,    // base sell price at any non-occupied planet
  questPrice: 5000,   // price when handed to scientist quest
};

export { ALIEN_SHIPS, ALIEN_DISRUPTOR, ALIEN_GADGETS, ALIEN_ARTIFACT,
         OCCUPATION_STAGES, OCCUPATION_SPEED };

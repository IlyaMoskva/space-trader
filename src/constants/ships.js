// Auto-extracted from App.jsx

const SHIPS = [
  { id: "flea",        name: "Flea",        hull: 25,  cargo: 10, slots_w: 0, slots_s: 0, slots_g: 1, slots_c: 0, jump: 17, price: 2000,   emoji: "🛸" },
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
  { id: "pulse",           name: "Pulse Laser",      damage: 15, price: 2000,  minTech: 0 },
  { id: "beam",            name: "Beam Laser",        damage: 25, price: 12000, minTech: 2 },
  { id: "military",        name: "Military Laser",    damage: 35, price: 35000, minTech: 5 },
  { id: "alien_disruptor", name: "Alien Disruptor",   damage: 25, price: 45000, minTech: 7,
    vsAlienMultiplier: 2, special: true },
];

const SHIELDS = [
  { id: "energy",     name: "Energy Shield",     strength: 100, price: 5000,  minTech: 2 },
  { id: "reflective", name: "Reflective Shield",  strength: 200, price: 25000, minTech: 5 },
];

const GADGETS = [
  { id: "cargo5",    name: "Cargo Bay +5",       price: 8000,  desc: "+5 cargo" },
  { id: "nav_comp",  name: "Nav Computer",        price: 15000, desc: "+1 pilot" },
  { id: "tgt_comp",  name: "Targeting System",    price: 20000, desc: "+1 fighter" },
  { id: "dmg_ctrl",      name: "Damage Control",   price: 15000, desc: "+1 engineer" },
  { id: "escape_pod",    name: "Escape Pod",        price: 10000, desc: "Survive destruction" },
  { id: "regen_inhibitor",  name: "Regen Inhibitor",  price: 60000, minTech: 8, desc: "Blocks alien hull regen" },
  { id: "cloaking_device",  name: "Cloaking Device",  price: 35000, minTech: 7, desc: "+40% flee vs aliens" },
  { id: "repair_droid",     name: "Repair Droid",      price: 30000, minTech: 6, desc: "+3 hull/round in combat" },
];

export { SHIPS, WEAPONS, SHIELDS, GADGETS };

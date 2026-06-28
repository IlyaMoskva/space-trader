// Auto-extracted from App.jsx

const EVENT_TEMPLATES = [
  // War: food+, water+, medicine+, weapons+, luxury-
  { id: "war",       text: "{sys} is at war!",
    effects: { food: 1.4, water: 1.3, medicine: 1.6, firearms: 1.5, firearms2: 1.5, games: 0.5 },
    duration: [4, 8], pirates: +1 },
  // Drought: food+, water++
  { id: "drought",   text: "Drought grips {sys}.",
    effects: { water: 2.0, food: 1.6, medicine: 1.2 },
    duration: [3, 6] },
  // Plague: medicine+, food+, water+ — toned down from 2.2 to 1.7
  { id: "plague",    text: "Plague reported on {sys}.",
    effects: { medicine: 1.7, food: 1.3, water: 1.3, robots: 0.85 },
    duration: [3, 5] },
  // Bountiful harvest: food-, water-, furs-
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
  // Economic boom: games+, medicine-, machines-
  { id: "boom",      text: "Economic boom on {sys}.",
    effects: { games: 1.4, medicine: 0.8, machines: 0.9 },
    duration: [3, 5] },
  // Ore strike: ore-
  { id: "orestrike", text: "Rich ore deposits found near {sys}.",
    effects: { ore: 0.5, machines: 0.9 },
    duration: [3, 6] },
  // Drug crackdown: narcotics++, illegal weapons+
  { id: "crackdown", text: "Drug crackdown on {sys}.",
    effects: { narcotics: 1.8, firearms2: 1.3 },
    duration: [2, 5] },
  // Cold winter: furs++, medicine+, food+, water+ (hot drinks, heating)
  { id: "coldwinter", text: "Harsh winter strikes {sys}.",
    effects: { furs: 1.8, medicine: 1.2, food: 1.3, water: 1.15 },
    duration: [3, 6] },
  // Flood: water glut but food+, machines+ (damage), ore- (flooded mines)
  { id: "flood",     text: "Floods devastate {sys} lowlands.",
    effects: { water: 0.5, food: 1.4, machines: 1.3, ore: 0.8 },
    duration: [2, 5] },
  // Festival: games+, food+ (feasting), medicine- (mood high)
  { id: "festival",  text: "Grand festival celebrated on {sys}.",
    effects: { games: 1.5, food: 1.2, medicine: 0.85, furs: 1.2 },
    duration: [2, 3] },
  // Industrial accident: machines+, robots+ (repair demand), medicine+
  { id: "accident",  text: "Industrial accident disrupts {sys} output.",
    effects: { machines: 1.4, robots: 1.3, medicine: 1.25 },
    duration: [2, 4] },
];

const CONTRACT_NAMES = {
  delivery: [
    "Urgent medical supplies",
    "Diplomatic pouch",
    "Rare crystal shipment",
    "Scientific equipment",
    "Frozen specimens",
    "Military rations",
    "Encrypted data core",
    "Luxury goods package",
    "Spare reactor parts",
    "Agricultural seeds",
  ],
  extermination: [
    "Pirate menace terrorises shipping",
    "Raiders intercepted near jump point",
    "Bounty on local pirate gang",
    "Clear the shipping lanes",
    "Eliminate pirate outpost",
  ],
  assassination: [
    "Rogue commander",
    "Pirate kingpin",
    "Smuggler lord",
    "Wanted arms dealer",
    "Fugitive warlord",
  ],
};

export { EVENT_TEMPLATES, CONTRACT_NAMES };

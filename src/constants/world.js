// Auto-extracted from App.jsx

const GOV_TYPES = ["Anarchy","Feudal","Mult-Gov","Dictatorship","Communist","Confed","Democracy","Corp. State"];

const TECH_LEVELS = ["Pre-Ag","Agri","Medi","Medieval","Renaiss","Early Ind","Industrial","Post-Ind","Hi-Tech"];

const SIZES = ["Tiny","Small","Medium","Large","Huge","Gargantuan"];

const SYSTEM_NAMES = [
  "Lave","Zaonce","Diso","Leesti","Reorte","Tionisla","Riedquat","Uszaa","Bierle","Qucerat",
  "Xeer","Vetitice","Mirece","Onrira","Celabile","Sotibe","Aronar","Oresri","Teaatis",
  "Biarge","Edxelin","Orarra","Digebiti","Ededleen","Gemaza","Mautice","Tibicele","Celeisen",
  "Solati","Nusera","Isveve","Usreor","Tiqua","Cemave","Maregees","Atbevete","Reorade","Rexebe",
  "Vequess","Labeve","Tiveve","Razorce","Solrace","Ceesxe","Tibecea","Orvequ",
  "Nexus","Kravat","Gemulon","Utopia","Baratas","Melina","Zuul","Orti","Ceedra",
  "Xelal","Virexe","Orexe","Lesoso","Quator","Velass","Razaor","Morala","Tionat","Celaran",
  "Diqua","Rigeza","Maatis","Tiorqu","Verees","Solave","Cearso","Xeoner","Bibege","Orrere",
  "Leosis","Cearge","Riredi","Orqueve","Teanre","Dixees","Solave2","Biarge2","Ceinso","Usveor",
];

const SPECIAL_RES = ["NOTHING","MINERAL RICH","MINERAL POOR","DESERT","LOTS OF WATER","RICH SOIL","POOR SOIL","RICH FAUNA","LIFELESS","WEIRD MUSHROOMS","SPECIAL"];

const COMMODITY_TECH_PROFILE = {
  water:     { produced: [0,1,2],    consumed: [6,7,8] },  // cheap on agri, dear on hi-tech
  furs:      { produced: [0,1,2,3],  consumed: [5,6,7,8] },
  food:      { produced: [1,2,3],    consumed: [6,7,8] },
  ore:       { produced: [2,3,4],    consumed: [5,6,7,8] },
  games:     { produced: [4,5],      consumed: [0,1,2] },
  firearms:  { produced: [4,5,6],    consumed: [0,1,2,3] },
  medicine:  { produced: [5,6,7],    consumed: [0,1,2,3,4] },
  machines:  { produced: [4,5,6],    consumed: [0,1,2,3] },
  robots:    { produced: [7,8],      consumed: [0,1,2,3,4] },
  narcotics: { produced: [5,6],      consumed: [] },
  firearms2: { produced: [5,6,7],    consumed: [0,1,2] },
};

const GOV_CATEGORY_MOD = {
  // Anarchy (0): cheap everything, drugs open
  0: { raw: 0.75, industrial: 0.85, luxury: 0.90, weapons: 0.80, drugs: 0.90, medicine: 0.90 },
  // Feudal (1): cheap raw, pricey luxury
  1: { raw: 0.80, industrial: 0.90, luxury: 1.20, weapons: 0.95, drugs: 1.10, medicine: 1.00 },
  // Multi-Gov (2): slight chaos, moderate everything
  2: { raw: 0.95, industrial: 1.00, luxury: 1.00, weapons: 1.05, drugs: 1.10, medicine: 1.00 },
  // Dictatorship (3): cheap weapons, expensive drugs (black market suppressed)
  3: { raw: 0.90, industrial: 0.95, luxury: 0.90, weapons: 0.80, drugs: 1.40, medicine: 1.05 },
  // Communist (4): subsidised raw & medicine, expensive luxury
  4: { raw: 0.75, industrial: 0.90, luxury: 1.30, weapons: 1.10, drugs: 1.50, medicine: 0.75 },
  // Confederacy (5): balanced
  5: { raw: 0.95, industrial: 1.00, luxury: 1.05, weapons: 1.00, drugs: 1.20, medicine: 1.00 },
  // Democracy (6): regulated — pricier overall, medicine fair
  6: { raw: 1.05, industrial: 1.10, luxury: 1.15, weapons: 1.20, drugs: 1.60, medicine: 1.00 },
  // Corporate (7): premium on luxury, cheap industrial
  7: { raw: 1.00, industrial: 0.90, luxury: 1.25, weapons: 1.05, drugs: 1.30, medicine: 1.10 },
  // Theocracy (8) — extra: drugs VERY expensive (ritual/forbidden)
  8: { raw: 0.90, industrial: 1.00, luxury: 0.95, weapons: 1.10, drugs: 2.20, medicine: 1.05 },
};

export { GOV_TYPES, TECH_LEVELS, SIZES, SYSTEM_NAMES, SPECIAL_RES, COMMODITY_TECH_PROFILE, GOV_CATEGORY_MOD };

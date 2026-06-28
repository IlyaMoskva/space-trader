import { SHIPS, WEAPONS } from '../constants/ships.js';
import { COMMODITIES } from '../constants/commodities.js';
import { GOV_TYPES, TECH_LEVELS, SIZES } from '../constants/world.js';
import { rnd, pick } from './utils.js';
import { generateGalaxy } from './galaxy.js';
import { initMarket, generateSystemEvents } from './market.js';
import { generateContracts } from './contracts.js';
import { generateQuests } from './quests.js';

function createNewGame(name, skills) {
  const galaxy = generateGalaxy();
  const startSys = galaxy[0];
  startSys.visited = true;
  startSys.market = initMarket(startSys);
  const quests = generateQuests(galaxy);
  const startEvents = startSys.market.events || [];
  const startNews = [
    { text: "Welcome to Lave. " + TECH_LEVELS[startSys.tech] + " economy, " + GOV_TYPES[startSys.gov] + " government." },
    ...startEvents.map(e => ({ text: e.text, event: true })),
    { text: "Special contracts become available as you explore the galaxy." },
  ];
  return {
    commander: name,
    credits: 1000,
    debt: 0,
    days: 1,
    killed: 0,
    policeRecord: 0,
    reputation: 0,
    skills: { pilot: skills.pilot, fighter: skills.fighter, trader: skills.trader, engineer: skills.engineer },
    ship: { ...SHIPS[1] },
    weapons: [{ ...WEAPONS[0] }],
    shields: [],
    gadgets: [],
    cargo: [],
    cargoCapacity: 15,
    hull: 100,
    hullMax: 100,
    currentSystem: 0,
    galaxy,
    quests,
    log: [{ type: "info", text: "Day 1: Commander " + name + " begins trading career." }],
    specialItems: [],
    news: startNews,
    activeContracts: [],
    bulletinBoard: generateContracts(startSys, galaxy, 1),
    reputation: 0,
  };
}

export { createNewGame };

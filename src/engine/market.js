import { COMMODITIES } from '../constants/commodities.js';
import { GOV_TYPES, COMMODITY_TECH_PROFILE, GOV_CATEGORY_MOD } from '../constants/world.js';
import { EVENT_TEMPLATES } from '../constants/events.js';
import { rnd, pick } from './utils.js';

function getCommodityCategory(id) {
  if (["water","furs","food","ore"].includes(id)) return "raw";
  if (["machines","robots"].includes(id)) return "industrial";
  if (["games"].includes(id)) return "luxury";
  if (["firearms","firearms2"].includes(id)) return "weapons";
  if (["narcotics"].includes(id)) return "drugs";
  if (["medicine"].includes(id)) return "medicine";
  return "industrial";
}

function generateSystemEvents(system) {
  const events = [];
  const count = Math.random() < 0.4 ? 0 : Math.random() < 0.6 ? 1 : 2;
  const eligible = EVENT_TEMPLATES.filter(e => {
    if (e.id === "techboom"  && system.tech < 4) return false;
    if (e.id === "harvest"   && system.tech > 5) return false;
    if (e.id === "orestrike" && system.tech > 6) return false;
    if (e.id === "accident"  && system.tech < 3) return false; // no industry to accident
    if (e.id === "festival"  && system.gov === 0) return false; // anarchy has no organised festivals
    if (e.id === "flood"     && system.special === 4) return false; // desert planets don't flood
    return true;
  });
  const used = new Set();
  for (let i = 0; i < count; i++) {
    const e = pick(eligible.filter(e => !used.has(e.id)));
    if (!e) break;
    used.add(e.id);
    events.push({
      id: e.id,
      text: e.text.replace("{sys}", system.name),
      effects: e.effects,
      daysLeft: rnd(e.duration[0], e.duration[1]),
      pirates: e.pirates || 0,
    });
  }
  return events;
}

function applyEventEffects(basePrice, commodityId, events) {
  if (!events || events.length === 0) return basePrice;
  let mult = 1.0;
  events.forEach(ev => {
    if (ev.effects[commodityId]) mult *= ev.effects[commodityId];
  });
  return Math.round(basePrice * mult);
}

function getBaseStock(system, commodity) {
  if (commodity.minTech > system.tech) return 0;
  const profile = COMMODITY_TECH_PROFILE[commodity.id];
  const isProducer = profile?.produced.includes(system.tech);
  const sizeBase = (system.size + 1) * 8;  // 8..48
  // Producers have more stock
  const techMod = isProducer ? 16 : 4;
  return Math.max(2, sizeBase + techMod + rnd(0, 6));
}

function getBasePrice(system, commodity) {
  if (commodity.minTech > system.tech) return null;

  let p = commodity.base;

  // 1. Tech level modifier
  const profile = COMMODITY_TECH_PROFILE[commodity.id];
  if (profile) {
    if (profile.produced.includes(system.tech)) {
      // This planet produces it → cheaper
      p = Math.floor(p * 0.65);
    } else if (profile.consumed.includes(system.tech)) {
      // This planet needs it but can't produce → pricier
      p = Math.floor(p * 1.40);
    }
    // If neither → base price, slight variance
  }

  // 2. Government modifier by category
  const cat = getCommodityCategory(commodity.id);
  const govMods = GOV_CATEGORY_MOD[system.gov] || GOV_CATEGORY_MOD[5];
  p = Math.floor(p * (govMods[cat] || 1.0));

  // 3. Illegal surcharge (risk premium on top of everything)
  if (commodity.illegal) p = Math.floor(p * 1.4);

  return Math.max(8, p);
}

function priceFromStock(basePrice, stock, baseStock, events, commodityId) {
  if (baseStock === 0) return null;
  const ratio = stock / baseStock;
  const mult = ratio <= 0 ? 3.0 : Math.max(0.4, Math.min(3.0, 1 / Math.sqrt(ratio)));
  const stockPrice = Math.max(5, Math.round(basePrice * mult));
  return applyEventEffects(stockPrice, commodityId, events);
}

function initMarket(system) {
  const events = generateSystemEvents(system);
  const market = { events };
  COMMODITIES.forEach(c => {
    const bs = getBaseStock(system, c);
    market[c.id] = {
      stock: bs,
      baseStock: bs,
      basePrice: getBasePrice(system, c),
    };
  });
  return market;
}

function getMarketPrices(market) {
  const prices = {};
  const events = market.events || [];
  COMMODITIES.forEach(c => {
    const m = market[c.id];
    if (!m || m.basePrice === null || m.baseStock === 0) { prices[c.id] = null; return; }
    prices[c.id] = priceFromStock(m.basePrice, m.stock, m.baseStock, events, c.id);
  });
  return prices;
}

function refreshMarket(market) {
  const refreshed = { ...market };
  // Age events — remove expired ones
  refreshed.events = (market.events || [])
    .map(e => ({ ...e, daysLeft: e.daysLeft - 1 }))
    .filter(e => e.daysLeft > 0);
  // Restore stock 35%
  COMMODITIES.forEach(c => {
    const m = market[c.id];
    if (!m) return;
    const restored = Math.ceil((m.baseStock - m.stock) * 0.35);
    refreshed[c.id] = { ...m, stock: Math.min(m.baseStock, m.stock + restored) };
  });
  return refreshed;
}

export { getCommodityCategory, generateSystemEvents, applyEventEffects, getBaseStock, getBasePrice, priceFromStock, initMarket, getMarketPrices, refreshMarket };

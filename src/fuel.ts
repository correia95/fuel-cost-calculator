// Trip fuel cost. Works in metric (L/100km, price per litre) or
// US (MPG, price per US gallon) or UK (MPG, price per UK gallon).

export type System = 'metric' | 'us' | 'uk';

export interface Input {
  distance: number; // km (metric) or miles (us/uk)
  efficiency: number; // L/100km (metric) or MPG (us/uk)
  price: number; // per litre (metric) or per gallon (us/uk)
  returnTrip: boolean;
  people: number;
}

export interface Result {
  distanceTotal: number;
  fuelUsed: number; // litres (metric) or gallons (matching system)
  cost: number;
  costPerPerson: number;
  costPerDistanceUnit: number; // per km or per mile
  fuelUnitLabel: string;
  distanceUnitLabel: string;
}

const UK_GAL_IN_L = 4.54609;
const US_GAL_IN_L = 3.785411784;
const MI_IN_KM = 1.609344;

export function calculate(sys: System, inp: Input): Result | null {
  const { distance, efficiency, price } = inp;
  if (![distance, efficiency, price].every((n) => Number.isFinite(n) && n >= 0)) return null;
  if (efficiency <= 0) return null;
  const people = Math.max(1, Math.floor(inp.people || 1));
  const distanceTotal = distance * (inp.returnTrip ? 2 : 1);

  let fuelUsed: number;
  let fuelUnitLabel: string;
  let distanceUnitLabel: string;

  if (sys === 'metric') {
    fuelUsed = (distanceTotal / 100) * efficiency; // litres
    fuelUnitLabel = 'L';
    distanceUnitLabel = 'km';
  } else {
    fuelUsed = distanceTotal / efficiency; // gallons (US or UK, matching the MPG)
    fuelUnitLabel = 'gal';
    distanceUnitLabel = 'mi';
  }

  const cost = fuelUsed * price;
  return {
    distanceTotal,
    fuelUsed,
    cost,
    costPerPerson: cost / people,
    costPerDistanceUnit: distanceTotal > 0 ? cost / distanceTotal : 0,
    fuelUnitLabel,
    distanceUnitLabel,
  };
}

// convert an efficiency figure between systems for the "did you mean" helper
export function mpgToL100 (mpg: number, gal: 'us' | 'uk'): number {
  const galL = gal === 'us' ? US_GAL_IN_L : UK_GAL_IN_L;
  const kmPerGal = mpg * MI_IN_KM;
  return (galL / kmPerGal) * 100;
}
export function l100ToMpg(l100: number, gal: 'us' | 'uk'): number {
  const galL = gal === 'us' ? US_GAL_IN_L : UK_GAL_IN_L;
  const kmPerL = 100 / l100;
  return (kmPerL * galL) / MI_IN_KM;
}

export const SYSTEMS: { id: System; label: string; eff: string; price: string }[] = [
  { id: 'metric', label: 'Metric', eff: 'L/100 km', price: 'per litre' },
  { id: 'us', label: 'US', eff: 'MPG (US)', price: 'per US gallon' },
  { id: 'uk', label: 'UK', eff: 'MPG (imp)', price: 'per imp gallon' },
];

export function money(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'NZD', 'INR', 'ZAR'];

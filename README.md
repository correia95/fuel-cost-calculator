# fuel-cost-calculator

Estimate the fuel cost of a trip from the distance, your car's economy and the
pump price. Metric (L/100 km, price per litre) or US / UK MPG (price per US or
imperial gallon). Split between passengers, tick for a return trip. Shows total,
fuel used, cost per km/mile and per person. Trip details in the URL.

**Live:** https://fuel-cost-calculator.correia95.workers.dev/

## Stack

- React 18 + TypeScript + Vite, no runtime deps beyond React
- Static-assets Cloudflare Worker

## Engine

[`src/fuel.ts`](src/fuel.ts): `calculate(system, input)` →
`{ cost, fuelUsed, costPerPerson, costPerDistanceUnit, ... }`; `mpgToL100` /
`l100ToMpg` conversion helpers; `money` via `Intl.NumberFormat`.

Verified in Node: 500 km @ 7.5 L/100 km @ 1.95 = 37.5 L, 73.13; return + 4 people
= 146.25 total, 36.56 each; 300 mi @ 28 MPG (US) @ 3.45 = 10.71 gal, 36.96;
30 US MPG = 7.84 L/100 km; bad/zero economy → null.

## Develop / deploy

```bash
npm install
npm run dev
npm run deploy
```

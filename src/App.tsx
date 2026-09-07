import { useEffect, useMemo, useState } from 'react';
import { CURRENCIES, SYSTEMS, System, calculate, money } from './fuel';

const LS = 'fuel-cost-calculator:v1';

function read() {
  try {
    const p = new URLSearchParams(window.location.search);
    const sys = (SYSTEMS.some((s) => s.id === p.get('s')) ? p.get('s') : localStorage.getItem(LS + ':sys') || 'metric') as System;
    return {
      sys,
      currency: p.get('c') || localStorage.getItem(LS + ':cur') || 'USD',
      distance: p.get('d') || '',
      eff: p.get('e') || (sys === 'metric' ? '7.5' : '30'),
      price: p.get('p') || '',
      ret: p.get('r') === '1',
      people: p.get('n') || '1',
    };
  } catch {
    return { sys: 'metric' as System, currency: 'USD', distance: '', eff: '7.5', price: '', ret: false, people: '1' };
  }
}

export default function App() {
  const init = read();
  const [sys, setSys] = useState<System>(init.sys);
  const [currency, setCurrency] = useState(init.currency);
  const [distance, setDistance] = useState(init.distance);
  const [eff, setEff] = useState(init.eff);
  const [price, setPrice] = useState(init.price);
  const [ret, setRet] = useState(init.ret);
  const [people, setPeople] = useState(init.people);
  const [copied, setCopied] = useState(false);

  const meta = SYSTEMS.find((s) => s.id === sys) || SYSTEMS[0];
  const nPeople = Math.max(1, Math.floor(Number(people) || 1));

  const result = useMemo(
    () =>
      calculate(sys, {
        distance: Number(distance),
        efficiency: Number(eff),
        price: Number(price),
        returnTrip: ret,
        people: nPeople,
      }),
    [sys, distance, eff, price, ret, nPeople],
  );

  useEffect(() => {
    try {
      localStorage.setItem(LS + ':cur', currency);
      localStorage.setItem(LS + ':sys', sys);
    } catch {
      /* ignore */
    }
    try {
      const u = new URL(window.location.href);
      const q = u.searchParams;
      q.set('s', sys);
      q.set('c', currency);
      if (distance) q.set('d', distance); else q.delete('d');
      q.set('e', eff);
      if (price) q.set('p', price); else q.delete('p');
      q.set('r', ret ? '1' : '0');
      q.set('n', String(nPeople));
      window.history.replaceState(null, '', u.toString());
    } catch {
      /* ignore */
    }
  }, [sys, currency, distance, eff, price, ret, people, nPeople]);

  const switchSys = (id: System) => {
    setSys(id);
    // reset efficiency default when crossing metric/imperial
    if ((id === 'metric') !== (sys === 'metric')) setEff(id === 'metric' ? '7.5' : '30');
  };

  const m = (n: number) => money(n, currency);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const filled = distance.trim() !== '' && price.trim() !== '' && eff.trim() !== '';

  return (
    <div className="app">
      <header>
        <h1>Fuel Cost Calculator</h1>
        <p className="tag">
          What a trip costs in fuel — from the distance, your car's economy and the pump price. Split
          it between passengers and add the return leg.
        </p>
      </header>

      <div className="row top">
        <div className="seg">
          {SYSTEMS.map((s) => (
            <button key={s.id} className={s.id === sys ? 'on' : ''} onClick={() => switchSys(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency">
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="fields">
        <label className="f">
          <span>Distance</span>
          <div className="ibox">
            <input type="text" inputMode="decimal" value={distance} placeholder="0"
              onChange={(e) => setDistance(e.target.value.replace(/[^0-9.]/g, ''))} autoFocus />
            <i>{meta.id === 'metric' ? 'km' : 'mi'}</i>
          </div>
        </label>
        <label className="f">
          <span>Fuel economy</span>
          <div className="ibox">
            <input type="text" inputMode="decimal" value={eff}
              onChange={(e) => setEff(e.target.value.replace(/[^0-9.]/g, ''))} />
            <i>{meta.eff}</i>
          </div>
        </label>
        <label className="f">
          <span>Fuel price</span>
          <div className="ibox">
            <input type="text" inputMode="decimal" value={price} placeholder="0.00"
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))} />
            <i>{meta.price}</i>
          </div>
        </label>
        <label className="f">
          <span>Passengers (incl. you)</span>
          <div className="ibox">
            <input type="text" inputMode="numeric" value={people}
              onChange={(e) => setPeople(e.target.value.replace(/[^0-9]/g, ''))} />
            <i>people</i>
          </div>
        </label>
      </div>

      <label className="chk">
        <input type="checkbox" checked={ret} onChange={(e) => setRet(e.target.checked)} />
        Return trip (there and back)
      </label>

      {result && filled ? (
        <div className="result">
          <div className="rrow main">
            <span>Fuel for the {ret ? 'round trip' : 'trip'}</span>
            <strong>{m(result.cost)}</strong>
          </div>
          <div className="rrow">
            <span>{result.distanceTotal.toLocaleString()} {result.distanceUnitLabel} · {result.fuelUsed.toFixed(1)} {result.fuelUnitLabel} used</span>
            <b>{m(result.costPerDistanceUnit)}/{result.distanceUnitLabel}</b>
          </div>
          {nPeople > 1 && (
            <div className="rrow split">
              <span>Each of {nPeople}</span>
              <strong>{m(result.costPerPerson)}</strong>
            </div>
          )}
          <button className="share" onClick={share}>{copied ? 'Link copied' : 'Copy shareable link'}</button>
        </div>
      ) : (
        <p className="hint">Enter the distance, economy and fuel price.</p>
      )}

      <section className="explainer">
        <h2>How the estimate works</h2>
        <p>
          In metric, fuel used is <code>distance ÷ 100 × (L/100&nbsp;km)</code>; in MPG systems it's
          <code> distance ÷ MPG</code>. Multiply by the pump price and you have the trip cost. Tick
          the return box to double the distance.
        </p>
        <h3>US MPG vs UK MPG</h3>
        <p>
          A UK (imperial) gallon is about 20% larger than a US gallon, so the same car rates higher
          in UK MPG. Use the tab that matches where your figures come from — and make sure the fuel
          price is per the same gallon.
        </p>
        <h3>Why the real number varies</h3>
        <p>
          The manufacturer's economy figure is a lab result. Real consumption depends on speed, load,
          terrain, air conditioning, tyre pressure, cold starts and traffic — motorway cruising is
          usually close to the rating, stop-start city driving can be 20–40% worse. For a trip you
          take often, use your own measured average.
        </p>
        <h3>Is anything sent to a server?</h3>
        <p>No. It all runs in your browser and the trip details are only stored in the page link.</p>
        <footer>Fuel Cost Calculator · an estimate · no sign-up · works offline once loaded</footer>
      </section>
    </div>
  );
}

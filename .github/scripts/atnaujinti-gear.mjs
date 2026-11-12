// Parsiunčia inventorių (gear) iš Intervals.icu ir įrašo į gear.json.
// Raktas ir sportininko ID imami tik iš aplinkos kintamųjų (GitHub Secrets)
// ir niekada nespausdinami: klaidų pranešimuose rodomas tik HTTP statusas.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = process.env.GEAR_FILE || 'gear.json';
const BASE = process.env.INTERVALS_BASE_URL || 'https://intervals.icu';
const key = (process.env.INTERVALS_API_KEY || '').trim();
const athlete = (process.env.INTERVALS_ATHLETE_ID || '').trim();
// Intervals.icu atstumus grąžina metrais. Jei kada nors pasikeistų, nustatyk GEAR_DISTANCE_UNIT=km.
const unit = (process.env.GEAR_DISTANCE_UNIT || 'm').toLowerCase();

function fail(msg) {
  console.error('Klaida: ' + msg);
  process.exit(1);
}

if (!key) fail('nenustatytas Secret INTERVALS_API_KEY (Settings → Secrets and variables → Actions).');
if (!athlete) fail('nenustatytas Secret INTERVALS_ATHLETE_ID (Settings → Secrets and variables → Actions).');
if (!['m', 'km'].includes(unit)) fail('GEAR_DISTANCE_UNIT turi būti "m" arba "km".');

const url = `${BASE}/api/v1/athlete/${encodeURIComponent(athlete)}/gear`;

async function get(authorization) {
  try {
    return await fetch(url, { headers: { Authorization: authorization, Accept: 'application/json' } });
  } catch {
    fail('nepavyko prisijungti prie Intervals.icu (tinklo klaida).');
  }
}

let res = await get(`ApiKey API_KEY:${key}`);
if (res.status === 401 || res.status === 403) {
  // Atsarginis variantas: standartinė Basic autentifikacija (vartotojas "API_KEY", slaptažodis – raktas).
  res = await get('Basic ' + Buffer.from(`API_KEY:${key}`).toString('base64'));
}
if (res.status === 401 || res.status === 403) fail(`Intervals.icu atmetė prisijungimą (HTTP ${res.status}). Patikrink INTERVALS_API_KEY ir INTERVALS_ATHLETE_ID.`);
if (res.status === 404) fail('sportininkas nerastas (HTTP 404). Patikrink INTERVALS_ATHLETE_ID (pvz. i123456).');
if (!res.ok) fail(`Intervals.icu grąžino HTTP ${res.status}.`);

let body;
try {
  body = await res.json();
} catch {
  fail('Intervals.icu atsakymas nėra JSON.');
}
if (!Array.isArray(body)) fail('netikėtas atsakymo formatas: tikėtasi inventoriaus sąrašo (masyvo).');

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const gear = body
  .filter((g) => g && typeof g === 'object' && g.id != null)
  .map((g) => ({
    id: g.id,
    name: typeof g.name === 'string' ? g.name : '',
    // km, vienas skaičius po kablelio
    distance: Math.round((unit === 'm' ? num(g.distance) / 1000 : num(g.distance)) * 10) / 10,
    time: num(g.time),
    activities: num(g.activities),
    retired: Boolean(g.retired),
  }))
  .sort((a, b) => String(a.id).localeCompare(String(b.id)));

let old = null;
try {
  old = JSON.parse(readFileSync(FILE, 'utf8'));
} catch {
  // failo nėra arba jis sugadintas – perrašysime
}

if (old && !old.sample && JSON.stringify(old.gear) === JSON.stringify(gear)) {
  console.log(`Pokyčių nėra (${gear.length} įrašai) – gear.json paliktas nepakeistas.`);
} else {
  const out = { updatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), gear };
  const lines = gear.map((g) => '    ' + JSON.stringify(g));
  writeFileSync(
    FILE,
    `{\n  "updatedAt": ${JSON.stringify(out.updatedAt)},\n  "gear": [\n${lines.join(',\n')}\n  ]\n}\n`
  );
  console.log(`gear.json atnaujintas: ${gear.length} įrašai.`);
}

# Dviračių komponentų priežiūra

Statinis skydelis (dashboard), rodantis, kiek kilometrų nuvažiuota su kiekviena grandine ir kada ją laikas keisti. Dviračių rida automatiškai imama iš [Intervals.icu](https://intervals.icu), o puslapis publikuojamas per GitHub Pages. Jokių bibliotekų ir build žingsnių.

## Failai

| Failas | Paskirtis |
|---|---|
| `index.html` | Visas skydelis (HTML + CSS + JS) |
| `data.json` | Tavo įvedami duomenys: dviračiai, komponentai, keitimai |
| `gear.json` | Rida iš Intervals.icu – atnaujinama automatiškai, ranka neredaguok |
| `.github/workflows/atnaujinti-gear.yml` | Automatika: kas 6 val. atnaujina `gear.json` |
| `.github/scripts/atnaujinti-gear.mjs` | Skriptas, kurį paleidžia workflow |

## Nustatymas

### 1. Sukurk Secrets

Raktas ir sportininko ID laikomi tik GitHub Secrets – niekada nerašyk jų į failus.

1. Intervals.icu svetainėje atidaryk **Settings** → skiltis **Developer Settings**. Ten rasi **Athlete ID** (pvz. `i123456`) ir **API Key**.
2. GitHub repozitorijoje: **Settings → Secrets and variables → Actions → New repository secret**.
3. Sukurk du įrašus:
   - `INTERVALS_API_KEY` – API raktas,
   - `INTERVALS_ATHLETE_ID` – sportininko ID.

### 2. Įjunk GitHub Pages

1. **Settings → Pages**.
2. Skiltyje **Build and deployment**: Source – **Deploy from a branch**, Branch – **main**, aplankas – **/ (root)**, tada **Save**.
3. Po 1–2 min. skydelis bus pasiekiamas adresu `https://<vartotojas>.github.io/<repozitorija>/`.

### 3. Paleisk workflow rankiniu būdu

1. **Actions** → kairėje pasirink **Atnaujinti gear.json**.
2. **Run workflow** → **Run workflow**.
3. Po kelių sekundžių repozitorijoje atsiras commit'as „Atnaujinti gear.json iš Intervals.icu“, o skydelis rodys tikrą ridą.

Toliau workflow veikia pats kas 6 valandas. Jei rida nepasikeitė, commit'as nedaromas, todėl „Atnaujinta“ skydelyje rodo paskutinį kartą, kai duomenys pasikeitė.

> GitHub automatiškai sustabdo suplanuotus workflow, jei repozitorijoje 60 dienų nėra jokios veiklos. Tokiu atveju skiltyje Actions paspausk **Enable workflow**.

## Duomenų keitimas (`data.json`)

```json
{
  "bikes": [
    {"id": "revolt", "name": "Giant Revolt Advanced 1", "intervalsGearName": "Giant Revolt"}
  ],
  "components": [
    {"id": "chain", "name": "Grandinė", "limitKm": 3000}
  ],
  "changes": [
    {"id": "revolt-chain-2026-11-01", "bikeId": "revolt", "componentId": "chain", "date": "2026-11-01", "bikeKmAtChange": 4200, "note": "nauja, vaškuota"}
  ]
}
```

- `intervalsGearName` – dviračio pavadinimo Intervals.icu dalis (didžiosios/mažosios raidės nesvarbu).
- `limitKm` – po kiek km komponentą reikia keisti. Pakeisk skaičių ir padaryk commit.
- `changes` – keitimų žurnalas. Naują įrašą patogiausia sugeneruoti skydelio formoje „Naujas keitimas“, nukopijuoti ir įklijuoti į `changes` sąrašo galą (prieš tai ankstesnės eilutės gale pridėk kablelį).
- Pradiniai duomenys yra **pavyzdiniai** (išgalvoti). Pakeitęs juos savais, ištrink eilutę `"sample": true`, kad dingtų geltonas pranešimas.

## Jei kas neveikia

- **„Dviratis … nerastas faile gear.json“** – `intervalsGearName` nesutampa su pavadinimu Intervals.icu; pranešime rodomi rasti pavadinimai.
- **Workflow raudonas** – atidaryk jo žurnalą (Actions → paleidimas). „HTTP 401/403“ reiškia neteisingą raktą arba ID, „nenustatytas Secret“ – trūksta Secret.
- **Workflow negali padaryti push** – **Settings → Actions → General → Workflow permissions** pasirink **Read and write permissions**.
- **Skydelis tuščias po `data.json` redagavimo** – dažniausiai trūksta kablelio arba skliausto; skydelis parodys klaidos vietą.

## Vietinis paleidimas

```bash
python3 -m http.server
```

Tada atidaryk http://localhost:8000.

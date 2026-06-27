# JZ WeatherFusion

Agregátor dat z více meteorologických zdrojů. Aplikace sbírá měření ze stanic i numerických modelů, filtruje odlehlé hodnoty a zobrazuje jejich průměr v přehledném rozhraní.

**Živá aplikace:** https://honzabfu.github.io/jz-weatherfusion/

---

## Rychlý start

1. Otevřete aplikaci na adrese výše.
2. Klikněte na tlačítko **Add location** (nebo ikonu +) a vyhledejte místo jménem, nebo zadejte zeměpisné souřadnice.
3. Aplikace okamžitě načte data ze všech nakonfigurovaných zdrojů.

---

## Záložky

| Záložka | Popis |
|---------|-------|
| **Average** | Průměrné hodnoty ze všech platných zdrojů po filtraci odlehlých měření |
| **Stations** | Přehled jednotlivých stanic — co bylo použito, co bylo vyloučeno a proč |
| **Sources** | Stav jednotlivých datových zdrojů, chybové hlášky, čas posledního načtení |

---

## Datové zdroje

| Zdroj | API klíč | Popis |
|-------|----------|-------|
| **Open-Meteo** | nevyžadován | 3 numerické modely (best\_match, ICON, ECMWF); poskytuje i UV index |
| **OpenWeatherMap** | vyžadován (zdarma) | Stanice fyzických měřidel v okolí zadané polohy |
| **Tomorrow.io** | vyžadován (zdarma) | Realtime data z modelu Tomorrow.io |

### Kde získat API klíče

- **OpenWeatherMap** — https://openweathermap.org/api (volný tarif: 60 dotazů/min)
- **Tomorrow.io** — https://www.tomorrow.io (volný tarif: 500 dotazů/den)

Klíče se zadávají v **Nastavení → API Keys** a ukládají se výhradně do `localStorage` vašeho prohlížeče — nikam se neodesílají.

---

## Nastavení

Nastavení otevřete ikonou ozubeného kola vpravo nahoře.

| Možnost | Popis |
|---------|-------|
| **Language** | Angličtina / Čeština / Španělština |
| **Theme** | Světlý / Tmavý / Systémový |
| **Font size** | Malé / Střední / Velké |
| **Units** | Metrické (°C, hPa, m/s, mm) nebo imperiální (°F, inHg, mph, in) |
| **Wind display** | m/s, km/h, mph, Beaufortova stupnice nebo kombinace |
| **IQR factor** | Přísnost filtrace odlehlých hodnot (1,0 = přísné, 3,0 = volné) |
| **Auto-refresh** | Automatické obnovení každých 5 / 10 / 30 min nebo vypnuto |
| **API Keys** | Klíče pro OpenWeatherMap a Tomorrow.io |
| **Export / Import** | Záloha a obnova celé konfigurace jako JSON |

---

## Jak funguje filtrování

1. Ze všech zdrojů se shromáždí hodnoty pro každou veličinu (teplota, vlhkost, tlak, …).
2. Aplikuje se IQR filtr (mezikvartilové rozpětí) — stanice s výrazně odlišnou hodnotou jsou označeny jako odlehlé a z průměru vyloučeny.
3. Ze zbývajících hodnot se spočítá aritmetický průměr (pro směr větru kruhový průměr).
4. Odlehlé stanice jsou viditelné v záložce **Stations** s označením ○.

Faktor IQR lze upravit v nastavení — nižší hodnota je přísnější (vyloučí více stanic), vyšší hodnota je tolerantnější.

---

## PWA — instalace

Aplikace je plně funkční jako Progressive Web App. V prohlížeči klikněte na „Instalovat aplikaci" (Chrome/Edge) nebo „Přidat na plochu" (Safari/iOS) a JZ WeatherFusion bude fungovat jako samostatná aplikace i bez připojení (zobrazí naposledy načtená data).

---

## Lokální vývoj

```bash
npm install
npm run dev        # dev server na http://localhost:5173/jz-weatherfusion/
npm run build      # výstup do dist/
npm run preview    # náhled produkčního buildu
```

Nasazení probíhá automaticky přes GitHub Actions při každém pushnutí do větve `main` — build se publikuje na GitHub Pages.

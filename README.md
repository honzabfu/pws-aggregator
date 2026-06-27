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
| **Average** | Průměrné hodnoty — preferuje fyzické stanice, při jejich absenci použije NWP modely; pod hodnotami je vidět, z kolika zdrojů průměr pochází |
| **Stations** | Přehled jednotlivých stanic — co bylo použito, co bylo vyloučeno a proč |
| **Sources** | Stav jednotlivých datových zdrojů, chybové hlášky, čas posledního načtení |

---

## Datové zdroje

Zdroje jsou rozděleny do dvou kategorií podle toho, jak data získávají:

- **Fyzické stanice** — měří přímo na místě senzorem; nejpřesnější pro lokální podmínky.
- **NWP modely** — numerická předpověď počasí na mřížce; hodnoty reprezentují velkou plochu, nikoli konkrétní bod.

| Zdroj | Typ | API klíč | Popis |
|-------|-----|----------|-------|
| **Open-Meteo** | NWP model | nevyžadován | 3 modely (best\_match, ICON, ECMWF); poskytuje i UV index |
| **OpenWeatherMap** | Fyzické stanice | vyžadován (zdarma) | Občanské měřicí stanice (PWS) v okolí zadané polohy |
| **Tomorrow.io** | NWP model | vyžadován (zdarma) | Hybridní model (NWP + satelit + radar) |
| **Windy** | NWP model | vyžadován (zdarma) | GFS model 0,25°; data označena jako přibližná (≈) a z agregace vždy vyloučena |

### Kde získat API klíče

- **OpenWeatherMap** — https://openweathermap.org/api (volný tarif: 60 dotazů/min)
- **Tomorrow.io** — https://www.tomorrow.io (volný tarif: 500 dotazů/den)
- **Windy** — https://api.windy.com/point-forecast (volný tarif: Point Forecast API)

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
| **API Keys** | Klíče pro OpenWeatherMap, Tomorrow.io a Windy |
| **Export / Import** | Záloha a obnova celé konfigurace jako JSON |

---

## Jak funguje filtrování a agregace

Agregace probíhá ve dvou krocích:

**1. Výběr zdroje dat**

Fyzické stanice (OpenWeatherMap) měří skutečné podmínky přímo na místě, zatímco NWP modely pracují s mřížkou o rozlišení 1–28 km a hodnoty interpolují. Vlhkost nebo teplota se mezi nimi mohou systematicky lišit o 10–20 %, přičemž fyzické stanice jsou pro lokální podmínky přesnější.

- Pokud jsou k dispozici fyzické stanice, průměr se počítá **výhradně z nich**.
- Nejsou-li fyzické stanice nakonfigurovány (žádný OWM klíč nebo žádná stanice v daném okruhu), použijí se NWP modely jako záloha.

**2. IQR filtr odlehlých hodnot**

V rámci vybraných zdrojů se aplikuje IQR filtr (mezikvartilové rozpětí) — stanice s výrazně odlišnou hodnotou jsou označeny jako odlehlé a z průměru vyloučeny. Ze zbývajících hodnot se spočítá aritmetický průměr (pro směr větru kruhový průměr).

Faktor IQR lze upravit v nastavení — nižší hodnota je přísnější, vyšší tolerantnější.

**Indikátory v záložce Stations**

| Symbol | Význam |
|--------|--------|
| ● | Zahrnuto v průměru |
| ○ | Vyloučeno jako odlehlá hodnota (IQR) |
| ◇ | NWP model vyloučen — fyzické stanice mají přednost |
| ≈ | Přibližné (Windy bezplatný tarif) — vždy vyloučeno |

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

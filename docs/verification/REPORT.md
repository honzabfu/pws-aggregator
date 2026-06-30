# Cross-platform display verification

Ověření zobrazení aplikace na různých platformách, prohlížečích a velikostech
displeje. Generováno skriptem [`scripts/verify-display.mjs`](../../scripts/verify-display.mjs).

## Metodika

- **Nástroj:** Playwright řídí předinstalovaný Chromium (`/opt/pw-browsers/chromium-1194`).
- **App:** produkční build (`npm run build`) servírovaný přes `vite preview`.
- **Data:** síťové odpovědi Open-Meteo a OpenWeatherMap jsou v testu mockované
  (deterministická, datově bohatá UI nezávislá na síti). Nasazená lokalita: Praha,
  3 fyzické stanice (OWM) + 3 NWP modely (Open-Meteo).
- **Pokrytí:** 8 viewportů × 2 motivy (light/dark) × 3 taby (Průměr / Stanice /
  Zdroje) = **48 kontrol**.
- **Kontrola layoutu:** u každé kombinace se měří horizontální přetečení dokumentu
  (`scrollWidth − clientWidth`) a pořizuje se full-page screenshot.

### Poznámka k prohlížečům

V tomto prostředí je k dispozici pouze engine **Chromium**. Firefox (Gecko) a
Safari/iOS (WebKit) zde nejsou nainstalované, takže reálné enginy nelze spustit.
Cílová zařízení jsou proto emulována přes device profily (viewport,
`deviceScaleFactor`, `isMobile`, `hasTouch`, `prefers-color-scheme`). App je
čistá React + Vite PWA bez prefix-závislého CSS frameworku a používá běžné
flex/grid vlastnosti, takže riziko engine-specifických rozdílů je nízké; pro
plnou jistotu Safari/Firefox doporučujeme manuální dotest na reálných zařízeních.

## Matice viewportů

| Profil | Rozlišení | Reprezentuje |
| --- | --- | --- |
| `mobile-320-small` | 320×568 | iPhone SE (1. gen) — nejmenší běžný telefon |
| `mobile-375-iphonese` | 375×667 | iPhone SE2 / iPhone 8 |
| `mobile-390-iphone13` | 390×844 | iPhone 12/13/14 |
| `mobile-412-android` | 412×915 | Pixel 7 / typický Android |
| `tablet-768-portrait` | 768×1024 | iPad na výšku |
| `tablet-1024-landscape` | 1024×768 | iPad na šířku |
| `desktop-1280` | 1280×800 | Notebook |
| `desktop-1920` | 1920×1080 | Full-HD desktop |

## Výsledek

**48/48 kontrol bez horizontálního přetečení** (po opravě níže). Strojová data:
[`results.json`](results.json). Screenshoty: `*__<motiv>__<tab>.png` v této složce.

### Nalezená a opravená chyba — přetečení na 320 px

Při prvním běhu (s reálnými daty) agregovaný tab na šířce **320 px** přetékal
vodorovně o **+53 px** v obou motivech. Příčina: hero karta teploty má
`grid-column: span 2`, což na nejužším displeji vynutilo dvousloupcovou mřížku,
a širokoé číselné hodnoty (např. tlak „1013.7 hPa" ve fontu 2 rem, bez zalomení)
pak protlačily stopy mřížky přes šířku viewportu.

**Oprava:** mřížka metrik přesunuta z inline stylů do třídy `.metric-grid`
v [`tokens.css`](../../src/styles/tokens.css) s media query: pod 360 px se
přepne na jeden sloupec a hero karta přestane span­ovat dva sloupce. Na 375 px a
výše zůstává dvousloupcové rozložení beze změny.

Po opravě: **0 přetečení** napříč celou maticí. Tabulka stanic na úzkých
displejích roluje vodorovně ve vlastním kontejneru (`overflow-x: auto`) —
záměrný vzor, page-level přetečení je nulové.

## Reprodukce

```bash
npm run build
npm run preview -- --port 4173 &
node scripts/verify-display.mjs
```

Skript zapíše screenshoty a `results.json` do `docs/verification/` a vypíše
souhrn přetečení. Cestu k prohlížeči lze přepsat přes `CHROMIUM_PATH`, URL přes
`BASE_URL`.

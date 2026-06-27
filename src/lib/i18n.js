// src/lib/i18n.js

export const SUPPORTED_LANG_CODES = ['en', 'cs', 'es']

export const LANGUAGES = [
  { code: 'auto', label: 'Auto', flag: '🌐' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

export function detectBrowserLanguage() {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language ?? 'en']
  for (const l of langs) {
    const tag = l.split('-')[0].toLowerCase()
    if (SUPPORTED_LANG_CODES.includes(tag)) return tag
  }
  return 'en'
}

export function resolveLanguage(pref) {
  if (!pref || pref === 'auto') return detectBrowserLanguage()
  return SUPPORTED_LANG_CODES.includes(pref) ? pref : 'en'
}

const strings = {
  en: {
    // App
    appName: 'PWS Aggregator',
    appTagline: 'Personal Weather Station data from multiple sources',

    // Nav / tabs
    tabAggregated: 'Aggregated',
    tabStations:   'Stations',
    tabSources:    'Sources',

    // Actions
    actionFetch:    'Fetch',
    actionRefresh:  'Refresh',
    actionSettings: 'Settings',
    actionAddLocation: 'Add location',
    actionSave:     'Save',
    actionCancel:   'Cancel',
    actionDelete:   'Delete',
    actionExport:   'Export config',
    actionImport:   'Import config',
    actionClearAll: 'Clear all data',

    // Metrics
    metricTemp:     'Temperature',
    metricHumidity: 'Humidity',
    metricPressure: 'Pressure',
    metricWind:     'Wind',
    metricWindDir:  'Wind direction',
    metricClouds:   'Cloud cover',
    metricPrecip:   'Precipitation',
    metricUV:       'UV Index',

    // Metric sub-labels
    contributors: (n, t) => `${n}/${t} stations`,
    outliersRemoved: (n) => `${n} outlier${n !== 1 ? 's' : ''} removed`,

    // Settings
    settingsTitle:    'Settings',
    settingsLanguage: 'Language',
    settingsTheme:    'Theme',
    settingsFontSize: 'Font size',
    settingsUnits:    'Units',
    settingsWind:     'Wind display',
    settingsIQR:      'IQR factor',
    settingsRefresh:  'Auto-refresh',
    settingsApiKeys:  'API Keys',
    settingsData:     'Data',

    fontSizeSmall:  'Small',
    fontSizeMedium: 'Default',
    fontSizeLarge:  'Large',
    fontSizeXl:     'Extra large',

    hintIQR:  'Outlier sensitivity — stations far outside the group are excluded from the average. Lower = stricter filtering. 1.5 is a good default.',
    hintWind: 'Combined shows speed and Beaufort scale together. Beaufort is a 0–12 descriptive wind scale.',

    // Theme
    themeSystem: 'System',
    themeLight:  'Light',
    themeDark:   'Dark',

    // Units
    unitsMetric:   'Metric',
    unitsImperial: 'Imperial',

    // Wind display
    windMs:       'm/s',
    windMph:      'mph',
    windKmh:      'km/h',
    windBeaufort: 'Beaufort',
    windCombined: 'Combined',

    // Refresh intervals
    refreshOff:   'Manual',
    refresh5:     '5 min',
    refresh15:    '15 min',
    refresh30:    '30 min',

    // Sources
    sourceOpenMeteo:  'Open-Meteo',
    sourceOWM:        'OpenWeatherMap',
    sourceWindy:      'Windy',
    sourceTomorrow:   'Tomorrow.io',
    sourceStatus:     'Source status',
    sourceOnline:     'Online',
    sourceError:      'Error',
    sourceNoKey:      'No API key',
    sourceLastFetch:  'Last fetch',

    // Location
    locationLabel:    'Location name',
    locationLat:      'Latitude',
    locationLon:      'Longitude',
    locationRadius:   'Radius (km)',
    locationPrimary:  'Set as primary',
    locationAdd:      'Add location',
    locationEdit:     'Edit location',
    locationDelete:   'Delete location',
    locationNoData:   'No location configured. Add one to get started.',
    locationSearch:    'Search location',
    locationSearchHint:'Type a city or place name',
    locationSearching: 'Searching…',
    locationSearchEmpty:'No places found',
    locationOrManual:  'or enter coordinates manually',
    locationLabelHint: 'e.g. Home, Cottage, Prague…',
    locationUseMine:   'Use my location',
    locationLocating:  'Locating…',

    // API keys
    keyOWM:       'OpenWeatherMap API key',
    keyWindy:     'Windy API key',
    keyTomorrow:  'Tomorrow.io API key',
    keyFreeHint:  'Free at',
    keyValid:     'Key looks valid',
    keyInvalid:   'Key format invalid',
    keyWindyNote: 'Select the Point Forecast API key (not Webcams, Map Forecast, or Plugins)',

    // Stations table
    stationName:    'Station',
    stationSource:  'Source',
    stationOutlier: 'Outlier',
    stationAll:     'All stations',
    stationActive:  'Used in average',
    stationExcl:    'Excluded (outlier)',
    stationApprox:  'Approximate — excluded from average (free tier data)',

    windyKeyFreeLabel: 'Free API key — data has intentional inaccuracies, excluded from average',

    // Errors
    errorFetch:     'Fetch failed',
    errorNoSources: 'No data sources available. Add an API key in Settings.',
    errorNetwork:   'Network error',

    // Beaufort scale
    beaufort: [
      'Calm', 'Light air', 'Light breeze', 'Gentle breeze',
      'Moderate breeze', 'Fresh breeze', 'Strong breeze', 'Near gale',
      'Gale', 'Strong gale', 'Storm', 'Violent storm', 'Hurricane'
    ],

    // Status
    statusFetching: 'Fetching data…',
    statusUpdated:  'Updated',
    statusManual:   'Manual refresh',
  },

  cs: {
    appName: 'PWS Agregátor',
    appTagline: 'Data z osobních meteostanic z více zdrojů',

    tabAggregated: 'Průměr',
    tabStations:   'Stanice',
    tabSources:    'Zdroje',

    actionFetch:    'Načíst',
    actionRefresh:  'Obnovit',
    actionSettings: 'Nastavení',
    actionAddLocation: 'Přidat lokalitu',
    actionSave:     'Uložit',
    actionCancel:   'Zrušit',
    actionDelete:   'Smazat',
    actionExport:   'Exportovat konfiguraci',
    actionImport:   'Importovat konfiguraci',
    actionClearAll: 'Smazat vše',

    metricTemp:     'Teplota',
    metricHumidity: 'Vlhkost',
    metricPressure: 'Tlak',
    metricWind:     'Vítr',
    metricWindDir:  'Směr větru',
    metricClouds:   'Oblačnost',
    metricPrecip:   'Srážky',
    metricUV:       'UV index',

    contributors: (n, t) => `${n}/${t} stanic`,
    outliersRemoved: (n) => `${n} outlier${n > 1 ? 'y' : ''} odebrán${n > 1 ? 'y' : ''}`,

    settingsTitle:    'Nastavení',
    settingsLanguage: 'Jazyk',
    settingsTheme:    'Motiv',
    settingsFontSize: 'Velikost písma',
    settingsUnits:    'Jednotky',
    settingsWind:     'Zobrazení větru',
    settingsIQR:      'IQR faktor',
    settingsRefresh:  'Automatické obnovení',
    settingsApiKeys:  'API klíče',
    settingsData:     'Data',

    fontSizeSmall:  'Malé',
    fontSizeMedium: 'Výchozí',
    fontSizeLarge:  'Velké',
    fontSizeXl:     'Velmi velké',

    hintIQR:  'Citlivost detekce odlehlých hodnot — stanice příliš vzdálené od skupiny jsou vyloučeny z průměru. Nižší = přísnější filtr. Výchozí hodnota 1,5 je vhodná pro většinu případů.',
    hintWind: 'Kombinovaně zobrazuje rychlost i Beaufortovu stupnici najednou. Beaufort je popisná škála síly větru 0–12.',

    themeSystem: 'Systém',
    themeLight:  'Světlý',
    themeDark:   'Tmavý',

    unitsMetric:   'Metrické',
    unitsImperial: 'Imperiální',

    windMs:       'm/s',
    windMph:      'mph',
    windKmh:      'km/h',
    windBeaufort: 'Beaufort',
    windCombined: 'Kombinovaně',

    refreshOff: 'Manuálně',
    refresh5:   '5 min',
    refresh15:  '15 min',
    refresh30:  '30 min',

    sourceOpenMeteo: 'Open-Meteo',
    sourceOWM:       'OpenWeatherMap',
    sourceWindy:     'Windy',
    sourceTomorrow:  'Tomorrow.io',
    sourceStatus:    'Stav zdrojů',
    sourceOnline:    'Online',
    sourceError:     'Chyba',
    sourceNoKey:     'Chybí API klíč',
    sourceLastFetch: 'Poslední načtení',

    locationLabel:   'Název lokality',
    locationLat:     'Zeměpisná šířka',
    locationLon:     'Zeměpisná délka',
    locationRadius:  'Okruh (km)',
    locationPrimary: 'Nastavit jako primární',
    locationAdd:     'Přidat lokalitu',
    locationEdit:    'Upravit lokalitu',
    locationDelete:  'Smazat lokalitu',
    locationNoData:  'Žádná lokalita. Přidej první a začni.',
    locationSearch:    'Vyhledat lokalitu',
    locationSearchHint:'Zadej město nebo název místa',
    locationSearching: 'Hledám…',
    locationSearchEmpty:'Nic nenalezeno',
    locationOrManual:  'nebo zadej souřadnice ručně',
    locationLabelHint: 'např. Domov, Chata, Praha…',
    locationUseMine:   'Použít mou polohu',
    locationLocating:  'Zjišťuji polohu…',

    keyOWM:      'API klíč OpenWeatherMap',
    keyWindy:    'API klíč Windy',
    keyTomorrow: 'API klíč Tomorrow.io',
    keyFreeHint: 'Zdarma na',
    keyValid:    'Klíč vypadá správně',
    keyInvalid:  'Nesprávný formát klíče',
    keyWindyNote: 'Zvol klíč pro Point Forecast API (ne Webcams, Map Forecast ani Plugins)',

    stationName:    'Stanice',
    stationSource:  'Zdroj',
    stationOutlier: 'Outlier',
    stationAll:     'Všechny stanice',
    stationActive:  'Použito v průměru',
    stationExcl:    'Vyloučeno (outlier)',
    stationApprox:  'Přibližné — vyloučeno z průměru (bezplatný tarif)',

    windyKeyFreeLabel: 'Bezplatný klíč — data jsou záměrně zkreslena, vyloučena z průměru',

    errorFetch:     'Chyba načítání',
    errorNoSources: 'Žádné zdroje dat. Přidej API klíč v Nastavení.',
    errorNetwork:   'Síťová chyba',

    beaufort: [
      'Bezvětří', 'Vánek', 'Lehký vítr', 'Slabý vítr',
      'Mírný vítr', 'Čerstvý vítr', 'Silný vítr', 'Prudký vítr',
      'Bouřlivý vítr', 'Silná bouře', 'Bouře', 'Silná bouře', 'Orkán'
    ],

    statusFetching: 'Načítám data…',
    statusUpdated:  'Aktualizováno',
    statusManual:   'Manuální obnovení',
  },

  es: {
    appName: 'Agregador PWS',
    appTagline: 'Datos de estaciones meteorológicas personales de múltiples fuentes',

    tabAggregated: 'Promedio',
    tabStations:   'Estaciones',
    tabSources:    'Fuentes',

    actionFetch:    'Obtener',
    actionRefresh:  'Actualizar',
    actionSettings: 'Ajustes',
    actionAddLocation: 'Añadir lugar',
    actionSave:     'Guardar',
    actionCancel:   'Cancelar',
    actionDelete:   'Eliminar',
    actionExport:   'Exportar configuración',
    actionImport:   'Importar configuración',
    actionClearAll: 'Borrar todo',

    metricTemp:     'Temperatura',
    metricHumidity: 'Humedad',
    metricPressure: 'Presión',
    metricWind:     'Viento',
    metricWindDir:  'Dirección del viento',
    metricClouds:   'Nubosidad',
    metricPrecip:   'Precipitación',
    metricUV:       'Índice UV',

    contributors: (n, t) => `${n}/${t} estaciones`,
    outliersRemoved: (n) => `${n} valor${n !== 1 ? 'es' : ''} atípico${n !== 1 ? 's' : ''} eliminado${n !== 1 ? 's' : ''}`,

    settingsTitle:    'Ajustes',
    settingsLanguage: 'Idioma',
    settingsTheme:    'Tema',
    settingsFontSize: 'Tamaño de fuente',
    settingsUnits:    'Unidades',
    settingsWind:     'Mostrar viento',
    settingsIQR:      'Factor IQR',
    settingsRefresh:  'Actualización automática',
    settingsApiKeys:  'Claves API',
    settingsData:     'Datos',

    fontSizeSmall:  'Pequeño',
    fontSizeMedium: 'Predeterminado',
    fontSizeLarge:  'Grande',
    fontSizeXl:     'Extra grande',

    hintIQR:  'Sensibilidad a valores atípicos — las estaciones muy alejadas del grupo se excluyen del promedio. Menor = filtrado más estricto. 1,5 es un buen valor por defecto.',
    hintWind: 'Combinado muestra la velocidad y la escala Beaufort juntas. Beaufort es una escala descriptiva de viento del 0 al 12.',

    themeSystem: 'Sistema',
    themeLight:  'Claro',
    themeDark:   'Oscuro',

    unitsMetric:   'Métrico',
    unitsImperial: 'Imperial',

    windMs:       'm/s',
    windMph:      'mph',
    windKmh:      'km/h',
    windBeaufort: 'Beaufort',
    windCombined: 'Combinado',

    refreshOff: 'Manual',
    refresh5:   '5 min',
    refresh15:  '15 min',
    refresh30:  '30 min',

    sourceOpenMeteo: 'Open-Meteo',
    sourceOWM:       'OpenWeatherMap',
    sourceWindy:     'Windy',
    sourceTomorrow:  'Tomorrow.io',
    sourceStatus:    'Estado de fuentes',
    sourceOnline:    'En línea',
    sourceError:     'Error',
    sourceNoKey:     'Sin clave API',
    sourceLastFetch: 'Última actualización',

    locationLabel:   'Nombre del lugar',
    locationLat:     'Latitud',
    locationLon:     'Longitud',
    locationRadius:  'Radio (km)',
    locationPrimary: 'Establecer como primario',
    locationAdd:     'Añadir lugar',
    locationEdit:    'Editar lugar',
    locationDelete:  'Eliminar lugar',
    locationNoData:  'Sin lugar configurado. Añade uno para empezar.',
    locationSearch:    'Buscar lugar',
    locationSearchHint:'Escribe una ciudad o lugar',
    locationSearching: 'Buscando…',
    locationSearchEmpty:'No se encontró ningún lugar',
    locationOrManual:  'o introduce coordenadas manualmente',
    locationLabelHint: 'p. ej. Casa, Oficina, Madrid…',
    locationUseMine:   'Usar mi ubicación',
    locationLocating:  'Localizando…',

    keyOWM:      'Clave API OpenWeatherMap',
    keyWindy:    'Clave API Windy',
    keyTomorrow: 'Clave API Tomorrow.io',
    keyFreeHint: 'Gratis en',
    keyValid:    'Clave válida',
    keyInvalid:  'Formato de clave inválido',
    keyWindyNote: 'Elige la clave de la API Point Forecast (no Webcams, Map Forecast ni Plugins)',

    stationName:    'Estación',
    stationSource:  'Fuente',
    stationOutlier: 'Atípico',
    stationAll:     'Todas las estaciones',
    stationActive:  'Usado en promedio',
    stationExcl:    'Excluido (atípico)',
    stationApprox:  'Aproximado — excluido del promedio (nivel gratuito)',

    windyKeyFreeLabel: 'Clave gratuita — los datos tienen imprecisiones intencionales, excluidos del promedio',

    errorFetch:     'Error al obtener datos',
    errorNoSources: 'Sin fuentes de datos. Añade una clave API en Ajustes.',
    errorNetwork:   'Error de red',

    beaufort: [
      'Calma', 'Ventolina', 'Brisa leve', 'Brisa débil',
      'Brisa moderada', 'Brisa fresca', 'Brisa fuerte', 'Viento fuerte',
      'Temporal', 'Temporal fuerte', 'Temporal duro', 'Borrasca', 'Huracán'
    ],

    statusFetching: 'Obteniendo datos…',
    statusUpdated:  'Actualizado',
    statusManual:   'Actualización manual',
  }
}

export function t(lang, key, ...args) {
  const s = strings[lang] ?? strings.en
  const val = s[key] ?? strings.en[key] ?? key
  return typeof val === 'function' ? val(...args) : val
}

export default strings

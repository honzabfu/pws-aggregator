// src/lib/units.test.js
import { describe, it, expect } from 'vitest'
import {
  msToBeaufort,
  displayTemp,
  displayPressure,
  displayWind,
  displayPrecip,
  windDirLabel,
} from './units.js'

describe('msToBeaufort', () => {
  it('maps speeds to the Beaufort scale', () => {
    expect(msToBeaufort(0)).toBe(0)    // calm
    expect(msToBeaufort(0.3)).toBe(1)  // lower bound of force 1
    expect(msToBeaufort(5)).toBe(3)
    expect(msToBeaufort(40)).toBe(12)  // above the top threshold
  })

  it('returns null for missing input', () => {
    expect(msToBeaufort(null)).toBeNull()
    expect(msToBeaufort(undefined)).toBeNull()
  })
})

describe('displayTemp', () => {
  it('keeps Celsius in metric', () => {
    expect(displayTemp(20, 'metric')).toEqual({ value: 20, unit: '°C' })
  })
  it('converts to Fahrenheit in imperial', () => {
    expect(displayTemp(0, 'imperial')).toEqual({ value: 32, unit: '°F' })
  })
  it('preserves the unit when value is null', () => {
    expect(displayTemp(null, 'imperial')).toEqual({ value: null, unit: '°F' })
  })
})

describe('displayPressure', () => {
  it('keeps hPa in metric', () => {
    expect(displayPressure(1013, 'metric')).toEqual({ value: 1013, unit: 'hPa' })
  })
  it('converts to inHg in imperial', () => {
    expect(displayPressure(1013, 'imperial')).toEqual({ value: 29.91, unit: 'inHg' })
  })
})

describe('displayWind', () => {
  it('converts m/s to km/h', () => {
    const r = displayWind(10, 'kmh', 'en', {})
    expect(r.value).toBe(36)
    expect(r.unit).toBe('km/h')
  })
  it('converts m/s to mph', () => {
    expect(displayWind(10, 'mph', 'en', {}).value).toBe(22.4)
  })
  it('reports Beaufort in beaufort mode', () => {
    const r = displayWind(10, 'beaufort', 'en', {})
    expect(r.value).toBe(msToBeaufort(10))
    expect(r.unit).toBe('Bft')
  })
  it('flags combined mode', () => {
    expect(displayWind(5, 'combined', 'en', {}).combined).toBe(true)
  })
  it('returns null value for missing speed', () => {
    expect(displayWind(null, 'ms', 'en', {}).value).toBeNull()
  })
})

describe('displayPrecip', () => {
  it('keeps mm/h in metric', () => {
    expect(displayPrecip(2, 'metric')).toEqual({ value: 2, unit: 'mm/h' })
  })
  it('converts to in/h in imperial', () => {
    expect(displayPrecip(25.4, 'imperial')).toEqual({ value: 1, unit: 'in/h' })
  })
})

describe('windDirLabel', () => {
  it('labels cardinal directions in English', () => {
    expect(windDirLabel(0, 'en')).toBe('N')
    expect(windDirLabel(90, 'en')).toBe('E')
    expect(windDirLabel(180, 'en')).toBe('S')
    expect(windDirLabel(360, 'en')).toBe('N') // wraps around
  })
  it('localizes to Czech', () => {
    expect(windDirLabel(0, 'cs')).toBe('S')   // sever
    expect(windDirLabel(90, 'cs')).toBe('V')  // východ
    expect(windDirLabel(180, 'cs')).toBe('J') // jih
  })
  it('returns a dash for missing input', () => {
    expect(windDirLabel(null)).toBe('—')
  })
})

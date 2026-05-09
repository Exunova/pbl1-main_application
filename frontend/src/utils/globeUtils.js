export const GEO_JSON_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'

export const COUNTRY_INDEX_MAP = {
  US: { index: '^GSPC', name: 'S&P 500' },
  ID: { index: '^JKLQ45', name: 'LQ45' },
  JP: { index: '^N225', name: 'Nikkei 225' },
  GB: { index: '^FTSE', name: 'FTSE 100' },
}

export const COUNTRY_NAMES = {
  US: 'United States',
  ID: 'Indonesia',
  JP: 'Japan',
  GB: 'United Kingdom',
}

export const ISO2_TO_ISO3 = { US: 'USA', ID: 'IDN', JP: 'JPN', GB: 'GBR' }
export const ISO3_TO_ISO2 = { USA: 'US', IDN: 'ID', JPN: 'JP', GBR: 'GB' }

export const COUNTRY_CURRENCY = { USA: 'USD', IDN: 'IDR', JPN: 'JPY', GBR: 'GBP' }
export const MAJOR_CURRENCIES  = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'SGD', 'HKD', 'IDR']

export function getCountryColor(changePct) {
  if (changePct === null || changePct === undefined) return 'rgba(55,65,81,0.6)'
  if (changePct > 1)  return 'rgba(22,101,52,0.75)'
  if (changePct > 0)  return 'rgba(74,222,128,0.55)'
  if (changePct < -1) return 'rgba(153,27,27,0.75)'
  return 'rgba(248,113,113,0.55)'
}

export function isPointInPolygon(point, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    const intersect =
      (yi > point[1]) !== (yj > point[1]) &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function isPointInCountry(point, geometry) {
  if (geometry.type === 'Polygon')
    return isPointInPolygon(point, geometry.coordinates[0])
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates.some(poly => isPointInPolygon(point, poly[0]))
  return false
}

export function getPointOfView(feature) {
  if (feature.properties.ISO_A3 === 'USA') {
    return { povLat: 38, povLng: -97 + 2.0 * 20, altitude: 2.0, centerLat: 40, centerLng: -97 }
  }
  let coords = []
  if (feature.geometry.type === 'Polygon') {
    coords = feature.geometry.coordinates[0]
  } else if (feature.geometry.type === 'MultiPolygon') {
    feature.geometry.coordinates.forEach(poly => {
      if (poly[0].length > (coords.length || 0)) coords = poly[0]
    })
  }
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  coords.forEach(([lng, lat]) => {
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat)
    minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng)
  })
  let latC = feature.properties.LABEL_Y ?? (minLat + maxLat) / 2
  let lngC = feature.properties.LABEL_X ?? (minLng + maxLng) / 2
  if (feature.properties.ISO_A3 === 'IDN') { latC = -2.0; lngC = 121.0 }
  const maxSpread = Math.max(maxLat - minLat, maxLng - minLng)
  const altitude  = Math.min(Math.max(0.9 + maxSpread / 25, 0.85), 2.6)
  const lngOffset = altitude * 20
  return { povLat: latC - 2, povLng: lngC + lngOffset, altitude, centerLat: latC, centerLng: lngC }
}

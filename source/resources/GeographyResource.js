import {geoAlbersUsa, geoMercator, geoConicConformal} from 'd3-geo'

import geographies from '../geographies'
import MapResource from './MapResource'

const projectionCache = {} // keyed by "${label}-${width}x${height}"

/**
 * Compute geographic bounding box [minX, minY, maxX, maxY] directly from
 * TopoJSON arcs — no topojson library needed. Used to auto-fit projections.
 * TopoJSON with a transform stores delta-encoded quantized coordinates;
 * without a transform, arc coordinates are already in geographic space.
 */
function topoJsonBbox(topo) {
  if (topo.bbox) return topo.bbox
  const s = topo.transform ? topo.transform.scale : null
  const t = topo.transform ? topo.transform.translate : null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  topo.arcs.forEach(arc => {
    let px = 0
    let py = 0
    arc.forEach(point => {
      let gx
      let gy
      if (s) {
        px += point[0]
        py += point[1]
        gx = (px * s[0]) + t[0]
        gy = (py * s[1]) + t[1]
      } else {
        gx = point[0]
        gy = point[1]
      }
      if (gx < minX) minX = gx
      if (gy < minY) minY = gy
      if (gx > maxX) maxX = gx
      if (gy > maxY) maxY = gy
    })
  })
  return [minX, minY, maxX, maxY]
}

function buildProjection(geo, canvasDimensions) {
  const cacheKey = `${geo.label}-${canvasDimensions.width}-${canvasDimensions.height}`
  const cached = !!projectionCache[cacheKey]
  const dims = `${canvasDimensions.width}x${canvasDimensions.height}`
  // eslint-disable-next-line no-console
  console.info(`[proj] ${geo.label} canvas=${dims} cached=${cached}`)
  if (projectionCache[cacheKey]) return projectionCache[cacheKey]

  const opts = geo.projectionOptions || {}
  let proj

  if (geo.projection === 'albersUsa') {
    proj = geoAlbersUsa()
  } else if (geo.projection === 'conicConformal') {
    proj = geoConicConformal()
    if (opts.parallels) proj = proj.parallels(opts.parallels)
    if (opts.rotate) proj = proj.rotate(opts.rotate)
  } else {
    proj = geoMercator()
  }

  const [x0, y0, x1, y1] = topoJsonBbox(geo.topoJson)
  // eslint-disable-next-line no-console
  const bbox = [x0, y0, x1, y1].map(v => v.toFixed(3)).join(', ')
  // eslint-disable-next-line no-console
  console.info(`[proj] ${geo.label} bbox=[${bbox}]`)
  const bboxFeature = {
    type: 'Feature',
    geometry: {
      type: 'MultiPoint',
      coordinates: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]],
    },
  }
  const marginX = canvasDimensions.width * 0.10
  const marginY = canvasDimensions.height * 0.10
  proj.fitExtent(
    [[marginX, marginY], [canvasDimensions.width - marginX, canvasDimensions.height - marginY]],
    bboxFeature
  )
  // eslint-disable-next-line no-console
  const tr = proj.translate().map(v => v.toFixed(1)).join(', ')
  // eslint-disable-next-line no-console
  console.info(`[proj] ${geo.label} scale=${proj.scale().toFixed(1)} translate=[${tr}]`)

  projectionCache[cacheKey] = proj
  return proj
}

class GeographyResource {
  constructor() {
    this._geographies = geographies.map(geo => ({
      label: geo.label,
      group: geo.group,
      mapResource: new MapResource(geo.topoJson, geo.objectId),
      geoCodeToName: geo.nameHash,
      _config: geo,
    }))
  }

  getMapResource(label) {
    return this._geographies.find(g => g.label === label).mapResource
  }

  getGeographies() {
    return this._geographies
  }

  getGeoCodeHash(label) {
    return this._geographies.find(g => g.label === label).geoCodeToName
  }

  getProjection(label, canvasDimensions) {
    if (!label) return d => d
    const geo = geographies.find(g => g.label === label)
    if (!geo) return d => d
    return buildProjection(geo, canvasDimensions)
  }
}

export default new GeographyResource()

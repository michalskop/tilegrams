import {geoPath} from 'd3-geo'
import inside from 'point-in-polygon';
import area from 'area-polygon'
import topogramImport from 'topogram'

import Graphic from './Graphic'
import geographyResource from '../resources/GeographyResource'
import exporter from '../file/Exporter'
import {fipsColor, updateBounds, checkWithinBounds} from '../utils'
import {canvasDimensions} from '../constants'

const topogram = topogramImport()

const MIN_PATH_AREA = 0.5
const MAX_ITERATION_COUNT = 20
const MAX_ITERATION_DURATION = 1000 * 30
export default class MapGraphic extends Graphic {
  constructor() {
    super()
    this._stateFeatures = null
    this._iterationCount = 0
    this._iterationDuration = 0
    this._generalBounds = [[Infinity, Infinity], [-Infinity, -Infinity]]
    this.getFeatureAtPoint = this.getFeatureAtPoint.bind(this)
    topogram.iterations(1)
  }

  /** Apply topogram on topoJson using data in properties */
  computeCartogram(dataset) {
    // eslint-disable-next-line no-console
    console.info(`[cartogram] START geography=${dataset.geography} dataRows=${dataset.data.length}`)
    if (dataset.data.length > 0) {
      // eslint-disable-next-line no-console
      const r = dataset.data[0]
      // eslint-disable-next-line no-console
      console.info(`[cartogram] first row: id=${r[0]} (${typeof r[0]}) val=${r[1]}`)
    }

    topogram.value(feature => {
      const datum = dataset.data.find(d => d[0] === feature.id)
      return datum ? datum[1] : 1
    })
    this._iterationCount = 0
    this._iterationDuration = 0

    // compute initial cartogram from geography
    this.updatePreProjection(dataset.geography)

    // generate basemap for topogram
    this._baseMap = this._getbaseMapTopoJson(dataset)
    const numFeatures = this._baseMap.geometries.length
    const totalPts = this._baseMap.topo.arcs
      ? this._baseMap.topo.arcs.reduce((s, a) => s + a.length, 0) : 0
    const matchCount = this._baseMap.geometries.filter(g => {
      return dataset.data.some(d => d[0] === g.id)
    }).length
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.info(`[cartogram] f=${numFeatures} pts=${totalPts} match=${matchCount}/${numFeatures}`)

    const t0 = performance.now()
    const savedLog = console.log // eslint-disable-line no-console
    console.log = () => {} // eslint-disable-line no-console
    this._stateFeatures = topogram(
      this._baseMap.topo,
      this._baseMap.geometries
    )
    console.log = savedLog // eslint-disable-line no-console
    // eslint-disable-next-line no-console
    console.info(`[cartogram] initial topogram: ${(performance.now() - t0).toFixed(0)}ms`)

    this._precomputeBounds()
    // eslint-disable-next-line no-console
    console.info(`[cartogram] bounds: ${JSON.stringify(this._generalBounds)}`)
  }

  /**
   * Returns either the original map topojson and geometries or
   * a filtered version of the map if the data properties don't match the map.
   */
  _getbaseMapTopoJson(dataset) {
    const mapResource = geographyResource.getMapResource(dataset.geography)
    const baseMapTopoJson = mapResource.getTopoJson()
    let filteredTopoJson = null
    let filteredGeometries = null
    const baseMapLength = baseMapTopoJson.objects[mapResource.getObjectId()].geometries.length
    // for custom uploads with incomplete data
    if (dataset.data.length !== baseMapLength) {
      const statesWithData = dataset.data.map(datum => datum[0])
      filteredGeometries = baseMapTopoJson.objects[mapResource.getObjectId()].geometries
        .filter(geom => statesWithData.indexOf(geom.id) > -1)
      filteredTopoJson = JSON.parse(JSON.stringify(baseMapTopoJson)) // clones the baseMap
      // only pass filtered geometries to topogram generator
      filteredTopoJson.objects[mapResource.getObjectId()].geometries = filteredGeometries
    }
    return {
      topo: filteredTopoJson || baseMapTopoJson,
      geometries: filteredGeometries || mapResource.getGeometries(),
    }
  }

  /**
   * Calculate subsequent cartogram iterations.
   * Return true if iteration was performed, false if not.
   */
  iterateCartogram(geography) {
    const percentageDone = Math.max(
      this._iterationCount / MAX_ITERATION_COUNT,
      this._iterationDuration / MAX_ITERATION_DURATION
    )
    if (percentageDone >= 1) {
      return [false, percentageDone]
    }
    const prevStateFeatures = this._stateFeatures
    const then = performance.now()
    const mapResource = geographyResource.getMapResource(geography)
    topogram.projection(x => x)

    const topoJson = exporter.fromGeoJSON(this._stateFeatures, mapResource.getObjectId())
    const savedLog2 = console.log // eslint-disable-line no-console
    console.log = () => {} // eslint-disable-line no-console
    const iterGeoms = topoJson.objects[mapResource.getObjectId()].geometries
    this._stateFeatures = topogram(topoJson, iterGeoms)
    console.log = savedLog2 // eslint-disable-line no-console
    this._precomputeBounds()

    if (!isFinite(this._generalBounds[0][0])) {
      // Features degenerated (NaN cascade from near-zero-area municipality).
      // Restore last valid state so updateTilesFromMetrics can still populate tiles.
      // eslint-disable-next-line no-console
      console.info(`[carto] degeneration at iter ${this._iterationCount + 1} — rolling back`)
      this._stateFeatures = prevStateFeatures
      this._precomputeBounds()
      return [false, 1.0]
    }

    this._iterationCount++
    const elapsed = performance.now() - then
    this._iterationDuration += elapsed
    const pct = percentageDone.toFixed(2)
    // eslint-disable-next-line no-console
    console.info(`[carto] iter ${this._iterationCount} ${elapsed.toFixed(0)}ms pct=${pct}`)
    return [true, percentageDone]
  }

  resetBounds() {
    this._generalBounds = [[Infinity, Infinity], [-Infinity, -Infinity]]
  }

  /** Apply projection _before_ cartogram computation */
  updatePreProjection(geography) {
    const projection = geographyResource.getProjection(geography, canvasDimensions)
    topogram.projection(projection)
  }

  /** Pre-compute projected bounding boxes; filter out small-area paths */
  _precomputeBounds() {
    const pathProjection = geoPath()
    this._generalBounds = [[Infinity, Infinity], [-Infinity, -Infinity]]
    this._projectedStates = this._stateFeatures.features.map(feature => {
      const {type, coordinates} = feature.geometry
      const bounds = pathProjection.bounds(feature)
      updateBounds(this._generalBounds, bounds)
      // Build {outer, holes} per polygon for correct point-in-polygon testing
      let polygons
      if (type === 'MultiPolygon') {
        polygons = coordinates.map(polygon => ({outer: polygon[0], holes: polygon.slice(1)}))
      } else {
        polygons = [{outer: coordinates[0], holes: coordinates.slice(1)}]
      }
      const paths = polygons.filter(p => area(p.outer) > MIN_PATH_AREA)
      return {bounds, paths}
    })
  }

  render(ctx) {
    this._stateFeatures.features.forEach(feature => {
      ctx.beginPath()
      const {type, coordinates} = feature.geometry
      if (type === 'MultiPolygon') {
        coordinates.forEach(polygon => {
          polygon.forEach(ring => {
            ctx.moveTo(ring[0][0], ring[0][1])
            for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i][0], ring[i][1])
            ctx.closePath()
          })
        })
      } else {
        coordinates.forEach(ring => {
          ctx.moveTo(ring[0][0], ring[0][1])
          for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i][0], ring[i][1])
          ctx.closePath()
        })
      }
      ctx.fillStyle = fipsColor(feature.id)
      ctx.globalAlpha = 0.35
      ctx.fill('evenodd')
      ctx.globalAlpha = 1.0
    })
  }

  /** Find feature that contains given point */
  getFeatureAtPoint(point) {
    const pointDimensions = [point.x, point.y]

    // check if point is within general bounds of TopoJSON
    if (!checkWithinBounds(pointDimensions, this._generalBounds)) {
      return null
    }

    // for each feature: check bounds, then outer ring, then exclude holes
    return this._stateFeatures.features.find((feature, featureIndex) => {
      const bounds = this._projectedStates[featureIndex].bounds
      if (!checkWithinBounds(pointDimensions, bounds || this._generalBounds)) {
        return false
      }
      return this._projectedStates[featureIndex].paths.some(({outer, holes}) =>
        inside(pointDimensions, outer) &&
        !holes.some(hole => inside(pointDimensions, hole))
      )
    })
  }

  computeCartogramArea() {
    const path = geoPath()
    return this._stateFeatures.features.reduce((sum, feature) => {
      const a = path.area(feature)
      return isNaN(a) ? sum : sum + a
    }, 0)
  }
}

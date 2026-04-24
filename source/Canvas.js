import Stats from 'stats-js'

import GridGraphic from './graphics/GridGraphic'
import MapGraphic from './graphics/MapGraphic'
import gridGeometry from './geometry/GridGeometry'
import metrics from './Metrics'
import {devicePixelRatio, canvasDimensions, settings} from './constants'
import {createElement, isDevEnvironment} from './utils'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 50

class Canvas {
  constructor() {
    this._zoom = 1
    this._panX = 0  // CSS pixels
    this._panY = 0
    this._isPanning = false
    this._panLastX = 0
    this._panLastY = 0
    this._createCanvas()
    this._requestRender()
    this._initStats()
    this._mapGraphic = new MapGraphic()
    this._gridGraphic = new GridGraphic()
    this._cartogramReady = false
    this._cartogramArea = null
    this._progress = -1
  }

  setGeoCodeToName(geoCodeToName) {
    this._gridGraphic.geoCodeToName = geoCodeToName
  }

  computeCartogram(dataset) {
    this._mapGraphic.computeCartogram(dataset)
    this._setCartogramArea()
    const area = this._cartogramArea.toFixed(1)
    const edge = gridGeometry.getTileEdge()
    const counts = gridGeometry.getTileCounts()
    // eslint-disable-next-line no-console
    console.info(`[canvas] area=${area} edge=${edge} counts=${counts.width}x${counts.height}`)
    const t2 = performance.now()
    this.updateTiles()
    const ms2 = (performance.now() - t2).toFixed(0)
    const nTiles = this._gridGraphic.getTiles().length
    // eslint-disable-next-line no-console
    console.info(`[canvas] updateTiles ${ms2}ms tiles=${nTiles}`)
    this._cartogramReady = true
  }

  iterateCartogram(geography) {
    const [iterated, time] = this._mapGraphic.iterateCartogram(geography)
    this._progress = time;
    return [iterated, time]
  }

  importTiles(tiles) {
    this._mapGraphic.resetBounds()
    this._gridGraphic.importTiles(tiles)
    this._cartogramReady = true
  }

  updateTiles() {
    this._gridGraphic.populateTiles(this._mapGraphic)
  }

  updateTilesFromMetrics() {
    const idealHexArea =
      (this._cartogramArea * metrics.metricPerTile) / metrics.sumMetrics
    gridGeometry.setTileEdgeFromArea(idealHexArea)
    this.updateTiles()
  }

  _setCartogramArea() {
    this._cartogramArea = this._mapGraphic.computeCartogramArea()
  }

  getGrid() {
    return this._gridGraphic
  }

  getMap() {
    return this._mapGraphic
  }

  resetViewport() {
    this._zoom = 1
    this._panX = 0
    this._panY = 0
  }

  resize() {
    this._canvas.width = canvasDimensions.width
    this._canvas.height = canvasDimensions.height
    this._canvas.style.width = `${canvasDimensions.width / devicePixelRatio}px`
    if (this._gridGraphic) {
      this._gridGraphic.renderBackgroundImage()
    }
  }

  _createCanvas() {
    const container = createElement({id: 'canvas'})
    this._canvas = document.createElement('canvas')
    this.resize()

    container.appendChild(this._canvas)
    this._ctx = this._canvas.getContext('2d')

    this._canvas.onmousedown = this._onMouseDown.bind(this)
    this._canvas.onmouseup = this._onMouseUp.bind(this)
    this._canvas.onmousemove = this._onMouseMove.bind(this)
    this._canvas.ondblclick = this._onDoubleClick.bind(this)
    this._canvas.addEventListener('wheel', this._onWheel.bind(this), {passive: false})

    document.onmouseup = this._bodyOnMouseUp.bind(this)
  }

  /** stats.js fps indicator */
  _initStats() {
    this._stats = new Stats()
    this._stats.domElement.style.position = 'absolute'
    this._stats.domElement.style.right = 0
    this._stats.domElement.style.top = 0
    if (isDevEnvironment()) {
      document.body.appendChild(this._stats.domElement)
    }
  }

  _requestRender() {
    requestAnimationFrame(this._render.bind(this))
  }

  _render() {
    this._requestRender()
    this._stats.begin()
    this._ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height)

    if (this._cartogramReady) {
      if (settings.displayGrid) {
        this._ctx.save()
        this._ctx.translate(
          this._panX * devicePixelRatio,
          this._panY * devicePixelRatio
        )
        this._ctx.scale(this._zoom, this._zoom)
        this._gridGraphic.render(this._ctx, this._zoom)
        this._ctx.restore()
        this._gridGraphic.renderOverlays(
          this._ctx,
          this._zoom,
          this._panX * devicePixelRatio,
          this._panY * devicePixelRatio
        )
      }
    }
    if (this._progress >= 0 && this._progress < 1) {
      this._ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      this._ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height)
      const fullBarWidth = Math.min(400, canvasDimensions.width / 3)
      const barX = (canvasDimensions.width / 2) - (fullBarWidth / 2);
      const progressBarWidth = this._progress * fullBarWidth
      const barHeight = 30
      const barY = (canvasDimensions.height / 2) - (barHeight / 2);
      this._ctx.fillStyle = '#fff';
      this._ctx.fillRect(barX, barY, fullBarWidth, barHeight);
      this._ctx.fillStyle = '#666';
      this._ctx.fillRect(barX, barY, progressBarWidth, barHeight)
      this._ctx.fillStyle = '#fff';

      this._ctx.textAlign = 'center'
      this._ctx.textBaseline = 'middle'
      this._ctx.font = `${16.0 * devicePixelRatio}px Fira Sans`

      const label = 'Computing Tilegram...'
      this._ctx.fillText(label, canvasDimensions.width / 2, barY - 16)
    }
    this._stats.end()
  }

  /** Transform CSS-pixel event coords into canvas-space coords (pre-zoom/pan). */
  _adjustEvent(event) {
    return {
      offsetX: (event.offsetX - this._panX) / this._zoom,
      offsetY: (event.offsetY - this._panY) / this._zoom,
      preventDefault: () => event.preventDefault(),
    }
  }

  _onWheel(event) {
    event.preventDefault()
    const delta = event.deltaMode === 0 ? event.deltaY : event.deltaY * 30
    const factor = delta < 0 ? 1.12 : 1 / 1.12
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this._zoom * factor))
    const ratio = newZoom / this._zoom
    // Keep the point under the cursor stationary
    this._panX = event.offsetX - ((event.offsetX - this._panX) * ratio)
    this._panY = event.offsetY - ((event.offsetY - this._panY) * ratio)
    this._zoom = newZoom
  }

  _onMouseDown(event) {
    if (event.button === 1) {
      this._isPanning = true
      this._panLastX = event.offsetX
      this._panLastY = event.offsetY
      this._canvas.style.cursor = 'grabbing'
      event.preventDefault()
      return
    }
    this._gridGraphic.onMouseDown(this._adjustEvent(event), this._ctx)
  }

  _onMouseUp(event) {
    if (this._isPanning) {
      this._isPanning = false
      this._canvas.style.cursor = ''
      return
    }
    this._gridGraphic.onMouseUp(this._adjustEvent(event), this._ctx)
  }

  _onMouseMove(event) {
    if (this._isPanning) {
      this._panX += event.offsetX - this._panLastX
      this._panY += event.offsetY - this._panLastY
      this._panLastX = event.offsetX
      this._panLastY = event.offsetY
      return
    }
    this._gridGraphic.onMouseMove(this._adjustEvent(event), this._ctx)
  }

  _onDoubleClick(event) {
    this._gridGraphic.onDoubleClick(this._adjustEvent(event), this._ctx)
  }

  _bodyOnMouseUp(event) {
    if (event.target === this._canvas) {
      return
    }
    this._isPanning = false
    this._canvas.style.cursor = ''
    this._gridGraphic.bodyOnMouseUp(event, this.ctx)
  }
}

export default new Canvas()

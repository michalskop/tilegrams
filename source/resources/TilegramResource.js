import geographies from '../geographies'

class TilegramResource {
  constructor() {
    this._tilegrams = geographies.reduce((acc, geo) => {
      return acc.concat((geo.tilegrams || []).map(tg => ({
        label: tg.label,
        topoJson: tg.topoJson,
        geography: geo.label,
      })))
    }, [])
  }

  getLabels() {
    return this._tilegrams.map(tilegram => tilegram.label)
  }

  getTilegram(geography, index) {
    const tilegram = this.getTilegramsByGeography(geography)[index]
    return tilegram ? tilegram.topoJson : undefined
  }

  getTilegramsByGeography(geography) {
    return this._tilegrams.filter(tilegram => tilegram.geography === geography)
  }
}

export default new TilegramResource()

import {csvParseRows} from 'd3-dsv'
import geographyResource from './GeographyResource'
import geographies from '../geographies'

class DatasetResource {
  constructor() {
    this._datasets = geographies.reduce((acc, geo) => {
      return acc.concat(geo.datasets.map(ds => ({
        label: ds.label,
        data: this.parseCsv(ds.csv, geo.label),
        geography: geo.label,
        defaultResolution: ds.defaultResolution,
      })))
    }, [])
    this._selectedDatasetIndex = 2
  }

  _validateFips(fips) {
    return fips && fips.length < 2 ? `0${fips}` : fips
  }

  parseCsv(csv, geography, customUpload) {
    const mapResource = geographyResource.getMapResource(geography)
    const features = mapResource.getUniqueFeatureIds()
    const badMapIds = []
    const badValueIds = []
    csv = csv.replace(/^\uFEFF/, '').trim()
    let parsed
    if (geography === 'United States') {
      parsed = csvParseRows(csv, d => [this._validateFips(d[0]), parseFloat(d[1])])
    } else {
      parsed = csvParseRows(csv, d => [d[0], parseFloat(d[1])])
    }
    if (customUpload) {
      parsed = parsed.filter(row => {
        const hasId = (features.indexOf(row[0]) > -1)
        if (!hasId) {
          badMapIds.push(row[0])
        }
        if (row[1] <= 0 || isNaN(row[1])) {
          badValueIds.push(row[0])
        }
        return hasId && row[1] > 0
      })
      if (badMapIds.length || badValueIds.length) {
        this._warnDataErrors(badMapIds, badValueIds)
      }
    }
    return parsed
  }

  _warnDataErrors(badMapIds, badValueIds) {
    const mapIdString = badMapIds.map(id => `"${id}"`).join(', ')
    const valueIdString = badValueIds.map(id => `"${id}"`).join(', ')
    let alertString = ''
    if (mapIdString) {
      alertString += `There is no associated map data associated with id(s): ${mapIdString}.`
    }
    if (valueIdString) {
      alertString += ` Ids ${valueIdString} have zero or negative value.`
    }
    alertString += ' This data has been pruned.'
    // eslint-disable-next-line no-alert
    alert(alertString)
  }

  getLabels() {
    return this._datasets.map(dataset => dataset.label)
  }

  getDataset(geography, index) {
    return this.getDatasetsByGeography(geography)[index]
  }

  getDatasetGeography(index) {
    return this._datasets[index].geography
  }

  getDatasetsByGeography(geography) {
    return this._datasets.filter(dataset => dataset.geography === geography)
  }

  buildDatasetFromCustomCsv(geography, csv) {
    return {
      data: this.parseCsv(csv, geography, true),
      geography,
    }
  }
}

export default new DatasetResource()

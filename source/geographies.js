/* eslint-disable max-len */
/**
 * Single source of truth for all supported geographies.
 * To add a new geography: import its files below and add one entry to the array.
 *
 * Each entry shape:
 *   label             {string}  Unique display name (used as ID throughout the app)
 *   group             {string}  Dropdown group heading (continent / region)
 *   projection        {string}  'albersUsa' | 'mercator' | 'conicConformal'
 *   projectionOptions {object}  Optional params for conicConformal: { parallels, rotate }
 *   topoJson          {object}  Imported TopoJSON
 *   objectId          {string}  Key inside topoJson.objects
 *   nameHash          {object}  Imported JSON mapping feature id → { name }
 *   datasets          {Array}   { label, csv, defaultResolution? }
 *   tilegrams         {Array}   { label, topoJson }
 */

import usTopoJson from '../maps/us/us-110m.topo.json'
import germanyConstituencyTopoJson from '../maps/germany/constituency.topo.json'
import germanyBtw2025TopoJson from '../maps/germany/btw25_wahlkreise.topo.json'
import franceRegionTopoJson from '../maps/france/region.topo.json'
import franceDepartmentTopoJson from '../maps/france/department.topo.json'
import netherlandsTopoJson from '../maps/netherlands/netherlands.topo.json'
import brazilTopoJson from '../maps/brazil/brazil.topo.json'
import irelandTopoJson from '../maps/ireland/Irish_Constituencies.topo.json'
import ukRegionsTopoJson from '../maps/uk/uk_countries_and_england_regions.topo.json'
import indiaTopoJson from '../maps/india/india.topo.json'
import czechiaTopoJson from '../maps/czechia/cz4.topo.json'
import czechiaCountiesTopoJson from '../maps/czechia/okresy.topo.json'
import czechiaSenateTopoJson from '../maps/czechia/senat.topo.json'
import slovakiaTopoJson from '../maps/slovakia/slovakia.topo.json'
import slovakiaCountiesTopoJson from '../maps/slovakia/slovakia.adjusted.counties.topo.json'
import polandRegionsTopoJson from '../maps/poland/wojewodztwa-min.topo.json'
import austriaBezirkeTopoJson from '../maps/austria/at_bezirke_id.topo.json'
import boliviaTopoJson from '../maps/bolivia/bolivia.topo.json'
import testTopoJson from '../maps/test/test.topo.json'

import fipsHash from '../data/us/fips-to-state.json'
import wkrHash from '../data/germany/wkr-to-name.json'
import btw2025Hash from '../data/germany/btw25_wahlkreise.names.json'
import regionHash from '../data/france/region-to-name.json'
import departmentHash from '../data/france/department-to-name.json'
import netherlandsHash from '../data/netherlands/netherlands-names.json'
import brazilHash from '../data/brazil/brazil-names.json'
import irelandHash from '../data/ireland/constituency_names.json'
import ukRegionsHash from '../data/uk/uk_region_names.json'
import indiaHash from '../data/india/india_names.json'
import czechiaHash from '../data/czechia/cz-names4.json'
import czechiaCountiesHash from '../data/czechia/okresy.json'
import czechiaSenateHash from '../data/czechia/senat.json'
import slovakiaHash from '../data/slovakia/slovakia-names.json'
import slovakiaCountiesHash from '../data/slovakia/slovakia.counties.names.json'
import polandRegionsHash from '../data/poland/wojewodztwa-names.json'
import austriaBezirkeHash from '../data/austria/at_bezirke-names.json'
import boliviaHash from '../data/bolivia/bolivia-names.json'
import testHash from '../data/test/test-names.json'

import populationCsv from '../data/us/population-by-state.csv'
import electoralCollegeCsv from '../data/us/electoral-college-votes-by-state.csv'
import electoralCollege2024Csv from '../data/us/electoral-college-votes-by-state-2024.csv'
import gdpCsv from '../data/us/gdp-by-state.csv'
import congressionalDistricts2018Csv from '../data/us/congressional-districts-2018.csv'
import germanyConstituencyCsv from '../data/germany/constituencies.csv'
import germanyConstituency2Csv from '../data/germany/constituencies2.csv'
import franceRegionPopulationCsv from '../data/france/region-population.csv'
import franceDepartmentCsv from '../data/france/departments.csv'
import netherlandsPopulationCsv from '../data/netherlands/netherlands-populations.csv'
import brazilPopulationCsv from '../data/brazil/brazil-populations.csv'
import irelandVotesCsv from '../data/ireland/constituency_values.csv'
import ukRegionCountsCsv from '../data/uk/uk_region_constituency_counts.csv'
import indiaConstituencyCountsCsv from '../data/india/india_constituency_counts.csv'
import czechiaPopulationCsv from '../data/czechia/cz-populations4.csv'
import czechiaCountiesPopulationCsv from '../data/czechia/okresy-populations.csv'
import czechiaSenate1Csv from '../data/czechia/cz-senat-1.csv'
import slovakiaPopulationCsv from '../data/slovakia/sk-populations.csv'
import slovakiaCountiesPopulationCsv from '../data/slovakia/slovakia.counties.voters2024_est99.csv'
import polandRegionsVoters2019Csv from '../data/poland/wojewodztwa-voters2019.csv'
import polandRegionsPopulationCsv from '../data/poland/wojewodztwa-population.csv'
import austriaBezirkePopulationCsv from '../data/austria/at_bezirke-population.csv'
import boliviaPopulationCsv from '../data/bolivia/bolivia-population.csv'
import testPopulationCsv from '../data/test/test-population.csv'

import pitchElectoralCollegeTilegram from '../tilegrams/pitch-electoral-college.json'
import pitchPopulationTilegram from '../tilegrams/pitch-us-population-500k.json'
import nprOneToOneTilegram from '../tilegrams/npr-one-to-one.json'
import fiveThirtyEightTilegram from '../tilegrams/fivethirtyeight-electoral-college-tilegram.json'
import francePopulationTilegram from '../tilegrams/france-population.json'
import francePopulationOverseasTilegram from '../tilegrams/france-population-with-overseas.json'
import franceOneToOneDeptTilegram from '../tilegrams/france-departments-one-to-one.json'
import germanyConstituenciesTilegram from '../tilegrams/germany-constituencies.json'
import usCongress2018Tilegram from '../tilegrams/us-congressional-districts-2018.json'
import usCongress2018BrokenOut from '../tilegrams/us-congressional-districts-2018-brokenout.json'
import brazilStatesPopulationTilegram from '../tilegrams/brazil-states-population.json'
import ukRegionsTilegram from '../tilegrams/uk-regions.json'
import indiaConstituenciesTilegram from '../tilegrams/india-constituencies.json'

export default [
  {
    label: 'United States',
    group: 'North America',
    projection: 'albersUsa',
    topoJson: usTopoJson,
    objectId: 'states',
    nameHash: fipsHash,
    datasets: [
      {label: 'U.S. Population 2016', csv: populationCsv, defaultResolution: 1000000},
      {label: 'U.S. Electoral College 2016', csv: electoralCollegeCsv, defaultResolution: 1},
      {label: 'U.S. Electoral College 2024', csv: electoralCollege2024Csv, defaultResolution: 1},
      {label: 'U.S. GDP 2015 (Millions)', csv: gdpCsv},
      {label: 'U.S. Congressional Districts 2018', csv: congressionalDistricts2018Csv, defaultResolution: 1},
    ],
    tilegrams: [
      {label: 'Pitch Electoral College', topoJson: pitchElectoralCollegeTilegram},
      {label: 'Pitch U.S. Population 2016', topoJson: pitchPopulationTilegram},
      {label: 'FiveThirtyEight Electoral College', topoJson: fiveThirtyEightTilegram},
      {label: 'NPR 1-to-1', topoJson: nprOneToOneTilegram},
      {label: 'U.S. Congressional Districts 2018', topoJson: usCongress2018Tilegram},
      {label: 'U.S. Congressional Districts 2018 Broken Out By State', topoJson: usCongress2018BrokenOut},
    ],
  },
  {
    label: 'United Kingdom - Regions',
    group: 'Europe',
    projection: 'mercator',
    topoJson: ukRegionsTopoJson,
    objectId: 'uk_countries_and_england_regions',
    nameHash: ukRegionsHash,
    datasets: [
      {label: 'United Kingdom - Regions', csv: ukRegionCountsCsv, defaultResolution: 1},
    ],
    tilegrams: [
      {label: 'United Kingdom - Regions', topoJson: ukRegionsTilegram},
    ],
  },
  {
    label: 'Germany - Constituencies',
    group: 'Europe',
    projection: 'mercator',
    topoJson: germanyConstituencyTopoJson,
    objectId: 'constituencies',
    nameHash: wkrHash,
    datasets: [
      {label: 'Germany Constituency 1-to-1', csv: germanyConstituencyCsv, defaultResolution: 1},
    ],
    tilegrams: [
      {label: 'Germany Constituencies 1-to-1', topoJson: germanyConstituenciesTilegram},
    ],
  },
  {
    label: 'Germany - Constituencies 2025',
    group: 'Europe',
    projection: 'mercator',
    topoJson: germanyBtw2025TopoJson,
    objectId: 'btw25_wahlkreise',
    nameHash: btw2025Hash,
    datasets: [
      {label: 'Germany Constituency 1-to-1 2025', csv: germanyConstituency2Csv, defaultResolution: 1},
    ],
    tilegrams: [],
  },
  {
    label: 'France - Regions',
    group: 'Europe',
    projection: 'mercator',
    topoJson: franceRegionTopoJson,
    objectId: 'regions',
    nameHash: regionHash,
    datasets: [
      {label: 'France Region Population', csv: franceRegionPopulationCsv, defaultResolution: 100000},
    ],
    tilegrams: [
      {label: 'France Population', topoJson: francePopulationTilegram},
      {label: 'France Population With Overseas', topoJson: francePopulationOverseasTilegram},
    ],
  },
  {
    label: 'France - Departments',
    group: 'Europe',
    projection: 'mercator',
    topoJson: franceDepartmentTopoJson,
    objectId: 'departments',
    nameHash: departmentHash,
    datasets: [
      {label: 'France Department 1-to-1', csv: franceDepartmentCsv, defaultResolution: 1},
    ],
    tilegrams: [
      {label: 'France Departments 1-to-1', topoJson: franceOneToOneDeptTilegram},
    ],
  },
  {
    label: 'Netherlands',
    group: 'Europe',
    projection: 'mercator',
    topoJson: netherlandsTopoJson,
    objectId: 'dutch municipalities',
    nameHash: netherlandsHash,
    datasets: [
      {label: 'Netherlands – Population', csv: netherlandsPopulationCsv, defaultResolution: 50000},
    ],
    tilegrams: [],
  },
  {
    label: 'Ireland',
    group: 'Europe',
    projection: 'mercator',
    topoJson: irelandTopoJson,
    objectId: 'Irish_Constituencies',
    nameHash: irelandHash,
    datasets: [
      {label: 'Ireland Constituencies', csv: irelandVotesCsv, defaultResolution: 1},
    ],
    tilegrams: [],
  },
  {
    label: 'Czechia',
    group: 'Europe',
    projection: 'conicConformal',
    projectionOptions: {parallels: [48.5, 50.5], rotate: [-15.5, 0]},
    topoJson: czechiaTopoJson,
    objectId: 'kraje_noprague',
    nameHash: czechiaHash,
    datasets: [
      {label: 'Czechia – Population 2021', csv: czechiaPopulationCsv, defaultResolution: 50000},
    ],
    tilegrams: [],
  },
  {
    label: 'Czechia - counties',
    group: 'Europe',
    projection: 'conicConformal',
    projectionOptions: {parallels: [48.5, 50.5], rotate: [-15.5, 0]},
    topoJson: czechiaCountiesTopoJson,
    objectId: 'okresy',
    nameHash: czechiaCountiesHash,
    datasets: [
      {label: 'Czechia – Counties Population', csv: czechiaCountiesPopulationCsv, defaultResolution: 25000},
    ],
    tilegrams: [],
  },
  {
    label: 'Czechia - senate',
    group: 'Europe',
    projection: 'conicConformal',
    projectionOptions: {parallels: [48.5, 50.5], rotate: [-15.5, 0]},
    topoJson: czechiaSenateTopoJson,
    objectId: 'senat',
    nameHash: czechiaSenateHash,
    datasets: [
      {label: 'Czechia – Senate - 1', csv: czechiaSenate1Csv, defaultResolution: 1000},
    ],
    tilegrams: [],
  },
  {
    label: 'Slovakia',
    group: 'Europe',
    projection: 'conicConformal',
    projectionOptions: {parallels: [47.5, 49.5], rotate: [-19.5, 0]},
    topoJson: slovakiaTopoJson,
    objectId: 'kraje',
    nameHash: slovakiaHash,
    datasets: [
      {label: 'Slovakia – Population', csv: slovakiaPopulationCsv, defaultResolution: 50000},
    ],
    tilegrams: [],
  },
  {
    label: 'Slovakia - counties',
    group: 'Europe',
    projection: 'conicConformal',
    projectionOptions: {parallels: [47.5, 49.5], rotate: [-19.5, 0]},
    topoJson: slovakiaCountiesTopoJson,
    objectId: 'counties',
    nameHash: slovakiaCountiesHash,
    datasets: [
      {label: 'Slovakia – Counties Population', csv: slovakiaCountiesPopulationCsv, defaultResolution: 50000},
    ],
    tilegrams: [],
  },
  {
    label: 'Poland - regions',
    group: 'Europe',
    projection: 'conicConformal',
    projectionOptions: {parallels: [48.5, 53.7], rotate: [-19.1, 0]},
    topoJson: polandRegionsTopoJson,
    objectId: 'wojewodztwa-min',
    nameHash: polandRegionsHash,
    datasets: [
      {label: 'Poland – Population', csv: polandRegionsPopulationCsv, defaultResolution: 250000},
      {label: 'Poland – Voters 2019', csv: polandRegionsVoters2019Csv, defaultResolution: 100000},
    ],
    tilegrams: [],
  },
  {
    label: 'Austria - bezirke',
    group: 'Europe',
    projection: 'conicConformal',
    projectionOptions: {parallels: [46, 50], rotate: [-12.5, 0]},
    topoJson: austriaBezirkeTopoJson,
    objectId: 'bezirks',
    nameHash: austriaBezirkeHash,
    datasets: [
      {label: 'Austria – Bezirke Population 2024', csv: austriaBezirkePopulationCsv, defaultResolution: 5000},
    ],
    tilegrams: [],
  },
  {
    label: 'Brazil',
    group: 'South America',
    projection: 'mercator',
    topoJson: brazilTopoJson,
    objectId: 'estados',
    nameHash: brazilHash,
    datasets: [
      {label: 'Brazil – Population 2017', csv: brazilPopulationCsv, defaultResolution: 500000},
    ],
    tilegrams: [
      {label: 'Brazil States Population 2017', topoJson: brazilStatesPopulationTilegram},
    ],
  },
  {
    label: 'Bolivia',
    group: 'South America',
    projection: 'mercator',
    topoJson: boliviaTopoJson,
    objectId: 'bo',
    nameHash: boliviaHash,
    datasets: [
      {label: 'Bolivia – Population', csv: boliviaPopulationCsv, defaultResolution: 50000},
    ],
    tilegrams: [],
  },
  {
    label: 'India',
    group: 'Asia',
    projection: 'mercator',
    topoJson: indiaTopoJson,
    objectId: 'india',
    nameHash: indiaHash,
    datasets: [
      {label: 'India Constituencies', csv: indiaConstituencyCountsCsv, defaultResolution: 1},
    ],
    tilegrams: [
      {label: 'India Constituencies', topoJson: indiaConstituenciesTilegram},
    ],
  },
  {
    label: 'Test',
    group: 'Test',
    projection: 'mercator',
    topoJson: testTopoJson,
    objectId: 'estados',
    nameHash: testHash,
    datasets: [
      {label: 'Test – Population', csv: testPopulationCsv, defaultResolution: 500000},
    ],
    tilegrams: [],
  },
]

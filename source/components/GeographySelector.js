import React from 'react'
import GeographyResource from '../resources/GeographyResource'

export default function GeographySelector(props) {
  const selectGeography = (event) => {
    props.selectGeography(event.target.value)
  }

  const grouped = {}
  GeographyResource.getGeographies().forEach(geography => {
    const group = geography.group || 'Other'
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(geography)
  })

  const options = Object.keys(grouped).map(groupName => (
    <optgroup key={groupName} label={groupName}>
      {grouped[groupName].map((geography, i) => (
        <option key={i} value={geography.label}>
          {geography.label}
        </option>
      ))}
    </optgroup>
  ))

  return (
    <div className='geographySelector'>
      Select base map
      <fieldset>
        <select onChange={selectGeography} value={props.selectedGeography}>
          {options}
        </select>
      </fieldset>
    </div>
  )
}
GeographySelector.propTypes = {
  selectedGeography: React.PropTypes.string,
  selectGeography: React.PropTypes.func,
}

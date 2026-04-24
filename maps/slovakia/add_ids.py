"""Add ids to geojsons."""

import json

path = "/home/michal/dev/cartograms/tilegrams/tilegrams/maps/slovakia/"

with open(path + "slovakia.adjusted.counties.topo.json", "r") as f:
  data = json.load(f)

for feature in data["objects"]["counties"]["geometries"]:
  feature["id"] = feature["properties"]["LAU1_CODE"]

with open(path + "slovakia.adjusted.counties.topo.json", "w") as f:
  json.dump(data, f, ensure_ascii=False)

# create the files with names of counties
with open(path + "slovakia.counties.json", "r") as f:
  data = json.load(f)

out = {}
for feature in data["objects"]["slovakia.counties"]["geometries"]:
  out[feature["id"]] = {
    "name": feature["properties"]["LAU1"]
  }

with open(path + "slovakia.counties.names.json", "w") as f:
  json.dump(out, f)
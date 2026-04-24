"""Add ids to topojsons."""

import json

path = "/home/michal/dev/cartograms/tilegrams/tilegrams/maps/germany/"

with open(path + "btw25_wahlkreise.topo.json", "r") as f:
  data = json.load(f)

for feature in data["objects"]["btw25_wahlkreise"]["geometries"]:
  feature["id"] = str(feature["properties"]["WKR_NR"])

with open(path + "btw25_wahlkreise.topo.json", "w") as f:
  json.dump(data, f, ensure_ascii=False)

# # create the files with names of counties
# with open(path + "senat.topo.json", "r") as f:
#   data = json.load(f)

# out = {}
# for feature in data["objects"]["senat"]["geometries"]:
#   out[feature["id"]] = {
#     "name": feature["properties"]["senate"] + " (" + feature["properties"]["senate_id"] + ")"
#   }

# with open(path + "senat.json", "w") as f:
#   json.dump(out, f, ensure_ascii=False)
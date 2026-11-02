#!/bin/zsh
# Overnight: day + night lightmaps and reflection probes for the real-time studio (keeps the Mac awake).
cd "$(dirname "$0")/../.."
B=/Applications/Blender.app/Contents/MacOS/Blender
$B -b _source/bake/studio_bake.blend -P tools/blender/bake_lightmaps.py -- day "" 256 1 > _source/bake/bake_day.log 2>&1
echo "day exit $?"
$B -b _source/bake/studio_bake.blend -P tools/blender/bake_lightmaps.py -- night "" 384 1 > _source/bake/bake_night.log 2>&1
echo "night exit $?"
grep -h "baked\|probe\|DONE\|OIDN" _source/bake/lightmaps/bake.log | tail -20

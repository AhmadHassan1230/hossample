#!/bin/zsh
# Waits for the overnight bake, then: night lightmaps → web, the jacaranda → web.
cd "$(dirname "$0")/.."
B=/Applications/Blender.app/Contents/MacOS/Blender
while pgrep -f bake_overnight.sh > /dev/null; do sleep 60; done
$B -b --factory-startup -P tools/blender/lightmaps_web.py -- night 2>&1 | grep -E "^LM|^PROBE|MANIFEST|Error"
$B -b --factory-startup -P tools/blender/tree_web.py 2>&1 | grep -E "TREE|Error"
npm_config_cache=/tmp/npm-cache-hos npx -y @gltf-transform/cli@4 meshopt _source/bake/tree_raw.glb public/studio/tree.glb 2>&1 | tail -1
echo "after-bake done"

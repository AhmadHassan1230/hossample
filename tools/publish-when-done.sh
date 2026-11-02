#!/bin/zsh
# Waits for the final Cycles render, then sharpens + converts every frame and swaps
# it into public/journey so a page reload shows the complete version.
P="/Users/ahmadhassan/Documents/ChatGPT/Client Work/house-of-sultana"
LOG=/tmp/hos-final.log
while ! grep -q "^exit" "$LOG" 2>/dev/null; do sleep 60; done
cd "$P" || exit 1
rm -rf public/journey_next
node tools/frames.mjs _source/bake/final public/journey_next 177 16 --sharpen \
  && rm -rf public/journey && mv public/journey_next public/journey \
  && echo "published $(date)" >> /tmp/hos-publish.log

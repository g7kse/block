#!/bin/bash
# Launches the bundled Node static server and opens the app in the default browser.
set -e
export PORT="${PORT:-8743}"
exec node "$SNAP/app/server/server.js"

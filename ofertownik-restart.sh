#!/usr/bin/env bash

SESSION_NAME="ofertownik"
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$PROJECT_ROOT" || exit 1

# Stop existing session if present
if screen -list | grep -q "\.${SESSION_NAME}\t"; then
  echo "Stopping existing session '$SESSION_NAME'..."
  screen -S "$SESSION_NAME" -X quit || true
  # small delay to free the name
  sleep 1
fi

# Free port 5001 before starting
if [ -x "$PROJECT_ROOT/free-port-5001.sh" ]; then
  "$PROJECT_ROOT/free-port-5001.sh"
fi

echo "Starting fresh session '$SESSION_NAME'..."
screen -dmS "$SESSION_NAME" bash -lc "npm run start 2>&1 | tee -a $PROJECT_ROOT/ofertownik.log"

sleep 1

if screen -list | grep -q "\.${SESSION_NAME}\t"; then
  echo "Restarted. Attach: screen -r $SESSION_NAME | Logs: $PROJECT_ROOT/ofertownik.log"
else
  echo "Failed to start screen session."
  exit 1
fi



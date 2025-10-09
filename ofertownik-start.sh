#!/usr/bin/env bash

# Name of the screen session
SESSION_NAME="ofertownik"

# Absolute project root
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Ensure we run from project root
cd "$PROJECT_ROOT" || exit 1

# Use Node from PATH; you can customize with NVM if needed

# If session exists, just inform and exit
if screen -list | grep -q "\.${SESSION_NAME}\t"; then
  echo "Screen session '$SESSION_NAME' already running. Attach with: screen -r $SESSION_NAME"
  exit 0
fi

# Start server in a detached screen session
echo "Starting ofertownik in screen session '$SESSION_NAME'..."
screen -dmS "$SESSION_NAME" bash -lc "npm run start 2>&1 | tee -a $PROJECT_ROOT/ofertownik.log"

sleep 1

if screen -list | grep -q "\.${SESSION_NAME}\t"; then
  echo "Started. Logs: $PROJECT_ROOT/ofertownik.log"
else
  echo "Failed to start screen session. Check Node/npm availability."
  exit 1
fi



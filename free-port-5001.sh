#!/usr/bin/env bash

PORT=5001

echo "Freeing port $PORT (if in use)..."

# Try using fuser if available (common on Linux)
if command -v fuser >/dev/null 2>&1; then
  sudo fuser -k ${PORT}/tcp 2>/dev/null || true
fi

# Fallback to lsof if available
if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -ti tcp:${PORT} || true)
  if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs -r kill -9 || true
  fi
fi

# Final check using ss or netstat
if command -v ss >/dev/null 2>&1; then
  if ss -ltn | awk '{print $4}' | grep -q ":${PORT}$"; then
    echo "Port ${PORT} still appears in LISTEN. Attempting broader kill (root may be required)."
    if command -v fuser >/dev/null 2>&1; then
      sudo fuser -k -9 ${PORT}/tcp || true
    fi
  fi
elif command -v netstat >/dev/null 2>&1; then
  if netstat -ltn | awk '{print $4}' | grep -q ":${PORT}$"; then
    echo "Port ${PORT} still appears in LISTEN."
  fi
fi

echo "Port $PORT freed (or was not in use)."



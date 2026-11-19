#!/usr/bin/env bash
set -euo pipefail

echo "📱 Memulai eksekusi tes di Android Emulator..."
echo "🎯 Fitur Target: ${TARGET_FEATURE:-all}"

if [ -n "${TARGET_FEATURE:-}" ] && [ "$TARGET_FEATURE" != "all" ]; then
  npm run "test:feature:${TARGET_FEATURE}"
else
  npm run test:android
fi

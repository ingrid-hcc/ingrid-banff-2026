#!/bin/bash
cd "$HOME/ingrid-banff-2026" || exit 1
git add -A
git commit -m "update $(date '+%Y-%m-%d %H:%M')"
git push
echo "✅ 網站已更新！https://ingrid-hcc.github.io/ingrid-banff-2026/"

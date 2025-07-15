#!/bin/bash

# 빌드 후 Resources 폴더에 아이콘 강제 복사
dist_app=$(find dist/mac dist/mac-arm64 -name "*.app" 2>/dev/null | head -1)
if [ -z "$dist_app" ]; then
  echo "앱 번들을 찾을 수 없습니다."
  exit 1
fi
resources_dir="$dist_app/Contents/Resources"
if [ ! -d "$resources_dir" ]; then
  echo "Resources 폴더가 없습니다: $resources_dir"
  exit 1
fi
cp frontend/src/assets/icons/icon.icns "$resources_dir/electron.icns"
echo "아이콘을 $resources_dir/electron.icns 로 복사 완료!"


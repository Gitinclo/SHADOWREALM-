#!/usr/bin/env bash
set -euo pipefail

echo "🚀 ShadowRealm Setup Starting..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# ─────────────────────────────────────────────
# Helper: download a file and VERIFY it isn't HTML
# ─────────────────────────────────────────────
download_verify() {
  local url="$1"
  local out="$2"
  local type="$3"   # "zip" or "text"

  echo "⬇️  Downloading $out ..."
  # -f = fail on HTTP error (404/403 -> non-zero exit, NO html saved)
  # -L = follow redirects
  # -S = show errors
  if ! curl -fSL "$url" -o "$out"; then
    echo "❌ Download failed (HTTP error) for: $url"
    exit 1
  fi

  # Guard: reject HTML error pages masquerading as our file
  if head -c 512 "$out" | grep -qiE "<!doctype html|<html"; then
    echo "❌ ERROR: $out contains HTML, not a valid $type file!"
    echo "   URL likely returned an error page: $url"
    rm -f "$out"
    exit 1
  fi

  if [ "$type" = "zip" ]; then
    if ! unzip -tq "$out" >/dev/null 2>&1; then
      echo "❌ ERROR: $out is not a valid zip archive!"
      rm -f "$out"
      exit 1
    fi
  fi

  echo "✅ Verified $out"
}

# ─────────────────────────────────────────────
# 1. GLAD (pre-generated, gl:core 3.3) — NO python/jinja2 needed
# ─────────────────────────────────────────────
GLAD_DIR="$ROOT_DIR"
GLAD_HEADER="$GLAD_DIR/include/glad/gl.h"

# Permanent glad zip generated via https://gen.glad.sh
# (gl:core profile, version 3.3, C/C++ loader)
GLAD_ZIP_URL="https://gen.glad.sh/generated/glad_gl_core_33/glad.zip"

if [ ! -f "$GLAD_HEADER" ] || head -c 512 "$GLAD_HEADER" 2>/dev/null | grep -qiE "<!doctype html|<html"; then
  echo "🔧 Fetching pre-generated GLAD (gl:core 3.3)..."
  rm -rf "$GLAD_DIR/include/glad" "$GLAD_DIR/include/KHR" "$GLAD_DIR/src/gl.c" 2>/dev/null || true

  download_verify "$GLAD_ZIP_URL" "/tmp/glad.zip" "zip"

  mkdir -p "$GLAD_DIR/include" "$GLAD_DIR/src"
  unzip -oq /tmp/glad.zip -d /tmp/glad_extract
  cp -r /tmp/glad_extract/include/* "$GLAD_DIR/include/"
  cp    /tmp/glad_extract/src/gl.c   "$GLAD_DIR/src/glad_gl.c"
  rm -rf /tmp/glad.zip /tmp/glad_extract
  echo "✅ GLAD installed -> $GLAD_HEADER"
else
  echo "✅ GLAD already present and valid."
fi

# ─────────────────────────────────────────────
# 2. GLM (header-only math lib)
# ─────────────────────────────────────────────
if [ ! -d "$ROOT_DIR/glm/glm" ]; then
  echo "🔧 Fetching GLM..."
  download_verify "https://github.com/g-truc/glm/releases/download/1.0.1/glm-1.0.1-light.zip" "/tmp/glm.zip" "zip"
  unzip -oq /tmp/glm.zip -d "$ROOT_DIR"
  rm -f /tmp/glm.zip
  echo "✅ GLM installed."
else
  echo "✅ GLM already present."
fi

# ─────────────────────────────────────────────
# 3. Dear ImGui
# ─────────────────────────────────────────────
if [ ! -f "$ROOT_DIR/imgui/imgui.cpp" ]; then
  echo "🔧 Fetching Dear ImGui..."
  download_verify "https://github.com/ocornut/imgui/archive/refs/tags/v1.90.9.zip" "/tmp/imgui.zip" "zip"
  unzip -oq /tmp/imgui.zip -d /tmp
  rm -rf "$ROOT_DIR/imgui"
  mv /tmp/imgui-1.90.9 "$ROOT_DIR/imgui"
  rm -f /tmp/imgui.zip
  echo "✅ ImGui installed."
else
  echo "✅ ImGui already present."
fi

# ─────────────────────────────────────────────
# 4. Build
# ─────────────────────────────────────────────
echo "🏗️  Configuring & building..."
rm -rf build
mkdir -p build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . -j"$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)"

echo "🎉 Done! Run with: ./build/shadowrealm"

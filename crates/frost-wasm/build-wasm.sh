#!/usr/bin/env bash
# Builds frost-wasm for the browser and drops the output into the web app.
#
#   Linux / macOS / WSL:  ./crates/frost-wasm/build-wasm.sh
#
# Requires: rustup target add wasm32-unknown-unknown
#           cargo install wasm-bindgen-cli --version 0.2.130 --locked
#
# (On Windows with Smart App Control enabled, native cargo builds are blocked
#  because build scripts are unsigned executables. Run this inside WSL.)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
TARGET_DIR="${CARGO_TARGET_DIR:-$HERE/target}"
OUT_JS="$ROOT/web/src/lib/frost/pkg"
OUT_WASM="$ROOT/web/public/wasm"

cd "$HERE"
cargo test --release
cargo build --release --target wasm32-unknown-unknown

wasm-bindgen \
  --target web \
  --omit-default-module-path \
  --out-dir "$OUT_JS" \
  --out-name frost_wasm \
  "$TARGET_DIR/wasm32-unknown-unknown/release/frost_wasm.wasm"

# The .wasm is served as a static asset; the JS glue is imported from src.
mkdir -p "$OUT_WASM"
mv "$OUT_JS/frost_wasm_bg.wasm" "$OUT_WASM/frost_wasm_bg.wasm"

echo "JS glue  -> $OUT_JS"
echo "wasm     -> $OUT_WASM/frost_wasm_bg.wasm ($(du -h "$OUT_WASM/frost_wasm_bg.wasm" | cut -f1))"

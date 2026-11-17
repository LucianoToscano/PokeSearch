#!/usr/bin/env bash
# Install stable-signed Preview over existing package without removing data.
set -euo pipefail
command -v adb >/dev/null || { echo "Android platform-tools/adb required" >&2; exit 1; }
case "${1:-}" in
  pair)
    test -n "${2:-}" || { echo "Usage: $0 pair IP:PAIR_PORT" >&2; exit 2; }
    adb pair "$2"
    ;;
  connect)
    test -n "${2:-}" || { echo "Usage: $0 connect IP:DEBUG_PORT" >&2; exit 2; }
    adb connect "$2"
    ;;
  install)
    test -f "${2:-}" || { echo "Usage: $0 install PokeSearch-FastDev-Preview.apk" >&2; exit 2; }
    adb devices
    adb install -r -t "$2"
    echo "Updated without uninstall. On signature mismatch, check signer; do NOT auto-uninstall."
    ;;
  *)
    echo "Usage: $0 pair IP:PORT | connect IP:PORT | install FILE.apk" >&2; exit 2 ;;
esac

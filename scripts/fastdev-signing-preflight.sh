#!/usr/bin/env bash
# Report configuration names only. Never print private signing values.
set -euo pipefail
missing=0
for name in FASTDEV_KEYSTORE_B64 POKE_FASTDEV_STORE_PASSWORD POKE_FASTDEV_KEY_ALIAS POKE_FASTDEV_KEY_PASSWORD EXPECTED_FASTDEV_CERT; do
  if [[ -z "${!name:-}" ]]; then
    echo "::error::Missing FastDev signing configuration: $name" >&2
    missing=1
  fi
done
[[ "$missing" == 0 ]] || exit 1
[[ "$EXPECTED_FASTDEV_CERT" =~ ^[0-9a-f]{64}$ ]] || {
  echo "::error::FastDev certificate must be 64 lowercase hexadecimal characters" >&2
  exit 1
}
[[ "$EXPECTED_FASTDEV_CERT" != 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e ]] || {
  echo "::error::FastDev must never use the official signing certificate" >&2
  exit 1
}
echo "FastDev signing configuration present; certificate and APK verification remain mandatory."

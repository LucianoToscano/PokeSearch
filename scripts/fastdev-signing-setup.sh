#!/usr/bin/env bash
# One-time key generation on a trusted local computer. Never commit private keys.
set -euo pipefail
command -v keytool >/dev/null || { echo "Java keytool required" >&2; exit 1; }
command -v openssl >/dev/null || { echo "openssl required" >&2; exit 1; }
umask 077
dir="${1:-.fastdev-secrets}"
mkdir -p "$dir"
key="$dir/pokesearch-fastdev.p12"
if [[ -e "$key" ]]; then echo "Key already exists. Refusing to rotate: $key" >&2; exit 1; fi
echo "Generate a strong password locally; do not share passwords in chat."
read -r -s -p "New FastDev keystore password: " password
echo
test "${#password}" -ge 12 || { echo "At least 12 characters required" >&2; exit 1; }
alias_name="pokesearch-fastdev"
keytool -genkeypair -noprompt -storetype PKCS12 \
  -keystore "$key" -storepass "$password" -keypass "$password" \
  -alias "$alias_name" -keyalg RSA -keysize 3072 -validity 12000 \
  -dname "CN=PokeSearch FastDev,O=PokeSearch,C=BR"
chmod 600 "$key"
cert="$(keytool -exportcert -rfc -keystore "$key" -storepass "$password" -alias "$alias_name" | openssl x509 -noout -fingerprint -sha256 | cut -d= -f2 | tr -d ':' | tr '[:upper:]' '[:lower:]')"
base64 < "$key" | tr -d '\r\n' > "$dir/keystore.base64"
chmod 600 "$dir/keystore.base64"
echo
echo "Signing certificate SHA-256 (PUBLIC): $cert"
echo "GitHub Settings > Environments > fastdev-signing, set Environment Secrets:"
echo "  POKE_FASTDEV_KEYSTORE_B64 = contents of $dir/keystore.base64"
echo "  POKE_FASTDEV_STORE_PASSWORD = password you typed"
echo "  POKE_FASTDEV_KEY_ALIAS = $alias_name"
echo "  POKE_FASTDEV_KEY_PASSWORD = same password"
echo "Set repository Variable: POKE_FASTDEV_CERT_SHA256 = $cert"
echo "Back up $key/password offline. NEVER rotate without migration."
echo "Do not commit $dir or reveal its contents."

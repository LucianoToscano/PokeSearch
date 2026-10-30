#!/usr/bin/env bash
# LT187 upgrade smoke. Runs ONLY inside an ephemeral GitHub Actions Android emulator.
set -euo pipefail
PKG="com.lucianotoscano.pokesearch"
COMPONENT="$PKG/com.lucianotoscano.pokesearchoverlay.MainActivity"
OLD="lt184-public/PokeSearch-v0.01.84-LT.apk"
NEW="lt187-artifact/PokeSearch-v0.01.87-LT187-Size-QA.apk"
OUT="LT187-EMULATOR-REPORT"
mkdir -p "$OUT"
test -s "$OLD"
test -s "$NEW"
adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = "1" ]; do sleep 2; done
echo "Android API: $(adb shell getprop ro.build.version.sdk | tr -d '\r')" | tee "$OUT/device.txt"
echo "Android release: $(adb shell getprop ro.build.version.release | tr -d '\r')" | tee -a "$OUT/device.txt"
adb shell input keyevent KEYCODE_WAKEUP || true
adb shell wm dismiss-keyguard || true

read_value() {
  adb shell dumpsys package "$PKG" | tr -d '\r' | grep -m1 "$1" || true
}
start_activity() {
  local stage="$1"
  echo "Starting $COMPONENT at $stage"
  adb shell am start -W -n "$COMPONENT" > "$OUT/$stage-activity.txt"
  cat "$OUT/$stage-activity.txt"
  sleep 7
  if ! adb shell pidof -s "$PKG" > "$OUT/$stage-pid.txt"; then
    echo "::error::Application process exited at $stage" >&2
    adb logcat -d -v brief | tail -350 > "$OUT/$stage-logcat.txt"
    exit 1
  fi
  adb exec-out screencap -p > "$OUT/$stage-home.png"
  test "$(stat -c %s "$OUT/$stage-home.png")" -gt 15000
  adb shell dumpsys activity activities | grep -E "mResumed|topResumed|ResumedActivity" > "$OUT/$stage-resumed.txt" || true
  adb logcat -d -v brief | tail -500 > "$OUT/$stage-logcat.txt"
}

# Fresh emulator: an uninstall is safe only here and never on user's phone.
adb uninstall "$PKG" >/dev/null 2>&1 || true
adb install "$OLD" | tee "$OUT/install-LT184.txt"
FIRST_UID="$(read_value 'userId=')"
FIRST_TIME="$(read_value 'firstInstallTime=')"
echo "LT184 $FIRST_UID | $FIRST_TIME" | tee -a "$OUT/device.txt"
echo "$(read_value 'versionCode=')" | tee "$OUT/version-LT184.txt"
grep -Fq '54389' "$OUT/version-LT184.txt" || { echo "Wrong baseline version"; exit 1; }
adb shell pm grant "$PKG" android.permission.POST_NOTIFICATIONS || true
adb logcat -c
start_activity "LT184"

# Upgrading the existing installation is essential: never uninstall here.
adb install -r "$NEW" | tee "$OUT/upgrade-LT187.txt"
SECOND_UID="$(read_value 'userId=')"
SECOND_TIME="$(read_value 'firstInstallTime=')"
echo "LT187 $SECOND_UID | $SECOND_TIME" | tee -a "$OUT/device.txt"
echo "$(read_value 'versionCode=')" | tee "$OUT/version-LT187.txt"
grep -Fq '54392' "$OUT/version-LT187.txt" || { echo "::error::Upgrade did not reach LT187"; exit 1; }
test -n "$FIRST_UID" && test "$FIRST_UID" = "$SECOND_UID" || {
  echo "::error::Package uid changed during upgrade" >&2; exit 1;
}
test -n "$FIRST_TIME" && test "$FIRST_TIME" = "$SECOND_TIME" || {
  echo "::error::firstInstallTime changed; package data may have been wiped" >&2; exit 1;
}
adb logcat -c
start_activity "LT187"
if grep -Eq 'FATAL EXCEPTION|Process: com\.lucianotoscano\.pokesearch' "$OUT/LT187-logcat.txt"; then
  echo "::error::Investigate Android fatal exception after upgrade" >&2
  exit 1
fi
cat > "$OUT/RESULT.txt" <<'EOF'
PASS: LT184 -> LT187 in-place installation on a clean Android emulator.
PASS: versionCode 54389 -> 54392, same package uid and firstInstallTime.
PASS: MainActivity starts, PokeSearch process stays alive, Home screenshots taken.
LIMIT: No real Samsung hardware, real provider OAuth, two overlay windows or notifications validated.
EOF
cat "$OUT/RESULT.txt"

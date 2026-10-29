#!/usr/bin/env python3
"""Build cumulative signed OTA payload inputs from LT173 APK baseline.
The manifest is signed separately using scripts/OtaSigner.java and the
existing protected APK signing key in the manually approved CI environment.
"""
import argparse
import base64
import re
import hashlib
import json
import pathlib
import shutil
import subprocess

ALLOWED = {
    "dock.html", "detail.html", "sprite_offline.js", "sprite_visual_scale.js",
    "visual_editor.js", "pokemon_card_presentation.js",
    "pvpoke-overall-ranks.js", "pvpoke-iv-gamemaster.js", "probe.js",
    "release_notes.json", "pokemon_catalog.json",
}
ASSET_PREFIX = "app/src/main/assets/"
ICON = re.compile(
    r"^(?:pokemon-sprites/(?:base|shiny|forms|costumes)|"
    r"result-icons/(?:base|modes)|weather-icons(?:/v2)?)/"
    r"[A-Za-z0-9_.-]{1,150}\.png$"
)
def allowed(name):
    return name in ALLOWED or ICON.fullmatch(name) is not None

def release_name(name):
    if "/" not in name:
        return name
    return base64.urlsafe_b64encode(name.encode("utf-8")).decode("ascii").rstrip("=") + ".asset"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--baseline", required=True)
    p.add_argument("--version", type=int, required=True)
    p.add_argument("--min-app", type=int, required=True)
    p.add_argument("--max-app", type=int, required=True)
    p.add_argument("--output", type=pathlib.Path, required=True)
    args = p.parse_args()
    if not (0 < args.version < 2_000_000_000 and
            54378 <= args.min_app <= args.max_app < 2_100_000_000):
        raise SystemExit("invalid OTA version / APK range")
    subprocess.run(["git", "rev-parse", "--verify", args.baseline + "^{commit}"],
                   check=True, capture_output=True)
    # An OTA bundle is interpreted by the already-installed APK. If native
    # code, non-patchable assets, build settings or manifest change since the
    # LT173 baseline, publishing only part of that revision is not safe.
    all_changed = subprocess.check_output(
        ["git", "diff", "--name-only", args.baseline, "HEAD", "--"],
        text=True).splitlines()
    incompatible = sorted(path for path in all_changed if (
        (path.startswith("app/src/main/") and
         (not path.startswith(ASSET_PREFIX) or
          not allowed(path.removeprefix(ASSET_PREFIX))))
        or path in {
            "app/build.gradle.kts", "app/build.gradle",
            "app/proguard-rules.pro", "build.gradle.kts", "build.gradle",
            "settings.gradle.kts", "settings.gradle", "gradle.properties",
        }
        or path.startswith("gradle/")
    ))
    if incompatible:
        raise SystemExit(
            "Full signed APK required: incompatible changes since OTA baseline: "
            + ", ".join(incompatible[:20]))
    deleted = subprocess.check_output(
        ["git", "diff", "--name-only", "--diff-filter=D",
         args.baseline, "HEAD", "--"], text=True).splitlines()
    removed = sorted(path for path in deleted if path.startswith(ASSET_PREFIX))
    if removed:
        raise SystemExit("Full signed APK required: deleted app assets: "
                         + ", ".join(removed[:20]))
    changed = subprocess.check_output(
        ["git", "diff", "--name-only", "--diff-filter=ACMRT",
         args.baseline, "HEAD", "--"], text=True).splitlines()
    files = sorted(set(path.removeprefix(ASSET_PREFIX) for path in changed
                       if path.startswith(ASSET_PREFIX) and
                          allowed(path.removeprefix(ASSET_PREFIX))))
    if not files:
        raise SystemExit("No eligible changed assets since baseline")
    if len(files) > 64:
        raise SystemExit("Too many changed assets for one safe OTA pack")
    if args.output.exists():
        raise SystemExit("Refusing to overwrite existing output")
    args.output.mkdir(parents=True)
    rows = []
    total = 0
    for name in files:
        source = pathlib.Path(ASSET_PREFIX) / name
        data = source.read_bytes()
        if not 0 < len(data) <= 3 * 1024 * 1024:
            raise SystemExit("Invalid size for " + name)
        total += len(data)
        if total > 8 * 1024 * 1024:
            raise SystemExit("OTA pack too large")
        (args.output / release_name(name)).write_bytes(data)
        rows.append({"path": name, "size": len(data),
                     "sha256": hashlib.sha256(data).hexdigest()})
    manifest = {"schema": "pokesearch-signed-assets-v1",
                "packVersion": args.version,
                "minAppVersionCode": args.min_app,
                "maxAppVersionCode": args.max_app, "files": rows}
    (args.output / "manifest.json").write_bytes(
        json.dumps(manifest, ensure_ascii=True,
                   separators=(",", ":")).encode("utf-8"))
    print("Resource count:", len(rows), "Total bytes:", total)
    print("Files:", ", ".join(files))

if __name__ == "__main__":
    main()

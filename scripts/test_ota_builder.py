#!/usr/bin/env python3
"""Offline host regression for changed-only signed OTA build input."""
import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile

SCRIPT = pathlib.Path(__file__).resolve().parent / "build_ota_pack.py"
sys.path.insert(0, str(SCRIPT.parent))
import build_ota_pack as pack

assert pack.allowed("dock.html")
assert pack.allowed("pokemon-sprites/forms/gengar-halloween.png")
assert pack.allowed("result-icons/modes/3Star.png")
assert pack.allowed("weather-icons/v2/cloudy.png")
for unsafe in ("../secrets.properties", "api_android_session.js",
               "pokemon-sprites/../../secrets.png", "trainer/private.dat",
               "pokemon-sprites/forms/a.png/other"):
    assert not pack.allowed(unsafe), unsafe
assert pack.release_name("pokemon-sprites/forms/foo.png") != pack.release_name("pokemon-sprites/forms__foo.png")

def git(cwd, *args):
    subprocess.run(("git", *args), cwd=cwd, check=True,
                   capture_output=True, text=True)

with tempfile.TemporaryDirectory() as tmp:
    root = pathlib.Path(tmp)
    assets = root / "app" / "src" / "main" / "assets"
    forms = assets / "pokemon-sprites" / "forms"
    forms.mkdir(parents=True)
    (assets / "dock.html").write_text("base", encoding="utf-8")
    git(root, "init")
    git(root, "config", "user.name", "CI")
    git(root, "config", "user.email", "ci@example.invalid")
    git(root, "add", ".")
    git(root, "commit", "-m", "baseline")
    git(root, "tag", "baseline")
    (assets / "dock.html").write_text("changed menu", encoding="utf-8")
    (forms / "foo.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"fixture" * 10)
    git(root, "add", ".")
    git(root, "commit", "-m", "changed")
    out = root / "bundle"
    subprocess.run([sys.executable, str(SCRIPT), "--baseline", "baseline",
                    "--version", "1", "--min-app", "54378", "--max-app", "54378",
                    "--output", str(out)], cwd=root, check=True, capture_output=True)
    manifest = json.loads((out / "manifest.json").read_text())
    paths = {item["path"] for item in manifest["files"]}
    assert paths == {"dock.html", "pokemon-sprites/forms/foo.png"}, paths
    for item in manifest["files"]:
        binary = (out / pack.release_name(item["path"])).read_bytes()
        assert len(binary) == item["size"]
        assert hashlib.sha256(binary).hexdigest() == item["sha256"]
    assert not (out / "api_android_session.js").exists()
    assert (out / "manifest.json").stat().st_size < 32768

    def must_require_apk(label):
        trial = root / ("blocked-" + label)
        check = subprocess.run(
            [sys.executable, str(SCRIPT), "--baseline", "baseline",
             "--version", "2", "--min-app", "54378", "--max-app", "54378",
             "--output", str(trial)],
            cwd=root, capture_output=True, text=True)
        assert check.returncode != 0, (label, check.stdout)
        assert "Full signed APK required" in check.stderr, (label, check.stderr)
        assert not trial.exists(), label

    # A valid editable page cannot be shipped if bundled with a newer
    # authentication script missing from the LT173 installed APK.
    (assets / "api_android_session.js").write_text("restricted", encoding="utf-8")
    git(root, "add", ".")
    git(root, "commit", "-m", "unpatchable asset")
    must_require_apk("unpatchable")
    git(root, "reset", "--hard", "HEAD~1")

    # Native Java changes must force a complete signed APK (not an OTA pack).
    native = root / "app/src/main/java/example/Native.java"
    native.parent.mkdir(parents=True)
    native.write_text("class Native {}\\n", encoding="utf-8")
    git(root, "add", ".")
    git(root, "commit", "-m", "native incompatibility")
    must_require_apk("native")
    git(root, "reset", "--hard", "HEAD~1")

    # Removing a previously installed asset is not representable by the
    # cumulative v1 OTA manifest and must also fail closed.
    (assets / "dock.html").unlink()
    git(root, "add", "-A")
    git(root, "commit", "-m", "deleted bundled page")
    must_require_apk("deleted")
print("LT174 OTA builder compatibility and changed-only fixture PASS")

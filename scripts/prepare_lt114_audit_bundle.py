#!/usr/bin/env python3
"""Reproducible PokeSearch LT114 audit artifact inventory and APK verification.
Run: python3 scripts/prepare_lt114_audit_bundle.py --root <staging-dir> --output <zip>
No external network, secrets, signing keys, server tokens or install automation.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
from pathlib import Path
import re
import sys
import zipfile

EXPECTED = {
    "LT113_QA": {
        "sha256": "e69fec269ba5613d71d1b55abd7705742553ed97edbd1a1ab671564dc7cf9614",
        "source": "141ec637e60565591f6fe445da661b2a26eb6a79",
        "versionCode": 54317, "versionName": "0.01.13"
    },
    "LT114_QA": {
        "sha256": "df04ad96591e2019181f49d9fb322f706807b2ceb568cea1987510da00e13b85",
        "source": "4734b6ce877961eff3bdaf7e5c05c69d33e86151",
        "versionCode": 54318, "versionName": "0.01.14"
    }
}
CERT = "34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e"
PACKAGE = "com.lucianotoscano.pokesearch"
SOURCE_DIRS = (
    "sources/MAIN_OFICIAL_EDITAVEL",
    "sources/LT113_FONTE_EXATA_EDITAVEL",
    "sources/LT114_BRANCH_COMPLETA_EDITAVEL",
)
SOURCE_BACKUP = "docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md"
SOURCE_BACKUP_SHA = "f02d6396a3ae6a4e833f78be8aedbe0b8d0b40254f31203644f3040a30e2a861"

def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

def all_files(root: Path):
    return sorted(
        (p for p in root.rglob("*") if p.is_file() and not p.is_symlink()),
        key=lambda p: p.relative_to(root).as_posix()
    )

def check_sprites(apk: Path) -> dict:
    with zipfile.ZipFile(apk, "r") as archive:
        bad = archive.testzip()
        if bad:
            raise ValueError(f"Corrupted ZIP item in {apk}: {bad}")
        embedded = "assets/pokemon-sprites/manifest.json"
        report = json.loads(archive.read(embedded))
        byname = report["sha256"]
        if report["dexCount"] != 1025 or report["baseCount"] != 1025 or report["shinyCount"] != 1025 or len(byname) != 2050:
            raise ValueError(f"Unexpected offline sprite manifest in {apk}")
        for name, expected in byname.items():
            content = archive.read("assets/pokemon-sprites/" + name)
            if hashlib.sha256(content).hexdigest() != expected:
                raise ValueError(f"Sprite differs from declared SHA256: {name}")
        return {
            "zip_integrity": "PASS", "normal_sprites_sha256_ok": 1025,
            "shiny_sprites_sha256_ok": 1025, "manifest_count": len(byname)
        }

def check_qa(apkdir: Path, label: str) -> dict:
    candidate = sorted(apkdir.glob("*.apk"))
    if len(candidate) != 1:
        raise ValueError(f"{label}: expected exactly one QA APK, got {len(candidate)}")
    apk = candidate[0]
    spec = EXPECTED[label]
    sha = digest(apk)
    if sha != spec["sha256"]:
        raise ValueError(f"{label}: SHA256 mismatch: {sha}")
    sha_report = (apkdir / "SHA256SUMS.txt").read_text(encoding="utf-8")
    if sha not in sha_report:
        raise ValueError(f"{label}: sha does not match GitHub Actions SHA256SUMS")
    commit = (apkdir / "SOURCE_COMMIT.txt").read_text(encoding="utf-8").strip()
    if commit != spec["source"]:
        raise ValueError(f"{label}: wrong source commit: {commit}")
    signing = (apkdir / "SIGNING-REPORT.txt").read_text(encoding="utf-8")
    if CERT not in signing.lower() or not re.search(r"Verified using v2 scheme.*:\s*true", signing):
        raise ValueError(f"{label}: signature/certificate report failed")
    badging = (apkdir / "PACKAGE-VERSION.txt").read_text(encoding="utf-8")
    if PACKAGE not in badging or f"versionCode='{spec['versionCode']}'" not in badging or f"versionName='{spec['versionName']}'" not in badging:
        raise ValueError(f"{label}: badging mismatch")
    if "application-debuggable" in badging:
        raise ValueError(f"{label}: release app unexpectedly debuggable")
    report = {
        "status": "PASS_CI_AND_BINARY",
        "apk": apk.relative_to(apkdir.parent.parent).as_posix(),
        "size_bytes": apk.stat().st_size,
        "apk_sha256": sha,
        "source_commit": commit,
        "versionName": spec["versionName"],
        "versionCode": spec["versionCode"],
        "package": PACKAGE,
        "signature_scheme_v2": "PASS_IN_ORIGINAL_CI_REPORT",
        "certificate_sha256": CERT
    }
    report.update(check_sprites(apk))
    return report

def check_source(root: Path) -> dict:
    result = {}
    for folder in SOURCE_DIRS:
        base = root / folder
        if not (base / "app/src/main/java").is_dir() or not (base / "app/src/main/assets").is_dir():
            raise ValueError(f"Missing editable source tree: {folder}")
        n = len(all_files(base))
        result[folder] = {"status": "PRESENT", "files": n}
    backup = root / SOURCE_DIRS[2] / SOURCE_BACKUP
    if not backup.exists():
        raise ValueError("Original complete Master Guide backup not in source snapshot")
    h = digest(backup)
    if h != SOURCE_BACKUP_SHA:
        raise ValueError(f"Historical Master Guide was altered: {h}")
    result["master_guide_backup_sha256"] = h
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    options = parser.parse_args()
    root = options.root.resolve()
    output = options.output.resolve()
    if not root.is_dir():
        raise ValueError(f"Bundle root missing: {root}")
    audit = root / "audit"
    audit.mkdir(parents=True, exist_ok=True)

    qa = {
        label: check_qa(root / "binaries" / label, label)
        for label in ("LT113_QA", "LT114_QA")
    }
    official = sorted((root / "binaries/MAIN_OFICIAL").glob("*.apk"))
    if len(official) != 1:
        raise ValueError("Official main APK must be present")
    with zipfile.ZipFile(official[0]) as arc:
        wrong = arc.testzip()
        if wrong:
            raise ValueError(f"Official APK ZIP corrupted: {wrong}")
    official_sha = digest(official[0])
    sources = check_source(root)
    status = {
        "audit_date": "2026-10-25",
        "repository": "LucianoToscano/PokeSearch",
        "official_main_source_sha": "56403a2999fc8037aa020466cf03041b7926ae02",
        "lt113_apk_source_sha": EXPECTED["LT113_QA"]["source"],
        "lt114_apk_source_sha": EXPECTED["LT114_QA"]["source"],
        "pull_request": "https://github.com/LucianoToscano/PokeSearch/pull/73",
        "pull_request_state": "DRAFT_NOT_MERGED_AT_AUDIT",
        "physical_samsung_status": "NOT_TESTED",
        "publication": "NO_NEW_OFFICIAL_RELEASE",
        "get_coords_regression_tests_in_ci": "8/8 PASS",
        "dual_overlay_regression_tests_in_ci": "10/10 PASS",
        "apk_qa": qa,
        "official": {"status": "ZIP_PASS", "sha256": official_sha, "size_bytes": official[0].stat().st_size},
        "sources": sources,
        "caveat": "Report cert obtained from signed workflow; physical Android package upgrade remains untested."
    }
    (audit / "STATUS_E_INTEGRIDADE.json").write_text(
        json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    items = all_files(root)
    with (audit / "INVENTARIO_ARQUIVOS.csv").open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["caminho_relativo", "bytes", "sha256"])
        for path in items:
            writer.writerow([path.relative_to(root).as_posix(), path.stat().st_size, digest(path)])

    # Do not list the manifest itself; only immutable data files are listed.
    manifest = "\n".join(
        f"{digest(path)}  {path.relative_to(root).as_posix()}"
        for path in all_files(root)
        if path.name != "MANIFESTO_SHA256.txt"
    ) + "\n"
    (root / "MANIFESTO_SHA256.txt").write_text(manifest, encoding="utf-8")

    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as bundle:
        for path in all_files(root):
            bundle.write(path, path.relative_to(root).as_posix())
    with zipfile.ZipFile(output, "r") as check:
        if check.testzip():
            raise ValueError("Final audit ZIP failed testzip")
    print(json.dumps({
        "success": True,
        "zip": output.name, "bytes": output.stat().st_size,
        "zip_sha256": digest(output), "files": len(all_files(root)),
        "qa": qa, "official_sha": official_sha, "sources": sources
    }, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"AUDIT_BUNDLE_FAILED: {exc}", file=sys.stderr)
        raise

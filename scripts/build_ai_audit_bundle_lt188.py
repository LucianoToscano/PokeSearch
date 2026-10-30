#!/usr/bin/env python3
"""Auditable source snapshot for external IAs; no credentials or build outputs."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import tarfile
import zipfile
from datetime import datetime, timezone

LIMIT = 199_000_000
FOLDER = "PokeSearch-Auditoria-Completa-Fonte"

def command(*parts):
    return subprocess.check_output(parts, text=True).strip()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="dist")
    args = parser.parse_args()
    root = pathlib.Path(__file__).resolve().parents[1]
    os.chdir(root)
    commit = command("git", "rev-parse", "HEAD")
    assert len(commit) == 40
    out = pathlib.Path(args.output).resolve()
    tree = out / "bundle" / FOLDER
    if tree.exists():
        shutil.rmtree(tree)
    tree.mkdir(parents=True)
    # Git archive is immutable HEAD tracked content only. No .git, working-tree
    # modifications, generated build output, private gradle caches or secrets.
    tar_bytes = subprocess.check_output(["git", "archive", "--format=tar", commit])
    import io
    with tarfile.open(fileobj=io.BytesIO(tar_bytes), mode="r:") as archive:
        for entry in archive:
            destination = tree / entry.name
            if not destination.resolve().is_relative_to(tree.resolve()):
                raise RuntimeError("Path escaped the audit snapshot")
            if entry.issym() or entry.islnk():
                raise RuntimeError("Symlinks are not accepted in AI snapshot")
        archive.extractall(tree, filter="data")
    forbidden = {".p12", ".jks", ".keystore", ".env"}
    for file in tree.rglob("*"):
        if file.is_file() and (file.suffix.lower() in forbidden or file.name.startswith(".env")):
            raise RuntimeError(f"Unexpected sensitive tracked filename: {file.relative_to(tree)}")
    audit = tree / "AUDITORIA"
    audit.mkdir()
    (audit / "SOURCE_COMMIT.txt").write_text(commit + "\n", encoding="utf-8")
    from_path = tree / "docs" / "PROMPT_OUTRAS_IAS_AUDITORIA_EDICAO_COMPLETA_LT188.md"
    if not from_path.is_file():
        raise RuntimeError("External AI prompt missing from tracked source")
    shutil.copy2(from_path, tree / "LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md")
    files = sorted(p for p in tree.rglob("*") if p.is_file())
    listing = []
    for p in files:
        rel = p.relative_to(tree).as_posix()
        listing.append({"path": rel, "bytes": p.stat().st_size,
                        "sha256": hashlib.sha256(p.read_bytes()).hexdigest()})
    metadata = {
        "project": "LucianoToscano/PokeSearch",
        "source_commit": commit,
        "release_target": "LT188 / 0.01.88 / 54393",
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "source_file_count": len(files),
        "source_size_bytes": sum(x["bytes"] for x in listing),
        "excluded": ["Git metadata .git", "local build/cache", "private signing keys", "downloaded dependencies"],
        "artifacts_are_original_source": True,
        "physical_samsung_qa": "not attested by source bundle",
        "files": listing,
    }
    (audit / "ORIGEM_E_INVENTARIO.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (audit / "README_VALIDACAO.txt").write_text(
        "PokeSearch codigo-fonte editavel, sem assinatura privada.\n"
        "Leia LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md, AGENTS.md e docs/GUIA_MESTRE.md.\n"
        "O manifesto ORIGEM_E_INVENTARIO.json lista SHA256/bytes de arquivos reais.\n"
        "As entradas geradas de AUDITORIA nao fazem parte do codigo original.\n"
        "Abra o projeto no Android Studio; dependencias e sprites gerados requerem scripts originais.\n"
        f"Commit: {commit}\n", encoding="utf-8"
    )
    source_zip = out / "PokeSearch-Auditoria-Completa-Fonte-LT188.zip"
    source_zip.parent.mkdir(parents=True, exist_ok=True)
    if source_zip.exists():
        source_zip.unlink()
    with zipfile.ZipFile(source_zip, "w", compression=zipfile.ZIP_DEFLATED,
                         compresslevel=8, allowZip64=False) as zf:
        for p in sorted(x for x in tree.rglob("*") if x.is_file()):
            zf.write(p, p.relative_to(tree.parent).as_posix())
    with zipfile.ZipFile(source_zip) as zf:
        bad = zf.testzip()
        if bad is not None:
            raise RuntimeError(f"ZIP failed CRC check: {bad}")
        assert any(n.endswith("app/src/main/assets/probe.js") for n in zf.namelist())
        assert any(n.endswith("app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java") for n in zf.namelist())
        assert any(n.endswith("LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md") for n in zf.namelist())
    size = source_zip.stat().st_size
    if not 0 < size < LIMIT:
        raise RuntimeError(f"Archive violates 199MB limit: {size}")
    checksum = hashlib.sha256(source_zip.read_bytes()).hexdigest()
    (out / "ZIP_SHA256.txt").write_text(
        checksum + "  " + source_zip.name + "\n", encoding="utf-8")
    print(json.dumps({"source_commit": commit, "files": len(files), "zip_bytes": size,
                      "zip_sha256": checksum, "max_bytes": LIMIT}, indent=2))

if __name__ == "__main__":
    main()

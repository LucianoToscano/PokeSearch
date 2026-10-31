#!/usr/bin/env python3
"""Generate a verified, editable source package for external AI audit."""
from __future__ import annotations
import csv, hashlib, json, os, pathlib, shutil, subprocess, sys, zipfile
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "ai-source-lt206"
PACK = OUT / "PokeSearch-LT206-CODIGO-COMPLETO"
ZIP = OUT / "PokeSearch-LT206-FONTE-COMPLETA-PARA-IAS.zip"
LIMIT = 199_000_000
TAG = "v0.02.06-54413"
APK = "PokeSearch-v0.02.06-LT.apk"
APK_SHA = "15513c98364fa6a4ca3f1909e170edb6978a918de8cabdbd52863ebf0aa8b75a"
DENY_SUFFIX = {".p12", ".jks", ".keystore", ".pem", ".p8", ".key"}
DENY_NAMES = {"id_rsa", "id_ed25519", ".env", "service-account.json"}

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    PACK.mkdir(parents=True)
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    names = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).split(b"\0")
    manifest, exclusions = [], []
    for raw in names:
        if not raw: continue
        rel = pathlib.PurePosixPath(os.fsdecode(raw))
        if rel.is_absolute() or ".." in rel.parts:
            raise RuntimeError("Invalid repository file path")
        source = ROOT / pathlib.Path(*rel.parts)
        lower = rel.name.lower()
        if lower in DENY_NAMES or lower.startswith(".env") or source.suffix.lower() in DENY_SUFFIX or "service-account" in lower or "credentials" in lower:
            exclusions.append(str(rel))
            continue
        if source.is_symlink():
            exclusions.append(str(rel))
            continue
        if not source.is_file(): raise RuntimeError(f"Missing tracked file: {rel}")
        data = source.read_bytes()
        target = PACK / pathlib.Path(*rel.parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        manifest.append({"path":str(rel), "bytes":len(data), "sha256":digest(data)})
    required = [
        "AGENTS.md", "LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md",
        "docs/GUIA_MESTRE.md", "docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md",
        "app/src/main/assets/dock.html", "app/src/main/assets/probe.js",
        "app/src/main/assets/detail.html", "app/tests/lt206-retry-after-details.test.js",
        "app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java",
        "app/src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java",
        "scripts/export_ai_source_bundle_lt206.py", ".github/workflows/lt206-ai-source-export.yml",
    ]
    for item in required:
        if not (PACK / item).is_file():
            raise RuntimeError("Required source file absent: " + item)
    extra = PACK / "AUDITORIA_PARA_IAS"
    extra.mkdir()
    (extra / "SOURCE_COMMIT.txt").write_text(commit + "\n", encoding="utf-8")
    (extra / "ARQUIVOS_EXCLUIDOS.txt").write_text("\n".join(exclusions) + "\n", encoding="utf-8")
    (extra / "INICIO_PARA_OUTRAS_IAS.md").write_text(
        "# PokeSearch LT206 — pacote de fonte real para editar e auditar\n\n"
        "Leia nesta ordem: LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md, AGENTS.md, docs/GUIA_MESTRE.md.\n"
        "O pacote contem o codigo Java/Kotlin, JS, HTML, recursos, testes, CI, OTA, scripts e docs do repositorio publico.\n"
        "A arvore de fonte corresponde exatamente ao commit informado em SOURCE_COMMIT.txt, "
        "sem .git, caches, dependencias baixadas ou segredos de assinatura.\n"
        "Repositório: https://github.com/LucianoToscano/PokeSearch\n"
        "Ultima release de referencia: " + TAG + "\n"
        "O APK oficial, se presente, foi publicado previamente e tem hash fixado; sua chave privada NAO esta presente.\n"
        "Ao editar, preserve duas Pokebolas, assinatura existente, limites do provedor, login opcional e Shiny pausado.\n"
        "QA fisico Samsung/API autenticada nao pode ser presumido somente com este pacote.\n"
        "As versoes LT190 e LT191 sao historicas e nao devem substituir a LT206.\n",
        encoding="utf-8")
    apk_src = ROOT / "dist" / "lt206-release-apk" / APK
    included_apk = False
    if apk_src.is_file():
        raw = apk_src.read_bytes()
        if digest(raw) != APK_SHA:
            raise RuntimeError("Official APK digest mismatch")
        d = PACK / "APK_OFICIAL_PUBLICO"
        d.mkdir()
        (d / APK).write_bytes(raw)
        (d / "SHA256SUMS.txt").write_text(APK_SHA + "  " + APK + "\n", encoding="utf-8")
        included_apk = True
    meta = {
        "repository":"LucianoToscano/PokeSearch", "source_commit":commit,
        "reference_release":TAG, "official_apk_sha256":APK_SHA,
        "official_apk_included":included_apk, "generated_utc":datetime.now(timezone.utc).isoformat(),
        "source_file_count":len(manifest), "source_bytes":sum(x["bytes"] for x in manifest),
        "excluded_filenames":exclusions, "files":manifest
    }
    (extra / "INVENTARIO_SHA256.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    with zipfile.ZipFile(ZIP,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=7,allowZip64=False) as z:
        for f in sorted(PACK.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(OUT).as_posix())
    with zipfile.ZipFile(ZIP) as z:
        if z.testzip() is not None: raise RuntimeError("ZIP CRC check failed")
        if len(z.namelist()) < len(required): raise RuntimeError("Incomplete ZIP")
    n=ZIP.stat().st_size
    if not 0<n<LIMIT: raise RuntimeError(f"ZIP violates 199 MB limit: {n}")
    h=digest(ZIP.read_bytes())
    (OUT / "ZIP_SHA256.txt").write_text(f"{h}  {ZIP.name}\n",encoding="utf-8")
    print(json.dumps({"archive":str(ZIP),"files":len(manifest),"zip_bytes":n,"sha256":h,"source_commit":commit,"includes_apk":included_apk},indent=2))

if __name__=="__main__": main()

#!/usr/bin/env python3
"""Auditoria conservadora e somente-leitura do PokeSearch.

Uso: python3 scripts/audit_repository_safely.py [raiz] [--json]
Não move, reescreve, apaga, publica nem acessa a rede.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re

IGNORED_DIRS = {".git", ".gradle", ".idea", ".kotlin", "build", "node_modules", "__pycache__", ".venv", "venv"}
SENSITIVE_SUFFIXES = (".jks", ".keystore", ".p12", ".pfx", ".pkcs12", ".pem", ".key")
SENSITIVE_NAMES = {"google-services.json", "local.properties", ".env", "service-account.json"}
LINK_PATTERN = re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)")
VERSION_PATTERN = re.compile(r"^## LT(?P<lt>\d+) — PokeSearch v(?P<version>\d+\.\d+\.\d+) LT OFICIAL", re.MULTILINE)
READ_ME_VERSION_PATTERN = re.compile(r"^## Versão oficial publicada — LT(?P<lt>\d+)", re.MULTILINE)


def file_inventory(root: Path) -> list[Path]:
    files: list[Path] = []
    for path in root.rglob("*"):
        if any(part in IGNORED_DIRS for part in path.relative_to(root).parts):
            continue
        if path.is_symlink() or not path.is_file():
            continue
        files.append(path)
    return sorted(files)


def digest_file(path: Path) -> str:
    hash_obj = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            hash_obj.update(chunk)
    return hash_obj.hexdigest()


def relative_links(root: Path, files: list[Path]) -> list[dict[str, str]]:
    broken: list[dict[str, str]] = []
    for file in files:
        if file.suffix.lower() != ".md":
            continue
        try:
            content = file.read_text(encoding="utf-8-sig")
        except (UnicodeError, OSError):
            continue
        for candidate in LINK_PATTERN.findall(content):
            raw = candidate.strip().split()[0].strip("<>")
            if not raw or raw.startswith(("http:", "https:", "mailto:", "#", "data:")):
                continue
            target = raw.split("#", 1)[0].split("?", 1)[0]
            if not target or ":" in target or target.startswith("/"):
                continue
            # Só sinalize arquivos explícitos, não links dinâmicos ou âncoras.
            if not re.search(r"\.(md|txt|json|ya?ml|py|js|java|html|xml)$", target, flags=re.I):
                continue
            resolved = (file.parent / target).resolve()
            if not resolved.is_relative_to(root.resolve()):
                broken.append({"source": str(file.relative_to(root)), "target": target, "reason": "fora_da_raiz"})
            elif not resolved.is_file():
                broken.append({"source": str(file.relative_to(root)), "target": target, "reason": "nao_encontrado"})
    return broken


def audit(root: Path) -> dict:
    root = root.resolve()
    files = file_inventory(root)
    paths = [p.relative_to(root).as_posix() for p in files]
    suffixes = Counter(p.suffix.lower() or "[sem extensao]" for p in files)
    docs = [p for p in files if p.relative_to(root).parts[0] == "docs"]
    workflows = [p for p in files if p.relative_to(root).as_posix().startswith(".github/workflows/") and p.suffix in (".yaml", ".yml")]
    by_size: dict[int, list[Path]] = defaultdict(list)
    for p in files:
        by_size[p.stat().st_size].append(p)
    by_hash: dict[str, list[str]] = defaultdict(list)
    for size, group in by_size.items():
        if size == 0 or len(group) < 2:
            continue
        for p in group:
            by_hash[digest_file(p)].append(p.relative_to(root).as_posix())
    duplicates = [sorted(group) for group in by_hash.values() if len(group) >= 2]
    duplicates.sort(key=lambda g: (g[0], len(g)))
    sensitive = [path for path in paths if Path(path).name.lower() in SENSITIVE_NAMES or Path(path).name.lower().endswith(SENSITIVE_SUFFIXES)]
    guide_path, readme_path = root / "docs/GUIA_MESTRE.md", root / "README.md"
    guide_match = VERSION_PATTERN.search(guide_path.read_text(encoding="utf-8-sig")) if guide_path.is_file() else None
    readme_match = READ_ME_VERSION_PATTERN.search(readme_path.read_text(encoding="utf-8-sig")) if readme_path.is_file() else None
    version_risk = None
    if guide_match and readme_match and guide_match.group("lt") != readme_match.group("lt"):
        version_risk = f"README apresenta LT{readme_match.group('lt')} como oficial e Guia Mestre abre em LT{guide_match.group('lt')}"
    broken = relative_links(root, files)
    return {
        "mode": "read_only",
        "root": str(root),
        "files": len(files),
        "directories_excluded": sorted(IGNORED_DIRS),
        "total_size_bytes": sum(p.stat().st_size for p in files),
        "documentation_files": len(docs),
        "workflow_files": len(workflows),
        "extensions_top": suffixes.most_common(15),
        "exact_duplicate_groups": duplicates,
        "duplicate_groups_count": len(duplicates),
        "potential_sensitive_paths": sensitive,
        "canonical_version": guide_match.group("version") if guide_match else None,
        "canonical_lt": guide_match.group("lt") if guide_match else None,
        "stale_readme_warning": version_risk,
        "broken_relative_links_count": len(broken),
        "broken_relative_links_examples": broken[:30],
        "changes_made": 0,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--json", action="store_true", help="Exibe JSON para arquivar/diagnosticar")
    args = parser.parse_args()
    if not args.root.exists():
        parser.error("A raiz informada não existe")
    result = audit(args.root)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("PokeSearch — auditoria somente-leitura")
        print(f"Arquivos: {result['files']}; docs: {result['documentation_files']}; workflows: {result['workflow_files']}")
        print(f"Duplicatas byte a byte: {result['duplicate_groups_count']} grupos")
        print(f"Links relativos suspeitos: {result['broken_relative_links_count']}")
        print(f"Arquivos potencialmente sensíveis pelo nome: {len(result['potential_sensitive_paths'])}")
        if result["stale_readme_warning"]:
            print("Atenção: " + result["stale_readme_warning"])
        print("Nenhum arquivo alterado. Consulte --json para detalhes.")


if __name__ == "__main__":
    main()

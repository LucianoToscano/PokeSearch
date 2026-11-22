#!/usr/bin/env python3
"""Testes básicos sem rede da auditoria somente-leitura."""
from pathlib import Path
import tempfile
import unittest

from audit_repository_safely import audit


class AuditReadOnlyTests(unittest.TestCase):
    def test_duplicate_and_stale_warning_without_writes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "docs").mkdir()
            (root / ".github" / "workflows").mkdir(parents=True)
            (root / "docs" / "GUIA_MESTRE.md").write_text("## LT409 — PokeSearch v0.03.94 LT OFICIAL\n", encoding="utf-8")
            (root / "README.md").write_text("## Versão oficial publicada — LT227\n", encoding="utf-8")
            (root / "docs" / "one.txt").write_text("mesmo conteúdo", encoding="utf-8")
            (root / "docs" / "two.txt").write_text("mesmo conteúdo", encoding="utf-8")
            (root / ".github" / "workflows" / "ci.yml").write_text("name: QA", encoding="utf-8")
            before = {str(p.relative_to(root)): p.read_bytes() for p in root.rglob("*") if p.is_file()}
            result = audit(root)
            after = {str(p.relative_to(root)): p.read_bytes() for p in root.rglob("*") if p.is_file()}
            self.assertEqual(before, after)
            self.assertEqual(result["changes_made"], 0)
            self.assertEqual(result["duplicate_groups_count"], 1)
            self.assertEqual(result["canonical_lt"], "409")
            self.assertTrue(result["stale_readme_warning"])
            self.assertEqual(result["workflow_files"], 1)

    def test_broken_markdown_links_are_reported_without_deleting(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "docs").mkdir()
            (root / "docs" / "guide.md").write_text("[OK](other.md) [Falta](missing.md) [Web](https://example.com)\n", encoding="utf-8")
            (root / "docs" / "other.md").write_text("bom", encoding="utf-8")
            result = audit(root)
            self.assertEqual(result["broken_relative_links_count"], 1)
            self.assertEqual(result["broken_relative_links_examples"][0]["target"], "missing.md")


if __name__ == "__main__":
    unittest.main()

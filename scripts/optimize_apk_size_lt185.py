#!/usr/bin/env python3
"""LT185: otimiza PNGs em seus caminhos originais, sem mudar nomes, alpha, UI ou API.

Executar apenas numa branch de QA e revisar o relatório antes do merge.
Requer: Pillow >= 10 e pngquant. A saída é determinística para o mesmo ambiente.
"""
import argparse
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "app/src/main/assets"
DRAWABLE = ROOT / "app/src/main/res/drawable-nodpi"
SKIP = {
    # A geração de ícones redondos usa esse PNG como fonte e depende dele.
    "app/src/main/res/drawable-nodpi/ic_launcher.png",
    "app/src/main/res/drawable-nodpi/pokesearch_round.png",
    "app/src/main/res/drawable-nodpi/pokesearch_adaptive_foreground.png",
}
# Os 9 arquivos oficiais deste diretório têm SHA imutável no teste LT57.
IMMUTABLE_WEATHER = {f"app/src/main/assets/weather-icons/{n}.png" for n in (
    "any", "boosted", "sunny", "rainy", "partly-cloudy", "cloudy",
    "windy", "snow", "fog"
)}
MODE_ICONS = {"StarIVRaw.png", "StarGL.png", "StarUL.png",
              "0Star.png", "1Star.png", "2Star.png", "3Star.png"}

def candidates():
    paths = list(DRAWABLE.glob("*.png"))
    paths += list((ASSETS / "branding").rglob("*.png"))
    paths += list((ASSETS / "result-icons").rglob("*.png"))
    # Weather V2 has strict provenance SHA tests; preserve all 18 originals.
    return sorted(set(p for p in paths if p.is_file()
        and str(p.relative_to(ROOT)) not in SKIP | IMMUTABLE_WEATHER))

def avg_rgba_error(a, b):
    # Compara pixels já compostos em fundo claro e escuro para preservar alpha.
    def composite(im, bg):
        background = Image.new("RGBA", im.size, bg)
        return Image.alpha_composite(background, im.convert("RGBA")).convert("RGB")
    return max(sum(ImageStat.Stat(ImageChops.difference(
        composite(a, c), composite(b, c))).mean) / 3
        for c in ((0, 0, 0, 255), (255, 255, 255, 255)))

def optimize(path, tmp_dir, dry_run):
    relative = path.relative_to(ROOT).as_posix()
    original = path.read_bytes()
    size_before = len(original)
    with Image.open(path) as source:
        source.load()
        original_image = source.convert("RGBA")
    working = original_image
    # Ícones do menu são desenhados a ~17px; 128px mantém ampla margem.
    if relative.startswith("app/src/main/assets/result-icons/modes/") \
            and path.name in MODE_ICONS and min(working.size) > 128:
        working = working.resize((128, 128), Image.Resampling.LANCZOS)
    # Clima V2 são ícones compactos. Preservar proporção, no mínimo 256px.
    if relative.startswith("app/src/main/assets/weather-icons/v2/") \
            and max(working.size) > 256:
        working.thumbnail((256, 256), Image.Resampling.LANCZOS)
    initial = tmp_dir / ("initial-" + hashlib.sha1(relative.encode()).hexdigest() + ".png")
    candidate = tmp_dir / ("candidate-" + hashlib.sha1(relative.encode()).hexdigest() + ".png")
    working.save(initial, format="PNG", optimize=True, compress_level=9)
    # Para artes com gradientes, recusar qualidade inferior a 92.
    command = ["pngquant", "--force", "--strip", "--skip-if-larger",
               "--speed", "1", "--quality=92-99",
               "--output", str(candidate), str(initial)]
    proc = subprocess.run(command, capture_output=True, text=True)
    if proc.returncode not in (0, 98, 99):
        raise RuntimeError(f"pngquant falhou em {relative}: {proc.stderr}")
    choices = [initial]
    if candidate.is_file():
        choices.append(candidate)
    picked = min(choices, key=lambda p: p.stat().st_size)
    output = picked.read_bytes()
    new_image = Image.open(picked).convert("RGBA")
    if path.name in MODE_ICONS and relative.startswith("app/src/main/assets/result-icons/modes/"):
        if path.name.startswith(("0Star", "1Star", "2Star", "3Star")):
            assert new_image.size == (128, 128), relative
        else:
            assert min(new_image.size) >= 128, relative
    elif relative.startswith("app/src/main/assets/weather-icons/v2/"):
        assert max(new_image.size) <= 256, relative
    else:
        assert new_image.size == original_image.size, relative
    # Uma miniatura muda resolução mas não a exibição (17px na UI).
    if new_image.size == original_image.size:
        error = avg_rgba_error(original_image, new_image)
        if error > 4.0:
            return {"file": relative, "before": size_before,
                    "after": size_before, "status": "quality-rejected", "mae": round(error, 3)}
    else:
        error = None
    # Não gravar arquivos com redução insignificante.
    if len(output) >= size_before * .97:
        return {"file": relative, "before": size_before,
                "after": size_before, "status": "not-beneficial"}
    if not output.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError(f"PNG inválido: {relative}")
    if not dry_run:
        path.write_bytes(output)
    return {"file": relative, "before": size_before, "after": len(output),
            "status": "optimized", "mae": None if error is None else round(error, 3),
            "sha256": hashlib.sha256(output).hexdigest()}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--apply", action="store_true")
    p.add_argument("--report", default="LT185-SIZE-REPORT.json")
    args = p.parse_args()
    paths = candidates()
    if len(paths) < 30:
        raise RuntimeError(f"Quantidade inesperada de recursos: {len(paths)}")
    with tempfile.TemporaryDirectory(prefix="pokesearch-lt185-") as td:
        report = [optimize(path, Path(td), not args.apply) for path in paths]
    before = sum(e["before"] for e in report)
    after = sum(e["after"] for e in report)
    stats = {"base": "LT184/54389", "files_considered": len(report),
        "optimized": sum(e["status"] == "optimized" for e in report),
        "before_bytes": before, "after_bytes": after,
        "saved_bytes": before-after,
        "files": sorted(report, key=lambda e:e["before"]-e["after"], reverse=True)}
    Path(args.report).write_text(json.dumps(stats, indent=2, ensure_ascii=False) + "\n")
    print(f"LT185 resources: {before:,} -> {after:,} bytes; saved {before-after:,}; optimized {stats['optimized']}")
    for row in stats["files"][:12]:
        print(f"  {row['before']-row['after']:>9} {row['status']:>18} {row['file']}")
    if args.apply and stats["optimized"] == 0:
        raise RuntimeError("Nenhum recurso otimizado; abortar QA")
if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""LT186: assets WebP quality-controlled and move unused duplicated brand masters.

This modifies files ONLY on an isolated QA branch. Does not change CSS/Java IDs.
Do not touch online sprites, recorded sounds, SHA-pinned assets or launcher art.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "app/src/main/res/drawable-nodpi"
ASSETS = ROOT / "app/src/main/assets"
ORIGINALS = ROOT / "app/artwork-originals/branding"

# Android resolves R.drawable.NAME irrespective of .png vs .webp.
# Images are already losslessly/quality optimized in LT185; now enable WebP.
TARGETS = [
    "ps_home_background_light",
    "ps_home_background_dark",
    "ps_home_brand_transparent",
    "ps_home_official_wordmark",
    "ps_team_mystic",
    "ps_team_valor",
    "ps_team_instinct",
    "ps_team_neutral",
    "support_pikachu_coin",
    "ps_user_frame_mystic",
    "ps_user_frame_valor",
    "ps_user_frame_instinct",
    "ps_user_frame_neutral",
]
BRANDING = (
    "PokeSearchLogoShinyBlueEffectAll.png",
    "PokeSearchLogoShinyBlueEffect.png",
    "PokeSearchLogoShiny.png",
    "PokeSearchName.png",
)

def check_unreferenced_branding():
    paths = list((ROOT / "app/src/main/java").rglob("*.java"))
    paths += list(ASSETS.glob("*.js")) + list(ASSETS.glob("*.html"))
    for f in paths:
        data = f.read_text(encoding="utf-8", errors="replace")
        if "branding/" in data or any(name in data for name in BRANDING):
            raise RuntimeError(f"Brand file has a possible runtime use: {f.relative_to(ROOT)}")

def visible_error(old, new):
    def on_bg(im, rgb):
        bg = Image.new("RGBA", old.size, rgb + (255,))
        return Image.alpha_composite(bg, im).convert("RGB")
    return max(sum(ImageStat.Stat(ImageChops.difference(
        on_bg(old, rgb), on_bg(new, rgb))).mean) / 3
        for rgb in ((0,0,0),(255,255,255)))

def convert_image(name, apply):
    old_path = RES / (name + ".png")
    new_path = RES / (name + ".webp")
    if new_path.is_file() and not old_path.exists():
        return dict(name=name, status="already-webp", before=0, after=new_path.stat().st_size)
    if not old_path.is_file():
        raise RuntimeError(f"Missing source image {old_path}")
    old_size = old_path.stat().st_size
    with Image.open(old_path) as im:
        old = im.convert("RGBA")
    choices = []
    # Art with letters and outlines uses very high quality; photo gradients can use 94-97.
    quality_levels = (98, 96, 94) if any(x in name for x in ("brand", "wordmark")) else (97,95,93)
    for q in quality_levels:
        import io
        buf = io.BytesIO()
        old.save(buf, format="WEBP", method=6, quality=q, exact=True)
        data = buf.getvalue()
        with Image.open(io.BytesIO(data)) as image:
            new = image.convert("RGBA")
        if new.size != old.size:
            continue
        # Preserve transparent silhouettes and the same perceived art on light/dark mode.
        if ImageChops.difference(old.getchannel("A"), new.getchannel("A")).getbbox() is not None:
            continue
        mae = visible_error(old, new)
        limit = 2.2 if ("brand" in name or "wordmark" in name) else 3.0
        if mae <= limit:
            choices.append((len(data),q,mae,data))
    if not choices:
        return dict(name=name,status="quality-rejected",before=old_size,after=old_size)
    size, q, err, data = min(choices, key=lambda r:r[0])
    if size >= old_size * 0.93:
        return dict(name=name,status="not-beneficial",before=old_size,after=old_size)
    if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise RuntimeError("Invalid WebP header")
    if apply:
        new_path.write_bytes(data)
        old_path.unlink()
    return dict(name=name,status="webp",before=old_size,after=size,
                quality=q,mae=round(err,3),sha256=hashlib.sha256(data).hexdigest())

def move_unused_branding(apply):
    check_unreferenced_branding()
    rows=[]
    for name in BRANDING:
        src=ASSETS/"branding"/name
        dst=ORIGINALS/name
        if not src.exists() and dst.is_file():
            rows.append(dict(name=name,status="already-outside-apk",bytes=dst.stat().st_size))
            continue
        if not src.is_file() or dst.exists():
            raise RuntimeError(f"Brand source mismatch {name}")
        # All four originals remain in the Git project for rollback/design.
        if apply:
            dst.parent.mkdir(parents=True,exist_ok=True)
            shutil.move(str(src), str(dst))
        rows.append(dict(name=name,status="outside-apk",bytes=src.stat().st_size if not apply else dst.stat().st_size))
    return rows

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--apply",action="store_true")
    p.add_argument("--report",default="LT186-SIZE-REPORT.json")
    args=p.parse_args()
    images=[convert_image(n,args.apply) for n in TARGETS]
    brand=move_unused_branding(args.apply)
    image_saved=sum(r["before"]-r["after"] for r in images)
    brand_saved=sum(r["bytes"] for r in brand)
    result={"baseline":"LT185 0.01.85/54390; 43770614 bytes",
            "webp_converted":sum(r["status"] in ("webp","already-webp") for r in images),
            "webp_saved_bytes":image_saved,
            "removed_from_apk_branding_bytes":brand_saved,
            "total_source_bytes_saved":image_saved+brand_saved,
            "images":images,"branding":brand}
    Path(args.report).write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
    print(f"LT186: WebP saving {image_saved:,} bytes, branding removed from APK input {brand_saved:,} bytes; "
          f"{result['webp_converted']} WebP images")
    if args.apply and (result["webp_converted"] < 3 or brand_saved < 1_000_000):
        raise RuntimeError("Too few useful conversions; do not build/publish")
if __name__=="__main__":
    main()

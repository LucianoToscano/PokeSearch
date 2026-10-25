#!/usr/bin/env python3
"""Package VERIFIED PokeAPI normal/shiny base sprites into the LT105 APK.

Downloads happen in the CI builder, NEVER on app startup. Each URL refers to
one exact dex ID and variant. Unknown costumes/forms stay unbundled; the app
must not silently substitute another sprite. All data is public PokeAPI/sprites.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import struct
import time
import urllib.error
import urllib.request

RAW = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"
MIRROR = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/"
MIN_DIMENSION, MAX_DIMENSION, MAX_BYTES = 8, 1024, 256 * 1024


def verified_png(data):
    """Validate exact PNG signature and plausible IHDR without Pillow."""
    if len(data) < 33 or len(data) > MAX_BYTES:
        return False
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        return False
    width, height = struct.unpack(">II", data[16:24])
    return MIN_DIMENSION <= width <= MAX_DIMENSION and MIN_DIMENSION <= height <= MAX_DIMENSION


def fetch(path):
    for source in (RAW, MIRROR):
        url = source + path
        for attempt in range(2):
            try:
                request = urllib.request.Request(url, headers={"User-Agent": "PokeSearch-LT105-offline-sprite-builder/1"})
                with urllib.request.urlopen(request, timeout=12) as response:
                    if response.status != 200:
                        break
                    content_type = response.headers.get("Content-Type", "").lower()
                    if content_type and "image/png" not in content_type:
                        break
                    data = response.read(MAX_BYTES + 1)
                if verified_png(data):
                    return data
                break
            except urllib.error.HTTPError as exc:
                if exc.code in (404, 410):
                    # Never invent missing sprites / forms.
                    return None
                if exc.code in (401, 403, 429):
                    # Respect provider limits: never circumvent authorization/throttles.
                    return None
                if exc.code < 500:
                    break
            except (urllib.error.URLError, TimeoutError, OSError):
                pass
            if attempt == 0:
                time.sleep(0.6)
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", default="app/src/main/assets/pokemon_catalog.json")
    parser.add_argument("--dest", default="app/src/main/assets/pokemon-sprites")
    parser.add_argument("--workers", type=int, default=12)
    parser.add_argument("--minimum-normal", type=int, default=950)
    args = parser.parse_args()
    catalog = json.loads(Path(args.catalog).read_text(encoding="utf-8"))
    ids = sorted({int(row[0]) for row in catalog if 1 <= int(row[0]) <= 1025})
    if len(ids) != 1025:
        raise SystemExit("Catalog changed: expected exactly 1025 verified Dex IDs")
    dest = Path(args.dest)
    base = dest / "base"
    shiny = dest / "shiny"
    base.mkdir(parents=True, exist_ok=True)
    shiny.mkdir(parents=True, exist_ok=True)
    jobs = [(dex, special, f"{'shiny/' if special else ''}{dex}.png")
            for dex in ids for special in (False, True)]
    hashes = {}
    misses = {"base": [], "shiny": []}
    def download(job):
        dex, special, relative = job
        path = (shiny if special else base) / f"{dex}.png"
        if path.exists():
            data = path.read_bytes()
            if verified_png(data):
                return dex, special, data
            path.unlink()
        return dex, special, fetch(relative)

    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 20))) as pool:
        futures = {pool.submit(download, job): job for job in jobs}
        for index, future in enumerate(as_completed(futures), 1):
            dex, special, data = future.result()
            category = "shiny" if special else "base"
            if data is None:
                misses[category].append(dex)
            else:
                destination = (shiny if special else base) / f"{dex}.png"
                if not destination.exists():
                    destination.write_bytes(data)
                hashes[f"{category}/{dex}.png"] = hashlib.sha256(data).hexdigest()
            if index % 200 == 0:
                print(f"Offline sprites verified: {index}/{len(jobs)}", flush=True)
    summary = {
        "schema": "pokesearch-offline-sprites-v1",
        "source": "PokeAPI/sprites master - exact Dex/variant PNG only",
        "dexCount": len(ids),
        "baseCount": len(ids) - len(misses["base"]),
        "shinyCount": len(ids) - len(misses["shiny"]),
        "missing": {key: sorted(value) for key, value in misses.items()},
        "sha256": dict(sorted(hashes.items())),
    }
    (dest / "manifest.json").write_text(json.dumps(summary, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print("Sprite bundle:", summary["baseCount"], "normal;",
          summary["shinyCount"], "shiny;",
          sum((dest / category / f"{dex}.png").stat().st_size for category in ("base", "shiny")
              for dex in ids if (dest / category / f"{dex}.png").exists()), "bytes")
    if summary["baseCount"] < args.minimum_normal:
        raise SystemExit(f"Insufficient verified base sprites ({summary['baseCount']} < {args.minimum_normal}): refusing incomplete build")


if __name__ == "__main__":
    main()

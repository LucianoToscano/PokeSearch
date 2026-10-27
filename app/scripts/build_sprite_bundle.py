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
# PokeMiners is a third-party archive of copyrighted Pokémon GO artwork.
# Every costume asset is pinned to a fixed upstream commit and its exact Git blob.
# Unknown forms/variants must NOT be inferred from normal species sprites.
COSTUME_SOURCE_COMMIT = "c2a686eb08ace6e890d8fe3d2134c76988db87b5"
COSTUME_ROOT = ("https://raw.githubusercontent.com/PokeMiners/pogo_assets/"
                + COSTUME_SOURCE_COMMIT
                + "/Images/Pokemon%20-%20256x256/Addressable%20Assets/")
COSTUME_FILES = {
    "costumes/3-copy-2019.png": (
        "pm3.fCOPY_2019.icon.png",
        "284009faddef9f1c56119929da3034e29d287840"
    ),
    "costumes/3-copy-2019-female.png": (
        "pm3.fCOPY_2019.g2.icon.png",
        "a47c0c2534dc99cef70e472fc660aac3e35de8db"
    ),
    "costumes/6-copy-2019.png": (
        "pm6.fCOPY_2019.icon.png",
        "69ad8ed87a10db18f3c1f85b449ee6d88c30d0bf"
    ),
    "costumes/9-copy-2019.png": (
        "pm9.fCOPY_2019.icon.png",
        "b8218c6fab6aafc477f0a57aa4168961d668d638"
    ),
    "costumes/4-goggles-2026.png": (
        "pm4.fGOGGLES_2026.icon.png",
        "747f05715afdc29abeb94470d0dbab17fe16fa48"
    ),
    "costumes/4-goggles-2026-shiny.png": (
        "pm4.fGOGGLES_2026.s.icon.png",
        "6d2e2b385f927323cc1689f2aad394357d210628"
    ),
    "costumes/5-goggles-2026.png": (
        "pm5.fGOGGLES_2026.icon.png",
        "aba004495e1716211c19fc9b039ea496d9b52ffa"
    ),
    "costumes/5-goggles-2026-shiny.png": (
        "pm5.fGOGGLES_2026.s.icon.png",
        "636adf5e6e2030527a4d25b52f2ae891dfac197a"
    ),
    "costumes/6-goggles-2026.png": (
        "pm6.fGOGGLES_2026.icon.png",
        "12bcd601236b2d74ffb10b09824f64b8c30e73d2"
    ),
    "costumes/6-goggles-2026-shiny.png": (
        "pm6.fGOGGLES_2026.s.icon.png",
        "4ff140a084be11ab5bab803713eb59e754823083"
    )
}

# Verified Pokémon variety ID 10174 from PokéAPI. Pin the source commit:
# never use a mutable branch for regional-form identity or shiny color.
FORM_SOURCE_COMMIT = "d8c2fb78563e28ad7b3abe938cf6e79998d04e90"
FORM_SOURCE_ROOT = ("https://raw.githubusercontent.com/PokeAPI/sprites/"
                    + FORM_SOURCE_COMMIT + "/sprites/pokemon/")
FORM_FILES = {
    "forms/zigzagoon-galar.png": "10174.png",
    "forms/zigzagoon-galar-shiny.png": "shiny/10174.png",
}


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
    # Exact extra form sprites. Fail the QA build on missing/bad bytes rather
    # than silently shipping the diamond placeholder or the wrong base form.
    form_hashes = {}
    for output, relative in FORM_FILES.items():
        url = FORM_SOURCE_ROOT + relative
        request = urllib.request.Request(
            url, headers={"User-Agent": "PokeSearch-LT119-exact-regional-sprite/1"})
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                if response.status != 200:
                    raise RuntimeError("non-200 form sprite response")
                content_type = response.headers.get("Content-Type", "").lower()
                if content_type and "image/png" not in content_type:
                    raise RuntimeError("form sprite has non-PNG content type")
                data = response.read(MAX_BYTES + 1)
        except (urllib.error.URLError, TimeoutError, OSError) as err:
            raise SystemExit(f"Cannot build exact regional form {output}: {type(err).__name__}")
        if not verified_png(data):
            raise SystemExit(f"Invalid regional form sprite: {output}")
        target = dest / output
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        form_hashes[output] = hashlib.sha256(data).hexdigest()

    # LT125: recover all 80 exact regional/seasonal PNGs from the uploaded
    # LT116 pack, but do not overwrite newer application JS/HTML or protections.
    from fetch_form_sprites import fetch_verified_forms
    form_hashes.update(fetch_verified_forms(dest))
    # All 317 previously verified forms now have exact normal/Shiny artwork
    # packaged offline as well, with no additional runtime API or permission.
    from fetch_all_verified_varieties import fetch_varieties
    form_hashes.update(fetch_varieties(dest))

    # LT126: WWM catalog + exactly eight GO Pumpkaboo form images.
    # No other external image is silently accepted or used for encounters.
    from import_wwm_catalog import produce as import_wwm_catalog
    from fetch_wwm_pumpkaboo import fetch_pumpkaboo, WWM_COMMIT
    external_catalog=import_wwm_catalog(dest)
    external_form_hashes=fetch_pumpkaboo(dest)
    form_hashes.update(external_form_hashes)

    # Pin exact GO costume icons by repository commit + Git object SHA1.
    # Reject redirected HTML, mismatched bytes and missing normal/shiny art.
    costume_hashes = {}
    for output, (relative, object_id) in COSTUME_FILES.items():
        url = COSTUME_ROOT + relative
        request = urllib.request.Request(
            url, headers={"User-Agent": "PokeSearch-LT125-costume-pinner/1"})
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                if response.status != 200:
                    raise RuntimeError("non-200 costume response")
                kind = response.headers.get("Content-Type", "").lower()
                if kind and "image/png" not in kind:
                    raise RuntimeError("non-PNG costume response")
                image = response.read(MAX_BYTES + 1)
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            raise SystemExit("Missing pinned costume asset: " + output +
                             " (" + type(error).__name__ + ")")
        if not verified_png(image):
            raise SystemExit("Invalid PNG costume asset: " + output)
        actual = hashlib.sha1(b"blob " + str(len(image)).encode() +
                              bytes([0]) + image).hexdigest()
        if actual != object_id:
            raise SystemExit("Upstream costume asset changed: " + output)
        target = dest / output
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(image)
        costume_hashes[output] = hashlib.sha256(image).hexdigest()

    summary = {
        "schema": "pokesearch-offline-sprites-v1",
        "formSourceCommit": FORM_SOURCE_COMMIT,
        "costumeSourceCommit": COSTUME_SOURCE_COMMIT,
        "costumes": dict(sorted(costume_hashes.items())),
        "externalCatalog":external_catalog,
        "externalFormCount":len(external_form_hashes),
        "externalSpriteCommit":WWM_COMMIT,
        "forms": dict(sorted(form_hashes.items())),
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

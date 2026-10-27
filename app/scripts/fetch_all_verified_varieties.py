#!/usr/bin/env python3
"""Build-only complete PokeAPI form sprites. Pinned remote source; no app API calls.

All 317 exact Pokemon variety IDs from sprite_offline.js are included as
normal and shiny PNG. Unknown varieties/costumes are not mapped to any base.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import hashlib
import json
import struct
import urllib.request

SOURCE_COMMIT = "d8c2fb78563e28ad7b3abe938cf6e79998d04e90"
BASE = ("https://raw.githubusercontent.com/PokeAPI/sprites/" +
        SOURCE_COMMIT + "/sprites/pokemon/")
MAX_BYTES = 256 * 1024

def valid_png(buf):
    if len(buf) < 33 or len(buf) > MAX_BYTES:
        return False
    if buf[:8] != b"\x89PNG\r\n\x1a\n" or buf[12:16] != b"IHDR":
        return False
    width, height = struct.unpack(">II", buf[16:24])
    return 8 <= width <= 1024 and 8 <= height <= 1024

def fetch_varieties(dest, index_path="app/scripts/verified-variety-sprites.json"):
    index = json.loads(Path(index_path).read_text(encoding="utf8"))
    ids = index.get("ids", [])
    if index.get("sourceCommit") != SOURCE_COMMIT or len(ids) != 317:
        raise ValueError("Unexpected pinned PokeAPI catalog")
    if ids != sorted(set(ids)) or any(not isinstance(n,int) or n<10000 or n>19999 for n in ids):
        raise ValueError("Invalid unique Pokemon variety IDs")
    root = Path(dest) / "forms"
    root.mkdir(parents=True, exist_ok=True)
    jobs = [(id, shiny) for id in ids for shiny in (False,True)]

    def job(pair):
        id, shiny = pair
        suffix = "-shiny" if shiny else ""
        rel = "forms/variety-" + str(id) + suffix + ".png"
        path = root / ("variety-" + str(id) + suffix + ".png")
        if path.exists():
            raw = path.read_bytes()
            if valid_png(raw):
                return rel, hashlib.sha256(raw).hexdigest()
        route = ("shiny/" if shiny else "") + str(id) + ".png"
        request = urllib.request.Request(BASE + route, headers={
            "User-Agent": "PokeSearch-LT125-varieties-offline/1"
        })
        with urllib.request.urlopen(request, timeout=25) as response:
            if response.status != 200 or "image/png" not in response.headers.get("Content-Type","image/png").lower():
                raise RuntimeError("Missing pinned variety: " + route)
            raw = response.read(MAX_BYTES+1)
        if not valid_png(raw):
            raise RuntimeError("Invalid exact variety PNG: " + route)
        path.write_bytes(raw)
        return rel, hashlib.sha256(raw).hexdigest()

    result = {}
    with ThreadPoolExecutor(max_workers=12) as pool:
        for future in as_completed([pool.submit(job,pair) for pair in jobs]):
            rel, digest = future.result()
            result[rel] = digest
    if len(result) != 634:
        raise ValueError("Incomplete 317 normal + shiny variety set")
    return dict(sorted(result.items()))

if __name__ == "__main__":
    report = fetch_varieties("app/src/main/assets/pokemon-sprites")
    print("Verified exact variety PNGs:",len(report))

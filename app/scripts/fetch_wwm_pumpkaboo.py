#!/usr/bin/env python3
"""Pinned WWM UIcons first integration. Exact GO Pumpkaboo size variants only.

All eight PNGs have repository blob identities checked against the upstream
commit and form IDs independently checked with WatWowMap pogo-data-api.
Other WWM artwork is NOT substituted automatically.
"""
from pathlib import Path
import hashlib
import struct
import urllib.request

WWM_COMMIT = "998bf635194a11078b6375c79d1494d5eb999b39"
WWM_ROOT = "https://raw.githubusercontent.com/WatWowMap/wwm-uicons/" + WWM_COMMIT + "/pokemon/"
FILES = {
  "forms/wwm-710-small.png": ("710.png",
    "196639739ce3d405526bbadfa77cdb6781f0327d"),
  "forms/wwm-710-small-shiny.png": ("710_s.png",
    "29b590f4c7beb44144e1d0ff08e10f0248b122d1"),
  "forms/wwm-710-average.png": ("710_f2642.png",
    "4415236a62c9cb728bc38de6bde60567f4f0a41c"),
  "forms/wwm-710-average-shiny.png": ("710_f2642_s.png",
    "65cbbe301df7f1ac494f9fb20b1d770255fdc475"),
  "forms/wwm-710-large.png": ("710_f2643.png",
    "6180daabf91eca416802581de6afabf64a7205aa"),
  "forms/wwm-710-large-shiny.png": ("710_f2643_s.png",
    "281e2e5b100daace6fde72ae3959b24d641afef7"),
  "forms/wwm-710-super.png": ("710_f2644.png",
    "9c888e2ad84acb6e5b1fe32febf232f102d9fb88"),
  "forms/wwm-710-super-shiny.png": ("710_f2644_s.png",
    "fbb83993dc7f8296b877753eff0188811633d758")
} 

def fetch_pumpkaboo(dest):
    output = {}
    for relative, (original, blob_id) in FILES.items():
        target = Path(dest) / relative
        if target.exists():
            raw = target.read_bytes()
            if _verified(raw, blob_id):
                output[relative] = hashlib.sha256(raw).hexdigest()
                continue
        request = urllib.request.Request(WWM_ROOT + original, headers={
            "User-Agent":"PokeSearch-LT126-exact-form-archive/1"})
        with urllib.request.urlopen(request,timeout=25) as response:
            if response.status != 200 or "image/png" not in response.headers.get("Content-Type","image/png").lower():
                raise RuntimeError("WWM unverified response " + relative)
            raw = response.read(256*1024+1)
        if not _verified(raw,blob_id):
            raise RuntimeError("WWM blob/PNG mismatch "+relative)
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(raw)
        output[relative] = hashlib.sha256(raw).hexdigest()
    if len(output) != 8:
        raise AssertionError("Incomplete Pumpkaboo variant pack")
    return dict(sorted(output.items()))

def _verified(raw,expected):
    if not 33 <= len(raw) <= 256*1024 or raw[:8] != b"\x89PNG\r\n\x1a\n" or raw[12:16] != b"IHDR":
        return False
    w,h = struct.unpack(">II",raw[16:24])
    if not 8 <= w <= 1024 or not 8 <= h <= 1024:
        return False
    return hashlib.sha1(b"blob "+str(len(raw)).encode()+bytes([0])+raw).hexdigest() == expected

if __name__ == "__main__":
    print(fetch_pumpkaboo("app/src/main/assets/pokemon-sprites"))

#!/usr/bin/env python3
"""LT187 independent APK inventory: no file removals, no secrets, no source changes."""
import argparse
import collections
import hashlib
import json
import zipfile
from pathlib import Path

def category(name):
    if name.startswith("assets/pokemon-sprites/"):
        return "Pokemon offline sprites"
    if name.startswith("res/raw/") or (name.startswith("res/") and name.endswith(".mp3")):
        return "Notification sounds / raw resources"
    if name.startswith("assets/weather-icons/"):
        return "Weather icons"
    if name.startswith("assets/result-icons/"):
        return "Result icons"
    if name.startswith("assets/branding/"):
        return "Redundant brand masters (must be absent)"
    if name.startswith("assets/"):
        return "WebView and other assets"
    if name.startswith("res/"):
        return "Android drawables/resources"
    if name.startswith("classes") and name.endswith(".dex"):
        return "Dex bytecode"
    if name.startswith("lib/"):
        return "Native libraries"
    if name.startswith("META-INF/"):
        return "Signature and metadata"
    return "Manifest / other"

def main():
    p=argparse.ArgumentParser()
    p.add_argument("apk")
    p.add_argument("--report",default="LT187-APK-INVENTORY.json")
    opts=p.parse_args()
    apk=Path(opts.apk)
    if not apk.exists(): raise FileNotFoundError(apk)
    data=collections.defaultdict(lambda:{"files":0,"compressed_bytes":0,"uncompressed_bytes":0})
    largest=[]
    duplicates=collections.defaultdict(list)
    entries=[]
    with zipfile.ZipFile(apk) as z:
        assert z.testzip() is None,"APK archive has CRC error"
        infos=[i for i in z.infolist() if not i.is_dir()]
        for item in infos:
            group=category(item.filename)
            d=data[group]
            d["files"]+=1
            d["compressed_bytes"]+=item.compress_size
            d["uncompressed_bytes"]+=item.file_size
            if item.file_size>=200_000 and len(item.filename)<300:
                largest.append({"path":item.filename,"compressed":item.compress_size,
                                "uncompressed":item.file_size,"group":group})
            # Record possible exact duplicates only; do not drop referenced resources.
            if item.file_size>=50_000:
                digest=hashlib.sha256(z.read(item.filename)).hexdigest()
                duplicates[(digest,item.file_size)].append(item.filename)
            entries.append(item.filename)
    assert "assets/dock.html" in entries
    assert "assets/probe.js" in entries
    assert "assets/rare_candy_controls.html" in entries
    assert "assets/pokemon-sprites/manifest.json" in entries
    assert "assets/pokemon-sprites/base/25.png" in entries
    assert "assets/pokemon-sprites/shiny/94.png" in entries
    assert not any(x.startswith("assets/branding/") for x in entries)
    # Android R.raw names must still exist in APK. AAPT compiles paths by numeric ID:
    # avoid false negatives; resource presence checked by Gradle/Node regression.
    candidates=[{"paths":sorted(v),"uncompressed_bytes_each":k[1]}
                for k,v in duplicates.items() if len(v)>=2]
    candidates.sort(key=lambda x:(len(x["paths"])-1)*x["uncompressed_bytes_each"],reverse=True)
    record={"apk":apk.name,"apk_bytes":apk.stat().st_size,"files":len(entries),
            "categories":dict(sorted(data.items(),key=lambda r:r[1]["compressed_bytes"],reverse=True)),
            "largest":sorted(largest,key=lambda r:r["compressed"],reverse=True)[:40],
            "identical_large_assets_requiring_manual_review":candidates[:30],
            "automatic_deletions":0,
            "policy":"No deletion of dependencies, sprite forms, sounds or SHA-pinned files"}
    Path(opts.report).write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n")
    print("LT187 APK inventory:",record["apk_bytes"],"bytes,",len(entries),"entries")
    for name,entry in record["categories"].items():
        print(f" {entry['compressed_bytes']:>10} compressed bytes | {entry['files']:>5} {name}")
    print("Large exact duplicate candidate groups (review only):",len(candidates))
if __name__=="__main__":
    main()

#!/usr/bin/env python3
"""LT187 QA: re-encode only oversized bundled MP3s, with strict runtime parity.

All 37 MP3 names (including 36 notification choices) remain unchanged.
Originals remain recoverable in signed LT186 Git history. No new codec.
"""
import argparse
import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/"app/src/main/res/raw"
LIB=ROOT/"app/src/main/java/com/lucianotoscano/pokesearchoverlay/PokeSoundLibrary.java"
BASE="f277b6ae6d457ecc2b1655f8dc2fa1182c7c1885"
MIN_SIZE=100_000
MAX_DURATION_DRIFT=0.20
MIN_SAVINGS_RATIO=0.08

def run(cmd):
    return subprocess.run(cmd,check=True,capture_output=True,text=True).stdout

def probe(file):
    p=json.loads(run(["ffprobe","-v","error","-select_streams","a:0",
       "-show_entries","stream=codec_name,sample_rate,channels,duration:"
                        "format=duration","-of","json",str(file)]))
    assert len(p.get("streams",[]))==1,f"Only one audio stream expected: {file}"
    s=p["streams"][0]
    assert s["codec_name"]=="mp3",f"Unexpected codec: {file}"
    duration=float(s.get("duration") or p["format"]["duration"])
    return {"rate":int(s["sample_rate"]),"channels":int(s["channels"]),
            "seconds":duration}

def inventory():
    source=LIB.read_text()
    sound_ids=re.findall(r"R\.raw\.(ps_[a-z0-9_]+)",source.split("private static final int[] AUDIO={")[1].split("};")[0])
    labels=re.findall(r'^\s*"[^"\n]+"[,]?$',source.split("static final String[] LABELS={")[1].split("};")[0],flags=re.M)
    assert len(sound_ids)==len(set(sound_ids))==36,(len(sound_ids),"sound menu changed")
    assert len(labels)==36,"Notification menu must still list 36 tones"
    paths=sorted(RAW.glob("*.mp3"))
    assert len(paths)==37,(len(paths),"unexpected MP3 inventory")
    existing={f.stem for f in paths}
    assert set(sound_ids).issubset(existing),sorted(set(sound_ids)-existing)
    return paths,sound_ids

def candidate(source,dest,meta,quality):
    cmd=["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y",
         "-i",str(source),"-map","0:a:0","-vn",
         "-c:a","libmp3lame","-q:a",str(quality),
         "-ar",str(meta["rate"]),"-ac",str(meta["channels"]),
         "-map_metadata","-1","-id3v2_version","3",str(dest)]
    subprocess.run(cmd,check=True,capture_output=True,text=True)
    decoded=probe(dest)
    assert decoded["rate"]==meta["rate"],"sample rate drift"
    assert decoded["channels"]==meta["channels"],"channel drift"
    assert abs(decoded["seconds"]-meta["seconds"])<=MAX_DURATION_DRIFT,(
        source.name,decoded["seconds"],meta["seconds"])
    subprocess.run(["ffmpeg","-v","error","-nostdin","-i",str(dest),
                     "-f","null","-"],check=True,capture_output=True)
    return decoded

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--apply",action="store_true")
    p.add_argument("--report",default="LT187-AUDIO-REPORT.json")
    opts=p.parse_args()
    all_mp3,menu_sounds=inventory()
    results=[]
    with tempfile.TemporaryDirectory(prefix="lt187-audio-") as d:
        for f in all_mp3:
            before=f.stat().st_size
            item={"path":f.relative_to(ROOT).as_posix(),"before":before,
                  "after":before,"status":"unchanged"}
            if before>=MIN_SIZE:
                previous=probe(f)
                # Preserve high-fidelity short sounds; encode only if worth it.
                dest=Path(d)/f.name
                try:
                    after_meta=candidate(f,dest,previous,4)
                except (subprocess.CalledProcessError,AssertionError,ValueError) as e:
                    item["status"]="rejected-validation"
                    item["detail"]=str(e)[:150]
                else:
                    new_size=dest.stat().st_size
                    if new_size<=before*(1-MIN_SAVINGS_RATIO):
                        item.update(after=new_size,status="optimized",
                            original_seconds=round(previous["seconds"],3),
                            encoded_seconds=round(after_meta["seconds"],3),
                            original_sample_rate=previous["rate"],
                            channels=previous["channels"],
                            sha256=hashlib.sha256(dest.read_bytes()).hexdigest())
                        if opts.apply:
                            f.write_bytes(dest.read_bytes())
                    else:
                        item["status"]="not-beneficial"
            results.append(item)
    actual=[x for x in results if x["status"]=="optimized"]
    total=sum(x["before"]-x["after"] for x in actual)
    report={"base":"LT186 QA 31,094,541 bytes",
            "audio_total":len(all_mp3),"selector_sounds":len(menu_sounds),
            "optimized_files":len(actual),"audio_source_bytes_saved":total,
            "before_bytes":sum(x["before"] for x in results),
            "after_bytes":sum(x["after"] for x in results),
            "records":results}
    Path(opts.report).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(f"LT187: {len(actual)}/37 MP3 reduced; {total:,} bytes saved, "
          f"36/36 notification entries preserved")
    for entry in sorted(actual,key=lambda x:x["before"]-x["after"],reverse=True):
        print(f" {entry['before']-entry['after']:>9} {entry['path']}")
    if opts.apply and not actual:
        raise RuntimeError("No MP3 reduced; block QA")
if __name__=="__main__":
    main()

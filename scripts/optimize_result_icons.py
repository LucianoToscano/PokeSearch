#!/usr/bin/env python3
"""Seven-mode PNG optimizer. Originals are NEVER edited here; output to staging."""
from pathlib import Path
from PIL import Image
import hashlib, json, struct
names=("0Star.png","1Star.png","2Star.png","3Star.png","StarGL.png","StarUL.png","StarIVRaw.png")
root=Path(__file__).resolve().parents[1]
src=root/"app/src/main/assets/result-icons/modes"
dst=root/"staging-result-icons/modes"
dst.mkdir(parents=True,exist_ok=True)
report=[]
for name in names:
    original=src/name
    target=dst/name
    with Image.open(original) as image:
        image.load()
        out=image.convert("RGBA")
        out.thumbnail((128,128),Image.Resampling.LANCZOS)
        out.save(target,"PNG",optimize=True,compress_level=9)
    with Image.open(target) as verify:
        assert verify.mode=="RGBA" and max(verify.size)<=128,(name,verify.mode,verify.size)
    data=target.read_bytes()
    chunks=[]; pos=8
    while pos+12<=len(data):
        length=struct.unpack(">I",data[pos:pos+4])[0]
        kind=data[pos+4:pos+8].decode("ascii")
        chunks.append(kind)
        pos+=length+12
        if kind=="IEND": break
    assert set(chunks)<=set(["IHDR","IDAT","IEND"]),(name,chunks)
    report.append(dict(name=name,before=original.stat().st_size,after=len(data),
                       sha256=hashlib.sha256(data).hexdigest()))
(dst.parent/"analysis.json").write_text(json.dumps(report,indent=2))
print("Seven optimized icons:",sum(v["after"] for v in report),"bytes")

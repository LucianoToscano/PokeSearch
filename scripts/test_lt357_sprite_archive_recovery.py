#!/usr/bin/env python3
"""LT357: gate de fallback de sprites protegido, sem rede e sem arte externa."""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import struct
import tempfile
import zipfile

spec=importlib.util.spec_from_file_location(
    "build_sprite_bundle","app/scripts/build_sprite_bundle.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def png():
    # IHDR sintético para testar o verificador, sem copiar imagem de terceiros.
    return (bytes([137,80,78,71,13,10,26,10,0,0,0,13])+
            b"IHDR"+struct.pack(">II",32,32)+
            bytes([8,6,0,0,0,0,0,0,0]))

def archive(wrong_manifest=False,missing_image=False):
    data=png()
    digest=hashlib.sha256(data).hexdigest()
    m={"schema":"pokesearch-offline-sprites-v1",
       "sha256":{"base/422.png":"0"*64 if wrong_manifest else digest,
                 "shiny/422.png":digest}}
    output=io.BytesIO()
    with zipfile.ZipFile(output,"w") as z:
        z.writestr("assets/pokemon-sprites/manifest.json",json.dumps(m))
        if not missing_image:
            z.writestr("assets/pokemon-sprites/base/422.png",data)
        z.writestr("assets/pokemon-sprites/shiny/422.png",data)
    return output.getvalue()


def expect_reject(fun):
    try:fun()
    except SystemExit:return
    raise AssertionError("O fallback inseguro não foi rejeitado")


with tempfile.TemporaryDirectory() as d:
    root=Path(d)
    good=archive()
    errors={"base":[422,999],"shiny":[422,999]}
    hashes={}
    count=module.restore_required_from_pinned_archive(
        good,hashlib.sha256(good).hexdigest(),{422},root,errors,hashes)
    assert count==2
    assert errors=={"base":[999],"shiny":[999]}
    assert hashes["base/422.png"]==hashlib.sha256(png()).hexdigest()
    assert (root/"base/422.png").read_bytes()==png()
    # Nunca usar fonte não fixada, nome ausente ou manifesto adulterado.
    expect_reject(lambda:module.restore_required_from_pinned_archive(
        good,"0"*64,{422},root,{"base":[422],"shiny":[]},{}))
    bad=archive(wrong_manifest=True)
    expect_reject(lambda:module.restore_required_from_pinned_archive(
        bad,hashlib.sha256(bad).hexdigest(),{422},root,
        {"base":[422],"shiny":[]},{}))
    missing=archive(missing_image=True)
    expect_reject(lambda:module.restore_required_from_pinned_archive(
        missing,hashlib.sha256(missing).hexdigest(),{422},root,
        {"base":[422],"shiny":[]},{}))
print("LT357 exact previous-official-APK sprite fallback 4/4 PASS")

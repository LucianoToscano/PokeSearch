#!/usr/bin/env python3
"""Pinned build-time WatWowMap catalogue + exact UIcons integration.

No run-time scraping, GPS/encounter data or changes to API/DOM search.
Only verified (dex, form ID, normal/shiny) icons on an explicit allowlist.
"""
from pathlib import Path
import hashlib, json, re, struct, urllib.request

DATA_SHA = "998bf635194a11078b6375c79d1494d5eb999b39"
ICON_SHA = "42b315f317ca8cee8e178249328eab5173e5ca70"
DATA_ROOT = "https://raw.githubusercontent.com/WatWowMap/pogo-data-api/" + DATA_SHA + "/data/v1/"
ICON_ROOT = "https://raw.githubusercontent.com/WatWowMap/wwm-uicons/" + ICON_SHA + "/pokemon/"
MAX_JSON = 6*1024*1024
MAX_PNG = 256*1024
# Exact GO Average form explicitly cross-checked against WWM formId 2642,
# PokeAPI pokemon.csv (710 pumpkaboo-average, default=1) and WWM icon index.
APPROVED = ((710, 2642, "PUMPKABOO_AVERAGE", "Average"),)

def fetch(url, limit):
    req = urllib.request.Request(url, headers={"User-Agent":"PokeSearch-LT126-catalog-build/1"})
    with urllib.request.urlopen(req, timeout=25) as res:
        if res.status!=200: raise RuntimeError("Source unavailable: "+url)
        data=res.read(limit+1)
        if len(data)>limit: raise ValueError("Upstream exceeds cap: "+url)
        return data

def png_check(b):
    if len(b)<33 or len(b)>MAX_PNG or b[:8]!=b"\x89PNG\r\n\x1a\n" or b[12:16]!=b"IHDR":return False
    w,h=struct.unpack(">II",b[16:24])
    return 8<=w<=1024 and 8<=h<=1024

def sync(root):
    root=Path(root)
    pokemon=json.loads(fetch(DATA_ROOT+"pokemon.json",MAX_JSON))
    forms=json.loads(fetch(DATA_ROOT+"forms.json",MAX_JSON))
    costumes=json.loads(fetch(DATA_ROOT+"costumes.json",MAX_JSON))
    index=json.loads(fetch(ICON_ROOT+"index.json",MAX_JSON))
    if (not isinstance(pokemon,list) or len(pokemon)<1025 or
        not isinstance(forms,list) or len(forms)<1400 or
        not isinstance(costumes,list) or len(costumes)<80 or
        not isinstance(index,list) or len(index)<10000):
        raise ValueError("Unexpected WWM source shapes; no silently fabricated catalog")
    species={}
    for p in pokemon:
        if not isinstance(p,dict):continue
        n=p.get("pokedexId");name=p.get("pokemonName")
        if type(n)!=int or not (1<=n<=1025) or not isinstance(name,str):continue
        values=p.get("forms",[])
        if not isinstance(values,list):values=[]
        species[str(n)]={"name":name,"defaultFormId":p.get("defaultFormId"),
                         "formIds":[x for x in values if type(x)==int]}
    if len(species)!=1025:raise ValueError("Expected 1025 unique species in upstream")
    catalog_forms={}
    for f in forms:
        if not isinstance(f,dict):continue
        n=f.get("formId");name=f.get("formName");proto=f.get("proto")
        if type(n)==int and isinstance(name,str) and isinstance(proto,str):
            catalog_forms[str(n)]={"name":name,"proto":proto}
    if len(catalog_forms)<1400:raise ValueError("Too few validated form IDs")
    catalog_costumes={}
    for c in costumes:
        if isinstance(c,dict) and type(c.get("id"))==int and isinstance(c.get("proto"),str):
            catalog_costumes[str(c["id"])]={"name":str(c.get("name","")),"proto":c["proto"]}
    existing=set(index)
    assets={}
    icons=[]
    for dex,fid,proto,label in APPROVED:
        p=species.get(str(dex),{});form=catalog_forms.get(str(fid),{})
        if fid not in p.get("formIds",[]) or form.get("proto")!=proto or form.get("name")!=label:
            raise ValueError("Form ID/dex/proto mismatch in WWM catalogue")
        for shiny in (False,True):
            name=f"{dex}_f{fid}" + ("_s" if shiny else "") + ".png"
            if name not in existing:raise ValueError("Exact UIcons file missing: "+name)
            data=fetch(ICON_ROOT+name,MAX_PNG)
            if not png_check(data):raise ValueError("Invalid exact UIcons PNG: "+name)
            out=f"external/{dex}-f{fid}" + ("-shiny" if shiny else "") + ".png"
            dest=root/out;dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(data)
            assets[out]=hashlib.sha256(data).hexdigest()
            icons.append({"dex":dex,"formId":fid,"form":label,"proto":proto,"shiny":shiny,
                          "file":out,"speciesName":p["name"]})
    snapshot={"schema":"pokesearch-wwm-catalog-v1","dataCommit":DATA_SHA,"uiconsCommit":ICON_SHA,
              "species":species,"forms":catalog_forms,"costumes":catalog_costumes,"icons":icons}
    source=root.parent/"wwm_catalog_snapshot.js"
    source.write_text("/* Generated at build from pinned WatWowMap data. No live encounters. */\n"+
                      "(function(r){r.PokeSearchWWMCatalog="+json.dumps(snapshot,ensure_ascii=False,separators=(',',':'))+
                      ";})(typeof window!==\"undefined\"?window:globalThis);\n",encoding="utf-8")
    return {"hashes":assets,"speciesCount":len(species),"formCount":len(catalog_forms),
            "costumeCount":len(catalog_costumes),"iconCount":len(icons),
            "dataCommit":DATA_SHA,"uiconsCommit":ICON_SHA}

if __name__=="__main__":
    info=sync("app/src/main/assets/pokemon-sprites")
    print(json.dumps({k:v for k,v in info.items() if k!="hashes"},ensure_ascii=False))

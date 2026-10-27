#!/usr/bin/env python3
"""Build-only verified GO metadata import. Existing runtime remains offline."""
import hashlib,json,sys,urllib.request
from pathlib import Path

REV="42b315f317ca8cee8e178249328eab5173e5ca70"
BASE="https://raw.githubusercontent.com/WatWowMap/pogo-data-api/"+REV+"/data/v1/"
SOURCES={"pokemon":"pokemon.json","forms":"forms.json","costumes":"costumes.json",
         "pt_pokemon":"translations/pt-br/pokemon.json",
         "pt_forms":"translations/pt-br/forms.json",
         "pt_costumes":"translations/pt-br/costumes.json"}

def build(target):
    payload,hashes={},{}
    for key,relative in SOURCES.items():
        req=urllib.request.Request(BASE+relative,headers={"User-Agent":"PokeSearch-LT126-build"})
        with urllib.request.urlopen(req,timeout=30) as response:
            if response.status!=200:raise ValueError("Bad catalog status")
            raw=response.read(8*1024*1024+1)
        if not raw or len(raw)>8*1024*1024:raise ValueError("Bad catalog size")
        payload[key]=json.loads(raw)
        hashes[key]=hashlib.sha256(raw).hexdigest()
    pokemon,forms,costumes=payload["pokemon"],payload["forms"],payload["costumes"]
    if not isinstance(pokemon,list) or len(pokemon)!=1025:raise ValueError("Pokemon count mismatch")
    if not isinstance(forms,list) or len(forms)<1400:raise ValueError("Forms truncated")
    if not isinstance(costumes,list) or len(costumes)<80:raise ValueError("Costumes truncated")
    species={}
    for p in pokemon:
        dex,default,ids=p["pokedexId"],p["defaultFormId"],p["forms"]
        if not isinstance(dex,int) or dex in species or default not in ids:
            raise ValueError("Invalid species mapping")
        species[dex]=[p["pokemonName"],default,ids]
    fmap={}
    for f in forms:
        id=f["formId"]
        if id in fmap:raise ValueError("Duplicate form ID")
        fmap[id]=[f["proto"],f["formName"]]
    if any(any(fid not in fmap for fid in info[2]) for info in species.values()):
        raise ValueError("Form reference missing")
    cmap={}
    for c in costumes:
        id=c["id"]
        if id in cmap:raise ValueError("Duplicate costume ID")
        cmap[id]=[c["proto"],c["name"]]
    pt={k:payload[k] for k in ("pt_pokemon","pt_forms","pt_costumes")}
    result={"source":"WatWowMap/pogo-data-api","revision":REV,"species":species,
            "forms":fmap,"costumes":cmap,"ptBr":pt}
    target=Path(target)
    target.mkdir(parents=True,exist_ok=True)
    js="/* Pinned build-time metadata only; no runtime HTTP. */\n" + \
       "(function(g){const d="+json.dumps(result,separators=(",",":"),ensure_ascii=False)+
       ";if(g)g.PokeSearchWWMCatalog=d;if(typeof module==='object'&&module.exports)module.exports=d;})(typeof globalThis!=='undefined'?globalThis:null);\n"
    (target/"wwm_catalog.js").write_text(js,encoding="utf-8")
    manifest={"revision":REV,"sha256":hashes,"pokemon":len(species),
              "forms":len(fmap),"costumes":len(cmap),"bytes":len(js.encode("utf-8"))}
    (target/"wwm_catalog_provenance.json").write_text(json.dumps(manifest,indent=2)+"\n")
    print("WatWowMap verified catalog:",manifest)
if __name__=="__main__":
    build(sys.argv[1] if len(sys.argv)>1 else "app/src/main/assets")

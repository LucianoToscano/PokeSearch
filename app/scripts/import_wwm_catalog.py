#!/usr/bin/env python3
"""Build-only, immutable WWM Pokémon GO species/form/costume ID metadata.

Does not fetch encounter data, credentials, spawns or live location. The source
arrays are checked for unique IDs and exact record structure. No form ID is
automatically treated as a visually verified image.
"""
from pathlib import Path
import hashlib
import json
import urllib.request

COMMIT = "42b315f317ca8cee8e178249328eab5173e5ca70"
ROOT = "https://raw.githubusercontent.com/WatWowMap/pogo-data-api/" + COMMIT + "/data/v1/"
MAX_BYTES = 5 * 1024 * 1024

def get(kind):
    request=urllib.request.Request(ROOT+kind+".json",headers={"User-Agent":"PokeSearch-LT126-catalog-build/1"})
    with urllib.request.urlopen(request,timeout=30) as response:
        if response.status!=200 or "json" not in response.headers.get("Content-Type","application/json").lower():
            raise ValueError("Invalid upstream catalog response: "+kind)
        raw=response.read(MAX_BYTES+1)
    if len(raw)>MAX_BYTES:
        raise ValueError("Catalog too large: "+kind)
    value=json.loads(raw.decode("utf-8"))
    if not isinstance(value,list):
        raise ValueError("Catalog collection must be list: "+kind)
    return value,hashlib.sha256(raw).hexdigest()

def _records(rows,id_key,name_key):
    known={}
    for entry in rows:
        if not isinstance(entry,dict):
            raise ValueError("Invalid metadata object")
        n=entry.get(id_key)
        name=entry.get(name_key)
        if not isinstance(n,int) or n<0 or n>100000 or not isinstance(name,str) or len(name)>110 or not name:
            raise ValueError("Invalid metadata key/value")
        if n in known:
            raise ValueError("Duplicate catalog ID")
        known[n]=entry
    return known

def produce(dest="app/src/main/assets/pokemon-sprites"):
    mons,p_sha=get("pokemon")
    forms,f_sha=get("forms")
    costumes,c_sha=get("costumes")
    species=_records(mons,"pokedexId","pokemonName")
    form_by_id=_records(forms,"formId","proto")
    costume_by_id=_records(costumes,"id","proto")
    if len(species)!=1025 or len(form_by_id)!=1478 or len(costume_by_id)!=87:
        raise ValueError("Pinned WWM catalog version/coverage changed")
    for dex in range(1,1026):
        if dex not in species:
            raise ValueError("Pokedex gap: "+str(dex))
        form_ids=species[dex].get("forms",[])
        if not isinstance(form_ids,list) or not all(isinstance(x,int) and x in form_by_id for x in form_ids):
            raise ValueError("Unresolved form ID in dex "+str(dex))
    pump=species[710]
    if pump["pokemonName"]!="Pumpkaboo" or pump["defaultFormId"]!=2641 or pump["forms"]!=[2641,2642,2643,2644]:
        raise ValueError("Pumpkaboo identity/shape differs from pinned source")
    if species[426]["pokemonName"]!="Drifblim" or species[426]["defaultFormId"]!=1748:
        raise ValueError("Drifblim not matching verified species source")
    for n,want in ((2641,"PUMPKABOO_SMALL"),(2642,"PUMPKABOO_AVERAGE"),(2643,"PUMPKABOO_LARGE"),(2644,"PUMPKABOO_SUPER")):
        if form_by_id[n]["proto"]!=want:
            raise ValueError("Incorrect Pumpkaboo form ID "+str(n))
    compact={
        "schema":"pokesearch-wwm-static-v1",
        "source":"WatWowMap/pogo-data-api",
        "sourceCommit":COMMIT,
        "upstreamSha256":{"pokemon":p_sha,"forms":f_sha,"costumes":c_sha},
        "species":[[dex,species[dex]["pokemonName"],species[dex].get("defaultFormId"),species[dex].get("forms",[])] for dex in sorted(species)],
        "forms":[[n,form_by_id[n]["proto"],form_by_id[n].get("formName","")] for n in sorted(form_by_id)],
        "costumes":[[n,costume_by_id[n]["proto"]] for n in sorted(costume_by_id)]
    }
    target=Path(dest)/"catalog_wwm_verified.json"
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(compact,separators=(",",":"),ensure_ascii=False),encoding="utf8")
    return {"species":len(species),"forms":len(form_by_id),"costumes":len(costume_by_id),"catalogFile":str(target),"sourceCommit":COMMIT}

if __name__=="__main__":
    print(produce())

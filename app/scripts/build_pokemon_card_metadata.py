#!/usr/bin/env python3
"""Generate a small offline GO Pokemon type / Elite TM / legacy move index.
Source: pinned PvPoke Pokémon gamemaster (MIT), never queried at runtime.
No player data, tokens, coordinates or extra provider searches are involved.
"""
import json
import hashlib
import re
from pathlib import Path
from urllib.request import Request, urlopen

REVISION = "d98f52174e01f8f67414bc6973599788d098c10e"
URL = ("https://raw.githubusercontent.com/pvpoke/pvpoke/" + REVISION +
       "/src/data/gamemaster/pokemon.json")
OUT = Path(__file__).resolve().parent.parent / "src/main/assets/pokemon_card_metadata.js"
VALID = {"normal","fire","water","electric","grass","ice","fighting",
         "poison","ground","flying","psychic","bug","rock","ghost",
         "dragon","dark","steel","fairy"}
def key(value):
    return re.sub(r"[^a-z0-9]", "", str(value or "").casefold())
def moves(entry):
    values = (entry.get("eliteMoves") or []) + (entry.get("legacyMoves") or [])
    return sorted({str(x).upper() for x in values if re.fullmatch(r"[A-Z0-9_]+", str(x))})
def item(entry):
    types = [str(t).lower() for t in entry.get("types", [])
             if str(t).lower() in VALID]
    if not types or len(types)>2:
        return None
    return [types,moves(entry)]
def main():
    with urlopen(Request(URL,headers={"User-Agent":"PokeSearch-pinned-card-metadata/1"}),
                 timeout=90) as response:
        if response.status!=200:
            raise RuntimeError("Pinned PvPoke gamemaster not available")
        raw=response.read(5_000_000)
    if len(raw)<300_000 or len(raw)>=5_000_000:
        raise RuntimeError("Unexpected upstream size")
    data=json.loads(raw)
    if not isinstance(data,list) or len(data)<1000:
        raise RuntimeError("Incomplete upstream dataset")
    base={}
    forms={}
    for entry in data:
        dex=entry.get("dex")
        if not isinstance(dex,int) or not (1<=dex<=2000):
            continue
        v=item(entry)
        if not v: continue
        name=str(entry.get("speciesName") or "")
        # Prefer the exact unqualified species for base. Regionals and
        # battle-specific types require a proven, matching form.
        if "(" not in name and str(dex) not in base:
            base[str(dex)]=v
        elif name.endswith(")") and "(" in name:
            qualifier=name.rsplit("(",1)[-1][:-1]
            qualifier_key=key(qualifier)
            if qualifier_key in ("shadow","mega","primal","supermega","purified"):
                continue
            if qualifier_key:
                forms[str(dex)+":"+qualifier_key]=v
    if len(base)<900 or len(forms)<100:
        raise RuntimeError(f"Insufficient metadata: base={len(base)} forms={len(forms)}")
    # Data are not automatically inferred for an unknown regional/seasonal form.
    metadata={"source":"PvPoke","revision":REVISION,
              "upstreamSha256":hashlib.sha256(raw).hexdigest(),
              "base":base,"forms":forms}
    OUT.write_text("window.PokeSearchCardMetaData="+json.dumps(metadata,separators=(",",":"),ensure_ascii=False)+";\n",encoding="utf-8")
    print("Pinned card metadata:",len(base),"species,",len(forms),"forms; sha256",
          metadata["upstreamSha256"],"bytes",OUT.stat().st_size)
if __name__=="__main__":
    main()

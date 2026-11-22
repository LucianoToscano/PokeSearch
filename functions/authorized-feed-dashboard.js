"use strict";

/**
 * Self-contained operator dashboard for the local authorized webhook gateway.
 * No external scripts, trackers, images or map tiles. The user supplies the
 * read-only secret in memory; requests stay on this same HTTPS origin.
 */
const html = String.raw`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PokeSearch · Radar de Fontes</title>
<style>
:root{color-scheme:dark;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0c1220;color:#f4f8ff}
*{box-sizing:border-box}body{margin:0;padding:18px;max-width:1150px;margin-inline:auto}
h1{font-size:1.55rem;margin:10px 0 5px}.muted{color:#a7b6cf;font-size:.91rem}
.layout{display:grid;grid-template-columns:minmax(290px,360px) 1fr;gap:18px;margin-top:18px}
.panel{background:#151f33;border:1px solid #2d3a54;border-radius:15px;padding:16px}
label{display:block;font-size:.86rem;margin-top:12px;color:#cbd9f0}
input{width:100%;background:#091322;border:1px solid #3c4b63;color:#fff;border-radius:9px;padding:11px;font:inherit}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
button{background:#dfeaff;color:#0b1931;border:0;border-radius:10px;padding:12px;font:inherit;font-weight:650;cursor:pointer;margin-top:10px}
button.alt{background:#31445f;color:white}button:focus-visible,input:focus-visible{outline:2px solid #6dc5ff}
.status{border-radius:9px;background:#0a172a;padding:12px;min-height:48px;margin-top:12px;white-space:pre-wrap}
#map{width:100%;height:260px;border:1px solid #455c7a;background:#10243c;border-radius:11px;margin-top:12px}
#rows{display:grid;gap:8px;margin-top:12px}
.entry{padding:12px;background:#0d1728;border:1px solid #304159;border-radius:10px}
.entry strong{display:block;font-size:1.04rem}.entry small{color:#b5c7dc;display:block;margin-top:5px}
.tag{display:inline-block;background:#314b61;border-radius:50px;font-size:.78rem;padding:4px 9px}
.warning{color:#ffdb8b}.ok{color:#a1f6c0}
@media(max-width:750px){.layout{grid-template-columns:1fr}body{padding:12px}}
</style></head><body>
<header><h1>Radar de Fontes · PokeSearch / PGBR</h1>
<div class="muted">Visualização operacional de webhooks autorizados. O mapa é esquemático; não contém ruas ou tiles externos.</div></header>
<div class="layout"><section class="panel"><strong>Consulta manual</strong>
<label>Chave de leitura do seu servidor (nunca é salva)</label>
<input id="secret" type="password" autocomplete="off" placeholder="X-Feed-Secret" />
<div class="two"><div><label>Latitude do centro</label><input id="lat" value="-23.550520" inputmode="decimal"/></div>
<div><label>Longitude do centro</label><input id="lon" value="-46.633308" inputmode="decimal"/></div></div>
<div class="two"><div><label>Raio (km)</label><input id="km" value="5" type="number" min="1" max="25" /></div>
<div><label>Espécie #Dex</label><input id="dex" placeholder="ex. 25"/></div></div>
<div class="two"><div><label>IV mínimo</label><input id="iv" type="number" min="0" max="100" value="0"/></div>
<div><label>PC mínimo</label><input id="cp" type="number" min="0" max="20000" value="0"/></div></div>
<label>Nível mínimo</label><input id="level" type="number" min="0" max="55" value="0"/>
<button id="consult">Consultar feed autorizado</button>
<button class="alt" id="demo">Exibir demonstração fictícia</button>
<button class="alt" id="clear">Limpar filtros</button>
<p class="muted">Dados reais dependem de webhook configurado e credenciais do operador.
O modo demonstração funciona sem scanner, API comercial ou rede externa e NÃO representa aparições.</p>
</section><main class="panel">
<span id="source" class="tag">Nenhuma consulta realizada</span>
<div id="status" class="status" role="status" aria-live="polite">Informe sua chave e consulte. Ou abra a demonstração offline.</div>
<svg id="map" viewBox="0 0 600 260" role="img" aria-label="Mapa esquemático dos resultados">
<path d="M0 65H600 M0 130H600 M0 195H600 M150 0V260 M300 0V260 M450 0V260"
stroke="#31506b" stroke-width="1" fill="none"/>
<text x="300" y="130" text-anchor="middle" fill="#b0c6de">Sem resultados no mapa</text>
</svg>
<div id="rows"></div>
</main></div>
<script>
"use strict";
const $=id=>document.getElementById(id);
const svgNS="http://www.w3.org/2000/svg";
function el(tag,text,cls){const node=document.createElement(tag);
if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function center(){const lat=Number($("lat").value.replace(",",".")),
lon=Number($("lon").value.replace(",",".")),km=Number($("km").value);
if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||km<1||km>25)
throw Error("Informe latitude/longitude válidas e raio entre 1 e 25 km.");
return {lat,lon,km};}
function box(){const c=center();const dLat=c.km/111.32;
const dLon=c.km/Math.max(1,111.32*Math.abs(Math.cos(c.lat*Math.PI/180)));
return {swLat:Math.max(-90,c.lat-dLat),swLng:Math.max(-180,c.lon-dLon),
neLat:Math.min(90,c.lat+dLat),neLng:Math.min(180,c.lon+dLon)};}
function filtersURL(){const b=box();const p=new URLSearchParams({pokemon:"true"});
for(const name of ["swLat","swLng","neLat","neLng"])p.set(name,b[name].toFixed(6));
for(const [field,param,max] of [["dex","pokemon_id",1025],["iv","iv_min",100],["cp","cp_min",20000],["level","level_min",55]]){
const str=$(field).value.trim();if(!str)continue;
const n=Number(str);if(!Number.isInteger(n)||n<0||n>max||(field==="dex"&&n<1))
throw Error("Filtro "+field+" inválido.");
if(n>0)p.set(param,String(n));}
return "/raw_data?"+p.toString();}
function appendSvg(tag,attrs,parent){const n=document.createElementNS(svgNS,tag);
for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));
parent.appendChild(n);return n;}
function display(data,isDemo){
const rows=$("rows"),map=$("map");rows.replaceChildren();map.replaceChildren();
const b=box();
for(let i=1;i<4;i++){
appendSvg("path",{d:"M0 "+i*65+"H600 M"+i*150+" 0V260",stroke:"#31506b",
"stroke-width":"1",fill:"none"},map);}
let shown=0,unknown=0;
for(const item of data){
const lat=Number(item.latitude),lon=Number(item.longitude);
if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
const ex=Number(item.disappear_time),remaining=Math.max(0,Math.floor((ex-Date.now())/1000));
if(remaining===0)continue;
const atk=Number(item.individual_attack),def=Number(item.individual_defense),sta=Number(item.individual_stamina);
const known=[item.individual_attack,item.individual_defense,item.individual_stamina]
.every(v=>v!==undefined&&v!==null&&Number.isInteger(Number(v)));
const iv=known?Math.round((atk+def+sta)*100/45):null;
if(!known)unknown++;
const id=Number(item.pokemon_id),name=String(item.pokemon_name||"#"+id);
const coords=lat.toFixed(6)+", "+lon.toFixed(6);
const x=40+520*(lon-b.swLng)/Math.max(.0001,b.neLng-b.swLng),
y=220-180*(lat-b.swLat)/Math.max(.0001,b.neLat-b.swLat);
if(x>=0&&x<=600&&y>=0&&y<=260){
const circle=appendSvg("circle",{cx:x,cy:y,r:8,fill:isDemo?"#ffcd7a":"#70e9c0",stroke:"#0d1728",
"stroke-width":2},map);
appendSvg("title",{},circle).textContent=name+" · "+coords;
}
const card=el("article",undefined,"entry");
card.appendChild(el("strong",name+" · "+(iv===null?"IV desconhecido":"IV "+iv+"%")));
card.appendChild(el("small",(isDemo?"EXEMPLO FICTÍCIO · ":"Fonte real configurada · ")
+"PC "+(item.cp??"desconhecido")+" · nível "+(item.level??item.pokemon_level??"desconhecido")
+" · expira em "+Math.floor(remaining/60)+"min"));
card.appendChild(el("small",coords+" · origem "+String(item.source_id||"não informada")));
if(!isDemo){
const copy=el("button","Copiar coordenadas");
copy.addEventListener("click",()=>navigator.clipboard.writeText(coords)
.then(()=>$("status").textContent="Coordenadas copiadas. Confirme expiração e origem antes de usar."));
card.appendChild(copy);
}
rows.appendChild(card);shown++;
}
$("source").textContent=isDemo?"DEMONSTRAÇÃO — DADOS FICTÍCIOS":"FEED AUTORIZADO — RESPOSTA DA FONTE";
$("source").className="tag "+(isDemo?"warning":"ok");
$("status").textContent=(isDemo?"Demonstração offline: ":"Consulta ao gateway: ")
+shown+" resultado(s) não expirados. "+unknown+" sem IV completo. "
+(shown===0?"Verifique cobertura, filtros, webhook e autenticação.":"");
}
$("consult").addEventListener("click",async()=>{
const button=$("consult");button.disabled=true;
try{
const token=$("secret").value;
if(token.length<24)throw Error("Informe a chave de leitura emitida pelo operador.");
$("source").textContent="Conectando ao feed real…";
const response=await fetch(filtersURL(),{headers:{"X-Feed-Secret":token},cache:"no-store"});
if(!response.ok){$("source").textContent="FONTE INDISPONÍVEL";
throw Error("HTTP "+response.status+" — "+(response.status===401||response.status===403
?"chave recusada pelo operador":response.status===429?"limite de consultas":"verifique servidor e cobertura"));}
const payload=await response.json();
if(payload.demo===true)throw Error("A fonte enviou dados de demonstração, não podem ser rotulados como reais.");
if(!Array.isArray(payload.pokemons))throw Error("Resposta JSON não contém pokemons[].");
display(payload.pokemons,false);
}catch(e){$("status").textContent=String(e.message||"Consulta não concluída.");}
finally{button.disabled=false;}
});
$("demo").addEventListener("click",()=>{
try{const c=center(),now=Date.now();const entries=[
{pokemon_id:25,pokemon_name:"Pikachu",latitude:c.lat+.003,longitude:c.lon+.003,
individual_attack:15,individual_defense:15,individual_stamina:15,
cp:720,level:24,disappear_time:now+900000,source_id:"FICTICIO"},
{pokemon_id:133,pokemon_name:"Eevee",latitude:c.lat-.004,longitude:c.lon-.003,
individual_attack:10,individual_defense:12,individual_stamina:11,
cp:880,level:27,disappear_time:now+1200000,source_id:"FICTICIO"},
{pokemon_id:443,pokemon_name:"Gible",latitude:c.lat+.001,longitude:c.lon-.001,
cp:480,disappear_time:now+1500000,source_id:"FICTICIO"}];display(entries,true);}
catch(e){$("status").textContent=String(e.message);}
});
$("clear").addEventListener("click",()=>{for(const f of ["dex","iv","cp","level"])
$(f).value=f==="dex"?"":"0";
$("status").textContent="Filtros limpos. Consulte novamente para buscar uma nova janela.";});
</script></body></html>`;
module.exports={html};

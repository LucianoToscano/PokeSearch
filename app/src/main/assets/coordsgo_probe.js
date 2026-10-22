(function(){
"use strict";
const action=__ACTION__,value=__VALUE__,index=__INDEX__;
const clean=x=>String(x??"").replace(/\s+/g," ").trim();
const text=e=>clean(e?.innerText||e?.textContent||"");
const buttons=()=>Array.from(document.querySelectorAll("button,[role=button]"))
 .filter(e=>e.getClientRects?.().length);
const selectors=()=>buttons().filter(b=>/^Selecionar$/i.test(text(b)));
function cardRoot(button){
 let n=button.parentElement,choice=n;
 for(let k=0;k<7&&n;k++,n=n.parentElement){
  const count=Array.from(n.querySelectorAll("button,[role=button]"))
   .filter(x=>/^Selecionar$/i.test(text(x))).length;
  if(count>1||text(n).length>800)break;
  if(count===1)choice=n;
 }
 return choice||button.parentElement;
}
function verifiedLinkCoords(row){
 if(!row)return "";
 const links=Array.from(row.querySelectorAll("a[href]"))
  .filter(a=>/maps|mapa|coordenad|localizar/i.test(text(a)+" "+a.href));
 if(links.length!==1)return ""; // ambiguous links must not invent a PokéStop.
 let url;try{url=new URL(links[0].href,location.href)}catch(_){return ""}
 if(!/^https:$/.test(url.protocol)||!/^(?:www\.)?(?:google\.com|maps\.google\.com|maps\.apple\.com)$/i.test(url.hostname))
  return "";
 const candidates=[url.searchParams.get("q"),url.searchParams.get("query"),
   url.searchParams.get("ll")];
 const at=url.pathname.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
 if(at)candidates.push(at[1]+","+at[2]);
 for(const raw of candidates){
  const m=String(raw||"").trim().match(/^(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if(!m)continue;
  const lat=Number(m[1]),lon=Number(m[2]);
  if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)
   return m[1]+","+m[2];
 }
 return "";
}
function collect(){
 if(!document.body)return JSON.stringify({ok:false,status:"Aguardando DOM",cards:[]});
 const raw=document.body.innerText||"";
 const match=raw.match(/Foram geradas\s*(\d+)\s*missões/i);
 const missionCount=match?Number(match[1]):null;
 const location=(raw.match(/(?:^|\n)Local\s*\n([^\n]+)/i)||[])[1]||
 (raw.match(/Selecione a cidade\s*\n([^\n]+)/i)||[])[1]||"";
 const cards=selectors().slice(0,250).map((button,i)=>{
  const row=cardRoot(button);let data=row;
  for(let j=0;j<5&&data&&!/#\s*\d{1,4}/.test(data.innerText||"");j++)
   data=data.parentElement;
  const block=String(data?.innerText||row?.innerText||"");
  const title=(block.match(/#\s*(\d{1,4})\s+([^\n]{2,80})/)||[]);
  const lines=String(row?.innerText||"").split("\n").map(clean).filter(Boolean);
  const task=lines.find(line=>line.length>8&&!/Selecionar|Abrir|PC\s*\d+|^#\d+/.test(line))||"";
  return {sourceIndex:i,number:title[1]||"",
   name:clean(title[2]||"").replace(/\s+(Evento|Shiny).*/i,"").slice(0,90),
   task:task.slice(0,160),
   cpMax:(block.match(/PC\s*(\d+)\s*M[ÁA]X/i)||[])[1]||"",
   cpMin:(block.match(/PC\s*(\d+)\s*M[ÍI]N/i)||[])[1]||"",
   shiny:/\bShiny\b/i.test(block),event:/\bEvento\b/i.test(block),
   coords:verifiedLinkCoords(row)};
 }).filter(c=>c.number||c.task).slice(0,150);
 return JSON.stringify({ok:true,status:missionCount===0?"Catálogo do site":"Catálogo consultado",
  city:clean(location),missionCount,cards});
}
if(action==="city"){
 const want=clean(value).toLowerCase();
 const select=Array.from(document.querySelectorAll("select")).find(s=>
  Array.from(s.options).some(o=>text(o).toLowerCase()===want));
 if(!select)return JSON.stringify({ok:false,status:"Cidade não existe em seletor nativo disponível",cards:[]});
 const opt=Array.from(select.options).find(o=>text(o).toLowerCase()===want);
 const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value")?.set;
 if(setter)setter.call(select,opt.value);else select.value=opt.value;
 select.dispatchEvent(new Event("input",{bubbles:true}));
 select.dispatchEvent(new Event("change",{bubbles:true}));
 return JSON.stringify({ok:true,status:"Cidade enviada ao seletor CoordsGo",cards:[]});
}
if(action==="select"){
 const button=selectors()[index];
 if(!button)return JSON.stringify({ok:false,status:"Recompensa não encontrada no DOM",cards:[]});
 button.click();return JSON.stringify({ok:true,status:"Recompensa selecionada no site",cards:[]});
}
return collect();
})()
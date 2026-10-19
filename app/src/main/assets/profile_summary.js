(function(){
 "use strict";
 // HOME-01: read only visible public profile labels on the authenticated
 // PoGoCoordinates page. Never inspect cookies, localStorage, tokens or HTML.
 const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
 const text=e=>String(e&&(e.innerText||e.textContent)||"").replace(/\s+/g," ").trim();
 const nodes=Array.from(document.querySelectorAll("span,small,strong,p,label,dt,dd,h1,h2,h3,button"))
   .filter(e=>visible(e)&&e.children.length<=3&&text(e).length<=95);
 function bounded(value,max){
   const s=String(value||"").replace(/[\u0000-\u001f<>]/g,"").trim();
   return s.length<=max?s:"";
 }
 function readField(labels,max){
   const pattern=new RegExp("^(?:"+labels+")(?:\\s*[:：-]\\s*|\\s+)(.+)$","i");
   for(const n of nodes){
     const m=text(n).match(pattern);
     if(m){const result=bounded(m[1],max);if(result)return result;}
   }
   for(const n of nodes){
     if(new RegExp("^(?:"+labels+")\\s*:?$","i").test(text(n))){
       const sibling=n.nextElementSibling;
       const value=bounded(sibling?text(sibling):"",max);
       if(value)return value;
     }
   }
   return "";
 }
 // HOME-02: prefer explicit fields. Account and trainer are often rendered
 // as separate React cards rather than "Name: Value" labels.
 const headings=Array.from(document.querySelectorAll("h1,h2,h3,[role=heading]"))
   .filter(visible).map(text).filter(t=>t.length>=3&&t.length<=65);
 const explicitName=readField("logged\\\\s*in\\\\s*as|signed\\\\s*in\\\\s*as|account\\\\s*name|display\\\\s*name|nome\\\\s*da\\\\s*conta",65);
 const displayName=explicitName||headings.find(t=>/^[\\p{L}][\\p{L} .'-]+[\\p{L}]$/u.test(t)&&
   !/^(linked accounts|pokemon go accounts|export|search|settings|pokedex|profile|perfil|pokecoordinates)$/i.test(t))||"";
 const providerRaw=readField("logged\\\\s*in\\\\s*via|sign(?:ed)?\\\\s*in\\\\s*with|conectado\\\\s*via|logado\\\\s*via",30);
 const provider=/\\bgoogle\\b/i.test(providerRaw)?"Google":/\\bdiscord\\b/i.test(providerRaw)?"Discord":"";
 // Find the smallest visible card with trainer code; never read full HTML,
 // credentials, storage or cross-origin content. Limit analysis to 700 chars.
 const cards=Array.from(document.querySelectorAll("article,section,div"))
   .filter(e=>visible(e)&&/trainer\\s*code|c[oó]digo\\s*de\\s*treinador/i.test(text(e).slice(0,700)))
   .map(e=>text(e).slice(0,700)).filter(t=>t.length<700)
   .sort((a,b)=>a.length-b.length);
 const block=cards[0]||"";
 const lines=block.split(/(?<=\\d)\\s+(?=(?:Trainer code|Remove|Remover)\\b)|\\n/)
   .map(x=>x.trim()).filter(Boolean);
 const legacyName=readField("trainer\\\\s*(?:name|nickname)|nome\\\\s*(?:do\\\\s*)?treinador|in.game\\\\s*name",40);
 const candidate=block.match(/([A-Za-z0-9_.-]{3,40})\\s+(?:(?:Mystic|Valor|Instinct)\\s*[·•-]\\s*Level\\s*\\d{1,2})?\\s*Trainer\\s*code\\s*([\\d\\s]{12,22})/i);
 const trainerName=legacyName||(candidate?candidate[1]:"");
 const codeRaw=readField("trainer\\\\s*code|friend\\\\s*code|c[oó]digo\\\\s*(?:de\\\\s*)?treinador",24)||
   (candidate?candidate[2]:"")||(block.match(/Trainer\\s*code\\s*([0-9 ]{12,22})/i)||[])[1]||"";
 const trainerCode=codeRaw.replace(/\\D/g,"");
 const validCode=/^\\d{12}$/.test(trainerCode);
 const teamRaw=readField("team|equipe|time",18)||block;
 const team=/\\bmystic\\b/i.test(teamRaw)?"Mystic":/\\bvalor\\b/i.test(teamRaw)?"Valor":
   /\\binstinct\\b/i.test(teamRaw)?"Instinct":"";
 const levelRaw=readField("trainer\\\\s*level|n[ií]vel(?:\\\\s*do\\\\s*treinador)?|level",3)||
   ((block.match(/\\bLevel\\s*(\\d{1,2})\\b/i)||[])[1]||"");
 const level=/^(?:[1-9]|[1-7][0-9]|80)$/.test(levelRaw)?levelRaw:"";
 return JSON.stringify({ok:true,displayName,provider,
   trainerName:validCode?trainerName:"",trainerCode:validCode?trainerCode:"",
   team:validCode?team:"",level:validCode?level:""});
})()
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
 const displayName=readField("logged\\s*in\\s*as|signed\\s*in\\s*as|account\\s*name|display\\s*name|nome\\s*da\\s*conta",65);
 const providerRaw=readField("logged\\s*in\\s*via|sign(?:ed)?\\s*in\\s*with|conectado\\s*via|logado\\s*via",30);
 const provider=/\bgoogle\b/i.test(providerRaw)?"Google":/\bdiscord\b/i.test(providerRaw)?"Discord":"";
 const trainerName=readField("trainer\\s*(?:name|nickname)|nome\\s*(?:do\\s*)?treinador|in.game\\s*name",40);
 const codeRaw=readField("trainer\\s*code|friend\\s*code|c[oó]digo\\s*(?:de\\s*)?treinador",24);
 const trainerCode=codeRaw.replace(/\D/g,"");
 const validCode=/^\d{12}$/.test(trainerCode);
 const teamRaw=readField("team|equipe|time",18);
 const team=/\bmystic\b/i.test(teamRaw)?"Mystic":/\bvalor\b/i.test(teamRaw)?"Valor":
   /\binstinct\b/i.test(teamRaw)?"Instinct":"";
 const levelRaw=readField("trainer\\s*level|n[ií]vel(?:\\s*do\\s*treinador)?|level",3);
 const level=/^(?:[1-9]|[1-7][0-9]|80)$/.test(levelRaw)?levelRaw:"";
 return JSON.stringify({ok:true,displayName,provider,
   trainerName:validCode?trainerName:"",trainerCode:validCode?trainerCode:"",
   team:validCode?team:"",level:validCode?level:""});
})()
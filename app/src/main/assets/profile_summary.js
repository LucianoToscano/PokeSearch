(function(){
 "use strict";
 // Public visible DOM only; do not read cookies, storage, response headers,
 // OAuth query parameters or hidden controls. Incomplete page => unknown.
 const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
 const raw=e=>String(e&&(e.innerText||e.textContent)||"");
 const text=e=>raw(e).replace(/\s+/g," ").trim();
 const clean=(s,max)=>{
  s=String(s||"").replace(/[\u0000-\u001f<>]/g," ").replace(/\s+/g," ").trim();
  return s.length<=max?s:"";
 };
 const isProfile=location.pathname==="/profile";
 if(!isProfile)return JSON.stringify({ok:false,page:"not-profile"});
 const body=String(document.body&&document.body.innerText||"");
 const proof=/\bLinked accounts\b/i.test(body)&&/\bPokemon GO accounts\b/i.test(body);
 if(!proof)return JSON.stringify({ok:false,page:"unhydrated"});
 const nodes=Array.from(document.querySelectorAll("p,span,small,strong,div,section,article"))
   .filter(visible);
 const banned=/^(?:profile|member since|upgrade|danger zone|linked accounts|pokemon go accounts|export|search|logout|log out|link|google|discord|pokemon go|settings|account|home)$/i;
 const nameOk=s=>s.length>=3&&s.length<=65&&/^[\p{L}][\p{L} .'-]*[\p{L}]$/u.test(s)&&!banned.test(s)&&!s.includes("@");
 // Profile heading: visible name sits immediately above "Member since".
 // Never fall back to the first arbitrary h1/h2 (e.g. "Danger zone").
 let displayName="";
 const members=nodes.filter(e=>/^Member since\b/i.test(text(e))&&text(e).length<110);
 for(const member of members){
  let e=member;
  for(let depth=0;e&&depth<4&&!displayName;e=e.parentElement,depth++){
   const previous=e.previousElementSibling;
   const candidate=clean(previous?text(previous):"",65);
   if(nameOk(candidate)){displayName=candidate;break;}
   const parent=e.parentElement;
   if(!parent)continue;
   const value=raw(parent).replace(/\r/g,"");
   const pre=value.split(/Member since/i)[0].trim().split(/\n+/).map(x=>clean(x,65)).filter(Boolean);
   const last=pre[pre.length-1]||"";
   if(nameOk(last))displayName=last;
  }
  if(displayName)break;
 }
 const explicitVia=body.match(/\b(?:Logged in via|Logado via)\s+(Google|Discord)\b/i);
 const provider=explicitVia?explicitVia[1].replace(/^./,x=>x.toUpperCase()):"";
 // Verify linked state by the Pokemon GO section only, never a count elsewhere.
 const accounts=nodes.map(e=>({s:text(e),e})).filter(x=>
   x.s.includes("Pokemon GO accounts")&&x.s.length<1800&&
   (/Pokemon GO accounts\s*\d+\s*\/\s*\d+/i.test(x.s)||/Link my account/i.test(x.s)))
   .sort((a,b)=>a.s.length-b.s.length);
 const section=accounts[0]?accounts[0].s:"";
 const explicitZero=/Pokemon GO accounts\s*0\s*\/\s*\d+/i.test(section)||
   /Pokemon GO accounts.*?\bLink my account\b/i.test(section);
 const trainerCards=nodes.map(e=>text(e)).filter(t=>t.length<1300&&
   /\bTrainer code\s*[\d\s]{12,24}/i.test(t)).sort((a,b)=>a.length-b.length);
 let parsed=null;
 for(const card of trainerCards){
  // A name + team + level + numeric code must all belong to one bounded card.
  const m=card.match(/(?:^|\s)([A-Za-z][A-Za-z0-9_.-]{2,39})\s+(Mystic|Valor|Instinct)\s*[·•-]\s*Level\s*(\d{1,2})\s+Trainer\s*code\s*([\d ]{12,22})\b/i);
  if(m){
   const code=m[4].replace(/\D/g,"");
   if(/^\d{12}$/.test(code)&&+m[3]>=1&&+m[3]<=80){
    parsed={name:m[1],team:m[2],level:m[3],code};break;
   }
  }
 }
 const trainerState=parsed?"linked":explicitZero?"unlinked":"unknown";
 // Only use a provider picture actually rendered on the official profile.
 // Exclude team/GO images, do not read cookies or OAuth user metadata.
 const trustedGoogleUrl=value=>{
  try{
   const parsed=new URL(value,location.href);
   return parsed.protocol==="https:"&&
    (parsed.hostname==="googleusercontent.com"||
     parsed.hostname.endsWith(".googleusercontent.com"))&&
     !parsed.username&&!parsed.password&&parsed.href.length<=1600?
      parsed.href:"";
  }catch(_){return "";}
 };
 let avatarUrl="";
 if(provider==="Google"||!provider){
  const images=Array.from(document.querySelectorAll("img")).filter(visible);
  const trusted=[];
  for(const img of images){
   const label=(img.getAttribute("alt")||"")+" "+(img.getAttribute("aria-label")||"");
   const parent=img.parentElement?.parentElement;
   const context=String(parent?text(parent):"").slice(0,240);
   // An unloaded/lazy profile picture may not have currentSrc yet.
   // Read only the official visible DOM, never cookies or OAuth metadata.
   const possible=[img.currentSrc,img.getAttribute("src"),img.getAttribute("data-src")];
   const srcset=img.getAttribute("srcset")||"";
   if(srcset)possible.push(srcset.split(",")[0].trim().split(/\s+/)[0]);
   for(const rawUrl of possible){
    const candidate=trustedGoogleUrl(rawUrl||"");
    if(!candidate)continue;
    trusted.push(candidate);
    if(/avatar|profile|account|foto|photo/i.test(label)||
       (displayName&&context.includes(displayName))||/Member since/i.test(context))
      avatarUrl=candidate;
    if(avatarUrl)break;
   }
   if(avatarUrl)break;
  }
  // The official profile sometimes shows an unlabeled Google avatar.
  // Only a single distinct visible allowlisted source is unambiguous.
  if(!avatarUrl){
   const unique=[...new Set(trusted)];
   if(unique.length===1)avatarUrl=unique[0];
  }
 }
 return JSON.stringify({ok:true,page:"profile",displayName,provider,trainerState,
   trainerName:parsed?parsed.name:"",trainerCode:parsed?parsed.code:"",
   team:parsed?parsed.team:"",level:parsed?parsed.level:"",avatarUrl});
})()
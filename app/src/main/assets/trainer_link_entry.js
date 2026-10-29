/* LT170: user-initiated shortcut to the official Pokémon GO trainer form.
 * Only clicks the public "Link my account" action on an unlinked, hydrated
 * PoGoCoordinates profile. NEVER looks up, confirms, or creates a binding. */
(function(){
 "use strict";
 const out=(status)=>JSON.stringify({status});
 if(location.origin!=="https://pogocoordinates.com"||
    location.pathname!=="/profile")return out("wrong-page");
 const text=e=>String(e?.innerText||e?.textContent||"").replace(/\s+/g," ").trim();
 const body=text(document.body).slice(0,12000);
 if(!/\bLinked accounts\b/i.test(body)||!/\bPokemon GO accounts\b/i.test(body))
  return out("pending");
 const dialogs=Array.from(document.querySelectorAll('[role="dialog"],[aria-modal="true"]'));
 if(dialogs.some(x=>/\bLink a Pok[eé]mon GO account\b/i.test(text(x))))
  return out("form-open");
 const visible=e=>e&&!e.disabled&&e.getAttribute("aria-disabled")!=="true"&&
  (typeof e.getClientRects!=="function"||e.getClientRects().length>0);
 const items=Array.from(document.querySelectorAll('button,a,[role="button"]'))
  .filter(e=>visible(e)&&/^(?:Link my account|Vincular minha conta)$/i.test(text(e)));
 if(items.length!==1)return out(items.length?"ambiguous":"pending");
 const button=items[0];
 let scope=button,verified=false;
 for(let i=0;i<7&&scope;i++,scope=scope.parentElement){
  const t=text(scope).slice(0,1600);
  if(/\bPokemon GO accounts\b/i.test(t)&&/\b0\s*\/\s*1\b/.test(t)){
   verified=true;break;
  }
 }
 // The authenticated profile must explicitly state 0/1, and the button must
 // belong to that very section—not provider OAuth or a generic page link.
 if(!verified)return out("pending");
 button.click();
 return out("clicked");
})();

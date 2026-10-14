(function(){
 "use strict";
 const fromShiny=__SHINY__;
 const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
 const txt=e=>String(e&&(e.innerText||e.textContent)||"").replace(/\s+/g," ").trim();
 const clickable=Array.from(document.querySelectorAll("a,button,[role=button]")).filter(visible);
 const loggedIn=clickable.some(e=>/^(log\s*out|sign\s*out|sair|desconectar)$/i.test(txt(e)))||
   /(?:^|\n)\s*Shiny for your account\b/i.test(String(document.body&&document.body.innerText||""));
 if(loggedIn)return "authenticated";
 const authDialog=Array.from(document.querySelectorAll('[role="dialog"],[aria-modal="true"]'))
   .filter(visible).some(e=>/google|discord|continue with|log\s*in|sign\s*in|entrar|login/i.test(txt(e)));
 const providerChoices=clickable.some(e=>/^(?:continue|sign\s*in|log\s*in|entrar)\s+(?:with|com)\s+(?:google|discord)\b/i.test(txt(e)));
 if(authDialog||providerChoices)return "ready";
 const login=clickable.find(e=>!e.disabled&&/^(?:log\s*in|sign\s*in|entrar|fazer login)$/i.test(txt(e)));
 if(login&&!window.__psOfficialLoginTapped){
   window.__psOfficialLoginTapped=true;
   login.click();
   return "triggered";
 }
 // Shiny must behave exactly like the official switch. If not signed in,
 // clicking it can open the site's own sign-in prompt.
 if(fromShiny&&!window.__psShinyLoginTapped){
   const labels=Array.from(document.querySelectorAll("label,span,strong,div"))
     .filter(e=>visible(e)&&/^\s*(?:✨\s*)?Shiny only\s*$/i.test(txt(e)))
     .sort((a,b)=>a.querySelectorAll("*").length-b.querySelectorAll("*").length);
   for(const lab of labels){
     let candidate=null;
     for(let node=lab,depth=0;node&&depth<6;node=node.parentElement,depth++){
       const options=Array.from(node.querySelectorAll('input[type=checkbox],[role=switch],[role=checkbox],button[aria-checked],button[data-state]'));
       if(options.length===1){candidate=options[0];break;}
     }
     if(candidate&&!candidate.disabled){
       window.__psShinyLoginTapped=true;
       candidate.click();
       return "triggered";
     }
   }
 }
 const menu=clickable.find(e=>!e.disabled&&/^(?:open\s*menu|menu|navigation|abrir\s*menu)$/i
   .test((e.getAttribute("aria-label")||e.getAttribute("title")||"").trim()));
 if(menu&&!window.__psLoginMenuTapped){window.__psLoginMenuTapped=true;menu.click();return "triggered";}
 return "waiting";
})()
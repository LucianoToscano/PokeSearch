(function(){
 if(window.__psoPresetsInstalled)return;
 window.__psoPresetsInstalled=true;
 const visible=e=>!!(e&&e.getClientRects().length);
 const text=e=>String(e?.textContent||"").trim();
 const btn=name=>Array.from(document.querySelectorAll("button,[role=tab],[role=button]"))
   .filter(visible).find(e=>text(e).toLowerCase()===name.toLowerCase());
 const selected=e=>!!e&&(e.getAttribute("aria-selected")==="true"||e.getAttribute("data-state")==="active"||
   e.getAttribute("aria-pressed")==="true"||/\bactive\b|\bselected\b/.test(String(e.className||"")));
 const inputs=p=>Array.from(p.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])')).filter(visible);
 function applyInput(e,value){
   if(!e||e.value===value)return;
   const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")?.set;
   if(!setter)return;
   setter.call(e,value);
   e.dispatchEvent(new Event("input",{bubbles:true}));
   e.dispatchEvent(new Event("change",{bubbles:true}));
 }
 function near(label,count){
   const nodes=Array.from(document.querySelectorAll("label,span,div,p,strong"))
    .filter(e=>visible(e)&&e.children.length<=2&&text(e)===label);
   for(const x of nodes){
     let el=x;
     for(let i=0;el&&i<6;el=el.parentElement,i++){
       const found=inputs(el);
       if(found.length===count)return found;
     }
   }
   return [];
 }
 let chosenRaw=false,rawInitialized=false,rankInitialized=false,autoClicks=0;
 const start=Date.now();
 function scan(){
   if(!location.pathname.startsWith("/search"))return;
   // Keep trying during React hydration, but never loop endlessly or fight user choices.
   if(!chosenRaw&&Date.now()-start<20000){
     const stats=btn("Stats");
     if(stats&&!selected(stats)&&autoClicks<2){stats.click();autoClicks++;return;}
     const raw=btn("Raw IV");
     if(raw){
       if(!selected(raw)&&autoClicks<4){raw.click();autoClicks++;return;}
       if(selected(raw)||(!btn("% IV")&&near("IV",3).length===3))chosenRaw=true;
     }
   }
   const raw=near("IV",3);
   if(!rawInitialized&&raw.length===3){
     raw.forEach(x=>applyInput(x,"15"));rawInitialized=true;
   }
   const rank=near("Top ranking",1);
   if(!rankInitialized&&rank.length===1){applyInput(rank[0],"1");rankInitialized=true;}
 }
 let pending=false,stopped=false,timeout=null,ob=null,interval=null;
 function cleanup(){
   if(stopped)return;
   stopped=true;
   if(timeout!==null)clearTimeout(timeout);
   if(interval!==null)clearInterval(interval);
   if(ob!==null)ob.disconnect();
   document.removeEventListener("click",schedule,true);
   window.removeEventListener("pagehide",cleanup);
   window.__psoPresetsInstalled=false;
 }
 function schedule(){
   if(stopped||pending)return;
   if(Date.now()-start>=20000){cleanup();return;}
   pending=true;
   timeout=setTimeout(()=>{pending=false;timeout=null;if(!stopped)scan();},220);
 }
 ob=new MutationObserver(schedule);
 ob.observe(document.documentElement,{subtree:true,childList:true});
 document.addEventListener("click",schedule,true);
 window.addEventListener("pagehide",cleanup,{once:true});
 let times=0;
 interval=setInterval(()=>{
   if(++times>=35||Date.now()-start>=20000){cleanup();return;}
   schedule();
 },450);
 schedule();
})();
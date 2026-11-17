"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../src/main");
const probe=fs.readFileSync(path.join(root,"assets/probe.js"),"utf8");
const main=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");

test("LT392 guest cards without a LOCATION heading retain whole card and individual IV",()=>{
 const start=probe.indexOf("function cardRoots(){");
 const end=probe.indexOf("// Submission-scoped",start);
 assert.ok(start>=0&&end>start);
 function node(t,parent=null){
  return {innerText:t,parentElement:parent,getClientRects:()=>[1],
    querySelectorAll:()=>[],querySelector:()=>null};
 }
 const section=node("");
 const card1=node("Helioptile\n#694 · Male · M\nIV 67% (12/14/4) CP 143 LVL 6\nAlbuquerque, New Mexico, United States\nDESPAWN 59:30",section);
 const card2=node("Darumaka\n#554 · Female · L\nIV 76% (11/15/8) CP 828 LVL 21\nStevenage, Hertfordshire, United Kingdom\nDESPAWN 59:30",section);
 const a=node("Get coords",node("Get coords",card1));
 const b=node("Get coords",node("Get coords",card2));
 card1.querySelectorAll=()=>[a];
 card2.querySelectorAll=()=>[b];
 section.querySelectorAll=()=>[a,b];
 section.innerText=card1.innerText+"\n"+card2.innerText;
 const cards=new Function("elements","vis","text",
  probe.slice(start,end)+"return cardRoots;")(
  ()=>[a,b],()=>true,e=>String(e?.innerText||""))();
 assert.equal(cards.length,2);
 assert.strictEqual(cards[0].node,card1);
 assert.strictEqual(cards[1].node,card2);
 // Site text was explicitly IV 67/76%, not 100%. Never fabricate Hundo.
 const from=probe.indexOf("function nextLabelValue(");
 const to=probe.indexOf("// IV is evidence about THIS card,",from);
 assert.ok(from>0&&to>from);
 const parse=new Function("clean","text","verifiedCardIv","mode",
  probe.slice(from,to)+"return parseCard;")(
  s=>String(s??"").trim(),e=>String(e?.innerText||e?.textContent||""),
  card=>({raw:card.iv,percent:Number(card.ivPercent)}),"iv");
 const p1=parse(card1,0),p2=parse(card2,1);
 assert.equal(p1.iv,"12/14/4");
 assert.equal(p2.iv,"11/15/8");
 assert.equal(p1.ivPercent,"67");
 assert.equal(p2.ivPercent,"76");
 assert.equal(p1.cp,"143");
 assert.equal(p2.level,"21");
});
test("LT392 Pokébola icons have no overlay account badge or extra touch target",()=>{
 const homeRow=main.split("for(int i=0;i<2;i++){")[1];
 assert.ok(homeRow);
 const row=homeRow.split("// Novos módulos ficam")[0];
 assert.doesNotMatch(row,/FrameLayout loginHotspot|icon\.post\(alignBadge\)|setOnClickListener\(v->showCompactAccountNames/);
 assert.match(row,/toggleHomeOverlay\(\)/);
 assert.match(row,/toggleSecondaryOverlay\(\)/);
});
test("LT392 PoGoCoordinates hub contains independent P1/P2 account selectors",()=>{
 const hub=main.split("private void showPogoAccountHub(){")[1].split("private String pogoAccountSummary",1)[0];
 assert.match(hub,/Vincular Pokébolas/);
 assert.match(hub,/setHomePackIcon\(ball,number,"normal"\)/);
 assert.match(hub,/showPokeballAccountChoice\(secondary,true\)/);
 assert.match(hub,/for\(int number=1;number<=2;number\+\+\)/);
 assert.match(hub,/Sem login/);
 assert.doesNotMatch(hub,/Visitante automático|Continuar como visitante/);
 const chooser=main.split("private void showPokeballAccountChoice(boolean secondary,boolean returnToHub){")[1]
   .split("private void choosePokeballTrainer",1)[0];
 assert.match(chooser,/guestAvailable\?"Sem login"/);
 assert.match(chooser,/PogoAccountSlots\.bindAccountOnly\(this,secondary,slot\)/);
 assert.match(chooser,/if\(returnToHub\)showPogoAccountHub\(\)/);
});

test("LT392 public search always provides actual site cards separately from IV-verified matches",()=>{
 assert.match(probe,/const sitePreviewCards=found\.filter/);
 assert.match(probe,/sitePreviewCards,found:found\.length/);
 assert.match(probe,/\.slice\(0,5\)/);
 const java=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 assert.match(java,/showGuestSitePreview\(r,"iv-unconfirmed"\)/);
 assert.match(java,/showGuestSitePreview\(r,"repeated"\)/);
 assert.match(java,/card\.put\("filterMatchVerified",false\)/);
 assert.match(java,/card\.put\("evidenceVerified",false\)/);
 assert.match(java,/verifiedFavoriteResultsGeneration=-1/);
 const start=java.indexOf("private boolean showGuestSitePreview(");
 const end=java.indexOf("private void applyCollectedResults(",start);
 const preview=java.slice(start,end);
 assert.doesNotMatch(preview,/recordNewResults\(|rememberConfirmedPreview\(/);
});
test("LT392 reviewable site preview never displays filter 100% badge as proven IV",()=>{
 const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
 assert.match(dock,/guestSitePreviewActive\?"SITE":selectedIcon\.ivBadge/);
 assert.match(dock,/guestSitePreviewActive&&resultWindow\?"!"/);
 assert.match(dock,/empty\.title=status\|\|"Aguardando busca"/);
 assert.match(dock,/guestPreviewVisible=false/);
});

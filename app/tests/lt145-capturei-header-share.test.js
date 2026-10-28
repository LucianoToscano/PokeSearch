"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main");
const html=fs.readFileSync(path.join(base,"assets/detail.html"),"utf8");
const native=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
assert.match(native,/@JavascriptInterface public void prepareCaptureShare\(int sourceIndex\)/);
assert.match(native,/OverlayService\.this\.prepareCaptureShare\(sourceIndex\)/);
assert.match(native,/if\(sourceIndex>=0&&card\.optInt\("sourceIndex",-1\)!=sourceIndex\)/);
assert.match(native,/sharedCaptureKeys\.contains\(captureKey\(card\)\)/);
assert.match(native,/now\.getJSONObject\(selected\)\.optInt\("sourceIndex",-1\)!=sourceIndex/);
assert.match(native,/CaptureSharePublisher\.publish\(this,offer,/);
assert.match(native,/JSONObject\.quote\("Resultado alterado;/);
const elems={
 shareIcon:{disabled:true,title:"",setAttribute(){}},
 captureShare:{hidden:true},
 captureConfirm:{hidden:true,querySelector(){return this.question||(this.question={textContent:""});}},
 captureStatus:{hidden:true,textContent:""}
};
const document={getElementById:id=>elems[id]||null};
const calls=[],Native={
 prepareCaptureShare:n=>calls.push(["prepare",n]),
 confirmCaptureShare:n=>calls.push(["publish",n])
},win={};
const start=script.indexOf("function shareUi(){");
const end=script.indexOf("function coordButtons(){",start);
assert.ok(start>=0&&end>start);
const build=new Function("document","Native","window","resizeEvolutionPanel",
 "currentIndex","watchName","shareReady","shareSent","sharePending","shareAwaitingOffer",
 script.slice(start,end)+
 "return {click:captureShareAsk,confirm:captureShareConfirm,cancel:captureShareCancel,state:()=>({shareReady,shareSent,sharePending,shareAwaitingOffer})};");
const h=build(document,Native,win,()=>{},7,"Duskull",false,false,false,false);
h.click();
assert.deepEqual(calls,[["prepare",7]]);
assert.equal(elems.captureConfirm.hidden,true,"No publish before verified offer");
assert.equal(elems.shareIcon.disabled,false,"Clickable without copied coordinates");
win.offerCaptureShare(8);
assert.equal(elems.captureConfirm.hidden,true,"Stale callback cannot authorize wrong Pokémon");
win.offerCaptureShare(7);
assert.equal(elems.captureConfirm.hidden,false);
assert.equal(elems.captureConfirm.question.textContent,"Você capturou Duskull?");
assert.equal(calls.length,1,"Preview must not post automatically");
h.confirm();
assert.deepEqual(calls,[["prepare",7],["publish",7]]);
assert.equal(elems.shareIcon.disabled,true,"No duplicate submission while publishing");
win.captureShareFeedback(true,"Captura publicada");
assert.equal(elems.shareIcon.disabled,true,"No repeated sharing after successful publication");
assert.equal(elems.captureStatus.textContent,"Captura publicada");
const failedElems={...elems,shareIcon:{disabled:true,title:"",setAttribute(){}},
captureConfirm:{hidden:true,querySelector(){return {textContent:""};}},
captureShare:{hidden:true},captureStatus:{hidden:true,textContent:""}};
const h2=build({getElementById:id=>failedElems[id]||null},Native,win,()=>{},9,"Gengar",false,false,false,false);
h2.click();
win.captureShareAvailability(false,"Resultado alterado");
assert.equal(failedElems.captureStatus.textContent,"Resultado alterado");
assert.equal(failedElems.shareIcon.disabled,false,"User can retry when verification fails");
console.log("LT145 Capturei: tappable before copy, identity-verified popup and confirmed-only chat posting PASS");

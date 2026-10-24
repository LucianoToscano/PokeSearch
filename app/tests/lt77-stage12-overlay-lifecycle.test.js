"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
let n=0;function check(label,fn){fn();n++;console.log("PASS LT77 Stage12 "+label);}
const destroy=service.split("@Override public void onDestroy(){")[1]?.split("@Override public IBinder onBind",1)[0]||"";
check("service destroy exists",()=>assert.ok(destroy));
check("stop flag blocks stale callbacks",()=>{
 assert.ok(destroy.includes("stopped=true;"));
 assert.ok(destroy.includes("++requestGeneration;"));
 assert.ok(destroy.includes("++coordinateRequestToken;"));
 assert.ok(service.includes("sequence!=formOptionsSequence"));
 assert.ok(service.includes("sequence!=pokemonSuggestionSequence"));
});
check("cancel delayed Android tasks",()=>assert.ok(destroy.includes("handler.removeCallbacksAndMessages(null)")));
check("receiver unregistered with guard",()=>{
 assert.ok(destroy.includes("if (missionScreenOffRegistered)"));
 assert.ok(destroy.includes("unregisterReceiver(missionScreenOffReceiver)"));
});
check("each WebView destroyed",()=>{
 for(const x of ["panel","menuPanel","popupPanel","resultPanel","detailPanel","website"])
  assert.ok(destroy.includes("destroyWebView("+x+","),x);
 assert.ok(service.includes('web.removeJavascriptInterface("Native")'));
 assert.ok(service.includes('web.stopLoading()'));
 assert.ok(service.includes('web.destroy()'));
});
check("all overlay windows removed",()=>{
 for(const x of ["root","menuRoot","popupRoot","resultRoot","detailRoot"])
  assert.ok(destroy.includes("wm.removeView("+x+")"),x);
});
check("drag remains throttled with a single result source",()=>{
 assert.ok(service.includes("ResultsSpacingPolicy.DEFAULT_TOP_GAP_PX"));
 assert.ok(service.includes("PopupTouchGeometry.avoidResult("));
 assert.ok(dock.includes('computeResultLayout('));
});
console.log("LT77 Stage12 "+n+"/"+n+" PASS");

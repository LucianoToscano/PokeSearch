"use strict";
// LT377: acceptance contract for guest-safe P1/P2 and official OAuth callback.
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm");
const dir="app/src/main/";
const read=path=>fs.readFileSync(dir+path,"utf8");
const slots=read("java/com/lucianotoscano/pokesearchoverlay/PogoAccountSlots.java");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const overlay=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const login=read("assets/login_entry.js");
assert.match(slots,/NAME_GUEST="pokesearch_pogocoordinates_visitor"/);
assert.match(slots,/slot==0\?"pogo_guest"/);
assert.match(slots,/WebViewCompat\.setProfile\(web,NAME_GUEST\)/);
assert.match(slots,/slot!=0&&"autenticada"\.equals/);
assert.match(slots,/return supportsSecond\(\);/);
assert.doesNotMatch(slots,/if\(!supportsSecond\(\)\)return CookieManager\.getInstance\(\)/);
assert.match(slots,/account==0&&!supportsGuest\(context\)/);
assert.match(slots,/selected==0\?0:selected==2\?2:1/);
assert.match(overlay,/selectedAccount==2&&!PogoAccountSlots\.supportsSecond\(\)/);
assert.match(overlay,/selectedAccount==0&&!PogoAccountSlots\.supportsGuest\(this\)/);
assert.doesNotMatch(overlay,/Conecte a Conta 2 antes de usar esta Pokébola/);
assert.match(overlay,/Both Pokébolas can perform public searches without authentication/);
assert.match(main,/for\(int slot=0;slot<=2;slot\+\+\)/);
assert.match(main,/slot==0\?"Conta: Visitante":"Conta "\+slot/);
assert.match(main,/PogoAccountSlots\.bindAccountOnly\(this,secondary,account\)/);
assert.match(main,/refreshOverlaysAfterSlotLogout\(1\)/);
assert.match(main,/refreshOverlaysAfterSlotLogout\(2\)/);
assert.match(main,/profileDiscoveryAttempted=true;[\s\S]*?view\.loadUrl\("https:\/\/pogocoordinates\.com\/profile"\)/);
assert.match(main,/result\.contains\("\\\"profile-hint\\\""\)/);
const logout1=main.split("private void logoutLocalSession(){")[1].split("private void refreshWatchCount()")[0];
const logout2=main.split("private void logoutSecondAccount(){")[1].split("private void openTrainerManagement()")[0];
assert.doesNotMatch(logout1,/stopService\(/);
assert.doesNotMatch(logout2,/stopService\(/);
assert.match(main,/○ Visitante · busca liberada/);
const js=login.replace("__SHINY__","false").replace("__PROVIDER__",'""');
const el=(label,href)=>({
 innerText:label,textContent:label,getClientRects:()=>[{}],
 getAttribute:k=>k==="href"?href:null,
 click(){this.clicks=(this.clicks||0)+1;},disabled:false
});
function check(links){
 const doc={body:{innerText:""},
   querySelectorAll:q=>q==="a,button,[role=button]"?links:[]};
 return vm.runInNewContext(js,{document:doc,window:{},location:{pathname:"/search"}});
}
assert.equal(check([el("","/profile")]),"profile-hint","profile link only requests validation");
assert.equal(check([el("","https://evil.example/profile")]),"waiting","foreign links ignored");
assert.equal(check([el("Continue with Google")]),"ready","provider still requires human tap");
assert.equal(check([]),"waiting","guest is not fabricated as authenticated");
console.log("LT377 PASS: visitor isolation, P1/P2 no-login, logout keeps overlays, official profile proof only");

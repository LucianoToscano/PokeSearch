"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const sprites=require("../src/main/assets/sprite_offline.js");
for(const form of ["Halloween 2026 01","Top Hat","Cartola"]){
 const image=sprites.resolve({number:"#41",name:"Zubat",form,shiny:false,image:""});
 assert.equal(image.src,
   "https://cdn.leekduck.com/assets/img/pokemon_icons_crop/pm41.fHALLOWEEN_2026_01.icon.png");
 assert.equal(image.officialCostume,true);
 assert.equal(image.exactCostume,true);
}
const shiny=sprites.resolve({number:"#41",name:"Zubat",form:"Halloween 2026 01",shiny:true,image:""});
assert.equal(shiny.src,"","No invented 2026 shiny sprite");
assert.equal(shiny.missingExact,true);
const defaultZubat=sprites.resolve({number:"#41",name:"Zubat",form:"",shiny:false,image:""});
assert.ok(!defaultZubat.src.includes("fHALLOWEEN"),"Uncostumed Zubat stays uncostumed");
const google=read("src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumGoogleLogin.java");
const access=read("src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumAccess.java");
const dialog=read("src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumPurchaseDialog.java");
assert.ok(google.includes("PremiumAccess.claimWelcomeTrial(activity"));
assert.ok(access.includes('call(context,"claimWelcomeTrial"'));
assert.ok(access.includes('call(context,"redeemFullCoupon"'));
assert.ok(dialog.includes("freeCouponClaim.setOnClickListener"));
assert.ok(dialog.includes("PremiumAccess.redeemFullCoupon"));
assert.ok(dialog.includes("pokesearch-premium-luc.netlify.app/admin.html"));
console.log("PASS LT138 verified Halloween Zubat, Google welcome trials, 100% gift without Pix");

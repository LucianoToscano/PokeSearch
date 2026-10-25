"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const java=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
function between(str,start,end){const a=str.indexOf(start),b=str.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return str.slice(a,b);}
let passed=0;function check(name,fn){fn();passed++;console.log("PASS LT81 "+name);}
check("coordinates are in full-width second row, 296px popup",()=>{
 const css=between(dock,"/* LT81 Samsung: make coordinate entry readable","</style>");
 for(const p of ["width:min(296px,calc(100vw - 16px))!important","flex-flow:row wrap!important",
 "flex:1 0 100%!important","font:500 12px/1.2 monospace!important","direction:ltr!important"])
 assert.ok(css.includes(p),p);
});
check("trash clears coordinates, radius and slider",()=>{
 const fragment=between(dock," const disable=()=>{"," clear.onclick=disable;");
 const field={value:"21.291504,-157.842123",scrollLeft:47,dataset:{locationDraft:"true"}};
 const radiusField={value:"1000",dataset:{locationDraft:"true"}},slide={value:"1000"};
 const message={textContent:"",hidden:true,style:{color:"orange"}};
 const calls=[];
 const ctx={field,radiusField,slide,message,document:{activeElement:null},
 Native:{setLocation:(...args)=>calls.push(args)}};
 const disable=vm.runInNewContext("(function(){"+fragment+";return disable;})()",ctx);
 disable();
 assert.equal(field.value,"");assert.equal(field.scrollLeft,0);
 assert.equal(radiusField.value,"0");assert.equal(slide.value,"0");
 assert.equal(field.dataset.locationDraft,undefined);
 assert.equal(radiusField.dataset.locationDraft,undefined);
 assert.equal(message.hidden,false);assert.equal(message.style.color,"");
 assert.equal(JSON.stringify(calls),JSON.stringify([[false,"",0]]));
});
check("native disabled state clears stored location but preserves others",()=>{
 for(const p of ['locationCoords=enabled?valid:""','locationRadius=enabled?radius:0',
 'prefs.remove("locationCoords").remove("locationRadius")','OverlayService.this.refresh(true)'])
 assert.ok(java.includes(p),p);
});
check("last site confirmation retries bounded and reset per search",()=>{
 for(const p of ["private int locationFinalRetryCount=0","locationFinalRetryCount=0;\n        confirmedSubmittedFiltersGeneration=-1;",
 "if(locationFinalRetryCount<2)","locationFinalRetryCount++;","configureLocationAndVerify(generation,manual,0);",
 'execute("verifyLocation:"+locationPayload(),lastLocation->'])
 assert.ok(java.includes(p),p);
});
check("pasted and typed drafts are preserved until native confirmation",()=>{
 for(const p of ['field.oninput=()=>{field.dataset.locationDraft="true";}',
 'field.dataset.locationDraft="true";\n field.scrollLeft=0;',
 'coordinates.dataset.locationDraft!=="true"','coordinates.value=locationEnabled?locationCoords:""'])
 assert.ok(dock.includes(p),p);
});
console.log("LT81 "+passed+"/"+passed+" PASS");

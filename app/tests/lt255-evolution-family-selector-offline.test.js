"use strict";
/* LT255 Samsung regression: calculator showed only Teddiursa even though the
 * analysis below listed Ursaring and Ursaluna. Test the REAL offline graph and
 * HTML controls with zero PvP payload (before the asynchronous results load).
 */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main/assets");
const read=name=>fs.readFileSync(path.join(base,name),"utf8");
const catalog=require(path.join(base,"pvp_family_catalog.js"));
const dock=read("dock.html"),html=read("detail.html");
const mark="const PVP_EVO_LINKS=Object.freeze(",start=dock.indexOf(mark),end=dock.indexOf(");",start);
assert.ok(start>0&&end>start,"shared full graph exists");
assert.deepEqual(catalog.links,JSON.parse(dock.slice(start+mark.length,end)),
 "frozen fallback must match the canonical evolution graph in dock.html");
const win={PokeSearchPvpFamilyCatalog:catalog,psRankContext:null};
new Function("window",read("pvpoke-iv-gamemaster.js"))(win);
const gm=win.POKESEARCH_PVP_IV_DATA;
assert.deepEqual(catalog.family("Teddiursa",gm),["Teddiursa","Ursaring","Ursaluna"]);
assert.deepEqual(catalog.family("Ursaring",gm),["Ursaring","Ursaluna","Teddiursa"]);
assert.deepEqual(catalog.family("Ursaluna",gm),["Ursaluna","Ursaring","Teddiursa"]);
assert.ok(catalog.family("Gastly",gm).includes("Gengar (Mega)"));
assert.ok(catalog.family("Eevee",gm).length>=7,"branching families must also be covered");
assert.deepEqual(catalog.family("Unknown 9000",gm),[]);
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);
assert.ok(html.includes('<script src="pvp_family_catalog.js"></script>'));
assert.ok(html.includes("data-pscp-form"));
assert.ok(html.includes("onclick=\"psCpPickForm(this.dataset.pscpForm)\""));
const from=script.indexOf("/* LT244: zero-cost contextual stats actions.");
const until=script.indexOf("const item=(k,v)=>",from);
assert.ok(from>0&&until>from);
const fields={
 psCpForm:{value:"teddiursa"},
 psCpLevel:{value:"14"},
 psCpLevelValue:{textContent:""},
 psCpTargetCp:{value:"1500"},
 psCpSimResult:{innerHTML:"",textContent:""},
 psCpIvAA:{value:"0"},psCpIvAD:{value:"14"},psCpIvAS:{value:"15"},
 psCpIvBA:{value:"15"},psCpIvBD:{value:"15"},psCpIvBS:{value:"15"}
};
const doc={getElementById:id=>fields[id]||null,querySelectorAll:()=>[]};
const h=s=>String(s);
const test=new Function("document","window","h","activeRankLeague",
 "pvpFormsForLeague","resizeEvolutionPanel",
 script.slice(from,until)+"return {set:x=>metricCard=x,variants:psCpVariants,controls:psCpControls,"+
 "step:stepPvpCpForm,pick:psCpPickForm,update:updatePvpCpSimulator};")(
 doc,win,h,"gl",()=>[],()=>{});
test.set({name:"Teddiursa",iv:"0/14/15",cp:478,level:14,form:"NORMAL",costumeId:"0",ivValid:true});
assert.deepEqual(test.variants().map(x=>x[1]),["Teddiursa","Ursaring","Ursaluna"]);
const controls=test.controls();
for(const [key,name] of [["teddiursa","Teddiursa"],["ursaring","Ursaring"],["ursaluna","Ursaluna"]]){
 assert.ok(controls.includes('data-pscp-form="'+key+'"'),"dropdown choice "+name);
 assert.ok(controls.includes('>'+name+'</span></button>'),"visible label "+name);
}
assert.ok(controls.includes('id="psCpFormMenu"'));
assert.ok(!controls.includes('psCpFamilyQuick'),"only one dropdown, not duplicated chips");
assert.ok(test.update());
const baseResult=fields.psCpSimResult.innerHTML;
assert.match(baseResult,/IV A 0\/14\/15/);
assert.match(baseResult,/PC 478/,"reproduce exact captured Teddiursa Lv14");
assert.equal(test.step(1),true);
assert.equal(fields.psCpForm.value,"ursaring");
assert.notEqual(fields.psCpSimResult.innerHTML,baseResult);
assert.equal(test.step(1),true);
assert.equal(fields.psCpForm.value,"ursaluna");
assert.equal(test.pick("teddiursa"),true);
assert.equal(fields.psCpForm.value,"teddiursa");
assert.equal(fields.psCpSimResult.innerHTML,baseResult);
assert.equal(test.step(-1),true);
assert.equal(fields.psCpForm.value,"ursaluna","previous arrow wraps within family");
assert.equal(test.pick("madeupform"),false,"reject invalid forms, no fallback to another species");
assert.deepEqual([fields.psCpIvAA.value,fields.psCpIvAD.value,fields.psCpIvAS.value],["0","14","15"]);
assert.deepEqual([fields.psCpIvBA.value,fields.psCpIvBD.value,fields.psCpIvBS.value],["15","15","15"]);
test.set({name:"Teddiursa",iv:"0/14/15",level:14,form:"Event",isCostume:true});
assert.deepEqual(test.variants().map(x=>x[1]),["Teddiursa"],
 "event costume must not receive an unverified standard evolution");
console.log("LT255 PASS: 463-edge offline family, Teddiursa→Ursaring→Ursaluna switching, IV A/B preserved, costumes isolated");

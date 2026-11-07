"use strict";
// LT304 Edu — integridade de roteiro, histórico e UI de conversa (sem GPS/automação).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const base="java/com/lucianotoscano/pokesearchoverlay/";
const service=read(base+"RaidDayAssistantOverlayService.java");
const guide=read(base+"RaidDayGuidePlan.java");
const history=read(base+"RaidDayEvent.java");
const dao=read(base+"RaidDayEventDao.java");
const db=read(base+"RaidDayDatabase.java");
const home=read(base+"MainActivity.java");
const strings=read("res/values/strings_raid_day.xml");
const manifest=read("AndroidManifest.xml");
const gradle=fs.readFileSync(path.join(__dirname,"../build.gradle.kts"),"utf8");
const plan=JSON.parse(read("assets/roteiro_bug_passes.json"));
const variant=plan.variantes[0];
const icon=Buffer.from(read("assets/raid_assistant_icon.b64").trim(),"base64");
assert.equal(icon.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
assert.equal(icon.readUInt32BE(16),96);
assert.equal(icon.readUInt32BE(20),96);
assert.equal(plan.schemaVersion,2);
assert.equal(plan.id,"roteiro_bug_passes");
assert.equal(plan.evidenceKind,"RELATO_COMUNIDADE");
assert.ok(plan.riskTextVersion);
assert.equal(variant.id,"eduhunterplay-2026-10-28");
assert.equal(variant.verificadoEm,"2026-11-07");
assert.match(variant.confianca,/nao_verificado/);
const steps=variant.etapas;
assert.equal(steps.length,11);
for(let i=0;i<steps.length;i++){
 const e=steps[i];
 assert.equal(e.id,"E"+String(i+1).padStart(2,"0"));
 for(const name of ["titulo","instrucao","falaEdu","ajudaEdu","periodo",
                    "naoAconteceu","retornoSeguro"])
   assert.ok(e[name]&&e[name].length>=(name==="periodo"?1:3),e.id+" missing "+name);
 assert.ok(Array.isArray(e.precondicoes)&&e.precondicoes.length>0);
 assert.deepEqual(e.confirmacoesAceitas,["USER_ATTESTED"]);
 if(e.local!==null)assert.ok(variant.locais[e.local],e.id+" location");
 for(const key of ["repetePara","semPassePara","pularPara"])
   if(e[key])assert.ok(steps.some(x=>x.id===e[key]),e.id+" "+key);
}
assert.deepEqual(steps.slice(1,7).map(x=>x.periodo),
                 Array(6).fill("D-1"));
assert.deepEqual(steps.slice(7,10).map(x=>x.periodo),
                 Array(3).fill("D"));
assert.deepEqual([steps[1].local,steps[2].local,steps[4].local],
                 ["hawaii","newzealand","hawaii"]);
assert.equal(steps[6].repetePara,"E02");
assert.equal(steps[6].semPassePara,"E08");
assert.equal(steps[8].pularPara,"E10");
assert.equal(variant.locais.hawaii.coordenadas,"21.2709423,-157.818172");
assert.equal(variant.locais.newzealand.coordenadas,"-41.282491,174.769132");
assert.equal(variant.locais.kiribati.coordenadas,"1.987149,-157.477137");
assert.match(guide,/getAssets\(\)\.open\("roteiro_bug_passes\.json"\)/);
assert.match(guide,/SCHEMA_VERSION=2/);
assert.match(guide,/list\.length\(\)!=11/);
assert.match(guide,/speech=required\(o,"falaEdu"\)/);
assert.match(guide,/help=required\(o,"ajudaEdu"\)/);
assert.match(service,/BUBBLE_DP=48, ART_DP=45/);
assert.match(home,/Edu · Assistente do Dia de Reides/);
assert.match(strings,/Edu · Assistente do Dia de Reides/);
assert.match(manifest,/android:name="\.RaidDayAssistantOverlayService"/);
assert.match(home,/controls\.addView\(raidAssistantControl,guideLp\)/);
assert.match(home,/RaidDayAssistantOverlayService\.loadArtwork\(this\)/);
assert.match(home,/toggleRaidAssistantOverlay\(\)/);
assert.match(service,/TYPE_APPLICATION_OVERLAY/);
assert.match(service,/FLAG_NOT_FOCUSABLE/);
assert.match(service,/setOnTouchListener/);
assert.match(service,/setVisible\(!visible\)/);
assert.match(service,/plan\.step\(index\)/);
assert.match(service,/plan\.coords\(index\)/);
assert.doesNotMatch(service,/private static final String\[\] (?:TITLES|INSTRUCTIONS|COORDS)/);
assert.match(service,/riskAcceptance/);
assert.match(service,/riskAcceptedAtMs/);
assert.match(service,/private void beginTraining\(/);
assert.match(service,/private void startDemoToday\(/);
assert.match(service,/private void leaveTraining\(/);
assert.match(service,/restoreJournal\(\)/);
assert.match(service,/journal\.events\(\)\.all\(sessionKey\)/);
assert.match(service,/appendEvent\("LEGACY_IMPORTED"\)/);
assert.match(service,/appendEvent\(eventType,actedOnStep\)/);
assert.match(service,/persist\("CYCLE_REPEATED"|navigateEdu\(step\.repeatTo,"CYCLE_REPEATED"\)/);
assert.match(service,/navigateEdu\(step\.noPassTo,"NO_PASS"\)/);
assert.match(service,/persist\("NOT_OBSERVED"\)/);
assert.match(service,/RaidDayRecovery\.stats/);
assert.match(service,/Math\.max\(dp\(145\),maximum\)/);
assert.match(service,/panelParams\\.alpha=1f/);
assert.match(service,/edu_panel_x/);
assert.match(service,/edu_panel_y/);
assert.match(service,/requestDisallowInterceptTouchEvent\(true\)/);
assert.match(service,/showEduSettings\(/);
assert.match(service,/showEduGuide\(/);
assert.match(service,/showEduWelcome\(/);
assert.match(service,/showEduRisk\(/);
assert.match(service,/showEduFinished\(/);
assert.match(service,/currentPhaseNote\(/);
assert.match(service,/ClipboardManager/);
assert.match(history,/@Entity\(tableName="raid_day_events"\)/);
assert.match(history,/@PrimaryKey\(autoGenerate=true\)/);
assert.match(dao,/ORDER BY id ASC/);
assert.match(db,/@Database\(entities=\{RaidDayEvent\.class\},version=1/);
assert.match(gradle,/androidx\.room:room-runtime:2\.6\.1/);
assert.match(gradle,/annotationProcessor\("androidx\.room:room-compiler:2\.6\.1"\)/);
assert.doesNotMatch(service,/MediaProjectionManager|AccessibilityService|PGSharp|poke\.nianticlabs|https?:\/\//);
for(const other of ["OverlayService","SecondaryOverlayService",
                    "RareCandyOverlayService","CandyScreenCaptureService"])
  assert.ok(manifest.includes('android:name=".'+other+'"'),other);
console.log("LT304 Edu E1 PASS: dialogue, strict D-1/D, 11 steps, audit history, risk and independent overlays");

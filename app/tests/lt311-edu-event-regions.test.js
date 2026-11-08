"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const read=name=>fs.readFileSync(root+name,"utf8");
const region=read("RaidDayRegionalWindow.java");
const schedule=read("RaidDaySchedule.java");
const settings=read("RaidDayEventSettingsActivity.java");
const autoSync=read("EduEventSelection.java");
const service=read("RaidDayAssistantOverlayService.java");
const sprites=read("EduSpriteAtlas.java");

// Conversão independente de JS Intl para a data oficial Mega Chandelure.
const checks=[
  ["Pacific/Kiritimati","2026-10-30T21:00:00-03:00"],
  ["Pacific/Auckland","2026-10-30T22:00:00-03:00"],
  ["Asia/Singapore","2026-10-31T03:00:00-03:00"],
  ["America/Sao_Paulo","2026-10-31T14:00:00-03:00"],
  ["Pacific/Honolulu","2026-10-31T21:00:00-03:00"]
];
function fields(zone,date){
  const items=new Intl.DateTimeFormat("en-US",{
    timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).formatToParts(new Date(date));
  return Object.fromEntries(items.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
}
for(const [zone,brasilia] of checks){
  const parts=fields(zone,brasilia);
  assert.deepEqual([parts.year,parts.month,parts.day,parts.hour,parts.minute],
    ["2026","10","31","14","00"],"14h do evento em "+zone);
}
const nzEnd=fields("Pacific/Auckland","2026-10-31T01:00:00-03:00");
assert.deepEqual([nzEnd.hour,nzEnd.minute],["17","00"]);
assert(region.includes("LocalDate.of(2026,10,31)"));
assert(region.includes("LocalTime.of(14,0)"));
assert(region.includes("LocalTime.of(17,0)"));
assert(region.includes("enum Phase { UNKNOWN, BEFORE, ACTIVE, ENDED }"));
assert(region.includes("if(now<begin)return Phase.BEFORE"));
assert(region.includes("if(now>=end)return Phase.ENDED"));
assert(region.includes("return Phase.ACTIVE"));
assert(region.includes("LocalDateTime.of(date,from).atZone(zone)"),"timezone conversion must use local date and region");
assert(schedule.includes('.putString("raid_day_window_zone",zone.getId())'));
assert(schedule.includes('.putString("raid_day_window_date",date.toString())'));
assert(schedule.includes('RaidDayRegionalWindow.phase(now,start(ctx),finish(ctx))'));
assert(schedule.includes("EduEventClock.nowMillis(ctx)"),"status must use the shared Edu clock");
assert(settings.includes('addButton("Região onde vai jogar",this::chooseRegion)'));
assert(settings.includes('addButton("Exemplo oficial · Mega Chandelure (31/10/2026)",'));
assert(settings.includes('RaidDaySchedule.save(this,date,startTime,endTime,'));
for(const id of ["America/Sao_Paulo","Pacific/Auckland","Asia/Singapore","Pacific/Honolulu","Pacific/Kiritimati"])
  assert(settings.includes(id),"region preset "+id);
assert(settings.includes("ZoneId.of(input.getText().toString().trim())"),"custom region support");
assert(settings.includes("EduEventSelection.sync(this,prefs,EduEventClock.forEdu(this))"),"region save synchronizes event date");
assert(autoSync.includes(".putString(PREP_DATE,iso)"),"date aligned to local event day");
assert(autoSync.includes(".putString(CONFIRMED,key)"),"configured event must skip date question");
assert(service.includes("private LocalDate eduEventLocalToday()"));
assert(service.includes("private RaidDayRegionalWindow.Phase eduConfiguredPhase()"));
assert(service.includes("RaidDaySchedule.zone(this)"));
assert(service.includes("RaidDayRegionalWindow.Phase.BEFORE"));
assert(service.includes("RaidDayRegionalWindow.Phase.ENDED"));
assert(service.includes("RaidDayRegionalWindow.Phase.ACTIVE"));
for(const state of ["evento_nao_comecou","evento_comecou","evento_encerrou"]){
  assert(service.includes('"'+state+'"'),"new event state "+state);
  assert(sprites.includes('case "'+state+'":'),"mapped sprite "+state);
}
assert(service.includes("lastRegionalPhase"),"refresh on event window transition");
assert(service.includes('lastEventWindowIdentity'),"refresh on region change");
assert(service.includes("preparation.eventDate().equals(")&&service.includes("RaidDaySchedule.eventDate(this)"),"avoid stale settings");
assert(service.includes('editEduEventRegion()'),"region controls accessible");
console.log("LT311 event regional window and five clock transitions PASS");

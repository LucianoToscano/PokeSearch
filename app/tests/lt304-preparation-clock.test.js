"use strict";
// LT304 E2A — perguntas iniciais e fuso de Brasília. Sem evento oficial
// carregado; nenhuma hora de começo/fim é inventada pelo PokeSearch.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const java="java/com/lucianotoscano/pokesearchoverlay/";
const clock=read(java+"RaidDayEventClock.java");
const prep=read(java+"RaidDayPreparation.java");
const service=read(java+"RaidDayAssistantOverlayService.java");
const arrays=read("res/values/arrays_raid_day.xml");
const strings=read("res/values/strings_raid_day.xml");
const manifest=read("AndroidManifest.xml");
const timeAt=(iso,zone)=>{
  const fmt=new Intl.DateTimeFormat("en-GB",{
    timeZone:zone,day:"2-digit",month:"2-digit",year:"numeric",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  });
  const obj=Object.fromEntries(fmt.formatToParts(new Date(iso))
    .filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
  return [obj.year,obj.month,obj.day,obj.hour,obj.minute].join("-");
};
const sample="2026-10-31T01:00:00.000Z";
assert.equal(timeAt(sample,"America/Sao_Paulo"),"2026-10-30-22-00");
assert.equal(timeAt(sample,"Pacific/Honolulu"),"2026-10-30-15-00");
assert.equal(timeAt(sample,"Pacific/Auckland"),"2026-10-31-14-00");
assert.equal(timeAt(sample,"Pacific/Kiritimati"),"2026-10-31-15-00");
assert.equal(timeAt("2026-07-01T01:00:00.000Z","Pacific/Auckland"),
             "2026-07-01-13-00","NZ must respect DST and not fixed UTC+13");
for(const zone of ["America/Sao_Paulo","Pacific/Honolulu","Pacific/Auckland",
                    "Pacific/Kiritimati"])assert.ok(clock.includes(zone));
assert.match(clock,/Clock clock/);
assert.match(clock,/todayBrasilia\(Clock clock\)/);
assert.match(clock,/automaticTimeEnabled\(Context context\)/);
assert.match(clock,/Settings\.Global\.AUTO_TIME/);
assert.match(clock,/BEFORE_DAY, EVENT_DAY, AFTER_DAY, UNKNOWN/);
assert.match(clock,/NÃO verificado/);
assert.match(clock,/if\(configuredDay==null\)return DayState\.UNKNOWN/);
assert.doesNotMatch(clock,/ZoneOffset\.ofHours|setTimeZone\(/);

assert.match(prep,/public static final int COUNT=7/);
assert.match(arrays,/name="raid_day_preparation_questions"/);
assert.equal((arrays.match(/<item>/g)||[]).length,7+3+2);
for(const term of [
  "Passe Diário guardado do dia anterior","Já coletou o Passe Diário de hoje",
  "Já realizou alguma reide hoje","Já começou o roteiro",
  "aviso ou restrição ativa","Híbrido (autorização por sessão)","Não sei"
])assert.ok(arrays.includes(term),term);
assert.match(prep,/RaidDayPreparation load\(Context context,/);
assert.match(prep,/R\.array\.raid_day_preparation_questions/);
assert.doesNotMatch(prep,/R\.array\.raid_day_preparation_locations/);
assert.match(prep,/String eventKey\(\)/);
assert.match(prep,/prefs\.getBoolean\(KEY\+"completed",false\)/);
assert.match(prep,/prefs\.getInt\(KEY\+"question",0\)/);
assert.match(prep,/prep\.answers\[0\]=RaidDayEventClock\.todayBrasilia\(clock\)/);
assert.match(prep,/public void markComplete\(\)/);
assert.match(prep,/public void beginEditing\(\)/);
assert.match(prep,/getString\(KEY\+"answer_"/);
assert.match(prep,/prefs\.edit\(\)/);
assert.match(prep,/informado, não verificado/);
assert.match(service,/createPreparationUi\(\)/);
assert.match(service,/private void renderPreparation\(\)/);
assert.match(service,/String\[\] sizeLabels=\{"P","M","G"\}/);
assert.match(service,/preparation\.questionText\(q\)/);
assert.match(service,/preparation\.optionsFor\(q\)/);
assert.match(service,/preparation\.shiftDate\(days,eventClock\)/);
assert.match(service,/preparation\.markComplete\(\)/);
assert.match(service,/preparation\.save\(prefs\)/);
assert.match(service,/preparation\.eventKey\(\)/);
assert.match(service,/riskAccepted=\(plan\.riskVersion\+":"\+eventKey\)\.equals/);
assert.match(service,/preparationSection\.setVisibility\(View\.VISIBLE\)/);
assert.match(service,/updateEventClock\(\)/);
assert.match(service,/RaidDayEventClock\.format\(eventClock\.instant\(\)/);
assert.match(service,/RaidDayEventClock\.todayBrasilia\(eventClock\)/);
assert.match(service,/if\(active\|\|training\|\|!preparation\.isComplete\(\)\|\|!riskAccepted\)return/);
assert.match(service,/DayState\.AFTER_DAY/);
assert.match(service,/currentPhaseNote\(/);
assert.match(service,/startDemoToday\(/);
assert.match(service,/preparation\.choose\(option\)/);
assert.match(strings,/raid_day_risk_message/);
assert.match(manifest,/android:name="\.RaidDayAssistantOverlayService"/);
assert.doesNotMatch(service,/startActivity\(new Intent\(Settings\.ACTION_MANAGE_OVERLAY_PERMISSION/);
console.log("LT304/E2A PASS: preparation 7 questions, stored answers, risk per event, real Brasília/NZ timezone and no invented hours");

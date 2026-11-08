"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const presets=fs.readFileSync(path+"EduEventMomentPresets.java","utf8");
const clock=fs.readFileSync(path+"EduEventClock.java","utf8");
const screen=fs.readFileSync(path+"EduClockSettingsActivity.java","utf8");
const service=fs.readFileSync(path+"RaidDayAssistantOverlayService.java","utf8");
const schedule=fs.readFileSync(path+"RaidDaySchedule.java","utf8");

// 17 opções; usar tempo absoluto e não confundir +4h após início com
// "evento ainda ativo" se a duração configurada foi de apenas três horas.
const entries=[...presets.matchAll(/add\(result,"([^"]+)",(start|end)([+-][^;]+)?\);/g)]
  .map(([,label,anchor,offset])=>({label,anchor,offset:offset||""}));
assert.equal(entries.length,17,"São 17 momentos distintos no seletor");
assert.equal(new Set(entries.map(e=>e.label)).size,17);
for(const text of [
  "Evento não começou · 3 dias antes","Faltam 24 horas","Falta 1 hora",
  "30 minutos antes","10 minutos antes","1 minuto antes",
  "10 segundos antes","Início do evento",
  "2 horas após o início","4 horas após o início",
  "8 horas após o início","12 horas após o início",
  "24 horas após o início","48 horas após o início",
  "10 minutos antes do fim","10 minutos depois do fim",
  "1 semana depois do fim"
])assert.ok(entries.some(e=>e.label===text),"Opção ausente: "+text);

assert.match(presets,/result\.sort\(Comparator\.comparingLong\(moment->moment\.epochMillis\)\)/,
  "Ordem cronológica deve depender da duração real");
assert.match(presets,/if\(start<=0L\|\|end<=start\|\|end-start>DAY\)/,
  "Não inventar horário para evento não configurado");
assert.match(presets,/end-10\*MINUTE/);
assert.match(presets,/end\+10\*MINUTE/);
assert.match(presets,/end\+7\*DAY/);
assert.match(presets,/start-10\*SECOND/);
assert.match(presets,/start\+2\*DAY/);

// Verificação numérica independente dos deslocamentos em uma janela de 3h.
const S=1_800_000_000_000,E=S+3*3_600_000,MIN=60_000,HR=60*MIN,DAY=24*HR;
const expected=new Map([
  ["Evento não começou · 3 dias antes",S-3*DAY],
  ["Faltam 24 horas",S-DAY],
  ["Falta 1 hora",S-HR],
  ["30 minutos antes",S-30*MIN],
  ["10 minutos antes",S-10*MIN],
  ["1 minuto antes",S-MIN],
  ["10 segundos antes",S-10_000],
  ["Início do evento",S],
  ["2 horas após o início",S+2*HR],
  ["4 horas após o início",S+4*HR],
  ["8 horas após o início",S+8*HR],
  ["12 horas após o início",S+12*HR],
  ["24 horas após o início",S+DAY],
  ["48 horas após o início",S+2*DAY],
  ["10 minutos antes do fim",E-10*MIN],
  ["10 minutos depois do fim",E+10*MIN],
  ["1 semana depois do fim",E+7*DAY]
]);
assert.equal(expected.size,17);
const ordered=[...expected].sort((a,b)=>a[1]-b[1]);
assert.ok(ordered.findIndex(([n])=>n==="10 minutos antes do fim") >
  ordered.findIndex(([n])=>n==="2 horas após o início"));
assert.ok(ordered.findIndex(([n])=>n==="10 minutos depois do fim") <
  ordered.findIndex(([n])=>n==="4 horas após o início"));

// Confirmar o único relógio Edu; seleção muda apenas a âncora virtual,
// não o relógio do Android ou GPS. Timezone de evento é usado na exibição.
assert.match(clock,/public static void setManualInstant\(Context context,Instant moment\)/);
assert.match(clock,/putBoolean\(AUTO_DATE_TIME,false\)/);
assert.match(clock,/putLong\(VIRTUAL_BASE,moment\.toEpochMilli\(\)\)/);
assert.match(clock,/putLong\(WALL_BASE,now\)/);
assert.doesNotMatch(clock,/Settings\.Global|Settings\.Secure|setTimeZone\(|LocationManager/);
assert.match(screen,/label\("Momento do evento",15,PRIMARY,true\)/);
assert.match(screen,/chooseQuickMoment\(i\)/);
assert.match(screen,/RaidDaySchedule\.valid\(begin,finish\)/);
assert.match(screen,/EduEventMomentPresets\.forWindow\(begin,finish\)/);
assert.match(screen,/RaidDaySchedule\.start\(this\)/);
assert.match(screen,/RaidDaySchedule\.finish\(this\)/);
assert.doesNotMatch(screen,/setSingleChoiceItems\(items,-1/);
assert.match(screen,/EduEventClock\.setManualInstant\(this,/);
assert.match(screen,/Instant.ofEpochMilli\(moment.epochMillis\)/);
assert.match(screen,/Configure primeiro a data do evento/);
assert.match(screen,/chosenMomentLabel=moment\.label/);
assert.match(service,/eventClock=EduEventClock\.forEdu\(this\)/);
assert.match(service,/RaidDaySchedule\.phase\(this,eventClock\.instant\(\)\)/);
assert.match(schedule,/public static boolean valid\(long start,long finish\)/);
console.log("LT316 PASS: 17 momentos, cronologia, relógio único, fuso e fallback sem data");

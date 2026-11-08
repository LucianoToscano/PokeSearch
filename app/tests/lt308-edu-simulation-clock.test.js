"use strict";
// LT308 — Um relógio editável é a referência temporal do Edu INTEIRO.
// A interface não oferece simulador/treino separado ao jogador.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"../src/main");
const src=rel=>fs.readFileSync(path.join(root,rel),"utf8");
const folder="java/com/lucianotoscano/pokesearchoverlay/";
const clock=src(folder+"EduEventClock.java");
const home=src(folder+"MainActivity.java");
const edu=src(folder+"RaidDayAssistantOverlayService.java");
const settings=src(folder+"RaidDayEventSettingsActivity.java");
assert.equal(fs.existsSync(path.join(root,folder+"EduSimulationClock.java")),false,
 "Não manter um segundo relógio só para simular no Edu");

// Começa com instante real do celular e avança na cadência normal.
assert.match(clock,/private static final String PREFS="edu_simulation_clock"/,
 "Preservar preferências já criadas na PR");
assert.match(clock,/long wall=System\.currentTimeMillis\(\)/);
assert.match(clock,/if\(!p\.contains\(VIRTUAL_BASE\)\|\|!p\.contains\(WALL_BASE\)\)return wall/);
assert.match(clock,/p\.getLong\(VIRTUAL_BASE,wall\)\+\s*\(wall-p\.getLong\(WALL_BASE,wall\)\)/);
assert.match(clock,/DateTimeFormatter\.ofPattern\("dd\/MM\/yy"/);
assert.match(clock,/DateTimeFormatter\.ofPattern\("HH:mm:ss"/);
assert.match(clock,/RaidDayEventClock\.BRASILIA/);
assert.match(clock,/void setBrasiliaDateTime\(Context context,LocalDateTime dateTime\)/);
assert.match(clock,/void shiftDays\(Context context,int days\)/);
assert.match(clock,/putLong\(VIRTUAL_BASE,chosen\)/);
assert.match(clock,/putLong\(WALL_BASE,System\.currentTimeMillis\(\)\)/);
assert.match(clock,/void reset\(Context context\)/);
assert.match(clock,/remove\(VIRTUAL_BASE\)/);
assert.match(clock,/remove\(WALL_BASE\)/);
assert.match(clock,/Clock forEdu\(Context context\)/);
assert.match(clock,/return Instant\.ofEpochMilli\(nowMillis\(context\)\)/);
assert.doesNotMatch(clock,/Settings\.Global|setTime\(|setTimeZone\(|LocationManager|ACCESS_FINE_LOCATION|su\b/);

// Visor próximo ao ícone dos passes; opções abertas SOMENTE ao tocar.
const passIndex=home.indexOf("controls.addView(raidAssistantControl,guideLp);");
const watchIndex=home.indexOf("controls.addView(eduSimulationClockDisplay,simulationClockLp);");
const heartIndex=home.indexOf("controls.addView(heart,heartLp);");
assert.ok(passIndex>0&&watchIndex>passIndex&&heartIndex>watchIndex);
assert.match(home,/new LinearLayout\.LayoutParams\(d\(65\),d\(34\)\)/);
assert.match(home,/EduEventClock\.dateLabel\(this\)\+"\\n"\+/);
assert.match(home,/EduEventClock\.timeLabel\(this\)/);
assert.match(home,/eduSimulationClockDisplay\.setOnClickListener\(v->showEduClockOptions\(\)\)/);
assert.match(home,/eduSimulationClockDisplay\.setOnLongClickListener/);
assert.match(home,/new DatePickerDialog\(this/);
assert.match(home,/new TimePickerDialog\(this/);
assert.match(home,/android\.widget\.NumberPicker seconds=new android\.widget\.NumberPicker\(this\)/);
for(const label of ["Escolher data","Escolher hora","Ajustar segundos",
                    "−1 dia","+1 dia","Usar hora atual do celular"])
 assert.ok(home.includes(label), "Falta opção no relógio: "+label);
assert.match(home,/EduEventClock\.shiftDays\(this,which==3\?-1:1\)/);
assert.match(home,/EduEventClock\.reset\(this\)/);
assert.match(home,/long delta=1000L-\(System\.currentTimeMillis\(\)%1000L\)/);
assert.match(home,/eduSimulationClockHandler\.postDelayed\(this,Math\.max\(120L,delta\)\)/);
assert.match(home,/eduSimulationClockHandler\.removeCallbacks\(eduSimulationClockTick\)/);
assert.match(home,/if\(availableBrandWidth<d\(55\)\)/);

// Mesmo relógio para a preparação, dia D e véspera, não relógio de treino.
assert.match(edu,/private Clock eventClock;/);
assert.match(edu,/eventClock=EduEventClock\.forEdu\(this\)/);
assert.match(edu,/preparation=RaidDayPreparation\.load\(this,prefs,eventClock\)/);
assert.match(edu,/RaidDayEventClock\.todayBrasilia\(eventClock\)/);
assert.match(edu,/RaidDayEventClock\.state\(preparation\.eventDate\(\),eventClock\.instant\(\)\)/);
assert.match(edu,/LocalDate day=RaidDayEventClock\.todayBrasilia\(eventClock\)/);
assert.match(edu,/if\(lastEduClockDay!=null&&!day\.equals\(lastEduClockDay\)/);
assert.match(edu,/source=EduEventClock\.isAdjusted\(this\)\?"Hora ajustada":"Brasília"/);
assert.match(edu,/eduIntroAccepted=true;\s*eduWantsReal=true;/,
 "A fala Sim já entra no fluxo final do Edu");
assert.doesNotMatch(edu,/Quer simular um evento acontecendo hoje/,
 "Nunca oferecer simulador separado dentro do assistente");
assert.doesNotMatch(edu,/addTwo\("Começar",\(\)->beginRealSession\(\),"Treinar"/,
 "Não mostrar botão de treino na etapa pronta");
assert.match(settings,/RaidDayPreparation\.load\(this,prefs,\s*EduEventClock\.forEdu\(this\)\)/);
assert.match(settings,/RaidDayEventClock\.summary\(EduEventClock\.forEdu\(this\)\.instant\(\)\)/);

console.log("LT308 PASS: opções do relógio, segundos vivos, fonte única para Edu final, sem seletor separado de simulação");

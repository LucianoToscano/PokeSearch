"use strict";
// LT308 — Relógio fictício de segundos ao lado do botão de passes,
// destinado ao TREINO. Nenhuma alteração de horário/GPS do aparelho.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"../src/main");
const src=rel=>fs.readFileSync(path.join(root,rel),"utf8");
const folder="java/com/lucianotoscano/pokesearchoverlay/";
const clock=src(folder+"EduSimulationClock.java");
const home=src(folder+"MainActivity.java");
const edu=src(folder+"RaidDayAssistantOverlayService.java");

// Horário virtual começa no relógio atual do celular e continua correndo.
assert.match(clock,/private static final String PREFS="edu_simulation_clock"/);
assert.match(clock,/long wall=System\.currentTimeMillis\(\)/);
assert.match(clock,/if\(!p\.contains\(VIRTUAL_BASE\)\|\|!p\.contains\(WALL_BASE\)\)return wall/);
assert.match(clock,/p\.getLong\(VIRTUAL_BASE,wall\)\+\s*\(wall-p\.getLong\(WALL_BASE,wall\)\)/);
assert.match(clock,/DateTimeFormatter\.ofPattern\("dd\/MM\/yy"/);
assert.match(clock,/DateTimeFormatter\.ofPattern\("HH:mm:ss"/);
assert.match(clock,/ZoneId\.systemDefault\(\)/);
assert.match(clock,/void setLocalDateTime\(Context context,LocalDateTime dateTime\)/);
assert.match(clock,/putLong\(VIRTUAL_BASE,chosen\)/);
assert.match(clock,/putLong\(WALL_BASE,System\.currentTimeMillis\(\)\)/);
assert.match(clock,/void reset\(Context context\)/);
assert.match(clock,/remove\(VIRTUAL_BASE\)/);
assert.match(clock,/remove\(WALL_BASE\)/);
assert.match(clock,/Clock forTraining\(Context context\)/);
assert.match(clock,/return Instant\.ofEpochMilli\(nowMillis\(context\)\)/);
assert.doesNotMatch(clock,/Settings\.Global|setTime\(|setTimeZone\(|LocationManager|ACCESS_FINE_LOCATION|su\b/);

// Cabeçalho: visor depois do ícone dos passes, e antes do coração.
const passIndex=home.indexOf("controls.addView(raidAssistantControl,guideLp);");
const watchIndex=home.indexOf("controls.addView(eduSimulationClockDisplay,simulationClockLp);");
const heartIndex=home.indexOf("controls.addView(heart,heartLp);");
assert.ok(passIndex>0&&watchIndex>passIndex&&heartIndex>watchIndex);
assert.match(home,/new LinearLayout\.LayoutParams\(d\(65\),d\(34\)\)/);
assert.match(home,/EduSimulationClock\.dateLabel\(this\)\+"\\n"\+/);
assert.match(home,/EduSimulationClock\.timeLabel\(this\)/);
assert.match(home,/eduSimulationClockDisplay\.setOnClickListener\(v->editEduSimulationClock\(\)\)/);
assert.match(home,/eduSimulationClockDisplay\.setOnLongClickListener/);
assert.match(home,/new DatePickerDialog\(this/);
assert.match(home,/new TimePickerDialog\(this/);
assert.match(home,/LocalDateTime\.of\(year,month\+1,day,hour,minute,0\)/);
assert.match(home,/EduSimulationClock\.reset\(this\)/);
assert.match(home,/long delta=1000L-\(System\.currentTimeMillis\(\)%1000L\)/);
assert.match(home,/eduSimulationClockHandler\.postDelayed\(this,Math\.max\(120L,delta\)\)/);
assert.match(home,/eduSimulationClockHandler\.removeCallbacks\(eduSimulationClockTick\)/);
assert.match(home,/brandLabels\.setVisibility\(View\.GONE\)/,
  "Em celular estreito ocultar apenas o wordmark, nunca o relógio");
assert.match(home,/if\(availableBrandWidth<d\(55\)\)/);

// Treino usa tempo fictício. Sessão real continua com clock de Brasília.
assert.match(edu,/private final Clock eventClock=Clock\.systemUTC\(\)/);
assert.match(edu,/private Clock eduTrainingOrRealClock\(\)/);
assert.match(edu,/return training&&demoToday\?EduSimulationClock\.forTraining\(this\):eventClock/);
assert.match(edu,/RaidDayEventClock\.todayBrasilia\(eduTrainingOrRealClock\(\)\)/);
assert.match(edu,/String now=RaidDayEventClock\.format\(eventClock\.instant\(\),/);
assert.match(edu,/if\(training&&demoToday\)/);
assert.match(edu,/EduSimulationClock\.isAdjusted\(this\)\?"Simular data":"Simular hoje"/);
assert.match(edu,/LocalDate today=RaidDayEventClock\.todayBrasilia\(eventClock\)/,
  "Dia D real deve continuar usando relógio original");
assert.match(edu,/if\(!training&&"D-1"\.equals\(step\.phase\)/,
  "Validação do evento real não deve ser afetada pelo simulador");

console.log("LT308 PASS: relógio vivo no botão de passes; ajuste de data/hora apenas no modo de treino; modo real segue Brasília");

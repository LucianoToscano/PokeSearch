"use strict";
// LT308 — Conferir o relógio interno do Edu e todas as opções das capturas
// da tela de Data e hora do Samsung. Nunca alterar configurações do Android.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"../src/main");
const src=rel=>fs.readFileSync(path.join(root,rel),"utf8");
const folder="java/com/lucianotoscano/pokesearchoverlay/";
const clock=src(folder+"EduEventClock.java");
const home=src(folder+"MainActivity.java");
const screen=src(folder+"EduClockSettingsActivity.java");
const edu=src(folder+"RaidDayAssistantOverlayService.java");
const settings=src(folder+"RaidDayEventSettingsActivity.java");
const manifest=src("AndroidManifest.xml");

assert.equal(fs.existsSync(path.join(root,folder+"EduSimulationClock.java")),false,
  "Não permitir relógio separado do Edu");
assert.match(clock,/private static final String PREFS="edu_simulation_clock"/);
assert.match(clock,/private static final String AUTO_DATE_TIME/);
assert.match(clock,/private static final String AUTO_TIME_ZONE/);
assert.match(clock,/private static final String ZONE_LOCATION/);
assert.match(clock,/private static final String FORMAT_24H/);
assert.match(clock,/boolean isAutomaticDateTime\(Context context\)/);
assert.match(clock,/void setAutomaticDateTime\(Context context,boolean enabled\)/);
assert.match(clock,/if\(enabled\)\{\s*edit.remove\(VIRTUAL_BASE\).remove\(WALL_BASE\)/);
assert.match(clock,/edit.putLong\(VIRTUAL_BASE,now\).putLong\(WALL_BASE,now\)/);
assert.match(clock,/boolean isAutomaticTimeZone\(Context context\)/);
assert.match(clock,/void setAutomaticTimeZone\(Context context,boolean enabled\)/);
assert.match(clock,/boolean isLocationBasedTimeZone\(Context context\)/);
assert.match(clock,/void setLocationBasedTimeZone\(Context context,boolean enabled\)/);
assert.match(clock,/boolean is24HourFormat\(Context context\)/);
assert.match(clock,/void set24HourFormat\(Context context,boolean enabled\)/);
assert.match(clock,/DateFormat\.is24HourFormat\(context\)/);
assert.match(clock,/ZoneId\.systemDefault\(\):RaidDayEventClock\.BRASILIA/);
assert.match(clock,/long wall=System\.currentTimeMillis\(\)/);
assert.match(clock,/if\(isAutomaticDateTime\(context\)\)return wall/);
assert.match(clock,/p\.getLong\(VIRTUAL_BASE,wall\)\+\(wall-p\.getLong\(WALL_BASE,wall\)\)/);
assert.match(clock,/DateTimeFormatter\.ofPattern\("dd\/MM\/yy"/);
assert.match(clock,/DateTimeFormatter\.ofPattern\("HH:mm:ss"/);
assert.match(clock,/DateTimeFormatter\.ofPattern\("hh:mm:ss a"/);
assert.match(clock,/void setBrasiliaDateTime\(Context context,LocalDateTime dateTime\)/);
assert.match(clock,/putBoolean\(AUTO_DATE_TIME,false\)/);
assert.match(clock,/putLong\(WALL_BASE,System\.currentTimeMillis\(\)\)/);
assert.match(clock,/Clock forEdu\(Context context\)/);
assert.match(clock,/return new EduClock\(context,zone\)/);
assert.match(clock,/return zoneOverride==null\?zone\(context\):zoneOverride/);
assert.match(clock,/java\.time\.LocalDate today\(Context context\)/);
assert.match(clock,/RaidDayEventClock\.DayState dayState\(/);
assert.match(clock,/LocalDateTime\.ofInstant\(Instant\.ofEpochMilli\(nowMillis\(context\)\),\s*zone\(context\)\)/);
assert.doesNotMatch(clock,/Settings\.Global|Settings\.Secure|setTimeZone\(|LocationManager|ACCESS_FINE_LOCATION|Runtime\.getRuntime\(\)\.exec/,
  "Não acessar funções privilegiadas do Android nem GPS");

const passIndex=home.indexOf("controls.addView(raidAssistantControl,guideLp);");
const watchIndex=home.indexOf("controls.addView(eduSimulationClockDisplay,simulationClockLp);");
const heartIndex=home.indexOf("controls.addView(heart,heartLp);");
assert.ok(passIndex>0&&watchIndex>passIndex&&heartIndex>watchIndex,
  "O relógio fica ao lado do ícone dos passes");
assert.match(home,/new LinearLayout\.LayoutParams\(d\(65\),d\(34\)\)/);
assert.match(home,/EduEventClock\.dateLabel\(this\)\+"\\n"\+/);
assert.match(home,/EduEventClock\.timeLabel\(this\)/);
assert.match(home,/eduSimulationClockDisplay\.setOnClickListener\(v->showEduClockOptions\(\)\)/);
assert.match(home,/startActivity\(new android\.content\.Intent\(this,\s*EduClockSettingsActivity\.class\)\)/);
assert.match(home,/eduSimulationClockDisplay\.setOnLongClickListener/);
assert.match(home,/long delta=1000L-\(System\.currentTimeMillis\(\)%1000L\)/);
assert.match(home,/eduSimulationClockHandler\.postDelayed\(this,Math\.max\(120L,delta\)\)/);
assert.match(home,/eduSimulationClockHandler\.removeCallbacks\(eduSimulationClockTick\)/);

// As opções e a organização do Samsung, com switches no próprio app.
assert.match(manifest,/activity android:name="\.EduClockSettingsActivity"/);
assert.match(screen,/setTitle|label\("Data e hora",26/);
for(const title of [
  "Data e hora automáticas", "Definir data", "Definir hora",
  "Fuso horário automático", "Definir fuso conforme localização",
  "Formato 24 horas"
])assert.ok(screen.includes(title),"Falta opção da imagem: "+title);
assert.match(screen,/autoDate=new Switch\(this\)/);
assert.match(screen,/autoZone=new Switch\(this\)/);
assert.match(screen,/locationZone=new Switch\(this\)/);
assert.match(screen,/format24=new Switch\(this\)/);
assert.match(screen,/manualDateTime\.setVisibility\(autoDate\.isChecked\(\)\?View\.GONE:View\.VISIBLE\)/,
  "Data/hora manuais ficam ocultas se automático está ativo");
assert.match(screen,/manualZone\.setVisibility\(autoZone\.isChecked\(\)\?View\.GONE:View\.VISIBLE\)/);
assert.match(screen,/new DatePickerDialog\(this/);
assert.match(screen,/new TimePickerDialog\(this/);
assert.match(screen,/EduEventClock\.setAutomaticDateTime\(this,on\)/);
assert.match(screen,/EduEventClock\.setAutomaticTimeZone\(this,on\)/);
assert.match(screen,/EduEventClock\.setLocationBasedTimeZone\(this,on\)/);
assert.match(screen,/EduEventClock\.set24HourFormat\(this,on\)/);
assert.match(screen,/EduEventClock\.setBrasiliaDateTime\(this/);
assert.match(screen,/handler\.postDelayed\(this,1000\)/);
assert.match(screen,/setAutomaticTimeZone|setManualTimeZone/);
assert.match(screen,/sem acessar GPS/);
assert.match(screen,/NUNCA|nunca altera|nunca altera/i);

assert.match(edu,/eventClock=EduEventClock\.forEdu\(this\)/);
assert.match(edu,/EduEventClock\.today\(this\)/);
assert.match(edu,/EduEventClock\.dayState\(this,preparation\.eventDate\(\)\)/);
assert.match(edu,/if\(lastEduClockDay!=null&&!day\.equals\(lastEduClockDay\)/);
assert.match(edu,/EduEventClock\.isAdjusted\(this\)\?"Hora ajustada"/);
assert.doesNotMatch(edu,/Quer simular um evento acontecendo hoje/);
assert.match(settings,/EduEventClock\.forEdu\(this\)/);
console.log("LT308 PASS: tela automática/manual com todas as opções das capturas Samsung e relógio único do Edu");

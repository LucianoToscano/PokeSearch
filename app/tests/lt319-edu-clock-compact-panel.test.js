"use strict";
// LT319 — painel do relógio limpo, sem modificar o tempo/GPS do Android.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const ui=fs.readFileSync(root+"EduClockSettingsActivity.java","utf8");
const clock=fs.readFileSync(root+"EduEventClock.java","utf8");
const moments=fs.readFileSync(root+"EduEventMomentPresets.java","utf8");
const service=fs.readFileSync(root+"RaidDayAssistantOverlayService.java","utf8");

// Hierarquia principal: prévia, automático, momento e ajuste manual.
assert.match(ui,/label\("Relógio virtual",23/);
assert.match(ui,/previewTime=label\("",34,PRIMARY,true\)/);
assert.match(ui,/previewDate=label\("",13,SECONDARY,false\)/);
assert.match(ui,/previewMode=label\("",12,ACCENT,false\)/);
assert.match(ui,/previewTime\.setText\(EduEventClock\.timeLabel\(this\)\)/);
assert.match(ui,/addSwitchRow\(mainCard,"Automático","Usar a hora do celular"/);
assert.match(ui,/addQuickMomentGrid\(mainCard\)/,
  "Os momentos ficam na mesma tela, sem submenu");
assert.match(ui,/dateTimeDetail=addAction\(manualDateTime,"Ajustar data e hora"/);
assert.match(ui,/private void chooseDateTime\(\)/);
assert.match(ui,/new DatePickerDialog\(this/);
assert.match(ui,/new TimePickerDialog\(this/);
assert.match(ui,/EduEventClock\.setBrasiliaDateTime\(this,/);
assert.match(ui,/manualDateTime\.setVisibility\(automatic\?View\.GONE:View\.VISIBLE\)/);

// Fuso/formato não somem do produto, mas ficam num grupo fechado.
assert.match(ui,/advancedOpen=false/);
assert.match(ui,/moreDetail=addAction\(extras,"Mais opções"/);
assert.match(ui,/advancedOptions\.setVisibility\(advancedOpen\?View\.VISIBLE:View\.GONE\)/);
assert.match(ui,/zoneDetail=addAction\(advancedOptions,"Fuso horário"/);
assert.match(ui,/addSwitchRow\(advancedOptions,"Formato 24 horas"/);
assert.equal((ui.match(/new Switch\(this\)/g)||[]).length,2,
  "A interface não pode voltar aos quatro interruptores redundantes");
for(const obsolete of [
  "Fuso horário automático",
  "Definir fuso conforme localização",
  "Data e hora automáticas"
])assert.ok(!ui.includes(obsolete),"Controle redundante voltou: "+obsolete);

// Selecionar um momento continua funcionando até no modo automático:
// define manual internamente e guarda a escolha na UI.
assert.match(ui,/EduEventMomentPresets\.forWindow\(begin,finish\)/);
assert.match(ui,/RaidDaySchedule\.start\(this\)/);
assert.match(ui,/RaidDaySchedule\.finish\(this\)/);
assert.doesNotMatch(ui,/setSingleChoiceItems\(items,-1/,
  "Não abrir modal de momentos no relógio");
assert.match(ui,/EduEventClock\.setManualInstant\(this,/);
assert.match(ui,/getPreferences\(MODE_PRIVATE\)\.edit\(\)\s*\.putString\(PREF_MOMENT,chosenMomentLabel\)/);
assert.match(ui,/private void clearMomentLabel\(\)/);
assert.match(ui,/EduEventClock\.setAutomaticDateTime\(this,checked\)/);
assert.match(ui,/chosenMomentLabel\.isEmpty\(\)\?/);
assert.equal((moments.match(/add\(result,/g)||[]).length,17,
  "A API histórica preserva os 17 offsets de compatibilidade");
assert.match(ui,/private static final String\[\] QUICK_MOMENTS=/);
assert.match(ui,/addBalloonAlphaSlider\(appearance\)/);
assert.match(ui,/addSizeSelector\(appearance\)/);

// Um único relógio para Home e Edu; sem um simulador interno extra.
assert.match(clock,/Clock forEdu\(Context context\)/);
assert.match(clock,/putBoolean\(AUTO_DATE_TIME,false\)/);
assert.match(clock,/putLong\(VIRTUAL_BASE,moment\.toEpochMilli\(\)\)/);
assert.match(service,/eventClock=EduEventClock\.forEdu\(this\)/);
assert.doesNotMatch(ui,/Settings\.Global|Settings\.Secure|LocationManager|setTimeZone\(/);
assert.doesNotMatch(clock,/Settings\.Global|Settings\.Secure|LocationManager|setTimeZone\(/);
assert.match(ui,/handler\.postDelayed\(this,1000\)/);
console.log("LT319 PASS: relógio compacto, 2 switches, 17 momentos, fuso opcional e relógio único");

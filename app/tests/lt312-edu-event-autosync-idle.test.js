"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const read=name=>fs.readFileSync(root+name,"utf8");
const example=read("EduEventSelection.java");
const service=read("RaidDayAssistantOverlayService.java");
const settings=read("RaidDayEventSettingsActivity.java");
const source=read("EduSpriteAtlas.java");
const prep=read("RaidDayPreparation.java");
const region=read("RaidDayRegionalWindow.java");
assert(example.includes("!EduEventClock.isAdjusted(ctx)"),"Não auto-configurar exemplo em relógio automático");
assert(example.includes("event.minusDays(1)"),"Véspera 30/10");
assert(example.includes("event.plusDays(1)"),"Encerramento 01/11");
assert(example.includes("if(!configured&&isHistoricalExampleClock(ctx))"),"Só aplicar exemplo sem janela pessoal");
assert(example.includes("RaidDaySchedule.save(ctx"),"Exemplo oficial precisa incluir janela real de horas locais");
assert(example.includes('.putString(CONFIRMED,key)'),"Salvar data confirmada, sem exigir pergunta repetida");
assert(!example.includes("putBoolean(\"raid_day_prep_v2_completed\",false)"),"Não apagar confirmações legadas");
assert(service.includes("EduEventSelection.sync(this,prefs,eventClock)"),"Alinhar ao iniciar o serviço");
assert(service.includes("EduEventSelection.sync("),"Alinhar quando relógio muda");
assert(service.includes("preparation=RaidDayPreparation.load"),"Atualizar estado visual após ajustar data");
assert(service.includes("eventSynchronized||RaidDaySchedule.valid("),"Janela salva é autoritativa");
assert(service.includes("preparation.eventDate().equals(RaidDaySchedule.eventDate(this))"),"Histórico isolado por data");
assert(settings.includes("persistSelectedWindow();"),"Selecionar exemplo já deve salvar");
assert(settings.includes("EduEventSelection.sync(this,prefs,EduEventClock.forEdu(this))"),"Salvar região confirma data");
assert(settings.includes('this::persistSelectedWindow'),"Manter botão salvar");
assert(settings.includes("Status no relógio do Edu: \"+phasePt"),"Status em português");
assert(region.includes("LocalDate.of(2026,10,31)"));
assert(region.includes("LocalTime.of(14,0)"));
assert(region.includes("LocalTime.of(17,0)"));
assert(prep.includes("raid_day_prep_v2_"),"Não alterar formato de preferência histórico");
assert(source.includes("COUNT=62"),"Não renumerar quadros originais");
assert(source.includes("TOTAL_COUNT=COUNT+EXTRA_COUNT"),"67 totais");
assert(source.includes("boolean hasExtras()"),"Idle pula extras ausentes");
assert(service.includes("private static final String[] EDU_IDLE_ROTATION"),"Exigir ciclo ocioso");
assert(service.includes("eduLastInteractionAt"),"Esperar interação parar");
assert(service.includes("if(!visible)return eduIdleFrame(now)"),"Idle somente com balão fechado");
assert(service.includes("eduIdleName=\"\";"),"Terminar sequência antes de próxima");
assert(service.includes("resetEduIdle();"),"Interação para animação idle");
for(const item of ["caminhada_direita","caminhada_esquerda"]) {
 assert(service.includes("\""+item+"\""),"Idle lateral "+item);
 assert(source.includes("\""+item+"\""),"Sprite "+item);
}
for(const item of ["pokebola_gesto","caminhada_frente","edu_jogando","edu_shiny","edu_armadura_mewtwo","edu_armadura_mewtwo_shiny"]) {
 assert(source.includes("\""+item+"\""),"Sprite preservada no atlas "+item);
}
for (const [zone,when] of [
 ["Pacific/Kiritimati","2026-10-30T21:00:00-03:00"],
 ["Pacific/Auckland","2026-10-30T22:00:00-03:00"],
 ["America/Sao_Paulo","2026-10-31T14:00:00-03:00"],
 ["Pacific/Honolulu","2026-10-31T21:00:00-03:00"]]){
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date(when)).filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
 assert.deepEqual([parts.year,parts.month,parts.day,parts.hour],["2026","10","31","14"]);
}
console.log("LT312 PASS: relógio regional, autoexemplo e idle com 22 sprites preservados");

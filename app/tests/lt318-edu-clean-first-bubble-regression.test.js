"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const prefix="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const app=fs.readFileSync(prefix+"RaidDayAssistantOverlayService.java","utf8");
const atlas=fs.readFileSync(prefix+"EduSpriteAtlas.java","utf8");
const schedule=fs.readFileSync(prefix+"RaidDaySchedule.java","utf8");

function part(from,to){
  const a=app.indexOf(from),b=app.indexOf(to,a+from.length);
  assert.ok(a>=0&&b>a,"Não foi possível extrair "+from);
  return app.slice(a,b);
}
const balloon=part("private void showEduFirstBubble()","private void showEduWelcome()");
const routing=part("private void updateStep()","private void placePanelCoordinates()");
const state=part("private String eduContextState()","private void reactEdu(");
const ticker=part("private int eduCurrentFrame(","private String eduContextState()");
const time=part("private RaidDayRegionalWindow.Phase eduWelcomePhase()","private void appendEduLink(");
const draw=part("private final class EduSpeechDrawable","private void createPanel()");
const panel=part("private void createPanel()","private void addSettingsButton(");
const open=part("private void setVisible(boolean show)","@Override public void onDestroy()");

// Sessão E01–E11 previamente salva NÃO pode tomar o lugar da primeira fala.
assert.match(routing,/eduFirstBubbleMode=!eduSettingsOpen;/);
assert.doesNotMatch(routing,/eduFirstBubbleMode=!eduSettingsOpen&&!active&&!training/);
assert.match(routing,/else if\(eduFirstBubbleMode\)\{showEduFirstBubble\(\);\}/);
assert.match(state,/if\(eduFirstBubbleMode\)\{/);
assert.ok(state.indexOf("if(eduFirstBubbleMode)")<state.indexOf("if(finished)"),
    "Sprite da fala inicial deve superar a etapa restaurada");
assert.match(ticker,/if\(visible&&eduFirstBubbleMode\)\s*return EduSpriteAtlas\.indexForState\(eduContextState\(\)\)/);
assert.match(routing,/avatarView\.setImageDrawable\(\s*eduSprites\.state\(eduContextState\(\)\)\)/);
assert.match(open,/eduWelcomePage=0;/);
assert.match(open,/eduAnimationName="";\s*eduReactionState="";/);

// O X e o cabeçalho ETAPA antigos não podem existir como views ocultas.
assert.doesNotMatch(panel,/TextView close=button\("×"\)/);
assert.doesNotMatch(panel,/panel\.addView\(header\)/);
assert.doesNotMatch(panel,/nameChip/);
assert.match(panel,/eduPanelHeader=null;/);
assert.match(balloon,/eduActions\.setVisibility\(View\.GONE\)/);
assert.match(balloon,/eduMiniActions\.setVisibility\(View\.GONE\)/);
assert.match(balloon,/eduSettings\.setVisibility\(View\.GONE\)/);

// Não mostrar origem da hora manual, fuso interno ou texto de debug.
for(const forbidden of [
    "Exemplo histórico","relógio Edu","Relógio manual",
    "America/Sao_Paulo","ETAPA","Rever região",
    "Conferir novamente","São Paulo"
]){
  assert.ok(!balloon.includes(forbidden),"Texto poluído na fala: "+forbidden);
}
assert.match(balloon,/appendEduLink\(intro,"Bug dos Passes","bug"\)/);
assert.match(app,/O evento ainda não começou/);
assert.match(balloon,/Infelizmente, o evento já terminou/);
assert.match(balloon,/O evento começou!/);
assert.match(balloon,/eduChecklistText\(true,eduWelcomeStart\(\)\)/);
assert.match(balloon,/eduChecklistText\(false,eduWelcomeStart\(\)\)/);
assert.match(balloon,/eduSubline\.setTextSize\(16\)/);
assert.match(time,/eduSubline\.setText\(eduWelcomeCountdown\(\)\)/);
assert.doesNotMatch(time,/eduWelcomeSource/);
assert.match(time,/eventClock\.instant\(\)\.toEpochMilli\(\)/);
assert.match(app,/handler\.postDelayed\(this,counting\?1000L:5000L\)/);
assert.match(app,/RaidDayRegionalWindow\.Phase phase=eduFirstBubbleMode\?/);

// Chandelure como base se não existe janela válida.
assert.match(app,/if\(!RaidDaySchedule\.valid\(RaidDaySchedule\.start\(this\),\s*RaidDaySchedule\.finish\(this\)\)\)\{/);
assert.match(app,/RaidDayRegionalWindow\.CHANDELURE_DATE/);
assert.match(schedule,/public static boolean valid\(long start,long finish\)/);

// Estados por sprite com prioridade de apresentação.
assert.match(state,/return "evento_nao_comecou"/);
assert.match(state,/return "evento_comecou"/);
assert.match(state,/return "evento_encerrou"/);
assert.match(atlas,/case "evento_nao_comecou": return 38/);
assert.match(atlas,/case "evento_comecou": return 37/);
assert.match(atlas,/case "evento_encerrou": return 36/);
assert.match(draw,/float tip=dp\(28\)/);
assert.match(app,/int gap=5;/);
assert.match(app,/if\(eduSprites!=null\)return EduSpriteAtlas\.SIZES_PX\[avatarSizeIndex\]/);

console.log("LT318 PASS: fala supera sessão antiga, sem X/botões/fuso, sprites 38/37/36 e contador.");

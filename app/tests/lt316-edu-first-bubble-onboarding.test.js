"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const service=fs.readFileSync(path+"RaidDayAssistantOverlayService.java","utf8");
const atlas=fs.readFileSync(path+"EduSpriteAtlas.java","utf8");
const clock=fs.readFileSync(path+"EduEventClock.java","utf8");
const schedule=fs.readFileSync(path+"RaidDaySchedule.java","utf8");
function contains(re,message){assert.match(service,re,message);}

contains(/private int eduWelcomePage=0;/,"Primeiro balão é apresentação");
contains(/else if\(eduFirstBubbleMode\)\{showEduFirstBubble\(\);\}/,
  "Fluxo inicial usa balão único");
contains(/eduPanelHeader\.setVisibility\(View\.GONE\)/,"Sem barra extra");
contains(/eduActions\.setVisibility\(View\.GONE\)/,"Sem botões de respostas");
contains(/eduMiniActions\.setVisibility\(View\.GONE\)/,"Sem botões auxiliares");
contains(/eduMainCard\.setOnClickListener\(v->advanceEduWelcome\(\)\)/,
  "Avança tocando na própria fala");
contains(/eduSpeech\.setOnTouchListener/,"O texto do balão recebe toque");
contains(/appendEduLink\(intro,"Bug dos Passes","bug"\)/,
  "Bug dos Passes sublinhado tem ⓘ");
for(const t of ["softban","regiao","passe"]){
  assert.ok(service.includes('"'+t+'"'),"Infográfico/explicação "+t);
}
contains(/rich\.setSpan\(new UnderlineSpan\(\)/,"Sublinhar títulos informativos");
contains(/rich\.append\(title\)\.append\(" ⓘ"\)/,"ⓘ fica junto ao título");
contains(/eduInfoTopic=topic;\s*updateStep\(\)/,"Abre explicação tocável");
contains(/if\(!eduInfoTopic\.isEmpty\(\)\)\{\s*eduInfoTopic="";\s*updateStep\(\)/,
  "Tocar no balão de informação retorna sem botão");
contains(/eduWelcomePage==1&&\s*eduWelcomePhase\(\)==RaidDayRegionalWindow\.Phase\.ACTIVE/,
  "Estado ativo encaminha ao checklist");
contains(/eduWelcomePhase\(\)==RaidDayRegionalWindow\.Phase\.BEFORE/,
  "Estado anterior mostra checklist e contador");
contains(/phase==RaidDayRegionalWindow\.Phase\.ENDED/,
  "Estado encerrado usa sprite contextual");
contains(/return "evento_nao_comecou"/,"Sprite antes do início");
contains(/return "evento_comecou"/,"Sprite evento iniciado");
contains(/return "evento_encerrou"/,"Sprite evento encerrado");
assert.match(atlas,/case "evento_nao_comecou": return 38/);
assert.match(atlas,/case "evento_comecou": return 37/);
assert.match(atlas,/case "evento_encerrou": return 36/);
contains(/RaidDaySchedule\.phase\(this,eventClock\.instant\(\)\)/,
  "Classificação usa o mesmo relógio");
contains(/RaidDaySchedule\.zone\(this\)/,"Data no fuso do evento");
contains(/eventClock\.instant\(\)\.toEpochMilli\(\)/,
  "Contador usa relógio existente");
contains(/handler\.postDelayed\(this,counting\?1000L:5000L\)/,
  "Contador regressivo atualiza a cada segundo somente quando visível");
contains(/int sublineIndex=countdownFirst\?0:1/,
  "Contador aparece antes do checklist para não ficar oculto");
contains(/eduWelcomePhase\(\)==RaidDayRegionalWindow\.Phase\.BEFORE/,
  "Contador limitado ao evento antes de começar");
contains(/int gap=5; \/\/ distância física/,
  "Ponta do balão tem afastamento de 5px");
contains(/int headHalfWidth=Math\.round\(eduAvatarArtSize\(\)\*\.23f\)/,
  "Distância de 5px calculada a partir da cabeça estimada, não da célula");
contains(/float tip=dp\(28\)/,"Cauda alongada");
contains(/pointerYRatio/,"A ponta segue posição da cabeça");
contains(/private final class EduSpeechDrawable extends Drawable/,
  "Continuar usando a cauda desenhada no mesmo balão");
contains(/if\(eduSprites!=null\)return EduSpriteAtlas\.SIZES_PX\[avatarSizeIndex\]/,
  "Preservar tamanho P/M/G");
assert.match(clock,/public static Clock forEdu\(Context context\)/);
assert.match(schedule,/public static boolean valid\(long start,long finish\)/);
assert.ok(!service.slice(service.indexOf("private void showEduFirstBubble()"),
  service.indexOf("private void showEduWelcome()")).includes("beginRealSession()"),
  "Não iniciar E01-E11 nem presumir passes no primeiro balão");
console.log("LT316: primeiro balão, links ⓘ, checklist, tempo, sprites e UI sem botões PASS");

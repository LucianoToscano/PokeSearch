"use strict";
// LT304 Edu: regressão das reclamações reais de UX no Samsung.
// Confere tamanho, sequência, separação de ajustes, simulação e permissão Android.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const dir=path.join(__dirname,"../src/main");
const load=x=>fs.readFileSync(path.join(dir,x),"utf8");
const java="java/com/lucianotoscano/pokesearchoverlay/";
const overlay=load(java+"RaidDayAssistantOverlayService.java");
const prep=load(java+"RaidDayPreparation.java");
const consent=load(java+"RaidDayCaptureConsentActivity.java");
const arrays=load("res/values/arrays_raid_day.xml");
const steps=JSON.parse(load("assets/roteiro_bug_passes.json")).variantes[0].etapas;
const home=load(java+"MainActivity.java");
assert.match(home,/Edu · Assistente do Dia de Reides/);
assert.match(overlay,/eduPanelHeader=null;/,
  "LT318: o balão não deve criar cabeçalho Edu / ETAPA");
assert.doesNotMatch(overlay,/TextView close=button\("×"\)/,
  "LT318: não construir X na conversa");
assert.match(overlay,/eduSpeech=text/);
assert.match(overlay,/showEduWelcome\(/);
assert.match(overlay,/showEduGuide\(/);
assert.match(overlay,/showEduSettings\(/);
assert.match(overlay,/createPreparationUi\(/);
assert.match(overlay,/setTalk\(/);
assert.match(overlay,/addTwo\(/);
assert.match(overlay,/addThree\(/);
assert.match(overlay,/String\[\] sizeLabels=\{"P","M","G"\}/);
assert.match(overlay,/avatarSizeIndex=1/);
assert.match(overlay,/prefs\.getInt\(RaidDayAvatarFrames\.PREF_SIZE,-1\)/);
assert.match(overlay,/eduSettings\.setVisibility\(View\.VISIBLE\)/);
assert.doesNotMatch(overlay,/menu=button\("⋯"\)/,
  "Configurações não devem aparecer como botão na conversa");
assert.match(overlay,/handler\.postDelayed\(longPress,1200L\)/,
  "Segurar a sprite por 1,2 segundo deve abrir ajustes ocultos");
assert.match(overlay,/eduSettingsOpen=true;\s*eduHelpOpen=false;\s*reactAvatar/,
  "O toque prolongado da sprite deve abrir ajustes, sem avançar roteiro");
assert.match(overlay,/if\(visible\)updateStep\(\);\s*else setVisible\(true\);/,
  "A mesma ação deve funcionar com a conversa aberta ou fechada");
assert.match(overlay,/eduMainCard\.setBackground\(eduSpeechBackground\)/,
  "Fala do Edu deve ser um único balão com cauda integrada");
assert.match(overlay,/eduSpeech=text\("",14,Color\.rgb\(28,35,42\),false\)/,
  "Texto do balão deve ser escuro, legível em branco");
assert.match(overlay,/private final class EduSpeechDrawable extends Drawable/,
  "O balão deve desenhar a cauda no próprio contorno");
assert.match(overlay,/shape\.lineTo\(r,cy\)/,
  "Cauda lateral direita aponta para o treinador");
assert.match(overlay,/shape\.lineTo\(l,cy\)/,
  "Cauda lateral esquerda aponta para o treinador");
assert.doesNotMatch(overlay,/View speechTail=new View\(this\)/,
  "Não criar triângulo separado abaixo do balão");
assert.match(overlay,/eduSettingsOpen=false;\s*try\{wm\.removeView\(panelScroll\);\}/,
  "Reabrir com toque normal deve mostrar conversa, não ajustes");

assert.match(overlay,/eduMainCard\.setVisibility\(View\.GONE\)/);
assert.match(overlay,/eduPanelWidth=Math\.min\(dp\(286\)/);
assert.match(overlay,/\.heightPixels\*\.43f/);
assert.match(overlay,/grip\.setOnTouchListener\(/,
  "A sprite continua arrastável e acessível por toque");
assert.match(overlay,/putInt\("x",bubbleParams\.x\)/,
  "Arrastar o chip deve salvar a posição do treinador");
assert.match(overlay,/putInt\("y",bubbleParams\.y\)/,
  "Arrastar o chip deve salvar a posição vertical do treinador");
assert.doesNotMatch(overlay,/edu_panel_x|edu_panel_y/,
  "O balão flutuante não deve herdar as posições antigas do painel gigante");
assert.match(overlay,/panel\.setBackgroundColor\(Color\.TRANSPARENT\)/,
  "A conversa deve flutuar sem moldura grande escura");
assert.doesNotMatch(overlay,/panel\.setBackground\(surface\(Color\.argb\(145,23,32,42\)/,
  "Fundo antigo de cartão ao redor de todo o diálogo não deve voltar");
assert.match(overlay,/answersLp\.topMargin=dp\(14\)/,
  "Respostas flutuam abaixo do balão e não fazem parte dele");
assert.match(overlay,/b\.setBackground\(surface\(Color\.rgb\(253,253,253\),Color\.rgb\(183,191,199\),22\)\)/,
  "Botões separados em formato de pílula");
assert.doesNotMatch(overlay,/nameChip\.setBackground\(/,
  "LT318: nem chip nem painel gigante em volta da fala");
assert.match(overlay,/void setPointerRight\(boolean right\)/,
  "Mudar lado da cauda conforme o avatar");
assert.match(overlay,/boolean pointsRight=panelParams\.x\+eduPanelWidth\/2</,
  "Cauda deve apontar para a posição atual do treinador");
assert.match(overlay,/int docking=dockLeft\?/,
  "Balão deve ficar ancorado ao lado do treinador, sem herdar posição distante");
assert.match(overlay,/eduPanelWidth=Math\.min\(dp\(286\),Math\.max\(dp\(132\)/,
  "Balão deve adaptar a largura à área ao lado do treinador");
assert.match(overlay,/panelParams\.width=eduPanelWidth/,
  "Largura real da janela deve acompanhar a área livre");
assert.match(overlay,/placePanelCoordinates\(\);\s*placePanel\(\);/,
  "Movimento do sprite deve reposicionar o balão");
assert.match(overlay,/startX\+Math\.round\(dx\)/,
  "O avatar continua arrastável, e a fala o acompanha sem chip");
assert.match(overlay,/eduNote\.isEmpty\(\)\?"":eduNote/,
  "Apresentação não deve ter legenda extra desnecessária");

assert.match(overlay,/panelParams\.alpha=1f/);
// Conversa real, com respostas específicas e sem avanços automáticos.
assert.match(overlay,/Meu nome é Edu\. Serei seu treinador hoje/);
assert.match(overlay,/Está pronto\?/);
assert.match(overlay,/Sim, vamos lá/);
assert.match(overlay,/Agora não/);
assert.match(overlay,/private String eduEventWhen\(\)/);
assert.match(overlay,/RaidDaySchedule\.valid\(begin,end\)/);
assert.match(overlay,/start\.toLocalDate\(\)\.equals\(date\)/,
  "Não atribuir horário de outro evento à data escolhida");
assert.match(overlay,/horário não informado/);
assert.match(overlay,/evento fictício, sem horário definido/);
assert.match(overlay,/STARTED_DAY_D/);
assert.match(overlay,/DAY_CHANGED_TO_EVENT/,
  "Ao chegar o dia D, a sessão da véspera deve oferecer retorno manual para E08");
assert.match(overlay,/navigateEdu\("E08","DAY_CHANGED_TO_EVENT"\)/);
assert.match(overlay,/As etapas da véspera não serão marcadas como concluídas\./);
assert.match(overlay,/paused=true;persist\("PAUSED"\);updateStep\(\);/,
  "A pessoa pode adiar a transição sem perder histórico");

assert.match(overlay,/plan\.indexOf\("E08"\)/,
  "Início no dia D precisa começar na E08, sem retroceder para D−1");
assert.match(overlay,/today\.equals\(date\.minusDays\(1\)\)/);
assert.match(overlay,/today\.equals\(date\)/);
assert.match(overlay,/private void setEduDialogueState\(String state\)/);
assert.match(overlay,/putString\("edu_dialogue_identity"/);
assert.match(overlay,/identity\.equals\(prefs\.getString\("edu_dialogue_identity",""\)\)/,
  "Pergunta intermediária deve ser recuperada quando voltar ao app");
assert.match(overlay,/if\(training\|\|!active\|\|prefs==null\)return;/,
  "Treino nunca salva checkpoint de conversa real");
assert.match(overlay,/private void addEduCoordinateButton\(\)/);
assert.match(overlay,/coordinate\.setOnClickListener\(v->copyEduCoordinates\(\)\)/,
  "Um toque sobre a coordenada deve copiá-la");
assert.match(overlay,/showEduTravel\("Havaí"/);
assert.match(overlay,/showEduNewZealandPass\(step,false\)/);
assert.match(overlay,/showEduNewZealandPass\(step,true\)/);
assert.match(overlay,/travel_reload/);
assert.match(overlay,/travel_wait/);
assert.match(overlay,/nz_check/);
assert.match(overlay,/Sim, já estou/);
assert.match(overlay,/Sim, carregaram/);
assert.match(overlay,/Ainda não/);
assert.match(overlay,/Sim, tenho/);
assert.match(overlay,/Não tenho/);
assert.match(overlay,/Vou conferir/);
assert.match(overlay,/setEduDialogueState\("pass_wait"\)/,
  "Sem passe na véspera não deve avançar");
assert.match(overlay,/advanceEdu\("NO_EVENT_PASS"\)/,
  "Sem passe no dia D segue para a parte final, sem inventar passe");
assert.match(overlay,/navigateEdu\("E11","NO_EVENT_PASS"\)/,
  "Após verificar passe ausente no dia D, permite encerrar");
assert.match(overlay,/case "E01":/);
assert.match(overlay,/case "E02":/);
assert.match(overlay,/case "E05":/);
assert.match(overlay,/case "E08":/);
assert.match(overlay,/case "E09":/);
assert.match(overlay,/case "E11":/);
assert.match(overlay,/eduRecordingExtraRaid=true/);

assert.match(overlay,/private void startDemoToday\(/);
assert.match(overlay,/demoToday=true/);
assert.match(overlay,/EduEventClock\.today\(this\)/);
assert.match(overlay,/training=true/);
assert.match(overlay,/if\(training\)return;/);
assert.match(overlay,/SIMULAÇÃO HOJE/);
assert.match(overlay,/getString\("riskAcceptance"/);
assert.match(overlay,/currentPhaseNote\(/);
assert.match(overlay,/date\.minusDays\(1\)/);
assert.match(overlay,/case "E03":/);
assert.match(overlay,/case "E04":/);
assert.match(overlay,/case "E06":/);
assert.match(overlay,/case "E07":/);
assert.match(overlay,/case "E09":/);
assert.match(overlay,/case "E10":/);
assert.match(overlay,/eduRecordingExtraRaid/);
assert.match(overlay,/Copiar local/);
assert.match(overlay,/Nenhum passe/);
assert.match(overlay,/Sim, tenho/);
assert.match(overlay,/Não tenho/);
assert.match(overlay,/Sim, vou fazer/);
assert.match(overlay,/RaidDayRecovery\.lastConfirmed/);
assert.match(overlay,/bubble\.setVisibility\(View\.GONE\)/);
assert.match(overlay,/setVisible\(false\)/);
assert.match(consent,/ACTION_CONSENT_DONE/);
assert.match(consent,/isChangingConfigurations\(\)/);
assert.match(consent,/startService\(restore\)/);
assert.match(prep,/public static final int COUNT=7/);
assert.doesNotMatch(prep,/preparation_locations/);
assert.doesNotMatch(arrays,/Central Park|Parque Ibirapuera|Pier 39|Honolulu|Outro local/);
assert.equal((arrays.match(/<item>/g)||[]).length,12);
assert.deepEqual(steps.slice(1,7).map(s=>s.periodo),Array(6).fill("D-1"));
assert.deepEqual([steps[1].local,steps[2].local,steps[4].local],
                 ["hawaii","newzealand","hawaii"]);
for(const s of steps)assert.ok(s.falaEdu.startsWith("Edu: "),s.id);
assert.doesNotMatch(overlay,/RaidDayEventClock\.summary\(now\)/,
  "The giant 4-region clock must never be shown in tutorial");
console.log("LT306 Edu PASS: balão de quadrinhos único e solto, ponteiro ao treinador, ações independentes, drag em conjunto e configurações ocultas");

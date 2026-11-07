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
assert.match(overlay,/eduHeader=text\("Edu"/);
assert.match(overlay,/eduSpeech=text/);
assert.match(overlay,/showEduWelcome\(/);
assert.match(overlay,/showEduGuide\(/);
assert.match(overlay,/showEduSettings\(/);
assert.match(overlay,/createPreparationUi\(/);
assert.match(overlay,/setTalk\(/);
assert.match(overlay,/addTwo\(/);
assert.match(overlay,/addThree\(/);
assert.match(overlay,/String\[\] sizeLabels=\{"P","M","G"\}/);
assert.match(overlay,/avatarSizeIndex=2/);
assert.match(overlay,/prefs\.getInt\(RaidDayAvatarFrames\.PREF_SIZE,100\)/);
assert.match(overlay,/eduSettings\.setVisibility\(View\.VISIBLE\)/);
assert.doesNotMatch(overlay,/menu=button\("⋯"\)/,
  "Configurações não devem aparecer como botão na conversa");
assert.match(overlay,/handler\.postDelayed\(longPress,1200L\)/,
  "Segurar a sprite por 1,2 segundo deve abrir ajustes ocultos");
assert.match(overlay,/eduSettingsOpen=true;\s*eduHelpOpen=false;\s*reactAvatar/,
  "O toque prolongado da sprite deve abrir ajustes, sem avançar roteiro");
assert.match(overlay,/if\(visible\)updateStep\(\);\s*else setVisible\(true\);/,
  "A mesma ação deve funcionar com a conversa aberta ou fechada");
assert.match(overlay,/eduMainCard\.setBackground\(surface\(Color\.rgb\(253,253,253\)/,
  "Fala do Edu deve usar balão claro");
assert.match(overlay,/eduSpeech=text\("",14,Color\.rgb\(28,35,42\),false\)/,
  "Texto do balão deve ser escuro, legível em branco");
assert.match(overlay,/View speechTail=new View\(this\)/,
  "Balão precisa ter cauda discreta estilo quadrinhos");
assert.match(overlay,/eduSettingsOpen=false;\s*try\{wm\.removeView\(panelScroll\);\}/,
  "Reabrir com toque normal deve mostrar conversa, não ajustes");

assert.match(overlay,/eduMainCard\.setVisibility\(View\.GONE\)/);
assert.match(overlay,/eduPanelWidth=Math\.min\(dp\(286\)/);
assert.match(overlay,/\.heightPixels\*\.43f/);
assert.match(overlay,/requestDisallowInterceptTouchEvent\(true\)/);
assert.match(overlay,/putInt\("edu_panel_x"/);
assert.match(overlay,/putInt\("edu_panel_y"/);
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
assert.match(overlay,/showEduNewZealand\(step\)/);
assert.match(overlay,/travel_reload/);
assert.match(overlay,/travel_wait/);
assert.match(overlay,/nz_pass/);
assert.match(overlay,/Sim, já estou/);
assert.match(overlay,/Sim, carregaram/);
assert.match(overlay,/Ainda não/);
assert.match(overlay,/Sim, tenho/);
assert.match(overlay,/Não tenho/);
assert.match(overlay,/Vou conferir/);
assert.match(overlay,/setEduDialogueState\("pass_wait"\)/,
  "Sem passe na véspera não deve avançar");
assert.match(overlay,/setEduDialogueState\("no_event_pass"\)/,
  "Sem passe no dia D exige decisão antes de seguir");
assert.match(overlay,/navigateEdu\("E11","NO_PASS"\)/,
  "Sem passe no dia D permite encerrar, sem inventar reide");
assert.match(overlay,/case "E01":/);
assert.match(overlay,/case "E02":/);
assert.match(overlay,/case "E05":/);
assert.match(overlay,/case "E08":/);
assert.match(overlay,/case "E09":/);
assert.match(overlay,/case "E11":/);
assert.match(overlay,/eduRecordingExtraRaid=true/);

assert.match(overlay,/private void startDemoToday\(/);
assert.match(overlay,/demoToday=true/);
assert.match(overlay,/RaidDayEventClock\.todayBrasilia\(eventClock\)/);
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
assert.match(overlay,/Sem passe/);
assert.match(overlay,/Sim, tenho/);
assert.match(overlay,/Não tenho/);
assert.match(overlay,/Registrar reide/);
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
console.log("LT304 Edu PASS: conversa com apresentação e escolhas, E01–E11, passagens e carregamento separados, dia D, coordenadas tocáveis e ajustes ocultos");

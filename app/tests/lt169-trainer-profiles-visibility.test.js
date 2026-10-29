"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const code=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");

// O controle da Home precisa ficar GONE (sem reservar largura) com zero/um treinador.
const refresh=code.slice(code.indexOf("private void refreshSessionSummary()"),
  code.indexOf("private void askLogout()"));
assert.match(refresh,/int profiles=selectableTrainerCount\(prefs\);/);
assert.match(refresh,/trainerSelectButton\.setVisibility\(linked&&profiles>1\?View\.VISIBLE:View\.GONE\)/);
assert.doesNotMatch(refresh,/trainerSelectButton\.setVisibility\(logged\?View\.VISIBLE:View\.GONE\)/);

// A checagem deve usar os perfis vinculados lidos do PoGoCoordinates, nao o numero bruto.
const helper=code.slice(code.indexOf("private static int selectableTrainerCount("),
  code.indexOf("private void showTrainerSelector()"));
assert.match(helper,/profileTrainerList/);
assert.match(helper,/java\.util\.HashSet<String>/);
assert.match(helper,/code\.matches\("\[0-9\]\{12\}"\)/);
assert.match(helper,/name\.matches/);
assert.match(helper,/codes\.add\(code\)/);
assert.match(helper,/return codes\.size\(\);/);
assert.match(helper,/catch\(org\.json\.JSONException e\)\{return 0;\}/);

// Com dois ou mais treinadores distintos a troca normal permanece, sem abrir gerenciar.
const click=code.slice(code.indexOf("trainerSelectButton.setOnClickListener(v->{"),
  code.indexOf("trainerPanel.addView(trainerHeader,sectionLp);"));
assert.match(click,/if\(selectableTrainerCount\(getSharedPreferences\("prefs",0\)\)>1\)/);
assert.match(click,/showTrainerSelector\(\);/);
assert.doesNotMatch(click,/openLoginDialog/);
const chooser=code.slice(code.indexOf("private void showTrainerSelector()"),
  code.indexOf("private void copyTrainerCode()"));
assert.match(chooser,/seenCodes\.add\(code\)/);
assert.match(chooser,/valid\.size\(\)<2\)return;/);
assert.match(chooser,/setSingleChoiceItems/);
assert.match(chooser,/profileSelectedTrainerCode/);
assert.match(chooser,/TRAINER_CHANGED/);
console.log("LT169: 0/1 treinador sem botao nem espaco; 2+ com troca original PASS");

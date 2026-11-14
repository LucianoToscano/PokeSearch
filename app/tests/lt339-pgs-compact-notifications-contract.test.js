"use strict";
// LT339: somente QA estático; nenhuma compilação de APK/release ou teste físico.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const read=name=>fs.readFileSync(root+name+".java","utf8");
const ui=read("PgsAutoMenus");
const engine=read("PgsAutoClickService");
const policy=read("PgsAutoNotificationPolicy");
const quick=read("OverlayQuickMenus");

// Barra única, padrão visual da Pokébola. Sem popup extra nem recursos gerais.
assert.match(ui,/String\[\] icons=\{"⌕","⏱","🔔","↻","×"\}/);
assert.match(ui,/String\[\] descriptions=\{"Buscas","Tempo","Notificações PGS","Reiniciar buscas","Fechar Busca Pokémon"\}/);
assert.match(ui,/Runnable\[\] handlers=\{this::showSearch,this::showTime,this::showNotifications,/);
assert.match(ui,/actions\.retryNow\(\)/);
assert.match(ui,/actions\.closeOverlay\(\)/);
assert.match(ui,/5\*44\+4\*4/);
assert.match(ui,/LinearLayout\.LayoutParams\(dp\(44\),dp\(44\)\)/);
assert.match(ui,/OverlayQuickMenus\.panelColor\(context\)/);
assert.match(quick,/showTone\(/);
assert.doesNotMatch(ui,/showMore\(|••• MAIS|✉ Reportar|♧ Doar|private void report\(|private void donate\(/);
assert.doesNotMatch(ui,/PixSupport\.PAYLOAD/);

// Mesmo fluxo de tom: Padrão/Forte/Mudo/Personalizado + prévia + confirmação.
// A preferência e os canais do PGS são completamente separados de P1/P2.
assert.match(ui,/getSharedPreferences\("pgs_auto_settings_v1",Context\.MODE_PRIVATE\)/);
assert.match(ui,/PgsAutoNotificationPolicy\.NEW/);
assert.match(ui,/PgsAutoNotificationPolicy\.SEARCH/);
assert.match(ui,/PgsAutoNotificationPolicy\.SHINY/);
assert.match(ui,/String\[\] modes=\{"default","strong","mute"\}/);
assert.match(ui,/PokeSoundLibrary\.size\(\)/);
assert.match(ui,/stopTonePreview\(\)/);
assert.match(ui,/Button apply=button\("✓ Usar áudio",12\)/);
assert.match(ui,/actions\.testNotification\(key\)/);
assert.match(ui,/prefs\.edit\(\)\.putString\(key,"custom"\)/);
assert.match(ui,/shinyVibrate/);
assert.doesNotMatch(ui,/getSharedPreferences\("prefs",0\)\.edit\(\)\.putString\("(?:newPokemonSoundUri|favoriteSoundUri)"/);

// Eventos reais separáveis; não transformar um teste local em confirmação Shiny.
assert.match(engine,/private final java\.util\.HashSet<String> notifiedFeedSlots/);
assert.match(engine,/if\(notifiedFeedSlots\.size\(\)<150&&notifiedFeedSlots\.add\(evidence\)\)/);
assert.match(engine,/notifyConfigured\(PgsAutoNotificationPolicy\.NEW,/);
assert.match(engine,/notifyConfigured\(PgsAutoNotificationPolicy\.SEARCH,/);
assert.match(engine,/notifyConfigured\(PgsAutoNotificationPolicy\.SHINY,/);
assert.match(engine,/!PgsAutoNotificationPolicy\.validKind\(type\)/);
assert.match(engine,/testPgsNotification\(String type\)/);
assert.match(engine,/PgsAutoNotificationPolicy\.channelId\(kind,mode,index\)/);
assert.match(engine,/manager\.getNotificationChannel\(channelId\)==null/);
assert.match(engine,/manager\.notify\(PgsAutoNotificationPolicy\.notificationId\(kind\),notification\)/);
assert.doesNotMatch(engine,/playShinySound\(/);
assert.match(engine,/if\(isShiny\)channelId\+=vibrate\?"_vibrate":"_no_vibrate"/);
assert.match(policy,/return "pgs_buscas_"\+kind/);
assert.doesNotMatch(policy,/newPokemonSoundUri|favoriteSoundUri|PREF_FAVORITE_TONE|prefs/);
console.log("LT339 PGS barra/áudio: contratos estáticos OK; Samsung e notificações reais pendentes");

"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const alerts=read("java/com/lucianotoscano/pokesearchoverlay/WatchAlerts.java");
const tone=read("java/com/lucianotoscano/pokesearchoverlay/OverlayQuickMenus.java");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const sounds=read("java/com/lucianotoscano/pokesearchoverlay/PokeSoundLibrary.java");
let checks=0;function test(message,fn){fn();checks++;console.log("PASS LT106 "+message);}
test("favorites use new v3 tone-specific Android channels instead of stale immutable v1/v2",()=>{
 const x=alerts.split("public static String soundChannelId(")[1].split("public static void ensureChannel(",1)[0];
 assert.match(x,/pokesearch_fav_sound_v3_/);
 assert.match(x,/Uri sound=selectedTone\(context,true,species\)/);
 assert.match(x,/Integer\.toHexString\(key\.hashCode\(\)\)/);
 assert.ok(!x.includes('return favorite?CHANNEL_ID'));
});
test("ordinary favorites share channel; different individual tones remain independent",()=>{
 assert.match(alerts,/String key=sound\.toString\(\)/);
 assert.match(alerts,/if\(!own\.isEmpty\(\)\)key=normalized\(species\)\+"\|"\+key/);
 assert.match(alerts,/PREF_SPECIES_TONES/);
 assert.match(alerts,/PREF_FAVORITE_TONE/);
});
test("notification channels stay under Android permission, mute, and DND controls",()=>{
 assert.match(alerts,/if\(!permissionGranted\(context\)\)/);
 assert.match(alerts,/if\("off"\.equals\(soundMode\)\)/);
 assert.match(alerts,/boolean quiet="silent"\.equals\(soundMode\)/);
 assert.match(alerts,/getImportance\(\)==NotificationManager\.IMPORTANCE_NONE/);
 assert.match(alerts,/if\(!quiet&&current\.getSound\(\)==null\)/);
 assert.match(alerts,/channel\.setSound\(selectedTone\(context,true,species\)/);
});
test("favorites custom BR audio is retained, app tests an actual notification",()=>{
 assert.match(sounds,/favoriteDefaultUri\(Context context\)/);
 assert.match(alerts,/PokeSoundLibrary\.favoriteDefaultUri\(context\)/);
 assert.match(tone,/Button testSound=button\(context,"🔔 Testar notificação de favorito"\)/);
 assert.match(tone,/boolean delivered=WatchAlerts\.test\(context\)/);
 assert.match(tone,/WatchAlerts\.soundDiagnostic\(context\)/);
 assert.match(tone,/if\("favorites"\.equals\(target\)\)/);
});
test("diagnosis disambiguates permission, OFF, silent, system channel and muted notification volume",()=>{
 assert.match(alerts,/Permita as notificações do PokeSearch/);
 assert.match(alerts,/Ative Som em Pokémon Favoritos/);
 assert.match(alerts,/Favoritos está em Sem som/);
 assert.match(alerts,/Canal de Favoritos bloqueado pelo Android/);
 assert.match(alerts,/getStreamVolume\(android\.media\.AudioManager\.STREAM_NOTIFICATION\)==0/);
 assert.match(alerts,/recordAlertProblem\(context/);
});
test("favorites send real confirmed spawn alerts without bypassing verification",()=>{
 assert.match(service,/WatchAlerts\.matches\(c\.optString\("name",""\),wanted\)/);
 assert.match(service,/verifiedTargetCriteria\(c\)/);
 assert.match(service,/WatchAlerts\.match\(this,pending\.name,pending\.title,pending\.details/);
 assert.match(service,/expiresAtMs/);
});
test("secondary foreground ID 74 no longer collides with general notification ID",()=>{
 assert.match(service,/startForeground\(isSecondaryOverlay\(\)\?74:73,note\)/);
 assert.match(service,/NEXT_GENERAL_ALERT_ID\.updateAndGet/);
 assert.match(service,/sent\?"Teste de Favoritos enviado · "\+diagnostic:diagnostic/);
});
console.log("LT106 Favorites audio "+checks+"/"+checks+" PASS");

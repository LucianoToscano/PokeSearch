const fs=require('fs'),assert=require('assert');
const base='app/src/main/java/com/lucianotoscano/pokesearchoverlay/';
const service=fs.readFileSync(base+'PgsharpLocationAccessibilityService.java','utf8');
const home=fs.readFileSync(base+'MainActivity.java','utf8');
const overlay=fs.readFileSync(base+'OverlayService.java','utf8');
assert(service.includes('AccessibilityNodeInfo root=event.getSource()'),
 'PGSharp source must prefer the matching game event, not the active PokeSearch overlay');
assert(service.includes('GAME_PACKAGE.contentEquals(candidate.getPackageName())'),
 'Fallback window must be verified as the Pokémon GO package');
assert(service.includes('getSharedPreferences(DIAGNOSTICS_PREFS,MODE_PRIVATE)'),
 'Diagnostic counters must remain local');
for(const k of ['"lastEventAt"','"nodes"','"texts"','"connected"','"lastValidAt"']){
 assert(service.includes(k),'Missing evidence marker '+k);
 assert(home.includes(k),'Missing Home diagnostics '+k);
}
assert(!service.includes('putString("raw'), 'Do not persist screen text');
assert(overlay.includes('PGSHARP_POSITION')&&overlay.includes('lastPgsharpAutoSearchAtMs'),
 'Keep the same P1/P2 source and debounce');
console.log('LT198 PGSharp accessibility source and non-sensitive diagnostics PASS');

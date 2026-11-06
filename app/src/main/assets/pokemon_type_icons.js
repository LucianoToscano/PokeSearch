/* LT266: 18 official user-supplied type icons; originals stored as offline PNG assets.
 * Source: Google Drive folder 1_V-_a_ShpYE_tzXERwVqAk2LRRPXd0IN.
 * Paths are relative to detail.html and work with APK asset origin and signed OTA.
 * API type enums stay unchanged. No network, base64 heap or type inference here.
 */
(function(root){"use strict";
 const types=["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"];
 const icons={};
 for(const name of types)icons[name]="ui-icons/type-"+name+"-lt266.png";
 root.PokeSearchTypeIcons=Object.freeze(icons);
})(typeof window!=="undefined"?window:globalThis);

/* LT255: offline family graph mirrored from the exact PVP_EVO_LINKS in
 * dock.html (463 links, 2026-11-05). Test asserts graph equality on every
 * change. This is only a CP calculator form selector, not proof of Pokémon GO
 * evolution eligibility, costume legality, Mega GBL entry or resource costs.
 */
(function(root,factory){"use strict";
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.PokeSearchPvpFamilyCatalog=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const links=[["Bulbasaur","Ivysaur"],["Ivysaur","Venusaur"],["Charmander","Charmeleon"],["Charmeleon","Charizard"],["Squirtle","Wartortle"],["Wartortle","Blastoise"],["Caterpie","Metapod"],["Metapod","Butterfree"],["Weedle","Kakuna"],["Kakuna","Beedrill"],["Pidgey","Pidgeotto"],["Pidgeotto","Pidgeot"],["Rattata","Raticate"],["Spearow","Fearow"],["Ekans","Arbok"],["Pichu","Pikachu"],["Pikachu","Raichu"],["Sandshrew","Sandslash"],["Nidoran Female","Nidorina"],["Nidorina","Nidoqueen"],["Nidoran Male","Nidorino"],["Nidorino","Nidoking"],["Cleffa","Clefairy"],["Clefairy","Clefable"],["Vulpix","Ninetales"],["Igglybuff","Jigglypuff"],["Jigglypuff","Wigglytuff"],["Zubat","Golbat"],["Oddish","Gloom"],["Gloom","Vileplume"],["Paras","Parasect"],["Venonat","Venomoth"],["Diglett","Dugtrio"],["Meowth","Persian"],["Psyduck","Golduck"],["Mankey","Primeape"],["Growlithe","Arcanine"],["Poliwag","Poliwhirl"],["Poliwhirl","Poliwrath"],["Abra","Kadabra"],["Kadabra","Alakazam"],["Machop","Machoke"],["Machoke","Machamp"],["Bellsprout","Weepinbell"],["Weepinbell","Victreebel"],["Tentacool","Tentacruel"],["Geodude","Graveler"],["Graveler","Golem"],["Ponyta","Rapidash"],["Slowpoke","Slowbro"],["Magnemite","Magneton"],["Doduo","Dodrio"],["Seel","Dewgong"],["Grimer","Muk"],["Shellder","Cloyster"],["Gastly","Haunter"],["Haunter","Gengar"],["Drowzee","Hypno"],["Krabby","Kingler"],["Voltorb","Electrode"],["Exeggcute","Exeggutor"],["Cubone","Marowak"],["Tyrogue","Hitmonlee"],["Tyrogue","Hitmonchan"],["Koffing","Weezing"],["Rhyhorn","Rhydon"],["Happiny","Chansey"],["Horsea","Seadra"],["Goldeen","Seaking"],["Staryu","Starmie"],["Smoochum","Jynx"],["Elekid","Electabuzz"],["Magby","Magmar"],["Magikarp","Gyarados"],["Eevee","Vaporeon"],["Eevee","Jolteon"],["Eevee","Flareon"],["Omanyte","Omastar"],["Kabuto","Kabutops"],["Munchlax","Snorlax"],["Dratini","Dragonair"],["Dragonair","Dragonite"],["Chikorita","Bayleef"],["Bayleef","Meganium"],["Cyndaquil","Quilava"],["Quilava","Typhlosion"],["Totodile","Croconaw"],["Croconaw","Feraligatr"],["Sentret","Furret"],["Hoothoot","Noctowl"],["Ledyba","Ledian"],["Spinarak","Ariados"],["Golbat","Crobat"],["Chinchou","Lanturn"],["Togepi","Togetic"],["Natu","Xatu"],["Mareep","Flaaffy"],["Flaaffy","Ampharos"],["Gloom","Bellossom"],["Azurill","Marill"],["Marill","Azumarill"],["Bonsly","Sudowoodo"],["Poliwhirl","Politoed"],["Hoppip","Skiploom"],["Skiploom","Jumpluff"],["Sunkern","Sunflora"],["Wooper","Quagsire"],["Eevee","Espeon"],["Eevee","Umbreon"],["Slowpoke","Slowking"],["Wynaut","Wobbuffet"],["Pineco","Forretress"],["Onix","Steelix"],["Snubbull","Granbull"],["Scyther","Scizor"],["Teddiursa","Ursaring"],["Slugma","Magcargo"],["Swinub","Piloswine"],["Remoraid","Octillery"],["Mantyke","Mantine"],["Houndour","Houndoom"],["Seadra","Kingdra"],["Phanpy","Donphan"],["Porygon","Porygon2"],["Tyrogue","Hitmontop"],["Chansey","Blissey"],["Larvitar","Pupitar"],["Pupitar","Tyranitar"],["Treecko","Grovyle"],["Grovyle","Sceptile"],["Torchic","Combusken"],["Combusken","Blaziken"],["Mudkip","Marshtomp"],["Marshtomp","Swampert"],["Poochyena","Mightyena"],["Zigzagoon","Linoone"],["Wurmple","Silcoon"],["Silcoon","Beautifly"],["Wurmple","Cascoon"],["Cascoon","Dustox"],["Lotad","Lombre"],["Lombre","Ludicolo"],["Seedot","Nuzleaf"],["Nuzleaf","Shiftry"],["Taillow","Swellow"],["Wingull","Pelipper"],["Ralts","Kirlia"],["Kirlia","Gardevoir"],["Surskit","Masquerain"],["Shroomish","Breloom"],["Slakoth","Vigoroth"],["Vigoroth","Slaking"],["Nincada","Ninjask"],["Nincada","Shedinja"],["Whismur","Loudred"],["Loudred","Exploud"],["Makuhita","Hariyama"],["Skitty","Delcatty"],["Aron","Lairon"],["Lairon","Aggron"],["Meditite","Medicham"],["Electrike","Manectric"],["Budew","Roselia"],["Gulpin","Swalot"],["Carvanha","Sharpedo"],["Wailmer","Wailord"],["Numel","Camerupt"],["Spoink","Grumpig"],["Trapinch","Vibrava"],["Vibrava","Flygon"],["Cacnea","Cacturne"],["Swablu","Altaria"],["Barboach","Whiscash"],["Corphish","Crawdaunt"],["Baltoy","Claydol"],["Lileep","Cradily"],["Anorith","Armaldo"],["Feebas","Milotic"],["Shuppet","Banette"],["Duskull","Dusclops"],["Chingling","Chimecho"],["Snorunt","Glalie"],["Spheal","Sealeo"],["Sealeo","Walrein"],["Clamperl","Huntail"],["Clamperl","Gorebyss"],["Bagon","Shelgon"],["Shelgon","Salamence"],["Beldum","Metang"],["Metang","Metagross"],["Turtwig","Grotle"],["Grotle","Torterra"],["Chimchar","Monferno"],["Monferno","Infernape"],["Piplup","Prinplup"],["Prinplup","Empoleon"],["Starly","Staravia"],["Staravia","Staraptor"],["Bidoof","Bibarel"],["Kricketot","Kricketune"],["Shinx","Luxio"],["Luxio","Luxray"],["Roselia","Roserade"],["Cranidos","Rampardos"],["Shieldon","Bastiodon"],["Combee","Vespiquen"],["Buizel","Floatzel"],["Shellos","Gastrodon"],["Aipom","Ambipom"],["Drifloon","Drifblim"],["Buneary","Lopunny"],["Misdreavus","Mismagius"],["Murkrow","Honchkrow"],["Glameow","Purugly"],["Stunky","Skuntank"],["Bronzor","Bronzong"],["Gible","Gabite"],["Gabite","Garchomp"],["Riolu","Lucario"],["Hippopotas","Hippowdon"],["Skorupi","Drapion"],["Croagunk","Toxicroak"],["Finneon","Lumineon"],["Snover","Abomasnow"],["Sneasel","Weavile"],["Magneton","Magnezone"],["Lickitung","Lickilicky"],["Rhydon","Rhyperior"],["Tangela","Tangrowth"],["Electabuzz","Electivire"],["Magmar","Magmortar"],["Togetic","Togekiss"],["Yanma","Yanmega"],["Eevee","Leafeon"],["Eevee","Glaceon"],["Gligar","Gliscor"],["Piloswine","Mamoswine"],["Porygon2","Porygon-Z"],["Kirlia","Gallade"],["Nosepass","Probopass"],["Dusclops","Dusknoir"],["Snorunt","Froslass"],["Snivy","Servine"],["Servine","Serperior"],["Tepig","Pignite"],["Pignite","Emboar"],["Oshawott","Dewott"],["Dewott","Samurott"],["Patrat","Watchog"],["Lillipup","Herdier"],["Herdier","Stoutland"],["Purrloin","Liepard"],["Pansage","Simisage"],["Pansear","Simisear"],["Panpour","Simipour"],["Munna","Musharna"],["Pidove","Tranquill"],["Tranquill","Unfezant"],["Blitzle","Zebstrika"],["Roggenrola","Boldore"],["Boldore","Gigalith"],["Woobat","Swoobat"],["Drilbur","Excadrill"],["Timburr","Gurdurr"],["Gurdurr","Conkeldurr"],["Tympole","Palpitoad"],["Palpitoad","Seismitoad"],["Sewaddle","Swadloon"],["Swadloon","Leavanny"],["Venipede","Whirlipede"],["Whirlipede","Scolipede"],["Cottonee","Whimsicott"],["Petilil","Lilligant"],["Sandile","Krokorok"],["Krokorok","Krookodile"],["Dwebble","Crustle"],["Scraggy","Scrafty"],["Yamask","Cofagrigus"],["Tirtouga","Carracosta"],["Archen","Archeops"],["Trubbish","Garbodor"],["Zorua","Zoroark"],["Minccino","Cinccino"],["Gothita","Gothorita"],["Gothorita","Gothitelle"],["Solosis","Duosion"],["Duosion","Reuniclus"],["Ducklett","Swanna"],["Vanillite","Vanillish"],["Vanillish","Vanilluxe"],["Deerling","Sawsbuck"],["Karrablast","Escavalier"],["Foongus","Amoonguss"],["Frillish","Jellicent"],["Joltik","Galvantula"],["Ferroseed","Ferrothorn"],["Klink","Klang"],["Klang","Klinklang"],["Tynamo","Eelektrik"],["Eelektrik","Eelektross"],["Elgyem","Beheeyem"],["Litwick","Lampent"],["Lampent","Chandelure"],["Axew","Fraxure"],["Fraxure","Haxorus"],["Cubchoo","Beartic"],["Shelmet","Accelgor"],["Mienfoo","Mienshao"],["Golett","Golurk"],["Pawniard","Bisharp"],["Rufflet","Braviary"],["Vullaby","Mandibuzz"],["Deino","Zweilous"],["Zweilous","Hydreigon"],["Larvesta","Volcarona"],["Chespin","Quilladin"],["Quilladin","Chesnaught"],["Fennekin","Braixen"],["Braixen","Delphox"],["Froakie","Frogadier"],["Frogadier","Greninja"],["Bunnelby","Diggersby"],["Fletchling","Fletchinder"],["Fletchinder","Talonflame"],["Scatterbug","Spewpa"],["Spewpa","Vivillon"],["Litleo","Pyroar"],["Flabebe","Floette"],["Floette","Florges"],["Skiddo","Gogoat"],["Pancham","Pangoro"],["Honedge","Doublade"],["Spritzee","Aromatisse"],["Swirlix","Slurpuff"],["Inkay","Malamar"],["Binacle","Barbaracle"],["Skrelp","Dragalge"],["Clauncher","Clawitzer"],["Helioptile","Heliolisk"],["Tyrunt","Tyrantrum"],["Amaura","Aurorus"],["Eevee","Sylveon"],["Goomy","Sliggoo"],["Sliggoo","Goodra"],["Phantump","Trevenant"],["Bergmite","Avalugg"],["Noibat","Noivern"],["Rowlet","Dartrix"],["Dartrix","Decidueye"],["Litten","Torracat"],["Torracat","Incineroar"],["Popplio","Brionne"],["Brionne","Primarina"],["Pikipek","Trumbeak"],["Trumbeak","Toucannon"],["Yungoos","Gumshoos"],["Grubbin","Charjabug"],["Charjabug","Vikavolt"],["Crabrawler","Crabominable"],["Cutiefly","Ribombee"],["Mareanie","Toxapex"],["Mudbray","Mudsdale"],["Dewpider","Araquanid"],["Fomantis","Lurantis"],["Morelull","Shiinotic"],["Salandit","Salazzle"],["Stufful","Bewear"],["Bounsweet","Steenee"],["Steenee","Tsareena"],["Wimpod","Golisopod"],["Sandygast","Palossand"],["Jangmo-o","Hakamo-o"],["Hakamo-o","Kommo-o"],["Cosmog","Cosmoem"],["Cosmoem","Solgaleo"],["Cosmoem","Lunala"],["Poipole","Naganadel"],["Meltan","Melmetal"],["Grookey","Thwackey"],["Thwackey","Rillaboom"],["Scorbunny","Raboot"],["Raboot","Cinderace"],["Sobble","Drizzile"],["Drizzile","Inteleon"],["Skwovet","Greedent"],["Rookidee","Corvisquire"],["Corvisquire","Corviknight"],["Blipbug","Dottler"],["Dottler","Orbeetle"],["Nickit","Thievul"],["Gossifleur","Eldegoss"],["Wooloo","Dubwool"],["Chewtle","Drednaw"],["Yamper","Boltund"],["Rolycoly","Carkol"],["Carkol","Coalossal"],["Applin","Flapple"],["Applin","Appletun"],["Silicobra","Sandaconda"],["Arrokuda","Barraskewda"],["Toxel","Toxtricity"],["Sizzlipede","Centiskorch"],["Clobbopus","Grapploct"],["Sinistea","Polteageist"],["Hatenna","Hattrem"],["Hattrem","Hatterene"],["Impidimp","Morgrem"],["Morgrem","Grimmsnarl"],["Milcery","Alcremie"],["Snom","Frosmoth"],["Cufant","Copperajah"],["Dreepy","Drakloak"],["Drakloak","Dragapult"],["Stantler","Wyrdeer"],["Scyther","Kleavor"],["Ursaring","Ursaluna"],["Sprigatito","Floragato"],["Floragato","Meowscarada"],["Fuecoco","Crocalor"],["Crocalor","Skeledirge"],["Quaxly","Quaxwell"],["Quaxwell","Quaquaval"],["Lechonk","Oinkologne"],["Tarountula","Spidops"],["Nymble","Lokix"],["Pawmi","Pawmo"],["Pawmo","Pawmot"],["Tandemaus","Maushold"],["Fidough","Dachsbun"],["Smoliv","Dolliv"],["Dolliv","Arboliva"],["Nacli","Naclstack"],["Naclstack","Garganacl"],["Charcadet","Armarouge"],["Charcadet","Ceruledge"],["Tadbulb","Bellibolt"],["Wattrel","Kilowattrel"],["Maschiff","Mabosstiff"],["Shroodle","Grafaiai"],["Bramblin","Brambleghast"],["Toedscool","Toedscruel"],["Capsakid","Scovillain"],["Rellor","Rabsca"],["Flittle","Espathra"],["Tinkatink","Tinkatuff"],["Tinkatuff","Tinkaton"],["Wiglett","Wugtrio"],["Finizen","Palafin"],["Varoom","Revavroom"],["Glimmet","Glimmora"],["Greavard","Houndstone"],["Cetoddle","Cetitan"],["Primeape","Annihilape"],["Girafarig","Farigiraf"],["Dunsparce","Dudunsparce"],["Bisharp","Kingambit"],["Frigibax","Arctibax"],["Arctibax","Baxcalibur"],["Gimmighoul","Gholdengo"],["Applin","Dipplin"],["Poltchageist","Sinistcha"],["Duraludon","Archaludon"],["Dipplin","Hydrapple"]];
 const normalized=value=>String(value||"").normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").trim().toLowerCase().replace(/\s+/g," ");
 const forward=new Map(),reverse=new Map();
 for(const [from,to] of links){
  const a=normalized(from),b=normalized(to);
  if(!forward.has(a))forward.set(a,[]);
  if(!reverse.has(b))reverse.set(b,[]);
  forward.get(a).push(b);
  reverse.get(b).push(a);
 }
 function family(rawName,gm,allowMegas=true){
  if(!gm||!Array.isArray(gm.pokemon)||!Array.isArray(gm.cpms))return [];
  const name=normalized(rawName);
  const verified=new Map();
  for(const row of gm.pokemon){
   if(!Array.isArray(row)||row.length<5||
      !row.slice(2,5).every(n=>Number.isFinite(n)&&n>0))continue;
   verified.set(normalized(row[1]),String(row[1]));
  }
  // No guessed base forms for event, regional, shadow or unknown identities.
  if(!verified.has(name)||name.includes("("))return [];
  const queue=[name],seen=new Set([name]);
  while(queue.length&&seen.size<40){
   const now=queue.shift();
   for(const candidate of [...(forward.get(now)||[]),...(reverse.get(now)||[])]){
    if(seen.has(candidate)||!verified.has(candidate))continue;
    seen.add(candidate);queue.push(candidate);
   }
  }
  const base=[...seen].map(k=>verified.get(k)).filter(Boolean);
  const megas=[];
  if(allowMegas){
   for(const n of base){
    for(const label of [n+" (Mega)",n+" (Mega X)",n+" (Mega Y)"]){
     if(verified.has(normalized(label)))megas.push(verified.get(normalized(label)));
    }
   }
  }
  return [...base,...megas].slice(0,36);
 }
 /* LT291: panel order reflects the VERIFIED evolutionary chain, never the
  * IV rank or general meta rank. Keep original order for branches at the
  * same stage; unknown forms remain in original order rather than guessing.
  * This only reorders display rows, and never changes rank calculations.
  */
 function orderEvolutionRows(currentName,entries){
  const rows=Array.isArray(entries)?entries.slice():[];
  const key=normalized(currentName);
  if(!key||key.includes("(")||!forward.has(key))return rows;
  const distance=new Map([[key,0]]),queue=[key];
  while(queue.length&&distance.size<60){
   const from=queue.shift();
   for(const to of forward.get(from)||[]){
    if(distance.has(to))continue;
    distance.set(to,distance.get(from)+1);
    queue.push(to);
   }
  }
  return rows.map((row,index)=>({row,index,
   stage:distance.get(normalized(row?.name))??Infinity}))
   .sort((a,b)=>a.stage-b.stage||a.index-b.index)
   .map(({row})=>row);
 }
 return Object.freeze({family,links,orderEvolutionRows});
});

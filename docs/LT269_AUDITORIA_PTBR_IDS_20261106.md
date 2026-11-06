# PokeSearch LT269 — Correção conservadora de nomes PT-BR offline

Data: 06/11/2026. Origem: revisão pós-release da LT268 e cinco divergências verificadas no fallback offline.

## Evidência
Fonte canônica *já fixada no PokeSearch*: WatWowMap/pogo-data-api commit `31a3bcdc2e412f315c4be2bb593807f45cb9bd9b`, `data/v1/moves.json` (proto + moveId), `data/v1/translations/pt-br/moves.json` (move_<id>).

| proto | moveId | nome PT-BR confirmado | mudança |
| --- | ---: | --- | --- |
| AIR_SLASH_FAST | 255 | Golpe de Ar | substitui Golpe Aéreo |
| THUNDER_SHOCK_FAST | 205 | Trovoada de Choques | substitui Choque do Trovão |
| DRAGON_BREATH_FAST | 204 | Sopro do Dragão | substitui Sopro de Dragão |
| WATER_GUN_FAST | 230 | Revólver d'Água | substitui Jato d'Água |
| DRAGON_TAIL_FAST | 253 | Cauda do Dragão | substitui Cauda de Dragão |
| GUST_FAST | 345 | Lufada de Vento | adiciona fallback offline |
| INCINERATE_FAST | 346 | Incinerar | adiciona fallback offline |
| FLAME_CHARGE | 101 | Ataque de Chamas | adiciona fallback offline |
| FEATHER_DANCE | 348 | Dança das Penas | adiciona fallback offline |
| HURRICANE | 122 | Furacão | adiciona fallback offline |

## Escopo
Somente `app/src/main/assets/pve_moves_ptbr.js` e testes, notas de release e solicitação de nova APK (versionCode monotônico). PvPoke, ataques recomendados por espécie, ranks, IV/PC, status Elite/legado por ID canônico e fonte online continuam intactos. A tradução offline só ocorre quando o próprio ID enviado/capturado coincide; **não** atribuir novos golpes a espécies por dedução.

Teste novo `app/tests/lt269-ptbr-offline-go-ids.test.js` cobra as 10 correspondências, moveId documentado, parsing Ágil/Carregado, desconhecido neutro, vínculo por ID no card e histórico de versão. Regressões Node, Java, visual P/M/G, OTA, PvE, build e assinatura devem ser confirmadas na CI, além da release e SHA-256 após aprovação.

**QA física Samsung não executada.** LT268 publicada segue rollback. Não afirmar versão LT269 publicada antes de evidência do GitHub.

## CI: contrato histórico de versão compatível com nova release
O gate core sinalizou que o teste histórico LT268 exigia `req.code===54472` mesmo depois da solicitação LT269. O teste foi corrigido para exigir **versionCode pelo menos 54472 e incremento exato de 1 em relação à tag anterior**, preservando a verificação de versão sem bloquear upgrades válidos.

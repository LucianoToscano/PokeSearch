# LT277 — Ordenação em português BR e limites da opção "menor" (06/11/2026)

## Reporte real no Samsung
Print de PokeSearch `Filtro → Ordenar` mostra valores `Despawn (longest)`, `CP (highest)`, `IV % (highest)`, `Level (highest)`, `Distance (nearest)` em inglês. Usuário quer os rótulos traduzidos e pergunta se a busca consegue ordenar pelo menor valor.

## Contrato confirmado
- O módulo `api_result_contract.js` aceita apenas `DSP`, `CP`, `IV`, `LEVEL`, `DISTANCE`. Os valores ingleses são os identificadores do seletor oficial do site, em vez de conteúdo de interface.
- A busca da fonte oferece PC, IV%, nível e tempo restante com as ordenações conhecidas; distância é **mais próxima** com localização válida. A API não tem ordenação crescente global confirmada. **Não** enviar `CP_ASC`, `IV_ASC`, `LEVEL_ASC`, `sort_direction` ou `CP (lowest)` sem contrato verificado; não inverter os 10 cartões e alegar encontrar os menores globalmente.
- Os filtros `cp_max`, `level_max` e modo `percent` com `iv_percent_max` permitem selecionar Pokémon de valores baixos de verdade, mas não garantem ordem crescente global.

## Ajuste da interface
No menu `Ordenar`, renderizar **somente** os rótulos:
- `Despawn (longest)` → **Tempo restante (maior)**
- `CP (highest)` → **PC (maior)**
- `IV % (highest)` → **IV % (maior)**
- `Level (highest)` → **Nível (maior)**
- `Distance (nearest)` → **Distância (mais perto)**

Mesmo mapeamento nos editores laterais e secundários, mantendo valor em inglês somente no estado/na API para evitar falha do provedor. Preservar localização automática, filtros por modo, persistência e duas Pokébolas.

## Validação
Teste `lt277-sort-ptbr-provider-safe.test.js` verifica rótulos, opções oficiais inalteradas, rejeição de ordenação ascendente inventada e busca com intervalos de máximo. Gate visual P/M/G e QA Node/Android via CI ainda exigidos antes de merge ou release. Teste físico Samsung da tradução pendente.

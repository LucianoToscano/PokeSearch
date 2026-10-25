# LT77 — Referência da API recebida em 24/10/2026: conferência documental e lacunas

**Natureza do material:** documento `pogo.md`, fornecido pelo proprietário do PokeSearch nesta conversa, acompanhado da declaração de autorização para uso da API PoGo Coordinates. O documento descreve levantamento de 14/10/2026 por inspeção dos bundles do frontend e testes com `curl` por seu autor. **A origem formal, limites da autorização e resultados não foram verificados independentemente pelo PokeSearch.** Não apresentar esta análise como homologação do servidor, documentação oficial assinada pelo fornecedor ou validação no Samsung.

**Preservação de confidencialidade:** este documento de auditoria é um **extrato técnico sanitizado**, não uma cópia de `pogo.md`. O anexo original contém identificadores de uma conta de teste, exemplos de autenticação e dados individuais; seu conteúdo bruto, segredos, JWT, IDs de contas, emails, trainer codes, OAuth codes e URLs com `reveal_code` **não** serão commitados nem incluídos no pacote público do GitHub. Se um JWT de teste aparentemente não expira, a recomendação é tratá-lo como segredo até sua revogação. O resumo mantém apenas esquemas, nomes de campos e rotas necessárias para auditoria.

## 1. Endpoints descritos pelo anexo (não testados agora)
- `POST /search`: busca Pokémon selvagens; Bearer opcional conforme documento; resposta `{results,tier,cap,total_matches}`.
- `GET /reveal/{reveal_code}`: recebe código opaco de um resultado e retorna, conforme amostra **sanitizada**, `{"coords":"<lat>,<lng>","lat":<número>,"lng":<número>}`; Bearer descrito como opcional, com cotas possivelmente diferentes. Um HTTP GET live não foi realizado aqui.
- `GET /health`: `{"status":"ok"}` segundo o documento.
- `GET /pokemon/catalog?costumes=true`, `GET /forms`, `GET /backgrounds`: catálogos e metadados; `/pokemon/catalog` e `/forms` citam cache de 300 segundos.
- `GET /users/me` e `GET /trainer`: autenticação e vínculo de treinador; apenas as operações de leitura devem entrar em protótipos sem consentimento adicional.
- `POST /map/lookup`: mapa por bounding box. Pokémon retorna `apx_lat/apx_long` aproximadas; coordenadas exatas continuam descritas em `/reveal`. Os nomes de filtros do mapa **não são iguais** aos de `/search`.
- Outras rotas descritas: `POST /raids/search`, `/quests/search`, `/weather/search`, `/rocket/search`, `/powerspots/search`; `GET /feeds/{slug}`, `/raids/pokemons`, `/quests/catalog-pairs`, `/rocket/types`, `/powerspots/pokemons`, `/shiny-rates`, `/nests/pokemon`; recursos autenticados `/filters`, `/custom-feeds`, `/notification-rules`, `/local-area`, `/trainer/lookup`, `/trainer/confirm`.
- **Não experimentar** operações destrutivas ou permanentes na auditoria: `DELETE /users/me`, remoção/vínculo OAuth e `POST /trainer/confirm`. A documentação afirma que a vinculação do treinador é permanente.

## 2. Autenticação, segurança e cotas (alegações do anexo)
- O site usa JWT em `localStorage["jwt"]` de `https://pogocoordinates.com`; Bearer opcional em buscas públicas e obrigatório em rotas da conta. O anexo diz que JWT HS256 de uma conta de teste não inclui `exp`. Isso requer tratamento especialmente cuidadoso: não extrair/circular/armazenar JWT no Android, relatórios, logs ou repositórios; não presumir que logout revogue um JWT no servidor.
- O documento aponta CORS permitindo `https://pogocoordinates.com` e cabeçalhos `authorization,content-type`. A execução futura na WebView precisa conferir o CORS atual e usar sessão legítima; não contornar controles.
- `cap` informado: 5 resultados para visitante, 10 para conta free autenticada e 25+ para VIP. **O PokeSearch continua limitado a 10 cartões mesmo quando o serviço oferece mais**. As cotas e privilégios de cada plano não podem ser contornados.
- Erros: `400` entrada inválida/reveal code; `401` token rejeitado; `403` VIP/trainer não vinculado/conta Shiny indisponível; `404/410` Pokémon expirado no reveal; `422` validação e ausência de Bearer em endpoints protegidos; `429` limite com `Retry-After`; `503` trainer lookup ocupado.
- O anexo alerta que enums inválidos podem falhar silenciosamente (`sort` cair no default, `sizes` retornar busca vazia). Validar valores estritamente **antes** da requisição e nunca chamar resultado de pesquisa exata sem conferir o payload enviado.

## 3. Campos confirmados apenas pela documentação recebida — `POST /search`

| Área | Campos e valores descritos |
|---|---|
| Pokémon / formas | `pokemon_ids: int[]`; `species_forms:[{pokemon_id,form_id}]`; `forms:string[]`; listas de bloqueio `blacklist_pokemon_ids`, `blacklist_species_forms`, `blacklist_forms` |
| Local | `location` (texto); `center_lat`, `center_lng`, `radius_km` juntos |
| CP / nível | `cp_min/max`, `level_min/max` (nível de 1 a 50) |
| IV | `iv_mode` = `raw` ou `percent`; `raw_iv_atk/def/sta` = 0–15; `iv_percent_min/max` = 0–100, com décimos conforme anexo |
| Tamanho / sexo | `sizes`: `XXS,XS,S,M,L,XL,XXL`; `gender`: `Male,Female,Genderless` |
| Clima | `boosted`; `weather_id`: 1 Sunny, 2 Rainy, 3 Partly Cloudy, 4 Cloudy, 5 Windy, 6 Snow, 7 Fog |
| Ordem | `sort`: `DSP,CP,IV,LEVEL,DISTANCE` (esta depende do centro/raio) |
| Vida útil | `min_ttl`: minutos 0–60 |
| PvP | `pvp_mode`, `pvp_league` = `great/ultra`, `pvp_top_rank` = 1–50, `pvp_min_cp`, `pvp_include_pre_evolutions` |
| Shiny | `shiny_only`, `background_only`, `shiny_account`; exigem login/treinador válido segundo os testes relatados no anexo |

Resposta descrita para itens de `results`: `encounter_id,pokemon_id,pokemon_name,form,costume_id,costume,cp,level,location,raw_iv,iv_percent,gender,size,weather_boosted,weather_id,fast_move,charge_move,despawn_at,despawn_verified,reveal_code,distance_km,pvp,shiny,background`. `pvp` pode conter `league,rank,pokemon_id,pokemon_name,cp,level,percent`; `iv_percent` pode ser fracionário. `despawn_at` pode ser UTC ou conter offset de timezone.

## 4. Comparação com implementação LT77 existente antes deste registro
- `api_result_contract.js`: já limita a 10, aplica filtros IV/PvP básicos, rejeita resultados inconsistentes e protege credenciais. **Pendências importantes:** originalmente rejeita `formSelections` e `pokemonSelections` embora o anexo descreva IDs oficiais e catálogos; rejeita ordenação diferente de DSP; clima/boost não mapeados; porcentagens fracionárias de IV podem ser rejeitadas pelo teste exato com `Math.round()`; entrada `levelMin/max` aceita até 100, enquanto o anexo afirma 50. Algumas escolhas de ranking/PvP/identidade continuam precisando teste.
- `api_reveal_contract.js`: já entende `lat/lng` numéricos, mas o schema novo indica `coords` como string adicional; uma validação futura precisa comparar o par numérico com `coords` e rejeitar qualquer conflito. O código não estava ativado e tratava GET/formato como hipóteses, agora **descritos pelo documento, ainda sem teste no app**.
- `api_browser_transport.js`: transporta `POST /search` somente com JWT; anexo descreve busca anônima com cap 5. A funcionalidade anônima precisaria de modo explícito e respeitar cap. Os retornos 403 devem diferenciar `trainer_not_linked`, `shiny_account_unavailable` e `vip_required`; 422, 404/410, 429 e tempo de espera do servidor precisam tratamento seguro. `result.source` continua identificada como experimental.
- O aplicativo Android publicado não importa esse transporte: a integração com o site/DOM continua intacta.
- Não habilitar alertas automáticos, publicar APK ou declarar conclusão da API sem confirmar em Samsung filtros reais, CORS, identidade do spawn, ciclo de vida, autorização e quotas.

## 5. Plano prioritário de QA posterior
1. Corrigir a matriz dos filtros e as faixas com fixtures redigidas do anexo (sem token nem ID pessoal). Cobrir IV fracionário e `pvp` com evolução.
2. Adicionar tratamento de `cap/tier`, modo anônimo opt-in, status 400/401/403/404/410/422/429/503 e `Retry-After`; testar sem requisições reais.
3. Adaptar `/reveal` para `coords` string + `lat/lng` consistentes, sem retornar nem registrar código opaco; validar expiração por índice, encontro e geração.
4. Confirmar CORS e autenticação de pesquisa/reveal somente com sessão autorizada no dispositivo e sem extrair JWT para o Android.
5. Testar Shiny com conta vinculada; não executar `/trainer/confirm` automaticamente. Preservar fallback para DOM.
6. Homologar os menus, filtros, localização manual, Pokébola, resultados, alertas, Favoritos e Editor Visual no Samsung antes de distribuir uma nova versão.

**Status:** somente auditoria documental da fonte fornecida; nenhum HTTP autenticado, nenhuma recompilação de Android, nenhum APK e nenhuma migração/merge foram realizados nesta seção. O anexo original não foi versionado por conter exemplos de credenciais e dados pessoais. A autorização de uso da API foi declarada pelo proprietário, mas não substitui verificar as permissões específicas de cada endpoint.

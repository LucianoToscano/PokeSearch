# LT268 — Auditoria independente pós-release oficial

Data: 06/11/2026. Base de verificação: GitHub `main`, PR, Actions, release pública e código/testes versionados.

## Resultado e prova de publicação
- **Versão:** LT268 `0.02.68` / `versionCode 54472`, release estável [v0.02.68-54472](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.68-54472), publicada `2026-11-06T17:57:09Z`.
- **APK:** [PokeSearch-v0.02.68-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.68-54472/PokeSearch-v0.02.68-LT.apk), tamanho `33.603.398` bytes, SHA-256 `3b8250e7cdc3a1227f451a2c638a477809ed83def5e897d3d6af1bdca4edd050`. `draft=false`, `prerelease=false`, asset `uploaded` e digest verificado pelo workflow. Limite <35 MB mantido.
- **Código:** [PR #255](https://github.com/LucianoToscano/PokeSearch/pull/255) mesclada; commit `f3515cdc2c4564ae6aa5b7fd5873ab809a5b5cf7` (HEAD da build).
- **Workflow oficial:** [#42265706690](https://github.com/LucianoToscano/PokeSearch/actions/runs/42265706690) `preflight=success`, `publish=success`, com validação da assinatura permanente, seis novos PNG por SHA-256, Gradle/R8, conferência da versão, limpeza de chave privada e comparação do digest público.
- **QA assinada independente:** [#42265706774](https://github.com/LucianoToscano/PokeSearch/actions/runs/42265706774) `signed-dual-parity=success`. Não confundir build QA com APK pública; não houve teste humano no Samsung.

## Alterações exatas
O escopo foi unicamente substituir seis ícones de análise em `detail.html` e adjacências (Raides/PvP/Calculadora/alternativas), sem mudar layout, tamanho de chip, API, autenticação, cálculos, fonte ou ordem de resultados. Arquivos `ui-icons/ps-{gl,ul,ml,cup,overall,raid}-lt268.png`, cada um PNG RGBA 320×320 com alfa sem halo externo e checksum fixo. **Rank Geral** = triângulo multicolorido; **Raides** = brasão laranja. O CSS de drop-shadow nos emblemas de liga foi removido.

Não foram alterados `dock.html`, `result-icons/modes/*`, imagens das Pokébolas P1/P2, `OverlayService`, `SecondaryOverlayService`, favoritos, buscas, login, rank IV/geral, gamemaster, Mega ou fontes de ataques. Ícones históricos LT262/LT265/LT267 preservados em suas posições versionadas, sem substituir arte antiga por nova em testes de integridade.

## Gates do HEAD PR #255
| Gate | Evidência | Estado |
| --- | --- | --- |
| Node completo | [#42265453233](https://github.com/LucianoToscano/PokeSearch/actions/runs/42265453233) | success |
| Node QA | [#42265453313](https://github.com/LucianoToscano/PokeSearch/actions/runs/42265453313) | success |
| QA core | [#42265453161](https://github.com/LucianoToscano/PokeSearch/actions/runs/42265453161) | success |
| Java Android | [#42265453214](https://github.com/LucianoToscano/PokeSearch/actions/runs/42265453214) | success |
| WebView real P/M/G | [#42265453257](https://github.com/LucianoToscano/PokeSearch/actions/runs/42265453257) | success |
| PvE referência | [#42265453157](https://github.com/LucianoToscano/PokeSearch/actions/runs/42265453157) | success |
| OTA/assinatura de recursos | [#42265453201](https://github.com/LucianoToscano/PokeSearch/actions/runs/42265453201) | success |
| Release preflight | [#42265453156](https://github.com/LucianoToscano/PokeSearch/actions/runs/42265453156) | success |

A primeira tentativa falhou nas expectativas de três testes legados e no parser do novo teste. A segunda iteração corrigiu a expectativa de nomes de assets atuais e o parser, sem alterar os recursos históricos ou desligar as asserções. Build oficial e QA independente subsequentemente aprovados.

## Auditoria das prioridades solicitadas (sem extrapolar evidências)
1. **Contraste/ícones** — Os seis assets foram limpos e o halo CSS removido; hashes, RGBA e layout verificados. A legibilidade real no Samsung em fundo claro/escuro **não foi medida**.
2. **Cortes P/M/G** — O gate Chromium do WebView real conferiu clippings, rolagem do simulador, formulários Teddiursa/Ursaluna e Gastly/Gengar Mega, com estado `success`. Esse teste não prova todos os aparelhos ou fontes do sistema.
3. **Movimentação/rolagem do overlay** — Código Android dos overlays e limites de viewport cobertos pelos testes existentes; sem nova falha física reproduzida, nenhuma mudança arriscada foi introduzida.
4. **Exclusividade PvP/Raides/Calculadora/Golpes** — `psCloseOtherPanels` e testes LT265 preservados; não há observação de regressão nesse HEAD.
5. **Calculadora compacta** — Não perdeu os campos IV A/B, nível, PC/PS, alvo e seletor de forma. Adaptação real de fontes e gestos ainda exige aparelho.
6. **Evoluções/Megas/limites** — Testes LT253/LT254 e screenshots P/M/G cobrem Sableye/Mega, Teddiursa/Ursaring/Ursaluna, Gastly/Gengar/Mega, caps 500/1500/2500, CP, IVs e seleção. Não converter previsão de Mega em elegibilidade PvP.
7. **Sprites** — QA assinada construiu os sprites oficiais normais/Shiny e verificou 128 costumes/eventos, incluindo Shellos e variantes Diwali/Squawkabilly; prioridade à forma exata preservada.
8. **Traduções PT-BR** — A fonte externa continua fixada no commit WatWowMap `31a3bcdc2e412f315c4be2bb593807f45cb9bd9b`; o offline existente apresenta cinco rótulos divergentes do catálogo. Ver tabela abaixo; não foram alterados na APK LT268.
9. **Atualizador** — `releases/latest`, regras versionCode e recursos OTA assinados foram testados no CI; não há evidência de atualização instalada pelo Samsung.
10. **Leveza e simetria** — PNGs novos somam cerca de 543 KB ao bundle, sem serviços, API nem janelas Android novas. APK final 33,6 MB, abaixo de 35 MB; bateria e desempenho físico não medidos.

## Traduções offline a revisar (identificadores e equivalências canônicas verificadas)
Consulta à **mesma fonte fixada no código** `WatWowMap/pogo-data-api` (catálogo `moves.json` por `proto/moveId`, texto `translations/pt-br/moves.json`). Esses cinco casos são divergências reais da tabela offline `pve_moves_ptbr.js`:

| ID canônico | moveId | Offline LT268 | Texto na fonte PT-BR |
| --- | ---: | --- | --- |
| `AIR_SLASH_FAST` | 255 | Golpe Aéreo | Golpe de Ar |
| `THUNDER_SHOCK_FAST` | 205 | Choque do Trovão | Trovoada de Choques |
| `DRAGON_BREATH_FAST` | 204 | Sopro de Dragão | Sopro do Dragão |
| `WATER_GUN_FAST` | 230 | Jato d'Água | Revólver d'Água |
| `DRAGON_TAIL_FAST` | 253 | Cauda de Dragão | Cauda do Dragão |

Também há cinco IDs **documentados na fonte mas ainda ausentes do fallback offline** relevantes para Fletchling/Talonflame/Pidgey/Pidgeot: `GUST_FAST` (345, Lufada de Vento), `INCINERATE_FAST` (346, Incinerar), `FLAME_CHARGE` (101, Ataque de Chamas), `FEATHER_DANCE` (348, Dança das Penas), `HURRICANE` (122, Furacão). Corrigir apenas depois de adicionar regressões fixando ID/nome, conservando `moveId` original para Elite/legado. Falhas de tradução desconhecida permanecem neutras.

## Pendências
- Testar instalação/atualização real via Android no Samsung (permissão de instalação, assinatura, P1/P2, integridade de favoritos e configurações).
- Capturar os seis badges sobre fundo claro e escuro em tamanhos P/M/G; conferir se a micrografia RG de 11 px é reconhecível.
- Confirmar arraste e scroll até coordenadas, fechamento/reabertura rápida, comparador IV A/B e CP-alvo, Mega e sprites específicos no dispositivo.
- Corrigir os dez casos offline PT-BR com fonte pinada em branch separada, caso priorizado, sem atribuir novos golpes à espécie sem confirmação.
- Verificar entrega efetiva pelo atualizador e sincronização da **APK** com Drive caso requerida; a presença da release GitHub não prova essas ações.

## Preservação e próximo passo
Manter LT267 estável como rollback, as duas Pokébolas isoladas e todos os filtros/ranks. [Prompt de continuidade LT269](PROMPT_NOVO_CHAT_LT269_20261106.md).

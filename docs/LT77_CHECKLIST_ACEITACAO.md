# PokeSearch LT77 — Checklist de Aceitação e Homologação

**Data de auditoria:** 24/10/2026  
**Branch:** `fix/lt77-stage14-acceptance-audit-20261024`  
**Checkpoint base:** Etapa 13, `01c0793003ef2fc3791bf552e1e9ec66926a7694`  
**Release protegida:** LT76, **não modificada**.  
**Estado:** validação estática/CI possível; **homologação física Samsung NÃO executada**.  
**APK:** não gerado neste ciclo. **API experimental:** OFF no release Android.

## Critério de evidência

- `[x]` significa implementado/conferido no código e coberto pelo CI correspondente.
- `[ ]` significa sem evidência suficiente, **não homologado** ou implementação propositalmente não ativada.
- PASS automatizado não comprova pixels exatos, toque, rede autenticada, disponibilidade real do site, persistência em Samsung ou ausência de leaks.

## Etapas 2–8: interface e DOM

| Requisito | Estado | Evidência / pendência |
|---|---|---|
| Gap padrão Pokébola → resultados ≤ 2px | [x] CI, [ ] Samsung | `ResultsSpacingPolicyTest`, LT77 Etapa 2; medir no Samsung |
| Gap mínimo entre resultados (sem herdar 31px) | [x] CI, [ ] Samsung | 10/10 testes JS da Etapa 2 |
| Arraste integrado Pokébola/resultados ≤ 16ms | [x] CI, [ ] Samsung | throttle comprovado por código/teste; fluidez física pendente |
| Nível Min/Max compactos, digitáveis, 1–35 | [x] CI, [ ] Samsung | Etapa 3; teclado e legibilidade física pendentes |
| Tamanho: sete chips e múltipla seleção | [x] CI, [ ] Samsung | Etapa 3; alinhamento físico pendente |
| Sexo Male/Female/Genderless, vazio = Any | [x] CI, [ ] Samsung | Etapa 3; aplicação real ainda não homologada |
| Localização raio 0, 1, 999, 1000 e `km` junto | [x] CI, [ ] Samsung | Etapa 3; aplicar/limpar no site autenticado pendente |
| Popups alinhados ao ícone (horizontal/vertical) | [x] geometria, [ ] Samsung | Etapa 4; edge-case toque/rotação pendentes |
| Mais, Modos e Notificações sem rolagem indevida | [x] política CSS, [ ] Samsung | Etapa 4; confirmar conteúdo integral no dispositivo |
| Favoritos junto à estrela | [x] ancoragem, [ ] Samsung | Etapa 4; dialog real pendente |
| Get coords toca e encerra pending após timeout | [x] código/teste, [ ] Samsung | Etapa 5; liberação após cooldown real pendente |
| Forma ≠ Sexo, não inventar catálogo oficial | [x] origem separada, [ ] catálogo completo real | Etapa 6 |
| Weather aplica no site | [ ] | Sem teste autenticado do React, nem confirmação do filtro oficial |
| Level/CP/Size/Sort aplicam resultados corretos | [ ] | Guardas DOM existem; comparar com o site real |
| DISTANCE somente com coordenadas/raio confirmados | [x] CI, [ ] Samsung | Etapa 7 |
| IV raw/%, GL/UL ranking equivalentes ao site | [x] validação de faixas, [ ] equivalência real | Etapa 8; confirmar PvP ranking |
| Shiny só indica confirmado após prova do site | [x] fluxo estático, [ ] experiência real | Etapa 8; login/treinador vinculado para teste |

## Etapas 9–13: API, segurança e performance

| Requisito | Estado | Evidência / pendência |
|---|---|---|
| Contrato /search: enums, Form, catálogo, clima, PvP, IV, sort, TTL e blacklists | [x] testes sintéticos, [ ] live | Etapa 9; `pogo.md`, sem requisição autenticada de ponta a ponta |
| Limite de até dez cartões normalizados | [x] | Etapas 2 e 9 |
| API desligada por padrão | [x] | Roteador experimental `USE_AUTHORIZED_API=false`; nenhum import no serviço |
| Autenticação/JWT restritos à origem oficial no módulo de transporte | [x] testes, [ ] live | Testes da API; sem tokens reais em testes |
| Não logar/persistir JWT e reveal_code | [x] auditoria de módulos, [ ] runtime instrumentado | Módulos puros e verificação de segurança |
| HTTP 401/403/429 tratados no transporte | [x] mocks, [ ] respostas reais | Sem repetição agressiva |
| Roteador DOM/API preparado com feature flag OFF | [x] puro, [ ] integração Android | Etapa 10 é **parcial**: ainda NÃO conectado ao `OverlayService` |
| Pesquisa API autenticada renderizada no WebView | [ ] | Não implementada em produção; depende de autorização/homologação de origem e integração |
| Reveals só sob pedido e spawn válido | [x] contrato, [ ] serviço real | Etapa 11; `GET /reveal/{code}` não chamado neste ciclo |
| Coordenadas textuais e lat/lng consistentes | [x] contrato, [ ] live | Etapa 11 |
| Handler, receivers, WebViews liberados no onDestroy | [x] código/teste, [ ] profiler | Etapa 12 |
| Arraste e busca sem memory leaks em sessão longa | [ ] | Exige Android Profiler no dispositivo |
| ProGuard preserva @JavascriptInterface/JSON | [x] regras auditadas, [ ] release R8 executada | Etapa 13: compilação Java Debug não executa R8 release |
| Limpeza de código comprovadamente morto | [ ] | Sem prova de segurança para exclusão, não remover componentes úteis |

## Homologação Samsung necessária

1. Instalar **APK de teste autorizado** gerado a partir de commit verificável, preservando assinatura oficial e LT76 publicada. Nenhum APK de teste foi gerado neste ciclo.
2. Verificar janelas ancoradas em cada orientação e posição de tela, inclusive menus à esquerda/direita, títulos, X, scroll, Favoritos e editor.
3. Abrir filtros, editar 1/35 de Nível, tamanho/sexo, coordenadas 0/1/999/1000 e testar confirmação no site; sem limpar critérios não relacionados.
4. Verificar datas/despawn e clique de Get coords antes/depois do cooldown oficial; copiar somente latitude/longitude verificadas.
5. Com conta autorizada autenticada e treinador vinculado (se aplicável), testar Shiny, GL/UL, Weather, Form/costumes, desempenho e correta comparação dos resultados.
6. Só depois de homologar esses fluxos planejar integração Android de API, habilitação controlada e possível release; **não** autorizar merge ou distribuição a partir deste checklist por si só.

## Evidência de CI

- Etapa 2: execução #40139295209 (conforme checkpoint fornecido); Etapa 3: [#40140600351](https://github.com/LucianoToscano/PokeSearch/actions/runs/40140600351).
- Etapa 4: [#40141616065](https://github.com/LucianoToscano/PokeSearch/actions/runs/40141616065).
- Etapa 5: [#40141873620](https://github.com/LucianoToscano/PokeSearch/actions/runs/40141873620).
- Etapa 6: [#40142110424](https://github.com/LucianoToscano/PokeSearch/actions/runs/40142110424).
- Etapa 7: [#40142323949](https://github.com/LucianoToscano/PokeSearch/actions/runs/40142323949).
- Etapa 8: [#40142426181](https://github.com/LucianoToscano/PokeSearch/actions/runs/40142426181).
- Etapa 9: [#40142716370](https://github.com/LucianoToscano/PokeSearch/actions/runs/40142716370).
- Etapa 10: primeira execução #40142917426 falhou por falso positivo do novo teste ao ler comentário, rerun [#40143042368](https://github.com/LucianoToscano/PokeSearch/actions/runs/40143042368) passou.
- Etapa 11: [#40143066929](https://github.com/LucianoToscano/PokeSearch/actions/runs/40143066929).
- Etapa 12: primeira execução [#40143185582](https://github.com/LucianoToscano/PokeSearch/actions/runs/40143185582) falhou por campos inacessíveis da classe Bridge no onDestroy. Correção feita em Stage12 e propagada à Stage13/14; conferir novo CI.
- Etapa 13: conferir execução da branch e registrar resultado após término.
- Etapa 14: conferir execução final de todos os testes antes de atestar regressão automatizada.

**Conclusão:** auditoria de implementação e CI são separadas da aceitação em campo. **LT77 não pode ser declarada homologada nem publicada** enquanto existirem itens [ ] críticos.


## Auditoria pós-Etapa 14 — evidência recebida em 24/10/2026

**Branch de correção:** `fix/lt77-post14-coordinate-hardening-20261024`, derivada de `51803f38f1eb570388fec987779b8e90fba884c6`.

- [x] Revisado o código real de `probe.js`, `OverlayService.java`, `detail.html` e os contratos experimentais; o runtime Android continua no DOM. `USE_AUTHORIZED_API=false`.
- [x] Get coords: quando o React reordena os cartões, o índice `sourceIndex` pode mudar. O matcher agora busca identidade única por nome, PC, número e localização, sem clicar se houver dois resultados indistinguíveis. Evidência: teste sintético de reordenação e ambiguidade; **não é prova de correção do site autenticado**.
- [x] O transporte da API experimental exige a origem HTTPS canônica, sem porta personalizada, antes de ler JWT. Não existe requisição automática ao carregar o módulo.
- [x] `normalizeResponse` rejeita resultados da API com `despawn_at` ausente ou inválido; evita cartões cujo prazo não pode ser verificado.
- [ ] Screenshot do Caterpie mostrou "Pokémon não encontrado ou identificação ambígua"; o relatório de outro testador mostra "Aguardando coordenadas" e ausência de coordenadas. **Causa física específica e sucesso real não verificados**. Reproduzir Get coords antes/depois da atualização do React; validar expiração e botão desabilitado/cooldown.
- [ ] Homologação Samsung: toque, drag, menus, orientação, favoritados, Editor Visual, áudio, 0–1000 km e botões compactos. As capturas servem como relatos, não como instrumentação.
- [ ] Integração real da API: ainda não existe conexão no `OverlayService` nem chamada autenticada a `/search`, `/forms`, `/pokemon/catalog?costumes=true` ou `/reveal`. Preservado fallback DOM; **NÃO declarar implementação concluída**.
- [ ] APK LT77 de QA: verificar assinatura permanente, versionCode 54277, R8 release, origem do commit e SUCCESS de GitHub Actions antes de compartilhar ou instalar. Nenhuma publicação automática no Drive.
- [ ] Perfil de memória e stress prolongado do Samsung, testes reais de Shiny/GL/UL/Form/Weather com treinador vinculado.

Para cada nova captura de erro de Get coords, registrar nome, número, PC, cidade, horário do spawn, botão do site e se o cartão foi reordenado; **nunca** enviar JWT nem `reveal_code`.


### Resultado final do CI de QA pós-14

- [x] Pipeline #40146111436: `COMPLETED/SUCCESS` sobre `3d9069900d2bb57615dc45945056acf61bd3e226`, com testes, `assembleRelease`, R8, pacote `0.00.77/54277`, certificado e APK não depurável validados.
- [x] Artefato de homologação produzido: `PokeSearch-v0.00.77-LT-Samsung-QA-protected-release` (GitHub Actions artifact ID `12580991636`, ZIP com APK, checksum, origem, assinatura e metadados).
- [ ] Instalação/observação real no Samsung, obtenção de coordenadas do Caterpie/Slakoth e demais cenários de `Get coords`: não executadas aqui.
- [ ] API oficial integrada no `OverlayService` e verificada com conta/treinador autorizado: NÃO realizada; flag continua OFF.
- [ ] Publicação LT77: NÃO autorizada/não realizada. A LT76 no Google Drive segue protegida.

### QA r2 — recuperação de coordenadas do Open in Maps

- [x] Expressão regular de readCoords corrigida; testes dinâmicos no código real com link Maps e rejeição segura.
- [x] CI #40147137124 COMPLETED/SUCCESS, código SHA 013bc4e43752c4eb38419acccfe807820995b0dc, testes, R8 release, apksigner v2, SHA-256 e APK não depurável.
- [x] Artifact privado 12580543567, versionCode 54278, versionName 0.00.77, pacote PokeSearch-v0.00.77-LT-Samsung-QA-r2.apk. ZIP e SHA conferidos.
- [ ] Reproduzir solução real no Samsung com site autenticado (Caterpie, Slakoth, cooldown/expiração).
- [ ] Migração API no OverlayService (segue desligada); homologação UI/UX completa.
- [ ] Distribuição pública LT77 (não realizada, LT76 preservada).


### Continuação QA R2 — contrato experimental e preferência Despawn

**Base verificada:** 44fa0e7fc1c4386d11d7f6e18d33539b4a442f4b; alterações só na branch de QA, sem mudança em main, PR #34/#49 ou manifesto LT76.

- [x] `api_result_contract.js`: seleção textual pelo nome oficial da espécie agora resulta em um único `pokemon_ids`, mesmo que o catálogo contenha várias formas da mesma espécie; forma explicitamente selecionada usa `species_forms` e continua exigindo identificação única. Teste sintético adicional.
- [x] Despawn em **Info Pokémon**: padrão confirmado OFF no código Java (`showTimers=false` e `prefs.getBoolean("showTimers", false)`). Preferência ON já salva permanece ON; nenhuma preferência de usuário foi apagada ou forçada. Teste de regressão estático.
- [x] `api_browser_transport.js`: classifica 400/422 (`invalid-request`), 404/410 (`expired-or-missing-spawn`) e 503 (`service-unavailable`), mantendo 401/403/429, sem devolver corpo bruto, autenticação ou código opaco. Testes sintéticos adicionais.
- [ ] Subtipos 403 (`trainer_not_linked`, `shiny_account_unavailable`, `vip_required`) ainda não são expostos separadamente; erro é genérico, sem vazamento de detalhes.
- [ ] Catálogos oficiais ainda não são baixados pelo Android; nenhuma forma ou ID foi inferido de texto local.
- [ ] Conexão `OverlayService` ↔ API ainda OFF; DOM permanece única fonte em runtime.
- [ ] Get coords, filtros de clima/forma/sexo e preferência Despawn visualmente confirmados no Samsung; capturas e testes de rede necessários.
- [ ] Aceitação para atualização pública: NÃO concedida. Não mudar `atualizacao.json` ou substituir LT76 sem aceitação física e checagem de segurança.

**Fonte do contrato:** `pogo.md` no Google Drive; dados de conta e tokens do documento não são reproduzidos no GitHub.

### Complemento: catálogo cacheado e erro 403 tipado

- [x] `api_catalog_cache.js` criado com `GET /forms` e `GET /pokemon/catalog?costumes=true` via origem oficial, sem JWT, cookies, bridge ou requisição ao carregar script. Cache somente em memória (TTL 300 s), resultado em cópia defensiva, limite de tamanho de resposta e bloqueio de origem. Testes artificiais em `lt77-api-catalog-cache.test.js`.
- [x] `api_browser_transport.js` diferencia os códigos documentados `trainer_not_linked`, `shiny_account_unavailable` e `vip_required` quando recebidos no objeto `detail.error` de um HTTP 403; caso desconhecido fica `access-denied`, sem retornar mensagens do servidor.
- [ ] Carregamento do catálogo e API conectados à interface do Android: NÃO implementados; nem a UI nem a rede real foram homologadas. `USE_AUTHORIZED_API=false`.
- [ ] Confirmar certificado e artefato do último workflow após o commit `fccef433fb3e1e62a3b7708d6726e8a2e752bf79`, sem confundir teste automatizado com aprovação em Samsung.

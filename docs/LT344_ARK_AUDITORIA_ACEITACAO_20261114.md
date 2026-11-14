# PokeSearch LT344 — Auditoria ARK, CI e aceite físico

**Atualização pós-publicação (14/11/2026):** a versão **0.03.42 / code 54549** foi publicada oficialmente em [v0.03.42-54549](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.42-54549), APK **59.991.436 bytes**, SHA-256 `bb93937b393d469504f7a7fdba18f628933a1da58c784f21a3702b4d95cbd8e3`. [Workflow protegido #43634931326](https://github.com/LucianoToscano/PokeSearch/actions/runs/43634931326) **SUCCESS**. As pendências físicas T01–T28 abaixo **não mudam de status** pelo fato de a release estar assinada; Android não instalou o APK remotamente.

**14/11/2026 • base integrada:** PR [#367](https://github.com/LucianoToscano/PokeSearch/pull/367) / commit `fc24811e92587a1829eb5ed680719cb548fab62d`.

## Regra de evidência
Este registro distingue `PASSOU (contrato/código)` de `BLOQUEADO (teste físico)`. **Não houve execução/controle remoto do Samsung** neste estágio. Todos os sete gates CI obrigatórios passaram no SHA `41976def4bfeb6ae76c421e9c3b1178e00998dd5` ANTES do merge, mas essas verificações **não** certificam OAuth em servidor terceiro, gesto/teleporte real, fluidez dos menus nem mapa carregado.

**Provas CI:** [LT169 Node](https://github.com/LucianoToscano/PokeSearch/actions/runs/43634065990) · [Node QA](https://github.com/LucianoToscano/PokeSearch/actions/runs/43634066022) · [Core LT211](https://github.com/LucianoToscano/PokeSearch/actions/runs/43634065902) · [Java LT62](https://github.com/LucianoToscano/PokeSearch/actions/runs/43634065875) · [OTA LT173](https://github.com/LucianoToscano/PokeSearch/actions/runs/43634065876) · [PGS Android QA](https://github.com/LucianoToscano/PokeSearch/actions/runs/43634065878) · [Secure beta APK](https://github.com/LucianoToscano/PokeSearch/actions/runs/43634065980).

## Matriz T01–T28
| ID | Status | Evidência, código responsável e próxima prova |
|---|---|---|
| T01 | **BLOQUEADO — Samsung** | `MainActivity.java` centraliza badge no shell e posiciona 2px físicos acima do glifo; medir captura real em DPI distintos |
| T02 | **BLOQUEADO — Samsung** | `MainActivity.java`, `PogoAccountSlots.bindAccountOnly` e preferências P1/P2 independentes; selecionar as duas sequencialmente e reiniciar |
| T03 | **BLOQUEADO — provedor/Android** | `login_entry.js`, `MainActivity.java`; Google pode impedir OAuth embutido (`disallowed_useragent`); requer callback oficial do PoGoCoordinates e teste real |
| T04 | **BLOQUEADO — sessão real** | `MainActivity.java`, `profile_capture.js`; validar nome real disponibilizado na página do site sem fallback genérico falso |
| T05 | **BLOQUEADO — visual** | `MainActivity.java`; conferir deslocamento ~10px **somente na área de login**, contraste e ausência de sobreposição |
| T06 | **BLOQUEADO — visual** | `HomeMenuIconPack.fitVisibleArtwork` e `MainActivity.java` uniformizam alfa visível e mantêm logo; requer comparação física |
| T07 | **BLOQUEADO — visual** | `MainActivity.java` aplica branco no modo escuro/preto no claro ao Compartilhar; aferir requisito de cor e ambos temas |
| T08 | **PASSOU — contrato de recursos** | `MainActivity.java`, `PgsAutoClickService.java`, `lt342-home-pgs-login-edu-contract.test.js` preservam quatro nomes WebP OFF/ON previstos |
| T09 | **BLOQUEADO — visual** | `PgsAutoVisualState.java`, `PgsAutoClickService.java`; inspecionar pulso verde/vermelho no estado apropriado e branco em repouso |
| T10 | **BLOQUEADO — visual** | `PgsAutoMenus.java`, `OverlayQuickMenus.java`, `dock.html`, `RareCandyOverlayService.java`; comparação px a px P1/P2/Doce Raro no Samsung |
| T11 | **BLOQUEADO — Android** | `PgsAutoMenus.java`, `PgsAutoClickService.java`; P/M/G, opacidade, contadores e preferências têm implementação; verificar ações após reiniciar |
| T12 | **PASSOU — contrato estático** | `PgsAutoNotificationPolicy.java` e `PgsAutoMenus.java`: duas categorias, Novos Pokémon e Shiny monitorado; evento Shiny real não provado |
| T13 | **PASSOU — contrato estático** | `PgsAutoClickService.java`: se menu aberto, `quickMenus.dismissAll(); return true;`, sem alternar estado; toque no aparelho pendente |
| T14 | **BLOQUEADO — recorte físico** | `PgsAutoCropSelection.java`: quadrado, horizontal e **retângulo com proporção livre**; `PgsAutoSilhouette.java` segmenta fundo plano opt-in, **não é laço poligonal** nem segmentação ML universal |
| T15 | **PASSOU — contrato UI** | `PgsAutoClickService.java`: lupa longe do dedo, prévia, Confirmar e Cancelar. Verificar tato e nitidez no Samsung |
| T16 | **PASSOU — código/contrato** | `PgsAutoCatalog.MAX_SELECTED=10`, `PgsAutoMenus.java`: busca no rodapé, sem Limpar Seleção; amostras antigas preservadas |
| T17 | **PASSOU — teste unitário** | `PgsAutoCyclePolicy.java` e `app/tests/PgsAutoCyclePolicyTest.java`: 25s padrão, valores arbitrários positivos aceitos, Sem Shiny 0 permitido |
| T18 | **BLOQUEADO — ciclo Android** | `PgsAutoClickService.toggle()` zera `clickedAt`, `awaitingMap` e contadores; confirmar 25s a cada reativação real |
| T19 | **BLOQUEADO — PGSharp real** | `PgsAutoClickService.verifyAndTap/tap`: dois frames, `dispatchGesture` e callbacks; callback Android não prova teleporte. Gravar log antes/depois no dispositivo |
| T20 | **BLOQUEADO — PGSharp real** | `PgsAutoMapReadiness.java`, `checkMap()`: requer estabilidade/objetos; conferir carregamento real e Pokémons no jogo |
| T21 | **BLOQUEADO — reativação real** | `PgsAutoTemplateStore.active`, `PgsAutoClickService.toggle()`: recupera amostras salvas em código; reabrir sem capturar de novo |
| T22 | **BLOQUEADO — Android/multijanela** | `PgsAutoClickService.onInterrupt`, serviço de overlay; minimizar, popup, orientação, retorno e política do Android |
| T23 | **BLOQUEADO — screenshot real** | `MainActivity.java`, `ProfileScreenshotPolicy.java`: sem bloqueio `FLAG_SECURE` próprio; tirar print inclusive na WebView de login |
| T24 | **BLOQUEADO — diálogo real** | `PgsAutoClickService.passengerPromptPresent`: pausa em Sou passageiro/Estou seguro sem consentir automaticamente; simular/verificar surgimento seguro |
| T25 | **BLOQUEADO — Edu real** | `EduSpriteInspector.java`, `EduAssistantService.java`: X invoca encerramento do serviço; verificar remoção das janelas e toque livre |
| T26 | **BLOQUEADO — dois temas** | `MainActivity.java`, `PgsAutoMenus.java`; conferir contraste, tamanhos e botões nos temas claro/escuro |
| T27 | **BLOQUEADO — reinício físico** | `SharedPreferences` P1/P2 e PGS; fechar app, reiniciar, comparar preferências e modelos gravados |
| T28 | **PASSOU — suites CI; visual bloqueado** | Testes LT169, Core LT211, Android/OTA verdes; sem prova física de inexistência de regressão em menus P1/P2/Doce Raro |

**Status do conjunto:** aprovadas somente as verificações cujo alcance está declarado acima. Os demais testes continuam bloqueados por ausência de aparelho/sessão e evidência visual; **não** contabilizar como sucesso integral. `T14` não promete ferramenta poligonal. Consultar [issue #350](https://github.com/LucianoToscano/PokeSearch/issues/350) para registro de testes físicos. A gravação fornecida em conversa anterior à LT344 foi auditada por amostragem e relatada na issue sem expor nome/foto/dados pessoais.

## Critérios para fechar pendências físicas
- Receber vídeo/log da **nova versão** com texto de estado `PROCURANDO → CONFIRMANDO → TOQUE → AGUARDANDO MAPA → MAPA VISÍVEL → PRÓXIMO`, sem coordenadas reais, credenciais ou dados de conta em issue pública.
- Testar opções P1 e P2 independentemente, login autorizado Google/Discord em ambas, nome real e logout isolado.
- Verificar o overlay do PGSharp em popup e ao minimizar, acessibilidade consentida, mapas, notificações e contadores após reinício, em duas densidades e temas.
- Caso o login Google apresente bloqueio do próprio provedor, **não** alterar user-agent nem importar cookies: registrar o retorno e solicitar suporte oficial de callback do PoGoCoordinates.

## Publicação
PR LT344 integrada após 7 gates. Release 0.03.42/54549 é candidata, depende de solicitação protegida, assinatura permanente, APK/R8, SHA-256 e artefato público; este documento **não** atesta que já foi publicada nem instalada.

# LT366 — Auditoria e implementação Auto Hunt PGSharp / Pokemod

## Base e evidência
- Em 15/11/2026, antes deste trabalho, PokeSearch oficial **0.03.61 / versionCode 54568 / label 51365**, `main` `0a230fd812a7ff5bb4e01a7d5a28c06d83d61030`, release `v0.03.61-54568`, APK digest SHA-256 GitHub `ade35ebd54764230498095b8f4eb4cb50e0062ca0434599e54dd3b32698d680f`.
- Referências reais: quatro screenshots enviados pelo proprietário nesta conversa (uma tela PokeList v1.3.18 mostrando modo Tele, controle Start/Stop, marcadores; duas capturas do mapa do jogo; tela Auto Hunt com toggles, tempos e alertas). O mesmo painel já tinha aparecido nas seis capturas da LT365. Os screenshots provam apenas **aparência e opções do APK de referência**, não garantem os efeitos na conta, teleporte/captura nem semântica de notificações.
- **Autorização:** o proprietário já declarou autorização para os APKs/APIs PokeList, PGSharp, Pokemod e outros insumos. Não exigir reconfirmação. O PokeSearch implementa lógica própria usando os serviços Android e os modelos visuais do próprio usuário; não instala ou executa APK de terceiros.

## Diagnóstico do código LT365 antes de alterar
- `PgsAutoClickService` já possuía coleta de tela `takeScreenshot`, confirmação do mesmo sprite em duas leituras, guarda de janela oficial de jogo, controle de mapa visual e timeout, tap de acessibilidade com callback (não prova efeito no jogo), monitor passivo exclusivo, parada em Shiny com texto explícito, badge e efeito visual de toque.
- `PgsAutoHostSettings` já tinha perfis explícitos `pgsharp` e `pokemod`, separados do processo do gerenciador Pokemod e de contas P1/P2.
- `PgsAutoMenus` já usa geometria e cores de `PgsAutoMenuStyle` herdadas do Editor Visual das Pokébolas (células 30dp, popupWidth/Height, transparência, orientação). A barra tem exatamente **5 ícones**. Não criar sexto botão nem painel gigante.
- `PgsAutoNotificationPolicy` já tinha canais e sons independentes das Pokébolas; `PgsAutoShinyListener` já lia notificações de jogo e filtrava Shiny explicitamente.

## Matriz de cada opção solicitada, com implementação honesta

| Opção observada na captura | LT366 e comportamento |
|---|---|
| Auto Hunt ON/OFF | **Implementado:** opt-in separado para PGSharp e Pokemod, desligado por padrão; só roda ao tocar na bolha e depois de validar modelo, permissão e jogo visível |
| Wait time — 35 seconds | **Implementado:** 15/35/60/120 s; espera entre alvos após confirmação de mapa, ticker local a cada 1s, sem polling de API |
| Tele if get notification IV100 / shiny | **Indisponível:** não há ponte de teleporte verificada compatível com ambos; nenhuma ação automática por notificação |
| Stop when Shiny | **Implementado anteriormente/obrigatório:** texto Shiny positivo e associado a alvo atual pausa; não permitir desligar a proteção |
| Stop when IV100 | **Implementado condicionado:** somente notificação do pacote oficial do jogo, expressão IV100 explícita e nome completo do alvo atual; cenário real do cliente ainda não homologado |
| Stop when Ditto | **Implementado condicionado:** notificação textual inequívoca sobre Ditto e alvo explicitamente Ditto; não inferir Ditto a partir de aparência |
| Ringtone / Vibrate | **Implementado:** canal Android próprio `huntEvent` e `notificationId 2104`, com modo/estado separados por perfil; respeita permissão/DND do Android |
| Show cooldown | **Implementado:** usa badge existente de contagem de espera/carregamento; não é cooldown de conta confirmado nem permite liberar teleporte |
| Show Pokémon info | **Implementado:** nome do alvo na descrição/status após confirmação de sprite; não inventa IV ou Shiny |
| Click Pokémon after found | **Implementado:** OFF por padrão no Auto Hunt; sem consentimento, toque na bolha inicia monitor sem gestos. ON reutiliza o `tap()` validado por 2 frames, jogo oficial e bloqueios de segurança |
| Number of clicks — 10 | **Implementado:** limite 1/3/5/10 por sessão Auto Hunt, contabiliza somente callbacks Android de gesto concluído; pára após atingir limite e aguardar mapa. Callback não prova captura |
| Check Pokémon before fix load map | **Sempre ativo:** validação visual de sprite/perfil e segurança antes de qualquer gesto, não removível |
| Fix load map (HAL) | **Implementado parcialmente e com limite:** permite repetir somente a **captura de tela** do mapa em falhas transitórias, sem clique, reinício ou detecção HAL privada |
| Fix load map if fail — 3 | **Implementado:** até 0/1/2/3 falhas de leitura adicionais antes de pausar com diagnóstico; se imagem já mudou ou jogo não reagiu, as regras originais impedem toques cegos |
| Restart Pokémon GO if fix load map fail | **Indisponível:** sem reinício de processo de terceiro ou execução de comandos |
| Restart PoGo after x times no notification — 2 | **Indisponível:** silêncio de notificações não autoriza concluir travamento/reiniciar PoGo |
| Catch Pokémon / Continue hunt after catch | **Indisponível:** nenhuma captura automática ou prova de captura |
| Swipe duration 200 / wait to catch 2 min / wait after cooldown 2 min / throws 2 | **Indisponível:** sem verificação da tela de captura, arremesso, cooldown real ou modelo de validação |
| Zoom In Max / before click / after restart 30 s | **Indisponível:** gestos de zoom/restart não habilitados no ciclo |
| Proximity Sensor | **Implementado:** se sensor Android disponível, opção individual para pausar e emitir alerta quando coberto; não retoma sozinho e não exige nova permissão |
| Fix notification service | **Implementado como abertura das Configurações do Android** para o usuário conceder/retirar acesso; não tenta ativar acesso automaticamente |

## Código e segurança
- `PgsAutoHuntPolicy.java` puro: limites de tempo/toques/releituras, validação de texto de IV100 ou Ditto vinculado por palavra completa ao alvo atual. Negativo, vazio ou espécie diferente não vira confirmação.
- `PgsAutoHuntSettings.java`: preferências **`pgs_hunt_settings_pgsharp_v1`** e **`pgs_hunt_settings_pokemod_v1`** independentes; perfil `other` só prévia. Sem conexão com contas, OAuth, filtros P1/P2, Firebase ou mod manager.
- `PgsAutoMenus.java`: novo atalho **Auto Hunt** dentro de Buscar Pokémon; preserva toolbar de 5 ícones, 30dp, cor/opacidade/limites oficiais. Seções compactas roláveis e acessíveis; opções sem engine ficam claramente `indisponível`.
- `PgsAutoClickService.java`: reuse do motor existente com observação sem toque por default, consentimento separado de clique, intervalo entre alvos, limites por sessão, contagem, pausar em sensor ou aviso explícito de IV100/Ditto; reintentos só para captura do mapa, nunca novos toques cegos, reinício de jogo ou bypass de avisos de conta/`Sou passageiro`. Rotação, modo cliente e perda de serviço invalidam estado de sessão.
- `PgsAutoShinyListener.java`: só aceita origem `com.nianticlabs.pokemongo` ou `.ares` para novas pausas. Notificações de app com `pgsharp` no nome, mas não sendo a janela oficial do jogo, não são prova de origem confiável. PokeList e outros apps não são observados indiscriminadamente.
- `PgsAutoNotificationPolicy.java`: novo canal dedicado `huntEvent`, ID 2104; canal final contém perfil, modo de som/vibração (não sobrescreve canal existente). Sistema Android pode bloquear POST_NOTIFICATIONS/DND e não há como comprovar toque sem aparelho.
- Testes `PgsAutoHuntPolicyTest.java`, adição a `PgsAutoNotificationPolicyTest.java`, `lt366-autohunt-profile-contract.test.js`, QA LT211 e PGS APK QA. **Não marcar CI/APK como concluído antes dos checks reais**.

## Verificações físicas necessárias
Em Samsung Android 11/13/14 (ou outros aparelhos suportados), separadamente com PGSharp e Pokemod:
- conferir menu P/M/G, dois temas, transparência, rolagem, TalkBack e ícones de toolbar existentes; seleção de um perfil não pode migrar consentimento do outro;
- iniciar manualmente Auto Hunt em modo monitor sem clique, com modelos 1/5/10 espécies, e depois ativar toque explicitamente; verificar `dispatchGesture` e reação visual distinta da mensagem `Tocou`;
- verificar 35s entre alvos, badge de contagem, 10 callbacks limite, pausa em Shiny, IV100/Ditto estritamente quando nomeados, pausa no sensor e retomada manual;
- desativação ao vivo no meio do ciclo, mudança de perfil, perda de Acessibilidade, Android permission/DND, 401/403/429 externos, mapa sem resposta e timeout;
- confirmar que não há reinício/teleporte/captura/zoom automáticos; em nenhum caso ignorar aviso humano. Issue #350 deve continuar pendente sem evidência de aparelho.

## ARK LT366 — fechamento oficial (15/11/2026)

- **COMPROVADO:** antes da LT366, PokeSearch oficial LT365 `0.03.61 / 54568`, main inicial `0a230fd812a7ff5bb4e01a7d5a28c06d83d61030`. Screenshots Auto Hunt/PokeList mostram as opções solicitadas, sem provar teleporte/captura/controle do jogo. A autorização para uso dos APKs/APIs já foi declarada pelo proprietário.
- **IMPLEMENTADO:** [PR #432](https://github.com/LucianoToscano/PokeSearch/pull/432), head `003d0c788617fd5267289504660881f5fec18ff7`, squash `7563e9521ff7a76e8d437da785bc7a5f41bfa60c`: submenu Auto Hunt padrão visual P1/P2, preferências PGSharp/Pokemod separadas, opt-in desligado, monitor passivo/gesto confirmado, wait 15/35/60/120, cap de 1/3/5/10 callback(s), pausa Shiny/IV100/Ditto com fonte textual e alvo explícito, canais de notificação separados, releitura de mapa limitada sem gestos adicionais, sensor proximidade que somente pausa, atalho Settings para o usuário conceder acesso a notificações. Não foi implementado Tele, Auto Catch, restart PoGo ou zoom; menu marca como indisponível.
- **TESTADO EM CI:** sete gates `completed/success` no **mesmo SHA** `003d0c788617fd5267289504660881f5fec18ff7`: [Node QA #43758030067](https://github.com/LucianoToscano/PokeSearch/actions/runs/43758030067), [LT169 #43758030041](https://github.com/LucianoToscano/PokeSearch/actions/runs/43758030041), [LT211 #43758030049](https://github.com/LucianoToscano/PokeSearch/actions/runs/43758030049), [Java LT62 #43758030043](https://github.com/LucianoToscano/PokeSearch/actions/runs/43758030043), [OTA LT173 #43758030114](https://github.com/LucianoToscano/PokeSearch/actions/runs/43758030114), [PGS APK QA #43758030048](https://github.com/LucianoToscano/PokeSearch/actions/runs/43758030048) e [Secure beta/R8 #43758030111](https://github.com/LucianoToscano/PokeSearch/actions/runs/43758030111).
- **SOLICITAÇÃO DE VERSÃO:** [PR #433](https://github.com/LucianoToscano/PokeSearch/pull/433), head `7ad79fc3ddf0626892620180c2af3eea5d3d266c`, squash `d596dcbaa124aa11af25813f496864864ce24179`, `0.03.62`, code `54569`, label `51366`, `previous_tag v0.03.61-54568`. Todos gates preflight #43758450376, Node #43758450536, LT169 #43758450405, LT211 #43758450450, Java LT62 #43758450417, OTA #43758450361 e Secure beta/R8 #43758450345 aprovaram antes do merge.
- **PUBLICADO:** [release estável v0.03.62-54569](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.62-54569), [APK oficial](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.62-54569/PokeSearch-v0.03.62-LT.apk) **61.158.659 bytes**, SHA-256 público GitHub `93f4d809759081af74ad1a4e45f648cadf0353cbb65bac9bbabc6700758610e9`. [Workflow permanente #43758728764](https://github.com/LucianoToscano/PokeSearch/actions/runs/43758728764) `completed/success`, source `d596dcbaa124aa11af25813f496864864ce24179`, preflight/publish, assets, R8, certificado oficial SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, validação APK e assinador, release/digest e cleanup de segredos. SHA verificado no GitHub e workflow, **sem download e recálculo independente neste ambiente**.
- **BLOQUEADO FÍSICO/EXTERNO:** formato real dos avisos e notificação proveniente de PGSharp/Pokemod em sessões separadas, Android 11/13/14 Samsung, 1/5/10 espécies, sensor, TalkBack, consumo e DND, relação de gesto Android com efeito no jogo, proteção contra travamentos/aviso de conta. Sem evidência real, não declarar IV100/Ditto/Shiny, teleporte, captura ou reinício validados. Issue [#350](https://github.com/LucianoToscano/PokeSearch/issues/350) contém testes físicos abertos; PR #385 LT350 continua draft.
- **PRESERVADO:** cinco ícones, estilo P1/P2 e Editor Visual; P1/P2, Doce Raro, Edu, OAuth/contas, filtros e favoritos, Radar PokeList, Data Hub, modelos por perfil PGSharp/Pokemod, LT357 Samsung, `Sou passageiro` sempre manual, 401/403/429, OTA e certificado permanente. Não há permissão nova, root, injetor, API privada ou reinício por silêncio. Instalação do APK requer consentimento Android.

**Próximo ARK:** `docs/LT366_PROMPT_CONTINUIDADE_LT367_20261115.md`. Verificar versão pública mais recente antes de novo commit. `versionCode` seguinte deve ser **>54569**, exclusivamente no fluxo oficial.

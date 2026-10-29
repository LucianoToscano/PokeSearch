# PokeSearch — Android Overlay

## Versão oficial atual — LT168 · 0.01.68 · 54373

**Atualização pública confirmada:** [GitHub Release LT168](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.01.68-54373) · [APK oficial assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.01.68-54373/PokeSearch-v0.01.68-LT.apk) · [CI SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40864077543). Merge [PR #112](https://github.com/LucianoToscano/PokeSearch/pull/112), commit do APK `b21bb0aed5f6f919a0a1d0f1d64677f908c2859f`; 49.416.673 bytes; SHA-256 `a331a28b853a23b2bbd0fc02e51d2f483646eac4d21aca717ef7e29faa3ab70f`.

**Conteúdo:** vinculação local e reversível de mensagens antigas no chat, alinhamento e avatar vinculados, tratamento do fundo escuro de ícones de modo compartilhados, e opção de importar backups JSON de preferências/favoritos. Preserva Premium, API, assinatura permanente e P1/P2. **A validação física no Samsung ainda está pendente.**

[Registro canônico LT168](docs/ESTADO_CANONICO_LT168_OFICIAL_20261029.md) · [Guia Mestre](docs/GUIA_MESTRE.md). As seções de LT87 e anteriores abaixo são **históricas**, não definem a versão corrente. Não recomeçar de versões antigas.

---


> **Guia Mestre atual (curto):** [docs/GUIA_MESTRE.md](docs/GUIA_MESTRE.md) — leia primeiro para versões, PRs, arquitetura, QA e últimas decisões. **Arquivo histórico integral (backup imutável):** [docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md](docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md), SHA-256 `f02d6396a3ae6a4e833f78be8aedbe0b8d0b40254f31203644f3040a30e2a861`. Pesquise nesse backup apenas quando houver dúvida histórica; ele não é mais o guia de edição diária.

## Histórico — Estado oficial na LT87 (25/10/2026)

**Versão que era pública em 25/10/2026: 0.00.87 / versionCode 54290.** Atualização oficial publicada mediante autorização expressa do proprietário em [GitHub Releases](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.87-54290), com o APK protegido [PokeSearch-v0.00.87-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.00.87-54290/PokeSearch-v0.00.87-LT.apk). GitHub Actions de publicação [#40170786046](https://github.com/LucianoToscano/PokeSearch/actions/runs/40170786046) **SUCCESS**, última Release estável confirmada pela API GitHub (não Draft nem Prerelease), sha256 `d188bff20191900cc9976fb9b12bca3720a5c0318bf39f75e0d5d9202927617a`, certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, assinatura v2 válida, arquivo 38.607.807 bytes. SOURCE_COMMIT do APK `21d6547e9cb19efe941134d087f2783d6753ee55`; não confundir com commit documental posterior.

**Consolidação:** PR #62 mesclada com método merge em `main`, commit `c35b384a99bd33b5685e8c964d2fdec08b679799`. PR #59 acabou mesclada pelo histórico; #60/#61 encerradas como substituídas; branches e commits preservados. LT84, LT85, LT86 e LT87 estão na `main` sem reinício. O workflow de atualização existente `GitHubUpdateCenter` consulta Releases estáveis e valida SHA-256/assinatura, permitindo exibir o update na Home de instalações antigas compatíveis. Google Drive legado LT79 continua intocado.

**Limitações honestas:** a homologação física mais recente no Samsung está pendente. Os testes CI não comprovam sprites, API com conta vinculada, Despawn, PvP, Get coords, fundos ou arraste no aparelho. As notas **offline** incorporadas ao APK LT87 são as disponíveis quando ele foi compilado, podendo ainda mostrar como última entrada LT83; a notificação da atualização oficial na Home vem independentemente do GitHub Releases e não depende dessas notas offline. Para inserir notas offline LT87 em um APK, será necessário um novo build com versionCode maior. Não republicar um segundo APK diferente sob a mesma tag.

[Checkpoint oficial](docs/ESTADO_CANONICO_LT87_OFICIAL.md) · [Prompt para novo chat](docs/PROMPT_NOVO_CHAT_LT87_OFICIAL.md) · [Checklist Samsung](docs/LT87_CHECKLIST_SAMSUNG.md).

---

## LT87 — Fundos dos Filtros e perfis salvos (somente QA)

- **QA 0.00.87 / versionCode 54290 — não publicar:** branch `fix/lt87-filter-menu-backgrounds-qa-20261025`, [PR #62](https://github.com/LucianoToscano/PokeSearch/pull/62) Draft sobre LT86, sem mudanças na `main` e sem alterar Release LT83.
- **Fundo corrigido:** coluna principal de Filtros, editor lateral de Ordenar/PC/Nível/Clima/Tamanho/Sexo/Forma/etc. e janela ▣ dos três perfis salvos seguem as cores, transparência, bordas e sombras do Editor Visual, também no popup independente. Holder invisível mantém toques no fundo; selecionar filtro recolhe perfis abertos.
- **APK QA protegido assinado:** `PokeSearch-v0.00.87-LT-Filter-Fundos-QA.apk`, Actions [#40168986555 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40168986555), artifact `12590105916`; SOURCE_COMMIT `21d6547e9cb19efe941134d087f2783d6753ee55`; SHA-256 `d188bff20191900cc9976fb9b12bca3720a5c0318bf39f75e0d5d9202927617a`, assinatura permanente v2. Commits documentais posteriores não mudam o binário.
- **Verificação automatizada:** `app/tests/lt87-filter-menu-backgrounds.test.js` (5/5) e suíte histórica aprovada no workflow. **Pendente** confirmação visual Samsung para claro/escuro, transparência, orientação, clique fora e demais regressões LT86.
- **Documentos:** [estado LT87](docs/ESTADO_CANONICO_LT87_QA.md), [checklist Samsung LT87](docs/LT87_CHECKLIST_SAMSUNG.md) e [prompt de continuidade](docs/PROMPT_NOVO_CHAT_LT87_QA.md). Guia Mestre preservado por append no checkout integral; não substituí-lo com retorno truncado de conector.

---

## LT86 — Catálogo completo de Formas e nível 50 (somente QA)


**Informações e resultados LT86:** opção ✓ **Mostrar todas as informações** no Editor Visual > Info Pokémon, mantendo a personalização campo a campo. O cartão exibe Despawn primeiro, valores IV, sexo ⚲, distância e ranks GL/UL/ML somente quando confirmados; rolagem do texto preserva o sprite. **O cartão de detalhes pode ser arrastado pelo cabeçalho independentemente da Pokébola.** Despawn usa também o relógio absoluto fornecido pela API e limpa resultados expirados sem depender do contador visual. Sprites base em rede lenta tentam CDN alternativa após 1,4 s, sem trocar arte de formas especiais. Todas essas correções aguardam QA completo e validação física no Samsung.




**Complemento LT86 Samsung QA:** imagens de espécies padrão receberam correção de solicitações simultâneas na grade de Favoritos e tentativa HTTPS alternativa para sprites verificadas; Informações agora reconhece ⚲ Genderless; a Pokébola não fica limitada pela largura do painel de resultados durante o arraste. Foram criados **3 perfis gerais** discretos no menu Filtros (▣ > Usar/Salvar) e **3 perfis de Favoritos** na aba ▣ junto ao contador (toque para usar, segure para salvar). Favoritos continuam limitados a 50; preferências antigas, Shiny e coordenadas são independentes. **Tudo ainda exige build aprovado e teste físico Samsung.** Consulte [checklist LT86](docs/LT86_CHECKLIST_SAMSUNG.md).



**QA 0.00.86 / versionCode 54289 — não publicado.** Branch `fix/lt86-api-filter-options-qa-20261025`, derivada do checkpoint LT85 PR #60 Draft; PR #59 e main preservadas.

- **Corrigido no código:** Nível Min/Max permite 1–50 na interface (antes terminava em 35); o catálogo de Formas agora fornece até 500 valores (em vez de 200) e permite mostrar mais opções em páginas de 60, preservando chips marcados e a busca por nome.
- **Verificação automatizada nova:** `app/tests/lt86-form-catalog-level.test.js`, além das regressões LT85 e históricas no [workflow QA LT86](https://github.com/LucianoToscano/PokeSearch/actions/workflows/lt86-api-filter-options-signed-qa.yml).
- **Documentação:** [estado LT86](docs/ESTADO_CANONICO_LT86_QA.md), [checklist Samsung](docs/LT86_CHECKLIST_SAMSUNG.md), [prompt de continuação](docs/PROMPT_NOVO_CHAT_LT86_QA.md).
- **Pendente:** CI final, SHA-256 e artifact de LT86, além de todas as verificações físicas Samsung e chamadas autenticadas. Não considerar sprites de formas/trajes especiais resolvidos sem fonte validada. Nenhum merge, Release ou atualização Drive sem autorização.

---

## LT85 — Menus, imagens, filtros e API automática (somente QA)

**QA 0.00.85 / versionCode 54288 — não publicado.** Branch `fix/lt85-menu-repeat-tap-20261025` e [PR #60 Draft](https://github.com/LucianoToscano/PokeSearch/pull/60) sobre a LT84 QA ([PR #59](https://github.com/LucianoToscano/PokeSearch/pull/59)). A última versão oficial segue LT83; a ponte Google Drive LT79 não foi tocada.

O segundo toque no mesmo menu é decidido pelo Android (com proteção de `ACTION_OUTSIDE`); o Dialog de Favoritos fecha ao tocar novamente ⭐. A mensagem recorrente de importar opções do site foi eliminada. No modo API, o filtro Forma vem de `GET /forms`, com escolha de Sexo/Tamanho/Clima/Ordenação, inclusive durante uma pesquisa em andamento. O catálogo de Pokémon pode ser aberto sem digitação e fornece sprites de espécies padrão verificadas, mantendo fallback para formas e trajes sem sprite confirmado.

**A API autorizada agora é a fonte padrão em instalações sem opção anterior salva**, com preferência manual para utilizar DOM; a navegação DOM não é acionada para burlar autenticação ou limites HTTP. Nenhum JWT ou reveal_code passa à ponte Java.

- [Documentação LT85 e pendências Samsung](docs/LT85_MENU_REPEAT_TAP_QA.md).
- [Build QA protegido e assinado — SUCCESS #40165405694](https://github.com/LucianoToscano/PokeSearch/actions/runs/40165405694): APK v0.00.85/54288, SHA-256 `9d41afad67e81a2d149774513f8277705d35dc7a73fdbce2b9320e91aa5859b5`, SOURCE_COMMIT `80b5f580533a39dfcbc45fdf65dce1148ca7fbe5`, artifact #12588151967. QA não publicado.
- Homologação de interfaces, Get coords API real, Shiny e login físico Samsung permanece pendente. **Nenhum merge/release sem autorização.**

---

## LT84 API direta — QA isolada, não publicada

A integração autorizada existente foi fortalecida na branch `fix/lt84-authorized-api-direct-qa-20261025`. **LT84 0.00.84 / 54287 é somente QA**, não substitui a LT83 oficial nem altera a ponte Google Drive LT79.

- **Build Android assinado, R8 e regressões:** [Actions #40163046534](https://github.com/LucianoToscano/PokeSearch/actions/runs/40163046534) — SUCCESS. APK QA `PokeSearch-v0.00.84-LT-API-QA.apk`, **38.604.999 bytes**, SHA-256 `bdd5fcd32099d2724f528e42e6e0436d70451065751d42048ea735dd6317e351`, extraído do artifact e verificado contra SHA256SUMS. Não é versão pública.
- **Teste real anônimo da API:** [Actions #40163231365](https://github.com/LucianoToscano/PokeSearch/actions/runs/40163231365) — SUCCESS para /health, /forms, catálogo e um POST /search 15/15/15 sem JWT ou reveal. Não equivale a teste com treinador autenticado.
- **Guia Mestre preservado e apendicado:** [Actions #40163154255](https://github.com/LucianoToscano/PokeSearch/actions/runs/40163154255) — SUCCESS.
- Corrigidos Retry-After/429, busca antiga após espera por catálogo, reveal repetido, limpeza efetiva de coords e `Any` versus `Genderless`; preservar o DOM independente e a preferência API opt-in desligada por padrão.
- **Ainda pendente:** testes de login e Shiny com treinador real, Get coords por reveal real, comparação integral de filtros e homologação física Samsung. Alertas dos resultados API continuam suspensos em QA. **Sem merge ou publicação oficial.**
- Referência: [estado LT84 QA](docs/ESTADO_CANONICO_LT84_QA.md) e [diário técnico LT84](docs/LT84_API_DIRECT_QA.md).

---

## Estado oficial verificado — 25/10/2026

**Última versão pública: LT83 — `0.00.83` / `versionCode 54286`.** GitHub Releases [v0.00.83-54286](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.83-54286), APK `PokeSearch-v0.00.83-LT.apk`, **38.603.587 bytes**, SHA-256 `451e4781581122908f014a893f693c8312b36b2c222a8579c499c6c3e2975c1c`. Certificado de assinatura permanente SHA256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. APK release R8 não depurável, assinatura v2 confirmada; build [#40159949347](https://github.com/LucianoToscano/PokeSearch/actions/runs/40159949347) SUCCESS, publicação [#40160258112](https://github.com/LucianoToscano/PokeSearch/actions/runs/40160258112) SUCCESS. **Commit exato do APK:** `5cf9adb62efb97a185ec955cab6eb0f49fbb4e88`.

**Motivo LT83:** o usuário apresentou foto física do Samsung na LT82 com coordenadas parcialmente ocultas, controles fora do painel, encolhimento e filtro geográfico não confirmado. LT83 inclui janela Location 286dp estável, elementos alinhados em grid sem overflow e reconhecimento mais robusto do formulário móvel oficial, mas **QA no Samsung com LT83 ainda está pendente**; não afirmar correção física definitiva sem novo teste.

**Atualização de usuários:** instalações LT79+ consultam o GitHub Releases pelo atualizador do próprio app, verificam hash e assinatura e requerem confirmação do instalador Android. A Home das versões antigas ainda usa [manifesto Google Drive](https://drive.google.com/file/d/15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf/view) para migrar inicialmente à **LT79 `0.00.79` / 54282**; o Drive **não** aponta para a última versão. GitHub é a fonte atual das versões oficiais. Respeitar WorkManager/Doze/permissões.

**Notas da Home:** o histórico LT79/LT80/LT82/LT83 foi preparado posteriormente em `app/src/main/assets/release_notes.json`. Como o APK 0.00.83 já estava assinado e publicado, essa melhoria de histórico entrará apenas em um próximo build. Não confundir documentação do repositório com conteúdo já instalado.

**Controle de código:** [PR #57](https://github.com/LucianoToscano/PokeSearch/pull/57) **MERGED em `main`** no commit `f5f97cb6036dfbdd158711780fd68fc1acaa125e` (merge de histórico, sem alterar os bytes do APK LT83). Branch original `fix/lt83-location-recovery-geometry-20261025` preservada. PR #56 da LT82 foi supersedida; PRs históricos #34/#49 permanecem separados. Commits futuros de docs podem avançar o HEAD da `main` sem alterar a versão distribuída. Referência atual detalhada: [docs/ESTADO_CANONICO_LT83.md](docs/ESTADO_CANONICO_LT83.md). O documento [LT82](docs/ESTADO_CANONICO_LT82.md) torna-se apenas histórico, não a versão mais recente. **Prompt de continuidade atualizado:** [docs/PROMPT_NOVO_CHAT_LT83.md](docs/PROMPT_NOVO_CHAT_LT83.md).

**Invariantes:** `applicationId com.lucianotoscano.pokesearch`, namespace `com.lucianotoscano.pokesearchoverlay`, JDK 17, Gradle 8.11.1, compileSdk 36, targetSdk 33, minSdk 26, Android Overlay + WebView + `probe.js`, sem backend/proxy/GPS físico, máximo dez resultados. **Enriquecer, nunca empobrecer o app:** preservar Pokémon, formas, IV/PvP, Shiny, Clima, Favoritos, alertas, sons, Editor Visual, atualizações assinadas, preferências e histórico; não misturar PvPPokeGo.

---

## Histórico anterior (preservado)

**Histórico de desenvolvimento inicial: v0.50-beta (versionCode 50).** Aplicativo Android independente, dedicado exclusivamente à pesquisa e visualização flutuante de Pokémon, para testes privados de desenvolvimento. Package ID: com.lucianotoscano.pokesearch; minSdk 26, compileSdk 36, Java 17, Gradle 8.11.1.

## Interface e funcionamento
- Sobreposição compacta sobre Pokémon GO com engrenagem arrastável. Toque na engrenagem para expandir/recolher somente as opções; sprites permanecem visíveis e deslocam-se para baixo quando as opções estão abertas.
- Seta para cima sob a coluna recolhe TODOS os resultados e opções; engrenagem restaura sprites. X vermelho ao lado do coração encerra o overlay.
- Modos IV100, GL#1, UL#1 e ✨ Shiny opcional, independente da liga. Busca automática OFF, 5, 10, 15 e 20 minutos; mínimo de 60 segundos entre consultas efetivamente submetidas. O site fornece até dez resultados conforme limite.
- Sprites P/M/G próximos, com rolagem; ficha de CP/IV/nível/rank/sexo/tamanho/golpes/local/despawn e coordenadas quando disponíveis.
- Menu de configuração em janela separada, com largura responsiva e 12 ícones compactos lado a lado em uma linha (altura base 34dp), expandida somente quando necessário. O resto da tela do jogo continua recebendo toques fora da coluna de Pokémon e da barra.
- Favoritos (até 50) no próprio overlay, com busca e Concluir dentro de um único quadro cinza translúcido, blur condicional ao suporte do Android. Alertas gerais/de favoritos, relatório ⚠ TXT/WhatsApp, Pix voluntário.
- Login via site oficial PoGoCoordinates só quando necessário para ✨. Ao concluir, o usuário permanece na Home do PokeSearch, e a sessão é atualizada. O app não solicita senha ou código de amizade em campo próprio.
- Guia rápido ilustrado com os mesmos ícones do overlay no primeiro uso e disponível na Home.

## Verificações e distribuição
O GitHub Actions em [build-overlay.yml](.github/workflows/build-overlay.yml) executa testes de sintaxe e contratos JavaScript, lint, Gradle assembleDebug, teste de unidade, validação ZIP, versão e assinatura APK v2, gerando APK, ZIP do código-fonte, checksum SHA256SUMS e docs.

**Importante:** a assinatura de debug do CI não é chave persistente de distribuição e pode mudar, impedindo instalação sobre builds anteriores. Este é um APK **beta de teste**; não alegar funcionamento real no aparelho sem testar. Para distribuição estável, usar keystore privada persistente, backups seguros e confirmação do proprietário. Atualizações do site podem mudar o DOM e causar falhas de busca. Respeitar os termos e a autorização aplicável ao PoGoCoordinates; não tentar contornar limites. Não registrar códigos de amizade, cookies ou credenciais nos relatórios.

## Arquivos mestres
- [Arquivo mestre v0.50](docs/ARQUIVO_MESTRE_v0.50.md) — única referência prioritária para retomar o projeto em outro chat.
- [Auditoria v0.50](docs/AUDITORIA_v0.50.md) — bugs, correções, matriz de testes e riscos.
- Histórico v0.38–v0.40 preservado em docs; mestre mais antigo v0.36 no Google Drive.
- [Catálogo de bugs e melhorias](https://docs.google.com/spreadsheets/d/1aam5N7DNnzMqJj5giZTdsAmzWkHTWPj-uKcUUVwreiI/edit).

## Próximos passos
Testar no Android a nova interação da engrenagem, recolhimento da coluna, pass-through de toques, seletor de favoritos, login Google/Discord, consultas IV100/GL/UL/✨ e tutorial. A cor translúcida permanece caso o dispositivo não suporte blur. Use ⚠ para exportar diagnóstico TXT sem compartilhar credenciais.

Projeto não afiliado à Niantic, Nintendo ou The Pokémon Company.

## Localização opcional — v0.42
Um **único ícone 📍** na barra de opções abre ou oculta o editor de localização. Dentro do editor, ao lado do campo de latitude/longitude, a chave ON/OFF ativa ou desativa o filtro; um slider permite raio entre **0 e 1.000 km**. Ocultar o painel não altera o estado do filtro. OFF remove coordenadas e raio aplicados pelo app e mantém o modo IV100/GL#1/UL#1 e Shiny que estavam selecionados. Antes de enviar a busca, o aplicativo confere os valores no formulário oficial. A proteção entre consultas permanece em vigor.

## v0.43-beta — indicador permanente do raio + revisão da barra
- Com o filtro 📍 **ON**, o botão de localização exibe o raio em km dentro do mesmo ícone e o dock mostra uma pequena etiqueta `📍 50 km`, inclusive quando as opções estão recolhidas, sem adicionar outro botão. Quando 📍 está OFF, a etiqueta desaparece.
- Corrigida a grade do menu: 12 botões em 12 colunas, com X vermelho na mesma linha e ao lado do coração Pix, sem que o X seja empurrado para uma segunda linha.
- Ao trocar de localização para filtros ou AUTO, o painel de coordenadas libera o foco do teclado e volta ao tamanho normal. Ocultar o editor mantém o filtro ON; desligar limpa os valores do site conforme verificação.
- Nenhum código de treinador, token de autenticação ou coordenadas completas é acrescentado à etiqueta. O app preserva limites mínimos de pesquisa.

## v0.44-beta — correções de usabilidade
Barra responsiva com posicionamento vertical quando não couber ao lado da engrenagem, sequência consistente dos 12 controles, seta contrastante, favoritos mais translúcidos, feedback de AUTO/atualização manual e validação mais rígida das coordenadas. Revisão em código e testes automatizados não substitui comprovação no celular.

## v0.45-beta — AUTO e Shiny
Vencimentos limpam a lista sem iniciar consultas extras; login cancela buscas antigas; falha de Shiny diferencia vínculo pendente de estado não comprovado. Diagnóstico captura apenas status categórico de sessão. Comprovação de uso físico ainda pendente.

## v0.46-beta — Menu e autenticação
Abertura dos popovers IV100/GL/UL, AUTO e localização sem clipping, inversão direita/esquerda da barra e sincronização dos dois WebViews, área de toque ampliada, chevron visível, favoritos translúcidos, login/logout na Home com retorno após autenticação detectada. OAuth externo e interação Android ainda dependem de validação física.

## v0.47-beta — auditoria e projeto editável
O settings.gradle.kts já existia na v0.46; importar a pasta raiz no Android Studio. A entrega contém Gradle Wrapper 8.11.1 e PNG do ícone gerados no CI, scripts, testes e documentação. Gerador do ícone executa sem X11 e é testado quanto à consistência. Erros de WebView e parsing registram classe de exceção, nunca URL, credenciais ou mensagem bruta.

Mantido targetSdk=33 neste beta: foregroundServiceType=specialUse não foi habilitado sem avaliação de permissões/políticas Android 14+. Migração planejada em etapa separada. Teste Samsung, OAuth e Shiny real ainda pendentes.

## v0.48-beta — Notificações, diagnóstico privado e testes Samsung
Ícone de notificação monocromático em `app/src/main/res/drawable/ic_notification.xml` aplicado ao serviço e aos alertas. Relatórios usam um sanitizador puro Java com testes próprios, preservam delimitadores de linha reais e exibem aviso para revisão antes do envio. Tratamento de exceção no fechamento de janelas e envio de notificações registra apenas classe/etapa. Consulte `docs/GUIA_TESTE_SAMSUNG_v0.48.md`. O alvo Android permanece targetSdk 33 deliberadamente. O ZIP-fonte contém projeto editável, scripts, testes e Gradle Wrapper.

## v0.49-beta — B06 e ciclo de vida
Runnables de login, página e recarga têm nome, cancelamento e guarda por requestGeneration. LOGIN_BEGIN cancela atualização automática, expirados e busca enfileirada; LOGIN_END reinicia em segurança; REFRESH_LOGIN aguarda 350 ms após sincronizar cookies. onDestroy cancela todos os timers, remove três janelas antes de destruir WebViews e as interfaces JS. Catches adicionais de média importância registram só etapa/classe. Manifest, targetSdk33, compileSdk36, ícones, UI e o aplicativo independente permanecem preservados. Teste Samsung/OAuth real ainda pendente.

## v0.49 — ajustes PS-075–PS-080
Botões "🔔 Testar notificação" nos Favoritos e nas Preferências; Back do Android navega no WebView do login; elimina corrida LOGIN_END/REFRESH_LOGIN; coordenadas aceitam sinal explícito "+", preservando validação; abertura do menu sincronizada uma vez; retorno IV100 inacessível removido e aviso de privacidade atualizado. Consulte [Guia Samsung v0.49](docs/GUIA_TESTE_SAMSUNG_v0.49.md). OAuth e experiência Samsung ainda exigem teste físico.

## v0.50-beta — manutenção de permissões, preferências e segurança
PS-081: solicitação de POST_NOTIFICATIONS no teste manual da Home, com envio automático se aprovada; orientação sem solicitação no seletor flutuante. PS-082: SYNC_PREFS atualiza localmente sprite, ordenação, timers e alertas no overlay sem rede. PS-084: logs de falhas de leitura de catálogo/assets registram etapa e classe. PS-085: sanitização de code/state/session_id/discord_token em parâmetros soltos. Callbacks evaluateJavascript recusam respostas quando requestGeneration muda ou loginPaused. Código B06 e ordem onDestroy preservados. Manter targetSdk 33, compileSdk 36, Manifest e a identidade do PokeSearch inalterados. [Guia Samsung v0.50](docs/GUIA_TESTE_SAMSUNG_v0.50.md). Validação real no aparelho ainda pendente.

## v0.50-beta — ajustes complementares da experiência Android (14/10)
Feedback de usuário: engrenagem e seta totalmente sem cartão de fundo, paleta neutra cinza/branco translúcida, menu lateral sem espaçamento vertical indevido e ícone de localização menor. AUTO agora inclui OFF (sem execução periódica); aviso de novos Pokémon aceita desligado, ligado ou silencioso, com canais separados. Ao abrir o painel de login, o WebView tenta acionar o link oficial de entrada, sem inventar rota OAuth. Incluída tolerância a Intent de serviço com action nula. A pasta externa `Documentacao/` do pacote completo traz apenas seis arquivos vigentes; histórico permanece em `PokeSearchOverlay/docs/`. A integração real com o site, os resultados IV/GL/UL e a autenticação OAuth em múltiplos aparelhos Android ainda demandam validação física.

## Independência e compatibilidade Android
PokeSearch possui código, documentação, namespace e distribuição **próprios**. Não faz parte de outro repositório ou produto. O alcance técnico parte de `minSdk 26` (Android 8.0), e a compatibilidade precisa ser verificada em dispositivos reais de várias marcas, versões e formatos — não só em um Samsung. A aprovação de CI não substitui esses testes.

**Padrão visual estável:** elegância minimalista cinza/branco, transparência dos botões flutuantes, ícones centralizados, uma única linha de 12 ações compactas, margens de 2 px entre botões e zero espaços vazios artificiais. A área de toque do menu permanece restrita à sua janela; o restante do jogo continua acessível. [Matriz Android e critérios de aceitação](docs/GUIA_COMPATIBILIDADE_ANDROID_v0.50.md). O roteiro [Samsung SM-S928B](docs/GUIA_TESTE_SAMSUNG_v0.50.md) é somente um caso de teste.

### Ajustes complementares PS-086–PS-088
O retorno do login móvel agora detecta também o marcador de conta ativa próximo ao filtro Shiny, não apenas o botão Sair, que pode estar oculto. Após autenticação confirmada, o diálogo fecha e retorna ao PokeSearch mesmo se o Shiny ainda não estiver ativado; a ativação ocorre no serviço e precisa de confirmação pelo site. O toque em ✨ opera no switch da página atual, sem obrigar a selecionar antes Stats/PvP e sem aguardar cooldown da busca. Quando o menu abre próximo ao topo, engrenagem e sprites se movem juntos, minimizando buracos visuais.


### Fluxo de login mínimo — revisão final da v0.50-beta
A tela de login do PokeSearch oculta inicialmente a página extensa de pesquisa do PoGoCoordinates atrás de um indicador nativo discreto. Primeiro verifica a sessão; caso não esteja autenticado, tenta acionar o botão oficial de acesso e então revela a autenticação real do próprio site/provedor. Ao confirmar sessão, fecha automaticamente o diálogo e volta à Home do PokeSearch, **sem depender de Shiny ligado**. Caso o site mude e o controle de entrada não seja localizado, disponibiliza a opção **Mostrar o site para entrar**, sem prender o usuário em carregamento. Não inventar endereços OAuth, não copiar formulários, não coletar credenciais. A aparência/fluxo reais dependem de teste Android e do DOM do PoGoCoordinates.

## PS-090 — Correção do menu e do login acionado por ✨
**Pedido confirmado por captura:** restaurar o menu original com **12 ícones pequenos lado a lado em UMA única linha** (34dp), cores cinza/branco e sem espaçamento artificial; retirar a grade 6×2 (66dp), que foi uma regressão de UX. Os filtros continuam ativos sem alteração funcional. Ao tocar ✨ deslogado, o fluxo de login deve tentar o botão oficial ou o próprio switch Shiny da aba Pokémon, sem mostrar primeiro a página de pesquisa. Após a autenticação, retorna automaticamente ao PokeSearch; o switch passa a ser gerenciado e confirmado no serviço. Uma máscara neutra só desaparece quando os controles reais de autenticação estão disponíveis. Se o DOM do site mudar, o fallback voluntário permite mostrar o site, nunca um bloqueio sem saída. Respeitar o Manifest/targetSdk/identidade do aplicativo independente. OAuth real e interface em diferentes Androids exigem validação física.

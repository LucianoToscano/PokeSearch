# PokeSearch — LT379 — Dossiê de auditoria independente para outras IAs
**Data de corte:** 16/11/2026. **Objetivo:** permitir que outra IA ou auditor Android reproduza os achados, detecte regressões e continue o projeto sem inventar resultados, trocar componentes ou perder histórico.

> Este documento NÃO declara uma auditoria exaustiva de todos os arquivos do repositório nem homologação em telefone. É um pacote técnico de evidências verificadas, defeitos reproduzíveis em fonte, regras permanentes e roteiro de auditoria independente. O auditor deve reabrir os arquivos e consultar o estado vivo do GitHub antes de agir.

## 1 — Estado canônico confirmado

- Repositório: https://github.com/LucianoToscano/PokeSearch; branch principal **main**.
- Na abertura deste trabalho: main **5aa764a0f330cacc51598ada03cabdc9b65e2b7b**, após merges das PRs **#461** e **#462**.
- **Última release pública comprovada:** [v0.03.72-54579](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.72-54579), versionName **0.03.72**, versionCode **54579**, label **51378**, publicada em **2026-11-16T23:04:12Z**, não draft, não prerelease.
- [APK oficial dessa release](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.72-54579/PokeSearch-v0.03.72-LT.apk): **61.196.759 bytes**; digest informado pelo GitHub: **SHA-256 4d1f99f92e81544d13714e18d72edfdb6c6026c929ef9aed69f850cefafc3f0e**.
- Workflow protegido de publicação [#43975405288](https://github.com/LucianoToscano/PokeSearch/actions/runs/43975405288): **completed / success**. Certificado permanente registrado no build: SHA-256 **34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e**. Estes são dados do workflow/GitHub; não afirmar verificação independente local da assinatura ou instalação física.
- Correção Home LT378 na [PR #461](https://github.com/LucianoToscano/PokeSearch/pull/461); pedido monotônico e release na [PR #462](https://github.com/LucianoToscano/PokeSearch/pull/462). A PR **#457 da Pokédex pessoal** permanece aberta e separada; não misturar.
- Esta auditoria acompanha a branch **fix/lt379-novidades-internas-historico-20261116**. A correção LT379 é nova e **não deve ser tratada como publicada em APK até haver nova release comprovada**. Reconsultar a PR, a main e os gates antes de registrar seu estado final.

## 2 — Pedido do proprietário (fonte funcional, sem interpretação livre)

Ao tocar a versão no rodapé da Home, abrir **Novidades / Histórico de atualizações DENTRO DO APLICATIVO**, usando a interface nativa já existente. **Não** ir à página GitHub Releases e **não** abrir navegador externo. O usuário também informa que a própria janela Novidades não está funcionando; investigar e reparar, não apenas alterar o clique. Gerar prompt de continuidade e este dossiê para revisão por outras IAs.

Permanecem válidos os ajustes LT378 da Home: remover texto/logo escrito “PokeSearch”, subtítulo “POKÉMON GO”, faixa “PGS Monitor: desligado” sem espaço reservado, e sufixo “PoGoCoordinates /search”; preservar o emblema original, botões, menu, contas e funções. Auto Hunt/Buscar Pokémon deve partir em OFF, sem armar busca apenas por reconexão do serviço de Acessibilidade.

## 3 — Defeitos comprovados por inspeção de fonte

### D-01 — Rodapé abre destino errado — CONFIRMADO (alto impacto UX)

Fonte: **app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java**, construção da Home, bloco “TextView footer”. A LT378 associou ao toque **Intent.ACTION_VIEW** com URL **github.com/.../releases/tag/v<version>-<code>**. Isso contradiz o pedido atual. Já existe implementação interna via **ReleaseNotes.showHistory(this)** usada por **Menu > Novidades** no mesmo MainActivity. Não é necessário construir tela externa, WebView ou endpoint.

**Correção LT379 em branch:** o rodapé chama diretamente **ReleaseNotes.showHistory(this)** e anuncia “Novidades e histórico de atualizações” em acessibilidade. O menu mantém a mesma função nativa. A alteração não modifica fluxo OTA, instalação, auth ou cookies.

### D-02 — Leitor de notas descarta o histórico atual — CONFIRMADO (bloqueador)

Fonte: **app/src/main/java/com/lucianotoscano/pokesearchoverlay/ReleaseNotes.java**, método **entries(Activity)**. Antes da correção, o loop de leitura impunha **out.size()+size > 96000** e então retornava um **JSONArray vazio**, silenciosamente. O arquivo **app/src/main/assets/release_notes.json** da main tem **318.606 caracteres** e **198 entradas** (última: minVersionCode 54579), portanto é maior que 96.000 bytes mesmo no limite inferior ASCII. Assim, na versão 0.03.72, o leitor pode rejeitar integralmente um catálogo válido e exibir “Ainda não há notas publicadas”.

**Correção LT379 em branch:** limite de leitura **MAX_NOTES_BYTES = 2 * 1024 * 1024**; continua limitado em memória e abaixo do tamanho máximo de arquivo OTA assinado (**OtaAssets.MAX_FILE = 3 MiB**). Nenhum recurso remoto não assinado passa a ser aceito. É necessário verificar o tamanho em bytes no CI a cada novo lançamento e, no futuro, particionar/otimizar o catálogo se aproximar do teto.

### D-03 — Histórico renderizado integralmente em uma única abertura — RISCO DE DESEMPENHO COM BASE NO CÓDIGO

Fonte: **ReleaseNotes.showHistory()** invertia a ordem de todos os registros e **showDialog()** criava todas as seções/textos sem limite de visualizações. Com 198 releases e vários tópicos cada, a interface pode gerar muitos TextViews na UI thread. **Não há medição física de ANR ou travamento**; este é risco estrutural, não falha reproduzida em Samsung.

**Mitigação LT379 em branch:** paginação por **HISTORY_PAGE_SIZE = 12**, botão “Ver versões anteriores”, carregamento incremental em tela. O arquivo histórico permanece completo e em ordem recente→antigo.

### D-04 — Testes estáticos validavam comportamento já errado — CONFIRMADO

Fontes: **app/tests/lt378-home-clean-autohunt-off-release-link.test.js**, **lt73-home-footer-version.test.js**, **lt75-real-drive-update.test.js** ainda exigiam o link externo; **overlay-ux.test.js** procurava literalmente o antigo limite **96000**. Estes contratos tornavam possível um CI verde com experiência contrária à intenção do usuário.

**Correção LT379 em branch:** contratos ajustados para o destino nativo e o novo limite; criado **app/tests/lt379-novidades-internas-contract.test.js** com regressão específica do tamanho real do catálogo, paginação, integridade estrutural, rodapé e menu.

### D-05 — Exibição automática condicionada a atualização e onboarding — COMPORTAMENTO EXISTENTE; REVALIDAR PRODUTO

Fonte: **ReleaseNotes.maybeShowAfterUpgrade()**: só agenda aviso após atualização identificada, não na primeira instalação limpa; há marcadores “LAST_OPENED_VERSION”, “PENDING_VERSION” e “LAST_SHOWN_ID”. Em **MainActivity.onCreate()**, o fluxo normal depende de **Intent.ACTION_MAIN** e **tutorialSeenV41**. Isso explica situações em que o pop-up não aparece automaticamente na primeira abertura, mas **não justifica** a falha do histórico manual. A intenção de produto precisa ser distinguida: **manual sempre disponível**; automático conforme política de update. Não alterar o onboarding sem uma decisão explícita.

### D-06 — OTA pode substituir o catálogo embarcado — RISCO A VALIDAR

**ReleaseNotes.entries()** utiliza **OtaAssets.open(a, "release_notes.json")**; **OtaAssets** procura primeiro um pacote OTA assinado ativo, depois o recurso do APK. Revisar se uma versão OTA mais antiga do JSON poderia ocultar a entrada da versão atual e se o leitor deve favorecer, com integridade verificada, o catálogo mais novo. **Sem evidência observada de OTA obsoleto ativo no telefone do usuário**. Não desabilitar validação de assinatura para resolver isso.

### D-07 — Documento de entrada de outras IAs desatualizado — CONFIRMADO

**LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md** ainda destaca LT337 **0.03.36/54543** como “atual” em trecho histórico, embora a release pública comprovada seja **0.03.72/54579**. A introdução deve remeter ao presente dossiê e afirmar que se trata de histórico. Nunca deduzir versão atual a partir de texto antigo sem consultar GitHub Releases.

## 4 — Mapa técnico obrigatório

| Área | Origem canônica | O que preservar e observar |
|---|---|---|
| Home/rodapé/menu | app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java | Emblema, tema, cartões de conta, footer interno, badges P1/P2, botões existentes |
| Notas e histórico | ReleaseNotes.java + app/src/main/assets/release_notes.json | Leitura validada, versão elegível, memória, paginação, menu e pop-up, acessibilidade |
| OTA de recursos | OtaAssets.java + scripts/build_ota_pack.py | Assinatura, hash, limites e fallback; nunca carregar pacote não autenticado |
| Assinatura e versões | app/build.gradle.kts + release/official-request.json | applicationId, assinatura permanente, versionCode monotônico, R8 |
| Publicação | .github/workflows/pokesearch-official-release.yml | preflight, ambiente protegido, build oficial, SHA-256, release pública |
| Auto Hunt | PgsAutoClickService.java + PgsAutoHuntSettings.java | OFF na conexão; ativação explícita; não confundir monitoramento com captura |
| Contas independentes | PogoAccountSlots.java + Login no MainActivity.java | Conta 1/Conta 2/Visitante, cookies separados, OAuth oficial |
| Visual e sprites | OverlayService.java, SecondaryOverlayService.java, editor visual, assets | Escala P/M/G, Minior, overlays compactos, tutoriais e filtros |
| Inventário | PR #457 em branch separada | Não integrar ou sobrepor mudanças da Pokédex sem escopo específico |
| Governança | AGENTS.md; docs/GUIA_MESTRE.md; docs/ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md | QA, merge, publicação, documentação e prompt, sem inventar aprovação |

## 5 — Matriz mínima de QA funcional em dispositivo (NÃO EXECUTADA NESTA AUDITORIA)

| Cenário | Resultado esperado | Evidência necessária |
|---|---|---|
| Android 11 Samsung / instalação limpa | Menu > Novidades e toque na versão abrem a mesma janela interna; lista carregada | Vídeo + versão instalada + marca do aparelho |
| Atualização 0.03.72→nova LT | Aviso automático só uma vez, política de onboarding respeitada | Vídeo primeira e segunda abertura + prefs de teste |
| Tema escuro/claro | Texto legível, diálogo não cortado, botão Entendi funcional | Duas capturas |
| Histórico 198+ releases | Primeira página rápida; Ver versões anteriores carrega outras 12 sem perder a posição | Medição aproximada de fluidez, vídeo, memória/ANR se ocorrer |
| Sem internet e sem login | Notas embarcadas continuam legíveis | Desligar rede, abrir Home e Novidades |
| OTA assinado ativo | Entrada correta da versão instalada; nunca renderizar notas falsas | Manifesto validado, versão do asset, registro local sem dados privados |
| JSON danificado/muito grande | Falha segura, Home abre, sem travamento; mensagem não enganosa | Teste de instrumentação e logs sem segredos |
| TalkBack / fonte grande / zoom | Rodapé enunciado corretamente, histórico rolável, botão carregar mais acessível | Teste Android A11–A14 |
| Auto Hunt após reiniciar serviço | Bolha OFF, nenhum clique/varredura sem toque recente explícito | Vídeo do serviço/overlay; status de Accessibility |
| P1/P2 contas e visitante | Nenhuma regressão de autenticação, filtros, sessão, notificações | Testes manuais independentes com conta de teste |

**Regras de prova:** toda ocorrência deve terminar em **PASSOU / FALHOU / BLOQUEADO / NÃO EXECUTADO**, com commit, ambiente e vídeo/log. Sem acesso ao telefone, jamais declarar homologação física.

## 6 — Gates automatizados e aceite

Executar, NO MESMO SHA que será integrado: Node QA, LT169 completo, LT211 core, LT62 Java, LT173 OTA, PGS APK debug QA, Secure beta/R8 e regressões relevantes como LT83, LT73, LT75, LT378 e **LT379**. Examinar resultados e logs (não apenas o status geral). Qualquer falha bloqueia merge/publicação e exige nova execução após correção.

**Aceite técnico LT379:**
1. Rodapé abre **ReleaseNotes.showHistory(this)** sem ACTION_VIEW nem browser.
2. Menu > Novidades usa o mesmo destino nativo.
3. O catálogo **198+ entradas** abre com tamanho real acima de 96 KiB, sem retorno vazio causado pelo limite.
4. Histórico recente→antigo paginado; não truncar nem apagar notas antigas.
5. Modo automático continua condicionado à atualização verificada; visualização manual não apaga marcadores.
6. Nenhum token, cookie, conta, perfil, filtro ou permissão modificado pela leitura das notas.
7. App ainda compila e assina com o certificado permanente; dados e versões anteriores preservados.
8. Testes físicos não executados constam como pendência real.

## 7 — Instruções de auditoria para outras IAs

1. Reabrir os arquivos exatos (não confiar em respostas anteriores nem em documentos históricos que dizem “atual”).
2. Separar **fato de fonte**, **evidência de workflow**, **inferência técnica** e **teste real de dispositivo**. Cada achado deve apontar linha/classe/commit e reprodução.
3. Procurar defeitos adicionais com impacto prático, principalmente UI main-thread, parse/memória, recuperação de OTA, erro de JSON, upgrade markers, acessibilidade, layout/densidade e startup do Auto Hunt.
4. Não substituir o diálogo de novidades por site GitHub, navegador, WebView ou janela inventada. Não converter “Novidades” em mecanismo de download/instalação.
5. Não editar a arte original das Pokébolas, não mexer em cookies OAuth, não integrar PR #457 inadvertidamente.
6. Não copiar de outro aplicativo acesso privado, assinatura, sessão ou identidade; usar as integrações oficiais e guardas existentes.
7. Registrar onde a IA anterior **fez suposição incorreta**: associou palavra “Release” automaticamente ao GitHub e reforçou a decisão errada com testes. Conferir intenções explícitas antes de cristalizar comportamento em contratos.
8. Não confundir supervisão, caminhada externa, tentativa de captura e captura efetivamente confirmada.
9. Se chamado **ARK**, cumprir toda a política obrigatória de merge/publicação **após** gates e validação da assinatura permanente, sem lançar APK de QA como oficial. Se não houver pedido de publicação, não declarar versão nova pública por haver PR.
10. Preparar relatório independente com tabela: *achado; evidência; severidade; causa; correção recomendada; código afetado; cenário de regressão; prova; status*.

## 8 — Próxima etapa e ressalvas

Este arquivo acompanha a correção da LT379 em branch de desenvolvimento; **o APK oficial existente 0.03.72 continua com o defeito até nova publicação e instalação**. Próxima versão, caso autorizada e homologada pelo processo ARK, deve ser superior a **54579** e preservar o certificado permanente.

Documentação relacionada: [política ARK](ARK_POLITICA_OBRIGATORIA_MERGE_PUBLICACAO.md), [encerramento LT377](LT377_ARK_RELEASE_OFICIAL_20261116.md), [Guia Mestre](GUIA_MESTRE.md), [prompt de continuidade LT380](LT380_PROMPT_MESTRE_NOVO_CHAT_20261116.md).

**Regra final:** não concluir a auditoria declarando “tudo corrigido” enquanto a janela real de Novidades não for exercitada no Android. CI automatizado é necessário, mas não é teste físico.

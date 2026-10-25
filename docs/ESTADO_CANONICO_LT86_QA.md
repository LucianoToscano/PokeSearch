# ESTADO CANÔNICO LT86 QA — 25/10/2026

## Base verificada
- **Versão oficial**: LT83 0.00.83 / versionCode 54286; não publicar substituição.
- **LT84**: PR #59 Draft sobre main; **LT85**: PR #60 Draft sobre LT84.
- Base de código LT86: LT85 HEAD `61fd1887a2904bcb0725eb0a3be33ffc2cd150a2`.
- Branch isolada: `fix/lt86-api-filter-options-qa-20261025`; versionName planejada **0.00.86**, versionCode **54289**. **Somente QA**, sem merge/release.
- Assinatura permanente esperada: SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- APK LT85 QA preservado: `PokeSearch-v0.00.85-LT-API-QA.apk`, SHA-256 `9d41afad67e81a2d149774513f8277705d35dc7a73fdbce2b9320e91aa5859b5`.

## Alterações demonstráveis pelo código
1. `dock.html`: campo Nível mínimo/máximo permite 1 a 50, conforme contrato HTTP `level_min/level_max` da API. Antes o front rejeitava 36–50 embora a API permitisse.
2. `api_android_session.js`: consulta `/forms` passa a disponibilizar até 500 valores em vez de truncar nos primeiros 200. A especificação local registra catálogo com aproximadamente 333 formas.
3. `dock.html`: lista de Formas permanece leve, mostrando os primeiros 60 e controle **Mostrar mais formas** em incrementos de 60; buscar por texto reinicia a paginação sem apagar seleções. Preserva os botões já existentes, tradução, seleção múltipla e marcadores `aria-pressed`.
4. Novo teste `app/tests/lt86-form-catalog-level.test.js` cobre catálogo simulado de 333 formas, busca da última, navegação visual e validação `level_min/level_max` com 50 e rejeição de 51.
5. Novo workflow LT86 de build assinado com JDK17 / Gradle 8.11.1 / Android 36 / R8 / regressões históricas / pacote e assinatura v2 / artifact privado.

## Invariantes
`applicationId com.lucianotoscano.pokesearch`; `namespace com.lucianotoscano.pokesearchoverlay`; nenhuma nova ponte de JWT/reveal_code; sem proxy/backend/GPS físico, 10 cartões no máximo; API ON apenas sem preferência anterior e DOM opt-out preservado. Nenhuma alteração em login Google, Firebase, notificações, Editor Visual, movimentação de barra, assinatura, `main`, PR #59 ou PR #60.

## Gates ainda pendentes
- CI precisa aprovar o código final e registrar GitHub Actions + artifact + SHA-256 real do APK; não presumir sucesso apenas porque um workflow foi iniciado.
- Homologar no Samsung: menus, Formas >200, sprites, Pokémon e trajes, PC/Nível, localização 24.9407581,121.1889794 em 0/215/1000 km, limpar, GL/UL, Shiny com conta vinculada, pesquisa com filtros, Get coords e 429.
- Testes simulados não demonstram API autenticada, rede atual nem resultado físico no Samsung.
- Guia Mestre `docs/GUIA_MESTRE.md` tem mais de 1,4 MB: somente append no checkout real com verificação de tamanho, nunca `update_file` usando resposta vazia/truncada do conector.
- **Sem publicação ou merge antes de autorização expressa.**


## Complemento Samsung — sprites, Genderless, arraste e filtros salvos

Nova evidência visual do proprietário no Samsung (25/10/2026): sprites ainda ausentes, falta do símbolo neutro Genderless ⚲ nas Informações, impossibilidade de arrastar a Pokébola até a direita com metadados expandidos e problemas de janelas. Pede também até três perfis salvos independentes para filtros gerais e Favoritos.

Correções de código nesta branch QA:
- `PokemonPicker.java`: corrigido o gate global de download em que dois ImageViews com mesmo Pokémon só atualizavam o primeiro. Todos os interessados pelo mesmo dex aguardam o único download, que é entregue pela main thread e tem cache; fallback HTTPS a CDN espelho do repositório PokeAPI somente para sprite padrão, limitado a 256 KiB e PNG.
- `api_android_session.js`: espécie padrão sem traje pode reconhecer rótulo de forma `Normal` no catálogo; formas especiais continuam sem sprite suposto.
- `dock.html`: sprite padrão com tentativa controlada de CDN alternativo após falha do GitHub raw, depois placeholder; `Genderless`/⚲ como símbolo neutro em Informações.
- `OverlayService.java`: a largura da janela de resultados deixa de limitar o movimento da Pokébola; as janelas são limitadas independentemente e os resultados reancorados no fim do arraste. Nenhum aumento da área transparente de toque.
- Perfis gerais 1–3 em menu discreto ▣ de Filtros, com ações Usar/Salvar e persistência sob `generalFilterPresetV1_*`; carregamento reaproveita `setSearchConfig` validado. Perfis NÃO modificam Shiny ou localização, que têm controles próprios; excluídos preexistentes preservados.
- Perfis de Favoritos 1–3 em aba ▣ posicionada entre título e contador; toque no número carrega, pressionar prolongado salva; armazena sob `favoritePresetV1_*`, deixando `watchList` anterior intacta até carregar explicitamente. Até 50 Pokémon, áudio e notificações não modificados.
- Teste `app/tests/lt86-samsung-followup.test.js`: guardas de identidade do sprite, símbolo, geometria e ambos os perfis. Testes simulados NÃO demonstram que o host de imagens está acessível no telefone.

Não afirmar que todos sprites foram carregados nem que janelas ficaram estáveis no Samsung sem novo teste físico. O número de versão QA permanece **0.00.86/54289** enquanto não existir release público.

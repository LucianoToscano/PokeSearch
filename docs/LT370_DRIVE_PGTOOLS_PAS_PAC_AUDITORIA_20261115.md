# PokeSearch LT370 — Auditoria de fontes do Drive e Busca Inteligente estilo PaS/PaC

Data: 15/11/2026. Pasta consultada (leitura apenas): https://drive.google.com/drive/folders/1Rra1dB-jKrZyHtxxm6ciB3Iy0DmuB09w
Base do aplicativo: LT369 0.03.65 / versionCode 54572. **Este documento é código candidato em branch, NÃO APK oficial publicado.**

## Evidências inspecionadas

1. **PGTools 6.1.1**: APK principal (9.304.247 bytes, SHA-256 começa com `78dd12648c7d2983`) e APK teste (9.303.991 bytes, SHA-256 começa com `e274663bb4b8b0de`). Ambos contêm `assets/web.zip` com módulos Vue compilados `AutoPaS-*.js`, `AutoPaC-*.js`, `ShinyConfig-*.js`, `MenuScreen-*.js`. **A inspeção foi estática**: nomes de componentes e chaves de UI, não código-fonte autorizado de backend, não execução em aparelho.
2. **AutoPaS** contém referências de interface a: Shiny list/exclusions, `CATCH_NON_SHINY`, nível mínimo/máximo, espécies/formas/trajes/sexo/tamanho, `CUSTOM_IVS`, coordenadas/raio, varredura global, limites `MAX_CATCH` e opções de bolas/captura. Isso é comprovação de **campos de interface**, não de suas semânticas completas.
3. **AutoPaC** referencia modalidades `NORMAL`/`ULTIMATE`, `CATCH_MODE`, `BERRIES`, `BALLS`, `TRANSFER_OPTIONS`, `ITEM_INVENTORY_OPTIONS`, `POKESTOP_SPIN_GAP_TIME`, `DEFAULT_TIME_DELAY`, alertas, estatísticas, auto task. Uso seguro como inspiração de navegação modular, sem copiar bytecode, assets ou sugerir que o PokeSearch já executa captura automática.
4. **Pokemod 14.2.1** (48.886.418 bytes; SHA-256 começa com `a671a80e9454882b`): APK com `assets/pokemod-injector`, `assets/busybox-arm64`, `assets/sqlite3-arm64` e bibliotecas nativas `libconceal`/`libfancier`. Indica arquitetura diferente de um overlay de Acessibilidade. **Não importar/injetar** componentes binários, root ou mecanismos internos do Pokemod no PokeSearch; manter compatibilidade de tela e modelos.
5. **Velocity 8.8.2** (2.084.665 bytes, SHA-256 começa com `25b2d81e18dceb53`): APK com um DEX e recursos, sem `assets/` próprio no ZIP. Nenhum contrato de API ou função operacional verificado nessa inspeção.
6. **PokeList** (6.926.501 bytes, SHA-256 começa com `9592895ad3216933`): recursos `assets/pokemons.json`, `rocket.json`, `rocketleader.json`, `sounds/shiny_alert.mp3`. A especificação `API_PokeList_spec.md` da pasta documenta parâmetros `mons`, `ivMin/Max`, `levelMin/Max`, coordenadas e atributos de resposta, mas registra explicitamente que a API `moonani.com` é de terceiro e sua autorização **não foi verificada**. Não executar chamadas de teste nem integrar backend sem contrato/licença válida; não copiar áudio.
7. **Inventário PokeGoBR** `POKEGOBR_MASTER_TOTAL_FONTES_APIS_BANCOS_IMAGENS_SONS_APKS_2026-11-09.md`: recomenda catálogo canônico, `SourceRegistry`, `LicenseRegistry`, metadados por espécie/forma, importação local e separar API de miniatura visual. O próprio inventário não comprova direitos nem funcionamento de fontes externas.

## Gargalos confirmados no PokeSearch LT369

- `app/src/main/assets/pgs-native/manifest.json` inclui `provider:"pgsharp"`, `providerVersion:"0.435.2"` e **`entries: []`**. Não afirmar biblioteca nativa completa de modelos do feed.
- `PgsAutoCatalog.selected()` define favoritos; `PgsAutoTemplateStore` separa modelos por perfil; `PgsAutoIconDetector` exige imagem de feed real. Sprites genéricas de Pokédex **não são** templates automaticamente reconhecíveis.
- PGSharp e Pokemod compartilham pacotes do jogo; app/manager instalado não prova mod ativo.
- Motor de captura automática real, verificação de bolas/frutas/inventário, sucesso de captura e Shiny sem notificação positiva **não existem homologados**. `dispatchGesture` comprova no máximo resposta do Android, não sucesso no jogo.

## LT370 entregue nesta branch (escopo funcional verificável)

- Aba Ação simplificada em três objetivos: **Procurar Shiny**, **Auxiliar encontros**, **Procurar + auxiliar**. Avançado mantém Monitorar, Clicar, Auto Hunt e Editor de Sequências LT367/LT369. Não apaga dados preexistentes.
- Objetivos, escopo (`Disponíveis (até 10)` ou `Meus favoritos`) e repetir ciclo ficam em `PgsSmartSearchSettings` por perfil. Selecionar uma opção nunca inicia gestos.
- Modelos de reconhecimento vêm apenas de miniaturas de feed já aprovadas/ativas. `PgsAutoTemplateStore.activeForProfile()` permite leitura por cliente sem trocar estado global, com teto de 10 por scanner; o contador mostra indisponibilidade antes de iniciar.
- Botão **Detectar** compara PGSharp/Pokemod por duas capturas independentes de modelos do respectivo cliente. Somente correspondência estável e **não ambígua** troca o perfil; caso contrário, seletor manual fica disponível, sem toque ou inferência baseada no manager.
- PaS assistido exige permissão real para avisos do jogo (`PgsAutoShinyListener.hasAccess`); o listener só registra Shiny mediante mensagem explícita. Ausência de aviso não comprova ausência de Shiny.
- PaC **assistido** valida sprite do feed, autoriza toque opt-in no alvo e, quando consegue observar a janela de encontro, pausa e avisa para **captura manual**. Não arremessa bola, não utiliza frutas/reciclagem, não marca captura concluída e não inspeciona memória do jogo.
- Repetir/desativar ciclo usa o motor pré-existente; sessão inteligente isolada de modos antigos e sequências. Limitadores de aviso, jogo em primeiro plano, Acessibilidade e Android 11+ permanecem.
- Conteúdo das três abas usa **uma só área de rolagem**, com status/Iniciar fixos, seguindo geometria e transparência P1/P2.

## Próximas melhorias possíveis — NÃO entregues

P0. Homologar screenshot de PGSharp/Pokemod em Android 11/13/14 para produzir modelos autorizados do feed com hash, espécie, cliente e versão; sem isso Auto não tem como inferir.
P0. Capturar screenshots de encontro normal/Shiny e sinais confiáveis para leitor independente; somente prova explícita de Shiny autoriza classificação. Sem sinal, parar e solicitar intervenção.
P1. Assistente de captura por visão computacional com estados verificáveis (tela de encontro → bola/fruta visível → gesto autorizado → tela pós-resultado), com bloqueio se não houver evidência; **não declarar full PaC** antes de ensaios físicos.
P1. Perfis prontos `Shiny`, `Captura assistida`, `Combinado`, filtros de espécies/formas, limites por sessão, temporizador e pré-visualização de regras — conforme fontes e dados realmente observáveis.
P1. Biblioteca nomeada de sequências, favoritos compartilhados sem contaminar modelos cliente, logs distinguindo identificação, gesto Android e resultado no jogo, cancelamento/undo e diagnóstico de imagens ausentes.
P2. Histórico estatístico opt-in, exportação/importação local de filtros e horários, inventário/catálogo somente a partir de fontes próprias ou permitidas com `LicenseRegistry`, cache e proteção `429 Retry-After`.

## Validação e segurança

- **Não aplicar código de injeção, bypass de avisos, root, permissões novas ou ativos proprietários** dos APKs de referência.
- Auditoria é estática: não inspecionou o funcionamento real dos apps terceiros, nem validou direitos autorais só pelo nome "Autorizado".
- Gate obrigatório: Node, Java, LT169/LT211, OTA, QA APK, R8 no mesmo SHA; testes Android físicos separados. Nenhuma publicação oficial é concluída neste documento.

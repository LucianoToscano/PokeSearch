# LT339 — Home: novos ícones, controles e menu lateral (EM EDIÇÃO)

**Data:** 14/11/2026. **Base oficial:** LT338 0.03.37 / versionCode 54544 / fonte `a870b3e2` após registro documental.  
**Status:** implementado na branch de trabalho `feature/lt339-home-icon-menu-refactor-20261114`. **Sem PR de merge, APK, alteração em release/official-request.json ou publicação** por pedido explícito do responsável. A LT338 continua sendo a última versão instalada/distribuída oficialmente.

## Artes recebidas — 6 PNGs originais preservados

| Enviado | Recurso Android | Dimensões originais | SHA-256 |
|---|---|---|---|
| Pokebola 1 e 2 Off.png | `res/drawable-nodpi/home_pokeball_off.png` | 256×256 | `922f1314c60f0c102dcac34669117af24628390d9402e3e6197205fab18fe203` |
| Pokebola 1 e 2 On.png | `res/drawable-nodpi/home_pokeball_on.png` | 256×256 | `bdd744da75d7f3a118179f88e789f83496ec262b2e1f16590fab8cd4a80fac6e` |
| Busca_Pokemon.png | `res/drawable-nodpi/home_search.png` | 1000×1000 | `5e203b9a61b26204d62ba68147bf60a1e823abf1995f8074bbba46401ba4d183` |
| Weather_Menu.png | `res/drawable-nodpi/home_weather.png` | 256×256 | `3b6b6031a4de92ee06ede025a2c78c6b49e4d19e9331c3367b374702457da768` |
| Modo_Claro.png | `res/drawable-nodpi/home_mode_light.png` | 512×512 | `40353e440a644d2f44b040aabace3d516c339db2265dc763fc6fa482d4b04c3f` |
| Modo_Escuro.png | `res/drawable-nodpi/home_mode_dark.png` | 512×512 | `360f66c9c04e535dca757d588b0286c2fbbca67f0b676a977b250410fbe74089` |

Todos os 6 SHA-256 acima identificam os PNGs fornecidos diretamente pelo responsável, **sem redução, conversão, recorte ou quantização**. A mesma imagem OFF/ON serve às Pokébolas 1 e 2, que mantêm estados separados dos serviços Android. O novo ícone Busca Pokémon preserva a abertura funcional do painel `PgsBuscasPanel`. Weather preserva seu estado atual de atalho em desenvolvimento.

## Home — organização

- Fileira única de 10 ícones sem fundo mantida, incluindo P1/P2, Busca Pokémon, Passes, Raids, Power Spots, Quests, Rocket, Weather e Doce Raro.
- Doce Raro permanece no slot de 44dp, mas agora com 7dp de recuo interno, reduzindo seu tamanho visual para aproximar o do ícone Quests; comparar em Samsung após futura build.
- No topo: relógio do Edu, Apoiar, **ícone para alternar Claro/Escuro**, **ícone Compartilhar** e Menu; sem o texto do antigo botão Compartilhar. O tema claro aplica cor de contraste ao desenho branco da lua sem alterar a arte PNG. O comando usa a preferência `homeLightMode` existente, sem tocar nos filtros/contas.
- Removidas da Home as caixas inferiores de **Ativos agora**, **Instalações**, **Compartilhar app** e **Agradecimentos**, mantendo dados e ações no menu.
- Removido da Home o texto Premium **"Conta Premium · Gerenciar / Sair"**, preservando o fluxo original em **Menu > Conta**. O acesso Premium permanece restrito a `PremiumAccess.controlled()`.

## Menu lateral

- O menu tem rolagem vertical interna, sem cortar os comandos em telefones compactos.
- Nova aba **Conta**, com `Voltar ao menu`, Pokébola 1 · Conta, Pokébola 2 · Conta e Conta Premium · Gerenciar / Sair (quando autorizado); reutiliza os métodos existentes sem criar nova sessão.
- Compartilhar e Agradecimentos continuam disponíveis no menu principal.
- Os contadores Firebase de Ativos agora/Instalações aparecem na seção **ESTATÍSTICAS** no fim do menu. Os listeners permanecem centralizados em `FirebaseStats`; nenhum contador ou identificação pessoal é inventado.
- O menu preserva Favoritos, Transparência, Preferências, Exportar/Importar, Filtros PGSharp, Chat, Guia rápido, Novidades e Reportar.

## Compatibilidade, testes e pendências

- Ajustados testes históricos de Home, homenagens, Premium e temas para a organização nova, sem retirar funções.
- Novo contrato Node `app/tests/lt339-home-icons-drawer-contract.test.js` exige 6 hashes, dimensões, transparência, estados ON/OFF, funções, drawer Conta e proibição de voltar a montar os painéis ocultos na Home.
- QA estrutural do código e hashes são possíveis sem compilar. **Build Gradle/Android, inspeção visual P/M/G, toques Samsung, integração completa e homologação física permanecem PENDENTES**, conforme decisão de não gerar APK nesta rodada.
- **Não incrementar code nem atualizar release_notes** até receber as próximas alterações solicitadas. Não acionar workflow que construa APK nem abrir PR que possa acionar pipelines de APK.
- A issue #350 da homologação PGS continua pendente e não é modificada aqui.


## Segunda etapa: Busca Pokémon ON/OFF e overlay com indicador central (14/11/2026)

**Pedido do responsável:** substituir o ícone único de Busca Pokémon na Home por dois estados, e a antiga mão provisória do PGS por dois desenhos de Pokébola cinza. A LT339 continua apenas na branch de desenvolvimento, sem gerar APK, sem merge e sem publicação.

| Finalidade | Arquivo de recurso Android | Dimensão da fonte | SHA-256 |
|---|---|---|---|
| Home ativada | `busca_pokemon_on.webp` | 1000 × 1000 WebP lossless RGBA | `3384542e8e70826aeae1c17b219cacd5c7618e9914949d8de836f350c80e9be9` |
| Home desativada | `busca_pokemon_off.png` | 1536 × 1536 RGBA | `657e147f978ff30e124e16b444cac1bdf6e107d00e101f119dcf92a352eee6bb` |
| Overlay desativado | `busca_pokemon_overlay_off.webp` | 1254 × 1254 WebP lossless RGBA | `51ef63deb8589e4cd5c68e2557095e96a0c05da094199e26757d4b1e0b95389b` |
| Overlay ativado | `busca_pokemon_overlay_on.webp` | 1254 × 1254 WebP lossless RGBA | `db04e55514310df4c7ad46ada7571a0b0bf3fa8f212d8797e434ae22c1f37eef` |

**Preservação:** as artes ON e overlay são WebPs lossless originais, com extensão correta no Android e sem redução de qualidade. A imagem Home OFF chegou como JPEG RGB com fundo preto sólido, que apareceria como quadrado. Foi criada uma derivação RGBA por recorte de transparência, sem redimensionamento; **o original JPEG exato foi preservado** em `app/src/main/assets/ui-originals/busca_pokemon_off_original.png` (SHA-256 `1d84fe6975f531797ae4f1364195c90913670c5cebea0ecd0885b1b421445b54`). Nenhuma imagem anterior da Home foi excluída.

- `MainActivity`: o slot da Home mantém a abertura do `PgsBuscasPanel`, mas exibe `busca_pokemon_on/off` conforme o estado efetivo `PgsAutoClickService.isSearchActive()`, não conforme um boolean de preferência. Um temporizador leve de 1 s atualiza o ícone quando a Home está ativa, sendo removido em `onPause/onDestroy`. Toque continua abrindo as configurações; **não inicia gestos nem concede permissão**.
- `PgsAutoClickService`: remove os drawables `pgs_hand_on/off` do botão visual e usa `busca_pokemon_overlay_on/off`; preserva a alternância por toque, segurar para menu, arraste, coordenadas salvas, reconhecimento, detecção de Shiny e ações originais.
- Geometria explicitamente compartilhada com a Pokébola de resultados em `dock.html`: **arte 21 dp** no slot **35 × 30 dp**, com área tocável independente de **44 × 44 dp**. Não amplia o bloco transparente de toque nem reduz as fontes PNG.
- Indicador separado sobre o centro: **branco** parado/normal; **verde piscando** enquanto lê/procura/confirma Pokémon ou aguarda/carrega o mapa; **vermelho piscando** em falha, captura ausente, modelo ausente ou tempo do mapa esgotado. Pulso de alpha exclusivamente no indicador central em **850 ms**, como `@keyframes psCapturePulse` da Pokébola de resultados. O resto da imagem fica estático.
- A transição de estado é calculada em `PgsAutoVisualState`, separada do motor de gestos; evitar piscar o PNG inteiro. O overlay OFF usa sua arte de desligado, sem diminuir globalmente a opacidade para não apagar o branco central.
- Mensagens que mencionavam a “mão” nos painéis foram atualizadas para “Busca Pokémon”, sem alterar o fluxo de Acessibilidade.

### Validação da segunda etapa

- **24/24 cenários Java do estado visual** aprovados localmente usando `javac/java`, sem gerar APK.
- Contratos Node existentes `pgs-buscas-contracts.test.js`, `lt123-sprites-stats-home.test.js` e `lt339-home-icons-drawer-contract.test.js` atualizados para os novos recursos/estados e os hashes de origem.
- Sem workflow Android ou release disparado; **compilação integral Android e teste visual/físico Samsung permanecem pendentes**. Não alegar homologação de gestos ou status de mapa sem aparelho.
- **Não publicar ainda.** Aguardar as próximas mudanças nesta mesma LT339 até autorização explícita do usuário para gerar APK e lançar a versão.



**Correção AAPT no QA da PR #355:** os três arquivos recebidos com container WebP lossless haviam sido registrados incorretamente como `.png`, causando erro real de compilação de recursos. Os recursos Android foram renomeados para `.webp` preservando byte a byte os originais; o JPEG de referência Home OFF permanece em `assets/ui-originals/busca_pokemon_off_original.jpg`. O novo `lt339-home-icons-drawer-contract.test.js` confere a assinatura VP8L, dimensões e SHA-256. A imagem OFF transparente derivada continua como PNG real.

## Capturas de tela em PoGoCoordinates · Perfil (14/11/2026)

- **Solicitação Samsung:** a tela "PoGoCoordinates · Perfil" exibia a mensagem Android "Este aplicativo não permite capturas de tela." A causa no PokeSearch é o `FLAG_SECURE` imposto à janela `loginDialog` em `MainActivity.java` (antes de mostrar e depois de `show()`), também no modo de gerenciamento de conta.
- **Implementação na branch LT339:** `ProfileScreenshotPolicy` permite captura apenas com `loginPurpose="manage"`, carregamento concluído sem erro e URL `https://pogocoordinates.com/profile` (query e fragmento admitidos). Em `onPageFinished`, a proteção é removida somente se a URL final ainda corresponde à do WebView. Em `onPageStarted`, navegação SPA para fora, falha HTTP principal ou falha de rede, o `FLAG_SECURE` é restabelecido. Login Google/Discord, OAuth, pesquisa, outras origens, HTTP e URLs suspeitas permanecem protegidos. Ao sair, o estado é limpo.
- **Testes:** `ProfileScreenshotPolicyTest.java` contém 17 cenários Java puros, positivos e negativos; `lt339-profile-screenshot-contract.test.js` valida a integração com a Activity. Os 17 cenários Java passaram localmente com javac 21, sem Gradle. Teste real de captura no Samsung continua pendente.
- **Privacidade:** screenshots do Perfil podem incluir e-mail, treinador e outros identificadores; compartilhar somente com consentimento e após ocultar dados pessoais. Não exportar cookies, tokens ou senha pelo PokeSearch.
- **Sem APK e sem merge:** o pedido de continuar acumulando alterações na LT339 permanece. A release oficial ainda é LT338. Nenhuma alteração em assinatura permanente, permissões, contas ou serviço de Overlay.


## Quarta etapa — Overlay Buscar Pokémon compacto e notificações próprias (14/11/2026)

**Evidência:** capturas do Samsung mostram a barra PGS com quatro controles (Buscar, Tempo, Sino e Mais) e um segundo painel grande "MAIS" contendo Reportar, Doar, Reiniciar buscas e Fechar. Essa divisão não seguia a densidade dos menus rápidos do PokeSearch, além de duplicar ações gerais.

**Implementado na MESMA branch LT339, sem APK:**

- `PgsAutoMenus.showToolbar()` exibe agora uma **única fileira compacta** de cinco botões: `⌕ Buscar | ⏱ Tempo | 🔔 Notificações | ↻ Reiniciar | × Fechar`. Cada botão continua com **44×44 dp** (4 dp entre controles), borda, opacidade, raio e cores compartilhados com `OverlayQuickMenus.panelColor(context)`. Largura de 246 dp com posicionamento limitado à tela.
- Removidos a entrada "•••", `showMore()` e o submenu grande "MAIS", inclusive suas opções `Reportar` e `Doar` **apenas deste overlay**. Essas ações gerais continuam na Home/menu principal do PokeSearch. As ações existentes de **Reiniciar** (`retryNow()`) e **Fechar** (`closeOverlay()`) foram ligadas diretamente aos dois últimos botões, sem criar segundo motor/serviço.
- O painel `🔔 NOTIFICAÇÕES · PGS` segue a tipografia/cores/altura compacta do PokeSearch e possui rolagem interna em aparelhos menores. Três canais e preferências **exclusivos do PGS**, nunca os de Pokébola 1 ou 2: **Novos Pokémon** (apenas ícone de alvo confirmado em duas capturas e deduplicado), **Pokémon de Buscas** (teleporte para alvo confirmado) e **Shiny** (somente sinal real positivo do PGSharp, homologação física pendente).
- Cada categoria tem `Padrão`, `Forte`, `Mudo` e `Personalizado` (seleção entre os sons de `PokeSoundLibrary`, prévia e botão de confirmação `✓ Usar áudio`) e **botão próprio de testar notificação Android**. O teste é apenas local e não simula encontro Shiny. `shinyVibrate` permanece independente.
- Persistência única e exclusiva `pgs_auto_settings_v1` para `newSound`, `searchSound`, `shinyMode`, `*SoundIndex` e `shinyVibrate`; **não** escrever em `prefs` nem em `WatchAlerts.PREF_FAVORITE_TONE`/`PREF_GENERAL_TONE`. `PgsAutoNotificationPolicy` mantém IDs/canais Android distintos por evento/modo/áudio, permitindo escolher novos sons sem tentar alterar um canal de áudio imutável já criado pelo Android.
- O sistema Android continua responsável por permissões `POST_NOTIFICATIONS`, volume, Não Perturbe e substituição/silenciamento de canais pelo usuário. Os alertas Shiny usam agora um único canal com som configurado, sem disparar o ringtone manual em duplicidade. Alertas de estado "Pausado/Concluído" seguem canal PGS anterior por compatibilidade.
- O feed confirmado armazena assinaturas relativas de espécie+posição (máximo 150 por sessão) para não disparar incessantemente a notificação de "Novo Pokémon" ao reler a tela. As verificações de gestos, duas capturas, filtros, pausa Shiny e limites mantêm seu fluxo anterior.
- Fonte: `PgsAutoMenus.java`, `PgsAutoClickService.java` e `PgsAutoNotificationPolicy.java`. Contratos `app/tests/pgs-buscas-contracts.test.js`, `app/tests/lt339-pgs-compact-notifications-contract.test.js` e casos puros `app/tests/PgsAutoNotificationPolicyTest.java`.
- **QA neste estágio:** 26 verificações estruturais e 20/20 testes da política Java pura (sem APK) realizadas e aprovadas sobre a branch; testes Java unitários versionados, mas **não** representam validação de Android. Compilação completa, recebimento e áudio das três notificações, gestos, toque/posicionamento e aparência em Samsung permanecem pendentes. Não iniciar workflow de APK; **sem PR/merge/release/OTA** até o usuário terminar suas solicitações. Release oficial continua LT338.


## Quinta etapa — Auditoria funcional de Lucario, ciclo automático e Shiny correto (14/11/2026)

**Relato do responsável:** seleção de Lucario e comando "gravar ícone" não iniciavam corretamente a gravação; menu de cinco tempos/repetição não explicava o que aconteceria depois do teleporte. Foi feita leitura do código atual (não inferência a partir da imagem): `PgsBuscasPanel`, `PgsAutoMenus`, `PgsAutoClickService`, `PgsAutoTemplateStore`, `PgsAutoIconDetector`, `PgsAutoMapReadiness` e `PgsAutoShinyListener`.

### Problemas confirmados no código anterior

- A Home só gravava `pending_name` e instruía o usuário a encontrar outro comando oculto no overlay para iniciar a seleção: um fluxo de dois passos não intuitivo.
- Após gravar modelo, o motor do detector não era recarregado imediatamente, de modo que a primeira busca podia continuar sem o novo arquivo.
- O modo de feed vazio mantinha esperas configuráveis de 60/120 segundos que não correspondiam ao ciclo desejado. A lista de locais visitados também podia ficar travada indefinidamente quando restavam somente posições já tocadas.
- `post_load` tinha padrão de 5 segundos. O alerta Shiny positivo não validava a identidade da espécie do destino (`currentTargetName`): poderia interromper por uma espécie diferente.
- `PgsAutoMapReadiness` aceitava um mapa muito texturizado sem marcador identificável, potencial falso positivo. Indicadores de PokéStop/gimásio **não provam** que todos os Pokémon 3D tenham aparecido.
- `checkMap` dependia de `takeScreenshot` retornar para continuar; uma captura pendurada não garantia próximo destino em 60s.

### Correções implementadas na branch LT339

- **Gravar Lucario em fluxo guiado:** o botão de cadastro na Home chama `PgsAutoClickService.requestTeaching(s.name)`; o serviço mantém a solicitação pendente e aguarda que o usuário abra o **feed do PGSharp**. Ao detectar essa tela, esconde o menu e botão de overlay, captura o frame, exibe a seleção para o usuário tocar no centro do **ícone pequeno** de Lucario (nunca no Pokémon 3D), persiste o PNG com `PgsAutoTemplateStore.saveSample`, limpa o pedido e executa `reloadDetector()` antes de confirmar. Cancelar limpa a pendência; falhas exibem motivo. A seleção de câmera no menu flutuante usa a mesma ação. O cadastro continua controlado por consentimento humano na etapa de escolha do alvo.
- **Ciclo único:** até **60 segundos** para mapa com marcadores confiáveis (sinais heurísticos com estabilidade temporal), depois **2 segundos** para aviso Shiny da mesma espécie; sem confirmação, avança automaticamente ao próximo destino. Sem carregamento até o limite, também avança. Watchdog paralelo evita ficar preso se uma captura do Android não retornar. Sem novos ícones no feed, nova leitura após **3 s**, com reinício da fila após esgotar as posições já visitadas.
- **Shiny da espécie atual:** `PgsAutoCyclePolicy.shouldPauseForTarget` exige busca em andamento, espera do mapa e **notificação positiva explicitamente contendo o nome** (inclusive tratamento de `(amostra N)`). Notificação genérica `Shiny: true` ou de espécie diferente **não comprova** que Lucario seja Shiny. A pausa e o alerta só são acionados quando os critérios forem satisfeitos. Não se afirma validação de Pokémon Shiny 3D sem dados de origem.
- **Menus Tempo simplificados:** Home e overlay exibem uma explicação curta do ciclo e **apenas dois ajustes** (máximo mapa 60 s / espera Shiny 2 s), com limites seguros de 20–120 s e 1–10 s. Repetição/reiniciar redundantes removidos da UI, mantendo compatibilidade de dados antigos. A migração única `cycle_60_2_migrated` não apaga informações, contas, modelos ou histórico.
- **Validação:** `PgsAutoCyclePolicyTest.java` com casos de tempo, espécie e ausência de evidência; `lt339-pgs-cycle-capture-contract.test.js` e contratos atualizados. Pipeline QA Core e PGS incluem políticas Java puras de notificações/ciclo. A auditoria da fonte **não** substitui avaliação do feed/PGSharp real.
- **Homologação obrigatória pendente:** o detector depende do desenho e escala verdadeiros do feed e das permissões Android; o teste com ícone Lucario, detecção de mapa/PokéStops e qualidade das notificações deve ser confirmado em Samsung na issue #350. Para mensagens do PGSharp sem nome da espécie, o motor mantém regra conservadora, não declara falsa detecção. Não inventar sucesso físico.

**Publicação solicitada nesta etapa:** após CI Node/Java, compilação Android/R8, revisão do pedido monotônico, assinatura permanente e integridade verificada, preparar merge/release oficial. Não dispensar esses gates nem alegar instalação no Samsung.

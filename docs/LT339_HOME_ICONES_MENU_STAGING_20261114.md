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
| Home ativada | `busca_pokemon_on.png` | 1000 × 1000 RGBA | `3384542e8e70826aeae1c17b219cacd5c7618e9914949d8de836f350c80e9be9` |
| Home desativada | `busca_pokemon_off.png` | 1536 × 1536 RGBA | `657e147f978ff30e124e16b444cac1bdf6e107d00e101f119dcf92a352eee6bb` |
| Overlay desativado | `busca_pokemon_overlay_off.png` | 1254 × 1254 RGBA | `51ef63deb8589e4cd5c68e2557095e96a0c05da094199e26757d4b1e0b95389b` |
| Overlay ativado | `busca_pokemon_overlay_on.png` | 1254 × 1254 RGBA | `db04e55514310df4c7ad46ada7571a0b0bf3fa8f212d8797e434ae22c1f37eef` |

**Preservação:** as artes ON e overlay são os arquivos originais sem redução de qualidade. A imagem Home OFF chegou como PNG RGB com fundo preto sólido, que apareceria como quadrado. Foi criada uma derivação RGBA por recorte de transparência, sem redimensionamento; **o original RGB exato foi preservado** em `app/src/main/assets/ui-originals/busca_pokemon_off_original.png` (SHA-256 `1d84fe6975f531797ae4f1364195c90913670c5cebea0ecd0885b1b421445b54`). Nenhuma imagem anterior da Home foi excluída.

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


## Capturas de tela em PoGoCoordinates · Perfil (14/11/2026)

- **Solicitação Samsung:** a tela "PoGoCoordinates · Perfil" exibia a mensagem Android "Este aplicativo não permite capturas de tela." A causa no PokeSearch é o `FLAG_SECURE` imposto à janela `loginDialog` em `MainActivity.java` (antes de mostrar e depois de `show()`), também no modo de gerenciamento de conta.
- **Implementação na branch LT339:** `ProfileScreenshotPolicy` permite captura apenas com `loginPurpose="manage"`, carregamento concluído sem erro e URL `https://pogocoordinates.com/profile` (query e fragmento admitidos). Em `onPageFinished`, a proteção é removida somente se a URL final ainda corresponde à do WebView. Em `onPageStarted`, navegação SPA para fora, falha HTTP principal ou falha de rede, o `FLAG_SECURE` é restabelecido. Login Google/Discord, OAuth, pesquisa, outras origens, HTTP e URLs suspeitas permanecem protegidos. Ao sair, o estado é limpo.
- **Testes:** `ProfileScreenshotPolicyTest.java` contém 17 cenários Java puros, positivos e negativos; `lt339-profile-screenshot-contract.test.js` valida a integração com a Activity. Os 17 cenários Java passaram localmente com javac 21, sem Gradle. Teste real de captura no Samsung continua pendente.
- **Privacidade:** screenshots do Perfil podem incluir e-mail, treinador e outros identificadores; compartilhar somente com consentimento e após ocultar dados pessoais. Não exportar cookies, tokens ou senha pelo PokeSearch.
- **Sem APK e sem merge:** o pedido de continuar acumulando alterações na LT339 permanece. A release oficial ainda é LT338. Nenhuma alteração em assinatura permanente, permissões, contas ou serviço de Overlay.

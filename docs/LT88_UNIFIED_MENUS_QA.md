# PokeSearch — LT88 Tema Unificado de Menus (QA)

Data: 25/10/2026
Branch: `feature/lt88-lt93-evolution-20261025`, PR #63 Draft.
Base oficial, inalterada: `main` LT87 0.00.87 / 54290.

## Relato do teste Samsung
As capturas de 05:47–05:49 mostram o mesmo app com fundos diferentes entre Filtros, Modos, Localização, Favoritos e Pokémon. Copiar/Colar foi posicionado indevidamente no cabeçalho Localização. Pedido explícito: padronizar todas as superfícies, transparência inicial 50%, slider de desfoque no Editor Visual e Copiar/Colar no lugar original.

## Alterações efetuadas
- `visual_editor.js`: default de `menuTransparency` passa a 50 (valor de transparência, não de opacidade); novo `menuBlur` padrão 4 px com slider 0–16 px em Menu > Cores e guias; propaga `--visual-menu-blur` e `--visual-menu-bg` a todos os WebViews. Preferências individuais antigas permanecem preservadas.
- `OverlayService.java`: normalização e persistência nativas aceitam `menuBlur` (0–16), default de `menuTransparency` 50.
- `dock.html`: folha final de estilo padroniza painéis ordinários, rail/editor de Filtros e Modos, flyout de perfis e itens da barra. Fundo, cor do texto, contorno, sombra, radius e blur usam as mesmas propriedades; invólucros vazios continuam transparentes e pass-through.
- `dock.html`: Copiar e Colar retornam para a linha de ação de Localização, junto ao controle do raio; cabeçalho mantém somente o título.
- `PokemonPicker.java`: Favoritos nativos leem `menuBgMode`, `menuTransparency` e `menuBlur` das mesmas preferências, desenham a superfície com um único tom e transparência, mantêm `FLAG_NOT_TOUCH_MODAL`. Em Android 12+ tentam desfoque atrás do diálogo sem ativar blur global da tela.
- Testes de regressão alterados apenas para expectativas visuais legitimamente substituídas, mantendo as demais verificações históricas e de segurança. Novo `app/tests/lt88-unified-menu-theme.test.js`.

## Compatibilidade e limitações
- O suporte a `backdrop-filter` depende da versão Android System WebView; em overlays sobre outros aplicativos, o blur do wallpaper/host pode não ser fornecido pelo compositor. Sempre existe fallback de fundo com transparência configurada. Não aumentar a janela transparente nem criar nova região que capture toques.
- Tema claro/escuro e preferências personalizadas anteriores são preservados; a transparência 50% é **valor inicial**, não reset obrigatório de usuários existentes.
- Controle de blur é visual, não afeta resultados nem pesquisa.
- `0.00.90` / `versionCode 54293` designa somente o candidato QA de padronização, não a conclusão funcional de LT90.
- Nenhum merge na `main`; Release oficial continua LT87 até homologação e autorização.

## Validação requerida
- GitHub Node QA + Android Java compile + Gradle + R8 + apksigner v2 SHA do certificado permanente e SHA-256 do arquivo final.
- Teste físico Samsung ainda pendente: fundos uniformes de Modos, Filtros, submenus, Localização, Favoritos, Pokémon, Editor Visual e Alertas, temas claro/escuro, 0%, 50%, 100% de transparência, blur 0 e 16, reconexão WebView sem perda de preferências, teclados, arrastes e toques no jogo atrás do menu.
- Conferir Copiar/Colar junto ao raio, sem sobreposição nem espaços extras.
- Revisar checklist LT87 e demais pendências LT88–LT93 sem alegar PASS físico por compilação.
- Guia Mestre: somente append após leitura integral e verificação do hash do prefixo no checkout. Não sobrescrever histórico com respostas truncadas do conector.

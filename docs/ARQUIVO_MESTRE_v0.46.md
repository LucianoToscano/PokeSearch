# PokeSearch Overlay — ARQUIVO MESTRE v0.46-beta
Data 14/10/2026. Base main 0.45-beta commit a2a8beb4dad3d35f55e993195d7e4f2107f34fe2. Repositório: https://github.com/LucianoToscano/PokeSearch
Package Android com.lucianotoscano.pokesearch (independente do PvPPokeGo). VersionCode 46, versionName 0.46-beta. minSdk 26, compileSdk 36, targetSdk 33, Java 17, Gradle 8.11.1.
Preservar documentação/auditorias/APKs v0.38–v0.45 e não modificar PvPPokeGo.

## Estado funcional mantido
IV100 (15/15/15), GL#1 e UL#1 (incluindo pré-evoluções), Shiny ON apenas quando o site comprovar login/vínculo, Shiny OFF independente, filtro 📍 coordenadas + raio 0–1000km, favoritos 50 espécies, alertas, recolhimento, rolagem, detalhes, copiar coordenadas quando o site permite, botões de relatório/Pix.
AUTO 5,10,15,20 minutos, mínimo 60s entre buscas reais; limpeza de despawn é local, não uma pesquisa extra. Não fabricar resultados. Guardar dados pessoais apenas nas preferências privadas e nunca em relatório.

## Correções UI da v0.46-beta
- Restabelecer as 12 colunas responsivas numa barra até 396dp (ou largura útil da tela), área de toque de 30dp e altura inicial 34dp.
- O menu no WebView separado NÃO pode cortar popups: HTML/body da janela de controles com overflow visível; Native.resizeMenu aumenta a janela apenas até conter o popup; a barra mantém 12 botões alinhados.
- Engrenagem tem fundo discreto e toque 35x30dp, permanece acessível quando barra é colocada à esquerda/direita/acima/abaixo. Seta recolher tem fundo escuro de 40x32dp.
- Se a barra está à esquerda da engrenagem, a ordem dos ícones INVERTE visualmente (CSS direction:rtl); direita usa ordem padrão. Serviço envia o lado a AMBOS WebViews. Em telas estreitas a orientação segue a metade da tela onde a engrenagem fica.
- Seleção IV100/GL#1/UL#1 e AUTO muda imediatamente o indicador, depois notifica o serviço Android. ↻ destaca o botão ao toque e mostra o limite quando ainda restam segundos.
- Localização abre painel focável para digitar coordenadas, permite aplicar/ocultar/desativar, usa verificação estrita no site antes de buscar.
- Favoritos agora têm gradiente de alpha 187 até 159, borda sutil, blur discreto e SEM escurecimento geral da tela.

## Login e logout na tela inicial
- Adicionar painel 'Entrar / vincular' e 'Sair' na Home com indicação simples da sessão identificada/não confirmada/desconectada.
- Tocar Entrar abre somente a tela de autenticação do PoGoCoordinates em diálogo próprio e opaco, sem criar overlay quando não houver serviço ativo. Native LOGIN_BEGIN só é enviado se OverlayService.isRunning() for verdadeiro.
- Ao identificar autenticação concluída no site no login iniciado pela Home, fechar diálogo automaticamente e retornar à Home do PokeSearch. Login originado pelo pedido de Shiny só retorna automaticamente depois de verificar Shiny no site e não haver vinculação pendente; botão '✓ PokeSearch' permite retorno manual.
- Sair pede confirmação, encerra serviço se ativo, remove cookies e WebStorage da sessão local, desativa Shiny e mantém favoritos e preferências. Não encerra sessão global do provedor Google/Discord.
- Evitar abrir a página do site no fundo durante login iniciado pela Home; o serviço não deve ser iniciado apenas para fazer login/logout.

## Testes e limitações
Execução local de testes estáticos e simulação Playwright em 312/333/396 CSS pixels: verificação dos 12 botões alinhados, menus 100%, AUTO e 📍 abertos, e ações JS enviados. GitHub Actions deverá executar node --check, probe-smoke, overlay-ux, gradle testDebugUnitTest, assembleDebug, lintDebug, APK integrity, assinatura e SHA256.
AINDA PENDENTES DE TESTE REAL: comportamento Google/Discord OAuth e redirecionamentos externos, vínculo real Shiny, retorno automático, visibilidade sobre Pokémon GO, toques do sistema, teclado, experiência real da UI, IV100/GL/UL e raios 0/50/1000 no DOM vivo.
Se OAuth abrir navegador externo do provedor, o redirecionamento não pode ser garantido sem callback suportado pelo site; botão voltar e sessão são a contingência.
Arquivo mestre anterior docs/ARQUIVO_MESTRE_v0.45.md; auditoria atual docs/AUDITORIA_v0.46.md; auditoria anterior docs/AUDITORIA_v0.45.md.

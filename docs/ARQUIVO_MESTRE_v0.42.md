# POKESEARCH — ARQUIVO MESTRE v0.42-beta
Data: 14/10/2026
Fonte oficial: https://github.com/LucianoToscano/PokeSearch — branch main
Identificação Android: com.lucianotoscano.pokesearch
Namespace Java: com.lucianotoscano.pokesearchoverlay
Versão pretendida: versionCode 42 / versionName 0.42-beta
Plataforma: Android minSdk 26, compileSdk 36, Java 17, Gradle 8.11.1

## Continuidade histórica
Arquivos anteriores no repositório: docs/ARQUIVO_MESTRE_v0.38.md, v0.39.md, v0.40.md e auditorias correspondentes. Arquivo mestre v0.36 e outros históricos no Google Drive. PROIBIDO modificar o projeto PvPPokeGo para atender a este APK; são independentes. Antes de todo trabalho, verificar HEAD no GitHub e ler este arquivo mestre.

## Objetivo e recursos
APK independente de overlay transparente e compacto sobre Pokémon GO. Pokémon reais obtidos pelo PoGoCoordinates sob autenticação/autorização do usuário: filtros IV100 (15/15/15), GL#1 e UL#1 incluindo pré-evoluções; ✨ Shiny ON/OFF independente do modo, exige vínculo do código de amizade quando o próprio site pedir; atualização manual e automática 5, 10, 15 ou 20 minutos; espaçamento mínimo de 60 segundos entre pesquisas efetivamente submetidas; até 10 cartões compactos conforme site, rolagem, sprite P/M/G, nome, CP, nível, IV/ranking, sexo, tamanho, golpes, localização, despawn e coordenadas quando disponíveis. Até 50 favoritos com busca/pesquisa e alertas, alertas gerais, ficha de detalhes, Pix voluntário e botão ⚠ de diagnóstico/exportação TXT/WhatsApp.

## Correções da versão 0.41
1. PS-023: sprites estavam distantes porque rowDp da v0.40 era spriteSize + 10. Agora rowDp = max(26, spriteSize - 8), imagens centralizadas e rolagem quando necessárias.
2. PS-024: seta ^ (chevron para cima) foi movida para DEBAIXO da lista de Pokémon. Tocar recolhe resultados e configurações, restando apenas engrenagem. Tocar na engrenagem restaurada recolhida torna a mostrar sprites.
3. PS-025: X vermelho foi integrado ao último botão da barra de configurações, IMEDIATAMENTE ao lado do coração Pix, com fundo/borda padrão.
4. PS-026: toque na engrenagem com resultados visíveis só abre/fecha os controles, descendo/subindo sprites sem recolher a busca. Para impedir o bloqueio invisível de toques no jogo, a barra de configurações é uma janela Android separada com tamanho fixo aproximadamente 308dp x 29dp; expande verticalmente apenas com popover. O dock principal permanece estreito. Detalhes são outra janela somente quando selecionados.
5. PS-027: favoritos usam único painel cinza translúcido arredondado (ARGB 232/47/54/64) e blur atrás quando suportado no Android 12+, sem título duplicado ou rodapé cinza externo; botão Concluir INTEGRADO ao próprio cabeçalho. Editar favoritos não traz a Home à frente do jogo.
6. PS-028: após login no site oficial via WebView Google/Discord, o usuário VOLTA À TELA INICIAL do PokeSearch, sem enviar Activity ao segundo plano. Dados de autenticação não são duplicados nem armazenados manualmente no app.
7. PS-029: guia rápido novo no arquivo app/src/main/assets/tutorial.html com SVGs equivalentes aos ícones reais dos controles, 13 funções explicadas e botão Entendi dentro do painel. Uma vez no primeiro uso, sempre acessível na Home. Preferência tutorialSeenV41.
8. PS-030: abrir favoritos ou login oculta a barra de opções e a coluna do overlay para não bloquear teclado; depois restaura a interface no estado anterior.

## Arquivos principais
app/src/main/assets/dock.html — HTML/CSS/JS do dock e painel com carregamento controls=1
app/src/main/assets/tutorial.html — guia visual com os ícones
app/src/main/assets/probe.js, presets.js, shiny_login.js — coleta/verificação da busca
app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java — serviço com duas janelas e Bridge
MainActivity.java — Home, login, tutorial, relatório
PokemonPicker.java — seleção de favoritos no overlay
BugReport.java — log limitado/máscaras, sem credenciais
app/tests/probe-smoke.test.js e app/tests/overlay-ux.test.js — regressões
.github/workflows/build-overlay.yml — Android CI, hashes, APK e pacote

## Procedimento de auditoria e entrega
- Conferir HEAD e mestre antes de alterações, preservar funções.
- Testar Node JavaScript, 13 smoke tests, UX regression, Gradle assembleDebug, lintDebug, testDebugUnitTest, verificação apksigner v2, ZIP íntegro e SHA256SUMS.
- Atualizar o README, o relatório e o catálogo de bugs: https://docs.google.com/spreadsheets/d/1aam5N7DNnzMqJj5giZTdsAmzWkHTWPj-uKcUUVwreiI/edit
- Colocar na pasta PokeSearch do Google Drive: 00_Documentacao_Atual, 01_APKs_Teste e 02_Relatorios_Bugs, sem apagar arquivos anteriores.
- APK de GitHub Actions é debug com chave temporária: não prometer atualização por cima de versão com certificado diferente. Para release estável, chave privada persistente guardada fora do código e autorizada pelo dono.
- Não garantir integração com serviços de terceiros caso mudem o DOM ou condições. Usuário declarou ter autorização para testes privados com amigos, não publicação em massa. Respeitar limites.
- Nunca registrar senha, cookies, tokens nem código de amizade em mestre, GitHub ou Drive.

## Checklist físico ainda pendente
1. Login com teclado e retorno à Home, vínculo do treinador e Shiny ON/OFF.
2. IV100 sem Shiny, GL#1, UL#1 e resultados reais; toque no ! para diagnóstico.
3. Arrastar a engrenagem, abrir/fechar menu com sprites abaixo, testar cliques no Pokémon GO abaixo e à esquerda da barra.
4. Seta de baixo fecha tudo menos engrenagem; engrenagem restaura resultados; X fecha serviço.
5. Favoritos: painel único, Concluir dentro, teclado e filtro, blur opcional, jogo em segundo plano preservado.
6. Sprites P/M/G, rolagem e distâncias em telas pequenas/grandes.
7. Guia com ícones corretos; bug report ⚠ exportável e sem segredos.

Próximo chat: iniciar lendo este mestre, o relatório v0.41 e o HEAD de LucianoToscano/PokeSearch. Não repetir alterações já incorporadas nem alegar teste físico que não foi feito.

## ADENDO DA CONTINUIDADE — v0.42: LOCALIZAÇÃO OPCIONAL
- Adicionado UM ÚNICO ícone 📍 no menu de configurações, alinhado ao estilo dos outros ícones. O pin abre e fecha o editor dentro do mesmo menu, sem criar outros ícones.
- Painel de coordenadas possui um campo para colar `latitude,longitude`, com botão ON/OFF exatamente à direita desse campo; slider de raio inteiro de 0 a 1.000 km e indicador em quilômetros. O botão `✓ Aplicar` valida os dados; `Ocultar` só fecha o editor, preservando ON/OFF.
- ON confirma latitude entre -90 e +90, longitude -180 e +180; ativa o modo Coords e preenche ambos os valores no formulário do site antes de pressionar Search.
- OFF apaga o par e o raio das preferências/aplicação e dos campos da página, troca para Area quando disponível e prossegue SEM filtros de localização definidos pelo app. Não muda modo IV100/GL#1/UL#1, estado ✨, favoritos ou atualização.
- Persistência local: SharedPreferences `locationEnabled`, `locationCoords`, `locationRadius`. Não incluir coordenadas precisas em diagnósticos ou documentos públicos.
- Corrigido escape inválido nos padrões da interface que validam latitude/longitude, e na detecção de "Showing N spawns" do parser.
- Fluxo do coletor v0.42: `prepareSearch → configureSearch → configureLocation → verifyLocation → verifyShiny/verifyFilters → submitSearch → collect`; se localização não for verificada, não enviar busca incorreta.
- Testes adicionados a `app/tests/overlay-ux.test.js` cobrem apenas um pin, chave à direita, modo ON/OFF, função independente de ocultar, raio 0–1000 e verificação da página.
- Teste Android real pendente: teclado no editor sobre o jogo, comportamento do slider, filtro Coords/Area e layout em telas menores.
- Para próximo chat: conferir HEAD da branch main, arquivo mestre v0.42, auditoria v0.42, CI correspondente e catálogo. Não confundir com v0.41.

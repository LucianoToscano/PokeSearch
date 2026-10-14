# PokeSearch — ARQUIVO MESTRE DE CONTINUIDADE v0.43-beta
Data de revisão: 14/10/2026  
Repositório oficial: https://github.com/LucianoToscano/PokeSearch (branch `main`)  
APK independente do PvPPokeGo · Android package `com.lucianotoscano.pokesearch`  
Java namespace `com.lucianotoscano.pokesearchoverlay` · versionCode **43** · versionName **0.43-beta**  
minSdk 26, compileSdk 36, Gradle 8.11.1, Java 17.

## Como retomar o projeto em um novo chat
1. Consultar primeiro este mestre e o HEAD real de `LucianoToscano/PokeSearch/main`, depois `docs/AUDITORIA_v0.43.md` e `README.md`.
2. Não modificar `PvPPokeGo` nem `PvPPokeGo-APK-Build`. O PokeSearch é um APK Android independente.
3. Consultar versões arquivadas no GitHub: mestres e auditorias v0.38–v0.42; backups mais antigos, inclusive v0.36, estão preservados no Google Drive.
4. Fazer novas alterações SEM substituir recursos anteriores. Compilar/testar no GitHub Actions. O último APK é beta de testes privados e não deve ser divulgado como release pública estável.
5. Ao reportar bugs, nunca solicitar ou publicar senhas, código de amizade, cookies, tokens ou coordenadas completas; usar o botão ⚠ para exportar diagnóstico e omitir informações sensíveis.

## Objetivo e recursos exigidos
- Overlay retrátil e translúcido sobre Pokémon GO, estreito e arrastável pela engrenagem.
- Busca de Pokémon REAIS do PoGoCoordinates com critérios IV100 (15/15/15), GL#1, UL#1; considerar pré-evoluções em PvP, Pokémon Shiny somente ao ligar ✨ e após autorização/vinculação, sem inventar resultados.
- Com ✨ OFF, pesquisar a MESMA categoria IV100/GL/UL, sem filtrar Shiny. Estado do ícone ✨ só confirmado se o site confirmar.
- Proteção contra consultas excessivas: atualização automática 5/10/15/20 min, bloqueio mínimo 60 segundos entre buscas efetivamente submetidas, reprogramação segura após o limite.
- Sprite/tamanhos P/M/G, nome, IV/ranking, CP, nível, sexo, tamanho, movimentos, localização, despawn, coordenadas quando disponíveis; rolagem dos resultados.
- Favoritos pesquisáveis com até 50 espécies, alertas gerais e favoritos, fichas compactas, Pix voluntário, botão ⚠ relatório/exportar TXT/WhatsApp do contato configurado.
- Modo de localização opcional 📍, que convive com IV100/GL/UL e Shiny.

## Interface atual / comportamento esperado
**Engrenagem:** arrasta overlay; um toque expande ou recolhe somente a barra de opções e desce/sobe a coluna dos Pokémon. Se o overlay estiver totalmente minimizado, um toque na engrenagem restaura a coluna.  
**Seta ^:** aparece abaixo do último Pokémon (ou da lista rolável) e recolhe TUDO menos a engrenagem.  
**X vermelho:** na mesma linha e imediatamente ao lado do coração (Pix), com o mesmo fundo escuro e formato dos controles; encerra o overlay.  
**Sprites:** colunas compactas: `rowDp = max(26, spriteSize - 8)`, imagens centralizadas e rolagem; conferir visualmente no Android.  
**Barra:** janela Android independente de 333dp de largura e 29dp de altura, expandindo verticalmente somente com menus; dock de sprites é outra janela estreita para evitar bloqueio do jogo em regiões transparentes.  
**Favoritos:** um único painel cinza translúcido arredondado com botão Concluir dentro; blur atrás quando Android suportar; manter Pokémon GO à vista sem trazer a Home à frente.  
**Login:** janela de autenticação oficial Google/Discord e possível vinculação de treinador, com teclado e sem rodapé duplicado; ao fechar, permanece na tela inicial do PokeSearch e atualiza a sessão.  
**Tutorial:** guia inicial visual HTML com ícones equivalentes aos controles (inclusive 📍), com atalho permanente na Home.

## Filtro de localização (revisão v0.42 + refinamento v0.43)
- No menu existe **somente um botão** 📍, no mesmo padrão visual dos outros.
- O botão abre/oculta painel com coordenadas coláveis `latitude,longitude`; chave ON/OFF imediatamente à direita do campo, slider de raio **0 a 1.000 km**, botão Aplicar e botão Ocultar.
- **Ocultar NÃO desliga** a opção. **OFF** limpa os valores aplicados ao site e ao estado local e volta à busca sem localização. ON só é aceito com coordenadas válidas (lat -90 a 90 e long -180 a 180) e raio inteiro 0–1000.
- O PokeSearch tenta mudar o formulário do site para Coords e preencher raio/coordenadas, e verifica os campos antes de buscar; não envia buscas com configuração não confirmada.
- **NOVO v0.43:** quando ON, o botão 📍 mostra o raio pequeno dentro dele (`50km`) e aparece uma **etiqueta discreta `📍 50 km` entre engrenagem e Pokémon**, inclusive com menu de opções fechado; é texto não clicável, **não outro botão**. OFF remove ambas as indicações. Não exibe lat/long na etiqueta.
- **NOVO v0.43:** a barra tinha 12 botões, mas apenas 11 colunas CSS, o que poderia empurrar o X para baixo. Agora são 12 colunas ajustadas aos 329px do grid, preservando coração/X na mesma linha.
- **NOVO v0.43:** ao trocar do editor de localização para IV/ligas/AUTO, a janela libera foco do teclado e elimina estilo/tamanho extra do painel.
- Estado ON e coordenadas salvas somente em preferências privadas do app (`locationEnabled`, `locationCoords`, `locationRadius`), e removidas ao desligar.

## Arquivos-chave
`app/src/main/assets/dock.html` — barra, janela em modo controls=1, ícone 📍 único, indicador de raio, sprites, X, seta, menus.  
`app/src/main/assets/tutorial.html` — guia com SVGs e legenda do raio.  
`app/src/main/assets/probe.js` — validação dos filtros, localização Coords/Area, leitura de resultados reais do site.  
`app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java` — serviço/overlays, limite de busca, persistência e bridge.  
`MainActivity.java` — Home, login, tutorial, relatório.  
`PokemonPicker.java` — favoritos em painel cinza translúcido.  
`BugReport.java` — diagnóstico limitado e mascarado.  
`app/tests/probe-smoke.test.js` + `app/tests/overlay-ux.test.js` — testes automatizados.  
`.github/workflows/build-overlay.yml` — CI, lint, Gradle, verificação de APK e kit.

## Auditoria e entrega
Conferir HEAD e CI; executar node --check e smoke JS, teste UI, `:app:testDebugUnitTest :app:assembleDebug :app:lintDebug`, verificação `unzip -t`, `aapt` para versão, `apksigner verify --verbose`, checksum SHA-256. Só distribuir artefato cujo commit coincide com o HEAD validado.
Google Drive: projeto PokeSearch com `00_Documentacao_Atual`, `01_APKs_Teste`, `02_Relatorios_Bugs` e os backups antigos. Catálogo de bugs: https://docs.google.com/spreadsheets/d/1aam5N7DNnzMqJj5giZTdsAmzWkHTWPj-uKcUUVwreiI/edit

**Ainda pendentes de teste físico:** login/vínculo Google/Discord, resultados Shiny individuais e IV/PvP reais, toques no jogo por trás das janelas, favoritos com teclado, blur condicional, indicador 📍 com 0/50/1000 km, mudança de modo e formulário Coords/Area no DOM real. CI verde não equivale a testes end-to-end.

**Assinatura:** APK beta do GitHub Actions usa certificado de depuração possivelmente efêmero; pode não atualizar instalações existentes com assinatura diferente. Para publicação estável, criar keystore persistente protegida em secrets, sob autorização do proprietário e backup seguro.

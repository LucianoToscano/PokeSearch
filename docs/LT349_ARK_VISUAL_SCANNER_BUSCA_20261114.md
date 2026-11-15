# LT349 ARK — Editor Visual, Pokébolas, Busca e scanner de sprites

## Estado
Base oficial preservada LT348 `0.03.46 / 54553`. Esta é uma **candidata de desenvolvimento** até integração, todos os gates e workflow protegido.

## Pokébolas/Editor Visual
- Ativar Background troca imediatamente a arte pelo PNG `Icone_Background_On.png` original, com volta ao ícone desligado sem recriar overlay.
- Linhas-guia do menu/resultados são salvas imediatamente e persistidas no JSON individual das Pokébolas.
- Novo botão **Medidas ON/OFF** logo abaixo de Linhas-guia em Editor Visual. Régua informativa mostra largura×altura real (px) nos menus/guias e resultados, independente de Linhas-guia; preferência `showMeasurements` persiste após fechar.
- Transparência aplicada linearmente a Modos, Filtros, Favoritos, Editor Visual, Filtros salvos, Ordenar, Clima, Forma e escolhas internas, sem fundo cinza opaco duplo. Contornos acompanham alpha.
- As duas artes Lixeira preta/branca foram importadas do Banco de Imagens no Drive para WebView e drawables Android, preservadas sem gerar ilustrações substitutas.

## Busca PGS
- Menu e submenus permanecem visíveis: removida a ocultação da toolbar na abertura de painel. Janela com `FLAG_NOT_TOUCH_MODAL`, `FLAG_WATCH_OUTSIDE_TOUCH` e `FLAG_NOT_FOCUSABLE` quando não houver entrada de texto; toque fora não deve bloquear o jogo.
- Bordas azuis substituídas por branco neutro sutil com alpha do Editor Visual.
- Alça de reordenação com **três traços horizontais** em vez de quatro setas; toque longo/arraste e ordenação persistente anteriores permanecem.
- Símbolo Shiny original aumentado para 8dp e reposicionado dentro da área livre do sino, mantendo a escolha ON/OFF.

## Scanner de sprites
- Novo kit de ícones **vetoriais originais com espessura de 1,45dp**: Quadrado, Livre e Vertical, todos no mesmo canvas 24×24, alinhados nos mesmos slots 48×46dp.
- Fundo cinza dos dois grupos tem **70% de transparência** (alpha 0x4D), com contorno branco sutil; realce do selecionado suave.
- Artes Confirmar, Cancelar e Background reduzidas para aproximadamente **70% do tamanho visível anterior**, preservando a área de toque 48×46dp, inclusive acessibilidade.
- Corte Vertical tem proporção 3:4 (largura/altura = 0,75), tanto na seleção inicial quanto ao arrastar o canto, mais largo e menos alto que antes; continua vertical. Prévia e arquivo salvo usam `selectedBitmapRect()`, sem distorcer a imagem; slider permanece no lugar.
- Artes antigas do recortador e novo `icone_vertical.webp` fornecido previamente permanecem em assets para reversão; nenhum modelo antigo é apagado.

## Home
- Ícones do assistente Edu e Doce Raro recalculam a matriz da imagem após a largura final da fileira e futuras mudanças de layout; não devem iniciar minúsculos.
- Reutiliza as imagens existentes. Nenhuma mudança na animação do Edu ou captura PGS.

## Homologação e riscos
- Testes: `app/tests/lt349-visual-opacity-scanner-and-pgs-contract.test.js` + regressões Node, LT169, LT211, Java LT62, OTA LT173, PGS APK QA, Android R8 beta/assinatura.
- **BLOQUEADOS no CI:** captura e comparação em Samsung, toque externo em jogo real, tipografia/tamanho dos menus Android e modo claro/escuro no dispositivo, autenticação externa OAuth PoGoCoordinates, teleporte real, Shiny e Encontro. Build verde não confirma essas interações.
- Não publicar sem merge e release monotônica protegida, hash público e confirmação do usuário para instalação Android.

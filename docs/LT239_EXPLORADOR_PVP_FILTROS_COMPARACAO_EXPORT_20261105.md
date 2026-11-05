# PokeSearch LT239 — Explorador PvP com filtros, comparação e exportação (05/11/2026)

## Implementação
- Partida oficial: LT238 / 0.02.38 / 54442, tag v0.02.38-54442.
- Alterações no motor visual compartilhado em app/src/main/assets/pvp_rank_explorer.js, preservando os cálculos de 4.096 spreads da LT238.
- Navegação inicial abre a página exata do IV da captura, realça a linha e reposiciona a rolagem internamente. Se o filtro Top 10/50/100 ocultar o IV do usuário, o botão **Meu IV** ativa **Todos** e recupera sua posição.
- Filtros **Top 10, 50, 100, Todos** e paginação de 10 por vez, tanto para Rank Classe como Rank Geral, preservando liga e identidade.
- Toque na linha ou no botão IV seleciona/deseleciona até **dois spreads**; um terceiro substitui o primeiro. Comparação exibe eficiência, nível, PC, ATK, DEF, HP e diferenças 2 − 1. Rank Geral não é comparado como IV.
- **Copiar:** texto limpo com ranking e comparação; **Compartilhar:** Intent ACTION_SEND text/plain com seletor Android; **CSV:** copia todas as combinações do filtro atual (até 4.096) em formato ponto-e-vírgula, sem rede.
- Ponte nativa adicionada em OverlayService.Bridge: copyPvpRanking e sharePvpRanking, somente quando o detalhe está visível, com tamanho máximo de 300.000 e 16.000 caracteres, respectivamente. Não exibe coordenadas, token ou dados de conta. Handlers retornam feedback ao WebView.
- Melhorias de ergonomia: tabela com colunas compactas, rolagem interna com limite de altura, cabeçalho fixo, alvos de toque, foco acessível, status de cópia e botão de fechar.
- Sem mudança nas fontes PoGoCoordinates, captcha, autenticação, duas Pokébolas, favoritados, sprites, resultados nem legitimidade Mega na Liga GO.
- Snapshots PvPoke do app continuam datados de 19/10/2026 e calculados no nível máximo 50 sem bônus de melhor amigo.

## Validação
- Teste novo: app/tests/lt239-pvp-explorer-comparison-export.test.js: teste de páginas, filtros, reentrada no próprio IV, comparação limitada a 2, remoção, CSV completo (4.096), Rank Geral sem comparação, integração UI e ponte Android, callbacks e proteção básica de campos.
- Testes anteriores LT238, Node geral, compilação Java Android, suite OTA e build assinado devem permanecer verdes.
- Verificação física Samsung e Android share sheet pendentes; CI é prova de build, não de instalação.

## Fluxo de publicação
1. PR de implementação, testes e revisão; integrar na main apenas após QA.
2. Adicionar registro no Guia Mestre.
3. Solicitar release oficial LT239 0.02.39 / 54443 (label 51243, qa_max_code 54442) via release/official-request.json, sem criar um workflow por versão.
4. Aguardar workflow permanente protegido official-updates e conferir release/latest, APK, assinatura permanente v2, digest SHA-256, versionCode e artefato.
5. Registrar resultados reais após publicação; não afirmar que foi instalado no dispositivo.

*Este documento inicial não é prova de merge nem de publicação.*

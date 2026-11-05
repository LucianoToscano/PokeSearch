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

## Evidências de integração e publicação oficial (05/11/2026)

- **PR #213 (implementação):** https://github.com/LucianoToscano/PokeSearch/pull/213 — merge concluído com SHA 98f6fdf9c73e5c4396a116b9f3caff9ae2acfa6c.
- **Código final da PR:** 3100982fafa363ba01becccf158010ba7b0c4dfe.
- **QA da PR:** PokeSearch Node QA 41966669465, regressão LT169 41966669531, QA core LT211 41966669503, compilação Java Android LT62 41966669619, QA OTA LT173 41966669462 concluíram success no SHA final. APK beta privado 41966669452: success (assinado apenas para teste, não o APK distribuído).
- **Pedido de lançamento oficial:** release/official-request.json alterado no commit dc129ca3b05d1df9abf81ade29d9f0429c4f1b2e, solicitando 0.02.39, versionCode 54443, label 51243, previous_tag v0.02.38-54442, qa_max_code 54442; nenhum segredo foi exposto.
- **GitHub Actions oficial permanente:** https://github.com/LucianoToscano/PokeSearch/actions/runs/41966852328 — completed/success, jobs preflight e publish aprovados. Etapas de regressões Node/OTA, geração de assets, compilação release, verificação de APK, assinatura v2, criação do Release e validação do digest público todas success.
- **GitHub Releases/latest:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.39-54443 — versão estável, draft=false, prerelease=false, publicada em 2026-11-05T04:20:40Z; tag v0.02.39-54443, source commit dc129ca3b05d1df9abf81ade29d9f0429c4f1b2e.
- **APK publicado:** https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.39-54443/PokeSearch-v0.02.39-LT.apk — 28.133.710 bytes, digest SHA-256 647f244930a621dde444abc0fab2069efcd495083854f852599cc638b6227013, asset state uploaded, verificado pelo workflow oficial.
- **Certificado Android v2 permanente:** 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e, exigido no workflow; etapa Validate APK and signer concluída com sucesso.
- **Artefato assinado/relatórios da build:** PokeSearch-v0.02.39-54443-Signed-Verified, ID 13388052133, ZIP 25.956.171 bytes, digest sha256:f467523b967bada8ee9541dfcba675e0480d599fa0ea86fa571e102a6d9af9cd.
- **Distribuição:** o sistema de atualização LT237+ consulta releases/latest, portanto a LT239 está disponível para detecção, download e instalação após confirmação do Android. **Sem confirmação de instalação no aparelho Samsung:** validar rolagem, clique, exportação e compartilhamento para P1/P2 no teste físico.

> Os planos pendentes de implementação/publicação citados nas seções anteriores são históricos; este registro documenta a execução concluída.

# LT295 — Ícone de Ataques por evolução + proporção no card

Data: 07/11/2026. Base: LT294 · 0.02.94 · versionCode 54498.

## Evidência do Samsung
Após a LT294, o Charmander no cabeçalho do card continuou visualmente menor do que o desejado, enquanto os Resultados já tinham normalização separada. O usuário também constatou que havia somente **um ícone de Ataques no cabeçalho da Análise PvP** e perguntou a qual das evoluções (Charmander, Charmeleon ou Charizard) ele se referia.

## Causas verificadas
- O card tem uma sprite própria de **30dp** e chamava `PokeSearchSpriteScale.apply(img)`, caminho legado com alvo de 78% de opacidade e zoom limitado a **2,2×**. A regra LT294 de 87% era exclusiva dos Resultados.
- `renderRankOneMoves` usava `currentRankSpecies`, que podia ser a espécie **com melhor ranking**, e não a capturada. Assim o ícone único no topo poderia abrir golpes de Charizard mesmo que o card fosse Charmander, sem informar claramente a espécie.

## Correções
- `sprite_visual_scale.js`: `applyDetail` e `detailGeometryFit` calibram o **desenho opaco** da própria imagem do cabeçalho à meta de **87% do slot de 30dp**. Medição direta no canvas ou limites da imagem exata fornecida pelo PoGoCoordinates. Se CORS impedir a leitura, uma nova ponte `requestDetailSpriteSilhouette` usa o mesmo decodificador Android limitado da LT293, mas devolve a geometria ao **WebView do card** (o de Resultados é outro). Escala/translação só na imagem; não alterar largura do card, posicionamento, espécies ou o toque.
- `pvp_evolution_moves_ui.js`: módulo offline de UI que entrega botões pequenos `evoMovesAction` para **Atual, cada evolução e projeções visíveis**, um em cada linha, com `data-ps-name` e `data-ps-league` explícitos. O botão global isolado no cabeçalho é ocultado quando a interface por espécie está disponível; continua existindo o mecanismo de compatibilidade legado.
- Toque mostra os golpes **logo abaixo da espécie selecionada**, destacando `Nome · Liga` e Ágil/C1/C2 em pt-BR, cores por tipo quando os dados são verificados. Fonte `PokeSearchPvpRankMoves.lookup(league,name)` / `lookupMega(league,name)`: **não reutilizar golpes do Pokémon capturado para outra evolução**. Não chamar API do PoGoCoordinates nem transmitir coordenadas/credenciais.
- Somente um bloco de golpes permanece aberto; outro toque fecha. Retornos assíncronos de outra espécie, troca de card, liga ou atualização são ignorados. Referências de fantasias/Mega são marcadas como projeções; ausência de conjunto recomendado é distinguida de um catálogo de golpes possíveis.
- Status MT: **cinza é não confirmado**; Elite é mostrado somente se a fonte indicar `status=elite` e todos os demais golpes estiverem identificados como normais/Elite. `legacy` isolado não prova disponibilidade de MT Elite.
- Mantidos Rank Classe, Rank Geral, rankings das evoluções, cálculo, sprites originais, P/M/G dos Resultados, duas Pokébolas, favoritos, coordenadas, golpes capturados, OTA e assinatura.

## QA
- Novo teste `lt295-detail-card-alpha-per-evolution-moves.test.js`: verifica meta 85–90% no cabeçalho de 30dp, canvas/nativo CORS, rejeição de callback repetido, HTML da ligação de cada espécie/liga e execução de lookup distinta para Charmeleon, Charizard e a Mega, sem misturar respostas. Tarefas prévias LT145 atualizadas.
- Gates obrigatórios: Node QA completo, Java Android, OTA, visual P/M/G e beta privado. Merge e APK assinado apenas depois de aprovados.
- **Homologação física Samsung pendente:** comparar card Charmander com antes; abrir ícones de Charmander, Charmeleon e Charizard nas ligas GL/UL/ML e verificar nomes/cores/MT na espécie correta, ambas as Pokébolas. Não afirmar correção visual definitiva sem print atualizado.

## Publicação oficial LT295 concluída — verificação

- PR #289 mesclada em `main`, squash `3d952d740cd369fbcbfc7aaa971fb71d15adcb4c`. Oito verificações aplicáveis `success` na revisão `dc9a4ba7ce0c3ba8892f6e45382e7a432cfe802b`.
- [Workflow oficial #42362673941](https://github.com/LucianoToscano/PokeSearch/actions/runs/42362673941) **completed/success**; `preflight` e `publish` concluídos com sucesso.
- [Release estável LT295](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.95-54499) publicada em **07/11/2026 10:12:49 UTC**. Versão `0.02.95`, `versionCode 54499`.
- [APK oficial](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.95-54499/PokeSearch-v0.02.95-LT.apk): `PokeSearch-v0.02.95-LT.apk`, **33.944.352 bytes**, SHA-256 `43ece5b3b8af779010ea6cf420183474025acc46675fd75b35913fd87e58097c`.
- **Teste real no Samsung ainda pendente:** confirmar visualmente o tamanho da sprite no card e os ícones de Ataques por espécie/forma nas duas Pokébolas. O print anterior foi feito antes desta atualização, portanto não comprova o resultado novo.

# LT241 — Ícone de Mega Evolução (05/11/2026)

## Alteração solicitada
- Substituir o losango `◈` que identificava a Mega Evolução nos cards do PokeSearch por um símbolo vetorial inspirado no emblema de Mega Evolução, pequeno e transparente.
- Mostrar o mesmo símbolo nas linhas de formas Mega, no selo `TOP 1 MEGA`, nos destaques Top PvP de Mega e no comparador Normal × Mega × evoluções.
- Não colocar ícone em formas normais ou regionais; não confundir projeção Mega com elegibilidade na Liga GO.
- Ícone armazenado em `app/src/main/assets/mega_evolution_icon.svg`: vetorial autocontido, sem imagem externa, cor suave lavanda/rosa/verde, sem fundo sólido, alvo de 12–14 px. Não há fonte de texto externa.
- Incluído em `scripts/build_ota_pack.py` e `OtaAssets.java` para distribuição por atualização assinada, além do APK normal.
- P1/P2 reutilizam a mesma tela de detalhe, mantendo preferências independentes.
- Implementação visual: `detail.html` e `pvp_rank_advanced_ui.js` com estilos para menus P/M/G.
- QA: `node app/tests/lt241-mega-evolution-symbol.test.js` mais regressão Node, Java Android, OTA e build beta isolado.
- Segurança: o emblema identifica apenas projeções verificadas; dados PvP, IVs, golpes, provedor e atualização automática permanecem inalterados.

## Publicação
Planejada LT241 · 0.02.41 · versionCode 54445, `label 51245`, base LT240 v0.02.40-54444. Publicar apenas após CI/merge e aprovação do workflow oficial com assinatura permanente.
Teste visual no Samsung real e instalação física ainda pendentes. Este registro inicial **não** é evidência de release pública.

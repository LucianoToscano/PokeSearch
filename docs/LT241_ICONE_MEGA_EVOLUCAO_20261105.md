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

## Evidências da publicação oficial — 05/11/2026

- **Código/merge:** [PR #217](https://github.com/LucianoToscano/PokeSearch/pull/217) encerrada e mesclada, SHA `0fda1931930e1adb2e42767249bd07febcf44554`. Commit final do branch validado pelo CI: `01e59cdb71c2a7d9192daec5ac00844fdf17108d`.
- **Testes:** Node QA, regressão Node LT169, QA core LT211, compilação Java LT62, validação OTA LT173 e APK beta privado concluídos com `success` antes do merge. O teste `app/tests/lt241-mega-evolution-symbol.test.js` confere que o SVG é autocontido, ícone exclusivo de formas Mega, selo TOP 1 MEGA preservado e allowlists OTA nativas/Python.
- **Pedido de publicação:** `release/official-request.json` no commit `e82520d1f081c46616e5776bb47ded45e41d53c8`, com `version 0.02.41`, `versionCode 54445`, `label 51245`, `previous_tag v0.02.40-54444`.
- **GitHub Actions permanente:** [Workflow #41977215076](https://github.com/LucianoToscano/PokeSearch/actions/runs/41977215076) com status `completed/success`; `preflight` e `publish` aprovados. Passaram `Run Node and OTA regressions`, `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash`.
- **Release oficial:** [v0.02.41-54445](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.41-54445) publicada em `2026-11-05T06:01:16Z`, `draft=false`, `prerelease=false`, `target_commitish e82520d1f081c46616e5776bb47ded45e41d53c8`.
- **APK público:** [PokeSearch-v0.02.41-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.41-54445/PokeSearch-v0.02.41-LT.apk), `28.141.675 bytes`, SHA-256 `300248ed5eed250b463ce9379ca2b9cd980667dd7bfc82dfd773f40a2735aedd`, asset `uploaded`.
- **Artefato de CI:** `PokeSearch-v0.02.41-54445-Signed-Verified` ID `13392850272`, `25.963.214 bytes`, SHA-256 do ZIP `7962540535d54129631ad90f3b53060db17174fa80949e503bb9480548f4293b` (não confundir com hash do APK).
- **Atualização pelo app:** GitHub `releases/latest` expõe a LT241; o sistema de atualizações do aplicativo pode detectá-la, baixar o APK e solicitar a confirmação de instalação do Android. **Não há comprovação de instalação ou teste visual físico Samsung P1/P2.**

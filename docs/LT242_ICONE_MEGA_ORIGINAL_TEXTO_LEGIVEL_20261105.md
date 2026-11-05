# LT242 — Correção do símbolo Mega e do texto cortado (05/11/2026)

## Defeito LT241 confirmado
- Ícone `mega_evolution_icon.svg` continha desenho estilizado que NÃO correspondia ao emblema Mega do Pokémon GO.
- O emblema era repetido no marcador ao lado do nome, no selo `TOP 1 MEGA`, nos destaques Top PvP e no comparador. As imagens ocupavam espaço horizontal e o nome tinha `overflow:hidden;text-overflow:ellipsis;white-space:nowrap`, portanto podia ser cortado.
- O CSS adicional da LT241 era declarado **antes** do CSS do card, o que poderia tornar ajustes ineficazes pela cascata.

## Correções
1. SVG agora encapsula **os bytes PNG originais** do ícone `Buttons and Icons/Mega x64.png` do repositório de assets Pokémon GO `hintbox/Pokemon-Go-Assets`. Git blob SHA-1 do PNG: `d156e4b3eb88822376155778182744d4a94cd203`. Recorte é efetuado apenas via viewBox 6 6 52 52; pixels originais permanecem inalterados. O conteúdo é embutido como data URI, sem depender de internet, sem fonte externa e sem desenhar uma falsa aproximação. Os direitos da arte são dos titulares de Pokémon GO.
2. Um único ícone de 10–11 px substitui o antigo marcador `◈` nas linhas da Mega; imagens duplicadas removidas do selo TOP 1 MEGA, dos alertas e do comparador.
3. `TOP 1 MEGA` e eficiência foram movidos para a **linha já existente** de PC e nível; não adicionamos nova linha dedicada ao ícone.
4. Corrigida a regra CSS definitiva: nome pode quebrar em linha sem `ellipsis` nem corte; dados de PC, nível e eficiência usam `flex-wrap` e adaptam-se aos tamanhos P/M/G. Não é usado `:has()` que possa falhar em Android WebView antigo.
5. Ranking Classe, Geral, golpes, notificações, login, pesquisa e duas Pokébolas preservados.

## QA e versão
- Base LT241 (0.02.41 / code 54445), candidata LT242 (0.02.42 / code 54446, label 51246).
- Testes: `lt241-mega-evolution-symbol.test.js` atualizado para conferir o PNG original pelo SHA-1 Git do blob, e `lt242-mega-authentic-compact-layout.test.js` para verificar exclusividade do ícone, DOM, estrutura de texto e CSS. Rodar Node geral, compile Android, OTA e APK beta assinado antes do merge.
- Aceitação visual real no Samsung/Pokébola 1 e 2 ainda pendente (CI não simula todas as larguras e WebView do aparelho).
- Publicar pelo `release/official-request.json` somente após CI e merge, com assinatura permanente Android e digest SHA-256 do APK.
- O registro inicial **não comprova** publicação nem instalação.

## Evidências de correção, testes e publicação (05/11/2026)

- **PR #218:** [correção do símbolo e layout](https://github.com/LucianoToscano/PokeSearch/pull/218) mesclada na main no commit `81452c1c241e2af1b1f605217027eefb310ed80f`. Revisão testada no SHA `2bf11b324181d876cce249a56dbddd23887a081e`.
- **Origem verificada:** `hintbox/Pokemon-Go-Assets/Buttons and Icons/Mega x64.png`, original de 64×64 pixels, Git blob SHA-1 `d156e4b3eb88822376155778182744d4a94cd203`. O teste de regressão recomputa o hash do PNG embutido para garantir a exatidão dos bytes originais.
- **Testes CI:** Node QA `41980201501`, regressão Node LT169 `41980201267`, QA core LT211 `41980201346`, Java Android LT62 `41980201451`, OTA LT173 `41980201554`, APK beta privado `41980201512`: todos `completed/success`. Os testes antigos `lt153-pvp-clarity-layout.test.js` e `lt241-mega-evolution-symbol.test.js` foram ajustados para comprovar a disposição correta e a arte original; teste novo `lt242-mega-authentic-compact-layout.test.js`.
- **Solicitação oficial:** `release/official-request.json`, commit `7ed666539ee939647fac1b2dcb1cba00c082e654`, `0.02.42`, `54446`, `label 51246`, anterior `v0.02.41-54445`.
- **Workflow permanente:** [Actions #41980689591](https://github.com/LucianoToscano/PokeSearch/actions/runs/41980689591), `completed/success` em preflight e publish; passos de compilação assinada, validação do signer, publicação e verificação de hash todos `success`.
- **Release pública estável:** [v0.02.42-54446](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.42-54446), publicada em `2026-11-05T06:32:19Z`, `draft=false`, `prerelease=false`, `releases/latest`.
- **APK oficial:** [PokeSearch-v0.02.42-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.42-54446/PokeSearch-v0.02.42-LT.apk), **28.145.867 bytes**, SHA-256 `b78034211c90cb078f245b396abdf64adba7adc1ca871e89481ab884a4936ae5`, estado `uploaded`.
- **Artefato de CI:** `PokeSearch-v0.02.42-54446-Signed-Verified` ID `13394385499`, 25.968.126 bytes, SHA-256 do ZIP `461082f52beecd1b5b3c026c1e056bc68449cd39bfd757a062da67556dfd1e20` (diferente do digest do APK).
- **Atualizador interno:** detecta a versão estável pelo GitHub `releases/latest`; instalar depende de confirmação do Android. **Ainda não comprovados** a instalação no Samsung e os testes físicos de legibilidade nas duas Pokébolas/P/M/G.

O registro inicial que dizia "não publicado" é histórico; esta seção contém as evidências de publicação concluída.

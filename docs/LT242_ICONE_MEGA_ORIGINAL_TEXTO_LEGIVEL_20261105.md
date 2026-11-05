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

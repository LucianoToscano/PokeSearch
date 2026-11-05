# LT235 QA — Projeção Mega na análise PvP do card (04/11/2026)

## Estado
- QA em branch isolada `fix/lt235-mega-pvp-rank-projection-20261104`, base `main` LT233 documental `eac2e15706e7d64712912905faefb3bca248d54d`.
- Sem merge, sem APK oficial, sem alteração no aplicativo publicado. Versão estável permanece LT233 `0.02.33 / 54437` até uma release comprovada.
- **Problema**: card do Sableye 0/15/12 mostrava somente a forma normal GL `Rank Classe #14, eficiência 99,01%`, mas ocultava a projeção Mega.
- **Verificação independente com o cálculo do Game Master embutido (PvPoke snapshot 19/10/2026, nível máximo 50, sem melhor amigo):**
  - Sableye normal 0/15/12 GL: rank classe #14; 99,01%; PC 1493; nível 50.
  - Mega Sableye 0/15/12 GL: **rank classe #1**; 100,00%; PC projetado 1499; nível 30.
  - Mega Sableye 0/15/12 UL e ML: rank #1468, eficiência 89,53%; PC 1978; nível 50.

## Implementação
1. `app/src/main/assets/dock.html`: a partir dos dados oficiais existentes `pvpoke-iv-gamemaster.js`, indexar somente entradas de espécies com sufixo exato `_mega`, `_mega_x` ou `_mega_y` e nome verificado `(Mega)`, `(Mega X)` ou `(Mega Y)`, com espécie-base confirmada. Em `megaFormProjections(card,league)`, usar os mesmos IVs brutos validados do encontro e calcular rank/eficiência/PC/nível pelos atributos **da Mega**, separados da forma atual. Nunca inferir transformações em formas regionais, Shadow, fantasias, formas desconhecidas ou encontro já Mega.
2. Exportar `league.megas` por GL/UL/ML no payload PvP apenas quando há A/D/S confirmados. Uma Mega pode ser mostrada mesmo com filtro `includePreviousEvolutions=false`; não afeta `evolutions`, `comparisons` ou a elegibilidade de `Top N` retornada pela PoGoCoordinates.
3. `app/src/main/assets/detail.html`: exibir a prévia Mega depois da forma atual, antes das evoluções, sem substituir `Atual Sableye`. Badge compacto `TOP 1 MEGA` somente com rank de classe realmente calculado igual a 1, eficiência e nível/PC específicos. Cor/lateral discreta compatível com card glass. Balão ⓘ informa natureza hipotética: **não afirma que o Pokémon Mega possa participar de uma Liga de Batalha GO normal/evento nem que a forma esteja acessível no nível atual.**
4. Não usar a Mega como prova de filtro GL/UL da pesquisa ou como rank da forma normal no indicador compacto; não atribuir falsamente Rank Geral se a fonte não o contém.
5. Testes automáticos `app/tests/lt235-mega-pvp-projections.test.js`: valida Sableye exato, X/Y de Charizard, três ligas, cálculos restritos, formas bloqueadas, falta/conflito de IV, HTML com `TOP 1 MEGA` e separação do filtro de busca.

## Cobertura completa de Megaevoluções (auditoria adicional)
- O `pvpoke-iv-gamemaster.js` embutido contém **60 entradas de forma Mega verificáveis** (`_mega`, `_mega_x`, `_mega_y`), com nome de Mega e espécie-base correspondentes. Todas as 60 possuem dados de atributos utilizáveis, inclusive Sableye, Houndoom, Gengar, Greninja, Rayquaza, Lucario, Mewtwo X/Y, Charizard X/Y e Raichu X/Y.
- A contagem não é uma lista estática de 60 espécies. O PokeSearch **descobre todas as formas Mega incluídas no Game Master**, associa cada uma à espécie-base e projeta GL/UL/ML usando IVs idênticos e atributos próprios. A contagem atual corresponde a 60 formas; entradas novas, quando forem atualizadas no Game Master, serão detectadas pelo mesmo mecanismo.
- Nomes que apenas contêm `mega` como texto, como **Meganium e Yanmega**, não são Megaevoluções e não entram.
- Removido o limite artificial de três Megas por espécie entre a consulta e o detalhe, assegurando que múltiplas variações catalogadas sejam exibidas.
- Regressão em `app/tests/lt235-mega-pvp-projections.test.js` agora percorre **100% das 60 Megaformas e todas as três ligas**, validando correspondência com o catálogo, existência de ranks IV, eficiência, PC/nível projetados e o marcador de **simulação, não autorização de PvP**. Inclui verificação explícita de Mega X/Y e da separação do rank normal.
- **Limite de fonte:** uma Mega ausente do snapshot local não terá números presumidos ou fabricados. Para novas Megas lançadas após o snapshot, é necessário atualizar e validar o Game Master embutido. Isso não altera as regras da Niantic para a Liga de Batalha GO.

## Limites e QA
- Megaevolução não é uma evolução permanente nem sinônimo de elegibilidade competitiva, por isso as linhas Mega são **simulações de IV**, não resultados da busca nem autorização de batalha.
- Valores dependem do snapshot PvPoke já empacotado (CPM/estatísticas, nível 50, sem bônus de melhor amigo). Mudanças no jogo precisam de atualização e validação do Game Master; não usar ranks da espécie normal para Mega.
- P1 e P2 compartilham `dock.html` e `detail.html`, portanto recebem o mesmo comportamento, mantendo configurações independentes.
- **Pendente**: CI automatizado desta PR, compilação Android/R8, teste físico Samsung da renderização em GL/UL/ML, rolagem do card, popup ⓘ, outros Megas e confirmação do update após release assinada.
- Publicação precisa de autorização explícita, auditoria de assinatura permanente e workflow oficial novo (sem reusar/republicar release LT233).

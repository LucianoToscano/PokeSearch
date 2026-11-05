# LT252 — correções de usabilidade dos resultados (05/11/2026)

## Evidências recebidas
Quatro screenshots Android mostram: zero sozinho desalinhado abaixo da Pokébola; nome Mega Sableye cortado; botão de ataques representado por espadas cruzadas antes de haver verificação de legado; simulador PC/Nível com seletor de forma estreito, rolagem interna e conteúdo cortado.

## Alterações no branch de QA
- `dock.html`: o zero com contador desativado fica centralizado sobre `var(--sprite)`, não `var(--dock)`. Com o contador ligado, permanece somente o zero do indicador. Buscas pendentes ou erros não são classificados falsamente como zero.
- `detail.html`: chip PvP mantém três partes independentes [Liga IV] [Forma] [RG] + ação de golpes. Mega usa o SVG existente **antes** do nome abreviado, sem o texto “Mega” no rótulo visível; nome completo permanece nas identidades da consulta, dados e acessibilidade.
- `detail.html`: ação de golpes inicia com símbolo neutro 🗡 e só muda para ⚔️ após retorno PvPoke com status completo e legado/Elite real. O símbolo 💠 permanece restrito aos golpes efetivamente classificados como legados/Elite.
- `detail.html`: comparativo PC/Nível remove o teto da rolagem aninhada, aplica rolagem no próprio card, seletor de forma flexível, linhas de resultados quebráveis, slider com largura disponível e barra de rolagem perceptível. Fórmulas e Game Master intactos; sem menu flutuante extra.
- `app/tests/lt247-compact-iv-first-move-status-cp-simulator.test.js`: expectativa atualizada para ícone Mega antes de Sableye, sem alteração da identidade canônica.
- `app/tests/lt252-zero-mega-icon-attacks-calculator.test.js`: novas checagens preventivas.
- `pvp_rank_explorer.js`: tocar novamente no mesmo chip GL IV/RG recolhe o explorador; chips distintos alternam conteúdo e preservam a tabela correta.
- `detail.html`: o chip central ↳ da espécie alterna a abertura/fechamento da Análise PvP e permite selecionar outra evolução sem recolher a seção.
- `app/tests/lt252-toggle-rank-and-species-accordion.test.js`: regressão funcional dos dois ciclos abrir → fechar → reabrir.

## Critérios de homologação
Executar as suítes Node/Java/OTA e build Android CI, conferir ordem e truncamento no Samsung em tamanhos P, M, G e nas duas Pokébolas; testar Sableye (normal e Mega), Rowlet sem legado, um golpe legado confirmado e Snivy com simulação de formas/níveis.

**Limites:** aprovação automatizada não equivale a inspeção física Android. Não afirmar instalação, APK assinado, publicação OTA ou merge enquanto essas evidências não estiverem disponíveis.


## Evidência oficial de integração e publicação

- **PR #230**: [integração à main](https://github.com/LucianoToscano/PokeSearch/pull/230), squash commit `c1dd07171d92edd65d512cca7c9e832a8b5f65d7`.
- **Seis gates do head `1b208ea5156c3eff39799935992bc8f6ec90fb36` concluídos com success**: [Node QA](https://github.com/LucianoToscano/PokeSearch/actions/runs/42026130114), [regressões completas](https://github.com/LucianoToscano/PokeSearch/actions/runs/42026130313), [QA core](https://github.com/LucianoToscano/PokeSearch/actions/runs/42026130265), [Android Java](https://github.com/LucianoToscano/PokeSearch/actions/runs/42026130292), [OTA](https://github.com/LucianoToscano/PokeSearch/actions/runs/42026130361) e [APK beta isolado](https://github.com/LucianoToscano/PokeSearch/actions/runs/42026130103).
- **Publicação permanente**: [Actions #42026677432](https://github.com/LucianoToscano/PokeSearch/actions/runs/42026677432), `completed/success` nos jobs `preflight` e `publish`. O fluxo validou certificado, APK, regressões, asset público e hash.
- **Release pública estável**: [v0.02.52-54456](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.52-54456), publicada em 05/11/2026 às 12:26:24 UTC, `draft=false`, `prerelease=false`, confirmada em `releases/latest`.
- **APK oficial**: [PokeSearch-v0.02.52-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.52-54456/PokeSearch-v0.02.52-LT.apk), **28.390.841 bytes**, SHA-256 `df169994899bb16d1450b6228e677f274df94e663bbccfb5d29df66ef3367b5e`, asset `uploaded`.
- **Versionamento**: `0.02.52` / `versionCode 54456` / `label 51256`, anterior `0.02.51 / 54455`. Solicitação em `release/official-request.json` commit `e16d4540abf35832b0f5395cb1a49fafbcc912b5`.
- **Atualizador no aplicativo**: versão passa a ser detectável pela release pública latest; instalação depende da confirmação do Android. Nem o GitHub Actions nem estes registros demonstram download ou instalação física, tampouco inspeção visual em Samsung P/M/G nas duas Pokébolas.

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

## Critérios de homologação
Executar as suítes Node/Java/OTA e build Android CI, conferir ordem e truncamento no Samsung em tamanhos P, M, G e nas duas Pokébolas; testar Sableye (normal e Mega), Rowlet sem legado, um golpe legado confirmado e Snivy com simulação de formas/níveis.

**Limites:** aprovação automatizada não equivale a inspeção física Android. Não afirmar instalação, APK assinado, publicação OTA ou merge enquanto essas evidências não estiverem disponíveis.

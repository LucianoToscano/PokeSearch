# LT250 — Faixa PvP legível e contador 0 restaurado — 05/11/2026

## Origem: novos prints Samsung da LT249
- Oddish 0/12/14, GL **IV #1 ↳ Gloom RG #816**: aparecem DOIS círculos azuis, uma faixa externa em vez de três botões separados, texto pequeno.
- Painel PC/Nível de Oddish: `Forma` aparece como “B...” devido ao layout anterior de três colunas compactas, apesar de existir espaço vertical. Nível, setas e seletor ficam apertados.
- Ao buscar sem nenhum encontro a contagem `0` desapareceu, embora o usuário queira vê-la.

## Solução de interface
1. **Exatamente 4 ações na mesma faixa:** `[🔵 GL IV #N]` abre a tabela IV Classe; `[↳ Evolução]` abre/realça a linha correspondente na Análise PvP; `[RG #N]` abre a tabela geral; `⚔️/🗡` abre golpes verificados. Há **três divisões com bordas e fundos individuais**, e um botão de ataques. A barra externa não tem fundo. A faixa não aceita o botão `+N` ou explicação de fantasia que criavam um quinto elemento; a análise expandida mantém todas as evoluções e comparações.
2. **Sem círculo duplicado:** desativar definitivamente `#rankLine[data-league]::before` e `#rankLine::before` em CSS final com `!important`. O único indicador passa a ser o emoji dentro do botão. Manter 🔵 GL, 🟡 UL e 🟣 ML e símbolo Mega autêntico `mega_evolution_icon.svg` apenas na forma Mega.
3. **Alvos fáceis de tocar:** cada campo com altura 28px e bordas glass, fontes de 10–10,5px, espaçamento 3px, ellipsis apenas no nome da evolução; preservar Rank Classe e RG inteiros quando couberem. Botão espada 28x28px, sem quebra para segunda linha. Tamanho P/M/G e adaptação em <=320px.
4. **Simulador legível:** separar Forma e Nível em linhas de largura inteira, cada seletor com altura 34px, setas 30x34, slider amplo, corpo do painel 11,5px, resultados de 11px e altura máxima `min(66vh, 430px)` com rolagem. Continua com CP-alvo, comparação de IVs 0/0/0, perfeitos, GL/UL e projeções da família completa.
5. **Contagem zero:** `dock.html` mostra sempre o texto `0` dentro do `#resultSpawnCount` ou `#dockSpawnCount` quando `cards.length===0`; se houver resultados, respeita a preferência da contagem. A legenda vazia `#empty` continua oculta **somente na janela independente**, evitando número solto abaixo da Pokébola.

## Dados e compatibilidade
- Preservar a LT249 e as diferenças entre o filtro “Top #1” e os IVs verificados. Ex.: Machop rank real #611, Machoke #2/RG #500 (não Top #1).
- Mesmos dados/ações para P1 e P2 via `OverlayService` / `SecondaryOverlayService`; sem mudar API, login, localização ou envio de notificações.
- Não inventar Mega Teddiursa: família Teddiursa–Ursaring–Ursaluna; quando houver Mega, usar apenas formas documentadas no snapshot.

## Evidências a anexar
- Branch `fix/lt250-readable-pvp-three-chips-zero-counter-20261105`; arquivos `detail.html`, `dock.html`, `release_notes.json`.
- Teste novo `lt250-three-rank-chips-readable-cp-empty-count.test.js`; regressões LT245/LT247/LT249 e `overlay-ux.test.js` revisadas para o layout pedido.
- Versão candidata **LT250 · 0.02.50 · versionCode 54454 · label 51254**, base oficial LT249.
- Rodar QA Node completo, Java, OTA, APK beta, merge, assinatura permanente e SHA-256 antes de tornar oficial. Registrar commit e release no Arquivo Mestre. QA físico Samsung P1/P2 e P/M/G continua pendente.

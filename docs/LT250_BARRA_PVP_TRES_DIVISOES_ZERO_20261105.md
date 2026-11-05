# LT250 — Barra PvP com 3 divisões e contador 0 (05/11/2026)

## Erros demonstrados nos prints do usuário
- O cartão que deveria ser `[🔵 GL IV #1] [↳ Pikachu] [RG #840] ⚔️` ficou diminuto, com um fundo escuro unificado, apenas duas divisões aparentes e **dois círculos de liga**.
- O 0 de resultados vazios desapareceu após a LT249 (a correção do contador desligou `body.result-window #empty` e impediu a exibição via `empty.style.display`).
- Manter a barra de tamanho P legível também em M/G, sem empurrar espada para segunda linha.

## Diagnóstico e alteração
1. `detail.html`: o segundo círculo era o CSS histórico `#rankLine[data-league]::before`, enquanto o novo botão IV já imprimia o emoji 🔵/🟡/🟣. Última regra na folha desativa o pseudo-elemento com `content:none!important`.
2. A faixa `#rankLine` deixa de usar borda, gradiente e fundo unificado. Ela passa a ser apenas **um contêiner flex transparente**, altura 32px. Três controles visíveis têm 27px, borda própria, texto com 11–11,5px e sem quebra: **[Liga+IV] [↳ espécie] [RG]**. Um quarto controle sem fundo abre o painel de ataques. A divisão central cede largura primeiro, com título completo por acessibilidade; não comprimir o IV nem o RG.
3. Mesmo sem RG comprovado, a terceira divisão aparece como `RG —` com `disabled=true` e `aria-disabled=true`. Não forçar rank fictício para Megas nem para espécies sem dados.
4. Remover o botão extra `+N` do resumo de uma linha; alternativas ainda são listadas na **Análise PvP** existente e indicadas na descrição do controle da evolução. Preservar a mesma identidade de espécie para IV, RG e golpes.
5. `dock.html`: voltar a oferecer **0 para nenhum resultado**, sem duplicação. Quando o contador opcional está ligado, ele mostra o 0 **no indicador da Pokébola**. Sem contador, o botão `#empty` aparece centralizado **logo abaixo da Pokébola**. Enquanto busca ou em erro, continuar mostrando `…`/`!` em vez de falso zero; respeitar estado recolhido e evitar interferir com as Pokébolas.
6. Tudo no overlay já existente, sem novos menus flutuantes, login, API ou alteração de filtros/configurações P1/P2.

## Auditoria
- Base estável LT249 `0.02.49`/`54453`; candidata LT250 `0.02.50`/`54454`, `label 51254`.
- Novo teste `app/tests/lt250-three-readable-pvp-chips-single-league-badge-zero-count.test.js`, além das regressões LT244/LT245/LT247/LT249 e QA de compatibilidade.
- Antes de merge/publicação: 6 checks verdes (Node, regressão Node, QA core, Java, OTA, APK beta); depois release oficial assinada, assinatura e SHA-256 verificados, `releases/latest`, registro no Arquivo Mestre.
- Sem teste físico do Samsung ou confirmação visual no dispositivo; esta limitação deve permanecer explícita.

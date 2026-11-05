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

## Evidências oficiais — LT250 (05/11/2026)

- **PR e merge:** [PR #226](https://github.com/LucianoToscano/PokeSearch/pull/226) mesclada na `main` (squash commit `6e05f8ae3ac7b1ccd7e159e5a3834244da3eb6bb`). Head validado `91c13af837011a0a8f9bfb6ed9e073f82f392c69`.
- **Seis gates aprovados:** Node QA [#42020110609](https://github.com/LucianoToscano/PokeSearch/actions/runs/42020110609); regressão Node completa [#42020110782](https://github.com/LucianoToscano/PokeSearch/actions/runs/42020110782); QA core LT211 [#42020110750](https://github.com/LucianoToscano/PokeSearch/actions/runs/42020110750); Android Java LT62 [#42020110715](https://github.com/LucianoToscano/PokeSearch/actions/runs/42020110715); OTA LT173 [#42020110734](https://github.com/LucianoToscano/PokeSearch/actions/runs/42020110734); beta privado [#42020110554](https://github.com/LucianoToscano/PokeSearch/actions/runs/42020110554). Todos `completed/success`.
- **Pedido de release:** `release/official-request.json` no commit `b4b7c8be1879f22ef2a04c87f1b426cd47ac92e4`, esquema `1`, versão `0.02.50`, `versionCode 54454`, label `51254`, anterior `v0.02.49-54453`.
- **Workflow protegido de produção:** [Actions #42020576085](https://github.com/LucianoToscano/PokeSearch/actions/runs/42020576085) `completed/success`: preflight, build assinado protegido, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` concluídos `success`.
- **Publicação verificada:** [release estável v0.02.50-54454](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.50-54454), publicada em `2026-11-05T11:41:48Z`, `draft=false`, `prerelease=false`, encontrada em `releases/latest` e vinculada ao commit de pedido.
- **APK oficial:** [PokeSearch-v0.02.50-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.50-54454/PokeSearch-v0.02.50-LT.apk), **28.388.797 bytes**, hash SHA-256 `61263c52c2aa03eb6b7a36c84367e56880e858462660d6c7912ffbeccebcfafc`, asset `uploaded`.
- **Limites:** publicação e assinatura comprovadas, mas *não* há confirmação de instalação, download no aparelho ou QA visual físico Samsung P/M/G nas Pokébolas P1/P2. Essas etapas exigem teste posterior no dispositivo. O atualizador do app consulta a release pública e pode solicitá-la; o Android ainda deve aprovar a instalação.

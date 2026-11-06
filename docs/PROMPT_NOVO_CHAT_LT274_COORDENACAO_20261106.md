# CONTINUAR POKESEARCH — COORDENAR PRs #265/#266 (após LT273)
Data-base: 06/11/2026 · Repositório: https://github.com/LucianoToscano/PokeSearch

## Estado oficial comprovado
- Última APK oficial comprovada: **LT273 · 0.02.73 · versionCode 54477**.
- Release: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.73-54477
- APK: `PokeSearch-v0.02.73-LT.apk`; tamanho **33.612.358 bytes**; SHA-256 `a2e92d2ee73acafd831d10607159a6e481eb1b75131ae7f1e8fde3feb77c6e37`.
- PR #263 mesclada, CI Node/Java/visual P/M/G/PvE/OTA e QA assinada LT273 aprovadas. PR #262 duplicada fechada sem merge.
- Última `main` verificada no início desta sequência: `b9fa9ee39cce0c6692d4cc9e8bdb2c38c2543fef`. **Conferir novamente a main e releases/latest antes de qualquer mudança**.

## Ler primeiro
1. `docs/GUIA_MESTRE.md`
2. `docs/LT273_AUDITORIA_FINAL_POS_RELEASE_20261106.md`
3. `docs/PROMPT_NOVO_CHAT_LT274_20261106.md`
4. `docs/LT273_AUDITORIA_UI_RANKS_PAINELS_20261106.md`
5. `docs/LT274_AUDITORIA_IMPLEMENTACAO_20261106.md` (PR #266)
6. `docs/LT274_CORRECAO_PROPORCOES_ICONE_EVOLUCAO_20261106.md` (PR #265)

## Trabalho simultâneo — NÃO DUPLICAR PUBLICAÇÃO
- **PR #265**: https://github.com/LucianoToscano/PokeSearch/pull/265. **Mesclada** na main para corrigir altura compacta dos cartões e tamanho original do marcador de evolução. A main recebeu pedido de publicação LT274 code 54478; **confirmar release pública e QA assinada antes de declarar LT274 oficial**.
- **PR #266**: https://github.com/LucianoToscano/PokeSearch/pull/266. **Draft sem versão própria**, reconciliada com as alterações visuais #265 na main. Correção adicional solicitada anteriormente: ao abrir **Rank Classe** pelos IVs, poder escolher GL/UL/ML dentro do próprio painel; menus WebView, recálculo dos **4.096 IVs** na liga escolhida mantendo nome exato da espécie/forma e IV capturado, PC, nível, eficiência, comparação. Rank Geral permanece independente. Testes novos Node e visual P/M/G. A PR foi deixada como implementação **sem bump de release**, justamente porque #265 usa LT274 `54478`. Não publicar #266 como uma segunda LT274.
- A sobreposição de testes `lt253-visual-screenshots.cjs` foi reconciliada sem apagar a geometria visual da #265. Verificar novamente CI P/M/G. **A PR #266 não deve ser mesclada antes da publicação/QA independente da LT274 visual**; em seguida, reservar a versão próxima **LT275 · 0.02.75 · 54479**, nunca `54478` novamente. A numeração é condicional: confirmar primeiro a release real.
- Se testes apontarem falhas reais, corrigir sem enfraquecê-los e sem perder a verificação do marcador original.

## UI e regras a preservar
- Faixa de **cinco cartões**: [Raides][GL][UL][ML][RG]; `#rank` acima, bandeiras centralizadas; símbolo de evolução discreto no canto direito sem contato com bordas/ícones, não reintroduzir ↳ ao lado do número.
- Cada ícone abre sua aba; segundo toque fecha; um painel aberto retrai os demais. Ataques recomendados ficam **dentro da avaliação de liga**, com MT Ágil/Carregada Elite associados aos golpes específicos, source ID versionado.
- Rank Classe e Rank Geral nunca se confundem: Classe = 4.096 spreads IV da espécie; Geral = ranking de espécies por liga. Ambos podem selecionar GL/UL/ML pelo WebView próprio.
- Os filtros Topo/Meu IV ou Minha posição/Todos ficam **na mesma linha**, sem botões Copiar/Compartilhar/CSV visíveis, sem longos blocos de Fonte e critérios; metadados de fonte continuam verificáveis.
- Cabeçalho PvP: bandeira + nome colorido da liga + botão Ataques + X. Golpes da captura/Local após painéis e antes de Pegar Coordenadas.
- Duas Pokébolas independentes, Modos, favoritos, alertas, localizações, busca, sprites exatos/evento/Shiny, evolução, Mega, PvE, calculadora A/B, PC/PS/Nv/PC-alvo, transparência P/M/G, OTA, assinatura permanente e atualização integrada.

## Procedimento obrigatório
1. Conferir `main`, últimas tags e PRs #265/#266 (draft, head, mudanças, mergeability e verificações).
2. Priorizar a **correção visual aprovada** de #265, sem alterar silenciosamente a outra PR; não mesclar draft com falhas de CI.
3. Incorporar a seleção de Rank Classe de #266 após resolver a compatibilidade P/M/G de ambos os conjuntos. Testar troca GL→UL→ML com IVs iguais e rankings recalculados; Rank Geral preservado.
4. Executar Node completo, QA core, Java, visual real Chromium P/M/G, PvE, OTA, assinatura e release oficial quando e só quando versão sem colisão estiver pronta.
5. Após merge, verificar publicação pública, `versionCode`, nome/tamanho/SHA-256 do asset, status oficial e QA assinada; não inventar resultados nem afirmar instalação física.
6. Atualizar `docs/GUIA_MESTRE.md`, auditoria pós-release e prompt do chat seguinte. Manter rollback LT273 enquanto nova versão não for pública.
7. **Pendências externas:** testes físicos Samsung P1/P2 com fundo claro/escuro, rolagem, tamanho P/M/G, seleção tocável, atualização/instalação real, e sincronização Drive da APK. Nenhuma comprovada.

Objetivo permanente: **melhorar sem empobrecer**. Evitar publicar código 54478 duas vezes; dar prioridade aos fatos comprovados no GitHub.

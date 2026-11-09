# LT324 — refinamento visual da janela Rank Reides (Togedemaru)

**Data:** 09/11/2026 · **Base pública:** LT323 `0.03.23`, versionCode `54529` · **Status:** PR candidata, sem publicação/merge.

## Evidência recebida

Captura de tela do usuário em aparelho Samsung, com cartão de Togedemaru (`#777`, 0/13/13, CP 27 e Nv. 1), janela **Rank Reides** aberta e duas classificações específicas da espécie:

- `#58 Elétrico`, Ágil **Trovoada de Choques**, Carregado **Ataque Selvagem**.
- `#94 Aço`, Ágil **Trovoada de Choques**, Carregado **Girobola**.

A evidência permite auditar **organização e legibilidade da janela**. Não comprova a versão exata instalada, a precisão dos rankings da fonte, a elegibilidade dos golpes no exemplar ou o comportamento de toques/rolagem.

## Problemas visuais identificados

1. O número `#0777` aparece abaixo do nome na primeira linha e ao lado dele na segunda; a posição muda segundo o espaço que sobrou.
2. O bloco `Ágil · Carregado` quebra com separação pouco previsível. Na primeira linha o rótulo do Carregado fica no fim de uma linha enquanto o nome do ataque passa para a linha seguinte.
3. A sprite pequena e a combinação nome/número/rank carecem de eixo alinhado constante, especialmente em telas estreitas.

## Alterações propostas

- **Alinhamento consistente:** espécie e ícone em uma linha; `#0777` em uma segunda linha discreta, sempre no mesmo lugar relativo à espécie. Rank por tipo `#58 Elétrico` / `#94 Aço` permanece à direita e não é confundido com número da Pokédex.
- **Golpes atômicos:** os conjuntos `Ágil: [nome]` e `Carregado: [nome]` usam flex-wrap com rótulo e golpe no mesmo elemento. Se faltarem pixels, o conjunto de Carregado inicia uma nova linha. Nada de tarjas/chips coloridos; somente texto colorido por tipo como no aplicativo.
- **Sprite 28 px:** aumento muito discreto de 26 para 28px. Mantida a identidade exata da forma (Mega/Normal quando validada; Shadow sem sprite substituta enganosa).
- **Botão nome/# 30 px mínimos:** mesma interação da LT323 para abrir ER, DPS e TDO, apenas com área mais cômoda. As métricas seguem recolhidas até o toque; nenhuma nova janela nem aba.
- **Sem alteração dos valores:** nenhuma troca de fonte, da classificação, das traduções de golpes, de disponibilidade de MT, do IV, do CP ou de métricas PvE.

## QA

- Teste Node `app/tests/lt324-raid-layout-samsung.test.js` inspeciona o HTML de produção com os dados do Togedemaru.
- Teste visual Chromium `app/tests/lt323-raid-real-ui-visual.cjs` reproduz as duas classificações do Togedemaru em **P/M/G**, verifica ausência de cortes horizontais, separação nome/#/rank e captura três screenshots para auditoria.
- Gate visual existente `.github/workflows/lt253-visual-gate.yml` continua disparando o script ampliado, mantendo as verificações de LT323.
- Antes de publicação: revisar screenshots do CI e executar QA físico no Samsung (toque curto no nome, no número, recolher, abrir outra classificação, deslocamento/scroll, duplicidade de Pokébolas).

**Fora do escopo:** Dittobase/Max Battles, novos filtros, alterações de largura/altura do card principal, do Edu ou do menu de resultados. A LT323 permanece pública até a liberação autorizada da LT324.

## Ajuste solicitado pelo usuário — sem tripla repetição

A captura confirma que **sprite, nome e número da Pokédex** já estão no cabeçalho principal do card. Portanto, o Rank Reides da mesma espécie **não deve reproduzir nenhuma das três informações** a cada tipo. Para Togedemaru ficam somente `#58 Elétrico` com golpes e `#94 Aço` com golpes. O rank por tipo continua clicável para abrir ER, DPS e TDO; o `aria-label` conserva o nome acessível para leitor de tela. **Somente linhas de evolução ou forma projetada** mantêm identificação específica, a fim de não atribuir desempenho Mega/Shadow à captura comum. A regra mais recente prevalece sobre a proposta anterior de alinhar cópias do nome/# e aumentar sua sprite na janela. Nenhum sprite adicional deve ser carregado no ranking.

Os testes LT323/LT324 e screenshots P/M/G foram ajustados para comprovar **zero elementos visuais duplicados**, dois ranks funcionais, ausência de cortes e manutenção de acessibilidade.

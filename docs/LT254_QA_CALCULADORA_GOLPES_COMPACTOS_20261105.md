# LT254 QA — compactação da calculadora e legibilidade de golpes

Data: 05/11/2026. Base pública protegida: **LT253, 0.02.53, versionCode 54457**.
Branch experimental: `fix/lt254-compact-calculator-moves-20261105`. PR: [#233](https://github.com/LucianoToscano/PokeSearch/pull/233) (**rascunho, não publicada**).

## Falhas demonstradas em duas capturas Samsung

- **Diglett 0/15/13, PC 369, Nv. 22:** a calculadora ocupa quase toda a altura, repetia títulos, colocava IV A e B em duas caixas altas, apresentava um slider de nível excessivamente curto e mostrava `ΔPC -56` mesmo com IV B (15/15/15) em PC 425; a diferença precisa ter orientação clara.
- **Bulbasaur:** as recomendações mostram nomes de golpes em português, mas “Carregado 2” se desprende do nome “Bomba de Sementes” e ocupa linhas avulsas. A legenda de capturados repete a lista do cartão. O símbolo de espada comum, embora rotulado como “sem legado”, pode ser confundido com indicador de golpe legado.

## Alterações propostas

1. **Uma só janela nativa** de detalhes e sua rolagem original, sem acrescentar ícones flutuantes ou alterar largura/altura padrão P/M/G.
2. **IV A/B** em duas faixas horizontais com A/D/S em 3 campos cada; ↶ restaura o IV capturado. Select de forma, stepper e slider preservados; botões menores e maior área útil.
3. **Matemática sem ambiguidade:** nova linha “Diferença B − A”, sinal positivo quando B tem PC maior. Projeção de LC 500, GL 1500, UL 2500 e alvo continua na tela; valores opcionais 0/0/0 e 15/15/15 em `details` retraído por padrão.
4. **Recomendações:** layout em grade Ágil / C1 / C2 com nome e Poder/Energia em linhas alinhadas, mantendo traduções PT-BR somente quando verificadas e `💠` apenas em golpes Elite/Legado confirmados.
5. **Ícones:** ⚡ é ação neutra para consultar ataques; ⚔️ somente após fonte informar legado/Elite. Nenhuma nova requisição remota automática.
6. **Sem duplicação:** a lista dos ataques capturados permanece no campo “Golpes” do cartão e não reaparece na caixa de recomendados.
7. **Fonte, permissões, cache e duas Pokébolas inalterados.** O layout principal translúcido continua compacto.

## Testes obrigatórios e bloqueio de publicação

- Novo `app/tests/lt254-compact-calculator-moves-samsung.test.js`: simulação de Diglett com Game Master empacotado, diferença B−A, status de legado confirmado, layout de linhas A/B e golpes C1/C2.
- Regressão Node integral, QA core Android, contrato OTA e compilação Java devem estar verdes.
- Playwright `lt253-visual-screenshots.cjs` ampliado: screenshots da calculadora e do painel de recomendados em P 200px, M 240px, G 320px, largura mínima dos campos e slider, sem transbordamento.
- **Pendente** inspeção visual das capturas geradas e experiência real no Samsung em P1/P2, inclusive scroll final, teclado numérico e toque de abrir/retrair o painel.
- **Não há merge nem solicitação de APK oficial**; manter LT253 como rollback até homologação, depois decidir versionamento LT254. A assinatura de teste não substitui o certificado oficial.

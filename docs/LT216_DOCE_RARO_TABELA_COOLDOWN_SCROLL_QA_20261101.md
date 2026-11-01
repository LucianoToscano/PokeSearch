# PokeSearch LT216 — Correção do painel de cooldown do Doce Raro

Data: 01/11/2026. Versão publicada antes desta etapa: LT215, 0.02.15, versionCode 54422.

## Defeito confirmado por captura Samsung

O painel "Referência de cooldown" desenhava a moldura somente até as primeiras 3-4 linhas e continuava pintando as linhas sem moldura, por cima da tela, sem rolagem adequada. A tabela era criada no JS com as classes `visible locationPanel locationCooldownTable`; a regra CSS do menu compacto `#choices.locationPanel,#choices.infoPanel` aplicava `max-height:145px!important` e `overflow:visible!important`, sobrepondo o `max-height:280px` e `overflow-y:auto` da tabela. O WebView nativo tinha altura de 290dp e barra de 34px.

## Correção LT216

- `rare_candy_controls.html`: classe da tabela isolada em `visible locationCooldownTable`, sem herdar `locationPanel`.
- Moldura da tabela com altura máxima de 250px, respeitando `100vh - 40px`, `overflow:hidden` no card, cores/opacidade iguais aos menus atuais.
- Cabeçalho, botão voltar e explicação ficam fixos; **apenas a lista** possui `overflow-y:auto`, `touch-action:pan-y`, rolagem própria no Android e scrollbar discreta.
- As 16 distâncias continuam presentes, da primeira `< 10 m` até `≥ 1000 km`, com `role=list` e `role=listitem` e instrução "Deslize a lista para ver todas".
- Janela nativa de 232dp de largura/290dp de altura preservada; não modificar controles compactos normais, coordenadas, busca, cooldown de coleta ou HTTP 429.
- Não modificar chat, Favoritos ou duas Pokébolas.

## QA automatizado

`app/tests/lt216-candy-cooldown-scroll.test.js` reproduz a causa original, verifica que a tabela não recebe a classe compacta, testa propriedades reais do CSS, altura da WebView, presença das 16 faixas, estado do botão voltar e preservação do rascunho. Executar também `lt214-candy-location-parity.test.js`, `lt175-rare-candy-overlay.test.js` e todo o gate Java/Node/Android.

## QA físico Samsung

1. Abrir Doce Raro > Localização > tocar no texto "Localização".
2. Confirmar que a moldura contém todas as linhas VISÍVEIS e que a parte inferior não desenha texto fora dela.
3. Deslizar a lista até a última faixa `≥ 1000 km ≈ 2h`, voltar ao topo e verificar resposta ao toque sem arrastar a janela externa.
4. Testar perto do rodapé, teclado aberto, modo claro/escuro, com raio de 1 a 1000 km e em ambas orientações, observando ausência de recortes.
5. Voltar para Localização e conferir que coords/raio rascunhados não são apagados, que o botão Colar funciona e que não há busca automática.

**Status:** correção no código e testes automáticos devem ser confirmados em PR. APK QA com assinatura permanente, versionCode 54423, ainda não é release estável até homologação física. A LT215 permanece publicada.

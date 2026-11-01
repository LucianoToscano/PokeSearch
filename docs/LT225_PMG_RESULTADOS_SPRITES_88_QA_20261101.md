# LT225 QA — tamanho P/M/G aplicado aos resultados e sprites a 88%

Data: 01/11/2026. Base LT224 QA 0.02.24 / versionCode 54431.

## Correção solicitada
Usuário confirma que 30×30 dp é **somente o tamanho P**. No tamanho M e no G, **o cartão individual e a sprite devem aumentar juntos**. A sprite deve ocupar de 85% a 90% do quadrado, centralizada.

### Contrato aprovado
| Tamanho | Configuração nativa preservada | Cartão do resultado | Área da imagem | Espaçamento |
|---|---:|---:|---:|---:|
| P | 35 | 30×30 dp | 26,4×26,4 dp (88%) | 2 dp |
| M | 45 | 40×40 dp | 35,2×35,2 dp (88%) | 2 dp |
| G | 55 | 50×50 dp | 44×44 dp (88%) | 2 dp |

- O padrão P é igual ao botão de menu 30×30 dp. O tamanho dos **botões de menu nunca cresce** com M/G.
- Mudanças só na janela de resultados: WebView `computeResultLayout`, CSS final `--result-tile-size` e `--result-art-size`, e Android `resultTileDp()`. Todas usam o mesmo mapa P/M/G.
- Fundo individual `card` ou `none`, orientações horizontal/vertical independentes e transparência são preservadas.
- Sprites `object-fit:contain; object-position:center center` e `transform:none` na janela de resultados, sem escalas antigas compostas nem deformação de proporção.
- Cada célula e fundo usam as dimensões do preset, metadados opcionais continuam na coluna lateral, hitbox Android cresce com o cartão, gaps fixos em 2dp.
- Sem reduzir o tamanho escolhido para forçar os dez resultados em uma linha; onde não couberem, a linha quebra. Não alterar APIs, quota, Shiny, chat, login, Doce Raro ou Editor Visual arrastável.

## Teste
- Teste de contrato e execução real `app/tests/lt224-result-menu-parity.test.js` atualizado para as 12 combinações P/M/G × horizontal/vertical × fundo com/sem.
- Regressões Android e Node, compilação APK privada com assinatura v2 e certificado fixo, versão QA 0.02.25/54432, sem atualizar o APK público até QA física.
- Testar no Samsung P/M/G e confirmar que o tamanho do cartão realmente cresce a cada troca, a sprite ocupa 88% da área e permanece no centro; repetir com/sem fundo, 2 Pokébolas independentes e metadados ligados.
- Não confundir “área da imagem” (88% da célula) com a área não-transparente dos PNGs, que varia entre espécies.

Última release pública estável permanece LT215, aguardando homologação física de QA posteriores.

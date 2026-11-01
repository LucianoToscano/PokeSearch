# PokeSearch LT214 — Localização Doce Raro com colagem automática e referência de cooldown

**Base:** LT213 / main `fd531a64546a9fba758fc6416fb0c2869665541b`.
**Escopo:** apenas localização da janela dos Doces Raros e testes/CI. Chat intocado.

## Problema e comportamento corrigido

- Antes, o Doce Raro só colava coordenadas depois de tocar em Colar e lia a área de transferência sem temporariamente dar foco ao overlay. No Android 10+, a leitura pode falhar se a janela não tiver foco.
- Agora, abrir o painel Localização solicita **uma leitura de clipboard pelo Android** após o foco transitório (180 ms), normaliza um par latitude/longitude válido e preenche o campo automaticamente. **Não clica em Aplicar, não pesquisa, não transmite as coordenadas ao servidor e não muda filtros**. Se o Android negar acesso ou o conteúdo estiver inválido, os dados salvos permanecem; o botão Colar e a colagem pelo teclado continuam disponíveis.
- Parser puro `CandyClipboardCoordinates` aceita par exato ou embutido num texto/link, `;` ou `,`, sinal negativo Unicode, rejeita lat/lon fora do intervalo, mais de um par distinto e textos extensos; não guarda nem registra a área de transferência.
- Tocar **no título Localização** abre uma tabela compacta rolável com as **16 faixas informativas já usadas pelo aplicativo** (`CandyCooldownPolicy` e a referência dos Pokémon), botão voltar e restauração de coordenadas/raio não aplicados.
- Arrastar a **barra do raio km** exibe temporariamente a faixa e duração estimada. O raio é a região da pesquisa, **não é a distância de fato percorrida entre coletas**. A prévia não cria contador e **não altera o controle de coleta/confirmada, bloqueio HTTP 429 ou buscas**.
- O gráfico enviado apresenta valores diferentes da tabela histórica do aplicativo. Esta implementação deliberadamente conserva a tabela de referência já conectada à política do Doce Raro e não apresenta nenhum valor como regra oficial do Pokémon GO. Revisão dos números exige evidência independente.

## Verificações

- `CandyClipboardCoordinatesTest.java` cobre variações e rejeições de texto/coords.
- `lt214-candy-location-parity.test.js` exercita abertura automática, callbacks antigos/atuais, recusa de sobrescrever edição, botão copiar/colar, ida/volta tabela, prévia e Apply manual.
- `qa-core-contracts.yml`: compila parser novo com os demais Java puros. O CI Node completo cobre contratos prévios do Doce Raro.

## QA físico ainda necessário

1. Copiar coordenadas no Android/PGSharp; abrir Doce Raro > Localização e verificar preenchimento automático sem clicar em Colar; conferir que nada foi aplicado antes de ✓.
2. Testar clipboard sem coordenadas, texto com duas coordenadas distintas, bloqueio pelo Android e colagem explícita.
3. Tocar só no título Localização; rolar a tabela; voltar e conferir rascunhos. Arrastar km em 1, 5, 25, 100, 250, 500, 1000 e verificar a prévia.
4. Testar teclado/foco, painel sobrepondo jogo, tema claro/escuro, Android 15/16; verificar 429 da API e confirmação de coleta independentes.
5. Instalar APK QA com **mesma assinatura permanente**, código maior que 54420. Não liberar a todos até passar no aparelho.

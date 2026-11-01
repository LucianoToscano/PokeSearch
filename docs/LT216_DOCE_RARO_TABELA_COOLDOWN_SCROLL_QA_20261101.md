# PokeSearch LT216 — Painel de cooldown igual ao da Localização dos Pokémon

Data: 01/11/2026. Base pública: LT215 0.02.15 / versionCode 54422.

## Defeito observado na captura do Samsung

Na LT215, a tabela do Doce Raro herdava a classe de menu compacto `locationPanel`, que impõe `max-height:145px!important` e `overflow:visible!important`. Resultado: só as primeiras linhas ficavam dentro da moldura, enquanto as demais eram desenhadas sobre a tela sem fundo.

## Correção, conforme solicitação do usuário

**Sem lista rolável.** Usar como modelo a referência de cooldown aberta pelo título Localização do menu Pokémon: um painel compacto, de duas colunas ("Distância" e "Cooldown"), com **todas as 16 faixas visíveis simultaneamente**.

- O HTML Doce Raro passa a aplicar exclusivamente `locationCooldownTable`, não `locationPanel`.
- Tabela de 148px no WebView nativo de 158dp, com botão "‹ Localização" no topo, título de colunas, 16 linhas compactas (18px cada), e aviso de estimativa não oficial em uma linha.
- CSS sem `overflow-y:auto`, sem `touch-action:pan-y` e sem scroll interno. Moldura acompanha a altura do conteúdo; linhas não podem escapar.
- WebView nativo amplia altura para **396dp** apenas na referência (os menus padrão continuam compactos, inclusive Localização e Info), com limite de altura real do dispositivo.
- O formulário de Localização preserva coordenadas e raio ao voltar; cola automática, clipboard e lógica de aplicação permanecem.
- As faixas e os tempos já usados pelo Pokémon são mantidos; **estimativas informativas**, não garantia oficial.
- Chat, duas Pokébolas, coleta de doce, filtros e HTTP 429 **não são modificados**.

## Verificação técnica e visual

Os testes Node LT214/LT216 verificam ausência de classe problemática, largura, altura, presença das 16 linhas e da última faixa `≥ 1000 km`, não rolável, botão voltar e dados do formulário preservados. Executar todos os testes Java/Node/OTA/Android e verificar assinatura no APK QA.

No Samsung, abrir Doce Raro > Localização > tocar no próprio título. Confirmar que **todas as 16 linhas estão visíveis sem deslizar**, inclusive a última, e que a moldura termina somente após o rodapé da tabela. Testar com a barra no alto, meio e perto do rodapé, em orientação retrato e paisagem. O posicionamento nativo deve manter a janela na tela. Voltar e confirmar que as coordenadas e o raio não mudaram.

**Status:** correção em QA, ainda não publicada. Teste físico deve ser confirmado antes de distribuir para todos. LT215 continua estável até aprovação.

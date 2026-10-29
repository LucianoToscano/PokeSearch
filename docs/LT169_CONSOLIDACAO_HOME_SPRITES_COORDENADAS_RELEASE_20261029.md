# PokeSearch — LT169 consolidada (29/10/2026)

## Ordem e origem

Base oficial **LT168**, `0.01.68 / 54373`, imutável.
- PR [#113](https://github.com/LucianoToscano/PokeSearch/pull/113): ícone discreto de alternar treinador apenas com 2+ treinadores válidos e diferentes; preferências de privacidade local na Home para nome da conta Google PoGoCoordinates, nome do treinador e código (Anônimo, Anônimo, XXXX XXXX XXXX).
- PR [#114](https://github.com/LucianoToscano/PokeSearch/pull/114): índice verificado de 1.679 sprites GO especiais, normalização de nomes/variantes, integridade por Git blob SHA-1 e cache privado, paridade API ON / DOM OFF na lista e no detalhe de P1/P2. A API não devolve URL da imagem exata usada pelo site.
- **Ajuste adicional em LT169:** no `detail.html`, texto das coordenadas reveladas não usa mais `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`. O botão fica alinhado à esquerda, reserva espaço para indicador de quota e permite duas linhas para números longos, sem cortar dados. Exemplo `20.9981658,105.8591672`. Tocar para copiar mantém o valor integral.
- `app/tests/lt160-hide-empty-pvp-center-coords.test.js` atualizado para verificar os novos insets, a remoção das reticências, a continuidade da cópia e o alinhamento do botão antes do reveal.

## Versão e controle de distribuição

Candidata oficial `0.01.69`, `versionCode 54374`, `v0.01.69-54374`. Pipeline exclusivo `.github/workflows/lt169-combined-official-release.yml`, derivado do pipeline oficial de assinatura permanente LT168, exigindo:
- assinatura v2 SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, R8, pacote `com.lucianotoscano.pokesearch`;
- testes Node completos, testes LT169 sprite/privacidade/treinador, regressão de coordenadas, build Java/Gradle e cache/assets;
- integridade APK ZIP, bytes, SHA-256 e SOURCE_COMMIT, asset no GitHub Actions; publicação oficial apenas se a última release ainda for `v0.01.68-54373` e a tag LT169 ainda não existir;
- verificação após publicação de `releases/latest` com nome, tamanho e SHA-256 do APK.

**Autorização:** o proprietário pediu explicitamente aplicar todas as correções, fazer merge, registrar, gerar APK e distribuir a atualização para todos. Publicação voluntária via GitHub Releases, sem instalação silenciosa nem reinicialização forçada.

## Limitações e QA físico

O resultado de CI não confirma renderização real no Samsung. Testar, após instalar: ambas as Pokébolas; API ON/OFF com Flabébé amarela, vermelha, azul, laranja e branca; outras formas/trajes; Shiny; cache sob falha de rede; coordenadas com 7+ casas decimais (com e sem sinal); identificação curta em sprite sem fonte; 1 ou 2+ treinadores; três preferências de privacidade; login e Premium preservados. Em modo API a arte GO é de mesma variante, não necessariamente o mesmo arquivo literal do PoGoCoordinates.

**Status inicial:** integrado em branch de publicação; considerar a release como publicada somente após workflow e asset validado. O registro final de release (run, hash, bytes, tag e SOURCE_COMMIT) deverá refletir o estado realmente confirmado.

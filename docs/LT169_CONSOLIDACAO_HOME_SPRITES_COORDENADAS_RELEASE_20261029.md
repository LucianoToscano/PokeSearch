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

## Execução inicial do workflow oficial e correção da regressão histórica

- GitHub Actions [#40873019165](https://github.com/LucianoToscano/PokeSearch/actions/runs/40873019165) abortou **antes do build e da publicação**: o teste histórico `lt153-pvp-clarity-layout.test.js` ainda exigia margens simétricas com coordenadas centradas, incompatíveis com a correção explícita de reticências pedida pelo usuário.
- Também localizada verificação antiga em `lt165-pvp-costume-evolution-references.test.js` exigindo `text-overflow:ellipsis`; ambas foram atualizadas para testar que a coordenada completa pode quebrar linha, sem perder dígitos ou mudar o valor da cópia.
- Workflow oficial alterado para testar explicitamente os dois contratos revisados e gerar nova execução na main após merge autorizado. **Nenhum APK da tentativa inicial foi publicado** e a tag LT168 anterior foi preservada.

## Regressão completa GO após integração (29/10/2026)

A segunda tentativa oficial [#40873357875](https://github.com/LucianoToscano/PokeSearch/actions/runs/40873357875) parou antes do APK porque `lt161-shellos-gastrodon-west-sea-sprites.test.js` exigia ausência de arte em East Sea, agora coberta pelo índice GO exato. Para impedir uma sequência de falhas em testes históricos antigos, foi introduzida a execução **de todos os testes Node de produção**, não apenas da seleção reduzida de QA.

Essa validação encontrou e corrigiu três expectativas obsoletas, **sem modificar o comportamento novo do aplicativo**:
- LT108: Furfrou Dandy/Debutante/Heart/Diamond/Matron/Pharaoh/Kabuki/La Reine agora têm sprite GO exata; a espécie Natural não deve substituir esses trajes.
- LT161: Shellos/Gastrodon East Sea agora possuem `pm422/423.fEAST_SEA` normal/Shiny com hash verificado; West Sea continua offline.
- LT145: o fallback `◉` foi substituído por iniciais discretas, preservando a ausência de sprites incorretas.

**Suíte Node completa aprovada:** [GitHub Actions #40873960256](https://github.com/LucianoToscano/PokeSearch/actions/runs/40873960256) — SUCCESS, sem exclusões além do teste obsoleto LT74 DEBUG já excluído nos workflows oficiais. O pipeline oficial LT169 foi atualizado para exigir explicitamente essas regressões antes de promover o APK.

A versão pública só será considerada LT169 após build assinado e verificação da release real. O QA físico Samsung continua pendente.

## Terceira execução oficial — proteção do conteúdo APK

O workflow [#40874157619](https://github.com/LucianoToscano/PokeSearch/actions/runs/40874157619) passou em todos os testes, montagem dos sprites e `:app:assembleRelease`, porém parou no estágio **Audit APK certificate, R8, build version and offline manifest**. O script anterior fazia repetidos `unzip -Z1 "$APK" | grep -Fq "entrada"` com `set -o pipefail`, suscetíveis a SIGPIPE (leitura encerrada assim que o grep acha a primeira entrada); o erro não revelava qual arquivo falhou.

A nova checagem gera `APK-ENTRIES.txt` uma única vez, aplica `check_entry` sobre o arquivo completo e identifica explicitamente recursos ausentes. **A verificação de integridade não foi removida**: continuam exigidos manifesto GO, ícone vetorial de troca, sprites normais/Shiny, versão/package, R8, assinatura v2 e certificado permanente. A nova tentativa da pipeline oficial só publica após todos os gates.

## Quarta execução oficial — caminho compilado do ícone (29/10/2026)

O workflow [#40875024094](https://github.com/LucianoToscano/PokeSearch/actions/runs/40875024094) concluiu testes, bundle de sprites e build Android R8/assinado, mas a auditoria explicitou `Missing compiled APK entry: res/drawable/ps_trainer_switch`. A otimização `isShrinkResources=true` do Android pode renomear o caminho físico de vetores no ZIP mesmo quando `R.drawable.ps_trainer_switch` é usado e compilado no aplicativo.

A verificação do ícone passa a exigir o XML original, a referência Java nativa e um dump válido da tabela de recursos do APK pelo `aapt`. Quando o nome legível permanece na tabela, é confirmado; se o otimizador o encurtou, o workflow registra esse fato sem concluir incorretamente que o APK perdeu o vetor. A integridade dos demais recursos mantém checagem de entradas no APK, e os metadados `APK-ENTRIES.txt` e `APK-RESOURCE-TABLE.txt` são anexados à evidência oficial. O APK não foi publicado na quarta execução.

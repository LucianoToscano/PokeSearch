# LT289 — Sprites pequenas de eventos e proporcionalidade dos Resultados
Data: 07/11/2026. **Estado final:** LT289 publicada oficialmente, com homologação física Samsung ainda pendente. Base anterior LT288 `v0.02.88-54492`.

## Evidência
Captura Samsung: o card do Pikachu #25 indica claramente **Anniversary 2026 Singapore 01** e mostra a sprite correta, enquanto a miniatura na lista flutuante é muito pequena perante Ralts, Torchic e Chikorita. As setas apontam a diferença perceptível. O card detalhado e os dados devem permanecer intactos.

## Diagnóstico
LT288 tentou medir a silhueta de imagens do PoGoCoordinates usando referência PNG local, mas: (a) o limite conservador de **1,8×** mantinha muito pequenas sprites com grandes margens transparentes; (b) o GO index já continha os arquivos exatos do Pikachu Anniversary Singapore 2026, mas o conjunto de formas incluídas no APK não os empacotava e o verificador de fantasia com ID numérico podia rejeitar o nome conhecido. Não devemos compensar a ausência de dados com uma sprite Pikachu comum.

## Correção
- Quatro PNGs oficiais de arquivo de sprites GO, fixados no commit `c2a686eb08ace6e890d8fe3d2134c76988db87b5`, são incluídos pelo build para a **mesma variante**: masculino/feminino, normal/Shiny. SHA-1 do blob verificado pelo builder; um arquivo ausente faz a publicação assinada falhar.
- O resolver `goExactIcon` aceita o nome explícito `Anniversary 2026 Singapore 01` como *form* mesmo quando o provedor classifica como fantasia com ID numérico. Uma fantasia contraditória ou outro país não utiliza o sprite de Singapura.
- A sprite exibida pelo PoGoCoordinates continua intacta; os bytes locais exatos são utilizados apenas como referência auxiliar de transparência (ou fallback de carregamento quando necessário).
- Para PNGs de formas GO explicitamente verificadas no pacote, o ajuste de silhueta chega no máximo a **4,25×**, com posicionamento limitado a 34% do tile; a silhueta continua com alvo de aproximadamente 87% da área. Outras imagens ainda têm limite 1,8× na medição auxiliar. Não se aplica ampliação global a tudo.
- Preservar as duas Pokébolas independentes e o Editor Visual P/M/G 24/32/40dp; não introduzir endpoint, permissão ou vínculo a conta.

## QA
- `node app/tests/lt289-anniversary-exact-sprite-geometry.test.js`: verifica hashes de quatro PNGs, presença exigida no APK, seleção exata por nome/form, ID de fantasia, feminino/Shiny, rejeição de outras fantasias e limitação da escala em imagem do site com CORS bloqueado.
- Regressão de JS, Android/Java, OTA, tela visual P/M/G e compilação APK beta privado, todos no SHA atual.
- **Samsung físico pendente:** verificar Pikachu Anniversary Singapore nas duas Pokébolas, diferença de tamanho frente a Ralts/Chikorita, e se a arte não ultrapassa a linha ao alternar P/M/G, inclusive Shiny e feminino. CI não mede cada fonte remota no aparelho.

## Publicação
PR de QA, merge somente após gates, seguida do workflow permanente de assinatura e verificação SHA-256 do APK. Não afirmar correção física definitiva antes do teste no Samsung.

## Integração e publicação oficial verificadas
- [PR #283](https://github.com/LucianoToscano/PokeSearch/pull/283) mesclada por squash `84025766066661b0aebf5f42e81a2b9222243d75`; QA no head `8320f2649a65f804557d5573b3901b90d6d0679a`. Sete verificações obrigatórias passaram (Node QA, LT169, LT211, LT62, LT173, LT253, APK beta privado). Falhas de contratos de inventário legado em commits de QA anteriores foram corrigidas antes dos sete gates finais. Build genérico em PR `skipped` por política.
- [Workflow oficial #42347686391](https://github.com/LucianoToscano/PokeSearch/actions/runs/42347686391) encerrou `completed/success`: `preflight=success`, `publish=success`, assets verificados, `Build signed protected release`, `Validate APK and signer` e `Verify public release and hash` aprovados.
- [Release estável LT289](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.89-54493) `v0.02.89-54493`, publicada em 07/11/2026 às 06:38:27 UTC, `draft=false`, `prerelease=false`, request SHA `3dda45438193fb23472e063553b949cbf8d86f06`. APK `PokeSearch-v0.02.89-LT.apk` com 33.933.806 bytes, SHA-256 `c3ce5f51713b0fb5167d68dad19cdb5e59aeb97a4a2b60cde8feff1b6e371f87` e estado `uploaded`; [baixar APK](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.89-54493/PokeSearch-v0.02.89-LT.apk).
- **Limites:** sem homologação física no Samsung: medir visualmente a miniatura do Pikachu Anniversary 2026 Singapore 01 junto de Chikorita e Ralts, P1/P2 e tamanhos P/M/G. Não afirmar que todos os resultados ficam matematicamente idênticos, porque artes oficiais têm silhuetas diferentes. Sem mudanças no card, dados de conta, coordenadas, buscas ou acesso ao provedor.

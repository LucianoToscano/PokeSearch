# PokeSearch LT288 — Sprites uniformes nos Resultados P1/P2

Data: 07/11/2026. **Estado final:** publicação oficial concluída e verificada; validação física Samsung pendente. Estado inicial: PR de QA.

## Evidência física
Captura recente após LT287: as sprites agora estão presentes nas duas listas, porém Snorlax, Totodile, Meowth, Torchic, Chikorita, Pikachu e outras ocupam tamanhos visuais diferentes. Preservar o padrão compacto P/M/G e a imagem do PoGoCoordinates.

## Diagnóstico
O LT287 tornou preferencial a URL HTTPS exata validada no card do provedor. Em LT226, o normalizador de miniaturas calcula a silhueta com pixels alfa para ocupar cerca de 87% da caixa. Imagens remotas sem CORS são exibíveis, mas leitura dos seus pixels no canvas pode falhar, deixando o zoom 1 enquanto outros arquivos são medidos e ajustados. Mesmo com caixas físicas idênticas, há diferença perceptual.

## Correção
1. Se a imagem permitir medição de transparência, manter cálculo original.
2. Se a imagem remota bloquear o canvas, usar apenas um PNG de identidade exata, verificado pelo resolver local e disponível via ponte nativa, como referência auxiliar de geometria. O URL e os pixels exibidos continuam os do PoGoCoordinates.
3. Limites do ajuste auxiliar: zoom de 0,8 a 1,8; deslocamento máximo de 12% da caixa P/M/G. Sem referência comprovada, manter dimensão conservadora, sem substituir espécie, forma, Shiny ou fantasia.
4. Cancelar callbacks quando o card for substituído ou removido. Sem novos domínios, requisições, permissões ou alteração na busca. Duas Pokébolas independentes.

## QA
O teste lt288-uniform-sprite-visual-size.test.js cobre imagem externa com canvas bloqueado, imagem legível, referência PNG, URI externa rejeitada, proteção contra retorno tardio, limites e tamanhos 24/32/40 dp. LT226 permanece como teste de 85–90% em imagens acessíveis. Node regressão completa, Java Android, OTA, visual P/M/G e APK beta privado são obrigatórios no commit final.

**Homologação física pendente:** testar com Snorlax, Totodile, Meowth, Torchic, Pikachu e Cyndaquil em P1/P2, incluindo após trocar de aplicativo e bloquear a tela. A referência local pode ter contorno diferente da arte externa; os limites evitam ampliações excessivas, mas não comprovam uniformidade perfeita de toda fantasia sem arquivo equivalente.

## Publicação
Somente após aprovação de CI, merge, workflow permanente e SHA verificado. Base anterior LT287 (0.02.87, 54491).

## Evidência final — integração e publicação
- [PR #282](https://github.com/LucianoToscano/PokeSearch/pull/282) mesclada por squash `16e2088f5f3a13a86e3ae6cbeb9a9d3f54858471`; SHA de QA `9e6abe4ca930e7ab8023efeb05af031cc36e6114`. Sete verificações exigidas concluíram `success` (Node, regressão completa, Java, lógica Android, OTA, visual P/M/G, beta privado). A falha transitória no QA em commit anterior foi corrigida no contrato LT287 e a rodada atual passou integralmente.
- [Workflow permanente #42346013864](https://github.com/LucianoToscano/PokeSearch/actions/runs/42346013864): `completed/success`, `preflight=success`, `publish=success`; etapas `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` aprovadas.
- [Release estável LT288](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.88-54492): `v0.02.88-54492`, publicada em 07/11/2026 às 06:16:28 UTC, `draft=false`, `prerelease=false`. APK `PokeSearch-v0.02.88-LT.apk` com 33.823.208 bytes, SHA-256 `b887931b98aa08c434c8494cf622f0502c57fa3b0fde68ca3722198e2ad694bf`, [download oficial](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.88-54492/PokeSearch-v0.02.88-LT.apk). Request SHA `50221545019dfaf401d74c08d7fda0917e31e23c`.
- **Pendências:** instalar no Samsung e confirmar visual das duas listas/10 resultados para P, M e G, sem exagerar imagens grandes ou reduzir demais as pequenas. Testes Node não substituem homologação física e não medem todas as sprites remotas reais.

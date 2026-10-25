# LT102 — auditoria de regressões, imagem e promoção oficial
Data: 25/10/2026. Repositório LucianoToscano/PokeSearch.
 
## Observação relatada
O usuário informou intermitência de imagens/sprites no Samsung: alguns aparecem, outros não. Não se deve assumir que uma imagem ausente representa a espécie, forma ou Shiny genéricos.

## Correção conservadora
- `app/src/main/assets/dock.html`: `pooledBaseSprite` agora encerra requisições mesmo que Android WebView não dispare eventos: após 2,4 s tenta o **mirror exato** PokeAPI base, que também é limitado a 3,5 s; o mesmo promise atende chips repetidos e falha temporária tem TTL de 30 s.
- Resultados com URL fornecida pelo provedor usam apenas essa URL, ou o mirror exato de sprite-base reconhecido. Após 18,5 s sem imagem decodificada visível, apresentam fallback neutro em vez de uma linha em branco; nenhum ID de costume, forma especial ou shiny é inventado.
- `VerifiedSpriteCache.java` preservado integralmente (PNG verificado, tamanho/dimensões/cache privados/limites e shiny segregado). `probe.js` preservado integralmente.
- A presença de placeholders quando o site não forneceu URL real permanece uma **limitação de origem**, não falha a ser mascarada como sprite inventado. Testes físicos Samsung e rede são pendentes.

## Checklist de regressão obrigatória antes de publicar
- Confirmar `applicationId=com.lucianotoscano.pokesearch` e `namespace=com.lucianotoscano.pokesearchoverlay`.
- Garantir 10 resultados no máximo, remoção após Despawn, GL/UL/IV, shiny, API autorizada, coords/raio/slider LT100, favoritos 3 slots, paleta/menu/transparência, som/alertas/Pix, Home login, Agradecimentos e Mural no mesmo scroll.
- Confirmar a ordem de dependências de Git: PR #65 sobre #64, #64 sobre #63, #63 sobre main. Fazer merge nesta ordem com verificação de head/base e CI; manter docs/GUIA_MESTRE.md resumido e backup integral intacto.
- Build QA assinado R8 não depurável `0.00.102/versionCode 54305`. Verificar `SOURCE_COMMIT`, SHA256SUMS, `apksigner` v2 e mesmo certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Instalação Samsung não pode ser alegada concluída via CI.
- Usuário autorizou merge e promoção oficial neste turno, incluindo cópia Drive e sistema de atualização do app. GitHubUpdateCenter exige GitHub Release estável `v0.00.102-54305` com `PokeSearch-v0.00.102-LT.apk`, SHA256 de asset e assinatura; upload isolado no Drive não equivale a Release.
- O Firebase RTDB do mural ainda não teve Rules/Admin ou `allowDirectPosts=true` confirmados. A postagem pode continuar fechada no servidor mesmo com UI disponível, sem declarar "online ativo" e sem implantar regras implicitamente.
- Verificar permissões de GitHub e se workflow manual oficial `pokesearch-official-release-manual.yml` pode ser acionado. Não inventar Release/tag ou afirmar atualização remota sem verificação.
 
## Registro da publicação
Preencher abaixo **apenas após confirmação real** de merge, CI, artefato, Drive, GitHub Release e APK publicado. Não repetir informações de versões antigas.

## Evidência da QA assinada
- [Actions #40199018230](https://github.com/LucianoToscano/PokeSearch/actions/runs/40199018230): SUCCESS.
- Artifact #12601060845, ZIP SHA-256 `740e7651434a7ccb32a02747bf7825b21ffe3213a2600f2b0ce75032c85ac79e`.
- SOURCE_COMMIT: `69c4a28684fa0d8f93dbac2f3bb16a73ad3c3f8a`.
- APK `PokeSearch-v0.00.102-LT-Sprite-Recovery-Community-QA.apk`: 39.203.529 bytes, SHA-256 `2e99d46355ecef4e6046787dce56b9557b039a2cea0e33857947feecf4a9b303`, checksum do artifact OK. package `com.lucianotoscano.pokesearch`, 0.00.102/54305, R8, não depurável, assinatura v2, pin permanente.
- Compatibilidade do APK com instalação Samsung e sucesso real das fontes especiais de imagens: ainda não homologados. Não foram implantadas regras Firebase nem realizadas publicações online.

# LT324 — distância em km independente da ordenação e do geofiltro (09/11/2026)

## Origem da solicitação
O usuário quer que o PokeSearch mostre os km dos Pokémon em todas as buscas, mesmo sem inserir coordenadas ou usar a ordenação "Distância". O campo deve continuar visível ao ordenar por PC maior/menor, nível maior/menor, IV e despawn. Não usar GPS nem última localização implicitamente.

## Alteração integrada
- PR [#325](https://github.com/LucianoToscano/PokeSearch/pull/325), squash em `main` `0df5e271ee43a486d117502e415933772477be1d`.
- `OverlayService.java`: preferência de exibição `resultShowDistance` passa a iniciar **ON** somente na ausência de preferência gravada. Um OFF explícito continua preservado. O campo é apenas de apresentação, não força `center_lat/lng` nem `sort:DISTANCE`.
- `dock.html`: exibição de distância começa habilitada e reconhece ausência da chave da configuração antiga; o campo `distance` continua estritamente validado em `resultLines`.
- `api_result_contract.js`: mantém o campo fornecido `distance_km` como metadado do Pokémon sem depender do sort ou geofiltro. Não houve alteração de endpoint ou autenticação.
- Refresh parcial: quando a resposta não fornece distância para um encontro já mostrado, o app só retém km do **mesmo encontro** antes de expirar e com o **mesmo centro de busca**. Mudou o centro, não reaproveita.
- Pokébolas P1 e P2 compartilham esse código e continuam com estados/preferências separados.

## Confirmações no GitHub
- QA na PR #325, head `f4d9a652429a446b0f88912ab97e744783009c8a`: Node QA, regressão completa LT169, Android Core LT211, compilação Java LT62, OTA LT173, visual LT253 e APK privado **success**; os jobs de release dedicados foram **skipped** porque não houve pedido de publicação.
- Testes novos `app/tests/lt-km-independente-ordenacao.test.js`; `app/tests/overlay-ux.test.js` atualizado para declarar somente distância habilitada por padrão, preservando os outros campos opt-in.
- Não há prova de que o provedor inclua `distance_km` em todas as buscas sem coordenadas. Se não fornecer, nenhum km deve ser fabricado; também não revelar coordenadas ou obter localização do dispositivo.
- Não há QA físico Samsung P1/P2 realizado. O build verde não equivale a instalação ou confirmação visual.

## Publicação planejada
- Baseline: LT323 / `0.03.23` / `54529`, último lançamento indicado pelos documentos canônicos e pedido oficial anterior.
- Próxima: LT324 / `0.03.24` / `54530` / label `51328`, mediante o guardião oficial de versão/release e QA.
- Publicar **somente** via `.github/workflows/pokesearch-official-release.yml`, disparado por `release/official-request.json`, mantendo o certificado v2 permanente. Nunca substituir o asset LT323, nunca alegar instalação silenciosa.
- Após o fluxo: verificar status, tag, APK enviado, SHA-256, tamanho, assinatura e atualizar o Guia Mestre com resultados reais.

## Pendências
- Confirmar em aparelho físico a legibilidade de `km`, a preferência `Dist.`, os dois overlays e o comportamento nos modos PC/Nível.
- Confirmar na API remota se consultas globais realmente incluem `distance_km`; essa informação depende da origem, não apenas da UI.

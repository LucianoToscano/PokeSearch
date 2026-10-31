# LT201 — Compatibilidade conservadora com PoGoCoordinates (31/10/2026)

## Evidência e limites
- Leitura pública atual de `https://pogocoordinates.com/` e `/search`: a página pública confirma busca por espécie, IV, PC, nível, tamanho e localização; o conteúdo do filtro em `/search` é carregado por JS e **não fornece JSON de contrato autenticado** na página estática.
- Referência interna: auditoria LT77 de 24/10 sobre o levantamento de API em 14/10; não equivale a especificação oficial assinada pelo fornecedor. Capturas do Samsung LT199/LT200 mostram `API: invalid-request` e `Aguardando portal oficial do seletor Pokémon`, não demonstram campo exato modificado.
- **Não inventar novos endpoints, enums, sal/ID de Shiny, campos de busca, ou relaxar confirmação de filtros.** Nenhuma requisição privada autenticada ao provedor foi feita nesta correção.

## Mudanças aplicadas
- A automação do seletor Pokémon encontra o **único input explicitamente identificado** como busca por nome/forma/dex, mesmo quando o layout mobile elimina o botão de dropdown. Com dois inputs compatíveis, não escolhe arbitrariamente.
- Um `aria-controls` de React que aponta a um popup montado mas **incompatível com a consulta atual** é rejeitado. Fallback apenas para um portal visível e único, com opção compatível; confirmação de espécie/forma continua EXATA e filtros salvos não são apagados.
- A API `400/422` aceita listas de erros estruturadas em `detail`, `detail.errors` ou `errors`. Encaminha apenas o **nome permitido** de um campo de filtro ou uma **contagem limitada** de campos; valores, dados pessoais, mensagens e corpo bruto nunca saem do transporte. `shiny_account` é reconhecido como categoria Shiny/treinador.
- Mantidos login e vínculo Shiny, filtros de localização Coords/Radius, tipagem de `pvp_league`/boolean no modo não-PvP, bloqueio HTTP 429 e intervalos do provedor. Não há retry de 400/422, retirada de filtros por conta própria ou busca incompleta anunciada como exata.
- Preservado isolamento de estado das duas Pokébolas (P1/P2).

## QA
- Executar `node app/tests/pokemon-picker.test.js`, `node app/tests/lt200-api-dom-failures.test.js`, testes HTTP/contrato e toda regressão Node e Android.
- Em Samsung autenticado, comparar P1/P2: 100%, 0%, IV personalizado, GL/UL, espécies+formas (ON/OFF), localização com raio 101 km, e Shiny apenas com treinador vinculado.
- Em erro 400/422, registrar **somente** status HTTP, categoria/contagem de campos e modo, sem conteúdo do POST nem credenciais. Conferir resultado real e separação de respostas anteriores.
- Confirmar comportamento do seletor somente no site oficial (não em listas de clima/gênero) após o React carregar. Se os controles remotos tiverem mudado completamente, não é seguro acertar por heurística: precisa de captura autorizada do DOM atual sem cookies.

**Status da integração remota:** testes sintéticos verificam que não aplica filtros errados. Mudanças exatas do servidor ainda não homologadas por teste de sessão real; a correção é de compatibilidade robusta, não confirmação de restauração de serviço.

## Publicação e assinatura verificadas (31/10/2026)
- [PR #168](https://github.com/LucianoToscano/PokeSearch/pull/168) mesclada; source commit `38ae944b0c8e18cec2aa993ced868907a5ac1113`.
- [Workflow oficial #41226844970](https://github.com/LucianoToscano/PokeSearch/actions/runs/41226844970) SUCCESS: Node, Java/Android Gradle, R8, assinatura original v2 e verificação do hash do asset no release público.
- [Release oficial LT201 (latest)](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.01-54408) — APK 29.260.927 bytes, SHA-256 `5c1686bc4e21b6792f676085eb048114eb0009fcd9e2aa50f0bad614b6b6e6e3`.
- [Google Drive — ZIP assinado com relatórios](https://drive.google.com/file/d/1v3b2pXlMkWITpefNfXYkAnA7pFQoMKeJ/view?usp=drivesdk): 26.921.507 bytes, SHA-256 `0600459467d26f0cb505ef0b3cf18419dbfe575d5250b0914ae925fc1b283454`. ZIP íntegro; APK interno tem o mesmo SHA-256 do release. Assinatura v2 com certificado permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Não homologado em Samsung:** prova de seleção de espécies/formas, API HTTP 400/422 reais e login/treinador Shiny após LT201. A versão pública oferece testes e mensagens melhoradas, mas não confirma alteração específica no provedor nem uma busca remota bem-sucedida.

# LT84 — Integração API direta: correções e QA (25/10/2026)

**Estado:** branch isolada de QA; **NÃO** é release oficial, **NÃO** foi homologada no Samsung nem em sessão real da API. A última versão pública permanece **LT83 0.00.83 / 54286**. Nenhuma ação alterou o manifesto legado do Drive ou a tag oficial.

## Base e identidade

- Base exata `main`: `d864a13f31617d1cc268d7dec0ecef38c97912de`.
- Branch: `fix/lt84-authorized-api-direct-qa-20261025`.
- Versão de compilação QA proposta: **0.00.84 / 54287**, condicionada ao GitHub Actions e verificação do próprio APK.
- Application ID: `com.lucianotoscano.pokesearch`; namespace: `com.lucianotoscano.pokesearchoverlay`.
- API autorizada para uso; autorização **não** inclui publicar automaticamente novo APK.

## Arquitectura existente preservada

O código existente da LT77+ já implementa **WebView oficial → JWT no contexto do site → POST /search → normalização → cartões do overlay**, além de **Get coords por GET /reveal/{reveal_code} sob toque explícito**. Catálogo /forms + /pokemon/catalog usa cache em memória de 300s. Preferência `authorizedApiQaOptIn` permite seleção explícita API/DOM (DOM é default). O código não exporta token/reveal_code para o Java. Permissões e limites do servidor são respeitados. Este ciclo **não recria** fluxos já existentes.

## Correções LT84 efetivamente implementadas

1. `api_browser_transport.js`: estado de backoff por tipo de endpoint após HTTP 429, respeitando Retry-After em segundos (máx. 3600s; fallback conservador de 60s); não tenta repetição automática, não adiciona códigos ou tokens ao retorno.
2. Transport: cancela requisição Search anterior e Reveal pendente quando uma nova pesquisa **válida** substitui a anterior; também cancela ao encerrar a sessão. Invalidar filtros não apaga os dados transitórios do resultado anterior.
3. Reveal: rejeita duplo toque simultâneo para o mesmo cartão com erro controlado `reveal-in-progress`; coordenadas continuam sob demanda, na sessão do site.
4. `api_android_session.js`: evita que a leitura assíncrona de catálogos lance busca antiga após uma pesquisa mais recente; rejeita conclusões de Search atrasadas e não deixa que substituam a identidade ativa.
5. `api_result_contract.js`: desativar localização (`locationEnabled:false`) zera `center_lat`, `center_lng`, `radius_km`, mesmo diante de dados residuais do editor; raio 0/215/1000 e ranges de latitude/longitude têm testes.
6. API do filtro Sexo: corrige `⚥`/Any para `gender:null`; `⚲`/Genderless continua distinto.

## Testes e proteção

- Testes históricos LT77–LT83 preservados; novo `app/tests/lt84-direct-api-regressions.test.js` testa limpeza do geofiltro, radius e limites, gênero, HTTP 429, duplicidade de reveal, token não exportado e buscas supersedidas durante catálogo.
- Workflow isolado `.github/workflows/lt84-direct-api-signed-qa.yml` com suíte Node, compilação Java/Android, release R8, validação aapt, certificado fixo, assinatura v2, SHA-256 e artifact **de QA**. Credenciais são lidas apenas dos GitHub Secrets preexistentes.
- **CI:** verificar execução mais recente antes de registrar PASS. O arquivo não atesta sucesso antecipadamente.
- **API real:** ainda não executada pelo proprietário no Samsung nem atestada com sessão legítima nesta branch.
- **Samsung:** LT83 não homologada fisicamente, LT84 ainda pendente. Testar geofiltro coords 24.9407581,121.1889794 com radius 0/215/1000; limpar; IV 15/15/15 e 0/0/0; GL/UL top 1; Shiny com trainer vinculado; Get coords em spawn não expirado; alternar API/DOM sem misturar cards; verificar notificações, favoritos, sprites e as janelas.

## Problemas ainda não considerados encerrados

- Comparação end-to-end contra os resultados reais da API em conta autorizada; 200 não substitui homologação de filtros.
- Comportamento na instalação Samsung; alertas automáticos da API seguem suspensos até validação física e deduplicação.
- Sem publicação em Releases, sem merge na main, sem alteração do Drive antes de aprovação específica.

## Fonte

Spec fornecida pelo proprietário `pogo.md`, seções 1, 4.1, 5 e 8; arquivos de runtime LT77+ citados acima; estado prévio em `docs/ESTADO_CANONICO_LT83.md`. O Guia Mestre integral não pode ser substituído por saída truncada; registrar o histórico por **append** preservando os bytes existentes.

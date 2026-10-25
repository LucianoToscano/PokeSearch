# LT79 — Sprites, catálogo oficial e atualizações nativas (24/10/2026)

Branch QA: `fix/lt79-sprites-catalog-updates-qa-20261024` derivada da LT77 QA R4 (`ded06c4a...`). Branch `main` e distribuição pública LT76 preservadas.

## Diagnóstico fundamentado
- Sprites: `api_result_contract.js/spriteData` retornava sempre string vazia, portanto todo cartão da API tinha `image:""` e o `dock.html` desenhava fallback circular.
- Pikachu: no modo API QA, `OverlayService.requestPokemonSuggestions` ainda recorria à leitura do seletor React pelo `probe.js`. As tentativas aguardavam um listbox não encontrado e terminavam em timeout; o catálogo já existia no módulo `api_catalog_cache.js`, mas não no menu.
- Atualizações: `UpdateCenter.java` consulta Google Drive, mas usa navegador externo e não confere o APK antes de abrir o link; não tinha GitHub Releases nem verificação periódica em segundo plano.

## Mudanças preparadas na branch
- `api_result_contract.js`: imagem da espécie base sem fantasia/forma especial usa caminho comunitário PokeAPI já empregado por `PokemonPicker.java`. Para formas, trajes e sprites não comprovados, não atribuir arte incorreta; conservar fallback visual.
- `api_android_session.js`, `AuthorizedApiCollector.java`, `OverlayService.java`: menu Pokémon da API QA obtém sugestões de catálogo `GET /forms` e `GET /pokemon/catalog?costumes=true` via sessão oficial da WebView. Seleções por nomes exatos; operações sem exportar JWT ou reveal_code. A escolha DOM continua isolada. A sincronização dos filtros restantes permanece.
- `dock.html`: feedback identifica catálogo API sem fingir que a seleção no DOM foi confirmada; os chips continuam locais até submissão.
- `OverlayService.java`: instruções de gesto uma única vez por instalação, preservando SharedPreferences. Pokébola: toque resultados, segurar ~600ms menu. Atualizar: toque pesquisa, segurar ~600ms intervalo.
- `GitHubUpdateCenter.java`, `MainActivity.java`, AndroidManifest, `update_file_paths.xml`: WorkManager a cada ~30 min (sujeito a Doze), canal nativo independente, somente Releases oficiais estáveis; comparação por versionCode, download sem navegador, progresso/cancelamento, SHA-256 GitHub Release, certificado APK pinado, pacote/versionCode conferidos, instalação com confirmação Android via FileProvider. `POST_NOTIFICATIONS` continua sujeito a permissão do usuário. Falhas negam instalação; versão ignorada respeitada. Não há acesso a tokens GitHub do usuário.
- `UpdateCenter.java` do Drive continua intacto como fonte alternativa anterior; seu fluxo de download pelo navegador ainda NÃO equivale a fallback interno verificado.
- `.github/workflows/lt79-samsung-qa-protected.yml`: QA assinado versionCode 54281, versão 0.00.78, sem publicação automática.
- `.github/workflows/pokesearch-official-release-manual.yml`: somente `workflow_dispatch`, ator proprietário e environment `official-updates`; exige configurar aprovação obrigatória de revisores no GitHub Settings antes de usar. Jamais dispara por push/merge. Confere SHA, pacote, versão, assinatura e só então publica o APK aprovado.

## Segurança e limitações
O código-fonte do repositório é público; esconder URLs na interface não é sigilo da infraestrutura. APK protegido por R8 e assinatura não torna o código público secreto. Nunca armazenar JWT, reveal_code, keystore ou segredos em fontes, logs ou manifesto remoto. O aplicativo não pode instalar APK silenciosamente.
A listagem do GitHub Releases estava vazia ao iniciar LT79; a versão atualmente instalada LT76 não possui esse novo cliente, logo ela não poderá descobrir Releases pelo mecanismo novo até instalar uma versão que já o contenha.
Não homologar funcionalidade real sem teste físico no Samsung. As URLs PokeAPI são comunitárias e não foram validadas para cada Pokémon/forma; visuais especiais permanecem pendentes.
O manifesto de integridade utilizado é o objeto de Release HTTPS da API oficial do GitHub com atributo `digest:sha256:`; integridade/autenticidade finais independem exclusivamente desse campo graças à assinatura do APK pinada no aplicativo. Não há assinatura criptográfica independente de manifesto nesta etapa.

## Testes e checklist
- [ ] CI Gradle release signed: confirmar run e APK da branch LT79.
- [ ] Confirmar ícone do Pikachu e forma oficial em smartphone conectado.
- [ ] Confirmar sprite base e Shiny com imagem válida; variantes desconhecidas têm fallback.
- [ ] Confirmar GL, UL, IV, filtros PC/nível/sexo/clima/raio, resultados consecutivos e Get coords.
- [ ] Confirmar que mesmo resultado não mistura DOM/API; timeout real mostra erro.
- [ ] Confirmar long press Pokébola/refresh, aviso único, arraste, temas, menu compacto e persistência.
- [ ] Confirmar download in-app após publicar Release aprovado, com hash inválido bloqueado e instalação normal Android.
- [ ] Confirmar alerta no background com notificações permitidas, WorkManager/Doze e alertas antigos sem regressão.
- [ ] Confirmar upgrade sobre a versão assinada anterior, sem perdas.

**Entrega ainda não homologada:** a versão de QA não altera o manifesto público `atualizacao.json`; só após confirmação física e autorização final poderá existir GitHub Release oficial. A versão LT76 publicada continua a fonte instalada para usuários finais.

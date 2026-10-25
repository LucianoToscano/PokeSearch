# CONTINUAR POKESEARCH — CHECKPOINT LT84 API DIRETA QA (25/10/2026)

Atue como Engenheiro Android Sênior do projeto `LucianoToscano/PokeSearch` e continue do HEAD real do GitHub, sem recomeçar, refazer tarefas já concluídas ou pedir "continue". A autorização para usar a API já foi confirmada e **não deve ser solicitada novamente**. Isso não autoriza publicação pública. Preserve o Guia Mestre integral, não misture PvPPokeGo.

## Identidade fixa
- Repositório: `LucianoToscano/PokeSearch`.
- Application ID: `com.lucianotoscano.pokesearch`.
- Namespace: `com.lucianotoscano.pokesearchoverlay`.
- Android overlay + WebView + evaluateJavascript + probe.js, Java 17, Gradle 8.11.1, compileSdk 36, targetSdk 33, minSdk 26.
- Sem backend, proxy, GPS físico. Máximo 10 resultados, respeitar limites da conta e termos do serviço.
- JWT/reveal_code restritos à sessão oficial do site; sem logs, código-fonte, Java bridge ou persistência.
- Site `https://pogocoordinates.com`; API `https://coordinates-api.pokemongopro.com`; spec `pogo.md` fornecido na conversa anterior.

## Estado confirmado
- Última versão **pública**: LT83 `0.00.83` / code `54286`, [GitHub Release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.83-54286), APK SHA256 `451e4781581122908f014a893f693c8312b36b2c222a8579c499c6c3e2975c1c`, SOURCE_COMMIT `5cf9adb62efb97a185ec955cab6eb0f49fbb4e88`.
- `main` base LT84 originalmente `d864a13f31617d1cc268d7dec0ecef38c97912de`. Consulte SHA real antes de qualquer mudança.
- LT84 somente **QA**, branch `fix/lt84-authorized-api-direct-qa-20261025`, [PR #59 Draft](https://github.com/LucianoToscano/PokeSearch/pull/59). Não mesclar até revisão.
- Build QA `0.00.84` / `54287`: [Actions #40163046534 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40163046534). SOURCE_COMMIT do APK `9796152446d41712464bc309e8ad3bbaafd56c05`; artifact `PokeSearch-v0.00.84-LT-API-QA-protected-release` ID `12586524480` (dentro do ZIP APK, SHA256SUMS, signing report, package report). R8, não depurável, assinatura permanente SHA256 certificado `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. NÃO inferir SHA do APK a partir do SHA do ZIP.
- Live anônimo: [Actions #40163231365 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40163231365) health, forms, catálogo e POST /search 15/15/15; não atesta login/reveal/Shiny autenticados.
- Guia Mestre **apendicado sem truncamento**, [Actions #40163154255 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40163154255).
- Documentos: `docs/ESTADO_CANONICO_LT84_QA.md`, `docs/LT84_API_DIRECT_QA.md`, README.md, `docs/GUIA_MESTRE.md`. Referência histórica LT83 no docs/ESTADO_CANONICO_LT83.md.
- Última tag pública permanece LT83, manifesto Google Drive legado permanece LT79.

## Alterações LT84 já implementadas (não repetir)
- `api_browser_transport.js`: HTTP 429 / Retry-After com backoff separado por Search e Reveal; abort de fetch superseded; deduplicação de pedidos Reveal; cancelamento ao dispose.
- `api_android_session.js`: impede corrida de busca antiga após leitura atrasada dos catálogos.
- `api_result_contract.js`: limpar geofiltro zera center_lat/center_lng/radius_km; Any ⚥ distinto de Genderless ⚲.
- `app/tests/lt84-direct-api-regressions.test.js`: regressões específicas PASS, além da suíte histórica.
- `authorizedApiQaOptIn` segue opção explícita na Home > Configurações (DOM por padrão); ↻ atualiza com a fonte escolhida. Não misturar fontes.
- API integra endpoints já existentes de busca, catálogo e reveal sob demanda, preservando o layout atual.

## Trabalho PRIORITÁRIO não concluído
1. **Homologação Samsung física LT84**: instalar QA do artifact, confirmar versão 0.00.84/54287 e cert SHA; testar popup Localização sem clipping/encolhimento.
2. Aplicar `24.9407581,121.1889794` em raio `0/215/1000`, limpar coordenadas e raio, verificar que API efetiva responde conforme filtros e que não há valores residuais, também no modo DOM.
3. Testar sessão Google legítima, `GET /users/me` e treinador ativo; Shiny, backgrounds e erros 403 sem treinador; sem extrair JWT para Java.
4. Testar Get coords real: POST /search resulta código opaco só dentro da WebView; toque em Pokémon e GET /reveal/{code}; identificar mesmo encontro; testar expiração, duplo toque e 429.
5. Verificar GL/UL Top1, IV 0/0/0 e 15/15/15, IV %, formas/costumes, clima/boost, tamanho/sexo, distância e limites conta. Não ignorar filtros silenciosamente.
6. Testar sprites, favoritos 10x5 até 50, sons, alertas, atualização ↻, editor e modo DOM; alertas de API continuam suspensos até homologação.
7. Se forem encontrados defeitos reais, consertar na branch com regressões antes de preparar nova versão (versionCode monotônico >54287) e registrar Guia Mestre via append. **Nunca publicar atualização oficial sem consentimento específico**.

Não alegar conclusão técnica do fluxo autenticado ou homologação Samsung com base apenas em CI. O objetivo é finalizar a API direta de ponta a ponta mantendo todas as funções.

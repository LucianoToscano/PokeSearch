# PokeSearch — Auditoria consolidada LT76 → LT77
**Data de referência:** 24/10/2026 (America/Fortaleza)
**Finalidade:** transferência do checkpoint para revisão independente, com evidências, código-fonte verificável, limitações e roteiro de homologação.
**Fonte primária:** GitHub \`LucianoToscano/PokeSearch\`, branch \`feature/lt77-authorized-api-contract-20261024\`. A documentação histórica única do projeto permanece em \`docs/GUIA_MESTRE.md\`.
**Classificação:** revisão remota e contratos de teste; **não** é laudo de homologação física nem comprovação de uso real da API.

## 1. Identidade e limites invioláveis
- App: PokeSearch; \`applicationId=com.lucianotoscano.pokesearch\`, \`namespace=com.lucianotoscano.pokesearchoverlay\`.
- Arquitetura publicada: Android Overlay + WebView oficial + \`evaluateJavascript\` + \`probe.js\`, com pesquisa do site \`https://pogocoordinates.com/search\`, máximo de dez resultados, sem backend/proxy ou GPS físico.
- Publicação vigente: LT76, \`PokeSearch-v0.00.76-LT.apk\`, \`versionCode=54276\`; assinatura release e R8 validados pelo CI de publicação LT76. **Não compilar, substituir ou publicar LT77 com base apenas neste relatório.**
- A branch de implementação da API é experimental e isolada. \`main\` continua em \`caea98b7b57b9e45d5218e907eb392d76953dd53\`; PR #34 e PR #49 seguem \`open\`/\`draft\`/\`unmerged\` na última verificação.
- Não alterar assinatura, Application ID, distribuição Drive, manifesto público de LT76, código de \`main\` ou preferências atuais sem uma etapa própria e autorizada.
- **Aviso de visibilidade:** o GitHub reportou o repositório como público, apesar de referências anteriores a repositório privado. Antes de adicionar quaisquer credenciais ou conteúdo comercial, rever essa configuração administrativamente.

## 2. Release LT76 — evidências preservadas
- Release CI: [GitHub Actions #40125870288](https://github.com/LucianoToscano/PokeSearch/actions/runs/40125870288), concluído com \`SUCCESS\`.
- APK publicado: [PokeSearch-v0.00.76-LT.apk no Google Drive](https://drive.google.com/file/d/1RS1NbEhzfzzAz3eD87BVbAZYnjn9nl-l/view).
- Manifesto vigente: [atualizacao.json](https://drive.google.com/file/d/15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf/view) com \`enabled=true\`, \`versionName=0.00.76\`, \`versionCode=54276\`, \`forceUpdate=false\`, APK ID \`1RS1NbEhzfzzAz3eD87BVbAZYnjn9nl-l\`.
- SHA-256 do APK recalculado na auditoria anterior: \`889e7193b9f2fd87a1a96b2bfb6d3842c3630215e52a93287c6428d50fb7940c\`; fingerprint do certificado: \`34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e\`.
- Fonte do APK: \`6916be5b2d0e13ddcb94f38baa993980cebad854\`. **Não confundir commits documentais posteriores com fonte do APK.**
- **Homologação Samsung LT76:** permanece PENDENTE na documentação de auditoria. O CI não substitui prova visual/funcional em dispositivo.

## 3. Evidências encaminhadas — diferenciar observado de suposto
### 3.1 Pesquisa direta \`POST /search\`
Capturas de inspeção de rede mostram \`https://coordinates-api.pokemongopro.com/search\`, chamada POST e resposta HTTP 200 com JSON contendo \`results\`. A resposta observada exibe \`encounter_id\`, \`pokemon_id\`, \`pokemon_name\`, \`form\`, \`costume_id\`, \`cp\`, \`level\`, \`location\`, \`raw_iv\`, \`iv_percent\`, \`gender\`, \`size\`, \`weather_boosted\`, \`weather_id\`, \`fast_move\`, \`charge_move\`, \`despawn_at\`, \`despawn_verified\`, \`reveal_code\`, \`distance_km\`, \`pvp\`, \`shiny\` e \`background\`. O exemplo não é um contrato de API oficial nem prova de cobertura de todos os detalhes do UI.

No corpo da requisição capturado aparecem campos como \`shiny_only\`, \`pvp_mode\`, \`pvp_league\`, \`pvp_top_rank\`, \`pvp_include_pre_evolutions\`, \`pokemon_ids\`, \`species_forms\`, \`cp_min/max\`, \`level_min/max\`, \`iv_mode\`, \`iv_percent_min/max\`, \`raw_iv_atk/def/sta\`, \`sizes\`, \`forms\`, \`gender\`, \`boosted\`, \`weather_id\`, \`min_ttl\`, \`sort\`, \`center_lat\`, \`center_lng\`, \`radius_km\` e listas de exclusão. Outros recursos capturados: \`/users/me\`, \`/pokemon/catalog?costumes=true\`, \`/backgrounds\`, \`/forms\`, \`/filters\`. Os prints não comprovam estabilidade de schema, autorização independente ou campos obrigatórios.

### 3.2 Sessão \`jwt\`
Outras capturas identificam uma chave chamada \`jwt\` no \`localStorage\` de \`https://pogocoordinates.com\`. O proprietário informou explicitamente possuir autorização de uso da API. **Não foi comprovado** o escopo formal dessa autorização, o ciclo completo de autenticação ou a política de armazenamento do provedor. O caminho \`/auth/google/callback\` citado por terceiros não prova que tokens sejam retirados diretamente da URL. Nenhum valor de token deve ser copiado deste relatório, capturas ou logs.

### 3.3 Revelação de coordenadas \`/reveal/{code}\`
Mensagem adicional fornece URL de exemplo \`https://coordinates-api.pokemongopro.com/reveal/reveal_code_aqui\` e alega ser possível obter coordenadas sem Bearer. **Não há captura de uma resposta HTTP real da rota**; método GET, necessidade de autenticação, permissões CORS, códigos de status e esquema de campos de latitude/longitude permanecem hipóteses de implementação.

### 3.4 Cuidados de segurança na auditoria
- Tratar \`jwt\` e \`reveal_code\` como dados sensíveis; não publicar screenshots com valores, não capturar token de callback, não colocar cabeçalho Bearer em logs nem em arquivos versionados.
- O usuário deve manter controle da sessão e o serviço deve autorizar o tipo de acesso e cadência; tratar \`401\`, \`403\` e \`429\` sem burla de políticas.
- Não registrar \`reveal_code\` real, mesmo que o exemplo venha acompanhado do restante de \`results\`.

## 4. O que mudou na LT77 (código rastreável)
**Base da branch:** \`5be159030570cbc4f614d486649caa66d06e0a28\` (checkpoint documental LT76).

| Arquivo | Objetivo | Situação |
|---|---|---|
| \`app/src/main/assets/api_result_contract.js\` | Mapeamento conservador de filtros e JSON → cartões, rejeição de IV inconsistente, 10 resultados | Protótipo isolado |
| \`app/src/main/assets/api_reveal_contract.js\` | Construção hipotética da rota de revelação e validação de pares lat/lng | Protótipo isolado |
| \`app/src/main/assets/api_browser_transport.js\` | Transportador JS de execução sob demanda na origem do site; pesquisa e reveal; tratamento de limites | Protótipo isolado |
| \`app/tests/lt77-api-contract.test.js\` | 12 testes de pesquisa | QA concluído |
| \`app/tests/lt77-api-reveal.test.js\` | 12 testes de coordenadas | QA concluído |
| \`app/tests/lt77-api-browser-transport.test.js\` | 14 testes de transporte, origem, geração, autenticação, erros e sigilo | QA concluído |
| \`.github/workflows/lt77-authorized-api-contract-qa.yml\` | Node 22 e mocks locais; sem Gradle, sem APK ou chamadas reais | QA concluído |
| \`docs/GUIA_MESTRE.md\` | Registro histórico cumulativo, sem remoção | Atualizado |

O \`probe.js\` e \`OverlayService.java\` da LT76 **não foram modificados** nessa linha experimental; a pesquisa publicada ainda preenche filtros no site e coleta cartões pelo DOM. O novo módulo de transporte **não está importado/ativado** pelo aplicativo Android.

### 4.1 Transporte: decisões testadas
- \`search(config)\`: origem do site verificada por HTTPS e host exato; seleciona filtros conhecidos; obtém JWT apenas no contexto do navegador e envia Bearer ao host específico da API; dados retornados ao código consumidor são normalizados e não contêm tokens nem códigos de revelação.
- Request com \`mode=cors\`, \`credentials=omit\`, \`redirect=error\`, \`cache=no-store\`, \`referrerPolicy=no-referrer\`, timeout da pesquisa de 10 segundos e proteção nominal de até 1 MiB.
- \`reveal(...)\`: acesso explícito vinculado à geração atual, índice do resultado, \`pokemon_id\`, PC e despawn; código mantido apenas temporariamente em memória; supõe GET sem Bearer, **sem afirmar funcionamento real**; timeout nominal de 6 segundos.
- Rejeição sem retry automático de \`401\` (login), \`403\` (acesso negado) e \`429\` (limite atingido), além de falhas CORS/rede, respostas inválidas e códigos expirados.
- A busca normalizada sinaliza \`criteriaConfirmed=false\`, \`resultChanged=false\`, \`leagueConfirmed=false\` e \`requiresIntegrationValidation=true\`, impedindo que mocks sejam apresentados como pesquisa real confirmada.
- **Itens de revisão futura:** checagem de tamanho da resposta por caracteres JS não garante máximo de bytes UTF-8; validar \`Content-Type\`, backoff apenas autorizado, isolamento de tempo limite após ciclo de vida, consultas simultâneas e rate limits reais. Antes de conectar ao Android, revisar riscos de token em scripts da mesma origem e de códigos de revelação na URL remota (não necessariamente nos logs locais).

## 5. Histórico de builds e testes LT77
| ID do workflow | Evidência | Resultado |
|---|---|---|
| [40132327045](https://github.com/LucianoToscano/PokeSearch/actions/runs/40132327045) | Contrato JSON de busca 12/12 | SUCCESS |
| [40132916646](https://github.com/LucianoToscano/PokeSearch/actions/runs/40132916646) | JSON + coordenadas 24/24 | SUCCESS |
| [40133471790](https://github.com/LucianoToscano/PokeSearch/actions/runs/40133471790) | Falha sintática em função assíncrona no mock JS | FAILURE, corrigido |
| [40133524298](https://github.com/LucianoToscano/PokeSearch/actions/runs/40133524298) | 12/12 pesquisa + 12/12 reveal + 14/14 transporte = **38/38** | SUCCESS |

**Fonte dos testes 38/38:** commit \`81553a7b62d7109675f3059cab3db3816f06de75\`. Uma validação posterior confirmou que as mudanças entre o commit de teste e o último checkpoint foram exclusivamente no Guia Mestre. Não houve APK nem requisições reais à API nessa bateria. Não reutilizar o erro anterior "40/40": o número correto é **38/38**.

## 6. Sequência de commits e rastreabilidade
- \`5be1590\`: checkpoint documental da investigação da API na LT76 e criação posterior de branch isolada.
- \`3331cc5\`: contrato de resultados/payload API.
- \`6a88413\`: testes JSON iniciais.
- \`339f924\`: workflow QA Node-only; run 12/12.
- \`7eacb7e\`: contrato reveal de coordenadas.
- \`696afc5\`: testes reveal.
- \`445fc95\`: workflow inclui reveal; run 24/24.
- \`ae0bc9b\`: Guia Mestre registrou contrato reveal.
- \`4214b1d\`: transporte no navegador.
- \`8166695\`: testes do transporte.
- \`c1537d9\`: workflow de transporte, falha sintática inicial.
- \`81553a7\`: correção do mock, run 38/38.
- \`c713690\`: checkpoint documental LT77 (total 38/38 corrigido).
- Commits documentais posteriores devem ser consultados pela branch; jamais confundir HEAD documental com código testado/release LT76.

## 7. Matriz de critérios de aceitação pendentes
| Área | Validação requerida | Estado |
|---|---|---|
| Sessão | Login/refresh/logout, isolamento, expiração de JWT na WebView Samsung, sem exibição de token | PENDENTE |
| API de pesquisa | CORS real, POST 200 e 401/403/429, limite de chamadas, JSON e atualização de filtros sem duplicidade | PENDENTE |
| Dados Pokémon | Espécie, traje, forma, sprite confiável, IV, GL/UL, Shiny, localização, despawn e máximo de dez | PENDENTE |
| Coordenadas | GET/rota/método e schema reais, resposta sanitizada, expiração, correlação exata com cartão, sem token se permitido | PENDENTE |
| Fallback | Alternância segura DOM/API, sem cartões obsoletos ou alertas repetidos | PENDENTE |
| UX LT76 | Modos/Filtros, \`[1000]km\`, Favoritos 10x5, notificações, Pokébola e arraste, Editor Visual | PENDENTE |
| Distribuição | APK LT77 release assinado, R8, upgrade preservando dados, Drive e manifesto | NÃO INICIADA |
| Homologação física | Evidências registradas de testes em Samsung, não somente CI | PENDENTE |

## 8. Instruções de auditoria do pacote
O pacote ZIP de auditoria deve conter:
1. **\`docs/GUIA_MESTRE.md\` integral**, sem cortes (histórico completo mais novos registros).
2. Este relatório consolidado em \`docs/auditoria/LT77_AUDITORIA_CONSOLIDADA_20261024.md\`.
3. Os três arquivos de contrato/transporte, três arquivos de testes e o workflow de QA.
4. \`MANIFESTO_SHA256.txt\` gerado automaticamente com hash de cada item e \`ORIGEM_GIT.txt\` com SHA exato do commit de exportação.
Os hashes do pacote são evidência de integridade dos arquivos exportados, não garantia de homologação física, compatibilidade com a API nem autorização detalhada. **Não embutir screenshots de tokens nem arquivos com credenciais.**

## 9. Conclusão da auditoria
**CONFIRMADO:** LT76 release publicada e verificada remotamente, projetos/PRs preservados; LT77 prototipada de modo isolado com 38/38 testes Node aprovados; contratos de JSON, coordenadas e transporte incluídos; documentação histórica mantida.

**NÃO CONFIRMADO:** uso real autenticado da API na WebView do Samsung, GET reveal sem JWT, response schema de coordenadas, filtros completos/rate limits reais, homologação física ou APK LT77. Não declarar a migração do scraper DOM para API como concluída.

**Próxima decisão técnica:** validar integração ao vivo somente em ambiente autorizado de teste, com prova sanitizada e desligada por padrão; após isso, planejar ativação progressiva e homologação separada.

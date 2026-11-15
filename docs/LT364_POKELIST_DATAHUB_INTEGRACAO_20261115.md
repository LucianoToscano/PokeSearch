# PokeSearch LT364 — Integração funcional autorizada PokeList + Data Hub

## Contexto e fonte

O proprietário do PokeSearch **já declarou autorização** para uso de APIs/APKs enviados. Não solicitar a mesma confirmação novamente. A base oficial antes deste trabalho era LT363 `0.03.59`, versionCode `54566`, label `51363`, última `main` `8a8f41f3e251234e167e35bd9feba7830bf806ce`; [release estável LT363](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.59-54566), digest `c12cf70f864d6dd3ef6e03d8bd00cc1b5b65418174802582c47b6a6c151b1279`.

**Fontes reabertas diretamente na sessão LT364:**
- `API_PokeList_spec.md`, análise estática do pacote `com.antvn.pokelist`, versão 1.3.18.
- `PokeList_API_Audit_Completa.zip`, documentos `01_API_v2_Parametros.md`, `03_Exemplos_Requisicoes.md` e resumo; o documento afirma `iv_type=0` para percentual total IV e `rockets=` para Rocket.
- `PokeList_Recriacao_Completa.zip`, `00_LEIA-ME.md` deixa explícito que **o projeto de recriação não foi compilado**, não sendo possível tratá-lo como SDK pronto.
- `data-hub-2.5.3 ... .apk`, ZIP estático com `assets/pokemons.json` **1.025 espécies, 1.440 formas** (incluindo 968 entradas nomeadas Normal), `assets/raidRatings.json` **20** categorias e `assets/maxBattleRatings.json` **9**; os nomes/IDs e contagens resultam de inspeção do próprio arquivo, não previsão de API.

Não foi executado APK, injetor nem código decompilado. A tentativa de verificar `https://moonani.com/PokeList/version.json` pelo navegador disponível não retornou dados (acesso externo indisponível); disponibilidade e semântica de produção ainda exigem teste online. **Não confundir integração de cliente HTTP com backend ao vivo homologado**.

## Funcionalidades concretas no código LT364

1. **Raids, Quests e Rocket**: os três atalhos existentes da Home deixaram de ser toasts `em desenvolvimento` e abrem `PokeListRadarActivity` já na categoria apropriada. Preservados ordem, ícones, fileira única, dimensões, Pokébolas, Doce Raro, Edu e Hover. O atalho `Weather` ainda não tem provedor confirmado e continua a prévia honesta.
2. **Radar manual PokeList**: cinco categorias `pokemon`, `raid`, `quest`, `rocket` e `rocket_leader`. Usuário informa **latitude/longitude**, raio no padrão do provedor (unidade de `distance` não homologada), IDs de espécies ou Rockets e mínimo de IV (somente Pokémon). Requisição somente no botão `Buscar agora`, com URL de origem fixa TLS `moonani.com/PokeList/api.v2.php`, sem autenticação de contas PokeSearch, sem GPS automático e sem teleporte. Exibe até 80 registros validados, descrição, IV, nível, PC, forma, validade, coordenadas e botão **copiar coordenadas** sob demanda, sem executar gesto. Rocket usa `rockets=`, outros usam `mons=`.
3. **Rede defensiva**: conexão e leitura com timeout 10 s, sem redirecionar, resposta máxima 512 KB, deduplicação por ID, no máximo 500 itens examinados por clique, descarte de itens expirados, sanitização de texto, timestamps em segundos/milissegundos somente em faixas plausíveis, falha segura em JSON inválido. Ações manuais limitadas a 1 consulta por 15 s, `429`/`503` respeitam `Retry-After` numérico limitado e demais falhas são exibidas. Não há background polling e nenhuma permissão nova.
4. **Power Spots / Max Battles**: o atalho agora abre `DataHubCatalogActivity`, com abas Pokédex/Formas, Reides e Max Battles. O próprio PokeSearch já embute `pokemon_catalog.json` com **1.025 espécies** como fallback básico; o catálogo completo de **1.440 formas** e as classificações 20+9 são carregados a partir do APK Data Hub instalado, lendo **somente assets do seu APK**, sem executar código ou acessar dados privados. Se o Android não permitir abrir o APK instalado, o usuário pode escolher **o APK Data Hub que possui** via seletor nativo `ACTION_OPEN_DOCUMENT`. Três JSONs são validados e guardados em diretório privado para uso **offline posterior**; o arquivo APK temporário é apagado. O Power Spots mostra **categorias Max Battles**, não pontos ativos no mapa ou espécies atuais.
5. **Testes**: `PokeListApiPolicyTest.java` (origem TLS, tipos, proteção contra injeção em IDs/coordenadas, IV, URL Rocket, backoff, Unix seconds/ms, sanitização) e `lt364-pokelist-datahub-contract.test.js` (ligação Home, manifest export=false, políticas de HTTP, dados offline, ausência de GPS automático/root/gestos). Compilação Java política pura incluída em QA LT211.

## Limites e segurança

- **Não há promessa de disponibilidade PokeList**: podem ocorrer 401/403, JSON alterado, falha DNS, manutenção ou limite 429. Sem confirmação de rede real nesta sessão.
- **Nenhuma leitura de localização do aparelho** nem permissão `ACCESS_FINE_LOCATION`; o usuário digita centro e envia ao provedor ao tocar Buscar. Não gravar localização nem credenciais. O usuário decide copiar as coordenadas.
- `startTime`/`endTime` variam conforme documentação; somente segundos/milissegundos plausíveis são convertidos; sem campo válido o resultado é mostrado como validade não informada, não como ativo comprovado.
- Nenhum dado do Data Hub é classificado como imagem de miniatura PGSharp/Pokemod. `pgs-native/manifest.json` continua `entries: []`; nenhum modelo visual de feed criado a partir de sprites da Pokédex. Nenhum injetor, root, WebSocket, FakeGPS, automatismo de alerta de conta ou `Sou passageiro`.
- O sistema Android pode bloquear leitura de `ApplicationInfo.sourceDir` de outro pacote. **O seletor de APK é fallback obrigatório e funcional**; o app não possui permissões de armazenamento amplas. Se não houver arquivo/instalação Data Hub, a tela permanece útil com a Pokédex nativa existente.
- 20+9 categorias Data Hub são **definições**, não disponibilidade de Raid/Power Spot. Funcionalidades de agenda e matching exigem dados atuais verificados.
- **Físico pendente:** teste Samsung Android 11/13/14, importação por APK instalado e seletor, 1/5/10 espécies, Rocket/Quest/Raids online, 429/DND, TalkBack, rolagem e contraste P/M/G. Esses testes não podem ser feitos remotamente só pela CI.

## ARK
**IMPLEMENTADO EM BRANCH:** `feat/lt364-pokelist-datahub-live`, sujeito a sete gates e merge. **Não declarar como publicado até release permanente e SHA público**; o relatório precisa ser atualizado com PRs/commit/workflow reais após cada verificação. Persistir prompt LT365 e atualizações de AGENTS/GUIA com estados COMPROVADO, IMPLEMENTADO, CI, PUBLICADO, BLOQUEADO.

## Continuidades LT365
Quando a API ao vivo e o catálogo estiverem testados, acrescentar filtros por forma/gênero/IV por atributo/nível, perfis locais separados das Pokébolas, alertas opt-in baseados em resultados com expiração, histórico offline com TTL, import/export JSON sancionado, planejamento manual de Raid/Max Battle e provedor explícito de Power Spots/Weather quando disponível. Não confundir integrações de feed com modelos de visão computacional ou prometer teleporte seguro.

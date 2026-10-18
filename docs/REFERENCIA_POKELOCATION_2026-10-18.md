# PokeSearch — Auditoria de referência: PokéLocation Android v1.2 + servidor v1.1
**Data:** 18/10/2026 · **Estado:** DOCUMENTAÇÃO / PROPOSTAS PENDENTES · **Alteração no código do PokeSearch:** NENHUMA

> Esta referência não substitui `docs/ARQUIVO_MESTRE_v0.51.md`. Nenhuma etapa abaixo autoriza alterar a UI, ícones, fontes de dados, autenticação, permissões, backend ou APK do PokeSearch sem confirmação expressa do proprietário. Não misturar com PvPPokeGo.

## 1. Fontes, versão e material arquivado
- Perfil: https://github.com/ayranoliveira1 (perfil público, dezenas de projetos; escopo da auditoria aprofundada restrito aos dois repositórios abaixo).
- Android: https://github.com/ayranoliveira1/pokelocation (Java/Android, **AGPL-3.0-only**; código de referência observado na branch main e commit indicado abaixo).
- Servidor: https://github.com/ayranoliveira1/pokelocation-server (Go/PostgreSQL/Redis, **MIT**).
- APK original fornecido pelo proprietário e arquivado no Google Drive em `Projetos/PokeSearch/05_Referencias_Externas/PokeLocation/pokelocation-v1.2-release.apk`: https://drive.google.com/file/d/1uSuww0uFIqQRyGnpYXRwJqnDsqdm76Kx/view
- APK: **2.555.264 bytes**; SHA-256 **d4aba3d0a813c114a0f45a9718fdaf506198d9156655c970d18cbd2e036ac5a3**; Git blob SHA-1 **de61a7b518cea960d65a452a72cb4b81cf4a993f**.
- Arquivo `apks/pokelocation-v1.2-release.apk` apontado na árvore pública do repositório Android, no commit `4888340cc18f1d840f73d999bf061f3ae2883caf`: blob Git SHA-1 `46ebca5c3f355b38fd4da56f0a26222fd1c749bb`, também 2.555.264 bytes. **Hashes diferentes**: não presumir que sejam binários idênticos; é necessário obter o segundo APK e comparar assinatura/recursos/DEX antes de concluir o motivo.
- APK inspecionado estaticamente: `com.pokelocation.app`; versão `1.2.0`/versionCode `3`; minSdk 24, targetSdk 36, compileSdk 36; cerca de 2,5 MB; 2 DEX; recursos e arquivos ZIP. A presença de código/recursos **não prova execução funcional**.
- Referência de versão Android investigada: árvore do commit `4888340cc18f1d840f73d999bf061f3ae2883caf` + inspeção do arquivo anexado. As árvores `main` de 18/10/2026 podem divergir; revalidar SHA antes de transplantar qualquer análise.
- Servidor `main`: árvore `a286f5620240cd5957c3bf7f64c65489611ed3a2` observada na pesquisa. Não foi implantado, nem realizado teste de carga/pen-test.
- A versão de desenvolvimento PokeSearch encontrada em `main` tem mestres até `v0.51`; preservar versões anteriores. O README ainda pode citar `v0.50`, portanto conferir fonte/código/build e não supor versão executável a partir de título.

## 2. O que o aplicativo Android faz e o que interessa
Módulos encontrados/descritos no README: GPS simulado, joystick, rotas, GPX/KML, favoritos e marcadores, camadas/mapas, cooldown, deep links/intents, login social, amigos/chat, PoGoCoordinates, filtros Pokémon, shiny, alertas e bolhas em overlay. **Não incorporar** ao PokeSearch GPS falso, joystick, chat, rastreamento de terceiros, clonador de APK ou permissões privilegiadas: fogem do produto, ampliam risco e consumo.

### Cliente PoGo (fontes)
- `app/src/main/java/com/pokelocation/app/pogo/Pogo.java`: rotas de lookup/search/reveal/login, erro tipado, limites de timeout, serialização, cache do catálogo com ETag, parse de Pokémon, política de 429 e enriquecimento de resultados.
- `PogoFilter.java` + `PogoFilterForm.java`: espécies/formas, IV min/máx, CP, level, gender, sizes, weather boosted, PvP/GL/UL/top rank/pré-evoluções, shiny/treinador, background, sort, presets, quantidade de resultados e distância.
- `PogoPanel.java`, `PogoBubbles.java`, `PogoIcons.java`, `PogoText.java`, `PogoFilterSheet.java`: UI/overlay, apresentação, cache, refresh, timeout/retry, sprite, feedback e ciclo de vida.
- `PogoActivity.java` + `PogoDiscordActivity.java`: retorno Google via navegador/App Links e Discord via WebView, estado da sessão e falhas.
- `PogoAlertsActivity.java`, `PogoAlert.java`: regras e histórico de notificações.

**Contrato observado:** no cliente Android, `/lookup` envia um objeto aninhado `filters` com `iv_min` / `iv_max`; `/search` é corpo não aninhado com `iv_percent_min`, `iv_percent_max` e `iv_mode:"percent"`. É o **contrato do proxy privado do PokéLocation**, NÃO comprovação de que o PoGoCoordinates público aceita os mesmos endpoints/campos. Evitar copiar cegamente os parâmetros para o PokeSearch.

**Valores concretos encontrados no filtro Android:** sort `IV,DSP,CP,LEVEL`; ligas `great,ultra`; gênero `Male,Female,Genderless`; tamanho `XXS,XS,S,M,L,XL,XXL`; resultados `100,250,500`; raios perto `1,2,5,10 km`, mundo inteiro como padrão; presets até 20. Isto NÃO altera o PokeSearch: manter 18 ícones de modos existentes, shiny em destaque ao lado de modo, distância 0–1000 km, máximo de 10 sprites e AUTO selecionável.

**Técnicas úteis:** atualizar UI imediatamente quando configurações mudam sem obrigar consulta; cancelar consultas obsoletas; resultado antigo sinalizado como desatualizado; histórico de última busca; cache válido por filtro/posição; sprites em memória/disco; relógio de despawn ajustado sem refazer todos os elementos; não buscar na tela apagada; separar request/network da UI; feedback visual para fila, delay e erros; ETag do catálogo; classificação de erro 401/403/429/504.

**Limites/client:** no código das bolhas há `GAP_MS=6000` entre pedidos manuais, `FRESH_MS=5min`, `RETRY_MS=30s`, e mecanismo que espera em vez de bater 429. O PokeSearch atual declara mínimo de 60s entre consultas e AUTO configurável; **NÃO reduzir automaticamente esse limite para 6s** — a frequência válida depende das regras, origem da consulta e contrato atual. Ao trocar filtro, cancelar/agrupar pedidos redundantes e manter indicador de 'aguardando consulta'.

**Autenticação:** Google utiliza Custom Tabs + callback HTTPS `pogocoordinates.com/callback` e checagem de abertura padrão de domínio, enquanto Discord usa WebView. O `state` observado é fixo com marcação local de login pendente, o que requer análise adicional de riscos de OAuth/CSRF. Não reutilizar `client_id`, `state`, redirect, cookies, tokens, servidor nem credenciais de outro aplicativo. Para PokeSearch, priorizar fluxo autorizado do serviço de origem, estado nonce PKCE quando aplicável, retorno ao app, persistência de sessão e cancelamento de corridas.

## 3. Servidor — arquitetura e lições
**Código:** https://github.com/ayranoliveira1/pokelocation-server . README v1.1 descreve Go 1.27, servidor REST+WebSocket, PostgreSQL/Redis, Caddy/nginx, FCM, Docker/migrações/testes. O proxy `/v1/pogo/*` implementa login, consulta, pesquisa, reveal, treinadores, regras e histórico. Necessita conta PokéLocation e disponibilidade do servidor — **dependência deliberada** que não deve ser imposta ao PokeSearch por padrão.

- `internal/pogo/handler.go`: rotas, validação, limites por rota/usuário e timeouts (lookup/search até 30 s, treinador até 60 s).
- `internal/pogo/upstream.go`: chamadas HTTPS com redirecionamento desabilitado para não vazar token, limites de tamanho de corpo/decompressão, classificação de 401/4xx/5xx, `Retry-After` limitado e reaproveitamento de buffers.
- `internal/pogo/service.go`: tokens PoGo do usuário protegidos com AES-256-GCM, nonce único e usuário como AAD; contas e políticas de expiração; pool opcional de tokens de servidor. **Não usar tokens de terceiros, rodízio para contornar cotas, engenharia de autenticação sem autorização.** Pool não é recomendação para o PokeSearch.
- `internal/pogo/rules.go`: até dez regras de alertas por usuário, filtros serializados, validação de treinador no shiny, operações condicionadas à identidade, serialização de criação de regras no PostgreSQL.
- `internal/pogo/queue.go` + `worker.go`: fila Redis (sorted set) com lease/fencing para não executar ações velhas, agendamento (padrão 3min, intervalo permitido 2–10min), workers (padrão 32, até 64), controle de vencimento e deduplicação por `encounter_id`.
- `internal/pogo/notifications.go`: histórico por usuário, cursores, limpeza, até 200 por usuário, 7 dias.
- `internal/pogo/assets.go`: catálogo/ícones e cache para não baixar novamente.
- `internal/ratelimit/ratelimit.go`: token buckets em memória; README reconhece limitação de rate limit distribuído quando múltiplas instâncias estão em cluster.
- `internal/httpx/httpx.go`: corpo limitado, prazos por requisição, JSON estruturado, `Cache-Control:no-store`, códigos de erro uniformes.
- `internal/db/migrations/0001…0011`: migrações versionadas, tabelas de usuários, regras e notificações.
- `internal/apitest`, `internal/pogo/*_test.go`, `loadtest`: testes de integração, corrida e carga; existência dos testes não garante que todos passam em ambiente de produção.

**Como aproveitar sem backend agora:** lista local de favoritos com condições, deduplicação por id da ocorrência, estado do último aviso, notificações compactas e histórico **local opcional** e limitado; erros coerentes; cache e backoff; logs mínimos e sem coordenadas/credenciais. Apenas se houver necessidade confirmada: planejar backend próprio, minimização de dados, custo/infraestrutura, política de privacidade, chaves secretas e termos do upstream. Não copiar funcionalidades sociais.

## 4. Segurança, procedência e divergências a avaliar
- Relatório estático anterior: manifesto Android solicita overlay, localização, foreground service, notificações, internet e permissões privilegiadas; há serviço exportado que recebe comandos externos. Revisar componentes exportados/validação de origem antes de adotar qualquer arquitetura semelhante. **Não copiar** permissões de GPS simulado ou instalações de pacotes.
- Recurso `PrivacyModeManager.java` da versão Android inspecionada tenta tratar o AndroidManifest compilado como texto e usar `apksigner/jarsigner` em caminhos de estação de desenvolvimento: evidências fortes de falha do recurso de clonagem em Android padrão; **não aproveitar**.
- `SignalLoader.java` baixa biblioteca nativa por HTTPS e verifica SHA-256 antes do carregamento; é complexidade desnecessária no PokeSearch, que não tem chat.
- Ponto positivo no server: criptografia de tokens com AEAD e bloqueio de redirects autenticados. Ponto a checar: OAuth com `state` previsível no cliente de referência; modelos de autenticação e persistência não são intercambiáveis.
- Este estudo é **estático**. Não há garantia de ausência de malware, compatibilidade real, sessão correta, taxa segura, API contratada, licenciamento de imagens ou conformidade de termos. A análise da assinatura v2 referida na conversa anterior não substitui verificação completa de cadeia/procedência.
- Licenças distintas: **app AGPL-3.0-only**; **servidor MIT** (manter avisos de copyright/licença quando aplicável). Estudar conceitos/algoritmos e implementar independentemente; revisão jurídica para reutilização literal de código, especialmente AGPL.

## 5. Backlog por APROVAÇÃO EXPRESSA, uma etapa por vez
| ID | Prioridade | Proposta | Componentes PokeSearch / Aceitação | Estado |
|---|---|---|---|---|
| PL-01 | P0 | Diagnóstico de filtros reais, contrato do PoGo, mapear `search/lookup`, IV% e PvP, distinguir incompatibilidade | `probe.js`, `presets.js`, `OverlayService.java`; testes isolados para cada modo; nada deixa lista eternamente vazia por falha silenciosa | AGUARDAR CONFIRMAÇÃO |
| PL-02 | P0 | Transições de filtro reativas e cancelamento por geração | Troca de modo/shiny/sort mostra nova escolha imediatamente; cancela resultado obsoleto e mantém UI responsiva; observa limite válido de 60 s | AGUARDAR CONFIRMAÇÃO |
| PL-03 | P0 | Login confiável, retorno direto, sessão persistente, anti-loop e anti-relógio | `MainActivity`, `shiny_login.js`, `OverlayService`; voltar sozinho ao app; nenhum token em logs; reabrir sem relogar | AGUARDAR CONFIRMAÇÃO |
| PL-04 | P1 | Mensagens de estado/error classes: 0 Pokémon vs autenticação/403/429/timeout | Feedback discreto na UI, não 'nenhum resultado' em erro; retry controlado, sem consulta extra involuntária | AGUARDAR CONFIRMAÇÃO |
| PL-05 | P1 | Cache de resultados por filtro+posição+sessão e cache de sprite/catálogo ETag | Reduz rede/CPU; dados antigos marcados; TTL/despawn correto; sem vazamento ao trocar contas | AGUARDAR CONFIRMAÇÃO |
| PL-06 | P1 | Ordenação `Sort by` e persistência de presets/filtros com suporte real confirmado | Não inventar opções que o site não recebe; shiny perto do modo; preserva 18 ícones e 46 IV% válidas | AGUARDAR CONFIRMAÇÃO |
| PL-07 | P1 | Alertas favoritos: deduplicação por `encounter_id`, debounce e limites | Um mesmo encontro não alerta repetidamente; preferência ON/OFF; não elevar consumo/buscas | AGUARDAR CONFIRMAÇÃO |
| PL-08 | P2 | Histórico **local** e opcional de avisos, com retenção/limpeza definida | Sem servidor, sem pedir conta nova; privacidade por padrão; interface opcional sujeita à aprovação | AGUARDAR CONFIRMAÇÃO |
| PL-09 | P2 | Refatoração seletiva do despawn/renderização e isolamento da rede | Sem reconstrução completa por tick; toque/long press/copiar coord. preservados; redução demonstrável de uso CPU/RAM | AGUARDAR CONFIRMAÇÃO |
| PL-10 | P2 | Diagnóstico/sanitização de erros de rede e auth com telemetria LOCAL apenas | Nunca expor cookie, token, trainer code, session, coordenadas do usuário ou URLs sensíveis | AGUARDAR CONFIRMAÇÃO |
| PL-11 | P2 | Revisão de permissões/serviços exportados/App Links, Android 15/16 e assinatura release | Segurança sem funcionalidade falsa; testar instalação limpa/overlay; não adicionar permissões desnecessárias | AGUARDAR CONFIRMAÇÃO |
| PL-12 | P3 | Pesquisa de backend próprio **somente se houver motivo** | Estudo de custo, termos PoGo, API autorizada, confiabilidade, Redis/FCM, proteção de dados e impacto legal; SEM implementação | AGUARDAR CONFIRMAÇÃO |

**Regras globais de aceitação:** preservar identidade `com.lucianotoscano.pokesearch`, projeto independente, UI original minimalista, transparência e ícones, 18 modos (com/sem shiny), IV100/GL#1/UL#1, favoritos, campainha, Pix, report, geofiltro 0–1000 km, atualização configurável, no máximo dez sprites, copiar coordenadas no toque longo, timers, login e compatibilidade Android. Jamais substituir o app pelo PokéLocation. Antes de cada PL: apresentar alteração proposta + riscos + arquivos + testes; **pedir autorização**; desenvolver em branch isolada; compilar e verificar; teste real; então solicitar confirmação para integrar.

## 6. Roteiro de testes mínimos em cada etapa
1. Sem login: todos os modos permitidos funcionam; shiny bloqueado ou explicado corretamente. Com login: shiny com treinador real; persistência após reiniciar; Google/Discord; retorno sem ficar em site.
2. Cada um dos 18 ícones seleciona a combinação correta; 46 valores válidos de IV (0,2,4,...,100 pelos 46 discretos do projeto); GL/UL independentes do IV%.
3. Trocar modo, shiny, `Sort by`, filtro de distância e espécie enquanto há busca em curso não sobrescreve resultados novos com antigos.
4. 0 resultados legítimos, 401, 403, 429, 5xx, perda de rede, timeout, resposta malformada e site alterado recebem estados diferentes.
5. 10 sprites alinhados e menu compacto; recolher, expandir, arrastar, click-through; temporizador dinâmico; long press cópia; alertas/deduplicação.
6. Android 15 e 16 reais; CPU/bateria/RAM observadas; modo background e tela desligada; taxa de requisições conforme serviço.
7. Release com assinatura persistente e revisão de permissões/relatórios; sem credenciais; logs sanitizados.

## 7. Decisão / próximos passos
**Nenhuma melhoria foi aplicada.** Começar preferencialmente com PL-01, seguida de PL-02 e PL-03, após uma confirmação por etapa. Usar este documento como inventário técnico, não como liberação para implantar backend, contornar autenticação ou reutilizar código incompatível.

**Fontes técnicas:** 
- https://github.com/ayranoliveira1/pokelocation/tree/main/app/src/main/java/com/pokelocation/app/pogo
- https://github.com/ayranoliveira1/pokelocation/blob/main/app/src/main/java/com/pokelocation/app/util/PrivacyModeManager.java
- https://github.com/ayranoliveira1/pokelocation-server/tree/main/internal/pogo
- https://github.com/ayranoliveira1/pokelocation-server/blob/main/README.md
- https://github.com/ayranoliveira1/pokelocation/blob/main/LICENSE
- https://github.com/ayranoliveira1/pokelocation-server/blob/main/LICENSE

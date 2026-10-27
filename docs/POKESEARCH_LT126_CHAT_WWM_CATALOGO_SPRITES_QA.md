# LT126 — Chat Firebase e primeira integração externa de catálogo e sprites

Data: 26/10/2026. Origem: ramo LT125 R2, commit `e9c4c6ede886b518d2fd7c7aa934f069f83df479`. Nova branch `fix/lt126-chat-catalog-sprites-20261026`; PR #81 Draft, base PR #80. Main LT124 não alterada.

## Evidência Samsung

Três prints: card Drifblim #426 e Pumpkaboo #710 forma Average sem sprite, vários círculos na coluna, e Home com "Ativos agora: —", "Instalações: —", chat "Não foi possível carregar" e "Falha no envio". O rodapé do screenshot mostra **PokeSearch v0.01.24 LT**, não o QA LT125 R2 0.01.25. É incorreto concluir que o QA R2 foi testado nesses prints. Verificar na instalação física a versão e o source hash.

## Defeito do chat e correção de código

- Antes, `CommunityScrapbookOnline.connect()` exigia que `FirebaseApp.getInstance("PokeSearchStats")` já existisse, mas sua criação ocorria em `FirebaseStats.init()` durante a construção dos contadores. Dependência de ordem de startup e recriação da Home: a instância podia não existir no momento do chat.
- Adicionado `FirebaseStats.ensureApp(Context)`, que cria ou reaproveita o **mesmo Firebase app nomeado**; usado também pelo chat. Sem nova identidade, banco, autenticação nem appId.
- Chat agora só habilita Enviar após leitura autenticada real bem-sucedida; reporta distinção entre permissão negada por regras e erro de conexão; permite tentar novamente tocando no status; remove listener anterior para evitar callbacks duplicados; preserva rascunho após falha.
- Regras locais `firebase-realtime.rules.json` permanecem com `chat/messages`: query por createdAt + limitToLast(60), mensagens somente criadas, autor autenticado, 240 caracteres, timestamp servidor.
- **Não foi comprovado deployment** das regras no projeto Firebase real. Se o erro for `PERMISSION_DENIED` em produção, o cliente sozinho não consegue liberá-las. Não mentir sobre correção funcional até validar regras e troca de mensagens entre dois usuários. Workflow existente `.github/workflows/lt125-firebase-live-deploy.yml` exige `FIREBASE_SERVICE_ACCOUNT_POKESEARCH_LT` e implanta Functions também; nenhuma implantação automática realizada aqui.
- O login Google exibido na Home é a conta do PoGoCoordinates; o chat usa **Firebase Authentication anônimo independente**. O treinador vinculado não cria permissões RTDB.

## Primeira integração externa efetiva — build, não encontros

**WatWowMap/pogo-data-api**, HEAD observado `42b315f317ca8cee8e178249328eab5173e5ca70` (26/10/2026), readme publicado:
- JSON `data/v1/pokemon.json`: 1.025 registros com `pokedexId,pokemonName,defaultFormId,forms`.
- `data/v1/forms.json`: 1.506 registros com `formId,proto,formName`.
- `data/v1/costumes.json`: 87 registros com `id,proto`. Metadados *não* são sprites nem eventos.
- Exemplo confirmado: Drifblim 426 default `1748 DRIFBLIM_NORMAL`; Pumpkaboo 710 default `2641 PUMPKABOO_SMALL`; `2642 PUMPKABOO_AVERAGE`, `2643 PUMPKABOO_LARGE`, `2644 PUMPKABOO_SUPER`. A forma Average exibida no print é `2642`.
- Novo script `app/scripts/import_wwm_catalog.py` lê dados JSON estáticos diretamente do commit fixado, valida IDs únicos e cruzamento com espécies e formas, e gera `pokemon-sprites/catalog_wwm_verified.json` pequeno. Nenhuma chamada de catálogo ocorre durante pesquisas nem substitui a API PoGoCoordinates.

**WatWowMap/wwm-uicons**, HEAD observado `998bf635194a11078b6375c79d1494d5eb999b39`:
- Convenção para arquivos confirmada pelo UIcons: `pokemon/{id}[_f{form}][_c{costume}][_s].png`.
- O acervo contém os caminhos exatos `pokemon/710.png` (default Small), `710_f2642.png` (Average), `710_f2643.png` (Large), `710_f2644.png` (Super), e os respectivos `_s.png`.
- Novo script `app/scripts/fetch_wwm_pumpkaboo.py` baixa apenas 8 PNGs vinculados à SHA de blob Git exata e valida assinatura/dimensões. `build_sprite_bundle.py` os empacota e registra hash no manifesto.
- `sprite_offline.js` mapeia somente espécie 710 + forma reconhecida / form_id consistente e sem traje/região conflitantes, usando mesma lógica para card, resultados e picker P1/P2. Outras variantes ficam com resolvedor existente ou placeholder neutro; nunca supor sprite por nome genérico.
- Antes: 1.025 normais + 1.025 shiny + 716 formas + 10 trajes = 2.776 PNGs. Depois (alvo do CI): +8 Pumpkaboo = **2.784 PNGs** com hash, mais JSON compacto de catálogo. Esse número só será atestado após a auditoria binária do APK.

**Fontes investigadas sem incorporar**: UIcons/UIcons é especificação de nomes e não banco de imagens; PokeMiners/game_masters e pogo_assets contêm dados/arte e são complementares, mas não houve nova redistribuição automática nesta etapa; nileplumb/PkmnHomeIcons e PkmnShuffleMap são candidatos. Licenças independentes **não foram comprovadas documentalmente por este trabalho**: repositórios WatWowMap consultados não exibiam arquivo LICENSE nem license SPDX via API. A declaração de permissão do responsável está registrada, mas não substitui documentação do titular. PokeMiners explicita direitos dos titulares Pokémon no README.

## Preservações / QA

- Sem mexer em filtros, credenciais PoGoCoordinates, 10 resultados, localizações, despawns, efeito de carregamento, Shiny, P1/P2 independentes, favoritos, sons, notificações, home, R8, JDK17, Gradle8.11.1, minSdk26/target33/compile36, applicationId ou assinatura permanente.
- Teste `app/tests/lt126-chat-and-wwm-sprite.test.js`: init chat/regras, reconexão, oito sprites e combinações inválidas, Drifblim #426 base e shiny; demais testes Node existentes executados via CI.
- Workflow separado `.github/workflows/lt126-chat-wwm-sprites-signed-qa.yml` gera somente QA `0.01.26` / `54331`; não sobrescreve `0.01.25/54330` nem publica release estável.
- **NO-GO** para produção até chat real entre dois UIDs, implantação/consulta das rules Firebase corretas, testes Samsung com APK 54331, counters reais, conferência de SHA-256 e licença/atribuição de fontes externas. PR #81 permanece Draft e depende da revisão/merge da PR #80.

# PokeSearch — Mural da Comunidade (Scrapbook) · Etapa 1

**Data:** 25/10/2026 · **Status:** protótipo local, isolado em PR Draft, **NÃO online** · **Versão:** sem incremento / sem APK nesta etapa.

## Checkpoint (não voltar a LT83)
- Base da nova branch: `352a3bdc048d4b6f7337209ccd1d77939b8ae2bf`, da `feature/lt88-lt93-evolution-20261025` PR #63 Draft, com Node, Java e workflow de QA protegido aprovados (respectivamente #40187866262, #40187866270, #40187862412).
- `main` continua LT87 oficial em `83cf9a693a3672276e01d04e38ed14dce0071cb8`; LT84 PR #59 merged, PRs #60 LT85 e #61 LT86 fechadas como substituídas e código preservado pela consolidação LT87 e pelas melhorias da PR #63.
- LT88 R8 QA: 0.00.95/54298, não é publicação oficial. Esta etapa não altera o `versionCode`, `versionName`, assinatura, FirebaseStats, API, `probe.js`, overlay ou APK do Drive.
- Branch de trabalho: `feature/pokesearch-community-scrapbook-stage1-20261025`. PR Draft direcionada para a branch-base de evolução LT88–LT93 (não `main`), impedindo um diff falso que recriaria o desenvolvimento posterior à LT87.

## Objetivo
Uma **única timeline** de recados, sugestões, bugs e dicas, semelhante aos antigos scraps do Orkut. Etapa 1 é experiência **estritamente demonstrativa, somente leitura e local**. Nenhum usuário escreve no Firebase; números, avatares, horários e apelidos são fictícios e sinalizados como `demo`.

## Interface
- O ponto de inserção fica **após estatísticas e Compartilhar app**, antes do rodapé da Home. O painel reaproveita cantos arredondados/cores da Home, mostra três últimos exemplos com avatar textual, apelido, categoria, mensagem, horário relativo, curtidas e respostas, além de `Ver todos`, `Escrever recado · em breve` e expandir/recolher.
- Com a flag ativada, a Home inteira usa `ScrollView` preenchendo a tela para evitar cortes dos controles superiores e do rodapé em resoluções pequenas. **Sem a flag, o ramo de layout da Home é o mesmo de antes.**
- `Ver todos` abre `CommunityScrapbookActivity` nativa **fora da overlay** (`exported=false`). A tela oferece `Todos`, `💬 Recados`, `💡 Sugestões`, `🐞 Bugs` e `🎓 Dicas` como filtros locais; lista os exemplos com mensagem oficial fixada DEMO, curtir/responder/denunciar marcados DEMO e editor de 300 caracteres desabilitado.
- A prévia não abre WebView, não acessa rede, não escaneia coordenadas, não guarda texto do usuário e não acessa dados privados do PoGoCoordinates.

## Flag de desenvolvimento e bloqueio release
`CommunityScrapbookStage1.isEnabled(context)` retorna `BuildConfig.DEBUG && prefs.getBoolean("communityScrapbookStage1Preview",false)`. A opção **Mostrar/Ocultar protótipo Mural** existe no menu lateral **somente em debug**, e por padrão vem desligada. Em release `BuildConfig.DEBUG=false`, mesmo uma preferência antiga verdadeira **não** habilita o Mural e a Activity recusa abrir. Nenhum build oficial foi gerado.

## Arquivos
| Arquivo | Ação |
| --- | --- |
| `app/src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookStage1.java` | Novo modelo demo imutável, flag e painel |
| `app/src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookActivity.java` | Nova tela read-only com quatro filtros |
| `app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java` | Condicional de debug, integração inferior e item de dev |
| `app/src/main/AndroidManifest.xml` | Registro da Activity não exportada |
| `app/tests/scrapbook-stage1.test.js` | Regressões do protótipo, flag e ausência de escrita |
| `docs/POKESEARCH_SCRAPBOOK_ETAPA1.md` | Este checkpoint |
| `docs/GUIA_MESTRE.md` | Append protegido por workflow próprio, sem substituir o prefixo histórico |

## Firebase: inventário existente e plano, sem implantação
A classe `FirebaseStats.java` inicializa uma app nomeada `PokeSearchStats`, usa **FirebaseAuth anônimo** e `FirebaseDatabase` no projeto `pokesearch-lt`. Os contadores e a presença usam `stats/installations` e `stats/online`. **Não alterar esse fluxo.** PoGoCoordinates usa login distinto e sua identidade jamais pode ser exposta no Scrapbook. Nenhuma nova inicialização Firebase nesta etapa.

Espaço futuro **isolado** no mesmo RTDB:
- `scrapbook/users/{uid}`: pseudônimo escolhido, avatar público genérico, status de bloqueio controlado pelo servidor. **Não** guardar e-mail, código do treinador, coordenada, foto OAuth, JWT, token ou cookie.
- `scrapbook/posts/{postId}`: uid autor, categoria enum `recados/sugestoes/bugs/dicas`, texto <=300, timestamps do servidor, status publicado/oculto/moderado e flag fixada **somente admin servidor**.
- `scrapbook/replies/{postId}/{replyId}`: uid, texto limitado, timestamp do servidor, visibilidade/moderação.
- `scrapbook/likes/{postId}/{uid}`: existência por UID (1 curtida por usuário), write de dono/servidor.
- `scrapbook/reports/{reportId}`: autor da denúncia, alvo, motivo padronizado, timestamp servidor; leitura **apenas equipe de moderação**.
- `scrapbook/config`: flags assinadas/geridas apenas por backend, moderação e políticas; clientes recebem subconjunto publicável.

**Regras futuras propostas (não aplicadas):** negar leitura/escrita por padrão; exigir `auth != null` em escopos específicos, conferir `auth.uid` com `authorUid` e impossibilidade de alterar autor/timestamp/categoria além das operações autorizadas; dados estritamente enumerados, texto sem HTML e <=300, no máximo uma curtida por UID; evitar `.write:true` amplo; validação de esquema e `newData` versus `data`; denúncias invisíveis para usuários comuns. O Firebase Auth anônimo sozinho **não** impede spam ou criação massiva de contas: antes de publicação, exigir **App Check** mais bloqueios confiáveis/rate limiting no **servidor** (Cloud Functions/Cloud Run se disponível, com custos analisados) e limites/quotas. RTDB Rules isoladamente não fornecem rate limit global robusto. Não atribuir poder de moderação ao cliente. Retenção e exclusão/cópia de dados pela equipe, política LGPD, modo denúncia e suporte previstos antes da etapa de escrita real. Revisar custos/uso do plano Spark e regras atuais sem modificar produção.

## Testes e evidências
- Node: `app/tests/scrapbook-stage1.test.js`; deverá comprovar flag, tema, Home e wallpaper, categorias, 3 posts, 300 caracteres, integração de tela e ausência de escritas Firebase.
- Android: compilação Java por workflow existente da PR (sem gerar APK público).
- Regressões integrais das demais funções via CI existente, sem enfraquecer testes.
- **PENDENTE FÍSICO:** Samsung com build debug privado via ambiente de desenvolvimento: painel recolhido/expandido, Home e footer sem cortes, scroll, clique no `Ver todos`, filtro Todos/4 categorias, temas, rotação, back navigation, fonte grande e overlay ativo.
- **PENDENTE SEGURANÇA/FIREBASE:** desenho e teste de Security Rules em emulador, App Check, moderação, retenção, privacidade, orçamento e acesso real. Sem publicação de teste no RTDB de produção.

## Próximos estágios NÃO autorizados agora
Etapa 2: modelos, Authentication e operações em ambiente isolado de teste após revisão de Rules. Etapa 3: criar/curtir/responder/filtros/paginação. Etapa 4: denúncias, moderação e limitações confiáveis no servidor. Etapa 5: homologar em Samsung, custos, APK protegido, aprovação de distribuição.

**Governança:** não fazer merge, release nem enviar APK ao Drive; não executar escrita no Firebase; não criar quatro feeds. Manter toda a PR #63 e preferências/assinatura.

## Resultado real do CI — execução 25/10/2026
- **Workflow da Etapa 1 (Node e Java, sem APK):** https://github.com/LucianoToscano/PokeSearch/actions/runs/40189621731 — **SUCCESS**, `SOURCE_COMMIT=431090ec8ef8274cc6146f3456529199eacae744`.
- **Node:** regressões históricas e `app/tests/scrapbook-stage1.test.js` **PASS**, sete verificações específicas (feature gate release, Home/tema, três recados demo, categorias/filtro, nenhuma gravação Firebase, Activity não exportada, limite 300 e ações desabilitadas). `lt74-local-update-preview.test.js` foi excluído **por já ser excluído no workflow de referência LT88 R8**, pois exige um recurso debug legado não presente no checkpoint; não é teste da comunidade e não foi alterado.
- **Java/Android:** `gradle :app:compileDebugJavaWithJavac --no-daemon --stacktrace` **BUILD SUCCESSFUL**, sem criar qualquer APK.
- **Guia Mestre:** workflow https://github.com/LucianoToscano/PokeSearch/actions/runs/40189422785 **SUCCESS**; arquivo integral de 1.458.217 bytes presente no checkout antes do append; SHA-256 do prefixo antigo comparado byte a byte; commit gerado `26473c4e9bd8d35b21c55d3d60b9b12e1692f7ba`.
- Nenhum teste físico Samsung ou emulador Android foi executado. **Não chamar de homologado**; demo inativa em release.

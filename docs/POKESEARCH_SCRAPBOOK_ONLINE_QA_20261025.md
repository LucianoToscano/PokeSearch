# Scrapbook online moderado — QA 0.00.97 (25/10/2026)

## Escopo desenvolvido na PR #64
- Novo cliente `CommunityScrapbookOnline` com leitura Firebase Realtime Database em tempo real para publicações **aprovadas**, 4 categorias, postagem/ resposta enviadas **somente para moderação**, curtida única por UID e denúncia privada.
- Identidade: Auth anônimo do mesmo app Firebase nomeado dos contadores, sem usar tokens, dados, nickname ou coordenadas de Pokémon GO.
- Até **300 caracteres** para recados, apelido escolhido de 2–24 e resposta de até 200.
- Escritas propostas: `scrapbook/submissions/{uid}` (um envio pendente por identidade), `replySubmissions/{postId}/{uid}`, `likes/{postId}/{uid}` e `reports/{postId}/{uid}`. Feed `scrapbook/posts` é **somente escrita administrativa**.
- `firebase-realtime.rules.json` preserva integralmente a árvore `stats` e inclui regras negativas por padrão com autoria/validação. **Arquivo versionado não significa regras implantadas**.
- Flag nova `BuildConfig.SCRAPBOOK_ONLINE_QA` só habilitada em workflow protegido com assinatura permanente, versão crescente, `POKE_SCRAPBOOK_ONLINE_QA=true` e ACK. Builds comuns e release pública não veem o mural.
- Home e Activity reaproveitam o gate existente. Demo LT96 permanece intacta quando a flag online está desligada.

## Avisos bloqueantes de produção
1. **Não ativar `acceptSubmissions=true` antes de inspecionar as Security Rules já implantadas**, testar no Emulator Suite (anônimo, outro UID, sem autenticação, tentativa de escrever posts, spam, schema inválido, timestamps), configurar App Check e moderação.
2. Não foi concedido acesso Firebase Console/Admin SDK nesta PR para comparar/implantar regras. Código de cliente e arquivo JSON **não comprovam operação online**. Com flags fechadas o APK QA mostra o estado bloqueado, sem criar textos no banco.
3. Apenas 1 envio pendente por UID não é rate limit resistente a múltiplas contas anônimas. Para abrir cadastro em escala: mecanismo servidor confiável de limitação, limites de orçamento/quotas, moderação, política de retenção, LGPD, deleção e canal de suporte.
4. Publicações públicas precisam ser aprovadas pelo operador com Admin SDK/Firebase Console. Não fornecer claims de moderação ao APK.
5. Antes de enviar APK a terceiros: autorização do proprietário e QA Samsung físico. Sem merge das PRs #63/#64, Release ou troca do arquivo público no Drive.

## Procedimento seguro
- Conferir regras online *antes* de implantar novas regras para preservar `stats`.
- Validar regras em emulador; apenas então aplicar com backup e rollback.
- Verificar `config/acceptSubmissions` inicialmente **false** (ou ausente).
- Na QA com regras aplicadas, testar login anônimo, receber post aprovado em tempo real, enviar pendente, negar segundo pendente, curtida por UID, resposta pendente, denúncia privada, negar leitura de denúncias alheias.
- Depois da moderação e App Check/limites servidor revisados, mudar a flag administrativamente em ambiente QA.
- Registrar SHA, Actions, certificado e aceite físico separadamente.

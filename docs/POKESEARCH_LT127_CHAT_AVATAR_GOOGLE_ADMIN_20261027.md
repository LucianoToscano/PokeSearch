# LT127 — Foto opcional, apelido editável e exclusão exclusiva do administrador

Data: 27/10/2026. Branch `feature/lt127-chat-avatar-google-admin-20261027`. Base: LT126 PR #83. Prioridades: preservar RTDB atual do chat já funcionando e os contadores de 5 ativos/24 instalações mostrados pelo usuário. Não copiar login de PoGoCoordinates como identidade Firebase.

## Implementação

1. **Foto:** cada participante toca no avatar do cabeçalho, aceita aviso de foto pública e escolhe uma imagem **da própria galeria** via `ACTION_GET_CONTENT`. Nenhuma foto Google é importada automaticamente. Imagens são cortadas ao centro e reduzidas para JPEG 96×96, qualidade 62, dados binários máximos 17 KB; arquivo codificado máximo 24 mil caracteres. Sem Firebase Storage nem permissão Android para ler toda a galeria. Pode remover a imagem. Armazenamento e leitura online em `chat/avatars/<auth.uid>`; imagem visível junto das mensagens por UID, sem manipular texto HTML/WebView. Avatar padrão para quem não escolheu.
2. **Apelido:** cabeçalho exibe `Apelido ✎`, edição por toque, 2–24 caracteres, persistência local já existente `communityNickname`. Mensagens continuam contendo autor, horário e texto.
3. **Admin exclusivo:** menu `⋮` oferece autenticação adicional do Google e, **somente após validação**, ações `Excluir mensagem` (toque longo) e `Excluir todas` (confirmação). O Firebase RTDB valida diretamente token de provedor `google.com` + `email_verified=true` + endereço exato `lucianotoscano@gmail.com` + exclusão. Comparar nome ou e-mail da Home nunca libera exclusão. Conta Google/Discord logada no site PoGoCoordinates é separada de Firebase Authentication.
4. **Isolamento:** o admin autentica em um app Firebase nomeado distinto `PokeSearchChatAdmin`; a sessão anônima `PokeSearchStats` e UIDs de instalações/presença não são alterados. Usuários comuns mantêm o mesmo mecanismo de chat. O admin Google pode usar a mesma tela do chat.
5. **Regras Firebase:** `chat/messages` aceita remoção total apenas por admin verificado; `$messageId` permite inclusão do próprio autor (como hoje) OU exclusão somente pelo admin. `chat/avatars` é legível por usuários autenticados e gravável **somente pelo dono do UID** e limitado em tipo/tamanho. Nenhum usuário comum pode excluir mensagens, inclusive próprias. A regra versionada da LT127 modifica só `chat`, deixando `stats` idêntico ao branch anterior.
6. **Segurança de dados:** escolher foto é opt-in, não pedir Storage geral, não guardar fotos Google, texto/UID fornecido pelo cliente nunca determina privilégio, não exibir UID no chat. URLs de foto não aceitas: apenas bytes JPEG codificados no caminho de avatar.

## Preparação necessária no Firebase / CI — não inventar OAuth

O `google-services.json` atual do projeto `pokesearch-lt` inspecionado **não inclui `oauth_client`**. Sem isso não há prova de que uma autenticação Google Admin possa funcionar no Samsung. Passos adicionais:

1. No **Firebase Console → Authentication → Sign-in method**, habilitar **Google**, mantendo **Anônimo** ligado; conferir que provedor Google vinculado ao projeto correto `pokesearch-lt`.
2. Em **Project settings / Google Cloud APIs & Services → Credentials**, configurar os clientes OAuth do projeto, Android `com.lucianotoscano.pokesearch` com certificado de assinatura permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` (SHA-1 do mesmo certificado deve ser obtido da keystore **sem compartilhá-la**) e Client ID do tipo **Web** para `requestIdToken`.
3. Configurar em GitHub Actions o secret `POKE_CHAT_GOOGLE_WEB_CLIENT_ID` com o Web Client ID verdadeiro do mesmo projeto. Ele **não** é uma senha, mas deve corresponder ao cliente Google configurado e é obrigatório para ativar o botão de admin.
4. Quando esse secret estiver disponível, recompilar a mesma base assinada (novo versionCode monotônico, sem sobrescrever QA) e instalar. A build sem Web Client ID mantém envio normal e foto, mas o botão Admin informa que falta configuração e não concede privilégios.
5. **Publicar regras de chat no Firebase sem substituir o restante:** antes do deploy copiar/exportar as rules REAIS atuais, nas quais `stats/online` e `stats/installations` mantêm `".read":"auth != null"`, enquanto a versão do repositório é mais restritiva. Mesclar APENAS o objeto `rules.chat` da LT127 com as demais regras atuais. NÃO usar `firebase deploy --only database` do repositório sem comparar, pois poderia zerar os contadores. Usar console → Realtime Database → Regras → Publicar após teste no laboratório.
6. Confirmar em dois telefones: usuário comum pode enviar/alterar somente a própria foto; outro usuário recebe fotos; usuário comum não pode excluir; conta admin autenticada no Firebase Google pode excluir mensagens e limpar o feed; stats/online e instalações permanecem com valores reais e não retrocedem.

## Estado da QA e limites

Testes automatizados criados em `app/tests/lt127-chat-avatar-google-admin.test.js`: regras fail-closed, token verificado, isolamento de apps Firebase, tamanho JPEG, botão de galeria e operações de moderação. Necessário ainda build Android protegido e teste físico com dois usuários e OAuth Google configurado. Não considerar admin *operacional* em produção antes de publicar rules e comprovar autenticação Firebase real.

**Governança:** branch separada baseada na PR #83, main preservada. QA no GitHub Actions; não publicar release oficial nem mesclar automaticamente. Fonte PokeSearch Java+Firebase existente; nenhum scraper ou outra fonte externa envolvida.

## Certificado da QA (comprovação independente de GitHub Actions)

A assinatura da primeira QA LT127 informa:
- SHA-256 do certificado Android: `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`;
- **SHA-1 do certificado Android: `dd7bf665e1d47a257fc557b51cb5a57dfd13cb96`** (para registro da credencial OAuth Android no Google Cloud/Firebase);
- APK Android Signature Scheme v2 validado. Não enviar nem publicar o arquivo de keystore.

**Limitação explícita:** na build atual, caso `POKE_CHAT_GOOGLE_WEB_CLIENT_ID` não exista nas secrets do GitHub Actions, o login de administrador exibe instrução de configuração e permanece indisponível; o chat comum continua normal. Mesmo com secret, é necessário ativar Google Auth e implantar as regras RTDB de chat mescladas com o banco atual. A leitura da Home PoGoCoordinates jamais concede admin por mera igualdade do e-mail apresentado.

## Pacote de regras pronto para integração segura

Arquivo `docs/POKESEARCH_LT127_APENAS_BLOCO_CHAT.json` contém **somente** `{ "chat": { ... } }`, extraído das regras versionadas desta PR. Não colar isso como substituto de todo o editor do Firebase. No console existente:

- Fazer backup/exportar as regras de produção atuais, que já fazem contagem de ativos/instalações.
- Dentro de `rules`, **substituir unicamente o nó `chat` atual** pelo nó `chat` do arquivo; preservar todos os demais irmãos (sobretudo `stats`) sem alterações.
- Usar o simulador de regras com uma conta anônima: escrita própria em `chat/messages/$id` permitida, exclusão negada, gravação `chat/avatars/$uid` permitida somente para o UID próprio.
- Validar autenticação do admin como Google autenticado no mesmo Firebase, com `email_verified` e e-mail específico. Só então confirmar leitura e exclusão de mensagem pelo admin, limpeza do feed e recebimento em outro dispositivo.
- Publicar após esses testes, reabrir LT127, conferir que `Ativos agora` e `Instalações` permanecem com dados verdadeiros. **Este arquivo não foi implantado no Firebase por esta PR**.

# LT128 — Login Google administrador do Chat PokeSearch

Data: 27/10/2026. Repositório: LucianoToscano/PokeSearch.
Branch: `fix/lt128-google-admin-oauth-20261027` (base LT127 — PR #86).

## Entrada recebida e validada

O usuário enviou o arquivo cliente `google-services (2).json`, **distinto do Admin SDK privado**.
Conferidos os dados técnicos:

- Project ID: `pokesearch-lt`.
- Firebase app ID: `1:1007816617051:android:bc055b81b3bdfaceaa637e`.
- Android package: `com.lucianotoscano.pokesearch`.
- Android OAuth `client_type:1`: `1007816617051-83gesa09s86h50jbkcvrrjpp6do46tjg.apps.googleusercontent.com`.
- Android certificate SHA-1: `dd7bf665e1d47a257fc557b51cb5a57dfd13cb96` (corresponde ao permanente usado no signed CI).
- Web OAuth `client_type:3`: `1007816617051-abhc4riftns3om8gs0o67ce1s386ue9d.apps.googleusercontent.com`. **Somente esse ID é usado em `requestIdToken`**; o tipo Android não serve como ID de servidor.
- Nenhuma chave de service account/Admin SDK deve ser inserida no APK, GitHub ou relatório; o novo `chat-google-oauth-public.json` contém **somente metadados OAuth públicos**.

## Implementação

1. `app/build.gradle.kts`: `CHAT_GOOGLE_WEB_CLIENT_ID` passa a receber o **Web OAuth ID real** por padrão. A variável `POKE_CHAT_GOOGLE_WEB_CLIENT_ID` permanece como override explícito para ambientes que configurem outro projeto; o CI usa o cliente público fixado e verificado.
2. `app/chat-google-oauth-public.json`: metadados de proveniência, pacote e SHA-1 do certificado, sem credenciais privadas.
3. `.github/workflows/lt128-google-admin-oauth-signed-qa.yml`: compila QA **0.01.28 / 54333** com assinatura v2 permanente, Node e Java/Android, R8, integridade dos sprites, hash do APK e artefato GitHub.
4. `app/tests/lt128-google-admin-oauth.test.js`: verifica Web ID exato, Client Android distinto, SHA-1, versão monotônica, isolamento da sessão Google Admin e requisitos do token Firebase no RTDB.

## Regras e restrições inalteradas

- `PokeSearchChatAdmin` continua um FirebaseApp nomeado isolado: login Google administrativo não converte/desloga a conta anônima `PokeSearchStats`, que alimenta presença e instalações.
- Exclusão somente com autenticação Firebase via `google.com`, e-mail verificado e endereço exato `lucianotoscano@gmail.com` — **ser exibido como Luciano Toscano na Home não concede permissão**.
- `chat/avatars`, mensagens, apelidos, P1/P2 e filtros continuam como na LT127.
- A ativação Google e Anônimo no Firebase Console já foram confirmadas nas capturas fornecidas pelo usuário. Contudo, **publicação e validade atual das rules de produção não foram consultadas diretamente**; não executar deploy cego de `firebase-realtime.rules.json`, pois regras de `stats` do repositório podem divergir das reais e apagar os contadores atuais.
- A chave privada de serviço Firebase Admin SDK anexada anteriormente pelo usuário não foi necessária nem utilizada; recomenda-se revogação/rotação da chave exposta.

## Testes pendentes do Samsung

- Instalar QA LT128 **sobre** a anterior (não desinstalar), abrir Chat → menu `⋮` → Verificar administrador com Google; deve abrir escolha de conta real e não mais a tela 'OAuth precisa ser configurado'.
- Selecionar a conta Google que corresponde ao administrador, verificar autenticidade com Firebase Auth, depois tocar e segurar uma mensagem para solicitar exclusão; testar cancelar e confirmar.
- No segundo aparelho/conta anônima, verificar que não existem botões de exclusão nem permissão de apagar qualquer mensagem, mesmo por requisição direta.
- Testar limpar chat completo com confirmação dupla de identidade; confirmar recebimento de mensagens em ambos os aparelhos.
- Conferir contadores `Ativos agora` e `Instalações` após Google login e logout, foto da galeria e P1/P2 independentes.
- Registrar no console Firebase se a regra `chat/messages` já autoriza exclusão exclusiva por Google; **se houver `PERMISSION_DENIED`, comparar somente o bloco `chat` sem substituir `stats`**.
- Não declarar homologação real concluída por CI Android.

## Distribuição obrigatória

Seguir `AGENTS.md` e Issue #84: GitHub Actions artifact **primeiro**, verificando existência, assinatura, tamanho/CRC e SHA-256. `Library file not found` do ChatGPT não é falha do APK e não será resolvido apenas reenviando sandbox.


## Controle de mudança

- PR #87 (Draft, empilhada sobre PR #86): https://github.com/LucianoToscano/PokeSearch/pull/87
- CI específico para autenticação Google: https://github.com/LucianoToscano/PokeSearch/actions/workflows/lt128-google-admin-oauth-signed-qa.yml
- Não há implantação de regras Firebase nesta PR. O login real do administrador e exclusão continuam exigindo validação no Samsung.

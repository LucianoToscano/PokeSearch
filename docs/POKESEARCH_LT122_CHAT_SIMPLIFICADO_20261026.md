# LT122 — Chat PokeSearch simples (sem categorias nem moderação prévia)

Data: 26/10/2026. Base: `main` LT121. Usuário pediu simplificar o mural e confirmou que não quer moderação nem proteção avançada por enquanto.

## Interface
- Chat único integrado à Home, sem trocar de tela e sem abas Recados/Sugestões/Bugs/Dicas.
- Balões em duas cores, mensagens próprias à direita, mensagens de outros à esquerda, nome e horário.
- Campo de mensagem (240 caracteres), botão enviar, apelido editável e até 60 mensagens reais do Firebase, atualizadas em tempo real.
- Zero postagens fictícias ou publicações simuladas na interface.
- Visível por padrão após atualizar, com menu Mostrar/Ocultar Chat. A Home principal continua funcionando e o chat não interfere nas duas Pokébolas.

## Firebase e segurança mínima
- Endpoint único: `chat/messages` com autenticação Firebase anônima. O app envia mensagens **diretamente** via `push().setValue(...)`, sem Cloud Functions e sem aprovação.
- Regras versionadas: leitura autenticada apenas com `orderByChild('createdAt').limitToLast(60)`; escrita somente como novo registro, `authorUid === auth.uid`, com texto de 1–240, apelido 2–24 e timestamp servidor, sem campos adicionais. Ninguém altera/exclui mensagens existentes pelo cliente.
- **Não há revisão humana, bloqueio de palavras, banimentos, servidor de rate limit nem denúncia**. O intervalo de 2 segundos no cliente é apenas conveniência e pode ser contornado; existe risco real de spam, ataques e conteúdo inadequado, especialmente se o chat ficar aberto para muitos usuários.
- `scrapbook/posts` e `scrapbook/replies` antigos permanecem somente leitura. Não migrar automaticamente posts ou dados pessoais.

## Ativação real (DEPLOY NÃO VERIFICADO)
- Regras no repositório **NÃO** são regras implantadas. Verificar console Firebase do projeto `pokesearch-lt` e fazer deploy apenas de Realtime Database Rules ao destino correto com autorização da conta administradora.
- Com regras antigas, a API do chat ficará sem leitura/escrita e não deve ser anunciada como ativa. Testar envio e leitura entre dois usuários autenticados distintos, rejeição de escrita anônima não autenticada, exclusão/edição e limites de payload.
- Não implantar Cloud Functions: esta solução simples não as utiliza.

## QA
- Workflow assinado LT122 `0.01.22/54326` e testes Node, Android/Gradle, assets e assinatura dependem de CI. Não publicar como estável sem confirmar build e Firebase ativo.
- Preservar appId `com.lucianotoscano.pokesearch`, certificado permanente, Guia Mestre integral e dual Pokébola.

## Restrições assumidas
- O chat não é o aplicativo WhatsApp; trata-se apenas de UI semelhante, texto público e sincronização Firebase.
- Não contém criptografia de ponta a ponta. Conteúdo é visível a qualquer utilizador autenticado do PokeSearch; evitar dados pessoais, códigos de acesso ou localização privada.

# LT126 — Correção Chat e primeira integração WatWowMap/UIcons (27/10/2026)

## Checkpoint de continuidade
- Derivado da PR #80, LT125 R2; branch `fix/lt126-firebase-chat-wwm-catalog-20261027`, PR #82 **Draft** com base em `fix/lt125-firebase-and-costume-sprites-20261026`. Main `65c9b4219744bad180e435faa23739e08e7d183f` preservada, LT124; último APK QA de base LT125 R2 versão 0.01.25/54330.
- `AGENTS.md`, Guia Mestre, testes LT122/125 e scripts de sprites consultados. Guia mestre histórico de backup não alterado.

## Evidência Samsung
- Nas imagens recebidas aparece v0.01.24 na Home (não é o APK LT125 R2), com Chat sem leitura/escrita e contadores "—"; cards Drifblim #426 e Pumpkaboo #710 Average mostram ◇, enquanto a coluna de sprites mostra algumas imagens e vários círculos.
- Drifblim #426 normal/Shiny já é coberto pela correção LT125 R2 para forma vazia. Isso não prova que a falha desapareceu no Samsung, que ainda exibe a LT124.
- Pumpkaboo Average NÃO era resolvida como base; confirmado `PokeAPI/pokeapi data/v2/csv/pokemon.csv`: pokemon id 710 `pumpkaboo-average` (default), e `WatWowMap/pogo-data-api`: formId 2642 `PUMPKABOO_AVERAGE`. No índice `wwm-uicons/pokemon/index.json` há `710_f2642.png` e `710_f2642_s.png`. A nova regra faz correspondência por Dex + nome + FormId ou label idêntica + estado Shiny, não por aproximação.

## Código Chat
- `FirebaseStats.chatApp(Context)` inicializa a mesma FirebaseApp `PokeSearchStats` antes da Home/Chat na inicialização fria, evitando dependência acidental da ordem de construção da tela. Mantém FirebaseAuth anônimo independente do login PoGoCoordinates.
- `CommunityScrapbookOnline` somente exibe "Conversa ao vivo" depois da primeira leitura real. Quando Firebase devolve PERMISSION_DENIED, distingue de falha de conexão, cancela envio e informa falta de regras implantadas; status é clicável para repetir leitura quando regras forem corrigidas. Nenhuma mensagem fictícia foi adicionada.
- Regras do chat já existiam em `firebase-realtime.rules.json`, mas **não há confirmação de que foram implantadas na produção**. Arquivo local e testes automatizados não bastam. A PR inclui script e workflow MANUAIS de patch `chat` em `/.settings/rules.json`, com leitura prévia, ETag/If-Match, autenticação por service account, preservação de outras seções (`stats` inclusive), verificação pós-escrita e falha segura. A execução necessita credenciais/permissão real; **não foi declarada implantada nem testada com dois usuários**.
- Não usar o workflow antigo de rules+Functions como única solução de Chat: o chat simples depende de RTDB Rules, não exige Cloud Functions.

## Fontes integradas
1. `WatWowMap/pogo-data-api`, commit fixado `42b315f317ca8cee8e178249328eab5173e5ca70`: o builder importa catálogo `pokemon.json`, `forms.json`, `costumes.json` e traduções PT-BR `translations/pt-br/pokemon.json`, `translations/pt-br/forms.json`, valida esquemas e registra versão/cobertura. Catálogo estático offline, não usado como mapa de encontros.
2. `WatWowMap/wwm-uicons`, commit fixado `998bf635194a11078b6375c79d1494d5eb999b39`: usa índice `pokemon/index.json` e importa **somente duas imagens exatas** autorizadas para Pumpkaboo Average #710, normal e Shiny; valida formato PNG/dimensões e armazena SHA-256 no manifesto.
3. `PokeAPI/sprites`, formas LT116/125 e 1.025 bases/Shiny já empacotadas e PokeMiners 10 trajes existentes são preservados; nada retrocede.
4. `UIcons/UIcons` é **padrão de nome**, não servidor próprio de ícones. PokeMiners/game_masters, nileplumb/PkmnHomeIcons, nileplumb/PkmnShuffleMap consultados como candidatos/referência sem ativações não comprovadas. A ausência de licença explícita em repositório não é prova de direito de redistribuição; usar apenas arte cujas permissões adequadas foram concedidas.

## Regras de identidade, fallback e P1/P2
- `wwm_catalog_snapshot.js` compartilhado por `dock.html` e `detail.html` é gerado na montagem e representa `species`, `forms`, `costumes`, `ptBR` e ícones. O resolver central `sprite_offline.js` consulta apenas os arquivos enumerados com espécie/formId/nome/Shiny compatíveis. `api_result_contract.js` preserva `form_id` informado pela API, sem fabricar IDs.
- Placeholder neutro continua correto para formas/trajes sem sprite exata. Reutiliza o mesmo resolver nas duas Pokébolas, sem compartilhar estados de filtros, buscas, posições ou despawn.
- Nenhuma fonte estática gera localização, IV, CP, Shiny de encontro ou tempo de despawn. O fluxo API/DOM e efeito da Pokébola não foram modificados.
- Pipeline conserva Java 17, Gradle 8.11.1, SDK36, assinatura permanente, R8, applicationId e histórico de preferências.

## Qualidade e limitações
- Teste `app/tests/lt126-wwm-sprites-chat.test.js`: identidade Pumpkaboo Average normal/Shiny, bloqueios de ID errado/traje/nome errado, Drifblim/Noibat, passagem form_id, classes/HTML compartilhados e estados de chat; testes anteriores LT122/LT125 permanecem na suíte.
- Workflow QA `lt126-chat-wwm-sprites-signed-qa.yml`: versão planejada `0.01.26/54331`; valida 1.025 base + 1.025 shiny + 716 sprites de formas PokeAPI + 10 costumes + 2 externas WWM, catálogo 1.025 espécies, formas >= 1.400, costumes >= 80, integridade APK e certificado v2, ZIP < 199 MiB.
- **Não confundir** CI de binário com teste real no Samsung; a restauração Chat/Firebase não é atestada até autenticação de dois aparelhos distintos e confirmação do Firebase vivo.
- Se download/importação falhar, CI falha sem distribuir APK incompleto, mantendo LT125 anterior disponível para rollback.

## Homologação obrigatória Samsung
- Instalar QA 0.01.26/54331 por cima de LT124/125 preservando dados; confirmar versão no rodapé, assinatura e P1/P2 simultâneas.
- Com Pokébolas independentes, verificar Drifblim #426, Pumpkaboo Average normal e Shiny, Pumpkaboo Small/Large/Super sem substituição, Noibat, trajes GOGGLES_2026/COPY_2019, carregamento local após limpeza de cache e sem rede.
- Abrir Chat com dois dispositivos autenticados por Firebase distinto, primeiro após implantação de regras realmente confirmada; validar leitura em tempo real, envio, ordem, horário, reconexão e negação para usuário sem auth. Testar contadores sem confundir instalação com usuário ativo.

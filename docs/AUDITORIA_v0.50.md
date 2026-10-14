# PokeSearch — AUDITORIA incremental v0.50-beta

Base v0.49-beta main `890dbcbe6313eb5875e4de029f8764cdb087a7b3`. Escopo **PS-081 a PS-085**, mais guards de geração em callbacks JS e revisão moderada de exceções. Manter versões anteriores intactas.

| ID | Nível | Problema / evidência v0.49 | Mudança v0.50 | Validação |
|---|---|---|---|---|
| PS-081 | P1 | Notificação de teste apenas avisava quando faltava permissão | Home solicita POST_NOTIFICATIONS requestCode203; callback envia teste se concedida; Favoritos instrui usuário sem solicitar | Teste de contrato; aparelho pendente |
| PS-082 | P1 | Preferências alteravam SharedPreferences sem atualizar serviço ativo | Ação SYNC_PREFS, reordena resultados locais, atualiza largura e WebViews sem buscar novamente | Teste de contrato/CI; aparelho pendente |
| PS-083 | P2 | Guia v0.48 repetido em Documentacao/ da entrega v0.49 | Kit externo contém docs apenas v0.50; históricos continuam integralmente no source ZIP | Inspeção ZIP + hashes |
| PS-084 | P2 | Falhas inesperadas de leitura de catálogo e assets sem registro útil | Log ASSET com etapa e classe; erros escolhidos de conversão/JSON; exceções de rede esperadas sem spam | Código/CI; aparelho pendente |
| PS-085 | P2 | Query solta com code/state/session_id/discord_token podia vazar | Regex e testes de redaction de fragmentos sem http/https | Teste Java standalone |
| JS-GEN | P1 | Alguns callbacks JS poderiam retornar após troca de requestGeneration | Capturar geração antes da evaluateJavascript e descartar resposta obsoleta / loginPaused | Contrato; corrida real pendente |

## B06 — estado
A proteção contra concorrência de `LOGIN_BEGIN/LOGIN_END/REFRESH_LOGIN`, timers nomeados 350/1600/2500ms e ordem do `onDestroy` **permanecem como implementados e testados estaticamente na v0.49**. Nesta versão, houve apenas verificação de geração adicional na resposta do probe JS. **Validação física continua pendente**, especialmente autenticação OAuth real Google/Discord no Samsung SM-S928B Android16; não classificá-la como homologada em aparelho.

## Restrição de segurança e configuração
Identidade `com.lucianotoscano.pokesearch`, JDK17, Gradle 8.11.1, AGP8.10.1, SDK 26/33/36, Manifest, ícones e identidade do PokeSearch preservados. Logs devem incluir somente etapa/nome da classe de exceção; nenhuma URL/cookie/token/código/coordenada privada. O sanitizador é mitigação e depende de revisão manual do relatório.

## Testes mínimos
`node --check`, `node app/tests/probe-smoke.test.js`, `node app/tests/overlay-ux.test.js`, `javac` / `java DiagnosticSanitizerTest`, `gradle :app:testDebugUnitTest :app:assembleDebug :app:lintDebug`, `apksigner verify`, `aapt dump badging`, `sha256sum -c SHA256SUMS.txt` e inspeção do ZIP-fonte editável com Gradle Wrapper/settings e docs históricos. Execução real Android 8–16, múltiplos OEMs, OAuth, Shiny, overlay e bateria/memória continuam **não executadas**.

## Feedback físico reportado — correções e pendências complementares
| Item | Código alterado | Estado de verificação |
|---|---|---|
| Fundo da engrenagem/seta e tema azul | CSS de dock transparente, cinza/branco | Inspeção de CSS; aparência em jogo pendente |
| Espaço exagerado entre menu e sprites | Sem spacer artificial em toolbar lateral | Contrato UX; testar quatro cantos |
| AUTO sem desligamento | 0 = OFF em JS, serviço e persistência; sem timer periódico | Contrato UX; aparelho pendente |
| Notificações sem modo silencioso | Modo off/on/silent e canais Android separados | Contrato e build; entrega visual/sonora pendente |
| Login mostra página de busca em vez da tela de entrada | Tenta clicar no controle oficial uma única vez; OAuth continua no site | Requer login real com Google/Discord |
| Ícone 📍 desproporcional | SVG menor, sem alterar semântica do filtro | Teste visual pendente |
| Sem Pokémon nos modos IV/GL/UL | Tratamento de action nula no serviço; scripts e retorno de dados permanecem sujeitos ao DOM da página | **Ainda não comprovado**; coletar ⚠ diagnóstico categórico real por modo |

### Validação que depende de aparelhos Android e conta real
Abrir a Home e overlay pela primeira vez, testar pesquisa IV100, GL#1, UL#1 sem Shiny e verificar o limite real do site; depois autenticar Google/Discord, confirmar vínculo e ativar ✨ por liga. Testar primeira consulta, AUTO OFF, cooldown da busca manual, ausência de alertas no modo silencioso, canal de favoritos, abrir menu nos quatro cantos, rolagem, seta e engrenagem sobre o jogo, sincronização de preferências com overlay ativo, notificações concedidas/negadas e fluxo de retorno do login. Diagnóstico deve conter etapas/categorias, nunca cookies, URLs completas nem coordenadas.

## ADENDO: projeto independente, compatibilidade ampla e UX simétrica
- **Escopo**: somente `LucianoToscano/PokeSearch`. Não criar integrações nem dependências para qualquer outro projeto.
- **Regressão visual PS-090**: foi tentada uma barra 6×2 de 66dp, mas as capturas demonstraram botões grandes, dois andares e excesso de espaço. Revertido ao modelo original aprovado: 12 controles pequenos em uma única fileira proporcional, altura 34dp, popover logo abaixo e janela nativa proporcional à tela.
- **Defeito de espaçamento evitado**: ao apresentar controles abaixo da engrenagem, calcular o deslocamento vertical pelo limite final da janela, subtraindo a altura visual do ícone (30dp). Não reservar novamente a altura de 34dp entre sprites e menu.
- **Testes automatizados**: asserções estáticas de 12 ações únicas, seis colunas, resize da janela e ausência de margem duplicada. Não substituem screenshots/testes reais em 320/360/393/411/600dp.
- **Critérios de aceitação**: visual minimalista cinza/branco, ícones simétricos e proporcionais, sem cortes, sem vazios arbitrários, fundo flutuante transparente e toques fora da área do overlay repassados corretamente.
- **Matriz manual**: Android 8–16, diferentes OEMs, densidades, orientação, zoom de fonte, navegação por gestos/3 botões, restrições de bateria, permissões e OAuth. Detalhes no `docs/GUIA_COMPATIBILIDADE_ANDROID_v0.50.md`.
- **Status**: suporte amplo é meta de engenharia, **não homologação concluída**. O Samsung SM-S928B/Android16 permanece somente um dispositivo de referência.

### Regressão adicional — Shiny parecia inoperante ao toque
Causa no código anterior: `Bridge.shiny()` delegava imediatamente a `refresh(true)`, que podia aguardar 60 segundos por `MIN_SEARCH_GAP_MS`; autenticação e alteração de Shiny aconteciam apenas durante a busca subsequente. Ação: separar login/controle do botão ✨ da pesquisa, criar ação `setShiny` no probe, conferir com `verifyShiny` e usar a pesquisa normal **somente após** confirmação, mantendo o limite da rede. Ao faltar autenticação, abrir diretamente o login oficial sem cooldown; após entrar, acionar Shiny apenas quando a sessão for reconhecida, sem coletar credenciais. O botão não deve exibir ON confirmado quando a página não confirmar ON. Testes JS adicionados; validação física pendente.

## Correção incremental baseada em evidência visual — PS-086 a PS-088
| Item | Causa verificada no código | Correção | Validação |
|---|---|---|---|
| PS-086: login preso no site | `MainActivity` reconhecia sessão quase exclusivamente por Logout visível e esperava `verifyShiny` para fechar a tela | `session` também reconhece a indicação de conta conectada no layout móvel; polling cuidadoso; retorno automático ao PokeSearch logo após autenticação, independente de Shiny | Contratos JS; login real Android pendente |
| PS-087: ✨ demora/não muda | `prepareImmediateShiny` dependia de `prepareSearch(Stats/PvP)`, embora o switch esteja no formulário atual | Alternância direta no switch da aba Pokémon, tentativa curta após hidratação, evita novo login quando sessão está autenticada | Contratos JS; DOM real pendente |
| PS-088: primeiro sprite distante | Reserva vertical entre menu e sprites em telas pequenas podia exceder a distância física | Reposiciona dock como unidade quando popup precisa ficar acima; elimina margem artificial | Inspeção e contratos; captura real pendente |
**Privacidade:** nenhuma captura de nome de conta, código, cookie, token ou coordenada é gravada pelo detector de sessão. Somente `autenticada`, `login necessário` ou `não confirmado`. A captura recebida é usada como evidência visual de layout, não como teste automatizado da sessão.


## PS-089 — Redução da interface externa no login
**Problema:** o site de pesquisa inteiro podia permanecer visível durante a preparação do login, mesmo com retorno automático após detectar conta. **Correção em código:** FrameLayout nativo cobre temporariamente a WebView com fundo neutro e indicação de conexão; verifica a sessão ANTES de tentar abrir novo login; apenas após clique confirmado no controle oficial libera a interface do site para autenticação. Navegação a provedores externos deixa o WebView visível; no retorno ao domínio, oculta a pesquisa enquanto checa a sessão e fecha o diálogo na confirmação. Sem controle de login após tentativas breves, apresenta fallback de clique explícito `Mostrar o site para entrar`, sem bloqueio infinito. Cleanup limpa as referências nativas. Código/contratos testados automaticamente; **não alegar autenticação real validada em todos os aparelhos**.

## PS-090 — Correção do menu e do login acionado por ✨
**Pedido confirmado por captura:** restaurar o menu original com **12 ícones pequenos lado a lado em UMA única linha** (34dp), cores cinza/branco e sem espaçamento artificial; retirar a grade 6×2 (66dp), que foi uma regressão de UX. Os filtros continuam ativos sem alteração funcional. Ao tocar ✨ deslogado, o fluxo de login deve tentar o botão oficial ou o próprio switch Shiny da aba Pokémon, sem mostrar primeiro a página de pesquisa. Após a autenticação, retorna automaticamente ao PokeSearch; o switch passa a ser gerenciado e confirmado no serviço. Uma máscara neutra só desaparece quando os controles reais de autenticação estão disponíveis. Se o DOM do site mudar, o fallback voluntário permite mostrar o site, nunca um bloqueio sem saída. Respeitar o Manifest/targetSdk/identidade do aplicativo independente. OAuth real e interface em diferentes Androids exigem validação física.

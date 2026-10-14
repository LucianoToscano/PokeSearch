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
Identidade `com.lucianotoscano.pokesearch`, JDK17, Gradle 8.11.1, AGP8.10.1, SDK 26/33/36, Manifest, ícones e PvPPokeGo preservados. Logs devem incluir somente etapa/nome da classe de exceção; nenhuma URL/cookie/token/código/coordenada privada. O sanitizador é mitigação e depende de revisão manual do relatório.

## Testes mínimos
`node --check`, `node app/tests/probe-smoke.test.js`, `node app/tests/overlay-ux.test.js`, `javac` / `java DiagnosticSanitizerTest`, `gradle :app:testDebugUnitTest :app:assembleDebug :app:lintDebug`, `apksigner verify`, `aapt dump badging`, `sha256sum -c SHA256SUMS.txt` e inspeção do ZIP-fonte editável com Gradle Wrapper/settings e docs históricos. Execução real Android 16, OAuth, Shiny, overlay e bateria/memória continuam **não executadas**.

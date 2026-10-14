# PokeSearch — Auditoria incremental v0.48-beta (14/10/2026)

Base v0.47-beta main f083c56c3550d940bce9f8fdceb57c75a9bbf7ff. Código preserva as mudanças B03, B04 parciais, PS-066/068/069 e pacote editável.

## Itens rastreados
- PS-070 / B07 | P1 | Ícone de notificação genérico `android.R.drawable.ic_menu_search` presente em três notificações | Substituído por `R.drawable.ic_notification` monocromático; verificar aparência e contrastes em Android 16. | Corrigido no código, Android pendente.
- PS-071 | P1 | `BugReport.java` removia só URLs/e-mail/códigos/coords, não formatos comuns de password/token/Authorization/cookie | Criado `DiagnosticSanitizer` com limpeza antes de armazenar e exportar; teste Java standalone | Implementado; nenhuma sanitização por padrões é garantia absoluta.
- PS-072 | P1 | `return s.toString().replace("\\n","\n")` permitia a usuário criar linhas artificiais via dois caracteres backslash+n | Gerar quebras reais do relatório, não reescrever literalmente sequências dentro dos campos | Corrigido no código; teste privacidade.
- PS-073 / C01 | P2 | Falhas de notificações e encerramento de overlay eram engolidas silenciosamente | Log mínimo de classe/etapa, sem exceção completa | Parcialmente corrigido; catches restantes opcionais e JSON requerem revisão incremental.
- PS-074 | P2 | Faltava roteiro reproduzível de validação Samsung | Criado GUIA_TESTE_SAMSUNG_v0.48.md com estados esperados | Documento pronto; execução física pendente.

## Sem alterações intencionais
- B01 falso positivo: settings.gradle.kts existia desde antes.
- B02/B05: targetSdk33 e Manifest sem specialUse mantidos, migração planejada após revisão de compatibilidade.
- B06: riscos de disputa login/refresh dependem de testes de OAuth Google/Discord e sessão real do site, ainda não fechados.
- B08: third-party cookies mantidos para login; análise de compatibilidade e superfície de ataque pendente.
- SDK 36, Java17, Gradle8.11.1, identidade do app e PvPPokeGo inalterados.

## Testes executáveis
`javac -encoding UTF-8 -d /tmp/pokesearch-privacy-tests app/src/main/java/com/lucianotoscano/pokesearchoverlay/DiagnosticSanitizer.java app/tests/DiagnosticSanitizerTest.java`
`java -cp /tmp/pokesearch-privacy-tests com.lucianotoscano.pokesearchoverlay.DiagnosticSanitizerTest`
CI: `node app/tests/probe-smoke.test.js`, `node app/tests/overlay-ux.test.js`, `gradle :app:testDebugUnitTest :app:assembleDebug :app:lintDebug` e checksums/assinatura.
**Não afirmar testes físicos sem o Samsung.** Novos relatos devem ter relatório revisado, sem credenciais ou localizações privadas.

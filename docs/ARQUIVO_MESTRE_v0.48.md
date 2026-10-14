# PokeSearch Overlay — ARQUIVO MESTRE v0.48-beta

Atualização: 14/10/2026. Base íntegra e aprovada v0.47-beta, GitHub main f083c56c3550d940bce9f8fdceb57c75a9bbf7ff. Repositório: https://github.com/LucianoToscano/PokeSearch.

## Identidade e continuidade
Android applicationId `com.lucianotoscano.pokesearch`, namespace `com.lucianotoscano.pokesearchoverlay`. Java 17, Gradle 8.11.1, AGP 8.10.1, compileSdk 36, minSdk 26, targetSdk 33 mantido. Versão v0.48-beta, versionCode 48. Projeto **separado de PvPPokeGo**; preservar versões, dados e documentação anteriores. ZIP-fonte pronto para abrir no Android Studio, com Wrapper e assets completos.

## Alterações pontuais da 0.48
1. Criação de `app/src/main/res/drawable/ic_notification.xml`, vetor monocromático com 24×24dp e transparência de fundo, referenciado por `OverlayService` (notificação de serviço e novidades) e `WatchAlerts` (alerta de favoritos). Não usar ícone de launcher multicolorido no status bar.
2. `DiagnosticSanitizer.java`: classificador independente do Android remove padrões comuns de URL, e-mail, código de amizade de 12 dígitos, coordenadas decimais, JWT, Authorization/Bearer, cookies e campos identificados como senha/token/API key/client secret. Filtragem preventiva por padrões, **não garante** remoção universal de credenciais. Preserva limite de 220 caracteres.
3. `BugReport.java`: sanitiza antes de armazenar eventos e novamente ao exportar históricos; usa quebras de linha reais no StringBuilder, sem substituição global de texto literal `\\n`; aviso orienta revisão manual antes de compartilhar TXT.
4. Logs de falha ao notificar e ao remover janelas no `onDestroy` contêm apenas etapa/classe, sem mensagens de exceção com dados privados.
5. Teste standalone `app/tests/DiagnosticSanitizerTest.java` executado pelo CI usando `javac`/`java`, junto aos smoke e UX tests pré-existentes.
6. Roteiro `docs/GUIA_TESTE_SAMSUNG_v0.48.md` cobre canto esquerdo/direito, menu, login/out, OAuth externo, Shiny, localização 0/50/1000, AUTO, transparência, ícone de notificação, relatório e 30 minutos de estabilidade.

## Recursos preservados
IV100 15/15/15, GL#1, UL#1 e pré-evoluções conforme site, Shiny opcional com verificação estrita PoGoCoordinates, localização coordenadas/raio 0–1000, AUTO 5/10/15/20 min, limite mínimo de 60s e limpeza de expirados local, atualização manual, cartas compactas, sprites/tamanho, favs até 50, alertas, login/logout Home, copiar informações quando disponíveis e relatório de bugs. Nunca fabricar dados, nem contornar autenticação.

## Qualidade e limitações
CI deve aprovar: JS, sanitizador Java standalone, Gradle test/assemble/lint, checksum e assinatura APK, ZIP do projeto editável e proveniência do commit. Teste CI não comprova funcionamento de OAuth Google/Discord, Shiny autenticado ou overlays no Samsung SM-S928B Android 16. **Essas validações seguem pendentes**. Não elevar targetSdk nem impor tipo especial de foreground service sem análise de permissões/política e testes dedicados. Não alterar PvPPokeGo.

## Referências
Mestre anterior `docs/ARQUIVO_MESTRE_v0.47.md` e auditoria `docs/AUDITORIA_v0.47.md`; novas ocorrências `docs/AUDITORIA_v0.48.md`. Roteiro físico `docs/GUIA_TESTE_SAMSUNG_v0.48.md`.

# PokeSearch Overlay — ARQUIVO MESTRE v0.49-beta

Atualizado: 14/10/2026. Base v0.48-beta main `8d881baa51cf0442a39fe598e0ee242daaa538bd`. Repositório: https://github.com/LucianoToscano/PokeSearch.

## Identidade e ambiente preservados
- Versão: **versionCode 49**, **versionName "0.49-beta"**. Android `applicationId=com.lucianotoscano.pokesearch`; namespace `com.lucianotoscano.pokesearchoverlay`.
- JDK 17, Gradle Wrapper 8.11.1, AGP 8.10.1, `minSdk=26`, `targetSdk=33`, `compileSdk=36`. **Manifest sem foregroundServiceType** e ícones existentes preservados.
- Projeto **independente do PvPPokeGo**. Todos os docs históricos de v0.38–v0.48 preservados. Abrir pasta raiz do ZIP-fonte no Android Studio; inclui `settings.gradle.kts`, Wrapper, Java, HTML/JS, resources, testes e docs.

## Correções de código aplicadas na v0.49
1. **PS-075 — botão de teste das notificações.** `PokemonPicker` exibe controle compacto "🔔 Testar notificação" sob a opção de som dos favoritos. `MainActivity.buildPreferences()` oferece os controles das chaves `alerts` e `WatchAlerts.PREF_ENABLED`, e outro botão de teste. `WatchAlerts.test(Context)` é chamado explicitamente; o Toast distingue permissão de notificações indisponível de erro de envio e de solicitação enviada. Sem mudar ícones/notificações do sistema.
2. **PS-076 — tecla Voltar durante login.** `loginDialog.setOnKeyListener` intercepta `KEYCODE_BACK` quando o WebView possui histórico; no `ACTION_UP`, volta uma página sem fechar a autenticação. Sem histórico, mantém comportamento padrão de fechar o diálogo.
3. **PS-077 / B06 — race de LOGIN_BEGIN/LOGIN_END/REFRESH_LOGIN.** `OverlayService` usa callbacks nomeados `loginEndRefresh` (1600 ms), `pageFinishedRefresh` (2500 ms) e `deferredSessionReload` (350 ms). `cancelSessionCallbacks` cancela esses três mais `queuedRefresh`, `periodic` e `expiryRefresh`; chamada em LOGIN_BEGIN, LOGIN_END e REFRESH_LOGIN. LOGIN_BEGIN pausa login, invalida geração, cancela todos os agendamentos e oculta overlay; LOGIN_END cancela antes de agendar somente se sessão e seletor permitirem, então reinicia AUTO; REFRESH_LOGIN cancela retomada de LOGIN_END, sincroniza cookies, aguarda 350 ms e carrega o site. `onPageStarted` captura geração; `onPageFinished` e callback diferido rejeitam navegação obsoleta, stopped ou loginPaused. Etapas JS assíncronas verificam geração e pausa. Busca respeita limite de 60 s e AUTO configurado.
4. **PS-078 — sinal explícito + em coordenadas.** `DiagnosticSanitizer.clean()`, `OverlayService.extractCoordinates()` e `dock.html` aceitam `[-+]?` em latitude e longitude. `DiagnosticSanitizerTest` cobre `+23.5505, -46.6333`. Continuar validando limites [-90,90] e [-180,180].
5. **PS-079 — menu sem flicker inicial LTR/RTL.** `OverlayService.menu(boolean)` posiciona primeiro via `updateWindow()`, adia a sincronização interna temporariamente e envia **uma só sincronização** de abertura/fechamento por WebView com lado final; movimentos posteriores continuam sincronizando normalmente.
6. **PS-080 — manutenção pontual.** `probe.js` remove o retorno de sucesso inalcançável logo após falha de IV100. `MainActivity.showBugReportDialog()` substitui a promessa absoluta de privacidade por orientação de revisão antes de compartilhar.
7. **C01/PS-073 e onDestroy — itens herdados do B06.** Catches selecionados geram apenas etapa e classe de exceção. `onDestroy` marca stopped, cancela todos os callbacks, remove três WindowManager views e **somente depois** desliga, remove interfaces JavaScript e destrói WebViews.

## Preservado — sem recursos inventados
IV100 15/15/15, GL#1, UL#1, Shiny sob confirmação do site, filtro geográfico 0–1000km, AUTO 5/10/15/20 min, favoritos/alertas, login/logout e aparência da v0.48. Os novos controles são exclusivamente os solicitados para as notificações e navegação OAuth.

## Qualidade e limitações
Testes estáticos/JS, `DiagnosticSanitizerTest`, Gradle unit tests/assemble/lint, verificação de assinatura, aapt e checksums são feitos no CI; não provam funcionamento real. **Pendente**: login OAuth Google/Discord, Shiny autenticado, localização com sinal +, teclas Voltar, menu em cantos e notificações no Samsung SM-S928B Android 16. Guia atual `docs/GUIA_TESTE_SAMSUNG_v0.49.md` complementa e preserva o roteiro anterior v0.48.

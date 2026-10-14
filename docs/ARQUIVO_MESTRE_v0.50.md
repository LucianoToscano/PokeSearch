# PokeSearch Overlay — ARQUIVO MESTRE v0.50-beta

Data: 14/10/2026. Continuação **sem recomeçar** da v0.49-beta, GitHub main `890dbcbe6313eb5875e4de029f8764cdb087a7b3`. Projeto https://github.com/LucianoToscano/PokeSearch.

## Identidade, ferramentas e limites
- Android applicationId `com.lucianotoscano.pokesearch`, namespace `com.lucianotoscano.pokesearchoverlay`.
- JDK 17, Gradle Wrapper 8.11.1, Android Gradle Plugin 8.10.1, `minSdk=26`, `targetSdk=33`, `compileSdk=36`. `versionCode=50`, `versionName="0.50-beta"`.
- **Manifest, foregroundServiceType, ícones, filtros, visual, B06 e onDestroy anteriores não modificados** salvo verificações de geração nas respostas JS do probe.
- **PvPPokeGo intocado**. Documentação histórica v0.38–v0.49 preservada integralmente em `docs/`.

## Alterações auditadas v0.50
**PS-081 — pedido de permissão no teste de notificação.** Em `MainActivity`, o botão de teste solicita `Manifest.permission.POST_NOTIFICATIONS` com código 203 no Android API 33+ caso necessário. `onRequestPermissionsResult(203)` envia `WatchAlerts.test(this)` automaticamente **apenas se autorização concedida**; senão orienta a habilitar no Android. `PokemonPicker` permanece sem pedido de permissão e orienta o usuário a fazê-lo na Home ou Configurações.

**PS-082 — atualização imediata de Preferências com overlay ativo.** `MainActivity` envia `SYNC_PREFS` somente se `OverlayService.isRunning()`, na seleção de tamanho/ordem e troca de checkboxes, também ao fechar Preferências. `OverlayService.onStartCommand` recarrega `spriteSize`, `sort`, `showTimers` e `alerts`; reordena `results` via `sortItems()`, recalcula dimensões do dock e chama `update()`. **Não dispara refresh da rede**, não altera sessão/OAuth nem configura filtros remotos. Preferência de som WatchAlerts é consultada pelo próprio alerta diretamente do SharedPreferences.

**PS-083 — limpeza do pacote externo atual.** Pasta `Documentacao/` do ZIP `PokeSearch-0.50-beta-PROJETO-COMPLETO.zip` terá somente `ARQUIVO_MESTRE_v0.50.md`, `AUDITORIA_v0.50.md`, `GUIA_TESTE_SAMSUNG_v0.50.md`, `BUILD_PROVENANCE.txt`, `SHA256SUMS-KIT-ORIGINAL.txt` e `PokeSearch-0.50-beta-source.zip`. Todos os históricos seguem sob `PokeSearchOverlay/docs/`.

**PS-084 — catches relevantes.** `PokemonPicker.readCatalog()` registra falha ASSET apenas com etapa/classe; `MainActivity.readAsset()` idem. `OverlayService` registra alguns erros úteis de preparo de localização, consultas de coordenadas e inicialização do login. Conversões numéricas esperadas e falhas comuns de download de sprites não poluem os logs. **Nenhum e.getMessage(), token, URL, cookie, código pessoal ou coordenada privada nos logs.**

**PS-085 — sanitização ampliada.** `DiagnosticSanitizer.clean()` elimina também parâmetros soltos `code`, `state`, `session_id`, `discord_token`, inclusive em fragmentos de query string sem URL completa. `DiagnosticSanitizerTest` inclui regressões específicas. A sanitização por padrões **não é prova absoluta de ausência de dados sensíveis**; revisar TXT antes de compartilhar.

**Verificação de geração nas etapas JS.** `OverlayService.execute()` captura `callbackGeneration=requestGeneration` antes de `evaluateJavascript`; descarta resultados antigos quando geração mudou, `loginPaused` ou `stopped`. Preserva fluxo B06 de LOGIN_BEGIN / LOGIN_END / REFRESH_LOGIN tal qual v0.49. **B06 fechado em código, mas não validado fisicamente.**

## Funções preservadas
IV100 (15/15/15), GL#1, UL#1, Shiny somente mediante confirmação no site, coordenadas e raio 0–1000 km, AUTO 5/10/15/20min, limpeza local de despawn, cooldown de buscas, favoritos, sprite, notificações, login na Home, layout flutuante transparente e recolhimento, relatórios.

## Validação e pendências
CI deve validar JavaScript, probe-smoke, 127+ contratos UX, sanitizer Java, `gradle :app:testDebugUnitTest :app:assembleDebug :app:lintDebug`, apk signing, aapt e hashes. **Não afirmar teste real do Samsung**. Ainda requer validação manual no Samsung **SM-S928B / Android 16**: permissão API33+ concedida/negada e envio de notificações; sincronização de 4 preferências com overlay/menus abertos sem chamadas ao site; login real OAuth Google/Discord e retorno ao app; hidratação/cookies Shiny; corrida com rede lenta; localização positiva/0–1000km; transparência, arraste, UX e memória prolongada. Guia atualizado em `docs/GUIA_TESTE_SAMSUNG_v0.50.md`.

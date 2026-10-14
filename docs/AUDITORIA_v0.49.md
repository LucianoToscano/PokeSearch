# PokeSearch — AUDITORIA v0.49-beta

Base v0.48-beta commit `8d881baa51cf0442a39fe598e0ee242daaa538bd`; atualização 14/10/2026. Todos os documentos históricos preservados.

| ID | Prioridade | Causa | Alteração | Estado |
| --- | --- | --- | --- | --- |
| PS-075 | P1 | UI não oferecia botão para `WatchAlerts.test` | Botão no PokemonPicker e Preferências; toggles `alerts` e `WatchAlerts.PREF_ENABLED`; Toast por permissão/resultado | Implementado; teste Android pendente |
| PS-076 | P1 | KEYCODE_BACK era consumido pelo Dialog, fechando OAuth | `loginDialog.setOnKeyListener` retorna histórico WebView com `website.goBack()`; sem histórico permite fechamento | Implementado; OAuth real pendente |
| PS-077 / B06 | P1 | Timers órfãos de LOGIN_END, onPageFinished e reload disputavam cookies/sessão | Runnables nomeados canceláveis, grupo de cancelamento com 6 callbacks, geração no page start/finish, guards das etapas JS, espera 350ms após flush | Corrigido no código; teste de concorrência real pendente |
| PS-078 | P1 | `+lat,+lon` rejeitado em UI/serviço e escapava do sanitizador | `[-+]?` em três arquivos, teste positivo e conservação das faixas de lat/lon | Implementado; teste navegador Android pendente |
| PS-079 | P2 | `menu(boolean show)` enviava primeiro direita, depois esquerda | Calcula posição primeiro e envia uma sincronização por WebView na transição | Implementado; validar cantos no Samsung |
| PS-080 | P2 | Retorno IV100 morto e aviso absoluto de privacidade | Remove código inalcançável e altera texto para recomendar revisão | Implementado; validação visual pendente |
| C01 / PS-073 | P2 | Alguns catches relevantes ignorados | Logs mínimos etapa + classe nos caminhos revisados; outros catches opcionais preservados | Parcialmente ampliado |
| onDestroy | P1 | Risco de destruir WebView antes de liberar as janelas | `stopped=true` → cancelar handler → remover 3 views → JS interface/detach/destroy | Corrigido no código; teste físico pendente |

## Restrições preservadas
`applicationId=com.lucianotoscano.pokesearch`, namespace `com.lucianotoscano.pokesearchoverlay`, AGP 8.10.1, Java 17, Gradle 8.11.1, minSdk 26, targetSdk 33, compileSdk 36, Manifest sem foregroundServiceType. Ícones, filtros, aparência e PvPPokeGo não alterados além dos novos controles solicitados.

## Testes e segurança
CI: node --check (probe e scripts), probe-smoke, overlay-ux (regressões PS-075–080 e B06), DiagnosticSanitizerTest incluindo sinal `+`, Gradle testDebugUnitTest/assembleDebug/lintDebug, aapt/apksigner e SHA256SUMS verificado. Logs usam apenas etapa + classe (nenhuma URL/cookie/token/código/coordenada). Privacidade por regex não é perfeita; usuário deve revisar relatório TXT.

**Sem testes físicos executados** em Samsung SM-S928B Android 16 ou OAuth real Google/Discord; guia atualizado em `docs/GUIA_TESTE_SAMSUNG_v0.49.md`.

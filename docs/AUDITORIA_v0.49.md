# PokeSearch — AUDITORIA incremental v0.49-beta

14/10/2026. Base v0.48-beta, GitHub main 8d881baa51cf0442a39fe598e0ee242daaa538bd. Foco exclusivo: B06, alguns catches C01/PS-073 e ordem do onDestroy, sem alteração visual ou de Manifest.

## Matriz de correções
- **B06 / PS-075 (P1)** — callbacks anônimos de 1600/2500 ms e cleanup expirado competiam com LOGIN_BEGIN. Agora seis categorias de callbacks são explicitamente canceláveis via cancelSessionCallbacks(); LOGIN_END agenda fallback sob guarda de sessão.
- **B06 / PS-076 (P1)** — carregamento de página obsoleto era capaz de solicitar busca após autenticação. onPageStarted guarda geração; onPageFinished e runnable conferem a mesma geração e loginPaused.
- **B06 / PS-077 (P1)** — REFRESH_LOGIN navegava imediatamente após cookie flush; recarga agora é uma tarefa nomeada de 350ms com geração e estado conferidos. Etapas JS atrasadas verificam sessão antes de tocar WebView.
- **C01 / PS-073 (P2)** — catches selecionados de histórico, detalhes, coordenadas e inicialização de atividades registram apenas classe/etapa; não há gravação de exceções brutas, URLs, cookies ou coordenadas.
- **PS-078 (P1)** — onDestroy agora define stopped, limpa todos os callbacks, remove três views e apenas depois desliga, desanexa e destrói WebViews e suas interfaces JavaScript.

## Escopo não alterado
**targetSdk 33, compileSdk 36, minSdk 26, Manifest SEM foregroundServiceType, ícones e UI não modificados.** Recursos de v0.48 (IV100, GL#1, UL#1, Shiny, localização, AUTO, favoritos, notificações) preservados. PvPPokeGo não alterado.

## Qualidade e limitações
A suíte B06 testa nomes/cancelamentos de Runnables, geração de WebView, 350/1600/2500 ms, prevenção de busca ao pausar e ordem de teardown. Compilar Java/Android, realizar lint e assinar APK no GitHub Actions, validar checksums. **CI não equivale à validação de OAuth Google/Discord real nem ao teste do Samsung SM-S928B Android 16**. Itens devem ser conferidos no dispositivo com docs/GUIA_TESTE_SAMSUNG_v0.48.md preservado. Nenhum relatório deverá conter senhas, tokens, cookies, códigos ou coordenadas privadas; revisar o TXT antes do envio.

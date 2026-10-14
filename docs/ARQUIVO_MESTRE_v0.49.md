# PokeSearch Overlay — ARQUIVO MESTRE v0.49-beta

Atualizado em 14/10/2026. Base v0.48-beta main 8d881baa51cf0442a39fe598e0ee242daaa538bd. Repositório: https://github.com/LucianoToscano/PokeSearch.

## Identidade, continuidade e escopo imutável
Versão v0.49-beta (**versionCode 49**, versionName 0.49-beta). Android applicationId com.lucianotoscano.pokesearch, namespace com.lucianotoscano.pokesearchoverlay. Java 17, AGP 8.10.1, Gradle Wrapper 8.11.1, **targetSdk 33, compileSdk 36 e minSdk 26**. Nenhuma mudança em AndroidManifest, foregroundServiceType, ícones, UI, arquivos HTML/JS, filtros, favoritos, cookies de terceiros, notificações ou outros aplicativos. **PvPPokeGo totalmente separado e intocado.** Preservar documentação e versões anteriores.

## B06 — Race conditions login/refresh, corrigidas no código
- **LOGIN_BEGIN**: loginPaused=true antes de invalidar requestGeneration e searchInProgress. Cancela queuedRefresh, periodic, expiryRefresh e os Runnables nomeados pageFinishedRefresh, loginResumeRefresh e deferredSessionReload; mantém todas as janelas ocultas.
- **LOGIN_END**: loginPaused=false; cancela callbacks restantes antes de agendar loginResumeRefresh após **1.600 ms**, somente com !stopped && !loginPaused && !pickerOpen. Em seguida, chama schedulePeriodic() na cadência previamente escolhida. A próxima REFRESH_LOGIN invalida/cancela essa retomada para não enviar duas consultas.
- **WebView do site**: onPageStarted registra pageLoadGeneration, nunca aceita a navegação iniciada durante login pausado. onPageFinished só confirma loaded e agenda pageFinishedRefresh de **2.500 ms** se o serviço não foi parado, loginPaused é falso e a geração da navegação é igual à atual. O próprio Runnable revalida a geração antes de refresh().
- **REFRESH_LOGIN**: incrementa requestGeneration, libera searchInProgress, invalida carregamento antigo e cancela todos os Runnables. CookieManager.flush() executa antes do carregamento; deferredSessionReload aguarda **350 ms** e confere geração, stopped e loginPaused antes de website.loadUrl().
- Chamadas JS das etapas de pesquisa revalidam geração e pausa antes de iniciar operações/usar respostas antigas. Expiração de Pokémon continua apenas local; cooldown HTTP de 60 segundos permanece.
- Para reinício START_STICKY sem Intent, a navegação inicial do WebView também usa o mesmo carregamento diferido; onCreate deixa de consultar o site imediatamente.

## C01 / PS-073 e onDestroy
- Alguns catches de relevância média (ler/gravar histórico, detalhes, coordenadas e atividades) passaram a registrar somente **etapa e nome de classe** da exceção via recordFailure, sem getMessage(), URL, cookie, token, código ou coordenadas em log. NumberFormatException triviais e catches de JSONObject onde apropriado mantidos.
- Ordem da limpeza: stopped=true, geração invalidada, handler.removeCallbacksAndMessages(null), remoção das três WindowManager views, **só então** stopLoading, remoção da interface JavaScript Native, detach e destroy dos quatro WebViews, com proteção individual de exceções.

## Compatibilidade preservada
IV100 15/15/15, GL#1, UL#1 com pré-evoluções verificadas, Shiny opcional via site PoGoCoordinates, localização 0–1000 km, AUTO 5/10/15/20 min, limite 60 segundos, dados e sprites compactos, favoritos, notificações, login/logout na Home e tratamento de relatórios v0.48 mantidos. Sem features novas.

## Testes e pendências
Os contratos JS, Java, Gradle, lint, assinatura e hashes do kit serão executados no CI; testes físicos **ainda não realizados**. Reproduzir em Samsung SM-S928B Android 16: login Google/Discord real, retorno OAuth, login durante pesquisa pendente, popup de login interrompido, refresh manual paralelo, expiração próxima e rede lenta. Roteiro **docs/GUIA_TESTE_SAMSUNG_v0.48.md** permanece vigente e intacto. Histórico v0.48: docs/ARQUIVO_MESTRE_v0.48.md e docs/AUDITORIA_v0.48.md.

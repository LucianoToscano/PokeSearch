# PokeSearch Overlay — ARQUIVO MESTRE DE CONTINUIDADE v0.45-beta
Data de revisão: 14/10/2026. GitHub: https://github.com/LucianoToscano/PokeSearch
Base v0.44-beta main: 6a01506e7ffb31d802b35c91843cc0af40ac734b. Namespace Java: com.lucianotoscano.pokesearchoverlay; package Android: com.lucianotoscano.pokesearch.
Versão 0.45-beta (versionCode 45); Java 17, Gradle 8.11.1, compileSdk 36, minSdk 26, targetSdk 33 (atualização de targetSdk futura com testes).
Aplicativo totalmente separado de PvPPokeGo; não alterá-lo. Preservar todos os mestres, auditorias e betas anteriores.

## Evidências dos relatórios reais
No Samsung SM-S928B Android 16, relatório v0.42 às 13:22 e v0.43 às 13:34, 13:35 e 13:36 registrou buscas IV100 Shiny OFF com 5 resultados válidos e sem falha. No relatório v0.43 Shiny ON falhou após iniciar a tela de autenticação e retornar. Isso prova apenas que o site não confirmou Shiny; NÃO prova login concluído nem incorreção da conta.
Os intervalos ~60 segundos entre buscas v0.43 eram consistentes com expiryRefresh do serviço, que fazia novas requisições ao expirar Pokémon, independentemente do AUTO em 5 min.

## Recursos preservados
IV100 (15/15/15), GL#1, UL#1 com pré-evoluções, Shiny ON/OFF opcional e estritamente verificado pelo site, localização coordenadas/raio 0–1000 km com confirmação do site, 5/10/15/20 min automático, proteção mínima de 60s, atualização manual, sprite/tamanho P-M-G, detalhes e coordenadas reais, favoritos até 50, alertas, login, relatório de bugs, Pix.
UI v0.44: menu adaptável perto das bordas sem cobrir engrenagem, 12 ícones na ordem, chevron de recolhimento contrastante, painel de favoritos translúcido; manter essas correções intactas.

## Mudanças v0.45
1. Separado o vencimento de Pokémon das consultas de rede: expiryRefresh remove dados expirados localmente e rearma o próximo vencimento sem chamar refresh(). AUTO é o único gatilho periódico normal (além de comandos do usuário e carregamento inicial).
2. Ao iniciar login/vinculação, incrementar geração de busca e cancelar callbacks de atualização adiada para impedir submissões iniciadas na sessão anterior. Ao fechar login, tentar recuperar a pesquisa de modo seguro sem contornar o cooldown.
3. Se o Shiny falhar, distinguir diálogo de vinculação pendente de estado não comprovado; usuário pode desligar ✨ para usar o filtro IV100/GL/UL. O aplicativo nunca apresenta Shiny como confirmado sem leitura explícita do site.
4. Diagnóstico registra apenas categoria de autenticação e flag de Shiny, jamais cookies, credenciais, códigos de treinador ou coordenadas.
5. Ao tocar ↻ durante outra pesquisa, informar corretamente que deve tentar quando terminar, sem afirmar que nova consulta foi colocada na fila.
6. Testes de regressão incluídos para comportamento de expiração, temporização e autenticação.

## Qualidade e limite da entrega
CI deve executar node --check, app/tests/probe-smoke.test.js, app/tests/overlay-ux.test.js, Gradle testDebugUnitTest/assembleDebug/lintDebug, unzip -t, aapt, apksigner e SHA256SUMS. Conferir o SHA exato de main e seu próprio workflow antes de entregar o kit.
Testes físicos continuam pendentes: uso do Shiny com sessão e vínculo reais, AUTO 5/10/15/20 min no dispositivo, expirados desaparecendo sem consultar, controle ↻, menu/gear/seta nos cantos, blur e toque sobre Pokémon GO, filtros de liga e localização 0/50/1000.
APK de CI é debug e pode ter assinatura distinta dos APKs anteriores. Não divulgar como versão estável.

## Arquivos de referência
docs/ARQUIVO_MESTRE_v0.44.md e docs/AUDITORIA_v0.44.md preservam histórico. Auditoria atual: docs/AUDITORIA_v0.45.md.
Google Drive: atualizar novo Mestre, Auditoria, catálogo de bugs e guardar KIT em 01_APKs_Teste. Mestre v0.44: https://docs.google.com/document/d/1ADJ7Ej9NSU1VipKZ4JDEA7gcY77NZQysTqNzhAtU4Z4/edit

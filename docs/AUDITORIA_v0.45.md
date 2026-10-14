# PokeSearch v0.45-beta — auditoria incremental
Data 14/10/2026 | Base: v0.44-beta, commit 6a01506e7ffb31d802b35c91843cc0af40ac734b.

## Evidência do dispositivo
Relatório v0.42-b (SM-S928B Android 16): IV100 Shiny OFF 5/5 resultados válidos. Shiny ON não confirmado.
Relatório v0.43-b: três buscas IV100 Shiny OFF de cerca de 60 segundos de intervalo, 5/5 resultados cada; Shiny ON não confirmado após abrir/fechar autenticação.
Interpretação: sucesso IV100 Shiny OFF confirmado pelos logs. Não existe evidência de vínculo autenticado ou de Shiny ON funcional. Os logs de v0.43 mostram consultas extras acionadas por expiração.

## Alterações de código a verificar
PS-048 | P1 | O vencimento dos Pokémon iniciava consulta extra a cada expiração, confundindo AUTO | Retirar refresh(false) de expiryRefresh, atualizar a lista e rearmar vencimento restante. | Código corrigido; teste CI e Android pendentes
PS-049 | P1 | Login poderia continuar callbacks antigos e submetê-los durante autenticação | Invalidar requestGeneration, liberar searchInProgress, cancelar queuedRefresh durante LOGIN_BEGIN; retomar com verificação após LOGIN_END | Código corrigido; Android pendente
PS-050 | P1 | Shiny não confirmado era comunicado sempre como falha de login/vínculo | Mostrar mensagem específica se há diálogo pendente; em outros casos afirmar apenas não confirmação no site | Código corrigido; vinculação real pendente
PS-051 | P2 | Falta contexto seguro de autenticação no relatório | Registrar somente status de sessão (autenticada/login necessário/não confirmado) e Shiny solicitado | Código corrigido; revisar relatório físico
PS-052 | P2 | Mensagem ↻ dizia que aguardaria, sem de fato enfileirar | Informar para tocar novamente quando busca atual terminar | Código corrigido; teste físico pendente
PS-053 | P2 | Vínculo do site pode aparecer em inglês | Detectar expressões de link/connect account no DOM, sem capturar dados sensíveis | Código corrigido; site real pendente

## Registros de teste
Testes JS e Android CI executados no GitHub Actions serão documentados por run/commit quando disponíveis. CI não equivale a teste real de sessão no PoGoCoordinates ou interação no Android.
Verificar AUTO sem consulta por vencimento, limites de 60s, Shiny OFF (busca livre de vínculo), Shiny ON com site real, formulário local 0/50/1000, performance de menu e favoritos.
Não alterar PvPPokeGo. Preservar documentação v0.44.

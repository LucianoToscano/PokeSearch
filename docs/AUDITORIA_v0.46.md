# PokeSearch — Auditoria incremental v0.46-beta (14/10/2026)
Base GitHub main v0.45 a2a8beb4dad3d35f55e993195d7e4f2107f34fe2. Relatos e capturas reais do Samsung SM-S928B Android 16.

## Itens tratados em código, teste físico pendente
PS-054 P0 | Botões IV100/AUTO/📍 visíveis mas popups recortados | CSS html.controls-root/body.controls-window overflow visible, resizeMenu proporcional | Teste Playwright simulado; Samsung pendente.
PS-055 P1 | Engrenagem escondida por controles e toque pequeno | fundo e alvo 35x30; menu responsivo | Playwright/contrato; Samsung pendente.
PS-056 P1 | Chevron pequeno/sem fundo | 40x32, fundo escuro sólido e borda clara | CSS/Playwright; Samsung pendente.
PS-057 P1 | Ícones não invertiam ao trocar lateral | CSS RTL do grid ao lado esquerdo; updateMenuPosition envia syncMenu ao WebView do menu e dos sprites | Teste estrutural; Samsung pendente.
PS-058 P1 | AUTO/Modo pareciam inativos após clique | resposta visual imediata e confirmação de Android; feedback ↻ e cooldown | Testes JS de evento; site/Android pendente.
PS-059 P2 | Favoritos visualmente sólidos | gradiente translúcido, remove scrim de fundo e suaviza blur | Teste de contrato; transparência visual no Samsung pendente.
PS-060 P0 | Login da Home iniciava OverlayService, revelando site por trás | chamada de login condicionada a OverlayService.isRunning; não criar serviço novo para autenticar | Código/teste; Android pendente.
PS-061 P1 | Login concluído permanecia na página PoGoCoordinates | detectar site autenticado e fechar diálogo no login da Home; para Shiny aguardar verificação real ou botão ✓ PokeSearch | Código/teste; OAuth real pendente.
PS-062 P1 | Login/logout indisponíveis na tela inicial | novos botões Entrar/vincular e Sair + status, confirmação para logout | Código/teste; Samsung pendente.
PS-063 P1 | Logout seguro | interromper coleta e apagar cookies/WebStorage locais, preservando favoritos e preferências; não sair do provedor OAuth global | Código/teste; Samsung pendente.
PS-064 P2 | Resizes redundantes | cache de geometria da toolbar e fit limitado a quadro | Contrato/Playwright; medição física pendente.

## Evidência automatizada
Simulação Chromium em viewport 312/333/396px: popups 100%, GL#1, AUTO 15m, coordenadas -23.5505,-46.6333 raio 50 e grid de 12 botões. Contratos UX e smoke testes; não é validação Android real.
CI GitHub deve passar gradle unit tests, assembleDebug, lintDebug, aapt, apksigner, sha256sum. Anotar run SHA de main na entrega.
Pendências não encerradas: login Google/Discord em OAuth externo, retorno ao aplicativo, Shiny vinculado, transparência Favorites e toques sobre o jogo, localização 0/50/1000 no site real.
Não alterar PvPPokeGo. Não registrar informações de conta, códigos, cookies ou coordenadas pessoais nos documentos.

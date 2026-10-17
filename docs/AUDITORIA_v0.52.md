# PokeSearch v0.52-beta — Auditoria incremental
## Baseline
Branch de recuperação: `backup/v0.51-beta-before-customization-20261015`. Branch de trabalho `feature/v0.52-custom-overlay-20261015`. Fonte original v0.51 preservada. Versão publicada ainda depende do resultado de CI.
## Alterações a verificar em CI
1. Java: compilação de `MainActivity` com preferências home, transição menu e filtro; `OverlayService` com atualização do painel, intervalos e JSON.
2. HTML/JS: `dock.html` com duas orientações, switches, indicador de rank opcional e layout compacto; `probe.js` com IV e Top 50; validação sintática Node.js e smoke tests.
3. Integração: Shiny only real do PoGoCoordinates, autenticação, pesquisa CP/nível, PvP com posições conhecidas e número de spawns; não assumir DOM idêntico sem validação em dispositivo.
4. Estabilidade: cliques perto da borda, pop-up vertical, overlay com botões ocultos, arraste de engrenagem, retorno do login, race de pesquisas, Android 15/16 e fechamento do serviço.
5. Segurança: preservar autenticação pelo site oficial, não registrar cookies, senhas, tokens ou código de amizade. CI release gera certificado efêmero; requer chave persistente segura para atualização sem desinstalação.
## Limitações transparentes
A criação do código não comprova execução correta no dispositivo. Filtros do site podem mudar e requerem tratamento de DOM e confirmação da configuração. Filtros VIP somente com autorização real da conta. Nenhum dado geográfico ou rank não comprovado deve ser fabricado. O APK deve ser testado antes de ser compartilhado como release estável.

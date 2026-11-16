# PokeSearch — ARK LT374 | Continuidade do tutorial interativo
Base oficial: LT371 0.03.67 / 54574. PR LT372 #452 permanece draft separada. O trabalho de tutorial está na branch `feature/lt373-interactive-overlay-tutorial-20261116` (ainda não publicada).

Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT373_TUTORIAL_INTERATIVO_COACHMARK_20261116.md`, `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md` e o código `OverlayGestureTour.java`, `OverlayService.java`, `RareCandyOverlayService.java`, `PgsAutoClickService.java`, `dock.html` e `MainActivity.java` da branch.

**Próxima tarefa:** avaliar os runs de CI da PR LT373; corrigir compilação/contratos e aprovar somente após 7/7 gates green no mesmo SHA, com R8/assinatura oficial e evidências Android reais. Homologar Android 11/13/14 com P1 e P2 simultâneos, Doce Raro e Busca Pokémon, densidades P/M/G, modo claro/escuro, menu compacto/vertical e refresh ↻ mesmo com ordem personalizada. A camada escurecida deve deixar somente o alvo real claro e não bloquear toques no jogo; se houver comportamento de segurança do Android, priorize gestos reais, diminua opacidade ou interrompa tutorial com orientação, nunca interceptar comandos do usuário nem simular toques.

Checar P1/P2 resultado inicialmente aberto/fechado; avançar só após estado real observado. Segurar 600ms abre menu; tocar fecha; reabrir e segurar ↻ abre períodos; nenhum novo intervalo aplicado automaticamente. No Doce Raro, toque com menu aberto o recolhe. Na Busca Pokémon, long press abre painel único; não ensinar toque curto como simples visualização de resultados, pois esse gesto pode ativar busca.

Salvar screenshots/logs reais de cada passo em T01-T11 do relatório LT373. Verificar TalkBack, botões de Pular/Rever e redução de movimento. Usar uma única instância global do coachmark; evitar obscuração acima de 0,8 entre overlays. Confirmar que as pontes locais nunca são expostas a URLs externas, não copiar binários de terceiros.

Preservar todas as funcionalidades e estados anteriores; não inventar APK homologado. Se o físico for BLOQUEADO, manter a PR draft, atualizar AGENTS/Guia/ARK e gerar prompt seguinte, sem merge ou Release. Versão oficial só incrementa >54574 depois de aprovação integral.

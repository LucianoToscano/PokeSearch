# LT304 — Assistente de Reides: primeira etapa (07/11/2026)

## Base e histórico
- Base: `main` do PokeSearch LT303, SHA `1e477dcc83ad7d4bbfb3df9f3fc05e312eadbf37`.
- Origem da proposta: PR #290 (`feature/raid-assistant-activation`), aberta como rascunho antes da LT303; **não mesclar a PR antiga diretamente**, pois estava 25 commits atrás.
- Novo desenvolvimento: `feature/lt304-raid-assistant-from-lt303`, preservando todas as alterações de cards, setas, ranks, flags e ícones publicadas até LT303.

## Escopo do primeiro incremento
1. Ícone provisório enviado pelo usuário — passe laranja/azul — salvo como PNG em Base64 em `app/src/main/assets/raid_assistant_icon.b64`, sem substituir outros ícones.
2. Novo controle independente na Home, ao lado do atalho Doce Raro, com estado de ativação.
3. Serviço `RaidAssistantOverlayService` com janela de 45 dp, arte transparente, toque abre/recolhe painel, arraste reposiciona, toque longo abre o guia.
4. Painel compacto e escuro com instruções, ✓ Confirmar, ← Voltar, pausa/retomada e progresso.
5. Persistência local de índice, estado final, pausa e posição; restauração ao reabrir.
6. A primeira versão é **manual e educativa**. Não lê Pokémon GO, não altera localização, não verifica passes ou recompensas e não automatiza o jogo. O roteiro deixa claro que métodos de fusos e exploits são não garantidos e podem violar regras do jogo.

## Limites e QA obrigatório
- Não compartilhar dados de sessão, cookies, treinador, coordenadas ou API com overlays P1/P2/Doce Raro.
- Não reivindicar reconhecimento automático de telas neste incremento. Para futura captura de tela, exigir consentimento explícito por sessão, indicadores visíveis de captura, detecção restrita e estado incerto quando a evidência faltar.
- Verificar que P1, P2 e Doce Raro continuam funcionando e permanecem independentes.
- Verificar a Home em Samsung (espaçamento, 5 atalhos de cabeçalho, toque e nomes de acessibilidade), ícone 45 dp e painel em bordas de tela.
- Validar fechamento pelo centro de notificações, pausa e retomada, múltiplos toques em Confirmar, recarga do serviço, minSdk 26 e targetSdk 33.
- CI: regressão Node, Java Android, OTA e testes do novo recurso.
- **Não fazer merge, publicar APK ou registrar homologação física como concluída até os testes e a avaliação do release.**

## Fases posteriores
- Motor de passos configuráveis (evento, fuso local e cronologia, sem prometer passes extras).
- Ações de corrigir/retornar, opção “Não aconteceu” e histórico detalhado por roteiro.
- Detector visual opcional com autorização explícita, confiança verificável e fallback manual.

# LT304 — Assistente do Dia de Raides (tutorial "Bug dos Passes")
Data de registro: 07/11/2026

## Identidade e escopo — definição do usuário
O novo ícone laranja e azul corresponde **exclusivamente ao Assistente do Dia de Raides**, também chamado pela comunidade de "Bug dos Passes". **Não** é um assistente genérico de Raides. É um guia flutuante do roteiro demonstrado no vídeo https://youtu.be/S0cTvtaMim0, com confirmações manuais e orientação para não se perder nas etapas.

## Base segura
- A branch `feature/lt304-raid-assistant-from-lt303` parte de `main` LT303, commit `1e477dcc83ad7d4bbfb3df9f3fc05e312eadbf37`.
- A PR #290 é um protótipo antigo sobre LT295 e **não deve ser mesclada diretamente**; o trabalho útil dela foi portado e atualizado na PR #300.
- Preservar integralmente os overlays P1/P2/Doce Raro, rankings, flags, evolução e demais mudanças publicadas na LT303.
- Classe nativa: `RaidDayAssistantOverlayService.java`; ícone provisório do usuário: `app/src/main/assets/raid_assistant_icon.b64` (PNG transparente).

## Tutorial específico — exemplo do vídeo, 30 e 31/10/2026
O exemplo do vídeo é **histórico** e não deve ser tratado como previsão para um futuro evento. A ordem informada pelas capturas do vídeo foi:
1. Preparação: conferir regras oficiais, evento, data, passe já usado e restrições.
2. Véspera no Havaí: referência do autor, **30/10 às 22h de Brasília**; coordenadas `21.2709423,-157.818172`; fechar e abrir o jogo manualmente, sem alteração realizada pelo PokeSearch.
3. Aguardar aproximadamente um minuto e verificar carregamento da tela.
4. Nova Zelândia: `-41.282491,174.769132`; conferir se existe de fato passe gratuito e, se sim, concluir uma reide.
5. Retornar ao Havaí: conferir se o passe apareceu.
6. Caso tenha um novo passe confirmado **pelo usuário no jogo**, repetir o ciclo a partir da Nova Zelândia com o botão **Repetir ciclo**; caso contrário, usar **Sem passe → evento**. Repetições salvas são *ciclos*, não passes.
7. No dia do evento, verificar sua janela real e região.
8. Etapa opcional apresentada pelo vídeo: Kiribati, `1.987149,-157.477137` e espera de aproximadamente um minuto.
9. Retornar ao local do evento e verificar no próprio Pokémon GO passes realmente disponíveis.
10. Resumo manual e finalização.

## Comportamento no app
- Botão na Home com estado ativado/desativado e rótulo público **Assistente do Dia de Raides**.
- Ícone de 45dp flutuante, arrastável e recolhível, com janela compacta, leve e independente.
- `✓ Confirmar`, Voltar e Pausar; estado local persistido. 
- `📋 Copiar coordenadas` aparece somente onde há coordenadas no roteiro; copiar **não altera a localização do jogo**.
- `↻ Repetir ciclo` aparece somente no checkpoint adequado; `Sem passe → evento` permite sair da repetição quando nada foi obtido.
- Roteiro e contagem não são evidência de concessão de recompensas; na primeira versão **não há reconhecimento automático de tela**, automação de reides, teleporte, validação de passes ou acesso a dados privados do Pokémon GO.
- Avisar que o método é um relato não confirmado e pode violar os termos do jogo; cooldown não garante ausência de punições.

## QA e publicação
- Testes Node do assistente, Node full, Java core/compile, OTA; verificar correspondência de classe com Manifest.
- Teste físico Samsung S24 Ultra: ícone, toque, arraste, painel junto às bordas, cópia manual, repetição, sem passe, pausa, persistência, retorno, convivência com P1/P2/Doce Raro.
- PR #300 permanece em draft até validação; **sem merge, APK assinada ou release** antes da homologação.
- Próxima fase: reconhecimento visual opcional com consentimento explícito por sessão, evidência confiável e fallback manual; não alterar localização nem clicar no jogo.

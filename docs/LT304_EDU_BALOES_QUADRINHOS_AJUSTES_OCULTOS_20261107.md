# LT304 — Edu com balões de quadrinhos e ajustes ocultos
**Data:** 07/11/2026 · **Origem:** solicitação após publicação LT304
**Base:** `main` `bc4453a2fa0fae068b49c43857cfa978da0dbd79`; Release oficial `v0.03.04-54510` continua inalterada.

## Decisões de usabilidade
- **Conversa primeiro:** fala do Edu em balão branco/opaco, texto escuro, borda cinza fina, cauda discreta estilo quadrinhos e sombra sutil. A moldura externa mantém transparência glass; a tipografia e o balão não ficam translúcidos.
- **Configurações invisíveis durante o tutorial:** remover o botão `⋯` da barra da conversa. Não exibir seleção de tamanho, animação, calendário ou leitura visual entre as perguntas ou ações de etapa.
- **Acesso secundário pela sprite:** segurar o treinador **1,2 segundo** sem arrastar abre os ajustes existentes; toque curto abre/recolhe a conversa e arrastar reposiciona. Recolher a janela descarta o modo de ajustes, para a próxima abertura voltar à fala do Edu. Essas ações não avançam etapas.
- **Sem regressão de preferências:** G=100 pixels físicos continua tamanho padrão. P=50/M=75 e outras preferências salvas permanecem disponíveis no modo de ajustes oculto, sem resetar valores.
- **Respostas:** manter no máximo 2–3 escolhas contextuais e uma fala por etapa. Rotinas de treino, eventos reais, histórico, reides, permissões de tela e avisos permanecem conforme LT304.
- **Privacidade:** quando a leitura visual é solicitada no modo real, recolher a janela e esconder a sprite antes da autorização Android; restaurar somente a bolha. OCR continua sugerindo sem avanço automático.

## Arquivos de código alterados
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/RaidDayAssistantOverlayService.java`: estilo balão quadrinhos, botões claros, remoção `⋯`, gesto prolongado de 1200 ms, retorno à conversa após recolher e opacidade máxima da janela (glass no fundo da moldura).
- `app/tests/lt304-edu-conversation-ui.test.js`: contratos de ausência do botão, toque longo, estilo, cauda e retorno à conversa.
- `app/tests/lt304-raid-assistant-icon-guide.test.js`: contrato da janela opaca para não esmaecer balão/texto.

## QA pendente — não declarar homologação
- [ ] Verificar no Samsung se o balão está realmente branco, com texto preto legível sobre cenários claros/escuros do Pokémon GO.
- [ ] Verificar se a pequena cauda aponta visualmente para o Edu em ambos os lados da tela; ajustar se necessário.
- [ ] Toque curto, arraste e toque prolongado (~1,2 s) devem ser independentes e sem abrir ajustes acidentalmente durante o movimento.
- [ ] Recolher e reabrir volta à conversa normal; tamanhos e posições persistem; tamanho G padrão não muda.
- [ ] Comparar altura da janela/rolagem de preparação e das 11 etapas com fonte normal e ampliada.
- [ ] Validar autorização MediaProjection no Samsung, inclusive cancelar/voltar, sem sobreposição.
- [ ] Testar coexistência com Pokébola primária/secundária e Doce Raro.
- [ ] Conferir testes Node/Android/OTA e GitHub Actions do PR depois do commit; este arquivo não afirma sucesso antecipado.

**Governança:** alteração apenas em branch/PR, sem merge, Release, versionCode novo ou publicação de APK sem autorização explícita. O “Bug dos Passes” permanece relato comunitário sem garantia; PokeSearch não automatiza o jogo.

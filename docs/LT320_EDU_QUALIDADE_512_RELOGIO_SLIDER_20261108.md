# LT320 QA — Edu mais legível, 8 momentos e transparência (08/11/2026)

## Motivação
Captura real de Samsung LT319 mostrou a sprite do Edu pequena e sem qualidade suficiente, especialmente olhos, apesar de P100/M150/G200. O usuário pediu recuperar a legibilidade e as referências de imagem de 512px, simplificar o painel do relógio e colocar os ajustes P/M/G e transparência do balão por slider na mesma tela.

## Descoberta importante sobre a fonte
O repositório contém os 68 quadros corrigidos em uma grade **128×128 por quadro** (`edu_avatar_uniform_68_lt316.b64`, 1024×1152). **Não contém os 68 originais 512×512**. Não é correto dizer que uma ampliação recupera detalhes que não estavam no original. Não redesenhar automaticamente todos os quadros a partir de screenshot pequeno, sob risco de alterar rosto, óculos, equipamentos e poses.

## Implementação efetiva na PR #320

1. **Amostragem de exibição 512px, não novo original:** `EduSpriteAtlas.frame()` conserva toda a arte 128×128 e prepara, sob demanda, uma representação ampliada de **512×512 pixels** com alinhamento do pixel original. A redução final da representação para P100/M150/G200 é filtrada para reduzir serrilhado excessivo. `LruCache<Integer,BitmapDrawable>(8)` limita memória transitória a aproximadamente 8 MiB, sem inserir imagens duplicadas no APK. Se ocorrer `OutOfMemoryError`, utiliza o original 128 como fallback; o cache 512 é liberado ao encerrar. Esta técnica melhora a amostragem, mas **não substitui a produção de 68 artes-mestres reais de 512px**.
2. **Relógio em uma tela:** `EduClockSettingsActivity` exibe o relógio existente e **oito momentos rápidos com toque direto** em uma grade de 2 colunas: 24h antes, 1h antes, 10min antes, 10s antes, início, 2h depois, 10min antes do fim e 10min após fim. **Sem modal de momentos**. A API `EduEventMomentPresets.forWindow` conserva os 17 valores historicamente definidos para compatibilidade e testes de outros recursos.
3. **Tamanho na mesma tela:** seleção clara `P · 100`, `M · 150`, `G · 200`, preservando o padrão M da LT319 e migrando escolhas antigas somente se ainda não houver a marca de migração. Os valores são persistidos em `raid_assistant_overlay` e aplicados à sprite flutuante em tempo real pela mesma `SharedPreferences.OnSharedPreferenceChangeListener`.
4. **Transparência do balão:** slider **0–60% transparente**; 0=branco sólido e 60=balão mais translúcido. A preferência `edu_speech_opacity_percent` guarda **opacidade 100–40%**, mas a UI mostra transparência para ser intuitiva. `EduSpeechDrawable.setAlpha` altera o fundo e borda; `panelParams.alpha=1f`, texto, links e a sprite mantêm opacidade total. Aplica imediatamente e persiste ao reiniciar.
5. **Remoções sem perda de funcionamento:** os momentos intermediários pouco usados foram removidos apenas da UI principal; a entrada duplicada de tamanho no menu oculto legado ainda existe por compatibilidade, mas a tela de relógio é o local principal de ajuste. Preservados fuso/24h em `Mais opções`, relógio único, todas as fases do evento, E01–E11, overlay P1/P2, Doce Raro e OTA/assinatura.

## QA / riscos

- Teste novo `app/tests/lt320-edu-quality-inline-settings.test.js`: verifica 512 sob demanda, cache limitado, ausência de modal, 8 momentos, tamanho P/M/G e opacidade apenas do fundo.
- Contratos LT316/LT319 atualizados para o novo painel; regressões Node, LT169, LT211, Java LT62 e OTA LT173 devem passar no último HEAD antes do merge.
- **QA visual físico Samsung pendente**: conferir os olhos e os contornos em P100/M150/G200, movimentos longos, rolagem do balão, tamanho via menu, transparência 0/30/60%, funcionamento do contador em 10s e ausência de piscadas/desfoque. Se ainda houver defeito de olho na imagem original, obter o(s) arquivo(s)-mestre 512 do usuário e só então trocar a arte, preservando as 68 poses.

**Estado do documento:** PR de QA, sem declarar versão publicada/instalada até confirmar workflow oficial e digest de Release.

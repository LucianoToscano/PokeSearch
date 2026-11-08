# LT312 — QA integrado: relógio, escala e coleção 67 (08/11/2026)

## Evidência no Samsung
Screenshot `1000885045.jpg`: relógio Edu manual **30/10/2026 11:07** (Brasília) e preparação antiga **07/11/2026** em “Qual é o Dia de Reides?”. Problema: o relógio `EduEventClock`, a janela em `RaidDaySchedule` e a data em `RaidDayPreparation` não eram sincronizados e salvar a janela zerava a confirmação da data. O relógio em 30/10 11:07 **não** é início do evento em Brasília (nem Kiribati), e sim véspera: Mega Chandelure 31/10/2026 14–17h **locais**.

## Correções LT312
1. Novo `EduEventSelection` coordena três fontes: seleciona automaticamente o **exemplo histórico** Mega Chandelure quando o relógio Edu foi ajustado manualmente para **30/10, 31/10 ou 01/11/2026** e não existe outra janela configurada. Não interfere em relógio automático nem sobrescreve eventos personalizados.
2. Janela persistida é autoritativa: a data selecionada na configuração sincroniza `raid_day_prep_v2_answer_0` e `edu_event_date_confirmed_key`, sem obrigar o usuário a tocar nos botões ±1/±7 dias novamente.
3. Se existe **outro evento configurado**, e o relógio manual chega perto de Chandelure, o Edu oferece **Usar Chandelure / Manter evento**; não apaga escolha explícita.
4. O clique no botão de **exemplo oficial** salva imediatamente a janela; mudar região do exemplo também salva. O estado agora tem rótulo PT-BR, sem mensagem confusa UNKNOWN/BEFORE/ACTIVE.
5. O serviço detecta alterações durante o uso via `clockPulse`, troca data, região e sprites e preserva registros de sessões antigas.
6. **Nunca** gera, confirma nem conta passes, reides, coordenadas ou resultados; horário ajustado manualmente não altera Pokémon GO ou GPS. Limites locais: 31/10 14h inclusive, 17h exclusivo.

## Sprites / memória
- Mantém atlas original LT309 de **62 quadros** intacto, junto do fallback LT304.
- Novo `app/src/main/assets/edu_avatar_extra_5.webp` **12.374 bytes**, 640×128, 5 quadros RGBA em WebP lossless, SHA-256 **cfcccdc0981899200073da63bb0ba6e61396fc7e575656304acf5f1c041cd933**, Git blob `1a8d7060fc588bf507c51a1b0002259d77d5508f`.
- Total **67 quadros**, 22 poses ociosas: 1 parado, 4 Pokébola, 4 frente, 4 direita, 4 esquerda, Shiny, Jogando 01/02, armadura normal/Shiny.
- Os quadros são normalizados por altura do **corpo** de 112 px dentro da célula de 128 px; pés no mesmo eixo Y; o acessório Pokébola não obriga o corpo a encolher; cores e pixel art sem blur. P/M/G 50/75/100 preservados.
- A rotação ociosa só ocorre com **balão fechado**, após 6,5 segundos sem toque, com sequência completa e intervalo de 5,8 segundos. Drag, toque, aviso e balão interrompem idle. Extras são opcionais para garantir compatibilidade com versão antiga.
- Alerta do Edu não equivale a confirmação de evento real no jogo.

## QA
- `lt312-edu-fixed-idle-scale.test.js`: escala e indexação preservadas.
- `lt312-edu-event-autosync-idle.test.js`: relógio, autosseleção condicional, transições regionais, pausa, animações.
- `lt312-edu-assets-67.test.js`: valida bytes WebP lossless, dimensões, SHA, 5 quadros, fallback e indexação.
- `lt311-edu-event-regions.test.js` adaptado para verificar sincronizador sem reduzir garantias.
- Exige CI Node full LT169, QA LT211, compilação Java LT62, OTA LT173 e pipeline oficial de APK assinado. Só depois da publicação usar no Samsung; QA física continua pendente.

## Continuidade
- Base oficial anterior: LT311 0.03.11/code 54517.
- PR de trabalho: https://github.com/LucianoToscano/PokeSearch/pull/311
- Não publicar automaticamente sem todos os testes verdes, manter assinatura original, preservar o relógio único, telas P1/P2, Doce Raro e login.

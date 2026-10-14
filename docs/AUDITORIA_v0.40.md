# Auditoria e correções — PokeSearch v0.40-beta
**Base:** v0.39-beta, capturas fornecidas pelo usuário em 14/10/2026.

| Código | Gravidade | Bug / alteração | Solução no código | Teste físico |
| --- | --- | --- | --- | --- |
| PS-017 | Alta | Caixa de login tinha rodapé Android `CANCELAR/VOLTAR AO OVERLAY` e cobria página/site/teclado | Dialog full-screen escuro, só `✓ Voltar` na barra superior, WebView ocupa o restante; resize do teclado | Pendente |
| PS-018 | Alta | ★ favoritos abria tela inicial por `EDIT_WATCH_LIST` | `PokemonPicker.show(Context,...)` com diálogo `TYPE_APPLICATION_OVERLAY` e retorno ao jogo | Pendente |
| PS-019 | Média | 100%/GL/UL e AUTO mudavam com cliques sucessivos, sem opções visíveis | Painel popover compacto sob o menu; modo e intervalo explícitos | Pendente |
| PS-020 | Alta | Desligar Shiny não devia mudar o modo; bloqueio de 60s deixava usuários sem resultados | `shiny()` preserva `mode`; refresh agendado após término do throttle | Pendente |
| PS-021 | Baixa | Falta de instruções no primeiro uso | Guia rápido automático e atalho na Home | Pendente |

## Cobertura verificada estaticamente
- `app/tests/probe-smoke.test.js`: parser e filtros IV, GL e Shiny.
- `app/tests/overlay-ux.test.js`: picker no overlay, escolha de filtros e intervalos, login sem rodapé, throttle.
- `Android lint`, compilação Gradle e apksigner v2 são exigidos pelo CI.

## Testar no Samsung
- Abrir guia e confirmar que não reaparece sempre.
- Ativar overlay e abrir modo => popup abaixo; selecionar GL#1, voltar, selecionar IV100; menu AUTO 5/10/15/20m.
- ★ abre seletor com teclado para buscar espécie, adiciona ★ e volta ao Pokémon GO sem abrir tela inicial.
- ✨ abre login em tela limpa sem rodapé Android; Google/Discord e código de amizade devem receber teclado.
- Desligar ✨ mantém modo selecionado; tenta busca sem Shiny ao expirar espera segura de 60s.
- Repetir com teclado e menu à direita/esquerda, em telas de dimensões diferentes.
- Exportar bugs via ⚠; conferir que log não contém senhas ou cookies.

**Não alegar teste físico ainda não feito.** CI verde e assinatura verificável não provam sucesso do fluxo de autenticação de terceiro. APK permanece beta para amigos testadores com possibilidade de certificado debug diferente.

## PS-022 — Sprite overlap e espaçamento aparente irregular
**Prioridade P1.** Cada sprite `M` tinha 45dp, mas o cálculo antigo permitia 40dp por linha; figuras grandes se sobrepunham e figuras com transparência interna pareciam distantes. `OverlayService.rowDp()` agora usa `spriteSize+10`; `dock.html` aplica `flex:0 0 var(--row)` e rolagem `overflow-y:auto` limitada à altura útil do display. **Status:** corrigido no código; teste visual Android real pendente.

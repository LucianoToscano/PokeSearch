# ARK LT375d — Revisão Minior, medidas, desfoque e tutorial
Data: 16/11/2026. Branch de QA `fix/lt375-pokeball-background-sort-more-ui`; PR #454. **Nenhum APK oficial novo foi publicado.** A versão pública permanece LT374 `0.03.68 / 54575`.

## Evidências fornecidas
1. Captura do overlay mostrando Minior com arte visivelmente menor que os outros Pokémon; manter a posição, espaçamento e artes das outras sprites.
2. Editor Visual com medidas `34×30 px` repetidas comprimidas nos botões e `38×258 px` sobre o rodapé da lista de Pokémon.
3. Tutorial da Pokébola 5/6 com círculo deslocado em relação ao ícone e mão de aparência confusa. Pedido: tutorial somente na Pokébola por enquanto, não em Busca Pokémon.

## Auditoria de causa
- `dock.html` continha **redução exclusiva a 0.67** para Minior, contra 0.86 para os demais, além de imagens provedoras de transparência interna cuja geometria pode ser indecodificável no WebView; outras espécies permanecem iguais.
- `visual_editor.js` gerava a string longa `34×30 px` sobre cada tile ~34px e a mesma legenda na janela de resultados estreita; isso comprimia ou sobrepunha as inscrições, sem relação com o tamanho dos elementos.
- A Pokébola é desenhada com PNG de até **21dp** centralizada num hitbox nativo maior. O guia capturava o **hitbox inteiro** e desenhava coordenadas `getLocationOnScreen` sem converter para o espaço local do canvas; status/navigation insets podiam deslocar o círculo.
- O gesto da mão era um path muito grande com anatomia indefinida.
- O slider `menuBlur` só alterava CSS `backdrop-filter`. Android WebView não pode capturar pixels de outro aplicativo para aplicar blur CSS. Em Android 12+ há um efeito nativo opcional `FLAG_BLUR_BEHIND` e `WindowManager.isCrossWindowBlurEnabled()`; o SO pode desativá-lo. Atenção: **o efeito nativo pode abranger todo o conteúdo atrás da janela, não somente o tile**. Em Android 11 e aparelhos sem suporte, preservar contraste/transparência e comunicar indisponibilidade. API oficial: https://developer.android.com/reference/android/view/WindowManager.LayoutParams e https://developer.android.com/reference/android/view/WindowManager .

## Correções LT375d na PR #454
- **Minior:** normalizar artFit para 0.86 como outras espécies; correção temporária limitada `--tile-alpha-zoom:1.65` somente para Minior sem dados de alpha medidos. Medição exata nativa/provedor sempre pode substituir. **Não alterar URL, espécie, variante, shiny, PNG original ou tamanho das demais sprites**.
- **Medidas:** rótulos compactos `34×30` nos tiles, fonte monoespaçada pequena e legível; medidas completas somente nos painéis com largura suficiente. Eliminar faixa preta de medição sobre a última sprite, sem mudar geometria, hitbox, escala ou padding.
- **Desfoque:** controle `menuBlur` validado no Android; habilitar/desabilitar blur real no menu nativo apenas em API 31+ quando cross-window blur habilitado. Valor default de **transparência de menu 50%** mantido, bem como preferência do usuário. Mostrar aviso de fallback quando sem suporte. Nunca usar captura de outro app nem permissões de tela.
- **Tutorial:** somente P1/P2 inicia automaticamente. Doce Raro e Busca Pokémon preservam código/gestos, mas não disparam coachmark automático neste ciclo. Preferências > Rever agora ativa apenas tutorial da Pokébola, com **Pular**, mesma chave compartilhada `gestureCoachV3PokeballCompleted`.
- **Círculo:** usar retângulo do ícone visível (21dp) centralizado no hitbox da Pokébola, e converter coordenadas absolutas de tela ao canvas. Idêntica correção de referencial para o ícone ↻ do menu (WebView próprio). Mão vetorial redesenhada, menor e com indicador/nó de dedo bem definido.

## Matriz de QA
| Teste | Critério | Estado inicial |
| --- | --- | --- |
| Node LT375d + LT373 | contratos nativos/JS e regressões de onboarding | **PASS código 2e61ea3 (16/11/2026)** |
| Node LT169 + core LT211 | resto dos menus, templates, filtros e editor | **PASS código 2e61ea3 (16/11/2026)** |
| Java LT62 | Android compila depois de `setBlurBehindRadius` | **PASS código 2e61ea3 (16/11/2026)** |
| OTA LT173 e APK QA PGS | mesmo commit, assets e build debug íntegros | **PASS código 2e61ea3 (16/11/2026)** |
| Android 11 | desfoque não nativo e aviso correto, sem travar | Pendente físico |
| Android 12/13/14 | blur nativo opcional, resposta ao slider, 50% alfa | Pendente físico |
| P1/P2 e editor P/M/G | alvo do círculo, apontador, medidas legíveis | Pendente físico |
| Minior em formas/verificações distintas | tamanho visual consistente e identidade intacta | Pendente físico |
| Tutorial SEARCH/CANDY | não aparecerem automaticamente | Pendente físico |
| Segurança do toque | máscara não rouba toques / Pular funciona | Pendente físico |

A revisão por código e CI não substitui capturas reais de um aparelho Android. Não declarar validação física nem publicação de APK assinado antes da evidência.

## ARK / Rollback
Não alterar `release/official-request.json`, versionCode, certificados, cadeias P1/P2, rotinas de captura ou dados de conta. Correções da mesma PR sobre Localização, Favoritos, Personalização, Background, Ordenar e ⋯ continuam preservadas. Se o blur nativo interferir com visibilidade ou desempenho em Samsung, a primeira medida é desativar a opção no Editor Visual (`menuBlur=0`) e comparar com modo sem desfoque; nunca tornar o jogo inoperável. Próximo prompt: `docs/LT376_PROMPT_CONTINUIDADE_VISUAL_20261116.md`.


## Evidência final de CI — LT375d — 16/11/2026
Commit de código aprovado: `2e61ea327faf04614f5c0db9160a72f41d20282d`. Gates obrigatórios concluídos SUCCESS no mesmo SHA:
- Node QA: https://github.com/LucianoToscano/PokeSearch/actions/runs/43940817727
- LT169: https://github.com/LucianoToscano/PokeSearch/actions/runs/43940818147
- LT211: https://github.com/LucianoToscano/PokeSearch/actions/runs/43940817739
- LT62 Android Java: https://github.com/LucianoToscano/PokeSearch/actions/runs/43940817620
- LT173 OTA + Android: https://github.com/LucianoToscano/PokeSearch/actions/runs/43940817606
- PGS debug QA: https://github.com/LucianoToscano/PokeSearch/actions/runs/43940817733 — `PokeSearch-PGS-Buscas-DEBUG-QA` artifact ID `14260844359` (ZIP 59.540.576 bytes); NÃO oficial.
- LT253 suplementar: https://github.com/LucianoToscano/PokeSearch/actions/runs/43940817757 — PASS.
- Secure beta/R8: https://github.com/LucianoToscano/PokeSearch/actions/runs/43940817579 — SKIPPED porque a PR está em draft.

Estado: **6/7 gates obrigatórios** aprovados, não 7/7. Builds QA NÃO provam visual no aparelho, touch-through nem suporte nativo de blur, que pode ser desativado pelo Android. Teste físico Android 11/12/13/14, animação/dedo, alvo na Pokébola e Minior continuam PENDENTES.
PR #454 ainda em rascunho, sem merge e sem APK oficial novo. Última release pública: `v0.03.68-54575`.

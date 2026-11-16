# PokeSearch — ARK LT376 — Localização, Favoritos, alça de seis pontos e desfoque
Data: 16/11/2026. Base `main` confirmada: `ef99e39c7c1c4d33ba59c0351f2fc20924a60391`. Branch de QA: `fix/lt376-popup-location-favorites-dots-blur`.

## Identidade oficial imutável
Release pública: `v0.03.69-54576` (LT375, versão 0.03.69, versionCode 54576), PR #454 integrada. Workflow oficial #43943415888 SUCCESS. APK oficial PokeSearch-v0.03.69-LT.apk, digest GitHub SHA-256 `c8bb45f3e8d4ac26d67365452bb5748d0cd3c51f26b127ec54e6373f14ee0b47`. Esta branch NÃO publica APK, NÃO faz merge, NÃO muda `release/official-request.json`, assinatura, versão, filtros, contas ou sprites.

## Evidências visuais do usuário (4 screenshots, 16/11)
1. Referência Localização: lista rolável que corta a última faixa `>= 1000 km / 2h` em tela alta.
2. Favoritos: Dialog inicia na mesma altura da barra principal, cobrindo seus botões. Requisito: colado acima ou abaixo, alinhado à barra e sem cobrir rail de resultados.
3. Personalização: fonte que mostra `⋮⋮` como traços/barra grosseira no lugar de SEIS pontos redondos em duas colunas por três linhas.
4. Editor Visual: slider de 8px não produz desfoque; UI apresenta mensagem `Desfoque nativo indisponível neste Android`.

## Causa-raiz auditada no código
- `dock.html`: seletor histórico `locationCooldownTable` limitava altura a 370px e obrigava `overflow-y:auto`, apesar de haver 16 linhas de 21px.
- `PokemonPicker.java`: posição nominal em `LayoutParams` não era confrontada com `root.getLocationOnScreen()` após `Dialog.show()/setLayout()`, podendo manter deslocamento de decor/insets; e centro do painel maior podia avançar sobre o rail de sprites.
- `dock.html`: alça dependia do desenho tipográfico de `⋮⋮` e `letter-spacing:-3px`, comportamento variável por fonte.
- `OverlayService.java`: `FLAG_BLUR_BEHIND` e `setBlurBehindRadius()` eram aplicados somente a `menuParams`, não ao `popupParams` (janela que contém Editor Visual/Localização/Filtros). Além disso, `WindowManager.isCrossWindowBlurEnabled()` pode devolver falso no sistema: o aplicativo não pode forçar cross-window blur em tal dispositivo.

## Correções propostas na branch de QA
- Painel cooldown: 16 linhas compactas de 18px, sem rolagem interna ou `max-height` CSS; altura natural medida pelo mecanismo do popup, mantida escolha de distância que preenche KM sem iniciar cooldown.
- Favoritos: coordenada X alinhada à margem da barra e verificação de coordenadas efetivamente renderizadas após `show()`; correção de offsets apenas quando necessário. Permanecem o arraste manual e a lógica de posicionar acima/abaixo segundo espaço livre.
- Seis pontos: `span` com seis círculos CSS reais `3px` em grid 2×3; botão nativo mantém leitor de tela, pointer capture, segurar 220ms, teclado e ordem persistida. Texto Unicode fica como fallback invisível.
- Blur: aplicar raio e flag também à janela `popupParams` quando popup aberto, remover ao fechar, respeitar slider 0–16 e suporte Android 12+. Fallback sem captura de tela nem permissões invasivas; desfoque sobre outro aplicativo só existe quando o SO permitir, podendo afetar toda a janela atrás do menu.

## Plano de QA / evidências
| Gate | Estado da LT376 |
| --- | --- |
| Node e contratos existentes, incluindo LT200/LT375b/LT375d/LT376 | Pendente execução CI no SHA final |
| Java puro + Gradle compileDebug | Pendente execução CI no SHA final |
| Android debug QA e assinatura temporária de QA | Pendente execução CI no SHA final |
| OTA LT173 e assets | Pendente execução CI no SHA final |
| Secure beta/R8 | Pendente execução CI no SHA final |
| Samsung Android 11/12/13/14, P/M/G, Toque, Favorites sobre resultados, TalkBack | **Pendente evidência física** |
| Blur nativo real com sistema habilitado e desabilitado | **Pendente evidência física** |
| PGSharp/Pokemod separados, gestos, caminhada e captura confirmada | **Pendente evidência física** |

QA físico deve confrontar `root.getLocationOnScreen` e os bounds reais da barra/resultados, verificar se todas as 16 linhas aparecem, testar rotação/telas pequenas e registrar capturas ou vídeo. Se o sistema reportar `isCrossWindowBlurEnabled()=false`, o resultado sem blur é limitação documentada e não pode ser rotulado `PASS` do efeito real.

Nenhuma captura efetuada pelo PokeSearch pode ser inferida de callback de gesto; distinguir supervisão, caminhada externa, tentativa e captura efetivamente confirmada.

## Continuidade / rollback
Executar gates completos em um único commit SHA de QA, anexar links de Actions e evidência de Android físico. Não fazer merge nem release sem autorização expressa; manter LT375 pública e assinatura permanente. Próximo prompt: `docs/LT377_PROMPT_CONTINUIDADE_QA_VISUAL_20261116.md`.

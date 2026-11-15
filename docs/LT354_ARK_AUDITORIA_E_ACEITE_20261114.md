# PokeSearch LT354 — ARK: auditoria de evidência do clique PGS (14/11/2026)

## Escopo e fonte da verdade
Base conferida: `main` em `0e2eb64680368a06345bb094cc023a82ade1cf0f`; release oficial anterior `0.03.49 / 54556 / 51353`, tag `v0.03.49-54556`, workflow `43665785084` SUCCESS. Consultados: `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`, relatório e prompt LT353, e manual de publicação. PR LT350 #385 continua **draft**, sem merge.

## Defeito demonstrável (inspeção de código, NÃO teste físico)
Em `PgsAutoClickService`, o callback `dispatchGesture.onCompleted` marca `awaitingMap` e começa a procurar mapa estável/populado. O algoritmo de LT353 não exigia que a aparência do mapa tivesse mudado *após o gesto*. Portanto um mapa já estável e sem reação no PGSharp podia avançar para a próxima sprite (falso positivo de progressão), sem evidência de ação no jogo. Também havia um risco de callback tardio de gesto anterior ser recebido depois de novo ciclo, porque apenas `index == nextIndex` era verificado.

O aviso `Sou passageiro` era procurado somente na raiz ativa; a bolha de Acessibilidade pode ocupar essa raiz enquanto a janela do jogo aparece atrás. Uma inspeção complementar da janela de aplicação ativa/focada evita ignorar o aviso acessível. **A confirmação humana jamais é automatizada.**

## Implementação proposta na branch
1. Salvar somente uma pequena assinatura RGB do mapa imediatamente **antes** de solicitar o gesto — não armazenar screenshot e não transmitir imagens.
2. Registrar estágios locais `GESTO_ACEITO_ANDROID`, `GESTO_RECUSADO_ANDROID`, `GESTO_CANCELADO_ANDROID`, `GESTO_CONCLUIDO_ANDROID`, `MUDANCA_VISUAL`, `SEM_RESPOSTA_VISUAL` e `SEM_RESPOSTA_JOGO`. Os eventos passam por `BugReport.log` com sanitização e limite local; o proprietário pode revisar o relatório antes de compartilhar.
3. Comparar amostras do mapa posteriores com a amostra anterior. Um delta RGB médio maior que 18 unidades é **apenas indício de reação visual**, não prova de toque recebido, teleporte ou Shiny. Limiar inicial conservador; necessita validação real. Não computar um mapa já estável sem mudança como carregamento de novo destino.
4. Se o Android concluiu o gesto mas não houve mudança visual reconhecível até o limite de mapa, parar a sequência e mostrar diagnóstico, **sem tocar cegamente na próxima sprite**. Não modificar a forma, o ponto ou a duração de `dispatchGesture`; não tocar em confirmação de segurança.
5. Usar o `ticket` da busca em callbacks `onCompleted`/`onCancelled`, ignorando callbacks obsoletos.
6. Inspecionar a janela de aplicação acessível para detectar `Sou passageiro` quando o overlay for a raiz superior. Manter consentimento humano.

## Sequência de aceite no Samsung (não executada pelo agente)
- A: modelo local de Metagross existe, está habilitado e a espécie correspondente está na seleção; comparar várias miniaturas e estado de background.
- B: botão ◎, com busca pausada, acha Metagross **no feed lateral** e informa nome/confiança/pixel; ◎ não usa `dispatchGesture`.
- C: busca ativa confirma **mesmo ID e espécie em 2 frames** e informa coordenadas; nenhum submenu com miniaturas aberto.
- D: registrar se `dispatchGesture` retornou aceito; depois callback concluído/cancelado; mostrar halo branco/ciano no pixel real, sem interceptar toque.
- E: comprovar na tela do jogo reação real. Usar vídeo autorizando a gravação do overlay e exportar BugReport, sem publicar dados sensíveis. Delta visual sozinho não prova clique/teleporte.
- F: verificar repetição e limites de mapa, tema claro/escuro, fonte maior/rotação, Tempo 15/5 legíveis, Personalização sem sobreposição, ancoragem e transparência comparadas com Pokébolas P1/P2 e Doce Raro.
- G: não automatizar `Sou passageiro`/confirmar segurança. OAuth Google/Discord, Shiny, Encontro e teleporte permanecem BLOQUEADOS até evidência física.

## Contratos de regressão e publicação
- `PgsAutoGestureEvidence.java` é puro Java, com `PgsAutoGestureEvidenceTest.java`: cenário idêntico, ruído leve, mudança visual, resolução divergente, mapa estável, timeout e não-regressão dos alvos de mira.
- `app/tests/lt354-pgs-gesture-evidence-contract.test.js`: limites de prévia, correspondência de modelo, callback com ticket, logs de estágios, proteção `Sou passageiro`.
- Gate LT211 passa a compilar/testar a política Java; gates Node QA, LT169, LT211, Java LT62, OTA LT173, PGS Android QA e beta Secure/R8 são critérios obrigatórios para merge.
- Nenhuma PR ou tag é prova de QA físico. Não tocar na PR #385 LT350 sem comparação visual física. Preservar dados, assets, 68 sprites Edu, P1/P2, Doce Raro, filtros, contas, Rank, notificações, scanner e assinatura.
- **Estado inicial deste relatório:** proposta LT354 em branch; gates e versão futura somente devem ser registrados após retornarem da Actions e da API de Releases. Até esse momento, a release oficial permanece 0.03.49.

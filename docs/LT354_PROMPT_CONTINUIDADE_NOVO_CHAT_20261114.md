# CONTINUIDADE POKESEARCH — APÓS LT354

Atue como responsável técnico ARK do repositório GitHub `LucianoToscano/PokeSearch`. Antes de mexer em arquivos, consultar `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`, `docs/LT354_ARK_AUDITORIA_E_ACEITE_20261114.md` e o manual de publicação. Confirmar o estado **atual** de main/release/PRs, não assumir que o texto abaixo continua válido.

Base verificada no começo: 0.03.49, versionCode 54556, label 51353, main 0e2eb64680368a06345bb094cc023a82ade1cf0f. LT350 PR #385 permanece draft.

LT354 encontrou uma deficiência de evidência: um mapa estável sem reação podia ser considerado carregado após callback Android, permitindo próxima sprite sem confirmação visual. Acrescentou amostra anterior ao gesto, comparação RGB conservadora, bloqueio de progressão quando a cena não muda, logs de aceito/concluído/cancelado/sem resposta, proteção de callbacks obsoletos e inspeção de avisos de segurança por janelas de aplicação. **Delta visual não prova teleporte.** O detector de sprites (máscara alpha, RGB, faixa lateral, idêntico modelo em 2 frames) permanece inalterado; o botão ◎ não clica.

Próximo passo prioritário: testar em Samsung com PGSharp, Metagross selecionado e modelo real salvo; capturar tela da prévia ◎ e exportar diagnóstico após a tentativa. Distinguir falha de modelo/ROI/confiança, falha de foco/permissão/dispatchGesture e jogo sem reação visual. Ajustar limiar/conversão de pixels somente com imagens e resolução verificadas. Comparar visualmente com P1/P2/Doce Raro (padrão oficial) e testar Tempo 15/5, Personalização, barra/menu, efeitos ciano/branco, tema claro/escuro e rotação. Não automatizar confirmação “Sou passageiro”. Não afirmar físico homologado sem execução.

Executar/consultar Node QA, LT169, LT211, Java LT62, OTA LT173, PGS Android QA, Secure beta/R8; preservar assinatura, dados e código monotônico. Somente merge/release mediante gates aprovados. Informar PR, commit, workflow, tag, SHA-256 e status verificável. Nova atualização exige instalar manualmente com consentimento do Android.

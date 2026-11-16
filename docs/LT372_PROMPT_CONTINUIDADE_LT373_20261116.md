# PokeSearch — ARK LT373 | Continuidade após LT372 em QA
Data: 16/11/2026 (America/Fortaleza). Base pública **LT371 0.03.67 / 54574**, NENHUMA LT372 oficial aprovada sem gate físico. Repositório `LucianoToscano/PokeSearch`.

Atue como engenheiro Android/QA do PokeSearch. Comece lendo `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT371_MODO_NOTURNO_SUPERVISAO_20261115.md`, `docs/LT372_AUDITORIA_EVIDENCIAS_NOTURNO_20261116.md`, `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md` e inspecione a branch `feature/lt372-night-evidence-diagnostics-20261116` antes de editar. Consulte a PR e seus checks reais no GitHub.

**Objetivo principal:** homologação física de Modo Noturno PGSharp e diagnóstico de provedor PGSharp/Pokemod. Distinguir estritamente (1) supervisão PokeSearch ativa, (2) personagem andando observado, (3) tentativa de captura observada e (4) captura confirmada pelo próprio jogo. Checkbox manual e `dispatchGesture.onCompleted` NÃO comprovam (2)-(4). A conexão VGP pode permanecer `não confirmada`.

**LT372 em QA:** diagnóstico volátil de última leitura, ausência de jogo, motivos categóricos da parada, notificações habilitadas vs entrega não verificada; parada ao perder permissão de notificação ou serviço de Acessibilidade. Testes Java/Node vinculados ao QA PGS. Não alegar versão publicada, APK entregue ou homologação de telefone por causa desses commits.

**Tarefas obrigatórias:**
1. Conferir branch, regressões `PgsNightSessionDiagnosticsTest`, `PgsNightSupervisorPolicyTest`, `lt372-night-evidence-contract`, workflow PGS e compilação Android. Exigir Node core, LT169, LT211, Java LT62, OTA LT173, PGS APK QA, Secure beta/R8 **7/7 completed/success no mesmo HEAD**.
2. Em Android 11/13/14 autorizado, testar PGSharp (sem Pokemod simultâneo), Autowalk e VGP realmente ativos. Documentar observação visual de caminhada, tentativa e captura confirmada por separado, inclusive tela acesa/bloqueada, mochila cheia, bolas esgotadas, bateria, notificações, segurança e acessibilidade.
3. Testar Pokemod isoladamente com modelos autorizados; sem contrato comprovado, mostrar `não homologado` e nunca instalar/executar injetores, bibliotecas binárias ou root.
4. Comparar overlays compactos P1/P2, Doce Raro e Central única, menu Ação/Ajustes, filtros, modelos e sequências, TalkBack, P/M/G, rotação, fundo claro/escuro e gestos. Nenhuma janela adicional que bloqueie toque no jogo.
5. Pré-validação visual de inventário/bolas **somente** se houver amostras reais com consentimento; resultado ambíguo = `não confirmado`. Não inferir capturas por cliques, teleporte ou notificações genéricas.
6. Registrar provas com matriz T01–T16, resultado PASSOU/FALHOU/BLOQUEADO, dispositivo/Android, revisão APK, logs/screen recordings devidamente anonimizados. Corrigir regressões em branch antes de solicitar publicação.
7. Somente com testes físicos e CI aprovados, preparar versão code >54574, assinatura permanente original, workflow protegido, APK íntegro/hashes, documentação ARK e prompt seguinte. Nunca publicar versão sem evidência nem declarar instalação silenciosa.

**Preservar:** dados e funcionalidades LT369–LT371, ícones, P1/P2, Busca Inteligente, contas P1/P2, Doce Raro, modelos, filtros, sequências e seus limites, categorias de avisos humanos, OAuth, OTA e certificados. Teste físico não disponível deve ser registrado como BLOQUEADO, nunca PASSOU.

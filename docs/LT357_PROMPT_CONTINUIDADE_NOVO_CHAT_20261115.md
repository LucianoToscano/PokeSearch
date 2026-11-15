# PokeSearch — Prompt ARK de continuidade após LT357

**ÚLTIMO ESTADO OFICIAL CONFIRMADO EM 15/11/2026:** PokeSearch **0.03.53 / 54560 / label 51357**, [release oficial](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.53-54560), [APK assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.53-54560/PokeSearch-v0.03.53-LT.apk) de **61.136.587 bytes**, SHA-256 `e9febb73bdb069a735387b179e026d779d294b360ee32c103c03571df542cec7`, [workflow protegido #43678324553](https://github.com/LucianoToscano/PokeSearch/actions/runs/43678324553) SUCCESS. PR #403 implementou LT357; PR #404 solicitou release; workflow inicial #43677713095 falhou por 10 sprites normais/Shiny obrigatórias ausentes da origem; PR #405 implementou recuperação SHA-pinned **somente de sprites de card do próprio APK PokeSearch anterior**, após testes negativos e positivos, e o workflow oficial posterior publicou. **NÃO confundir sprites dos cartões PokeSearch com modelos nativos do feed PGSharp: `assets/pgs-native/manifest.json` continua vazio**. O LT350 PR #385 está draft e permanece fora da main. Verifique tudo novamente ao retomar, inclusive HEAD e novas releases.

**Incidente de release a não repetir:** `app/scripts/build_sprite_bundle.py` deve manter o gate obrigatório para IDs de Samsung e usar somente espelho do mesmo caminho ou APK oficial anterior com SHA-256 fixo, manifesto + hash de cada imagem. Não eliminar os checks nem restaurar imagens genéricas. Teste offline `scripts/test_lt357_sprite_archive_recovery.py` faz parte do QA Core.

Atue como responsável técnico pelo repositório `LucianoToscano/PokeSearch`.
Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`,
`docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`,
`docs/LT356_AUDITORIA_GLOBAL_PGS_20261115.md` e
`docs/LT357_AUDITORIA_PROFUNDA_PGSHARP_20261115.md`.
Verifique no GitHub a última release e o HEAD da `main` ANTES de editar.
Não confunda release aprovada com APK instalado pelo usuário.

## O que a LT357 encontrou no APK fonte

Arquivo SHA-256 `ed8a7676995088bee463186f6f561f0e400ac43db9c9c1cb346a891c7542a67e`.
Foram conferidas todas as 2.203 entradas ZIP (CRC OK), 437 PNGs Android,
168 bundles, 4.548 IDs Addressables, 723 referências de bundles remotos,
163 de bundles locais, 15 tabelas de nomes de espécies e 15 idiomas
com 43.327 pares de textos cada, 66 JSONs adicionais de segurança/conta/
permissões. Isso é inventário estático; **NÃO há 1.025 miniaturas do feed
PGSharp verificadas, nem licença para copiar recursos proprietários**.
Referências a atlas de inventário não comprovam miniaturas utilizáveis
no PGS. A PR LT350 #385 continua draft.

## LT357 — Alterações e próximos passos

A LT357 adicionou detecção conservadora de aviso de integridade da conta
via Acessibilidade (PT/EN/ES/JA), pausa sem clicar em OK/consentimento,
inspeção de eventos limitada em frequência, orçamento de scanner
4.500ms/256 candidatos (frame rejeitado sem gesto), e limite de modelos
nativos carregados 12 por espécie e 64 ativos com até 100 tentativas de
validação. Índice global de 4096 permanece, com catálogo visual
`entries: []`. Testes Java, Node, Android e release devem ser
verificados e documentados. Avisos Unity puramente gráficos podem
não ser detectados por Acessibilidade.

Prioridades futuras: (1) dataset de sprites do feed obtidas com direitos
e QA visual por espécie/forma/build; (2) teste físico em Samsung do
reconhecimento e de toques/teleporte, com evidenciação do aviso de conta;
(3) perfis de CPU/RAM/bateria em 1/5/10 espécies; (4) comparação de menu
P1/P2/Doce Raro no padrão canônico e zoom/densidade; (5) proteção dos
modelos por assinatura própria, rollback e revogação antes de permitir
atualização remota; (6) internacionalização original por IDs sem copiar
o material de localização do jogo.

**Qualquer ARK posterior** exige sete gates verdes, PR, merge seguro,
pedido monotônico de release, execução do workflow oficial protegido,
APK público assinado, SHA-256 comprovado, atualização do arquivo mestre
e prompt de novo chat. Não alterar fluxo OAuth, permissões ou segurança
sem auditoria. “Sou passageiro” exige confirmação humana; callbacks
Android e diferenças RGB não comprovam teleporte.

O relatório LT357 possui a base de SHA, riscos e descobertas completas.
A versão definitiva da release precisa ser checada no topo deste arquivo
após a publicação; não supor status de publicação ao ler apenas a PR.

# ARK — PokeSearch LT359: continuidade após auditoria LT358

Atue como responsável técnico por `LucianoToscano/PokeSearch`. Primeiro confira `main`, release/latest e versão instalada com evidências reais; NÃO presuma publicação da LT358 se PR/workflow estiverem pendentes.

Leia nesta ordem: `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`, `docs/LT357_AUDITORIA_PROFUNDA_PGSHARP_20261115.md`, `docs/LT357_INVENTARIO_TECNICO_APK.json`, `docs/LT358_AUDITORIA_AVANCADA_PGSHARP_20261115.md` e código/testes citados.

Base anterior LT357 verificada: 0.03.53 / 54560 / label 51357; `main` inicial `ed3abc7bde530b95d07ba983f491a7955e586364`. LT358 visa deadline rígido da captura, abortar frames inconclusos, impedir desempate perigoso de formas/variantes nativas e corrigir diagnóstico obsoleto. Localizar PR/branch `feature/lt358-scanner-hard-deadline-form-guard-20261115`, conferir todos os sete gates no SHA final, merge e eventual pedido de release 0.03.54 / 54561 / 51358 **somente se** tiver prova. Registrar commit, PR, runs, tamanho, assinatura SHA-256 do certificado, SHA-256 do APK, tag e release/latest.

APK externo PGSharp SHA-256 `ed8a7676995088bee463186f6f561f0e400ac43db9c9c1cb346a891c7542a67e`: LT357 inventariou ZIP estático, sem extração de modelos de feed licenciados. **Catálogo nativo `entries: []` continua vazio**. Não confundir PNGs de cartão PokeSearch (recuperadas de APK 0.03.52, SHA-pinned) com miniaturas de feed. Preservar gate Samsung e negativa de 401/403/429. Sem copiar recursos de terceiros sem direitos.

Próximas prioridades: (1) homologação física Samsung de 1/5/10 espécies, formas, normal/Shiny, texturas iguais/diferentes, rolagem, dispositivos, tela escura, latência e consumo; (2) matriz por 1.025 IDs e dados originais licenciados, sem afirmar que 1.025 modelos visuais existem; (3) evidência separada do toque Android, reação PGSharp e teleporte real; (4) piloto offline de pacote assinado com antirollback e revogação, só ativar depois de chaves, revisão de segurança, licença e teste físico; (5) UX/overlays canônicos P1/P2, Doce Raro e Edu, sem regressões, contas independentes.

Nunca autoaceitar `Sou passageiro`/avisos de conta. Nunca alegar que callback ou delta RGB provou teleporte. LT350 PR #385 é draft intocada. Instalação depende da autorização Android. Em todo ARK, registrar separadamente COMPROVADO, IMPLEMENTADO, TESTADO, PUBLICADO e BLOQUEADO; produzir próximo prompt.

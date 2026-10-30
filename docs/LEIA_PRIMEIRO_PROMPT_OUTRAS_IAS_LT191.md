# LEIA PRIMEIRO — PokeSearch LT191 (revisão do Retry-After)

Este documento é a orientação atual para outras IAs. Não substitui o código-fonte original, `AGENTS.md` nem o Guia Mestre canônico. Os prompts LT188 e LT189 permanecem como referências históricas.

## Base e identidade verificadas
- Projeto exclusivo: `LucianoToscano/PokeSearch`; **não é PvPPokeGo**.
- Última versão pública confirmada ao iniciar a auditoria: LT190 / 0.01.90 / 54395. Git SHA da release: `f03ee07703c88e47b808a9278e1b6a4e1d38af30`.
- Registro LT191: [LT191_AUDITORIA_CORRECOES_20261030.md](LT191_AUDITORIA_CORRECOES_20261030.md).
- `applicationId` e `namespace` devem ser lidos dos Gradle originais; não inventar versão mais recente ou release concluída.
- Os dois overlays partilham `OverlayService.java` + `SecondaryOverlayService.java`, com estados `prefs`/`prefs_secondary` independentes.

## Correções em revisão LT191
- `Retry-After` em pesquisas, sessão WebView, Android e Doce Raro agora tem limite conservador de até 24 horas, sem repetir requisições no período.
- Validação de mensagens de erro sem corpo HTTP cru, sem JWT ou dados pessoais.
- Status exibe espera aproximada e mantém resultado antigo quando uma consulta falha.
- `app/tests/lt191-provider-backoff-24h.test.js` valida 7200 s, 86400 s, data HTTP, valor inválido, e limite maior que 24 horas.
- Não refatorar o `dock.html` de uma vez nem arquivar todos os workflows sem matriz de dependências e CI de transição.

## Para auditar o pacote
1. Extrair o ZIP antes de ler; não interpretar PNG/JPG/WebP como texto.
2. Ler `AGENTS.md`, `docs/GUIA_MESTRE.md` e `docs/LT191_AUDITORIA_CORRECOES_20261030.md`.
3. Inspecionar `app/src/main/java`, `app/src/main/assets`, `AndroidManifest.xml`, `app/build.gradle.kts`, `app/proguard-rules.pro`, `app/tests`, `functions` e scripts/CI.
4. Reportar caminho, linha, causa e reprodução antes de alterar; manter diferenças mínimas, testes e controle de segredos.
5. Tratar homologação real do Samsung e da API do PoGoCoordinates como **NÃO EXECUTADA** quando não houver evidências.
6. A instalação/assinatura/distribuição depende de autorização e registros de CI e Release reais.

**Não incluir keystore, JWT, cookies ou credenciais no pacote de auditoria.**

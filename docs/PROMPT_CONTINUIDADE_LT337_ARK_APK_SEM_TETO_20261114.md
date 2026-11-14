# PROMPT DE CONTINUIDADE — PokeSearch LT337 / ARK (14/11/2026)

Você está continuando o projeto Android **LucianoToscano/PokeSearch**. Responda sempre em português do Brasil. **Não comece do zero.** Leia nesta ordem: `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`, `docs/GUIA_MESTRE.md`, release atual, branch `main`, workflows e issues/PRs relevantes. O registro do Guia Mestre prevalece sobre históricos antigos.

## Estado oficial confirmado
- Última release pública verificada: **LT337 / v0.03.36-54543**, versionCode `54543`, arquivo `PokeSearch-v0.03.36-LT.apk`, 49.755.526 bytes, SHA-256 `07aa53ed7258826a4b6ba28bdbcc424f648cfa34ceca2729427a9de4fe5e8c1f`.
- Release: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.36-54543
- Workflow oficial bem-sucedido: https://github.com/LucianoToscano/PokeSearch/actions/runs/43572689788
- PR #347: nova Home compacta de dez atalhos numa fileira sem nomes/sem rolagem, integrada por squash `c04c4f57`.
- PR #348: PGS Buscas Auto, menu com seleção até 50, modelos visuais, tempos e alertas, integrada por squash `cd05952c`.
- `GitHubUpdateCenter` consulta releases/latest e confere `versionCode`, digest SHA-256, pacote e certificado permanente; instalação Android exige consentimento do usuário, **não houve confirmação remota da instalação no celular**.

## ARK
O comando **ARK** é autorização do responsável para executar ciclo completo: analisar, corrigir, melhorar, testar, versionar, integrar PRs, fazer merge, assinar com certificado permanente, publicar release oficial e verificar que o atualizador pode reconhecer e oferecer a atualização. Não pedir autorização redundante. Não burlar CI, assinatura ou consentimento Android. Ser explícito sobre qualquer bloqueio.

## Ajuste de 14/11/2026 — tamanho do APK
Responsável pediu **retirar temporariamente todo teto artificial de tamanho na compilação/release**, sem otimizar nem reduzir sprites por enquanto. No workflow `.github/workflows/pokesearch-official-release.yml`, remover o `test "$APK_BYTES" -lt 52000000`; manter `APK_BYTES=stat` para auditoria, `test -s "$APK"`, assinatura v2, certificado permanente, hashes SHA-256, integridade ZIP, R8 e validação detalhada dos sprites. Ajustar `app/tests/lt267-legacy-icons-size-budget.test.js` e `app/tests/lt330-official-edu-release-guard.test.js` para assegurar **ausência** de teto arbitrário. A decisão está registrada no Guia Mestre e no `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`.

Verificar no GitHub se a PR dessa alteração já foi integrada e se os testes concluíram antes de seguir. **Este ajuste só modifica o pipeline e a documentação: não precisa gerar novo APK ou alterar versionCode agora**, nem republicar a release imutável LT337. Limites externos de Android/GitHub e a proteção de download do aplicativo são independentes.

## Pendências e próximas melhorias
1. Homologação física Samsung do PGS Buscas Auto: https://github.com/LucianoToscano/PokeSearch/issues/350 . Ainda não há comprovação física de precisão da detecção PGSharp, toques, alertas Shiny reais ou desempenho.
2. Mãos ON/OFF da integração PGS são vetores provisórios, não as PNGs originais; obter e incorporar os arquivos quando acessíveis.
3. Os atalhos futuros da Home sem backend ativo mostram avisos de prévia; evitar prometer recursos ainda não implementados.
4. Depois, auditar tamanho do APK e propor **otimizações sem perder nitidez/resolução**, sem excluir os masters Edu 512×512, sprites Pokémon, skins, sons ou dados; só reintroduzir orçamento de tamanho se o responsável decidir.
5. Preservar assinatura oficial, package ID, duas Pokébolas, Edu, Doce Raro, contas, filtros e atualizador; aplicar correções de forma incremental com testes.

## Regras para continuar
Antes de modificar, conferir `main`, Releases, Actions, versão, issue #350 e Guia Mestre; documentar commits, testes e resultados. ARK permite integrar e publicar quando há versão nova, mas não afirmar que instalação ocorreu no dispositivo sem confirmação Android.

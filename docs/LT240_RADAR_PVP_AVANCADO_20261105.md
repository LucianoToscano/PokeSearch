# LT240 — Radar PvP avançado (05/11/2026)

## Base e integridade
- Base publicada: LT239 0.02.39 / versionCode 54443; a LT240 tem versionCode planejado 54444, label 51244.
- Sem substituição do motor de Rank Classe da LT239: as 4.096 combinações continuam calculadas localmente.
- Novos módulos pvp_rank_insights.js e pvp_rank_advanced_ui.js opcionais na WebView de detalhe; se falharem, o explorador LT239 permanece funcional.
- UI compartilha código entre P1 e P2, com ajustes responsivos P/M/G; teste físico Samsung é obrigatório para homologação visual.

## Recursos
1. Pesquisa local por IV A/D/S exato (ex.: 0/15/12), por #rank e por eficiência com % (ex.: 99,01%). Aponta a página e destaca o resultado, sem requisitar o provedor de capturas.
2. Comparador de mesmos IVs entre forma atual, evoluções e Megas contidas no contexto já validado do detalhe. Calcula Rank Classe por forma e liga; Mega é projeção, não garantia de elegibilidade na GBL.
3. Radar de Top 1 a Top 5 na análise; notificações nativas de novos resultados verificadas priorizam os menores rankings PvP na janela de alerta já habilitada. Sem novos canais, toque extra na API nem duplicações; continuam valendo permissão Android, modo de alertas, expiração e deduplicação.
4. Rank Geral com seleção Abertura/Finalização/Troca/Carregadores via fonte pública PvPoke em revisão fixa; mostra posições e pontuação apenas se comprovadas. Toque na espécie solicita golpes recomendados e confrontos; fontes indisponíveis retornam ao modo offline.
5. Atualização de dados: categorias e golpes consultados sob demanda no snapshot PvPoke de 03/11/2026, commit e02bde78d19be9b9099b5a6629c6a8d0835a53be. **O snapshot offline de 19/10/2026 permanece preservado**; não foi rotulado falsamente como atualizado e atualização integral da base local permanece pendente.
6. CSS adaptativo para menu estreito/medio/largo, sem reestruturar WindowManager. Nenhum acesso extra à PoGoCoordinates ou backend.

## Segurança e regressões
- Rank Classe vs Rank Geral permanecem distinguíveis.
- Alto risco de notificação duplicada mitigado por reutilizar as notificações existentes, sem novos canais, com confirmação do site, modo autorizado, verificação IV, temporização e identidade de encontro.
- Suporte a campos ausentes: exibir indisponibilidade, nunca estimar score ou golpe.
- Teste LT240: app/tests/lt240-pvp-advanced-radar.test.js. Regressões Node, Java Android, assinatura/OTA e APK beta devem concluir com sucesso antes de merge e publicação.
- Instalação/aceitação física Samsung e testes manuais de P1/P2 continuam pendentes; CI não prova teste no dispositivo.

## Registro posterior
Em desenvolvimento; documentar aqui hashes, IDs de jobs, merge, tag, assets e SHA-256 reais após cada confirmação. Nenhum APK ou envio ao atualizador pode ser presumido.

## Evidências da LT240 oficial — 05/11/2026

- **Implementação/merge:** [PR #215](https://github.com/LucianoToscano/PokeSearch/pull/215) mesclada na main no commit `14c790e840120dec7f05c53b32aa70e54c59eb55`. Último commit da branch testada: `fb198aca4418a98818f3065746d70f5d0a81d89a`.
- **Testes CI (todos success):** QA central LT211, Node QA, regressão LT169, compilação Java LT62, OTA assinado LT173, APK beta privado com chave isolada. O teste LT240 é `app/tests/lt240-pvp-advanced-radar.test.js`. Os checks estáticos de P1/P2 verificam `SecondaryOverlayService extends OverlayService`; **não substituem teste físico**.
- **Solicitação oficial:** `release/official-request.json` atualizada no commit `04cc3eff94cd9947be10d4e675a85876ee055d41`, versão `0.02.40`, `versionCode 54444`, `label 51244`, anterior `v0.02.39-54443`.
- **Workflow assinado permanente:** [Actions #41975318002](https://github.com/LucianoToscano/PokeSearch/actions/runs/41975318002), `completed/success`, jobs preflight/publish `success`; passos `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash` também `success`.
- **Release pública estável:** [v0.02.40-54444](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.40-54444), publicada em `2026-11-05T05:41:36Z`, `draft=false`, `prerelease=false`, fonte `04cc3eff94cd9947be10d4e675a85876ee055d41`.
- **APK oficial:** [PokeSearch-v0.02.40-LT.apk](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.40-54444/PokeSearch-v0.02.40-LT.apk), **28.140.411 bytes**, asset `uploaded`, digest SHA-256 `2eade56796c20a7323c3bd61439172d7a64d3e9e370b7373f3ec66e612dc96b2`.
- **Artefato de CI:** `PokeSearch-v0.02.40-54444-Signed-Verified` ID `13390844650`, 25.962.404 bytes, SHA-256 do ZIP `280f1d3cc38e6c9d51df5b96d6e100041b83fe4ad6df1a4b1a87dd4253cf2e02` (não confundir com digest do APK).
- **Distribuição:** APK disponível via GitHub Releases/latest para o atualizador interno LT237+; o Android exige confirmação para instalar. **Ainda sem comprovante de instalação e testes interativos físicos P1/P2 no Samsung.**
- **Limite funcional:** atualizam-se sob demanda rankings por função e golpes do snapshot fixado em 03/11/2026; o Game Master e Rank Geral **offline permanecem de 19/10/2026**. É falso afirmar atualização integral automática desses arquivos.

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

# LT325 — Resultados confiáveis, etapa 3: oportunidades em Reides

Data: 10/11/2026. **Estado: branch PR #327, não mesclada ou publicada.**

## Implementação e dados já existentes
- Fonte PvE mantida: `app/src/main/assets/pve_raid_rank.js` (S-Tier-Devs/pogo-db-api, **referência de agosto de 2026**, não rankings atualizados em tempo real). `assess(card, related)` é chamado pelo **card de detalhes atual** quando o usuário abre o Pokémon; não foi introduzido nenhum outro `fetch` para o detector.
- A lista independente de resultados **não importa o módulo PvE nem consulta a rede**. Somente após uma avaliação já concluída e `report.verified===true`, `detail.html` compartilha a classificação do mesmo Pokémon via `Native.receiveRaidValueEvidence`.
- O `OverlayService` autentica o contexto lógico do aviso: overlay vivo, card aberto, pesquisa aceita, fonte exata, espécie/Nº da Pokédex, sourceIndex, A/D/S, PC, form, costume, location e despawn iguais ao resultado atual. No Android, o retorno para os resultados é limitado a uma classificação verificada `rank 1–50`, uma das 18 tipagens e campos sanitizados. Nenhum coordenada, credencial ou dado do treinador é compartilhado.
- `dock.html` guarda o dado exclusivamente em `Map` limitado a **16 encontros** no contexto da própria WebView. Não há persistência e as duas Pokébolas permanecem isoladas, cada uma com seu serviço. Resposta atrasada ou de outro encontro é ignorada. Resultados vencidos ou com filtros antigos não ganham destaque.
- `result_value_detector.js` reutiliza o modelo de valor existente: **◈ Raides #N Tipo** para a **mesma espécie/form normal** na classificação PvE por tipo **até #50**. Não se afirma que o Pokémon capturado tenha os mesmos IVs ou golpes: a referência usa nível 50 e IVs 15/15/15 de comparação, não a captura real.

## Critérios para nunca inventar oportunidades
- Não reclassificar uma transformação Mega, Sombrio, Fantasia, Regional nem forma sem correspondência exata como se fosse espécie normal.
- Não converter ATQ base local em rank PvE. Não usar uma linha de evolução/forma projetada (`projected: true`) como rank do Pokémon capturado.
- Não confiar em dados PvE com fonte desconhecida, rank em texto, identidade discrepante, ausência de meta IV independente ou tipo desconhecido.
- Não confundir **rank PvE por tipo** com Rank Geral PvPoke ou com ranking de contra-ataque para um chefe específico.
- A marca só aparece **depois que o card existente já verificou o PvE**; sem visita ao detalhe não há dado PvE para a lista, portanto nenhum ◈. Uma fonte offline/indisponível não produz ◈.
- Sem mudança nos alertas de Reides. A política LT325 anterior (prioridade de Hundo e Top PvP dentro do mesmo aviso geral, sem novos avisos) continua vigente.

## UX e OTA
- Um único marcador por sprite, nos tamanhos P/M/G existentes. Ordem de preferência: IV 100% → PvP atual verificável → IV #1 da classe → referência PvE exata → evolução PvP hipotética.
- A classificação PvE continua inteira na mesma janela Rank Reides; o marcador da lista não duplica golpes, métricas ou caixas.
- Adicionados `result_evidence.js` e `result_value_detector.js` a `OtaAssets.PATCHABLE` e ao `scripts/build_ota_pack.py`, evitando HTML atualizado que requisita módulos JS ausentes. O OTA exige mesma assinatura e validações já protegidas; não é realizado OTA automático por este PR.
- Acessibilidade do próprio card descreve `Reides #N Tipo · referência por espécie ...` sem afirmar ranking do IV capturado.

## QA
- `app/tests/lt325-raid-value-evidence.test.js`: rejeição de IV, forma, rank, origem, projeção, expiração, comparação de identidade, callback local, prioridade única, ausencia de novas requisições e manifesto OTA.
- Conjunto original: `app/tests/lt325-result-evidence.test.js`, `app/tests/lt325-result-value-detector.test.js`, `app/tests/PvpAlertPriorityTest.java`, testes de Reides LT259/LT323, QA Node integral, compilação Android, OTA, visual e beta privado.
- **QA físico em Samsung P1/P2 e P/M/G continua pendente.** Nem `main`, nem release, nem APK público devem ser anunciados sem merge e fluxo protegido confirmado.

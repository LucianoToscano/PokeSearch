# LT325 — Resultados confiáveis (etapa 1: origem e qualidade)

Data: 10/11/2026. Estado: branch de implementação, PR #327, **não publicada**.

## Objetivo
Explicar **o que veio do PoGoCoordinates** e **o que o PokeSearch realmente confirmou**, em vez de exibir zero, rank ou distância presumidos. Não modificar ordenações, filtros, sessão, limites do provedor, contas, assinatura nem os dez resultados por Pokébola.

## Componentes existentes reutilizados
- `OverlayService.applyCollectedResults`: rejeição nativa de IV/filtros inválidos, vencimento, exclusão de resultados fora da busca e aceitação para histórico/alertas.
- `searchPhase`, `resultsStale`, `searchInProgress`: estado de atualização e prévias anteriores.
- `dock.html:verifiedSpawnIvPercent` e `detail.html:PokeSearchIVDisplay`: validação existente de IV.
- `dock.html`: lista P/M/G compacta e `detail.html`: detalhes e painéis PvP/PvE já existentes.
- `PvpAlertPriority`, `recordNewResults`, `WatchAlerts`: permanecem inalterados. Novos alertas exigiriam política e testes próprios.

## Dados de auditoria adicionados pelo Android
Anexados somente após seleção/validação do conjunto final:
- `evidenceSource: "api" | "site"`: **canal de obtenção**, nunca certificação de toda informação.
- `evidenceVerified: boolean`: critérios de busca efetivamente confirmados pelo fluxo nativo (na API, somente com os gates adicionais `apiConfirmed`).
- `evidencePartial: boolean`: extração do site incompleta ou um ou mais campos de outros encontros não confirmados; não significa automaticamente que IV do card exibido é falso.
- `evidenceOld: boolean`: apenas na cópia enviada ao detalhe, identifica prévia antiga, falha ou atualização ainda em andamento. Na listagem, o mesmo estado vem de `resultsStale` e `searchActive`.

Uma prévia antiga não pode passar como uma nova pesquisa confirmada. No primeiro acesso por versões anteriores ou dados sem metadados, a origem fica **não identificada**.

## UX
- `result_evidence.js`: módulo puro, sem rede/GPS/avaliação PvP. Converte flags em mensagem explicativa e estado `verified / partial / previous / unverified / expired`.
- Lista de Pokémon: selo **somente** nos estados excepcionais (parcial, anterior, não confirmado, expirado); não acrescenta dez ✓ ou novas linhas. A acessibilidade do card informa origem e evidências.
- Detalhe: botão pequeno `ⓘ` em `#info`; abre explicações dentro do card atual e preserva P/M/G. Usa `PokeSearchIVDisplay` para a confirmação de IV. Um km numérico significa apenas que a fonte forneceu um valor; **não prova** distância do GPS do celular. Rank Geral da espécie, rank IV e rank informativo da busca não são equivalentes. Shiny não confirma associação da conta.

## Próxima etapa: detector de Pokémon valiosos
Fazer um classificador **somente de leitura**, usando `pvp_rank_insights.js`, `verifiedOverallRank`, `verifiedSpeciesIvRank`, `bestEvolutionRank` e o painel existente de Reides. Condições:
1. Nenhum destaque baseado apenas em limite de filtro Top N, IV de outra espécie ou Mega hipotética.
2. Primeiro comparar a classe IV e o Rank Geral com o mesmo Pokémon/forma/liga; depois projeções, explicitamente marcadas como referência.
3. Um único destaque compacto por encontro, sem duplicação de ranks ou nova janela.
4. Usar fila e canais de alertas já implementados; só priorizar depois de os testes provarem que não há falsos positivos ou notificações duplicadas.
5. Preservar estados separados de P1/P2, favoritos, perfis e sessão; nunca executar buscas adicionais para pontuar resultados.

## QA
- `app/tests/lt325-result-evidence.test.js`: API/Site, parcial/anterior/expirado, dados faltantes, IV, distância, rank, paridade P1/P2, HTML e ausência de rede/GPS.
- CI Node/Java/OTA/visual e teste físico Samsung ainda exigem validação; sucesso automatizado não prova layout perfeito no Android.

# LT325 — Checklist de aceitação física e regras para integração

**Status:** QA automatizado em PR #327; **não** equivale a aprovação em aparelho real, merge ou release.

## Proteções funcionais já implementadas

1. `result_evidence.js` diferencia confirmação da fonte e frescor do encontro. Se o despawn é ausente, inválido ou implausível (mais de 24 h), o card **não** é rotulado como encontro vivo confirmado.
2. `result_value_detector.js` produz um único marcador por encontro, exige a mesma espécie/forma/liga no PvP, distingue projeções de evolução e nunca atribui rank PvE aos IVs da captura.
3. O Raid Rank é consultado somente pelo card de detalhes já existente. Metadados da avaliação podem voltar à lista **apenas** para a mesma captura, com validação adicional no Android.
4. `retainVerifiedEncounterFields` mantém km/IV/golpes/rank/sprite somente quando a identidade e os campos de forma, fantasia, Shiny e Sombrio coincidem. Quando valores de fonte anterior foram preservados, `evidenceReusedFields` descreve quais, na linha expansível `ⓘ Fonte/qualidade`.
5. Não foram criadas notificações. Um Hundo confirmado só melhora a prioridade dentro do aviso geral já existente; Top PvP mantém prioridade.

## Aceitação física obrigatória (Samsung, antes de publicação)

Registrar capturas das **duas Pokébolas P1/P2**, separadamente, em tamanhos **P/M/G**:

- Confirmar que os marcadores ficam dentro das sprites de resultado, sem cobrir IV%, número da Pokédex, bandeira, setas de evolução, cronômetro, distância ou botão de pegar coordenadas.
- Testar uma busca IV 100% verdadeira com 15/15/15 e uma busca por IV% que inclua Pokémon sem A/D/S: só o primeiro pode receber **◆ IV 100%**.
- Testar GL/UL com Rank IV e RG distintos: confirmar que **GL IV #1** não passa a significar **RG #1**. Simulações e Megas continuam explicitamente identificadas.
- No cartão atual, abrir **Rank Reides**: um resultado exato Top 50 pode acrescentar **◈**; trocar para outra espécie, forma, fantasia, Sombrio, ou resultado expirado não pode manter o marcador.
- Verificar que uma busca com leitura parcial, falha de rede ou atualização em andamento remove os marcadores de confiança anterior; não deve apagar configurações pessoais.
- Ordenar por CP, Nível, IV% e Despawn usando o mesmo centro de busca; km real informado/retido deve permanecer visível sem inventar distância. Alterar a localização ou forma não pode reaproveitar o km/sprite de outro encontro.
- No detalhe, abrir `ⓘ Fonte/qualidade`: confirmar fonte API/Site, ausência de dados e campos recuperados de pesquisa anterior. A janela deve poder ser expandida/recolhida sem cortar conteúdo.
- Acionar alertas Novos/Favoritos em condições controladas: verificar apenas **um aviso** por encontro, respeitando mute, OFF, cooldown e deduplicação.
- Testar fechar/reabrir painel, arrastar resultados, menu Favoritos, retorno do overlay após minimizar e rotação de tela; confirmar nenhuma regressão de P1/P2.

## Condições de bloqueio

- Captura de tela ou teste visual em Chromium não certifica WindowManager, sobreposição Android, toque real ou memória no Samsung.
- APK **Secure beta** da CI usa chave de assinatura isolada: **não instalar sobre a release pública**. Não remover o app oficial para testar, sem backup/consentimento explícito.
- Só integrar à `main` ou solicitar release protegida depois de confirmar as verificações relevantes no **mesmo SHA final** e decidir como registrar a validação física pendente. Não declarar APK verificado sem tag, asset, hash e workflow.
- Manter versão anterior e caminho de rollback intactos; sem downgrade, migração de contas ou exposição de localização/credenciais.

## Execução automatizada

Os seguintes testes estão registrados na PR e devem passar no mesmo head: `lt325-result-evidence.test.js`, `lt325-result-value-detector.test.js`, `lt325-raid-value-evidence.test.js`, `lt325-metadata-inheritance.test.js`, `lt325-real-results-visual.cjs`, `PvpAlertPriorityTest.java`, regressões Node completas, compilação Java, OTA, Rank Reides e APK beta privado.

O escopo **não altera** a versão distribuída. A PR contém código editável e histórico de testes para revisão futura.

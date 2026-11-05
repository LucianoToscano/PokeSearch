# PokeSearch LT253 — implementação integrada e homologação (05/11/2026)

## Estado e fonte da verdade
- **Base pública preservada:** LT252 — 0.02.52 / versionCode 54456 / label 51256. Não alterar nem republicar esse APK.
- **Branch:** `feature/lt253-integrated-pvp-smart-ui-20261105`; revisão [PR #232](https://github.com/LucianoToscano/PokeSearch/pull/232), `main` permanece oficial até aprovação.
- **Candidata futura:** 0.02.53 / versionCode 54457 / label 51257, **não solicitada nem publicada**. O mecanismo permanente usa `release/official-request.json` somente após conclusão do gate visual.
- **P1/P2:** mesmos assets e OverlayService herdado. Persistência de preferências por `prefs`/`prefs_secondary`, coordenadas reveladas isoladas e verificação de spawn estrita.

## Escopo implementado
1. **Comparador inteligente de família:** `pvp_lt253_features.js` classifica separadamente melhor RG conhecido, melhor Rank Classe e melhor Mega projetada. Projeção não é elegibilidade GBL, RG não é a posição entre IVs. Resumo inline na Análise PvP, sem painel Android extra.
2. **Cartões adaptáveis:** `resizeDetail` mantém dimensões naturais quando fechado e pode crescer até `min(720dp, altura disponível)`, com rolagem acessível; o cartão preserva sua posição arrastada.
3. **Ataques e legados avançados:** `pvp_rank_moves.js` extrai energia, poder e turno apenas quando campos estão presentes no Game Master público fixado; `detail.html` diferencia capturado e recomendado, status Elite/Legado verificado e fonte. Não adivinha nome PT-BR, tempo nem status de legado.
4. **Calculadora 2.0:** `detail.html` adiciona segundo IV A/D/S validado, comparação de PC e PS no mesmo nível, LC 500, GL 1500, UL 2500 na mesma forma selecionada; preserva nível, PC-alvo e o Game Master offline sem inventar custos.
5. **Alertas inteligentes:** `OverlayService.java` filtra **somente notificações gerais em GL/UL** quando usuário ativa Top #1/#5/#10/#50 no menu do sino. OFF por padrão, sem som ou canal novo, apenas resultados verificáveis, com deduplicação e configuração independente P1/P2. Megas projetadas não disparam falsos avisos.
6. **Cache de resultados e coordenadas:** TTL local (até 32 encontros, chave de dados exatos + despawn) de projeções PvP públicas para reabertura rápida. Campos privados são removidos por allowlist. Coordenadas continuam no cache nativo já existente `VerifiedEncounterCoordinates`, até o despawn, sem novo pedido à API após revelação verificada.
7. **Sprites resilientes:** recuperação por fonte exata já existente, com uma última tentativa limitada e verificação de identidade do cartão, impedindo reciclar callback de outro encontro; nunca substitui fantasia, Mega ou Shiny não verificado.
8. **Posicionamento de janelas:** `moveDetail` considera também menu e popup nativos existentes, sem novos overlays; preferência de arraste manual é soberana.
9. **Compartilhamento WhatsApp:** botões inline `Compartilhar PvP` e `Copiar` usam o seletor Android/área de transferência já existente. Saída textual apropriada para WhatsApp sem coordenadas, localização, usuário ou login; não supõe que WhatsApp esteja instalado.
10. **QA visual:** workflow PR-only [`lt253-visual-qa.yml`](../.github/workflows/lt253-visual-qa.yml) usa Google Chrome headless com CSS real do detalhe, gera PNG em larguras 200/240/300 e afirmações de overflow, visibilidade do nome de forma e barra de nível. Os PNG são artefatos de homologação, não uma prova de instalação física.

## Testes/aceitação antes da versão oficial
- Node: `app/tests/lt253-integrated-privacy-pvp-smart-ui.test.js`, regressão geral e histórico LT238–LT252, `overlay-ux`.
- Android: Java 17/Gradle, manifest/API, compatibilidade da interface `onNativeData` e das duas instâncias de OverlayService.
- OTA: confirmar `pvp_lt253_features.js` na lista assinada de `scripts/build_ota_pack.py`.
- Visual: screenshots Chrome 200/240/300 com sem overflow horizontal; **inspeção humana** dos artefatos gerados e teste no Samsung real P/M/G, P1/P2.
- Funcional: o mesmo toque abre/fecha IV #/RG/evolução; Mega Sableye mostra emblema antes do nome; comparar 0/15/12 vs 15/15/15; selecionar forma longa Bellossom/Ursaluna; sprites ausentes não viram círculos vazios; reabrir coords verificadas não consome quota; alertas OFF e sem permissão não disparam.
- Privacidade: exportação não contém coords nem localização; cache expira e não cruza contas/spawns; um modo Top #10 não envia falsos avisos Mega.
- Distribuição: **somente após todos os gates, aprovação visual e inspeção física** fazer merge, ajustar notas embutidas, incrementar `release/official-request.json`, verificar assinatura permanente e publicar em `releases/latest`. Nunca usar o APK beta de assinatura isolada como atualização instalável.

## Evidências e limitações
- O código deste documento é candidato em PR. **Não é prova de publicação**. Testes automatizados e renderizações headless não comprovam interações multitouch, permissão de overlay, fonte real de sprites ou instalação sobre a LT252.
- O PokeSearch não busca dados de treinador nem altera o site para simular classificações; recomendações dependem dos snapshots PvPoke já integrados.
- Registrar aqui o SHA final de merge, URLs de workflows, SHA-256 do APK e versão oficial **apenas depois que existirem**.

## Evidências de CI verificadas para o código de 05/11/2026

Revisão de código testada: `56aa09050973cafc1a7659c7dbab367e867d5aed`.

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Regressão Node LT169 completa (inclui teste LT253) | **success** | [Actions #42033366306](https://github.com/LucianoToscano/PokeSearch/actions/runs/42033366306) |
| PokeSearch Node QA | **success** | [Actions #42033366071](https://github.com/LucianoToscano/PokeSearch/actions/runs/42033366071) |
| QA core Android / JS | **success** | [Actions #42033366261](https://github.com/LucianoToscano/PokeSearch/actions/runs/42033366261) |
| Compilação Java Android sem APK | **success** | [Actions #42033366199](https://github.com/LucianoToscano/PokeSearch/actions/runs/42033366199) |
| Validação OTA/assinatura Android | **success** | [Actions #42033366088](https://github.com/LucianoToscano/PokeSearch/actions/runs/42033366088) |
| Chromium screenshot smoke, 200/240/300 px | **success** | [Actions #42033366196](https://github.com/LucianoToscano/PokeSearch/actions/runs/42033366196), [artefato #13417087131](https://github.com/LucianoToscano/PokeSearch/actions/runs/42033366196/artifacts/13417087131) |
| APK beta com assinatura temporária isolada (teste privado; não é OTA oficial) | **success** | [Actions #42033366045](https://github.com/LucianoToscano/PokeSearch/actions/runs/42033366045), [artefato privado #13416699300](https://github.com/LucianoToscano/PokeSearch/actions/runs/42033366045/artifacts/13416699300) |

O novo teste `lt253-integrated-privacy-pvp-smart-ui.test.js` foi executado pela regressão completa com mensagem de aprovação. Medições visuais sem overflow horizontal: largura 200 px — seletor 94 px e slider **98 px**; largura 240 px — seletor 134 px e slider **138 px**; largura 300 px — seletor 194 px e slider **198 px**. As três versões têm `scrollWidth === clientWidth` e conteúdo vertical rolável.

**Pendente de homologação física:** abrir as duas Pokébolas no Samsung, executar P/M/G, conferir cliques, rolagem, ícones, sprites, sobreposição e troca da LT252; registrar imagem real e consentimento de publicação. A build beta usa assinatura de teste isolada e **não substitui a assinatura permanente**. Este registro não autoriza publicar automaticamente a LT253.

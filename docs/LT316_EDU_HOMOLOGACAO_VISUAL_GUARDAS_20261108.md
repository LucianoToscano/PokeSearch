# LT316 — Guardas de tamanho e roteiro de homologação visual do Edu (08/11/2026)

## Situação e fonte de verdade

- Release estável anterior e atual: **LT316 / 0.03.16 / versionCode 54522**, sem alteração, downgrade ou publicação nesta etapa de QA.
- APK oficial: `PokeSearch-v0.03.16-LT.apk`; SHA-256 `7646eb5254da13f5da930813767d4265701da37a46f59d2d9fba2373ca47c252`.
- A coleção de 68 sprites, atlas revisado, 51 correções e cinco retoques (20/28/30/36/49) são entregas da LT316 **já publicada**. Nenhum desenho foi substituído sem evidência visual nova.
- A `main` foi conferida antes das mudanças; os três commits depois da Release LT316 eram apenas documentais. Este trabalho ocorre em branch de QA, sem afetar a instalação pública.

## Causa técnica verificável e correção

O tamanho P/M/G da imagem Edu era selecionado a partir da existência de `RaidDayAvatarFrames` (atlas legado LT304), mesmo quando `EduSpriteAtlas` já tinha sido carregado corretamente. Na condição de fallback em que só o atlas Edu carrega, `updateAvatarSize()` e `createBubble()` escolhiam `dp(ART_DP)` em vez dos **50/75/100 px** configurados, podendo gerar um Edu menor ou um tamanho visual incoerente. Essa é uma falha real de condição no código, não uma observação física comprovada em Samsung.

A função `eduAvatarArtSize()` prioriza `EduSpriteAtlas.SIZES_PX[avatarSizeIndex]` sempre que o atlas Edu está disponível; conserva `RaidDayAvatarFrames.SIZES_PX` como fallback real e usa `dp(ART_DP)` só quando ambos faltam. Os dois pontos de criação/atualização da visualização usam a mesma regra. Nenhum novo botão, tamanho ou preferência foi introduzido.

## Regressões estáticas acrescentadas

`app/tests/lt316-edu-samsung-visual-guards.test.js` cobre:
1. As 22 poses ociosas (parado + 21 estados), com oito sequências autorizadas, sem incluir sprites contextuais.
2. Teleporte 52–60 e Sombria 67 fora de sorteios ociosos; pausas entre animações e prioridade da interação.
3. Seleção única P50/M75/G100 e G inicial mesmo se o atlas legado não carregar.
4. Somente cinco retoques manuais em 20/28/30/36/49, com preservação de acessórios e fallback LT315.
5. Referência documental atualizada para LT316 em `AGENTS.md`.

Os testes são verificações de contrato no código: **não medem pixels finais de um aparelho** e não provam que os movimentos estejam visualmente perfeitos.

## Verificação de CI no SHA da PR

Commit com o código, teste e registro mestre: `eb3a0e44d5c268f04c1c75b74e4c88043b48b45f`.

| Gate | Execução | Resultado |
| --- | --- | --- |
| Node completo | [42518112298](https://github.com/LucianoToscano/PokeSearch/actions/runs/42518112298) | SUCCESS |
| LT169 regressões | [42518112202](https://github.com/LucianoToscano/PokeSearch/actions/runs/42518112202) | SUCCESS |
| LT211 core | [42518112325](https://github.com/LucianoToscano/PokeSearch/actions/runs/42518112325) | SUCCESS |
| LT62 Java Android | [42518112195](https://github.com/LucianoToscano/PokeSearch/actions/runs/42518112195) | SUCCESS |
| LT173 OTA/Android | [42518112242](https://github.com/LucianoToscano/PokeSearch/actions/runs/42518112242) | SUCCESS |

Esses fluxos não construíram um APK público, não verificaram instalação física nem autorizam afirmar que o visual foi homologado no Samsung.

## Roteiro de QA físico — pendente

No Samsung, após instalar uma build de QA assinada e identificada por versão superior, capturar vídeo da transição de cada combinação em **P50, M75 e G100**:
- Parado → Jogando 01/02 → Parado, sem saltos ou alteração de largura/altura do corpo.
- Frente 01–04, direita 01–04, esquerda 01–04, Pokébola 01–04.
- Shiny, Armadura Mewtwo normal e Shiny, Sombria ansiosa (esta apenas sob gatilho de ansiedade).
- Cinco acessórios dos quadros 20/28/30/36/49 sem corte nem crescimento desproporcional.
- Teleporte 52–60 (mudança voluntária de escala/opacidade permitida).
- Pausas e reinício do idle após interação, sem deslocamento do personagem entre quadros.

Aceitar somente evidência de instalação física e captura real, identificando versão/device e pontos problemáticos. Se houver falha, corrigir apenas quadros observados, repetir Node/Java/Android/OTA e testar novamente. **Status atual: QA FÍSICO NÃO EXECUTADO.**

## Preservações e publicação

- P1/P2, PoGoCoordinates, Doce Raro, rankings, filtros, contas, relógio único, roteiro E01–E11, dados e preferências intocados.
- Regras de assinatura permanente, OTA e limite de APK preservadas.
- Esta branch **não** foi mesclada à `main` nem distribuída como Release. O fluxo oficial de assinatura e publicação só será disparado com autorização expressa e gates verdes.

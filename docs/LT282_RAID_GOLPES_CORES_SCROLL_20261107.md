# LT282 — Golpes de Raides coloridos somente no texto e rolagem de classificações
Data: 07/11/2026.

## Evidência real e origem
Nas capturas físicas Samsung, Medicham #308 com A/D/S 5/15/14 mostra seção `Atacantes por tipo`. A avaliação Raides apresenta nomes de ataques com cor neutra apesar dos tipos Psíquico/Lutador. A lista `Ver mais 3 classificações` abre, mas o final fica fora da janela sem conseguir rolar.

## Mudança específica
1. `pokemon_card_presentation.js` expõe leitura somente da paleta conservadora de 18 tipos, a mesma dos golpes capturados na LT281. Não duplicar paletas.
2. `detail.html` usa `PokeSearchMovePtBR.type(id,fast)` de cada ataque (não o tipo da espécie/linha). Colore somente o nome do golpe rápido/carregado via CSS `color:var(--ps-move-type)`; rótulos `Ágil:` e `Carregado:`, fundos e bordas ficam neutros. Tipo ausente: sem cor específica.
3. `pve_moves_ptbr.js` acrescenta ao subconjunto offline as identidades Medicham `PSYCHO_CUT_FAST` (Psíquico, Corte Psíquico) e `DYNAMIC_PUNCH` (Lutador, Soco Dinâmico), já verificadas; mantém o catálogo imutável como fonte primária.
4. `renderRaidPreview()` registra uma única vez no `#raidPanel` o evento `toggle` em captura de `.psRaidMore`; expandir ou recolher chama `resizeEvolutionPanel()`, que ajusta altura nativa e ativa `.needsScroll` se o conteúdo ultrapassar a janela. O painel reinjetado não duplica listeners.
5. `app/tests/lt282-raid-moves-expand-scroll.test.js` exercita o código real de apresentação e valida tipos, cores, ausência de chips, desconhecidos neutros, listener único e ambas as transições.

## Regressões que não podem ocorrer
- Não mudar os cinco cards, bandeiras, rankings GL/UL/ML, dados raids, sprites, formas, Shiny, duas Pokébolas, localização, favoritos, filtros ou OTA.
- Não inventar ranking ou tipo de golpe. Preservar legenda e ícones Elite reais.
- QA físico Samsung P1 e P2 continua pendente após publicação; o resultado de CI não prova renderização física.

## Fontes externas do tipo do golpe
- Psycho Cut: https://db.pokemongohub.net/move/226 (Psíquico).
- Dynamic Punch: https://db.pokemongohub.net/move/246 (Lutador).

## Publicação confirmada — 07/11/2026
- [PR #275](https://github.com/LucianoToscano/PokeSearch/pull/275) merge squash `02b1d7b9e2440958fc1b31853ff38b6695c6021d`.
- CI completo de Node, PvP, Java Android, interface visual P/M/G, OTA e QA de compilação passou no head do PR.
- [Workflow oficial #42334977146](https://github.com/LucianoToscano/PokeSearch/actions/runs/42334977146): preflight=success, publish=success, verificação de assinatura permanente/versionCode/SHA-256 aprovada.
- [Release estável LT282](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.82-54486): 07/11/2026 às 03:43:05 UTC, `v0.02.82-54486`.
- APK `PokeSearch-v0.02.82-LT.apk` com **33.815.704 bytes**; SHA-256 **`0f093c7cfc12b5cf8870d4b6cd2eca012efaf7bcadd6ee29d02ce039ec61c185`**; asset state `uploaded`.
- **Pendente exclusivamente após release:** aceitar em dispositivo Samsung P1/P2 a cor individual de ataques e rolagem completa da lista; instalação requer confirmação do Android.

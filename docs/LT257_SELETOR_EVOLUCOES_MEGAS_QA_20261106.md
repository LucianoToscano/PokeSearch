# PokeSearch LT257 — seletor único de evoluções e Megas

Data da implementação: 06/11/2026. Base oficial preservada: **LT256 · 0.02.56 · versionCode 54460**.
PR: [#236](https://github.com/LucianoToscano/PokeSearch/pull/236).
Requisito do usuário: adaptar o seletor da calculadora para o exemplo que lista **Gastly → Haunter → Gengar (Normal) → Gengar (Mega)** e atualizar PC/PS sem alterar IV A/B, nível ou PC-alvo.

## Implementação

- Substituído o conjunto redundante de chips de forma e o `<select>` Android visível por **um único menu expansível dentro de `detail.html`**, usando `<details>` e `<summary>`, sem nova janela nativa ou overlay.
- Mantido o select técnico interno `#psCpForm` (oculto), para preservar as rotinas estáveis de cálculo, setas e compatibilidade dos testes e evitar dois controles visíveis.
- O menu exibe **toda a família conhecida** com o Game Master local: `Gastly`, `Haunter`, `Gengar (Normal)` e `Gengar (Mega)`. Megas recebem `mega_evolution_icon.svg` **antes** do nome, sem inventar ataques Mega. Mega X/Y continuam alternativas distintas, e famílias maiores têm lista interna rolável de no máximo 170px.
- Ordem dos itens derivada das arestas de evolução do catálogo pinado: evolução anterior antes da seguinte e Mega após a forma normal. Funciona também quando o Pokémon capturado já é uma evolução.
- Cada seleção recalcula **PC e PS** com os atributos-base do Game Master e atualiza o rótulo, a seleção ativa e a diferença IV B − A. A lista fecha após a escolha; as setas percorrem as mesmas opções e preservam IV A/B, nível e PC-alvo.
- Preservados os painéis compactos P/M/G e as duas Pokébolas independentes. Sem chamadas adicionais à API, sem novos recursos de rede e sem mudança de permissões. Mega não comprova elegibilidade na GBL.
- Refinamento após inspeção manual de PNG: quando a lista estava aberta, botões de navegação laterais ficavam verticalmente centralizados na lista em vez de alinhados ao seletor. Ajustada `align-self:flex-start` para as setas; isso precisa constar na última rodada de screenshots.

## Testes e evidências

- Teste `app/tests/lt257-evolution-mega-single-dropdown.test.js` (Node): ordem Gastly→Haunter→Gengar→Mega; família do Charmander com Mega X/Y; ícone correto; recálculo de PC com mesma entrada de IV; preservação de IV A/B; fechamento da lista; exclusão de forma inexistente.
- Atualizado `app/tests/lt255-evolution-family-selector-offline.test.js` para o novo dropdown, preservando a regressão do Teddiursa.
- `app/tests/lt253-visual-screenshots.cjs` executa as interações em Chromium nas três larguras de cartão P (200), M (240), G (320): abre a lista, verifica dimensões, seleciona Ursaring→Ursaluna e Gastly→Gengar Normal→Mega, compara PC, IVs A/B, verifica símbolo e registra screenshots.
- CI completo anterior ao refinamento das setas no commit `c5244641c6fece95f87221e28b483af75b4d4065`: seis verificações automáticas passaram — [Node QA #42166765281](https://github.com/LucianoToscano/PokeSearch/actions/runs/42166765281), [regressão completa #42166765265](https://github.com/LucianoToscano/PokeSearch/actions/runs/42166765265), [QA core #42166765185](https://github.com/LucianoToscano/PokeSearch/actions/runs/42166765185), [Java #42166765187](https://github.com/LucianoToscano/PokeSearch/actions/runs/42166765187), [OTA #42166765182](https://github.com/LucianoToscano/PokeSearch/actions/runs/42166765182), [visual #42166765225](https://github.com/LucianoToscano/PokeSearch/actions/runs/42166765225). [PNG P/M/G artefato #13479415808](https://github.com/LucianoToscano/PokeSearch/actions/runs/42166765225/artifacts/13479415808), inspecionado: rótulos normais e Mega legíveis e sem overflow.
- **Gate final:** compilar/testar novamente após correção de alinhamento das setas antes de fazer merge e solicitar APK oficial. Só afirmar publicação após novo workflow assinado e release verificada; nunca afirmar que a atualização já foi instalada no Samsung sem confirmação física.

## Versão proposta

**LT257 · 0.02.57 · versionCode 54461 · label 51261** se for efetivamente autorizada e publicada em sequência. LT256 continua intacta no histórico.

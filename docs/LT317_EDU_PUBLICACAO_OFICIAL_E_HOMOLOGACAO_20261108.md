# PokeSearch LT317 — publicação oficial, Edu e relógio (08/11/2026)

## Estado confirmado diretamente em GitHub (não inferido)

- **Release pública estável:** [LT317 · v0.03.17-54523](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.17-54523), `0.03.17`, `versionCode 54523`, `label 51321`.
- **APK:** [`PokeSearch-v0.03.17-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.17-54523/PokeSearch-v0.03.17-LT.apk), **34.708.982 bytes**, SHA-256 **`a477f8aa93c75d50ab09e6c95d14435744ec6f8d69ec1629d1494ba636026dda`**. Asset `uploaded`, digest e tamanho confirmados por GitHub Releases/latest e pelo workflow.
- **Assinatura:** certificado permanente Android v2 SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; step **Validate APK and signer — SUCCESS**. APK abaixo do limite rígido **35.000.000 bytes**, não-debuggable conforme gates oficiais.
- **Workflow de distribuição oficial:** [#42523901901](https://github.com/LucianoToscano/PokeSearch/actions/runs/42523901901) **completed/success**, ambos os jobs preflight e publish aprovados, incluindo assets completos, regressões, compilação Android/R8, assinatura e verificação de hash público. SOURCE_COMMIT do APK `903994b905da8dd33bc4e77695af4bb18c1e28a3`.
- **Merge anterior:** [PR #317](https://github.com/LucianoToscano/PokeSearch/pull/317) integrada por **squash** `a4c4b696c94e32f3afeb01ec03d3b93d646e9a0d`. PR head testado `25ce0047cda8a2bfbed6456905e2e4b389769e5a`. Pedido oficial em `release/official-request.json` commit `903994b905da8dd33bc4e77695af4bb18c1e28a3`.
- **CI de PR:** Node completo [#42523721507](https://github.com/LucianoToscano/PokeSearch/actions/runs/42523721507), LT169 [#42523721465](https://github.com/LucianoToscano/PokeSearch/actions/runs/42523721465), LT211 [#42523721552](https://github.com/LucianoToscano/PokeSearch/actions/runs/42523721552), Java LT62 [#42523721464](https://github.com/LucianoToscano/PokeSearch/actions/runs/42523721464), OTA LT173 [#42523721527](https://github.com/LucianoToscano/PokeSearch/actions/runs/42523721527) — todos SUCCESS para o head da PR, com nova regressão dentro da publicação protegida.

## Funcionalidades publicadas na LT317

1. **Edu — balão inicial simples:** apresentação em português, texto `Bug dos Passes ⓘ` com toque e sublinhado; explicações no mesmo balão sem novos botões no fluxo inicial. Cauda lateral mais longa, apontando a aproximadamente 5 pixels da posição estimada da cabeça.
2. **Status contextual do evento:** sprites `evento_nao_comecou` (38), `evento_comecou` (37), `evento_encerrou` (36), com data e hora local da região escolhida. Contagem regressiva de segundos ao lado de checklist manual com três orientações e `ⓘ` sobre softban, regiões/fusos e passe laranja da véspera. Não há promessa de passes; método é relato comunitário, não função oficial.
3. **Relógio único — 17 momentos:** nova seleção dentro de `Data e hora` da Home, calculada por `EduEventMomentPresets`: 3 dias, 24h, 1h, 30min, 10min, 1min, 10s antes; início; 2h/4h/8h/12h/24h/48h após início; 10min antes/depois do fim e 1 semana após término. Exibidos em ordem cronológica real e horário local IANA; seleção ajusta apenas a hora **manual interna** do Edu.
4. **Correção visual/fallback:** tamanhos P=50, M=75 e G=100 px mantidos quando atlas Edu carrega sem o legado; 68 sprites, 22 poses ociosas, teleporte, Sombria, efeitos e índices preservados.

## Preservado

- Duas Pokébolas independentes P1/P2, Doce Raro, PoGoCoordinates, login, filtros, favoritos, GL/UL/ML/RG/Reides, atualização, dados/preferências, assinatura original e relógio único.
- Tutorial antigo E01–E11 no código, sem reformulação além dos novos balões iniciais.
- Release LT316 e anteriores permanecem como versões históricas; a LT317 atualiza por cima e não exige apagar dados.

## Pendências / verdade dos testes

**Homologação visual e funcional em Samsung físico ainda pendente**, mesmo após CI sucesso. Conferir no aparelho: transições entre as 68 sprites, escala P/M/G, ponta da fala sem cobrir outras overlays, rolagem de textos e links ⓘ, o contador em 10 segundos antes do início, o estado após início/término, seleção das 17 opções e fuso regional, persistência das preferências e atualização por cima da LT316.

**Não afirmar instalação automática ou QA físico aprovado:** GitHub Releases é o canal usado pelo app, e o Android solicita confirmação do usuário para instalar o APK. O relógio manual não modifica Pokémon GO nem demonstra recebimento de passes.

# PokeSearch LT320 — publicação oficial e auditoria (08/11/2026)

## Última versão pública confirmada em GitHub

- **Release oficial:** [LT320 — 0.03.20 · versionCode 54526 · label 51324](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.20-54526), publicada **08/11/2026 às 23:15:47 UTC**, não-draft e não-prerelease.
- **APK:** [`PokeSearch-v0.03.20-LT.apk`](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.20-54526/PokeSearch-v0.03.20-LT.apk), **34.710.274 bytes**, SHA-256 **`ed44ac2214c569392c57d1e88ebeb422889c78281b9d9518c295304016c76bc8`**. Asset `uploaded`, tamanho e hash conferidos em GitHub Releases/latest.
- **Pipeline permanente:** [workflow oficial #42534031454](https://github.com/LucianoToscano/PokeSearch/actions/runs/42534031454) **completed/success** nos jobs `preflight` e `publish`, incluindo gate de assinatura e hash do APK público. Certificado Android v2 permanente da linhagem PokeSearch SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; o APK permanece abaixo do limite de **35.000.000 bytes**.
- **Código fonte exato do APK/pedido protegido:** `20f88cc3cf36ef1da75445d5f95d0122d31f0615`, por `release/official-request.json`. **PR integrada:** [#320](https://github.com/LucianoToscano/PokeSearch/pull/320), squash `b98e80b8a0b44d4b5e1d68e0b782a61e5507f39a`.
- **Cinco gates anteriores ao merge no HEAD `143efcd96ec20893b57acf38c6afd353b00e4d8f`:** Node completo [#42533793472](https://github.com/LucianoToscano/PokeSearch/actions/runs/42533793472), LT169 [#42533793348](https://github.com/LucianoToscano/PokeSearch/actions/runs/42533793348), LT211 [#42533793545](https://github.com/LucianoToscano/PokeSearch/actions/runs/42533793545), compilação Java LT62 [#42533793441](https://github.com/LucianoToscano/PokeSearch/actions/runs/42533793441) e OTA LT173 [#42533793398](https://github.com/LucianoToscano/PokeSearch/actions/runs/42533793398) — todos **SUCCESS**. O workflow permanente repetiu as regressões na publicação.

## O que entrou

**Qualidade de exibição Edu:** atlas corrigido LT316 **128×128 por quadro** (68 quadros) continua como fonte; o app prepara **buffers de exibição 512×512 sob demanda** com cache LRU de oito quadros (~8 MiB) e fallback em falta de memória, sem duplicar 68 artes no APK. O resultado favorece amostragem na tela densa; **não representa imagens originais redesenhadas em 512px nem recuperação de detalhes ausentes**. Mantidos olhos, óculos, roupas, itens, 22 idle, Sombria, teleporte, cinco retoques, P100/M150/G200 (M como padrão para contas novas).

**Painel em uma tela:** `EduClockSettingsActivity` contém relógio, automático/manual, oito momentos rápidos em grade tocável (24h, 1h, 10min e 10s antes; início; 2h depois; 10min antes e 10min depois do fim), seleção P100/M150/G200 e **slider de transparência do balão 0–60%**. A transparência altera somente preenchimento e borda do balão; o texto, links e sprite permanecem opacos. Preferências de tamanho e transparência aplicadas em tempo real ao overlay pela `OnSharedPreferenceChangeListener`. Os 17 instantes históricos continuam no modelo interno por compatibilidade; não aparecem todos na interface. Fuso/24h seguem em `Mais opções`, sem mudar o relógio ou GPS do Android ou Pokémon GO.

**Preservações:** conversa inicial simples LT318, estados de evento #42/#38/#37/#36, contador com segundos, checklist ⓘ, E01–E11, P1/P2, Doce Raro, PoGoCoordinates, filtros, favoritos, rankings, login, Firebase, dados/preferências, OTA e certificado permanente. Nenhum benefício de passes é garantido pelo Edu.

## Limites e homologação ainda pendente

A instalação e a aparência no Samsung **não foram comprovadas nesta execução**. Testes automatizados validam código/compilação, não a perfeição do rosto. Instalar a LT320 **por cima** da LT319 sem desinstalar, confirmar P100/M150/G200, olhos/óculos nos quadros principais e especiais, transições fluídas, comportamento de memória, os 8 momentos na mesma tela, ajuste P/M/G ao vivo, transparência do fundo em 0/30/60%, texto opaco e ausência de sobreposição. **Caso o defeito seja inerente ao desenho original 128, solicitar a coleção mestre 512 do proprietário** e corrigir a fonte preservando a identidade e os índices de todas as 68 poses, sem prometer que simples upscale criou detalhe real.

Para continuar ler [relatório de QA pré-release](LT320_EDU_QUALIDADE_512_RELOGIO_SLIDER_20261108.md), `docs/GUIA_MESTRE.md` e `docs/PROMPT_CONTINUIDADE_LT320_EDU_20261108.md`. 

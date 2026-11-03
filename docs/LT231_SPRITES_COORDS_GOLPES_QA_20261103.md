# PokeSearch LT231 — QA local: sprites, coordenadas, golpes e círculos PvP

**Data:** 03/11/2026. **Status:** alterações aplicadas **SOMENTE NA CÓPIA LOCAL DE FONTE**. **NÃO é APK assinado, merge, release ou atualização enviada ao app.**

## Proveniência e continuidade

- Repositório: https://github.com/LucianoToscano/PokeSearch; branch base `main`.
- Revisão base verificada: `50901e8e55c0ad1696cc95044de284c0afd88317` (02/11/2026 11:24:44 UTC).
- Versão pública documentada: **LT227 / 0.02.27 / versionCode 54434**, APK-fonte `9ddefe74d7cdf9fb0c67f636385cdcdbbd5f403f`, assinatura permanente fingerprint público `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, workflow `41433915635`.
- Revisões locais anteriores LT228–LT230 vieram da cópia editável fornecida neste chat; não equivalem a merge no GitHub.
- Não reservar LT231 como versão instalada ou como `versionCode` público sem verificar novamente Releases/latest e maior código QA.

## Correções implantadas na fonte

1. **Sprites (lista vertical P1/P2 + detalhe):** `app/src/main/assets/dock.html` prioriza imagens-base e variantes exatas retornadas pela ponte nativa (`verifiedBundledData`) ao invés de depender inicialmente de caminhos `file:///android_asset/...` ou rede, preservando correspondência de número, forma, fantasia e Shiny. `detail.html` mantém recuperação exata via ponte e aumenta somente área visível da sprite no cabeçalho (37 px), sem deformar o card. `app/scripts/build_sprite_bundle.py` interrompe empacotamento se faltarem PNGs-base normais ou Shiny verificados de #94, #422/423, #459, #656, #669–671, #722–724. O sintoma `RO`/`FR` das capturas é fallback da lista e não confirmação de ausência dos sprites na base.
2. **Coordenadas sem repetir consumo:** `VerifiedEncounterCoordinates.java` guarda em memória do serviço apenas coordenadas obtidas com confirmação do provedor; chave inclui P1/P2, conta, treinador, espécie, CP, nível, local, IV, forma/fantasia, tamanho, gênero, Shiny e o instante exato de despawn, **nunca a posição/sourceIndex da lista**. `OverlayService.java` restaura no card reaberto e na lista atualizada quando é o mesmo spawn, antes de novas consultas. Máximo de 60 registros por serviço, expiração no despawn, limpa em troca de treinador ou encerramento. Não expõe token/cookie; nada salvo em disco ou Firebase. Sem reutilização se os critérios forem diferentes ou o prazo não estiver confirmado.
3. **⚔️ Classificação PvP #1:** `detail.html` adiciona botão discreto somente quando `Rank Classe: #1` é comprovado. Mostra primeiro os golpes **atuais**, sem confundi-los com os **recomendados**. Ao toque, `pvp_rank_moves.js` busca somente leitura a recomendação de golpes para espécie/evolução da faixa PvP no snapshot público imutável PvPoke (`e02bde78d19be9b9099b5a6629c6a8d0835a53be`, 03/11/2026); consulta `gamemaster.json` para distinguir `eliteMoves`, `legacyMoves` e golpes comuns. Falhas de rede, forma não identificada ou dados insuficientes recebem rótulo **NÃO VERIFICADO**. Não promete que um ataque Elite será obtido em evento nem que todos os dados atuais da API coincidem com o snapshot.
4. **Indicadores de liga:** `detail.html` substitui o glifo quadriculado por círculo **7 px** menor que as letras: azul GL `#2489e8`, amarelo UL `#e8b927`, roxo ML `#a36ce8`. Só mostra rank comprovado; ML permanece visualmente preparada, sem inventar Rank Classe ML inexistente.
5. **Regressão visual dos tamanhos:** preservados P/M/G, modo com/sem fundo, filtros e preferências de duas Pokébolas, Doce Raro e quotas HTTP 429. Nenhuma alteração de API ou bypass.

## Testes realmente executados

- **212/212** arquivos de testes Node.js de `app/tests/*.test.js`, executados a partir da raiz do projeto (excluído o teste legado `lt74-local-update-preview.test.js`, que não faz parte da suíte atual). **Sem falhas**.
- Dentro dessa suíte, `overlay-ux.test.js` confirmou **487 testes de contrato**.
- `app/tests/lt231-sprites-coords-pvp.test.js`: PASS (sprite P1/P2, segurança de identidade, indicadores, Elite e sintaxe JS).
- `VerifiedEncounterCoordinatesTest.java`, compilado em Java com `javac --release 17`: PASS (P1/P2 separados, expiração, LRU, limpeza).
- `python3 scripts/test_ota_builder.py`: PASS (fixture changed-only LT173), **não publica APK**.
- `python3 -m py_compile app/scripts/build_sprite_bundle.py`: PASS.
- **NÃO EXECUTADOS:** Gradle Android, compilação/assinatura APK, PokeAPI downloader de sprites, screenshot Samsung, teste de WebView real, teste real PoGoCoordinates `/reveal`, rede PvPoke dentro da WebView e upgrade sobre APK instalado. Este ambiente não possui Gradle CLI/Android SDK.

## Riscos e aceite antes de publicar

- Em WebView real, conferir Rowlet (#722), Froakie (#656), Snover (#459), Flabébé (#669), Shellos (#422/423), Halloween Gengar (#94), normal/Shiny, ambas as Pokébolas, tamanhos P/M/G, recarga e fundo.
- Confirmar o mesmo spawn: clicar `Pegar Coordenadas` **uma vez**, fechar/reabrir card, copiar várias vezes sem nova chamada `/reveal`, aplicar refresh, encerrar no despawn, trocar treinador e validar que não há reuso indevido. O cache é **em memória do serviço**, não persiste depois de o serviço parar.
- Verificar botão ⚔️ em evolução #1 em GL/UL, texto de golpes recomendados versus atuais, status Elite/Legado, fallback sem rede e fonte/forma corretas.
- Para CI, confirmar parâmetros/versionCode do workflow novo, certificado, `.apk`, OTA Releases/latest, disponibilidade de `official-updates` e espelho Drive. **Não usar esta documentação como autorização implícita para assinar ou publicar** (o proprietário já autorizou, mas as operações requerem ferramentas aptas e evidências).
- O Android instalado ainda está na versão anterior até uma nova release pública realmente ser publicada.

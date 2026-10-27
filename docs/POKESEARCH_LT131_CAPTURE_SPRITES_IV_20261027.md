# LT131 — Capturas no chat com sprite e IV A/D/S

Data: 27/10/2026. Branch: `feature/lt131-capture-sprites-ivs-20261027`; base LT130 PR #89.
Nome da QA: `PokeSearch-v0.01.31-LT131-Capture-Sprites-IVs-QA.apk`.
VersionCode: `54336`; versionName: `0.01.31`.

## Apresentação aprovada

- **Normal:** [sprite de Beldum] **🎉 Luciano capturou um Beldum 0/15/14!**
- **Shiny:** [sprite Shiny de Ditto] **✨ Luciano capturou um Ditto 15/15/15!**
- O apelido é o apelido da própria mensagem (`nickname`, **não nome Google obrigatório**); captura declarada pelo próprio jogador, não verificada automaticamente pelo Pokémon GO.
- Mini sprite de **38dp** embutida na mesma bolha e texto; reações ❤️ 👍 🎉 ✨️ e horário seguem embaixo. Mensagens normais mantêm aparência anterior; chat não redimensiona overlays nem interrompe o jogo.
- Sprite offline é obtido **exatamente** de `app/src/main/assets/pokemon_catalog.json` e `pokemon-sprites/base/N.png` ou `pokemon-sprites/shiny/N.png` empacotados na QA. Base Beldum `#374` e Ditto `#132` presentes. Se a espécie/variante não corresponde exatamente ao catálogo, não inventar nem mostrar sprite incorreta; mostrar texto.
- IV A/D/S extraído **somente do resultado comprovado de pesquisa** `offer.optString("iv","")` herdado em `OverlayService` pelas Pokébolas P1/P2. Validar exatamente três inteiros `0..15`, com separador `/`; IV inválido/ausente significa **sem IV no anúncio**, nunca inventar `15/15/15`. A forma também é transportada; se diferente da base, o nome no anúncio a especifica, e o resolvedor de sprite não cai silenciosamente na sprite base.
- **Privacidade:** nenhum campo novo no Firebase; só `text`, `nickname`, `authorUid`, `createdAt` sob `chat/messages`. Não envia coordenadas, JWT, endereço, PC ou o objeto inteiro do card.
- **Confirmação:** continua necessária a cópia bem-sucedida de coordenadas, toque no botão discreto `🎉 Capturou? Compartilhar` e confirmação inline `Sim, compartilhar`; nada é publicado automaticamente.

## Compatibilidade

As regras atuais de Realtime Database para `chat/messages` permitem apenas os campos existentes. Por isso, `CaptureChatFormat` codifica em texto `🎉 Capturou um Beldum 0/15/14!`, que o renderizador transforma visualmente em `🎉 [apelido] capturou um Beldum 0/15/14!` e resolve a espécie pelo catálogo local. Não há necessidade de alterar as Rules do Firebase, que preservam `stats`, `premium`, `distribution`, o administrador e as quatro reações. Textos no formato de anúncio podem ser escritos por usuários; nenhum texto equivale a uma comprovação de captura.

## QA/entrega

- `app/tests/lt131-capture-sprites-ivs.test.js`: valida padrões e números exatos, IV permitido 0..15, sprite embutida, ausência de coordenadas no banco e 4 reações intactas.
- Workflow `.github/workflows/lt131-capture-sprites-ivs-signed-qa.yml`: testes Node + Gradle, release R8 v2 permanente e verificação SHA-256 do APK em GitHub Actions; não há release público ou merge sem autorização.
- Teste real ainda pendente no Samsung: capturas normal/Shiny, caso sem IV, com forma especial sem sprite incorreta, API ON/OFF, paridade P1/P2, reações e estatísticas; não declarar certificação física antecipadamente.
- Distribuição principal é o **link de artefato real GitHub** (protocolo Issue #84); links sandbox podem falhar com `Library file not found`.


## QA assinada e auditada — LT131

- GitHub Actions `SUCCESS`: https://github.com/LucianoToscano/PokeSearch/actions/runs/40476951765
- Download GitHub principal, APK dentro de ZIP: https://github.com/LucianoToscano/PokeSearch/actions/runs/40476951765/artifacts/12721646113
- Nome APK: `PokeSearch-v0.01.31-LT131-Capture-Sprites-IVs-QA.apk`; **43.375.725 bytes**, SHA-256 **`dae7719a47738d8cc8b6ad32c241db9f127c8f8d564ea57e563fc0836675be15`**. Confere com `SHA256SUMS.txt`.
- Arquivo ZIP GitHub: **40.884.676 bytes**, SHA-256 `22ecf0b7b0b071f1c662c80c40c2f1076a2147d92ba6754c360a2566a42713da`; testzip CRC íntegro, relatório de assinatura e versão presentes.
- SOURCE_COMMIT: `d6f867921960f15c1d161d9fe236617625c89b8a`; commits posteriores são documentação. VersionName `0.01.31`, versionCode `54336`, applicationId `com.lucianotoscano.pokesearch`, targetSdk `33`.
- Assinatura Android v2 **true** com certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- No ZIP do APK verificados diretamente `assets/pokemon_catalog.json`, `assets/pokemon-sprites/base/374.png` (Beldum), `assets/pokemon-sprites/shiny/132.png` (Ditto) e `assets/pokemon-sprites/base/132.png`.
- CI passou em testes Node e Gradle Android; **não confirma comportamento em aparelho real nem captura real do jogo**. Não houve mudança no Firebase, merge, Release oficial ou remoção da LT130.

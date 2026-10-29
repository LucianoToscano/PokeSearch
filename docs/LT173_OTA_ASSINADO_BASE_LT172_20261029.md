# LT173 — atualizações inteligentes (OTA) assinadas — 29/10/2026

## Atualização de estado pós-publicação — 29/10/2026

**LT173 FOI PUBLICADA OFICIALMENTE PARA TODOS**, após autorização expressa do proprietário. O status de branch/QA abaixo é histórico e não reflete mais a versão atual. Consultar [ESTADO_CANONICO_LT173_OFICIAL_20261029.md](ESTADO_CANONICO_LT173_OFICIAL_20261029.md) para evidências vigentes: Release `v0.01.73-54378`, APK `PokeSearch-v0.01.73-LT.apk` (49.514.961 bytes), SHA-256 `5d330bafeabe3a24fdfb5ef8864c7ae463743ae4cda362d014fc9c08ef34ade9`; Actions #40921988685 SUCCESS; SOURCE_COMMIT `7d3f7497539af826de491cc6daac2e16e4411758`. O primeiro update para LT173 ainda é o APK completo. O canal OTA de recursos **segue desativado em `packVersion=0`** até publicar um pacote assinado. Homologação física Samsung/Moto ainda pendente.

## Estado e base canônica
- **Base oficial preservada:** LT172 `0.01.72 / 54377`; PR #130 e Release `v0.01.72-54377`.
- **LT173 nesta branch:** implementação de infraestrutura/QA. **Não é uma Release, não há APK compilado nesta etapa, não foi enviada atualização a usuários.** Não declarar homologação física.
- Canal de recursos `ota/channel.json` inicia explicitamente em `{"packVersion":0}` e não baixa recursos.
- O primeiro APK com a infraestrutura deve ter `versionCode >= 54378`, assinatura original e ser aprovado em CI e no aparelho; o código não atinge automaticamente usuários LT172.
- O mecanismo de APK assinado existente (`GitHubUpdateCenter`) continua intacto para correções de Java/SDK e para recuperação.

## Como funciona
1. WebViews locais das duas Pokébolas usam o origin fechado `https://appassets.androidplatform.net/assets/` com `WebViewAssetLoader`, em vez de carregar `file:///android_asset/` como página principal. `LocalBridgePagePolicy` aceita exclusivamente as páginas e quatro consultas explicitamente autorizadas; URLs remotas não têm acesso ao bridge `Native`.
2. Um ponteiro público de versão em `ota/channel.json` aponta para `ota-N`. Toda carga de `manifest.json` é verificada por assinatura destacada `manifest.sig`, assinada com **o mesmo certificado privado permanente de assinatura do APK**, que permanece em GitHub Secrets. O app extrai a chave pública do certificado instalado, verifica o fingerprint pinado e a assinatura RSA/ECDSA. Um ponteiro alterado ou arquivo remoto não autenticado não pode executar código.
3. O manifesto é uma **fotografia cumulativa** dos recursos modificados desde o APK de base, com `packVersion`, limites `minAppVersionCode`/`maxAppVersionCode`, lista restrita de caminhos, tamanho e SHA-256 por arquivo. Downloads já idênticos podem ser reaproveitados localmente.
4. O app baixa em diretório de staging privado, verifica SHA-256 e tamanho de cada recurso, efetua rename atômico para `pack-N`, e então grava o ponteiro ativo com versão anterior para rollback. Sem rede, falha, arquivo inválido ou interrupção, usa imediatamente os assets assinados do APK.
5. **Não modifica WebViews em uso:** o pacote verificado passa a valer na próxima inicialização do processo do PokeSearch, incluindo Pokébolas 1 e 2. Não altera cookies, treinadores vinculados, sessões, preferências ou coordenadas.
6. Não há OTA nativa ou reinstalação silenciosa. Alterações Java, Manifest, permissões, SDK e assinatura continuam exigindo APK completo; patches binários de APK são uma etapa separada, não implementada aqui.

## Recursos inicialmente permitidos
`dock.html`, `detail.html`, `sprite_offline.js`, `sprite_visual_scale.js`, `visual_editor.js`, `pokemon_card_presentation.js`, `pvpoke-overall-ranks.js`, `pvpoke-iv-gamemaster.js`, `probe.js`, `release_notes.json`, `pokemon_catalog.json`. Também são permitidos PNGs individuais em caminhos controlados de `pokemon-sprites/{base,shiny,forms,costumes}`, `result-icons/{base,modes}` e `weather-icons{/v2}`, com nomes restritos, até 64 arquivos por pacote e 8 MB somados. Cada PNG é verificado por tamanho e SHA-256. Nenhum arquivo de autenticação, Firebase, certificados, serviços Android nem credenciais.

## Publicação controlada (somente depois de homologação)
- Publicar primeiro uma **LT173 oficial** com APK assinado e versão monotônica `0.01.73 / 54378`, somente após aprovação e QA em Samsung/Moto; não assumir que foi publicada.
- Após editar arquivos e validar ambas Pokébolas, executar manualmente `.github/workflows/ota-publish-signed.yml` na `main` com `pack_version` estritamente crescente, mínimo e máximo compatíveis, confirmação `PUBLICAR_OTA_ASSINADO` e aprovação no environment `official-updates`.
- O workflow gera os arquivos mudados por `git diff v0.01.73-54378..HEAD`, constrói o manifesto cumulativo, assina com keystore protegida, verifica assinatura e publica `ota-N` como **pre-release**, sem substituir `releases/latest` de APK.
- Somente depois da publicação do bundle assinado muda `ota/channel.json`. Se o upload/assinatura falhar, o ponteiro permanece inalterado; se a publicação do ponteiro falhar, o pacote existe mas permanece inativo.
- Nunca publicar `manifest.json` sem `manifest.sig`, nunca colocar o keystore ou senha no repositório. Não reiniciar o sistema de conta VIP e não alterar `GET /reveal`.

## Aceite ainda necessário
- Compilação Android Java e regressões Node/Java.
- Teste de assinatura válida, assinatura adulterada e rollback.
- Testes reais em **Samsung S24 Ultra** com ambas Pokébolas e com contas/treinadores VIP distintos, API ON/OFF, GL/UL, Shiny, sprites (inclusive formas), Home, modos e menus.
- Testes reais em Moto G15/WebView Android 15, offline, rede oscilante, download interrompido e restaurar a versão anterior.
- Verificar que overlays que já estão abertos não sofrem hot-swap, e que ao reabrir o aplicativo ambos consumam o mesmo pacote validado.
- Conferir `GitHubUpdateCenter` ainda aponta só para o último APK estável.

## Evidência de APK QA assinado — 29/10/2026
- **GitHub Actions SUCCESS:** https://github.com/LucianoToscano/PokeSearch/actions/runs/40920012278
- **Artefato QA primário:** https://github.com/LucianoToscano/PokeSearch/actions/runs/40920012278/artifacts/12916174946
- **Arquivo interno:** `PokeSearch-v0.01.73-LT-QA.apk`, **49.514.961 bytes**.
- **SHA-256 do APK:** `dc8d688137a2b3b2955c98df2cb7828d22b04dc516d05d2194563f5fb0dcceae`.
- **SHA-256 do ZIP de artefato:** `6d979edcfc5efbc22b25b09f44179e8821a443d46dfc1cc7e01b22fc8093c8db`, **46.575.423 bytes**.
- **SOURCE_COMMIT do APK:** `edbe6e14462b60a9b1ea4b99154b879b744a8eec`.
- **Identidade Android:** `com.lucianotoscano.pokesearch`, `versionName 0.01.73`, `versionCode 54378`.
- **Certificado v2 SHA-256 permanente:** `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, verificado por apksigner; sem debuggable.
- **Outras verificações:** R8 presente, APK ZIP íntegro, Sprite Bundle no APK, `sha256sum --check` OK, regressões Node, compilação Android Java e QA de assinatura dos manifestos aprovados.
- **Escopo do resultado:** distribuição **somente como artifact QA**. Nenhum Release GitHub oficial, merge na main, push Firebase, alteração de Google Drive ou ativação do canal OTA. `ota/channel.json` continua `packVersion: 0`.
- **Bloqueio de publicação oficial:** testes físicos reais Samsung/Moto G15, Pokébola 1/2, duas contas/treinadores VIP, sprites Shiny/formas, API ON/OFF e rollback não foram realizados neste ambiente. Não confundir APK assinado/CI com homologação Android.

# LT173 — atualizações inteligentes (OTA) assinadas — 29/10/2026

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
`dock.html`, `detail.html`, `sprite_offline.js`, `sprite_visual_scale.js`, `visual_editor.js`, `pokemon_card_presentation.js`, `pvpoke-overall-ranks.js`, `pvpoke-iv-gamemaster.js`, `probe.js`, `release_notes.json`, `pokemon_catalog.json`. Nenhum arquivo de autenticação, Firebase, certificados, serviços Android nem credenciais.

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

# LT189 — Coordenadas sem contador visível + compatibilidade de buscas P1/P2 (30/10/2026)

**Status desta revisão no código:** integração e distribuição autorizadas pelo proprietário. **A execução automática ainda precisa aprovar build/assinatura/release antes de ser anunciada como publicada.**

## Alteração do botão Pegar Coordenadas
- Em `app/src/main/assets/detail.html`, `#coordsQuota` é mantido no DOM apenas para preservar o contrato dos callbacks JS, mas fica **`hidden aria-hidden="true"` e `display:none!important`**. Nenhum número, círculo de quota ou contador local/servidor é exibido sobre o botão.
- Espaço de botão reaproveitado: rótulo centralizado; quando reveladas, coordenadas ficam completas, com 7 px de margem de cada lado. Sem alterar os estados vermelho/verde, long press, toque/cópia e cooldown.
- `CoordsQuotaStore`, `window.coordsQuotaUpdated`, `Native.coords()`, quota e avisos reais de `coordsRateNotice`/429 **continuam ativos**. Não confundir ocultação visual com remoção de limite do serviço.
- `SecondaryOverlayService extends OverlayService` e ambos usam o mesmo `detail.html`: paridade P1/P2 sem alteração de preferências pessoais.

## Correção de API incluída (LT189 QA / PR #147)
- Após LT188, P1 e P2 relataram `API: invalid-request`. A alteração anterior havia posto `null` em `pvp_league` e `pvp_include_pre_evolutions` fora de GL/UL. O transporte mapeia HTTP 400/422 para esta mensagem.
- Restaurada estrutura tipada compatível com LT187 (`pvp_league` string `great/ultra`, `pvp_include_pre_evolutions` booleano). `pvp_mode=false`, `pvp_top_rank=null`, `pvp_min_cp=null` continuam nos modos não PvP.
- O servidor autenticado ainda não foi testado no Samsung; **não afirmar aceitação da API real com base em mocks ou compilação**.

## Testes de regressão necessários
- `node app/tests/lt189-get-coords-badge-hidden.test.js` (CSS, HTML, P1/P2, preservação de cópia/cooldown/quota).
- `node app/tests/lt189-api-default-schema.test.js` (12 cenários P1/P2 × 100%, 0%, IV 0/13/13, IV%, GL, UL em transporte simulado).
- `node app/tests/lt170-coords-provider-rate-notice.test.js`, `node app/tests/lt145-coords-quota.test.js`; testes históricos em `app/tests/*.test.js` + OTA/Android CI.
- **Teste físico pendente:** instalação sobre LT188 sem limpar dados; P1/P2 API ON e OFF, toque para revelar/copiar, rótulo não deslocado nem cortado, erro de servidor e aviso 429 legítimo.

## Publicação controlada
- Tag planejada `v0.01.89-54394`, APK `PokeSearch-v0.01.89-LT.apk`, assinatura permanente v2 SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, mesmos applicationId e prefs.
- Publicar só quando os testes do commit integrado e a assinatura conferirem; `Releases/latest` é o canal consultado pelo atualizador do app.
- Distribuição no Google Drive: preferencialmente **substituir apenas os bytes do APK no ID legado compartilhado `1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P`**, mantendo o mesmo link e MIME `application/vnd.android.package-archive`. Se impossível, usar **novo link para APK real** e documentar que o legado ainda entrega LT187; **nunca sobrescrever APK com ZIP**.
- Registrar SHA-256, tamanho, commit da release, resultado Actions e URL Drive após confirmação; **não inventar publicação concluída**.

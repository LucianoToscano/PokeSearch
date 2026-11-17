# PokeSearch LT381 — FastDev: sincronização de perfil e avatar (16/11/2026)

## Resultado
- PR [#472](https://github.com/LucianoToscano/PokeSearch/pull/472) **MERGED** em `main`, squash `9925c85779d291d3e8c5cf44003d5daa88270935`.
- SHA testado da branch: `fa696920b87a9cb56f6ecf1c3b5d2a39b549c7e0`.
- Solicitação de APK Preview assinada enviada por `fastdev/preview-request.json`, commit `2efceae23c91835ae3ddb3dd5f10663da7a6a7b0`, `request_id=fastdev-lt381-profile-avatar-20261116-01`. **A geração da release FastDev, o certificado e o APK instalável não foram confirmados neste registro.** O workflow depende da configuração do environment `fastdev-signing`; não improvisar nova chave.
- A release oficial `0.03.73 / versionCode 54580` e `release/official-request.json` foram preservados.

## Implementação (nativa)
1. Reconferência da mesma sessão em Conta 1/2 não apaga identidade já verificada. Nova autenticação/OAuth ou troca de identidade invalida a identidade anterior, o provedor, o cache e os dados do treinador até a confirmação do site.
2. `profile_summary.js` diferencia React hidratado de nome verificado (`identityVerified`/`syncReason`); nome vazio nunca conclui a sincronização no Android.
3. Captura com limite de 12 tentativas e até 20 segundos, feedback e fallback recuperável ao perfil oficial. Sessão explicitamente expirada altera a Home sem fingir conexão válida.
4. Foto ausente durante carregamento não remove a foto anterior quando o nome verificado continua idêntico. Foto de outra identidade nunca deve ser reaproveitada.
5. O botão Atualizar perfil força download com URL igual. Cache privado JPEG limitado a 350 KB/320 px por slot; só é lido com assinatura SHA-256 de slot+nome+URL e é apagado no logout/troca de identidade.
6. Callbacks de imagem verificam geração do pedido, sessão, nome e URL antes de atualizar a UI. Fim do download atualiza estado; indicador compacto mostra sincronização, falha parcial ou último sucesso.
7. Nenhum token, cookie, JWT ou cabeçalho privado é enviado para Java. Domínios HTTPS Google/Discord continuam allowlisted.

## Testes no HEAD da PR
- [FastDev smoke #43994503955](https://github.com/LucianoToscano/PokeSearch/actions/runs/43994503955): SUCCESS
- [Node completo LT169 #43994504048](https://github.com/LucianoToscano/PokeSearch/actions/runs/43994504048): SUCCESS
- [Core LT211 #43994503990](https://github.com/LucianoToscano/PokeSearch/actions/runs/43994503990): SUCCESS
- [Java LT62 #43994504095](https://github.com/LucianoToscano/PokeSearch/actions/runs/43994504095): SUCCESS
- [OTA LT173 #43994503967](https://github.com/LucianoToscano/PokeSearch/actions/runs/43994503967): SUCCESS
- [Node QA #43994504200](https://github.com/LucianoToscano/PokeSearch/actions/runs/43994504200): SUCCESS
- [PGS APK QA #43994504051](https://github.com/LucianoToscano/PokeSearch/actions/runs/43994504051): SUCCESS
- [Beta isolada #43994504122](https://github.com/LucianoToscano/PokeSearch/actions/runs/43994504122): SUCCESS; **não é release oficial nem assinatura permanente FastDev**.
- Contratos novos `app/tests/lt381-profile-sync.test.js` cobrem DOM, Google, Discord, URLs Next.js, perfil parcial, retries, preservação, cache, logout e limites de slots.

## Limites e QA pendente
- A confirmação do funcionamento no Android físico, Samsung Android 11–14, OAuth Google/Discord/2FA, CDN real e offline após reinício permanece **pendente**.
- O extrator ainda depende do DOM visível do site oficial. Não houve migração para `GET /users/me`, pois requer contrato de autenticação revisado e autorização específica; manter a política sem leitura de JWT/localStorage.
- O APK Preview permanente não está comprovado pela simples solicitação do workflow; verificar execução, SHA-256, packageId separado `com.lucianotoscano.pokesearch.preview`, certificado e asset antes de orientar instalação.
- A release oficial permanece intacta; não declarar LT381 oficial ou disponibilizar o Preview para usuários finais antes da homologação.

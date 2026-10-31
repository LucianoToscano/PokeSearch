# LT204 QA — Busca com ou sem login; Shiny temporariamente pausado (31/10/2026)

## Confirmado pelo usuário
- PoGoCoordinates continua aceitando **busca normal anônima e autenticada**.
- O recurso de identificação de **Shiny por treinador não funciona atualmente** no provedor. Não tratar essa indisponibilidade como falha do login nem bloquear buscas de IV, PvP, espécies ou localização.
- O login das Contas 1/2 é opcional para busca. Vínculo de treinador não é requisito e não deve poluir o menu/Home.
- A integração do recurso Shiny e os vínculos existentes devem permanecer intactos para eventual retomada, sem forçar nova vinculação hoje.

## Implementação
- Política reversível `ProviderFeatureFlags.SHINY_AVAILABLE=false`: Shiny não é enviado como ativo, inclusive com preferência antiga ON. Toque no ícone informa pausa e não aciona fluxo de autenticação/vínculo. O código original de verificação fica disponível para futura ativação explícita após confirmação do serviço.
- Home: nas contas logadas, esconde as seções de treinador sem reservar altura vazia; mantém nome de conta e ações de login/logout; labels de P1/P2 indicam **Conta 1/2 · Logado/Visitante** em vez de `Treinador —`.
- Ao escolher a conta de uma Pokébola, vínculo de treinador não é solicitado. O perfil da Conta 2 pode ser atribuído como visitante **somente se o Android WebView oferecer perfil separado**, nunca misturando cookies da Conta 1. `bindAccountOnly` preserva seleções históricas de treinador para o futuro.
- A API segue o contrato normal `shiny_only=false` e `shiny_account=null`; os limites reais continuam conforme resposta do serviço (5 anônimo, 10 Free autenticado, níveis VIP quando retornados).
- Não altera `background_only` nem a política de cotas e `Retry-After`; recursos não relacionados permanecem sob contrato independente.

## Testes
- `node app/tests/lt204-login-optional-shiny-paused.test.js`.
- Toda regressão Node, UI, fluxo de autenticação/contas, Java/Android e OTA.
- Samsung: P1 visitante + P2 visitante (perfis isolados), P1 autenticado + P2 visitante, ambos logados; 100%, 0%, IV, GL, UL e localização; confirmar que o ícone ✨ mostra pausa e não altera filtros. Tentar reiniciar com preferência antiga Shiny ON para confirmar busca normal sem treinador. Preservar perfis já cadastrados para eventual reativação.

## Nota de homologação
A disponibilidade atual do recurso Shiny é uma declaração do usuário, não uma confirmação contratual permanente do PoGoCoordinates. A reativação deve exigir nova validação real antes de alterar a chave de recurso. Não apagar perfis, cookies ou vínculos salvo logout explícito.

## Publicação oficial verificada (31/10/2026)
- [PR #172 mesclada](https://github.com/LucianoToscano/PokeSearch/pull/172): source merge commit `ea3a4b72add2b6b9f3f66a63858ef07904406411`.
- [Workflow oficial #41231635596](https://github.com/LucianoToscano/PokeSearch/actions/runs/41231635596) **SUCCESS**, incluindo regressões Node, compilação protegida, assinatura original v2, publicação e verificação do hash.
- [Release público LT204 / latest](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.04-54411): APK 29.263.311 bytes, SHA-256 `73a72edeea948747666dc18401cd13348301b9fe5f70d26971ed29fdf95f53cf`.
- [Google Drive — ZIP LT204 com APK e relatórios](https://drive.google.com/file/d/1pxeWIcjyJLpMonkg2u8hFzhwEt-f0Nuy/view?usp=drivesdk): 26.922.166 bytes, SHA-256 `07162ab631099cacab3f2f8133ae5b80fd614699eec4a1783e8dbd05e0751d4c`. A assinatura do APK interno é v2, com certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- Testes automatizados não demonstram êxito da busca em tempo real no Samsung. O HTTP 422 original precisa de uma inspeção separada por rota e campo rejeitado; não atribuir automaticamente a erro de login ou ausência de treinador.

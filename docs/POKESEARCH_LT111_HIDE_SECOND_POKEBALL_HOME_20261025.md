# LT111 — Ocultar a opção de ativar segunda Pokébola na Home

Data: 25/10/2026. Repositório: `LucianoToscano/PokeSearch`.

## Segurança e estado
- `main` no início: `e20f4c0469787edef1a4489159d44036dbc24bf0`.
- Backup intocado: `backup/lt110-before-hide-second-pokeball-home-20261025`.
- Trabalho isolado em `fix/lt111-hide-second-pokeball-home-20261025`.
- Não mudar `applicationId`, namespace, sessão/cookies, notificações, mural, favoritos, sprites, filtros nem o APK estável.

## Alteração limitada
- `MainActivity.buildHome()` oculta **somente** a linha `Segunda Pokébola · filtro independente` com `dualOverlayRow.setVisibility(View.GONE)`, antes de anexá-la à Home.
- `View.GONE` não reserva altura, não permite toque nem navegação de acessibilidade para a linha. Não esconder o botão principal.
- `SecondaryOverlayService`, sua assinatura, `prefs_secondary`, filtros 0/0/0 e estado de execução são **mantidos**. Se a segunda Pokébola já estiver rodando, ocultar o botão não a interrompe automaticamente.
- Rotinas históricas de toggle/atualização do controle são preservadas, porém o botão não aparece na Home. O recurso poderá ser reexposto futuramente sem perder filtros ou dados.

## QA
- `app/tests/lt111-hide-second-pokeball-home.test.js` verifica que a linha é GONE e a Pokébola principal permanece funcional, com sessão/serviço secundário e preferências preservadas.
- Pipeline `.github/workflows/lt111-hide-second-pokeball-signed-qa.yml` verifica regressões completas Java/JS, 2050 sprites offline, R8 e assinatura permanente Android. Versão candidata `0.01.11`, `versionCode=54315` (maior que 54314), pré-release QA imutável.
- Conferir no Samsung: item de segunda Pokébola ausente na Home, nenhum espaço vazio; botão principal normal; nenhum reset de dados; se o overlay 2 já estiver ligado, ele continua até parada de serviço.
- Sem alteração do arquivo no Google Drive nem promoção a canal estável, aguardando QA no dispositivo.

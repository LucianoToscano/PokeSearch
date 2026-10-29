# PokeSearch — LT169 QA: visibilidade de Perfis (29/10/2026)

## Base
- Parte da **LT168 oficial (0.01.68 / versionCode 54373)** e de seu HEAD em `main`.
- Mudança isolada apenas na Home, `MainActivity.java`, no botão para trocar treinador PoGoCoordinates.
- Não alterar versão pública, assinatura, APK, releases, Firebase, Premium, chat ou overlay.

## Regra solicitada
- Sessão sem login, sem treinador confirmado ou com **zero/um treinador vinculado válido**: ocultar o botão por `View.GONE`, sem reservar espaço.
- Sessão vinculada com **dois ou mais treinadores distintos**: exibir botão de troca e manter `Escolher (N)` e o diálogo nativo existente.
- Validar `profileTrainerList` como JSON e contar apenas códigos de 12 dígitos com nomes válidos, sem duplicatas; evitar botão fantasma por registros inválidos.
- Ao tocar, abrir apenas o seletor; o botão `Gerenciar/Remover` já existente continua responsável pelo vínculo no site.
- Troca mantém persistência de seleção, broadcast `TRAINER_CHANGED`, sincronização do Shiny e estados das duas Pokébolas.

## Testes e aceite
- Alterar regressão histórica `app/tests/lt141-vip-trainers-results.test.js` para a regra atual.
- Adicionar `app/tests/lt169-trainer-profiles-visibility.test.js` verificando condicional de visibilidade, contagem distinta, ausência de fallback indevido e preservação do seletor.
- CI Android/Node e teste real no Samsung ainda precisam ser observados. Verificar com contas de 0, 1, 2 e 3 treinadores; alternar treinador e abrir a Home novamente.
- **Status:** alteração de código em branch de QA; nenhum merge, Release ou atualização pública autorizados nesta etapa.

# PokeSearch — LT169 QA: visibilidade de Perfis (29/10/2026)

## Base
- Parte da **LT168 oficial (0.01.68 / versionCode 54373)** e de seu HEAD em `main`.
- Mudança isolada apenas na Home, `MainActivity.java`, no botão para trocar treinador PoGoCoordinates.
- Não alterar versão pública, assinatura, APK, releases, Firebase, Premium, chat ou overlay.

## Regra solicitada
- Sessão sem login, sem treinador confirmado ou com **zero/um treinador vinculado válido**: ocultar o botão por `View.GONE`, sem reservar espaço.
- Sessão vinculada com **dois ou mais treinadores distintos**: exibir **somente um pequeno ícone vetorial de alternância**, à direita imediata do texto `Treinador vinculado`; sem botão largo, legenda `Perfis` ou área vazia. O toque continua abrindo o diálogo de escolha existente.
- Validar `profileTrainerList` como JSON e contar apenas códigos de 12 dígitos com nomes válidos, sem duplicatas; evitar botão fantasma por registros inválidos.
- Ícone inspirado na referência enviada pelo usuário: duas pessoas e setas circulares, redesenhado com linhas finas, cor suave por tema, fundo transparente e feedback nativo ao tocar. Implementado em `res/drawable/ps_trainer_switch.xml` e `ImageButton` de 36 dp, com descrição acessível informando a quantidade de treinadores. O botão `Gerenciar/Remover` já existente continua responsável pelo vínculo no site.
- Troca mantém persistência de seleção, broadcast `TRAINER_CHANGED`, sincronização do Shiny e estados das duas Pokébolas.

## Testes e aceite
- Alterar regressão histórica `app/tests/lt141-vip-trainers-results.test.js` para a regra atual.
- Adicionar `app/tests/lt169-trainer-profiles-visibility.test.js` verificando condicional de visibilidade, contagem distinta, ausência de fallback indevido e preservação do seletor.
- CI Android/Node e teste real no Samsung ainda precisam ser observados. Verificar com contas de 0, 1, 2 e 3 treinadores; alternar treinador e abrir a Home novamente.
- **Status:** alteração de código + ícone vetorial em branch de QA/PR #113; nenhum merge, Release ou atualização pública autorizados nesta etapa.

## Privacidade na Home (ampliação LT169, 29/10/2026)

A pedido do proprietário, acrescentadas três opções independentes em **Home → menu ☰ → Preferências → Privacidade na Home**:

- `homeShowPogoAccountName` (padrão `true`): quando desmarcada, somente o nome exibido da conta PoGoCoordinates/Google na Home vira **Anônimo**.
- `homeShowTrainerName` (padrão `true`): quando desmarcada, somente o nome do treinador vinculado na Home vira **Anônimo**.
- `homeShowTrainerCode` (padrão `true`): quando desmarcada, o código na Home vira **XXXX XXXX XXXX**.

Checkboxes atualizam a Home imediatamente e persistem por instalação em `SharedPreferences("prefs")`. Ausência de vínculo mantém os textos de nenhum treinador/não confirmado. A alteração é **apenas de apresentação**: não modifica identificadores reais, sessão, autorização, troca de treinador, PoGoCoordinates, consultas, Shiny, duas Pokébolas ou chat. O botão de copiar código continua copiando o código real mesmo quando mascarado; não exibir o valor em toast.

Por privacidade e para não transferir estado de ocultação entre dispositivos, as três preferências de apresentação **não são incluídas no backup exportado/importado da Home**, que usa whitelist explícita. O armazenamento da sessão já existente permanece protegido pelo fluxo atual, sem escrever contas em Firebase. A foto/ícone da conta permanece como antes (não foi solicitada sua ocultação).

Teste novo: `app/tests/lt169-home-identity-privacy.test.js` (3 flags e independência, máscaras, valores originais, fluxo de cópia, proteção da importação/exportação e contraste claro/escuro). Homologação Samsung e CI do HEAD final pendentes de validação antes de publicar.

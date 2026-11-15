# LT365 — Auditoria visual e melhorias reais do Radar PokeList

## Base conferida no GitHub
- Início: PokeSearch **0.03.60**, code **54567**, label **51364**, `main` `2dc4131d9c153d8e36bd7a365f7eb5918c55be12`.
- [Última release estável antes da LT365](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.60-54567), APK SHA-256 `e4a1cffbe7ceeef596214f14f9b3c73720763e50fc5288da97ae88acc3ca1927`.
- Proprietário já declarou **autorização de utilização dos APKs/APIs** para interoperabilidade e desenvolvimento. Não solicitar reconfirmação.
- Fontes visuais: seis screenshots fornecidos na conversa de 15/11/2026, incluindo mapa Pokémon GO com overlays, página de preferências Auto Hunt, tela PokeList v1.3.18 com seis linhas de resultados IV100, menu com serviço ativo/desativado, marcadores e confirmação de ação "Tocou". Não importar screenshots privadas nem posições específicas ao repositório.

## O que as imagens realmente mostram
1. PokeList v1.3.18: resultados por espécie/forma `(SPS)`, sexo masculino/feminino, símbolo de país, IV **100**, PC e nível, data/hora de despawn, distância em quilômetros e cooldown exibido, além de controles `START SERVICE`, `STOP SERVICE`, `RESET POSITION`, modo `Tele` / `Tele & Copy` e barra de posição.
2. Sobreposição do PokeList/cliente no mapa: círculos numerados/coloridos, indicador de alvo/mira, botões laterais de reset/posição, indicador de cooldown e marcador de toque.
3. Auto Hunt do aplicativo de referência: espera configurável (na captura 35 s), gatilhos de alerta por IV100/Shiny, interromper em Shiny/IV100/Ditto, toque/vibração, opção exibir cooldown/informações, clicar após encontrado, n.º de cliques, recuperação de carregamento do mapa, reinício, Auto Catch, duração de swipe, limite de lançamentos, zoom e sensor de proximidade.
4. A mensagem na captura **"Tocou"** comprova **somente uma mensagem de feedback na tela**; não prova deslocamento real, encontro/captura, Shiny ou clique validado por dispositivo. Desenhar círculos sobre o mapa também não valida a precisão.

## Diferenças reais da LT364 e trabalho aplicado
- O Radar PokeList LT364 tinha campos base `number,name,form,IV,level,CP,endTime,lat/lng`, botão `Copiar`, mas **não** mostrava IV100 destacado, gender/country, distância calculada, cooldown de referência, hora de desaparecimento, marcadores numerados, ordenação nem filtro local IV100.
- `PokeListResultPolicy.java` usa **Haversine** para calcular distância de **centro digitado** → coordenada informada pela API; valida números/latitudes e reutiliza **a MESMA** `CandyCooldownPolicy.recommendedSeconds`/compactTimerLabel já existente no Doce Raro. O cooldown é apenas **hipótese informativa** da distância, **não** cronômetro real/garantia. Sem posição do avatar, sem GPS automático e sem marcar teleporte como realizado. `despawnLabel` usa horário local e validade; `genderLabel/countryLabel` mostram apenas valores de API explicitamente conhecidos (nunca inferem gênero numérico ou país de coordenadas).
- `PokeListFeedClient.Item` aceita **opcionais** `gender`, `country` e `shiny` booleano, quando presentes, sem inventar Shiny pela imagem ou determinar que o backend os entrega.
- `PokeListRadarActivity`: cartões compactos com número de resultado em aro fino (cores informativas), IV100, PC, nível, sexo, país, sinal Shiny **indicado pela API**, hora/tempo restante até desaparecer, distância do centro e cooldown apenas indicativo. Ordenações locais por origem, distância, fim do spawn, IV e PC; checkbox `IV100`. Reordenação e contagem regressiva local a cada 15 s **não realizam nova consulta, gesto ou rede**. Copiar coordenadas tem ação explícita e é bloqueado quando o registro já expirou. Não há armazenamento adicional de localização nem permissão nova.
- Novos testes puros `PokeListResultPolicyTest.java` e contrato Node `lt365-pokelist-screenshot-results-contract.test.js`. Gate LT211 compila a política junto à `CandyCooldownPolicy`.

## Não implementado nesta etapa
Os controles Auto Hunt, reset de posição, modo Tele/Tele & Copy e captura automática são **funcionalidades observadas no aplicativo de referência**, não comprovadas na interface pública do PokeSearch. Esta etapa **não** liga root, injetor, teleporte, restart de jogo, Auto Catch, cliques/rede recorrentes, leitura de notificação privada, filtro de Shiny não comprovado ou recuperação de mapa automatizada. A política atual do monitor visual já tem salvaguardas próprias; qualquer novo comando exigirá estado seguro, cancelamento, gesto confirmado e teste físico, sem automatizar avisos humanos `Sou passageiro`. Evitar criar sliders sem ação.

## Limitações de evidência e aceitação
- **Backend PokeList em produção ainda não foi consultado nesta sessão**: nomes e tipos de campos opcionais, semântica de distância/cooldown, conteúdo de `shiny` e país precisam ser verificados contra resposta real. Campo ausente não gera informação inventada.
- A tabela de cooldown do PokeSearch é de referência existente, **não garantia de tempo do jogo**; centro da consulta pode diferir da posição atual. Não afirmar cooldown decorrido apenas por copiar coordenadas.
- Continuidade de perfis Pokemod/PGSharp, filtros P1/P2, Edu, Doce Raro, autorização do Android, LT357, OTA, acessibilidade e aparência compacta é obrigatória.
- **Pendente Samsung físico**: screenshots com informações similares no novo Radar, IV100, sexo/país/forma, tempo, distância, campos ausentes, 1/5/10/80 resultados, retrato/paisagem, TalkBack, reload sem internet, 429, ausência de toque/teleporte no PokeSearch, feedback visual genuíno, CPU/RAM. Atualizar issue #350 com evidência real.

## ARK
**Implementação candidata:** branch `feat/lt365-pokelist-results-cooldown`. Registrar PR e 7 gates no mesmo SHA, merge, pedido monotônico `versionCode >54567` e release oficial antes de marcar como PUBLICADO. Nunca confundir QA em CI com homologação de Auto Hunt físico. Instruções de continuação em `docs/LT365_PROMPT_CONTINUIDADE_LT366_20261115.md`.

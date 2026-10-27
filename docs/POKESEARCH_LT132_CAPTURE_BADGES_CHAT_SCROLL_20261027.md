# LT132 — Cards de captura e rolagem do chat

Data: 27/10/2026. PR #91, QA `0.01.32 / 54337`. Base: LT131 PR #90, sem merge em main.

## Novo cartão compacto de conquista

- Primeira linha: [sprite verificada] `🎉 Luciano capturou um Quagsire!` ou `✨ Luciano capturou um Ditto!`. **O IV não é repetido nessa linha.**
- Selos com imagens já existentes em `app/src/main/assets/result-icons/modes/`: `StarIVRaw.png` e `StarGL.png` ou `StarUL.png`. Para raridades 15/15/15 e 0/0/0, usar `result-icons/hundo.png`, `shundo.png`, `nundo.png`, `shnundo.png` (já no APK).
- Na segunda linha opcional: **tamanho**, quando conhecido, e **sexo sempre por último**. Cores ♂ azul, ♀ rosa, ⚲ neutro. Nenhum selo se o atributo estiver ausente.
- Para rank GL/UL, exigir `ivRankSource=api-pvp` com `ivRankLeague` e `rank` ou `explicit-species-iv` com `ivRank` confirmado e liga declarada. Nunca anunciar GL/UL apenas porque o modo ou o filtro Top-N estava selecionado.
- IV exato validado (0 a 15); 15/15/15: Hundo ou Shundo; 0/0/0: Nundo ou Shnundo. Nenhum selo de rareza se faltar IV ou se for diferente dessas combinações.
- `Detalhes ▾` expande PC, nível, golpes e boost **somente quando informação explícita tiver sido encontrada no resultado**; expansão não ativa popups nem notificações e não rola o histórico automaticamente.
- Fotos de avatares, horário, quatro reações ❤️ 👍 🎉 ✨️ e mensagens antigas LT131 ficam preservadas. Sprite normal/Shiny via catálogo e assets offline; formas/costumes sem sprite exata ficam sem imagem, evitando substituição incorreta.

## Problema informado pelo usuário: chat não rola até o fim

- Causa provável: `MainActivity` já contém o `ScrollView stage1HomeScroll`, enquanto o chat usa outro `ScrollView timeline` dentro do card — a disputa entre gestos e a reconstrução das mensagens interferiam no scrolling.
- Correção `CommunityScrapbookOnline`: nested scrolling habilitado; barra de rolagem visível; gesto de arrastar é tratado pelo histórico enquanto ele pode rolar, e repassado à Home quando atinge início ou fim; `MotionEvent.ACTION_UP/CANCEL` libera interceptação sem suprimir fling/reação/long press.
- Nova mensagem rola até o fim somente se a pessoa já estava no fim ou se é a carga inicial. Se estiver lendo mensagem antiga, preserva a posição. Mudança de reação ou clique em `Detalhes ▾` reconstrói o card sem arrastar o chat à última mensagem.
- Não alterar o tamanho nem o layout da Home e não roubar gestos do Pokémon GO.

## Banco de dados, privacidade, paridade

- `CaptureChatCard` serializa as informações opcionais em texto (até 240 caracteres) dentro do atual `chat/messages/text`, por compatibilidade com as rules já publicadas. Nenhuma adição ao RTDB: `stats/online`, `stats/installations`, `premium` e `distribution` intocados.
- `CaptureSharePublisher` mantém `authorUid`, `nickname`, `text`, `createdAt`. Não grava coordenadas, GPS, PC estruturado, JWT, encounter ID ou imagens no Firebase. O PC no texto é opcional, fruto de consentimento explícito ao compartilhar.
- Permanecem a confirmação dupla e a recomendação de ignorar o botão sem custo no jogo. `OverlayService` é herdado pela segunda Pokébola, garantindo paridade funcional.

## QA

- `app/tests/lt132-capture-badges-nested-scroll.test.js`: selos, sexo por último, fonte PvP, privacidade, modo IV, rolagem aninhada, posição de leitura e preservação de regras de produção.
- CI: `.github/workflows/lt132-capture-badges-scroll-signed-qa.yml` versão `0.01.32` / `54337`, Android R8 + certificado v2 permanente + ZIP APK verificado antes de disponibilizar link.
- Ainda não há teste Samsung real nem prova da rolagem em aparelhos com dimensões diferentes. Solicitar captura ou vídeo de teste se o problema persistir após instalar QA; código/CI não substituem QA física.


## QA efetivamente produzida

- Compilação auditada: https://github.com/LucianoToscano/PokeSearch/actions/runs/40482871143 (**SUCCESS**).
- GitHub Artifact contém APK real: https://github.com/LucianoToscano/PokeSearch/actions/runs/40482871143/artifacts/12724036682.
- APK: `PokeSearch-v0.01.32-LT132-Capture-Badges-Scroll-QA.apk`; `0.01.32 / 54337`, 43.375.725 bytes, SHA-256 `d9ec2a10d8c64ae106d425030ed8a71c07150b4935d23b841ef5fe8c566d4534`.
- ZIP GitHub 40.889.410 bytes, SHA-256 `5cda01b6def945af746a72689042a3bcd6ea4fea46e83328ac4aa3cf0a1552e6`. CRC ZIP e APK íntegros, hash do APK corresponde a `SHA256SUMS.txt`.
- SOURCE_COMMIT: `5a47998fddc0bc42077e11442505655e1e459b33`. Commits posteriores apenas testes/documentação; código de gesto e badges incluído no build.
- Certificado Android v2 verdadeiro, certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, igual ao histórico permanente. Assets verificados `StarIVRaw`, `StarGL`, `StarUL`, `pokemon-sprites/base/195.png`.
- O detalhe adicional da correção de rolagem permite desde ACTION_DOWN que a Home capture o toque quando há poucas mensagens, evitando o bloqueio no retângulo vazio do chat.
- **Não houve teste físico Samsung nem aplicação Firebase em produção.** Usuário precisa testar arraste da Home na área vazia, chat com histórico longo, reações e o botão de mensagem no fim da tela.

# LT133 — Halloween 2021 + chat de capturas compacto

Data: 27/10/2026. Repositório LucianoToscano/PokeSearch. PR #92, branch `feature/lt133-halloween-sprites-compact-chat-20261027` empilhada na LT132 PR #91. Versão QA `0.01.33`, versionCode `54338`.

## Correções solicitadas a partir das capturas do Samsung

1. Em PoGoCoordinates, **Piplup #393, Drifblim #426 (Halloween 2021 Costume)** mostram a roupa original normal/Shiny, mas o PokeSearch não os reconhecia. Causa confirmada: `sprite_offline.js` só mapeava trajes COPY_2019 e GOGGLES_2026. O contrato da API omite URL de sprite, por isso a base comum PokeAPI não seria a sprite da roupa.
2. O anúncio estava alto demais: mini sprite a 38dp, IV/PvP na primeira linha de selos, tamanho e sexo em outra, `Detalhes ▾` expansível, horário e reações em faixas adicionais.
3. O pedido atual é **até duas linhas de conteúdo da captura**: primeira com sprite encostada no texto, segunda com raridade/IV/GL/UL/tamanho/sexo **à direita e imediatamente antes do relógio**. Reações continuam abaixo como controles usuais do chat.

## Assets de Halloween adicionados — origem exata e auditável

- Fonte fixa PokeMiners `pogo_assets` commit `c2a686eb08ace6e890d8fe3d2134c76988db87b5` em `Images/Pokemon - 256x256/Addressable Assets`.
- **Pikachu #25:** `pm25.cHALLOWEEN_2021_NOEVOLVE.icon.png` SHA-1 do Git blob `5e4e96b15cfe4f0f53b051e2559562befb0e67c2`; Shiny `pm25.cHALLOWEEN_2021_NOEVOLVE.s.icon.png` SHA-1 `b23ab862eee002873d49b4e2e83576064962d553`.
- **Piplup #393:** `pm393.cHALLOWEEN_2021_NOEVOLVE.icon.png` SHA-1 `8b32f8f2b1fc8a9cc664ad3775664a7b6adaa434`; Shiny `pm393.cHALLOWEEN_2021_NOEVOLVE.s.icon.png` SHA-1 `421f925fd8a0797529a09d6042e46c700d26540c`.
- **Drifblim #426:** `pm426.cHALLOWEEN_2021_NOEVOLVE.icon.png` SHA-1 `24f1d017f85fe429c8ead5b0fc64485f034a47f7`; Shiny `pm426.cHALLOWEEN_2021_NOEVOLVE.s.icon.png` SHA-1 `ac5464c1b4c038569b69b860f9703191de85d872`.
- O script `app/scripts/build_sprite_bundle.py` empacota esses **seis PNGs**, verifica cabeçalho, dimensão e **Git blob SHA1 fixo**; manifesto passa de 10 para **16 trajes**. O CI verifica esses exatos seis arquivos dentro do APK.
- `sprite_offline.js` reconhece unicamente os aliases `Halloween 2021 Costume`, `HALLOWEEN_2021_NOEVOLVE`, `Halloween Mischief 2021`, `HALLOWEEN2021` para espécies #25/#393/#426. **Nunca** usa sprite base em outro ano ou traje desconhecido. O mesmo JS é consumido por resultados, detalhes, formas e ambas Pokébolas; não é uma correção só do chat.
- `CaptureChatFormat.exactCostumeAsset` permite sprite igual à do resultado em um anúncio já compartilhado, sem novos campos Firebase; `compactName` encurta títulos suportados para a espécie comum exibida com sprite de roupa, mantendo a informação do evento no texto bruto da mensagem.

## Nova UI em 2 linhas sem poluição

- **Linha 1:** imagem normal ou Shiny, **27dp** com margem direita **2dp**, e `✨ Luciano capturou um Natu!` ou `🎉 Luciano capturou um Quagsire!`. Texto **11sp em 1 linha**, ellipsis para apelidos muito grandes.
- **Linha 2:** uma única faixa compacta alinhada à direita contendo: **Hundo/Shundo/Nundo/Shnundo (ou IV A/D/S)**, GL/UL confirmado, tamanho quando conhecido, **sexo por último**, e horário à extrema direita. Ícones `StarIVRaw.png`, `StarGL.png`, `StarUL.png` e ícones de raridade existentes. Se tudo não couber em telas pequenas, apenas a faixa de selos pode deslizar horizontalmente; **nunca quebra em uma terceira linha**.
- **Sem expandir detalhes:** remove `Detalhes ▾`, PC, nível, golpes e boost de novas publicações de captura. Mensagens antigas LT131 e LT132 continuam legíveis: o renderizador mostra a versão compacta delas, mesmo quando o texto bruto continha atributos extras.
- Horário permanece na mesma segunda linha; as 4 reações ❤️ 👍 🎉 ✨️ permanecem como interação compacta normal abaixo, sem som nem rolagem forçada. Sem alteração em avatares.
- Não interrompe Pokémon GO: `Get coords` permanece cópia normal; anúncio só após toque e confirmação expressa. Nada é publicado automaticamente.

## Privacidade / estabilidade / QA

- `chat/messages` usa o schema anterior (`authorUid`, `nickname`, `text`, `createdAt`), sem campos estruturados extras ou coordenadas. As regras Firebase de `stats`, `premium`, `distribution`, `reactions` e privilégio Google não são implantadas nem alteradas.
- `app/tests/lt133-halloween-costume-compact-chat.test.js` verifica os três trajes normal/Shiny, aliases, bloqueio de 2022, 2 linhas, sprite 27/2dp e sexo por último. Tests antigos atualizados para verificar 16 assets e compatibilidade.
- CI `.github/workflows/lt133-halloween-compact-chat-signed-qa.yml` assina usando o certificado permanente R8/v2 e publica QA com tamanho, versão, CRC e SHA-256. **Não é homologação física:** instalar sobre LT132 e testar resultados/detalhes P1+P2, shinies Halloween, expansão do chat e rolagem da Home, incluindo aparelho de resolução menor.
- Não fazer merge main/release oficial sem aprovação do usuário. GitHub Actions Artifact é a entrega principal (Issue #84 — sandbox “Library file not found”).

# LT277 — Ordem normal/inversa no PokeSearch, API /search (06/11/2026)

## Evidência adicional recebida
O usuário forneceu testes atuais de `POST /search` demonstrando que o prefixo `-` é aceito pela API para `CP`, `IV`, `LEVEL`, `DSP` e `DISTANCE`. O primeiro levantamento, que concluía ausência de ordenação inversa, foi corrigido. **A fonte desses testes é o relato do usuário**; não houve nova chamada autenticada do PokeSearch a esse endpoint durante esta auditoria.

Os testes relatam:
- `sort:"-CP"` — resultados por PC crescente de modo consistente.
- `sort:"-IV"` — retorna valores IV tipicamente mais baixos, **mas não ordena estritamente**. Eevee 48,9 / 26,7 / 62,2 / 86,7 / 44,4% é um contraexemplo. Em Pidgey com `iv_percent_max:40`, o teto filtra corretamente, mas a sequência continua não crescente.
- `sort:"-LEVEL"`, `sort:"-DSP"`, `sort:"-DISTANCE"` — prefixos reportados como aceitos, sem prova equivalente da monotonicidade final. A UI não promete garantia além dos testes.
- Em `/map/lookup` o prefixo é **rejeitado**, portanto a implementação não adiciona sinal de menos ao mapa nem a raids, quests, gyms, etc.

## Implementação
- `api_result_contract.js` mapeia estritamente os novos valores de UI `CP (lowest)`, `IV % (lowest)`, `Level (lowest)`, `Despawn (shortest)`, `Distance (farthest)` para `-CP`, `-IV`, `-LEVEL`, `-DSP`, `-DISTANCE`, **somente via `POST /search`**. Não permite nomes inventados, e os dois tipos de ordenação por distância exigem coordenadas e raio.
- `dock.html`: opções todas traduzidas PT-BR, com botão **Padrão/Inverso** no topo do mesmo menu compacto de cinco itens; preservar os identificadores do protocolo em inglês. Em `IV % (baixos*)` surge alerta objetivo de que a sequência não é garantida e o filtro `IV % máximo` oferece a restrição correta.
- `OverlayService.java`: só oferece opções inversas quando a fonte autorizada é API. Em modo DOM a UI recebe apenas as cinco opções oficiais; um valor inverso persistente não dispara consulta enganosa no site. Em falha transitória da API com ordem inversa, **não** realizar fallback DOM alterando silenciosamente a ordem. Preservar resultados prévios e informar o erro.
- Localização OFF restaura Despawn a partir de `Distance (nearest)` e `Distance (farthest)`. Mudar de OFF para ON continua escolhendo distância próxima por padrão, com liberdade para alterar depois. Duas Pokébolas seguem o mesmo contrato.

## Exemplo conservador
Para buscar IVs baixos de Eevee, `{"pokemon_ids":[133],"sort":"-IV","iv_mode":"percent","iv_percent_min":0,"iv_percent_max":40}` combina *orientação para baixo* com o teto real. O retorno não deve ser descrito como estritamente crescente.

## Escopo separado — outras descobertas
Os relatos sobre `min_ttl`, `blacklist_*`, `always_show`, `powerspots`, `rarecandy`, `showcases` e IV bruto parcial ficam documentados **para auditoria futura**. Os dois primeiros já constam em contratos internos, mas acesso à API/credenciais/permissões deve respeitar o servidor e o nível de conta. `always_show` e modos de mapa não serão enviados a `/search`; o mapa não receberá prefixo inverso. Não habilitar recursos rotulados VIP apenas porque um teste isolado retornou HTTP 200.

## QA e rollout
- Validar no mesmo branch: Node, interface P/M/G, Android Java e OTA; confirmar que `-CP` é serializado sem conversão e que `-IV` não recebe uma promessa de ordem global.
- Em aparelho Samsung, testar cada opção com o provedor conectado e ambas as Pokébolas. Sem acesso autenticado nesta execução, a interface e o contrato podem ser testados, mas não o resultado ao vivo.
- **Resultado:** PR #270 integrada na main; release oficial **LT277 `0.02.77/54481` publicada e assinada**. O teste físico e a confirmação da ordenação ao vivo na API em Samsung continuam pendentes.

## Encerramento pós-publicação
- PR #270 mesclada em `8e98ed2ec4e9d75224f4dbe46f80ad37e5e6a8a6`, oito checks automáticos `success` no head `79fee0d41de3789d1928a6262a4099db5649a88b`.
- Workflow [#42318676353](https://github.com/LucianoToscano/PokeSearch/actions/runs/42318676353) concluiu preflight e publicação `success`: build protegido, assinatura, SHA-256 e upload verificados.
- Release [v0.02.77-54481](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.77-54481) `PokeSearch-v0.02.77-LT.apk` (33.614.942 bytes), SHA-256 `f9efdea4c75c896d4c1d3beae95ed7a2744833250c0267f5ccb7ce7647c88851`, publicada em 07/11/2026 00:33:34 UTC.
- **Não afirmar:** que o aplicativo já foi instalado em Samsung ou que a API ordena `-IV` rigorosamente. A homologação física não foi realizada nesta execução.


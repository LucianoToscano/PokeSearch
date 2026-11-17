# LT400 — Inventário visual por variante, classificações e QA (17/11/2026)

## Base e objetivos
Base pública verificada: **PokeSearch v0.03.84 LT (versionCode 54591)**, branch `feat/lt400-inventario-sprites-formas-categorias`. Não alterar os 16 ícones Home, overlays P1/P2, busca, autenticação, comércio ou assinatura.

Solicitação: auditar **todos** os IDs/sprites conhecidos em vez de corrigir só os screenshots; construir índice com imagens normais, Shiny, diferenças de gênero, formas, trajes e modelos visuais de evento; preservar privacidade e integrar ao inventário pessoal.

## Auditoria da base original PGSStats (somente estatísticas agregadas, sem upload)
O PGSStats.json de referência tem **1.209 entradas**, 11 ovos, **1.198 Pokémon**. No campo `pokemonDisplay.alignment` existem exatamente **93 com valor 1 (Sombroso)** e **7 com valor 2 (Purificado)**, comprovando a inversão da interface LT399. Outros dados observados: **176 Shiny**, **47 com costume ID**, **210 com `originEvents`**, **28 com `megaEvolvedForms` não vazio**, **14 com `hasMegaEvolved` true** e 15 com `pokemonDisplay.megaEvolutionLevel`. A união desses sinais não coincide necessariamente com o filtro MegaEvoluiu do jogo (67 na captura de outro instante). Não fingir equivalência de campos de snapshots diferentes.

`originEvents` significa **origem associada a evento** (210), e não necessariamente o filtro visual “Evento” do jogo (105). A implementação LT400 separa `eventVisual` (traje registrado ou `forms.isCostume=true`) de `event` (origem em evento). Existem **108 formas** com `isCostume=true` nos 1.506 registros WatWowMap. Os valores 1.197/1.198 de Pokémon e 174/176 Brilhantes podem decorrer de momentos distintos de exportação, não devem ser adulterados.

Os registros de background desconhecidos, incluindo o ID 340 sem metadados no catálogo anterior, passam a aparecer na categoria **Fundo sem classificação**. Não presumir especial ou localidade sem evidência.

## Catálogo visual construído
Fonte de arquivos: `PokeMiners/pogo_assets` commit fixo `db10df75d6f6f92018d9786af0aecc238fecc4ef`, `Images/Pokemon - 256x256`.
- **3.850 sprites de Addressable Assets** (caminhos `pm<n>.fFORM.cCOSTUME.g2.s.icon.png` conforme chaves disponíveis), total fonte aproximado **119 MB**
- **2.213 sprites legadas** `pokemon_icon_<n>_...`, total fonte aproximado **58 MB**; IDs legados com sufixos desconhecidos ficam indexados, mas **não são atribuídos automaticamente** a um traje sem correspondência exata
- **6.063 registros de arquivo** catalogados, com nome, tamanho em bytes e SHA-1 do Git blob, deduplicação por caminho e commit de origem
- **1.506 identificadores de formas** com formId, proto, nome e `isCostume` do WatWowMap
- **87 IDs de trajes** com código e tradução curta do WatWowMap
- **1.025 espécies** do PokeAPI, com flags Lendário, Mítico, pode evoluir, diferença visual de gênero e identificador da forma principal
- Sprites Shiny e variantes aparecem como **arquivos distintos**, sem supor que todo Pokémon lançado tenha todos os trajes/formas/Shiny

Arquivo: `app/src/main/assets/pokedex_sprite_manifest.json`. Resolver: `pokedex_sprite_catalog.js`. Não embutir no APK os PNGs de terceiros nem extrair imagens dos APKs enviados sem prova de direito de distribuição.

## Resolução segura
Usar tupla `(speciesId,formId,formName,costumeId,gender,shiny)`. O resolvedor só retorna a chave **quando o arquivo existe na lista do commit fixo**. Exemplo: Giratina Altered `pm487.fALTERED.icon.png`, Deoxys Attack `pm386.fATTACK.icon.png`, Kyurem Black `pm646.fBLACK.icon.png`, Ducklett `pm580.icon.png`. A necessidade de `g2` é determinada pela espécie e/ou forma explicitamente feminina; ausência de shiny/costume/forma não deve resultar na versão errada.

A imagem exata no cache privado tem prioridade; se ausente, o app só usa resolvedor já empacotado quando houver arte verificada do mesmo exemplar ou uma sprite base corretamente identificada. Caso contrário, exibe placeholder honesto e botão para baixar a variante, não uma imagem falsa.

## Download e privacidade
`PokedexSpriteStore.java` funciona somente após clique expresso: **Baixar sprites do inventário** (somente chaves resolvidas), **Baixar coleção GO completa** (3.850 arquivos) ou **Baixar imagens legadas** (2.213 arquivos). Arquivos armazenados em `getFilesDir()/pokedex_sprites/a|l`. A origem do download é `raw.githubusercontent.com/PokeMiners/pogo_assets/<commit>`; URLs e nomes são validados. Cada arquivo tem limite de 4 MiB, status HTTP 200 obrigatório, sem redirect, timeout, tamanho exato, hash Git blob e arquivo temporário antes de rename. Pode cancelar e retomar em nova abertura; limpar o cache não altera a coleção.

As imagens extraídas de Pokémon GO têm direitos de Niantic/The Pokémon Company, conforme README PokeMiners. A PR distribui apenas **metadados** e código; não redistribui PNGs no APK ou ZIP. A possibilidade de o usuário obtê-las diretamente para uso local não concede licença para redistribuição.

## Categorias e indicadores
- Corrigir Sombroso = 1, Purificado = 2; badges distintos na grade, chips na ficha e ranking PvP Sombroso.
- Fundos especiais/localidade somente por metadado de tipo conhecido; fundos sem mapeamento ficam separados.
- Lendário/Mítico/Espécie pode evoluir usam flags estáticas verificáveis da PokéAPI (evolução pode depender das regras GO e de costume).
- Mega registrada usa booleano e array `megaEvolvedForms` e nível, mostrando histórico do snapshot sem prometer equivalência ao filtro do jogo.
- Origem em evento e variante visual de evento passam a ser duas categorias para evitar contagem enganosa.
- Filtros existentes, comparador, notas, slots 1/2 e fundos LT399 preservados.

## Gates e pendências
Executar testes Node de catálogo, smoke JS, LT169/LT211 e Java LT62/LT173, APK beta assinado/R8 e publicação com workflow protegido **somente após sucesso**. Testes físicos não executados neste ambiente: Samsung Android 17, importação real por SAF, Wi-Fi/celular, download de 6.063 PNG, arte correta de cada combinação, Galaxy S24 Ultra, TalkBack, memória, espaço livre, cancelamento, retry, redes instáveis e fotos de resultados. **Não afirmar cobertura 100% das combinações nem afirmar 6.063 imagens já baixadas ao telefone.**

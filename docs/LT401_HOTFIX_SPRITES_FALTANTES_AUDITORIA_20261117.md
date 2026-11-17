# LT401 — Hotfix de sprites ausentes na Minha Pokédex (17/11/2026)

**Sintoma observado:** muitos losangos nas fichas da grade após LT400 / v0.03.85 LT, principalmente Mewtwo, Giratina, Zacian, Zamazenta, Landorus e formas especiais.

## Causa confirmada no código

A importação de PGSStats preserva `pokemonDisplay.form` como ID **numérico**. O campo textual `formName` muitas vezes não existe no JSON. A versão LT400 de `pokedex_sprite_catalog.js` só interpretava o ID numérico quando `formName` estava preenchido, resultando em classificação falsa de **forma base**, que não deveria substituir variantes. O resolvedor offline também negava alguns defaults numéricos normais porque ainda não reconhecia seus IDs como defaults verificados. Como o cache opt-in de imagens novas estava vazio, a grade exibia `◇`.

Exemplos do contrato real: Mewtwo Armored `150/133` = `pm150.fA.icon.png`; Mewtwo Normal `150/135` = `pm150.icon.png`; Giratina Altered `487/90` = `pm487.fALTERED.icon.png`; Zacian Hero `888/2577`, Zamazenta Hero `889/2579`, Landorus Incarnate `645/144`. A mesma regra respeita versões Shiny, trajes e diferença de gênero.

## Correções

1. O catálogo prioriza `formId` positivo e consultado no manifesto versionado, mesmo sem `formName`. IDs não mapeados não são convertidos silenciosamente em forma base.
2. A interface recupera o nome da forma por ID; para formas `NORMAL` numericamente confirmadas e que o próprio manifesto corresponde à sprite base, restaura a imagem **já empacotada** (sem download), passando ID de default 0 apenas ao resolvedor visual, sem modificar o PGSStats.
3. Quando a variante exata só existe no manifesto, a imagem pode ser exibida diretamente, sob demanda e com carregamento lazy, a partir da **URL HTTPS imutável no commit** do PokeMiners. Não baixa a galeria inteira, não envia JSON, treinador, IVs nem dados de conta; somente o nome da imagem solicitada aparece na requisição.
4. A WebView permite exclusivamente URLs PNG desse prefixo pinned (além das já aceitas de PokeAPI), evitando origem arbitrária. O download opcional completo para cache privado continua disponível e é preferido quando já presente.
5. Teste de regressão para Mewtwo Armored/Normal, Giratina Altered, Zacian/Zamazenta Hero, Landorus Incarnate, Latias Normal, Magikarp Normal; preserva Shiny e recusa ID de forma desconhecido ou nome de arquivo inválido.

## Limitações

- Se não houver internet e a forma exata não tiver PNG local, ainda será apresentado indicador de sprite indisponível até que o usuário a baixe. Não haverá troca por forma errada.
- Recursos extraídos de jogo são propriedade dos respectivos titulares; este hotfix **não incorpora nem redistribui PNGs de terceiros dentro do APK**, apenas resolve imagens remotas de origem fixa e preserva cache privado opcional.
- A validação física no Samsung Android 17 permanece pendente; CI não substitui screenshot de aparelho.
- A sincronização automática PGSStats desenvolvida em branch separada não integra este hotfix; confirmar após correção pública que o novo branch parte da versão estável atual.

## Gate de publicação

Executar Node, LT169, LT211, LT62 Java, LT173 OTA e Secure beta R8; publicar somente pelo workflow protegido, versão monotônica e assinatura permanente; verificar asset, hash, certificado e atualizar ARK / Guia Mestre.

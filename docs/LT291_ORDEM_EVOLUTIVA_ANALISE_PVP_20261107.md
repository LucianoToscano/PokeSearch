# LT291 — Ordem natural das evoluções na Análise PvP

Data: 07/11/2026. Base oficial: LT290 `v0.02.90-54494`.

## Evidência no Samsung
Usuário apresentou Cyndaquil 15/15/15 na Grande Liga: a análise expandida colocou **Typhlosion (Rank Classe #1667)** antes de **Quilava (Rank Classe #1788)**, induzindo à interpretação de que Typhlosion é a segunda evolução. A cadeia correta é **Cyndaquil → Quilava → Typhlosion**. Os números de PC, nível, eficiência de IV, Rank Classe e Rank Geral pertencem às formas corretas, mas sua apresentação estava fora de sequência.

## Causa comprovada
Em `app/src/main/assets/detail.html`, `window.showEvolutionDetails` aplicava `entries.sort` usando critérios de qualidade PvP (Rank Classe ≤50), Rank Geral e Rank Classe. Isso é adequado para **recomendações de melhor candidato**, mas não para a **visualização da ordem evolutiva**. A árvore oficial já está representada localmente pelas ligações `PVP_EVO_LINKS` do `dock.html`, espelhadas e testadas em `pvp_family_catalog.js`.

## Correção
- Adicionado `orderEvolutionRows(currentName, entries)` ao catálogo offline. Percorre apenas arestas diretas de evolução, atribui distância por etapas (BFS) e ordena as linhas pela sequência verificável; preserva a ordem original das ramificações do mesmo nível. Quando nome/forma é desconhecido, não inventa sequência.
- A Análise PvP usa a função para mostrar evoluções comuns na ordem natural; depois ficam projeções de fantasia/referência e Mega separadas. `Atual` continua no topo.
- **Rank Classe e Rank Geral continuam associados a cada Pokémon e não são recalculados**. A barra compacta que indica o melhor candidato PvP continua selecionando por rank; só mudou a ordem do painel expandido.
- Sem alteração de URLs, sprites, golpes, cálculos de IV, PC/nível, coordenadas, buscas, filtros, permissões, assinatura ou lógica de P1/P2. Ambas Pokébolas compartilham a mesma `detail.html`.

## QA
- Teste `lt291-natural-evolution-order-pvp.test.js`: Cyndaquil/Quilava/Typhlosion mesmo com ranking invertido; Charmander/Charmeleon/Charizard; Teddiursa/Ursaring/Ursaluna; Bulbasaur; Eevee com ramificações estáveis; Oddish/Gloom; formas desconhecidas sem invenções; dados numéricos intactos e recomendação por rank separada.
- Atualizado LT245: o painel expandido não compartilha mais a ordenação RG da barra de recomendação, evitando um teste que endossava o bug.
- Gates: Node completo, Android Java, OTA, visual P/M/G e beta privado no SHA atual, merge e release oficial somente se todos aprovados.

## Samsung pendente
Testar em P1/P2 e GL/UL/ML com Cyndaquil e Charmander. A ordem correta no painel deverá ser observável sem alterar os valores de Rank Classe, Rank Geral, PC, nível ou a escolha do melhor candidato no ícone compacto.

## Publicação e rastreabilidade final
- [PR #285](https://github.com/LucianoToscano/PokeSearch/pull/285) mesclada por squash `926675128b7ce4a775bf8d693770c3b32b66ef38`; head final testado `6e96146d2b6da1be3c0ab3d5b517238224ec6d8e`. Oito gates aplicáveis `success`, incluindo teste novo da ordem das três etapas, correções LT235/LT245, Android, Java, OTA, visual e beta privado. Build genérico `skipped` por política.
- [Workflow oficial #42351220398](https://github.com/LucianoToscano/PokeSearch/actions/runs/42351220398): `completed/success`; `preflight/success`, `publish/success`, `Build signed protected release/success`, `Validate APK and signer/success`, `Verify public release and hash/success`.
- [Release pública LT291](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.91-54495) estável: `v0.02.91-54495`, publicada em 07/11/2026 07:29:28 UTC, APK `PokeSearch-v0.02.91-LT.apk`, 33.936.674 bytes, SHA-256 `9003fcaadbf55d0134c18ea842b17ab32fd5c5bd736d89a434f88b23e8957ef9`, [download direto](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.91-54495/PokeSearch-v0.02.91-LT.apk). Solicitação SHA `a401f3d56a7b7b9dac098f9c03ffb461b9fe7169`.
- **Homologação física Samsung ainda pendente**: a sequência visível e os valores associados precisam ser confirmados após instalar LT291, nas duas Pokébolas e em GL/UL/ML. A aprovação CI não é observação de funcionamento no aparelho.

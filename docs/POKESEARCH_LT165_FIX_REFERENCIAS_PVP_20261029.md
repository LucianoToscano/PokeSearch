# PokeSearch — correção das referências de evolução PvP (29/10/2026)

## Reporte e causa
Capturas no Samsung mostraram Noibat #714 (0/15/12) com selo `GL · Rank Classe: #1 · Ref. Noivern` e Vulpix #37 (1/15/14) com selo `GL · Rank Classe: #2 · Ref. Ninetales`, mas as fichas expandidas só continham os próprios Noibat e Vulpix nas três ligas.

O motor distinguia evoluções legais (`league.evolutions`) das comparações puramente matemáticas de fantasias (`league.comparisons`). O Rank Classe compacto já utilizava as referências; a aba expandida ignorava `league.comparisons`.

## Mudança implementada e mesclada
- `app/src/main/assets/dock.html`: as comparações de fantasia verificadas agora exportam espécie, rank, percentual, PC, nível e Rank Geral com marcador `referenceOnly`, sem inferir elegibilidade de evolução.
- `app/src/main/assets/detail.html`: combina as evoluções válidas com as comparações quando `includePreviousEvolutions` está ativo; exibe `Ref. Noivern` ou `Ref. Ninetales`, com dica acessível de que a projeção **não comprova que a fantasia possa evoluir**. Sem quarta linha vazia de elegibilidade nas referências.
- Preserva diferença entre forma normal e regional; formas regionais não são convertidas automaticamente nas normais.
- Motor e card são compartilhados por P1/P2; código da API e buscas intactos.

## QA
- Nova suíte: `app/tests/lt165-pvp-costume-evolution-references.test.js`; usa o próprio Game Master PvP, calcula GL/UL/ML para Noibat e Vulpix com fantasia, valida que as referências não são tratadas como evolução legal, verifica a forma Alolan e a renderização de todas as ligas.
- CI Node: `https://github.com/LucianoToscano/PokeSearch/actions/runs/40856290741` — **success**.
- CI Java (sem APK): `https://github.com/LucianoToscano/PokeSearch/actions/runs/40856290548` — **success**.
- Workflow beta legado: `https://github.com/LucianoToscano/PokeSearch/actions/runs/40856290711` — **failure**, porque o build usa chave temporária e o Gradle exige `POKE_RELEASE_CERT_SHA256`. Não indica falha do código PvP; esse APK não deve ser distribuído.
- PR #108 mesclada via squash em `main`: `cc71a1ed3ec92654fb4b192aed56d2035d0d86d7`.

## Publicação
A versão oficial confirmada antes da correção era LT164 (`0.01.64`, versionCode `54369`). **Esta alteração não é um APK novo.** Para distribuição como LT165 (`0.01.65`, versionCode futuro), ainda é necessário workflow oficial com assinatura permanente v2, SHA-256, homologação do APK e validação de `releases/latest`, sem reutilizar o beta legado.

## Autorização de distribuição global — 29/10/2026

- Solicitação explícita: publicar atualização para todos pelo mecanismo instalado no PokeSearch.
- PR #109, contendo as notas LT165 na Home e workflows de distribuição: **mesclada** em `main`, commit `8822ba3439b33babeed2ecea7d470896745a0b48`.
- Antes do merge, checks de PR da branch aprovaram as suítes Node e a compilação Java sem APK.
- Workflow oficial versionado: `.github/workflows/lt165-pvp-reference-official-release.yml`. É acionado por push desse arquivo à `main`, exige ambiente `official-updates`, testa e compila o APK com o certificado permanente, faz auditoria de R8, assinatura v2, versão `0.01.65` / `54370`, integridade ZIP, SHA-256 e só então promove o artefato para `v0.01.65-54370` como Release estável `latest`.
- O workflow falha se detectar publicação preexistente ou se `releases/latest` não corresponder à LT164 no momento da promoção.
- A distribuição só pode ser chamada de **confirmada** após workflow oficial concluir com sucesso e apontar `releases/latest` para a LT165 com digest e tamanho correspondentes. Este registro do merge não é evidência de publicação efetiva.
- Endereço do acompanhamento: https://github.com/LucianoToscano/PokeSearch/actions/workflows/lt165-pvp-reference-official-release.yml
- Os usuários precisam aceitar a instalação no Android; o atualizador não instala silenciosamente.

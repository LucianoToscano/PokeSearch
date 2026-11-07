# LT292 — Auditoria integral das ordens evolutivas

Data: 07/11/2026. Versão inicial verificada: LT291 (0.02.91 · versionCode 54495).

## Motivo
O usuário observou evoluções finais antes das intermediárias para Cyndaquil e Charmander e pediu verificação de **todas as famílias**, não somente exemplos individuais. A ordenação anterior por Rank Classe/RG no painel foi corrigida na LT291, mas existem outras listas no explorador/Calculadora PvP, e a forma Shadow não era reconhecida pelo normalizador de estágios.

## Inventário do catálogo
O catálogo offline `pvp_family_catalog.js`, espelho exato de `PVP_EVO_LINKS` do `dock.html`, contém **463 arestas direcionadas, 790 nomes distintos, 327 raízes, 349 finais**, sem duplicatas ou ciclos. Trata-se do catálogo **cadastrado e testado no projeto**, não de uma afirmação sobre a totalidade da Pokédex atual. Ramificações documentadas como Eevee, Tyrogue, Gloom, Poliwhirl, Wurmple, Kirlia, Charcadet, Applin e outras compartilham o mesmo estágio, não são evoluções sucessivas entre si.

## Correções
- `orderEvolutionRows` mantém BFS de distâncias de etapas, mas reconhece exclusivamente `(Shadow)` como forma de batalha evolutiva conhecida. Exige a mesma variante nas linhas; não mistura normal com Shadow ou afirma que uma fantasia/evento/regional pode evoluir. Sem cadeia confirmada, preserva a ordem original.
- `detail.html`: painel de evolução expandidas, projeções de referência de fantasias, seletor de formas do explorador PvP e lista de projeções PC/Nível usam etapas verificadas. Mega continua em seção final com identidade de projeção; não altera quaisquer ranks ou elegibilidade.
- Projeções CP/Nível deixam de limitar oito opções precocemente, mostrando até 14 alternativas para famílias grandes como Eevee. A calculadora de PC já possuía um ordenamento topológico próprio `psCpOrderFamily` e permanece preservada.
- A barra compacta de recomendação **permanece ordenada por melhor Rank Classe/Rank Geral**. Não confundir o melhor candidato com a próxima etapa de evolução.

## QA
- `lt292-all-evolution-chains-audit.test.js`: audita exaustivamente o grafo, cada aresta e cada cadeia descendente a partir de todos os nós com evoluções; repete nas versões Shadow. Assegura estabilidade de ramos, ausência de mutações dos objetos/IVs/PC/ranks, formas desconhecidas sem inferência, e integração com quatro superfícies de apresentação.
- Regressões LT235 e LT291 atualizadas para o novo ordenamento de referências; demais testes Node, Java, Android, OTA, visual P/M/G e APK beta devem passar no mesmo commit.
- **Físico Samsung pendente:** Cyndaquil → Quilava → Typhlosion e Charmander → Charmeleon → Charizard, tanto normal quanto Shadow; ramificações Eevee e Kirlia; três ligas; Pokébola 1/2. Este teste automatizado não substitui validação física da interface.

## Publicação
Somente registrar publicação final após PR, merges, workflow assinado, SHA-256 e release pública confirmados. Não alterar fontes, links de sprite, coordenadas, permissões, login ou rankings.

## Integração e publicação oficial conferidas
- [PR #286](https://github.com/LucianoToscano/PokeSearch/pull/286) mesclada por squash `6684a50cb6cbc206d617898e30402b7c65ba8700`, commit QA `115c76b49944b34e93acb14e1476654e58af7a53`. Oito verificações aplicáveis `success`, incluindo teste novo exaustivo e beta privado. Nenhuma alteração nos valores dos rankings.
- [Workflow permanente #42352941685](https://github.com/LucianoToscano/PokeSearch/actions/runs/42352941685) `completed/success`. Passaram `preflight`, `Build signed protected release`, `Validate APK and signer`, `Release to all app users` e `Verify public release and hash`.
- [Release estável LT292](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.92-54496), publicada em **07/11/2026 às 07:54:07 UTC**: `v0.02.92-54496`, `draft=false`, `prerelease=false`, APK `PokeSearch-v0.02.92-LT.apk`, **33.937.314 bytes**, SHA-256 `1d7b9ffd3e421e9970d08508952233fe8ccd1fcbd3116754669aaf96d4678bd2`, [download direto](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.92-54496/PokeSearch-v0.02.92-LT.apk); solicitação SHA `f5dde6186272063032d876ad0a822a1984143b54`.
- **Pendência física:** validar sequência visual e IV/PC/ranks no Samsung em ambas as Pokébolas. A verificação de 463 arestas se refere ao catálogo cadastrado, não garante que novas evoluções ausentes do snapshot já estejam incluídas.

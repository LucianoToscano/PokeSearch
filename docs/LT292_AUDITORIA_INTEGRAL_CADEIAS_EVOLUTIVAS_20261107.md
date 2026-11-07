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

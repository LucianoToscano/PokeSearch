# Continuidade PokeSearch após LT356 — todas as espécies

**Versão OFICIAL verificada em 15/11/2026:** **0.03.52 / 54559 / 51356**, [release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.52-54559), [APK assinado](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.52-54559/PokeSearch-v0.03.52-LT.apk), 61.135.783 bytes, SHA-256 `419a91801e0ea7fd3a411b173b9b3506078952f6aa1b6bea1f911df1793051e7`, [workflow protegido #43674772112](https://github.com/LucianoToscano/PokeSearch/actions/runs/43674772112) **SUCCESS**. Código PR #400 e release PR #401 integrados, com sete gates de implementação verdes. Não supor que o usuário instalou APK nem que o jogo reagiu. Sempre revalidar release atual antes de alterar.

Atue como responsável técnico ARK do repositório `LucianoToscano/PokeSearch`.
Verifique o HEAD **atual** da `main` e a última release, além de
`AGENTS.md`, `docs/GUIA_MESTRE.md`,
`docs/PADRAO_OFICIAL_OVERLAYS_POKESEARCH.md`,
`docs/LT355_ARK_AUDITORIA_E_ACEITE_20261115.md` e
`docs/LT356_AUDITORIA_GLOBAL_PGS_20261115.md`. Não inferir que LT356 foi
publicada se workflow e APK não confirmarem.

A análise do APK PGSharp fornecido encontrou 1.025 espécies com todos os IDs
iguais ao catálogo PokeSearch, diferenças apenas em dois apóstrofos (83/865),
15 tabelas de nomes e 43.327 entradas pt-BR de interface. Não há extração
licenciada/homologada de miniaturas individuais de feed; não copiar recursos
Unity nem usar imagens genéricas como templates de clique.

LT356 PR #400 prepara índice nativo para até 4.096 templates por
`dex/form/variant`, valida imagens somente de espécies selecionadas, mantém
amostras e preferências pessoais, bloqueia matching ambíguo entre espécies,
previne descarte de sprites adjacentes e mede duração de scanner. Mostra
formas/variantes nativas em menus compactos e diagnóstico Android 11+.
**O manifesto do app continua vazio** até QA real e licença. Não confundir
cobertura dos IDs da Pokédex com modelos visuais nativos.

Próximos passos: comparar toda gama de espécies, variações regionais,
trajes e estados visuais do feed, capturar amostras de modo autorizado,
versionar com hashes e testar desempenho em Samsung e Android 11+,
sempre confirmando reações reais do jogo (não só callbacks Android).
Evitar toques em avisos de segurança; "Sou passageiro" manual.
Preservar P1/P2, Rare Candy, Edu, dados, contas, filtros e LT350 #385
draft. Para publicar: sete gates verdes, PR de código, release oficial
monotônica assinada, SHA-256 público, atualização do arquivo mestre e prompt.

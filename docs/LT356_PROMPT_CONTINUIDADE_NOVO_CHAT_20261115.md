# Continuidade PokeSearch após LT356 — todas as espécies

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

# LT377 — Pokédex pessoal PGSStats · referências e escopo (16/11/2026)

## Objetivo
Inventário pessoal do usuário, **sem trocas, anúncios, vendas, leilões, publicação social ou sincronização com Pokémon GO**. Coleções 1 e 2 independentes, importadas manualmente por Storage Access Framework (SAF). A Home recebe "Minha Pokédex" no menu lateral. Não alterar Pokébolas, overlays, autenticação ou busca.

## Amostra efetivamente inspecionada
PGSStats.json enviado na conversa: 2.712.690 bytes. Coleção original: 1.209 registros; 11 ovos e 1.198 Pokémon; 497 espécies não-ovo; 176 shiny; 377 favoritos; 22 lucky; 7 sombrosos; 93 purificados; 47 com código de traje; 114 com registro de fundo em pokemonDisplay.locationCard.locationCard; 9 tags. Exportação 16/11/2026 às 17h34 (America/Fortaleza).

O arquivo bruto não deve ser armazenado na nuvem, enviado ao GitHub nem compartilhado. O app importa para memória e armazena somente campos necessários em armazenamento privado Android, com limite de 24MB e 10.000 entradas, deduplicação e rejeição de IDs inválidos. IDs unsigned 64-bit precisam permanecer strings exatas. Um snapshot não comprova posse atualizada.

## Funcionalidades criadas na branch LT377
- Home lateral → Minha Pokédex → Inventário 1 ou 2.
- Importação JSON sob escolha explícita do usuário, pesquisa por nome/apelido/forma/número, filtros e ordenação PC/IV/data/espécie.
- Grade compacta e ficha detalhada com PC, IVs, PS, altura, peso, forma, traje por código, tags, fundo registrado por ID, IDs dos golpes e data de obtenção.
- Filtros Shiny, Hundo, Sombroso, Purificado, Sortudo, Favoritos, Tags, Fundos, Trajes e Trocados. Nenhuma transação.
- Fundos próprios decorativos: Padrão, Aurora, Pôr do Sol, Oceano e Noite. Seleção local por Pokémon; **não atribui um fundo do jogo**.
- Reutilização do resolvedor de sprites do próprio PokeSearch; variante não verificada deve ter fallback explícito.

## Referências lidas na pasta Drive
Pasta: https://drive.google.com/drive/folders/1Rra1dB-jKrZyHtxxm6ciB3Iy0DmuB09w (81 itens listados).

- POKEGOBR_MASTER_TOTAL_FONTES_APIS_BANCOS_IMAGENS_SONS_APKS_2026-11-09.md — inventário amplo de fontes, rotas e riscos; não atesta licença ou sucesso de integrações.
- dittobase-fontes-de-dados.txt — repositórios e endpoints relatados; URLs necessitam testes. Documento indica ausência de API pública confirmada do DittoBase.
- API_PokeList_spec.md — extração estática de um APK de radar, não é fonte de coleção privada.
- POKEGOBR_PACOTE_MESTRE_FONTES_TOTAL_2026-11-09.zip e pokeapi-pacote.zip — material de referência, não licença de redistribuição.

## Fontes recomendadas por prioridade
1. **Já instaladas no PokeSearch:** pokemon_catalog.json (nomes/espécies), sprite_offline.js e VerifiedSpriteCache (imagens com cobertura parcial), pvpoke-iv-gamemaster.js e snapshots PvPoke (para rankings futuros).
2. **Dados de formas, trajes, fundos, golpes e traduções:** https://github.com/WatWowMap/pogo-data-api — datasets de costumes, forms, location-cards, moves e pt-br. Mapear os IDs somente após validar versão/esquema e permissões.
3. **Mecânicas Pokémon GO e atualizações:** https://pogoapi.net/documentation/ e https://github.com/PokeMiners/game_masters — atualizações versionadas, hash, testes e cache, sem chamadas por Pokémon.
4. **Sprites base:** https://github.com/PokeAPI/sprites — possui imagens de Shiny e espécies. A própria licença do repositório observa que as imagens são copyright The Pokémon Company; não empacotar por presumir CC0 dos metadados.
5. **Fundos/trajes avançados:** https://github.com/PokeMiners/pogo_assets — catálogo de artes extraídas, uso declarado educacional e propriedade de terceiros. Não copiar ao APK sem autorização aplicável.
6. **Catálogos editoriais de fundo:** https://pokemongo.fandom.com/wiki/Backgrounds ; https://bulbapedia.bulbagarden.net/wiki/Location_Card ; https://github.com/psoren/pogo-bg — servem para relacionar eventos/localizações/variantes, não são licença de copiar imagens ou prova de que Pokémon tenha o fundo.

## Modelo de dados e direitos
Chave de variante: speciesId + formId + costumeId + gender + shiny + alignment. Campos distintos para originalBackgroundId, importado e não editável, e decorativeBackgroundId, personalização local. Só associar arte a um código de fundo após correspondência validada; nunca deduzir por cidade/data. Criar registro para cada asset com espécie/forma, SHA-256, proveniência, licença, autorização, versão e caminho local. Sem imagem disponível/licenciada, usar arte original decorativa ou marcador transparente.

## QA e pendências
Branch proposta: feat/lt377-inventario-pessoal-json. Implementação preparada: activity SAF, arquivos HTML/JS, entrada no menu lateral, teste de contratos JS. Ainda pendentes: APK compilado e testado em dispositivo real, comparação pixel a pixel com screenshots, integração de bases de trajes/fundos por ID e rankings PvP por exemplar, validação de licenças das imagens e otimização de datasets offline. Não declarar essas etapas realizadas sem prova. Esta etapa **não contém ARK, merge ou publicação oficial**.

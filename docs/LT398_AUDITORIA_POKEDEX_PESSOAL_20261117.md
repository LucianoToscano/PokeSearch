# LT398 — PokeSearch Pokédex pessoal · auditoria técnica · 17/11/2026

## Base de atualização e compatibilidade
Partida explícita da versão oficial **v0.03.82 LT / versionCode 54589** observada em release pública, sem reutilizar PR antiga LT377 (#457) baseada na main pré-LT392. Branch de migração: feat/lt398-inventario-pessoal-oficial. Não modificar a arte 16×4 dos ícones atuais, nem suas posições e escala. O ícone Pokédex já presente na Home (posição 11, coluna 4 da terceira fileira) passa a abrir a tela funcional; menu lateral recebe atalho redundante.

## Funcionalidades da primeira etapa
- Importação consentida de PGSStats.json por seletor nativo Android. Arquivo bruto nunca salvo; somente instantâneo compacto local por Inventário 1/2. Limite 24 MB / 10.000 registros; validação de IDs e preservação lexical dos IDs grandes de Pokémon/Tags como strings.
- Filtra ovos separadamente; registra capacidade da conta (valor do próprio arquivo), etiquetas e nomes, data, favoritos, lucky, shiny, shadow/purified, gigantamax/dynamax, mega, trajes, fundos, movimentos, custo de captura quando presente, variações e IVs. Não solicita localização, login, fotos ou outras permissões.
- Tela responsiva três abas Tags/Pokémon/Ovos, grade 3 colunas no smartphone, nome/PC/IVs/barra PS, ordenação por PC, nº Pokédex, nome, data, IV, PS, favoritos, navegação anterior/próximo.
- Ficha individual com avaliação IV 0/1/2/3 estrelas, nomes pt-BR dos golpes, informação de traje e fundo pelo catálogo de ID, status de mega, tags/evento, fundo decorativo original separado do fundo real.
- Rankings de IV GL/UL/ML usam a engine existente PokeSearchRankExplorer e PvPoke snapshot 2026-10-19. Quando espécie/forma exata não existe na base, exibir “sem dados” em vez de inventar rank. O ranking é da classe IV no nível máximo 50, não ranking de espécie nem garantia de desempenho.
- Sprites usam resolvedor já instalado no PokeSearch; não apresentar sprite de variante como “confirmada” sem identidade exacta. Sem copiar imagens do Fandom ou recursos proprietários do jogo.
- Metadados offline factuais derivados de WatWowMap/pogo-data-api: 537 movimentos (id/nomes pt-BR), 278 location/special backgrounds (id/nome/tipo), 87 trajes (id/nome/flag evolução), com referência da fonte no arquivo. Não inclui arte de terceiros.
- 18 formas vetoriais compactas com base nos ícones de categorias fornecidos pelo usuário; **não substitui Home**. A versão 1 não contém transações, anúncios ou comunicação pública.

## Provas disponíveis vs lacunas
- Testes contratuais Node da atividade/manifest/UI/URLs/fallback/catálogos e todos os CI obrigatórios são condição de merge.
- Dados de referência verificados em arquivo PGSStats enviado: 1.209 registros contendo 11 ovos e 1.198 Pokémon, tags com IDs inteiros unsigned 64-bit, maxPokemonStorage 1200, 63 breadMode 1 e 16 breadMode 2. **Dados reais não copiados ao repositório nem aos logs**.
- Imagem extraída de cada variante, location background oficial e VFX não incluídos. Fundos customizados são decoração PokeSearch, não propriedade adquirida no jogo.
- Ainda precisam de aparelho físico: teste com SAF do Android 17 Samsung SM-S928B, conferir lista 1.198/1200, 11 ovos, tags, detalhes de Delphox/Empoleon e comparativo de screenshots, iniciar app com cache vazio, reimportação idempotente, primeiro acesso offline, scroll, TalkBack, modo claro/noturno e proteção contra crash.
- Sem testes físicos, não declarar homologado em Samsung.

## Política de publicação
Quando os gates aprovarem, fazer squash merge para main; criar pedido de versão monotônica > 54589 no release/official-request.json e notas em release_notes.json; validar PR de versão e acionar o workflow de **APK oficial permanente assinado**. Não usar FastDev ou outra assinatura. Atualizar Guia Mestre e ARK somente com provas verificadas.

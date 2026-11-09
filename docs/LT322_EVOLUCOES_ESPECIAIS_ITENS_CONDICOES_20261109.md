# LT322 candidata — informações sobre itens e condições de evolução

**Data:** 09/11/2026 · **Base de trabalho:** `main` após LT321 · **Estado:** branch/PR candidata, sem merge, APK, OTA ou homologação física.

## Objetivo

Melhorar o painel **Análise PvP** já existente, sem outro menu, sem alterar ranks/IVs e sem modificar a Pokébola principal ou secundária individualmente. Na linha da evolução, mostrar discretamente **Etapa especial** quando o grafo da família comprovar o caminho e houver requisito conhecido (item, moedas, módulo atrair ou condição ambiental).

## Escopo

- Criado `app/src/main/assets/evolution_requirements.js` com **76 transições especiais conhecidas**: Pedra Solar, Pedra do Rei, Revestimento Metálico, Escama de Dragão, Melhora (Up-Grade), Pedra de Sinnoh, Pedra de Unova, três maçãs de Applin, moedas de Gimmighoul, módulos/chuva e lua cheia de Ursaring, tarefas de companheiro, caminhada, corações e horários.
- A nomenclatura oficial do Pokémon GO em português foi verificada: **20 Maçãs Doces/Azedas/Xaropentas**, cada variante com **200 Doces de Applin**. A denominação antiga "Maçã Melada" não era a tradução oficial. Dipplin → Hydrapple exige **400 Doces de Applin** e **capturar sete Pokémon Dragão tendo Dipplin como companheiro**, segundo anúncio oficial de 2025.
- Evoluções por companheiro/tarefas estão incluídas quando o grafo oferece uma rota verificável (Primeape, Charcadet, Bisharp, Pancham, Poipole, Pawmo, Feebas, Inkay etc.). Essas condições podem ser flexibilizadas temporariamente por eventos; **nenhum requisito mostra progresso, posse de itens ou status real da conta**.
- Exibir até múltiplos itens em uma rota (exemplo: **Porygon → Porygon2 → Porygon-Z** requer Up-Grade e Pedra de Sinnoh), sem somar doces nem alegar posse do item.
- Caminho dirigido calculado apenas sobre `PokeSearchPvpFamilyCatalog.links`; linhagem desconhecida, sem dados, costume, Mega, variantes regionais e formas Shadow não recebem exigência inferida.
- `Kirlia → Gallade` tem observação de macho; `Snorunt → Froslass` tem observação de fêmea.
- Módulos e condições de tempo não significam consumo automático do item, e algumas evoluções permitem alternativas (como clima/chamariz). Mostrar condições sem afirmar disponibilidade.
- O componente é local e offline, não consulta novas APIs ou autenticação. Ambos os overlays usam a mesma WebView de detalhe. Preserva `applicationId`, versionCode atual, assinatura, limites de busca e qualquer preferência já salva.
- **15 PNGs transparentes incluídos:** extraídos dos arquivos enviados no Drive em 09/11/2026, adicionados em `app/src/main/assets/evolution-items/` e associados aos rótulos das condições. Correspondem a sete itens tradicionais, três maçãs, Moedas de Gimmighoul e quatro módulos atrair (Magnético/Musgoso/Glacial/Chuvoso). **Não** substituem os ícones atuais de tipos, menus, passes ou Edu.
- **Origem verificada:** a pasta `Banco de Imagens` contém 133 arquivos (129 PNG, 3 WebP e 1 ZIP); o ZIP tem 98 imagens sem erros de integridade. Os 15 arquivos da PR têm bytes idênticos aos correspondentes no ZIP (SHA de blob Git coincidente), transparência real e dimensões PNG verificadas. Não publicar URL privada ou dados de conta nos manifests. Inventário dos 133 arquivos preservado em `docs/CATALOGO_ASSETS_DRIVE_20261109.csv` com estados separados `LT322` versus `somente catalogado`.
- **Governança de mídia:** conferir direito de redistribuição das artes da franquia em repositório público antes da incorporação definitiva. Imagens recebidas do usuário não comprovam licença de terceiros.

## QA e pendências

Teste `node app/tests/lt322-evolution-requirements.test.js` verifica 76 regras, 15 PNGs reais (cabeçalho, bytes e dimensões), rotas de múltiplos passos, casos de risco, renderização de ícones e herança P1/P2. Após inclusão na PR, executar também regressões completas do repositório, cinco gates oficiais, build assinada apenas se autorizada e QA físico Samsung.

**Pendências:** validar outros requisitos situacionais e novas regras/variações por Game Master; a tradução oficial das três maçãs já foi confirmada. A tabela é um subconjunto de evoluções especiais confirmadas, não catálogo universal de todas as tarefas, formas e custos. `Etapa especial` é informação; não prova que um Pokémon individual pode evoluir. Não há mudança de release `LT321 / 0.03.21 / 54527`.

## Fontes e proveniência

- Ajuda oficial Pokémon GO — https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/100-evolving-your-pokemon/
- Evento oficial 2025 (Dipplin/Hydrapple e quantidades) — https://pokemongo.com/pt-BR/news/harvest-festival-2025
- Evento oficial 2026 (nomes Maçãs Doces/Azedas/Xaropentas) — https://pokemongo.com/pt-BR/news/harvest-festival-2026
- Guia de condições e tarefas — https://pokemon.gameinfo.io/pt-br/guides/evolution-requirements
- Pokémon GO Hub — https://pokemongohub.net/post/wiki/evolution-items/
- Pokémon GO Info — https://pokemon.gameinfo.io/en/guides/evolution-requirements
- [Arquivo Mestre PokeGoBR 09/11/2026] (anexo do solicitante): índice de referências, não banco de dados integrado e nem licenças automáticas.

## Controle do tamanho da APK (pendência técnica)

A LT321 pública tinha APK de **34.710.626 bytes**; o limite declarado no fluxo oficial é **35.000.000 bytes**. Os 15 PNGs de origem somam **1.083.681 bytes** em disco, incluindo `gimmighoul-coins.png` de 512.120 bytes. O tamanho final do APK não deve ser inferido simplesmente pela soma de bytes porque empacotamento/compressão podem alterá-lo. **Antes de uma release pública, fazer build assinada de QA, medir APK e otimizar cópias de exibição sem degradar as imagens originais.** Este ponto não foi homologado em aparelho nem medido por APK LT322.

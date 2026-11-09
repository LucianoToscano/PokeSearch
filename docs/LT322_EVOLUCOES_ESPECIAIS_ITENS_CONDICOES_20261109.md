# LT322 candidata — informações sobre itens e condições de evolução

**Data:** 09/11/2026 · **Base de trabalho:** `main` após LT321 · **Estado:** branch/PR candidata, sem merge, APK, OTA ou homologação física.

## Objetivo

Melhorar o painel **Análise PvP** já existente, sem outro menu, sem alterar ranks/IVs e sem modificar a Pokébola principal ou secundária individualmente. Na linha da evolução, mostrar discretamente **Etapa especial** quando o grafo da família comprovar o caminho e houver requisito conhecido (item, moedas, módulo atrair ou condição ambiental).

## Escopo

- Criado `app/src/main/assets/evolution_requirements.js` com **48 transições especiais conhecidas**: Pedra Solar, Pedra do Rei, Revestimento Metálico, Escama de Dragão, Melhora (Up-Grade), Pedra de Sinnoh, Pedra de Unova, três maçãs de Applin, moedas de Gimmighoul, quatro modalidades de módulo/chuva e lua cheia de Ursaring.
- Exibir até múltiplos itens em uma rota (exemplo: **Porygon → Porygon2 → Porygon-Z** requer Up-Grade e Pedra de Sinnoh), sem somar doces nem alegar posse do item.
- Caminho dirigido calculado apenas sobre `PokeSearchPvpFamilyCatalog.links`; linhagem desconhecida, sem dados, costume, Mega, variantes regionais e formas Shadow não recebem exigência inferida.
- `Kirlia → Gallade` tem observação de macho; `Snorunt → Froslass` tem observação de fêmea.
- Módulos e condições de tempo não significam consumo automático do item, e algumas evoluções permitem alternativas (como clima/chamariz). Mostrar condições sem afirmar disponibilidade.
- O componente é local e offline, não consulta novas APIs ou autenticação. Ambos os overlays usam a mesma WebView de detalhe. Preserva `applicationId`, versionCode atual, assinatura, limites de busca e qualquer preferência já salva.
- **Não foram incluídos PNGs:** pacote mestre documenta links/metadados, não os arquivos visuais binários requisitados anteriormente. Um ícone só pode ser incorporado após ter a imagem exata e os direitos de utilização comprovados.

## QA e pendências

Teste `node app/tests/lt322-evolution-requirements.test.js` verifica os tipos, rotas de múltiplos passos, casos de risco, importação pelo HTML e herança P1/P2. Após inclusão na PR, executar também regressões completas do repositório, cinco gates oficiais, build assinada apenas se autorizada e QA físico Samsung.

**Pendências:** averiguar tradução oficial das três maçãs e novas regras/variações por Game Master. A tabela é um subconjunto de evoluções especiais confirmadas, não catálogo universal de todas as tarefas, formas e custos. `Etapa especial` é informação; não prova que um Pokémon individual pode evoluir. Não há mudança de release `LT321 / 0.03.21 / 54527`.

## Fontes e proveniência

- Ajuda oficial Pokémon GO — https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/100-evolving-your-pokemon/
- Pokémon GO Hub — https://pokemongohub.net/post/wiki/evolution-items/
- Pokémon GO Info — https://pokemon.gameinfo.io/en/guides/evolution-requirements
- [Arquivo Mestre PokeGoBR 09/11/2026] (anexo do solicitante): índice de referências, não banco de dados integrado e nem licenças automáticas.

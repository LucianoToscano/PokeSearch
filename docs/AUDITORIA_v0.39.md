# Auditoria do PokeSearch — v0.39-beta
**14/10/2026** • Base mestre v0.36, v0.37, v0.38 e capturas recebidas de uso no PoGoCoordinates.

## Achados v0.39
| ID | Gravidade | Achado | Correção | Status |
| --- | --- | --- | --- | --- |
| PS-013 | Alta | ✨ OFF: PoGoCoordinates retorna 100% e GL#1, porém overlay `!` | Melhorar seletores de min/max % IV e simplificar confirmação Shiny OFF | Código revisado; teste real pendente |
| PS-014 | Alta | Cartão PvP não mostra rank individual apesar de filtro Top ranking 1 | Anotar Rank 1 somente se filtro no formulário (liga/rank/evoluções) estiver confirmado | Código revisado; teste real pendente |
| PS-015 | Média | Site exibe "Showing N spawns", mas parser encontra 0 cartões | Detectar e informar falha de leitura em vez de mostrar resultado vazio | Código revisado |
| PS-016 | Média | Shiny OFF poderia ser bloqueado por modal de vinculação irrelevante | Verificar vínculo somente se Shiny pedido | Código revisado |

## Matriz de regressão
- Shiny desligado (controle falso/indisponível) deve permitir buscas comuns.
- Shiny ligado só se confirmado no site e com vínculo.
- % IV 100/100 deve passar; 100/98 deve falhar.
- PvP GL 1 / evoluções Yes e formulário confirmado pode preencher rank proveniente do filtro; UL na consulta GL não pode passar.
- Lint, node --check, teste JS, Gradle, apksigner, ZIP e checksum devem passar antes de divulgar o pacote.
- Nenhum segredo sensível ou token deve constar nos registros.

## Limitações ainda abertas
As capturas confirmam comportamento manual do site, não execução da v0.39 no telefone. O APK debug usa chave temporária e não é adequado a atualizações públicas permanentes. O app depende de HTML de terceiro que pode mudar a qualquer momento; apenas dados realmente verificados são exibidos.

## Organização
- GitHub: `docs/ARQUIVO_MESTRE_v0.39.md`, `docs/AUDITORIA_v0.39.md`, código-fonte e Actions.
- Drive: PokeSearch / 00_Documentacao_Atual, 01_APKs_Teste, 02_Relatorios_Bugs; preservar backups das versões anteriores.

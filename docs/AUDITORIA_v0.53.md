# PokeSearch v0.53-beta — Auditoria corretiva
Origem v0.52 ff7ef41c48abe581b9be177220b0718ef4929eb1. Backup backup/v0.52-before-overlay-filter-fix-20261015.
Regressões da v0.52: filtros sem interface flutuante, default de rank desligado, limite Top 50, falta de fallback correto quando rank exato não retornava.
Implementação: dock.html ganhou ação ☷ e painel próprio com campos/switches persistentes; Bridge.setSearchOptions recebe somente JSON curto, valida IV 0–15, Rank 1–200, números e opções textuais e dispara busca explicitamente; probe.js aplica/verifica filtros disponíveis do site; dados de rank incluem rankUpperBound derivado somente de filtro confirmado.
Checklist CI: Node sintaxe, JS tests, Gradle unit tests, assemble, lint, APK metadata/assinatura. Checks CI não substituem testes físicos: testar filtros/campos que mudam no DOM, autenticação Shiny, posicionamento do pop-up nas 4 bordas, teclado em Android 15/16, troca de orientação e desempenho.
Não declarar rank individual exato sem evidência. Os filtros do site podem rejeitar seleções extras; nesse caso relatar "não confirmado" e não inventar resultados.

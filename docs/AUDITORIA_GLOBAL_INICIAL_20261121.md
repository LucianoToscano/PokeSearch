# Auditoria inicial conservadora — PokeSearch

> **Data de referência:** 21/11/2026 (America/Fortaleza), 22/11/2026 UTC.  
> **Estado:** inventário inicial e documentação; NÃO é auditoria recursiva exaustiva, nem conclusão funcional.  
> **Repositório oficial:** `LucianoToscano/PokeSearch` / `main`.  
> **Commit-base verificado:** `b88c5f6c04728789430f03d719fc885e6e69ee4e`.  
> **Branch QA:** `qa/protocolo-global-sem-perdas-20261121`.  
> **Protocolo:** [Desenvolvimento paralelo sem perdas](PROTOCOLO_GLOBAL_DESENVOLVIMENTO_PARALELO_SEM_PERDAS.md).

## Evidências da inspeção inicial

- **Documentação canônica:** `docs/GUIA_MESTRE.md`; índice em `docs/INDICE_CENTRAL_POKESEARCH.md`; também `AGENTS.md` e `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`.
- **Versão documentada:** LT409 / v0.03.94 / versionCode 54601, registrada em 21/11; requer reconferência em Releases/latest antes de publicação.
- **Auditoria conservadora já existente:** `docs/AUDITORIA_ORGANIZACAO_PRESERVACAO_20261121.md`; registra 1.796 arquivos, 486 em docs, 261 workflows e seis grupos de conteúdo idêntico na árvore de referência, sem afirmar exclusão segura.
- **Risco principal:** há numerosas PRs pendentes que não devem ser descartadas por atualização global; exemplo PR #541 LT410 PvP. A presença de branches antigas não implica autorização de limpeza.
- **Drive:** cinco pastas de gestão, imagens, builds, código e backups; o acervo externo de referências PokeSearch também aparece sob Banco de Dados.
- **Regras preservadas:** duas Pokébolas, pesquisa sem login, limite de 10 resultados, código Shiny temporariamente indisponível e respeito a 429/Retry-After, conforme documentação/protocolo aprovado.
- **Testes não executados:** P1/P2 em dispositivo, APIs reais, Shiny, regressão de busca e compilação Android.

## Classificação preliminar A/B/C — sem exclusão

| Classe | Candidato | Estado |
|---|---|---|
| A | Duplicatas exatas ou temporários com referências verificadas | **Nenhum item aprovado ou excluído.** A confirmação de hash e dependências ainda é necessária. |
| B | Documentação histórica/atual com conteúdo sobreposto | **Analisar antes de propor mesclagem.** Preservar textos e decisões únicos. |
| C | Mestres, código, assets, builds funcionais e versões históricas | **Manter.** Nenhuma exclusão ou movimentação realizada. |

## Proteção de projetos paralelos

Não houve modificação de código-fonte, assets, Mestre, Drive, workflow, assinatura, APK ou release neste PR. Antes de integrar, comparar o SHA da `main` novamente, reavaliar PRs concorrentes e validar conflitos. O arquivo criado é uma anotação técnica de QA, subordinada à documentação canônica existente.

## Validação desta proposta

- Verificado: existência do repositório e da branch `main`, identidade do commit-base, estrutura inicial, documentação de entrada e pastas de Drive relacionadas.
- Não verificado: hash de todos os arquivos, dependências recursivas, execução de aplicativo, testes em aparelho, compilação e resultados de redes/APIs em produção.
- Rollback: fechar o PR sem merge; nenhum arquivo anterior foi substituído.
- Próximo passo: inventário recursivo e matriz de regressão por projeto, sem operações destrutivas.


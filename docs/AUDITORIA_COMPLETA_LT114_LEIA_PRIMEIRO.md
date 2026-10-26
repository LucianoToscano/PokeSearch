# PokeSearch — PACOTE COMPLETO DE AUDITORIA LT113/LT114
Data de referência: 25/10/2026
Repositório: LucianoToscano/PokeSearch
PR #73 (Draft): https://github.com/LucianoToscano/PokeSearch/pull/73

## Finalidade
Este pacote reúne TODOS os arquivos rastreados e editáveis de três estados completos do repositório, arquivos de mídia não editáveis que integram o aplicativo, APKs de referência, relatórios brutos de build, diffs, testes, prompts, planilhas CSV e evidências de proveniência. Não é uma declaração de homologação no Samsung.

## Estados incluídos
1. `sources/MAIN_OFICIAL_EDITAVEL`: HEAD main `56403a2999fc8037aa020466cf03041b7926ae02`, release `0.01.11/54315`.
2. `sources/LT113_FONTE_EXATA_EDITAVEL`: commit `141ec637e60565591f6fe445da661b2a26eb6a79`, candidato QA `0.01.13/54317`.
3. `sources/LT114_BRANCH_COMPLETA_EDITAVEL`: HEAD auditado no momento de execução, contendo LT114 `4734b6ce877961eff3bdaf7e5c05c69d33e86151` e os arquivos de documentação/auditoria posteriores. APK `0.01.14/54318` foi construído a partir do commit `4734b6ce...`.

Cada snapshot preserva estrutura real de pastas, código Java, JS, Gradle, AndroidManifest, XML, scripts Python, testes, GitHub Actions, documentação e assets rastreados. Arquivos .java/.js/.md/.txt/.yml/.json/.xml são editáveis em um editor comum. APKs e PNGs são binários: inspecionáveis, mas não substituem o código-fonte.

## Conteúdo
- `sources/`: três árvores completas obtidas via git archive (sem objetos .git ou segredos de Actions).
- `binaries/`: APKs oficiais/QA (quando disponíveis) e os relatórios originais de Actions; não alterar assinatura.
- `git/`: refs, histórico sucinto, diffs com alterações completas, metadados da PR, backups.
- `audit/`: inventário, SHA-256, integridade APK/sprites/certificado, estado do GitHub e relatório JSON.
- `governance/`: prompt completo, checklist CSV, escopo, riscos, instruções de reprodução, resultados e pendências.
- `MANIFESTO_SHA256.txt`: hashes de todos os itens (exceto o próprio manifesto).

## Regras imutáveis
- Não fazer merge da PR #73, não publicar release e não substituir arquivos assinados sem autorização e teste Samsung de AMBAS as Pokébolas.
- Não mexer no applicationId `com.lucianotoscano.pokesearch` ou namespace `com.lucianotoscano.pokesearchoverlay`.
- Pokébola 1 inicia em 15/15/15 (100%) e Pokébola 2 em 0/0/0 (0%). Conta/login compartilhados, pesquisas/estados individuais.
- Não copiar coordenadas de outro encontro; jamais contornar validação de espécie, CP, índice, searchId, TTL ou limite da API.
- Não exportar JWT, cookies, chave de assinatura, segredos de GitHub ou dados de terceiros. O pacote só usa código já versionado e artefatos de QA.
- Backup do antigo Guia Mestre deve permanecer byte a byte intacto.

## Limitações
GitHub Actions e testes simulados não provam correção em Android real. Verifique Get coords real, cartões, sprites, alertas, sons, três perfis, instalação sobre a versão oficial, preferências e expiração no Samsung. A PR #73 possuía conflito de merge com main; NÃO resolver substituindo main cegamente.

Leia `governance/PROMPT_AUDITORIA_COMPLETA.txt` e `governance/CHECKLIST_SAMSUNG.csv` e depois `audit/STATUS_E_INTEGRIDADE.json`.

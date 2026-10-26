# PokeSearch LT120 — Auditoria incremental e correções efetivamente verificadas

**Data:** 26/10/2026. **Fonte inspecionada:** `main` após LT119, commit `fd40f61af394ab0b489403e3ad6633fc13094f31`; guias LT117/LT118 e fontes Java/JS vinculadas. **Não substituir evidência de tela/aparelho por validação estática.**

## Problemas comprovados no código e corrigidos

### 1. Sprite de Pokémon com traje pode se perder na ida API -> WebView
- Fonte API tinha campos `costume_id`/`costume`; `spriteData` conscientemente rejeitava imagem-base de traje.
- `normalizeResponse` construía uma nova representação de cartão **sem** esses campos.
- No `sprite_offline.js` havia fallback para forma NORMAL/DEFAULT sem evidência de traje. Isso permitia selecionar a sprite genérica para um encontro vestido no card, inclusive com Shiny.
- **LT120:** `costume_id` inteiro 0–100000, ou `null` quando não fornecido, e `costume` textual limitado a 70 caracteres são propagados aos cartões. Identidade inválida leva à rejeição; traje impede fallback indevido. A forma normal sem traje permanece com imagem exata verificada.
- **Teste:** trajes com ID e nome, IDs malformados, ausência de traje, imagens do detalhe/lista e herança das duas Pokébolas.

### 2. GL/UL: candidatos válidos após o décimo podem desaparecer
- `api_result_contract.normalizeResponse` limitava primeiro a dez entradas; `api_browser_transport.search` só depois selecionava candidatos com `candidate.pvp.league` e `candidate.pvp.rank` válido.
- Se dez primeiras entradas fossem ranks 25–50 e a seguinte rank 1, a interface podia exibir vazio ou perder os ranks válidos; era falha de ordem de operações (e não evidência de que site não tem Pokémon).
- **LT120:** aplicar validação liga Great/Ultra e rank 1–50 configurado **antes** de compor os dez cards; preservar `sourceIndex` original da API para Get coords. Falhar `pvp-unverified` quando retorno não vazio não apresenta qualquer encontro com rank verificado. Permitir verdadeiro zero de linhas do servidor, sem inventar Pokémon.
- **Teste:** pelo menos dez candidatos inválidos antes de dois válidos, Great/Ultra independentes, rank não inteiro/rejeitado, HTTP simulado, fonte e índices preservados.

## Entrega verificada
- Código-fonte `4bb2292a1903ef1cdd059eee06fe4bad0f465b4e`, branch `fix/lt120-api-costume-pvp-parity-20261026`.
- PR [#75](https://github.com/LucianoToscano/PokeSearch/pull/75) MERGED em `main` pelo commit `2e21e8d9dc151ad7655c0599bf1b181b515236aa`.
- [QA assinada #40415380981](https://github.com/LucianoToscano/PokeSearch/actions/runs/40415380981) SUCCESS, [Node #40415405985](https://github.com/LucianoToscano/PokeSearch/actions/runs/40415405985) SUCCESS, [Java Android compile #40415405952](https://github.com/LucianoToscano/PokeSearch/actions/runs/40415405952) SUCCESS.
- APK `PokeSearch-v0.01.20-LT-API-Parity-QA.apk`; versão `0.01.20`, código `54324`, 41.754.958 bytes, SHA-256 `5620e9062ad9375b1081ae1d1623069d75cbb648f20a4070812296c5c707a57e`, certificado permanente Android v2 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Inclui 2.050 sprites gerais e duas sprites Zigzagoon Galar LT119.
- `docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md` preservado; não apendar ao backup.

## Pendente, sem atestado de correção

| Prioridade | Pendência | Exigência de validação |
|---|---|---|
| P1 | Regras RTDB e agregados de usuários online/instalações em produção | Evidência de deploy, idempotência/backfill e regras publicadas. Não criar contadores falsos. |
| P1 | Mural com postagem segura | Moderação, aprovação backend e rate limiting reais antes de habilitar escrita. |
| P1 | Sprites, notificações, localização, API/DOM e Get coords em P1 e P2 | Testes instrumentados e matriz dos 110 cenários no Samsung. |
| P2 | 2.050 sprites-base: fonte master mutável; lock imutável de hashes não versionado | Pin + lockfile reproduzível, comparação hash no CI. LT119 só fixou a fonte de dois sprites regionais. |
| P2 | WebViews allowlists, navegações não previstas e recursos externos | Auditoria de todos WebViewClient e rotas permitidas, com testes de URLs inválidas. |
| P2 | Background/Doze, targetSdk/Foreground Service | Migração planejada com testes no Android 13–16 e notificações. |
| P2 | Limpeza de workflows legados e exclusão do teste LT74 | Separação de fluxos, manutenção dos testes ainda pertinentes, não remover pipelines de produção sem substituto. |
| P2 | Formas e trajes restantes | Correspondência oficial exata, normal/shiny, sem atribuir base genérica. |

## Regra permanente
Mudanças de API/DOM, filtros, resultados, sprites, card, ranking, Get coords, sons, notificações, localização e expiração devem ser testadas **nas duas Pokébolas**, mantendo `prefs` e `prefs_secondary` independentes. `applicationId` e certificado não podem mudar. Não promover LT120 QA ao canal estável sem Samsung e backend.

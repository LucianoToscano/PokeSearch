# PokeSearch — Índice Central de Continuidade e Preservação

> **Atualizado em 21/11/2026.** Porta de entrada documental do projeto. **Não substitui nem reduz** o [Guia Mestre](GUIA_MESTRE.md), o [histórico integral](GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md) ou [AGENTS.md](../AGENTS.md).

## 1. Ordem obrigatória antes de qualquer alteração

1. Consultar [GUIA_MESTRE.md](GUIA_MESTRE.md) e conferir a **primeira versão oficial registrada**. Registros mais antigos são históricos, mesmo quando afirmam ser a versão “atual” na data de sua criação.
2. Ler [AGENTS.md](../AGENTS.md), especialmente regras ARK, assinatura, canal oficial, privacidade, paridade P1/P2 e preservação do backup.
3. Conferir [GitHub Releases/latest](https://github.com/LucianoToscano/PokeSearch/releases/latest), HEAD da `main`, [Actions](https://github.com/LucianoToscano/PokeSearch/actions), PRs e o [pedido oficial](../release/official-request.json). Não inferir publicação a partir de um documento ou de uma PR.
4. Ler as auditorias e o ARK mais recentes relevantes para a área: [LT409](ARK_LT409_AUTO_HUNT_SIMPLES_OFICIAL_20261120.md), [auditoria LT409](LT409_AUDITORIA_UX_AUTO_HUNT_SIMPLES_20261120.md), [LT408](ARK_LT408_GPX_OFICIAL_20261120.md), [LT407](ARK_LT407_SOMENTE_OFICIAL_20261117.md), [LT405](ARK_LT405_SPRITES_POKEDEX_OFICIAL_20261117.md) e [LT402](ARK_LT402_POKEDEX_INVENTARIO_SAF_OFICIAL_20261117.md).
5. Antes de editar código, verificar dependências, referências, testes e riscos de migração; gerar mudanças pequenas, rastreáveis e reversíveis. **Sem apagar histórico, assets, configurações ou workflows por aparência de duplicidade.**
6. Depois, documentar **o que foi comprovado**, o que permanece pendente, os testes e links exatos; enriquecer o Guia Mestre sem encurtá-lo.

## 2. Estado oficial confirmado na auditoria

- **Última release estável pública:** `v0.03.94-54601` (PokeSearch **v0.03.94 LT**, label **51409**, ARK **LT409**), em **20/11/2026**. [Release](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.94-54601).
- **APK oficial:** `PokeSearch-v0.03.94-LT.apk`, 61.767.162 bytes; digest GitHub SHA-256 `9fb65f1e3f747355b7dfaed2e6318b889713c71bf42aa71b5c0f715e9854f505`. [Download oficial](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.94-54601/PokeSearch-v0.03.94-LT.apk).
- **Workflow protegido histórico da LT409:** [#44696085963](https://github.com/LucianoToscano/PokeSearch/actions/runs/44696085963) registrado como `completed/success`. Esta auditoria documental **não gerou outro APK** nem homologou fisicamente Android 17.
- **Canal de distribuição:** somente aplicativo LT oficial; referências a FastDev/DEV/Preview em documentos antigos são **históricas**, não instruções vigentes de distribuição.

## 3. Mapa de fontes e responsabilidades

| Fonte | Responsabilidade | Política |
| --- | --- | --- |
| [Guia Mestre](GUIA_MESTRE.md) | Verdade documental corrente, entregas, decisões, limites e histórico encadeado | **Ler primeiro; acrescentar evidências; não substituir por resumo menor** |
| [AGENTS.md](../AGENTS.md) | Regras executivas para IA/desenvolvimento e entrega | Preservar regras e destacar precedência de decisões novas |
| [README.md](../README.md) | Apresentação pública e caminho até a fonte canônica | Estado atual no topo; manter versões antigas como histórico |
| [Arquivo mestre integral 25/10](GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md) | Registro histórico de 1.459.814 bytes | **Intocável sem motivo comprovado**; consultar trechos pontuais |
| [Manual operacional](MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md) | Continuidade, QA, APK, OTA e Drive | Confirmar regras atuais em AGENTS e no Guia |
| `app/src/main/` | Código Android, recursos, UI e imagens usadas pelo app | Não remover imagens com mesmo hash sem verificar consumidores |
| `app/tests/` | Regressões e invariantes | Não alterar expectativas para mascarar defeitos |
| `functions/`, `firebase*.json` | Integrações e regras Firebase | Não implantar ou afrouxar regras durante limpeza documental |
| `.github/workflows/` | CI, QA, assinatura e publicação | Não apagar/desativar workflows sem análise de gatilhos e dependências |
| `release/`, `ota/` | Pedido de versão, metadados e canal de atualização | Não alterar em auditoria sem solicitação de novo APK |
| `scripts/` | Ferramentas de build, exportação e auditoria | Executar verificação somente-leitura antes de limpezas |

## 4. Organização lógica de documentação — sem mover arquivos

- **Estado corrente e governança:** Guia Mestre, AGENTS, este índice, documentos ARK mais recentes.
- **Auditorias temáticas:** arquivos `LT*_AUDITORIA*`, `ARK_LT*`, rastreáveis pelo número LT e data.
- **Continuidade operacional:** `LT*_PROMPT_CONTINUIDADE*`, `LEIA_PRIMEIRO*`, manual operacional.
- **Histórico imutável:** backup integral e arquivos `ARQUIVO_MESTRE_v*`, `ESTADO_CANONICO_*` e relatórios de versões anteriores.
- **Implementação e testes:** arquivos em `app/`, `functions/`, `scripts/` e fluxos CI.

Arquivos com nomes parecidos podem ter **contextos, datas, fontes e finalidades diferentes**. O histórico deve continuar acessível; preferir índice + referências e uma única fonte canônica para o estado atual, sem fusões destrutivas.

## 5. Regras permanentes de limpeza segura

1. **Inventariar → comparar → localizar consumidores → validar → documentar → então propor alteração.**
2. Repetição de arquivo ou conteúdo não comprova redundância funcional: um recurso pode ser requerido por caminhos Android `assets/`, `res/`, launcher ou build.
3. Nunca apagar ou reescrever o backup integral, material original de arte, fontes, sprites, dados privados, chaves, scripts de release ou workflows com base em nome/tamanho/hash isolados.
4. Alterações potencialmente destrutivas exigem plano de reversão, evidência de não uso, verificação em PR e aprovação expressa; preservar a versão anterior recuperável.
5. Não incluir tokens, nomes de usuários, credenciais, certificados privados ou conteúdo pessoal em relatórios.
6. Diferenciar sempre: **publicado**, **QA aprovado**, **pendente de teste físico**, **histórico** e **proposta**.
7. Para projetos futuros, consultar o índice e o Guia antes; atualizar ambos quando surgir uma nova área ou regra.

## 6. Auditoria de 21/11/2026

Consulte [AUDITORIA_ORGANIZACAO_PRESERVACAO_20261121.md](AUDITORIA_ORGANIZACAO_PRESERVACAO_20261121.md). A etapa identificou **1.796 arquivos**, **486 arquivos na pasta docs**, **261 workflows** e **6 grupos de arquivos com blob idêntico** (GitHub tree da `main`, sem truncamento). Nenhum desses números, sozinho, justifica exclusão. A ferramenta `scripts/audit_repository_safely.py` permite repetir verificações **somente-leitura** em um checkout local.

> **Importante:** esta organização não altera versões, assinatura, APK, release, Firebase, inventários, preferências, Home, Pokémon GO ou integrações. Status posterior deve ser confirmado nas fontes ao iniciar cada nova atividade.

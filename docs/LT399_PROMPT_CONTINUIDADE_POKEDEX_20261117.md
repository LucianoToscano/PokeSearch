# POKESEARCH — ARK LT399 — Continuidade após a publicação oficial LT398
Data: 17/11/2026

## Origem obrigatória
PokeSearch **v0.03.83 LT / versionCode 54590 / label 51398**, publicado e assinado em https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.83-54590.
APK: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.03.83-54590/PokeSearch-v0.03.83-LT.apk
Código PR #506 squash 1ff2b781769c6a07b05a0dbbdfa23f7e67b0c27d; versão PR #507 squash 044690f5699781785371c0e8dc51f79c84b304ad. Workflow protegido #44068120870 completed/success.

Leia AGENTS.md, docs/GUIA_MESTRE.md e docs/ARK_LT398_POKEDEX_PUBLICADA_20261117.md antes de modificar qualquer arquivo. Trabalhar SOMENTE sobre a versão pública vigente e não alterar assinatura permanente nem ícones existentes da Home.

## Prioridades P0 — homologação física
1. Instalar a atualização sobre 0.03.82 sem apagar dados no Samsung SM-S928B Android 17, verificar atividade Minha Pokédex ao tocar no ÍCONE ORIGINAL da Home e no menu lateral; garantir não regressão de P1/P2, Buscar Pokémon, Comunidade/Quest/Assistente/Trocas.
2. Importar o PGSStats.json privado pelo seletor nativo Android e validar aproximadamente 1.198 Pokémon, 11 ovos, capacidade 1.200, 176 Shiny, 114 com registro de fundo e 47 com traje segundo o instantâneo, sem expor identificadores de conta ou JSON bruto. Verificar conjuntos 1/2 isolados, reinício e reimportação.
3. Inspecionar lista em três colunas, abas Tags/Pokémon/Ovos, filtros e ordem; conferir detalhes de Delphox, Empoleon e formas especiais com as capturas de referência; testes de rolagem, toque, texto longo, layout em Android 11–17, temas e TalkBack.
4. Validar regressões de sprites: imagens existentes e fallback correto sem trocar forma/traje/Shiny; coletar evidências antes de alterar atlas. Validar nomes de golpes pt-BR, IVs e rankings PvP somente para correspondências exatas.
5. Garantir que o seletor de arquivos SAF não abra dados de outras contas automaticamente; nunca sincronizar o inventário ou enviar JSON para comunidade sem consentimento explícito.

## Melhorias posteriores P1
- Acrescentar correspondência verificada de IDs de fundos e trajes com imagens efetivamente autorizadas, sem copiar recursos do Fandom ou extrair mídias privadas de terceiros. Foco em localização/eventos/fundos especiais.
- Adicionar etiquetas manuais e anotações locais sem alterar os fatos originalmente importados, com exportação privativa e backup consentido.
- Cruzar estimativas de PvP com snapshot atualizado e distinguir ranking por IV versus ranking geral de espécie.
- Definir atualização de importações com diferenças de capturas/evoluções/transferências a partir de snapshots fornecidos pelo usuário, sem afirmar sincronização oficial em tempo real.
- Trocas/vendas/leilões e dados públicos continuam FORA DO ESCOPO, salvo instrução posterior.

## ARK obrigatório
Auditar e corrigir, testar Node, LT169, LT211, LT62 Java, LT173, PGS QA, Secure beta/R8; após aprovação e sem bloqueios, squash merge main, versão monotônica, release/official-request.json, release_notes.json, workflow protegido com APK permanente e verificação pública de hash/certificado; atualizar Guia Mestre, auditoria e prompt seguinte. Não confundir CI com teste em aparelho.

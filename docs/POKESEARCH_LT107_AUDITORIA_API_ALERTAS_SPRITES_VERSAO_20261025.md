# LT107 — Auditoria integrada de API, sprites, alertas e versão (25/10/2026)

## Backup e escopo
- Main original antes de todas as correções: `ed229ad9717113c4cc255108a67f1c5e1567313d`.
- Backup imutável: `backup/lt106-before-semantic-version-correction-20261025`; não sobrescrever.
- Branch: `fix/lt107-version-scheme-00100-20261025`, sem reset de preferências, autenticação ou perfis.
- Aplicar as correções sobre tudo que já existe, incluindo dois serviços flutuantes, 1.025 sprites normais e 1.025 shiny, áudio LT106 e mural.

## Causa raiz 1 — Nenhuma notificação da API
- A maior parte das buscas segue `authorizedApiQaOptIn=true` por padrão, mas `OverlayService.applyCollectedResults` ignorava `recordNewResults` sempre que a fonte era `authorized-api-qa`. **Qualquer Pokémon real devolvido pela API ficava sem notificação de novo Pokémon e sem alerta de Favoritos**, mesmo com permissões e som ON.
- Corrigido: `api_android_session.js` transmite `requestValidated` da camada HTTP. `OverlayService` só permite alertas após `criteriaConfirmed`, `resultChanged`, `requestValidated`, `confirmationSource=api-http-200` e rank PvP verificado; o filtro IV bruto/IV% é novamente validado nativamente.
- `recordNewResults` continua rejeitando expired, deduplicando por identidade e chamando `WatchAlerts.match` para Favoritos mesmo quando alertas gerais estão OFF. Novos Pokémon dependem de `alertsMode=on/silent`, em cada Pokébola.
- Novo canal `pokesearch_new_sound_v3_*` (também para notificações gerais) migra de canais Android antigos possivelmente silenciados, mantendo decisão final de som nas configurações do Android; o canal v3 de Favoritos da LT106 permanece.

## Causa raiz 2 — Sprites da segunda Pokébola
- `api_result_contract.js` dava `image=""` quando a API retornava uma espécie normal como `PIKACHU_NORMAL` ou `PIKACHU_DEFAULT`. O WebView então não criava sequer `<img>`, logo o APK com 2.050 arquivos não tinha imagem para interceptar.
- O parser reconhece agora exclusivamente nomes confirmados da forma-base: vazio, NORMAL, DEFAULT, espécie, espécie+NORMAL e espécie+DEFAULT. URL-base exata segue para o `VerifiedSpriteCache`, que serve a imagem do APK nos WebViews de ambas as Pokébolas.
- Para Alolan, Galarian, outras formas especiais/trajes e IDs não compatíveis, **não** atribuir falsamente a imagem comum. Permanece placeholder até existir fonte verificada de sprite específico.

## Auditoria — Três perfis de favoritos
- `PokemonPicker` usa `favoritePresetV1_1..3` e `favoritePresetActiveV1`, todos em `prefs` global do aplicativo, não em `prefs_secondary`. A lista ativa é `WatchAlerts.PREF_LIST=watchList` e o perfil selecionado salva automaticamente.
- Apenas **o perfil ativo** alimenta alertas dos dois overlays; os outros dois ficam salvos para troca manual. Ativar um slot vazio salva a lista atual; ativar slot já salvo carrega a lista; segurar para limpar requer ação explícita.
- Alertas gerais permanecem controlados por overlay (`alertsMode` em `prefs` ou `prefs_secondary`), enquanto a lista Favoritos e preferências de som são globais. Essa diferença deve ficar clara no teste Samsung.

## Nome correto da versão
- Com 0.00.99 finalizado, incrementa a centena: **0.01.00, 0.01.01, 0.01.02, 0.01.03, 0.01.04, 0.01.05, 0.01.06, 0.01.07...**
- Artefatos históricos assinados `0.00.100..106` não são adulterados/reassinados sob o mesmo hash: display de GitHub/Drive mostra versão canônica via `VersionNames.canonical`, mantendo URI e assinatura originais. Política de Drive reconhece apenas rótulos legados 100..106 para instalar APK já publicado, mas futuros builds rejeitam terceiro grupo de três dígitos.
- Novo candidato com `versionName=0.01.06` e `versionCode=54310` (superior ao 54309 anterior), mesmo `applicationId` e certificado permanente. Versionamento posterior deve usar `0.01.07` / versionCode estritamente crescente.

## QA, segurança e publicação
- Testes Node LT107 cobrem formas NORMAL vs variantes, Shiny, contratos de alerta por API, campos do filtro e perfis. `VersionNamesTest.java` valida todas as transições de 0.00.99 a 0.01.07. Atualizados os testes históricos de manifest Drive sem mudar sua semântica de segurança.
- CI protegido: `.github/workflows/lt107-full-audit-canonical-signed-qa.yml`, versão `0.01.06` / `54310`, Android SDK36, Java17, Node22, assinatura release permanente, R8, SHA-256 e reconstrução dos 2.050 sprites PokeAPI offline.
- *Pré-release QA*, não substitui LT103 estável ou link Drive sem homologação e autorização para distribuição.
- Samsung: teste permissões, volume/Não Perturbe, ambos grupos de notificações em Som (se desejado) e dois serviços individualmente. Realize busca com IV 100% e 0%, novos Pokémon e favoritos ativos; trocar perfil 1→2→3 sem apagar lista; não notificar spawn vencido/duplicado; sprites comuns/normal/shiny de ambos os resultados inclusive em rede lenta.

# PokeSearch — Ciclo LT88–LT93 (QA / andamento)
Data: 25/10/2026. Repositório: LucianoToscano/PokeSearch.

## Origem canônica e proteção
- Main no começo do ciclo: 83cf9a693a3672276e01d04e38ed14dce0071cb8.
- LT87 oficial intacta: 0.00.87 / versionCode 54290; release v0.00.87-54290.
- SOURCE_COMMIT do APK LT87: 21d6547e9cb19efe941134d087f2783d6753ee55.
- SHA256 certificado permanente: 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e.
- Branch única: feature/lt88-lt93-evolution-20261025; PR #63 Draft.
- Sem merge, sem modificação de main, sem Release automática.
- Build proposto para QA: 0.00.88 / versionCode 54291. Nenhum APK será chamado de PASS antes do relatório do CI.
- Proteções preservadas: applicationId, namespace, API autorizada com DOM alternativo, rate limits, 10 resultados, dados verificados, R8, assinatura e preferências.

## Evidência Samsung (07 prints do proprietário)
- Favoritos 17/50 com miniaturas funcionando, perfis 1/2/3 em linha excessivamente alta.
- Filtros: rail sem fundo suficiente, botão ▣ junto do título, alinhamento e posição visual a conferir.
- Pokémon: sprites faltando em Bulbasaur/Ivysaur/Venusaur e mensagem legada importação do site visível.
- Menus Filtros podem se deslocar visualmente em relação à barra.
- Não declarar PASS físico da versão nova por captura da LT87.

## Implementado na branch (aguarda QA final)
1. LT88: estrelas ☆/★ para os três perfis Favoritos, movidos para o cabeçalho entre contador e X; ações curtas/longas preservadas.
2. LT88: fundo real com base claro/escuro nos rail/editor/volante de perfis de Filtros; título central e ▣ à direita com margem; área externa transparente sem capturar toque.
3. LT88: cache privado de PNGs-base da PokeAPI persistido no diretório de cache, LRU limitada e checagem de tamanho/tipo; reutilização read-only em WebViews de menu, popup e resultados. Pool assíncrono de miniaturas no menu Pokémon.
4. LT88: reconhecimento de BASE/SPECIES_NORMAL com catálogo oficial, sem atribuir sprites a trajes/variantes desconhecidas.
5. LT89-A: nomes editáveis dos três perfis gerais, com persistência separada de configurações. Não alteram Shiny ou coordenadas.
6. LT90-A: deduplicação recente de alertas com TTL e atributos de identidade do encontro, descartando expirados; mantém notificações API diretas suspensas até QA com conta real.
7. LT91-A: três localizações de pesquisa nomeadas com tap para usar e long press para salvar, validadas em 0–1000 km, sem GPS físico.

## Ainda pendente (não alegar implementado)
- LT88: diagnóstico detalhado de performance, ajustes finos de geometria e testes físicos Samsung, casos de Despawn ainda não reproduzidos no aparelho.
- LT89: exportação/importação validada dos perfis, nomes dos perfis de Favoritos, UX completa de indicadores ativos.
- LT90: priorização avançada de favoritos, ajustes de custo de consultas e diagnóstico anonimizado voluntário.
- LT91: Modo Caçada completo com perfis e alertas independentes.
- LT92: Mural Orkut com backend Firebase, moderação e regras já implantadas: não habilitar publicação sem App Check/limites e validação das regras reais.
- LT93: painel de administração e métricas agregadas versionadas/privacidade.

## QA exigida antes de instalar
- Workflows: pokesearch-node-qa.yml, pokesearch-android-compile-qa.yml e lt88-lt93-cycle-signed-qa.yml.
- Fluxo assinado gera PokeSearch-v0.00.88-LT-Cycle-QA.apk, SHA256SUMS, SIGNING-REPORT, SOURCE_COMMIT e proteção R8.
- Conferir assinatura v2, certificado permanente, package, versionCode 54291, versionName 0.00.88, ausência de debuggable.
- Verificar Node histórico + regressão LT86; atualizar apenas ASSERTIONS que exigem mecanismo substituído pela nova implementação sem remover verificações de segurança.
- Samsung real: Favoritos 3 estrelas no cabeçalho, fundos Filtros, title/▣, catálogo/sprites, menu ancorado, arrastes, sexo ⚲, GL/UL/IV/Shiny, Despawn, perfis, login, Get coords, localização 24.9407581,121.1889794 com 0/215/1000.
- Não habilitar alertas da API nem publicar mural sem validação das respectivas regras.

## Guia Mestre
Este documento é um checkpoint auxiliar. docs/GUIA_MESTRE.md deve permanecer integral (>1,4 MB) e receber apenas append protegido em checkout completo, com verificação de hash do prefixo; nunca substituir por resposta truncada do conector.

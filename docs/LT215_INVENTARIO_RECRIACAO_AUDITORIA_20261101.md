# PokeSearch — Inventário aberto para auditoria e reconstrução (LT215)

Data: 01/11/2026. Idioma: português do Brasil. Repositório: LucianoToscano/PokeSearch.

## Escopo do código editável

O ZIP de origem é produzido a partir da árvore Git rastreada por um commit identificado. Preserva Java, HTML/CSS/JS, JSON, scripts Python e Node, layouts, recursos incluídos no repositório, workflows GitHub Actions, testes, regras Firebase e documentação. Exclui histórico .git, caches, binários gerados e qualquer credencial privada. Não inclui a chave original de assinatura, dados de contas nem tokens.

## Índice de arquivos

| Local | Utilidade para recriação e auditoria |
|---|---|
| app/src/main/java/com/lucianotoscano/pokesearchoverlay/ | Serviços de overlay, autenticação, Doce Raro, favoritos, atualizador, filtros e UI Android |
| app/src/main/assets/ | HTML, JavaScript, CSS, probes, catálogos, sprites, notas de versão |
| app/tests/ | Testes automatizados Node e Java, regressões históricas |
| app/scripts/ | Geradores e validação de metadados e sprites |
| app/src/main/AndroidManifest.xml | Permissões, componentes Android, serviços e atividades |
| app/build.gradle.kts | Configuração do APK, versionCode/versionName e R8 |
| .github/workflows/ | Gates de CI, build/assinatura QA, release estável e arquivo-fonte |
| ota/ e scripts/ | Contratos do atualizador, integridade, geração e testes |
| firebase-realtime.rules.json, firebase.json, .firebaserc, functions/ | Configuração de backend e regras, sem segredos operacionais |
| docs/, AGENTS.md, README.md, LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md | Fonte de requisitos, histórico, checkpoint e instruções |

## Funcionalidades em destaque

Duas Pokébolas independentes, modos 100%, 0%, IV, IV%, GL e UL, filtro de espécies/formas, até dez resultados do PoGoCoordinates, raio, favoritos até 50 com posições visuais independentes (LT213), alertas, skins, login opcional e acesso sob as regras da API. LT212 corrigiu transparência do ícone IV.

O overlay independente de Doce Raro permite procurar, copiar coordenadas, confirmar coleta, manter cooldown estimado e atualizar periodicamente respeitando HTTP 429. LT214 permite que abrir Localização tente preencher coordenadas válidas já copiadas, preserva Colar manual, mostra 16 faixas informativas de cooldown ao tocar no título Localização, e apresenta prévia temporária ao mover km. O raio de busca não é a distância real entre coletas e não inicia contadores.

## Como reconstruir

Preparar JDK 17, Gradle 8.11.1, Android SDK compileSdk 36, minSdk 26, targetSdk 33, Node.js 22, Python 3 e acesso às dependências legítimas. Inspecionar gradle.properties, build.gradle.kts, settings.gradle.kts, app/build.gradle.kts e app/src/main/AndroidManifest.xml.

Com dependências e Android SDK instalados: gradle --no-daemon :app:testDebugUnitTest :app:assembleDebug. Os testes JS podem ser executados com: for t in app/tests/*.test.js; do node "$t" || exit 1; done. Há testes Java puros e Python em .github/workflows/qa-core-contracts.yml, além de scripts/test_ota_builder.py.

Geração de assets no CI: python3 app/scripts/build_pokemon_card_metadata.py; python3 app/scripts/update_wwm_catalog.py app/src/main/assets; python3 app/scripts/build_sprite_bundle.py --workers 12 --minimum-normal 950. Build release exige assinatura permanente autorizada, verificação R8, apksigner, aapt, SHA-256 e APK íntegro.

## Dependências externas e limites

A chave original de assinatura do APK NÃO integra o pacote e NÃO é reproduzível a partir do código. Um APK reconstruído com outra chave não é atualização direta da edição original. Credenciais Google/Firebase, contas, JWT, dados pessoais e segredos de CI também não são incluídos. Imagens, sons e marcas de terceiros podem exigir licenças específicas. APIs, opções Shiny e rate limits dependem dos serviços externos; não inferir disponibilidade a partir de teste estático.

## Checklist de auditoria 360 graus

Avaliar contratos das APIs, tratamento de erro, HTTP 429/Retry-After, arquitetura Android, lifecycle, limites de memória, duas Pokébolas, persistência dos favoritos, seguranca de WebView, origem das funções JavaScript, gestão do clipboard, UI responsiva e acessível, Firebase/regras, instalação de updates, integridade SHA-256, compatibilidade Samsung/Android 10 a 16, direitos dos assets e independência dos overlays.

Para cada achado registrar arquivo/linha, prova, severidade, reprodução, correção mínima, teste automático e teste no aparelho. Sem modificar o chat nesta etapa. Não declarar teste físico onde só houve simulação. O instalador estável só pode ser considerado publicado após confirmar GitHub Releases/latest e o certificado de assinatura.

## Estado e versionamento

LT211 0.02.11/54418 era a última release estável antes deste candidato. LT212 (54419), LT213 (54420) e LT214 (54421) foram QA. LT215 0.02.15/54422 é o novo candidato estável, após validação do workflow oficial. Próxima edição deverá ter versionCode maior que 54422.

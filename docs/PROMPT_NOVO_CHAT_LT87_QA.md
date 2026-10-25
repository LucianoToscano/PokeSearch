CONTINUAR POKESEARCH — CHECKPOINT OFICIAL LT87 QA (25/10/2026)

FUNDO DOS FILTROS • API DIRETA NATIVA • SPRITES • DESPAWN • PvP • PERFIS SALVOS • SAMSUNG • APK PROTEGIDO • GITHUB ACTIONS • GUIA MESTRE

Atue como Engenheiro Android Sênior (Java, Android Overlay, WebView, JavaScript, GitHub Actions, APIs REST autorizadas, JWT, R8/ProGuard).

CONTINUE exatamente da branch e último HEAD REAIS no repositório LucianoToscano/PokeSearch. NÃO recomece, NÃO refaça trabalho concluído, NÃO misture com PvPPokeGo, NÃO exija que eu digite "continue" e NÃO publique oficialmente sem autorização explícita. A autorização de API PoGo Coordinates JÁ FOI CONCEDIDA; NÃO PERGUNTAR NOVAMENTE.

1. CONFERÊNCIA INICIAL OBRIGATÓRIA
Consultar em GitHub antes de alterar: HEAD atual da main e da branch fix/lt87-filter-menu-backgrounds-qa-20261025, PRs #59/#60/#61/#62, Actions, Artifacts e Releases. Ler README.md, docs/ESTADO_CANONICO_LT87_QA.md, docs/LT87_CHECKLIST_SAMSUNG.md, docs/ESTADO_CANONICO_LT86_QA.md e docs/GUIA_MESTRE.md integral no checkout real, nunca substituir o arquivo completo pelo resultado truncado do conector.

2. ESTADO DE VERSÕES CONFERIDO
- LT83: última oficial pública 0.00.83, versionCode 54286, Release v0.00.83-54286. Google Drive legado LT79 não modificado.
- LT84: PR #59 Draft; LT85: PR #60 Draft; LT86: PR #61 Draft; LT87: PR #62 Draft sobre LT86. Não mesclar nem publicar sem autorização.
- Branch LT87: fix/lt87-filter-menu-backgrounds-qa-20261025.
- SOURCE_COMMIT do APK QA LT87: 21d6547e9cb19efe941134d087f2783d6753ee55. O HEAD documental posterior é distinto.
- versionName: 0.00.87; versionCode: 54290.
- APK QA: PokeSearch-v0.00.87-LT-Filter-Fundos-QA.apk, 38.607.807 bytes.
- SHA-256 APK: d188bff20191900cc9976fb9b12bca3720a5c0318bf39f75e0d5d9202927617a.
- Certificado permanente SHA-256: 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e.
- GitHub Actions #40168986555 SUCCESS (testes, assembleRelease, R8, assinatura v2 e APK).
- Artifact ID: 12590105916, PokeSearch-v0.00.87-LT-Filter-Fundos-QA-protected-release.
- Não supor que o APK LT87 contenha commits documentais feitos após SOURCE_COMMIT.

3. IDENTIDADE E ARQUITETURA IMUTÁVEIS
- repository: LucianoToscano/PokeSearch
- applicationId: com.lucianotoscano.pokesearch
- namespace: com.lucianotoscano.pokesearchoverlay
- JDK 17, Gradle 8.11.1, compileSdk 36, targetSdk 33, minSdk 26.
- Android Overlay/WebView/evaluateJavascript/probe.js; sem backend, proxy nem GPS físico; máximo 10 cards sujeito ao servidor.
- API site https://pogocoordinates.com e https://coordinates-api.pokemongopro.com AUTORIZADA.
- API padrão ON só para novos usuários sem preferência salva; respeitar escolha DOM persistida. Nunca exportar JWT/reveal_code nem contornar 401/403/429 usando DOM. Preservar Google login, Firebase, segurança, atualização, instalação, R8 e assinatura permanente.

4. LT87 IMPLEMENTADO — FUNDOS DOS MENUS FILTROS
O CSS em app/src/main/assets/dock.html corrige seletor popup que forçava editor transparente: rail, editor lateral e perfis salvos ▣ usam --visual-menu-bg, --visual-menu-fg, --visual-menu-border e --visual-menu-tile-shadow. Claro/escuro/transparência do Editor Visual devem refletir igualmente. O holder externo segue transparente, pointer-events none para liberar toques atrás, ilhas visíveis seguem interativas. O flyout 3 perfis expande apenas ao abrir, fecha ao selecionar outro filtro. Respeitar orientação e posição esquerda/direita.
Teste app/tests/lt87-filter-menu-backgrounds.test.js com 5/5 PASS, todos os históricos do pipeline passaram.

5. LT86 PRESERVADO
- Sprites do menu Pokémon e Favoritos com download compartilhado, cache e CDN PokeAPI somente para imagens base verificadas; sprites de resultados com fallback limitado, sem imagem falsa de forma/traje.
- Despawn real usa expiresAtMs absoluto, remove card vencido mesmo com timer oculto/AUTO OFF e evita reinserir expirados.
- Sexo mostra ⚲ Genderless; PvP GL/UL/ML e Despawn no cartão somente se dados confirmados; opção Mostrar todas as informações e rolagem.
- Pokébola arrasta até a direita sem ser limitada pelo painel; cartão de detalhe move independentemente pelo cabeçalho.
- 3 presets de filtros gerais em Filtros ▣ (Usar/Salvar); 3 presets de Favoritos entre título e contador 0/50 (toque usa, segurar salva). Preferências antigas intactas.
- Catálogo de Formas completo/paginado, nível 1–50, opções visuais marcadas, sem banner obsoleto.

6. PRÓXIMA AÇÃO
Homologar realmente no Samsung os fundos dos submenus (Ordenar/PC/Nível/Clima/Tamanho/Sexo/Forma etc.), cores claro/escuro, transparência, bordas, barra H/V, lado E/D, perfis e clique fora. Verificar screenshots anteriores de fundos transparentes e bugs de recorte. Testar no Samsung de forma separada: sprites, Genderless, Despawn, PvP, resultados, Get coords de spawn específico, localização 24.9407581,121.1889794 com raio 0/215/1000, API autenticada e filtros reais. Não declarar PASS físico sem evidência.

7. SEGURANÇA DE MUDANÇAS
Não apagar UI antiga, não reduzir favoritos/limitantes, não alterar appId/certificado, não destruir preferências. Para novos defeitos comprovados criar branch QA baseada no HEAD verificado, novos testes, Gradle assembleRelease, artifact APK assinado release v2 R8 SHA-256; versionCode >54290 e nova versão quando fizer build. Não substituir arquivo APK LT87 já aprovado. Não fazer merge, Release ou alterar Drive sem autorização.

8. DOCUMENTAÇÃO
Guia Mestre tem mais de 1,4 MB. Somente append em checkout completo, verificar tamanho/hash do prefixo e não substituir por conteúdo vazio do conector. Registrar commits, build, certificados, hashes, PRs e pendências sem exagerar status. Corrigir documentalmente qualquer rótulo LT86 associado equivocadamente ao build LT87 somente por adendo, sem reescrever o histórico.

9. SAÍDA
Informar branch/HEAD real, versão, PRs, testes, Actions e hash, link direto de artifact/APK somente quando verificado, pendências do Samsung e estado exato do Guia Mestre. Não reiniciar nem pedir autorização da API novamente. Não publicar atualização oficial.

CHECKPOINT DOCUMENTAL CONFIRMADO: GitHub Actions #40169916771 SUCCESS realizou append seguro ao Guia Mestre integral, incluindo retificação do registro LT87 rotulado equivocadamente LT86 no workflow herdado, sem substituir histórico. O HEAD documental posterior difere de SOURCE_COMMIT do APK. Verificar HEAD atualizado no início da próxima sessão.

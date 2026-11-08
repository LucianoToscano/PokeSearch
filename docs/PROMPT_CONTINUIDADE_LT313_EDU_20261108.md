# PROMPT DE CONTINUIDADE — POKÉSEARCH LT313 (EDU)

Continue o desenvolvimento de **LucianoToscano/PokeSearch**, sempre em português do Brasil. Não comece do zero, não faça downgrade e não substitua a `main` por arquivos de versões anteriores. Primeiro verifique `main`, Releases/latest, PRs, Actions e o SHA do código.

## Último estado oficialmente publicado e validado (08/11/2026)
- Versão LT313 · **0.03.13** · versionCode **54519** · label **51317**.
- Release: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.13-54519
- APK: `PokeSearch-v0.03.13-LT.apk` · 34.949.360 bytes · SHA-256 `ec1a85fbcd37483cfde7823797b22c4fca53bef303d43ec01128c01282652b3f`.
- Workflow oficial #42498529759: preflight e publish **SUCCESS**. PR #312 integrada via squash `36754a72f6d08f1dd8ad107b1b5b42dd5c186d72`; pedido oficial `b61bd0220b325bd944d586f7aab66ed2f0406bc7`.
- Assinatura Android v2 original preservada; não acessar, expor ou trocar keystore/secret. Não marcar QA físico como concluído sem evidência do Samsung.

## Edu — identidade visual, escala e animação
- **67 sprites existentes**: 62 da LT309 mais cinco especiais da LT312. **22 poses ociosas** em rotação: parado, Pokébola (4), caminhada de frente (4), direita (4), esquerda (4), Shiny, Jogando (2), Armadura Mewtwo e Armadura Mewtwo Shiny.
- LT313 adicionou `app/src/main/assets/edu_avatar_idle_consistent_22.webp` com 22 quadros de **128×128**, atlas **1024×384**, WebP lossless com 256 cores e fundo transparente. Hash `9ec3afa294d06d9d1cad9db8d4a3256e5f7230623f58cd6819e835192eee1a62`.
- O corpo deve ter sempre altura aparente **112px** na célula, pés alinhados em **Y=120**. Cabeça, cabelo, óculos, proporções de face, torso, pernas e tênis devem manter visual coerente; Pokébola/efeitos não contam para altura do corpo. Pixel art sem antialiasing nem blur.
- `EduSpriteAtlas.java` remapeia **somente** os 22 índices ociosos para o novo atlas. Preservar os outros 45 quadros contextuais e os índices originais 0..66; nunca criar instabilidade em teleporte, arraste, passes, reides ou eventos.
- Ocioso com balão fechado, pausas naturais e animações até o fim, interrompidas por interação real. Tamanhos P=50, M=75 e G=100 (G inicial) não mudam ao trocar de pose. Fallback anterior deve funcionar se novo asset faltar.

## Relógio e evento (LT311/LT312)
- Relógio Edu único, automático/manual, ao lado dos passes, sem simulador próprio separado e sem alterar relógio ou GPS do Android.
- Exemplo oficial de Mega Chandelure: 31/10/2026, 14h às 17h **horário local**. Região de evento por fuso IANA (não obrigatoriamente Kiribati). Relógio manual em 30/10, 31/10 ou 01/11 deve reconhecer o período histórico quando não existe outro evento configurado, sem pedir novamente data antiga 07/11.
- Edu diferencia véspera, ainda não começou, ativo, encerrado. Nenhum passe ou resultado de reide é presumido ou concedido.

## Preservar sempre
P1/P2 independentes, Doce Raro, busca PoGoCoordinates, IV/PvP/rankings, login/contas, favoritos, API/429, webview, preferências, updater HTTPS+SHA+certificado, notificações, materiais de tutorial, 67 sprites, cores e menus compactos.

## Pendência de homologação
Instalar LT313 por cima da versão anterior no Samsung e verificar visualmente as **22 poses automáticas**, os três tamanhos P/M/G e as transições para os quadros do tutorial, especialmente rosto/cabeça e postura. Conferir também relógio manual do exemplo oficial e fallback. Não afirmar QA física concluída sem prints/vídeo.

## Leitura obrigatória
`LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`, `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/MANUAL_OPERACIONAL_CONTINUIDADE_CI_APK_OTA_DRIVE_20261102.md`, `docs/LT313_EDU_22_POSES_IDENTIDADE_VISUAL_20261108.md`, os testes `app/tests/lt313-edu-consistent-idle.test.js` e arquivos do aplicativo citados acima.

Para qualquer nova mudança autorizada: auditar fonte, criar branch e testes, rodar gates Node/Java/OTA, abrir PR, integrar por squash após QA, emitir pedido em `release/official-request.json`, verificar APK oficial/assinatura/SHA/size e registrar no Arquivo Mestre. Responder sempre em PT-BR, diretamente e sem poluição visual.

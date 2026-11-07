# LT286 — Recuperação visual de sprites na lista de resultados
Data: 07/11/2026 · evidência: capturas do Samsung com imagens quebradas que em outra captura carregaram corretamente.

## Diagnóstico
- Nos prints, as listas de P1/P2 exibem Pokémon corretamente identificados, mas em parte dos itens a imagem é o glifo de arquivo quebrado do Android. O fenômeno é intermitente: sprites de espécies próximas aparecem carregadas no print seguinte sem nova identidade Pokémon.
- O código atual de `dock.html` já possui resolução exata, dados empacotados, fallback numérico `#Dex`, retentativas escalonadas (1,8s, 4,8s e 14,5s) e recuperação ao reabrir a WebView.
- A CSS permite que uma imagem `img.sprite` incompleta apareça **antes** de `onload` com dimensões válidas. Isso exibe o ícone quebrado do WebView em vez do fallback numérico. O caminho gerenciado por JS também ignorava retentar bytes exatos quando o `src` já era igual ao caminho da imagem que falhou.

## Mudanças na LT286
1. `dock.html`: ocultar a imagem de cada resultado enquanto `.spriteStage` não tiver `.loaded` obtido por `load` com `naturalWidth/naturalHeight >= 8`. O espaço reservado e o número `#Dex` continuam visíveis. Nunca mostrar o ícone quebrado do Android durante espera ou falha. Não alterar posição, tamanho ou enquadramento da sprite legítima.
2. Uma imagem já gerenciada que ficou `.failed` pode tentar novamente **a mesma imagem exata** validada por `bundledExactForArt`, mesmo que seu URL seja idêntico, com até duas tentativas e intervalo mínimo de 2,5s. Antes de tentar novamente, limpa `src` e mantém o placeholder; listeners originais recebem novo sucesso sem reload da lista, autenticação ou nova busca.
3. O código continua **fail-closed**: não substitui Shiny, sombra, região, gênero, vestimenta ou forma por arte da espécie base. Nenhum novo domínio, permissão, API ou acesso às coordenadas é adicionado.
4. O mesmo `dock.html` é usado pelas duas Pokébolas separadas; não compartilhar estados entre P1/P2.

## QA
- `node app/tests/lt286-samsung-broken-sprite-recovery.test.js` verifica CSS, reinício do mesmo URL confiável, limite e cooldown, identidade desconhecida sem fallback, além de preservação de P1/P2.
- Rodar Node completo, Android Java, OTA e screenshot/regressão visual P/M/G, beta privado no SHA da PR. Preservar LT105/LT115/LT169/LT243/LT253 e os estados de captura/IV/MT da LT285.
- **Físico pendente**: instalar no Samsung e alternar entre a tela inicial, lista de dez resultados e cards; abrir e fechar a lista P1/P2, atualizar, travar e desbloquear a tela, e conferir que se a sprite ainda não chegou se exibe apenas `#Dex` discreto, nunca o ícone quebrado. Confirmar formas especiais (Shellos, Gengar Halloween, Burmy Sandy) sem fallback incorreto.
- Não confundir correção da representação visual com prova de disponibilidade de todas as sprites na rede. Registrar erros reproduzíveis com identidade exata e origem sem capturar dados privados.

## Publicação
PR + 7 gates aplicáveis e assinatura oficial permanentes foram concluídos na LT286. Homologação real Samsung permanece pendente. Base oficial anterior LT285 `v0.02.85-54489`.

## Publicação oficial e rastreabilidade
- Código: [PR #280](https://github.com/LucianoToscano/PokeSearch/pull/280), squash `474085b5a885ec2b82c1313f3f8e64f3675e7740`; PR head `bd5fab673327ed29cd2fd0015fcad1a9389d49b2`, sete gates obrigatórios `success` (Node QA, LT169 Node completo, LT211 Android, LT173 OTA, LT253 visual P/M/G, LT62 Java, beta privado). Build genérico de APK em PR foi `skipped`.
- [Workflow oficial permanente #42343651759](https://github.com/LucianoToscano/PokeSearch/actions/runs/42343651759): `completed/success`, `preflight=success`, `publish=success`, configuração do assinador permanente, build, verificação do APK e do SHA-256 da release aprovados.
- [Release estável LT286](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.86-54490) `v0.02.86-54490`, publicada em 07/11/2026 05:42:56 UTC (`draft=false`, `prerelease=false`), APK `PokeSearch-v0.02.86-LT.apk`, 33.821.348 bytes, SHA-256 `3e6708f47c42c4bb9c73a6e189a8d82cc59ac5d5364d8d18a15a148cf0b274be`, [download oficial](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.86-54490/PokeSearch-v0.02.86-LT.apk). Solicitação: `e04fb7c25855b3f0dbdee735d42bd174af06681e`.
- **Ainda pendente:** homologação física no Samsung das duas Pokébolas e confirmação de imagens carregadas nas redes do usuário. A correção garante fallback visual controlado e repetição estrita do mesmo asset, mas não prova que todos os arquivos remotos estão disponíveis. Não houve mudança na assinatura, busca, conta ou dados de localização.

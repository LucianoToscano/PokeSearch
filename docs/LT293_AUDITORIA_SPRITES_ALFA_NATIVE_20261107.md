# PokeSearch LT293 — miniaturas com margem transparente e CORS

Data: 07/11/2026. Versão inicial LT292 `0.02.92 / versionCode 54496`.

## Falha física persistente
O Samsung mostrou diversos Charmander com chapéu muito pequenos dentro dos mesmos slots em que Psyduck, Snorlax, Mudkip, Treecko e Pikachu ocupam quase toda a área. As imagens corretas estavam carregadas; o problema é a **área visível** dentro do PNG, não a largura da caixa nem a espécie. A LT290 tentou ler transparência na página ou em uma segunda imagem com CORS, mas em imagens sem CORS o canvas continuava retornando `SecurityError`; sem sprite GO exata empacotada, ficava zoom neutro.

## Correção LT293
- Nova classe Android `VerifiedSpriteGeometry.java`: leitura **apenas** de uma URL HTTPS exata que o DOM do PoGoCoordinates já validou e que está sendo exibida naquela miniatura. Hosts de imagem aprovados via allowlist estrita; sem cookies, header de autenticação, URL nova inventada, captura de coordenadas, conta ou API de busca. Sem redirecionamentos, limite 384 KiB, decodificação até 2048 px, amostra alfa 96×96, HTTPS e porta 443. Cache de 128 URLs, 2 workers e fila limitada.
- Bridge `Native.requestSpriteSilhouette(url, token)`: executa fora da thread de UI e devolve apenas `left/right/top/bottom` por callback com token e URL escapados, descartando callbacks quando WebView foi destruída.
- `sprite_visual_scale.js`: mantém as medições web LT226/LT290 e o fallback local LT289; quando a URL do card é exatamente a imagem mostrada, tenta o decodificador nativo em caso de CORS. Só corrige quando a silhueta medida ocupa menos de 80% do quadro. Mesmo sob correção, os pixels, o traje, a cor, a espécie e a URL da imagem continuam originais. Nenhuma ampliação por espécie.
- `dock.html`: nunca solicita medição de URL não comprovada pelo card. Eventos sem metadados especiais também podem ser medidos, pois o Charmander do print nem sempre traz `costume_id` identificável. Pixel normal bem enquadrado não é aumentado.
- Callback aceita apenas token registrado, mesma URL e imagem ainda conectada. Na ausência da medição, mantém o fallback original, sem cortar bordas cegamente. As duas Pokébolas, presets P/M/G, favoritos, cards e demais filtros ficam inalterados.

## QA
- `node app/tests/lt293-native-provider-alpha.test.js`: simula imagens do PoGoCoordinates com canvas bloqueado, contorno pequeno, contorno normal, URL falsa, retorno antigo, troca de resultado, ausência de Bridge e rejeição de requisição. Valida contrato e segurança Java/JS.
- Regressões de Node completas, Java/Android, OTA, visual P/M/G, beta APK privado no mesmo SHA. Merge e release oficial somente após gates de CI.
- **Homologação Samsung pendente:** testar novos Charmander com chapéu e Pikachu de evento contra Treecko, Snorlax e Torchic, em P/M/G, ambas as Pokébolas e com/sem bordas. A leitura nativa também pode falhar quando a URL exige cookies; não inventar escala quando a imagem exata está indisponível.

## Limites e segurança
Nenhuma imagem é substituída, nenhum segredo de sessão é copiado, e o scanner nativo não aceita HTTP, redirecionamento, host local, IP privado ou URL fora da allowlist. O cálculo não deve ser usado para oferecer uma sprite de forma ou evento distinta.

## Integração e publicação oficial confirmadas
- [PR #287](https://github.com/LucianoToscano/PokeSearch/pull/287) mesclada por squash `407d48d786fa9f37e9e08fa40a713e13c488523e`; head CI `ad7fb2fa7b10958454337f47f2c415c38add1817`. Sete gates `success` no head, incluindo nova regressão de CORS/nativo, Android Java, OTA, visual e beta privado. Build genérico da PR `skipped` pela política.
- [Workflow oficial permanente #42356238773](https://github.com/LucianoToscano/PokeSearch/actions/runs/42356238773) `completed/success`, preflight e publish `success`; `Build signed protected release`, `Validate APK and signer`, `Release to all app users`, `Verify public release and hash` aprovaram.
- [Release estável LT293](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.02.93-54497) `v0.02.93-54497`, publicada **07/11/2026 às 08:40:26 UTC**, `draft=false`, `prerelease=false`. APK `PokeSearch-v0.02.93-LT.apk`, **33.938.306 bytes**, SHA-256 `141a6953e89144620711d4b79ce4cf88f2dfb44385b0e556b9df19259be57711`, [download](https://github.com/LucianoToscano/PokeSearch/releases/download/v0.02.93-54497/PokeSearch-v0.02.93-LT.apk), commit solicitação `ddfd40ab283e92976607c0e6df2f0b9040cfffa7`.
- **Pendência física:** instalar o APK novo, pois o bridge Android não é entregue por simples OTA. Validar a escala dos Charmander da captura contra outros Pokémon no mesmo tamanho, com/sem bordas e nas duas Pokébolas. Se o host da imagem real não for permitido ou exigir cookies, a LT293 mantém fallback e a melhoria pode não aparecer — nesse caso coletar diagnóstico do URL de sprite (sem parâmetros sensíveis) e não aplicar zoom cego.

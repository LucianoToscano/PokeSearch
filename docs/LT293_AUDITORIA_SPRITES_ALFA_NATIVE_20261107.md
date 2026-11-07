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

# PokeSearch — LT152 — Home ilustrada baseada nas imagens do proprietário

Data: 29/10/2026.

## Base e governança
- Branch: `feature/lt152-illustrated-home-reference-20261029`, criada da main LT148.
- PR em rascunho: https://github.com/LucianoToscano/PokeSearch/pull/104
- Sem merge, sem publicação de Release estável, sem atualização para todos e sem alteração do controle de licença/servidor.
- A versão compilada é **0.01.52 (versionCode 54357)** e continua sob controle QA. Conexão com o servidor pode exigir autorização específica para a versão 54357.

## Mudanças de apresentação
- `HomeIllustrated152.java` substitui a antiga composição vertical da Home por um layout inspirado nas imagens de referência: marca e versão reais, sino/engrenagem, perfil circular com nome e status real, dois cartões translúcidos de Pokébola 1/2 com estados e IV, painel de estatísticas Firebase existentes, notícias com Pikachu offline, categorias da comunidade ilustradas por sprites offline verificados, chat e navegação inferior fixa.
- A conta original PoGoCoordinates e controles do treinador são mantidos e abertos através do cartão de perfil; conta Premium continua exigindo verificação do servidor.
- P1 e P2 continuam independentes; não alterar a API, WebView, filtros, posições, cache, alarmes ou serviço. `FirebaseStats.bind` usa valores reais; não usar os números, nomes, datas ou mensagens fictícias das imagens.
- Cabeçalho reduzido a sino (histórico real de novidades) e engrenagem (menu). Tema e apoiar foram mantidos no menu.
- O fundo padrão utiliza a **paisagem clara já incluída no aplicativo**, para funcionar offline. Uma **nova ilustração original** foi gerada separadamente; ela **não está embutida** no APK. O usuário poderá importar PNG/JPG pela opção `Imagem de fundo` no menu. `ACTION_OPEN_DOCUMENT` com URI persistente, bitmap decodificado com limites de memória, restauração da arte padrão.
- Telas Chat, Novidades, Conta e Aparência continuam apoiadas nos fluxos nativos existentes; **não** declarar recriação fiel/pixel a pixel das quatro telas secundárias.

## Evidência QA
- GitHub Actions SUCCESS: https://github.com/LucianoToscano/PokeSearch/actions/runs/40831648949
- Artefato QA: https://github.com/LucianoToscano/PokeSearch/actions/runs/40831648949/artifacts/12878952913
- `SOURCE_COMMIT` APK: `83d977cdf40de1e4ab59bb3ad57da4e3320db6ef`
- APK `PokeSearch-v0.01.52-LT-QA.apk`: **49.423.491 bytes**, SHA-256 `4f77cfbadd97b39a80a42ca6686e757c8f3daba3c10ffac50d90da03954f8ed0`
- ZIP do artefato: **46.575.784 bytes**, SHA-256 `13dd43a5f7f060d9cc466c204e5c7661cacd1a5782dde76ca0bdd69b87d636f9`; CRC OK.
- Package `com.lucianotoscano.pokesearch` e versionCode `54357` verificados; APK Android **v2** assinado com certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- JS estática LT152, JS regressão total, sprites offline, compilação R8 e APK assinado validados no workflow. Teste físico Samsung, visual e login/P1/P2/Community/Premium **ainda pendentes**.
- Preferir o link GitHub Actions acima. Sandbox é secundário e pode apresentar `Library file not found`; isso não é falha de compilação Android.

## Importação do novo fundo externo
1. Obter o arquivo `PokeSearch-LT152-Fundo-Ilustrado.png` no pacote visual da conversa.
2. PokeSearch → engrenagem → **Imagem de fundo** → **Escolher imagem da galeria**.
3. Escolher o PNG no Documentos/Downloads. Para reverter: **Fundo PokeSearch original**.

## QA físico obrigatório antes de publicar
- Samsung, tema claro/escuro, diferentes fontes e resolução, fundo próprio selecionado, leitura do vidro e limites de rolagem.
- P1 100% e P2 0% (incluindo estados personalizáveis), filtros distintos, app em segundo plano, retorno ao overlay, atualização de contadores.
- Login PoGoCoordinates Google/Discord e treinador; Google Premium autorizado, vencido e offline; conta original após fechar dialog.
- Chat real, novidades e navegação inferior, mudança de tema e acessibilidade, fechamento de popups.
- Somente após autorização do proprietário e QA manual poderá haver merge/publicação.

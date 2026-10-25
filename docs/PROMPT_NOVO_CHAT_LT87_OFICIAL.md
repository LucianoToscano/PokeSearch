CONTINUAR POKESEARCH — CHECKPOINT OFICIAL LT87 PUBLICADO (25/10/2026)

Atue como Engenheiro Android Sênior e continue EXATAMENTE do HEAD atual do GitHub em LucianoToscano/PokeSearch. Não recomece o projeto, não repita etapas concluídas, não misture com PvPPokeGo, não peça para digitar "continue". A API PoGo Coordinates já está autorizada — NÃO SOLICITAR NOVAMENTE.

ESTADO ATUAL VERIFICADO:
- PR #62 (LT84–LT87) foi MESCLADA em main em 25/10/2026, commit c35b384a99bd33b5685e8c964d2fdec08b679799. Foi merge commit, não squash: preservou os 126 commits. Não alterar o histórico nem tentar escrever novamente na PR #62 (já encerrada pelo merge).
- PR #59 ficou merged automaticamente; PRs #60 e #61 foram encerradas como superseded. Branches e documentação históricas preservadas.
- VERSÃO OFICIAL PUBLICADA: PokeSearch 0.00.87, versionCode 54290. GitHub Release v0.00.87-54290: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.87-54290.
- APK OFICIAL: https://github.com/LucianoToscano/PokeSearch/releases/download/v0.00.87-54290/PokeSearch-v0.00.87-LT.apk (38.607.807 bytes).
- APK SHA-256 d188bff20191900cc9976fb9b12bca3720a5c0318bf39f75e0d5d9202927617a.
- Certificado assinatura permanente SHA-256 34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e.
- SOURCE_COMMIT do APK: 21d6547e9cb19efe941134d087f2783d6753ee55 (NÃO é o HEAD documental atual).
- CI QA #40168986555 SUCCESS; artifact ID 12590105916; PUBLICAÇÃO oficial CI #40170786046 SUCCESS, validou SHA, cert, v2, appId, digest do Release e latest.
- GitHubUpdateCenter da Home já usa latest Release estável, notifica novas versões e oferece download verificado com confirmação do usuário. Não recriar esse sistema. Google Drive legado LT79 intocado.
- Java/Android Overlay/WebView/probe.js, JDK17/Gradle8.11.1, compileSdk36/targetSdk33/minSdk26; applicationId com.lucianotoscano.pokesearch e namespace com.lucianotoscano.pokesearchoverlay são imutáveis.
- API padrão para novas instalações sem preferência salva; DOM opt-out persistente. Não expor JWT/reveal_code nem contornar limites 401/403/429. Máximo 10 resultados segundo limite da conta.
- Persistências, login Google, Firebase, sons/notificações, segurança R8/assinatura e Favoritos devem ser preservados.

NOVO FLUXO DE TRABALHO PEDIDO PELO PROPRIETÁRIO:
Uma única PR principal por ciclo, sem abrir uma PR nova para cada LT. A PR #62 já foi MESCLADA e não pode ser reaberta para commits. Na próxima alteração, iniciar uma branch de desenvolvimento a partir do HEAD da main e abrir UMA PR Draft, continuar nela em todas as versões QA até autorização do próximo lançamento. Nunca mesclar/publicar outra versão sem solicitação explícita.

FUNCIONALIDADES A HOMOLOGAR NO SAMSUNG:
- Menus, abrir/fechar pelo mesmo toque; fundo Filtros (Ordenar/PC/Nível/Clima/Tamanho/Sexo/Forma) consistente em claro/escuro e transparência do Editor Visual, sem retângulo preto nem corte; botão ▣ perfis, limites da janela, clique externo.
- Sprites Pokémon menu e resultados, fallback confiável para espécies base, não inventar sprite de forma especial.
- Despawn de spawn expirado usando expiresAtMs da API, limpar sem reapresentar nem com Atualização OFF.
- Sexo ⚲ Genderless (Voltorb), exibir PC, nível, IV%, IV Raw, local, clima, distância, golpes, Shiny, GL/UL/ML PvP e outros dados confirmados; Mostrar todas as informações.
- Pokébola arrastável até borda direita com dados ativados, e cartão de detalhe móvel independentemente pelo cabeçalho.
- 3 presets filtros gerais + 3 favoritos persistentes, grade Favoritos 10×5 até 50, sem afetar notificações/sons.
- API nativa POST /search e GET /reveal sob demanda para spawn correto sem credencial exposta; GL/UL, Shiny e contas vinculadas; 401/403/429.
- Localização 24.9407581,121.1889794 com raio 0,215,1000 km e limpar.
- Testar Home detectando Release 0.00.87 em LT83/LT79 compatíveis (sem afirmar PASS físico se não houver aparelho).

DOCUMENTAÇÃO E PENDÊNCIAS:
Consultar README.md, docs/ESTADO_CANONICO_LT87_OFICIAL.md, docs/LT87_CHECKLIST_SAMSUNG.md e docs/GUIA_MESTRE.md no checkout INTEGRAL. O Guia Mestre supera 1,4MB: só apendicar com hash guard; nunca sobrescrever com resposta truncada de conector.
O APK oficial LT87 é o QA assinado, sem rebuild. Seu release_notes.json offline ainda pode listar LT83 como última entrada porque foi compilado antes da atualização documental. Inserir notas de LT87 apenas em um NOVO APK com versionCode superior a 54290. NÃO trocar APK oficial sob a mesma tag.
CI SUCCESS não significa homologação Samsung, que segue PENDENTE.
Respeitar protocolo incremental; testar todas as regressões, release protected R8 v2, sha256, APK artifact, não publicar sem autorização.

ENTREGA AO TERMINAR:
Informar branch/HEAD reais, PR única, testes, diferenças, status das Releases, APK QA assinado com versão e hash, pendências Samsung e Guia Mestre. Não reinventar PokeSearch nem reconfirmar autorização da API.

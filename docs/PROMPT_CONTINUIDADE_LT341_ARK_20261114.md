# PokeSearch — LT341 / ARK — Continuidade e homologação Samsung (14/11/2026)

## Atualização de estado pós-merge da LT341
- **LT340 aplicada à main:** PR #358, squash `0ab24070a48bd31e6fd2f216855515e4c7de2d20`.
- **LT341 aplicada à main:** PR #359, squash `9d4b6a6705b894a2621d18dd846ecaf727119c47`.
- Arte original do Drive **já foi adicionada** pelo PR #359; não duplicar arquivos por importação paralela. Pokébola ON/OFF, três badges de login e lixeiras preta/branca no diretório `drawable-nodpi` com bytes preservados. A branch experimental `feature/lt341-home-login-ranks-edu-candy-ark-20261114` contém somente uma cópia paralela das mesmas cinco artes; não fazer merge para não duplicar recursos.
- **Pedido de publicação em andamento:** branch `release/lt341-home-pgs-login-edu-20261114`, `release/official-request.json` para 0.03.39 / versionCode 54546 / label 51343, predecessor 0.03.38/54545. Só declarar publicado após checks do pedido, merge e workflow `pokesearch-official-release.yml` success, tag oficial, APK assinado e SHA-256.
- PR #359 passou QA Core/Node, LT169, LT62 Java, LT173 OTA, PGS Android e Secure Beta. **Não equivale ao teste físico**. A antiga QA LT146 que falhou em `AssertionError` ao reconstruir CDN de sprites 2050/2050 é uma falha de QA a observar, sem dispensar o preflight de release.
- **Próximo foco em Samsung:** tela do feed do PGSharp *com Lucario visível*, seleção do ícone, alerta de confirmação do toque e status em tempo real, navegação/teleporte. Validar P1/P2/Doce Raro, Rank Geral e menu compactos em tamanhos variados. No login, testar Google e Discord oficialmente em ambas as contas, nome, avatar e fechamento automático após confirmação. Não expor dados pessoais na issue pública.


## Estado de entrada validado
- Repositório oficial: `LucianoToscano/PokeSearch`.
- Última publicação confirmada ANTES destas alterações: **LT339, 0.03.38, versionCode 54545**, release `v0.03.38-54545`.
- Código-base atual: commit `0ab24070a48bd31e6fd2f216855515e4c7de2d20` da `main`, PR #358 (LT340 — PGS) integrada e ainda não representada por APK oficial no início desta etapa. Não iniciar da LT339 nem fazer downgrade.
- Desenvolvimento incremental: `feature/lt341-home-login-edu-ranks-candy-20261114`. A autorização ARK permite corrigir, revisar, testar, fazer merge e publicar quando gates verdes; assinatura permanente nunca é alterada.

## Falha em campo — PGS
Capturas do Samsung da LT339 mostram a Home PokeSearch e o launcher, não o feed de ícones dentro do PGSharp. **Não são prova de falha do reconhecimento no feed, nem de gesto/teleporte funcionando.**
A LT340 na `main` corrige detecção de janela do jogo ignorando eventos do próprio PokeSearch, fluxo de cadastro de imagem por múltiplas escalas (24/32/44px), confirmação de toque com `dispatchGesture`, estado ON/OFF da bolha, ações de lupa e ordem determinística por prioridade. O usuário relata ainda nenhum toque efetivo: preciso confirmar no Samsung, com PGSharp em primeiro plano, captura do ícone e alvo real.
Na LT341, mensagem legível quando armado sem jogo e aviso não repetitivo após seis ciclos sem ícone reconhecido. Se modelo não existe, informar erro e ensinar captura correta, não simular sucesso.

## Design PGS e arte original
- Home: `busca_pokemon_on.webp`/`busca_pokemon_off.png` alternam estado; toque ativa/desativa a bolha PGS sem abrir janela principal redundante.
- Bolha: `busca_pokemon_overlay_on.webp`/`busca_pokemon_overlay_off.webp`, geometria padrão P1/P2: toque 44dp, arte 21dp, slot 35×30dp. Branco = SEM efeito / imagem original; verde pulsante somente enquanto mapa/Pokémon carregam; vermelho pulsante em erro.
- Notificações PGS: painel compacto e botões equivalentes a P1/P2, mas sem estrela; três categorias independentes (Novos, Buscas, Shiny).
- Lupa: miniaturas dos modelos por espécie, ações para excluir/recadastrar/amostras adicionais, prioridade por espécie e posição; sem sorteio.
- Gestos são opt-in por Acessibilidade. Não alegar detecção de Shiny 3D; só eventos positivos do próprio alvo explicitamente identificados pelo PGSharp.

## Alterações LT341 desta rodada
- Do Drive original sem recompressão: `home_pokeball_on.webp`, `home_pokeball_off.webp`, `login_modo_claro.webp`, `login_modo_escuro.webp`, `login_modo_semlogin.webp`, `lixeira_branca.png` (arquivo `Lixeira_Branca.png`) e `lixeira_preta.png` (Drive `lixeira_preto.png`). Os PNGs antigos de Pokébola estão preservados em `app/src/main/assets/ui-originals/*_previous.png` — **não** perdidos.
- Home: indicadores de login 12dp sobre as duas Pokébolas, toque com alvo acessível abre popover só com “Conta 1: … / Conta 2: …”, respeitando preferência de privacidade. Sumiram os rótulos largos P1/P2. Logomarca na própria proporção 3:1 em linha separada do relógio/botões; coração e menu sem fundo; Compartilhar preto em claro e branco em escuro.
- Login PoGoCoordinates: verificação da sessão independente do vínculo de treinador, para não ficar aguardando 16 tentativas e manter janela aberta. Leitura pública de nome por proximidade de “Member since”; foto pública visível em perfil via Google/Discord CDN HTTPS estritamente allowlisted, sem ler tokens/cookies/API privada nem copiar sessões entre contas. Se perfil falhar após retries, login autenticado é persistido e janela termina com aviso, sem atribuir treinador falso.
- Rank Geral: número #Dex pequeno ao lado do nome, único #Rank Geral à direita.
- Doce Raro: X da barra do menu chama `Native.stopCandyOverlay()`, encerrando serviço com controle explícito em vez de apenas ocultar a barra.
- Edu: barra `◀️ ⏯️ 🎦 ▶️ 👬 📐 ❌ Auto/#`, escolhas de movimentos agrupados (frente/direita/esquerda/arrastando/teleporte/Pokébola/celular), reprodução com velocidades do atlas, setas por quadro ou grupo, comparação com #42, linhas-guia, retorno ao automático e fechamento sem recortar/alterar as 68 sprites.
- Lixeiras branca/preta originais aplicadas aos modelos do PGS e aos filtros salvos do dock via `assets/ui-icons/` com tema. Não substituir por caracteres ×.
- Contratos Node LT341 + atualização dos contratos históricos LT170, LT327, LT335, LT339. Preservar testes e proteções.

## Ordem de QA obrigatório
1. Conferir no GitHub `main`, versão oficial, branches, PRs e pipelines e conferir `docs/GUIA_MESTRE.md`.
2. Rodar testes Node completos e específicos, Java, build Gradle Android, AAPT/R8, verificação de recursos, assinaturas e canais de atualização.
3. Se falhar: corrigir em branch e repetir o gate; **nunca** fundir com CI falhando. Não manipular certificados ou chaves.
4. Fazer squash merge aprovado, preparar versão monotônica superior ao último release (`0.03.39 / versionCode 54546`, **se** ainda disponível), workflow de assinatura permanente, validar release estável, APK e SHA-256 e adicionar registro ao Guia Mestre.
5. Manter [issue #350](https://github.com/LucianoToscano/PokeSearch/issues/350) aberta até homologação física no Samsung. Não afirmar instalação sem confirmação do usuário.

## Testes físicos necessários, sem alegar resultado antecipado
- Logar Google/Discord no PoGoCoordinates pelo WebView oficial; confirmar fechamento e nome/foto reais, sem interferência entre Contas 1/2.
- No PGSharp real, selecionar e gravar exatamente o ícone do feed de Lucario; conferir miniatura, detectar duas capturas, observar toque efetivo e teleporte. Se a tela capturada for launcher ou Home, o detector deve recusar (não há sprites do feed).
- Confirmar tempos 60 s/2 s e tratamento de mapa vazio. Uma imagem de PokéStop não prova conclusão de todos os spawns.
- Verificar X do Doce Raro, Rank Geral, lixeiras nos dois temas, logo e mini indicadores, Edu quadro e grupo no Samsung.
- Registrar prints e logs sanitizados, sem senhas, JWT, cookies ou IDs pessoais.

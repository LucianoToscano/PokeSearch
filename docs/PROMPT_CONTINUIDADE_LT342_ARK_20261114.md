# CONTINUAR POKESEARCH — LT342 / ARK (14/11/2026)

Continuar o desenvolvimento Android do repositório `LucianoToscano/PokeSearch`, sempre em português do Brasil. **Não começar do zero, não fazer downgrade, não apagar funções/contas/68 sprites/som/imagens/assinatura permanente.**

## 1. Leitura obrigatória, nesta ordem
1. `LEIA_PRIMEIRO_PROMPT_OUTRAS_IAS.md`
2. `docs/GUIA_MESTRE.md`
3. Este arquivo
4. `AGENTS.md`
5. Estado atual de `main`, Releases, workflows, PRs e issue #350

## 2. Última release oficial verificável
- **LT342 — 0.03.40**, `versionCode=54547`, `label=51344`
- Release: https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.40-54547
- APK: `PokeSearch-v0.03.40-LT.apk`, tamanho **55.508.559 bytes**
- SHA-256: `9f34021f602ac0db071a32e35842f886a10b9912185d26f0d3b4c489119d9311`
- Workflow de assinatura/publicação oficial: https://github.com/LucianoToscano/PokeSearch/actions/runs/43610330986 — **SUCCESS**
- Fonte publicada: `f14c4c202579b5215c5d28cb040ecbb14169a925`
- PR funcional #362 squash `0e383e8891b104f7b6ed9ad74960c9e4920a91dc`; PR release #363 squash `f14c4c202579b5215c5d28cb040ecbb14169a925`.
- Verificar novamente o status GitHub antes de criar outra versão. A instalação no Android **não é confirmada** apenas pelo canal OTA.

## 3. Escopo LT342 publicado
- Home: badges Login_Modo_Escuro no tema claro e Login_Modo_Claro no escuro, Login_Modo_SemLogin sem sessão; badges 12dp posicionados acima dos ícones P1/P2 com ~10dp de afastamento. P1/P2 e atalhos permanecem na mesma altura. Wordmark PokeSearch restaurado para 118dp em proporção 3:1. Coração Apoiar e Menu sem fundos. Compartilhar usa `home_share_icon.xml` com contraste integral branco/escuro por tema.
- **Mapeamento solicitado e implementado:** Home OFF `busca_pokemon_overlay_off.webp` / Home ON `busca_pokemon_overlay_on.webp`; bolha OFF `busca_pokemon_off.webp` / bolha ON `busca_pokemon_on.webp`. Quatro arquivos do Drive preservados byte a byte, com a antiga fonte PNG transparente em `assets/ui-originals/busca_pokemon_off_previous_alpha.png`. O arquivo `overlay_on` anteriormente continha bytes errados e foi substituído. Bolha 44dp tocável, slot 35×30dp, arte 21dp; centro branco = natural, verde = carregando, vermelho = falha.
- Menu da lupa PGS compactado para 286×390dp com lista rolável; barra escondida enquanto submenu aberto e restaurada ao fechar. Alertas compactos e independentes P1/P2 preservados.
- PoGoCoordinates: extrator `profile_summary.js` agora tenta obter o **nome público visível** no cartão oficial com `Member since` mesmo após mudanças leves de DOM React. Até 4 releituras após autenticação; nunca ler cookies, tokens ou usar nome de treinador como identidade do site. A captura real Google/Discord ainda não foi confirmada no Samsung.
- Edu: X em `EduSpriteInspector` executa `listener.closeAssistant()`, serviço `RaidDayAssistantOverlayService.stopSelf()`; `onDestroy()` remove menu, bolha e comparadores. Outros controles e 68 sprites preservados.
- Contratos LT339/LT341 revisados e `app/tests/lt342-home-pgs-login-edu-contract.test.js` adicionado; CI Node, Java, OTA, PGS Android e beta verde no HEAD funcional.

## 4. PRIORIDADE — homologação física (issue #350 continua aberta)
- Testar no Samsung **com a LT342 instalada mediante consentimento Android**, usando feed verdadeiro do PGSharp e ícone de Lucario. Registrar sequência real de **detector → gesto Android → teleporte no jogo**: são três etapas diferentes; o CI não comprova as três.
- Verificar os estados ON/OFF da Home e bolha em claro/escuro, cor/naturalidade do botão central, proporções de menus, logo, badge 10dp acima, alinhamento de todos os atalhos, Compartilhar branco no tema escuro. **Atenção:** `Busca_Pokemon_Overlay_On.webp` fornecido no Drive apresenta área preta opaca no arquivo RGB. A arte foi preservada por solicitação do usuário; verificar em aparelhos com tema claro se o fundo aparece como um quadrado indesejado. Se aparecer, corrigir transparência preservando e arquivando a fonte original, com QA de alfa e geometria, sem recriar visualmente.
- Testar autenticação oficial Google/Discord **em ambas as contas**; validar nome/foto, fechamento do diálogo e cookies/sessões isoladas. Não inferir nome por e-mail, treinador ou API não documentada. Se falhar, recolher captura anonimizada do perfil carregado e diagnosticar elementos DOM.
- Verificar X do inspetor Edu fecha serviço inteiro (não apenas toolbar) e restabelece possibilidade de abrir.
- Não afirmar teleporte ou Shiny da espécie se PGSharp não o confirmou. Seguir issue #350.

## 5. ARK
ARK autoriza correções, melhorias, auditorias, testes, merge e publicação; não remove controles de segurança, assinatura, R8, validação de APK/ZIP/SHA, nem exige reinstalação destrutiva. Trabalhar sobre a `main` atual, preservar todas funcionalidades, usar PR protegida e versionCode monotônico. Somente publicar outra versão após correção comprovada e gates verdes. Ao terminar, atualizar o Guia Mestre, notas e criar novo prompt.

## 6. Recomendações de qualidade
- Deduplicar componentes de menu compartilhados com P1/P2/Doce Raro ao invés de reproduzir CSS e tamanhos divergentes. Fazer comparações por medições de dp e capturas Samsung nos dois temas.
- Para o PGS, adicionar diagnósticos de estados observáveis (modelo selecionado, match, coordenada relativa de toque, confirmação de gesto, resultado real PGSharp) sem capturar coordenadas pessoais ou tokens. Diferenciar `TOQUE` de teleporte concluído.
- Testes visuais de regressão com imagens dos estados ON/OFF e overlays, especificamente alfa de borda, centro branco natural e fundo de imagens.
- Captura de perfil estritamente somente DOM visível do site oficial: evite inferência, OAuth privado e logs de informações pessoais.

**Regra final:** não prometer homologação física, entrega futura ou instalação no celular sem observação real; registrar qualquer pendência honestamente.

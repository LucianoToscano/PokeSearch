# PokeSearch — GUIA MESTRE ATUAL (RESUMIDO)
> **PONTO DE ENTRADA OBRIGATÓRIO • 25/10/2026**  
> Este documento substitui o *uso diário* do antigo guia de ~1,46 MB. **O histórico integral não foi excluído.** Ele está arquivado, byte por byte, em **[GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md](GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md)**. Consulte o backup apenas para tirar dúvidas históricas, conferir requisitos antigos, versões, decisões, evidências e regressões.
>
> **REGRA DE PRIORIDADE:** verificar sempre o HEAD e as PRs reais. Estado recente comprovado por commits/CI prevalece sobre instruções de versões antigas dentro do backup. *Nenhuma numeração QA comprova a conclusão de uma etapa de roadmap ou teste Samsung.*

## 1. Checkpoint canônico — NÃO REINICIAR
- **Repositório:** [LucianoToscano/PokeSearch](https://github.com/LucianoToscano/PokeSearch).
- **Última release oficial confirmada:** **LT87, v0.00.87 / versionCode 54290**, [release v0.00.87-54290](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.87-54290). **main oficial verificada em 25/10/2026:** `83cf9a693a3672276e01d04e38ed14dce0071cb8`. PR #62 mesclada com histórico LT84–LT87; PR #59 mesclada, #60 e #61 encerradas como substituídas.
- **Linha de desenvolvimento preservada:** [PR #63](https://github.com/LucianoToscano/PokeSearch/pull/63), Draft, branch `feature/lt88-lt93-evolution-20261025`, último HEAD confirmado para a origem desta reorganização: `352a3bdc048d4b6f7337209ccd1d77939b8ae2bf`. **Não voltar à LT83 ou à LT86.**
- **Scrapbook / Mural da Comunidade:** [PR #64](https://github.com/LucianoToscano/PokeSearch/pull/64), Draft **baseada na PR #63**, branch `feature/pokesearch-community-scrapbook-stage1-20261025`. Estado imediatamente anterior à reorganização documental: `40440b1f510f9c2b6b1977985e3d550debaa0927`. Alterações deste guia ficam nessa branch, **sem merge e sem Release**.
- **Importante:** o usuário informou ter realizado etapas adicionais, mas **o último estado GitHub tecnicamente comprovado do Mural contém apenas a Etapa 1 demonstrativa**. Etapas Firebase 2–5 não devem ser declaradas concluídas/online sem novos commits, regras, evidências e homologação.
- Confirmar periodicamente HEAD, PR, testes e Release antes de agir. SHA de **fonte de APK** pode ser diferente de SHA documental posterior.

## 2. Identidade e arquitetura INTOCÁVEIS
- `applicationId = com.lucianotoscano.pokesearch`; `namespace = com.lucianotoscano.pokesearchoverlay`.
- **Android Java / Overlay nativa + WebView**, `probe.js` e DOM do PoGoCoordinates; API REST direta **já autorizada** com fallback DOM. Não solicitar novamente autorização nem misturar `PvPPokeGo`.
- **JDK 17; Gradle 8.11.1; compileSdk 36; targetSdk 33; minSdk 26.**
- Site de referência: `https://pogocoordinates.com/search`. Não utilizar GPS físico; coordenadas são somente filtro voluntário da pesquisa.
- Preservar login e sessão no site, FirebaseStats, Editor Visual, temas, notificações, sons, preferências, histórico, favoritos, alertas, Home, atualização de app, privacidade, cache e integridade.
- **Máximo 10 resultados**, respeitar autenticação/quotas do servidor, nunca driblar **401/403/429**, nunca expor JWT, cookies, `reveal_code`, credenciais ou chave de assinatura.
- Versões release: **R8/ProGuard**, não depurável, assinatura Android v2 com certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. VersionCode sempre estritamente crescente para APK novo; nunca sobrescrever binário da mesma versão/tag.

## 3. Ponto funcional atual — Overlay, Pokémon e resultados
- Barra flutuante, menus e Pokébola de resultados permanecem independentes da Home; cliques atrás de painéis não devem ser bloqueados sem necessidade. Botão de atualização giratório, menus compactos e resultado arrastável.
- Filtros / Modos: **GL/UL/PvP, IV A/D/S, IV%, Shiny, PC, nível 1–50, Sexo incluindo ⚲ Genderless, Forma, Tamanho, Clima, Ordenação**, Pokémon e opções oficiais. Nunca inventar IV, rank ou fonte de dado.
- Pesquisa API/DOM conforme preferências sem violar autenticação. Fallback não pode contornar limites. Metadados de card (IV/PvP/distância/Despawn) pertencem somente ao mesmo encontro confirmado; limpar expirados mesmo com timer oculto; nunca ressuscitar resultados vencidos.
- Sprites: `VerifiedSpriteCache.java` e cache WebView para URLs **exatas verificadas** PokeAPI base/shiny, mirror CDN somente para origem legítima; shiny separado, limite PNG/dimensões/cache. Forma especial/traje não comprovado fica em placeholder neutro, nunca substituído por outra forma.
- Favoritos: até **50**, grade compacta, **três perfis em estrelas** com **autosave do perfil ativo**, troca isolada entre slots; segurar estrela solicita confirmação para limpar apenas aquele perfil. Preservar listas históricas e notificações.
- Editor Visual: transparência base dos menus em **50%** inicialmente, blur ajustável **0–16 px**, temas claro/escuro, fundos e contraste efetivamente legíveis no Android (blur de outra janela pode falhar). Preservar personalizações anteriores.

## 4. Último layout confirmado em código — LT88 R8
Este checkpoint **substitui instruções visuais antigas** do arquivo histórico:
- **A própria palavra “Filtro” é o botão**. Removido símbolo redondo `⊙`. Popup contém **Padrão / Filtro 1 [disquete SVG fino branco] [lixeira SVG fina branca] / Filtro 2 [disquete] [lixeira]**, sem título ou descrição inferior. Padrão zera somente filtros gerais, **não** Shiny nem localização; salvar/aplicar/excluir respeitam o slot e popup fecha ao aplicar. **Dados do antigo terceiro perfil persistem, mas o botão foi ocultado** — não apagar.
- **Localização:** painel compacto em três linhas: título, campo de coordenadas, linha com Colar/Copiar, raio+“km”, slider, Aplicar/Limpar. Raio permitido **0–1000 km**; par de teste `24.9407581,121.1889794` com 0, 215 e 1000 km. Aceitar texto/Gboard/links Maps válidos, mas erro de foco no clipboard Android requer QA físico; sem favoritos de locais antigos ou “?” visíveis, sem apagar valores legados.
- **Som de notificações:** submenu flutuante com **Padrão + 36 áudios personalizados**; tocar prévia marca opção `✓` com contraste, sem gravar até **“✓ Usar áudio”**. Ao abrir, realçar áudio salvo (incluindo “Quem é esse Pokémon? · BR” como padrão de Favoritos não personalizado). Não navegar para a Home.
- **Pix:** abrir no painel flutuante usando temas, alpha e blur, sem trocar Home. 
- Fonte detalhada: [R6 Favoritos/sprites](LT88_FAVORITOS_SPRITES_SAMSUNG_R6_QA.md), [R7 Drive/compartilhamento](LT88_DRIVE_SHARE_R7_QA.md), [R8 filtros/som/localização](LT88_R8_FILTROS_AUDIO_LOCALIZACAO_QA.md).
- **Último APK de QA R8 confirmado:** `PokeSearch-v0.00.95-LT-Compact-Filters-Location-Audio-QA.apk` / `versionCode 54298` (**não** “LT95 concluída”), SOURCE_COMMIT `352a3bdc048d4b6f7337209ccd1d77939b8ae2bf`; SHA-256 `0cd3ce47841950fe7946ae1e50241a47273b14a771b2ea72ba6b9a0b8c563782`; [CI assinado #40187862412 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40187862412). QA protegido ≠ Release oficial ou homologação física.

## 5. Home, atualização e distribuição
- Home: login PoGoCoordinates, perfil treinadora/treinador, controles de tema, overlay, Apoiar, menu, contador FirebaseStats, painel de atualizações, compartilhar app e rodapé de versão real (`BuildConfig.VERSION_NAME`). Preservar papel de parede sem deformação.
- **GitHubUpdateCenter** monitora **Releases oficiais estáveis** com hash e assinatura; o usuário confirma instalação. O `UpdateCenter` legado e ponte Drive LT79 são independentes. Não publicar release ou mesclar PR automaticamente.
- Botão **“Compartilhar app”** usa Android Sharesheet e link **estável de arquivo Drive**, sem compartilhar endereço GitHub:
  - [Pasta PokeSearch_App no Drive](https://drive.google.com/drive/folders/1fVw93qUDE0YWp6tlJZaNjRmymyhEAUbR).
  - [APK espelhado no Drive](https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view), ID **`1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P`**.
  - Em 25/10, arquivo Drive foi atualizado *in place* ao binário **R8 0.00.95 QA**, SHA acima verificado após redownload; acesso anônimo por terceiros ainda exige confirmação física. Em atualização **expressamente autorizada**, validar pacote, versão, certificado e SHA, e substituir **o mesmo ID** de arquivo para manter o link. **Não confundir APK QA compartilhado com Release oficial.**

## 6. Mural da Comunidade PokeSearch (Scrapbook / PR #64)
- **Etapa 1 verificada por código/CI:** Home tem preview de três postagens locais fictícias, avatars textuais, autor, categoria, texto, horário, curtidas/respostas e “Ver todos”, recolher/expandir, temas claro/escuro, scroll quando demo ligada; tela própria `CommunityScrapbookActivity` fora do overlay, com **um único feed** e filtros **💬 Recados | 💡 Sugestões | 🐞 Bugs | 🎓 Dicas**.
- **Limitação obrigatória:** **não é um mural online.** Posts e estatísticas são exemplos; `Escrever/curtir/responder/denunciar/excluir` desabilitados; editor restrito a 300 caracteres na UI de demonstração. Nenhuma gravação Firebase no mural.
- **Feature gate:** `BuildConfig.DEBUG && prefs.communityScrapbookStage1Preview` (false por padrão); release não mostra mural mesmo que a preferência antiga esteja ativa. Activity `exported=false`; não há endpoint público.
- `FirebaseStats.java` existe para `stats/installations`, `stats/online` e presença com Firebase Auth anônimo; **não modificar** para criar o mural. Integração futura: `scrapbook/users`, `posts`, `replies`, `likes`, `reports`, `config`, regras `deny-by-default`, autoria por UID, validação de textos, App Check, rate limit **confiável no servidor**, moderação, privacidade/LGPD e orçamento. Não implementar / ligar banco público sem inspeção de Security Rules e autorização explícita.
- **QA Etapa 1:** [Node+Java #40189621731 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40189621731), 7 testes específicos PASS, `compileDebugJavaWithJavac` PASS sem APK; exceção histórica `lt74-local-update-preview.test.js` já excluída pelo CI LT88 R8. [Guia append anterior #40189422785 SUCCESS](https://github.com/LucianoToscano/PokeSearch/actions/runs/40189422785).
- Fonte detalhada: [POKESEARCH_SCRAPBOOK_ETAPA1.md](POKESEARCH_SCRAPBOOK_ETAPA1.md). **Etapas 2–5 (Firebase real, interações, moderação, homologação) exigem evidências novas**. Mesmo se houver declaração de progresso em conversa, não marcar concluído sem encontrar na branch correta.

## 7. QA, pendências e critérios de aceite
- **CI aprovado não é PASS Samsung.** Para cada APK candidato: Node + Gradle Java/unit + R8 + `assembleRelease` + `apksigner` v2 + certificado + SHA256SUMS + SOURCE_COMMIT + código/versão. A entrega do arquivo é separada de merge e da publicação oficial.
- **Samsung pendente de evidência** (build exata): favoritos 1/2/3 e autosave, fundo/alpha/blur nos menus, tela pequena, Gboard clipboard/Colar e links Maps, coords e raios, menu dos sons com seleção, Pix, sprites base/shiny/formas especiais, temporizador/remoção de Despawn, IV/GL/UL/PvP/distância por encounter, interação da Pokébola e painéis.
- **Scrapbook pendente de aceite visual** em debug: temas, scroll, preview expandido/recolhido, menu, filtros, back, resolução Samsung, nenhum input real e ausência em release; **Firebase de produção não foi habilitado pela Etapa 1**.
- Lista histórica útil: [LT87 Samsung](LT87_CHECKLIST_SAMSUNG.md), [R6 Samsung](LT88_FAVORITOS_SPRITES_SAMSUNG_R6_QA.md), [R8 Samsung](LT88_R8_FILTROS_AUDIO_LOCALIZACAO_QA.md), [Scrapbook Etapa 1](POKESEARCH_SCRAPBOOK_ETAPA1.md).
- Não inventar passes Samsung, screenshots, links de APK/Drive, hashes, credenciais ou conclusão de roadmap. Respeitar proteção do app e rede.

## 8. Como recuperar informações do HISTÓRICO ORIGINAL
1. **Primeiro ler ESTE guia curto** e consultar o HEAD real das branches/PRs.
2. Para dúvida específica antiga (ícone, regra, commit, correção, versão, implementação), consultar **[backup completo](GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md)**; pesquisar **palavra-chave, LT ou seção específica**. Não despejar 1,46 MB inteiro em contexto a cada execução.
3. Para um assunto atual, usar documento especializado. Prioridade: evidência verificável (código, CI e build) **mais recente** > checkpoint resumido atualizado > documentação específica > histórico antigo. Divergência deve ser registrada, não escondida.
4. **Proveniência imutável do backup:** conteúdo é exatamente o antigo `docs/GUIA_MESTRE.md` no commit `40440b1f510f9c2b6b1977985e3d550debaa0927`, tamanho **1.459.814 bytes**, **Git blob SHA `466a92323dc319720b4ced50caf413a1a2bbef04`**, **SHA-256 dos bytes `f02d6396a3ae6a4e833f78be8aedbe0b8d0b40254f31203644f3040a30e2a861`**. O novo caminho aponta para **o mesmo objeto Git**, sem recodificação, truncamento ou alteração de bytes. O GitHub histórico de commits também conserva versões anteriores.
5. **Regra nova de manutenção:** manter `docs/GUIA_MESTRE.md` **resumido e atualizado por edição pontual** com HEAD/versão/testes/decisões; criar detalhes de cada etapa em documentos próprios; **não voltar ao append indiscriminado de 1,46 MB**, não modificar o backup imutável, não substituir guia com retorno truncado de conector. Validar backup por `git hash-object docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md` = SHA acima.
6. **GitHub Actions antigos de append** foram feitos para guia gigante; no ciclo atual precisam funcionar como auditoria somente leitura, sem tentar acrescentar texto ao arquivo de backup ou exigir guia resumido com mais de 1,4 MB.

## 9. Protocolo obrigatório do próximo chat
Ler primeiro este resumo, verificar `main`, PR #63 e PR #64 e últimas Actions, preservar todas as mudanças anteriores e escolher a branch correta antes de alterar arquivos. Etapas pequenas, reversíveis e auditáveis, com testes; não apagar preferências, não mexer na assinatura, não ativar Firebase real por inferência. Registrar mudanças neste guia **em poucas linhas** e encaminhar documentos aprofundados para arquivos separados. **Nunca declarar Release, merge, aprovação Samsung ou mural online sem prova real.**

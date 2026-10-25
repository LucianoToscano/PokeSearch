# ESTADO CANÔNICO — LT87 OFICIAL (25/10/2026)

## Publicação realmente verificada
- Repositório: `LucianoToscano/PokeSearch`; applicationId `com.lucianotoscano.pokesearch`, namespace `com.lucianotoscano.pokesearchoverlay`.
- Versão oficial estável: `0.00.87`, versionCode `54290`. Release [v0.00.87-54290](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.87-54290). Publicação em 25/10/2026, não Draft/não Prerelease, marcada latest.
- APK público `PokeSearch-v0.00.87-LT.apk`, 38.607.807 bytes; SHA-256 `d188bff20191900cc9976fb9b12bca3720a5c0318bf39f75e0d5d9202927617a`.
- Certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; APK v2, release R8, não depurável.
- APK SOURCE_COMMIT `21d6547e9cb19efe941134d087f2783d6753ee55` validado pelo QA. CI QA #40168986555 SUCCESS, artifact #12590105916. Pipeline oficial [#40170786046](https://github.com/LucianoToscano/PokeSearch/actions/runs/40170786046) SUCCESS: verificou SHA, certificado, pacote, versão e digest da asset de GitHub Releases.
- Fonte de atualização para Home: `GitHubUpdateCenter`, Release estável/latest + nome esperado `PokeSearch-v0.00.87-LT.apk` + digest `sha256:`. A Home já possui check periódico e manual, oferece download e confirmação de instalação no Android; não necessita app reset ou GPS físico.
- Google Drive ponte LT79 não modificado. Versão pública LT83 substituída por LT87.

## Consolidação de PRs
- PR #62: mesclada em main com **merge commit** `c35b384a99bd33b5685e8c964d2fdec08b679799`, mantendo os 126 commits de LT84–LT87 em vez de squash.
- PR #59: fechada/merged pelo GitHub como parte do histórico.
- PRs #60 e #61: encerradas como **substituídas**, não deletadas, sem perder branches e commits.
- PR #62 já está mesclada, portanto não pode receber novas alterações. Para o próximo ciclo, abrir **somente uma** PR Draft baseada em main e continuar nela até a próxima publicação, em vez de criar PR a cada LT.

## Funcionalidade preservada
API direta nativa autorizada padrão para instalações sem configuração anterior, opt-out DOM persistente, autenticação Google/JWT exclusivamente na WebView, limites do servidor, Get coords sob demanda, 10 spawns máximo, Formas e níveis 1–50, filtros 3 slots, Favoritos 3 slots, ⚲ Genderless, Shiny, GL/UL/PvP com dados verificados, Despawn `expiresAtMs`, limpeza de expirados, sprites PokeAPI somente para identidade confiável, transparências e fundos nos submenus Filtros, editor de informações, cards arrastáveis e assinaturas/prefs existentes.

## Limites e pendências
1. **Samsung físico ainda não homologado** para LT84–LT87: fundos claro/escuro/transparência, sprites, Get coords autenticado, GL/UL, Shiny, perfis 3+3, drag da Pokébola/card, detalhes PvP, Despawn, Localização 24.9407581,121.1889794 com raios 0/215/1000.
2. Notas offline `release_notes.json` dentro do APK LT87 foram embaladas antes da promoção oficial, portanto a última entrada visível no histórico offline pode continuar LT83. **Não substituir binário público sob mesmo versionCode**; registrar novas notas num build futuro maior.
3. Guia Mestre `docs/GUIA_MESTRE.md` >1,4MB; alterar somente via append no checkout integral com hash do prefixo, nunca com conteúdo truncado do conector.
4. GitHub Releases público não torna as respostas nem a API dependentes do GitHub; não expor JWT, reveal_code ou credenciais em log/provas.

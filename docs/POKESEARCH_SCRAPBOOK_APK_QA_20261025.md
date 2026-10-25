# PokeSearch Scrapbook — APK QA assinado (25/10/2026)

## Proveniência verificada
- Funcionalidade: **mural do Orkut de demonstração LOCAL**, não online, read-only.
- PR: [#64 Draft](https://github.com/LucianoToscano/PokeSearch/pull/64), baseada na [#63](https://github.com/LucianoToscano/PokeSearch/pull/63). `main` LT87 preservada.
- Workflow: [Scrapbook Stage 1 Signed Protected APK QA #40190881436](https://github.com/LucianoToscano/PokeSearch/actions/runs/40190881436) **SUCCESS**; [Node + Java #40190819146](https://github.com/LucianoToscano/PokeSearch/actions/runs/40190819146) **SUCCESS**.
- SOURCE_COMMIT **`542e5f177031bbbad40e3197a5415a4632d8165d`**. Commits de documentação posteriores não alteram o APK.
- Nome exato: **`PokeSearch-v0.00.96-LT-Scrapbook-Stage1-Demo-QA.apk`**.
- `versionName=0.00.96`; `versionCode=54299` (números de candidato QA, **não LT96/Release oficial**).
- Pacote `com.lucianotoscano.pokesearch`, bytes **38.630.979**.
- **APK SHA-256 `bb138727636978f7870df9c461a96414fe02ded4feace2ac7bbdc94954d32fa2`** comparado com `SHA256SUMS.txt` do artifact, OK.
- Certificado permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Assinatura v2 TRUE; release **não depurável**, R8 mapping presente, shrinkResources habilitado.
- Artifact GitHub Actions **12598311245**; ZIP contém APK, SHA256SUMS.txt, SOURCE_COMMIT.txt, SIGNING-REPORT.txt, PACKAGE-VERSION.txt e PROTECTION.txt.
- **Não** foi feita GitHub Release, merge de PRs ou substituição do link estável de APK no Drive.

## Acesso à demonstração no Samsung
- No APK QA assinado, `POKE_SCRAPBOOK_STAGE1_QA=true` e `POKE_SCRAPBOOK_QA_ACK=stage1-readonly` no workflow; exige chave da Release, certificado permanente correspondente e versionCode >=54299.
- `BuildConfig.SCRAPBOOK_STAGE1_QA=true` somente para este build; `CommunityScrapbookStage1.isEnabled` permite preview ativo por padrão no QA. Item no menu lateral **Ocultar/Mostrar protótipo Mural** altera a preferência local. Para um build público normal, `SCRAPBOOK_STAGE1_QA=false` e o mural é invisível mesmo se prefs estiverem marcadas.
- Home: três postagens **fictícias**, avatar textual, apelido, categorias, hora e ícones não interativos; recolher/expandir. `Ver todos` abre Activity independente com filtro `Todos`, `Recados`, `Sugestões`, `Bugs`, `Dicas`.
- Publicar, curtir, responder, denunciar e excluir **indisponíveis**. Limite 300 no editor desabilitado. Sem novas leituras/escritas RTDB para scrapbook.

## Homologação ainda pendente
- Instalar no Samsung sobre QA R8, conferir atualização real, mesmo certificado, preferências, sessão API/DOM, favoritos 1/2/3, filtros Padrão/1/2, Localização 0–1000, Gboard colar/copiar, sons personalizados, Pix, sprites, Shiny, GL/UL/IV, Despawn, alertas.
- No Mural: Home não cortar rodapé; tema claro/escuro; rolagem; aba Ver todos; filtros; voltar; menu Ocultar/Mostrar; permanecer sem escrita Firebase; testar rotação e acessibilidade.
- **Nenhum teste físico Samsung foi realizado pelo CI.** A existência de APK assinado não autoriza promoção para release pública, alteração no Drive ou ativação Firebase.

## Continuidade
Ler `AGENTS.md`, `docs/GUIA_MESTRE.md` (**guia resumido**), esta ficha e `docs/POKESEARCH_SCRAPBOOK_ETAPA1.md`. Consultar backup integral apenas quando necessário: `docs/GUIA_MESTRE_BACKUP_INTEGRAL_2026-10-25.md`, intacto (SHA256 `f02d6396a3ae6a4e833f78be8aedbe0b8d0b40254f31203644f3040a30e2a861`).

**Sem merge, sem Release e sem alterar Firebase até autorização.**

# CONTINUAR POKESEARCH — CHECKPOINT LT85 QA / MENUS, IMAGENS, FILTROS E API DIRETA

Data: 25/10/2026. Continue do HEAD REAL no GitHub `LucianoToscano/PokeSearch`. Consulte `docs/GUIA_MESTRE.md` integral, README.md, `docs/ESTADO_CANONICO_LT85_QA.md` e `docs/LT85_MENU_REPEAT_TAP_QA.md` antes de alterar código. Autorização do proprietário para a API **já concedida**, não pedir novamente. Isso **não** é autorização de publicação.

**Imutáveis:** `applicationId com.lucianotoscano.pokesearch`, `namespace com.lucianotoscano.pokesearchoverlay`, JDK17, Gradle8.11.1, compileSdk36, targetSdk33, minSdk26. Overlay + WebView + probe.js + Android; sem proxy/backend/GPS físico; até 10 cards. JWT/reveal_code nunca no Java, logs, APK ou documentação. Não alterar assinatura, preferências, Firebase, funcionalidades antigas ou PvPPokeGo.

**Última oficial:** LT83 0.00.83/54286, SHA256 `451e4781581122908f014a893f693c8312b36b2c222a8579c499c6c3e2975c1c`. Release GitHub v0.00.83-54286, Drive LT79 legado intocado. LT84 0.00.84/54287 é QA de API assinada com CI PASS e PR #59 Draft. LT85 0.00.85/54288 é QA corretiva com [PR #60 Draft](https://github.com/LucianoToscano/PokeSearch/pull/60), branch `fix/lt85-menu-repeat-tap-20261025`, baseado na LT84 QA; **não** publicação oficial.

**Pedidos corrigidos em LT85:**
1. Segundo toque no mesmo submenu deve fechá-lo: Android nativo controla `popupKind`, evita estado JS desincronizado e reabertura por ACTION_OUTSIDE. Favoritos Dialog deve fechar no segundo toque ⭐. Testar vários ícones e troca com popup aberto.
2. Removido texto/botão repetitivo de importar opções do site.
3. Filtros API recebem escolhas oficiais de gênero, tamanho, clima e ordenação sem inspecionar React; Formas vêm da API `/forms` com cache 300s, devem aparecer para marcar mesmo durante Search API; DOM independente permanece.
4. Lista Pokémon mostra resultados de catálogo mesmo sem digitar; nome/número pesquisáveis; sprites default apenas para espécie regular verificada, placeholder para costumes e formas sem imagem oficial.
5. API direta padrão **ON se não houver preferência gravada**, opt-out manual DOM. A API não deve acionar fallback DOM para burlar erros 401,403,429, trainer não vinculado ou limites. WebView contém credenciais da sessão e reveal sob demanda.

**CI:** consultar a execução mais recente de `.github/workflows/lt85-menu-repeat-tap-signed-qa.yml` antes de marcar sucesso. Build QA assinado R8 versionName 0.00.85/versionCode 54288 deve gerar artifact com APK, SHA256SUMS, SOURCE_COMMIT, SIGNING-REPORT, PACKAGE-VERSION; conferir hashes e certificado permanente SHA256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`. Guia Mestre apendicado por `lt85-guide-append.yml` com teste de tamanho >1,4MB. Sem merge na main sem revisão e sem Release público sem autorização explícita.

**Pendências Samsung físicas:** menus todos, imagens em Pokémon e Formas, select múltiplo, botões sem clipping, Location `24.9407581,121.1889794` e raio 0/215/1000 e limpar, GL/UL, Shiny com treinador autenticado, GET reveal do spawn exato, favoritos 10x5, alertas e notificações. CI não substitui homologação real.

Executar etapas sequencialmente sem solicitar "continue". Se aparecer regressão, corrigir com testes e versionCode monotônico, emitir APK novo assinado só para QA até autorização de Release. Evitar alegar homologação antes de evidência.

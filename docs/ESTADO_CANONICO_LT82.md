# ESTADO CANÔNICO — PokeSearch LT82 (25/10/2026)

> Esta é a referência **atual** de release, branches e integração. Registros históricos no `GUIA_MESTRE.md` são imutáveis; divergências antigas devem ser interpretadas pela data. Não repetir versões antigas como atuais.

## 1. Última versão oficial (distribuída)

- **Release:** LT82 `0.00.82`, **versionCode `54285`**.
- **GitHub Release estável/latest:** https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.82-54285
- **APK asset:** `PokeSearch-v0.00.82-LT.apk`, **38.602.691 bytes**.
- **SHA-256 do APK:** `4c1acdb6ac45c718eb98825fbe4e389208fda0543b860def062f0c32ab3c5f2e`.
- **SHA-256 de certificado de assinatura permanente:** `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`; assinatura v2 verificada, build release não depurável, R8.
- **Código compilado:** `0d7019d62704af560c44c7b7549a2614062fb5d9`; não confundir com commits posteriores de documentação/merge, que não alteram os bytes do APK.
- **Build/testes completos e assinatura:** Actions https://github.com/LucianoToscano/PokeSearch/actions/runs/40158722313 **SUCCESS**.
- **Publicação GitHub Releases:** Actions https://github.com/LucianoToscano/PokeSearch/actions/runs/40159075690 **SUCCESS**.
- APK da mesma build disponível em pasta **privada QA** Drive: https://drive.google.com/file/d/1tAiedZeulBdMqfJ-AY5HkP4RMl1ENRD5/view; NÃO confundir este link privado com a publicação oficial pública no GitHub.

## 2. Atualização de clientes anteriores

- Instalações LT79 (0.00.79/54282) e LT80 (0.00.80/54283) usam `GitHubUpdateCenter`: consultam GitHub Releases stable/latest, notificações condicionadas ao Android, download/validação nativos antes de iniciar instalador com confirmação.
- Instalações legadas LT76 (0.00.76/54276) ainda usam `UpdateCenter` Google Drive e a Home lê **o mesmo ID existente de manifesto**, `15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf`, que aponta à **LT79/54282 como ponte**. A LT79 deve ser instalada antes da primeira atualização GitHub, preservando dados.
- Drive manifesto: https://drive.google.com/file/d/15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf/view. APK da ponte LT79 Drive ID `16qC01Sy5DPydPGFm75a9ss1dleY3yFIs`, `0.00.79/54282`. Atualização obrigatória desabilitada.
- A `main` é a fonte canônica de desenvolvimento **após merge PR #56**; antes da confirmação do merge, LT82 está em `fix/lt82-samsung-ui-polish-20261025`. Sempre consultar GitHub HEAD em vez de assumir SHA prévio.
- **Reserva próxima versão:** `0.00.83`, `54286`. Somente avançar após novo CI assinado, regressões e aprovação de publicação.

## 3. Conteúdo preservado / melhorias LT82

- Localização compacta **toda centralizada**, até 258 CSS px: título, entrada coordenadas inteira (exemplo `24.9407581,121.1889794`), slider 0–1000 km, linha `[Colar ↑] [km] [✓] [Limpar]`. Limpeza visual e nativa, aplicação vinculada ao site, guardas contra falsa aplicação.
- Clima: seleção envia patch para site, sem mensagens auxiliares de divergência na grade; confirmação no site continua necessária. Não afirmar paridade real sem Samsung.
- Favoritos: painel abre acima/abaixo da estrela segundo espaço e mantém contador /50, grade 10×5, busca, preferências e acesso externo.
- Tutorial de uma só vez: Pokébola (toque/segure/arraste), ↻ (toque/segure), registro `gestureHelpV1Shown`; sem balões longos repetitivos.
- LT80 Get coords: reidentificação exata e retry limitado; nenhum uso de link de outro Pokémon.
- Não quebrar GL/UL/IV/IV%, Shiny, formas/trajes, som/alertas, filtros, pesquisa e resultados até 10, editor visual, atualização protegida e identidade Android. **Enriquecer, nunca empobrecer.**

## 4. Identidade / invariantes

- Repo público `LucianoToscano/PokeSearch`.
- `applicationId = com.lucianotoscano.pokesearch`, `namespace = com.lucianotoscano.pokesearchoverlay`.
- JDK 17, Gradle 8.11.1, compileSdk 36, targetSdk 33, minSdk 26.
- Android Overlay + WebView + `probe.js`, API autorizada opt-in experimental OFF por padrão, sem backend, proxy ou GPS físico. Preserve assinatura e preferências. Não misturar PvPPokeGo.
- `app/build.gradle.kts` usa variáveis `POKE_TEST_VERSION_CODE`, `POKE_TEST_PUBLIC_VERSION` e chave protegida apenas no workflow para APK distribuído; valores de fallback do build local são de desenvolvimento e **não indicam versão pública**.

## 5. Pendências reais de QA

- **Samsung físico após instalar LT82:** confirmar layout centralizado (incluindo entradas longas e fontes diferentes), colar ↑, km 0/1000, aplicar/limpar e paridade do site, Clima/Boosted/opções e filtros, Favoritos ao topo/abaixo, onboarding só uma vez, ↻ e ausência de popups de descrição longos, Pokébola, Get coords, sprites, formas e login.
- WorkManager pode atrasar avisos conforme bateria/Doze; notificações requerem permissão no Android; atualização instalada somente com aceite do usuário.
- Testes automatizados + R8/assinatura **PASS**; **Samsung homologado: NÃO (ainda sem confirmação desta build)**.
- PR #55 contém LT82 e PR #56 é a integração para `main`; outros PRs Draft históricos não devem ser mesclados cegamente nem excluídos sem revisão.
- Cada novo checkpoint atualizar este documento, README e APENDICAR nova seção ao `docs/GUIA_MESTRE.md`; jamais substituir Guia inteiro por conteúdo truncado de API.

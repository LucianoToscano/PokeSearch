# PokeSearch — ARQUIVO MESTRE v0.51-beta (estado atualizado em 17/10/2026)

> **Documento oficial para continuidade do desenvolvimento.** Neste projeto, preservar sempre a última base estável, trabalhar por etapas e não misturar mudanças das branches de v0.52–v0.56, que foram descartadas como direção de UX. A regra de design é: **melhorar e organizar, nunca empobrecer**.

## 1. Identificação e estado verificável

- Repositório: **LucianoToscano/PokeSearch** (não confundir nem misturar com o app/repositório **PvPPokeGo**).
- Base original RESTAURADA na branch **`main`**: commit `493a333186eb7b012d883b4766609830cd828eb0`; árvore de código equivalente ao backup `backup/v0.51-beta-before-customization-20261015` (commit `d2eb0262a1d2418aa7cc958bf6a6c47149300767`).
- Branch ativa das melhorias por etapas: **`feature/v0.51-launcher-icon-fill-20261016`**. Última versão examinada em 17/10: **`4e159d9dccc23d7b0d482e49c3973b73e0be16d3`** (confira a branch antes de novas gravações).
- Pull request em **draft**: [PR #21](https://github.com/LucianoToscano/PokeSearch/pull/21), **sem merge na main**.
- `applicationId`: `com.lucianotoscano.pokesearch`; `namespace`: `com.lucianotoscano.pokesearchoverlay`.
- Versão ainda **`versionCode 51` / `versionName "0.51-beta"`**. minSdk 26; targetSdk 33; compileSdk 36; JDK 17; Gradle 8.11.1; AGP 8.10.1.
- CI referente ao commit `4e159d9d...`: **Build PokeSearch Android APK** run `39001104397` e **Secure beta APK (private test)** run `39001104344`, ambos **success**. Isso confirma compilação, **não** valida interação real com Pokémon GO/PoGoCoordinates ou aparência no Android.
- APK de teste gerado em etapa anterior e enviado ao Drive, mas **verificar SHA/commit antes de reenviar**: APKs de commits anteriores podem não incluir os 18 ícones atualizados e tamanho de 21px. Não afirmar que um link antigo contém o HEAD atual sem confirmação.

## 2. Diretrizes fixas de UX

- Estética original: **minimalista, clean, simétrica, compacta, delicada, elegante, transparente e intuitiva**. Não criar painéis grandes, margens vazias, linhas duplas, molduras desnecessárias, menus duplicados ou funções visuais que não operem de verdade.
- **Engrenagem** controla/exibe o **menu original compacto** de 12 funções e pode ser arrastada; **não deve carregar sprites na mesma janela**.
- **Resultados de Pokémon** devem permanecer em **outra janela flutuante nativa**, independente da engrenagem e do menu, com fundo transparente, até **10 Pokémon**, mesmo se só houver uma pesquisa.
- O ícone no topo da janela dos resultados indica a busca ativa. **Toque curto** recolhe/expande somente os resultados; **arrastar** esse ícone move apenas a janela de resultados. Posição `resultsX`/`resultsY` e colapso `resultsCollapsed` são persistidos.
- O cabeçalho do resultado **não deve ser maior que a engrenagem**. **Estado atual no código**: `body.result-window #resultHeader` com área de 35 × 30 px; arte PNG dentro com **21 × 21 px**, para corresponder visualmente ao ícone da engrenagem. Inspecionar no dispositivo antes de declarar aprovado.
- Ao mudar P/M/G, redimensionar apenas a lista/sprites e respeitar a engrenagem; ao abrir login, favoritos, minimizar ou fechar, ocultar/restaurar/destruir a janela independente sem perder seus dados nem posição.
- Preservar clique no sprite para detalhes, toque longo para coordenadas, temporizador de despawn, notificações, favoritos e demais funções originais.

## 3. Os 18 ícones OFICIAIS — mapeamento completo

**Fonte:** pasta do Google Drive `03_Icones_Ligas` (folder ID `1YkY3WQIirk1m9Ko8c2rLBuye6agnTbI7`). Na conferência atual, contém **18 arquivos PNG de busca** (9 famílias × normal/Shiny), além da subpasta `Icones_Bandeira_Liga`. Arquivos de referência e variantes antigas não representam novos modos de busca.

**Tamanho confirmado no código:** o ícone do cabeçalho de resultados é **21 × 21 px**, igual ao SVG da engrenagem; a área clicável é **35 × 30 px**. Os arquivos padronizados em 512 px são os recursos de imagem, não o tamanho exibido na tela.

**Atualização comprovada no GitHub:** commit `4e159d9dccc23d7b0d482e49c3973b73e0be16d3`, mensagem `assets: replace 18 result icons with updated standardized 512px PNGs from Drive`. Arquivos offline em `app/src/main/assets/result-icons/`. **Não substituir por imagens genéricas, referências da web ou reproduções**. Quando o usuário atualizar o Drive, comparar a versão atual e trocar os PNGs reais.

| Categoria da busca | Normal | Shiny Only ativo |
|---|---|---|
| Sem filtro | `none.png` | `none-shiny.png` |
| Raw IV personalizado (preenchimento manual) | `custom.png` | `custom-shiny.png` |
| IV por porcentagem | `percent.png` | `percent-shiny.png` |
| IV100 / Hundo | `hundo.png` | `shundo.png` |
| IV0 / Nundo | `nundo.png` | `shnundo.png` |
| Great League / GL | `great-league.png` | `great-league-shiny.png` |
| Ultra League / UL | `ultra-league.png` | `ultra-league-shiny.png` |
| Master League | `master-league.png` | `master-league-shiny.png` |
| Cup League | `cup-league.png` | `cup-league-shiny.png` |

- Mapeamento implementado em `app/src/main/assets/dock.html`, objetos `RESULT_ICONS`, `RESULT_MODE_ALIASES`, função `getResultIcon(searchMode,shinyActive)`. Escolher pela **busca realmente aplicada**, com a variante Shiny somente quando o site confirmar `Shiny only`.
- **Crítico:** a v0.51 tem, por enquanto, apenas as consultas existentes **IV100, GL#1 e UL#1**, com Shiny opcional. Os outros 12 PNGs estão incluídos e mapeados para uso futuro, mas **não significam que as seis outras buscas já funcionem**.
- Alterar o tipo de busca deve substituir somente o ícone superior. Recolher/expandir não deve alterar os filtros nem o estado do Shiny.
- A atualização dos ícones **não** autoriza implementar todos os modos na mesma etapa. Um recurso novo só entra com pedido explícito, código real, validação e respeito à UX original.

## 4. Código relevante e funcionalidades originais

- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java`: serviço de overlay Android; `root`/engrenagem; `menuRoot` menu; `resultRoot`/`resultPanel`/`resultParams` resultados; `resultGrip` toque/arraste do ícone; `toggleResultsCollapsed`; `resizeResults`; preferências de posição/tamanho; tratamento de login, favoritos e ciclo de vida.
- `app/src/main/assets/dock.html`: layout transparente/compacto; modo `?results=1` desenha sprites na janela independente; `?controls=1` desenha controles; modo padrão desenha a engrenagem; título/PNG do cabeçalho e resposta ao estado Shiny.
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java`: tela inicial e entrada de login; preservar retorno ao app e sessão persistente sem exibir o site além do necessário.
- `app/src/main/assets/probe.js`: consulta real ao PoGoCoordinates; não simular/assumir filtros aplicados; respeitar limites de atualização e login requerido para Shiny.
- `app/src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java`/favoritos; manter lista, alertas e funções existentes.
- `app/scripts/RoundIcon.java`, `app/build.gradle.kts`, `app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`: ícone do aplicativo foi ampliado e configurado como ícone adaptativo, **diferente do pequeno ícone do cabeçalho da lista**. Nunca confundir os dois tamanhos.
- Regras de distribuição seguras da v0.51: minify/shrink no release, preservação `JavascriptInterface`, `FLAG_SECURE` no login, verificações de integridade e proibição de distribuir senhas/keystore, mapping ou fontes aos amigos. Certificado temporário de CI pode diferir entre builds; desinstalar pode apagar dados locais.

## 5. Backups e separação das versões

- Base v0.51 restaurada em `main`, sem código posterior.
- Backups relevantes: `backup/v0.51-beta-before-customization-20261015`; `backup/main-before-v051-restore-20261016`; demais `backup/v0.52...`, `backup/v0.53...`, `backup/v0.54...`, `backup/v0.55...` podem existir para consulta histórica, **não** são base de desenvolvimento atual.
- Branch ativa `feature/v0.51-launcher-icon-fill-20261016`, PR #21 aberto e em rascunho. Evitar merge automático na `main` e evitar gerar APK após toda pequena alteração. Compilar **quando o usuário pedir**; neste histórico ele autorizou um APK para conferir os 18 ícones.

## 6. Pendências reais e próxima etapa

1. **Testar no dispositivo Android** a aparência e o toque do ícone superior de **21px**, a separação real entre engrenagem e lista, arraste, salvar posição, recolher/expandir, P/M/G, sprites, login, favoritos e toque longo de coordenadas. Compilação não prova essas ações.
2. Confirmar que o APK que for apresentado para download contém o **commit `4e159d9d...` ou posterior**, com os 18 ícones atualizados. Não reaproveitar links de APK anterior como se contivessem a nova arte.
3. Verificar a seleção Hundo/Shundo e GL/UL normal/Shiny **a partir do estado confirmado do site**, não apenas do toque no botão de brilho.
4. **Não inventar filtros** apenas porque seus ícones existem. Raw IV personalizado, IV0, porcentagem, sem filtro, Master e Cup continuam preparados visualmente, não implementados na base v0.51.
5. Próximas mudanças de UX somente uma por vez, com aprovação; preservar design compacto original e testar antes de concluir. Recursos planejados e rejeitados das versões v0.52–v0.56 não devem ser mesclados involuntariamente.

## 7. Continuidade em outro chat

Antes de qualquer modificação: abrir este arquivo, conferir estado atual da branch e PR #21, preservar `main` e backups, e continuar exclusivamente em `feature/v0.51-launcher-icon-fill-20261016` (ou nova branch derivada dela). Não recomeçar do zero, não confundir ícone do launcher com ícone do resultado, não confundir PNG importado com filtro funcional. Descrever o que foi realmente implementado e o que aguarda teste físico.

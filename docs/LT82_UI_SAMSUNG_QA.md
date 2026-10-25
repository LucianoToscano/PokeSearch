# LT82 — Alterações UI Samsung e publicação oficial (QA física pendente)

Solicitação visual: Localização centralizado em painel compacto e sem espaço lateral inútil:

    Localização
    [24.9407581,121.1889794]
    [------- barra do raio --------]
    [colar ↑] [1000] km [✓] [🗑]

**Implementação:** `dock.html` usa primeira linha apenas para título centralizado, segunda entrada coord com largura total (~258 CSS px), terceira barra de raio, quarta ação centralizada com botão Colar em primeiro lugar, seta para cima, km, Aplicar/Limpar. Não impedir rolagem horizontal nativa para coordenadas extraordinariamente longas. Mantidos 0–1000 km, formatos latitude/longitude e validação no DOM/site, opções persistentes, sem GPS.

**Clima:** seleção weather dispara `patchSelectedFilterKeys(["weather"])` para aplicar ao site. As mensagens auxiliares “Falta aplicar”, “Site e aplicativo divergem em: Clima” e “Usar opções observadas no site” não são geradas quando a categoria selecionada é Clima. Filtros devem continuar verificados no site; não considerar opção confirmada por clique isolado. Atrasos/erros permanecem registráveis na auditoria e no status geral.

**Tutorial:** pref `gestureHelpV1Shown` era persistente desde LT79. Mantida para impedir repetição aos usuários existentes. Novas instalações recebem duas mensagens curtas e separadas, primeiro Pokébola (toque/segurar/arrastar), depois ↻ (toque/segurar). Removidos `title` HTML repetitivos do botão Pokébola, ↻ e opções de intervalo, preservadas labels para acessibilidade.

**Favoritos:** `PokemonPicker` escolhe acima ou abaixo do ícone estrela conforme espaço real em pixels; layout intacto (10×5 ícones, selecionados 0/50, busca abaixo, `FLAG_NOT_TOUCH_MODAL`).

**Status oficial verificado em 25/10/2026:** versão `0.00.82`/versionCode `54285` **PUBLICADA** após autorização expressa do proprietário. GitHub Release estável https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.00.82-54285, assets uploaded, sem draft ou prerelease; SHA256 `4c1acdb6ac45c718eb98825fbe4e389208fda0543b860def062f0c32ab3c5f2e`; tamanho 38.602.691 bytes; assinatura permanente `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`, APK não depurável R8/v2. Actions build #40158722313 SUCCESS, publicação #40159075690 SUCCESS, `SOURCE_COMMIT=0d7019d62704af560c44c7b7549a2614062fb5d9`. PR #55 Draft para histórico da LT82, PR #56 aberto para consolidação da `main`; Drive antigo mantém LT79/54282 como ponte. Testes automatizados **não** comprovam correção real no Samsung; validar posições/gestos, filtros Clima, Localização, favorecimento acima/abaixo e aplicação no site. Não dizer homologado até ter evidência física. Próxima versão 0.00.83/54286 requer novo build e autorização.

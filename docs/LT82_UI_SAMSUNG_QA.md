# LT82 — Homologação UI Samsung, sem publicação

Solicitação visual: Localização centralizado em painel compacto e sem espaço lateral inútil:

    Localização
    [24.9407581,121.1889794]
    [------- barra do raio --------]
    [colar ↑] [1000] km [✓] [🗑]

**Implementação:** `dock.html` usa primeira linha apenas para título centralizado, segunda entrada coord com largura total (~258 CSS px), terceira barra de raio, quarta ação centralizada com botão Colar em primeiro lugar, seta para cima, km, Aplicar/Limpar. Não impedir rolagem horizontal nativa para coordenadas extraordinariamente longas. Mantidos 0–1000 km, formatos latitude/longitude e validação no DOM/site, opções persistentes, sem GPS.

**Clima:** seleção weather dispara `patchSelectedFilterKeys(["weather"])` para aplicar ao site. As mensagens auxiliares “Falta aplicar”, “Site e aplicativo divergem em: Clima” e “Usar opções observadas no site” não são geradas quando a categoria selecionada é Clima. Filtros devem continuar verificados no site; não considerar opção confirmada por clique isolado. Atrasos/erros permanecem registráveis na auditoria e no status geral.

**Tutorial:** pref `gestureHelpV1Shown` era persistente desde LT79. Mantida para impedir repetição aos usuários existentes. Novas instalações recebem duas mensagens curtas e separadas, primeiro Pokébola (toque/segurar/arrastar), depois ↻ (toque/segurar). Removidos `title` HTML repetitivos do botão Pokébola, ↻ e opções de intervalo, preservadas labels para acessibilidade.

**Favoritos:** `PokemonPicker` escolhe acima ou abaixo do ícone estrela conforme espaço real em pixels; сохраня? não — layout intacto (10×5 ícones, selecionados 0/50, busca abaixo, `FLAG_NOT_TOUCH_MODAL`).

**Status:** branch `fix/lt82-samsung-ui-polish-20261025`, PR Draft; versão QA 0.00.82/versionCode 54285. GitHub Release público continua LT80 e manifesto Drive legado LT79, main não alterada. Testes automatizados não substituem teste físico no Samsung; validar posições/gestos, filtros clima e aplicação real. Somente liberar atualização oficial se aprovado pelo proprietário após homologação.

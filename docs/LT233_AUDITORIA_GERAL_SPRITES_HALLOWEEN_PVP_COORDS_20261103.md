# LT233 — Auditoria de sprites Halloween, PvP e coordenadas (03/11/2026)

## Reproduções e causa identificada
Capturas Samsung exibiram siglas como `RO`, `FR` e `SH` em vez de sprites na coluna de resultados, incluindo Rowlet, Froakie, Shellos e Shuppet, apesar de Pokémon-base possuírem PNGs corretos. Os botões ⓘ e ⚔️ disputavam o espaço horizontal do Rank Classe; coordenadas reveladas ficavam alinhadas à esquerda. O painel de golpes compacto LT232 foi preservado.

Auditoria física dos arquivos **dentro do APK público LT232**: **2.876 PNGs**, nenhum inválido, sem PNG inteiramente transparente. O gerador declarava 102 arquivos de fantasia efetivamente empacotados e a LT233 acrescenta 4 ausentes, completando 106 entradas declaradas (contagem de entradas, não de variantes distintas). Todos os 4 novos PNGs normais/Shiny são exatos e verificados por blob Git no commit público fixo de PokeMiners `c2a686eb08ace6e890d8fe3d2134c76988db87b5`:
- `pm656.cFALL_2024.icon.png`: `f8314ce59587cdcec314718fb592eba98f24174f`.
- `pm656.cFALL_2024.s.icon.png`: `e92fb7eecdfed6d3e90953b436cc629bbf5d7ebf`.
- `pm722.cFALL_2024.icon.png`: `41c9f22c78c6dac03be722bed181c0b82bdde0d7`.
- `pm722.cFALL_2024.s.icon.png`: `096734e3d27eb546f39affc0fed6f77d99000014`.

## Correções sem regressão de identidade
1. `sprite_offline.js`: aceitar ID da espécie de `number`, `dex`, `pokemon_id`; resolver fantasia por nome, `costume_id`, `form_id`, sexo e Shiny verificados, evitando deduzir uma imagem base a partir de fantasia desconhecida. Identificar variantes 2026 Pikachu/Zubat/Sinistea e fantasias antigas retornando em 2026 Rowlet/Froakie, Piplup/Drifblim, Gengar e Noibat; outras variantes confirmadas na tabela empacotada continuam.
2. `dock.html`: priorizar bytes locais de variantes verificadas quando WebView falhar; reproduzir tentativa de recuperação também quando inicialmente nenhum `img` foi criado; mostrar marcador neutro somente se realmente não houver imagem comprovada. Não substituir fantasias, formas ou Shiny por sprites genéricas erradas.
3. `detail.html`: reduzir apenas o texto do Rank Classe quando espaço for insuficiente, reservar 18px fixos **independentes** para ⓘ e ⚔️; preservar semântica dos botões. Coordenadas reveladas centralizadas no mesmo eixo do antigo `Pegar Coordenadas`, mantendo números completos copiáveis.
4. `build_sprite_bundle.py`: incluir os 4 arquivos Halloween imutáveis e verificar blobs SHA antes de empacotar. `lt233-halloween-sprite-recursion.test.js`: testes de identidade para formas/fantasias/sexo/Shiny e regressões de coordenadas, PvP e presença no gerador.
5. O workflow de release LT233 deve garantir que o APK gerado **contém os quatro PNGs** antes de criar GitHub Releases. Se faltar algum PNG, falhar, sem publicar.

## Continuidade e QA
- Base de desenvolvimento: `541f0d5f06528b74f832c49454ae616daaa9f548` (release LT232, `v0.02.32-54436`).
- Candidato LT233: `0.02.33`, versionCode `54437`, certificado Android permanente SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
- **Estado:** QA/PR em andamento; não declarar APK público, merge nem instalação até GitHub CI, apksigner e `releases/latest` comprovados.
- Teste físico Samsung após instalação segue obrigatório para todos os tamanhos P/M/G, Pokémon normais, Shiny, fantasias Halloween, cards P1/P2, coordenadas reveladas e botões ⓘ/⚔️ simultâneos.
- Nenhuma alteração de API, quotas, cache de coordenadas, regras de premium, Doce Raro, tamanho dos menus ou autenticador nesta etapa.

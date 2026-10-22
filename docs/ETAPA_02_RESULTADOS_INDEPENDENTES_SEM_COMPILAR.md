# PokeSearch v0.51 — Etapa 02: resultados separados (sem compilar)

> **Aviso de histórico (17/10/2026):** este documento descreve a etapa antes da autorização de compilação. Depois, os 18 PNGs foram atualizados no Drive e reintegrados; o cabeçalho do resultado passou a usar imagem 21×21 px em área de 35×30 px; as duas rotinas de CI concluíram com sucesso para o commit `4e159d9d...`. O estado atual e as pendências devem ser consultados em [`GUIA_MESTRE.md`](GUIA_MESTRE.md), que prevalece sobre este registro histórico. Nenhum teste físico foi comprovado.


Base original restaurada: `main` v0.51-beta. Desenvolvimento não mesclado em `feature/v0.51-launcher-icon-fill-20261016`.
Esta etapa incorpora a correção anterior do ícone de inicialização do Android. **Nenhum APK foi compilado ou criado nesta etapa.**

## Fluxo preservado

- A engrenagem mantém a janela Android `root`, o arraste e a abertura da barra de 12 ferramentas original. A lista de Pokémon NÃO é desenhada nessa janela.
- Os resultados usam `resultRoot`/`resultPanel`/`resultParams`, uma janela TYPE_APPLICATION_OVERLAY **independente**. Posição gravada nas preferências `resultsX`/`resultsY`.
- Na parte superior da nova janela existe um ícone da busca ativa. Toque curto no ícone contrai/expande só a lista, e arrastar o mesmo ícone move só essa janela. Preferência `resultsCollapsed` preserva o recolhimento após reinício.
- O projeto incorpora **18 imagens originais** (nove tipos × sem/com Shiny), de `03_Icones_Ligas` no Drive. Estão em `app/src/main/assets/result-icons/` para uso local, sem carregar imagens pela internet.
- Mapeamento exato: Sem filtro → none / none-shiny; IV personalizado (Raw IV preenchido) → custom / custom-shiny; Porcentagem → percent / percent-shiny; IV100 → hundo / shundo; IV0 → nundo / shnundo; Grande Liga → great-league / great-league-shiny; Ultra Liga → ultra-league / ultra-league-shiny; Liga Mestra → master-league / master-league-shiny; Copa → cup-league / cup-league-shiny. Todos os nomes têm extensão `.png`.
- **Na v0.51, somente IV100, GL#1 e UL#1 existem como filtros de busca.** Os outros seis pares estão registrados para quando seus respectivos modos forem implementados; não habilitar busca Mestre, Copinha, IV0, personalizada, porcentagem ou sem filtro nesta etapa. O ícone Shiny depende de confirmação do site.
- O controle P/M/G redimensiona a janela de sprites. Toque no Pokémon e toque longo para copiar coordenadas são mantidos; detalhes acompanham a janela dos resultados. Login, favoritos e minimização global ocultam temporariamente a janela de resultados e restauram-na ao retornar. Ao fechar, destruir janela e WebView.
- O menu principal continua horizontal, compacto e sem novas opções. Esta etapa **não adiciona pesquisas simultâneas**, filtros, novos ícones ao menu, nem funções das versões v0.52+.

## Conferências para quando a compilação for autorizada

1. Uma pesquisa IV100 com sprites aparece só na janela independente; engrenagem isolada mesmo com lista recolhida.
2. Clique em Hundo recolhe; clique novamente expande sem alterar pesquisa ou menu.
3. Arraste o cabeçalho Hundo/GL/UL sem deslocar a engrenagem; arraste a engrenagem sem deslocar a lista.
4. Mude IV100→GL#1→UL#1 e Shiny ON/OFF e confira Hundo/Shundo, Great League/Great League Shiny e Ultra League/Ultra League Shiny, sem alterar sprites nem coordenadas.
5. Toque e toque longo no sprite, temporizador, P/M/G, popup detalhes, favoritos e login funcionam.
6. Minimize/restaure toda a interface, reinicie o serviço e verifique posição e estado salvo do resultado.
7. Teste Android 15/16, bordas, orientação, transparência e sobreposição com Pokémon GO.
8. Validar automaticamente arquivos de imagem e recursos em APK gerado, **somente após autorização explícita de compilação**.

Nenhum teste executado substitui verificação manual no dispositivo. Não mesclar este branch na main até aprovação.

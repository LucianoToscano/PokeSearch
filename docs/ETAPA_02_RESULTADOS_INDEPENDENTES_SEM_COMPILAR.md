# PokeSearch v0.51 — Etapa 02: resultados separados (sem compilar)

Base original restaurada: `main` v0.51-beta. Desenvolvimento não mesclado em `feature/v0.51-launcher-icon-fill-20261016`.
Esta etapa incorpora a correção anterior do ícone de inicialização do Android. **Nenhum APK foi compilado ou criado nesta etapa.**

## Fluxo preservado

- A engrenagem mantém a janela Android `root`, o arraste e a abertura da barra de 12 ferramentas original. A lista de Pokémon NÃO é desenhada nessa janela.
- Os resultados usam `resultRoot`/`resultPanel`/`resultParams`, uma janela TYPE_APPLICATION_OVERLAY **independente**. Posição gravada nas preferências `resultsX`/`resultsY`.
- Na parte superior da nova janela existe um ícone da busca ativa. Toque curto no ícone contrai/expande só a lista, e arrastar o mesmo ícone move só essa janela. Preferência `resultsCollapsed` preserva o recolhimento após reinício.
- `IV100` escolhe Hundo, ou Shundo quando o Shiny estiver ativado **e confirmado no site**. `GL#1` escolhe Great League; `UL#1` escolhe Ultra League. **Imagens originais** obtidas da pasta privada do usuário `03_Icones_Ligas` no Google Drive; arquivos foram incorporados em `app/src/main/assets/result-icons/` para funcionar offline. Não acrescentar busca Mestre, Copinha nem outro modo nesta etapa.
- O controle P/M/G redimensiona a janela de sprites. Toque no Pokémon e toque longo para copiar coordenadas são mantidos; detalhes acompanham a janela dos resultados. Login, favoritos e minimização global ocultam temporariamente a janela de resultados e restauram-na ao retornar. Ao fechar, destruir janela e WebView.
- O menu principal continua horizontal, compacto e sem novas opções. Esta etapa **não adiciona pesquisas simultâneas**, filtros, novos ícones ao menu, nem funções das versões v0.52+.

## Conferências para quando a compilação for autorizada

1. Uma pesquisa IV100 com sprites aparece só na janela independente; engrenagem isolada mesmo com lista recolhida.
2. Clique em Hundo recolhe; clique novamente expande sem alterar pesquisa ou menu.
3. Arraste o cabeçalho Hundo/GL/UL sem deslocar a engrenagem; arraste a engrenagem sem deslocar a lista.
4. Mude IV100→GL#1→UL#1 e Shiny ON/OFF e confira os ícones reais correspondentes, sem alterar sprites nem coordenadas.
5. Toque e toque longo no sprite, temporizador, P/M/G, popup detalhes, favoritos e login funcionam.
6. Minimize/restaure toda a interface, reinicie o serviço e verifique posição e estado salvo do resultado.
7. Teste Android 15/16, bordas, orientação, transparência e sobreposição com Pokémon GO.
8. Validar automaticamente arquivos de imagem e recursos em APK gerado, **somente após autorização explícita de compilação**.

Nenhum teste executado substitui verificação manual no dispositivo. Não mesclar este branch na main até aprovação.

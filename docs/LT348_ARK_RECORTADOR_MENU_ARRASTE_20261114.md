# LT348 ARK — Recortador + Buscar Pokémon com menus alinhados, alça de mover e ordenar

**Base oficial preservada:** LT347 / 0.03.45 / versionCode 54552 (main `509930409327fa7648dcb12862c6de498c73980e`).

## Mudanças no recortador
1. **Dois grupos alinhados no rodapé**, com fundo único arredondado e legível: superior `Confirmar | Prévia | Cancelar` (nessa ordem), inferior `Background | Quadrado | Livre | Vertical`.
2. Ícone vertical substituído pelo **WebP atualizado no Drive**, SHA-256 `00dff29e152f385f30aaa204095bfc1f35f1218143a2f507479a03020720490e`, 96.766 bytes. Importado sem recompressão em `app/src/main/assets/pgs-crop/icone_vertical.webp`; asset legado PNG permanece preservado.
3. Fundo dos dois grupos agora tem alpha e contorno suficientes para contraste em mapa claro/escuro. Formato selecionado destacado; fundos planos opt-in On/Off preservados.
4. Barra lateral contínua de 16–92 px **no mesmo lugar**, sem novo slider. Alça discreta externa de quatro direções no canto do recorte para **arrastar sem encobrir o sprite**; alça de redimensionar do canto oposto, lupa e prévia preservadas.
5. Horizontal legado: toque longo no ícone Vertical. Confirmar e Cancelar continuam explícitos, sem modificar modelos antigos sem confirmação.

## Mudanças no Buscar Pokémon
1. Lista do PGS: sai `↑ ↓ −`, entra **uma alça de arrastar por Pokémon selecionado**, com deslocamento de linhas calculado por gesto vertical e `PgsAutoCatalog.move` (persistência existente). Para TalkBack, ações de acessibilidade de avançar/voltar substituem os botões; X simples vermelho remove da seleção, preservando modelos PNG.
2. Menu da bolha: ícone engrenagem+lápis usa o **traçado original de `dock.html/QUICK_SVG.appearance`**, X vermelho `#ff596c`, sino nativo das Pokébolas com brilho reduzido a 5dp centrado **dentro da campânula**, sem invadir a borda.
3. Menu e submenu continuam **presos à bolha durante arraste**, atualização da janela existente sem descartá-la, com reposicionamento em alteração de resolução/orientação. Toque no botão principal com submenu abre a barra anterior; toque seguinte retrai somente a barra; não desliga a busca.
4. Submenu Tempo de 190dp para 176dp com linhas menores; Personalização de 240dp para 210dp com textos/linhas compactados. Funções, ciclo 25s configurável, filtros e alertas permanecem.
5. Aparência principal continua usando `PgsAutoMenuStyle` e o `visualPrefsJson` canônico das Pokébolas 1 e 2. Sem criar outra opacidade independente.

## Verificação
Teste de contrato: `app/tests/lt348-pgs-crop-menu-drag-contract.test.js`. Rodar Node completo, LT169/LT211, Java LT62, OTA LT173, PGS QA Android, beta R8 e assinatura antes de qualquer publicação oficial monotônica. **BLOQUEADO** sem Samsung: arrastar e soltar no mapa com diferentes densidades/rotações, visual claro/escuro, registrar modelos e preservar imagens, realmente tocar PGSharp, Shiny, Encontro e OAuth do PoGoCoordinates. CI aprova compilação, não comprova toque/teleporte no jogo. Nenhum recurso legada será apagado nem assinatura substituída.

## Registro de publicação oficial verificado

**LT348 OFICIAL — 14/11/2026:** versão **0.03.46 / versionCode 54553 / label 51350**, [release v0.03.46-54553](https://github.com/LucianoToscano/PokeSearch/releases/tag/v0.03.46-54553), APK `PokeSearch-v0.03.46-LT.apk` de **61.013.429 bytes**, SHA-256 `ab6ed18f9facfd9fa55a78e5342cdb81d82f014c9b358483883e86abaf7680b0`, [workflow protegido #43653017055](https://github.com/LucianoToscano/PokeSearch/actions/runs/43653017055) **SUCCESS** com preflight, regressões, assinatura permanente e verificação pública. Implementação [PR #379](https://github.com/LucianoToscano/PokeSearch/pull/379), squash `d4249f07b091cfa8943fe54c7d8bb1298b1bc5bd`; pedido oficial [PR #380](https://github.com/LucianoToscano/PokeSearch/pull/380), squash `6e7a2f4801168f3a116cebf3b38f47842e5d5128`. Dois grupos de recorte alinhados no rodapé, novo vertical WebP original, alça externa quatro direções e slider preservado. Lista Busca com alça de arrastar e X vermelho; gear+pencil paths originais, Shiny dentro do sino, menus ancorados à bolha e submenus Tempo/Personalização menores. **O CI não substitui a homologação física em Samsung**: alinhamento pixel a pixel, arrastar no mapa, toque real, OAuth Google/Discord do PoGoCoordinates, Shiny/Encontro e teleporte real continuam BLOQUEADOS até evidência; instalação depende de confirmação do Android.

Gates da PR #379: Node QA, LT169, LT211, LT62, OTA LT173, PGS QA Android e Secure beta/R8 passaram no commit `1a937b866a805076ab3737365d74153bcecf3390`, integrados em `d4249f07b091cfa8943fe54c7d8bb1298b1bc5bd`. PR de release #380 também passou preflight oficial, Node, LT169, LT211, LT62, LT173 e beta Secure/R8. O sucesso do workflow protegido comprova APK publicado e assinado, **não** execução física da interface no Samsung, nem teleporte.

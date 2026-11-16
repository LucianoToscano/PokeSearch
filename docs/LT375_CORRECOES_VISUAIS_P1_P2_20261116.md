# PokeSearch — LT375 | Correções visuais do overlay Pokébola P1/P2
Data: 16/11/2026 (America/Fortaleza). **QA em branch, não publicada.** Base oficial: LT374 `0.03.68 (54575)`.

## Evidência de entrada
Quatro imagens do usuário mostraram: (1) ícone **Background** colorido ativo desproporcional, (2) Background inativo normal, (3) `Filtros > Ordenar`: abas `Padrão` e `Inverso` quase sem fundo legível, (4) `⋯`: três ações extras `Reportar`, `Apoiar`, `Fechar` coladas e com fundo cinza **compartilhado**. As imagens são capturas de referência, não evidência de teste depois da alteração.

## Fonte efetiva
`app/src/main/assets/dock.html` é a origem compartilhada de P1 e P2, com `--visual-menu-button-bg`, `--visual-menu-border`, `--visual-menu-tile-shadow`, `--visual-menu-gap`, `--visual-menu-fg` e `--visual-menu-blur`. Não substituir ícones nem criar menus alternativos.

## Correções LT375 (somente apresentação)
1. **Background ON/OFF:** o botão mantém dimensões e moldura dos demais tiles, inclusive durante troca de estado. O PNG proprietário `Icone_Background_On.png` segue original, com renderização contida **16×16 CSS px**, centrada em glyph 18×18 sem inflar tile 30px. O modo vertical preserva o slot oficial de **29px**. OFF permanece SVG original.
2. **Ordenar Padrão/Inverso:** duas tabs continuam separadas, com gap do Editor Visual e mínimo visível de 2px. Cada uma recebe **o mesmo fundo e transparência de um botão normal do menu**, sem placa adicional atrás da dupla. A tab escolhida conserva borda verde discreta, sem aumentar largura/altura.
3. **⋯ expansivo:** o `#choices.morePanel` (tanto WebView independente como orientação vertical/above) fica realmente **transparente**, sem backdrop/borda/sombra compartilhados. Cada um dos três `.quickMoreAction` recebe seu próprio background/borda/sombra com o tema original e intervalo vertical derivado de `--visual-menu-gap` (mínimo 2px); os ícones originais amarelo/rosa/vermelho e callbacks permanecem intactos. O popup nativo continua calculando altura com `tiles*30 + (tiles-1)*gap`.

## Precedência CSS diagnosticada
A regra histórica **LT349** aparece no fim do stylesheet e volta a definir `background:var(--visual-menu-bg)` também para `#choices.morePanel`, anulando a intenção de **LT170** (`background:transparent`). O bloco LT375 foi posto **depois** da LT349, ainda dentro do stylesheet, para resolver a cascata pela precedência correta e preservar o controle de transparência do Editor Visual.

## Testes de aceitação
| Caso | Critério | Estado |
|---|---|---|
| CSS1 | Background ON/OFF não modifica dimensões externas | Teste estático LT375 criado; execução CI pendente |
| CSS2 | Background vertical mantém slot 29px | Teste estático LT375; execução CI pendente |
| CSS3 | Padrão/Inverso, fundo de tile normal e gap | Teste estático LT375; execução CI pendente |
| CSS4 | ⋯ sem fundo único e com três tiles separados | Teste estático LT375; execução CI pendente |
| CSS5 | P1/P2 compartilham código, sem alterar gesto | Contrato de fonte; execução CI pendente |
| AND1 | 1080px, outras densidades, claro/escuro | **BLOQUEADO:** sem captura física |
| AND2 | Menu horizontal/vertical e reordenação | **BLOQUEADO:** sem captura física |
| AND3 | Pular/tutorial, filtro, ações, alpha | **BLOQUEADO:** sem captura física |
| REL1 | Nova atualização oficial assinada | **NÃO solicitada**; não publicar automaticamente |

## Governança
Branch `fix/lt375-pokeball-background-sort-more-ui`. Testes `app/tests/lt375-pokeball-menu-visual-contract.test.js` + regressões antigas. Não modificar `OverlayService`, `OverlayGestureTour`, contas, filtros/sort, OAuth, Doce Raro, PGS, assinatura permanente, release-notes nem versionCode oficial. A versão pública permanece LT374 até solicitação explícita de publicação e todos os gates necessários. Registrar evidências de CI/PR depois de executadas. A próxima intervenção deve usar as correções reais adicionais enviadas pelo usuário.

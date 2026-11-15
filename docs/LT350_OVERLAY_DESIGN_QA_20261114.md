# LT350 — Sistema visual único do PokeSearch (QA, 14/11/2026)

## Escopo implementado

- CSS de geometria compartilhada entre dock.html (P1/P2) e rare_candy_controls.html: overlay_design_tokens.css.
- Leitura nativa única de visualPrefsJson e cores de painel, via OverlayVisualTheme.java, em PGS, QuickMenus e Doce Raro.
- Contrato de código automatizado app/tests/lt350-overlay-design-contract.test.js, com proteção contra divergência de geometria.
- Referência física 1080px do proprietário registrada no JSON LT350_OVERLAY_REFERENCE_1080.json.
- Nomes, ícones, ordem, persistência, contas, consultas e interações preservados, sem redimensionar cegamente os componentes P1/P2.

## Fonte de verdade

O código original P1/P2 apresenta tile de 30 CSS px, arte de 16 CSS px, gap de 2 CSS px e raio de 5 CSS px.
Os screenshots em resolução física 1080 trazem botão 87x77 px, gap 9 px, popover raio 13 px,
texto 24/22/26 px, linhas 60-63 px e controles 77/58/48/76 px. NÃO igualar diretamente
essas medidas a CSS px ou Android dp: é necessária comparação física real com escala WebView/densidade.

## Matriz regra → valor usado → verificação

| Regra | Código aplicado | Resultado até obter prova |
|---|---|---|
| Tile compartilhado | 30 CSS px / 30 dp | CONTRATO ESTÁTICO |
| Arte compartilhada | 16 CSS px / 16 dp | CONTRATO ESTÁTICO |
| Gap | 2 CSS px / 2 dp | CONTRATO ESTÁTICO |
| Raio do tile | 5 CSS px / 5 dp | CONTRATO ESTÁTICO |
| Transparência | visualPrefsJson; painel nativo linear como visual_editor.js | REGRESSÃO CI + aparelho |
| Barras 87x77px em imagem 1080 | Referência registrada; sem conversão arbitrária | BLOQUEADO: medir tela |
| Popovers compactos sem espaço vazio | Preserva layouts existentes | BLOQUEADO: captura comparativa |
| Ícones, cores, ordem, funções | Não alterados neste patch | CI + aceite manual |

## Testes necessários

1. Rodar node app/tests/lt350-overlay-design-contract.test.js e todas as suites Node, Java, Android/R8 e OTA do CI.
2. Capturar P1, P2, PGS, Doce Raro, Modos, Filtros, Favoritos, Pokémon, Personalização, Notificações e Editor Visual no Samsung.
3. Repetir tema claro/escuro, opacidades 0/50/100, densidades diferentes, orientação, arrastar e abrir/fechar.
4. Medir com linhas-guia/medidas do Editor Visual e comparar com capturas aprovadas.
5. Qualquer diferença não autorizada deve ser marcada FALHOU com componente e retângulo físico, nunca OK por ausência de erro de compilação.

## Bloqueios

As imagens de conversa NÃO foram adicionadas como arquivos binários à branch,
portanto o pixel-diff automatizado ainda precisa de capturas baseline originais no repositório.
Sem aparelho Samsung, não há prova de toque, login OAuth, Shiny, teleporte nem instalação.
Este documento não afirma compilação, CI verde, merge nem publicação do APK.

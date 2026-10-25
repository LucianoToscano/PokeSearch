# LT88 Samsung R3 — legibilidade de Filtros e Modos

Data: 25/10/2026 · PR #63 Draft · branch `feature/lt88-lt93-evolution-20261025`.
A `main` oficial LT87 permanece intocada.

## Evidência física
Três capturas Samsung no QA 0.00.90/54293: opção Nível, Forma (00–04) e Modo IV% aparecem sobre fotografia; filtro lateral e campos deixam o plano de fundo visível demais para leitura. Isto **não** é PASS visual da etapa anterior.

## Causa verificada no código
`--visual-menu-bg` é aplicado como `rgba(15,19,26,0.50)` para 50% de transparência base. O CSS `backdrop-filter:blur()` na WebView de overlay não assegura desfoque de pixels de outro aplicativo. Sem outro fundo, o conteúdo do papel de parede atravessa toda a região de texto e opções, ainda que a propriedade CSS esteja ativa. Histórico CSS continha seletores transparentes para listas internas de Forma, Clima e Modo.

## Correções R3
- `visual_editor.js`: manter `menuTransparency=50` inicial e `menuBlur=4`, limites anteriores e persistência sem reset. Acrescentar `--visual-menu-readable-bg` / `--visual-menu-readable-button-bg` derivados do MESMO slider. A opacidade efetiva da superfície de leitura é `1-(transparencia/100)^2.8`: 0%→100% de opacidade, 50% base→~86% de opacidade, 100%→0%. O Editor informa essa camada de contraste ao usuário; não afirmar falsamente que a superfície final permanece exatamente 50% transparente.
- `dock.html`: último bloco de CSS aplicado ao rail/editor de Filtros e Modos, perfis, listas Forma/Ordenar/Clima, campos de nível/PC/IV e tiles principais. Todo submenu aberto recebe fundo/contorno; invólucros externos continuam transparentes e `pointer-events:none`. Não criar espaço morto, largura/altura extra, nem capturar toques atrás.
- `PokemonPicker.java`: Favoritos nativo usa a mesma transformação de transparência e tema, com fallback do desfoque em versões Android sem suporte. Usuários com preferência antiga continuam com valor salvo.
- Testes: preservar regressões antigas, adicionar QA explícito dos seletores, contraste e política visual no `app/tests/lt88-unified-menu-theme.test.js`.
- Versão do **APK QA**, não oficial: `0.00.91`, `versionCode=54294`. Não implica conclusão do roadmap LT91.

## Checklist pendente no Samsung
Testar Filtros (Nível, PC, Ordenar, Forma 00–04, Sexo, Tamanho, Clima); Modos IV/IV%/GL/UL, cada um junto à foto clara/escura por trás; Editor Visual em 0/50/100% de transparência e blur 0/16; tema claro e escuro; aplicação da configuração sem reiniciar; perfis e Favoritos; arrastar menu; toque fora; respeitar no máximo 10 resultados; sem falhas em clipboard, localização nem API. Se blur cross-window continuar indisponível, a superfície contrastada deve permanecer legível.

## Segurança e publicação
Sem novas permissões, sem exposição de tokens, sem alteração de assinatura ou API. Não alterar `main` ou publicar Release. Node/Java/R8/apksigner e hash devem ser verificados para o commit do APK; CI PASS não substitui PASS físico. Append protegido no Guia Mestre, nunca sobrescrever o histórico.

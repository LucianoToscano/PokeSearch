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

## Evidência automatizada do APK 54294
- Protected GitHub Actions `#40181204206` **SUCCESS**: https://github.com/LucianoToscano/PokeSearch/actions/runs/40181204206
- SOURCE_COMMIT do APK: `dbc4c8ae148d886384b98a7d42df8fbeb7cfe525`.
- APK `PokeSearch-v0.00.91-LT-Readable-Menus-QA.apk` — 38.613.651 bytes, SHA-256 `e506c72ba7341feced77661e606a1b2093151805b44a4d5acbe4a4c24a911afe`. `sha256sum -c SHA256SUMS.txt` **OK**.
- Artifact Actions `#12594565075`: ZIP SHA-256 `606789c75199de105b8c4bba2b51cb5ce198c9eb7bf2b7dec74653447dcd9837`.
- `PACKAGE-VERSION.txt`: `com.lucianotoscano.pokesearch`, `0.00.91`, `54294`.
- `SIGNING-REPORT.txt`: APK Signature Scheme v2 **TRUE**, certificado SHA-256 `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e` (mesmo permanente da LT87).
- ZIP íntegro, R8/proteção de release previstos no workflow; sem instalação Samsung automatizada.
- Workflow append Guia `#40181270062` **SUCCESS**, hash do prefixo do Guia preservado; PR #63 continua Draft; sem merge/Release oficial.

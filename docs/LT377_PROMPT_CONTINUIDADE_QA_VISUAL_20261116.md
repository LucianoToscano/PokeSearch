# POKESEARCH — ARK LT377 — Continuidade da QA visual após LT376

Continue o PokeSearch no repositório `LucianoToscano/PokeSearch`, sem reiniciar funcionalidades. Versão pública permanece LT375 `0.03.69 (54576)`, release `v0.03.69-54576`; branch de correções LT376: `fix/lt376-popup-location-favorites-dots-blur`. **NÃO mesclar nem publicar sem nova autorização.**

## Ordem obrigatória
1. Leia `AGENTS.md`, `docs/GUIA_MESTRE.md`, `docs/LT375_ARK_RELEASE_OFICIAL_20261116.md`, `docs/LT376_ARK_QA_CORRECOES_PENDENTES_20261116.md` e os resultados do PR LT376. Confirme na API GitHub a `main`, release e gates mais recentes.
2. Inspecione em aparelhos Android físicos as quatro falhas demonstradas em 16/11: Localização deve exibir 16 linhas sem rolagem/corte, Favoritos imediatamente acima/abaixo e alinhados sem encobrir barra/resultados, alça 2×3 com seis pontos circulares, blur 0/4/8/16px aplicado ao popup onde o SO permitir.
3. Teste também Android 11 sem blur (fallback), Android 12–14 em Samsung e não Samsung, sistema com cross-window blur habilitado/desabilitado, modo claro/escuro, orientações, densidades, teclas, arraste e TalkBack. Se desfoque estiver indisponível no SO, apresentar diagnóstico e fallback honesto, sem prometer desfoque de outro aplicativo.
4. Certifique que PopupTouchGeometry, `PokemonPicker`, `dock.html`, `OverlayService` e `visual_editor.js` não introduziram sobreposição, medidas ilegíveis ou regressões. Preserve Minior Meteor/Core, demais sprites e escala P/M/G; tutorial único V3 das Pokébolas, Doce Raro/Busca sem auto tutorial, guias e preferências persistentes.
5. Preservar P1/P2, contas, filtros, Favoritos, Background, Ordenar, Busca Inteligente, Sequências, Modo Noturno, templates, notificações e compatibilidade PGSharp e Pokemod separadamente. Não afirmar teleporte, caminhada ou captura efetiva sem prova.
6. Exigir Node, Java, OTA, Android debug QA, Secure beta/R8 e regressões em um mesmo SHA. Registrar links de Actions e limitações físicas no ARK/Guia Mestre.
7. Somente sob nova autorização, após QA aprovado, considerar merge e versão monotônica com versionCode maior que 54576 e assinatura permanente. Gerar próximo ARK e prompt.

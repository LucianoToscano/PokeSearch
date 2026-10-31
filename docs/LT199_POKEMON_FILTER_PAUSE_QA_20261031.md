# QA — Pausar filtro Pokémon/Formas preservando lista (31/10/2026)

**Base:** PokeSearch main após LT198, branch `feature/pokemon-filter-pause-keep-selection-20261031`.
**Status:** alteração em desenvolvimento; não implica APK assinado, merge nem publicação.

## Comportamento esperado
- Em **POKÉMON · espécies e formas**, chave deslizante compacta junto ao contador.
- ON: busca os itens selecionados. OFF: consulta qualquer Pokémon e mantém os chips/nomes na lista salva.
- Chave dispara nova pesquisa imediatamente, sem `Limpar todos` nem `✓ Aplicar`. Este último continua responsável somente por alterações nos nomes.
- `OFF · N salvos` no menu principal; popup mostra `N salvos · filtro OFF`.
- Após fechar e reabrir o app, manter ON/OFF e lista separadamente na Pokébola 1 e 2; preservar Raw/IV%/GL/UL, localização, Shiny e demais filtros.
- Via API, `pokemonSelections:[]` é enviado enquanto OFF, com `pokemonSavedSelections` apenas local. No modo site/DOM, `clearExtraKeys` solicita apagar o filtro anterior antes de confirmar a busca.
- Compatibilidade: lista antiga sem `pokemonSavedSelections` deve continuar ativa/salva. Troca de modo não deve apagá-la.

## Checklist para Samsung
1. Escolher 14 itens de espécies e formas, aplicar e confirmar resultados restritos na Pokébola 1.
2. Tocar no switch OFF **sem** limpar/aplicar; confirmar que 14 itens continuam visíveis e que a próxima pesquisa não filtra por aqueles 14.
3. Fechar e reabrir o menu, depois reiniciar o app; conferir `OFF · 14 salvos`.
4. Mudar entre 100%, IV personalizado, GL e UL; validar lista preservada em OFF.
5. Ligar ON sem clicar Aplicar; verificar mesma lista e resultados restritos na consulta seguinte.
6. Desligar OFF, editar um nome e tocar Aplicar; deve salvar a nova lista sem ativá-la. Reativar e verificar nova lista.
7. Usar `Limpar todos` + Aplicar; somente isso deve excluir a seleção.
8. Repetir passos 1–5 na Pokébola 2, garantindo isolamento de estados P1/P2.
9. Executar com fonte API autorizada e com fallback DOM, verificando confirmação real do site e ausência de filtros invisíveis.
10. Executar `node app/tests/lt199-pokemon-filter-pause.test.js`, suíte Node existente e build Android R8 assinado em QA.

**Ressalva:** nenhum teste estático substitui confirmação da busca real em dispositivo.

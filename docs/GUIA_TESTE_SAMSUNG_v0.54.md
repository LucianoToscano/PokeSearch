# PokeSearch v0.54-beta — roteiro de testes físicos Android
1. Antes de instalar, preservar APK anterior e salvar preferências. A assinatura de CI é efêmera e pode impedir atualização sobre o APK anterior.
2. Abrir menu: por padrão **vertical com texto** em instalação nova; alternar somente ícones e horizontal na tela inicial; conferir sem bloquear Pokémon GO.
3. Ativar até 3 pesquisas IV100, GL#1, 0/0/0. Verificar cada lista como janela separada, com título, contagem, recolhimento independente, toque para informações e segurar sprite para coordenadas (se coletadas no site).
4. Arrastar cada lista pelo marcador ⠿ para posições diferentes, reiniciar o serviço e verificar posições X/Y restauradas.
5. Alterar modos rápidos: 100%, 0%, GL (rank 1–200), UL (rank 1–200) e _/_/_ (IV A/D/HP 0–15). Conferir pesquisa real e Shiny ON/OFF com e sem login.
6. Abrir olho: ocultar/mostrar quantidade de spawns, tempo, nível, PC, IV, rank PvP; não inventar rank quando dados ausentes.
7. Testar 1/2/3 janelas, listas com 0 ou muitos resultados, scroll, limites de tela, menu vertical de ambos os lados, popup de filtros e teclado.
8. Verificar pesquisa sequencial sem concorrência (60s entre consultas), nomes, notificações, favoritos, tempos, bateria, e coordenadas do grupo correspondente. Repetir com Android 15 e 16.
9. Registrar problemas pelo relatório interno sem expor cookies, senhas e tokens.
Nenhum destes testes deve ser declarado aprovado apenas por compilação CI.

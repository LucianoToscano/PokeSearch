# PokeSearch v0.56-beta — roteiro de testes físicos
Backup preservado em backup/v0.55-before-layout-fixes-20261016. Alterações na branch feature/v0.56-compact-separated-panels-20261016.
1. Iniciar uma só pesquisa: a engrenagem deve aparecer SOZINHA, e a lista de Pokémon em janela independente, com cabeçalho de modo, arraste ⠿ e recolhimento.
2. Ativar segunda pesquisa na Home: duas janelas e alças realmente independentes, posições gravadas após mover e reiniciar. Não permitir terceira aba.
3. Engrenagem abre menu lateral com largura exata do maior texto exibido; sem texto todos os ícones são quadrados iguais; alterar vertical/horizontal, 27–42dp e conferir alinhamento.
4. Confirmar estado visível do Shiny, Auto, Alertas, Localização e Modos ao mudar valores. Cada submenu deve abrir e fechar sem sobreposição do jogo; campos numéricos abrem teclado sem submenu extra.
5. Favoritos: selecionar/remover 15 Pokémon em sequência, teclado e scroll não devem piscar, deslocar nem perder seleção; testá-los com e sem notificações habilitadas.
6. Conferir na sessão autenticada do PoGoCoordinates os campos IV 0–100%, Raw IV 0–15 cada, GL/UL Top ≤50, Shiny e raio 0–1000 km. Não declarar aplicado sem confirmação do site.
7. Testar a sessão de login, retorno à Home, sessão persistente; não mostrar o site além do fluxo essencial.
8. Conferir ícone de launcher ampliado em tela inicial Android 15 e 16 e máscaras quadrada/circular; visual deve manter a marca original.
9. Conferir que Rank de IV é rotulado como tal. Ranking geral PvPoke indisponível sem fonte confirmada; nunca substituí-lo pelo Top N do filtro.
10. Registrar captura e relatório após testes, preservar APK anterior em caso de rollback.
Compilação CI é verificação técnica, não substitui testes físicos nem prova integração real ao site.

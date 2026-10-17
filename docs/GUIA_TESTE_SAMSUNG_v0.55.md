# PokeSearch 0.55-beta — teste no Android
Backup preservado: backup/v0.54-before-clean-ui-20261016. Trabalho isolado: feature/v0.55-clean-ui-20261016.

1. Abrir o aplicativo e verificar a interface limpa, sem filtros duplicados na tela inicial. Abrir a engrenagem dentro do Pokémon GO.
2. Conferir Modos: IV% mínimo/máximo 0–100; Raw IV A/D/HP de 0–15; Nundo 0/0/0, Hundo 15/15/15; Great/Ultra rank de 1–50. Tocar em cada número deve abrir teclado numérico, sem acionar outro submenu. Verificar filtro efetivamente aplicado no site.
3. Testar Shiny ON/OFF com sessão autenticada e deslogada. Confirmar estado real no site, login e retorno automático à tela inicial.
4. Atualização: Agora, OFF e 3,5,10,15,20 minutos. Testar respeitando limitações do serviço.
5. Alertas: som, silencioso e desligado, com representação visual distinta. Favoritos: buscar por nome ou número, selecionar muitos, rolar escolhidos sem saltos/piscar.
6. Localização: coordenadas, modo Coords e raio 0–1000 km. Filtros: ordem, tamanho, sexo, nível mín/max, clima e forma (site confirma cada alteração).
7. Informações: relógio, PC, nível, IV, rank de IV, sem sobreposição com imagem. Rank geral PvPoke não deve ser apresentado como rank IV do Pokémon.
8. Aparência: menu H/V e texto ligado/desligado; resultados H/V e transparência; tamanhos P/M/G; ordem dos ícones arrastando pela alça na Home.
9. Testar 1–2 abas (nunca 3), posição independente e recolhimento; tocar e segurar sprites e verificar coordenadas corretas.
10. Conferir ícone Launcher sem borda vazia exagerada. Testar Android 15 e 16. Gerar relatório somente com dados sem credenciais.
A compilação CI não substitui testes de autenticação e usabilidade no dispositivo.

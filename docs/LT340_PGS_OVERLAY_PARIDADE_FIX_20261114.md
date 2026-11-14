# LT340 — PGS Buscar Pokémon: paridade Home/overlay, captura de ícones e menu compacto

Data: 14/11/2026. Base técnica oficial auditada: LT339 `0.03.38 / versionCode 54545`, `main` em `1a1f27868c905ecf2dbe8e14f321697f07212a2f`. Estas mudanças pertencem à feature LT340 até CI e publicação; sem alegar homologação Samsung.

## Evidência enviada no Samsung

- Home abrindo um **painel Buscas 1/50** com quatro abas ("Buscas", "Tempo", "Alertas", "Mais"): não corresponde ao gesto de P1/P2, cujo ícone abre a bolha.
- Overlay isolado com arte cinza de Pokébola, barra de lupa/tempo/sino/fechar em 44dp, mas painel PGS de notificações enorme com explicações em vez da mini caixa das Pokébolas, de 138px/30px no `dock.html`.
- Ao escolher Lucario #448, o cadastro prévio não avança para clique/teleporte. As capturas mostraram o **launcher do Android**, não o feed PGSharp; não constituem prova de clique no jogo.

## Causas no código LT339

1. `MainActivity` ligava `pgsSearchControl` diretamente a `PgsBuscasPanel.show(this)`, com `isSearchActive()` baseado no motor de varredura, não na presença da bolha. A bolha podia existir e o ícone Home parecer OFF. Havia duas interfaces de configuração.
2. Após selecionar e gravar um ícone, `startTeaching` retornava a "PARADO": **nenhuma varredura começava** sem novo toque na bolha (comando não evidente).
3. O recorte era rigidamente 68×52px à largura de 740px e o detector procurava só 90/100/110% desse tamanho. Um ícone 24–44px real nunca seria reconhecido se a gravação tivesse uma margem grande de fundo.
4. `onAccessibilityEvent` sobrescrevia `foreground` quando um menu do próprio PokeSearch surgia no topo; assim a validação `isGameVisible` podia bloquear o reconhecimento e o toque.
5. Sem callback de `dispatchGesture`, a execução podia permanecer em "TOQUE" indefinidamente.
6. `PgsAutoMenus.showNotifications()` gerava painel de 340dp por cerca de 510dp, em contraste com `dock.html` P1/P2 mini 138px e ícones 30px; os modos estavam como texto Padrão/Forte/Mudo e não como três glifos visuais.

## Correções feitas na branch LT340

- **Home igual P1/P2:** o botão Busca_Pokemon_Off / Busca_Pokemon_On ativa/desativa somente a bolha via Acessibilidade opt-in e reflete `isOverlayVisible()`; sem modal próprio. `PgsBuscasPanel.java` aposentado e removido. Primeira ativação sem permissão abre a configuração oficial Android (nenhuma ativação silenciosa).
- **Overlay arte original:** Busca_Pokemon_Overlay_On/Off, slot 35×30dp, arte 21dp e área de toque 44dp (paridade com Pokébolas). O centro **branco fica exatamente como na imagem**, com `coreIndicator.GONE`, sem substituição, opacidade ou animação. Verde (850ms) só quando `awaitingMap`; vermelho pulsante em erro. Timeout automático isolado não é considerado erro.
- **Fluxo de captura:** da lupa abre captura ao feed PGSharp, com tamanho do recorte à escolha do usuário (24/32/44px na largura de referência de 740px). PNG cadastrado mantém `referenceWidth/referenceHeight` no modelo, por espécie, preservando leitura dos antigos 68×52; o detector procura múltiplas escalas proporcionais. Depois de salvar e confirmar o modelo no feed, a automação inicia sem segundo toque. Captura exige screenshot Android e seleção explícita da imagem pelo usuário.
- **Sem travar clique:** eventos de acessibilidade de janelas próprias ignorados na variável de pacote em primeiro plano; `TYPE_WINDOWS_CHANGED` passa a ser observado. Watchdog detecta falta de resposta do Android ao gesto de acessibilidade e exibe aviso, em vez de deixar status preso.
- **Lupa e prioridade:** para cada espécie, miniatura real de até 2 modelos junto ao nome; toque em miniatura abre exclusão manual/novo cadastro, câmera `◎`/ `+` disponível em todas as espécies selecionadas, `…` mostra demais imagens da espécie; setas ↑/↓ mudam a prioridade. **Sem aleatoriedade:** lista de espécies em prioridade explícita, seguida de ícone mais acima e à esquerda conforme `PgsAutoIconDetector`. Modelos permanecem ao desmarcar, só são excluídos com comando explícito.
- **Menu e notificações:** linha 44dp com ícones vetoriais lupa, cronômetro e sino sem estrela, e fechar; submenu Tempo só "Mapa (s)" e "Após mapa (s)" com valores 60/2, sem parágrafos. Notificações PGS em painel compacto de **138dp** com três seções (Novos Pokémon, Pokémon de Buscas, Shiny), três vetores **brancos** 30×30 representando Som/Sem som/OFF com `pathData` baseado nos SVG do `dock.html`, tom Padrão/Personalizado em 98×23 e teste por toque longo na escolha de áudio. Áudio e canais continuam independentes de P1/P2. Preferência antiga "Forte" continua interpretada para compatibilidade.
- **Risco preservado:** a confirmação Shiny continua exigindo aviso positivo mencionando a espécie do destino, não identifica um Pokémon 3D diretamente. O mapa é analisado por sinais heurísticos de objetos, não garantia de população completa. Android pode negar capturas/gestos. Nenhum serviço de automação inicia sem habilitação da Acessibilidade.

## Gates obrigatórios

- Node todos contratos (inclusive novos contratos LT340, legados atualizados), Java puro e JUnit, compilação Android e QA APK debug.
- Build release via CI, R8, recursos intactos, sem remoção de imagens/sons. Assinatura permanente conferida pelo workflow `pokesearch-official-release.yml`, versão monotônica e SHA-256.
- **Homologação Samsung ainda requerida**, issue [#350](https://github.com/LucianoToscano/PokeSearch/issues/350): registrar o feed real PGSharp com Lucario visível, escolher um dos tamanhos, verificar reconhecimento duplo, toque, teleporte, tempo e aviso Shiny por nome. Prints do launcher não verificam o detector no jogo.
